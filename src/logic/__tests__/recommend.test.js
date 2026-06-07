import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-06-06';
function run(input) { return recommend({ today: TODAY, ...input }); }
const first = (r) => r.recs[0];
const pcv = (r) => r.recs.find((x) => x.vaccine === 'PCV') || null;
const ppsv = (r) => r.recs.find((x) => x.vaccine === 'PPSV23') || null;

// ════════════════════════════════════════════════════════════════════════
// §A — Routine children 2–23 months (p2016 Table 1)
// ════════════════════════════════════════════════════════════════════════
describe('§A Routine infants 2–23mo', () => {
  it('2mo, no doses → PCV dose 1 of 4 due', () => {
    const r = run({ ageMonths: 2, riskIds: [], pcvDoses: [] });
    expect(pcv(r).status).toBe('due');
    expect(pcv(r).doseLabel).toMatch(/dose 1 of 4/i);
    expect(pcv(r).dueToday).toBe(true);
    expect(pcv(r).brands).toContain('PCV20 (Prevnar 20)');
  });

  it('7mo, 0 prior → 3-dose target (catch-up)', () => {
    const r = run({ ageMonths: 7, riskIds: [], pcvDoses: [] });
    expect(pcv(r).doseLabel).toMatch(/of 3/);
  });

  it('13mo, 0 prior → 2-dose target', () => {
    const r = run({ ageMonths: 13, riskIds: [], pcvDoses: [] });
    expect(pcv(r).doseLabel).toMatch(/of 2/);
  });

  it('min interval is 4 weeks under 12 months', () => {
    const r = run({ ageMonths: 4, riskIds: [], pcvDoses: [{ product: 'PCV20', date: '2026-04-01' }] });
    expect(pcv(r).minIntervalDays).toBe(28);
  });

  it('min interval is 8 weeks at 12 months or older', () => {
    const r = run({ ageMonths: 14, riskIds: [], pcvDoses: [{ product: 'PCV20', date: '2026-04-01' }] });
    expect(pcv(r).minIntervalDays).toBe(56);
  });

  it('final dose not due until 12 months for an infant <12mo with 3 prior', () => {
    const r = run({ ageMonths: 8, riskIds: [], pcvDoses: [
      { product: 'PCV20', date: '2025-12-01' },
      { product: 'PCV20', date: '2026-02-01' },
      { product: 'PCV20', date: '2026-04-01' },
    ] });
    // 4th dose is the final/booster, must be ≥12mo → not due today
    expect(pcv(r).dueToday).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════
// §B — Healthy children 24mo–18y (p2016 Table 2)
// ════════════════════════════════════════════════════════════════════════
describe('§B Healthy children 24mo–18y', () => {
  it('30mo, no doses → 1 catch-up dose', () => {
    const r = run({ ageMonths: 30, riskIds: [], pcvDoses: [] });
    expect(pcv(r).doseLabel).toMatch(/1 dose PCV \(catch-up\)/);
    expect(pcv(r).minIntervalDays).toBe(56);
  });

  it('30mo, 4 PCV doses → complete', () => {
    const r = run({ ageMonths: 30, riskIds: [], pcvDoses: [
      { product: 'PCV13' }, { product: 'PCV13' }, { product: 'PCV13' }, { product: 'PCV13' },
    ] });
    expect(pcv(r).status).toBe('complete');
  });

  it('30mo with an undated PCV20 → complete (benefit of the doubt)', () => {
    // Undated PCV20 can't be proven to be a sub-24mo dose, so it completes.
    // (Contrast: a PCV20 DATED in infancy does not complete — see the P09 test.)
    const r = run({ ageMonths: 30, riskIds: [], pcvDoses: [{ product: 'PCV20' }] });
    expect(pcv(r).status).toBe('complete');
    expect(pcv(r).note).toMatch(/PCV20|PPSV23/i);
  });

  it('30mo with a PCV20 DATED at 12mo → NOT complete, 1 more dose due (P09)', () => {
    // Healthy child, single PCV20 given in infancy → still owes the 24-59mo catch-up
    // dose. Verified against CDC PneumoRecs (case P09).
    const r = run({ ageMonths: 30, riskIds: [], pcvDoses: [{ product: 'PCV20', date: '2025-04-06' }] });
    expect(pcv(r).status).toBe('catchup');
    expect(pcv(r).doseLabel).toMatch(/catch-up/i);
  });

  it('8yo healthy, incomplete → not indicated (older healthy children not caught up)', () => {
    const r = run({ ageMonths: 96, riskIds: [], pcvDoses: [] });
    expect(pcv(r).status).toBe('not-indicated');
  });
});

// ════════════════════════════════════════════════════════════════════════
// §D — At-risk children 24mo–18y (p2016 Table 4) — each row
// ════════════════════════════════════════════════════════════════════════
describe('§D At-risk children — Table 4 rows', () => {
  it('Row 1: 30mo asplenia (IC), incomplete → 2 doses ≥8wk apart', () => {
    const r = run({ ageMonths: 30, riskIds: ['asplenia'], pcvDoses: [] });
    expect(pcv(r).status).toBe('risk-based');
    expect(pcv(r).doseLabel).toMatch(/1 of 2/);
    expect(pcv(r).minIntervalDays).toBe(56);
  });

  it('Row 2: 30mo diabetes (non-IC), 3 PCV before 12mo → 1 dose', () => {
    const r = run({ ageMonths: 30, riskIds: ['diabetes'], pcvDoses: [
      { product: 'PCV13' }, { product: 'PCV13' }, { product: 'PCV13' },
    ] });
    expect(pcv(r).doseLabel).toMatch(/1 dose PCV/);
  });

  it('Row 3: child completed series including PCV20 → no additional doses', () => {
    const r = run({ ageMonths: 96, riskIds: ['asplenia'], pcvDoses: [
      { product: 'PCV20' }, { product: 'PCV13' },
    ] });
    expect(pcv(r).status).toBe('complete');
  });

  it('Row 4 (non-IC): 10yo chronic_heart, completed PCV13/15 no PCV20/PPSV23 → A) PCV20 or B) PPSV23', () => {
    const r = run({ ageMonths: 120, riskIds: ['chronic_heart'], pcvDoses: [
      { product: 'PCV13' }, { product: 'PCV13' }, { product: 'PCV13' }, { product: 'PCV13' },
    ] });
    const a = r.recs.find((x) => x.doseLabel.includes('Option A'));
    const b = r.recs.find((x) => x.doseLabel.includes('Option B'));
    expect(a.brands).toContain('PCV20 (Prevnar 20)');
    expect(b.vaccine).toBe('PPSV23');
  });

  it('Row 4 (non-IC): PPSV23 already given → complete', () => {
    const r = run({ ageMonths: 120, riskIds: ['chronic_heart'],
      pcvDoses: [{ product: 'PCV13' }, { product: 'PCV13' }, { product: 'PCV13' }, { product: 'PCV13' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2024-01-01' }] });
    expect(pcv(r).status).toBe('complete');
  });

  it('Row 5 (IC): 10yo HIV completed PCV13, no PPSV23 → PCV20 A; PPSV23 B with 5y note', () => {
    const r = run({ ageMonths: 120, riskIds: ['hiv'], pcvDoses: [
      { product: 'PCV13' }, { product: 'PCV13' }, { product: 'PCV13' }, { product: 'PCV13' },
    ] });
    const b = r.recs.find((x) => x.doseLabel.includes('Option B'));
    expect(b.note).toMatch(/5 years/);
  });

  it('Row 5 (IC): PPSV23 already given → PCV20 or 2nd PPSV23 ≥5y', () => {
    const r = run({ ageMonths: 120, riskIds: ['hiv'],
      pcvDoses: [{ product: 'PCV13' }, { product: 'PCV13' }, { product: 'PCV13' }, { product: 'PCV13' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2024-01-01' }] });
    expect(r.recs.some((x) => x.vaccine === 'PCV' && x.brands.includes('PCV20 (Prevnar 20)'))).toBe(true);
    expect(r.recs.some((x) => x.vaccine === 'PPSV23' && x.minIntervalDays >= 1800)).toBe(true);
  });

  it('Row 6 (non-IC): 8yo chronic_lung, no prior PCV → A) PCV20, B) PCV15→PPSV23', () => {
    const r = run({ ageMonths: 96, riskIds: ['chronic_lung'], pcvDoses: [] });
    const a = r.recs.find((x) => x.doseLabel.includes('Option A'));
    const b1 = r.recs.find((x) => x.doseLabel.includes('Option B-1'));
    const b2 = r.recs.find((x) => x.doseLabel.includes('Option B-2'));
    expect(a.brands).toEqual(['PCV20 (Prevnar 20)']);
    expect(b1.brands).toEqual(['PCV15 (Vaxneuvance)']);
    expect(b2.vaccine).toBe('PPSV23');
  });

  it('Row 7 (IC): 8yo asplenia, no prior PCV → same A/B', () => {
    const r = run({ ageMonths: 96, riskIds: ['asplenia'], pcvDoses: [] });
    expect(r.recs.some((x) => x.doseLabel.includes('Option A'))).toBe(true);
    expect(r.recs.some((x) => x.doseLabel.includes('Option B-1'))).toBe(true);
  });

  it('Row 8 (non-IC): 10yo diabetes, PCV13 only (1 dose at/after 6y) → A) PCV20, B) PPSV23', () => {
    const r = run({ ageMonths: 120, riskIds: ['diabetes'], pcvDoses: [{ product: 'PCV13' }] });
    const a = r.recs.find((x) => x.doseLabel.includes('Option A'));
    const b = r.recs.find((x) => x.doseLabel.includes('Option B'));
    expect(a.brands).toEqual(['PCV20 (Prevnar 20)']);
    expect(b.vaccine).toBe('PPSV23');
    expect(b.note).not.toMatch(/5 years/); // non-IC has no 5y step
  });

  it('Row 9 (IC): 10yo asplenia, PCV13 only → B has the 5y PCV20/2nd-PPSV23 step', () => {
    const r = run({ ageMonths: 120, riskIds: ['asplenia'], pcvDoses: [{ product: 'PCV13' }] });
    const b = r.recs.find((x) => x.doseLabel.includes('Option B'));
    expect(b.note).toMatch(/5 years/);
  });
});

// ════════════════════════════════════════════════════════════════════════
// §E — HSCT, children <19y (p2016 Table 5)
// ════════════════════════════════════════════════════════════════════════
describe('§E HSCT children <19y (p2016 Table 5)', () => {
  it('5yo HSCT → advisory PCV20 ×4, relative to transplant, not dueToday', () => {
    const r = run({ ageMonths: 60, riskIds: ['hsct'], pcvDoses: [] });
    expect(r.hsct).toBeTruthy();
    expect(r.hsct.title).toMatch(/child/i);
    const a = r.hsct.recs[0];
    expect(a.advisory).toBe(true);
    expect(a.dueToday).toBe(false);
    expect(a.earliestNextDate).toBeNull();
    expect(a.doseLabel).toMatch(/4 doses of PCV20/);
    expect(a.note).toMatch(/3–6 months after HSCT/);
    expect(a.note).toMatch(/GVHD/);
  });

  it('child HSCT cites p2016 Table 5 (SOLE peds-HSCT source), not CDC child notes', () => {
    const r = run({ ageMonths: 60, riskIds: ['hsct'], pcvDoses: [] });
    const cites = r.hsct.recs[0].citations.map((c) => c.short);
    expect(cites.some((s) => /p2016 Table 5/.test(s))).toBe(true);
  });

  it('standard recs still shown below HSCT advisory', () => {
    const r = run({ ageMonths: 60, riskIds: ['hsct'], pcvDoses: [] });
    expect(r.recs.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════
// §F — HSCT, adults ≥19y (Fred Hutch LTFU)
// ════════════════════════════════════════════════════════════════════════
describe('§F HSCT adults ≥19y (Fred Hutch LTFU)', () => {
  it('40yo HSCT → advisory PCV20 ×3 at ≥6/≥8/≥10mo, no PPSV23, titer note', () => {
    const r = run({ ageMonths: 480, riskIds: ['hsct'], pcvDoses: [] });
    expect(r.hsct.title).toMatch(/adult/i);
    const a = r.hsct.recs[0];
    expect(a.advisory).toBe(true);
    expect(a.doseLabel).toMatch(/PCV20 ×3/);
    expect(a.note).toMatch(/≥6, ≥8, and ≥10 months/);
    expect(a.note).toMatch(/NO PPSV23/i);
    expect(a.note).toMatch(/≥15 of the 20 PCV20 serotypes/);
  });

  it('adult HSCT cites Fred Hutch LTFU (SOLE adult-HSCT source)', () => {
    const r = run({ ageMonths: 480, riskIds: ['hsct'], pcvDoses: [] });
    const cites = r.hsct.recs[0].citations.map((c) => c.short);
    expect(cites.some((s) => /Fred Hutch/.test(s))).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════
// §G — Adults 19–49y WITH a risk condition, each history branch × interval
// ════════════════════════════════════════════════════════════════════════
describe('§G Adults 19–49 with risk', () => {
  it('none/unknown + chronic (non-IC) → 1 PCV, PCV15→PPSV23 ≥1y note', () => {
    const r = run({ ageMonths: 360, riskIds: ['diabetes'], pcvDoses: [] });
    expect(pcv(r).status).toBe('risk-based');
    expect(pcv(r).brands).toContain('PCV21 (Capvaxive)');
    expect(pcv(r).note).toMatch(/1 year/);
  });

  it('none/unknown + IC → PCV15→PPSV23 ≥8 weeks note', () => {
    const r = run({ ageMonths: 360, riskIds: ['hiv'], pcvDoses: [] });
    expect(pcv(r).note).toMatch(/8 weeks/);
  });

  it('cochlear implant uses the IC (≥8 week) interval', () => {
    const r = run({ ageMonths: 360, riskIds: ['cochlear_implant'], pcvDoses: [] });
    expect(pcv(r).note).toMatch(/8 weeks/);
  });

  it('CSF leak uses the IC (≥8 week) interval', () => {
    const r = run({ ageMonths: 360, riskIds: ['csf_leak'], pcvDoses: [] });
    expect(pcv(r).note).toMatch(/8 weeks/);
  });

  it('PCV15 only (non-IC) → PPSV23 due ≥1y, INCOMPLETE', () => {
    const r = run({ ageMonths: 360, riskIds: ['diabetes'], pcvDoses: [{ product: 'PCV15', date: '2020-01-01' }] });
    expect(ppsv(r).vaccine).toBe('PPSV23');
    expect(ppsv(r).minIntervalDays).toBe(365);
    expect(ppsv(r).note).toMatch(/INCOMPLETE/);
  });

  it('PCV15 only (IC) → PPSV23 ≥8 weeks', () => {
    const r = run({ ageMonths: 360, riskIds: ['hiv'], pcvDoses: [{ product: 'PCV15', date: '2020-01-01' }] });
    expect(ppsv(r).minIntervalDays).toBe(56);
  });

  it('PPSV23 only → PCV ≥1y after PPSV23', () => {
    const r = run({ ageMonths: 360, riskIds: ['diabetes'], ppsv23Doses: [{ product: 'PPSV23', date: '2020-01-01' }] });
    expect(pcv(r).vaccine).toBe('PCV');
    expect(pcv(r).minIntervalDays).toBe(365);
  });

  it('PCV13 only → PCV20/PCV21 ≥1y → completes', () => {
    const r = run({ ageMonths: 360, riskIds: ['diabetes'], pcvDoses: [{ product: 'PCV13', date: '2018-01-01' }] });
    expect(pcv(r).brands).toEqual(['PCV20 (Prevnar 20)', 'PCV21 (Capvaxive)']);
    expect(pcv(r).minIntervalDays).toBe(365);
  });

  it('PCV13 + PPSV23 (IC) → PCV20/PCV21 ≥5y', () => {
    const r = run({ ageMonths: 360, riskIds: ['hiv'],
      pcvDoses: [{ product: 'PCV13', date: '2015-01-01' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2016-01-01' }] });
    expect(pcv(r).minIntervalDays).toBe(1826);
  });

  it('PCV13 + PPSV23 (chronic only, <50) → none now, review at 50', () => {
    const r = run({ ageMonths: 360, riskIds: ['diabetes'],
      pcvDoses: [{ product: 'PCV13', date: '2015-01-01' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2016-01-01' }] });
    expect(pcv(r).status).toBe('complete');
    expect(pcv(r).doseLabel).toMatch(/review at age 50/);
  });

  it('already PCV20 → complete', () => {
    const r = run({ ageMonths: 360, riskIds: ['diabetes'], pcvDoses: [{ product: 'PCV20', date: '2024-01-01' }] });
    expect(pcv(r).status).toBe('complete');
  });

  it('PCV15 & PPSV23 → complete', () => {
    const r = run({ ageMonths: 360, riskIds: ['diabetes'],
      pcvDoses: [{ product: 'PCV15', date: '2020-01-01' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2022-01-01' }] });
    expect(pcv(r).status).toBe('complete');
  });

  it('19–49 with NO risk → not indicated', () => {
    const r = run({ ageMonths: 360, riskIds: [], pcvDoses: [] });
    expect(pcv(r).status).toBe('not-indicated');
  });
});

// ════════════════════════════════════════════════════════════════════════
// §H — Adults ≥50y, each history branch
// ════════════════════════════════════════════════════════════════════════
describe('§H Adults ≥50 routine', () => {
  it('55yo naive → due, PCV20/PCV15/PCV21 offered', () => {
    const r = run({ ageMonths: 660, riskIds: [], pcvDoses: [] });
    expect(pcv(r).status).toBe('due');
    expect(pcv(r).brands).toContain('PCV20 (Prevnar 20)');
    expect(pcv(r).brands).toContain('PCV21 (Capvaxive)');
  });

  it('55yo PPSV23 only → PCV ≥1y', () => {
    const r = run({ ageMonths: 660, riskIds: [], ppsv23Doses: [{ product: 'PPSV23', date: '2020-01-01' }] });
    expect(pcv(r).minIntervalDays).toBe(365);
  });

  it('55yo PCV13 only → PCV20/PCV21 ≥1y → complete-pathway', () => {
    const r = run({ ageMonths: 660, riskIds: [], pcvDoses: [{ product: 'PCV13', date: '2018-01-01' }] });
    expect(pcv(r).brands).toEqual(['PCV20 (Prevnar 20)', 'PCV21 (Capvaxive)']);
  });

  it('55yo PCV13 + PPSV23 (PPSV23 at <65) → PCV20/PCV21 ≥5y, due', () => {
    const r = run({ ageMonths: 660, riskIds: [],
      pcvDoses: [{ product: 'PCV13', date: '2010-01-01' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2012-01-01' }] });
    expect(pcv(r).status).toBe('due');
    expect(pcv(r).minIntervalDays).toBe(1826);
  });

  // PCV13 + PPSV23: shared-decision keys on PPSV23-given-at-≥65 (CDC adult notes),
  // computed from the dose date — NOT the patient's current age. Verified against
  // CDC PneumoRecs VaxAdvisor 2026-06-07.
  it('70yo PCV13 + PPSV23 given at ~60 (<65) → firm recommendation (due), NOT shared', () => {
    const r = run({ ageMonths: 840, riskIds: [],
      pcvDoses: [{ product: 'PCV13', date: '2014-01-01' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2016-06-06' }] }); // age ~60 at PPSV23
    expect(pcv(r).status).toBe('due');
    expect(pcv(r).minIntervalDays).toBe(1826);
  });

  it('70yo PCV13 + PPSV23 given at ~67 (≥65) → shared clinical decision', () => {
    const r = run({ ageMonths: 840, riskIds: [],
      pcvDoses: [{ product: 'PCV13', date: '2019-01-01' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2023-06-06' }] }); // age ~67 at PPSV23
    expect(pcv(r).status).toBe('shared-decision');
  });

  it('70yo PCV13 + UNDATED PPSV23 → proxy (current age ≥65) → shared decision', () => {
    const r = run({ ageMonths: 840, riskIds: [],
      pcvDoses: [{ product: 'PCV13', date: '2014-01-01' }],
      ppsv23Doses: [{ product: 'PPSV23' }] });
    expect(pcv(r).status).toBe('shared-decision');
  });

  it('55yo PCV15 only → PPSV23 ≥1y INCOMPLETE', () => {
    const r = run({ ageMonths: 660, riskIds: [], pcvDoses: [{ product: 'PCV15', date: '2024-01-01' }] });
    expect(ppsv(r).vaccine).toBe('PPSV23');
    expect(ppsv(r).note).toMatch(/INCOMPLETE/);
  });

  it('55yo PCV20 → complete', () => {
    const r = run({ ageMonths: 660, riskIds: [], pcvDoses: [{ product: 'PCV20', date: '2024-01-01' }] });
    expect(pcv(r).status).toBe('complete');
  });

  it('55yo PCV21 → complete', () => {
    const r = run({ ageMonths: 660, riskIds: [], pcvDoses: [{ product: 'PCV21', date: '2024-01-01' }] });
    expect(pcv(r).status).toBe('complete');
  });
});

// ════════════════════════════════════════════════════════════════════════
// §I — PCV21 eligibility + geographic note
// ════════════════════════════════════════════════════════════════════════
describe('§I PCV21 eligibility + geo note', () => {
  it('adult naive → PCV21 offered + geo note present', () => {
    const r = run({ ageMonths: 660, riskIds: [], pcvDoses: [] });
    expect(pcv(r).brands).toContain('PCV21 (Capvaxive)');
    expect(r.pcv21Geo).toBeTruthy();
    expect(r.pcv21Geo.note).toMatch(/serotype 4/);
  });

  it('child is never offered PCV21 (adults only)', () => {
    const r = run({ ageMonths: 96, riskIds: ['asplenia'], pcvDoses: [] });
    const allBrands = r.recs.flatMap((x) => x.brands);
    expect(allBrands.some((b) => b.includes('PCV21'))).toBe(false);
    expect(r.pcv21Geo).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════
// §K — PCV7-ignored, unknown history, multi-condition precedence
// ════════════════════════════════════════════════════════════════════════
describe('§K Cross-cutting rules', () => {
  it('PCV7 is not counted — adult PCV7-only treated as naive', () => {
    const r = run({ ageMonths: 660, riskIds: [], pcvDoses: [{ product: 'PCV7', date: '2005-01-01' }] });
    expect(pcv(r).status).toBe('due');
    expect(pcv(r).doseLabel).toMatch(/1 dose PCV/);
    // PCV7 dose is flagged as non-counting in perDose
    expect(r.perDose.pcv[0].status).toBe('noncounting');
    expect(r.meta.pcvCount).toBe(0);
  });

  it('PCV7 ignored for high-risk teen → treat as PCV-naive', () => {
    const r = run({ ageMonths: 200, riskIds: ['asplenia'], pcvDoses: [{ product: 'PCV7', date: '2010-01-01' }] });
    expect(pcv(r).status).toBe('risk-based');
    expect(r.meta.pcvCount).toBe(0);
  });

  it('unknown history (empty) → treated as unvaccinated', () => {
    const r = run({ ageMonths: 660, riskIds: [], pcvDoses: [], ppsv23Doses: [] });
    expect(pcv(r).status).toBe('due');
  });

  it('multi-condition: IC + non-IC → IC precedence (8-week interval)', () => {
    const r = run({ ageMonths: 360, riskIds: ['diabetes', 'hiv'], pcvDoses: [] });
    expect(pcv(r).note).toMatch(/8 weeks/);
  });

  it('multi-condition peds: IC + non-IC → IC row class', () => {
    const r = run({ ageMonths: 120, riskIds: ['diabetes', 'hiv'], pcvDoses: [{ product: 'PCV13' }] });
    const b = r.recs.find((x) => x.doseLabel.includes('Option B'));
    expect(b.note).toMatch(/5 years/); // IC has the 5y step
  });

  it('PCV21 recorded for a child is invalid (does not count)', () => {
    const r = run({ ageMonths: 120, riskIds: ['asplenia'], pcvDoses: [{ product: 'PCV21', date: '2024-01-01' }] });
    expect(r.perDose.pcv[0].status).toBe('invalid');
    expect(r.meta.pcvCount).toBe(0);
  });

  it('series containing PCV20 ⇒ no PPSV23 anywhere', () => {
    const r = run({ ageMonths: 660, riskIds: ['hiv'], pcvDoses: [{ product: 'PCV20', date: '2024-01-01' }] });
    expect(r.recs.some((x) => x.vaccine === 'PPSV23')).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════
// rec object shape
// ════════════════════════════════════════════════════════════════════════
describe('rec object shape', () => {
  it('every rec has the required fields and ≥1 citation when actionable', () => {
    const r = run({ ageMonths: 660, riskIds: [], pcvDoses: [] });
    const rc = first(r);
    expect(rc).toHaveProperty('vaccine');
    expect(rc).toHaveProperty('status');
    expect(rc).toHaveProperty('doseLabel');
    expect(rc).toHaveProperty('dueToday');
    expect(rc).toHaveProperty('brands');
    expect(rc).toHaveProperty('note');
    expect(rc.citations.length).toBeGreaterThan(0);
  });
});
