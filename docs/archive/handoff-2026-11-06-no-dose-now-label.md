> **SUPERSEDED 2026-11-06 by `handoff-2026-11-06-result-page-fold.md`.** Do not resume from this file.

# Handoff — 2026-11-06, whole-app report queue after P1-2

**The queue is still `docs/archive/fix-queue-2026-11-05-whole-app-rule-checks.md`.** This file only
says where it stands. Read the queue's own ground rules first.

## State

| Item | State |
|---|---|
| P0-1 (R1), P1-1 (R2) | Merged, #120 and #121 |
| P1-3, Noor's family only | Done, PR #122, not merged, its check passed |
| P1-2 (R5) | Done on `fix/p1-2-r5-no-dose-now`, from `main`, not stacked on #122 |
| P1-3, every other unasked-for conjugate | Not started, needs grouping by clinical family, then her ruling |
| P2-1 R9, P2-2 R3, P2-3 R8, P2-7 | Not started, no owner decision needed |
| P2-4 R6 | Not started, needs her answer (Decision 3 in the report, Cora) |
| P2-5 R4, P2-6 R7 | Recommended parked and no change. Not yet put to her |

**Measured on this branch:** 2,153 tests, 0 failed, 196 files. Whole-app: R5 832 to 0, check 3 1,144
to 312 (all R7), 0 unsorted. Saved answers moved: 225 of 17,016, only the label word; 0 of 18,264.

## What landed in P1-2

Her ruling: "Sadie and Ola". The test is whether a dose is still owed on the schedule the patient
is on now. New status `no-dose-now`: label "No dose now", stays open, counts as asking for nothing
today. Iris keeps "Complete". `CLINICAL_SPEC.md` §C-COMPLETE.

## Worth knowing

- **#122 and this branch touch neighbouring parts** of `causes.mjs`, `rulebook.js`, `CLINICAL_SPEC.md`
  and the queue. Neither is stacked on the other. Whichever merges second should be brought up to
  date with `main` and the full suite re-run before merging. #122's guard pins a card count, so
  check it after both are in.
- **`note.detail` sits behind "Why this".** A sentence a clinician must see goes in `lead`.
- Iris's result stays folded by her choice, so her at-19 line needs a click. She saw this in the
  question. Do not "fix" it.
- P2-1's wording is unrelated to this change, and is the smallest next item.
