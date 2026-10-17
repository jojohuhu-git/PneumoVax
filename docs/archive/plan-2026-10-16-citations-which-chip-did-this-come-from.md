# Plan — "Which grey source button did this little [1] come from?" (2026-10-16)

**Both apps: PneumoVax and MeningoVax.** Planning only — nothing in the apps was changed.
Every number below comes from actually running the app, not from reading its code.

**This file is the only copy.** MeningoVax carries a pointer naming its own two faults (C4,
C5): `MeningoVax-main/docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from--SEE-PNEUMOVAX.md`.
Edit this file; never re-create a second full copy (owner decision 2026-10-16).

> ### ⚠ Every count in this document was measured BEFORE the transplant hard stop
> Measured 2026-10-16 against PneumoVax `main` at 836502a, when a patient who ticked the
> transplant box still got a recommendation card. `plan-2026-10-16-transplant-hard-stop-both-apps.md`
> retires that card, and it lands **first** (see §11). So before any of these numbers go in
> a pull request, **re-measure them**:
>
> | Number here | What the hard stop does to it |
> |---|---|
> | **684** Fred Hutch grey buttons (struck §5a) | → **0.** The card is gone. |
> | **25** quoted sources in PneumoVax (C7) | → **22.** Three `refs.js` entries are deleted. |
> | **17,536** total cards, and the 16,844 / 2,462 / 1,305 / 1,080 / 644 / 29,192 counts drawn from it | all shrink — the transplant profiles stop producing cards |
> | **0 of 17,536** child-source-on-adult-card (§7) | re-run; it is a clean result worth re-confirming, not re-assuming |
>
> The counts in §3, §4 and §7 are *shapes of problem*, and those do not change — only the
> sizes do. Do not treat a changed number as a new finding.

> **What the owner reported:** *"I always see a '1' where you can [hover] over to see the
> language cited verbatim, but there are multiple source chips under it and I do not know
> where it came from. I also forget why there are multiple source chips listed if its only
> citing one of them."*

---

## 1. The short version

A recommendation card has **two different ways of showing sources, and they don't know
about each other.**

- The **small raised number** in the sentence (the `[1]`) belongs to *that sentence*. Hover
  it and you get the exact CDC wording. Click it and you land on that wording.
- The **grey buttons** along the bottom belong to *the whole card*. Hover one and you get
  the document's title. Click it and you get the document.

The grey buttons have no numbers on them. So there is no way to match a `[1]` to a button.
The information simply isn't on the screen — nothing was being missed.

## 2. Why it always says "1"

The raised number names the **document**, not the sentence. So if a card quotes three
different sentences and all three happen to come from the same CDC page, all three show as
`[1]`.

That is almost always what happens, because the CDC adult and child schedule pages contain
nearly every sentence the app quotes.

Out of **17,536** recommendation cards the app can produce:

| | Cards |
|---|---|
| show only one number, no matter how many raised numbers there are | **16,844 — 96 out of every 100** |
| have two or three raised numbers that **all** read `[1]` | **2,462** |

I opened the app and reproduced the owner's card — a 70-year-old, no risk factors, no doses
on record. Three `[1]`s, three genuinely different quotes behind them:

| What you see | What hovering it shows |
|---|---|
| `[1]` | "Not previously received a dose of PCV13, PCV15, PCV20, or PCV21…" |
| `[1]` | "Previously received only PCV7: follow the recommendation above." |
| `[1]` | "Adults aged 19 years and older who have received PCV20 or PCV21: no additional…" |

## 3. The grey buttons and the raised numbers disagree in both directions

| | Count |
|---|---|
| grey buttons that no raised number on that card points to | **29,192 of 46,340 — about 6 in 10** |
| cards where a raised number points to a document that has **no grey button at all** | **1,080** |
| cards where the numbering runs in a different order than the buttons | **644** |

That last row matters, because the natural guess is "`[1]` must be the first button." It
often isn't. A 30-year-old without a spleen: `[1]` is the 2025 MMWR, which is the **third**
button. `[2]` is the CDC adult notes, which is the **first**.

## 4. The important finding — the extra grey buttons are not optional reading

The owner asked: *"If there is information of value in the other chips should they be cited
too?"* **Yes — and this turned out to be the real problem.**

The extra buttons aren't background reading. They are holding up statements the card is
already making out loud, and the quote attached to those statements doesn't support them.

Take that same 70-year-old. The card says:

> "Give 1 dose of PCV20 or PCV21 — **OR 1 dose of PCV15 followed by PPSV23 ≥1 year later**."
> "Routine pneumococcal vaccination for **adults ≥50**…"

Hover the `[1]` on that first sentence and what you get is:

> "Not previously received a dose of PCV13, PCV15, PCV20, or PCV21 or whose previous
> vaccination history is unknown: 1 dose PCV15 or 1 dose PCV20 or 1 dose PCV21."

That wording **never mentions PPSV23, never says "1 year", and never says "50."** Those two
facts come from the two grey buttons nothing was pointing at — the **≥50 starting age is
the entire subject of the 2025 MMWR**, and the **gap between PCV15 and PPSV23 is what the
CDC adult timing job aid prints**. `CLAUDE.md` already names both of those as the governing
sources for those exact two facts.

So the card was quietly leaning on sources it never credited.

I checked every card for this — does a number the card states out loud appear anywhere in
the wording that card quotes?

| The card states | Cards where the quoted wording doesn't contain it |
|---|---|
| an "8 weeks" gap | 725 |
| the age-50 starting point | 625 |
| a "≥1 year" gap | 108 |
| **cards affected overall** | **1,305 — about 1 in 13** |

Children's cards do the same thing. A catch-up card says *"the next dose is due 8 weeks
after the most recent"* and the quote behind it reads only *"Routine vaccination with PCV
4-dose series at 2, 4, 6, 12–15 months."* The 8-week catch-up gap is in the **CDC PCV
catch-up job aid** — a grey button, nothing pointing at it.

> **One honest limit on that 1,305.** My check asks whether the *sentence shown on hover*
> contains the figure the card states. The fact might still be elsewhere on the same CDC
> page, just not in the sentence you land on. So read this as *"the quote shown doesn't
> back up the number shown"* — **not** *"the app is citing a source that contradicts it."*
> Either way you can't check the claim from what's in front of you, which is the problem
> that was reported.

**This changes the shape of the fix.** Fixing the missing quotes largely fixes the "always
1" problem by itself, because the `[1]` repeated *precisely because* all three markers were
aimed at the one page that was easiest to quote. Give those statements their own proper
quotes and the 70-year-old's card becomes `[1] [2] [3]` over three numbered buttons.

## 5. Decisions made 2026-10-16

1. **One number per document stays as it is.** `[1]` means "CDC Adult Notes" everywhere on
   that card. (This was already decided on 2026-07-24 — not reopened.) Once hovering tells
   you the document name and the button carries the matching number, a repeated `[1]` stops
   being confusing: it's correctly telling you those statements rest on the same page.
2. **A grey button with no number pointing at it counts as a fault.** It means either a
   statement is missing its quote, or the button doesn't belong on that card. Both are
   problems. An automatic check will refuse to let the app be released if one appears.
3. **Fix both apps.**
4. **Avoiding a quote taken from the wrong kind of patient governs the clinical half** —
   see §7.
5. **Superseded the same day — the transplant card is being retired, not re-cited.** This
   decision originally read *"adult stem-cell-transplant cards cite ASCO 2024, not Fred
   Hutch,"* settling **N7**. Hours later the owner approved
   `plan-2026-10-16-transplant-hard-stop-both-apps.md`, which **deletes** the transplant
   recommendation card, its risk-factor row and all three of its source entries. N7 is
   closed by that plan instead. See the struck §5a.

## 5a. ~~The transplant source~~ — STRUCK 2026-10-16, superseded before any code was written

> **Do not implement this section.** It is kept only so a future session can see that the
> question was asked and answered elsewhere, rather than re-deriving it.

This section planned to swap the transplant risk factor's second source from Fred Hutch to
ASCO 2024, write it a quote, correct `CLAUDE.md`, and fix a false comment in `refs.js`.

**All of it is erased by `plan-2026-10-16-transplant-hard-stop-both-apps.md`**, approved by
the owner later the same day. That plan deletes the `hsct` row from `riskFactors.js` and
deletes `p3086Table5`, `fredHutchLTFU` **and** `ascoAdultCancer2024` from `refs.js`. The
684 cards counted here do not get a corrected grey button — they stop existing, because a
patient who ticks the transplant box now gets a hard stop and no card at all.

Doing the swap first would have written a quote for a source due for deletion, and put a
**third** version of the HSCT rule into `CLAUDE.md` inside two weeks (Fred Hutch → ASCO →
hard stop) — the exact document-drift the hard-stop plan exists to end.

**The one thing here that still needs doing, and the hard-stop plan already covers it:** the
comment in `refs.js` beside the ASCO entry claims Fred Hutch is *"retained below only as a
superseded/historical entry… no active rec cites it."* That was false when written — the
transplant risk factor did cite it. All three entries are deleted by the other plan, so the
comment goes with them. Nothing to do here.

## 6. First half — the mechanical work (no clinical judgement needed)

**C1. Hovering a raised number also tells you the document.**
Instead of just the quote, you'd see:
`CDC Adult Notes — "Previously received only PCV7: follow the recommendation above."`
This is the smallest change here, it answers the owner's question on its own, and it moves
nothing on the screen. Worth doing first.

**C2. Put the matching number on the grey buttons.**
A button reads `[1] CDC Adult Notes`. Both numbers are worked out in one place, so they
can't drift apart — right now they're worked out in two places that never compare notes,
which is why §3 happens. The row gets the heading **"Sources."**

> ⚠ A trap for whoever builds this: match the button to the quote by *which document it
> is*, not by comparing the web addresses as text. In MeningoVax, six of the forty sources
> have a "jump to this sentence" tag buried inside the stored web address, so the button's
> address and the quote's address look different even though they're the same document.
> Comparing the text would silently report "no match". (See C4.)

**C3. The 1,080 cards quoting a document that has no button.** It's always the same CDC
risk-based page. Add the button. Decision 5.2 then stops the opposite from happening.

**C4. MeningoVax — six buttons that jump to a single sentence while claiming to be the
whole document.** Six sources have that "jump to this sentence" tag stored inside the
document address. The note written beside that code says buttons are *"always the whole-page
URL"* — which is **untrue for those six.** Separate the two, the way PneumoVax already
does, and correct the note.

**C5. MeningoVax — five buttons that all print the same words.** Five sources are different
tables inside the same 2020 ACIP report and all five buttons read *"ACIP 2020 MMWR."* On
**37 of 264 cards I sampled**, two identical-looking buttons sit side by side pointing at
different tables. Each should name its table. Mostly solved by C2's numbering, but the
wording shouldn't be misleading either way.

## 7. Second half — the clinical work (one statement at a time, source read live each time)

The owner's concern, in her words: *"I don't want the app to pull a statement that sounds
correct but in the source is intended for a different patient population."*

**Where the app stands today — I checked the two places this could already have gone wrong.
Both are clean. Neither is protected.**

| What I checked | Result |
|---|---|
| a children's-schedule sentence shown on an adult card, or the reverse | **0 of 17,536 cards** |
| the 2025 MMWR's "≥8 weeks" sentence — written for a **19–49-year-old who is immunocompromised** — shown to a patient 50 or over, where that same report says ≥1 year instead | **0.** It appears on 45 cards, every one of them aged 19–49 |

Both of those are right because earlier sessions were careful by hand. **Nothing in the app
is keeping them right.** The check that stops a children's source appearing on an adult
card only looks at the grey buttons; it never looks at the quotes. And that check couldn't
catch the second row anyway — a 45-year-old on rituximab and a 60-year-old with diabetes
are both "adults", so it would wave the wrong quote straight through.

**C6. Write down, beside each quoted sentence, which patients it was written about** — age
range and risk category. The app then checks the patient on screen against that before it
shows the quote. This is what actually prevents the thing the owner is worried about. A
careful habit won't; this will.

**C7. The reading that produces C6.** For each of the **25 quoted sources** in PneumoVax
(23 in MeningoVax): open the live page, and read **the row and the heading the sentence
sits under** — not just the sentence. Don't re-quote from memory or from the app's own
stored copy. That reading is exactly what catches a sentence written about someone else,
and because it produces C6's note, the work survives the session instead of evaporating.

**C8. Give the unsupported statements proper quotes, grouped by statement.** The 1,305
cards boil down to a handful of distinct statements — the ≥50 starting age, the adult
1-year gap, the children's 8-week catch-up gap, and a few more. Reading one source once
fixes every card that states it. Each new quote gets C6's patient note as it goes in, so
it's checked on the way in rather than audited afterwards.

**Do C7 before C8.** Reading afterwards means reading a bigger pile.

## 8. The automatic checks to add

Each of these refuses to let the app be released if the problem reappears. Per the owner's
standing rule, each one has to be proven by deliberately breaking the app and confirming
the check actually catches it — a check that catches nothing looks exactly like a check
that works.

| Check | Refuses to release when |
|---|---|
| G1 | a card has a grey button no raised number points at (decision 5.2) |
| G2 | a card has a raised number whose document has no grey button |
| G3 | the numbers on the buttons and the numbers in the text are worked out separately |
| G4 | a quote is shown to a patient it wasn't written about (C6) |
| G5 | a quoted source has no note saying which patients it covers |
| G6 | *(MeningoVax)* a button's address still has a "jump to sentence" tag in it (C4) |

G1–G3 will fail immediately the first time they run, because §3 says 29,192 buttons and
1,080 cards are already in that state. That's intended — they're the thing that proves this
plan was carried out.

## 9. What has to be verified before any piece is called done

- **Compare the actual words on every card, before and after.** The existing safety sweeps
  record *how many* reasons a card gives, never the wording or the sources — so neither the
  numbering nor the buttons show up in them at all.

  **Correction: the tool this asked for already exists — do not build a fourth one.**
  `scripts/proseDiff.mjs` (7.9K, with `scripts/__tests__/prose-diff-smoke.test.js`) was made
  permanent in commit 57b3411, after the two throwaway versions this plan was counting. Run
  it as `node scripts/proseDiff.mjs dump <file>` before and after, then
  `node scripts/proseDiff.mjs diff <before> <after>`; it is not a `package.json` script.

  **It already covers the half of this plan that rewrites words.** Its own header says it
  records *"every citation LABEL … from `citations` and `noteCites`"* — which is both of the
  two systems §1 says don't know about each other. So C2's renaming a button to `[1] CDC
  Adult Notes`, and C8's new quotes, both show up in its diff.

  **It cannot prove the half of this plan that is about matching.** It records labels, not
  the raised numbers, the hover text, or which button a `[1]` points at. A card could keep
  every word and still have its numbering wrong, and this tool would report no change.
  **That is what checks G1–G3 are for** — don't let a clean prose diff stand in as proof the
  mapping is right.
- **Open the running app** and screenshot the 70-year-old's card before and after. A change
  to how sources display that was never actually looked at is not finished.
- Whatever lands in one app lands in the other.

## 10. What this plan does NOT do

- **It changes no clinical advice.** No recommendation should move. If one does, stop — a
  moved recommendation needs its own explanation, and the safety sweeps will catch it.
- It does not reopen the one-number-per-document decision (5.1).
- **It does not touch the transplant pathway at all.** N7 is closed by
  `plan-2026-10-16-transplant-hard-stop-both-apps.md`, not here — see the struck §5a.
  That plan must land **first** (see §11), partly so that check **G1** never runs while the
  684 transplant cards are still live: G1 flags a grey button nothing points at, and the
  cheapest way to satisfy it on those cards would be to delete a clinical source. Retiring
  the card deliberately removes that temptation.

## 11. Suggested order

**Step 0, before anything here: finish the transplant hard stop.**
`plan-2026-10-16-transplant-hard-stop-both-apps.md` (MeningoVax PR 1, then PneumoVax PR 2)
lands first, and this plan does not start until it has merged in both repos. Reasons, in
order of how much they'd cost:

- It deletes the `hsct` row and three `refs.js` entries that this plan would otherwise edit —
  both plans are open on `refs.js`, `riskFactors.js` and `CLAUDE.md` at once.
- It regenerates both verdict corpora (**1,334 of 17,342** real-patient rows move to a stop).
  `npm run sweep:update` rewrites those files whole, so two parallel branches each
  regenerating them give a conflict in generated data that cannot be resolved by reading it —
  and `CLAUDE.md`'s rule that every moved verdict be explained becomes unanswerable with two
  causes mixed together.
- It changes **every count in this document** (see the §2 banner). Re-measuring after is one
  command; re-measuring during is guesswork.

Nothing in this plan's mechanical half is blocked by waiting: C1–C5 touch how sources are
displayed, which the hard stop does not alter.

Then:

1. ~~Build and keep the word-comparison tool~~ — **already done**, see §9. Re-measure this
   plan's counts instead (§2 banner), so the numbers in the PR are post-transplant.
2. ~~**§5a**~~ — **struck.** Carried out by the hard-stop plan at step 0.
3. **C1** — hovering names the document. Small, quick, and answers the original question on
   its own.
4. **C4, C5** — MeningoVax's two separate problems. Independent of everything else.
5. **C2, C3**, plus checks **G1–G3**. The numbering fix. This is the big visible change.
6. **C7 → C6 → C8**, plus checks **G4, G5**. The clinical half.

Steps 3–5 are mechanical and can move quickly. Step 6 is one statement at a time with a
source read live each time, and shouldn't be hurried to keep up with the rest.

**One plan per conversation, one PR at a time.** Not for speed — because a cold agent
re-deriving a clinical rule from scratch is where drift comes from, and this plan's §7 is
exactly that kind of rule. Read-only re-measurement is the one piece safe to hand off.
