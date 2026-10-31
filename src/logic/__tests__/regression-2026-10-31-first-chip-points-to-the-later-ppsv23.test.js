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
// Scoped to CHILDREN NONE OF WHOSE PPSV23 SHOTS COUNTED, the patients she was
// shown. A healthy child's
// thrown-out PPSV23 already reads "nothing needs to be repeated"
// (§C-P2-HEALTHY); adults were not asked about.
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

  // Her option kept today's wording for a child with ONE thrown-out PPSV23.
  // Widening it reached 128 grid 18-year-olds she has not seen (a PPSV23 on
  // the day of a PCV, then one five years later that counted): held for her.
  it('ONE thrown-out PPSV23 followed by one that COUNTED keeps today\'s wording — not yet ruled', () => {
    expect(firstChip({ ...SAM, ppsv23Doses: d('PPSV23', ['2024-12-01', '2025-01-26']) })).toContain(TOO_YOUNG_REPEAT);
  });

  it('with three shots, each points to the NEXT one', () => {
    const chips = recommend({ ...SAM, ppsv23Doses: d('PPSV23', ['2024-12-01', '2025-01-05', '2025-01-19']) }).perDose.ppsv23;
    expect(chips[0].reasons[1]).toContain('It was repeated on Jan 5, 2025');
  });

  it('an adult whose two PPSV23 shots were given as a baby is untouched — not asked about', () => {
    const adult = { dob: '2005-01-01', ageMonths: 249, today: '2025-10-01', riskIds: ['asplenia'],
      pcvDoses: [], ppsv23Doses: d('PPSV23', ['2006-02-01', '2006-09-01']) };
    const chips = recommend(adult).perDose.ppsv23;
    expect(chips.map((x) => x.status)).toEqual(['invalid', 'invalid']);
    expect(JSON.stringify(chips)).not.toContain('see that dose');
  });

  // The field the 2026-10-25 sweep reads to find a chip still promising a
  // date: once the sentence is swapped, no promise is left to mark.
  it('Noah\'s first chip no longer marks a forward-looking promise', () => {
    expect(recommend(NOAH).perDose.ppsv23[0].forwardLookingReason).toBeNull();
  });
});
