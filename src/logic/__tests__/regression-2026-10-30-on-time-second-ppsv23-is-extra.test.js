// ── 2026-10-30: a non-IC child's ON-TIME second PPSV23 is an extra dose too ──
//
// OWNER RULING 2026-10-30, on Ava — "Yes, extra dose too".
//
// P2 (same day) made a non-immunocompromised child's EARLY second PPSV23 an
// extra dose: not needed, not harmful, not counted, nothing to repeat. CDC's
// non-immunocompromising list gives ONE PPSV23 and never a second (child
// notes, read live 2026-10-30), so a second dose given ON TIME was just as
// unneeded — but it was still recorded "valid, dose 2" in silence. Asked
// whether to widen her ruling, she chose to: early or on time, the same label.
//
// What it does NOT touch: an immunocompromised child's second PPSV23, which
// CDC orders, still counts (Leo). Hand-built — the grid's two-PPSV23 children
// are the measure of how far this reaches, and the PR names that count.
//
// TWO LIMITS, both measured over the grid before they were drawn:
//   • BEN (OWNER RULING 2026-10-30, "Yes, still wait 8 weeks"). An extra
//     PPSV23 still holds off a conjugate for 8 weeks. Without this, 72
//     conjugate doses given soon after the extra PPSV23 began to count and 34
//     cards went from "dose owed" to "Complete".
//   • ADULTS TODAY keep the count. ACIP's adult rows count every PPSV23
//     received; without this limit 16 nineteen-year-olds with a cochlear
//     implant or CSF leak had their card quote the ONE-dose row.
// With both, 464 of 17,016 patients move, every one a child, every one only
// in the label under the second PPSV23.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeBoth } from '../validate.js';

const d = (product, dates) => dates.map((date) => ({ product, date }));
const PCV13_AS_A_BABY = d('PCV13', ['2016-03-01', '2016-05-01', '2016-07-01', '2017-01-05']);
const child = (riskIds, ppsvDates) => ({
  dob: '2016-01-01', ageMonths: 129, today: '2026-10-30', riskIds,
  pcvDoses: PCV13_AS_A_BABY, ppsv23Doses: d('PPSV23', ppsvDates),
});

// Ava: 10, cochlear implant. PPSV23 at 2, and a second at 7y1m — on time.
const AVA_ON_TIME = child(['cochlear_implant'], ['2018-01-15', '2023-02-01']);
const AVA_ONE_DOSE = child(['cochlear_implant'], ['2018-01-15']);
// Leo: the same history, no spleen — his second PPSV23 is CDC's own dose 2.
const LEO_ON_TIME = child(['asplenia'], ['2018-01-15', '2023-02-01']);

const secondPpsv = (p) => analyzeBoth(p).ppsv23.perDose[1];

describe('Ava, on time — the second PPSV23 is an extra dose', () => {
  it('not counted, with the same sentence as her early dose', () => {
    const dz = secondPpsv(AVA_ON_TIME);
    expect(dz.status).toBe('valid');
    expect(dz.extraDose).toBe(true);
    expect(dz.effectiveDoseNum).toBeNull();
    expect(dz.earlyAdvisory).toBeUndefined();
    expect(dz.reasons).toEqual([
      'Not needed: CDC gives a second PPSV23 only to a child with an immunocompromising condition; the first was given on Jan 15, 2018. This dose isn’t harmful, it isn’t counted, and nothing needs to be repeated.',
    ]);
    expect(analyzeBoth(AVA_ON_TIME).ppsv23.effective.map((x) => x.date)).toEqual(['2018-01-15']);
  });

  it('her card is word-for-word the card of a child with one PPSV23', () => {
    expect(recommend(AVA_ON_TIME).recs).toEqual(recommend(AVA_ONE_DOSE).recs);
  });
});

describe('Leo, on time — immunocompromised, so his second PPSV23 still counts', () => {
  it('dose 2, no note', () => {
    const dz = secondPpsv(LEO_ON_TIME);
    expect(dz.status).toBe('valid');
    expect(dz.extraDose).toBeUndefined();
    expect(dz.effectiveDoseNum).toBe(2);
    expect(dz.reasons ?? []).toEqual([]);
  });
});

describe('a healthy child is covered by the same words', () => {
  it('a second PPSV23 with no risk condition is an extra dose too', () => {
    const dz = secondPpsv(child([], ['2018-01-15', '2023-02-01']));
    expect(dz.extraDose).toBe(true);
    expect(dz.effectiveDoseNum).toBeNull();
  });
});

describe('Ben — an extra PPSV23 still holds off a conjugate for 8 weeks', () => {
  // 18, diabetes. PPSV23 at 8 and at 13, then PCV13 the NEXT DAY.
  const BEN = {
    dob: '2008-09-01', ageMonths: 217, today: '2026-10-30', riskIds: ['diabetes'],
    pcvDoses: d('PCV13', ['2021-09-02']),
    ppsv23Doses: d('PPSV23', ['2016-09-03', '2021-09-01']),
  };

  it('the second PPSV23 is an extra dose', () => {
    expect(secondPpsv(BEN).extraDose).toBe(true);
  });

  it('and the PCV13 a day later is still thrown out under the 8-week rule', () => {
    const pcv = analyzeBoth(BEN).pcv.perDose[0];
    expect(pcv.status).toBe('invalid');
    expect(pcv.intervalRuleId).toBe('CHILD-PCV-AFTER-PPSV23');
    expect(pcv.reasons[0]).toContain('Given 1 day after the PPSV23 dose of Sep 1, 2021');
  });

  it('so his card still asks for the conjugate, as it did', () => {
    expect(recommend(BEN).recs.map((r) => r.doseLabel)).toEqual([
      'Option A: 1 dose PCV20 (≥8 weeks)', 'Option B-1: 1 dose PCV15 (≥8 weeks)',
    ]);
  });
});

describe('an adult today keeps both childhood PPSV23 doses', () => {
  // 19, cochlear implant. PCV13 as a baby; PPSV23 at 9 and 14.
  const ADULT = {
    dob: '2007-10-01', ageMonths: 228, today: '2026-10-30', riskIds: ['cochlear_implant'],
    pcvDoses: d('PCV13', ['2007-12-01', '2008-02-01', '2008-04-01', '2008-10-05']),
    ppsv23Doses: d('PPSV23', ['2016-11-01', '2021-11-03']),
  };

  it('the second PPSV23 still counts, and the card is ACIP\'s two-dose row', () => {
    const dz = secondPpsv(ADULT);
    expect(dz.extraDose).toBeUndefined();
    expect(dz.effectiveDoseNum).toBe(2);
    expect(recommend(ADULT).recs[0].doseLabel).toMatch(/^Review at age 50/);
  });
});

describe('"How this was worked out" agrees with the label under the dose', () => {
  // Found by driving the app: "2 of 2 PPSV23 doses counted" beside a dose
  // reading "it isn't counted".
  it('Ava on time: 1 of 2 counted, the other an extra dose', () => {
    const step = recommend(AVA_ON_TIME).path.find((p) => p.step === 'Doses already given');
    expect(step.took).toBe('4 of 4 PCV doses counted. 1 of 2 PPSV23 doses counted — 1 an extra dose, not needed, with the reason on the dose itself');
  });
});
