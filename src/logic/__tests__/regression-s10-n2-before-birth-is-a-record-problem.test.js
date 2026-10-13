// S10-N2 (owner decision 2026-10-12: "copy what MeningoVax does").
//
// A dose dated before the patient was born was being told two things at once:
//
//   "...this dose cannot be correct. Check the date... It does not count."
//   "This dose does not count toward the series — repeat this dose only."
//
// The first says the entry is a typo; the second says put a needle in the
// patient's arm. MeningoVax settled this in its own P1-1/G3 work by separating
// two different kinds of "invalid": a dose that was really GIVEN at the wrong
// time (repeat it), and a RECORD PROBLEM where the entry itself is wrong
// (correct the record; repeating a shot nobody received is nonsense).
//
// W1's grouping is unchanged for every other invalid reason — a dose genuinely
// given below the minimum age still says "repeat this dose only". The control
// cases below hold that in place.
import { describe, it, expect } from 'vitest';
import { analyzeBoth } from '../validate.js';

const REPEAT = /repeat this dose only/i;

function verdicts({ pcvDoses = [], ppsv23Doses = [], ageMonths = 72, dob = '2020-01-01', today = '2026-01-01' }) {
  return analyzeBoth({ pcvDoses, ppsv23Doses, ageMonths, today, dob, riskIds: [] });
}
const allText = (v) => [...v.reasons, v.detail ?? ''].join(' ');

describe('S10-N2 — a date before birth is a record problem, not a missing dose', () => {
  it('does not count the dose', () => {
    const r = verdicts({ pcvDoses: [{ date: '2019-05-01', product: 'PCV13' }] });
    expect(r.pcv.perDose[0].status).toBe('invalid');
    expect(r.pcv.perDose[0].doesNotCount).toBe(true);
    expect(r.pcv.effective.length).toBe(0);
  });

  it('never tells the clinician to repeat it', () => {
    const r = verdicts({ pcvDoses: [{ date: '2019-05-01', product: 'PCV13' }] });
    expect(allText(r.pcv.perDose[0])).not.toMatch(REPEAT);
  });

  it('says a mistyped year is the usual cause, and what to do instead', () => {
    const v = verdicts({ pcvDoses: [{ date: '2019-05-01', product: 'PCV13' }] }).pcv.perDose[0];
    const text = allText(v);
    expect(text).toMatch(/mistyped year/i);
    expect(text).toMatch(/No repeat dose is needed/i);
  });

  it('names the recorded date of birth, so the typo can be found', () => {
    const v = verdicts({ pcvDoses: [{ date: '2019-05-01', product: 'PCV13' }] }).pcv.perDose[0];
    expect(allText(v)).toMatch(/2020/);
  });

  it('marks it as a record problem, so nothing downstream re-adds advice', () => {
    const v = verdicts({ pcvDoses: [{ date: '2019-05-01', product: 'PCV13' }] }).pcv.perDose[0];
    expect(v.recordProblem).toBe('before-birth');
  });

  it('applies to PPSV23 as well as PCV', () => {
    const v = verdicts({ ppsv23Doses: [{ date: '2019-05-01', product: 'PPSV23' }] }).ppsv23.perDose[0];
    expect(v.status).toBe('invalid');
    expect(allText(v)).not.toMatch(REPEAT);
    expect(v.recordProblem).toBe('before-birth');
  });

  // A boundary case: days before the birthday, not years. PneumoVax catches
  // this either way (its age calculation goes fractionally negative for a
  // single day), so this pins the boundary rather than one implementation of
  // it — see the note in validate.js.
  it('catches a dose dated a few days before the birthday', () => {
    const v = verdicts({ pcvDoses: [{ date: '2019-12-28', product: 'PCV13' }] }).pcv.perDose[0];
    expect(v.recordProblem).toBe('before-birth');
    expect(allText(v)).not.toMatch(REPEAT);
  });

  // When the age was typed in as years/months there is no birthday to compare
  // against; the most the app can honestly say is that the computed age came
  // out negative.
  it('still catches it when only an age was entered, and says so', () => {
    const r = analyzeBoth({
      pcvDoses: [{ date: '2019-05-01', product: 'PCV13' }],
      ppsv23Doses: [], ageMonths: 72, today: '2026-01-01', dob: null, riskIds: [],
    });
    const v = r.pcv.perDose[0];
    expect(v.recordProblem).toBe('before-birth');
    expect(allText(v)).toMatch(/age entered/i);
  });

  // Moving the record-problem test into the walk, ahead of every
  // vaccine-specific rule, fixed this as a side effect. The check used to sit
  // INSIDE each validator, which put it AFTER the PCV21 licensing test: a
  // PCV21 dated before a child's birth was refused with "PCV21 is licensed for
  // adults 18 years and over", sending the clinician to check the product when
  // the real problem was the date.
  it('blames the impossible date, not the product licence', () => {
    const v = verdicts({ pcvDoses: [{ date: '2019-05-01', product: 'PCV21' }], ageMonths: 72 }).pcv.perDose[0];
    expect(v.recordProblem).toBe('before-birth');
    expect(allText(v)).not.toMatch(/licensed for adults/i);
  });
});

describe('S10-N2 controls — W1 still stands for a dose that was really given', () => {
  it('a PPSV23 genuinely given below the minimum age still says to repeat it', () => {
    const v = verdicts({ ppsv23Doses: [{ date: '2021-06-01', product: 'PPSV23' }] }).ppsv23.perDose[0];
    expect(v.status).toBe('invalid');
    expect(allText(v)).toMatch(REPEAT);
    expect(v.recordProblem).toBeUndefined();
  });

  it('a dose rejected on timing alone still says it is not repeated', () => {
    const r = verdicts({ pcvDoses: [
      { date: '2020-03-01', product: 'PCV13' },
      { date: '2020-03-15', product: 'PCV13' },
    ] });
    const v = r.pcv.perDose[1];
    expect(v.status).toBe('invalid');
    expect(allText(v)).toMatch(/It is not repeated/i);
    expect(v.recordProblem).toBeUndefined();
  });
});
