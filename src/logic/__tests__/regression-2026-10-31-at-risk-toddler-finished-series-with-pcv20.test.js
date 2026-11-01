// ── §B-TODDLER-PCV20 (2026-10-31): an at-risk 2-5 year old who FINISHED her ──
//    baby series, with a PCV20 in it, needs nothing more
//
// Maya is 4 and has diabetes: PCV13 at 2, 4 and 6 months, PCV20 at 12 months,
// no PPSV23. Her card offered "Option A: 1 dose PCV20 / Option B: 1 dose
// PPSV23". CDC's child notes, at-risk list, Age 2-5 years (read live
// 2026-10-31), print under "Completed recommended PCV series but have not
// received PPSV23": "Previously received at least 1 dose of PCV20: no further
// PCV or PPSV23 doses needed". p2016 Table 4 agrees: "Completed PCV series
// before age 6 years, including one or more doses of PCV20 | No additional
// doses". OWNER RULING 2026-10-31: "Mark complete".
//
// The cause: `enoughAt24mo` read "3 or more doses before 24 months" as p2016's
// "3 doses of PCV, all before 12 months" row, so a child who finished on time
// still owed a dose at 24 months or later. The test grid never builds a
// toddler with baby doses (its four-dose series is dated in the last five
// months), so this is asserted by hand.
//
// The test is p2016 Table 4's rows 1/2 read as printed: 3+ doses before 24
// months, one of them DATED at 12-23 months, is neither row.
//
// Unchanged, and right: a series STARTED at 12-23 months with only two doses
// (13 and 15 months). CDC's catch-up table calls the second dose final only
// "for healthy children", so CDC ("Less than 3 PCV doses: 2 doses PCV") and
// p2016 Table 4 ("0, 1, or 2 PCV doses by age 24 months") both ask for two
// more. Pinned below. So is a child whose only possible booster is UNDATED: it
// might have been a 4th dose before her first birthday.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-10-11';
const addM = (iso, m) => {
  const [y, mo, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1 + m, d)).toISOString().slice(0, 10);
};
const run = ({ am = 48, riskIds = ['diabetes'], months, products, ppsv23Doses = [] }) => {
  const dob = addM(TODAY, -am);
  const pcvDoses = months.map((m, i) => ({ product: products[i], date: m == null ? '' : addM(dob, m) }));
  return recommend({ dob, ageMonths: am, today: TODAY, riskIds, pcvDoses, ppsv23Doses });
};
const only = (out) => { expect(out.recs).toHaveLength(1); return out.recs[0]; };
const keysOf = (r) => r.noteCites.map((c) => c.key);
const P13x3 = ['PCV13', 'PCV13', 'PCV13'];

describe('Maya: a finished baby series with a PCV20 in it', () => {
  it('diabetes, PCV13 at 2/4/6 months and PCV20 at 12 months: complete, quoting CDC\'s Age 2-5 row', () => {
    const r = only(run({ months: [2, 4, 6, 12], products: [...P13x3, 'PCV20'] }));
    expect(r.status).toBe('complete');
    expect(r.doseLabel).toBe('PCV complete (includes PCV20)');
    // Her own age band's sentence, not the Age 6-18 one (FINDING N).
    expect(keysOf(r)).toEqual(['pedsRiskPcv20CompleteAt2', 'cdcPcv20Children2023CompleteWithPcv20']);
  });

  it('asplenia, same history: complete — CDC\'s IC Age 2-5 list prints the same words', () => {
    const r = only(run({ riskIds: ['asplenia'], months: [2, 4, 6, 12], products: [...P13x3, 'PCV20'] }));
    expect(r.status).toBe('complete');
    expect(keysOf(r)[0]).toBe('pedsRiskPcv20CompleteAt2');
  });

  it('four PCV20 baby doses: complete', () => {
    const r = only(run({ months: [2, 4, 6, 12], products: Array(4).fill('PCV20') }));
    expect(r.status).toBe('complete');
  });

  it('a late start (7, 9 and 13 months) with a PCV20: complete — an age-appropriate catch-up series', () => {
    const r = only(run({ months: [7, 9, 13], products: ['PCV13', 'PCV13', 'PCV20'] }));
    expect(r.status).toBe('complete');
  });

  it('a missed 6-month dose (2, 4 and 12 months) with a PCV20: complete', () => {
    const r = only(run({ months: [2, 4, 12], products: ['PCV13', 'PCV13', 'PCV20'] }));
    expect(r.status).toBe('complete');
  });

  it('a late start with three doses (13, 15, 18 months): complete — CDC and p2016 agree at three', () => {
    const r = only(run({ months: [13, 15, 18], products: ['PCV13', 'PCV13', 'PCV20'] }));
    expect(r.status).toBe('complete');
  });

  it('four dated baby PCV13 and a PCV20 with no date: complete — the date does not matter to CDC\'s row', () => {
    const r = only(run({ months: [2, 4, 6, 12, null], products: [...P13x3, 'PCV13', 'PCV20'] }));
    expect(r.status).toBe('complete');
  });

  it('at 6 and older the card still quotes CDC\'s Age 6-18 row', () => {
    const r = only(run({ am: 96, months: [2, 4, 6, 12], products: [...P13x3, 'PCV20'] }));
    expect(r.status).toBe('complete');
    expect(keysOf(r)[0]).toBe('pedsRiskPcv20Complete');
    const ic = only(run({ am: 96, riskIds: ['asplenia'], months: [2, 4, 6, 12], products: [...P13x3, 'PCV20'] }));
    expect(keysOf(ic)[0]).toBe('pedsIcPcv20Complete');
  });
});

describe('children who are NOT finished keep their dose', () => {
  it('a finished series with no PCV20 in it is still offered PCV20 or PPSV23', () => {
    const out = run({ months: [2, 4, 6, 12], products: Array(4).fill('PCV13') });
    expect(out.recs.map((r) => r.doseLabel)).toEqual(['Option A: 1 dose PCV20 (≥8 weeks)', 'Option B: 1 dose PPSV23 (≥8 weeks)']);
  });

  it('three doses all before 12 months, one a PCV20, still owes a dose (CDC "3 PCV doses: 1 dose PCV")', () => {
    const r = only(run({ months: [2, 4, 6], products: ['PCV13', 'PCV13', 'PCV20'] }));
    expect(r.doseLabel).toBe('1 dose PCV (at-risk catch-up)');
  });

  it('three baby doses before 12 months and an undated PCV20 are not called complete — it might have been a 4th infant dose', () => {
    // Unchanged from before §B-TODDLER-PCV20: still offered PCV20 or PPSV23.
    const out = run({ months: [2, 4, 6, null], products: ['PCV13', 'PCV13', 'PCV13', 'PCV20'] });
    expect(out.recs.map((r) => r.doseLabel)).toEqual(['Option A: 1 dose PCV20 (≥8 weeks)', 'Option B: 1 dose PPSV23 (≥8 weeks)']);
  });

  it('a series started at 12-23 months with two doses still owes two at age 2 (CDC and p2016 agree)', () => {
    const r = only(run({ months: [13, 15], products: ['PCV13', 'PCV20'] }));
    expect(r.doseLabel).toBe('PCV dose 1 of 2 (at-risk catch-up)');
  });
});

describe('the whole family, ages 2-5, five risk conditions', () => {
  const SCHEDULES = {
    routine12: [2, 4, 6, 12], routine15: [2, 4, 6, 15], fiveDoses: [2, 4, 6, 12, 18], lateStart: [7, 9, 13],
    missed6mo: [2, 4, 12], secondYearThree: [13, 15, 18],
  };
  const MIXES = {
    allPcv20: (n) => Array(n).fill('PCV20'),
    pcv20Last: (n) => [...Array(n - 1).fill('PCV13'), 'PCV20'],
    pcv20First: (n) => ['PCV20', ...Array(n - 1).fill('PCV13')],
    pcv15ThenPcv20: (n) => [...Array(n - 1).fill('PCV15'), 'PCV20'],
    controlAllPcv13: (n) => Array(n).fill('PCV13'),
  };
  const RISKS = ['diabetes', 'chronic_heart', 'cochlear_implant', 'asplenia', 'hiv'];

  it('every finished series with a PCV20 is complete; every one without is not (pinned exactly)', () => {
    let complete = 0; let offered = 0;
    for (let am = 24; am <= 71; am++) for (const riskIds of RISKS.map((x) => [x]))
      for (const months of Object.values(SCHEDULES)) for (const [mix, f] of Object.entries(MIXES)) {
        const out = run({ am, riskIds, months, products: f(months.length) });
        if (mix === 'controlAllPcv13') {
          expect(out.recs.some((r) => r.status === 'complete')).toBe(false);
          offered += 1;
        } else {
          expect(out.recs).toHaveLength(1);
          expect(out.recs[0].status).toBe('complete');
          complete += 1;
        }
      }
    expect([complete, offered]).toEqual([5760, 1440]);
  });
});
