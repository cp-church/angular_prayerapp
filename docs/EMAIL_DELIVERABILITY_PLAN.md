# Email Deliverability Plan — cp-church.org (Graph / Supabase / Vercel)

Saved conversation: recommendations, diagnostics, and implementation options for reducing mail delivered to Junk/Spam (Gmail/Yahoo/etc.). Pick this up later and use as a checklist and implementation plan.

---

## Quick summary of findings
- Authentication (SPF/DKIM/DMARC) is correctly configured for cp-church.org (headers showed pass).
- Deliverability issues are likely due to:
  - bulk/BCC sending patterns,
  - mailbox/tenant reputation / user engagement,
  - missing List‑Unsubscribe header and visible unsubscribe link,
  - rate/volume patterns (no warm-up),
  - content signals (subject/body/link patterns).
- Per-recipient sends + List-Unsubscribe + rate limiting produce the best deliverability improvements.

---

## Immediate user actions (Yahoo recipients)
Ask Yahoo users to:
1. Mark the message "Not Spam" / move to Inbox.
2. Add the sender (crosspointeprayer@cp-church.org) to Contacts.
3. Create a Mail filter: From contains cp-church.org → move to Inbox.
4. View and forward full raw headers via web UI (View raw message) for deeper diagnostics.

---

## High-impact sender changes (priority order)
1. Add `List-Unsubscribe` (and `List-Unsubscribe-Post`) header and a visible unsubscribe link in body.
2. Stop sending one big BCC to many recipients — send per-recipient (or small batches).
3. Always include a textBody fallback for every HTML email.
4. Persist sends in an email queue (Postgres) and process via a scheduled worker with rate limiting and retries.
5. Respect unsubscribes immediately; maintain a suppression table.
6. Monitor via Mail-Tester / Gmail Postmaster (if volume justifies) / Microsoft message trace / Yahoo Postmaster if many Yahoo complaints.

---

## Best architecture for Supabase Free + Vercel Free (recommended)
- Enqueue one DB row per recipient into an `email_queue` table.
- Run a scheduled, rate-limited processor that:
  - Pulls a small batch,
  - Sends per-recipient via Microsoft Graph (sendMail or createMessage->send),
  - Uses token caching, concurrency limits, exponential backoff, and honors `Retry-After`.
- Host the processor either:
  - Option A: GitHub Actions cron (recommended) — reliable, easy secrets management.
  - Option B: Vercel serverless endpoint invoked by an external scheduler — keeps code in repo; keep batch small to avoid timeouts.

---

## Minimal DB schema (example)
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  subject text NOT NULL,
  html_body text,
  text_body text,
  reply_to text,
  from_name text,
  attempts int DEFAULT 0,
  last_error text,
  status text DEFAULT 'pending', -- pending | sending | success | failed
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid REFERENCES email_queue(id),
  recipient text,
  status text,
  response_body text,
  created_at timestamptz DEFAULT now()
);
```

---

## Send strategy (per-recipient, headers, retries)
- Use one `sendMail` call per recipient (or createMessage->send if you need message-id tracking).
- Add `internetMessageHeaders`:
  - `List-Unsubscribe: <mailto:unsubscribe@cp-church.org?subject=unsubscribe>`
  - `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
- Always include `textBody` (fallback) for all templates.
- Implement `fetchWithRetry`:
  - Retry on 429 / 5xx
  - Respect `Retry-After` header
  - Exponential backoff, max attempts 3–5
- Rate-limiting / concurrency starting guidance:
  - Batch size: 20 (GitHub Actions) or 10 (Vercel endpoint)
  - Concurrency: 2–4
  - Inter-send delay: 200–500 ms (start conservative)

---

## Example send loop (conceptual)
```ts
// Acquire token once for batch
for each recipient in batch:
  build message with internetMessageHeaders
  POST /users/{MAIL_SENDER_ADDRESS}/sendMail
  if response ok -> mark success
  if 429 or 5xx -> respect Retry-After, exponential backoff, retry
  log result to email_send_log
  small delay between sends
```

---

## Operational checklist
- Add List-Unsubscribe header + visible unsubscribe link in templates.
- Enforce textBody for templates.
- Enqueue per-recipient rows and process with rate-limited worker.
- Implement suppression table and honor unsubscribes/complaints quickly.
- Monitor logs: capture Graph response body for non-OK responses.
- Test templates with mail-tester.com and a seed list (Gmail/Yahoo/Outlook).
- Run Microsoft Exchange Message Trace for problem messages (use Message-ID from headers).
- Consider ESP (SendGrid/SES/Postmark) if volumes scale beyond moderate (thousands/day) or you want advanced deliverability tooling.

---

## Deployment options
Option A — GitHub Actions (recommended)
- Pros: Reliable scheduling, no long-running host, easy to store secrets.
- Example: cron every 1–5 minutes, run a Node/TS processor that processes a batch.

Option B — Vercel endpoint + external scheduler
- Pros: Code stays with frontend, simpler local testing.
- Cons: Free tier cold starts and execution time limits — keep batch sizes tiny.

---

## Next steps I can do for you
If you want, I can prepare these artifacts (pick one option):
- Full PR / code files including:
  - DB migration SQL,
  - Modified `supabase/functions/send-email/index.ts` to send single recipient + List-Unsubscribe header + text fallback,
  - A Node/TS email-queue processor script,
  - A GitHub Actions workflow to run the processor on a cron.
- Or produce the Vercel endpoint + scheduler docs instead.
- Or only produce the `send-email` patch if you want to handle scheduling yourself.

Tell me which option you want and any preferences for:
- Batch size
- Concurrency
- Whether you want message-id tracking (createMessage->send) or simpler sendMail

I’ll produce the code/files and a step‑by‑step deployment guide for the chosen approach.

---

## Notes / reminders
- Per-recipient sending increases API calls; apply rate limiting & backoff to avoid Graph throttling.
- If you send very large volumes, an ESP is typically more suitable.
- Keep unsubscribe experience simple for users and honor requests immediately — this significantly reduces complaints and improves reputation.

--- 
Saved on: 2026-01-09
Project: Kelemek/angular_prayerapp
Contact: Kelemek (project owner)
