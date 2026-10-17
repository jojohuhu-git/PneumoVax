// IC/non-IC twins (2026-10-17) — the gate the owner asked for after IC-1.
//
// WHY IT EXISTS. Three paediatric branches told an immunocompromised child
// "complete" where CDC and immunize.org still offer a dose, and 92 cards were
// affected before anyone noticed. Nothing in the suite could see it: both
// verdict corpora record a card's `status` and `brands`, so "complete" with no
// brands is a committed, green line, and neither corpus asks whether
// `complete` is the RIGHT answer for the risk class.
//
// The owner's instruction was a test that re-runs each patient with the risk
// condition swapped between immunocompromising and non-immunocompromising and
// fails if the immunocompromised one ever gets LESS. That is PART A below.
//
// ⚠ PART A ALONE WOULD NOT HAVE CAUGHT IC-1, and it is worth being plain about
// that. In the bug, the non-IC answer was CORRECT — a non-IC child with one
// PPSV23 really is complete (p2016 footnote §) — so both twins read "complete"
// and the comparison between them was in order. What was wrong was the IC
// child measured against the SOURCE, not against their twin.
//
// So part B states the asymmetry itself, as the documents state it: an IC
// child who has had exactly one PPSV23 and no counting PCV20 is not finished.
// Part A guards the general shape (a future change must never make the IC
// schedule smaller than the non-IC one); part B guards the specific rule that
// actually broke. Both sweep the whole grid rather than a handful of fixtures.
//
// SOURCES (read live 2026-10-17, quoted in
// `regression-2026-10-17-ic-child-with-ppsv23-is-not-complete.test.js`, which
// carries the full citations):
//   p2016 Table 4 footnote §  (non-IC): "If PPSV23 previously given, then
//     child is complete."
//   p2016 Table 4 footnote || (IC): "...options are (a) give one dose of PCV20
//     at least 8 weeks after most recent pneumococcal vaccination, or (b) give
//     a second dose of PPSV23 five years after the first dose of PPSV23."
//   CDC child notes, IC, Age 2-5 and Age 6-18: "If PPSV23 is used, administer
//     1 dose of PCV20 or dose 2 PPSV23 at least 5 years after dose 1 PPSV23".
//
// PROVED BY BREAKING THE CODE. A guard that catches nothing looks exactly like
// a guard that works, so each half was run against a deliberately broken
// engine. Measured 2026-10-17 over this grid: 650 twin pairs, of which 191
// meet part B's filter (IC, exactly one PPSV23 the engine accepted, no PCV20).
//
//   engine state                                   part A        part B
//   ---------------------------------------------------------------------
//   as shipped                                     0 breaches    0 breaches
//   `pedsPostSeriesDoseDone` -> `ppsv.count >= 1`
//   (revert IC-1: treat IC like non-IC)            0 breaches    FAILS, 26
//   swap it: `isIC ? >= 1 : >= 2`
//   (give the IC child LESS than their twin)       FAILS, 3      FAILS, 26
//   `ppsv.count >= 2` for BOTH classes
//   (over-fix: a non-IC child never finishes)      0 breaches    0 breaches
//
// Two things that table says plainly:
//   - reverting the actual bug is invisible to part A and caught only by part
//     B, which is why the owner's twin comparison was not enough on its own;
//   - the over-fix in the last row is caught by neither, and is held instead
//     by the controls in `regression-2026-10-17-ic-child-with-ppsv23-is-not-
//     complete.test.js` ("a non-IC child needs only the one PPSV23") and by
//     part B's own second test below. That is the honest limit of this file.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import {
  GRID_AGES_MONTHS, GRID_PCV_HISTORIES, GRID_PPSV23_HISTORIES, CORPUS_TODAY,
} from '../../test-grid.js';
import { addCalendarMonths, addDays } from '../dateUtils.js';
import { pedsRiskRowClass } from '../../data/riskFactors.js';

// One tick from each of CDC's two paediatric lists. Both are real paediatric
// risk conditions, neither is adultOnly, and both put a child on the at-risk
// pathway — so the ONLY difference between the twins is which list the
// condition sits on.
const IC = ['asplenia'];
const NON_IC = ['chronic_heart'];

// Sanity: if these two ever stop being an IC/non-IC pair, every assertion
// below would still pass while comparing nothing. Pin it.
describe('the twins really are one of each', () => {
  it('asplenia is IC and chronic heart disease is non-IC', () => {
    expect(pedsRiskRowClass(IC)).toBe('IC');
    expect(pedsRiskRowClass(NON_IC)).toBe('nonIC');
  });
});

const CHILD_MAX_M = 228;   // ADULT_SCHED_MIN_M; above this the adult rulebook runs

/** Every child-aged history in the grid, as a pair of otherwise-identical patients. */
function* twins() {
  for (const ageMonths of GRID_AGES_MONTHS) {
    if (ageMonths >= CHILD_MAX_M) continue;
    const dob = addCalendarMonths(CORPUS_TODAY, -ageMonths);
    for (const pcvPattern of GRID_PCV_HISTORIES) {
      for (const ppsvPattern of GRID_PPSV23_HISTORIES) {
        const offsets = [...pcvPattern.map(([, d]) => d), ...ppsvPattern];
        // Skip histories the patient could not have had (dose before birth);
        // those belong to the record-problem corpus, not here.
        if (offsets.some((d) => addDays(CORPUS_TODAY, -d) < dob)) continue;
        const base = {
          ageMonths,
          dob,
          today: CORPUS_TODAY,
          pcvDoses: pcvPattern.map(([product, d]) => ({ product, date: addDays(CORPUS_TODAY, -d) })),
          ppsv23Doses: ppsvPattern.map((d) => ({ product: 'PPSV23', date: addDays(CORPUS_TODAY, -d) })),
        };
        yield {
          label: `a${ageMonths} P:${pcvPattern.map(([p, d]) => `${p || '?'}@${d}`).join(',')} S:${ppsvPattern.join(',')}`,
          ic: recommend({ ...base, riskIds: IC }),
          nonIc: recommend({ ...base, riskIds: NON_IC }),
          base,
        };
      }
    }
  }
}

/** A card that asks the clinician to do something, as against one that closes the case. */
const ACTIONABLE = new Set(['due', 'catchup', 'risk-based', 'shared-decision']);
const offered = (r) => (r.recs ?? []).filter((x) => ACTIONABLE.has(x.status)).length;
const finished = (r) => offered(r) === 0;

describe('PART A — an IC child is never offered less than their non-IC twin', () => {
  it('holds for every child history in the grid', () => {
    const breaches = [];
    let pairs = 0;
    for (const t of twins()) {
      pairs++;
      if (t.ic.excluded || t.nonIc.excluded) continue;
      if (offered(t.ic) < offered(t.nonIc)) {
        breaches.push(`${t.label}: IC offered ${offered(t.ic)}, non-IC offered ${offered(t.nonIc)}`);
      }
    }
    expect(pairs).toBeGreaterThan(500);   // the sweep actually swept
    expect(breaches, `IC child offered LESS than the non-IC twin:\n${breaches.slice(0, 20).join('\n')}`)
      .toEqual([]);
  });

  it('and is never finished while the non-IC twin still has something to do', () => {
    const breaches = [];
    for (const t of twins()) {
      if (t.ic.excluded || t.nonIc.excluded) continue;
      if (finished(t.ic) && !finished(t.nonIc)) breaches.push(t.label);
    }
    expect(breaches, `IC finished while non-IC twin is not:\n${breaches.slice(0, 20).join('\n')}`)
      .toEqual([]);
  });
});

describe('PART B — the asymmetry itself, as the sources state it', () => {
  // The rule part A cannot see, because here the non-IC twin is CORRECTLY
  // complete and only the IC child is wrong.
  it('an at-risk IC child with exactly one PPSV23 and no counting PCV20 is never finished', () => {
    const breaches = [];
    let examined = 0;
    for (const t of twins()) {
      if (t.ic.excluded) continue;
      // Count what the ENGINE accepted, not what was typed: a PPSV23 under its
      // 2-year minimum age, or a PCV20 inside an interval floor, does not
      // satisfy anything. `meta` carries the engine's own counts.
      const ppsvCount = t.ic.meta?.ppsv23Count ?? 0;
      if (ppsvCount !== 1) continue;
      const countingPcv20 = (t.ic.recs ?? []).length
        && t.base.pcvDoses.some((d) => d.product === 'PCV20' || d.product === 'PCV21');
      if (countingPcv20) continue;       // Table 4: a PCV20 completes either class
      examined++;
      if (finished(t.ic)) breaches.push(t.label);
    }
    expect(examined).toBeGreaterThan(50);   // the filter did not empty the sweep
    expect(breaches, `IC child with one PPSV23 and no PCV20 told they are finished:\n${breaches.slice(0, 20).join('\n')}`)
      .toEqual([]);
  });

  it('while the non-IC twin in that same position IS finished — footnote §', () => {
    // The control. Without it, "nobody is ever finished" would satisfy the
    // assertion above, and the app would nag every at-risk child forever.
    let finishedCount = 0;
    for (const t of twins()) {
      if (t.nonIc.excluded) continue;
      if ((t.nonIc.meta?.ppsv23Count ?? 0) !== 1) continue;
      if (finished(t.nonIc)) finishedCount++;
    }
    expect(finishedCount).toBeGreaterThan(20);
  });
});
