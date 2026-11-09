> **ARCHIVED COPY (made 2026-11-08)** of `.claude/prompts/fix-2026-11-01-grey-zone-audit.md`, a folder that is not saved to GitHub. Kept for history. Before acting on anything in it, check the later handoffs in this folder: it may be finished or superseded.

> **CONSUMED 2026-11-01** — every item (P1-1..P2-5) is done in PR #116. See `docs/archive/handoff-2026-11-01-grey-zone-fixes-pr116.md`. Do not re-run this queue.

# Fix queue — 2026-11-01 grey-zone audit (PneumoRecs vs PneumoVax, 63 patients)

A fresh session can run this queue on its own. The plain-language report with every patient
is `docs/archive/comparison-2026-11-01-grey-zone-pneumorecs-vs-pneumovax.md`. **Read it first.**

## Baseline

- Branch at audit time: `fix/2026-11-01-rules-page-cdc-recheck` @ `9bb68a2`. PR #115 was
  open then; **check whether it has merged and start from `main`.**
- Suite: **2,024 passing, 0 failing.** Measured with
  `./node_modules/.bin/vitest run --reporter=json --outputFile=<scratch>/r.json`.
- Reproduce:
  - `node scripts/pneumoRecsGreyCompare.mjs G01 G04 …` shows both tools' answers.
  - `node scripts/pneumoVaxFollowAdvice.mjs G01 …` follows the app's own advice forward.
  - Patients are in `scripts/pneumoRecsGreyCases.mjs`, with TODAY fixed at 2026-11-01.

## Ground rules (from CLAUDE.md; do not re-litigate)

- **Every item here is WORDING or CITATION only, except P1-2,** which needs an owner
  decision first. None should move `verdict-corpus.tsv` or `record-problem-corpus.tsv`. If
  one does, stop and explain before running `npm run sweep:update`.
- **The corpora don't record prose.** Diff the rendered text with `scripts/proseDiff.mjs`
  (run it with plain `node`) and report the count of changed lines.
- **Cite the row the patient FOLLOWED** (2026-10-23). **Cite CDC; use p2016 only as a
  fallback** (2026-10-23).
- **Every quote names its patient:** `population` must fit. Never widen a source's
  `population` to make a quote legal.
- **Never print a product the record doesn't show** (FINDING H).
- **Before removing or adding a citation, read the whole document, tables included**
  (FINDING F). Use the `verify-clinical-source` skill. CDC notes pages are accordions, so
  expand them.
- Owner rules for questions: plain language, a named patient, and the whole scenario inside
  the question box.

## Per-item workflow (`fix-queue` skill)

1. Reproduce with the script and the patient ID.
2. Write a failing test.
3. Make the smallest fix.
4. Run the full suite.
5. Break each clause of the fix on purpose and confirm a test fails.
6. Run the prose diff.
7. Check it in the running app (`preview_start` "PneumoVax dev server").
8. Commit, named by ID (for example `P1-1: …`).

---

## P1

### P1-1 — IC 2–5 at-risk catch-up card: no 5-year step; "add PPSV23 ≥8 weeks" is wrong when a counting PPSV23 exists

- **Reproduce:** G01, 4 years old, asplenia, PPSV23 2025-10-27, no PCV. Also any IC child
  aged 24–71 months with fewer than 3 PCV doses by 24 months.
- **What the card says now:** "If PCV15 is used to complete, add PPSV23 ≥8 weeks after the
  last PCV." It never mentions PCV20 / a 2nd PPSV23 ≥5 years after the 1st PPSV23.
- **What happens if it's followed:** the PPSV23 comes 15 months after the first. The app
  later grades it "shorter than the 5 years advised … never give a third".
- **Expected:**
  - **Counting PPSV23 already on record:** state the 5-year option. Sources:
    `pedsIcPcv20orPpsv23` / `pedsSecondPpsv5y` (CDC), and `p2016Before6PpsvGivenIcOptions`
    as a fallback only.
  - **No PPSV23 yet:** keep the 8 weeks and add the 5-year follow-on.
- **Measured:** 366 grid cards, 0 mention 5 years. 144 already have a counting PPSV23.
- **Where:** the at-risk catch-up note in `recommend.js`. Search for
  `If PCV15 is used to complete, add PPSV23`.
- **Fixture:** G01, plus a 3-year-old with asplenia and no history (the control).

### P1-2 — IC 6–18: PCV15 + PPSV23, complete or 5-year dose? — OWNER DECISION FIRST

This is case (b): two CDC rows give different dose counts.

- **Reproduce:** an 8-year-old with asplenia, no history.
  - The Option B-1/B-2 card stops at the PPSV23.
  - After PCV15 2026-11-01 and PPSV23 2026-12-27, the app asks for PCV20 or a 2nd PPSV23 at
    5 years.
  - **Also:** G03, G25 and G28 (path B), and G08.
- **The two CDC rows:**
  - `pedsIc6to18NoPcv`: no further dose stated.
  - `pedsIcPcv13AndPpsvAt6`, plus the PCV13≡PCV15 ruling (`pedsPcv13Pcv15Interchangeable`):
    a 5-year dose.
- **CDC PneumoRecs** says complete (G03, G28).
- **Measured:** 222 Option B cards, 216 don't mention it.
- **Ask her** (put the patient in the box): *"Isla, 8, asplenia, never vaccinated. If she
  gets PCV15 then PPSV23, does she need PCV20 or a 2nd PPSV23 five years later?"*
  - **Yes:** put the step on the Option B card, as G08's card already does.
  - **No:** stop the later card asking for it. That is a verdict change, so measure it and
    explain it.

### P1-3 — Adult PPSV23 → PCV15 "complete" card says "PCV15 followed by PPSV23" and cites the wrong row

- **Reproduce:** G04 (30 years, diabetes) and G06 (40 years, HIV): PPSV23 first, PCV15 a
  year later. G05 is the 50+ version.
- **What the card says now:** "PCV15 followed by PPSV23 is a complete pneumococcal series",
  cited to `adultPcv15ThenPpsv`. The screen shows the dates in the opposite order.
- **Expected:** a PPSV23-first wording, cited to `adultPpsvOnly1949`, whose quote ends "If
  PCV15 is used, no additional PPSV23 doses are recommended". That fits a 19–49 patient.
- **For 50+:** the `adultPpsvOnly` quote does **not** carry that clause. Read CDC adult notes
  50+ and the Adult Timing Job Aid live, tables included.
  - If one of them states it, cite it.
  - If none does, that is case (a): ask her.
- **Measured:** 675 of 17,016 grid patients.
- **Where:** `recommend.js`, the `if (pcv.hasPCV15 && ppsvGiven)` branch, about line 3275.
  Note the branch never looks at the order of the two doses.

---

## P2 (rare or wording-only; the owner asked 2026-10-31 to park rare histories, so check before spending a session on them)

### P2-1 — 49y11m IC adult: an 8-week PPSV23 date that turns into 1 year on that date

- **Reproduce:** G31 (HIV, PCV15 2026-10-11, DOB 1976-11-29).
  - Viewed 2026-11-01: PPSV23 from 2026-12-06.
  - Viewed 2026-12-06: from 2027-10-11.
- **Smallest fix:** a sentence on the 19–49 card when the 8-week date is on or after the
  50th birthday.
- **Recommend parking.**

### P2-2 — Child card "PCV complete (includes PCV20)" for a PCV21 given at 18

- **Reproduce:** G27.
- **Where:** `recommend.js:2175` and the note at `:2020`, plus the "This child had never
  received PCV13, PCV15 or PCV20 before that dose … CDC's row" sentence.
- Name the product the record shows. Hand-built only; the grid has 0.

### P2-3 — IC cards: "a PPSV23 completes the recommended series" next to "then ≥5 years later"

- **Reproduce:** G39 (4 years, HIV, 4 × PCV15).
- **Measured:** 198 IC cards; 99 carry both sentences.
- The source is `cdcPcv20Children2023CompleteWithoutPcv20`, whose own text says "using
  previously recommended dosing and schedules". Keep that phrase, or don't paraphrase it as
  "completes" on IC cards.

### P2-4 — G21: "whether or not a PPSV23 was given earlier" when the PPSV23 was later

The sentence comes from the CDC risk-indications branch line. Rephrase it for a PPSV23 given
after the PCV20.

### P2-5 — Teen with an adult-only risk (smoking, alcoholism): "Re-evaluate at age 50" should be 19

- **Reproduce:** G58, G59.
- `riskAgeNote` already explains that the tick isn't acted on. Only the age in the review
  sentence is wrong for these teens.

## Not to fix (checked, by design)

- **PPSV23 too soon after PCV15** counts for adults (G55, G56) and doesn't count for
  children (G57). This is the owner decision of 2026-10-24 (child catch-up minimum vs adult
  CDSI 0 days).
- **An unneeded PPSV23** gets a chip for a healthy child (G19) but not for an adult (G20).
  The adult dose counts at 50.
- **PneumoRecs' gaps:** G34 (healthy 5-year-old caught up), G42 (one-product question),
  G57 (no dates), PCV21 in a child, and rounding at 18y11m and 49y11m. These are CDC's tool,
  not PneumoVax.
