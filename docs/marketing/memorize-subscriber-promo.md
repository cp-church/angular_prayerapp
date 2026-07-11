# Memorize Scripture — subscriber promo

Paste-ready copy for **Admin → Settings → Email → Send email to all subscribers**.

**Deploy first:** image URLs only work after `public/marketing/memorize/` is live on production:

`https://cpprayer.cp-church.org/marketing/memorize/`

**Local layout preview:** open [`memorize-subscriber-promo-preview.html`](memorize-subscriber-promo-preview.html) (served from the repo root) to see the email with the green broadcast chrome and screenshots before deploy.

The TipTap broadcast editor stores Markdown. Images use `![alt](https://…)` and are rendered by `markdownToSafeHtml` (HTTPS / root-relative `img` allowed). Prefer pasting the **Markdown body** block below into the rich-text field (or paste as plain text if the editor mangles image syntax).

---

## Subject line options

1. **New in the Prayer App: Memorize Scripture**
2. Memorize Bible verses with guided practice — now in the Prayer App
3. Hide God’s Word in your heart — try Memorize today

Recommended: **New in the Prayer App: Memorize Scripture**

---

## Markdown body (paste into Admin broadcast)

```markdown
Friends,

We’re excited to share a new feature in the Cross Pointe Prayer App: **Memorize Scripture**.

Memorize is your **private** place to learn Bible passages (ESV), practice with guided games, listen to the text read aloud, and track progress from Learning → Practicing → Mastered. It sits right on Home next to Current, Answered, Prompts, and Personal.

### How to find Memorize

1. Open the Prayer App: [https://cpprayer.cp-church.org](https://cpprayer.cp-church.org)
2. On Home, tap the **Memorize** filter tile (it shows how many passages you’ve saved).
3. On phones, Memorize is on the **second row** of filters.

![Home with the Memorize filter selected](https://cpprayer.cp-church.org/marketing/memorize/01-find-memorize.png)

### Add passages three ways

From the Memorize action bar you can:

- **+ Add Verses** — pick any ESV passage (book → chapter → verse range)
- **+ Bible Books** — add a whole-book list (All 66, OT, or NT) and practice book-by-book
- **+ Recommended** — curated topic categories with ready-to-add verses

![Memorize action bar: Add Verses, Bible Books, Recommended](https://cpprayer.cp-church.org/marketing/memorize/02-action-bar.png)

**Add Verses** opens the Bible picker. Choose Old or New Testament, a book, then a chapter and verse range. Passages load from the English Standard Version (ESV).

![Add Verses Bible picker for John](https://cpprayer.cp-church.org/marketing/memorize/03-add-verses.png)

### Recommended verses by topic

**+ Recommended** opens counseling-friendly topic categories (Anger, Fear, Marriage, Worry, and many more). Expand a category, then tap a verse to add it. Verses already on your list show as **Already added**.

On desktop, **hover** a verse card to preview the text; on mobile, **long-press**. Tap still adds the verse (or opens practice on your list).

![Recommended verses modal with topic categories](https://cpprayer.cp-church.org/marketing/memorize/04-recommended.png)

### Your list and mastery groups

Your saved passages appear in three groups based on completed practice sessions:

- **Learning** — getting started
- **Practicing** — building fluency
- **Mastered** — well practiced

Each card shows the reference, last practiced date, and session count. Tap a card to practice; use the trash icon to remove (you can always add it again later).

![Memorize list with Learning and Practicing groups](https://cpprayer.cp-church.org/marketing/memorize/05-mastery-list.png)

### Practice modes and Listen

Tap a passage to open practice. You’ll see the full text, optional **Listen** (ESV audio with speed controls), and a five-round difficulty path (Round 1 is easiest).

Tap **Start practice** and choose a mode:

- **Type mode** — type the first letter of each blank
- **Initials mode** — same typing with a cue row
- **Word mode** — tap the correct word choices
- **Reorder mode** — drag chunks into the right order

Progress saves automatically as you complete sessions.

![Practice modes for James 1:2–4 — Type, Initials, Word, and Reorder](https://cpprayer.cp-church.org/marketing/memorize/07-practice-modes-grid.png)

### Need a guided walkthrough?

In the app, tap **?** (Help) → **Memorize Scripture** → **Start guided tour**. The tour highlights the Memorize filter, action bar, Recommended, and practice tips.

### Open the app

[https://cpprayer.cp-church.org](https://cpprayer.cp-church.org)

We’re grateful to walk with you as you hide God’s Word in your heart.

— Cross Pointe Prayer Ministry

*Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.*
```

---

## Companion HTML (preview / external senders)

The Admin broadcast pipeline expects **Markdown**, not this HTML. Use this only for Outlook/preview or if you paste into a tool that accepts HTML. Image hosts are production URLs.

```html
<div style="margin:0;color:#1f2937;font-size:16px;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <p>Friends,</p>
  <p>We’re excited to share a new feature in the Cross Pointe Prayer App: <strong>Memorize Scripture</strong>.</p>
  <p>Memorize is your <strong>private</strong> place to learn Bible passages (ESV), practice with guided games, listen to the text read aloud, and track progress from Learning → Practicing → Mastered. It sits right on Home next to Current, Answered, Prompts, and Personal.</p>

  <h3 style="color:#1f2937;font-size:18px;margin:24px 0 8px;">How to find Memorize</h3>
  <ol style="padding-left:1.25rem;margin:0 0 12px;">
    <li>Open the Prayer App: <a href="https://cpprayer.cp-church.org">https://cpprayer.cp-church.org</a></li>
    <li>On Home, tap the <strong>Memorize</strong> filter tile (it shows how many passages you’ve saved).</li>
    <li>On phones, Memorize is on the <strong>second row</strong> of filters.</li>
  </ol>
  <img src="https://cpprayer.cp-church.org/marketing/memorize/01-find-memorize.png" alt="Home with the Memorize filter selected" width="560" style="display:block;max-width:100%;height:auto;border:0;border-radius:8px;margin:12px 0;" />

  <h3 style="color:#1f2937;font-size:18px;margin:24px 0 8px;">Add passages three ways</h3>
  <p>From the Memorize action bar you can:</p>
  <ul style="padding-left:1.25rem;margin:0 0 12px;">
    <li><strong>+ Add Verses</strong> — pick any ESV passage (book → chapter → verse range)</li>
    <li><strong>+ Bible Books</strong> — add a whole-book list (All 66, OT, or NT) and practice book-by-book</li>
    <li><strong>+ Recommended</strong> — curated topic categories with ready-to-add verses</li>
  </ul>
  <img src="https://cpprayer.cp-church.org/marketing/memorize/02-action-bar.png" alt="Memorize action bar" width="560" style="display:block;max-width:100%;height:auto;border:0;border-radius:8px;margin:12px 0;" />
  <p><strong>Add Verses</strong> opens the Bible picker. Choose Old or New Testament, a book, then a chapter and verse range. Passages load from the English Standard Version (ESV).</p>
  <img src="https://cpprayer.cp-church.org/marketing/memorize/03-add-verses.png" alt="Add Verses Bible picker for John" width="560" style="display:block;max-width:100%;height:auto;border:0;border-radius:8px;margin:12px 0;" />

  <h3 style="color:#1f2937;font-size:18px;margin:24px 0 8px;">Recommended verses by topic</h3>
  <p><strong>+ Recommended</strong> opens counseling-friendly topic categories (Anger, Fear, Marriage, Worry, and many more). Expand a category, then tap a verse to add it. Verses already on your list show as <strong>Already added</strong>.</p>
  <p>On desktop, <strong>hover</strong> a verse card to preview the text; on mobile, <strong>long-press</strong>. Tap still adds the verse (or opens practice on your list).</p>
  <img src="https://cpprayer.cp-church.org/marketing/memorize/04-recommended.png" alt="Recommended verses modal with topic categories" width="560" style="display:block;max-width:100%;height:auto;border:0;border-radius:8px;margin:12px 0;" />

  <h3 style="color:#1f2937;font-size:18px;margin:24px 0 8px;">Your list and mastery groups</h3>
  <ul style="padding-left:1.25rem;margin:0 0 12px;">
    <li><strong>Learning</strong> — getting started</li>
    <li><strong>Practicing</strong> — building fluency</li>
    <li><strong>Mastered</strong> — well practiced</li>
  </ul>
  <p>Each card shows the reference, last practiced date, and session count. Tap a card to practice; use the trash icon to remove (you can always add it again later).</p>
  <img src="https://cpprayer.cp-church.org/marketing/memorize/05-mastery-list.png" alt="Memorize list with Learning and Practicing groups" width="560" style="display:block;max-width:100%;height:auto;border:0;border-radius:8px;margin:12px 0;" />

  <h3 style="color:#1f2937;font-size:18px;margin:24px 0 8px;">Practice modes and Listen</h3>
  <p>Tap a passage to open practice. You’ll see the full text, optional <strong>Listen</strong> (ESV audio with speed controls), and a five-round difficulty path (Round 1 is easiest).</p>
  <p>Tap <strong>Start practice</strong> and choose a mode:</p>
  <ul style="padding-left:1.25rem;margin:0 0 12px;">
    <li><strong>Type mode</strong> — type the first letter of each blank</li>
    <li><strong>Initials mode</strong> — same typing with a cue row</li>
    <li><strong>Word mode</strong> — tap the correct word choices</li>
    <li><strong>Reorder mode</strong> — drag chunks into the right order</li>
  </ul>
  <img src="https://cpprayer.cp-church.org/marketing/memorize/07-practice-modes-grid.png" alt="Practice modes for James 1:2–4 — Type, Initials, Word, and Reorder" width="560" style="display:block;max-width:100%;height:auto;border:0;border-radius:8px;margin:12px 0;" />

  <h3 style="color:#1f2937;font-size:18px;margin:24px 0 8px;">Need a guided walkthrough?</h3>
  <p>In the app, tap <strong>?</strong> (Help) → <strong>Memorize Scripture</strong> → <strong>Start guided tour</strong>.</p>

  <p style="margin:24px 0 8px;"><a href="https://cpprayer.cp-church.org" style="display:inline-block;background:#39704D;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Open the Prayer App</a></p>
  <p>We’re grateful to walk with you as you hide God’s Word in your heart.</p>
  <p>— Cross Pointe Prayer Ministry</p>
  <p style="font-size:12px;color:#6b7280;line-height:1.4;"><em>Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.</em></p>
</div>
```

---

## Send checklist

1. Deploy so the PNGs under `/marketing/memorize/` are reachable on `https://cpprayer.cp-church.org`.
2. Open **Admin → Settings → Email → Send email to all subscribers**.
3. Paste a subject line and the Markdown body (inside the fenced block above).
4. Preview carefully — screenshots should load from production.
5. Send when ready.

### Screenshot inventory

| File | Shows |
|------|--------|
| `01-find-memorize.png` | Memorize filter selected + list |
| `02-action-bar.png` | Same view (action bar + list) |
| `03-add-verses.png` | Bible picker (John chapters) |
| `04-recommended.png` | Recommended categories with verses |
| `05-mastery-list.png` | Learning / Practicing groups |
| `06-practice.png` | Choose practice mode dialog (optional / unused in email body) |
| `07-practice-modes-grid.png` | Four corners: Type, Initials, Word, Reorder mid-practice (James 1:2–4) |
