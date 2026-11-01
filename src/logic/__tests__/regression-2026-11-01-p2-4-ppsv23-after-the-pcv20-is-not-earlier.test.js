// ── P2-4, grey-zone audit of 2026-11-01 (owner: "agree with fixing") ────
//
// G21: 8, chronic heart disease, PCV20 at 6, then PPSV23 at 7. Her complete
// card said "CDC gives that dose whether or not a PPSV23 was given EARLIER" —
// true of CDC's branch ("Give it regardless of whether the child has
// previously received PPSV23 or PCV7"), but her PPSV23 came LATER. The card
// now says what happened to her; children whose PPSV23 came first, or who
// have none, read as before.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-01';
const d = (product, dates) => dates.map((date) => ({ product, date }));
const detail = (p) => recommend({ today: TODAY, ...p }).recs[0].note.detail;
const OLD = 'CDC gives that dose whether or not a PPSV23 was given earlier.';
const NEW = 'The PPSV23 given after it does not change this.';

const G21 = { dob: '2018-10-27', riskIds: ['chronic_heart'], pcvDoses: d('PCV20', ['2024-10-27']), ppsv23Doses: d('PPSV23', ['2025-10-27']) };

describe('P2-4: a PPSV23 given AFTER the PCV20 is not called earlier', () => {
  it('G21', () => {
    expect(detail(G21)).not.toContain(OLD);
    expect(detail(G21)).toContain(NEW);
  });
  it('CONTROL: PPSV23 before the PCV20 keeps CDC\'s "earlier" sentence', () => {
    expect(detail({ ...G21, ppsv23Doses: d('PPSV23', ['2024-06-27']) })).toContain(OLD);
  });
  it('CONTROL: no PPSV23 keeps it too', () => {
    expect(detail({ ...G21, ppsv23Doses: [] })).toContain(OLD);
  });
});
