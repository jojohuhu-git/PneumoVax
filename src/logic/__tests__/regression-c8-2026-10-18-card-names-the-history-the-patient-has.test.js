// FINDING G (2026-10-18) — a card must name the vaccine history the patient
// actually has, not the history of the nearest row the engine could find.
//
// WHY IT EXISTS. 336 cards told the clinician the child had "PCV13 only
// (at/after age 6)" when they had not. A 6-year-old with a cochlear implant and
// one PCV15 dose at age 4 read:
//
//   "At-risk non-immunocompromising child 6-18 years with PCV13 only (at/after
//    age 6): Option A - 1 dose of PCV20 >=8 weeks after the most recent PCV13."
//
// No PCV13, and the dose was at age 4. A second group, 32 cards, read "the
// at-risk catch-up for a child 24-71 months who had 3 PCV doses before 24
// months" where p2016's row is labelled "3 doses of PCV, all before 12 months"
// and all three doses were given at 16, 18 and 20 months.
//
// In both groups the DOSE was defensible; the sentence describing who the
// advice is for was about a different child. That is the fault C6/G4 exist to
// catch, and `recommend.js` had already named it twice in its own comments
// (the 24-71mo block writes its own cards rather than reuse these rows, "which
// would be a true sentence about somebody else"; and the IC fix of 2026-10-17
// rescued one group from this very row). It was never swept.
//
// WHY NO EXISTING TEST SAW IT. Both verdict corpora record a card's status,
// brands, dates and totals -- never its prose. 16,008 real patients and 17,652
// impossible ones stayed green while 368 cards described the wrong child.
//
// OWNER DECISIONS, 2026-10-18. Two patients were put to the owner and she gave
// the governing p2016 Table 4 row for each, verbatim:
//
//   1. "6-year-old with a cochlear implant, one PCV15 at age 4, no PPSV23 ...
//      should follow ... 2 through 18 years (non-IC only); Completed PCV series
//      before age 6 years with PCV13 and/or PCV15 (no PCV20, no PPSV23);
//      option A 1 dose of PCV20 at least 8 weeks after most recent PCV dose,
//      option B 1 dose of PPSV23 at least 8 weeks after most recent PCV dose"
//
//   2. "24-month-old with asplenia and three PCV13 doses at 16, 18 and 20
//      months would follow the table in immunize.org table for 2 through 18
//      years (IC only); Completed PCV series before age 6 years with PCV13
//      and/or PCV15 (no PCV20, no PPSV23); option A 1 dose of PCV20 at least 8
//      weeks after most recent PCV dose, option B 1 dose of PPSV23 at least 8
//      weeks after most recent PCV dose; at least 5 years later, give 1 dose of
//      PCV20 or a second dose of PPSV23"
//
// Two things those rulings settle. A single conjugate dose before age 6 counts
// as "Completed PCV series before age 6 years" for this row's purpose; and the
// row's age band really is "2 through 18 years", so a 24-month-old reads it
// too -- the 24-71 month rows are not a ceiling.
//
// SOURCE, read live 2026-10-18 from
// https://www.immunize.org/wp-content/uploads/catg.d/p2016.pdf
// (HTTP 200, 211,252 bytes, "Item #P2016 (2/16/2024)"), Table 4, with
// `scripts/pdfLayout.py` so every cell is tied to its own row and column:
//
//   row | "2 through 18 years (non-IC only)" | "Completed PCV series before
//         age 6 years with PCV13 and/or PCV15 (no PCV20, no PPSV23)"
//         | A: "1 dose of PCV20 at least 8 weeks after most recent PCV dose"
//         | B: "1 dose of PPSV23 at least 8 weeks after most recent PCV dose"
//   row | "2 through 18 years (IC only)"     | same history
//         | A: same
//         | B: "1 dose of PPSV23 at least 8 weeks after most recent PCV dose;
//              at least 5 years later, give 1 dose of PCV20 or a second dose
//              of PPSV23"
//   row | "24 through 71 months (any risk condition)"
//         | "3 doses of PCV, all before 12 months" | A: "1 dose of PCV20 or
//           PCV15"
//   row | "24 through 71 months (any risk condition)"
//         | "Any incomplete schedule of 0, 1, or 2 PCV doses by age 24 months"
//         | A: "2 doses of PCV20 or PCV15, given at least 8 weeks apart"
//
// Note the two 24-71 month rows between them cover "0, 1, or 2 by 24 months"
// and "3, all before 12 months". A child with three doses given BETWEEN 12 and
// 24 months matches neither, which is why the owner sent that child to the
// "2 through 18 years" row instead.
//
// PROVED BY BREAKING THE CODE, 2026-10-18. The fix is three edits, so each was
// reverted on its own and this file re-run. Every revert is caught, and each by
// a DIFFERENT test -- no mutation slips through and no assertion here is spare:
//
//   reverted edit                                          caught by
//   -------------------------------------------------------------------------
//   rows-4/5 gate back to `pcv.count >= 3`                 part A (8+ breaches)
//   (the 336)                                              part D (240, not 112)
//                                                          + the cochlear-implant patient
//   24-71mo diversion dropped (`!matchesNoTable4Row`)      part B
//   (the 32)                                               + both 24-month patients
//   row-2 wording back to "before 24 months", routing      ONLY the hand-built
//   left fixed                                             "all before 12 months" control
//
// That last row is the one to read twice. Reverting the wording alone is
// INVISIBLE to part B's grid sweep, because the grid cannot express p2016 row
// 2's patient at all (see the GRID GAP note inside part B). It is caught only
// by the control patient built by hand below. A sweep over a grid with a hole
// in it is not a guard for what falls in the hole.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases, CORPUS_TODAY } from '../../test-grid.js';
import { addCalendarMonths, calendarMonthsBetween } from '../dateUtils.js';

/** Every note and dose label one patient is shown, as one searchable string. */
function proseOf(rec) {
  const note = typeof rec.note === 'string'
    ? rec.note
    : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' ');
  return `${note} ${rec.doseLabel ?? ''}`;
}

/** Ages in months at each recorded PCV dose, from dated doses only. */
function doseAges(input) {
  return input.pcvDoses
    .filter((d) => d.date)
    .map((d) => calendarMonthsBetween(input.dob, d.date));
}

// PCV7 never counts (CLAUDE.md), so it is not part of what a row describes.
const counting = (input) => input.pcvDoses.filter((d) => d.product !== 'PCV7');

describe('FINDING G - every card names the history its patient actually has', () => {
  // PART A. "PCV13 only (at/after age 6)" is p2016 Table 4 rows 8/9. A child
  // whose conjugate doses were all given BEFORE age 6 is described by rows 4/5
  // instead, per the owner's rulings above.
  it('never says "PCV13 only (at/after age 6)" to a child whose doses were all before age 6', () => {
    const breaches = [];
    let sawTheSentence = 0;

    for (const c of buildCases()) {
      let result;
      try { result = recommend(c.input); } catch { continue; }
      if (result.excluded) continue;

      for (const rec of result.recs ?? []) {
        if (!proseOf(rec).includes('PCV13 only (at/after age 6)')) continue;
        sawTheSentence += 1;
        const ages = doseAges(c.input);
        if (ages.length && ages.every((a) => a < 72)) {
          breaches.push(`${c.key}: doses at ${ages.map((a) => Math.round(a)).join(',')} mo`);
        }
      }
    }

    // Anti-vacuity. If the sentence vanished from the app entirely this
    // assertion would pass while testing nothing -- the same hazard as the
    // JOB_AID `label`/`short` mix-up of 2026-10-18 and `not.toContain` in the
    // stale-identifier guard. p2016 rows 8/9 are real rows that real patients
    // reach, so the sentence must still appear somewhere.
    expect(sawTheSentence).toBeGreaterThan(0);
    expect(breaches.slice(0, 8)).toEqual([]);
    expect(breaches).toHaveLength(0);
  });

  // PART B. p2016's row says "all before 12 months". The card said "before 24
  // months", which is a different row's patient (and no row's patient, for a
  // child whose three doses fell between 12 and 24 months).
  it('never claims a three-dose history to a child whose doses were not all before 12 months', () => {
    const breaches = [];
    const oldWording = [];
    let sawTheClaim = 0;

    for (const c of buildCases()) {
      let result;
      try { result = recommend(c.input); } catch { continue; }
      if (result.excluded) continue;

      for (const rec of result.recs ?? []) {
        const prose = proseOf(rec);
        // "who had 3 PCV doses ..." is row 2's own card. Note the deliberately
        // narrow needle: row 1's card says "fewer than 3 PCV doses by 24
        // months", which is a correct description of "0, 1, or 2 PCV doses by
        // age 24 months" and must not be caught here. A looser needle matched
        // all 976 of those and made this test fail on the wrong thing.
        if (prose.includes('3 PCV doses before 24 months')) {
          oldWording.push(c.key);
        }
        if (!prose.includes('who had 3 PCV doses')) continue;
        sawTheClaim += 1;
        const ages = doseAges(c.input);
        const allBefore12 = ages.length >= 3 && ages.every((a) => a < 12);
        if (!allBefore12) {
          breaches.push(`${c.key}: doses at ${ages.map((a) => Math.round(a)).join(',')} mo`);
        }
      }
    }

    // The pre-FINDING-G wording, gone from the app entirely. Measured 336 + 32
    // card instances before the fix; 0 after.
    expect(oldWording).toHaveLength(0);
    expect(breaches.slice(0, 8)).toEqual([]);
    expect(breaches).toHaveLength(0);

    // ⚠ GRID GAP, measured 2026-10-18 — and the reason the anti-vacuity check
    // for this half lives in the control test below instead of here.
    //
    // `buildCases()` cannot express p2016 row 2's patient. Of its 440 at-risk
    // 24–71-month cases with three or more counting doses, ZERO have all three
    // before 12 months: the grid's PCV histories are fixed day-offsets from
    // today, so at age 24 months those doses land at 17–22 months and at age
    // 60 months at 53–58 months. Nothing in the grid is ever a child who
    // finished an infant series and then turned two.
    //
    // So `sawTheClaim` is 0 here legitimately, and asserting it were positive
    // would fail on a grid gap rather than on an engine fault. The row is
    // instead proved live by "a child whose three doses WERE all before 12
    // months keeps p2016's 24–71 month row" below, which builds that patient
    // directly. Same shape as test-grid.js's FINDING D/E note: a grid that
    // cannot reach a case leaves that case guarded by nothing.
    expect(sawTheClaim).toBe(0);
  });

  // PART C. The owner's two patients, by name, with the row she named.
  // These are the control cases: part A and part B say what must NOT appear,
  // and could both be satisfied by an engine that said nothing at all.
  describe("the owner's two patients get the row she named", () => {
    const patient = ({ ageMonths, riskIds, pcv }) => {
      const dob = addCalendarMonths(CORPUS_TODAY, -ageMonths);
      return recommend({
        ageMonths,
        dob,
        today: CORPUS_TODAY,
        riskIds,
        pcvDoses: pcv.map(([product, mo]) => ({ product, date: addCalendarMonths(dob, mo) })),
        ppsv23Doses: [],
      });
    };

    it('6 years, cochlear implant, one PCV15 at age 4: Table 4 non-IC, Option A PCV20 and Option B PPSV23', () => {
      const r = patient({ ageMonths: 72, riskIds: ['cochlear_implant'], pcv: [['PCV15', 48]] });
      const prose = (r.recs ?? []).map(proseOf).join('\n');

      expect(prose).toContain('completed PCV13/15 before age 6');
      expect(prose).not.toContain('PCV13 only (at/after age 6)');

      const optionA = (r.recs ?? []).find((x) => x.doseLabel?.startsWith('Option A'));
      const optionB = (r.recs ?? []).find((x) => x.doseLabel?.startsWith('Option B'));
      expect(optionA?.brands).toEqual(['PCV20 (Prevnar 20)']);
      expect(optionB?.brands).toEqual(['PPSV23 (Pneumovax 23)']);
      // Non-IC: the single PPSV23 finishes it. No five-year follow-on.
      expect(proseOf(optionB)).not.toContain('5 years');
    });

    it('24 months, asplenia, three PCV13 at 16/18/20 months: Table 4 IC, Option B carries the five-year follow-on', () => {
      const r = patient({
        ageMonths: 24,
        riskIds: ['asplenia'],
        pcv: [['PCV13', 16], ['PCV13', 18], ['PCV13', 20]],
      });
      const prose = (r.recs ?? []).map(proseOf).join('\n');

      expect(prose).toContain('completed PCV13/15 before age 6');
      expect(prose).not.toContain('3 PCV doses before 24 months');

      const optionA = (r.recs ?? []).find((x) => x.doseLabel?.startsWith('Option A'));
      const optionB = (r.recs ?? []).find((x) => x.doseLabel?.startsWith('Option B'));
      // p2016's Option A for this row is PCV20 alone -- NOT "PCV20 or PCV15",
      // which is what the 24-71 month catch-up row offers and what these 32
      // children were being shown.
      expect(optionA?.brands).toEqual(['PCV20 (Prevnar 20)']);
      expect(optionB?.brands).toEqual(['PPSV23 (Pneumovax 23)']);
      expect(proseOf(optionB)).toContain('5 years');
    });

    it('the non-IC twin of that 24-month-old is offered no five-year follow-on', () => {
      const r = patient({
        ageMonths: 24,
        riskIds: ['chronic_heart'],
        pcv: [['PCV13', 16], ['PCV13', 18], ['PCV13', 20]],
      });
      const optionB = (r.recs ?? []).find((x) => x.doseLabel?.startsWith('Option B'));
      expect(optionB?.brands).toEqual(['PPSV23 (Pneumovax 23)']);
      expect(proseOf(optionB)).not.toContain('5 years');
    });

    it('a child whose three doses WERE all before 12 months keeps p2016\'s 24-71 month row', () => {
      // The control that stops part B over-reaching: p2016 really does have a
      // row for this child -- "3 doses of PCV, all before 12 months" -> "1
      // dose of PCV20 or PCV15" -- and it must not be rerouted.
      const r = patient({
        ageMonths: 36,
        riskIds: ['asplenia'],
        pcv: [['PCV13', 2], ['PCV13', 4], ['PCV13', 6]],
      });
      const prose = (r.recs ?? []).map(proseOf).join('\n');
      expect(prose).toContain('24–71 months');
      expect(prose).toContain('all before 12 months');
    });
  });

  // PART D. The residue — now CLOSED, and kept as a zero rather than deleted.
  //
  // FINDING G fixed the AGE half of rows 8/9's label and left the PRODUCT half
  // open, pinned at 112. Measured 2026-10-18, over this grid:
  //
  //   cards whose text says "PCV13 only (at/after age 6)"   448 before -> 224 after
  //     of those, the history really is PCV13 only at/after 6   112 -> 112
  //     of those, the history is something else                 336 -> 112
  //
  // Each of those 112 was age-correct and product-wrong: the dose at or after
  // age 6 was PCV15 (64 cards), of unrecorded product (32), or PCV15 with a
  // same-day PCV20 the engine rejected (16). The owner settled it the same day
  // — "PCV13 and PCV15 are interchangeable when assessing how to move forward
  // in the schedule", and an unrecorded product "cannot be assumed" to be a
  // PCV20 — so FINDING H names the product the patient actually got and cites
  // ACIP's interchangeability sentence where a PCV13-worded row is being used.
  // 112 -> 0.
  //
  // This assertion stays at 0 instead of being removed. `toBe(0)` is a real
  // guard here and not a tautology, because part A's needle and this one differ:
  // part A asks whether the AGE claim is true, this one whether the PRODUCT
  // claim is. The sweep in
  // `regression-finding-h-2026-10-18-card-names-the-product-given.test.js`
  // covers the whole class; this keeps FINDING G's own number honest.
  it('the 112 cards that named a product the patient did not receive are now 0', () => {
    let mismatched = 0;
    for (const c of buildCases()) {
      let result;
      try { result = recommend(c.input); } catch { continue; }
      if (result.excluded) continue;
      for (const rec of result.recs ?? []) {
        if (!proseOf(rec).includes('PCV13 only (at/after age 6)')) continue;
        if (!counting(c.input).every((d) => d.product === 'PCV13')) mismatched += 1;
      }
    }
    expect(mismatched).toBe(0);
  });
});
