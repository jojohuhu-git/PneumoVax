// ⚠️ SUPERSEDED BY OWNER RULING 2026-10-25, AND KEPT AS THE RECORD OF IT.
//
// This file was written to hold the AFTERNOON RULING OF 2026-10-24, which made
// families 2 and 3 floors again. A day later her adult table removed every
// adult floor, so all three families now COUNT and all three patients read
// Complete — which is what her own adult interval table says for those exact
// histories ("PCV15 -> PPSV23: None; series complete" and "PPSV23 -> PCV15
// flipped: None; no further PPSV23 needed").
//
// IT IS KEPT, NOT DELETED, and its patients are untouched: they are hers, they
// are the three the whole question was argued over, and this file is now what
// fails if anyone restores a floor to any of them. What has inverted is the
// closing claim — the three rows used to differ deliberately and now agree
// deliberately. See the last describe block.
//
// This file exists because `ADULT-PCV-AFTER-PPSV23` and
// `ADULT-PPSV23-AFTER-PCV15` have each been a floor, then a recommendation,
// then a floor again — all inside one day — and the three rows involved look
// alike enough that a later session could easily "tidy" them into agreement.
// They must not agree. The owner split them deliberately:
//
//   FAMILY 2  an adult conjugate under 1 year after a PPSV23   -> COUNTS
//   FAMILY 3  an adult PPSV23 early after a PCV15              -> COUNTS
//   RULING F  an adult PCV20/21 under 5 years after a PPSV23   -> COUNTS
//
// Her ground on 2026-10-24 was whether a dose was OWED: families 2 and 3 still
// owed one, so the timing of the dose they got decided whether it filled the
// debt, while Ruling F's patient owed nothing. THAT DISTINCTION IS GONE, and
// it is worth saying why rather than just deleting it. Her 2026-10-25 table
// answers a different question — not "was a dose owed" but "is there data
// behind this interval" — and for every adult sequence the answer is that the
// dose counts. The owed/not-owed split survives only in what each patient is
// told NEXT, which the recommendation cards still differ on.
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

  it('counts the conjugate given 8 months after a PPSV23, and still names the gap', () => {
    const v = run(FAMILY_2).perDose.pcv;
    expect(v).toHaveLength(1);
    expect(v[0].status).toBe('valid');
    expect(v[0].intervalRuleId).toBe('ADULT-PCV-AFTER-PPSV23');
    expect(v[0].reasons.join(' ')).toMatch(/shorter than the 1 year/);
  });

  it('and calls that patient complete — her own table\'s answer for this history', () => {
    expect(run(FAMILY_2).recs.some((r) => r.status === 'complete')).toBe(true);
  });

  // CASE H — the control the owner set on 2026-10-11, un-rejected by family 2
  // on the morning of the 24th and rejected again by the afternoon ruling. A
  // two-month gap is further from the year than the eight-month one, so if
  // family 2's patient is invalid this patient cannot be valid.
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

  it('counts the PPSV23 given 12 weeks after a PCV15, and still names the gap', () => {
    const v = run(FAMILY_3).perDose.ppsv23;
    expect(v).toHaveLength(1);
    expect(v[0].status).toBe('valid');
    expect(v[0].intervalRuleId).toBe('ADULT-PPSV23-AFTER-PCV15');
    expect(v[0].reasons.join(' ')).toMatch(/shorter than the 1 year/);
  });

  it('and calls that patient complete', () => {
    expect(run(FAMILY_3).recs.some((r) => r.status === 'complete')).toBe(true);
  });

  // ── the rows themselves ───────────────────────────────────────────────
  it('both rows are CDC recommendations with no grace, not owner floors', () => {
    for (const id of ['ADULT-PCV-AFTER-PPSV23', 'ADULT-PPSV23-AFTER-PCV15']) {
      const rule = ruleById(id);
      expect(rule, id).toBeDefined();
      expect(rule.enforcement, id).toBe('recommendation');
      // CDC, not OWNER: as advice the row asserts only CDC's own interval.
      // That is Ruling F's relabelling, applied here on 2026-10-25.
      expect(rule.authority, id).toBe('CDC');
      // A floor gets CDC's 4-day grace; a recommendation deliberately does not.
      expect(rule.grace, id).toBe(false);
    }
  });

  it('each row records every flip, so no superseded ruling can be mistaken for current', () => {
    for (const id of ['ADULT-PCV-AFTER-PPSV23', 'ADULT-PPSV23-AFTER-PCV15']) {
      // Four flips now, and the row has to say so — this is the whole reason
      // the file exists. The 2026-10-24 wording said "FLOOR TWICE AND A
      // RECOMMENDATION ONCE"; 2026-10-25 made it twice each.
      expect(ruleById(id).source, id).toMatch(/FLOOR TWICE AND A RECOMMENDATION TWICE/);
      expect(ruleById(id).source, id).toMatch(/2026-10-25 IS THE LATEST/);
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

// ⚠️ THIS CLAIM INVERTED ON 2026-10-25, which is the single most important
// thing in this file. It used to read "the three rows do not agree, and that
// is the point" — a guard against a later session tidying them together. They
// now agree BY DECISION, so the guard is turned round: it fails if anyone
// splits them again, which is the mistake available from here.
describe('the three rows agree, and THAT is now the point', () => {
  it('all three families are recommendations — no adult floor among them', () => {
    const kinds = [
      'ADULT-PCV-AFTER-PPSV23',           // family 2
      'ADULT-PPSV23-AFTER-PCV15',         // family 3
      'ADULT-PCV20-21-5Y-AFTER-PPSV23',   // Ruling F
    ].map((id) => ruleById(id).enforcement);
    expect(kinds).toEqual(['recommendation', 'recommendation', 'recommendation']);
  });

  // The three histories again, spelled out here because each `const` above
  // lives inside its own describe block.
  it('and all three of her patients read Complete', () => {
    const complete = (p) => run({ ageMonths: Y(70), riskIds: [], ...p })
      .recs.some((r) => r.status === 'complete');
    // family 2 — PPSV23, then a PCV15 eight months later
    expect(complete({
      pcvDoses: [{ product: 'PCV15', date: '2026-06-19' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }],
    })).toBe(true);
    // family 3 — PCV15, then a PPSV23 twelve weeks later
    expect(complete({
      ageMonths: Y(60),
      pcvDoses: [{ product: 'PCV15', date: '2026-07-19' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
    })).toBe(true);
    // Ruling F — PCV13 + PPSV23, then an early extra PCV20
    expect(complete({
      pcvDoses: [
        { product: 'PCV13', date: '2016-10-13' },
        { product: 'PCV20', date: '2025-10-10' },
      ],
      ppsv23Doses: [{ product: 'PPSV23', date: '2021-10-13' }],
    })).toBe(true);
  });
});
