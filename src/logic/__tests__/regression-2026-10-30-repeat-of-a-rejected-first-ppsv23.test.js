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
// ⚠ REVERSED 2026-10-31 BY THE OWNER (§C-P2-FIVE): "PPSV23 to PCV is 8 weeks,
// but PPSV23 to PPSV23 is 5 years. For Noah and Sam - they should be given
// PCV20 8 weeks after the second PPSV23 dose to avoid getting 3 PPSV23." The
// repeat of a thrown-out FIRST PPSV23 now waits 5 years, like any second
// PPSV23, so Noah's Jul 10 repeat is thrown out and his card is PCV20 only.
// This file is kept, its assertions inverted, as the record of both rulings;
// the current rule's guard is regression-2026-10-31-ppsv23-repeat-waits-five-years.
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

describe('Noah — REVERSED 2026-10-31: his repeat no longer counts', () => {
  it('the first PPSV23 is still thrown out; its repeat now waits 5 years from it', () => {
    const [first] = ppsvDoses(NOAH);
    expect(first.status).toBe('invalid');
    expect(first.intervalRuleId).toBe('CHILD-PPSV23-AFTER-PCV');
    // Was 2023-06-24 (8 weeks). The repeat is another PPSV23: 5 years.
    expect(first.repeatDueDate).toBe('2028-04-29');
    expect(first.reasons.join(' ')).toContain('can be given from Apr 29, 2028 at the earliest');
  });

  it('the repeat on 2023-07-10 — REVERSED: thrown out, inside 5 years of the first', () => {
    const [, repeat] = ppsvDoses(NOAH);
    expect(repeat.status).toBe('invalid');
    expect(repeat.intervalRuleId).toBe('CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST');
    expect(analyzeBoth(NOAH).ppsv23.effective).toEqual([]);
  });

  it('his card is PCV20 only — never a third PPSV23 (as before, for a new reason)', () => {
    const recs = recsOf(NOAH);
    expect(recs.map((r) => r.doseLabel)).toEqual(['1 dose PCV20 (≥8 weeks) — completes the series']);
    expect(recs.map((r) => r.doseLabel).join(' ')).not.toContain('Option B: 1 dose PPSV23');
    expect(allText(recs)).not.toContain('neither PCV20 nor PPSV23');
  });

  // CHANGED 2026-10-31 (late) by §C-P2-ONE, the owner's ruling on "Leah":
  // with only the thrown-out shot on record he is owed PCV20 alone — a
  // second polysaccharide shot is avoided and PCV20 completes the series.
  // This used to pin "Option A PCV20 / Option B PPSV23".
  it('without the repeat he is still owed a dose: PCV20 only — §C-P2-ONE', () => {
    const labels = recsOf(NOAH_NO_REPEAT).map((r) => r.doseLabel);
    expect(labels).toEqual(['1 dose PCV20 (≥8 weeks) — completes the series']);
  });
});

describe('the repeat is spaced from the rejected dose — RULING D still holds, at 5 years', () => {
  it('a repeat 6 weeks after the rejected dose does not count, and says 5 years', () => {
    const p = { ...NOAH_BASE, ppsv23Doses: d('PPSV23', ['2023-04-29', '2023-06-10']) };
    const [, repeat] = ppsvDoses(p);
    expect(repeat.status).toBe('invalid');
    expect(repeat.intervalRuleId).toBe('CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST');
    expect(repeat.reasons[0]).toBe(
      'Given 42 days after the PPSV23 dose of Apr 29, 2023, which did not count — a PPSV23 after another PPSV23 is given at least 5 years after it, whether or not that dose counted.',
    );
    // 2023-06-10 + 5 years, no grace (owner ruling 2026-10-24).
    expect(repeat.repeatDueDate).toBe('2028-06-10');
  });

  it('REVERSED 2026-10-31: 52 days after the rejected dose no longer counts', () => {
    const at = (date) => ppsvDoses({ ...NOAH_BASE, ppsv23Doses: d('PPSV23', ['2023-04-29', date]) })[1];
    expect(at('2023-06-20').status).toBe('invalid');
  });

  it('the repeat must also be 8 weeks after a PCV — that row still speaks', () => {
    // PPSV23 rejected 2023-04-05 (4 days after a PCV13). A later PCV13 on
    // 2028-03-20; a repeat on 2028-04-10 is 5 years after the bad dose but 21
    // days after that PCV13 — thrown out by the PCV row; on 2028-05-20 both
    // rows are met.
    const late = { ...NOAH_BASE, ageMonths: 69 + 24, today: '2028-10-30',
      pcvDoses: d('PCV13', ['2023-02-01', '2023-04-01', '2028-03-20']) };
    const at = (date) => ppsvDoses({ ...late, ppsv23Doses: d('PPSV23', ['2023-04-05', date]) })[1];
    expect(at('2028-04-10').status).toBe('invalid');
    expect(at('2028-04-10').intervalRuleId).toBe('CHILD-PPSV23-AFTER-PCV');
    expect(at('2028-05-20').status).toBe('valid');
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
