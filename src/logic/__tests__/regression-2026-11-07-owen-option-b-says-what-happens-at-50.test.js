// R6's leftover — OWNER RULING 2026-11-07, on "Owen": "Yes, under Why this".
//
// Owen, 14, diabetes, PCV13 at 2, 4, 6 and 12 months, is offered Option A PCV20
// or Option B PPSV23, both "completes the recommended series". After PCV20 he is
// complete for life — at 19 and at 50 the card reads "Complete". After PPSV23 he
// is complete as a child, at 19 the adult card reads "No dose now — review at age
// 50", and at 50 it gives PCV20 or PCV21. So Option B costs one more dose at 50,
// and the card choosing between them did not say so. Cora's line (§B-OPTIONB19)
// left this family out on purpose; shown Owen, the owner asked for the line
// UNDER "Why this", not in view — unlike Cora's, whose dose comes at 19.
//
// The line is the adult cards' own answer: the PPSV23 is given on Option B's
// date, the patient is run to 19 and to 50, and the sentence is chosen by the
// rows THOSE cards cite (§B-AT19: never a hand-written "at 19" or "at 50" line).
// CDC's adult notes, read live 2026-11-07 via mm7401a1's table:
//   chronic 19–49, "PCV13 and 1 dose of PPSV23": "The pneumococcal vaccination
//   recommendations should be reviewed again when the person reaches age 50 years."
//   ≥50, "PCV13 at any age and PPSV23 at age <65 years": "A single dose of PCV21
//   or PCV20 ≥5 years after the last pneumococcal vaccine dose."
import { describe, it, expect } from 'vitest';
import { recommend, recommendBeforeFold } from '../recommend.js';

const TODAY = '2026-11-07';
const DOB = '2012-11-07';
const lead = (r) => (typeof r.note === 'string' ? r.note : r.note?.lead ?? '');
const detail = (r) => (typeof r.note === 'string' ? '' : r.note?.detail ?? '');
const all = (r) => `${lead(r)} ${detail(r)}`;
const BABY_PCV13 = ['2013-01-07', '2013-03-07', '2013-05-07', '2013-11-07'].map((date) => ({ product: 'PCV13', date }));
const owen = (extra = {}) => recommend({
  dob: DOB, today: TODAY, riskIds: ['diabetes'], pcvDoses: BABY_PCV13, ppsv23Doses: [], ...extra,
});
const card = (out, re) => out.recs.find((r) => re.test(r.doseLabel));
const LINE = 'If PPSV23 is chosen, no dose is needed at 19 [c]; at 50 the adult schedule gives 1 dose of PCV20 or PCV21 [c].';

describe('Owen: Option B says what PPSV23 leads to at 50, under Why this', () => {
  it('the line is on Option B, behind the fold, not in view', () => {
    const b = card(owen(), /^Option B: 1 dose PPSV23/);
    expect(detail(b)).toContain(LINE);
    expect(lead(b)).not.toContain('If PPSV23 is chosen');
  });

  it('cites CDC’s adult rows for 19 and for 50, each declared as about another group', () => {
    const b = card(owen(), /^Option B: 1 dose PPSV23/);
    const keys = b.noteCites.map((c) => c.key);
    expect(keys).toContain('adultChronicOnlyReviewAt50');
    expect(keys).toContain('adultBothNotAt65');
    for (const k of ['adultChronicOnlyReviewAt50', 'adultBothNotAt65']) {
      expect(b.noteCites.find((c) => c.key === k).aboutAnotherGroup).toMatch(/gives this patient at (19|50)/);
    }
    // One citation per [c], in reading order.
    expect((all(b).match(/\[c\]/g) ?? []).length).toBe(b.noteCites.length);
  });

  it('and it is what the app itself says on his road after the PPSV23', () => {
    const ppsv23Doses = [{ product: 'PPSV23', date: TODAY }];
    const at19 = recommend({ dob: DOB, today: '2031-11-07', riskIds: ['diabetes'], pcvDoses: BABY_PCV13, ppsv23Doses }).recs[0];
    expect(at19.status).toBe('no-dose-now');
    expect(at19.noteCites.map((c) => c.key)).toContain('adultChronicOnlyReviewAt50');
    const at50 = recommend({ dob: DOB, today: '2062-11-07', riskIds: ['diabetes'], pcvDoses: BABY_PCV13, ppsv23Doses }).recs[0];
    expect(at50.doseLabel).toMatch(/^PCV20 or PCV21 ≥5 years after last pneumococcal dose/);
    expect(at50.noteCites.map((c) => c.key)).toContain('adultBothNotAt65');
  });

  it('Option A is untouched: after PCV20 he is complete at 50, with no line', () => {
    const a = card(owen(), /^Option A: 1 dose PCV20/);
    expect(all(a)).not.toMatch(/at 50/);
    const at50 = recommend({ dob: DOB, today: '2062-11-07', riskIds: ['diabetes'], ppsv23Doses: [],
      pcvDoses: [...BABY_PCV13, { product: 'PCV20', date: TODAY }] }).recs[0];
    expect(at50.status).toBe('complete');
  });

  it('the doses, dates and visible words are untouched — a folded sentence and two citations only', () => {
    const now = owen();
    const shape = (o) => o.recs.map((r) => [r.doseLabel, r.status, r.dueToday, r.earliestNextDate ?? null, lead(r)]);
    expect(shape(now)).toEqual([
      ['Option A: 1 dose PCV20 (≥8 weeks)', 'risk-based', true, null, ''],
      ['Option B: 1 dose PPSV23 (≥8 weeks)', 'risk-based', true, null, 'Choose Option A or B, not both.'],
    ]);
    const before = recommendBeforeFold({ dob: DOB, today: TODAY, riskIds: ['diabetes'], pcvDoses: BABY_PCV13, ppsv23Doses: [] });
    expect(before.recs.map((r) => [r.doseLabel, r.status])).toEqual(now.recs.map((r) => [r.doseLabel, r.status]));
  });
});

describe('every chronic-only condition a child can have gets the same line', () => {
  for (const risk of ['chronic_heart', 'chronic_lung', 'chronic_liver', 'diabetes']) {
    it(risk, () => {
      const b = card(owen({ riskIds: [risk] }), /^Option B: 1 dose PPSV23/);
      expect(detail(b)).toContain(LINE);
    });
  }
});

describe('Cora keeps her own line, in view, and never gets this one', () => {
  it('cochlear implant: the at-19 dose line, not the at-50 line', () => {
    const b = card(owen({ riskIds: ['cochlear_implant'] }), /^Option B: 1 dose PPSV23/);
    expect(lead(b)).toMatch(/If PPSV23 is chosen, at 19 the adult schedule gives 1 dose of PCV20 or PCV21/);
    expect(all(b)).not.toContain('no dose is needed at 19');
  });

  it('chronic condition AND a cochlear implant: the dose at 19 governs, so Cora’s line', () => {
    const b = card(owen({ riskIds: ['diabetes', 'cochlear_implant'] }), /^Option B: 1 dose PPSV23/);
    expect(lead(b)).toMatch(/If PPSV23 is chosen, at 19 /);
    expect(all(b)).not.toContain('no dose is needed at 19');
  });
});
