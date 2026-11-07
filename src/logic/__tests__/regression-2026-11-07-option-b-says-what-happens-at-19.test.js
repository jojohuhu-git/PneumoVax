// P2-4 / R6 — OWNER RULING 2026-11-07, on "Cora": "Add one line to Option B".
//
// Cora, 14, cochlear implant, PCV13 at 2, 4, 6 and 12 months, is offered Option A
// PCV20 or Option B PPSV23, both "completes the recommended series". After PCV20
// she is finished for life. After PPSV23 her complete card says that at 19 the
// adult schedule gives PCV20 or PCV21. The clinician choosing was not told. Now
// Option B says so, in view, in the words of the adult card at 19 — worked out by
// giving the PPSV23 on Option B's date and running her to 19 (§B-AT19: never a
// hand-written "at 19" line).
//
// Limits, each because the line would be wrong or was not put to her:
//   • immunocompromised: Option B already owes a dose 5 years later, before 19;
//   • chronic conditions only: at 19 there is no dose, only a review at 50 —
//     since Owen (2026-11-07) they get the AGE-50 line instead, folded; see
//     regression-2026-11-07-owen-option-b-says-what-happens-at-50.test.js;
//   • "Option B-2", the PPSV23 after Option B-1's PCV15: not this choice.
import { describe, it, expect } from 'vitest';
import { recommend, recommendBeforeFold } from '../recommend.js';

const TODAY = '2026-11-07';
const lead = (r) => (typeof r.note === 'string' ? r.note : r.note?.lead ?? '');
const all = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);
const BABY_PCV13 = ['2013-01-07', '2013-03-07', '2013-05-07', '2013-11-07'].map((date) => ({ product: 'PCV13', date }));
const child = (riskIds, extra = {}) => recommend({
  dob: '2012-11-07', today: TODAY, riskIds, pcvDoses: BABY_PCV13, ppsv23Doses: [], ...extra,
});
const card = (out, re) => out.recs.find((r) => re.test(r.doseLabel));
const LINE = 'If PPSV23 is chosen, at 19 the adult schedule gives 1 dose of PCV20 or PCV21, at least 5 years after the last pneumococcal dose [c].';

describe('Cora: Option B says what PPSV23 leads to at 19', () => {
  it('the line is on Option B, in view, cited to the adult row for 19', () => {
    const b = card(child(['cochlear_implant']), /^Option B: 1 dose PPSV23/);
    expect(lead(b)).toContain(LINE);
    const keys = b.noteCites.map((c) => c.key);
    expect(keys).toContain('adultIc1949BothPcv13Ppsv');
    const adult = b.noteCites.find((c) => c.key === 'adultIc1949BothPcv13Ppsv');
    expect(adult.aboutAnotherGroup).toMatch(/gives this patient at 19/);
    expect((all(b).match(/\[c\]/g) ?? []).length).toBe(b.noteCites.length);
  });

  it('and it is the same answer her complete card gives after the PPSV23', () => {
    const after = child(['cochlear_implant'], { ppsv23Doses: [{ product: 'PPSV23', date: TODAY }] });
    expect(all(after.recs[0])).toContain(LINE.replace('If PPSV23 is chosen, at 19 ', 'At 19, '));
  });

  it('Option A is untouched: after PCV20 she is complete, with no line at 19', () => {
    const out = child(['cochlear_implant']);
    expect(all(card(out, /^Option A: 1 dose PCV20/))).not.toMatch(/at 19/);
    const afterA = child(['cochlear_implant'], { pcvDoses: [...BABY_PCV13, { product: 'PCV20', date: TODAY }] });
    expect(afterA.recs[0].status).toBe('complete');
    expect(all(afterA.recs[0])).not.toMatch(/At 19/);
  });

  it('the doses and dates are untouched — wording and one citation only', () => {
    const now = child(['cochlear_implant']);
    const before = recommendBeforeFold({ dob: '2012-11-07', today: TODAY, riskIds: ['cochlear_implant'], pcvDoses: BABY_PCV13, ppsv23Doses: [] });
    const shape = (o) => o.recs.map((r) => [r.doseLabel, r.status, r.dueToday, r.earliestNextDate ?? null]);
    expect(shape(now)).toEqual(shape(before));
    expect(shape(now)).toEqual([
      ['Option A: 1 dose PCV20 (≥8 weeks)', 'risk-based', true, null],
      ['Option B: 1 dose PPSV23 (≥8 weeks)', 'risk-based', true, null],
    ]);
  });
});

describe('where the line does not go', () => {
  it('a child with diabetes only: at 19 there is no dose, so not this line (Owen\'s age-50 line instead)', () => {
    const b = card(child(['diabetes']), /^Option B: 1 dose PPSV23/);
    expect(b).toBeTruthy();
    expect(all(b)).not.toMatch(/If PPSV23 is chosen, at 19/);
    expect(lead(b)).not.toMatch(/If PPSV23 is chosen/);
  });

  it('an immunocompromised child: Option B owes a 5-year dose first, so no line', () => {
    const out = recommend({ dob: '2020-11-07', today: TODAY, riskIds: ['asplenia'], ppsv23Doses: [],
      pcvDoses: ['2021-01-07', '2021-03-07', '2021-05-07', '2021-11-07'].map((date) => ({ product: 'PCV13', date })) });
    const b = card(out, /^Option B: 1 dose PPSV23/);
    expect(b).toBeTruthy();
    expect(all(b)).not.toMatch(/If PPSV23 is chosen/);
  });

  it('Option B-2, the PPSV23 after a PCV15, never carries it', () => {
    const out = recommend({ dob: '2016-11-07', today: TODAY, riskIds: ['cochlear_implant'], pcvDoses: [], ppsv23Doses: [] });
    const b2 = card(out, /^Option B-2/);
    expect(b2).toBeTruthy();
    expect(all(b2)).not.toMatch(/If PPSV23 is chosen/);
  });
});
