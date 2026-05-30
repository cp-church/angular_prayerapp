---
name: pre-handoff
description: >-
  Run before marking any coding task complete, opening a PR, or handing off to a
  review agent. Runs lint and verify, then requires ReadLints and logic review
  (session/cache/RxJS/regression tests). Use when finishing implementation, fixing
  bugs, or the user asks to verify or reduce review churn.
---

# Pre-handoff (before “done”)

Do **not** tell the user the task is complete until this workflow finishes.

## 1. Automated gate (required — use Shell tool)

You **must** run this command in the terminal before claiming the task is done:

```bash
npm run pre-handoff
```

Fix failures and re-run until exit code 0. Do not skip because the change “looks small.”

On success, the script writes `.pre-handoff-stamp` so the project **stop hook** allows the agent to finish when `src/app`, `src/lib`, or `supabase/migrations` changed. If you skip this, Cursor will inject a follow-up asking you to run pre-handoff.

## 2. IDE diagnostics

Call **ReadLints** on every path you created or edited. Fix all **errors**; fix **warnings** you introduced.

## 3. Logic review (required after green pre-handoff)

`npm run verify` does **not** catch logic bugs. For each row that applies to your diff, confirm **yes** or add a test/fix:

| Area | Confirm |
|------|---------|
| RxJS + session | `distinctUntilChanged` runs on the stream **including** `null` (logout) before filtering logged-in sessions. |
| Cache | Every cache write has invalidate on logout, admin changes, and account switch—not only in-memory lookups. |
| Async races | Late HTTP results ignored when `loadedEmail` / session identity changed mid-flight. |
| Empty vs missing | UI clears stale derived state when roster is empty but list id exists (or API failed). |
| Angular DI | No new `providedIn: 'root'` constructor cycle; use lazy `Injector.get` on logout edges if needed. |
| OnPush | Async/subscribe paths call `markForCheck()` or update signals. |
| Bug fixes | **Regression test** that would fail without the fix (re-login same email, stale array, etc.). |

If any row is “unsure,” add a regression test in the same round.

## 4. Docs (when required)

Non-trivial behavior → `docs/CHANGELOG.md` and `docs/DEVELOPMENT.md` per `.cursor/rules/docs-and-changelog.mdc`.

## 5. Handoff message

When reporting done to the user, include:

- `pre-handoff`: passed (or what failed and was fixed)
- Logic review: which rows applied and how they were verified (test name or brief note)
- Any residual risk you did not automate

## Optional

- Run the user’s **review agent** on the branch diff after pre-handoff passes.
- For focused work: `npm test -- --run path/to/file.spec.ts` while iterating, then full `npm run pre-handoff` once at the end.
