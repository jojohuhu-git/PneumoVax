// ─────────────────────────────────────────────────────────────────────────
// regression-s7-never-event-dose-numbering.test.js — S7, re-scoped (2026-10-16).
//
// ── What S7 originally asked for ─────────────────────────────────────────
//
// peds audit finding (2026-10-10): a healthy 6-month-old with four
// correctly-spaced PCV20 doses could be told "PCV dose 5 of 4" — a dose
// number greater than the series total it is counted against, which cannot
// be right under any reading. The audit's suggested fix: "a never-event
// sweep assertion for S7: no rec label may ever state a dose number greater
// than its series total." P0-2 (2026-10-10, same day) fixed the root cause
// (`recommend.js`'s `if (prior >= target && !boosterGiven) target = prior + 1`)
// and added a 70-case hand-written matrix
// (`regression-p0-2-peds-series-total-and-interval.test.js`) that checks
// this for the infant/early-childhood band only.
//
// ── Why this file exists on top of that ──────────────────────────────────
//
// `src/test-grid.js`'s own header has carried an open line since S8
// (2026-10-11): "the four invariant sweeps that S7 still owes (never-events,
// two-run relations, dose-counter, and the grid-covers-the-app guard) must
// be built on THIS grid." The grid-covers-the-app guard was built
// (`sweep-verdict-corpus.test.js`'s "covers every risk factor... and every
// product"). This is the never-events sweep — across the FULL real-patient
// grid (17,342 cases; 16,250 before this item widened `GRID_PCV_HISTORIES`
// with a 4-dose infant pattern the grid had none of) and the impossible-
// record grid (19,123; 18,460 before), not just the hand-picked 70 cases,
// and for every vaccine (PCV AND PPSV23), not just PCV.
//
// It cannot be folded into `sweep-verdict-corpus.test.js` itself: that
// corpus deliberately excludes `doseLabel` prose (see `test-grid.js`'s "Why
// there is no prose in a verdict") so a copy edit does not turn the whole
// grid red. This file calls `recommend()` directly and reads `doseLabel`,
// the one place "N of M" is rendered — it is a correctness check, not a
// change-detector, and does not touch the committed corpus file at all.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases, buildRecordProblemCases } from '../../test-grid.js';

// Matches every "<vaccine> dose N of M" phrasing the engine currently
// produces (`recommend.js` lines ~412 and ~559 as of this writing — infant
// catch-up and the at-risk catch-up path).
const DOSE_OF_RE = /dose (\d+) of (\d+)/i;

/** Every dose-number violation across one set of grid cases, with context. */
function neverEventViolations(cases) {
  const violations = [];
  for (const c of cases) {
    const result = recommend(c.input);
    if (result.excluded) continue;
    for (const rec of result.recs ?? []) {
      const m = DOSE_OF_RE.exec(rec.doseLabel || '');
      if (!m) continue;
      const [, doseNum, total] = m.map(Number);
      if (doseNum > total) {
        violations.push({ key: c.key, vaccine: rec.vaccine, doseLabel: rec.doseLabel });
      }
    }
  }
  return violations;
}

// Measured: reverting the P1-2/P0-2 fix (commenting out
// `if (prior >= target && !boosterGiven) target = prior + 1;` in
// `recommend.js`) and restoring it afterwards with a backup copy, never
// `git checkout` — fails 36 of 17,342 real-patient cases and 72 of 19,123
// impossible-entry cases, all "PCV dose 5 of 4" on a 6-month-old with four
// PCV20 doses, each 28 days apart. Both grids needed a 4-dose infant PCV
// history added to `GRID_PCV_HISTORIES` for this file to be able to see it
// at all — the grid had none wider than three.
describe('S7 — never-event sweep: no rec label states a dose number greater than its series total', () => {
  it('holds across all 17,342 real-patient grid cases', () => {
    const cases = buildCases();
    const violations = neverEventViolations(cases);
    expect(
      violations,
      `${violations.length} of ${cases.length} cases produced an impossible dose label `
      + `(e.g. "dose 5 of 4"):\n`
      + violations.slice(0, 8).map((v) => `  ${v.key} → ${v.vaccine} "${v.doseLabel}"`).join('\n')
      + (violations.length > 8 ? `\n  ... and ${violations.length - 8} more.` : '')
    ).toEqual([]);
  });

  it('holds across all 19,123 impossible-entry grid cases (before-birth and future-dated doses)', () => {
    const cases = buildRecordProblemCases();
    const violations = neverEventViolations(cases);
    expect(
      violations,
      `${violations.length} of ${cases.length} impossible-entry cases produced an impossible `
      + `dose label:\n`
      + violations.slice(0, 8).map((v) => `  ${v.key} → ${v.vaccine} "${v.doseLabel}"`).join('\n')
      + (violations.length > 8 ? `\n  ... and ${violations.length - 8} more.` : '')
    ).toEqual([]);
  });

  // Anti-vacuity: a sweep that never sees a "dose N of M" label at all would
  // pass this file forever regardless of whether the invariant holds —
  // exactly the shape of gap ANCHOR-1 and P0-2 exploited in the harnesses
  // that came before `test-grid.js`.
  it('the grid actually exercises "dose N of M" labels, both grids', () => {
    const realLabels = buildCases()
      .map((c) => recommend(c.input))
      .filter((r) => !r.excluded)
      .flatMap((r) => r.recs ?? [])
      .map((r) => r.doseLabel || '')
      .filter((l) => DOSE_OF_RE.test(l));
    expect(realLabels.length).toBeGreaterThan(100);

    const impossibleLabels = buildRecordProblemCases()
      .map((c) => recommend(c.input))
      .filter((r) => !r.excluded)
      .flatMap((r) => r.recs ?? [])
      .map((r) => r.doseLabel || '')
      .filter((l) => DOSE_OF_RE.test(l));
    expect(impossibleLabels.length).toBeGreaterThan(100);
  });
});
