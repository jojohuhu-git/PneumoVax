// primary-vs-booster-boundary.test.js
//
// Locks the seriesTotal/primaryTotal that drive the "Primary series" /
// "Boosters" headings on the recorded-dose list (owner decision 2026-09-15,
// option A). Mirrors MeningoVax's test of the same name — the two apps share
// one design system and must group doses identically.
//
// Sources, fetched live 2026-09-15:
//
//   MMWR 71(37), "Use of 15-Valent Pneumococcal Conjugate Vaccine Among U.S.
//   Children" — https://www.cdc.gov/mmwr/volumes/71/wr/mm7137a3.htm
//     "The primary infant series consists of 3 doses of PCV."
//     "The fourth (booster) dose is recommended at age 12-15 months and >=8
//      weeks after the third dose"
//
//   CDC child & adolescent immunization schedule notes, pneumococcal catch-up
//   https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html
//     "Healthy children ages 2-4 years with any incomplete PCV series: 1 dose
//      PCV" — catch-up doses are never called boosters.
//
// Note the current CDC pneumococcal recommendations page now says only
// "Administer a 4-dose PCV series ... 2 months, 4 months, 6 months, 12 through
// 15 months" and has dropped the word "booster". The ACIP MMWR above still
// carries it, and ACIP governs, so the booster label stands.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-06-06';
const run = (input) => recommend({ today: TODAY, riskIds: [], pcvDoses: [], ...input });
const pcvRec = (r) => r.recs.find((x) => x.vaccine === 'PCV') || null;

describe('infant PCV — 3 primary doses, then the 12-15 month booster', () => {
  it('a 2-month-old starting the series: 4 total, 3 of them primary', () => {
    const rec = pcvRec(run({ ageMonths: 2 }));
    expect(rec.seriesTotal).toBe(4);
    expect(rec.primaryTotal).toBe(3);
  });

  it('mid-series at 6 months: still 4 total, 3 primary', () => {
    const rec = pcvRec(run({
      ageMonths: 6,
      pcvDoses: [
        { product: 'PCV15', date: '2026-02-06' },
        { product: 'PCV15', date: '2026-04-06' },
      ],
    }));
    expect(rec.seriesTotal).toBe(4);
    expect(rec.primaryTotal).toBe(3);
  });

  it('a 13-month-old with three infant doses: the remaining dose is the booster', () => {
    const rec = pcvRec(run({
      ageMonths: 13,
      pcvDoses: [
        { product: 'PCV15', date: '2025-07-06' },
        { product: 'PCV15', date: '2025-09-06' },
        { product: 'PCV15', date: '2025-11-06' },
      ],
    }));
    expect(rec.seriesTotal).toBe(4);
    // doses 1-3 are the primary series; dose 4 at >=12 months is the booster
    expect(rec.primaryTotal).toBe(3);
  });
});

describe('a series begun at or after 12 months is catch-up, with no booster', () => {
  it('a 13-month-old with no prior doses: every dose is primary', () => {
    const rec = pcvRec(run({ ageMonths: 13 }));
    expect(rec.seriesTotal).toBe(2);
    // CDC never calls a catch-up dose a booster, so primaryTotal is the whole
    // total and the list draws no "Boosters" heading.
    expect(rec.primaryTotal).toBe(rec.seriesTotal);
  });
});

describe('the invariant that makes grouping safe', () => {
  it('primaryTotal never exceeds seriesTotal on any PCV card that sets them', () => {
    const cases = [
      run({ ageMonths: 2 }),
      run({ ageMonths: 6, pcvDoses: [{ product: 'PCV15', date: '2026-02-06' }] }),
      run({ ageMonths: 13 }),
      run({ ageMonths: 9, pcvDoses: [{ product: 'PCV15', date: '2026-01-06' }] }),
    ];
    for (const r of cases) {
      const rec = pcvRec(r);
      if (rec?.seriesTotal == null) continue;
      expect(rec.primaryTotal).toBeLessThanOrEqual(rec.seriesTotal);
      expect(rec.primaryTotal).toBeGreaterThanOrEqual(1);
    }
  });

  it('cards whose total counts a different set of doses leave both null', () => {
    // The at-risk 24-71 month catch-up card counts only the >=24-month catch-up
    // doses, while the recorded list shows the infant doses too. Drawing a
    // denominator there would be a wrong number, so it stays ungrouped.
    const rec = pcvRec(run({
      ageMonths: 30,
      riskIds: ['asplenia'],
      pcvDoses: [
        { product: 'PCV13', date: '2024-02-06' },
        { product: 'PCV13', date: '2024-04-06' },
        { product: 'PCV13', date: '2024-06-06' },
      ],
    }));
    expect(rec.seriesTotal).toBeNull();
    expect(rec.primaryTotal).toBeNull();
  });
});
