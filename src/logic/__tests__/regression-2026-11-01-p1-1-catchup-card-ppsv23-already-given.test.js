// ── P1-1, grey-zone audit of 2026-11-01 (OWNER RULING, same day) ─────────
//
// The 24-71-month at-risk catch-up card ended every time with "If PCV15 is
// used to complete, add PPSV23 ≥8 weeks after the last PCV" — even for a child
// who had ALREADY had a PPSV23 that counted. G01: 4, no spleen, PPSV23 at 3,
// never a PCV. Following the card gave her a second PPSV23 15 months after the
// first, which the app itself then graded "shorter than the 5 years advised".
// And no immunocompromised child's card said a dose was owed 5 years on,
// which the app asked for at the very next visit.
//
// Her ruling, quoting ACIP mm7137a3 (read live 2026-11-01, each once):
// "Children who have received PPSV23 but have not yet completed their
// recommended PCV doses should receive PCV ≥8 weeks after the PPSV23 dose.
// Therefore the PCV schedule is correct, but if PPSV23 is also used, it needs
// to be 5 years after the last PPSV23" — and "Children aged ≥2 years who have
// an immunocompromising condition should receive a second dose of PPSV23 ≥5
// years after the first PPSV23 dose."
//
// WORDING ONLY: the doses, dates and statuses are unchanged; the card now says
// what the app's own next card says.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-01';
const d = (product, dates) => dates.map((date) => ({ product, date }));
const card = (p) => recommend({ today: TODAY, ...p }).recs.find((r) => r.noteCites?.[0]?.key === 'pedsRiskIncompleteCatchup');
const text = (r) => `${r.note.lead} ${r.note.detail}`;
const markers = (r) => (text(r).match(/\[c\]/g) || []).length;
const keys = (r) => r.noteCites.map((c) => c.key);

const G01 = { dob: '2022-10-27', riskIds: ['asplenia'], pcvDoses: [], ppsv23Doses: d('PPSV23', ['2025-10-27']) };
const DIABETES_SAME = { ...G01, riskIds: ['diabetes'] };
const IC_NO_PPSV = { dob: '2023-10-27', riskIds: ['asplenia'], pcvDoses: [], ppsv23Doses: [] };
const NONIC_NO_PPSV = { ...IC_NO_PPSV, riskIds: ['diabetes'] };
// Row "3 doses, all before 12 months", PPSV23 at 2y6m.
const IC_ROW1 = {
  dob: '2023-10-27', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2023-12-27', '2024-02-27', '2024-04-27']), ppsv23Doses: d('PPSV23', ['2026-04-27']),
};
// Two PPSV23 shots, both too young to count (§C-P2-NOTHIRD): PCV20 only.
const IC_TWO_SHOTS = { dob: '2023-10-27', riskIds: ['asplenia'], pcvDoses: [], ppsv23Doses: d('PPSV23', ['2024-11-27', '2025-06-27']) };

describe('P1-1: a PPSV23 already given is not followed by another 8 weeks after the PCV', () => {
  it('G01 (immunocompromised): the next dose waits 5 years after her PPSV23', () => {
    const r = card(G01);
    expect(text(r)).not.toContain('add PPSV23');
    expect(r.note.detail).toContain('If PCV15 is used, no PPSV23 follows it now: this child has already had a PPSV23 (Oct 27, 2025).');
    expect(r.note.detail).toContain('PCV20 or a second PPSV23 — waits until ≥5 years after that PPSV23 [c].');
    expect(keys(r)).toContain('pedsIcPpsvWaitFiveYears');
    expect(keys(r)).not.toContain('p2016Pcv15NeedsFurtherDoses');
  });

  it('the same history without an immunocompromising condition: no further PPSV23 at all', () => {
    const r = card(DIABETES_SAME);
    expect(text(r)).not.toContain('add PPSV23');
    expect(r.note.detail).toContain('If PCV15 is used, no PPSV23 follows it: this child has already had one (Oct 27, 2025)');
    expect(keys(r)).toContain('pedsRiskSinglePpsv23AfterPcv');
  });

  it('the "3 doses before 12 months" row gets the same sentence', () => {
    const r = card(IC_ROW1);
    expect(r.doseLabel).toBe('1 dose PCV (at-risk catch-up)');
    expect(text(r)).not.toContain('add PPSV23');
    expect(r.note.detail).toContain('this child has already had a PPSV23 (Apr 27, 2026)');
  });

  it('an immunocompromised child with no PPSV23 yet is told about the dose 5 years on', () => {
    const r = card(IC_NO_PPSV);
    expect(r.note.detail).toContain('If PCV15 is used to complete, add PPSV23 ≥8 weeks after the last PCV [c].');
    expect(r.note.detail).toContain('For an immunocompromising condition, that PPSV23 is followed by one further dose — PCV20 or a second PPSV23 — ≥5 years later [c].');
    expect(keys(r)).toEqual(expect.arrayContaining(['p2016Pcv15NeedsFurtherDoses', 'pedsSecondPpsv5y']));
  });

  it('CONTROL: a child with no PPSV23 and no immunocompromising condition reads as before', () => {
    const r = card(NONIC_NO_PPSV);
    expect(r.note.detail.endsWith('If PCV15 is used to complete, add PPSV23 ≥8 weeks after the last PCV [c].')).toBe(true);
    expect(text(r)).not.toContain('5 years');
  });

  it('two PPSV23 shots that never counted: PCV20 only, and no 5-year sentence left behind', () => {
    const r = card(IC_TWO_SHOTS);
    expect(r.brands).toEqual(['PCV20 (Prevnar 20)']);
    expect(text(r)).not.toContain('5 years later');
    expect(keys(r)).not.toContain('pedsSecondPpsv5y');
  });

  it('every card has exactly one source per [c] marker', () => {
    for (const p of [G01, DIABETES_SAME, IC_ROW1, IC_NO_PPSV, NONIC_NO_PPSV, IC_TWO_SHOTS]) {
      const r = card(p);
      expect(markers(r)).toBe(r.noteCites.length);
    }
  });

  it('nothing but the words moved: same products, dates and status as the app gave before', () => {
    const r = card(G01);
    expect(r.status).toBe('risk-based');
    expect(r.brands).toEqual(['PCV20 (Prevnar 20)', 'PCV15 (Vaxneuvance)']);
    expect(r.minIntervalDays).toBe(56);
  });
});

describe('the card now promises what the next visit asks for', () => {
  it('G01 after two PCV15: the app asks for the further dose 5 years after her PPSV23, as the card said', () => {
    const next = recommend({ ...G01, today: '2027-01-10', pcvDoses: d('PCV15', ['2026-11-01', '2026-12-27']) }).recs;
    expect(next.map((r) => r.earliestNextDate)).toContain('2030-10-27');
    expect(next.every((r) => r.earliestNextDate == null || r.earliestNextDate >= '2030-10-27')).toBe(true);
  });

  it('the diabetic twin after two PCV15: complete, as the card said', () => {
    const next = recommend({ ...DIABETES_SAME, today: '2027-01-10', pcvDoses: d('PCV15', ['2026-11-01', '2026-12-27']) }).recs;
    expect(next.map((r) => r.status)).toEqual(['complete']);
  });
});
