// §K-NONE-KEEPS (2026-10-31). A "never flagged" row ends the walk; it must
// not ERASE the notes collected before it.
//
// The owner's "mention both gaps" (2026-10-24) made an unmet recommendation
// collect its sentence and keep walking instead of returning. Two
// `enforcement: 'none'` rows further down were written before that, when the
// row above them still returned, and their comments still say so — "a
// shorter gap is still caught by the floor row … which this row does not
// weaken" and "the more specific floors above are ordered ahead of this row
// so they still win". Since 2026-10-24 neither was true: the walk reached the
// 'none' row and `return null` threw the collected sentence away.
//
// Found by the early-dose sweep of 2026-10-31 (906 hand-built adults, one dose
// given sooner than advised): 60 lost their note, all from these two rows.
//
//   Dana, 30, HIV: PCV15, then PPSV23 4 weeks later. ACIP's interval for her
//   is 8 weeks. Her PPSV23 counted (as it should) and read as routine; the
//   same dose at 50 or after a PCV13 carried the note.
//
//   Omar, 55, diabetes: PCV15, then PCV20 2 weeks later. The same 2 weeks
//   after a PCV20 carried the under-4-weeks note; after a PCV15 it did not.
//
// No verdict moves: every dose here counts before and after. Only the note.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { addDays } from '../dateUtils.js';

const TODAY = '2026-10-31';
const GIVEN = addDays(TODAY, -20);

function adult(ageYears, riskIds, first, second, gapDays) {
  const d1 = addDays(GIVEN, -gapDays);
  const pcv = [];
  const ppsv = [];
  (first === 'PPSV23' ? ppsv : pcv).push({ product: first, date: d1 });
  (second === 'PPSV23' ? ppsv : pcv).push({ product: second, date: GIVEN });
  const out = recommend({
    dob: `${2026 - ageYears}-07-31`, ageMonths: ageYears * 12 + 3, today: TODAY,
    riskIds, pcvDoses: pcv, ppsv23Doses: ppsv,
  });
  const stream = second === 'PPSV23' ? out.perDose.ppsv23 : out.perDose.pcv;
  return stream[stream.length - 1];
}

describe('§K-NONE-KEEPS — Dana: PPSV23 4 weeks after PCV15, aged 19-49, immunocompromised', () => {
  for (const riskIds of [['hiv'], ['asplenia'], ['cochlear_implant'], ['csf_leak']]) {
    for (const age of [19, 30, 49]) {
      it(`${age}, ${riskIds[0]}: counts, and says it came before the 8 weeks`, () => {
        const d = adult(age, riskIds, 'PCV15', 'PPSV23', 28);
        expect(d.status).toBe('valid');
        expect(d.doesNotCount).toBeFalsy();
        expect(d.intervalRuleId).toBe('ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM');
        expect(d.reasons.join(' ')).toContain('shorter than the 8 weeks (56 days) ACIP recommends');
      });
    }
  }

  it('opens with the sentence she would hear at 50 — the age line is not what decides it', () => {
    const at30 = adult(30, ['hiv'], 'PCV15', 'PPSV23', 28);
    const at50 = adult(50, ['hiv'], 'PCV15', 'PPSV23', 28);
    expect(at30.reasons[0]).toBe(at50.reasons[0]);
  });

  it('control: at 8 weeks she met the advice in full, so nothing is said', () => {
    const d = adult(30, ['hiv'], 'PCV15', 'PPSV23', 56);
    expect(d.status).toBe('valid');
    expect(d.reasons ?? []).toHaveLength(0);
    expect(d.intervalRuleId).toBeUndefined();
  });
});

describe('§K-NONE-KEEPS — Omar: PCV20 2 weeks after PCV15', () => {
  for (const age of [22, 55, 70]) {
    it(`${age}, diabetes: counts, and carries the same note as 2 weeks after a PCV20`, () => {
      const after15 = adult(age, ['diabetes'], 'PCV15', 'PCV20', 14);
      const after20 = adult(age, ['diabetes'], 'PCV20', 'PCV20', 14);
      expect(after15.status).toBe('valid');
      expect(after15.intervalRuleId).toBe('ADULT-PCV-AFTER-PCV-UNDER-4-WEEKS');
      // After a PCV20 the chip adds "the series was already complete", which
      // is true there and not after a PCV15; the early-dose sentence is shared.
      expect(after15.reasons).toEqual([after20.reasons[0]]);
    });
  }

  it('control: 6 months after PCV15 there is still no interval to state, so nothing is said', () => {
    const d = adult(55, ['diabetes'], 'PCV15', 'PCV20', 183);
    expect(d.status).toBe('valid');
    expect(d.reasons ?? []).toHaveLength(0);
  });
});
