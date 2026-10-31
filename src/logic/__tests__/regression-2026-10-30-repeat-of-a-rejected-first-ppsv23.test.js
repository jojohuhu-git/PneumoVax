// ── 2026-10-30: the repeat of a rejected FIRST PPSV23 is the first PPSV23 ────
//
// OWNER RULING 2026-10-30, on Noah below — "Counts as 1st PPSV23".
//
// WHAT THE APP SAID BEFORE. A child's PPSV23 given 4 weeks after a PCV is
// rejected (`CHILD-PPSV23-AFTER-PCV`), and its chip says the repeat "can be
// given from Jun 24, 2023 at the earliest" — 8 weeks after the dose given,
// RULING D. The clinic repeats it on Jul 10, 2023. The app then threw THAT
// out as well: `CHILD-PPSV23-AFTER-INVALID-PPSV23` measured it as a SECOND
// PPSV23 against the rejected one and asked for 5 years — "not until Jul 10,
// 2028". So the chip's own date was a date the app would refuse, and the card
// offered PCV20 or "1 dose of PPSV23" again: the child's THIRD PPSV23 shot.
//
// WHY. CDC General Best Practices, Timing and Spacing (read live 2026-10-30):
// "The repeat dose should be spaced after the invalid dose by the recommended
// minimum interval" — and its own example ends "The repeat dose is counted as
// the valid second dose." The repeat of an invalid dose takes that dose's
// place in the series. A repeat of a rejected FIRST PPSV23 is the valid FIRST
// PPSV23, and the interval that governs a first PPSV23 is CDC's 8 weeks
// (child notes: "1 dose PPSV23 at least 8 weeks after the most recent PCV
// dose", 9 times, read live the same day). The 5 years is the gap between
// dose 1 and dose 2, so it applies only once a PPSV23 has COUNTED.
//
// ⚠ THE GRID CANNOT REACH THESE CHILDREN — hand-built, every one.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeBoth } from '../validate.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));

// Noah: no spleen. Catch-up PCV13 at 25 and 27 months. PPSV23 on 2023-04-29,
// only 4 weeks after the PCV13 — rejected. Repeated on 2023-07-10, 10 weeks
// after the rejected dose and 14 weeks after the PCV13. 5 years old today.
const NOAH_BASE = {
  dob: '2021-01-01', ageMonths: 69, today: '2026-10-30', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2023-02-01', '2023-04-01']),
};
const NOAH = { ...NOAH_BASE, ppsv23Doses: d('PPSV23', ['2023-04-29', '2023-07-10']) };
const NOAH_NO_REPEAT = { ...NOAH_BASE, ppsv23Doses: d('PPSV23', ['2023-04-29']) };

const ppsvDoses = (p) => analyzeBoth(p).ppsv23.perDose;
const recsOf = (p) => recommend(p).recs;
const allText = (recs) => recs.map((r) => JSON.stringify(r.note) + ' ' + (r.doseLabel || '')).join(' ');

describe('Noah — the repeat of his rejected first PPSV23 counts as his first', () => {
  it('the first PPSV23 is still thrown out, and its chip still names Jun 24, 2023', () => {
    const [first] = ppsvDoses(NOAH);
    expect(first.status).toBe('invalid');
    expect(first.intervalRuleId).toBe('CHILD-PPSV23-AFTER-PCV');
    expect(first.repeatDueDate).toBe('2023-06-24');
    expect(first.reasons.join(' ')).toContain('can be given from Jun 24, 2023 at the earliest');
  });

  it('the repeat on 2023-07-10 counts, as PPSV23 dose 1', () => {
    const [, repeat] = ppsvDoses(NOAH);
    expect(repeat.status).toBe('valid');
    expect(repeat.effectiveDoseNum).toBe(1);
    expect(analyzeBoth(NOAH).ppsv23.effective.map((x) => x.date)).toEqual(['2023-07-10']);
    // Pre-fix: "not until Jul 10, 2028" — the second-dose gap, measured from a
    // dose that never counted.
    expect(JSON.stringify(repeat)).not.toContain('2028');
  });

  it('his card is the card of a child who HAS had one PPSV23 — never a third', () => {
    const recs = recsOf(NOAH);
    const withOne = recsOf({ ...NOAH_BASE, ppsv23Doses: d('PPSV23', ['2023-07-10']) });
    // Exactly the card he would get had the bad dose never been given: the
    // rejected dose changes nothing about what he is owed.
    expect(recs.map((r) => [r.vaccine, r.status, r.doseLabel])).toEqual(
      withOne.map((r) => [r.vaccine, r.status, r.doseLabel]),
    );
    // Pre-fix: "Option B: 1 dose PPSV23 (≥8 weeks)" — a third PPSV23 shot.
    expect(recs.map((r) => r.doseLabel).join(' ')).not.toContain('Option B: 1 dose PPSV23');
    expect(allText(recs)).not.toContain('neither PCV20 nor PPSV23');
  });

  it('without the repeat he is still owed his PPSV23 or PCV20 — unchanged', () => {
    const labels = recsOf(NOAH_NO_REPEAT).map((r) => r.doseLabel);
    expect(labels).toEqual(['Option A: 1 dose PCV20 (≥8 weeks)', 'Option B: 1 dose PPSV23 (≥8 weeks)']);
  });
});

describe('the repeat is spaced from the rejected dose — RULING D still holds', () => {
  it('a repeat 6 weeks after the rejected dose does not count, and says 8 weeks', () => {
    const p = { ...NOAH_BASE, ppsv23Doses: d('PPSV23', ['2023-04-29', '2023-06-10']) };
    const [, repeat] = ppsvDoses(p);
    expect(repeat.status).toBe('invalid');
    expect(repeat.intervalRuleId).toBe('CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST');
    expect(repeat.reasons[0]).toBe(
      'Given 42 days after the PPSV23 dose of Apr 29, 2023, which did not count — the repeat of a PPSV23 that did not count is given at least 8 weeks (56 days) after it.',
    );
    // 2023-06-10 + 56 days, no grace (owner ruling 2026-10-24).
    expect(repeat.repeatDueDate).toBe('2023-08-05');
  });

  it('CDC\'s 4-day grace applies: 52 days counts, 51 does not', () => {
    const at = (date) => ppsvDoses({ ...NOAH_BASE, ppsv23Doses: d('PPSV23', ['2023-04-29', date]) })[1];
    expect(at('2023-06-20').status).toBe('valid');
    expect(at('2023-06-19').status).toBe('invalid');
  });

  it('the repeat must also be 8 weeks after the PCV — that row still speaks', () => {
    // PCV13 on 2023-04-01; a PPSV23 rejected on 2023-04-05 (4 days later); a
    // repeat on 2023-05-31 is 56 days after the bad dose but only 60 after
    // the PCV, so both rows are met — and on 2023-05-20 neither is.
    const at = (date) => ppsvDoses({ ...NOAH_BASE, ppsv23Doses: d('PPSV23', ['2023-04-05', date]) })[1];
    expect(at('2023-05-31').status).toBe('valid');
    expect(at('2023-05-20').status).toBe('invalid');
  });
});

describe('the 5-year floor after a rejected PPSV23 stays — when one has already counted', () => {
  // An immunocompromised child whose FIRST PPSV23 counted, whose second was
  // given 19 days after a PCV13 and rejected, and whose third came a year
  // after that. The third is the repeat of a rejected SECOND dose, so the
  // second-dose gap governs it — 5 years from the dose given (Ruling D).
  const KEPT = {
    dob: '2016-01-01', ageMonths: 129, today: '2026-10-30', riskIds: ['asplenia'],
    pcvDoses: d('PCV13', ['2016-03-01', '2016-05-01', '2016-07-01', '2017-01-05', '2020-01-01']),
    ppsv23Doses: d('PPSV23', ['2018-01-15', '2020-01-20', '2021-01-20']),
  };

  it('still throws out the repeat of a rejected second dose inside 5 years', () => {
    const [first, second, third] = ppsvDoses(KEPT);
    expect(first.status).toBe('valid');
    expect(second.status).toBe('invalid');
    expect(second.intervalRuleId).toBe('CHILD-PPSV23-AFTER-PCV');
    expect(third.status).toBe('invalid');
    expect(third.intervalRuleId).toBe('CHILD-PPSV23-AFTER-INVALID-PPSV23');
  });
});
