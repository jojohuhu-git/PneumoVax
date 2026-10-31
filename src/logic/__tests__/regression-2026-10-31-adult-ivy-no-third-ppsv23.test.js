// ── §C-P2-NOTHIRD for ADULTS (OWNER RULING 2026-10-31, on "Ivy, grown up") ─
//
// Ivy at 20, no spleen, no PCV on record: PPSV23 at 13 and 20 months, both
// thrown out for being under 2. Her card offered PCV15, PCV20 or PCV21 — and
// PCV15 brings a PPSV23 after it, her THIRD shot — while her second chip
// said "repeat this dose only". For a child the owner had ruled "PCV20 only";
// asked about Ivy grown up, she chose the same: PCV20 or PCV21 only, PCV15
// dropped with the reason given, no third PPSV23 at any age, and the second
// chip reads "It is not repeated."
//
// ⚠ Hand-built: the grid holds no adult with two childhood PPSV23 shots
// that were both thrown out.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));
const IVY_20 = {
  dob: '2006-01-01', ageMonths: 249, today: '2026-10-31', riskIds: ['asplenia'],
  pcvDoses: [], ppsv23Doses: d('PPSV23', ['2007-02-01', '2007-09-01']),
};
const card = (p) => recommend(p).recs;
const chips = (p) => recommend(p).perDose.ppsv23.map((x) => x.reasons);

describe('Ivy at 20 — the patient she was shown', () => {
  it('her card offers PCV20 or PCV21 only, and says why PCV15 is not offered', () => {
    const recs = card(IVY_20);
    expect(recs).toHaveLength(1);
    expect(recs[0].doseLabel).toBe('1 dose PCV (PCV20 or PCV21)');
    expect(recs[0].brands.join(' ')).not.toContain('PCV15');
    expect(recs[0].note.lead).toBe('**Give 1 dose of PCV20 or PCV21**; either completes the series alone [c]. No further PPSV23: 2 PPSV23 doses have been given and neither counted.');
    expect(recs[0].note.detail).toContain('PCV15 is not offered: after it a PPSV23 would be owed ≥8 weeks later [c] — a third PPSV23 shot.');
  });

  it('her second chip says it is not repeated; her first still points to the second', () => {
    const [first, second] = chips(IVY_20);
    expect(first[1]).toBe('This dose does not count toward the series. It was repeated on Sep 1, 2007 — see that dose.');
    expect(second[1]).toBe('This dose does not count toward the series. It is not repeated.');
  });

  it('nothing else moves: same status, due today, no PPSV23 card', () => {
    const [r] = card(IVY_20);
    expect([r.vaccine, r.status, r.dueToday]).toEqual(['PCV', 'risk-based', true]);
  });

  it('every [c] marker has exactly one citation', () => {
    const [r] = card(IVY_20);
    const markers = `${r.note.lead} ${r.note.detail}`.split('[c]').length - 1;
    expect(r.noteCites).toHaveLength(markers);
  });
});

describe('her ruling, at every adult age', () => {
  it('19–49 with a chronic condition only: the year, not 8 weeks', () => {
    const r = card({ ...IVY_20, riskIds: ['diabetes'] })[0];
    expect(r.doseLabel).toBe('1 dose PCV (PCV20 or PCV21)');
    expect(r.note.detail).toContain('PCV15 is not offered: after it a PPSV23 would be owed ≥1 year later [c] [c]');
  });

  it('55, no risk condition: PCV20 or PCV21 only, and no 8-week option for a PCV15 not offered', () => {
    const p = { ...IVY_20, dob: '1971-01-01', ageMonths: 669, riskIds: [], ppsv23Doses: d('PPSV23', ['1972-02-01', '1972-09-01']) };
    const r = card(p)[0];
    expect(r.doseLabel).toBe('1 dose PCV (PCV20 or PCV21)');
    expect(r.brands.join(' ')).not.toContain('PCV15');
    expect(`${r.note.lead} ${r.note.detail}`).not.toContain('minimum interval of 8 weeks');
    expect(r.noteCites).toHaveLength(`${r.note.lead} ${r.note.detail}`.split('[c]').length - 1);
  });

  it('adult Sam (repeat 5 weeks after a too-young dose): the grey-area note comes too', () => {
    const p = { ...IVY_20, ppsv23Doses: d('PPSV23', ['2007-12-01', '2008-01-05']) };
    const r = card(p)[0];
    expect(r.doseLabel).toBe('1 dose PCV (PCV20 or PCV21)');
    expect(r.note.detail).toContain('Grey area:');
    // The grey-area sentence carries two CDC citations of its own.
    expect(r.noteCites.map((c) => c.key)).toEqual(expect.arrayContaining(['cdcGbpRepeatUnderMinAge', 'cdcGbpLiveVaccine28Days']));
    expect(r.noteCites).toHaveLength(`${r.note.lead} ${r.note.detail}`.split('[c]').length - 1);
    expect(chips(p)[1][1]).toContain('It is not repeated. Grey area:');
  });
});

describe('limits', () => {
  it('ONE thrown-out PPSV23: PCV15 is still offered', () => {
    expect(card({ ...IVY_20, ppsv23Doses: d('PPSV23', ['2007-02-01']) })[0].doseLabel).toBe('1 dose PCV (PCV20, PCV15, or PCV21)');
  });

  it('a PPSV23 that COUNTED: not this card at all', () => {
    expect(card({ ...IVY_20, ppsv23Doses: d('PPSV23', ['2007-02-01', '2010-02-01']) })[0].doseLabel).not.toBe('1 dose PCV (PCV20 or PCV21)');
  });
});
