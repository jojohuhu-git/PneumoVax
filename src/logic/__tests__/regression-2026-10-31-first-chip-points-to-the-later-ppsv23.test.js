// ── §C-P2-LATER (OWNER RULING 2026-10-31): a thrown-out PPSV23 that WAS repeated ──
//
// Sam's first PPSV23 (23 months, too young) read "repeat this dose only (do
// not restart the series)" — but it was repeated, on Jan 5, 2025, and his card
// offers no further PPSV23. Noah's first (too soon after a PCV) read "the next
// dose in this series can be given from Jun 24, 2023 at the earliest" — a date
// three years gone, with his later PPSV23 already on the record. Asked, the
// owner chose "Point to the later dose": the forward-looking sentence becomes
// "It was repeated on <date> — see that dose." A child with only ONE
// thrown-out PPSV23 keeps today's wording.
//
// Scoped at first to children none of whose PPSV23 shots counted; widened to
// EVERY CHILD the same evening, on "Leo" below. A healthy child's
// thrown-out PPSV23 already reads "nothing needs to be repeated"
// (§C-P2-HEALTHY). Widened to ADULTS on "Leo at 19" the same evening.
//
// ⚠ Hand-built: the grid holds no child with two PPSV23 doses this close.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { addDays } from '../dateUtils.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));
const SAM = {
  dob: '2023-01-01', ageMonths: 34, today: '2025-11-01', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2023-03-01', '2023-05-01', '2023-07-01', '2024-01-05']),
  ppsv23Doses: d('PPSV23', ['2024-12-01', '2025-01-05']),
};
const NOAH = {
  dob: '2021-01-01', ageMonths: 69, today: '2026-10-30', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2023-02-01', '2023-04-01']),
  ppsv23Doses: d('PPSV23', ['2023-04-29', addDays('2023-04-29', 42)]),
};
const firstChip = (p) => recommend(p).perDose.ppsv23[0].reasons;
const TOO_YOUNG_REPEAT = 'This dose does not count toward the series — repeat this dose only (do not restart the series).';

describe('the patients she was shown', () => {
  it('Sam: his first PPSV23 points to his Jan 5 repeat, and no longer orders one', () => {
    expect(firstChip(SAM)).toEqual([
      'Given at ~23 months — below the 2-year minimum age for PPSV23[c].',
      'This dose does not count toward the series. It was repeated on Jan 5, 2025 — see that dose.',
    ]);
  });

  it('Noah: his first PPSV23 keeps its timing reason and loses the 2023 date', () => {
    const chip = firstChip(NOAH);
    expect(chip[1]).toBe('This dose does not count toward the series — given too soon after the dose it is measured from. It was repeated on Jun 10, 2023 — see that dose.');
    expect(chip.join(' ')).not.toContain('Jun 24, 2023');
  });

  it('Ivy (both too young): her first points to her second', () => {
    const ivy = { ...SAM, ppsv23Doses: d('PPSV23', ['2024-02-01', '2024-09-01']) };
    expect(firstChip(ivy)[1]).toBe('This dose does not count toward the series. It was repeated on Sep 1, 2024 — see that dose.');
  });
});

// Shown the same evening, after the first scope held him back: a thrown-out
// PPSV23 followed by one that COUNTED, five years on. "Point to the later
// dose" — for him, his twin, and the 128 grid patients like them.
const LEO = {
  dob: '2007-11-01', ageMonths: 216, today: '2025-11-01', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2017-11-01']), ppsv23Doses: d('PPSV23', ['2017-11-01', '2022-10-30']),
};
const LEO_CHIP = 'This dose does not count toward the series — given too soon after the dose it is measured from. It was repeated on Oct 30, 2022 — see that dose.';

describe('Leo and his twin', () => {
  it('Leo: his 2017 PPSV23 points to his 2022 dose, and no longer promises Dec 27, 2017', () => {
    const chip = firstChip(LEO);
    expect(chip[1]).toBe(LEO_CHIP);
    expect(chip.join(' ')).not.toContain('Dec 27, 2017');
  });

  it('his twin with a cochlear implant (card: complete) reads the same, not "It is not repeated."', () => {
    expect(firstChip({ ...LEO, riskIds: ['cochlear_implant'] })[1]).toBe(LEO_CHIP);
  });
});

describe('limits', () => {
  it('ONE thrown-out PPSV23 keeps "repeat this dose only"', () => {
    expect(firstChip({ ...SAM, ppsv23Doses: d('PPSV23', ['2024-12-01']) })).toContain(TOO_YOUNG_REPEAT);
  });

  it('a second row on the SAME date is not a later dose', () => {
    expect(firstChip({ ...SAM, ppsv23Doses: d('PPSV23', ['2024-12-01', '2024-12-01']) })).toContain(TOO_YOUNG_REPEAT);
  });

  it('a later row dated in the future is not a later dose', () => {
    expect(firstChip({ ...SAM, ppsv23Doses: d('PPSV23', ['2024-12-01', '2026-03-01']) })).toContain(TOO_YOUNG_REPEAT);
  });

  it('a repeat that COUNTED is pointed to as well', () => {
    expect(firstChip({ ...SAM, ppsv23Doses: d('PPSV23', ['2024-12-01', '2025-01-26']) })[1])
      .toBe('This dose does not count toward the series. It was repeated on Jan 26, 2025 — see that dose.');
  });

  it('with three shots, each points to the NEXT one', () => {
    const chips = recommend({ ...SAM, ppsv23Doses: d('PPSV23', ['2024-12-01', '2025-01-05', '2025-01-19']) }).perDose.ppsv23;
    expect(chips[0].reasons[1]).toContain('It was repeated on Jan 5, 2025');
  });

  // Until "Leo at 19" (same day) this asserted the adult was untouched, as
  // the record that adults had not been asked about. She has been now, and
  // chose the same answer at every age — see
  // regression-2026-10-31-adult-chip-points-to-the-later-ppsv23.test.js.
  it('an adult whose two PPSV23 shots were given as a baby: the first points to the second', () => {
    const adult = { dob: '2005-01-01', ageMonths: 249, today: '2025-10-01', riskIds: ['asplenia'],
      pcvDoses: [], ppsv23Doses: d('PPSV23', ['2006-02-01', '2006-09-01']) };
    const chips = recommend(adult).perDose.ppsv23;
    expect(chips.map((x) => x.status)).toEqual(['invalid', 'invalid']);
    expect(chips[0].reasons[1]).toBe('This dose does not count toward the series. It was repeated on Sep 1, 2006 — see that dose.');
  });

  // The field the 2026-10-25 sweep reads to find a chip still promising a
  // date: once the sentence is swapped, no promise is left to mark.
  it('Noah\'s first chip no longer marks a forward-looking promise', () => {
    expect(recommend(NOAH).perDose.ppsv23[0].forwardLookingReason).toBeNull();
  });
});
