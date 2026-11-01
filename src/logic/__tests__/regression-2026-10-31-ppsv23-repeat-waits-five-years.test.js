// ── 2026-10-31: a child's PPSV23 after ANY earlier PPSV23 waits 5 years ──────
//
// OWNER RULING 2026-10-31, REVERSING §C-P2-REPEAT (Noah, 2026-10-30) and the
// 8-week half of §C-P2-GREY (Sam, earlier 2026-10-31). Her words: "PPSV23 to
// PCV is 8 weeks, but PPSV23 to PPSV23 is 5 years. For Noah and Sam - they
// should be given PCV20 8 weeks after the second PPSV23 dose to avoid getting
// 3 PPSV23."
//
// So the repeat of a thrown-out FIRST PPSV23 is measured like any second
// PPSV23: 5 years from the dose given (CDC child notes, read live 2026-10-31:
// "dose 2 PPSV23 at least 5 years after dose 1 PPSV23"; CDC General Best
// Practices: "The repeat dose should be spaced after the invalid dose by the
// recommended minimum interval"). Until today it was 8 weeks — the interval
// that belongs to a first PPSV23 after a PCV.
//
// WHAT FOUND IT. A 25-month-old with diabetes, PPSV23 at 23 months (too young,
// thrown out): her card offered "Option B: 1 dose PPSV23" due TODAY, 46 days
// after it, and the dose check then threw that PPSV23 out — the app advising a
// date it refuses (CLAUDE.md, "advises and grades by one number").
//
// ⚠ Hand-built: the grid holds no child with a thrown-out PPSV23 and a repeat.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { addCalendarMonths, addDays } from '../dateUtils.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));
const labels = (out) => out.recs.map((r) => r.doseLabel);

// Noah, 5, no spleen: catch-up PCV13 at 25 and 27 months; PPSV23 on
// 2023-04-29, 4 weeks after the PCV13 (thrown out); repeated 2023-07-10.
const NOAH = {
  dob: '2021-01-01', ageMonths: 69, today: '2026-10-30', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2023-02-01', '2023-04-01']),
  ppsv23Doses: d('PPSV23', ['2023-04-29', '2023-07-10']),
};
// Sam, 2, no spleen: infant PCV13 series; PPSV23 at 23 months (too young),
// again 5 weeks later.
const SAM = {
  dob: '2023-01-01', ageMonths: 34, today: '2025-11-01', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2023-03-01', '2023-05-01', '2023-07-01', '2024-01-05']),
  ppsv23Doses: d('PPSV23', ['2024-12-01', '2025-01-05']),
};
// The toddler: 25 months, diabetes, PCV15 at 2, 4, 6 and 12 months, PPSV23 at
// 23.5 months (too young, thrown out), 46 days ago.
const TODDLER = {
  dob: '2024-09-30', ageMonths: 25, today: '2026-10-31', riskIds: ['diabetes'],
  pcvDoses: d('PCV15', ['2024-11-30', '2025-01-30', '2025-03-30', '2025-09-30']),
  ppsv23Doses: d('PPSV23', ['2026-09-15']),
};

describe('Noah — his repeat 10 weeks later no longer counts; PCV20 only', () => {
  const out = recommend(NOAH);

  it('the repeat is thrown out, measured 5 years from the thrown-out dose', () => {
    const [, repeat] = out.perDose.ppsv23;
    expect(repeat.status).toBe('invalid');
    expect(repeat.intervalRuleId).toBe('CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST');
    expect(repeat.reasons[0]).toContain('at least 5 years after it');
    // When THIS dose would have counted: 2023-04-29 + 5 years, less CDC's
    // 4-day grace. The repeat of THIS dose is 5 years from the day it was
    // given, with no grace — the app never advises inside it (2026-10-24).
    expect(repeat.earliestValidDate).toBe('2028-04-25');
    expect(repeat.repeatDueDate).toBe('2028-07-10');
  });

  it('his card is PCV20 only — a PPSV23 would be his third', () => {
    expect(labels(out)).toEqual(['1 dose PCV20 (≥8 weeks) — completes the series']);
    expect(out.recs[0].note.lead).toContain('No further PPSV23: 2 PPSV23 doses have been given and neither counted.');
  });
});

describe('Sam — verdict unchanged, the grey note states the 5 years', () => {
  const out = recommend(SAM);

  it('both PPSV23 doses stay thrown out and the card is PCV20 only', () => {
    expect(out.perDose.ppsv23.map((x) => x.status)).toEqual(['invalid', 'invalid']);
    expect(labels(out)).toEqual(['1 dose PCV20 (≥8 weeks) — completes the series']);
  });

  it('the note names 5 years, never the old 8 weeks', () => {
    const text = out.recs[0].note.detail + ' ' + out.perDose.ppsv23[1].reasons.join(' ');
    expect(text).toContain('This app spaces any PPSV23 at least 5 years from the PPSV23 before it, so the Jan 5, 2025 dose is not counted.');
    expect(text).not.toContain('spaces the repeat 8 weeks');
  });
});

describe('the toddler — the card never advises a PPSV23 the dose check refuses', () => {
  const out = recommend(TODDLER);
  const optionB = out.recs.find((r) => r.vaccine === 'PPSV23');

  it('Option B PPSV23 is held to 5 years after the thrown-out dose, not due today', () => {
    expect(optionB.dueToday).toBe(false);
    expect(optionB.earliestNextDate).toBe(addCalendarMonths('2026-09-15', 60));
  });

  it('Option A PCV20 is still due today — a thrown-out PPSV23 holds off no conjugate (Eli, Rosa)', () => {
    const optionA = out.recs.find((r) => r.vaccine === 'PCV');
    expect(optionA.dueToday).toBe(true);
  });

  it('a PPSV23 given on the advised date counts; one given today does not', () => {
    const at = (date) => recommend({
      ...TODDLER, today: date, ageMonths: 25 + 60,
      ppsv23Doses: d('PPSV23', ['2026-09-15', date]),
    }).perDose.ppsv23[1];
    expect(at(optionB.earliestNextDate).status).toBe('valid');
    expect(recommend({ ...TODDLER, ppsv23Doses: d('PPSV23', ['2026-09-15', '2026-10-31']) })
      .perDose.ppsv23[1].status).toBe('invalid');
  });

  it('the card says why the PPSV23 waits', () => {
    expect(optionB.note.lead ?? optionB.note).toContain('Held to 5 years after this child\'s PPSV23 of Sep 15, 2026, which did not count');
  });
});

// The grid's 12-patient family: an immunocompromised teenager whose FIRST
// PPSV23 counted and whose SECOND came a day after a PCV13 and was thrown out.
// Her "2nd PPSV23" card counted 5 years from the first dose (long past: "due
// today"), while the dose check (CHILD-PPSV23-AFTER-INVALID-PPSV23, RULING D)
// counts 5 years from the thrown-out one — the grid's copy was saved only by
// the 4-day grace, which decides what the app accepts, never what it advises.
describe('an immunocompromised teenager whose second PPSV23 was thrown out', () => {
  const TEEN = {
    dob: '2008-10-31', ageMonths: 216, today: '2026-10-31', riskIds: ['asplenia'],
    pcvDoses: d('PCV13', ['2021-11-01', '2021-11-29']),
    ppsv23Doses: d('PPSV23', ['2016-10-31', '2021-11-30']),
  };

  it('the 2nd PPSV23 alternative is held to 5 years after the thrown-out dose', () => {
    const alt = recommend(TEEN).recs.find((r) => r.vaccine === 'PPSV23');
    expect(alt.dueToday).toBe(false);
    expect(alt.earliestNextDate).toBe('2026-11-30');
  });

  it('given today it is thrown out; given on the advised date it counts', () => {
    const withThird = (date) => recommend({ ...TEEN, today: date,
      ppsv23Doses: d('PPSV23', ['2016-10-31', '2021-11-30', date]) }).perDose.ppsv23[2].status;
    expect(withThird('2026-10-31')).toBe('invalid');
    expect(withThird('2026-11-30')).toBe('valid');
  });

  it('her PCV20 is not held — a thrown-out PPSV23 holds off no conjugate (Eli, Rosa)', () => {
    expect(recommend(TEEN).recs.find((r) => r.vaccine === 'PCV').dueToday).toBe(true);
  });
});

describe('controls', () => {
  it('a repeat 5 years after a thrown-out first PPSV23 counts, as PPSV23 dose 1', () => {
    const p = { ...NOAH, ageMonths: 69 + 72, today: '2032-10-30',
      ppsv23Doses: d('PPSV23', ['2023-04-29', '2028-04-29']) };
    const [, repeat] = recommend(p).perDose.ppsv23;
    expect(repeat.status).toBe('valid');
    expect(repeat.effectiveDoseNum).toBe(1);
  });

  it('CDC\'s 4-day grace still applies to the 5 years: 4 days early counts, 5 does not', () => {
    const at = (date) => recommend({ ...NOAH, ageMonths: 69 + 72, today: '2032-10-30',
      ppsv23Doses: d('PPSV23', ['2023-04-29', date]) }).perDose.ppsv23[1].status;
    expect(at(addDays('2028-04-29', -4))).toBe('valid');
    expect(at(addDays('2028-04-29', -5))).toBe('invalid');
  });

  it('a child with no thrown-out PPSV23 is untouched: Option B PPSV23 due today', () => {
    const out = recommend({ ...TODDLER, ppsv23Doses: [] });
    const b = out.recs.find((r) => r.vaccine === 'PPSV23');
    expect(b.dueToday).toBe(true);
    expect(JSON.stringify(b.note)).not.toContain('Held to 5 years');
  });
});
