// S14-7 (2026-10-11) — the five age gates are gone; there is one rule table.
//
// THE BUG (root cause S14-RC). `validate.js` decided whether a timing rule may
// void a dose from the patient's AGE, not from what the rule says:
//
//   checkPcvInterval        if (ageAtDose >= ADULT_SCHED_MIN_M) return null
//   checkPpsvAfterPcv       same — exempted adults
//   checkPpsvRevaccInterval same — exempted adults
//   adultPcvGapAdvice       if (ageAtDose <  ADULT_SCHED_MIN_M) return null
//   adultPpsvGapAdvice      same — exempted children
//
// Below 19 every gap could void a dose; at 19+ none could. Three adult gaps
// fell in the hole BETWEEN the two halves, so nothing checked them at all. The
// worst was a 70-year-old's second PPSV23 two years after the first: `valid`,
// numbered, `reasons: []`. Silent. All three were reproduced live against the
// engine before this file was written.
//
// Now `rulebook` (which schedule states the rule) and `enforcement` (may it
// void a dose) are two separate FIELDS on every row of
// logic/doseIntervalRules.js, and nothing anywhere asks the patient's age in
// order to decide whether a rule is allowed to bite.
//
// ⚠️ EVERY adult floor here is an OWNER CLINICAL DETERMINATION dated
// 2026-10-11, not ACIP and not CDC — see doseIntervalRules.js's header and
// CLINICAL_SPEC.md §K. The assertions below check that the app SAYS so, and
// that no adult floor can arrive later carrying a CDC citation.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import {
  DOSE_INTERVAL_RULES, RULE_IDS, evaluateDoseInterval,
} from '../doseIntervalRules.js';
import { PPSV23_REVACC_MIN_MONTHS } from '../intervals.js';
import { addCalendarMonths, addDays } from '../dateUtils.js';

const TODAY = '2026-10-11';
const ADULT = { ageMonths: 840, dob: '1956-10-11' };   // 70y
const CHILD = { ageMonths: 60, dob: '2021-10-11' };    //  5y

function ppsvAfter(pcvDoses, ppsvDates, who, riskIds = []) {
  return analyzeHistory('PPSV23', ppsvDates.map((date) => ({ date })),
    who.ageMonths, TODAY, who.dob, { pcvDoses, riskIds });
}

// ─────────────────────────────────────────────────────────────────────────
// The three symptoms the root-cause review reproduced. Each one is asserted
// for BOTH ages, because "the child and the adult now get the same kind of
// answer" is the property that was broken.
// ─────────────────────────────────────────────────────────────────────────
describe('S14-7 symptom 1 — PCV15 and PPSV23 on the same day', () => {
  const pcv = [{ date: '2026-01-10', product: 'PCV15' }];

  it('a child\'s dose does not count, and the reason names the same-visit rule', () => {
    const a = ppsvAfter(pcv, ['2026-01-10'], CHILD, ['hiv']);
    expect(a.perDose[0].status).toBe('invalid');
    expect(a.perDose[0].reasons.join(' ')).toMatch(/same visit/i);
  });

  it('an adult\'s dose does not count either — it used to be valid with a soft note', () => {
    for (const riskIds of [['hiv'], ['diabetes'], []]) {
      const a = ppsvAfter(pcv, ['2026-01-10'], ADULT, riskIds);
      expect(a.perDose[0].status).toBe('invalid');
      expect(a.effective).toHaveLength(0);
      expect(a.perDose[0].reasons.join(' ')).not.toMatch(/still counts/);
    }
  });
});

describe('S14-7 symptom 2 — PCV15 then PPSV23 two weeks later', () => {
  const pcv = [{ date: '2026-01-10', product: 'PCV15' }];

  it('does not count for a child', () => {
    expect(ppsvAfter(pcv, ['2026-01-24'], CHILD, ['hiv']).perDose[0].status).toBe('invalid');
  });

  it('does not count for an adult, whatever their risk class', () => {
    for (const riskIds of [['hiv'], ['cochlear_implant'], ['diabetes'], []]) {
      expect(ppsvAfter(pcv, ['2026-01-24'], ADULT, riskIds).perDose[0].status).toBe('invalid');
    }
  });

  it('but the adult floor is risk-keyed: 10 weeks counts for an immunocompromised adult only', () => {
    const tenWeeks = ['2026-03-21'];
    expect(ppsvAfter(pcv, tenWeeks, ADULT, ['hiv']).perDose[0].status).toBe('valid');
    expect(ppsvAfter(pcv, tenWeeks, ADULT, ['csf_leak']).perDose[0].status).toBe('valid');
    expect(ppsvAfter(pcv, tenWeeks, ADULT, ['diabetes']).perDose[0].status).toBe('invalid');
    expect(ppsvAfter(pcv, tenWeeks, ADULT, []).perDose[0].status).toBe('invalid');
  });
});

describe('S14-7 symptom 3 — the silent one: a second PPSV23 two years after the first', () => {
  const twoYears = ['2022-01-10', '2024-01-10'];

  it('a child\'s second dose does not count (CDC child notes state the 5 years)', () => {
    const a = ppsvAfter([], twoYears, { ageMonths: 156, dob: '2013-10-11' });
    expect(a.perDose[1].status).toBe('invalid');
  });

  it('an ADULT\'s second dose no longer passes in silence', () => {
    const a = ppsvAfter([], twoYears, ADULT);
    // Before S14-7 this read: status 'valid', effectiveDoseNum 2, reasons [].
    expect(a.perDose[1].status).toBe('invalid');
    expect(a.perDose[1].effectiveDoseNum).toBeNull();
    expect(a.perDose[1].reasons.length).toBeGreaterThan(0);
    expect(a.perDose[1].reasons.join(' ')).toMatch(/at least 5 years after the first/);
    expect(a.effective).toHaveLength(1);
  });

  it('and the adult version is labelled as the owner\'s rule, the child version is not', () => {
    expect(ppsvAfter([], twoYears, ADULT).perDose[1].detail)
      .toMatch(/owner clinical determination/i);
    expect(ppsvAfter([], twoYears, { ageMonths: 156, dob: '2013-10-11' }).perDose[1].detail ?? '')
      .not.toMatch(/owner clinical determination/i);
  });

  it('5 years and 1 day apart counts, at either age', () => {
    const far = ['2019-01-10', '2024-01-11'];
    expect(ppsvAfter([], far, ADULT).perDose[1].status).toBe('valid');
    expect(ppsvAfter([], far, { ageMonths: 200, dob: '2010-01-01' }).perDose[1].status).toBe('valid');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// The two other gaps that were checked by nothing at all. Both were verified
// silent against the live engine before this file existed.
// ─────────────────────────────────────────────────────────────────────────
describe('S14-7 — the adult gaps that nothing used to check', () => {
  // ⚠️ REVERSED BY OWNER RULING F (2026-10-24), and kept as the record of the
  // reversal rather than deleted. This dose used to be INVALID on an owner
  // determination of 2026-10-11; the owner withdrew that determination for
  // this row, on the ground that ACIP states the 5 years as recommended
  // timing and never says an earlier dose must be repeated. So the gap is
  // still CHECKED — which is what S14-7 was about, and the original silence
  // it fixed is still fixed — but it is now a note on a dose that counts.
  it('a PCV20 less than 5 years after PPSV23, when PCV13 is also on the record', () => {
    // 55y: PCV13 2015, PPSV23 2018, PCV20 2021 — three years, not five.
    const who = { ageMonths: 55 * 12, dob: '1971-05-01' };
    const a = analyzeHistory('PCV', [
      { date: '2015-03-01', product: 'PCV13' },
      { date: '2021-03-01', product: 'PCV20' },
    ], who.ageMonths, TODAY, who.dob, { ppsv23Doses: [{ date: '2018-03-01' }] });
    expect(a.perDose[1].status).toBe('valid');
    expect(a.perDose[1].earlyAdvisory).toBe(true);
    expect(a.perDose[1].intervalRuleId).toBe('ADULT-PCV20-21-5Y-AFTER-PPSV23');
    expect(a.perDose[1].reasons.join(' ')).toMatch(/at least 5 years/);
    // The note must say the dose counts, and must NOT claim the owner
    // enforces the gap — she no longer does, and the row now credits CDC.
    expect(a.perDose[1].reasons.join(' ')).toMatch(/still counts/);
    expect(a.perDose[1].detail ?? '').not.toMatch(/owner clinical determination/i);
  });

  it('...and counts once the five years are there', () => {
    const who = { ageMonths: 55 * 12, dob: '1971-05-01' };
    const a = analyzeHistory('PCV', [
      { date: '2015-03-01', product: 'PCV13' },
      { date: '2024-03-01', product: 'PCV20' },
    ], who.ageMonths, TODAY, who.dob, { ppsv23Doses: [{ date: '2018-03-01' }] });
    expect(a.perDose[1].status).toBe('valid');
    expect(a.perDose[1].earlyAdvisory).toBeFalsy();
  });

  it('a PCV20 two months after a PPSV23, with no PCV history', () => {
    const who = { ageMonths: 60 * 12, dob: '1966-05-01' };
    const a = analyzeHistory('PCV', [{ date: '2026-03-01', product: 'PCV20' }],
      who.ageMonths, TODAY, who.dob, { ppsv23Doses: [{ date: '2026-01-01' }] });
    expect(a.perDose[0].status).toBe('invalid');
    expect(a.perDose[0].reasons.join(' ')).toMatch(/at least 1 year after PPSV23/);
  });

  it('a PPSV23 at 66 given three years after one at 63', () => {
    const who = { ageMonths: 68 * 12, dob: '1958-05-01' };
    const a = ppsvAfter([], ['2021-06-01', '2024-06-01'], who);
    expect(a.perDose[1].status).toBe('invalid');
    expect(a.perDose[1].reasons.join(' ')).toMatch(/at least 5 years/);
  });

  it('the engine sees the dropped dose, so the patient is owed it again', () => {
    const out = recommend({
      ageMonths: 60 * 12, dob: '1966-05-01', today: TODAY, riskIds: [],
      pcvDoses: [{ date: '2026-03-01', product: 'PCV20' }],
      ppsv23Doses: [{ date: '2026-01-01' }],
    });
    expect(out.meta.pcvCount).toBe(0);
    expect(out.perDose.pcv[0].status).toBe('invalid');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// The rows CDC states no interval for. These exist as explicit
// `enforcement: 'none'` rows so a reader can tell a decision from an
// oversight — and so the catch-all note cannot quietly reach them.
// ─────────────────────────────────────────────────────────────────────────
describe('S14-7 — deliberately never flagged', () => {
  it('PCV20 right after an adult PCV15: the PPSV23-not-available substitute path', () => {
    const a = analyzeHistory('PCV', [
      { date: '2026-01-05', product: 'PCV15' },
      { date: '2026-02-09', product: 'PCV20' },
    ], ADULT.ageMonths, TODAY, ADULT.dob);
    expect(a.perDose[1].status).toBe('valid');
    expect(a.perDose[1].earlyAdvisory).toBeFalsy();
    expect(a.perDose[1].reasons).toEqual([]);
  });

  it('the never-flagged row is in the table, with its reason written down', () => {
    const row = DOSE_INTERVAL_RULES.find((r) => r.id === 'ADULT-PCV20-21-AFTER-PCV15-NO-INTERVAL');
    expect(row).toBeDefined();
    expect(row.enforcement).toBe('none');
    expect(row.source).toMatch(/state NO interval/i);
  });

  it('an undated dose gets no timing verdict, at either age', () => {
    for (const who of [ADULT, CHILD]) {
      const a = analyzeHistory('PCV', [
        { date: '2024-01-05', product: 'PCV13' },
        { product: 'PCV20' },
      ], who.ageMonths, TODAY, who.dob);
      expect(a.perDose[1].earlyAdvisory).toBeFalsy();
    }
  });

  it('a dose given BEFORE the anchor is never measured against it', () => {
    const a = ppsvAfter([{ date: '2026-05-01', product: 'PCV15' }], ['2026-01-05'], ADULT);
    expect(a.perDose[0].status).toBe('valid');
    expect(a.perDose[0].earlyAdvisory).toBeFalsy();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// The table's own invariants. These are the guards that would catch the five
// age gates growing back, or an owner-determined row quietly acquiring a CDC
// citation. Each one was confirmed to FAIL when the fault it describes was
// introduced on purpose (testing.md's rule for "nothing is wrong" guards).
// ─────────────────────────────────────────────────────────────────────────
describe('S14-7 — the table cannot drift back', () => {
  it('every row carries all seven fields', () => {
    for (const r of DOSE_INTERVAL_RULES) {
      expect(typeof r.id, r.id).toBe('string');
      expect(typeof r.what, r.id).toBe('string');
      expect(['child', 'adult', 'any'], r.id).toContain(r.rulebook);
      expect(['PCV', 'PPSV23'], r.id).toContain(r.vaccine);
      expect(['floor', 'recommendation', 'none'], r.id).toContain(r.enforcement);
      expect(['CDC', 'OWNER'], r.id).toContain(r.authority);
      expect(r.source.length, r.id).toBeGreaterThan(40);
    }
  });

  it('rule ids are unique', () => {
    expect(new Set(RULE_IDS).size).toBe(RULE_IDS.length);
  });

  // CDC's grace governs whether a dose that missed a MINIMUM still counts. A
  // recommendation voids nothing, so there is no grace to apply and a day
  // short of the year is a day short.
  it('floors get the 4-day grace; recommendations never do', () => {
    for (const r of DOSE_INTERVAL_RULES) {
      if (r.enforcement === 'floor') expect(r.grace, r.id).toBe(true);
      if (r.enforcement === 'recommendation') expect(r.grace, r.id).toBe(false);
    }
  });

  // THE CORE INVARIANT. The 5-year PPSV23-to-PPSV23 interval has no age term
  // in any source: the child and adult rows must read the SAME constant. The
  // old age gate on it is the entire reason a 70-year-old's second PPSV23 two
  // years after the first came out valid and silent. If these two numbers ever
  // diverge, someone has re-introduced an age-keyed interval.
  it('the child and adult PPSV23 revaccination rows read one constant', () => {
    const child = DOSE_INTERVAL_RULES.find((r) => r.id === 'CHILD-PPSV23-AFTER-PPSV23');
    const adult = DOSE_INTERVAL_RULES.find((r) => r.id === 'ADULT-PPSV23-AFTER-PPSV23');
    expect(child.interval.months).toBe(PPSV23_REVACC_MIN_MONTHS);
    expect(adult.interval.months).toBe(PPSV23_REVACC_MIN_MONTHS);
    expect(adult.interval.months).toBe(child.interval.months);
  });

  // Honesty, enforced. Every OWNER row must say so in its own source text and
  // must never claim ACIP or CDC recommends the floor.
  it('every owner-determined row names the determination and never cites ACIP for it', () => {
    const owner = DOSE_INTERVAL_RULES.filter((r) => r.authority === 'OWNER');
    expect(owner.length).toBeGreaterThan(0);
    for (const r of owner) {
      expect(r.source, r.id).toMatch(/OWNER CLINICAL DETERMINATION 2026-10-11/);
      expect(r.source, r.id).toMatch(/not ACIP, not CDC/);
    }
  });

  it('every CDC-authority row avoids the owner-determination label', () => {
    for (const r of DOSE_INTERVAL_RULES.filter((x) => x.authority === 'CDC')) {
      expect(r.source, r.id).not.toMatch(/OWNER CLINICAL DETERMINATION/);
    }
  });

  // S14-7b's headline invariant, as a lock. Every adult FLOOR in this app is
  // the owner's determination — the sources state adult gaps as advice for the
  // next dose, so an adult floor citing CDC would credit CDC with something it
  // did not say. CLAUDE.md states this in capitals; nothing enforced it until
  // now, so a new adult row could have arrived carrying 'CDC' and the suite
  // would have stayed green.
  it('no adult floor may cite CDC — every one of them is the owner\'s', () => {
    const adultFloors = DOSE_INTERVAL_RULES.filter(
      (r) => r.rulebook === 'adult' && r.enforcement === 'floor',
    );
    expect(adultFloors.length).toBeGreaterThan(0);
    for (const r of adultFloors) expect(r.authority, r.id).toBe('OWNER');
  });

  // The same claim in prose. doseIntervalRules.js's header is the first thing
  // CLAUDE.md sends a session to read before touching an interval rule, so a
  // stale sentence there is how the mislabelling S14-7b removed grows back.
  it('the header does not attribute any adult floor to CDC', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/logic/doseIntervalRules.js'), 'utf8');
    const header = src.slice(0, src.indexOf('authority: \'OWNER\''));
    const cdcPara = header.slice(header.indexOf('`authority: \'CDC\'`'));
    // The exact stale sentence S14-7b removed. It counted one adult row into
    // the CDC bucket; that row is the owner's.
    expect(cdcPara).not.toMatch(/plus one adult row/i);
    // And the correction has to be stated, not merely implied — if a later
    // rewrite drops it, this fails rather than going quiet.
    expect(cdcPara).toMatch(/paediatric/i);
    expect(cdcPara).toMatch(/no adult floor is cdc/i);
  });

  // The five gates, by name. If any of them comes back, this fails.
  it('validate.js no longer contains the five age-gated interval functions', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/logic/validate.js'), 'utf8');
    for (const fn of ['checkPcvInterval', 'checkPpsvAfterPcv', 'checkPpsvRevaccInterval',
      'adultPcvGapAdvice', 'adultPpsvGapAdvice']) {
      expect(src, fn).not.toMatch(new RegExp(`function\\s+${fn}\\s*\\(`));
    }
  });

  // Every minimum INTERVAL belongs to the table. validate.js still owns the
  // minimum-AGE checks (a different rule family, keyed on the product), so
  // this guard names the interval constants specifically rather than banning
  // the whole module.
  it('validate.js imports no interval minimums — they all live in the table', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/logic/validate.js'), 'utf8');
    const importBlock = src.slice(0, src.indexOf('// PCV21 product gate'));
    for (const name of ['PCV_PPSV23_MIN_INTERVAL_DAYS', 'PPSV23_REVACC_MIN_MONTHS',
      'ADULT_ADVISED_PCV_GAP_MONTHS', 'ADULT_PPSV23_INTERVAL_MONTHS',
      'pcvSeriesMinIntervalDays', 'intervalMeetsMinimum', 'calendarIntervalMeetsMinimum']) {
      expect(importBlock, name).not.toMatch(new RegExp(`\\b${name}\\b`));
    }
  });

  // The evaluator itself must not grow an age test. `rulebook` is matched
  // against the age at the dose in ONE named helper; anywhere else is the old
  // bug coming back.
  it('the evaluator compares against the adult boundary exactly once', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/logic/doseIntervalRules.js'), 'utf8');
    const code = src.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*')).join('\n');
    const hits = code.match(/ADULT_SCHED_MIN_M/g) ?? [];
    // One import, one comparison inside rulebookOf(). Nothing else.
    expect(hits).toHaveLength(2);
    expect(code).toMatch(/function rulebookOf\(ageAtDose\) \{[\s\S]*?ADULT_SCHED_MIN_M/);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// S10-N1, folded into S14-7. Its stated symptom — "a 20-year-old with PCV21
// recorded at 17 has that dose counted" — did NOT reproduce: the generic
// minimum-age check already uses the age at the dose and rejects it. What was
// genuinely wrong was only the SENTENCE, which quoted the patient's age today.
// ─────────────────────────────────────────────────────────────────────────
describe('S10-N1 — the PCV21 age message names the age at the dose', () => {
  it('a 20-year-old\'s PCV21 recorded at 17 was never counted (the original claim did not reproduce)', () => {
    const a = analyzeHistory('PCV', [{ product: 'PCV21', date: '2023-10-11' }],
      240, TODAY, '2006-10-11');
    expect(a.perDose[0].status).toBe('invalid');
    expect(a.effective).toHaveLength(0);
  });

  it('a 10-year-old\'s PCV21 dated at 9 says "given at ~9 years", not "currently ~10"', () => {
    // Dose date exactly on the 9th birthday, so the age reads as whole years.
    const a = analyzeHistory('PCV', [{ product: 'PCV21', date: '2025-05-01' }],
      10 * 12, TODAY, '2016-05-01');
    expect(a.perDose[0].reasons.join(' ')).toMatch(/given at ~9 years/i);
    expect(a.perDose[0].reasons.join(' ')).not.toMatch(/currently/i);
    expect(a.perDose[0].detail).toMatch(/Age at administration: ~9 years/);
  });

  it('an UNDATED PCV21 still falls back to current age, and says that is what it is', () => {
    const a = analyzeHistory('PCV', [{ product: 'PCV21' }], 10 * 12, TODAY, '2016-05-01');
    expect(a.perDose[0].reasons.join(' ')).toMatch(/currently ~10 years/i);
    expect(a.perDose[0].detail).toMatch(/upper bound/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// The evaluator's contract, exercised directly. These pin the behaviour the
// walk relies on, without going through a whole history.
// ─────────────────────────────────────────────────────────────────────────
describe('S14-7 — evaluateDoseInterval, directly', () => {
  const base = {
    vaccine: 'PCV', product: 'PCV20', doseDate: '2026-02-09', ageAtDose: 840,
    prev: null, priorPcv: [], priorPpsv23: [], riskIds: [],
  };

  it('returns null when there is no age to place the dose in a schedule', () => {
    expect(evaluateDoseInterval({ ...base, ageAtDose: null })).toBeNull();
  });

  it('returns null when there is no date', () => {
    expect(evaluateDoseInterval({ ...base, doseDate: null })).toBeNull();
  });

  it('returns null when nothing precedes the dose', () => {
    expect(evaluateDoseInterval(base)).toBeNull();
  });

  it('returns a floor verdict with the rule id that produced it', () => {
    const v = evaluateDoseInterval({
      ...base,
      priorPcv: [{ date: '2026-01-05', product: 'PCV13' }],
      prev: { date: '2026-01-05', ageAtDose: 840, product: 'PCV13' },
    });
    expect(v.kind).toBe('floor');
    expect(v.ruleId).toBe('ADULT-PCV20-21-AFTER-PCV13');
    expect(v.authority).toBe('OWNER');
  });

  it('returns a recommendation verdict for a pair no floor names', () => {
    const v = evaluateDoseInterval({
      ...base, product: 'PCV15',
      priorPcv: [{ date: '2026-01-05', product: 'PCV13' }],
      prev: { date: '2026-01-05', ageAtDose: 840, product: 'PCV13' },
    });
    expect(v.kind).toBe('recommendation');
    expect(v.ruleId).toBe('ADULT-PCV-AFTER-PCV-CATCH-ALL');
  });

  // ⚠️ THIS ASSERTION IS THE OPPOSITE OF WHAT IT ONCE WAS, by RULING F
  // (2026-10-24). While both rows were floors, the more specific 5-year row
  // came first so the clinician was told about the binding gap. The 5-year
  // row is now a RECOMMENDATION, and `evaluateDoseInterval` returns on the
  // first unmet row of EITHER kind — so leaving it first would have let a
  // dose missing both gaps escape the 1-year floor with only a note. The rows
  // were swapped; the dose is still rejected, and now names the gap that
  // actually rejects it.
  it('reports the 1-year FLOOR, not the 5-year recommendation, when a dose misses both', () => {
    const v = evaluateDoseInterval({
      ...base, doseDate: '2026-02-09',
      priorPcv: [{ date: '2026-01-05', product: 'PCV13' }],
      priorPpsv23: [{ date: '2026-01-20' }],
      prev: { date: '2026-01-05', ageAtDose: 840, product: 'PCV13' },
    });
    expect(v.kind).toBe('floor');
    expect(v.ruleId).toBe('ADULT-PCV20-21-1Y-AFTER-PCV');
  });

  // CDC's grace applies to the FLOOR: 4 days short of the year still counts,
  // 5 days short does not. A graced dose says NOTHING — its own rule named it
  // and was satisfied, and a catch-all may not then talk over that rule with a
  // generic number (see the catchAll guard in the evaluator).
  it('applies the grace to a calendar-month floor: 4 days short counts, 5 does not', () => {
    const anniversary = addCalendarMonths('2026-01-05', 12);
    const ctx = (doseDate) => ({
      ...base, doseDate,
      priorPcv: [{ date: '2026-01-05', product: 'PCV13' }],
      prev: { date: '2026-01-05', ageAtDose: 840, product: 'PCV13' },
    });
    expect(evaluateDoseInterval(ctx(addDays(anniversary, -4)))).toBeNull();

    const tooEarly = evaluateDoseInterval(ctx(addDays(anniversary, -5)));
    expect(tooEarly.kind).toBe('floor');
    expect(tooEarly.ruleId).toBe('ADULT-PCV20-21-AFTER-PCV13');

    // A full year clears it, and says nothing at all.
    expect(evaluateDoseInterval(ctx(anniversary))).toBeNull();
  });

  // THE DEFECT THIS GUARD EXISTS FOR. A catch-all is risk-blind by design — it
  // quotes one flat interval. Letting it speak for a pair an enumerated row
  // already named reproduces the A-P1-1 mistake one rule along: an
  // immunocompromised adult whose PPSV23 came 10 weeks after PCV13 met the
  // 8-week interval rr7203a1 states FOR THEM, and was told "CDC advises at
  // least 1 year" by a row that cannot see their risk class.
  it('a catch-all never speaks for a pair an enumerated row already named', () => {
    const ppsv = (date, riskIds) => analyzeHistory('PPSV23', [{ date }],
      ADULT.ageMonths, TODAY, ADULT.dob,
      { pcvDoses: [{ date: '2019-03-01', product: 'PCV13' }], riskIds });

    const met = ppsv('2019-05-10', ['hiv']);       // 10 weeks — their interval is 8
    expect(met.perDose[0].status).toBe('valid');
    expect(met.perDose[0].earlyAdvisory).toBeFalsy();
    expect(met.perDose[0].reasons).toEqual([]);

    // The catch-all still does its own job for the pairs nothing else names.
    // This assertion has now been repointed TWICE, and where it has landed is
    // the point:
    //
    //   • Originally a PPSV23 given 10 weeks AFTER a PCV20. S14-4B
    //     (2026-10-12) reclassified exactly that dose — a PCV20 completes the
    //     adult series, so a later PPSV23 is an extra dose and the "still
    //     counts" advisory is stripped. 300 of 16,250 patients.
    //   • Then the SAME-DAY version of the same pair. S14-4C (2026-10-12)
    //     reclassified that too: co-administration is not a spacing problem,
    //     because no PPSV23 follows a PCV20 at any interval. 144 of 16,250.
    //
    // Twice the anchor was a pair involving a product that COMPLETES the
    // series, and twice it moved, because for such a pair there is no interval
    // to advise about in the first place. The stable anchor is the one the
    // catch-all actually exists for: a PCV product the clinician could not
    // name. No product-keyed row can select on it, so no enumerated row will
    // ever name this pair, and the generic 1-year sentence is the right thing
    // to say. Measured on the grid: 216 of the 324 patients reaching this row
    // are this shape.
    const afterUnknownPcv = analyzeHistory('PPSV23', [{ date: '2019-05-10' }],
      ADULT.ageMonths, TODAY, ADULT.dob,
      { pcvDoses: [{ date: '2019-03-01', product: '' }] });
    expect(afterUnknownPcv.perDose[0].status).toBe('valid');
    expect(afterUnknownPcv.perDose[0].earlyAdvisory).toBe(true);
    expect(afterUnknownPcv.perDose[0].intervalRuleId)
      .toBe('ADULT-PPSV23-AFTER-PCV-CATCH-ALL');
    expect(afterUnknownPcv.perDose[0].extraDose).toBeFalsy();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Every sentence a clinician reads, swept for raw machine numbers.
//
// The first version of `fmtGap` printed "Given 1.1428571428571428 months
// after the PCV13 dose" in the running app. The unit tests above never saw
// it: they match on each rule's WORDING, not on the number it interpolates.
// Only driving the app caught it. This sweep is the cheap guard that would
// have — it walks every row's message with a gap chosen to be fractional in
// calendar months, and fails on any number with a decimal point in it.
// ─────────────────────────────────────────────────────────────────────────
describe('S14-7 — no message prints a raw fraction', () => {
  // Gaps deliberately landing mid-month, where calendarMonthsBetween returns
  // a fraction: 35 days, 5 weeks past an anniversary, 3 years and 10 days.
  const HISTORIES = [
    ['PCV', [{ date: '2026-01-05', product: 'PCV13' }, { date: '2026-02-09', product: 'PCV20' }], ADULT, {}],
    ['PCV', [{ date: '2026-01-05', product: 'PCV13' }, { date: '2026-02-09', product: 'PCV15' }], ADULT, {}],
    ['PCV', [{ date: '2026-02-09', product: 'PCV20' }], ADULT, { ppsv23Doses: [{ date: '2026-01-05' }] }],
    ['PCV', [{ date: '2015-03-01', product: 'PCV13' }, { date: '2021-03-11', product: 'PCV20' }], ADULT, { ppsv23Doses: [{ date: '2018-03-01' }] }],
    ['PPSV23', [{ date: '2026-02-09' }], ADULT, { pcvDoses: [{ date: '2026-01-05', product: 'PCV15' }] }],
    ['PPSV23', [{ date: '2026-03-21' }], ADULT, { pcvDoses: [{ date: '2026-01-05', product: 'PCV15' }], riskIds: ['hiv'] }],
    ['PPSV23', [{ date: '2026-02-09' }], ADULT, { pcvDoses: [{ date: '2026-01-05', product: 'PCV13' }] }],
    ['PPSV23', [{ date: '2022-01-10' }, { date: '2024-01-21' }], ADULT, {}],
    ['PPSV23', [{ date: '2026-01-10' }, { date: '2026-01-10' }], CHILD, { pcvDoses: [{ date: '2026-01-05', product: 'PCV15' }] }],
    ['PCV', [{ date: '2026-03-01', product: 'PCV13' }, { date: '2026-03-15', product: 'PCV13' }], { ageMonths: 4, dob: '2026-01-01' }, {}],
  ];

  it('sweeps every row\'s reasons and detail for a decimal point', () => {
    let seen = 0;
    for (const [vaccine, doses, who, opts] of HISTORIES) {
      const a = analyzeHistory(vaccine, doses, who.ageMonths, TODAY, who.dob, opts);
      for (const d of a.perDose) {
        for (const text of [...(d.reasons ?? []), d.detail ?? '']) {
          if (text) seen++;
          // A decimal point between digits is a raw machine number.
          expect(text, text).not.toMatch(/\d+\.\d+/);
        }
      }
    }
    // The sweep must actually have read something — a "nothing is wrong"
    // assertion over an empty set is the failure mode testing.md warns about.
    expect(seen).toBeGreaterThan(15);
  });

  it('and the gap itself reads in whole units', () => {
    const a = analyzeHistory('PCV', [
      { date: '2026-01-05', product: 'PCV13' },
      { date: '2026-02-09', product: 'PCV20' },
    ], ADULT.ageMonths, TODAY, ADULT.dob);
    expect(a.perDose[1].reasons[0]).toMatch(/^Given 1 month after the PCV13 dose/);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Same-visit co-administration is the most likely real-world error on these
// pairs, so it must read as one sentence a clinician recognises — not as
// "Given 0 days after", which the first version of these messages produced.
// ─────────────────────────────────────────────────────────────────────────
describe('S14-7 — a same-day pair says so in words', () => {
  const SAME_DAY = [
    ['an adult PPSV23 on the same day as a PCV13', 'PPSV23', [{ date: '2019-03-01' }],
      { pcvDoses: [{ date: '2019-03-01', product: 'PCV13' }] }],
    ['an adult PPSV23 on the same day as a PCV15', 'PPSV23', [{ date: '2019-03-01' }],
      { pcvDoses: [{ date: '2019-03-01', product: 'PCV15' }] }],
    ['an immunocompromised adult\'s PPSV23 on the same day as a PCV15', 'PPSV23', [{ date: '2019-03-01' }],
      { pcvDoses: [{ date: '2019-03-01', product: 'PCV15' }], riskIds: ['hiv'] }],
    ['an adult PCV20 on the same day as a PCV13', 'PCV',
      [{ date: '2019-03-01', product: 'PCV13' }, { date: '2019-03-01', product: 'PCV20' }], {}],
    ['an adult PCV20 on the same day as a PPSV23', 'PCV',
      [{ date: '2019-03-01', product: 'PCV20' }], { ppsv23Doses: [{ date: '2019-03-01' }] }],
  ];

  for (const [label, vaccine, doses, opts] of SAME_DAY) {
    it(`says "on the same day as" for ${label}`, () => {
      const a = analyzeHistory(vaccine, doses, ADULT.ageMonths, TODAY, ADULT.dob, opts);
      const judged = a.perDose[a.perDose.length - 1];
      const text = [...(judged.reasons ?? []), judged.detail ?? ''].join(' ');
      expect(text).toMatch(/on the same day as/);
      expect(text).not.toMatch(/0 days after/);
    });
  }

  it('and a real gap still reads as a gap, not as a same-day pair', () => {
    const a = analyzeHistory('PCV', [
      { date: '2019-03-01', product: 'PCV13' },
      { date: '2019-06-01', product: 'PCV20' },
    ], ADULT.ageMonths, TODAY, ADULT.dob);
    expect(a.perDose[1].reasons[0]).toMatch(/^Given 3 months after the PCV13 dose/);
    expect(a.perDose[1].reasons[0]).not.toMatch(/same day/);
  });
});
