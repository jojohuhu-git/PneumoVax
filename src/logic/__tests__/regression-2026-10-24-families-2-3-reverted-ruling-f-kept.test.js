// THE AFTERNOON RULING OF 2026-10-24 — families 2 and 3 are floors again, and
// Ruling F is NOT.
//
// This file exists because `ADULT-PCV-AFTER-PPSV23` and
// `ADULT-PPSV23-AFTER-PCV15` have each been a floor, then a recommendation,
// then a floor again — all inside one day — and the three rows involved look
// alike enough that a later session could easily "tidy" them into agreement.
// They must not agree. The owner split them deliberately:
//
//   FAMILY 2  an adult conjugate under 1 year after a PPSV23   -> INVALID
//   FAMILY 3  an adult PPSV23 early after a PCV15              -> INVALID
//   RULING F  an adult PCV20/21 under 5 years after a PPSV23   -> COUNTS
//
// Her ground for the difference is not the interval and not the risk class —
// it is whether a dose was OWED. Families 2 and 3 are patients who still owed
// a dose, so the timing of the dose they got decides whether it filled the
// debt. Ruling F's patient had PCV13 + PPSV23 at 65+ and owed nothing, so an
// optional extra conjugate given early cannot un-finish her: "Calling it
// 'invalid' changes nothing, because no dose was owed."
//
// Full wording and citations:
// docs/archive/decision-2026-10-24-invalid-adult-dose-repeat-rule.md
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { DOSE_INTERVAL_RULES } from '../doseIntervalRules.js';

const TODAY = '2026-10-24';
const Y = (y) => y * 12;
const run = (p) => recommend({ today: TODAY, ...p });
const ruleById = (id) => DOSE_INTERVAL_RULES.find((r) => r.id === id);

describe('families 2 and 3 are floors again', () => {
  // ── FAMILY 2 ──────────────────────────────────────────────────────────
  // Her 70-year-old: PPSV23 2025-10-11, then PCV15 eight months later.
  // "For a healthy adult, ACIP requires a PCV15 or PCV20 given after a PPSV23
  //  to be >=1 year after the PPSV23, with no 8-week option. So the 19 Jun
  //  2026 PCV15, given about 8 months after the PPSV23, is invalid and needs
  //  to be repeated."
  const FAMILY_2 = {
    ageMonths: Y(70),
    riskIds: [],
    pcvDoses: [{ product: 'PCV15', date: '2026-06-19' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }],
  };

  it('rejects the conjugate given 8 months after a PPSV23', () => {
    const v = run(FAMILY_2).perDose.pcv;
    expect(v).toHaveLength(1);
    expect(v[0].status).toBe('invalid');
    expect(v[0].intervalRuleId).toBe('ADULT-PCV-AFTER-PPSV23');
  });

  it('and does not call that patient complete', () => {
    expect(run(FAMILY_2).recs.some((r) => r.status === 'complete')).toBe(false);
  });

  // CASE H — the control the owner set on 2026-10-11, un-rejected by family 2
  // on the morning of the 24th and rejected again by the afternoon ruling. A
  // two-month gap is further from the year than the eight-month one, so if
  // family 2's patient is invalid this patient cannot be valid.
  it('rejects case H too — a conjugate two months after a PPSV23', () => {
    const v = run({
      ageMonths: Y(70),
      riskIds: [],
      pcvDoses: [{ product: 'PCV20', date: '2026-10-11' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-08-11' }],
    }).perDose.pcv;
    expect(v[0].status).toBe('invalid');
  });

  // ── FAMILY 3 ──────────────────────────────────────────────────────────
  // Her 60-year-old: PCV15 2026-07-19, PPSV23 twelve weeks later — the
  // patient she described, twice and unhedged, as "which is invalid".
  const FAMILY_3 = {
    ageMonths: Y(60),
    riskIds: [],
    pcvDoses: [{ product: 'PCV15', date: '2026-07-19' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
  };

  it('rejects the PPSV23 given 12 weeks after a PCV15', () => {
    const v = run(FAMILY_3).perDose.ppsv23;
    expect(v).toHaveLength(1);
    expect(v[0].status).toBe('invalid');
    expect(v[0].intervalRuleId).toBe('ADULT-PPSV23-AFTER-PCV15');
  });

  it('and does not call that patient complete', () => {
    expect(run(FAMILY_3).recs.some((r) => r.status === 'complete')).toBe(false);
  });

  // ── the rows themselves ───────────────────────────────────────────────
  it('both rows are floors on an owner authority, not CDC recommendations', () => {
    for (const id of ['ADULT-PCV-AFTER-PPSV23', 'ADULT-PPSV23-AFTER-PCV15']) {
      const rule = ruleById(id);
      expect(rule, id).toBeDefined();
      expect(rule.enforcement, id).toBe('floor');
      expect(rule.authority, id).toBe('OWNER');
      // A floor gets CDC's 4-day grace; a recommendation deliberately does not.
      expect(rule.grace, id).toBe(true);
    }
  });

  it('each row records that it was flipped twice, so the morning ruling cannot be mistaken for current', () => {
    for (const id of ['ADULT-PCV-AFTER-PPSV23', 'ADULT-PPSV23-AFTER-PCV15']) {
      expect(ruleById(id).source, id).toMatch(/FLOOR TWICE AND A RECOMMENDATION ONCE/);
      expect(ruleById(id).source, id).toContain('decision-2026-10-24-invalid-adult-dose-repeat-rule.md');
    }
  });
});

describe('RULING F is NOT reverted — the row that must stay a recommendation', () => {
  // Her own patient. PCV13 + PPSV23 completed the series before the PCV20, so
  // nothing was owed and the early extra dose still counts.
  const HERS = {
    ageMonths: Y(70),
    riskIds: [],
    pcvDoses: [
      { product: 'PCV13', date: '2016-10-13' },
      { product: 'PCV20', date: '2025-10-10' },
    ],
    ppsv23Doses: [{ product: 'PPSV23', date: '2021-10-13' }],
  };

  it('counts the PCV20 given under 5 years after the PPSV23, and reads complete', () => {
    const out = run(HERS);
    expect(out.perDose.pcv.map((d) => d.status)).toEqual(['valid', 'valid']);
    expect(out.perDose.pcv[1].intervalRuleId).toBe('ADULT-PCV20-21-5Y-AFTER-PPSV23');
    expect(out.recs.some((r) => r.status === 'complete')).toBe(true);
  });

  it('counts it under 1 year too — she declined to split this row at 1 year', () => {
    // Shown that 33 of the 363 affected doses sit under a year (all of them a
    // ONE-DAY gap, because the grid's fixed offsets build nothing between),
    // she chose "complete — all 363" rather than a split.
    const out = run({
      ageMonths: Y(70),
      riskIds: [],
      pcvDoses: [
        { product: 'PCV13', date: '2016-10-13' },
        { product: 'PCV20', date: '2026-04-14' },
      ],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-04-13' }],
    });
    expect(out.perDose.pcv[1].status).toBe('valid');
    expect(out.recs.some((r) => r.status === 'complete')).toBe(true);
  });

  it('its row is still a CDC recommendation with no grace', () => {
    const rule = ruleById('ADULT-PCV20-21-5Y-AFTER-PPSV23');
    expect(rule.enforcement).toBe('recommendation');
    expect(rule.authority).toBe('CDC');
    expect(rule.grace).toBe(false);
  });

  // ⚠️ ROW ORDER, still load-bearing after the reverts. `evaluateDoseInterval`
  // returns on the first unmet row of EITHER kind, so Ruling F's
  // recommendation must stay AFTER the 1-year conjugate-to-conjugate floor or
  // a dose missing both gaps escapes the floor entirely.
  it('keeps the 1-year conjugate floor ahead of Ruling F\'s recommendation', () => {
    const ids = DOSE_INTERVAL_RULES.map((r) => r.id);
    expect(ids.indexOf('ADULT-PCV20-21-1Y-AFTER-PCV'))
      .toBeLessThan(ids.indexOf('ADULT-PCV20-21-5Y-AFTER-PPSV23'));
  });
});

describe('the three rows do not agree, and that is the point', () => {
  it('two floors and one recommendation among the three families', () => {
    const kinds = [
      'ADULT-PCV-AFTER-PPSV23',           // family 2
      'ADULT-PPSV23-AFTER-PCV15',         // family 3
      'ADULT-PCV20-21-5Y-AFTER-PPSV23',   // Ruling F
    ].map((id) => ruleById(id).enforcement);
    expect(kinds).toEqual(['floor', 'floor', 'recommendation']);
  });
});
