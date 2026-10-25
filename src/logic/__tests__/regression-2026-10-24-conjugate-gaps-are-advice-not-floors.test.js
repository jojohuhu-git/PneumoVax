// ─────────────────────────────────────────────────────────────────────────
// §K-CONJUGATE — OWNER DECISION 2026-10-24. One adult conjugate given sooner
// than a year after another is ADVICE, not a validity floor.
//
// The two rows downgraded: `ADULT-PCV20-21-AFTER-PCV13` (a PCV20/PCV21 inside
// the year after a PCV13, nothing else on the record) and
// `ADULT-PCV20-21-1Y-AFTER-PCV` (the same gap when PCV13 and PPSV23 are both
// already on the record). Both were owner clinical determinations of
// 2026-10-11, not minimums any source states.
//
// ── WHY THIS GUARD HOLDS NAMED PATIENTS AND NOT A COUNT ──────────────────
//
// Measured over both corpora with `scripts/proseDiff.mjs`: **0 of 35,280
// rendered lines move**. Neither grid can build a patient either row touches,
// because its fixed day-offsets never produce an adult second conjugate
// inside the year. The three patients below were typed by hand and run
// through the real engine before the owner chose. "0 in the grid" is not "0
// in a clinic" — the sweeps simply cannot see this change, so this file is
// the only thing standing under it.
//
// ── THE THREE PATIENTS SHE WAS SHOWN ─────────────────────────────────────
//
//   A  68 y, chronic heart disease.  PCV13 2026-02-10, PCV20 2026-09-10.
//      Before: PCV20 thrown out, return 2027-09-10.  After: counts, complete.
//   B  70 y, no risk conditions.     PPSV23 2018-06-01, PCV13 2026-01-15,
//      PCV20 2026-08-15.
//      Before: PCV20 thrown out, return 2027-08-15.  After: counts, complete.
//   C  70 y, no risk conditions.     PPSV23 2024-06-01, PCV13 2026-01-15,
//      PCV20 2026-08-15 — inside BOTH the 1-year conjugate gap and the
//      5-year gap after her PPSV23.
//
// Patient C is the second half of the ruling. Shown that her card would name
// only the first gap, the owner chose *"mention both gaps"*, so
// `evaluateDoseInterval` now collects unmet recommendations and keeps
// walking instead of returning at the first.
//
// ── THE TWO THINGS MOST LIKELY TO BE "TIDIED" WRONGLY ────────────────────
//
//  1. THE TWO ROWS DO NOT SHARE AN AUTHORITY, and a future reader will want
//     to make them match. `ADULT-PCV20-21-AFTER-PCV13`'s year is CDC's own
//     sentence, so it is CDC. `ADULT-PCV20-21-1Y-AFTER-PCV` has no such
//     sentence in any source — its year is this app's own convention, it
//     keeps OWNER, and its message says so to the clinician in words.
//  2. AN UNMET FLOOR STILL ENDS THE WALK AND DISCARDS collected advice.
//     Every recommendation sentence ends by saying the dose counts, which
//     would contradict a rejection printed beside it.
//
// Her wording instruction, verbatim: *"make the wording more clinical and
// nuanced since this is clinically likely ok but data free. Also bold it."*
// The bold is asserted here as the `**…**` the engine emits; that it reaches
// the screen as <strong class="note-emphasis"> is asserted on the rendered
// DOM in `regression-s3-n1-early-advisory-chip.test.jsx`.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { DOSE_INTERVAL_RULES, evaluateDoseInterval } from '../doseIntervalRules.js';

const TODAY = '2026-10-24';
const Y = (y) => y * 12;

const PATIENT_A = {
  ageMonths: Y(68),
  riskIds: ['chronic_heart'],
  pcvDoses: [
    { product: 'PCV13', date: '2026-02-10' },
    { product: 'PCV20', date: '2026-09-10' },
  ],
  ppsv23Doses: [],
};

const PATIENT_B = {
  ageMonths: Y(70),
  riskIds: [],
  pcvDoses: [
    { product: 'PCV13', date: '2026-01-15' },
    { product: 'PCV20', date: '2026-08-15' },
  ],
  ppsv23Doses: [{ product: 'PPSV23', date: '2018-06-01' }],
};

// Patient C differs from B in ONE field: her PPSV23 is 2024, not 2018.
const PATIENT_C = { ...PATIENT_B, ppsv23Doses: [{ product: 'PPSV23', date: '2024-06-01' }] };

const run = (p) => recommend({ today: TODAY, ...p });
const lastPcv = (p) => run(p).perDose.pcv.at(-1);

describe('§K-CONJUGATE — patient A: PCV13 then PCV20 seven months later', () => {
  it('counts the PCV20 — it is no longer thrown out', () => {
    const d = lastPcv(PATIENT_A);
    expect(d.status).toBe('valid');
    expect(d.doesNotCount).toBeFalsy();
    expect(d.effectiveDoseNum).toBe(2);
    expect(d.earlyAdvisory).toBe(true);
    expect(d.intervalRuleId).toBe('ADULT-PCV20-21-AFTER-PCV13');
  });

  it('reads Complete, and asks her for nothing', () => {
    const out = run(PATIENT_A);
    expect(out.recs.every((r) => r.status === 'complete')).toBe(true);
    expect(out.recs.map((r) => r.doseLabel).join(' ')).toMatch(/Complete \(history includes PCV20\)/);
  });

  it('names no repeat date — that would contradict "the dose is counted"', () => {
    const d = lastPcv(PATIENT_A);
    expect(d.earliestValidDate).toBeUndefined();
    expect(d.repeatDueDate).toBeUndefined();
    // The date she was being sent back for, before the decision.
    expect(d.reasons.join(' ')).not.toContain('2027-09-10');
    expect(d.reasons.join(' ')).not.toMatch(/at the earliest/);
  });

  it('explains CDC\'s year, and emphasises the clinical caveat', () => {
    const text = lastPcv(PATIENT_A).reasons.join(' ');
    expect(text).toContain('CDC advises PCV20 or PCV21 at least 1 year after the last PCV13 dose');
    expect(text).toContain('does not say an earlier dose is invalid or must be repeated');
    // Her three requirements: clinical, data-free, bold.
    expect(text).toContain('no data establish that it performs as well');
    expect(text).toContain('clinical judgement');
    expect(text).toMatch(/\*\*[^*]*no data establish that it performs as well[^*]*\*\*/);
  });
});

describe('§K-CONJUGATE — patient B: a conjugate after a conjugate, PPSV23 long past', () => {
  it('counts the PCV20 and reads Complete', () => {
    const d = lastPcv(PATIENT_B);
    expect(d.status).toBe('valid');
    expect(d.earlyAdvisory).toBe(true);
    expect(d.intervalRuleId).toBe('ADULT-PCV20-21-1Y-AFTER-PCV');
    expect(run(PATIENT_B).recs.every((r) => r.status === 'complete')).toBe(true);
  });

  it('tells the clinician, in words, that NO source states this interval', () => {
    // The honesty requirement that keeps this row's authority at OWNER. If
    // the sentence ever starts attributing the year to CDC or ACIP, the row
    // is asserting something no document says.
    const text = lastPcv(PATIENT_B).reasons.join(' ');
    expect(text).toContain('No ACIP or CDC source states an interval between two adult conjugate doses');
    expect(text).toContain('this app’s own convention');
    expect(text).toMatch(/\*\*/);
    expect(text).not.toMatch(/CDC advises at least 1 year between conjugate doses/);
  });

  it('says ONE thing — her 5-year PPSV23 gap is met, so nothing speaks for it', () => {
    expect(lastPcv(PATIENT_B).reasons).toHaveLength(1);
  });
});

describe('§K-CONJUGATE — patient C: inside two advised gaps, told about both', () => {
  it('counts the PCV20', () => {
    const d = lastPcv(PATIENT_C);
    expect(d.status).toBe('valid');
    expect(d.earlyAdvisory).toBe(true);
    // The FIRST unmet row still names the verdict, which is why nothing that
    // records a single rule id had to change.
    expect(d.intervalRuleId).toBe('ADULT-PCV20-21-1Y-AFTER-PCV');
  });

  it('prints BOTH sentences — the owner\'s "mention both gaps"', () => {
    const r = lastPcv(PATIENT_C).reasons;
    expect(r).toHaveLength(2);
    expect(r[0]).toContain('previous pneumococcal conjugate dose of 2026-01-15');
    expect(r[1]).toContain('PPSV23 dose of 2024-06-01');
    expect(r[1]).toContain('at least 5 years');
  });

  it('is the ONLY thing separating her from patient B', () => {
    // Guards against a fix that makes every patient print two sentences:
    // B and C differ in one field, and only C gets the second one.
    expect(PATIENT_C.pcvDoses).toEqual(PATIENT_B.pcvDoses);
    expect(lastPcv(PATIENT_B).reasons).toHaveLength(1);
    expect(lastPcv(PATIENT_C).reasons).toHaveLength(2);
  });
});

describe('§K-CONJUGATE — the rows themselves', () => {
  const rowA = DOSE_INTERVAL_RULES.find((r) => r.id === 'ADULT-PCV20-21-AFTER-PCV13');
  const rowB = DOSE_INTERVAL_RULES.find((r) => r.id === 'ADULT-PCV20-21-1Y-AFTER-PCV');

  it('are recommendations, and take no grace', () => {
    for (const row of [rowA, rowB]) {
      expect(row.enforcement).toBe('recommendation');
      // A recommendation counts every dose already, so a grace could only
      // move the day the note starts printing — a second, invisible reading
      // of the same interval.
      expect(row.grace).toBe(false);
    }
  });

  it('do NOT share an authority, and the asymmetry is the point', () => {
    // CDC states rowA's year in its own sentence; no source states rowB's.
    expect(rowA.authority).toBe('CDC');
    expect(rowB.authority).toBe('OWNER');
  });

  it('each record the decision and the patient that produced it', () => {
    expect(rowA.source).toMatch(/2026-10-24/);
    expect(rowA.source).toMatch(/2026-09-10/);      // patient A's PCV20
    expect(rowB.source).toMatch(/2026-10-24/);
    expect(rowB.source).toMatch(/2026-08-15/);      // patient B's PCV20
    expect(rowB.source).toMatch(/exists in no document/);
  });
});

describe('§K-CONJUGATE — the walk: what collecting must NOT break', () => {
  it('an unmet FLOOR still returns at once and discards collected advice', () => {
    // A PPSV23 three weeks after a PCV15 for an adult outside the 8-week
    // class: ADULT-PPSV23-AFTER-PCV15, still a floor. It must come back as a
    // rejection with no "the dose is counted" sentence attached.
    const v = evaluateDoseInterval({
      vaccine: 'PPSV23', product: 'PPSV23', doseDate: '2026-01-22', ageAtDose: Y(70),
      prev: null,
      priorPcv: [{ date: '2026-01-01', product: 'PCV15' }],
      priorPpsv23: [], riskIds: [],
    });
    expect(v.kind).toBe('floor');
    expect(v.ruleId).toBe('ADULT-PPSV23-AFTER-PCV15');
    expect(v.reasons.join(' ')).not.toMatch(/the dose is counted|still counts/i);
  });

  it('a dose that meets every gap still says nothing at all', () => {
    const quiet = recommend({
      today: TODAY, ageMonths: Y(70), riskIds: [],
      pcvDoses: [
        { product: 'PCV13', date: '2024-01-15' },
        { product: 'PCV20', date: '2026-01-15' },
      ],
      ppsv23Doses: [{ product: 'PPSV23', date: '2015-06-01' }],
    }).perDose.pcv.at(-1);
    expect(quiet.status).toBe('valid');
    expect(quiet.earlyAdvisory).toBeFalsy();
    expect(quiet.reasons ?? []).toHaveLength(0);
  });

  it('the risk-blind catch-all still may not talk over a row that spoke', () => {
    // THE A-P1-1 MISTAKE, one rule along. An unmet enumerated row now lets
    // the walk continue, so the catch-all gets a chance it never had before:
    // it must still stay quiet, or patient A would read CDC's specific
    // PCV13 sentence AND a generic "at least 1 year" beneath it.
    const r = lastPcv(PATIENT_A).reasons;
    expect(r).toHaveLength(1);
    expect(r.join(' ')).not.toMatch(/ADULT-PCV-AFTER-PCV-CATCH-ALL/);
    expect(r.join(' ')).not.toMatch(/between pneumococcal conjugate doses/);
  });
});
