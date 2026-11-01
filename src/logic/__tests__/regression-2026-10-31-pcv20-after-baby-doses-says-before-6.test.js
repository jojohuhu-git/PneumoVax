// ── §B-PCV20-AFTER-BEFORE6 (2026-10-31): baby doses, then a PCV20 at 6+ ──
//
// An 8-year-old with diabetes: four PCV13 doses as a baby, then a PCV20 at 7.
// Her card said "complete" — right — and explained it as "The conjugate on
// record before the PCV20 was PCV13 only, given at or after age 6 years",
// citing CDC's "Received PCV13 only at or after age 6 years" row. Every one
// of her PCV13 doses was given before her first birthday.
//
// The cause: the card's "was the series before age 6" test counted the PCV20
// itself, so a PCV20 given at 7 failed it and the card fell through to the
// branch written for a child whose FIRST conjugate came at 6 or later (the
// 17-year-old with PCV13 at 8, PCV20 at 17 — OWNER DECISION 2026-10-18).
//
// The row this child FOLLOWED is CDC's Age 6-18 "Received PCV before age 6
// years but have not received PPSV23 → Not previously received PCV20: 1 dose
// PCV20 or 1 dose PPSV23" (each class its own wording, FINDING N). Cite the
// row the patient followed and say its dose has been given (owner, 2026-10-18
// and 2026-10-23). The dose and the verdict do not change, so under the owner's
// 2026-10-18 rule this is decided without asking; she also said "fix it first"
// when shown this child on 2026-10-31.
//
// The test grid builds no child aged 5-18 with an infant dose, so this is
// asserted by hand.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));
const BABY_PCV13 = d('PCV13', ['2018-12-01', '2019-02-01', '2019-04-01', '2019-10-05']);
const base = { dob: '2018-10-01', ageMonths: 96, today: '2026-10-11' };
const keysOf = (r) => r.noteCites.map((c) => c.key);
const card = (input) => {
  const out = recommend({ ...base, ppsv23Doses: [], ...input });
  expect(out.recs).toHaveLength(1);
  return out.recs[0];
};

describe('baby PCV13 doses, then a PCV20 at 7', () => {
  it('diabetes (not immunocompromised): says before age 6 and cites the non-IC Age 6-18 row', () => {
    const r = card({ riskIds: ['diabetes'], pcvDoses: [...BABY_PCV13, ...d('PCV20', ['2025-11-01'])] });
    expect(r.status).toBe('complete');
    expect(r.doseLabel).toBe('PCV complete (includes PCV20)');
    expect(r.note.detail).not.toMatch(/at or after age 6/);
    expect(r.note.detail).toMatch(/^The conjugate doses before the PCV20 \(PCV13 only\) were all given before age 6\./);
    expect(keysOf(r)).toEqual(['pedsRiskBefore6NoPcv20At6to18']);
  });

  it('no spleen, PPSV23 at 2, PCV20 at 7: cites the IC Age 6-18 row, five-year tail included', () => {
    const r = card({ riskIds: ['asplenia'], pcvDoses: [...BABY_PCV13, ...d('PCV20', ['2025-11-01'])],
      ppsv23Doses: d('PPSV23', ['2020-11-01']) });
    expect(r.status).toBe('complete');
    expect(r.note.detail).not.toMatch(/at or after age 6/);
    expect(r.note.detail).toMatch(/if PPSV23 is used, a PCV20 or a second PPSV23 at least 5 years later/);
    expect(keysOf(r)).toEqual(['pedsIcBefore6NoPcv20At6to18']);
  });

  it('a PCV15 baby series needs no PCV13/PCV15 bridge: CDC\'s before-6 row names no product', () => {
    const r = card({ riskIds: ['diabetes'],
      pcvDoses: [...d('PCV15', BABY_PCV13.map((x) => x.date)), ...d('PCV20', ['2025-11-01'])] });
    expect(r.note.detail).toMatch(/\(PCV15 only\) were all given before age 6/);
    expect(r.note.detail).not.toMatch(/interchangeabl/i);
    expect(keysOf(r)).toEqual(['pedsRiskBefore6NoPcv20At6to18']);
  });
});

describe('the age band is the patient\'s, from the one shared age test (FINDING N)', () => {
  // Reachable only with an undated PCV20 (a dated one before 6 makes the whole
  // series "before age 6", which is the card's Group A/B): a 4-year-old with a
  // PCV13 at 3 years, so the 24-71-month catch-up is met.
  it('a 4-year-old quotes CDC\'s Age 2-5 row, not the Age 6-18 one', () => {
    const r = recommend({ dob: '2022-06-01', ageMonths: 52, today: '2026-10-11', riskIds: ['diabetes'],
      pcvDoses: [...d('PCV13', ['2022-08-01', '2022-10-01', '2022-12-01', '2023-06-05', '2025-07-01']),
        { product: 'PCV20', date: '' }], ppsv23Doses: [] }).recs[0];
    expect(r.note.detail).toMatch(/were all given before age 6/);
    expect(keysOf(r)).toEqual(['pedsRiskPcv20orPpsv23']);
  });
});

describe('limits — the at-or-after-6 card is untouched where it is true', () => {
  it('the 17-year-old with PCV13 at 8 and PCV20 at 17 still reads "at or after age 6"', () => {
    const r = recommend({ dob: '2009-06-01', ageMonths: 208, today: '2026-10-11', riskIds: ['chronic_lung'],
      pcvDoses: d('PCV13', ['2017-07-01']).concat(d('PCV20', ['2026-07-01'])), ppsv23Doses: [] }).recs[0];
    expect(r.note.detail).toMatch(/^The conjugate on record before the PCV20 was PCV13 only, given at or after age 6 years\./);
    expect(keysOf(r)[0]).toBe('pedsRiskPcv13At6');
  });

  it('an UNDATED baby dose is not assumed to be before age 6', () => {
    const r = card({ riskIds: ['diabetes'],
      pcvDoses: [{ product: 'PCV13', date: '' }, ...d('PCV20', ['2025-11-01'])] });
    expect(r.note.detail).not.toMatch(/were all given before age 6/);
  });
});
