// ── §H-ANY65: ANY PPSV23 at 65 or older puts PCV13 + PPSV23 under shared
//    decision-making (OWNER RULING 2026-10-31, on "Pat, 70") ────────────────
//
// Pat, 70, diabetes: PCV13 at 60, PPSV23 at 60, and PPSV23 again at 65 — the
// old schedule, which gave a second PPSV23 at 65. The app read only the age of
// his FIRST PPSV23, so he was told PCV20 or PCV21 is plainly recommended. Take
// the age-60 dose away and the same man was a shared decision: one more dose
// on the record made the recommendation stronger.
//
// CDC Adult Schedule Notes (read live 2026-10-31): "Previously received both
// PCV13 and PPSV23, AND PPSV23 was received at age 65 years or older: Based on
// shared clinical decision–making, 1 dose of PCV20 or 1 dose of PCV21 at least
// 5 years after the last pneumococcal vaccine dose." mm7401a1's table words
// the row "completed the recommended vaccination series with both PCV13 and
// PPSV23 (i.e., PPSV23 administered at age ≥65 years)" — Pat completed it.
//
// The owner chose "Shared decision". Same vaccine, same date; only the status
// moves. Measured on the grid: 132 of 17,016 verdicts, all 70-year-olds with a
// PPSV23 before 65 and another at 65.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));
const statusOf = (p) => recommend(p).recs.map((r) => `${r.vaccine}:${r.status}`);

const PAT = {
  dob: '1956-07-31', today: '2026-10-31', riskIds: ['diabetes'],
  pcvDoses: d('PCV13', ['2016-09-01']),
  ppsv23Doses: d('PPSV23', ['2016-11-01', '2021-09-01']), // at 60, and at 65
};

describe('Pat, the patient she was shown', () => {
  it('is a shared decision, as he is with only his age-65 dose', () => {
    expect(statusOf(PAT)).toEqual(['PCV:shared-decision']);
    expect(statusOf({ ...PAT, ppsv23Doses: d('PPSV23', ['2021-09-01']) })).toEqual(['PCV:shared-decision']);
  });

  it('does not depend on the order the doses were typed in', () => {
    expect(statusOf({ ...PAT, ppsv23Doses: [...PAT.ppsv23Doses].reverse() })).toEqual(['PCV:shared-decision']);
  });

  it('the card says ONE of his PPSV23 doses was at 65, not "the" dose', () => {
    const detail = recommend(PAT).recs[0].note.detail;
    expect(detail).toContain('one of the PPSV23 doses was received at age 65 or older');
    const oneDose = recommend({ ...PAT, ppsv23Doses: d('PPSV23', ['2021-09-01']) }).recs[0].note.detail;
    expect(oneDose).toContain('the PPSV23 dose was received at age 65 or older');
  });

  it('keeps the same dose and date: PCV20 or PCV21, 5 years after the last dose', () => {
    const r = recommend(PAT).recs[0];
    expect(r.brands).toEqual(['PCV20 (Prevnar 20)', 'PCV21 (Capvaxive)']);
    expect(r.minIntervalMonths).toBe(60);
  });
});

describe('every risk class, and the age-only entry', () => {
  it('an immunocompromised or cochlear-implant 70-year-old is a shared decision too (the 50+ row has no risk split)', () => {
    for (const riskIds of [['cochlear_implant'], ['hiv'], []]) expect(statusOf({ ...PAT, riskIds })).toEqual(['PCV:shared-decision']);
  });

  it('entered as an age with no date of birth, it reads the same', () => {
    const { dob, ...noDob } = PAT;
    expect(statusOf({ ...noDob, ageMonths: 843 })).toEqual(['PCV:shared-decision']);
  });
});

describe('what does not move', () => {
  it('two PPSV23 doses, both before 65, stay a plain recommendation', () => {
    expect(statusOf({ ...PAT, ppsv23Doses: d('PPSV23', ['2016-11-01', '2019-12-01']) })).toEqual(['PCV:risk-based']);
  });

  it('one PPSV23 before 65 stays a plain recommendation', () => {
    expect(statusOf({ ...PAT, ppsv23Doses: d('PPSV23', ['2016-11-01']) })).toEqual(['PCV:risk-based']);
  });
});
