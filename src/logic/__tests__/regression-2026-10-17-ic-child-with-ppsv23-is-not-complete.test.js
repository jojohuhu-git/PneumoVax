// IC-1 / IC-2 / IC-3 (2026-10-17) — an immunocompromised child who has had
// PPSV23 but no PCV20 is NOT finished, and an at-risk child who has finished
// the PCV catch-up but has had neither PPSV23 nor PCV20 is not finished either.
//
// Found while reading the app's own cited sources for C7, not by a test.
//
// WHAT WAS WRONG. Three paediatric branches told a child "complete" where CDC
// and immunize.org both say a dose is still available to them. All three share
// one root cause: CDC and p2016 split almost every paediatric risk row into an
// immunocompromising (IC) and a non-immunocompromising (non-IC) version, and
// the IC version always carries a further dose at five years that the non-IC
// version does not. The engine applied the non-IC answer to IC children.
//
// REPRODUCED before the fix, over `test-grid.js` (16,202 cards, 2026-10-17):
//
//   IC-1  69 cards.  IC child, all counting PCV before age 6, PPSV23 given,
//         no PCV20 -> single card "PCV series complete (PCV before age 6 +
//         PPSV23)".
//   IC-2 /
//   IC-3  48 cards on one statement, "PCV complete (at-risk catch-up done)".
//         The branch returned `complete` the moment the PCV catch-up target was
//         met, with NO test of PPSV23 or PCV20 at all, so every child who had
//         neither was told they were finished. 23 of the 48 are wrong: 8 have
//         no PPSV23 entry, and 15 have one the engine itself rejects (the grid
//         dates it at or before the child's birth, or under PPSV23's 2-year
//         minimum age), which comes to the same thing -- `ppsvGiven` is false
//         and a dose is owed. The other 25 are non-IC children with a valid
//         PPSV23, for whom `complete` is correct and stays correct.
//
// ⚠ The first write-up of this split counted PPSV23 entries in the INPUT rather
// than doses the engine accepts, and so described the 15 as "PPSV23 five years
// ago". They are children whose PPSV23 never counted. The fix is the same
// either way -- the branch has to ask the question -- but the figure is
// recorded here as measured, not as first guessed.
//
// THE CONTROL that makes these real rather than a misreading: every one of
// those 92 patients was re-run and EVERY card each one sees was listed. Each
// saw exactly ONE card, saying complete. No PCV20 or PPSV23 recommendation
// appeared anywhere else, so nothing was recovered on another card.
//
// WHY NOTHING CAUGHT IT. Both verdict corpora record a card's `status` and
// `brands`, so "complete" with no brands is a committed, green line. Neither
// corpus asks whether `complete` is the RIGHT answer for the risk class, and
// before this file no test compared an IC branch against its non-IC twin.
// `regression-2026-10-17-ic-and-nonic-twins.test.js` now closes that.
//
// CLINICAL SOURCES — read live 2026-10-17, quoted from the documents, not from
// memory or from the app's own stored copies.
//
// 1. CDC Child & Adolescent Immunization Schedule Notes, "Pneumococcal
//    vaccination / Special situations". Read with the collapsed sections
//    EXPANDED -- they are shut by default, so the whole paediatric risk-based
//    rulebook is invisible until clicked.
//    https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo
//
//    IC list, "Age 2-5 years" -- the sentence IC-2 and IC-3 turn on:
//      "Completed recommended PCV series but have not received PPSV23 --
//       Previously received at least 1 dose of PCV20: no further PCV or PPSV23
//       doses needed -- Not previously received PCV20: administer 1 dose PCV20
//       or 1 dose PPSV23 at least 8 weeks after the most recent PCV dose. If
//       PPSV23 is used, administer 1 dose of PCV20 or dose 2 PPSV23 at least 5
//       years after dose 1 PPSV23"
//
//    IC list, "Age 6-18 years":
//      "Received PCV before age 6 years but have not received PPSV23 --
//       ... Not previously received PCV20: administer 1 dose PCV20 or 1 dose
//       PPSV23 at least 8 weeks after the most recent PCV dose. If PPSV23 is
//       used, administer either PCV20 or dose 2 PPSV23 at least 5 years after
//       dose 1 PPSV23."
//
//    NON-IC list, "Age 2-5 years" -- note what is ABSENT: no five-year
//    follow-on. This is why the non-IC answer stays "complete":
//      "Not previously received PCV20: administer 1 dose PCV20 or 1 dose
//       PPSV23 administer at least 8 weeks after the most recent PCV dose."
//
//    NON-IC list, "Age 6-18 years":
//      "Received 1 dose PCV13 and 1 dose PPSV23 at or after age 6 years: no
//       further doses of any PCV or PPSV23 indicated."
//
//    ⚠ CDC's 6-18 IC bullet is headed "but have not received PPSV23", so CDC's
//    6-18 section is strictly SILENT on a child who had BOTH their PCV and
//    their PPSV23 before age 6. The obligation those children carry comes from
//    CDC's 2-5 section (which they were under when the PPSV23 was given) and,
//    decisively, from p2016 below -- whose row spans 2 THROUGH 18 years.
//
// 2. immunize.org p2016, "Recommendations for Pneumococcal Vaccines Use in
//    Children and Teens", Item #P2016 (2/16/2024). Table 4, footnote || --
//    attached to the IC row's "no PPSV23||", and the single most on-point
//    sentence for IC-1:
//      "If PPSV23 previously given, options are (a) give one dose of PCV20 at
//       least 8 weeks after most recent pneumococcal vaccination, or (b) give a
//       second dose of PPSV23 five years after the first dose of PPSV23."
//    Its footnote § -- attached to the NON-IC row of the same history -- is the
//    contrasting half, and is why non-IC "complete" is correct:
//      "If PPSV23 previously given, then child is complete."
//    https://www.immunize.org/wp-content/uploads/catg.d/p2016.pdf
//
// AAP tiebreak (CLAUDE.md authority rule): not needed. CDC and immunize.org
// agree, and they are the two sources the app already cites here. The CDC page
// that carries quote 1 is the July 2, 2025 schedule, which its own banner says
// is current because AAP et al. v. Kennedy stayed the later ACIP votes -- i.e.
// the edition AAP litigated to restore.
//
// WHAT THE ENGINE ALREADY HAD. recommend.js contains TWO correct IC/non-IC
// splits downstream of the faulty shortcut -- one for `pcv.count >= 3` and one
// for 1-2 prior doses -- both of which already emit exactly "PCV20 >=8wk OR a
// 2nd PPSV23 >=5y". The shortcut simply intercepted children before either
// could run. So IC-1's fix is to stop the shortcut applying to IC children,
// not to write a new rule. Its comment claimed the shortcut was right for "IC
// or non-IC", citing the PneumoRecs VaxAdvisor app; the written schedule and
// p2016 both say otherwise, and under CLAUDE.md's authority rule they govern.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-10-17';

/**
 * One at-risk child, with whatever history the case needs.
 *
 * `dob` is always passed, never just an age in months. The first draft of this
 * file dated a PPSV23 "five years ago" for a five-year-old, which put it before
 * the child was born; the engine correctly refused the dose, `ppsvGiven` was
 * false, and the fixture quietly tested a different patient. Every date below
 * is therefore checked against the date of birth and against PPSV23's minimum
 * age of 2 years.
 */
const run = ({ dob, ageMonths, riskIds, pcv = [], ppsv = [] }) => recommend({
  dob,
  ageMonths,
  riskIds,
  today: TODAY,
  pcvDoses: pcv.map(([product, date]) => ({ product, date })),
  ppsv23Doses: ppsv.map((date) => ({ product: 'PPSV23', date })),
});

const labels = (r) => r.recs.map((x) => x.doseLabel);
const prose = (r) => r.recs.map((x) => (typeof x.note === 'string'
  ? x.note
  : [x.note?.lead, x.note?.detail].filter(Boolean).join(' '))).join(' || ');

// An IC tick and a non-IC tick that are otherwise interchangeable: both are on
// CDC's paediatric lists, neither is adultOnly, and both put a child on the
// at-risk pathway. The ONLY difference between the two patients is which of
// CDC's two lists their condition sits on.
const IC_RISK = ['asplenia'];
const NON_IC_RISK = ['cochlear_implant'];

describe('IC-1 — an IC child whose PCV was all before age 6 and who has had PPSV23', () => {
  // Age 6 exactly; one PCV15 at age 4; PPSV23 at age 5. Nothing is PCV20.
  // Born 2020-10-17, so exactly 6 today. PCV15 at age ~48 months (before 6),
  // PPSV23 at age ~60 months — both valid, both before the 6th birthday.
  const history = {
    dob: '2020-10-17', ageMonths: 72,
    pcv: [['PCV15', '2024-10-11']],
    ppsv: ['2025-10-11'],
  };

  it('is NOT told the series is complete', () => {
    const r = run({ ...history, riskIds: IC_RISK });
    expect(r.recs.some((x) => x.status === 'complete')).toBe(false);
    expect(prose(r)).not.toContain('the paediatric high-risk series is complete');
  });

  it('is offered PCV20 now, or a 2nd PPSV23 at 5 years — p2016 footnote ||', () => {
    const r = run({ ...history, riskIds: IC_RISK });
    expect(r.recs.some((x) => x.vaccine === 'PCV'
      && (x.brands ?? []).some((b) => String(b).includes('PCV20')))).toBe(true);
    expect(r.recs.some((x) => x.vaccine === 'PPSV23')).toBe(true);
    // The five-year figure is the whole point of the IC half of the rule.
    expect(prose(r)).toContain('2nd PPSV23');
    expect(prose(r)).toMatch(/5 years|five years/);
  });

  it('is cited to a sentence about ITS OWN history, not a different one', () => {
    // Found by driving the app, NOT by a test. The first version of this fix
    // stopped saying "complete" and let these children fall through to the
    // "PCV13 only at or after age 6 years" row, whose quote is a true sentence
    // about the OPPOSITE history — this child's PCV15 was at 3y11m. The advice
    // was right and the citation described somebody else.
    //
    // Neither corpus can see this: both record `status` and `brands`, not
    // prose, so the wrong quote moved zero corpus lines. Hence this assertion.
    const r = run({ ...history, riskIds: IC_RISK });
    const quotes = r.recs.flatMap((x) => (x.noteCites ?? []).map((c) => c.quote ?? ''));
    expect(quotes.join(' ')).not.toContain('at or after age 6 years');
    // The sentence that IS about this child.
    expect(quotes.join(' ')).toContain('before age 6 years, never received PCV20');
    const details = r.recs.map((x) => (typeof x.note === 'object' ? x.note?.detail : '')).join(' ');
    expect(details).not.toContain('PCV13 given at or after age 6');
  });

  it('the NON-IC twin of the same patient IS complete — p2016 footnote §', () => {
    const r = run({ ...history, riskIds: NON_IC_RISK });
    expect(r.recs.some((x) => x.status === 'complete')).toBe(true);
    // Guard against "fixing" this by making everybody incomplete.
    expect(r.recs.some((x) => x.status === 'risk-based')).toBe(false);
  });
});

describe('IC-2 — an IC child 24–71mo whose at-risk catch-up is done, PPSV23 given', () => {
  // Age 5; three PCV13 doses given at >=24 months; PPSV23 five years ago.
  // Born 2021-10-17, so 5 today. Three PCV13 doses at ages ~52, 54 and 56
  // months — all at >=24 months, so the at-risk catch-up is done. PPSV23 at age
  // ~29 months, comfortably past its 2-year minimum age.
  const history = {
    dob: '2021-10-17', ageMonths: 60,
    pcv: [['PCV13', '2026-03-01'], ['PCV13', '2026-04-26'], ['PCV13', '2026-06-21']],
    ppsv: ['2024-04-01'],
  };

  it('is NOT told the catch-up is complete', () => {
    const r = run({ ...history, riskIds: IC_RISK });
    expect(labels(r)).not.toContain('PCV complete (at-risk catch-up done)');
    expect(r.recs.some((x) => x.status === 'complete')).toBe(false);
  });

  it('is offered PCV20, or a 2nd PPSV23 ≥5 years after the first', () => {
    const r = run({ ...history, riskIds: IC_RISK });
    expect(r.recs.some((x) => x.vaccine === 'PPSV23')).toBe(true);
    expect(prose(r)).toMatch(/5 years|five years/);
    // The 2nd PPSV23 is dated, not due today — the first was only ~2.5 years
    // ago. Naming it with a future date is the point: the card has to say the
    // series continues, without pretending the dose can be given now.
    const second = r.recs.find((x) => x.vaccine === 'PPSV23');
    expect(second.dueToday).toBe(false);
    expect(second.earliestNextDate).toBe('2029-04-01');
  });

  it('the NON-IC twin with PPSV23 already given IS complete', () => {
    const r = run({ ...history, riskIds: NON_IC_RISK });
    expect(r.recs.some((x) => x.status === 'complete')).toBe(true);
  });
});

describe('IC-3 — an at-risk child 24–71mo, catch-up done, NO PPSV23 and no PCV20', () => {
  // CDC gives this child "1 dose PCV20 or 1 dose PPSV23" regardless of class.
  const history = {
    dob: '2021-10-17', ageMonths: 60,
    pcv: [['PCV13', '2026-03-01'], ['PCV13', '2026-04-26'], ['PCV13', '2026-06-21']],
    ppsv: [],
  };

  it.each([['IC', IC_RISK], ['non-IC', NON_IC_RISK]])(
    'is not told complete (%s) — a PCV20 or a PPSV23 is still owed',
    (_class, riskIds) => {
      const r = run({ ...history, riskIds });
      expect(labels(r)).not.toContain('PCV complete (at-risk catch-up done)');
      expect(r.recs.some((x) => x.status === 'complete')).toBe(false);
      // Both options CDC names must be reachable.
      expect(r.recs.some((x) => (x.brands ?? []).some((b) => String(b).includes('PCV20')))).toBe(true);
      expect(r.recs.some((x) => x.vaccine === 'PPSV23')).toBe(true);
    },
  );
});

describe('the fix does not make every IC child incomplete', () => {
  // THE CONTROL THAT BOUNDS THE FIX. CDC and p2016 give an IC child ONE dose
  // after the PPSV23 — "(a) give one dose of PCV20 ... or (b) give a second
  // dose of PPSV23 five years after the first dose of PPSV23" — so once that
  // second dose exists the child IS complete. Without this test, a fix reading
  // "IC is never complete" would pass every assertion above.
  //
  // This is also the shape of the real patient in
  // `late-and-ambiguous-window.test.js`: 18y9m, sickle cell, PCV13 at 2y10m,
  // THREE PPSV23 doses, correctly complete. The first draft of this fix wrote
  // `&& !isIC` and broke that patient, which is how the predicate
  // `pedsPostSeriesDoseDone` came to exist.
  //
  // Born 2008-10-17, so 18 today — old enough for two PPSV23 doses to be five
  // years apart, which a 6-year-old never is.
  const history = {
    dob: '2008-10-17', ageMonths: 216,
    pcv: [['PCV13', '2013-10-11']],      // age ~4y11m, before 6
    ppsv: ['2014-10-11', '2024-10-11'],  // age ~6 and ~16: two doses, 10y apart
  };

  it('an IC child whose 2nd PPSV23 is already given IS complete', () => {
    const r = run({ ...history, riskIds: IC_RISK });
    expect(r.recs.some((x) => x.status === 'complete')).toBe(true);
    expect(r.recs.some((x) => x.status === 'risk-based')).toBe(false);
  });

  it('the same child with only ONE PPSV23 is not', () => {
    const r = run({ ...history, ppsv: ['2014-10-11'], riskIds: IC_RISK });
    expect(r.recs.some((x) => x.status === 'complete')).toBe(false);
  });

  it('a non-IC child needs only the one PPSV23', () => {
    const r = run({ ...history, ppsv: ['2014-10-11'], riskIds: NON_IC_RISK });
    expect(r.recs.some((x) => x.status === 'complete')).toBe(true);
  });
});

describe('the fix does not make a PCV20 history incomplete', () => {
  // Table 4, "2 through 18 years (any risk condition) / Completed PCV series
  // before age 6 years, including one or more doses of PCV20" -> "No additional
  // doses". True for BOTH classes, and it must stay true.
  const history = {
    dob: '2020-10-17', ageMonths: 72,
    pcv: [['PCV15', '2023-10-11'], ['PCV20', '2024-10-11']],
    ppsv: ['2025-10-11'],
  };

  it.each([['IC', IC_RISK], ['non-IC', NON_IC_RISK]])(
    'a child with a counting PCV20 stays complete (%s)',
    (_class, riskIds) => {
      const r = run({ ...history, riskIds });
      expect(r.recs.some((x) => x.status === 'complete')).toBe(true);
      expect(r.recs.some((x) => x.status === 'risk-based')).toBe(false);
    },
  );
});
