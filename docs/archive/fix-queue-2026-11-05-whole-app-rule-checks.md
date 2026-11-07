# Fix queue — 2026-11-05 whole-app rule checks

A fresh session can run this queue on its own. The plain-English report, with every patient
and count, is `docs/archive/report-2026-11-05-whole-app-rule-checks.md`. **Read it first.**

## Baseline

- Measured on `audit/2026-11-05-whole-app-rule-checks`, branched from `main` at `83e095d`.
  **Check whether its PR has merged, and start from `main`.**
- Reproduce any item: `node scripts/wholeApp/run.mjs`, about 3 minutes on a quiet machine.
  `--only grid` is about 1 minute. `--checks 1,4` narrows it.
- Read one patient: `node scripts/wholeApp/show.mjs '<patient key>' '<road>'`.

## Ground rules (from CLAUDE.md; do not re-litigate)

- **Use the `fix-queue` skill, one item at a time.** Reproduce, failing test, smallest fix,
  full suite, break the fix on purpose, prose diff, check in the running app, commit by ID.
- **Items marked OWNER need her answer first.** Her answer goes in the commit and in
  `CLINICAL_SPEC.md`. The patients for each question are in the report's "Decisions" section,
  with the whole scenario, ready for the question box.
- **A verdict that moves must be explained.** Do not run `npm run sweep:update` until you can
  say why those patients should get a different answer. Put both moved counts in the PR.
- **The corpora hold no prose.** Run `scripts/proseDiff.mjs` before and after any wording item.
- **When an item lands, re-run the checks and update `scripts/wholeApp/causes.mjs`:** delete the
  sorting rule for the fixed cause, so that if it returns it lands in "unsorted" and fails.
  Then move the check into the required suite as the report's gate table says.

---

## P0

### P0-1 — R1: the 2nd-PPSV23 card ignores the 8 weeks after a recent PCV

**DONE 2026-11-05.** Both options now give one date, and the card says why (owner decision,
`CLINICAL_SPEC.md` §D-note-8W). R1 went from 2,110 patients to 0. Check 4 is in `npm test`.
**Two things in this entry turned out wrong, and are left as written so the record stands:** "Verdicts
move" did not happen (0 of 17,016 and 0 of 18,264 moved, because the grid has no such patient on
a first screen), and only one of the four places could ever disagree.

- **Patient:** Noor, 10, HIV. PCV13 at 2, 4, 6 and 12 months, PPSV23 at 5, PCV15 two weeks ago.
  `node scripts/wholeApp/show.mjs 'tc120|r:hiv|P:PCV13@2m,PCV13@4m,PCV13@6m,PCV13@12m,PCV15@-0m-14d|S:-60m' 'PPSV23 2026-10-11'`
- **Now:** "1 dose PCV20" waits to Nov 22. "2nd PPSV23 (alternative)" beside it is due today. Given
  today, the app throws that PPSV23 out.
- **Cause:** `src/logic/recommend.js` works the alternative's date out separately, in four places:
  lines 2412, 2684, 2807 and 2997. Each reads 5 years only. The PCV20 card beside each calls
  `icPostPpsv23DueState()` (line 396), which takes the later of 5 years and 8 weeks.
- **Fix:** give the PPSV23 card the same call. No new rule is needed.
- **Source:** CDC Child Notes, read live 2026-11-05, immunocompromised, age 6-18: *"administer 1
  dose PCV20 or 1 dose PPSV23 at least 8 weeks after the most recent PCV13 dose and at least 5
  years after dose 1 PPSV23."* PneumoRecs says the same in its own words.
- **Expect:** checks 1 and 4 lose all of R1. Tried in a throwaway copy: 2,110 patients to 0.
- **Verdicts move.** The corpus will change on these patients. That is the fix.

---

## P1

### P1-1 — R2, OWNER: a child's card gives a date after the 19th birthday

**DONE 2026-11-05 on `fix/p1-1-r2-adult-rules-win-past-19`.** She chose the adult rules, for Tess,
Rafi and Cal. 1,358 patients to 0. `CLINICAL_SPEC.md` §B-AT19. What follows is the history.

**Count changed 2026-11-05:** 1,358 patients now, not 1,871. P0-1 removed 513: children sent down
the "due today" PPSV23, thrown out, and held past 19. Tess, Rafi and Cal are unaffected.

- **Patients:** Tess (A), Rafi (B), Cal (C) in the report, Decision 1.
- **Now:** the child's card names a date past 19. On that date the adult rules give another answer:
  "Complete", or a different product, or a date a year later.
- **Cause:** `withAtNineteen()` (`recommend.js:1455`) runs the patient forward only for `complete`
  cards. A card asking for a dose never consults the adult answer.
- **Do not start until she has answered.** The likely shape is to run the patient forward to the
  card's own date, as `earlyFiveYearPcv20` already does, and let that answer the card.

### P1-2 — R5, OWNER: "Complete" beside a dose falling due at 2

**DONE 2026-11-06 on `fix/p1-2-r5-no-dose-now`.** She chose "Sadie and Ola": both now read "No dose
now", stay open, and show the later dose without a click. Iris keeps "Complete". No dose or date
moves. R5 went from 832 patients to 0. `CLINICAL_SPEC.md` §C-COMPLETE. What follows is the history.

- **Patient:** Sadie in the report, Decision 2.
- **Now:** an at-risk baby's card has the pill "Complete" and says "one further dose falls due at
  age 2 years". Her rule of 2026-11-01: *"Complete should only be used if no additional
  doses/boosters are needed."*
- **Likely shape:** a status and label change only. No date moves. Check `RecCard.jsx`'s collapsed
  neutral card: a card that is not neutral stays open.

---

## P2

### P2-1 — R9: "may be given now" over a date still in the future

**DONE 2026-11-06 on `fix/p2-wording-items`.** The word "now" came off. 88 cards to 0.

- **Patient:** Pax in the report. 40, HIV, PCV13 and two PPSV23, the last 4 years ago.
- **Now:** the header says "Not yet due — eligible Nov 5, 2027"; the note says "may be given now".
- **Fix:** drop "now" from the sentence, or use it only when the five years have passed. Wording
  only, no verdict moves. ACIP's row (mm7401a1) says ≥5 years after the last dose.
- 88 cards. `node scripts/wholeApp/wordingChecks.mjs` counts them.

### P2-2 — R3, OWNER: an infant's date moves when the child turns 7 months

**DONE 2026-11-06, PR #125.** She chose: advise Jan 29, and say Jan 1 counts. R3 went from 33 patients
to 0. `CLINICAL_SPEC.md` §L-2. What follows is the history.

- **Patient:** Remy in the report.
- **Now:** the card says dose 3 is due Dec 6. On Dec 6 the same card says Jan 3.
- **Cause:** the band is read from the child's age today (`recommend.js:778`,
  `ageAtThisDose: needs12moFloor ? M.m12 : am`, and `t1row`), not the age on the advised date.
- **Note:** nothing is rejected if the dose is given on Dec 6. Only the advice moves.

### P2-3 — R8: a card says "at or after age 6" about doses given before 6

**DONE 2026-11-06 on `fix/p2-wording-items`, wording only.** 19,910 cards to 0. `CLINICAL_SPEC.md`
§C-AGE6-WORDS. **Closed 2026-11-06 by P1-3's rulings.** Deferred at the time: the cards still cite the row they cited. Most of these children had a
conjugate nobody asked for, so that waits on the open half of P1-3.

- **Patient:** Ada in the report.
- **Dose unchanged**, so her 2026-10-18 rule lets this be decided without asking. Group the
  judgement calls in the PR body. Read each row first, tables included (FINDING F).
- **Note:** every one of these patients has a conjugate at 6 or over on top of a baby series, so
  most are off-schedule histories. Fix the wording; do not chase every shape.

### P2-4 — R6, OWNER: Option B says it completes the series, and at 19 a dose can still come

- **Patient:** Cora in the report, Decision 3. Wording only.

### P2-5 — R4: recommend parking

- A childhood PPSV23 thrown out for being too close to a PCV, and the patient since turned 19 or
  has a PCV card. The chip's five-year date and the card disagree. Rare history, and the owner
  asked on 2026-10-31 not to bring very unlikely histories to her.
- **Recommend parking** with a one-line note in the report. If taken up, the adult path in
  `recommend()` does not call `holdPpsv23AfterThrownOut()`; the child path does.

### P2-7 — NEW, found live on Tess: the word "complete" cites the wrong sentence

**DONE 2026-11-06 on `fix/p2-wording-items`.** The risk page speaks for 19-49 only, as it has no 50+
section, so the job aid keeps the claim at 50+. `CLINICAL_SPEC.md` §G.

- **Now:** "PCV15 followed by PPSV23 is a complete pneumococcal series" cites `adultPcv15ThenPpsv`,
  CDC Adult Notes, whose quote is the interval and never says "complete". This predates R2.
- **Fix:** CDC's risk page says it, read live 2026-11-05: *"Their pneumococcal vaccinations are then
  complete."* Add that entry and cite it. Dose unchanged, so her 2026-10-18 rule lets this be decided
  without asking. Read the document first (FINDING F), and watch the citation count pins.

### P2-6 — R7: recommend no change

- A healthy baby's "series complete" card does not mention what happens at 50. The toddler's card
  does. The ask is decades away. Listed so it is not found again.

### P1-3: a child's conjugate dose that nobody asked for is never called extra (found 2026-11-06, OWNER)

- **Patient:** Noor, 10, HIV. PCV13 at 2, 4, 6 and 12 months, PPSV23 at 5, PCV15 two weeks ago. No card offered a PCV15: the options were PCV20 or a 2nd PPSV23. The dose reads plain "valid".
- **Cause:** in `validate.js`, `priorCompletingDose` is `!isAdultDose ? null : ...`. The check for a dose given after the series was finished runs for adults only. Children have the PPSV23 version (§C-P2) but no conjugate version. None of the seven whole-app checks asks "was this dose on offer?"
- **Size, measured 2026-11-06:** 31,584 of 43,324 patients whose last PCV was given between age 7 and 18 got a dose no card offered, and it reads plain "valid". The count needs splitting into clinical families before any ruling.
- **Not a fault:** the same child with no PCV at all before the PCV15. CDC's row offers PCV15 and the app's Option B-1 names it.
- **Noor's own family: DONE 2026-11-06, ruling "Yes, flag it extra".** 3,442 patients, PCV15 now Extra dose, 8-week wait kept (`CLINICAL_SPEC.md` §C-P1-3). 0 of 3,442 had a card offering PCV15.
- **The other families: DONE 2026-11-06 on `fix/p1-3-unasked-conjugates-by-family`.** Re-counted at 36,736 before limits, ruled on Theo, Mateo, Lena and Ben (and Priya, by the same answer). Flagged now: finished 18,430, healthy 10,088, no PPSV23 yet 4,116, Noor's 3,442 = 36,076. 546 finished children no longer owe a PCV20; no other dose or date moved. `CLINICAL_SPEC.md` §C-P1-3 lists what was left alone, with counts.

### P2-8 — NEW, found by the wordiness review: "overdue" on the day a dose is due

**DONE 2026-11-06 on `fix/p2-wording-items`.** Mia, healthy, PCV20 on time at 2 months, seen the day
she turns 4 months. "Why this" said the dose "is overdue". 99 of 17,016 and 594 of 18,264 change
wording. No dose or date moves.

### P2-9 — NEW, OWNER: an on-time baby's card says "Catch-up"

**DONE 2026-11-06 on `fix/p2-9-10-routine-label-and-first-dose-wording`.** "Routine" when on time.
231 of 17,016 and 561 of 18,264 saved answers moved, each the label alone. `CLINICAL_SPEC.md` §L-2.

### P2-10 — NEW, OWNER: an interval before a first dose

**DONE 2026-11-06 on the same branch.** Her question on a 3-year-old with no spleen and no doses:
"why is the 8 week interval being mentioned". Seven sentences and two headings lost it.

### WORD-1 — OWNER: fold the result page

**DONE 2026-11-06 on `feat/word-1-fold-result-page`.** She saw the first cards and said to open the PR. `CLINICAL_SPEC.md`
§WORD-1. Report: `docs/archive/report-2026-11-06-wordy-result-pages.md`.
