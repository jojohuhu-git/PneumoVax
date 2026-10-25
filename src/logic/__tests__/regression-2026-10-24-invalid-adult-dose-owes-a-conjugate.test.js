// OWNER RULING 2026-10-24 (afternoon) — THE REPEAT DATE AFTER AN INVALID ADULT
// DOSE, and the one family she kept out of it.
//
// Her four steps: what is repeated comes from the VALID history; the clock
// starts at the INVALID dose; its length comes from the vaccine before the
// repeat; and the repeat must clear the interval from the last valid dose too,
// "use whichever date comes later".
//
// THE ERROR THIS FIXES. `repeatDueDate` used to spend the interval of the rule
// that REJECTED the dose. For the three healthy patients she worked through
// that happens to equal the right number, so the app looked correct. For her
// asplenic patient it did not: the rejecting row is the 8-week IC minimum, so
// the chip advised 2026-12-06 where she ruled 2027-10-11. "Why 12/6/26 ... is
// not appropriate: the 8-week interval applies only to PCV15 -> PPSV23. It
// does not apply to PPSV23 -> PPSV23."
//
// Readings, citations and the measurements behind every number:
// docs/archive/decision-2026-10-24-invalid-adult-dose-repeat-rule.md
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { analyzeHistory } from '../validate.js';
import {
  DOSE_INTERVAL_RULES,
  adultRepeatAfterInvalidDose,
  ADULT_OWED_AFTER_INVALID_DOSE,
} from '../doseIntervalRules.js';

const TODAY = '2026-10-24';
const Y = (y) => y * 12;
const run = (p) => recommend({ today: TODAY, ...p });
const invalidOf = (out) => [...out.perDose.pcv, ...out.perDose.ppsv23]
  .filter((d) => d.status === 'invalid');

// The date in a counted dose's "Why this" alternative. Added 2026-10-25, when
// the owner turned ADULT-PCV-AFTER-PPSV23 into a recommendation: her two
// conjugate patients below no longer have a repeat date because they no longer
// have an invalid dose, and the SAME date is now offered to them as the
// alternative. Both come from `adultRepeatAfterInvalidDose`, so reading it here
// tests the clock she ruled on, not a second one.
const alternativeDateOf = (dose) => {
  const m = (dose?.whys ?? []).join(' ')
    .match(/1 dose of PCV20 or PCV21 on or after ([A-Z][a-z]{2} \d{1,2}, \d{4})/);
  return m ? m[1] : null;
};

describe('her four worked patients, to the day', () => {
  // These are the ONLY four patients she gave dates for. Every one of them was
  // wrong before this change or right only by coincidence, so they are
  // asserted exactly rather than by shape.
  // ⚠️ HER FIRST TWO PATIENTS MOVED OUT OF THIS LIST ON 2026-10-25, not out of
  // the file. Both are a conjugate given early after a PPSV23, and that row
  // stopped rejecting doses when she ruled "count like the child". They have
  // their own block below, asserting THE SAME TWO DATES through the
  // alternative the card now offers — which is the point: her dates survived
  // the reversal, they just stopped being orders.
  const CASES = [
    ['60y healthy, early PPSV23 12 weeks after PCV15', {
      ageMonths: Y(60), riskIds: [],
      pcvDoses: [{ product: 'PCV15', date: '2026-07-19' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
    }, '2027-10-11'],
    // ⚠️ THE ONE THAT WAS WRONG. Her asplenic patient: the old code read the
    // 8-week IC rule that rejected the dose and advised 2026-12-06.
    ['40y asplenia, early PPSV23 2 weeks short of her 8 weeks', {
      ageMonths: Y(40), riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV15', date: '2026-08-30' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
    }, '2027-10-11'],
  ];

  for (const [name, patient, due] of CASES) {
    it(`${name} -> repeat due ${due}`, () => {
      const bad = invalidOf(run(patient));
      expect(bad).toHaveLength(1);
      expect(bad[0].repeatDueDate).toBe(due);
    });
  }

  it('the asplenic patient is NOT given the 8 weeks she was given before', () => {
    const bad = invalidOf(run(CASES[1][1]));
    expect(bad[0].repeatDueDate).not.toBe('2026-12-06');
  });
});

describe('her two conjugate patients keep her dates — as the alternative', () => {
  // OWNER DECISION 2026-10-25. The dose counts now, so there is no repeat to
  // be due; what she asked for instead is "Counted + alternative with a date",
  // and the date has to be the one she worked out herself on 2026-10-24. If
  // these two ever print a different day from the dates in this file's history,
  // the two readings of her clock have drifted apart again.
  const CONJUGATE_CASES = [
    ['70y healthy, early conjugate 8 months after PPSV23', {
      ageMonths: Y(70), riskIds: [],
      pcvDoses: [{ product: 'PCV15', date: '2026-06-19' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }],
    }, 'Jun 19, 2027'],
    ['70y healthy, early conjugate 15 days short of the year', {
      ageMonths: Y(70), riskIds: [],
      pcvDoses: [{ product: 'PCV15', date: '2026-09-26' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }],
    }, 'Sep 26, 2027'],
  ];

  for (const [name, patient, alt] of CONJUGATE_CASES) {
    it(`${name} -> counts, alternative ${alt}`, () => {
      const out = run(patient);
      expect(invalidOf(out)).toHaveLength(0);
      expect(out.perDose.pcv[0].status).toBe('valid');
      expect(alternativeDateOf(out.perDose.pcv[0])).toBe(alt);
    });
  }

  it('and the alternative is emphasised, as she asked', () => {
    const d = run(CONJUGATE_CASES[0][1]).perDose.pcv[0];
    expect((d.whys ?? []).join(' ')).toMatch(/\*\*Alternative, if this dose is treated as invalid:[\s\S]*?\*\*/);
    // Balanced markers, or the renderer swallows the rest of the sentence.
    for (const w of (d.whys ?? [])) expect(w.split('**').length % 2).toBe(1);
  });
});

describe('one number for every adult, which is what she chose', () => {
  // "can you use 1 year for adults and 8 weeks for pediatrics with risks?"
  // So the adult clock does NOT vary by risk class. Same history, four risk
  // profiles, one date.
  // Read from the ALTERNATIVE since 2026-10-25, because this patient's dose now
  // counts. Same function, same clock, same question: does the adult number
  // vary by risk class? It must not.
  const sameDateAcrossRisk = (riskProfiles) => riskProfiles.map((riskIds) => {
    const out = run({
      ageMonths: Y(50), riskIds,
      pcvDoses: [{ product: 'PCV15', date: '2026-08-15' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }],
    });
    return alternativeDateOf(out.perDose.pcv[0]);
  });

  it('healthy, chronic, immunocompromised and cochlear all get Aug 15, 2027', () => {
    const dates = sameDateAcrossRisk([[], ['chronic_heart'], ['asplenia'], ['cochlear_implant']]);
    expect(dates).toEqual(['Aug 15, 2027', 'Aug 15, 2027', 'Aug 15, 2027', 'Aug 15, 2027']);
  });

  // And the floor side of the same question, on a family that still HAS a
  // repeat date: a PPSV23 given the day after a PCV15 misses the 8-week
  // minimum and the year alike, and every risk class is owed its conjugate on
  // the same day.
  it('a still-rejected dose gives one repeat date across the four risk classes', () => {
    const dates = [[], ['chronic_heart'], ['asplenia'], ['cochlear_implant']].map((riskIds) => {
      const bad = invalidOf(run({
        ageMonths: Y(50), riskIds,
        pcvDoses: [{ product: 'PCV15', date: '2026-08-15' }],
        ppsv23Doses: [{ product: 'PPSV23', date: '2026-08-16' }],
      }));
      return bad[0]?.repeatDueDate;
    });
    expect(dates).toEqual(['2027-08-16', '2027-08-16', '2027-08-16', '2027-08-16']);
  });
});

describe('children keep their own numbers — her ruling is adult-shaped', () => {
  // "8 weeks for pediatrics with risks". A 5-year-old with asplenia whose
  // PPSV23 came 21 days after her PCV20: 22 Jun + 56 days.
  it('an at-risk child repeats 8 weeks after the early dose, not a year', () => {
    const bad = invalidOf(run({
      ageMonths: 60, riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV20', date: '2026-06-01' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-06-22' }],
    }));
    expect(bad).toHaveLength(1);
    expect(bad[0].repeatDueDate).toBe('2026-08-17');
  });

  it('the adult branch refuses to answer for a child at all', () => {
    // The gate is the age AT THE DOSE, not today's age — a 19-year-old whose
    // dose was given at 17 is judged by the child rulebook and must not pick
    // up the adult year.
    expect(adultRepeatAfterInvalidDose({
      vaccine: 'PPSV23', doseDate: '2026-06-22', ageAtDose: 60,
      priorPcv: [{ date: '2026-06-01', product: 'PCV20' }], priorPpsv23: [], riskIds: ['asplenia'],
    })).toBeNull();
  });
});

describe('the second PPSV23 — the family she kept OUT of the new clock', () => {
  // "PPSV23 to PPSV23 spacing should be 5 years" — kept. Applying the general
  // ruling here would have moved 66 corpus rows FOUR YEARS earlier, in a
  // family she had not been shown, so this row keeps its own arithmetic and
  // gains her emphasised alternative instead.
  const second = () => analyzeHistory(
    'PPSV23', [{ date: '2015-01-01' }, { date: '2018-01-01' }], 840, '2026-06-01', '1945-01-01',
  ).perDose[1];

  it('keeps the 5-year date — NOT the 1-year conjugate date', () => {
    const d = second();
    expect(d.status).toBe('invalid');
    expect(d.repeatDueDate).toBe('2023-01-01');
    expect(d.repeatDueDate).not.toBe('2019-01-01');
  });

  it('offers PCV20 or PCV21 from one year, emphasised, with both reasons', () => {
    const text = second().reasons.join(' ');
    // Her two sentences, summarised, and the date from the shared clocks.
    expect(text).toContain('A repeat PPSV23 should wait at least 5 years after this dose');
    expect(text).toContain('1 dose of PCV20 or PCV21 may be considered from Jan 1, 2019');
    expect(text).toContain('ACIP schedules any conjugate at least 1 year after the last PPSV23');
    // Emphasised — she asked for the alternative bolded.
    expect(text).toMatch(/\*\*A repeat PPSV23[\s\S]*?last PPSV23\.\*\*/);
  });

  it('marker pairs are balanced, so the renderer cannot swallow the rest', () => {
    for (const r of second().reasons) expect(r.split('**').length % 2).toBe(1);
  });

  it('the row carries the opt-in flag, and it is the ONLY row that does', () => {
    const optedIn = DOSE_INTERVAL_RULES.filter((r) => r.conjugateAlternativeAfterInvalid);
    expect(optedIn.map((r) => r.id)).toEqual(['ADULT-PPSV23-AFTER-PPSV23']);
  });

  it('and it is still a 5-year floor on her authority', () => {
    const rule = DOSE_INTERVAL_RULES.find((r) => r.id === 'ADULT-PPSV23-AFTER-PPSV23');
    expect(rule.enforcement).toBe('floor');
    expect(rule.interval).toEqual({ months: 60 });
  });
});

describe('the owed dose is always a conjugate', () => {
  it('PCV20 or PCV21, never PCV15 and never a repeat PPSV23', () => {
    expect(ADULT_OWED_AFTER_INVALID_DOSE).toEqual(['PCV20', 'PCV21']);
  });
});

describe('STEP 4 IS INERT TODAY, AND THAT IS GUARDED RATHER THAN HIDDEN', () => {
  // ⚠️ READ THIS BEFORE "FIXING" THE MAX. Her step 4 says the repeat must also
  // clear the interval from the last VALID dose, "use whichever date comes
  // later". It is implemented, and it can never change an answer while both
  // legs carry the same number: the invalid dose is always on or after the
  // last valid dose, so invalid+1y >= valid+1y. Measured over both grids when
  // this landed: the last-valid-dose clock won 0 of 10,349 adult invalid doses.
  //
  // CLAUDE.md's rule is that a branch nothing can execute cannot be tested, so
  // the unreachability itself is the assertion — exactly as the 24-71-month
  // guard does it. If a future ruling makes the two legs differ, this test
  // fails and tells the next session the max has become load-bearing.
  it('the invalid-dose clock wins whenever the two legs carry the same interval', () => {
    const probe = (invalidVaccine, invalidDate, validVaccine, validDate) => adultRepeatAfterInvalidDose({
      vaccine: invalidVaccine, doseDate: invalidDate, ageAtDose: Y(60), riskIds: [],
      priorPcv: validVaccine === 'PCV' ? [{ date: validDate, product: 'PCV15' }] : [],
      priorPpsv23: validVaccine === 'PPSV23' ? [{ date: validDate }] : [],
    });
    // both directions, and a same-day pair, which is the only way the two
    // clocks can tie
    expect(probe('PCV', '2026-06-19', 'PPSV23', '2025-10-11').boundBy).toBe('invalidDose');
    expect(probe('PPSV23', '2026-10-11', 'PCV', '2026-07-19').boundBy).toBe('invalidDose');
    expect(probe('PPSV23', '2026-10-11', 'PCV', '2026-10-11').boundBy).toBe('invalidDose');
  });

  it('but the max is really there — a longer valid-dose leg would win', () => {
    // Hand-built: the only thing that can flip `boundBy` is the legs
    // differing, so this asserts the mechanism directly rather than through a
    // patient no risk profile can currently produce.
    const clocks = adultRepeatAfterInvalidDose({
      vaccine: 'PPSV23', doseDate: '2026-10-11', ageAtDose: Y(60), riskIds: [],
      priorPcv: [], priorPpsv23: [{ date: '2026-10-11' }],
    });
    // Same date both sides -> ties go to the invalid dose, and the date is the
    // year, ungraced.
    expect(clocks.dueDate).toBe('2027-10-11');
    expect(clocks.anchoredOnValid).toBe('2026-10-11');
  });
});

describe('the advice is never inside CDC\'s 4-day grace', () => {
  // The 2026-10-24 morning ruling, which these new dates must not undo: the
  // grace decides what the app ACCEPTS, never what it ADVISES.
  // Repointed 2026-10-25 from the 70-year-old's early conjugate (which no
  // longer has a repeat date) to the 60-year-old's early PPSV23, which still
  // does. Same claim, same arithmetic, a family that still reaches it.
  it('a repeat date is the full interval, not the interval minus four days', () => {
    const bad = invalidOf(run({
      ageMonths: Y(60), riskIds: [],
      pcvDoses: [{ product: 'PCV15', date: '2026-07-19' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
    }));
    expect(bad[0].repeatDueDate).toBe('2027-10-11');   // 1 year exactly
    expect(bad[0].repeatDueDate).not.toBe('2027-10-07'); // 1 year less the grace
  });

  // And the alternative offered to a dose that COUNTS takes no grace either —
  // it is the same number from the same function, so a grace could only
  // appear here if someone introduced a second reading of the clock.
  it('the counted dose\'s alternative is ungraced too', () => {
    const d = run({
      ageMonths: Y(70), riskIds: [],
      pcvDoses: [{ product: 'PCV15', date: '2026-06-19' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }],
    }).perDose.pcv[0];
    expect(alternativeDateOf(d)).toBe('Jun 19, 2027');
    expect(alternativeDateOf(d)).not.toBe('Jun 15, 2027');
  });
});
