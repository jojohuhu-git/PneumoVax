// ─────────────────────────────────────────────────────────────────────────
// regression-2026-10-25-rulebook-evidence-limits.test.js
//
// The "Where the evidence runs out" block on the "How recommendations are
// made" page cannot say the app does something it does not do.
//
// WHY THIS EXISTS. The owner asked for the nuance to be on the page:
//
//   "there should be a section where nuance is applied. For example we
//    discussed there is no data discussing the minimum duration between a
//    PPSV23 to PPSV23, PCV to PCV or PPSV23 to PCV if the latter vaccine was
//    given earlier."
//
// That block is six typed sentences and a three-row table — the most
// dangerous shape in this repo, because a typed sentence about a rule is what
// let the post-transplant schedule disagree with its own documentation for 32
// days with the whole suite green. C14's own guard cannot see this one: it
// checks that every NUMBER on the page comes from a constant, and every claim
// here is about an OUTCOME, not a number.
//
// So each cell of that table is driven through the real validator on a named
// patient, and the patient is written out beside it. Change a rule and this
// fails, naming the cell that has stopped being true.
//
// ── ONE CORRECTION TO THE PREMISE, which is why the table has two columns ──
//
// For a CHILD the minimum intervals ARE published. CDC's catch-up schedule
// prints a column headed "Minimum Interval Between Doses" for the conjugate
// series, and that column is what voided the 15-month-old's third dose on
// 2026-10-23. The absence of evidence she described is an ADULT fact, and the
// page says so per age group rather than flatly. The last two assertions here
// are that split: every row the app enforces on its own authority is an adult
// row, and every child row is CDC's.
import { describe, it, expect } from 'vitest';
import { analyzeBoth } from '../../logic/validate.js';
import { DOSE_INTERVAL_RULES } from '../../logic/doseIntervalRules.js';
import { EVIDENCE } from '../rulebook.js';
import {
  PPSV23_REVACC_MIN_MONTHS,
  ADULT_ADVISED_PCV_GAP_MONTHS,
  intervalPhrase,
} from '../../logic/intervals.js';

const TODAY = '2026-10-25';

/** The verdict on the LAST dose of a stream, as the app records it. */
function lastDose(args, stream) {
  const r = analyzeBoth({ today: TODAY, riskIds: [], ...args });
  const s = r[stream];
  const i = s.doses.length - 1;
  return { ...s.perDose[i], date: s.doses[i].date };
}

const CHILD = { ageMonths: 120, dob: '2016-10-25', riskIds: ['asplenia'] };
const ADULT = { ageMonths: 729, dob: '1966-10-25', riskIds: [] };

describe('the evidence-limits block: a second PPSV23 after the first', () => {
  // A 10-year-old with asplenia: PPSV23 2024-01-01, second PPSV23 2025-01-01.
  it('a child\'s is voided, and on CDC\'s authority', () => {
    const v = lastDose({ ...CHILD, pcvDoses: [], ppsv23Doses: [{ date: '2024-01-01' }, { date: '2025-01-01' }] }, 'ppsv23');
    expect(v.status).toBe('invalid');
    expect(v.intervalRuleId).toBe('CHILD-PPSV23-AFTER-PPSV23');
    expect(DOSE_INTERVAL_RULES.find((r) => r.id === v.intervalRuleId).authority).toBe('CDC');
  });

  // A 60-year-old, no risk factors, same two dates.
  it('an adult\'s is voided too, but on this app\'s own authority', () => {
    const v = lastDose({ ...ADULT, pcvDoses: [], ppsv23Doses: [{ date: '2024-01-01' }, { date: '2025-01-01' }] }, 'ppsv23');
    expect(v.status).toBe('invalid');
    expect(v.intervalRuleId).toBe('ADULT-PPSV23-AFTER-PPSV23');
    expect(DOSE_INTERVAL_RULES.find((r) => r.id === v.intervalRuleId).authority).toBe('OWNER');
    // and the dose itself tells the clinician so, which is what lets the page
    // describe it as a prompt rather than a requirement
    expect(v.detail).toContain('owner clinical determination');
  });

  it('the page states the interval both rows actually enforce', () => {
    const row = EVIDENCE.pairs.find((p) => /second PPSV23/.test(p.pair));
    const words = intervalPhrase({ months: PPSV23_REVACC_MIN_MONTHS });
    expect(row.child).toContain(words);
    expect(row.adult).toContain(words);
  });
});

describe('the evidence-limits block: one conjugate after another', () => {
  // The same 10-year-old: PCV20 2026-01-01, PCV20 2026-01-08 — a week apart,
  // inside every cell of CDC's catch-up table.
  it('a child\'s does not count', () => {
    const v = lastDose({ ...CHILD, pcvDoses: [{ date: '2026-01-01', product: 'PCV20' }, { date: '2026-01-08', product: 'PCV20' }], ppsv23Doses: [] }, 'pcv');
    expect(v.status).toBe('invalid');
    expect(v.intervalRuleId).toBe('CHILD-PCV-AFTER-PCV');
  });

  // A 60-year-old: PCV13 2026-01-01, PCV20 2026-01-08. PCV13 first, because
  // two PCV20s would be flagged as an extra dose after a complete series
  // rather than on their spacing — a different sentence about a different
  // thing.
  it('an adult\'s counts, and carries a note', () => {
    const v = lastDose({ ...ADULT, pcvDoses: [{ date: '2026-01-01', product: 'PCV13' }, { date: '2026-01-08', product: 'PCV20' }], ppsv23Doses: [] }, 'pcv');
    expect(v.status).toBe('valid');
    expect(v.doesNotCount).toBeFalsy();
    expect(v.reasons.join(' ')).toMatch(/shorter than/i);
    expect(DOSE_INTERVAL_RULES.find((r) => r.id === v.intervalRuleId).enforcement).toBe('recommendation');
  });
});

describe('the evidence-limits block: a conjugate after a PPSV23', () => {
  // The 10-year-old again: PPSV23 2026-01-01, PCV20 2026-01-08.
  it('a child\'s is not judged at all — no rule, no note', () => {
    const v = lastDose({ ...CHILD, pcvDoses: [{ date: '2026-01-08', product: 'PCV20' }], ppsv23Doses: [{ date: '2026-01-01' }] }, 'pcv');
    expect(v.status).toBe('valid');
    expect(v.intervalRuleId ?? null).toBeNull();
    expect(v.reasons).toEqual([]);
  });

  // A 60-year-old whose only dose is a PPSV23: PPSV23 2026-01-01, PCV20
  // 2026-02-01.
  it('an adult\'s is voided when the PPSV23 is the only dose on the record', () => {
    const v = lastDose({ ...ADULT, pcvDoses: [{ date: '2026-02-01', product: 'PCV20' }], ppsv23Doses: [{ date: '2026-01-01' }] }, 'pcv');
    expect(v.status).toBe('invalid');
    expect(v.intervalRuleId).toBe('ADULT-PCV-AFTER-PPSV23');
    expect(DOSE_INTERVAL_RULES.find((r) => r.id === v.intervalRuleId).authority).toBe('OWNER');
  });

  // The same adult with a PCV13 on the record as well: PCV13 2015-01-01,
  // PPSV23 2026-01-01, PCV20 2026-02-01. Ruling F (2026-10-24) made this one a
  // note rather than a bar, which is why the page's cell says both things.
  it('an adult\'s counts, with a note, when a PCV13 is on the record too', () => {
    const v = lastDose({
      ...ADULT,
      pcvDoses: [{ date: '2015-01-01', product: 'PCV13' }, { date: '2026-02-01', product: 'PCV20' }],
      ppsv23Doses: [{ date: '2026-01-01' }],
    }, 'pcv');
    expect(v.status).toBe('valid');
    expect(v.doesNotCount).toBeFalsy();
    expect(DOSE_INTERVAL_RULES.find((r) => r.id === v.intervalRuleId).enforcement).toBe('recommendation');
  });

  it('the page states the interval the adult row enforces', () => {
    const row = EVIDENCE.pairs.find((p) => /conjugate after a PPSV23/.test(p.pair));
    expect(row.adult).toContain(intervalPhrase({ months: ADULT_ADVISED_PCV_GAP_MONTHS }));
  });
});

describe('the evidence-limits block names the right three pairs, and splits by age for the right reason', () => {
  it('every row says which patient each half is about, so a phone can hide the column headers', () => {
    for (const row of EVIDENCE.pairs) {
      expect(row.childLabel, row.pair).toBeTruthy();
      expect(row.adultLabel, row.pair).toBeTruthy();
    }
  });

  it('the three pairs are the three the owner named, and no others', () => {
    expect(EVIDENCE.pairs).toHaveLength(3);
    const text = EVIDENCE.pairs.map((p) => p.pair).join(' | ');
    expect(text).toMatch(/second PPSV23/);
    expect(text).toMatch(/conjugate after another/);
    expect(text).toMatch(/conjugate after a PPSV23/);
  });

  it('every rule the app enforces on its OWN authority is an adult rule', () => {
    const owner = DOSE_INTERVAL_RULES.filter((r) => r.authority === 'OWNER');
    expect(owner.length).toBeGreaterThan(0);
    for (const r of owner) expect(r.rulebook, r.id).toBe('adult');
  });

  it('every child rule is CDC\'s, which is why the page does not call the child column a judgement', () => {
    const child = DOSE_INTERVAL_RULES.filter((r) => r.rulebook === 'child');
    expect(child.length).toBeGreaterThan(0);
    for (const r of child) expect(r.authority, r.id).toBe('CDC');
  });
});
