// ⚠️ RENAMED AND INVERTED BY OWNER RULING 2026-10-25. It was
// `regression-2026-10-24-invalid-adult-dose-owes-a-conjugate.test.js`, and the
// rename is the finding: AN EARLY ADULT DOSE NOW OWES NOTHING, because no
// adult dose is set aside for timing any more. Every one of her four worked
// patients below is complete where she was previously owed a repeat.
//
// IT IS KEPT, NOT DELETED, for three reasons. Her four patients are the ones
// the question was argued over, so they are the right ones to pin. The CHILD
// half is untouched and still live — children keep real floors, so the repeat
// clock, the 8-week number and the no-grace rule all still run for them. And
// the adult machinery is now UNREACHABLE rather than removed, which is a thing
// a test should say out loud: see the last describe block.
//
// ── what it used to hold ─────────────────────────────────────────────────
//
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

describe('her four worked patients are owed NOTHING now', () => {
  // The same four, with the dates she gave on 2026-10-24 kept in the table as
  // the record of what they used to be told. None of them has an invalid dose
  // any more, so none has a repeat date at all.
  const CASES = [
    ['70y healthy, early conjugate 8 months after PPSV23', {
      ageMonths: Y(70), riskIds: [],
      pcvDoses: [{ product: 'PCV15', date: '2026-06-19' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }],
    }, '2027-06-19'],
    ['70y healthy, early conjugate 15 days short of the year', {
      ageMonths: Y(70), riskIds: [],
      pcvDoses: [{ product: 'PCV15', date: '2026-09-26' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }],
    }, '2027-09-26'],
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

  for (const [name, patient, wasDue] of CASES) {
    it(`${name} -> no invalid dose, no repeat (was ${wasDue})`, () => {
      expect(invalidOf(run(patient))).toHaveLength(0);
    });
  }

  it('and every one of them reads complete', () => {
    for (const [name, patient] of CASES) {
      expect(run(patient).recs.some((r) => r.status === 'complete'), name).toBe(true);
    }
  });
});

describe('one number for every adult, which is what she chose', () => {
  // "can you use 1 year for adults and 8 weeks for pediatrics with risks?"
  // So the adult clock does NOT vary by risk class. Same history, four risk
  // profiles, one date.
  const sameDateAcrossRisk = (riskProfiles) => riskProfiles.map((riskIds) => {
    const bad = invalidOf(run({
      ageMonths: Y(50), riskIds,
      pcvDoses: [{ product: 'PCV15', date: '2026-08-15' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }],
    }));
    return bad[0]?.repeatDueDate;
  });

  // Her "one number for every adult" is now moot at the sharpest possible
  // point: there is no number, for any risk class, because there is no
  // rejected dose to repeat. Kept as the record — risk-keying the clock back
  // in would make this fail.
  it('healthy, chronic, immunocompromised and cochlear are all owed nothing (all were 2027-08-15)', () => {
    const dates = sameDateAcrossRisk([[], ['chronic_heart'], ['asplenia'], ['cochlear_implant']]);
    expect(dates).toEqual([undefined, undefined, undefined, undefined]);
  });
});

describe('children keep their own numbers — her ruling is adult-shaped', () => {
  // "8 weeks for pediatrics with risks". A 5-year-old with asplenia whose
  // PPSV23 came 21 days after her PCV20: 22 Jun + 56 days.
  it('an at-risk child repeats a PPSV23 5 years after the early dose, never the adult year (§C-P2-FIVE)', () => {
    const bad = invalidOf(run({
      ageMonths: 60, riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV20', date: '2026-06-01' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-06-22' }],
    }));
    expect(bad).toHaveLength(1);
    // §C-P2-FIVE (owner ruling 2026-10-31): "PPSV23 to PPSV23 is 5 years." The
    // repeat of a thrown-out PPSV23 is another PPSV23, so it moved from 8 weeks
    // (2026-08-17) to 5 years after the dose given.
    expect(bad[0].repeatDueDate).toBe('2031-06-22');
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

  // ⚠️ REVERSED 2026-10-25: she was asked about this family directly (a
  // 68-year-old with COPD, PPSV23 2024 and a second in 2026) and chose COUNT,
  // NOTE THE SHORTFALL. Her reason is the one this row always rested on —
  // rejecting the dose would only invite a THIRD PPSV23, which is the harm the
  // evidence describes — so the dose counts and the card says never give a
  // third.
  it('counts the second dose, and tells the reader never to give a third', () => {
    const d = second();
    expect(d.status).toBe('valid');
    expect(d.effectiveDoseNum).toBe(2);
    expect(d.reasons.join(' ')).toMatch(/shorter than the 5 years/);
    expect(d.reasons.join(' ')).toMatch(/\*\*Counted; never give a third\.\*\*/);
  });

  it('and the rationale is the hyporesponsiveness evidence, not a bare interval', () => {
    // The quote the owner supplied on 2026-10-25 from rr7203a1's "Repeat
    // PPSV23 administration" section. This is the ONE adult interval with
    // direct data behind it, and the card has to say so or the reader cannot
    // tell it apart from the ones that are only scheduling convention.
    const why = second().whys.join(' ');
    expect(why).toMatch(/lower than to the first dose for certain serotypes/);
    expect(why).toMatch(/no hyporesponsiveness was seen at 5 years or more/);
    expect(why).toMatch(/rr7203a1/);
    expect(why).toMatch(/lifetime maximum/);
  });

  it('marker pairs are balanced, so the renderer cannot swallow the rest', () => {
    for (const r of second().reasons) expect(r.split('**').length % 2).toBe(1);
  });

  it('NO row carries the opt-in flag any more', () => {
    // It was only ever read in the evaluator's floor branch, and this row —
    // its only user — stopped being a floor. A flag left set would read as
    // live behaviour to the next session, so it was removed from the row.
    const optedIn = DOSE_INTERVAL_RULES.filter((r) => r.conjugateAlternativeAfterInvalid);
    expect(optedIn.map((r) => r.id)).toEqual([]);
  });

  it('it is now a recommendation, and THE INTERVAL IS UNCHANGED', () => {
    const rule = DOSE_INTERVAL_RULES.find((r) => r.id === 'ADULT-PPSV23-AFTER-PPSV23');
    expect(rule.enforcement).toBe('recommendation');
    // The 5 years did not move. Only what happens below it did — which is the
    // distinction her whole table is built on.
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
  // The 2026-10-24 morning ruling, which these changes must not undo: the
  // grace decides what the app ACCEPTS, never what it ADVISES.
  //
  // ⚠️ RETARGETED TO A CHILD on 2026-10-25, because the adult patient this
  // used to use no longer has a rejected dose. The contract is unchanged and
  // children are where it still runs.
  it('a repeat date is the full interval, not the interval minus four days', () => {
    const bad = invalidOf(run({
      ageMonths: 60, riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV20', date: '2026-06-01' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-06-22' }],
    }));
    expect(bad).toHaveLength(1);
    // §C-P2-FIVE (owner ruling 2026-10-31): "PPSV23 to PPSV23 is 5 years." The
    // repeat of a thrown-out PPSV23 is another PPSV23, so it moved from 8 weeks
    // (2026-08-17) to 5 years after the dose given.
    expect(bad[0].repeatDueDate).toBe('2031-06-22');   // 5 years exactly
    expect(bad[0].repeatDueDate).not.toBe('2031-06-18'); // 5 years less the grace
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe('THE ADULT INVALID-DOSE CARD IS NOW UNREACHABLE, said out loud', () => {
  // `adultInvalidDoseCard` in recommend.js is gated on
  // `CARD_FOLLOWS_INVALID_DOSE`, a set of four adult rule ids. All four became
  // recommendations on 2026-10-25, so no adult dose can carry one of those ids
  // and be invalid at the same time, and the card can never build.
  //
  // CLAUDE.md's rule is that a branch nothing can execute cannot be tested, so
  // the unreachability is the assertion. The code is LEFT IN PLACE rather than
  // deleted, because it is the implementation of a ruling she might restore —
  // but a future session must not read it as live behaviour. If a floor ever
  // returns to one of those rows this test fails and says so.
  it('no adult rule that the card follows is a floor any more', () => {
    const followed = [
      'ADULT-PCV-AFTER-PPSV23',
      'ADULT-PPSV23-AFTER-PCV15',
      'ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM',
      'ADULT-PPSV23-AFTER-PCV13',
    ];
    for (const id of followed) {
      const rule = DOSE_INTERVAL_RULES.find((r) => r.id === id);
      expect(rule, id).toBeDefined();
      expect(rule.enforcement, id).toBe('recommendation');
    }
  });

  it('and `adultRepeatAfterInvalidDose` still answers when called directly', () => {
    // Pure function, still correct, still exercised by the two tests above.
    // Its only PRODUCTION caller was the opt-in flag that no row now sets.
    expect(adultRepeatAfterInvalidDose({
      vaccine: 'PPSV23', doseDate: '2026-10-11', ageAtDose: Y(60), riskIds: [],
      priorPcv: [], priorPpsv23: [{ date: '2026-10-11' }],
    }).dueDate).toBe('2027-10-11');
  });
});
