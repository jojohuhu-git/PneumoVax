// §K-MET-ONLY (2026-10-31). "This dose met that minimum" is said only of a
// dose that met it.
//
// For an adult 50+ with an immunocompromising condition, cochlear implant or
// CSF leak, ACIP advises PPSV23 >=1 year after PCV15 and says 8 weeks "can be
// considered". `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM-USED` is the row for
// a dose that took that option — given between 8 weeks and a year — and its
// sentence ends "this dose met that minimum, so it counts".
//
// It also spoke for a dose given BEFORE 8 weeks, right after the 8-week row
// had said the opposite:
//
//   Grace, 60, HIV: PCV15, then PPSV23 4 weeks later. Her chip read
//     "… ACIP recommends 8 weeks (56 days) ACIP recommends for this
//      patient. Counted …"
//     "… names an 8-week minimum that may be considered … — this dose met
//      that minimum, so it counts."
//
// Found while testing §K-NONE-KEEPS. Wording only: the dose counts either way.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { addDays } from '../dateUtils.js';

const TODAY = '2026-10-31';
const GIVEN = addDays(TODAY, -20);

function ppsvAfterPcv15(ageYears, riskIds, gapDays) {
  const out = recommend({
    dob: `${2026 - ageYears}-07-31`, ageMonths: ageYears * 12 + 3, today: TODAY, riskIds,
    pcvDoses: [{ product: 'PCV15', date: addDays(GIVEN, -gapDays) }],
    ppsv23Doses: [{ product: 'PPSV23', date: GIVEN }],
  });
  return out.perDose.ppsv23[0];
}
// §M-L3 (2026-11-08): the sentence moved under Why this (`whys`).
const MET = 'This dose met that minimum';
const said = (d) => [...(d.reasons ?? []), ...(d.whys ?? [])].join(' ');

describe('§K-MET-ONLY — Grace, 50+, PPSV23 before 8 weeks', () => {
  for (const age of [50, 60, 75]) {
    for (const riskIds of [['hiv'], ['cochlear_implant']]) {
      for (const gap of [28, 51]) {
        it(`${age}, ${riskIds[0]}, ${gap} days: counts, says it was short, never says it met the 8 weeks`, () => {
          const d = ppsvAfterPcv15(age, riskIds, gap);
          expect(d.status).toBe('valid');
          expect(d.intervalRuleId).toBe('ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM');
          expect(d.reasons.join(' ')).toContain('ACIP recommends 8 weeks (56 days)');
          expect(said(d)).not.toContain(MET);
        });
      }
    }
  }
});

describe('§K-MET-ONLY — the option row still speaks when the option was taken', () => {
  for (const gap of [52, 56, 120, 300]) {
    // 52-55 days are inside CDC's 4-day grace for a FLOOR, but these rows are
    // recommendations with no grace: 52 days is short of 8 weeks, 56 meets it.
    it(`60, HIV, ${gap} days`, () => {
      const d = ppsvAfterPcv15(60, ['hiv'], gap);
      expect(d.status).toBe('valid');
      if (gap < 56) {
        expect(said(d)).not.toContain(MET);
      } else {
        expect(d.intervalRuleId).toBe('ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM-USED');
        expect(d.reasons).toHaveLength(1);
        expect(d.whys.join(' ')).toContain(MET);
      }
    });
  }

  it('control: a year after PCV15, nothing is said', () => {
    const d = ppsvAfterPcv15(60, ['hiv'], 366);
    expect(d.reasons ?? []).toHaveLength(0);
  });
});
