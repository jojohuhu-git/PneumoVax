/**
 * P2-2 (R3), OWNER RULING 2026-11-06: an infant's advised date does not move
 * when the child turns 7 months.
 *
 * Remy, born May 6, 2026, HIV, PCV20 on Nov 6 and Dec 4. The app read the
 * child's age on the day of the visit. On Dec 4, under 7 months, no p2016 row
 * applied and the card said Jan 1. On Jan 1, over 7 months, the row applied and
 * the same card said Jan 29.
 *
 * Asked which date the Dec 4 card should give, she chose: advise Jan 29, and say
 * Jan 1 counts. Her 2026-10-23 rulings already set the two numbers: advise
 * p2016's spacing, accept CDC's minimum. This only stops the age on the visit
 * day choosing between them when the dose itself falls at 7 months or later.
 *
 * RULING C still holds: what COUNTS does not move. Only the advice does.
 */
import { describe, it, expect } from 'vitest';
import { recommendBeforeFold as recommend } from '../recommend.js';

const DOB = '2026-05-06';
const PCV20 = (dates) => dates.map((date) => ({ product: 'PCV20', date }));
const run = (today, dates, riskIds = ['hiv'], dob = DOB) => recommend({ today, dob, riskIds, pcvDoses: PCV20(dates), ppsv23Doses: [] });
const card = (r) => r.recs.find((c) => c.vaccine === 'PCV');
const keys = (c) => (c.noteCites ?? []).map((x) => x.key);

describe('Remy: one advised date, and the earliest date beside it', () => {
  it('on Dec 4 the card advises Jan 29 and says Jan 1 counts', () => {
    const c = card(run('2026-12-04', ['2026-11-06', '2026-12-04']));
    expect(c.earliestNextDate).toBe('2027-01-29');
    expect(c.note.detail).toContain('The next dose is due 8 weeks after the most recent one');
    expect(c.note.detail).toContain('it can be given from Jan 1, 2027 if needed, which is the minimum interval of 4 weeks');
  });

  it('the Dec 4 card cites the two documents that state the two numbers', () => {
    const c = card(run('2026-12-04', ['2026-11-06', '2026-12-04']));
    expect(keys(c)).toContain('p2016Table1_7to11_oneOrTwoBefore7');
    expect(keys(c)).toContain('cdcCatchupDose2to3FourWeeks');
  });

  it('on Jan 1 the date is the same, and it can be given today', () => {
    const c = card(run('2027-01-01', ['2026-11-06', '2026-12-04']));
    expect(c.earliestNextDate).toBe('2027-01-29');
    expect(c.note.detail).toContain('it can be given today if needed, as the minimum interval of 4 weeks has already passed');
  });

  it('a dose given Jan 1 still counts: the minimum did not move', () => {
    const r = run('2027-01-02', ['2026-11-06', '2026-12-04', '2027-01-01']);
    expect(r.perDose.pcv[2].status).toBe('valid');
  });

  it('no date of birth on file: "6 months" is read as exactly 6, so 4 weeks stays under 7', () => {
    const r = recommend({ today: '2026-12-04', ageMonths: 6, riskIds: ['hiv'], pcvDoses: PCV20(['2026-11-06', '2026-12-04']), ppsv23Doses: [] });
    expect(card(r).earliestNextDate).toBe('2027-01-01');
  });
});

describe('the controls: nothing else moves', () => {
  it('the minimum falls before 7 months: the routine band still gives the minimum', () => {
    // Dose 2 at 5 months, minimum at 6 months, before the line.
    const c = card(run('2026-10-06', ['2026-09-06', '2026-10-06']));
    expect(c.earliestNextDate).toBe('2026-11-06');
    expect(keys(c)).not.toContain('p2016Table1_7to11_oneOrTwoBefore7');
  });

  it('an on-time baby keeps the routine age, 6 months', () => {
    const c = card(run('2026-09-06', ['2026-07-06', '2026-09-06']));
    expect(c.earliestNextDate).toBe('2026-11-06');
    expect(c.note.detail).toContain('The next dose is due at age 6 months');
  });

  it('three doses before 7 months: the row says the last dose is at 12-15 months, so no spacing is added', () => {
    const c = card(run('2026-11-20', ['2026-07-06', '2026-08-06', '2026-11-20'], []));
    expect(c.doseLabel).toBe('PCV dose 4 of 4');
    expect(keys(c)).not.toContain('p2016Table1_7to11_oneOrTwoBefore7');
  });
});
