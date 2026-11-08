# PneumoVax — Children near an age line, second half (2026-11-08)

**STATUS: DONE. No problems found. Nothing in the app was changed.**

This finishes "Audit 1" from the 2026-11-01 list. The first half (a dose **1 day** either side
of 7, 12, 24, 60, 72 months and 18–19 years, and 4–5 days short where CDC's grace applies) was
done in the 2026-11-01 grey-zone work. The 2026-11-08 wording audit listed three things still
not covered. All three are now covered:

| Not covered before | Covered now |
|---|---|
| The 6-week minimum age for a first PCV | 11 babies: a first dose 2 weeks early through 1 week late, in a baby now 3 months old and in a baby now 7 weeks old (still young enough that the repeat date matters) |
| A week to a month either side of a line | 84 children at 7 days, 14 days and 30 days either side of 7 months, 12 months (first dose and booster), 24 months, PPSV23's 2-year minimum, the 5th birthday, the 6th birthday and the 19th birthday |
| The app's words against CDC's own words | (a) every patient above is graded against CDC's sentences, read live today, not against what the app "should" do; (b) all 23 quotes the app shows from CDC's two child pages were found word for word on the live pages |

## How it was checked

- **CDC read live, 2026-11-08**, in the browser pane with the closed sections opened: the
  Child/Adolescent Schedule Notes (61,523 characters — the closed page is about 8,000, so the
  read landed) and the pneumococcal row of the Catch-up Schedule's Table 2. The sentences used
  are written at the top of `scripts/ageLineAudit/childLines.mjs`.
- **Each patient states CDC's answer by itself** — whether each dose counts, which vaccine is
  next, the earliest date CDC allows, and the series total where CDC states one — and the
  script compares the app's card with it.
- **Result: 95 of 95 children agree.**

```bash
node scripts/ageLineAudit/childLines.mjs "$PWD"
```

## Proving the check can fail

A check that finds nothing only means something if it can find something. The app was broken
on purpose, one place at a time, and each break restored from a saved copy (not from git):

| Break | Children the check flagged |
|---|---|
| Minimum age 6 weeks → 5 weeks | 3 |
| Table 2's 7-month cut → 8 months | 3 |
| The 5th-birthday line → 61 months | 6 |
| The 6th-birthday line → 74 months | 12 |
| The 24-month line → 25 months | 3 |

**The 7-month break first showed 0.** The first version of the check had no baby whose
third dose was given 5 weeks after a dose at about 7 months — the one history where that cut
decides whether a dose counts. That family (`L2b`) was added; the same break then showed 3.

## Things that looked wrong and are not

Each of these was traced to a ruling already in `CLINICAL_SPEC.md`. None is a finding.

1. **A baby waiting for the first birthday gets no date on the card**, only *"This final dose
   is not due until the patient reaches 12 months."* That is the settled design: the routine
   2-4-6-month baby gets the same sentence, and `noteFold.js` keeps it in view because the card
   has no other date.
2. **A booster given 1–4 weeks before the first birthday asks for "PCV dose 5 of 5".** A dose 5
   or more days early is an extra infant dose and the booster is still owed (owner ruling
   2026-10-23; §A-GRACE12 kept it).
3. **A PPSV23 given under age 2 (thrown out) makes the card offer PPSV23 again only in 2031.**
   That is §C-P2-FIVE (owner, 2026-10-31, this same toddler): a PPSV23 after any earlier PPSV23
   waits 5 years; PCV20 is offered today as Option A.
4. **An unvaccinated child just past 6 is offered PCV20, or PCV15 then PPSV23.** That is CDC's
   own 6–18 row: *"administer 1 dose of PCV15 or PCV20. If PCV15 is used … administer 1 dose
   of PPSV23 at least 8 weeks after the PCV15 dose."* (The check misread it at first and was
   corrected.)

## What this does not cover

- Every patient uses one fixed today (2026-11-08) and PCV20 or PCV13 by birth year. Mixed
  products and PCV15 near the lines were covered by the 2026-11-05 whole-app checks, not here.
- Adults were not part of this audit (Audit 2 — the queue file recommends calling it done;
  that still needs the owner's yes).
- The script is a one-off check in `scripts/`, like `earlyDoseCheckChildren.mjs`; it is not
  part of `npm test`.
