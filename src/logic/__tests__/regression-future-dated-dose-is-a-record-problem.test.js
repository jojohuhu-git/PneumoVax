// A dose dated in the FUTURE (owner decision 2026-10-12: fix it, same as
// before-birth).
//
// PneumoVax accepted one as a real, counted dose. A PCV13 typed as 2030-05-01
// with today at 2026-01-01 came back `valid`, with no warning, and went into
// the effective series — so the app would tell a clinician the patient is
// covered by a shot that is not in their arm, and could call a series complete
// on the strength of it. Typing 2030 for 2020 is the same slip as typing 2019
// for 2021; the app caught one direction and not the other.
//
// This is the same family as S10-N2: a RECORD PROBLEM — the entry is wrong,
// not the timing — so it does not count, says a mistyped year is the likely
// cause, and advises no repeat. Rule and wording ported from MeningoVax's G3.
import { describe, it, expect } from 'vitest';
import { analyzeBoth } from '../validate.js';

const TODAY = '2026-01-01';
const DOB = '2020-01-01';
const REPEAT = /repeat this dose only/i;

function run({ pcvDoses = [], ppsv23Doses = [], ageMonths = 72, dob = DOB, today = TODAY, riskIds = [] }) {
  return analyzeBoth({ pcvDoses, ppsv23Doses, ageMonths, today, dob, riskIds });
}
const allText = (v) => [...v.reasons, v.detail ?? ''].join(' ');

describe('a dose dated in the future is a record problem', () => {
  it('does not count, and does not join the series', () => {
    const r = run({ pcvDoses: [{ date: '2030-05-01', product: 'PCV13' }] });
    expect(r.pcv.perDose[0].status).toBe('invalid');
    expect(r.pcv.perDose[0].doesNotCount).toBe(true);
    expect(r.pcv.effective.length).toBe(0);
  });

  it('is marked a record problem and never says to repeat it', () => {
    const v = run({ pcvDoses: [{ date: '2030-05-01', product: 'PCV13' }] }).pcv.perDose[0];
    expect(v.recordProblem).toBe('future');
    expect(allText(v)).not.toMatch(REPEAT);
  });

  it("says today's date, so the clinician can see why it was refused", () => {
    const v = run({ pcvDoses: [{ date: '2030-05-01', product: 'PCV13' }] }).pcv.perDose[0];
    const text = allText(v);
    expect(text).toMatch(/in the future/i);
    expect(text).toMatch(/2026/);
  });

  it('names both likely causes — a mistyped year, or an appointment not yet attended', () => {
    const text = allText(run({ pcvDoses: [{ date: '2030-05-01', product: 'PCV13' }] }).pcv.perDose[0]);
    expect(text).toMatch(/typo|mistyped/i);
    expect(text).toMatch(/appointment/i);
  });

  it('applies to PPSV23 as well as PCV', () => {
    const v = run({ ppsv23Doses: [{ date: '2030-05-01', product: 'PPSV23' }] }).ppsv23.perDose[0];
    expect(v.recordProblem).toBe('future');
    expect(allText(v)).not.toMatch(REPEAT);
  });

  it("a dose dated today still counts — the boundary is 'after today', not 'today'", () => {
    const v = run({ pcvDoses: [{ date: TODAY, product: 'PCV13' }] }).pcv.perDose[0];
    expect(v.recordProblem).toBeUndefined();
    expect(v.status).not.toBe('invalid');
  });

  it('a dose dated yesterday still counts', () => {
    const v = run({ pcvDoses: [{ date: '2025-12-31', product: 'PCV13' }] }).pcv.perDose[0];
    expect(v.recordProblem).toBeUndefined();
  });

  // A wild year (2099) is the commonest shape of this typo. It is NOT also a
  // before-birth date, so this pins the verdict, not the order the two tests
  // run in — see the note in validate.js about why that order is currently
  // unfalsifiable here.
  it('a wild future year reports as future, not as something else', () => {
    const v = run({ pcvDoses: [{ date: '2099-01-01', product: 'PCV13' }] }).pcv.perDose[0];
    expect(v.recordProblem).toBe('future');
  });

  // A record problem must beat the product rules too: the reason a PCV21 on a
  // child is refused should be the impossible DATE, not the licensing age,
  // or the clinician is sent to check the wrong field.
  it('beats the PCV21 adults-only rule when the date is the real problem', () => {
    const v = run({ pcvDoses: [{ date: '2030-05-01', product: 'PCV21' }], ageMonths: 72 }).pcv.perDose[0];
    expect(v.recordProblem).toBe('future');
  });
});

describe('controls — a real dose is still graded the old way', () => {
  // §C-P2-HEALTHY (2026-10-31, Zoe): a HEALTHY child's PPSV23 is "not needed",
  // never "repeat", so this control now uses a child with a risk condition —
  // the patient W1's repeat sentence is still about.
  it('a PPSV23 genuinely given too young still says to repeat it', () => {
    const v = run({ ppsv23Doses: [{ date: '2021-06-01', product: 'PPSV23' }], riskIds: ['cochlear_implant'] }).ppsv23.perDose[0];
    expect(v.status).toBe('invalid');
    expect(v.recordProblem).toBeUndefined();
    expect(allText(v)).toMatch(REPEAT);
  });

  it('a before-birth dose still reports as before-birth', () => {
    const v = run({ pcvDoses: [{ date: '2019-05-01', product: 'PCV13' }] }).pcv.perDose[0];
    expect(v.recordProblem).toBe('before-birth');
  });

  it('an undated dose is unaffected', () => {
    const v = run({ pcvDoses: [{ date: '', product: 'PCV13', detailsUnknown: true }] }).pcv.perDose[0];
    expect(v.recordProblem).toBeUndefined();
  });
});
