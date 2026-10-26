// THE ALL-COLUMNS GUARD (OWNER RULE, 2026-10-18) — if a card carries
// immunize.org p2016, p2016 must have a row whose every column fits that
// patient.
//
//   "If using p2016 tables, all columns need to fit patient criteria in order
//    to use recommendations."                              — owner, 2026-10-18
//
// WHY A TEST AND NOT A PROMISE. The owner asked whether these citation calls
// could be made without walking through each case, and agreed they could on
// three conditions: the dose never changes, three named situations always come
// back to her, and the rule is PAIRED WITH A MACHINE GUARD. This is that guard.
// The reason she asked for one is on the record: FINDING F had six removals
// approved on a reading that never opened mm7401a1's clinical guidance table,
// and five of the six sentences turned out to be in it — 1,594 cards lost a
// citation they were entitled to. And of the five column-fit predicates written
// by hand during the 2026-10-18 audit, three were wrong, caught only by
// re-running them against patients built one at a time. A promise is not a
// guard.
//
// WHAT IT CHECKS, and what it cannot. It checks the two columns a clinician
// reads p2016's tables by — "Child's age now" and the vaccination-history
// column — plus the risk class the row is headed with. It CANNOT re-read
// immunize.org, so the row inventory below is a human transcription, and its
// provenance is what makes it trustworthy: p2016 was downloaded live 2026-10-18
// (HTTP 200, 211,252 bytes, Item #P2016 of 2/16/2024) and laid out with
// `scripts/pdfLayout.py`, which keeps every cell tied to its own row and column
// precisely so a column cannot be read off the wrong row. Every row of all five
// tables is listed, including the ones no card reaches.
//
// p2016's ROW INVENTORY, transcribed cell by cell from that layout:
//
//   Table 1 — "all children (healthy and those with risk conditions) age 2
//             through 23 months", keyed on age now and number of previous
//             PCV13/PCV15/PCV20 doses. Every child in that age band has a row.
//   Table 2 — "HEALTHY children age 24 months through 18 years":
//               24-59 months | completed any PCV schedule        -> none
//               24-59 months | no previous / incomplete by 24 mo -> 1 dose
//               5-18 years   | no previous / incomplete by 24 mo -> none
//   Table 3 — the risk-condition lists. States no schedule, so no row.
//   Table 4 — at-risk children 24 months through 18 years:
//               24-71 months (any risk) | 0, 1, or 2 PCV doses by age 24 months
//               24-71 months (any risk) | 3 doses of PCV, all before 12 months
//               2-18 years   (any risk) | completed before age 6 INCLUDING >=1 PCV20
//               2-18 years   (non-IC)   | completed before age 6 with PCV13 and/or PCV15
//               2-18 years   (IC)       | completed before age 6 with PCV13 and/or PCV15
//               6-18 years   (non-IC)   | no previous dose of PCV13, PCV15, or PCV20
//               6-18 years   (IC)       | no previous dose of PCV13, PCV15, or PCV20
//               6-18 years   (non-IC)   | PCV13 only, given at or after age 6 years
//               6-18 years   (IC)       | PCV13 only, given at or after age 6 years
//   Table 5 — post-HSCT. Unreachable: ticking the transplant row hard-stops the
//             engine (`excluded: true`, `recs: []`), so no card exists to carry it.
//
// ONE ROW IS READ WIDER THAN IT IS PRINTED, by owner ruling and not by
// inference: "PCV13 only, given at or after age 6 years" also governs a child
// whose dose at that age was a PCV15 or of unrecorded product, because "PCV13
// and PCV15 are interchangeable when assessing how to move forward in the
// schedule" (owner, 2026-10-18) and an unrecorded product "cannot be assumed"
// to have been a PCV20. That is ACIP's own sentence, cited on those cards as
// `pedsPcv13Pcv15Interchangeable`. Without this the guard would demand the app
// take p2016 off 720 cards it legitimately speaks for — the FINDING F failure
// mode, pointed the other way.
//
// MEASURED when written: 7,371 card instances carry the p2016 chip and 0 of them
// lack a fitting row. Before FINDING J, 864 did — reverting FINDING J fails this
// test, which is how it was shown to bite.
//
// (!) WHAT IT DOES NOT CATCH, established by trying it rather than reasoned
// about. Reverting FINDING I leaves this test GREEN. The reason is in the shape
// of the question it asks: "does p2016 have SOME row whose columns fit this
// patient", not "does the row the card actually used fit this patient". A
// teenager with three dated PCV13 doses at 16 is described by p2016's
// at/after-6 row, so a row exists and the guard is satisfied — even while the
// card in front of the clinician is reading them the before-6 row instead.
//
// That boundary is worth being plain about, because it is the difference
// between the two faults this repo keeps finding:
//   • wrong DOCUMENT on a card  — caught here (FINDING J, FINDING F's reverse)
//   • wrong ROW of a document that does cover the patient — NOT caught here;
//     guarded per finding, by `regression-finding-i-...`, `regression-finding-h-...`
//     and `regression-c8-2026-10-18-card-names-the-history-the-patient-has`.
// Closing the second one generally would mean the engine recording WHICH row it
// used, which it does not do today. Recorded rather than quietly implied.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { calendarMonthsBetween } from '../dateUtils.js';
import { pedsRiskRowClass } from '../../data/riskFactors.js';
import { ADULT_SCHED_MIN_M } from '../scheduleConstants.js';

/**
 * The patient, described in p2016's own columns.
 *
 * Built from the ENGINE's accepted doses, not the raw input: a PCV7 never
 * counts and a rejected dose is not a dose any row is written about, so reading
 * the input array would describe a different patient than the card does.
 */
function asP2016Columns(c, res) {
  const counted = (res.orderedDoses?.pcv ?? [])
    .map((d, i) => ({ d, v: res.perDose?.pcv?.[i] }))
    .filter(({ v }) => v && v.status !== 'invalid' && v.status !== 'noncounting')
    .map(({ d }) => d);
  const dated = counted.filter((d) => d.date).map((d) => calendarMonthsBetween(c.input.dob, d.date));
  return {
    ageMonths: c.input.ageMonths,
    // `pedsRiskRowClass` returns null when the only ticked conditions are
    // adult-only ones (smoking, alcohol use). Such a child is NOT at risk for
    // the paediatric tables (P3-9b), so they read Table 2 as a healthy child.
    riskClass: pedsRiskRowClass(c.input.riskIds) ?? 'healthy',
    doses: counted.length,
    datedAges: dated,
    allDatedAndBefore72: counted.length > 0 && dated.length === counted.length && dated.every((a) => a < 72),
    hasCompletingProduct: counted.some((d) => d.product === 'PCV20' || d.product === 'PCV21'),
    dosesBefore24: dated.filter((a) => a < 24).length,
  };
}

/** Every row p2016 prints, as a predicate over those columns. */
const P2016_ROWS = [
  ['T1: all children, age 2 through 23 months',
    (p) => p.ageMonths >= 2 && p.ageMonths < 24],
  ['T2: healthy, 24 through 59 months',
    (p) => p.riskClass === 'healthy' && p.ageMonths >= 24 && p.ageMonths < 60],
  ['T2: healthy, 5 through 18 years',
    (p) => p.riskClass === 'healthy' && p.ageMonths >= 60 && p.ageMonths < ADULT_SCHED_MIN_M],
  ['T4: 24-71 months, any risk, 0/1/2 PCV doses by age 24 months',
    (p) => p.riskClass !== 'healthy' && p.ageMonths >= 24 && p.ageMonths < 72 && p.dosesBefore24 <= 2],
  ['T4: 24-71 months, any risk, 3 doses all before 12 months',
    (p) => p.riskClass !== 'healthy' && p.ageMonths >= 24 && p.ageMonths < 72
      && p.doses >= 3 && p.datedAges.length === p.doses && p.datedAges.every((a) => a < 12)],
  ['T4: 2-18 years, any risk, completed before age 6 including a PCV20',
    (p) => p.riskClass !== 'healthy' && p.ageMonths >= 24 && p.allDatedAndBefore72 && p.hasCompletingProduct],
  ['T4: 2-18 years, non-IC, completed before age 6 with PCV13 and/or PCV15',
    (p) => p.riskClass === 'nonIC' && p.ageMonths >= 24 && p.allDatedAndBefore72 && !p.hasCompletingProduct],
  ['T4: 2-18 years, IC, completed before age 6 with PCV13 and/or PCV15',
    (p) => p.riskClass === 'IC' && p.ageMonths >= 24 && p.allDatedAndBefore72 && !p.hasCompletingProduct],
  ['T4: 6-18 years, non-IC, no previous PCV13/PCV15/PCV20',
    (p) => p.riskClass === 'nonIC' && p.ageMonths >= 72 && p.doses === 0],
  ['T4: 6-18 years, IC, no previous PCV13/PCV15/PCV20',
    (p) => p.riskClass === 'IC' && p.ageMonths >= 72 && p.doses === 0],
  // The two rows read wider than printed, per the owner's interchangeability
  // ruling — see the header. `!hasCompletingProduct` keeps them away from the
  // PCV20 row above, exactly as p2016 keeps "PCV13 only" away from "including
  // one or more doses of PCV20".
  ['T4: 6-18 years, non-IC, conjugate (PCV13/PCV15/unrecorded) at or after age 6',
    (p) => p.riskClass === 'nonIC' && p.ageMonths >= 72 && p.doses >= 1
      && !p.hasCompletingProduct && p.datedAges.some((a) => a >= 72)],
  ['T4: 6-18 years, IC, conjugate (PCV13/PCV15/unrecorded) at or after age 6',
    (p) => p.riskClass === 'IC' && p.ageMonths >= 72 && p.doses >= 1
      && !p.hasCompletingProduct && p.datedAges.some((a) => a >= 72)],
];

describe("every card citing p2016 has a p2016 row whose columns all fit", () => {
  it('holds for every patient on the grid', () => {
    const noRowFits = new Map();
    let carrying = 0;

    for (const c of buildCases()) {
      let result;
      try { result = recommend(c.input); } catch { continue; }
      if (result.excluded) continue;

      const p = asP2016Columns(c, result);
      for (const rec of result.recs ?? []) {
        if (!(rec.citations ?? []).some((x) => x.short === 'immunize.org p2016')) continue;
        carrying += 1;
        if (P2016_ROWS.some(([, fits]) => fits(p))) continue;
        const key = `age ${p.ageMonths}mo, ${p.riskClass}, ${p.doses} dose(s) at [${p.datedAges.map((a) => Math.round(a)).join(',')}]mo, PCV20=${p.hasCompletingProduct}`;
        noRowFits.set(key, (noRowFits.get(key) ?? 0) + 1);
      }
    }

    // Anti-vacuity. If p2016 stopped appearing on any card at all, or if the
    // engine stopped producing cards, the assertion below would pass while
    // checking nothing — the hazard this repo has been bitten by more than once.
    //
    // PINNED EXACTLY rather than floored, since C9 (2026-10-23). C8/C9 take
    // p2016 off cards it does not speak for, so this number DECLINES as the
    // queue is worked, and a floor silently absorbs each drop until one day it
    // does not. An exact pin makes every change to p2016's footprint a visible
    // edit with a reason beside it — the same discipline as the row-inventory
    // length pinned below. Measured history:
    //
    //   7,371  before C9-3 (2026-10-23)
    //   6,511  after C9-3 removed the "complete because PPSV23 was given"
    //          cards (840 + 20)
    //   4,927  after C9-4 removed the healthy 5–18 "not indicated" card
    //          (1,584), under the owner's "cite CDC; p2016 only if you cannot"
    //   3,294  after C10-1 (2026-10-23) — 1,633 cards, the last of p2016's
    //          uncredited statements. Three groups, all measured, not
    //          estimated: 1,072 at-risk Option A/B cards whose claim CDC's
    //          notes state in full and already cite by number; 429 routine
    //          4-dose infant cards, which quote CDC's "4-dose series at 2, 4,
    //          6, 12–15 months" verbatim; and 132 five-dose cards, which
    //          Table 1 has no row for at all (its prior-dose column stops at
    //          "2 or 3 before age 12 months"). The 781 infant cards that state
    //          a total of 2 or 3 KEEP p2016 and are now cited to the Table 1
    //          row they key on — CDC's notes cannot carry that number, since
    //          they punt: "For other catch-up guidance, see Table 2."
    //
    //   3,459  after C10-2 (2026-10-23) — ADDED 165, the first rise in this
    //          number rather than a fall. The card now states its INTERVAL as
    //          well as its total, and on a 7-11-month-old with two doses before
    //          7 months the interval is p2016's: her total comes to exactly 4,
    //          so CDC's routine sentence keeps the total and p2016 Table 1's
    //          "1 or 2 before age 7 months" row ("1 dose 8 weeks after most
    //          recent dose") carries the spacing. CDC's catch-up table says 4
    //          weeks for her and OWNER RULING A ranks p2016 above it. These are
    //          cards p2016 SPEAKS for, so this is the FINDING F direction — a
    //          document present where it has a fitting row — not a regression
    //          of C10-1, whose claim was about the total and still holds.
    //
    //   3,403  after the 2026-10-25 swap — REMOVED 56. CDC/ACIP's 2023
    //          PCV20-in-children report, Table 1, states the whole claim on
    //          the "PCV complete (includes PCV20)" card for a child who
    //          completed before age 6 with NO counting PPSV23: "No additional
    //          doses of any pneumococcal vaccine are indicated." The owner,
    //          shown that card and what it cited, chose to swap p2016 out for
    //          it. ⚠️ NOT a FINDING F removal: p2016's row fits and was
    //          re-read live the same day — it is ranked below CDC where both
    //          speak, her standing rule of 2026-10-23. The 40 sibling cards
    //          where a PPSV23 HAS been given keep p2016, because CDC's branch
    //          there is headed "but have not received PPSV23" and p2016's row
    //          carries no such condition. 40 + 56 = the 96 that
    //          `regression-finding-j-...` used to pin as one bucket.
    //
    // If this fails, do not edit the number until you can say which cards moved
    // and why — then edit it and add the line.
    // +128, 2026-10-25 (the PPSV23-then-PCV floor): a child's conjugate
    // given inside 8 weeks of a PPSV23 is set aside, so she has one fewer
    // counting conjugate and her card family changes with it. The invariant
    // beside this count is unchanged. CLINICAL_SPEC.md §K-PPSV23THENPCV.
    expect(carrying).toBe(3403 + 128);
    expect([...noRowFits.entries()].slice(0, 8)).toEqual([]);
    expect([...noRowFits.values()].reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('the inventory covers every row of every table, Table 5 excepted and why', () => {
    // Pinned so that adding a row to the inventory — which is the one way to
    // make this guard accept a card it should reject — is a visible edit with a
    // transcription to check it against, rather than a quiet widening. Same
    // reason the spanning-population list is pinned by name.
    expect(P2016_ROWS).toHaveLength(12);
    expect(P2016_ROWS.map(([name]) => name.slice(0, 3))).toEqual([
      'T1:', 'T2:', 'T2:', 'T4:', 'T4:', 'T4:', 'T4:', 'T4:', 'T4:', 'T4:', 'T4:', 'T4:',
    ]);
    // Table 5 is post-HSCT and has no row here because ticking the transplant
    // box stops the engine outright: no cards, so nothing to cite.
    const hsct = recommend({
      ageMonths: 120,
      dob: '2016-10-18',
      today: '2026-10-18',
      riskIds: ['hct_cart_bcell_exclude'],
      pcvDoses: [],
      ppsv23Doses: [],
    });
    expect(hsct.excluded).toBe(true);
    expect(hsct.recs).toEqual([]);
  });
});
