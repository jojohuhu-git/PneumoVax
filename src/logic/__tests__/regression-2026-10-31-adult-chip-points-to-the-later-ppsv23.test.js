// ── §C-P2-LATER for ADULTS (OWNER RULING 2026-10-31, on "Leo at 19") ──────
//
// §C-P2-LATER was built for children only, so the same history read one way
// at 18 and another at 19. Leo at 19 — no spleen, PCV13 and PPSV23 at the
// same visit at age 9 (thrown out), PPSV23 again at 14 (counted) — still had
// "the next dose in this series can be given from Dec 27, 2016 at the
// earliest" under his first PPSV23, a date ten years gone. A 25-year-old
// whose PPSV23 at 15 months (too young) was repeated at age 2 still read
// "repeat this dose only". Asked with both, the owner chose "Point to the
// later dose" at every age.
//
// Only a dose given in CHILDHOOD can reach this: an adult's own PPSV23 is
// judged by the adult rows, which count it with a note. Measured on the
// grid: 88 patients, all 19-year-olds; 0 verdicts moved.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));
const firstChip = (p) => recommend(p).perDose.ppsv23[0].reasons;

const LEO_AT_19 = {
  dob: '2007-10-20', ageMonths: 228, today: '2026-10-31', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2016-11-01']), ppsv23Doses: d('PPSV23', ['2016-11-01', '2021-10-30']),
};
const ADULT_25 = {
  dob: '2001-10-20', ageMonths: 300, today: '2026-10-31', riskIds: ['asplenia'],
  pcvDoses: d('PCV13', ['2002-01-01', '2002-03-01', '2002-05-01', '2002-11-01']),
  ppsv23Doses: d('PPSV23', ['2003-02-01', '2004-02-01']),
};

describe('the patients she was shown', () => {
  it('Leo at 19: his 2016 PPSV23 points to his 2021 dose, and no longer promises Dec 27, 2016', () => {
    const chip = firstChip(LEO_AT_19);
    expect(chip[1]).toBe('This dose does not count toward the series — given too soon after the dose it is measured from. It was repeated on Oct 30, 2021 — see that dose.');
    expect(chip.join(' ')).not.toContain('Dec 27, 2016');
    expect(recommend(LEO_AT_19).perDose.ppsv23[0].forwardLookingReason).toBeNull();
  });

  it('the 25-year-old: his too-young PPSV23 points to the repeat at age 2', () => {
    expect(firstChip(ADULT_25)[1]).toBe('This dose does not count toward the series. It was repeated on Feb 1, 2004 — see that dose.');
  });

  it('Leo reads the same at 18 and at 19', () => {
    const at18 = { ...LEO_AT_19, dob: '2008-10-20', ageMonths: 216 };
    expect(firstChip(at18)[1]).toBe(firstChip(LEO_AT_19)[1]);
  });
});

describe('what does not move', () => {
  it('the verdicts: the first dose stays thrown out, the second still counts, the card is unchanged', () => {
    const r = recommend(LEO_AT_19);
    expect(r.perDose.ppsv23.map((x) => x.status)).toEqual(['invalid', 'valid']);
    expect(r.recs.map((x) => `${x.vaccine}:${x.status}`)).toEqual(['PCV:risk-based']);
  });

  it('an adult with ONE thrown-out childhood PPSV23 keeps "repeat this dose only"', () => {
    expect(firstChip({ ...ADULT_25, ppsv23Doses: d('PPSV23', ['2003-02-01']) }))
      .toContain('This dose does not count toward the series — repeat this dose only (do not restart the series).');
  });
});
