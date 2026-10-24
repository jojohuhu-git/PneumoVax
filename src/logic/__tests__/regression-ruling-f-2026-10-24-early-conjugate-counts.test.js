// RULING F (owner, 2026-10-24) — an adult PCV20/PCV21 given sooner than 5
// years after a PPSV23 STILL COUNTS, and the series reads complete.
//
// Her words, on a 70-year-old with PCV13 2016-10-13, PPSV23 2021-10-13 and
// PCV20 2025-10-10:
//
//   "Nothing further is due if they are healthy, with chronic conditions, or
//    immunocompromised. Once an adult has received PCV20, ACIP recommends no
//    additional pneumococcal doses... The only issue is timing. If the doses
//    were given about 4 years apart... the PCV20 came before the recommended
//    >=5 years after the PPSV23. ACIP describes that as recommended timing
//    and does not say an earlier dose is invalid or must be repeated."
//
// So `ADULT-PCV20-21-5Y-AFTER-PPSV23` stops being a validity floor and
// becomes a recommendation — the dose counts and carries a timing note. This
// REVERSES the owner's own determination of 2026-10-11 for that row only;
// every other adult floor is untouched, and the control cases below are what
// make that claim checkable rather than asserted.
//
// ⚠️ THE HAZARD THIS TEST EXISTS FOR. `evaluateDoseInterval` returns on the
// FIRST unmet applicable row, floor or recommendation alike. The 5-year row
// used to sit BEFORE `ADULT-PCV20-21-1Y-AFTER-PCV`, the 1-year
// conjugate-to-conjugate floor, so turning it into a recommendation would
// have let a dose that misses BOTH gaps escape the floor entirely — the
// recommendation would have returned first and the floor never run. The two
// rows are therefore swapped: floor first, recommendation second. The
// both-unmet case below fails if they are ever swapped back.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { evaluateDoseInterval, DOSE_INTERVAL_RULES } from '../doseIntervalRules.js';

const TODAY = '2026-10-24';
const Y = (y) => y * 12;

function verdictsFor(input) {
  const out = recommend({ today: TODAY, ...input });
  return {
    // `perDose` entries carry the VERDICT, not the dose — no `product` field
    // — and the walk sorts into date order, so index 1 is the later PCV20 in
    // both histories below. Asserted by the dose-count check in each test.
    pcv: out.perDose.pcv,
    recs: out.recs,
    recText: out.recs.map((r) => `${r.vaccine}:${r.status} — ${r.doseLabel}`).join(' || '),
  };
}

describe('RULING F — the owner\'s patient: PCV20 four years after PPSV23', () => {
  // Her patient exactly, as the previous session ran her through the engine.
  const HERS = {
    ageMonths: Y(70),
    riskIds: [],
    pcvDoses: [
      { product: 'PCV13', date: '2016-10-13' },
      { product: 'PCV20', date: '2025-10-10' },
    ],
    ppsv23Doses: [{ product: 'PPSV23', date: '2021-10-13' }],
  };

  it('counts the PCV20 — the 5-year gap is recommended timing, not a minimum', () => {
    const v = verdictsFor(HERS);
    const pcv20 = v.pcv[1];
    expect(v.pcv).toHaveLength(2);
    expect(pcv20.status).toBe('valid');
    expect(pcv20.effectiveDoseNum).not.toBeNull();
  });

  it('says on the dose that it came earlier than the recommended 5 years', () => {
    const v = verdictsFor(HERS);
    const pcv20 = v.pcv[1];
    expect(v.pcv).toHaveLength(2);
    expect(pcv20.earlyAdvisory).toBe(true);
    expect(pcv20.intervalRuleId).toBe('ADULT-PCV20-21-5Y-AFTER-PPSV23');
    // A recommendation keeps the dose, so it owes no repeat and no "earliest
    // valid" date — those belong to a floor and would contradict "it counts".
    expect(pcv20.earliestValidDate).toBeUndefined();
    expect(pcv20.repeatDueDate).toBeUndefined();
  });

  it('reads Complete, with nothing due — ACIP recommends no dose after PCV20', () => {
    const v = verdictsFor(HERS);
    expect(v.recs.every((r) => r.status === 'complete')).toBe(true);
    expect(v.recText).toMatch(/Complete \(history includes PCV20\)/);
    expect(v.recText).not.toMatch(/due/i);
  });
});

describe('RULING F — the floors it must NOT loosen', () => {
  // ⚠️ THE ORDERING CONTROL. This PCV20 misses BOTH gaps: 9 months after the
  // PPSV23 (short of 5 years) and 4 months after the PCV13 (short of 1 year).
  // The 1-year conjugate-to-conjugate floor is an owner determination of
  // 2026-10-11 that Ruling F does not touch, so the dose must still be
  // rejected — and rejected BY THAT ROW, not quietly waved through by the
  // recommendation that now sits beside it.
  const MISSES_BOTH = {
    ageMonths: Y(70),
    riskIds: [],
    pcvDoses: [
      { product: 'PCV13', date: '2025-06-01' },
      { product: 'PCV20', date: '2025-10-10' },
    ],
    ppsv23Doses: [{ product: 'PPSV23', date: '2025-01-01' }],
  };

  it('still rejects a PCV20 that misses the 1-year conjugate gap as well', () => {
    const v = verdictsFor(MISSES_BOTH);
    const pcv20 = v.pcv[1];
    expect(v.pcv).toHaveLength(2);
    expect(pcv20.status).toBe('invalid');
    expect(pcv20.intervalRuleId).toBe('ADULT-PCV20-21-1Y-AFTER-PCV');
  });

  it('orders the 1-year floor BEFORE the 5-year recommendation in the table', () => {
    const ids = DOSE_INTERVAL_RULES.map((r) => r.id);
    expect(ids.indexOf('ADULT-PCV20-21-1Y-AFTER-PCV'))
      .toBeLessThan(ids.indexOf('ADULT-PCV20-21-5Y-AFTER-PPSV23'));
  });

  it('leaves the 5-year PPSV23-to-PPSV23 floor alone', () => {
    const v = evaluateDoseInterval({
      vaccine: 'PPSV23', product: 'PPSV23', doseDate: '2026-01-01', ageAtDose: Y(70),
      prev: { date: '2024-01-01', ageAtDose: Y(68) },
      priorPcv: [], priorPpsv23: [{ date: '2024-01-01' }], riskIds: [],
    });
    expect(v.kind).toBe('floor');
    expect(v.ruleId).toBe('ADULT-PPSV23-AFTER-PPSV23');
  });
});

describe('RULING F — the row itself', () => {
  const row = DOSE_INTERVAL_RULES.find((r) => r.id === 'ADULT-PCV20-21-5Y-AFTER-PPSV23');

  it('is a recommendation with no grace', () => {
    // The grace exists to let a dose given up to 4 days early still COUNT. A
    // recommendation already counts every dose, so a grace on it would only
    // move the line at which the note is printed — which is why the
    // "Recommendations" block states no grace deliberately.
    expect(row.enforcement).toBe('recommendation');
    expect(row.grace).toBe(false);
  });

  it('records the 2026-10-24 reversal, and now credits CDC rather than the owner', () => {
    expect(row.source).toMatch(/2026-10-24/);
    expect(row.source).toMatch(/RULING F/);
    // The authority label says who stands behind what the row ASSERTS. As a
    // floor it asserted that an early dose stops counting, which no source
    // states, so it carried the owner's name. As a recommendation it asserts
    // only CDC's own advised interval — so CDC, like every other
    // recommendation row in the table. Ruling F REMOVED an owner-invented
    // bar; it did not add an owner-invented recommendation.
    expect(row.authority).toBe('CDC');
    expect(row.source).not.toMatch(/OWNER CLINICAL DETERMINATION/);
  });

  it('returns a message the advisory can print — a string, not a floor object', () => {
    const msg = row.message(
      { doseDate: '2025-10-10' },
      { date: '2021-10-13' },
      { words: '5 years', adj: '5-year' },
    );
    expect(typeof msg).toBe('string');
    expect(msg).toMatch(/still counts/);
  });
});
