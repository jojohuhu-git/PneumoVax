// ─────────────────────────────────────────────────────────────────────────
// P0 (2026-10-12) — A VERDICT AND ITS DOSE TRAVEL TOGETHER.
//
// The bug: `validate.js` sorts doses into date order before grading them, so
// `perDose` comes back chronological. `Results.jsx` handed `RecCard` the RAW
// state arrays — the order the clinician typed them — alongside `perDose`,
// and the two were paired BY INDEX. Type the newest dose first and every
// verdict lands on the wrong row: a good PCV20 reads "does not count", a
// PCV7 reads "Dose 1".
//
// The fix is structural, not a sort in the component. The walk now records
// each dose at the same entry point that produces its verdict
// (`stepStream`), so `doses[i]` IS the dose `perDose[i]` was computed for,
// and the engine hands both to the UI as `result.orderedDoses`. There is one
// ordering in the app and the component does not own it.
//
// WHAT THIS FILE GUARDS, that the UI test next door cannot:
//
//   1. The pairing holds for EVERY shape of history the grid can produce,
//      not just the two-dose case that was reported. `stepStream` has four
//      `perDose.push` sites and a dozen early returns; a future branch that
//      returns without pushing a verdict would silently shorten `perDose`
//      against `doses` and re-create the off-by-one on a different patient.
//      Asserted over all 16,250 synthetic patients.
//
//   2. The engine's ordering really is date order, independent of input
//      order — the premise the whole fix rests on.
//
//   3. `orderedDoses` is an ARRAY on the hard-stop path too, the shape P6-5
//      had to repair for `perDose` after it shipped as `{}`.
//
// MUTATION-TESTED (2026-10-12), per the repo rule that a guard is not done
// until it has been broken on purpose. Measured, not estimated:
//   • deleting `st.doses.push(dose)` from `stepStream`
//       → 3 of this file's 7 tests fail.
//   • returning the raw input order from the walk instead of the walked order
//       → 2 of this file's 7 tests fail.
//   • reverting `Results.jsx` to the raw state arrays
//       → 3 of the 5 tests in `regression-p0-row-order-ui.test.jsx` fail.
//         This file stays green, correctly: it pins the ENGINE contract, and
//         that mutation breaks only the component's use of it. The two files
//         are both needed — neither catches the other's mutation.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { buildCases, CORPUS_TODAY } from '../../test-grid.js';
import { recommend } from '../recommend.js';
import { analyzeBoth } from '../validate.js';

const CASES = buildCases({ today: CORPUS_TODAY });

describe('P0 — orderedDoses[i] is the dose perDose[i] was computed for', () => {
  it('the grid is the real one, not an empty sweep', () => {
    // The no-vacuous-assertion guard: every test below iterates CASES, so an
    // empty grid would make all of them pass while proving nothing. Pinned to
    // the grid's exact size rather than just ">0", so a grid shrinking back
    // toward empty is caught before it gets there.
    //
    // 17,342 from S7 (2026-10-16, which added a 4-dose infant PCV history)
    // until later the same day, when the transplant and CAR-T checkboxes
    // merged into one row: 13 single-risk profiles became 12, taking exactly
    // one profile's 1,334 cases with them. The two profiles had produced
    // identical answers since the transplant tick became a hard stop, so this
    // removed duplicate coverage, not real coverage.
    //
    // 17,016 from FINDING D/E (2026-10-17), which added the four-dose PCV13
    // infant history: the grid's only completed infant series was four doses
    // of PCV20, a child who needs nothing further at any age, so it could not
    // express an at-risk baby whose finished series still owes a dose at age
    // 2. +1,008 real patients and +612 impossible entries; zero existing
    // patients' answers changed (checked key by key, not by the "moved" count
    // the update script prints).
    expect(CASES.length).toBe(17016);
  });

  it('every patient gets exactly one dose beside every verdict', () => {
    const mismatches = [];
    for (const { key, input } of CASES) {
      const r = recommend(input);
      for (const stream of ['pcv', 'ppsv23']) {
        const verdicts = r.perDose?.[stream] ?? [];
        const doses = r.orderedDoses?.[stream] ?? [];
        if (verdicts.length !== doses.length) {
          mismatches.push(`${key} ${stream}: ${verdicts.length} verdicts, ${doses.length} doses`);
        }
      }
    }
    expect(mismatches.slice(0, 5)).toEqual([]);
    expect(mismatches.length).toBe(0);
  });

  it('every patient keeps all of their doses, and only their doses', () => {
    // Length agreement alone would be satisfied by handing back the input
    // array. This pins the CONTENT: the same dose objects, no additions, no
    // losses — only the order may differ.
    const wrong = [];
    for (const { key, input } of CASES) {
      const r = recommend(input);
      if (r.excluded) continue;
      const pairs = [
        ['pcv', input.pcvDoses ?? []],
        ['ppsv23', input.ppsv23Doses ?? []],
      ];
      for (const [stream, typed] of pairs) {
        const out = r.orderedDoses[stream];
        const fingerprint = (ds) =>
          ds.map((d) => `${d?.product ?? ''}@${d?.date ?? ''}`).sort().join('|');
        if (fingerprint(out) !== fingerprint(typed)) {
          wrong.push(`${key} ${stream}: ${fingerprint(out)} != ${fingerprint(typed)}`);
        }
      }
    }
    expect(wrong.slice(0, 5)).toEqual([]);
    expect(wrong.length).toBe(0);
  });

  it('the doses come back in date order, undated first', () => {
    const outOfOrder = [];
    for (const { key, input } of CASES) {
      const r = recommend(input);
      if (r.excluded) continue;
      for (const stream of ['pcv', 'ppsv23']) {
        const dates = r.orderedDoses[stream].map((d) => d?.date || '');
        for (let i = 1; i < dates.length; i++) {
          // '' (undated) sorts first, and '' < any ISO date lexicographically,
          // so one comparison covers both rules.
          if (dates[i - 1] > dates[i]) {
            outOfOrder.push(`${key} ${stream}: ${dates.join(' > ')}`);
            break;
          }
        }
      }
    }
    expect(outOfOrder.slice(0, 5)).toEqual([]);
    expect(outOfOrder.length).toBe(0);
  });

  it('typing the same history backwards changes nothing but the input', () => {
    // The bug in one assertion. The engine must give the identical ordered
    // answer whether the clinician entered oldest-first or newest-first.
    //
    // EXCEPT where one stream holds two doses on the SAME DAY. The walk's
    // sort is stable, so an undatable tie keeps whatever order it was given,
    // and reversing the input genuinely reverses which of the two is judged
    // first — a PCV15 recorded before a same-day PCV20 is a different history
    // from a PCV20 recorded before a same-day PCV15, and the app has no third
    // fact to break the tie with. That is the existing same-day convention
    // (ANCHOR-1, and S14-4C's same-visit work), not a defect this item opens.
    // Measured below so the exclusion can never quietly swallow the grid.
    const sameDay = (ds) => {
      const dates = (ds ?? []).map((d) => d?.date || '');
      return new Set(dates).size !== dates.length;
    };
    let compared = 0;
    for (const { key, input } of CASES.slice(0, 2000)) {
      if (sameDay(input.pcvDoses) || sameDay(input.ppsv23Doses)) continue;
      compared++;
      const forward = recommend(input);
      const backward = recommend({
        ...input,
        pcvDoses: [...(input.pcvDoses ?? [])].reverse(),
        ppsv23Doses: [...(input.ppsv23Doses ?? [])].reverse(),
      });
      expect(JSON.stringify(backward.orderedDoses), key).toBe(JSON.stringify(forward.orderedDoses));
      expect(JSON.stringify(backward.perDose), key).toBe(JSON.stringify(forward.perDose));
    }
    // The exclusion removes same-day ties only — it must not leave a handful
    // of patients standing in for the sweep.
    expect(compared).toBeGreaterThan(1500);
  });

  it('analyzeBoth returns the doses on each stream, not just the engine', () => {
    // Results reads the engine, but `analyzeBoth` is the documented entry
    // point and other callers use it directly.
    const a = analyzeBoth({
      pcvDoses: [
        { product: 'PCV13', date: '2024-01-01' },
        { product: 'PCV7', date: '2008-05-02' },
      ],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-06-01' }],
      ageMonths: 840,
      today: '2026-10-12',
      riskIds: [],
    });
    expect(a.pcv.doses.map((d) => d.product)).toEqual(['PCV7', 'PCV13']);
    expect(a.pcv.perDose.map((v) => v.status)).toEqual(['noncounting', 'valid']);
    expect(a.ppsv23.doses.length).toBe(a.ppsv23.perDose.length);
  });

  it('orderedDoses is an array on the hard-stop path', () => {
    // P6-5 had to repair exactly this for `perDose`, which shipped as `{}`
    // here and crashed the first consumer that iterated it.
    const stopped = recommend({
      ageMonths: 840,
      dob: '1956-04-02',
      riskIds: ['hct_cart_bcell_exclude'],
      pcvDoses: [{ product: 'PCV13', date: '2020-01-01' }],
      ppsv23Doses: [],
      today: '2026-06-07',
    });
    expect(stopped.excluded).toBe(true);
    expect(Array.isArray(stopped.orderedDoses.pcv)).toBe(true);
    expect(Array.isArray(stopped.orderedDoses.ppsv23)).toBe(true);
  });
});
