// §A-UNDATED (OWNER DECISION 2026-11-15) — a PCV dose recorded with no date
// does not count. An undated PPSV23 still does.
//
// CDC, General Best Practice Guidelines, Timing and Spacing (page updated
// 2024-07-24, read live 2026-11-15): "With the exception of influenza vaccine
// and PPSV23, providers should only accept written, dated records as evidence
// of vaccination". CDC's adult notes give 1 dose of PCV15, PCV20 or PCV21 to
// an adult "whose previous vaccination history is unknown".
//
// She was shown Ruth, Omar and a 30-year-old with diabetes, each beside the
// same patient with no dose, and chose "Not counted" — the answer she gave
// for MeningoVax (STOP C, C1). Until today the app counted the dose
// ("Counted — date not recorded") and assumed it was an infant dose; that was
// an agent's choice, never hers.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { doseChipLabel } from '../../components/doseChipLabel.js';

const TODAY = '2026-11-15';
const run = (input) => recommend({ today: TODAY, ppsv23Doses: [], riskIds: [], ...input });
const card = (r) => r.recs[0];
const chip = (r, k, i) => doseChipLabel(r.perDose[k][i]);
const strip = (r) => JSON.stringify(r.recs.map((c) => ({ s: c.status, d: c.doseLabel, n: c.note })));

describe('§A-UNDATED: an undated PCV dose does not count', () => {
  it('Ruth, 65, healthy, PCV20 with no date: offered PCV20 or PCV21, same as with no dose', () => {
    const ruth = run({ ageMonths: 780, pcvDoses: [{ product: 'PCV20', date: '' }] });
    const none = run({ ageMonths: 780, pcvDoses: [] });
    expect(card(ruth).status).toBe('due');
    expect(strip(ruth)).toBe(strip(none));
    expect(chip(ruth, 'pcv', 0)).toBe('Not counted — no date');
  });

  it('Omar, 3, healthy, one PCV20 with no date: owes the catch-up dose', () => {
    const omar = run({ dob: '2023-11-15', pcvDoses: [{ product: 'PCV20', date: '' }] });
    const none = run({ dob: '2023-11-15', pcvDoses: [] });
    expect(card(omar).status).not.toBe('complete');
    expect(strip(omar)).toBe(strip(none));
    expect(chip(omar, 'pcv', 0)).toBe('Not counted — no date');
  });

  it('30-year-old with diabetes, PCV15 with no date: offered a PCV, not the PPSV23 follow-up', () => {
    const p = run({ ageMonths: 360, riskIds: ['diabetes'], pcvDoses: [{ product: 'PCV15', date: '' }] });
    const none = run({ ageMonths: 360, riskIds: ['diabetes'], pcvDoses: [] });
    expect(strip(p)).toBe(strip(none));
  });

  it('a baby mid-series plans as if the undated dose was never given', () => {
    const p = run({ dob: '2026-02-15', pcvDoses: [{ product: 'PCV20', date: '2026-04-15' }, { product: 'PCV20', date: '' }] });
    const control = run({ dob: '2026-02-15', pcvDoses: [{ product: 'PCV20', date: '2026-04-15' }] });
    expect(strip(p)).toBe(strip(control));
    // The dated dose keeps its own number; the undated one has none.
    expect(p.perDose.pcv.find((v) => v.effectiveDoseNum === 1)).toBeTruthy();
  });

  it('the line gives the reason, not the label, and names no date', () => {
    const v = run({ ageMonths: 780, pcvDoses: [{ product: 'PCV20', date: '' }] }).perDose.pcv[0];
    expect(v.reasons.join(' ')).toMatch(/dated record/);
    expect(v.reasons.join(' ')).not.toMatch(/not counted/i);
    expect(v.doesNotCount).toBe(true);
  });

  it('every undated PCV on the record gets its own line (not folded like PCV7)', () => {
    const r = run({ ageMonths: 780, pcvDoses: [{ product: 'PCV20', date: '' }, { product: 'PCV13', date: '' }] });
    expect(r.perDose.pcv.map((v) => v.reasons.length > 0)).toEqual([true, true]);
    expect(r.perDose.pcv.map((v) => doseChipLabel(v))).toEqual(['Not counted — no date', 'Not counted — no date']);
  });
});

describe('§A-UNDATED: an undated PPSV23 still counts (CDC\'s own exception)', () => {
  it('70-year-old, PPSV23 with no date: still counted, still offered a PCV', () => {
    const r = run({ ageMonths: 840, ppsv23Doses: [{ product: 'PPSV23', date: '', detailsUnknown: true }], pcvDoses: [] });
    expect(chip(r, 'ppsv23', 0)).toBe('Counted — date not recorded');
    expect(r.perDose.ppsv23[0].doesNotCount).toBeFalsy();
  });
});
