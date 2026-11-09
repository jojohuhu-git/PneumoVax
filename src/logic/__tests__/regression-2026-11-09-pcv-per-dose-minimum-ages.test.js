// ── §A-DOSEAGE: each PCV dose has its own minimum age — 6, 10 and 14 weeks
//    (OWNER RULING 2026-11-08, CDSI finding 3, "Leo") ─────────────────────
//
// Leo, born 2026-06-01: PCV15 at 38 days (6 weeks less 4 days, counted by the
// grace), PCV20 at 65 days, 27 days later (4 weeks less 1 day, counted by the
// grace). The app counted both. ACIP gives dose 2 its own minimum age, 10
// weeks (70 days; 66 with the grace), so the 4-day grace cannot be used twice
// in a row to bring dose 2 in under it. Owner: "Use ACIP's per-dose minimum
// ages … Leo's dose 2 does not count; repeat ≥4 weeks after it (Ruling D)."
//
// ACIP General Best Practices, Table 3-2 (read live 2026-11-09):
//   "PCV13-1 2 months 6 weeks 8 weeks 4 weeks"
//   "PCV13-2 4 months 10 weeks 8 weeks 4 weeks"
//   "PCV13-3 6 months 14 weeks 6 months 8 weeks"
//   "PCV13-4 12-15 months 12 months"
//   PCV15 and PCV20: "See footnote x below".
// Dose 4's 12 months is unchanged: a 4th dose before the first birthday is an
// extra infant dose (owner ruling 2026-10-23).

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const DOB = '2026-06-01';      // 6 weeks = Jul 13; 10 weeks = Aug 10; 14 weeks = Sep 7
const run = (doses, today) => recommend({
  dob: DOB, today, riskIds: [],
  pcvDoses: doses.map(([date, product = 'PCV20']) => ({ date, product })),
  ppsv23Doses: [],
});
const statuses = (r) => r.perDose.pcv.map((v) => v.status);
const card = (r) => r.recs.find((x) => x.vaccine === 'PCV');

describe('Leo, the patient she was shown', () => {
  const leo = (today = '2026-08-20') => run([['2026-07-09', 'PCV15'], ['2026-08-05', 'PCV20']], today);

  it('dose 2 at 65 days, under the 10-week minimum even with the grace, does not count', () => {
    expect(statuses(leo())).toEqual(['valid', 'invalid']);
  });

  it('…and is to be repeated: its line names the 10 weeks and the date 4 weeks after it', () => {
    const chip = leo().perDose.pcv[1];
    expect(chip.reasons.join(' ')).toMatch(/10 weeks minimum age for a 2nd PCV dose/);
    expect(chip.reasons.join(' ')).toContain('Sep 2, 2026');
  });

  it('the card still asks for dose 2 of 4, and measures its minimum from the dose given (Ruling D)', () => {
    const c = card(leo());
    expect(c.doseLabel).toBe('PCV dose 2 of 4');
    expect(c.note.lead + (c.note.detail ?? '')).toContain('Sep 2, 2026');
  });

  it('a repeat 4 weeks after the thrown-out dose counts, and the series reads on as normal', () => {
    const r = run([['2026-07-09', 'PCV15'], ['2026-08-05', 'PCV20'], ['2026-09-02', 'PCV20']], '2026-09-10');
    expect(statuses(r)).toEqual(['valid', 'invalid', 'valid']);
    expect(card(r).doseLabel).toBe('PCV dose 3 of 4');
  });
});

describe('the 4-day grace applies to each dose\'s own minimum age', () => {
  it('dose 2 at 66 days (10 weeks less 4) counts', () => {
    expect(statuses(run([['2026-07-09'], ['2026-08-06']], '2026-08-20'))).toEqual(['valid', 'valid']);
  });

  it('dose 3 at 93 days (14 weeks less 5) does not; at 94 days it does', () => {
    expect(statuses(run([['2026-07-09'], ['2026-08-06'], ['2026-09-02']], '2026-09-10'))).toEqual(['valid', 'valid', 'invalid']);
    expect(statuses(run([['2026-07-09'], ['2026-08-06'], ['2026-09-03']], '2026-09-10'))).toEqual(['valid', 'valid', 'valid']);
  });
});

describe('the card never offers a date before the next dose\'s own minimum age', () => {
  it('dose 1 at 38 days, seen at 67 days: dose 2 can be given from 10 weeks, not 4 weeks after dose 1', () => {
    const c = card(run([['2026-07-09']], '2026-08-07'));
    const words = c.note.lead + (c.note.detail ?? '');
    expect(words).toContain('Aug 10, 2026');
    expect(words).not.toContain('Aug 6, 2026');
    expect(words).toMatch(/minimum age of 10 weeks/);
  });

  it('…and once 10 weeks has passed it can be given today', () => {
    const c = card(run([['2026-07-09']], '2026-08-12'));
    expect(c.note.lead + (c.note.detail ?? '')).toMatch(/can be given today/);
  });
});

describe('what does not move', () => {
  it('an on-time baby (2, 4, 6 months) is untouched', () => {
    expect(statuses(run([['2026-08-01'], ['2026-10-01'], ['2026-12-01']], '2027-01-01'))).toEqual(['valid', 'valid', 'valid']);
  });

  it('a 4th dose before 12 months is still an extra infant dose, not thrown out (ruling 2026-10-23)', () => {
    const r = run([['2026-07-13'], ['2026-08-10'], ['2026-09-07'], ['2026-10-05']], '2026-10-20');
    expect(r.perDose.pcv[3].status).toBe('valid');
  });
});
