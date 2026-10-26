# PneumoVax — Handoff after the adult interval table went green and shipped (2026-10-25, desktop session)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Client-side React SPA for pneumococcal
vaccine decision support across the lifespan. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

Branch: **`feature/2026-10-25-interval-rules-reorganised`**, off `main` at `a66219a`.
**Pushed; working tree clean at `2d82595`.** PneumoVax's `main` is protected, so work lands
branch → PR → **the owner squash-merges** (a session agent cannot).

Baseline at session start: **1,621 passing, 7 FAILING in 3 files.**
Now: **1,632 passing in 147 files, 0 failing, 0 skipped.**

**PR [#90](https://github.com/jojohuhu-git/PneumoVax/pull/90) is OPEN and its `test` check
is GREEN** (`gh pr checks 90` → Passed 1, Failed 0). It is the adult half on its own, which
is what the previous handoff asked for. **It is waiting on the owner's review and squash
merge. Nothing else should be added to it.**

---

## What's done this session

### P0 — the three red files, commit `2d82595`
All 7 failures were one class: a test asserting an adult dose is rejected, when `bc4a186`
left no adult rule that rejects one. **No engine or rule file was touched, so no verdict
moved and `CLINICAL_SPEC.md` is untouched.** Each file was kept as the record of the
reversal, and two came out stronger:

1. **`regression-2026-10-24-advice-never-inside-the-four-day-grace.test.js`** — its
   months-stated fixture was a 70-year-old (PPSV23 → PCV20, 1 calendar year). Replaced by a
   **10-year-old with asplenia** (PCV20 2019-01-01, PPSV23 2019-04-01, second PPSV23
   2024-02-05, about two months inside the five years): `earliestValidDate` 2024-03-28 keeps
   the grace, `repeatDueDate` 2029-02-05 loses it. **`CHILD-PPSV23-AFTER-PPSV23` is now the
   only row in the whole table that is both months-stated and graced**, so it is the only
   place this behaviour can still be tested — asserted structurally in the file. Gained the
   grace-window sweep the adult never had (advise 02-05, accept 02-01, reject 01-31). The
   adult stays in the file as the record of **PR #83's second open question closing itself**:
   her chip and card used to name two dates a month apart, and with no adult floor there is
   no second date to disagree.
2. **`regression-2026-10-25-no-date-for-a-dose-nobody-asks-for.test.js`** — the "is anything
   owed, not is a dose of THIS vaccine owed" boundary was held by two adults who no longer
   have a rejected dose. It moves to the **asplenic 5-year-old already in the file**, who
   holds it better: the clause she keeps is on a PPSV23 while her only card is a PCV one
   (asserted, and live-verified in the app). Grid pin re-measured **5,265 → 4,422** patients
   (`{withdrawn: 2652, kept: 1770}`); a new sweep pins that **every rejected dose left in the
   grid comes from `CHILD-PCV-AFTER-PCV` or `CHILD-PPSV23-AFTER-PCV`**, by name.
3. **`regression-2026-10-24-note-emphasis.test.jsx`** — one test demanded the words "owner
   clinical determination" on two cards. Both rows are recommendations now and a
   recommendation asserts only CDC's interval, so **that phrase is gone from the whole app**;
   the test says so and pins the reason structurally (every surviving floor is CDC's, so an
   OWNER-authored floor added back fails it). Its other failure was the bolded chip span:
   `ADULT-PPSV23-AFTER-PPSV23` no longer offers a conjugate beside a discarded dose, so the
   bold is the verdict itself (`Counted; never give a third.`) and the conjugate alternative
   moved into `whys` — both asserted, plus the defect the file exists for (no literal `**`
   ever reaches a clinician).

### Mutations run, each caught by the NEW assertions
- give `repeatDueDate` its 4 days back → **5 tests fail**, including the new months-arm one
- take the grace off `CHILD-PPSV23-AFTER-PPSV23` → **3 fail**
- make `ADULT-PCV-AFTER-PPSV23` a floor again **with a floor-shaped `message`** → the grid
  pin moves (kept 1,770 → 1,902) and the new inventory names the re-added rule

⚠️ **A first attempt at that third mutation PASSED the grid sweep and was not a blind spot.**
Flipping only `enforcement` left the row's `message` returning `{reason, why}` (the
recommendation shape) where a floor needs `{reasons, detail}`, so no well-formed rejection
was produced. **When mutating a rule's enforcement, mutate its `message` shape with it** or
the mutation tests nothing.

### Live-verified in the running app (the previous session verified nothing)
`preview_start` "PneumoVax dev server" — note it took **port 5174**, so the URL is
`http://localhost:5174/PneumoVax/`.
- Asplenic 5-year-old, PCV20 1 Jun 2026 + PPSV23 22 Jun: chip reads *"can be given from Aug
  17, 2026 at the earliest"* while her only card is **PCV, Risk-Based** — the boundary.
- 60-year-old, PCV13 19 Jul + PPSV23 11 Oct 2026: chip reads **Dose 1** with *"shorter than
  the 1 year CDC advises. Counted; no further PPSV23 indicated."*, no asterisk on screen, and
  **one** date — card *"Not yet due — eligible Oct 11, 2031"*, five years from the PPSV23 that
  now counts (it said 2027 before).

---

## What's NOT done — the remaining queue, in her stated order ("adults, then children, then the rules map")

### P1 — the children's rows (her answers 1 and 3). Her ordering puts this next.

**⚠️ CUT THE BRANCH AFTER #90 MERGES, NOT BEFORE.** P1 edits `doseIntervalRules.js` and
`CLINICAL_SPEC.md`, which PR #90 also edits. A branch off `main` conflicts with #90; a branch
stacked on #90's tip breaks when she squash-merges (see memory *"A squash-merged parent
breaks a stacked branch"*). This session cut such a branch, did nothing on it, and deleted it
again for that reason. **Wait for the merge, then cut from the new `main`.**

| Item | Her row | App today |
|---|---|---|
| **P1** | Any PCV **<52 days** after a PPSV23 → **Repeat** | ⚠️ **Counts.** `CHILD-PCV-AFTER-PPSV23`, shipped in `a66219a`. |
| **P2** | 2nd PPSV23 <5y, immunocompromised child → **Count**, never a third | App rejects it (`CHILD-PPSV23-AFTER-PPSV23`). **0 grid patients** — needs a hand-built one. |
| **P3** | Five rows say the remedy is **PCV20, not another dose of the same vaccine** | App only knows "repeat this dose". The one genuinely new capability; shared by adults and children. |
| **P4** | Supplemental PCV20 24–51 days after last PCV | Default (repeat) right; needs the "count it and document" alternative, **withheld for immunocompromised/asplenic children**. |
| **P5** | Infant doses 1–3 before 38/66/94 days | **Already correct, no work needed** — 38+28+28 = 94 exactly. Zero slack, so it deserves a guard. |
| — | PCV21 under 18 | Rejected correctly; wording says "repeat this dose" where it should name PCV20. |

**P1's conflict IS resolved — do not re-raise it.** `doseIntervalRules.js`'s own `source`
comment quotes her calling this *"a grey zone where it could be considered complete but an
alternative suggest should be listed…"*, which is her **earlier** position. The question was
then put to her in exactly those terms and she answered **"Repeat — her table wins"**; the
cloud handoff's superseded banner records *"and she confirmed that choice"*. Build the repeat.

**What P1 actually takes** (read before estimating — it is bigger than one rule flip):
- `CHILD-PCV-AFTER-PPSV23` → `enforcement: 'floor'`, `grace: true`, and the `message` rewritten
  to the floor shape `{reasons, detail}` (see the mutation warning above).
- **`authority` → `OWNER`.** A floor asserts what no document states — that an early dose
  stops counting — so it carries her name; ACIP's sentence states only the interval. This is
  Ruling F's relabelling run backwards, and the card must disclose it, which is the phrase
  this session just removed from everywhere else.
- **Do NOT add the 2014 *Vaccine* hyporesponsiveness paper yet.** It is one of the eleven new
  references in P2 below, and whether to cite them as given or verify each live is **still an
  open owner decision**. The ACIP 2023 sentence already on the row carries the interval; the
  paper is her evidence for making it a bar, i.e. her determination.
- **`regression-2026-10-25-child-conjugate-after-ppsv23-counts.test.js` (171 lines) asserts
  the exact opposite** — "keeps the dose, its number, and the series", "adds NO new word to
  the chip vocabulary", and a grid sweep flagging `${c.key} floor dates` if the dose ever has
  `earliestValidDate` or `repeatDueDate`. It needs the same reversal-record treatment the
  three P0 files got, including its filename.
- `CLINICAL_SPEC.md` **§K-PPSV23THENPCV** in the same commit (`rule-docs-match-code.test.js`
  compares all 67 rows cell by cell on every run), and `src/data/rulebook.js`, which generates
  both the in-app rules page and §K's table from one describer.
- **231 doses, and verdicts WILL move.** Run `npm run sweep:update` only after you can say
  why, then put both moved counts in the PR. ⚠️ **Never `import` a top-level script to inspect
  it** — importing `scripts/updateVerdictCorpus.mjs` *executes* it and silently regenerates
  both corpora; the previous session did this and reported "0 moved" when the truth was 1,395.
  Take before/after from `git show HEAD:<path>`, never the working tree.

### P1 — her answer 3, "also state the minimum" (not started)
Every card that advises a date should state the true minimum beside it — the shape she
approved 2026-10-23 for infants (*"it can be given today if needed, as the minimum interval of
4 weeks has already passed"*). Nothing built.

### P1 — the rules map (not started, and **ask her first**)
`a66219a` rebuilt both rulebooks as a nine-column lookup (`src/data/rulebook.js` +
`src/components/Rulebook.jsx`). **She has not seen it yet — have her look before spending on
it.** It lacks the recommendation side (which dose is due next, not just intervals) and a
third authority tier: "Who says so" has only "CDC / ACIP" and "This app", while her tables add
**expert opinion / literature**, a different kind of claim.

### P2 — eleven new reference entries (not started, **open owner decision**)
Her tables cite documents the app has never cited: AAP **Red Book 2024–2027**, *Pediatrics*
2025 (invalid doses), the paediatric **HIV OI guidelines**, *Pediatrics in Review*, and seven
immunogenicity/hyporesponsiveness papers. **Ask: cite as given, or fetch and quote each one
live?** It is in PR #90's body as a question to her. P1 is blocked on it only for the paper,
not for the rule.

### Still open from `a66219a`, pinned by number in `regression-2026-10-25-at-risk-catchup-waits-eight-weeks-after-ppsv23.test.js`
the healthy child with a PPSV23 (11 + 14 patients); the 3-doses-before-12-months row (22);
whether `ADULT-PCV20-21-5Y-AFTER-PPSV23` should offer the optional repeat.

---

## Why this is a good stopping point

The adult table is a complete clinical unit: implemented, measured, spec'd, suite green, CI
green, live-verified on both surfaces, and open as a PR she can read on its own. P1 is a fresh
clinical unit that touches the same two files and **must not start until #90 merges**, so
there is nothing to carry forward mid-change — the tree is clean and nothing is half-applied.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-25-interval-rules-reorganised`
2. `npx vitest run` — confirm **1,632 passing, 0 failing** before touching anything.
3. **Check PR #90 first** (`gh pr checks 90`, `gh pr view 90`). **If it is still open, do not
   start P1** — say so and ask her to merge, or offer work that touches neither
   `doseIntervalRules.js` nor `CLINICAL_SPEC.md`. If it is merged, `git checkout main && git
   pull`, then cut the P1 branch from there.
4. **Open decisions — ask, do not default:** the eleven new references (cite as given vs.
   verify live); has she looked at the rules-map lookup; the three `a66219a` questions above.
   P1 itself is decided — build the repeat.
5. Per item: reproduce → failing test (confirm it fails) → fix → `CLINICAL_SPEC.md` in the
   same commit → full suite → break the fix more than one way and quote the counts (mutate the
   `message` shape with the `enforcement`) → **drive the running app** (`preview_start`
   "PneumoVax dev server"; read the real port from the result) → commit per item.
6. **Branch → PR → the owner squash-merges.** A session agent cannot merge.
7. **MeningoVax parity is NOT affected** by the adult pneumococcal rules, but consult the
   `vaccine-parity` skill before the children's rows.
