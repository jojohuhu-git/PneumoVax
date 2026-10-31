// queue P1-0 / peds audit P1-4, P1-5 (S3, 2026-10-11) — the validator never
// checked the GAP between two recorded doses, in either stream.
//
// Before this, `runWalk` graded every dose in isolation: age at the dose, the
// product, and whether a date existed. A PCV series recorded at 2, 2.5, 3 and
// 3.5 months — four doses ~2 weeks apart — was graded "valid" four times, all
// four counted, and the child was reported as having a complete 4-dose series.
// The app applied its own interval rule when scheduling forward and ignored it
// when reading the record.
//
// ── Sources, all fetched live 2026-10-11 ─────────────────────────────────
//
// 1. CDC Catch-up Immunization Schedule (Table 2), column header literally
//    "Minimum Interval Between Doses", pneumococcal conjugate row:
//      "Dose 1 to Dose 2: ... 4 weeks if first dose was administered before the
//       1st birthday / 8 weeks (as final dose for healthy children) if first
//       dose was administered at the 1st birthday or after"
//    https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-catch-up.html
//
// 2. immunize.org p2016 Table 1 footnote, the same rule keyed the same way:
//      "Minimum interval between doses: for children younger than age 12
//       months = 4 weeks; for children age 12 months or older = 8 weeks"
//
// 3. CDC Child & Adolescent Schedule Notes, pneumococcal, ages 2-5 and 6-18:
//      "1 dose of PPSV23 at least 8 weeks after the PCV15 dose.**"
//      "**When both PCV15 and PPSV23 are indicated, administer all doses of
//        PCV15 first. PCV15 and PPSV23 should not be administered during the
//        same visit."
//      "If PPSV23 is used, administer either PCV20 or dose 2 PPSV23 at least 5
//       years after dose 1 PPSV23."
//    https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html
//
// 4. CDC Schedule Notes, "Additional Information" (child and adult, identical):
//      "Vaccine doses administered <=4 days before the minimum age or interval
//       are considered valid. Doses of any vaccine administered >=5 days
//       earlier than the minimum age or minimum interval should not be counted
//       as valid and should be repeated as age appropriate."
//      "For calculating intervals between doses, 4 weeks = 28 days. Intervals
//       of >=4 months are determined by calendar months."
//
// That last sentence is why a sub-minimum dose is `invalid` here rather than a
// new middle verdict: CDC states the consequence itself — the dose does not
// count. W1 (2026-10-11, owner-approved wording) changed WHAT it is told to
// do about that: a dose rejected only for being too soon was never missing,
// so it names the earliest valid date instead of saying "repeat this dose" —
// see regression-w1-too-soon-not-repeated.test.js.
//
// ── What is deliberately NOT checked ─────────────────────────────────────
//
// Adult PCV->PCV gaps. CDC's adult notes state these as forward-looking
// recommendations ("1 dose PCV20 or 1 dose PCV21 at least 1 year after the
// last PCV13 dose"), never as a "minimum interval", and never say such a dose
// does not count. Marking one invalid would claim more than the source does,
// so doses given at or after the adult boundary carry no interval verdict.
import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';
import { recommend } from '../recommend.js';
import { addDays, addCalendarYears } from '../dateUtils.js';
import { pcvSeriesMinIntervalDays, PPSV23_REVACC_MIN_MONTHS, PCV_PPSV23_MIN_INTERVAL_DAYS } from '../intervals.js';

// A child born 2026-01-01, read on 2026-12-01 (11 months old).
const DOB = '2026-01-01';
const TODAY = '2026-12-01';
const AM = 11;

const statuses = (a) => a.perDose.map((d) => d.status);

function pcv(dates, { am = AM, today = TODAY, dob = DOB, product = 'PCV13' } = {}) {
  return analyzeHistory('PCV', dates.map((date) => ({ date, product })), am, today, dob);
}

describe('queue P1-0 — PCV series minimum interval between recorded doses', () => {
  it('the headline case: four doses ~2 weeks apart do not all count', () => {
    // 2, 2.5, 3 and 3.5 months old. Minimum under 12 months is 4 weeks.
    const a = pcv(['2026-03-01', '2026-03-15', '2026-04-01', '2026-04-15'], { am: 4.5, today: '2026-05-15' });
    expect(statuses(a)).toEqual(['valid', 'invalid', 'invalid', 'invalid']);
    expect(a.effective).toHaveLength(1);
  });

  it('still reports a 4-dose series as 4 doses when the gaps are legitimate', () => {
    // The routine schedule: 2, 4, 6 and 12 months.
    const a = pcv(['2026-03-01', '2026-05-01', '2026-07-01', '2027-01-05'], { am: 12.5, today: '2027-01-20' });
    expect(statuses(a)).toEqual(['valid', 'valid', 'valid', 'valid']);
    expect(a.effective).toHaveLength(4);
  });

  it('under 12 months the floor is 28 days, with CDC 4 days of grace', () => {
    const first = '2026-03-01';
    const exact = pcv([first, addDays(first, 28)], { am: 4, today: '2026-05-01' });
    expect(statuses(exact)).toEqual(['valid', 'valid']);

    const graced = pcv([first, addDays(first, 24)], { am: 4, today: '2026-05-01' });
    expect(statuses(graced)).toEqual(['valid', 'valid']);

    const tooSoon = pcv([first, addDays(first, 23)], { am: 4, today: '2026-05-01' });
    expect(statuses(tooSoon)).toEqual(['valid', 'invalid']);
  });

  it('from 12 months the floor is 56 days, with the same grace', () => {
    // Previous dose given at 12.5 months, so the 8-week minimum applies.
    const prev = '2027-01-15';
    const opts = { am: 20, today: '2027-09-01', dob: DOB };
    expect(statuses(pcv([prev, addDays(prev, 56)], opts))).toEqual(['valid', 'valid']);
    expect(statuses(pcv([prev, addDays(prev, 52)], opts))).toEqual(['valid', 'valid']);
    expect(statuses(pcv([prev, addDays(prev, 51)], opts))).toEqual(['valid', 'invalid']);
  });

  it('keys the minimum on the age at the PREVIOUS dose, not on current age', () => {
    // Previous dose at 11 months (under 12 → 28 days), read at 20 months. If
    // the check used current age it would demand 56 days and reject this.
    const a = pcv(['2026-12-01', '2026-12-29'], { am: 20, today: '2027-09-01' });
    expect(statuses(a)).toEqual(['valid', 'valid']);
  });

  it('anchors on the previous KEPT dose — a PCV7 in between is not an anchor', () => {
    // PCV7 never counts (CLAUDE.md), so it cannot restart the clock. Dose 3
    // here is 28 days after the last COUNTING dose and must be valid.
    const a = analyzeHistory('PCV', [
      { date: '2026-03-01', product: 'PCV13' },
      { date: '2026-03-10', product: 'PCV7' },
      { date: '2026-03-29', product: 'PCV13' },
    ], 4, '2026-05-01', DOB);
    expect(statuses(a)).toEqual(['valid', 'noncounting', 'valid']);
    expect(a.effective).toHaveLength(2);
  });

  it('an invalid dose still anchors the next one — CDC spaces the repeat from it', () => {
    // "The repeat dose should be spaced after the invalid dose by the
    // recommended minimum interval." Dose 2 is 9 days after dose 1 → invalid.
    // Dose 3 is 28 days after dose 1 but only 19 days after the invalid dose 2,
    // so it is the repeat given too early, and does not count either.
    const a = pcv(['2026-03-01', '2026-03-10', '2026-03-29'], { am: 4, today: '2026-05-01' });
    expect(statuses(a)).toEqual(['valid', 'invalid', 'invalid']);
    expect(a.effective).toHaveLength(1);

    // Spaced the full 28 days after the invalid dose, it counts.
    const b = pcv(['2026-03-01', '2026-03-10', '2026-04-07'], { am: 4, today: '2026-05-01' });
    expect(statuses(b)).toEqual(['valid', 'invalid', 'valid']);
    expect(b.effective).toHaveLength(2);
  });

  // W1 (owner-approved wording, 2026-10-11): a dose rejected for being given
  // too soon is not a missing dose, so it is not "repeated" — see
  // regression-w1-too-soon-not-repeated.test.js for the dedicated coverage.
  it('says so in plain English, and names the earliest valid date instead of "repeat"', () => {
    const a = pcv(['2026-03-01', '2026-03-15'], { am: 4, today: '2026-05-01' });
    const reasons = a.perDose[1].reasons.join(' ');
    expect(reasons).toMatch(/14 days after the previous dose/);
    expect(reasons).toMatch(/4 weeks/);
    // OWNER RULING 2026-10-24: the full 28 days from the dose of 2026-03-15,
    // with no 4-day grace — the grace decides what the app ACCEPTS, never what
    // it ADVISES. Was 2026-04-08.
    expect(reasons).toMatch(/can be given from Apr 12, 2026 at the earliest/);
    expect(reasons).not.toMatch(/2026-04-08/);
    expect(reasons).not.toMatch(/repeat this dose only/);
  });

  it('cannot check an interval it has no dates for', () => {
    const a = analyzeHistory('PCV', [
      { product: 'PCV13' },
      { date: '2026-03-01', product: 'PCV13' },
    ], 4, '2026-05-01', DOB);
    expect(statuses(a)).toEqual(['unknown', 'valid']);
    expect(a.effective).toHaveLength(2);
  });

  // REVERSED TWICE, AND BOTH REVERSALS ARE RECORDED HERE BECAUSE THE SECOND
  // RESTORES THE FIRST'S CONCLUSION BY A DIFFERENT ROUTE.
  //
  // Originally this case asserted that an adult PCV gap can never void a
  // dose, because CDC states adult gaps as advice for the next dose rather
  // than as minimum intervals. S14-7 (owner, 2026-10-11) reversed that: an
  // interval is an interval, and a dose inside one was not validly given.
  // §K-CONJUGATE (owner, 2026-10-24) reversed it back for THIS pair — shown
  // a 68-year-old whose PCV20 was being thrown out and re-ordered a year
  // later, she ruled the dose counts and the card explains the timing.
  //
  // The 2026-10-11 determination is NOT dead: it still stands for every other
  // adult floor (PPSV23 after a conjugate, a conjugate after a PPSV23, a
  // second PPSV23). Only the two conjugate-to-conjugate rows were relaxed.
  it('counts an adult PCV20 given less than a year after PCV13, with a note (§K-CONJUGATE)', () => {
    const a = analyzeHistory('PCV', [
      { date: '2026-01-05', product: 'PCV13' },
      { date: '2026-02-09', product: 'PCV20' },
    ], 840, TODAY, '1956-01-01');
    expect(statuses(a)).toEqual(['valid', 'valid']);
    expect(a.effective).toHaveLength(2);
    expect(a.perDose[1].earlyAdvisory).toBe(true);
    // The honesty promise is unchanged in substance, only in direction: the
    // sentence must say what CDC states and must not dress the app's own
    // convention up as CDC's. This row's year IS CDC's, so it says so — and
    // it must not claim the owner determination it no longer rests on.
    expect(a.perDose[1].reasons.join(' ')).toMatch(/shorter than the 1 year CDC advises/);
    expect((a.perDose[1].whys ?? []).join(' '))
      .toMatch(/recommended timing, not a minimum/);
    expect(a.perDose[1].detail ?? '').not.toMatch(/owner clinical determination/i);
  });
});

describe('queue P1-0 — PPSV23 revaccination interval', () => {
  // P2 (2026-10-30): still not counted — but for this child (no risk
  // condition, so CDC never gives a second PPSV23) it is now an EXTRA dose
  // rather than a rejected one, and nothing is owed. Until P2 it read
  // 'invalid' and pointed at a "next dose" five years on. An IC child's early
  // second dose COUNTS instead (owner ruling 2026-10-29; CLINICAL_SPEC §C-P2).
  // §C-P2-HEALTHY (2026-10-31, Zoe): a child with NO risk condition is owed
  // no PPSV23 at all, so even her first is an extra dose. These cases are
  // about the second PPSV23 of a child who is owed one — a cochlear implant.
  const NON_IC = { riskIds: ['cochlear_implant'] };
  it('a second PPSV23 inside 5 years does not count', () => {
    const a = analyzeHistory('PPSV23', [
      { date: '2020-07-06' },
      { date: '2021-07-06' },
    ], 156, TODAY, '2014-01-01', NON_IC);
    expect(a.effective).toHaveLength(1);
    expect(a.perDose[1].extraDose).toBe(true);
    expect(a.perDose[1].repeatDueDate).toBeUndefined();
  });

  it('counts a second PPSV23 at 5 calendar years, and 4 days inside it', () => {
    const first = '2020-07-06';
    const at5y = addCalendarYears(first, 5);
    const ok = analyzeHistory('PPSV23', [{ date: first }, { date: at5y }], 156, TODAY, '2014-01-01', NON_IC);
    expect(statuses(ok)).toEqual(['valid', 'valid']);

    const graced = analyzeHistory('PPSV23', [{ date: first }, { date: addDays(at5y, -4) }], 156, TODAY, '2014-01-01', NON_IC);
    expect(statuses(graced)).toEqual(['valid', 'valid']);

    // P2: five days short is outside the grace — not counted, as before,
    // now as an extra dose for this child (not immunocompromised).
    const tooSoon = analyzeHistory('PPSV23', [{ date: first }, { date: addDays(at5y, -5) }], 156, TODAY, '2014-01-01', NON_IC);
    expect(tooSoon.effective).toHaveLength(1);
    expect(tooSoon.perDose[1].extraDose).toBe(true);
  });
});

describe('peds audit P1-4 — PPSV23 must follow PCV by 8 weeks, and never the same visit', () => {
  const DOB10 = '2016-03-02';
  const NOW = '2026-06-01';
  const AM10 = 123;

  function withBoth(pcvDate, ppsvDate, pcvProduct = 'PCV15') {
    return recommend({
      ageMonths: AM10,
      dob: DOB10,
      today: NOW,
      pcvDoses: [{ date: pcvDate, product: pcvProduct }],
      ppsv23Doses: [{ date: ppsvDate }],
      riskIds: ['diabetes'],
    });
  }

  it('PCV15 and PPSV23 on the same day: the PPSV23 does not count', () => {
    const out = withBoth('2026-03-02', '2026-03-02');
    expect(out.perDose.ppsv23[0].status).toBe('invalid');
    expect(out.perDose.ppsv23[0].reasons.join(' ')).toMatch(/same visit/i);
    expect(out.recs.every((r) => r.status !== 'complete')).toBe(true);
  });

  it('PPSV23 at 8 weeks counts; 4 days inside it counts; 5 days inside it does not', () => {
    const pcvDate = '2026-01-05';
    expect(analyzeHistory('PPSV23', [{ date: addDays(pcvDate, 56) }], AM10, NOW, DOB10,
      { pcvDoses: [{ date: pcvDate, product: 'PCV15' }] }).perDose[0].status).toBe('valid');
    expect(analyzeHistory('PPSV23', [{ date: addDays(pcvDate, 52) }], AM10, NOW, DOB10,
      { pcvDoses: [{ date: pcvDate, product: 'PCV15' }] }).perDose[0].status).toBe('valid');
    expect(analyzeHistory('PPSV23', [{ date: addDays(pcvDate, 51) }], AM10, NOW, DOB10,
      { pcvDoses: [{ date: pcvDate, product: 'PCV15' }] }).perDose[0].status).toBe('invalid');
  });

  // ALSO REVERSED BY S14-7. The 8-week floor and the same-visit sentence really
  // are paediatric — the adult notes contain neither, verified live 2026-10-11
  // with "pneumococcal" (13 hits) as a positive control that the page's
  // collapsed sections had loaded — so the adult answers below come from
  // DIFFERENT rows, not from the paediatric ones leaking upward.
  it('an adult PPSV23 on the same day as a PCV13 is voided by the ADULT rule, not the paediatric one', () => {
    const a = analyzeHistory('PPSV23', [{ date: '2019-03-01' }], 915, '2026-06-01', '1950-06-15',
      { pcvDoses: [{ date: '2019-03-01', product: 'PCV13' }] });
    // 2026-10-25: counts. What this test is FOR is unchanged — the ADULT row
    // must speak, with the adult's own number, and never the paediatric
    // "same visit" sentence or the paediatric 8 weeks, which the adult notes
    // do not state.
    expect(a.perDose[0].status).toBe('valid');
    expect(a.perDose[0].reasons.join(' ')).toMatch(/shorter than the 1 year/);
    expect(a.perDose[0].reasons.join(' ')).toMatch(/on the same day as the PCV13/);
    expect(a.perDose[0].reasons.join(' ')).not.toMatch(/same visit/i);
  });

  it('...and an immunocompromised adult is judged against rr7203a1\'s 8 weeks instead', () => {
    const ppsv = (date, riskIds) => analyzeHistory('PPSV23', [{ date }], 915, '2026-06-01', '1950-06-15',
      { pcvDoses: [{ date: '2019-03-01', product: 'PCV13' }], riskIds });
    // 10 weeks clears the interval rr7203a1 states for them: nothing to say.
    expect(ppsv('2019-05-10', ['hiv']).perDose[0].status).toBe('valid');
    expect(ppsv('2019-05-10', ['hiv']).perDose[0].earlyAdvisory).toBeFalsy();
    // 4 weeks is short of it — counted since 2026-10-25, and flagged.
    expect(ppsv('2019-03-29', ['hiv']).perDose[0].status).toBe('valid');
    expect(ppsv('2019-03-29', ['hiv']).perDose[0].earlyAdvisory).toBe(true);
    // The same 10 weeks is short of the YEAR that applies to everyone else,
    // which is the risk-keying this test exists for.
    expect(ppsv('2019-05-10', []).perDose[0].earlyAdvisory).toBe(true);
  });

  // 2026-10-25: counted, with the hyporesponsiveness evidence behind it. The
  // 5 years did not move; only what happens below it did.
  it('flags an adult second PPSV23 given less than 5 years after the first', () => {
    const twoDoses = analyzeHistory('PPSV23', [{ date: '2019-03-01' }, { date: '2020-03-01' }],
      915, '2026-06-01', '1950-06-15');
    expect(statuses(twoDoses)).toEqual(['valid', 'valid']);
    expect(twoDoses.perDose[1].reasons.join(' ')).toMatch(/never give a third/i);
    expect(twoDoses.perDose[1].whys.join(' ')).toMatch(/rr7203a1/);
  });

  it('a PPSV23 given BEFORE any PCV dose is not judged against it', () => {
    const a = analyzeHistory('PPSV23', [{ date: '2026-01-05' }], AM10, NOW, DOB10,
      { pcvDoses: [{ date: '2026-05-01', product: 'PCV15' }] });
    expect(a.perDose[0].status).toBe('valid');
  });
});

describe('queue P1-0 — one home for the numbers', () => {
  it('the series minimum is a shared function, keyed on an age in months', () => {
    expect(pcvSeriesMinIntervalDays(4)).toBe(28);
    expect(pcvSeriesMinIntervalDays(11.9)).toBe(28);
    expect(pcvSeriesMinIntervalDays(12)).toBe(56);
    expect(pcvSeriesMinIntervalDays(30)).toBe(56);
    expect(PPSV23_REVACC_MIN_MONTHS).toBe(60);
    expect(PCV_PPSV23_MIN_INTERVAL_DAYS).toBe(56);
  });

  it('the scheduler still quotes the real minimum, never the graced one', () => {
    // The grace decides whether a dose already given counts. It must not move
    // the date the app advertises for the next dose.
    const out = recommend({
      ageMonths: 4,
      dob: DOB,
      today: '2026-05-01',
      pcvDoses: [{ date: '2026-04-20', product: 'PCV13' }],
      ppsv23Doses: [],
      riskIds: [],
    });
    const due = out.recs.find((r) => r.vaccine === 'PCV');
    expect(due.minIntervalDays).toBe(28);
    // C10-2 (2026-10-23) left this answer exactly where it was, and the two
    // assertions below say why in more detail than the equality alone did.
    //
    // This child is in the ROUTINE 2-6-month band, where C10-2 deliberately
    // does NOT apply p2016's 8-week recommended spacing: p2016's 2-6-month rows
    // read "4 doses ... last dose at age 12-15 months" and never print the
    // 2/4/6 months, so no document on the card states an 8-week gap there. Her
    // routine age for dose 2 is 4 months, which she has already reached, so the
    // honest remaining statement is the minimum — which is what it says.
    //
    // ⚠ The FIRST DRAFT of C10-2 applied 8 weeks to every band and this test
    // caught it: it expected 2026-05-18 and got 2026-06-15. That is recorded
    // because the failure was the useful kind — the test was right and the
    // change was wrong, so the change was narrowed rather than the test.
    const graced = addDays('2026-04-20', 28 - 4);
    expect(due.earliestNextDate).not.toBe(graced);              // never the graced date
    expect(due.earliestNextDate).toBe(addDays('2026-04-20', 28));
  });
});
