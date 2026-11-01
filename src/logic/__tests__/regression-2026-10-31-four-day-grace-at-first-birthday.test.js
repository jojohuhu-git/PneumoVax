// ── §A-GRACE12: a PCV dose given 1–4 days before the first birthday counts as
//    the 12-month dose (OWNER RULING 2026-10-31, on "Lily") ────────────────
//
// Lily, healthy: PCV20 at 2, 4 and 6 months, then her booster 2 days before
// her first birthday (the 12-month visit booked a little early). The app
// called it an extra infant dose and asked for a 5th PCV.
//
// ACIP General Best Practices, timing and spacing (read live 2026-10-31):
// "vaccine doses administered ≤4 days before the minimum interval or age are
// considered valid". CDSI v4.64 (CDC's own decision-support data) gives the
// booster an absolute minimum age of "12 months - 4 days", and the
// start-at-12-months series' first dose the same. Owner chose "Grace applies",
// including a first-ever dose. A dose 5+ days early is still an extra infant
// dose, and the booster is still owed — the 2026-10-23 ruling is unchanged.
//
// The grace decides what COUNTS, never what is ADVISED (owner, 2026-10-24):
// the app still advises the booster from the birthday itself.
//
// Measured: 0 of 17,016 grid verdicts (the grid never places a dose in those
// four days); 240 of 360 hand-built babies.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const DOB = '2025-01-15';           // first birthday 2026-01-15
const d = (dates, product = 'PCV20') => dates.map((date) => ({ product, date }));
const run = (pcv, today, riskIds = []) => recommend({ dob: DOB, today, riskIds, pcvDoses: d(pcv), ppsv23Doses: [] });
const labels = (r) => r.recs.map((x) => `${x.status}: ${x.doseLabel}`);
const BABY = ['2025-03-15', '2025-05-15', '2025-07-15'];

describe('Lily, the patient she was shown', () => {
  it('a booster 2 days before her first birthday completes her series', () => {
    expect(labels(run([...BABY, '2026-01-13'], '2026-01-13'))).toEqual(['complete: PCV series complete (4 doses)']);
  });

  it('reads the same when she comes back weeks later', () => {
    expect(labels(run([...BABY, '2026-01-13'], '2026-03-01'))).toEqual(['complete: PCV series complete (4 doses)']);
  });

  it('the grace reaches exactly 4 days: Jan 11 counts', () => {
    expect(labels(run([...BABY, '2026-01-11'], '2026-01-11'))).toEqual(['complete: PCV series complete (4 doses)']);
  });

  it('an at-risk baby reads the same', () => {
    expect(labels(run([...BABY, '2026-01-13'], '2026-01-13', ['asplenia']))[0]).toMatch(/^complete/);
  });
});

describe('the other children the same rule covers', () => {
  it('started at 7 months (doses at 7 and 9): a 3rd dose 2 days before age 1 completes the series', () => {
    expect(labels(run(['2025-08-15', '2025-10-15', '2026-01-13'], '2026-01-13'))).toEqual(['complete: PCV series complete (3 doses)']);
  });

  it('a first-ever PCV 2 days before age 1 is read as a first dose AT 12 months', () => {
    expect(labels(run(['2026-01-13'], '2026-01-13'))).toEqual(labels(run(['2026-01-15'], '2026-01-15')));
  });

  it('…and on that dose\'s own day (she is still 11 months old) the card reads as it will a week later', () => {
    const card = (today) => run(['2026-01-13'], today).recs[0];
    expect(card('2026-01-13').doseLabel).toBe(card('2026-01-20').doseLabel);
    expect(card('2026-01-13').earliestNextDate).toBe('2026-03-10'); // 8 weeks, not "wait for 12 months"
  });
});

// A dose in the window is the 12-month dose for EVERY purpose, its spacing
// included. The first version moved only the age bands, and a booster given
// 5 weeks after the previous dose read "complete" while the same dose ON the
// birthday was rejected for being under the booster's 8 weeks.
describe('a dose in the window is judged exactly as if given ON the birthday', () => {
  const shift = (iso, n) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);
  const verdicts = (dates) => {
    const r = run(dates, '2026-04-01');
    return [r.perDose.pcv.map((v) => v.status), labels(r)];
  };

  it('a booster 5 weeks after a 10-month dose does not count, in the window or on the birthday', () => {
    const early = ['2025-03-15', '2025-05-15', '2025-12-09'];
    expect(verdicts([...early, '2026-01-13'])[0]).toEqual(['valid', 'valid', 'valid', 'invalid']);
    expect(verdicts([...early, '2026-01-13'])[1]).toEqual(verdicts([...early, '2026-01-15'])[1]);
  });

  it('a first dose in the window then a second 5 or 8 weeks later reads as it would from the birthday', () => {
    for (const gap of [35, 56]) {
      expect(verdicts(['2026-01-13', shift('2026-01-13', gap)])).toEqual(verdicts(['2026-01-15', shift('2026-01-15', gap)]));
    }
  });
});

describe('what does not move', () => {
  it('a booster 5 days early is still an extra infant dose, and the booster is still owed', () => {
    const r = run([...BABY, '2026-01-10'], '2026-01-10');
    expect(r.recs.map((x) => x.status)).not.toContain('complete');
    expect(r.perDose.pcv[3].status).toBe('valid'); // kept as an extra dose, not thrown out
  });

  it('a booster a week early is still owed again', () => {
    expect(run([...BABY, '2026-01-08'], '2026-01-08').recs.map((x) => x.status)).not.toContain('complete');
  });

  it('the app still advises the booster from the birthday itself, never inside the grace', () => {
    const r = run(BABY, '2026-01-12');
    const card = r.recs.find((x) => x.vaccine === 'PCV');
    expect(card.dueToday).toBe(false);
    expect(card.note.lead).toContain('This final dose is not due until the patient reaches 12 months.');
  });
});
