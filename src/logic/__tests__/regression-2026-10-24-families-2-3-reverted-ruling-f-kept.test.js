// FAMILY 3 IS A FLOOR, FAMILY 2 IS NOT, AND RULING F NEVER WAS.
//
// ⚠️ THIS FILE IS THE RECORD OF A REVERSAL AND ITS TITLE IS NOW HALF WRONG.
// It was written on 2026-10-24 to hold BOTH families as floors after the owner
// restored them that afternoon. On 2026-10-25 she reversed family 2 again —
// `ADULT-PCV-AFTER-PPSV23`, the row's FOURTH state — so the family 2 block
// below now asserts the opposite of what it was written to assert. It is kept
// here, beside family 3 and Ruling F, rather than moved: the whole point of
// the file is that these three lookalike rows must NOT be tidied into
// agreement, and that point is stronger, not weaker, now that the three
// answers differ again.
//
//   FAMILY 2  an adult conjugate under 1 year after a PPSV23   -> COUNTS (10-25)
//   FAMILY 3  an adult PPSV23 early after a PCV15              -> INVALID
//   RULING F  an adult PCV20/21 under 5 years after a PPSV23   -> COUNTS
//
// Her 2026-10-24 ground for splitting families 2 and 3 from Ruling F was
// whether a dose was OWED: families 2 and 3 were patients who still owed a
// dose, so the timing of the dose they got decided whether it filled the debt,
// while Ruling F's patient had PCV13 + PPSV23 at 65+ and owed nothing —
// "Calling it 'invalid' changes nothing, because no dose was owed."
//
// HER 2026-10-25 GROUND FOR MOVING FAMILY 2 IS A DIFFERENT ONE, and it does
// not disturb family 3. Shown a 55-year-old and a 6-year-old on the same two
// dates — PPSV23, then a conjugate fourteen days later — whose answers
// disagreed only because the child rulebook has no conjugate-after-PPSV23 row,
// she ruled "count like the child, provide alternative in comments." The child
// rulebook DOES have a PPSV23-after-conjugate row (`CHILD-PPSV23-AFTER-PCV`, a
// CDC floor of 8 weeks), so the same reasoning reaches family 2 and stops.
// That asymmetry is asserted below, because it is the whole reason the two
// families now differ.
//
// Full wording and citations:
// docs/archive/decision-2026-10-24-invalid-adult-dose-repeat-rule.md and
// CLINICAL_SPEC.md §K, "OWNER DECISION 2026-10-25 — a second row left that
// table".
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { DOSE_INTERVAL_RULES } from '../doseIntervalRules.js';

const TODAY = '2026-10-24';
const Y = (y) => y * 12;
const run = (p) => recommend({ today: TODAY, ...p });
const ruleById = (id) => DOSE_INTERVAL_RULES.find((r) => r.id === id);

describe('family 3 is a floor; family 2 stopped being one on 2026-10-25', () => {
  // ── FAMILY 2 — REVERSED 2026-10-25 ────────────────────────────────────
  // Her 70-year-old: PPSV23 2025-10-11, then PCV15 eight months later. On
  // 2026-10-24 she wrote of this exact patient: "the 19 Jun 2026 PCV15, given
  // about 8 months after the PPSV23, is invalid and needs to be repeated."
  // On 2026-10-25, shown the 55-year-old and the 6-year-old who differed only
  // by rulebook, she reversed it and extended it to PCV15 by name: "All three
  // — PCV15 too". So this patient's dose COUNTS, and these two assertions are
  // the inverse of the ones this file shipped with.
  const FAMILY_2 = {
    ageMonths: Y(70),
    riskIds: [],
    pcvDoses: [{ product: 'PCV15', date: '2026-06-19' }],
    ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }],
  };

  it('counts the conjugate given 8 months after a PPSV23, and names the rule', () => {
    const v = run(FAMILY_2).perDose.pcv;
    expect(v).toHaveLength(1);
    expect(v[0].status).toBe('valid');
    // The row still SPEAKS for the dose — it is the note, not the rejection,
    // that it now produces. A silent pass here would be a different bug.
    expect(v[0].intervalRuleId).toBe('ADULT-PCV-AFTER-PPSV23');
  });

  it('and that patient now reads complete', () => {
    expect(run(FAMILY_2).recs.some((r) => r.status === 'complete')).toBe(true);
  });

  // CASE H — the control the owner set on 2026-10-11. Un-rejected by family 2
  // on the morning of the 24th, rejected again that afternoon, and counted
  // again from 2026-10-25. A two-month gap is further from the year than the
  // eight-month one, so case H and family 2 must always agree.
  it('counts case H too — a conjugate two months after a PPSV23', () => {
    const v = run({
      ageMonths: Y(70),
      riskIds: [],
      pcvDoses: [{ product: 'PCV20', date: '2026-10-11' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-08-11' }],
    }).perDose.pcv;
    expect(v[0].status).toBe('valid');
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
  it('family 3 is still a floor on an owner authority', () => {
    const rule = ruleById('ADULT-PPSV23-AFTER-PCV15');
    expect(rule).toBeDefined();
    expect(rule.enforcement).toBe('floor');
    expect(rule.authority).toBe('OWNER');
    // A floor gets CDC's 4-day grace; a recommendation deliberately does not.
    expect(rule.grace).toBe(true);
  });

  it('family 2 is a CDC recommendation with no grace — the Ruling F relabelling', () => {
    const rule = ruleById('ADULT-PCV-AFTER-PPSV23');
    expect(rule).toBeDefined();
    expect(rule.enforcement).toBe('recommendation');
    // CDC, not OWNER: as a recommendation the row asserts only CDC's own
    // advised interval. What was removed was the owner-invented bar.
    expect(rule.authority).toBe('CDC');
    expect(rule.grace).toBe(false);
  });

  it('each row records its own flip history, so no superseded ruling reads as current', () => {
    expect(ruleById('ADULT-PPSV23-AFTER-PCV15').source)
      .toMatch(/FLOOR TWICE AND A RECOMMENDATION ONCE/);
    expect(ruleById('ADULT-PPSV23-AFTER-PCV15').source)
      .toContain('decision-2026-10-24-invalid-adult-dose-repeat-rule.md');
    // Family 2 has held four states, and its own source text says so.
    expect(ruleById('ADULT-PCV-AFTER-PPSV23').source)
      .toMatch(/FOUR STATES, AND THIS IS THE FOURTH/);
    expect(ruleById('ADULT-PCV-AFTER-PPSV23').source).toContain('2026-10-25');
  });

  // THE ASYMMETRY THAT JUSTIFIES THE SPLIT. "Count like the child" reaches
  // family 2 because the child rulebook is SILENT on a conjugate after a
  // PPSV23, and stops at family 3 because the child rulebook is not silent
  // there. If a later session ever adds a child conjugate-after-PPSV23 row,
  // this test fails and the reasoning above has to be revisited rather than
  // quietly outlived.
  it('the child rulebook judges a PPSV23 after a conjugate, and says nothing about a conjugate after a PPSV23', () => {
    const child = DOSE_INTERVAL_RULES.filter((r) => r.rulebook === 'child');
    expect(child.some((r) => r.vaccine === 'PPSV23' && r.from === 'lastPcv')).toBe(true);
    expect(child.some((r) => r.vaccine === 'PCV' && r.from === 'lastPpsv23')).toBe(false);
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
  it('one floor and two recommendations among the three families', () => {
    const kinds = [
      'ADULT-PCV-AFTER-PPSV23',           // family 2 — recommendation from 2026-10-25
      'ADULT-PPSV23-AFTER-PCV15',         // family 3 — still a floor
      'ADULT-PCV20-21-5Y-AFTER-PPSV23',   // Ruling F
    ].map((id) => ruleById(id).enforcement);
    expect(kinds).toEqual(['recommendation', 'floor', 'recommendation']);
  });
});
