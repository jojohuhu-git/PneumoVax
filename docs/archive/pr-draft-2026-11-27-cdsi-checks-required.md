## What this does, in plain English

CDC publishes its own computer version of the vaccine schedule, called **CDSI**: a rule file, plus
test patients with the answer CDC's software gives for each. Since 8 November the app has been
checked against both, but only by scripts someone had to remember to run. This PR turns both checks
into **required tests**, so they run every time the tests do. If the app and CDC's software start
disagreeing in a new way, the tests fail.

**No patient's answer changes, and no card wording changes.** Only checks are added.

CDSI is a cross-check, never the authority. Where it and CDC's or ACIP's written wording differ, the
wording wins (owner rules 2026-08-10 and 2026-10-17). So the tests don't require agreement. They
require **every difference to be named, with its reason**, and they fail when anything changes
without someone looking.

## Two commits, one per plan item (`docs/archive/plan-2026-11-08-cdsi-checks-both-apps.md`)

### P-CDSI-2: CDC's 140 test patients, required
`src/logic/__tests__/cdsi-test-patients.test.js`. **122 of 140 agree** with CDSI on every dose and
on the next step. The other **18** are each in a named family (`KNOWN`, now in
`scripts/cdsi/cdsiTestPatients.mjs`), and each one's answer is pinned exactly: which doses differ,
and the app's own result and date. The test fails on:
- a new disagreement;
- a named patient who now agrees;
- a named patient whose answer moved;
- a CDC condition code the app has no box for (other than the one contraindication, already known).

`runTestCases.mjs` now reads the same core, so there is no second copy of the patient mapping.
Its printed output is **byte-identical** to before (218 lines, compared with `diff`).

### P-CDSI-1: the app's rules against CDC's rule file, required
`src/logic/__tests__/cdsi-rule-comparison.test.js`. It reads CDC's pneumococcal rule file
(CDSI 4.65) **directly**, all 870 rules, using a reader copied from MeningoVax
(`scripts/cdsi/cdsiRules.mjs`). Before this, the numbers were typed in by hand. It compares the
minimum ages, the infant gaps, the 4-day grace and every row of the app's rule table:
**35 comparisons, 28 agree, 7 named differences, 0 unnamed.**

The test also fails if CDC's file changes at all against a saved copy
(`cdc-files/pneumo-cdsi-rules.json`). So a new CDSI release shows up as a red test until someone
reads its notes.

## The 7 differences (please audit)

In every one, the app is stricter than CDC's software or follows a dated ruling.

**Approved by you today, 2026-11-27 ("Yes, keep all 4"):**
1. A PPSV23 given **under 8 weeks after a PCV**: the app doesn't count it for any child. CDSI
   enforces this only for 2–5-year-olds with chronic conditions. Reason: CDC child notes, *"at least
   8 weeks after the most recent PCV dose"*.
2. A PCV given **under 8 weeks after a PPSV23**: the app doesn't count it. Reason: your ruling of
   2026-10-25.
3. and 4. A second PPSV23 **under 5 years** after the first, in two histories where an earlier PPSV23
   didn't count: the app doesn't count it. CDSI has no floor on any 5-year gap. Reason: CDC notes,
   *"at least 5 years after dose 1 PPSV23"*.

**Found when more of CDC's rules were compared. Each rests on something already decided, so none
was re-asked:**
5. **PCV7**: CDSI counts it; the app never does (your ruling of 2026-10-12). This was already a named
   family among the test patients (5 patients).
6. **Dose 3 after a dose given at 7–11 months**: CDSI allows 4 weeks; the app waits 8. Reason: CDC's
   catch-up table, *"8 weeks (as final dose for healthy children) if previous dose was administered
   between 7–11 months"*. This was already marked deliberate in the 8 November report you ruled on
   (3 patients, same end result).
7. **A PCV21 given at 18**: CDSI allows PCV21 only from 19; the app grades it by its licence age, 18
   (your PCV21-OFFLABEL decision of 2026-10-15). This is a rare history.

**Not compared, and why** (written into the module): dose 4's 12-month minimum age (the app handles
it with the 12-month rules and §A-GRACE12, not a single number); maximum ages; gaps CDSI measures
from a dose in another of its series; and which conditions put a patient on which series. The test
patients check the last three by result.

## Proof the tests catch things

I broke the code eight ways, one at a time, and restored each file from a copy afterwards:

| Change | Tests that failed |
|---|---|
| A child's PPSV23 repeat rule made a floor | 2 of 18 |
| The grace cut from 4 days to 3 | 6 of 18 |
| PCV dose 2's minimum age moved from 10 to 11 weeks | 5 of 18 |
| PCV7 made to count (in `validate.js`) | 6 of 18 |
| One patient dropped from the named list | 2 of 18 |
| One rule changed in CDC's saved copy | 1 of 18 |
| An approved CDSI value edited | 1 of 18 |
| The 5-year gap changed from 60 to 48 months | 1 of 18 |

My first PCV7 change flipped the `counts` flag in `brands.js`, and **no test failed**. That flag
only feeds the Rulebook's product table; `validate.js:720` decides whether the dose counts. Both
agree today (PCV7 does not count), so nothing is wrong. They are two separate statements of the
same fact.

## Tests
Full suite on this branch, run alone: **2,583 tests in 234 files, 2,583 passed, 0 failed**. That is
`main`'s 2,565 plus the 18 new ones. On `main` 350b56c beforehand: 2,565 tests, 2,564 passed; the
one failure was the known 2-second speed test (2.99 s while the machine was busy), which passed
this time. Both verdict corpora are green. No app source file changed.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
