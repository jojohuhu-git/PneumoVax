// FINDING M (2026-10-22) — a healthy child whose PCV series was STARTED in the
// second year of life is finished after two doses, and the app was asking for a
// third.
//
// HOW IT WAS FOUND. The queue item was a citation job: the healthy 24–59 month
// catch-up card lists three documents and credits only one, so each group of
// patients was to be pointed at the row that actually governs it (the owner's
// all-columns rule of 2026-10-18). Measuring the groups is what found this. One
// group of 12 cards is a 24-month-old with three PCV13 doses at 16, 18 and 20
// months, and the only row of the job aid whose every column fits that child
// says to give NO dose today. The card said to give one.
//
// WHAT THE DOCUMENTS SAY. All three were read live on 2026-10-22; the job aid
// PDF was fetched and is byte-identical (sha256 65aec99a…) to the copy read.
//
//   1. CDC Catch-up Immunization Schedule (Table 2), pneumococcal conjugate,
//      the "Dose 3 to Dose 4" cell — the whole cell, verbatim:
//        "8 weeks (as final dose) This dose is only necessary for children age
//         12 through 59 months regardless of risk, or age 60 through 71 months
//         with any risk, who received 3 doses before age 12 months."
//      Three doses at 16/18/20 months are not three doses before 12 months, so
//      no fourth dose is necessary.
//      https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-catch-up.html
//
//   2. CDC PCV Catch-Up Job Aid (Revised January 2025), p.3, the 24-through-59
//      months block, "# of previous doses is 3", condition column "1 or more
//      doses were given at 12 months of age or older" → THEN "No dose today",
//      Next dose due "No additional doses needed". Read with
//      scripts/pdfLayout.py so each cell stays tied to its own row.
//      (Its 2-dose block says the same for "Dose 1 was given after 12 months of
//      age".)
//
//   3. immunize.org p2016 Table 2, healthy children 24 months – 18 years:
//      "Completed any PCV schedule, including an all-PCV13 schedule by 24 mos"
//      → "No additional doses". The row the app was leaning on instead is the
//      next one down, "No previous doses, or any incomplete PCV schedule by age
//      24 months" → "1 additional dose, at least 8 wks after most recent PCV
//      dose", and whether this child's schedule is "incomplete" is precisely
//      what documents 1 and 2 answer.
//
// WHY THE ENGINE MISSED IT. `pcvHealthyChild` had two ways to be complete:
// `prior >= 4 && (a dose at 12–23mo || an undated dose)`, and a dose at
// ≥24 months. A dose given at 12–23 months was never credited as the
// age-appropriate FINAL dose unless four doses were on record, so a two- or
// three-dose series finished in the second year of life read as incomplete.
//
// OWNER RULING 2026-10-22, in her words:
//   "Healthy children, PCV initiated at 12–23 months → 2 doses, ≥8 weeks apart
//    is the full series. Two documented, appropriately spaced doses in this age
//    range satisfy that requirement.
//    Catch-up at 24–59 months (healthy): any incomplete schedule as of 24
//    months calls for 1 additional PCV dose ≥8 weeks after the most recent
//    dose. This applies to the child who had only a single 12–23 month dose.
//    Interval validity matters."
//
// "INTERVAL VALIDITY MATTERS" NEEDED NO NEW CODE, AND THAT WAS CHECKED, NOT
// ASSUMED. `CHILD-PCV-AFTER-PCV` in `doseIntervalRules.js` is an
// `enforcement: 'floor'` row keyed on the age at the PREVIOUS dose, so a dose
// following one given at ≥12 months needs 8 weeks (56 days) and gets CDC's
// 4-day grace. Measured on the engine: a second dose 51 days after the first
// does not count, 52 days does. So the completeness test below counts
// EFFECTIVE doses and the spacing requirement comes for free — the two doses
// cannot both be on the effective list unless they were properly spaced. The
// 51-vs-52-day pair is asserted below so that stays true.
//
// MEASURED BEFORE THE FIX, over `src/test-grid.js`: 144 cards sit on this
// catch-up card, and exactly 12 of them are the 16/18/20-month child. Those 12
// move to "complete"; the other 132 do not move. The grid cannot express the
// two-dose shapes at all (every one of its 144 cards is a 24-month-old with 0,
// 1 or 3 doses), which is why the worked patients below are constructed
// directly rather than sampled from it.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { analyzeBoth, ageAtDoseFromDate } from '../validate.js';
import { populationOf } from '../../data/riskFactors.js';

const TODAY = '2026-10-22';
const CATCHUP_LEAD = 'Give 1 dose of PCV15 or PCV20';

// A date of birth that makes the child exactly `m` months old on TODAY.
function dobForAgeMonths(m) {
  const d = new Date(`${TODAY}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - m);
  return d.toISOString().slice(0, 10);
}
function onBirthdayMonth(dob, m) {
  const d = new Date(`${dob}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + m);
  return d.toISOString().slice(0, 10);
}
function plusDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// A healthy child (no risk factors) of `ageMonths`, with PCV13 doses given at
// the listed ages in months.
function healthyChild(ageMonths, doseAgesMonths) {
  const dob = dobForAgeMonths(ageMonths);
  return recommend({
    dob,
    today: TODAY,
    riskIds: [],
    ppsv23Doses: [],
    pcvDoses: doseAgesMonths.map((m) => ({ product: 'PCV13', date: onBirthdayMonth(dob, m) })),
  });
}
function pcvCard(result) {
  return (result.recs ?? []).find((r) => r.vaccine === 'PCV');
}
function leadOf(rec) {
  return typeof rec?.note === 'string' ? rec.note : (rec?.note?.lead ?? '');
}

describe('FINDING M — a series started at 12–23 months is complete after 2 doses', () => {
  // The patients the three documents call finished and the app did not.
  //
  // The last two are the SECOND line of the rule — a series begun before the
  // first birthday, which takes three doses rather than two. They are here
  // because the first version of the fix handled only a series begun at 12–23
  // months, passed all 1,313 tests, and still offered these children a fourth
  // dose that the job aid's 3-dose row ("1 or more doses were given at 12
  // months of age or older" → No dose today) says not to give.
  const finished = [
    ['the 12 grid cards: 30 months, 3 doses at 16/18/20 months', 30, [16, 18, 20]],
    ['36 months, 3 doses at 13/15/17 months', 36, [13, 15, 17]],
    ['30 months, 2 doses at 13/15 months', 30, [13, 15]],
    ['48 months, 2 doses at 12/14 months — a dose ON the first birthday counts', 48, [12, 14]],
    ['30 months, 3 doses at 5/14/17 months — started in infancy, finished later', 30, [5, 14, 17]],
    ['36 months, 3 doses at 2/4/13 months — the third dose came at ≥12 months', 36, [2, 4, 13]],
  ];

  it.each(finished)('%s — no further dose', (_label, ageMonths, doseAges) => {
    const rec = pcvCard(healthyChild(ageMonths, doseAges));
    expect(rec.status).toBe('complete');
    expect(leadOf(rec)).not.toContain(CATCHUP_LEAD);
  });

  // The controls. Each of these IS owed a dose, by the same three documents,
  // and must not be swept up by the fix.
  const stillOwed = [
    ['3 doses all before 12 months (2/4/6) — Table 2 says dose 4 is necessary', 30, [2, 4, 6]],
    ['2 doses before 12 months (3/5) — dose 3 is the final dose', 30, [3, 5]],
    ['1 dose at 14 months only — the owner\'s "single 12–23 month dose"', 30, [14]],
    ['1 dose at 5 months plus 1 at 14 months — two doses is not enough here', 30, [5, 14]],
    ['no doses at all', 30, []],
  ];

  it.each(stillOwed)('CONTROL %s — still owed a dose', (_label, ageMonths, doseAges) => {
    const rec = pcvCard(healthyChild(ageMonths, doseAges));
    expect(leadOf(rec)).toContain(CATCHUP_LEAD);
    expect(rec.status).not.toBe('complete');
  });

  it('a single dose at 25 months was already complete and stays complete', () => {
    expect(pcvCard(healthyChild(30, [25])).status).toBe('complete');
  });

  // "Interval validity matters" — the owner's third sentence. Two doses in the
  // second year only finish the series when they are properly spaced, and the
  // existing 8-week floor (plus CDC's 4-day grace) is what decides it.
  it.each([
    [30, false],
    [51, false],
    [52, true],
    [56, true],
    [61, true],
  ])('two doses %i days apart at 14 months: complete=%s', (gapDays, expectComplete) => {
    const dob = dobForAgeMonths(30);
    const first = onBirthdayMonth(dob, 14);
    const result = recommend({
      dob,
      today: TODAY,
      riskIds: [],
      ppsv23Doses: [],
      pcvDoses: [
        { product: 'PCV13', date: first },
        { product: 'PCV13', date: plusDays(first, gapDays) },
      ],
    });
    const rec = pcvCard(result);
    // Below the floor the second dose does not count, so the child is the
    // owner's "single 12–23 month dose" and is owed one more.
    expect(result.meta.pcvCount).toBe(expectComplete ? 2 : 1);
    expect(rec.status === 'complete').toBe(expectComplete);
  });

  // An undated dose cannot be placed in the 12–23 month window, so it must not
  // buy a child out of the catch-up dose. The engine's standing policy is that
  // an undated historical dose is assumed to be an infant dose; this keeps it.
  it('an undated dose plus one at 14 months is still owed a dose', () => {
    const dob = dobForAgeMonths(30);
    const result = recommend({
      dob,
      today: TODAY,
      riskIds: [],
      ppsv23Doses: [],
      pcvDoses: [
        { product: 'PCV13', date: null },
        { product: 'PCV13', date: onBirthdayMonth(dob, 14) },
      ],
    });
    expect(leadOf(pcvCard(result))).toContain(CATCHUP_LEAD);
  });

  // The blast radius, pinned. If a later change moves either number, it moved
  // patients, and the PR has to say which.
  //
  // The second count re-derives the new branch's own condition from the
  // EFFECTIVE dose list rather than reading the card, so it counts patients and
  // not prose — and so it cannot be satisfied by a child who was already
  // complete for one of the two older reasons. A first attempt at this keyed on
  // "3 dose rows and status complete" and returned 17, five of which were
  // already complete before the fix via the ≥24-month dose.
  it('exactly 12 grid cards leave the catch-up card, and 132 stay', () => {
    let onCatchupCard = 0;
    let secondYearSeries = 0;

    for (const c of buildCases()) {
      let result;
      try { result = recommend(c.input); } catch { continue; }
      if (result.excluded) continue;
      for (const rec of result.recs ?? []) {
        if (leadOf(rec).startsWith(CATCHUP_LEAD)) onCatchupCard++;
      }

      const { ageMonths: am, dob, today, riskIds } = result.meta;
      if (am < 24 || am >= 60) continue;
      // "Healthy" has to be asked the way the ENGINE asks it, not as
      // `riskIds.length === 0`. Of the 12 cards, 4 carry no risk factor, 4 carry
      // `smoking` and 4 carry `alcoholism` — adult-only indications that are not
      // paediatric pneumococcal risk conditions, so `populationOf` calls all 12
      // children `child-routine` and the engine sends them down the healthy
      // path. Filtering on an empty risk list found only 4 of them.
      if (populationOf(am, riskIds ?? []) !== 'child-routine') continue;
      const effective = analyzeBoth({
        pcvDoses: (c.input.pcvDoses ?? []).filter(Boolean),
        ppsv23Doses: (c.input.ppsv23Doses ?? []).filter(Boolean),
        ageMonths: am, today, dob, riskIds,
      }).pcv.effective ?? [];
      if (effective.length < 2) continue;
      const atDose = effective.map((d) => (d.date ? ageAtDoseFromDate(d, am, today, dob) : null));
      const allInSecondYear = atDose.every((a) => a !== null && a >= 12 && a < 24);
      if (!allInSecondYear) continue;

      secondYearSeries++;
      expect(pcvCard(result).status, 'a second-year series is complete').toBe('complete');
    }

    expect(onCatchupCard).toBe(132);
    expect(secondYearSeries).toBe(12);
  });
});
