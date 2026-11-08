// §C-P2-ONE-ADULT — OWNER RULING 2026-11-07, on "Sam": "PCV20 or PCV21 only".
//
// Sam, 19, alcohol use disorder. At 18 he got a PCV (product not recorded) and a
// PPSV23 on the same day; the PPSV23 does not count (CHILD-PPSV23-AFTER-PCV). The
// adult card offered PCV15, PCV20 or PCV21, and after a PCV15 it advised a
// PPSV23 a year later — his SECOND PPSV23 shot — while the line under the old
// dose said "Next dose from <5 years on> at the earliest", and the later PPSV23
// then read "5 years advised". She asked twice why the wait was 1 year and not 5,
// was shown her own rulings on Leah (a child, one such shot: "PCV20 only") and
// Ivy at 20 (two thrown-out childhood shots: "PCV20/21 only"), and chose
// "PCV20 or PCV21 only" for Sam. Her reason on Leah: a second polysaccharide shot
// gives a weaker response.
//
// Scope: ONE childhood PPSV23 thrown out for coming too soon after a PCV, the
// patient now 19 or over — the adult cards Ivy's ruling already reaches. Not a
// single shot thrown out for another reason (not put to her).
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const SAM = {
  dob: '2007-10-11', riskIds: ['alcoholism'],
  pcvDoses: [{ product: '', date: '2025-10-11' }],
  ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }],
};
const all = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);
const brandsOf = (r) => (r.brands ?? []).map((b) => String(b.key ?? b).split(' ')[0]);

describe('Sam, 19: one PPSV23 thrown out at 18 — PCV20 or PCV21 only', () => {
  it('the card offers PCV20 or PCV21, says why no PPSV23, and why no PCV15', () => {
    const out = recommend({ ...SAM, today: '2026-10-11' });
    expect(out.recs).toHaveLength(1);
    const card = out.recs[0];
    expect(card.doseLabel).toBe('1 dose PCV (PCV20 or PCV21)');
    expect(brandsOf(card)).toEqual(['PCV20', 'PCV21']);
    expect(card.dueToday).toBe(true);
    expect(all(card)).toContain('No further PPSV23: 1 PPSV23 dose has been given and it did not count.');
    expect(all(card)).toContain('— a second PPSV23 shot.');
    expect((all(card).match(/\[c\]/g) ?? []).length).toBe(card.noteCites.length);
  });

  it('the line under the 2025 PPSV23 no longer points to a date five years on', () => {
    const out = recommend({ ...SAM, today: '2026-10-11' });
    const line = out.perDose.ppsv23[0].reasons.join(' ');
    expect(line).toBe('Same day as PCV. Minimum interval 8 weeks.');
    expect(out.perDose.ppsv23[0].disposition).toBe('no-repeat');
    expect(out.perDose.ppsv23[0].forwardLookingReason ?? null).toBe(null);
  });

  it('if a PCV15 was already given, PCV20 or PCV21 takes the PPSV23\'s place a year later (Ivy\'s card)', () => {
    const out = recommend({ ...SAM, today: '2026-10-11', pcvDoses: [...SAM.pcvDoses, { product: 'PCV15', date: '2026-10-11' }] });
    const card = out.recs[0];
    expect(card.doseLabel).toBe('1 dose PCV (PCV20 or PCV21) ≥1 year after PCV15 — completes the series');
    expect(card.earliestNextDate).toBe('2027-10-11');
    expect(all(card)).toContain('A PPSV23 is not given: it would be a second PPSV23 shot.');
  });

  it('the control: the same adult with no PPSV23 at 18 is still offered PCV15', () => {
    const out = recommend({ ...SAM, today: '2026-10-11', ppsv23Doses: [] });
    expect(brandsOf(out.recs[0])).toContain('PCV15');
    expect(all(out.recs[0])).toContain('If PCV15 is chosen, follow with PPSV23');
  });

  it('a single PPSV23 thrown out for another reason is not covered: under age 2, the card is unchanged', () => {
    // PPSV23 at 20 months (too young), no PCV: not Sam's history, not ruled on.
    const out = recommend({ dob: '2006-01-01', today: '2026-10-11', riskIds: ['alcoholism'],
      pcvDoses: [], ppsv23Doses: [{ product: 'PPSV23', date: '2007-09-01' }] });
    expect(out.perDose.ppsv23[0].status).toBe('invalid');
    expect(brandsOf(out.recs[0])).toContain('PCV15');
  });
});
