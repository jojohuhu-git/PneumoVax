// late-and-ambiguous-window.test.js
//
// Stress tests for (a) doses given late and (b) doses given in age windows the
// guidelines do not spell out clearly — specifically PCV13 given before age 6 (72
// months) for a now-older high-risk patient. Target behavior confirmed against CDC
// PneumoRecs VaxAdvisor (2026-07-09): "only received PCV before age 72 months" + PPSV23
// received → schedule complete (IC and non-IC), and PCV7 doses never count.
//
// Also covers Stream 1: doses entered out of order must be re-sorted chronologically.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';

const TODAY = '2026-07-09';
function run(input) { return recommend({ today: TODAY, ...input }); }
const pcv = (r) => r.recs.find((x) => x.vaccine === 'PCV') || null;

// ── The real patient case (DOB 2007-10-04, age 18y9m) ──────────────────────
// PCV7 ×5 (infant, ignored), 1× PCV13 at 2y10m (before age 6), 3× PPSV23, no PCV20.
// Sickle cell = immunocompromising. PneumoRecs → schedule complete.
const PATIENT = {
  ageMonths: 225,
  riskIds: ['asplenia'], // sickle cell / functional asplenia = IC
  pcvDoses: [
    { product: 'PCV7', date: '2008-04-21' },
    { product: 'PCV7', date: '2008-07-30' },
    { product: 'PCV7', date: '2009-02-11' },
    { product: 'PCV7', date: '2009-07-07' },
    { product: 'PCV7', date: '2009-09-25' },
    { product: 'PCV13', date: '2010-08-18' }, // age 2y10m — before 72 months
  ],
  ppsv23Doses: [
    { product: 'PPSV23', date: '2009-11-02' },
    { product: 'PPSV23', date: '2017-05-18' },
    { product: 'PPSV23', date: '2019-05-16' },
  ],
};

describe('Ambiguous window — PCV before age 6 (72mo) + PPSV23 = complete', () => {
  it('the patient case → PCV series complete (matches CDC PneumoRecs)', () => {
    const r = run(PATIENT);
    expect(pcv(r).status).toBe('complete');
    // PCV7 doses are ignored: only the single PCV13 counts.
    expect(r.meta.pcvCount).toBe(1);
    // No PCV20/PPSV23 "due" recommendation should be emitted.
    expect(r.recs.some((x) => /due|risk-based/.test(x.status))).toBe(false);
  });

  it('non-immunocompromising, same before-6 history + PPSV23 → also complete', () => {
    const r = run({ ...PATIENT, riskIds: ['chronic_heart'] });
    expect(pcv(r).status).toBe('complete');
  });

  it('CONTRAST: a PCV13 dose given at/after 72 months → NOT complete (PCV20 due)', () => {
    const r = run({
      ...PATIENT,
      // PCV13 given at ~7 years (after 72mo) instead of 2y10m.
      pcvDoses: [{ product: 'PCV13', date: '2014-11-02' }],
    });
    expect(pcv(r).status).not.toBe('complete');
    expect(r.recs.some((x) => x.brands.includes('PCV20 (Prevnar 20)'))).toBe(true);
  });

  it('CONTRAST: before-6 PCV but NO PPSV23 → NOT complete (completing dose recommended)', () => {
    const r = run({ ...PATIENT, ppsv23Doses: [] });
    expect(pcv(r).status).not.toBe('complete');
  });

  it('undated PCV cannot be confirmed before 72mo → falls through (not auto-complete)', () => {
    const r = run({
      ...PATIENT,
      pcvDoses: [{ product: 'PCV13' }], // undated
    });
    // Undated + IC + PPSV23 → keeps the standard PCV20 / 2nd-PPSV23 recommendation.
    expect(pcv(r).status).not.toBe('complete');
  });

  it('PCV7-only history → PCV7 ignored, treated as PCV-naïve (not complete)', () => {
    const r = run({
      ...PATIENT,
      pcvDoses: [{ product: 'PCV7', date: '2008-04-21' }, { product: 'PCV7', date: '2008-07-30' }],
    });
    expect(r.meta.pcvCount).toBe(0);
    expect(pcv(r).status).not.toBe('complete');
  });
});

describe('Stream 1 — out-of-order dose entry is re-sorted chronologically', () => {
  it('PCV history shuffled yields the same effective series as sorted', () => {
    const sorted = analyzeHistory('PCV', PATIENT.pcvDoses, 225, TODAY);
    const shuffled = analyzeHistory('PCV', [...PATIENT.pcvDoses].reverse(), 225, TODAY);
    expect(shuffled.effective).toEqual(sorted.effective);
  });

  it('PPSV23 entered newest-first still lands the recommendation the same way', () => {
    const inOrder = run(PATIENT);
    const reversed = run({ ...PATIENT, ppsv23Doses: [...PATIENT.ppsv23Doses].reverse() });
    expect(pcv(reversed).status).toBe(pcv(inOrder).status);
  });

  it('effective PCV list is chronological regardless of input order', () => {
    const { effective } = analyzeHistory('PCV', [...PATIENT.pcvDoses].reverse(), 225, TODAY);
    const dates = effective.map((d) => d.date).filter(Boolean);
    const ascending = [...dates].sort();
    expect(dates).toEqual(ascending);
  });
});

describe('Late doses (valid — minimum interval only)', () => {
  it('adult PCV13 given, PCV20 given many years later → complete, not restarted', () => {
    const r = run({
      ageMonths: 660, riskIds: ['diabetes'],
      pcvDoses: [
        { product: 'PCV13', date: '2012-01-01' },
        { product: 'PCV20', date: '2025-01-01' },
      ],
    });
    expect(pcv(r).status).toBe('complete');
  });

  it('PPSV23 second dose given far more than 5 years late is still valid', () => {
    const r = run({
      ageMonths: 300, riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV20', date: '2010-01-01' }],
      ppsv23Doses: [
        { product: 'PPSV23', date: '2005-01-01' },
        { product: 'PPSV23', date: '2024-01-01' },
      ],
    });
    // PCV20 present → complete; the late PPSV23 does not invalidate anything.
    expect(pcv(r).status).toBe('complete');
  });
});
