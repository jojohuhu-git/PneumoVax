// ── §C-P2-NOTHIRD, adults who ALREADY HAD A PCV15 (OWNER RULINGS 2026-10-31) ─
//
// Ivy at 20, no spleen: PCV15 on 2026-09-20, PPSV23 at 13 and 20 months, both
// thrown out for being under 2. Her card said "PPSV23 (≥8 weeks after PCV15) —
// completes the series" — her THIRD PPSV23 shot. The owner's ruling, quoting
// mm7401a1's footnote *: "PCV20 or PCV21 can be used per the MMWR for adults:
// For adults who have received PCV15 but have not completed their recommended
// pneumococcal vaccine series with PPSV23, 1 dose of PCV21 or PCV20 may be used
// if PPSV23 is not available."
//
// No document states WHEN that stand-in dose is given. Asked with Ivy, she
// chose "Use PPSV23's timing": the date the PPSV23 would have had — 8 weeks
// after the PCV15 at 19–49 with an immunocompromising condition / cochlear
// implant / CSF leak, a year for everyone else. So only the vaccine moves.
//
// ⚠ Hand-built: the grid holds no adult with two childhood PPSV23 shots.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));
const IVY_20 = {
  dob: '2006-01-01', ageMonths: 249, today: '2026-10-31', riskIds: ['asplenia'],
  pcvDoses: d('PCV15', ['2026-09-20']), ppsv23Doses: d('PPSV23', ['2007-02-01', '2007-09-01']),
};
const ADULT_55 = {
  ...IVY_20, dob: '1971-01-01', ageMonths: 669, riskIds: [],
  pcvDoses: d('PCV15', ['2026-03-01']), ppsv23Doses: d('PPSV23', ['1972-02-01', '1972-09-01']),
};
const run = (p) => recommend(p);
const text = (r) => `${r.note.lead} ${r.note.detail}`;
const markers = (r) => text(r).split('[c]').length - 1;

describe('Ivy at 20 with a PCV15 — the patient she was shown', () => {
  it('her card gives PCV20 or PCV21, not a third PPSV23', () => {
    const { recs } = run(IVY_20);
    expect(recs).toHaveLength(1);
    const [r] = recs;
    expect(r.vaccine).toBe('PCV');
    expect(r.doseLabel).toBe('1 dose PCV (PCV20 or PCV21) ≥8 weeks after PCV15 — completes the series');
    expect(r.brands).toEqual(['PCV20 (Prevnar 20)', 'PCV21 (Capvaxive)']);
    expect(r.note.lead).toBe('**Give 1 dose of PCV20 or PCV21** ≥8 weeks after the PCV15 dose, in place of the PPSV23 [c] [c]; it completes the series [c]. No further PPSV23: 2 PPSV23 doses have been given and neither counted.');
    expect(r.note.detail).toBe('The timing is the PPSV23\'s: ACIP gives the PPSV23 ≥8 weeks after a PCV15 [c], and no document states a separate timing for the PCV20 or PCV21 that replaces it. A PPSV23 is not given: it would be a third PPSV23 shot.');
  });

  it('the date is the one the PPSV23 had: Nov 15, 2026, not today', () => {
    const [r] = run(IVY_20).recs;
    expect([r.status, r.dueToday, r.earliestNextDate]).toEqual(['risk-based', false, '2026-11-15']);
  });

  it('each claim cites the document that states it, one number per marker', () => {
    const [r] = run(IVY_20).recs;
    expect(r.noteCites.map((c) => c.key)).toEqual([
      'mmwrPpsv23Unavailable', 'jobAidPpsv23Unavailable', 'adultPpsv23Unavailable', 'adultPcv15ThenPpsvShort',
    ]);
    expect(r.noteCites).toHaveLength(markers(r));
    // The grey buttons: mm7401a1 is ON this card (its footnote is cited),
    // though the PPSV23 version it replaces leaves it off.
    const urls = r.citations.map((c) => c.url);
    expect(urls).toContain('https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm');
    expect(urls.some((u) => u.includes('Vaccine-Timing-Adults-JobAid'))).toBe(true);
    expect(urls.some((u) => u.includes('adult-notes'))).toBe(true);
  });

  it('her second chip says it is not repeated', () => {
    const [first, second] = run(IVY_20).perDose.ppsv23.map((x) => x.reasons);
    expect(first[1]).toBe('This dose does not count toward the series. It was repeated on Sep 1, 2007 — see that dose.');
    expect(second[1]).toBe('This dose does not count toward the series. It is not repeated.');
  });
});

describe('her ruling, at every adult age', () => {
  it('19–49 with a chronic condition only: a year after the PCV15', () => {
    const [r] = run({ ...IVY_20, riskIds: ['diabetes'] }).recs;
    expect(r.doseLabel).toBe('1 dose PCV (PCV20 or PCV21) ≥1 year after PCV15 — completes the series');
    expect([r.dueToday, r.earliestNextDate]).toEqual([false, '2027-09-20']);
    expect(r.noteCites.map((c) => c.key)).toContain('adultPcv15ThenPpsv');
    expect(r.noteCites).toHaveLength(markers(r));
  });

  it('55, no risk condition: a year, due now once it has passed', () => {
    const [r] = run({ ...ADULT_55, pcvDoses: d('PCV15', ['2025-06-01']) }).recs;
    expect(r.doseLabel).toBe('1 dose PCV (PCV20 or PCV21) ≥1 year after PCV15 — completes the series');
    expect([r.status, r.dueToday]).toEqual(['due', true]);
    expect(text(r)).not.toContain('minimum interval of 8 weeks');
  });

  it('55 with no spleen: a year, with ACIP\'s 8-week option kept', () => {
    const [r] = run({ ...ADULT_55, riskIds: ['asplenia'] }).recs;
    expect(r.doseLabel).toBe('1 dose PCV (PCV20 or PCV21) ≥1 year after PCV15 — completes the series');
    expect(text(r)).toContain('A minimum interval of 8 weeks may be considered');
    expect(r.noteCites.map((c) => c.key)).toContain('jobAidEightWeekOptionAt50');
    expect(r.noteCites).toHaveLength(markers(r));
  });

  it('adult Sam (repeat 5 weeks after a too-young dose): the grey-area note comes too', () => {
    const p = { ...IVY_20, ppsv23Doses: d('PPSV23', ['2007-12-01', '2008-01-05']) };
    const [r] = run(p).recs;
    expect(r.doseLabel).toBe('1 dose PCV (PCV20 or PCV21) ≥8 weeks after PCV15 — completes the series');
    expect(r.note.detail).toContain('Grey area:');
    expect(r.noteCites.map((c) => c.key)).toEqual(expect.arrayContaining(['cdcGbpRepeatUnderMinAge', 'cdcGbpLiveVaccine28Days']));
    expect(r.noteCites).toHaveLength(markers(r));
  });
});

describe('limits', () => {
  it('ONE thrown-out PPSV23: the PPSV23 is still owed (it is only the second shot)', () => {
    const [r] = run({ ...IVY_20, ppsv23Doses: d('PPSV23', ['2007-02-01']) }).recs;
    expect(r.doseLabel).toBe('PPSV23 (≥8 weeks after PCV15) — completes the series');
  });

  it('no PPSV23 on record at all: unchanged', () => {
    const [r] = run({ ...IVY_20, ppsv23Doses: [] }).recs;
    expect(r.doseLabel).toBe('PPSV23 (≥8 weeks after PCV15) — completes the series');
  });
});
