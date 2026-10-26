// 2026-10-26 — P5: the infant PCV floors, 38 / 66 / 94 days.
//
// Her children's table says doses 1-3 are invalid before **38 / 66 / 94 days**
// of age. The previous handoff marked this row "already correct, no work
// needed - 38+28+28 = 94 exactly. Zero slack, so it deserves a guard."
//
// ── The arithmetic in that note is wrong, and measuring says so ──────────
//
// The app does not add 28. For a dose ALREADY GIVEN it adds 28 - 4, because
// CDC's four-day grace applies to the interval as well as to the age. So the
// chain from each dose's own earliest is 38 + 24 + 24 = **86**, not 94:
//
//   dose 1 earliest                                  38   (42 - 4)
//   dose 2 earliest, dose 1 at the routine 42 days   66   = her row
//   dose 2 earliest, dose 1 at its own earliest 38   62   four days under
//   dose 3 earliest, doses at the routine 42 / 70    94   = her row
//   dose 3 earliest, each dose at its own earliest   86   eight days under
//
// ── That is not a defect, and the live source is why ─────────────────────
//
// CDC, General Best Practices, "Timing and Spacing of Immunobiologics",
// fetched live 2026-10-26 (the grace-period definition):
//
//   "grace period", vaccine doses administered <=4 days before the minimum
//    interval or age are considered valid.
//
// "the minimum interval OR age" - each minimum gets the grace, independently.
// The page's DTaP-4 footnote applies it to both at once for one dose ("the
// minimum age of 15 months AND the minimum interval between DTaP-3 and
// DTaP-4"), and nothing on the page bars a dose validated by the grace from
// anchoring the next interval. CDC measures the next interval from the dose
// the patient GOT - the same sentence RULING D rests on.
//
// So **both** readings are right about different children. Her 38 / 66 / 94
// describes a child vaccinated on the routine schedule, and the app matches it
// exactly there. A child whose earlier doses were themselves four days early
// is a different child, and her floors move with her doses.
//
// ⚠ WHAT THIS FILE IS FOR. The floors are a composition of three constants
// (42 minimum age, 28 interval, 4 grace) and nothing asserted the result. This
// pins the numbers a clinician actually sees, BOTH chains, so that changing
// any one constant - or applying the grace once instead of per interval -
// fails here with the real day numbers in the message.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { addDays } from '../dateUtils.js';
import { GRACE_DAYS, PCV_MIN_INTERVAL_DAYS_UNDER_12M } from '../intervals.js';
import { PCV_MIN_AGE_DAYS } from '../../data/brands.js';

const TODAY = '2026-10-25';
const DOB = '2026-01-01';

/** An infant with PCV20 doses at the given ages in DAYS. */
const infant = (dayAges) => recommend({
  today: TODAY,
  dob: DOB,
  ageMonths: 9,
  riskIds: [],
  pcvDoses: dayAges.map((d) => ({ product: 'PCV20', date: addDays(DOB, d) })),
  ppsv23Doses: [],
});

const statuses = (dayAges) => (infant(dayAges).perDose?.pcv ?? []).map((d) => d.status);

/** The youngest age in days at which the next dose is accepted. */
const earliestNextDose = (priorDayAges, from, to) => {
  for (let d = from; d <= to; d += 1) {
    if (statuses([...priorDayAges, d])[priorDayAges.length] === 'valid') return d;
  }
  return null;
};

describe('the infant PCV floors are a composition of three constants', () => {
  it('and those constants are 42, 28 and 4', () => {
    // If any of these moves, every number below moves with it, and the
    // failures in this file will say by how much.
    expect(PCV_MIN_AGE_DAYS).toBe(42);
    expect(PCV_MIN_INTERVAL_DAYS_UNDER_12M).toBe(28);
    expect(GRACE_DAYS).toBe(4);
  });

  it('dose 1 is rejected at 37 days and accepted at 38 — the exact boundary', () => {
    expect(statuses([37])).toEqual(['invalid']);
    expect(statuses([38])).toEqual(['valid']);
    expect(earliestNextDose([], 30, 50)).toBe(PCV_MIN_AGE_DAYS - GRACE_DAYS);
  });
});

describe('her row exactly — a child vaccinated on the routine schedule', () => {
  // Routine ages 6 / 10 / 14 weeks = 42 / 70 / 98 days. Each minus the grace
  // is her 38 / 66 / 94.
  const ROUTINE_1 = 42;
  const ROUTINE_2 = 70;

  it('dose 2 is rejected at 65 days and accepted at 66', () => {
    expect(statuses([ROUTINE_1, 65])).toEqual(['valid', 'invalid']);
    expect(statuses([ROUTINE_1, 66])).toEqual(['valid', 'valid']);
    expect(earliestNextDose([ROUTINE_1], 50, 80)).toBe(66);
  });

  it('dose 3 is rejected at 93 days and accepted at 94', () => {
    expect(statuses([ROUTINE_1, ROUTINE_2, 93])).toEqual(['valid', 'valid', 'invalid']);
    expect(statuses([ROUTINE_1, ROUTINE_2, 94])).toEqual(['valid', 'valid', 'valid']);
    expect(earliestNextDose([ROUTINE_1, ROUTINE_2], 80, 110)).toBe(94);
  });

  it('so the three floors a routinely-vaccinated child meets are 38 / 66 / 94', () => {
    expect([
      earliestNextDose([], 30, 50),
      earliestNextDose([ROUTINE_1], 50, 80),
      earliestNextDose([ROUTINE_1, ROUTINE_2], 80, 110),
    ]).toEqual([38, 66, 94]);
  });
});

describe('a child whose earlier doses were themselves early — the grace per interval', () => {
  // NOT a defect. CDC gives the grace to "the minimum interval or age", and
  // measures the interval from the dose the patient actually received. These
  // numbers are pinned so that the behaviour cannot change in silence; if the
  // owner ever rules that the floors are fixed ages regardless of history,
  // this block is what records the reversal.
  it('each dose at its own earliest gives 38 / 62 / 86, not 38 / 66 / 94', () => {
    expect([
      earliestNextDose([], 30, 50),
      earliestNextDose([38], 50, 80),
      earliestNextDose([38, 62], 80, 110),
    ]).toEqual([38, 62, 86]);
  });

  it('the shortfall against her row is exactly one grace per earlier interval', () => {
    // 0 days at dose 1, 4 at dose 2, 8 at dose 3 — the grace accumulating,
    // stated as arithmetic rather than as three magic numbers.
    expect(66 - earliestNextDose([38], 50, 80)).toBe(GRACE_DAYS);
    expect(94 - earliestNextDose([38, 62], 80, 110)).toBe(2 * GRACE_DAYS);
  });

  it('the interval is measured from the dose GIVEN, graced, wherever it falls', () => {
    // The mechanism itself, over a spread of first-dose ages. Each later dose
    // is accepted exactly 28 - 4 days after the one before it.
    for (const first of [38, 42, 50, 70, 100]) {
      const second = earliestNextDose([first], first + 10, first + 60);
      expect(second - first).toBe(PCV_MIN_INTERVAL_DAYS_UNDER_12M - GRACE_DAYS);
    }
  });
});

describe('controls', () => {
  it('a dose 5 days early is rejected where a dose 4 days early counts', () => {
    // CDC: doses given >=5 days before the minimum are not valid. The
    // boundary, asserted on the interval as well as on the age.
    expect(statuses([42, 42 + PCV_MIN_INTERVAL_DAYS_UNDER_12M - GRACE_DAYS]))
      .toEqual(['valid', 'valid']);
    expect(statuses([42, 42 + PCV_MIN_INTERVAL_DAYS_UNDER_12M - GRACE_DAYS - 1]))
      .toEqual(['valid', 'invalid']);
  });

  it('a rejected dose does not consume its place in the series', () => {
    // Three doses where the middle is too early: the third is judged against
    // the dose that counted, not against the rejected one.
    const s = statuses([42, 60, 94]);
    expect(s[0]).toBe('valid');
    expect(s[1]).toBe('invalid');
    expect(s[2]).toBe('valid');
  });
});
