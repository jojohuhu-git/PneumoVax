// proseDiff.mjs smoke test — keeps the prose-diff harness runnable the same
// way P2-13 did for the PneumoRecs comparison harnesses: not a parity check,
// just proof the tool does not silently go dark on a real code path.
//
// `proseOf` is exported and imported directly here, rather than shelling out
// to `node scripts/proseDiff.mjs dump ...` and running the whole grid, which
// would be slow and would duplicate what `sweep-verdict-corpus.test.js`
// already proves about the grid itself. This only checks the RENDERER: given
// a result from each of the engine's distinct shapes (ordinary peds/adult,
// the hard-stop exclusion, the PCV21 geographic advisory), it returns a
// non-empty string and never lets an unset optional
// field leak through as the literal text "undefined" — the usual symptom of
// a renderer field added to the engine but not to this tool, or vice versa.
import { describe, it, expect } from 'vitest';
import { proseOf } from '../proseDiff.mjs';

const TODAY = '2026-10-16';

describe('proseDiff.mjs stays runnable across every answer shape', () => {
  it('an ordinary peds patient', () => {
    const text = proseOf({ ageMonths: 6, today: TODAY, riskIds: [], pcvDoses: [], ppsv23Doses: [] });
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toMatch(/undefined/);
  });

  it('an ordinary adult patient', () => {
    const text = proseOf({ ageMonths: 600, today: TODAY, riskIds: [], pcvDoses: [], ppsv23Doses: [] });
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toMatch(/undefined/);
    expect(text).toMatch(/^R=/);
  });

  // Three ticks, one shape since 2026-10-16: the CAR-T/B-cell box and the
  // transplant box both hard-stop, at every age. The transplant rows used to
  // render an advisory block of their own — a peds title and an adult title,
  // two more answer shapes this test covered — and both now collapse to this
  // one. Each is checked at a child's age and an adult's precisely because
  // that distinction USED to matter here, and the test should fail if an age
  // branch ever creeps back in.
  const STOP_TICKS = ['bcell_car_t_therapy', 'hsct'];

  it.each(STOP_TICKS)('the hard-stop exclusion via %s, peds and adult', (riskId) => {
    const peds = proseOf({ ageMonths: 120, today: TODAY, riskIds: [riskId], pcvDoses: [], ppsv23Doses: [] });
    const adult = proseOf({ ageMonths: 400, today: TODAY, riskIds: [riskId], pcvDoses: [], ppsv23Doses: [] });
    for (const text of [peds, adult]) {
      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toMatch(/undefined/);
      expect(text).toMatch(/^EXCLUDED/);
    }
    expect(peds).toBe(adult);
  });

  it('a before-birth recorded dose (the impossible-entry shape)', () => {
    const text = proseOf({
      ageMonths: 24, today: TODAY, riskIds: [],
      pcvDoses: [{ product: 'PCV13', date: '2000-01-01' }],
      ppsv23Doses: [],
      dob: '2024-10-01',
    });
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toMatch(/undefined/);
  });
});
