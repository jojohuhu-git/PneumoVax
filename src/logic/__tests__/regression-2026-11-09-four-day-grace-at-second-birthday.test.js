// ── §A-GRACE24: a PCV dose given 1–4 days before the 2nd birthday counts as
//    given AT 24 months (OWNER RULING 2026-11-08, CDSI finding 4, "Mila") ──
//
// Mila, healthy, born 2024-08-09, had her first-ever PCV20 on 2026-08-05 —
// four days before she turned 2. The app read her as 23 months at that dose,
// put her on the under-2 catch-up and asked for a second dose. The same dose
// ON her birthday reads "complete". CDC's own test case 2013-0589 ("Dose 1 PCV
// 20 at 24 m-4 days. Series complete.") says she is done, and the owner ruled
// "Grace applies; she's done" — the 12-month ruling (§A-GRACE12, "Lily"),
// mirrored at the second birthday.
//
// Sources, read live 2026-11-09:
//   ACIP General Best Practices, timing and spacing: "vaccine doses
//   administered ≤4 days before the minimum interval or age are considered
//   valid".
//   CDC Catch-up Table 2 (addendum updated July 2, 2025), PCV dose 1→2: "No
//   further doses needed for healthy children if first dose was administered
//   at age 24 months or older".
//   CDSI 4.65 (local copy): "Target Dose not required if current dose was
//   administered on or after 24 months - 4 days of age."
//
// The grace decides what a dose given COUNTS as, never what is ADVISED
// (owner, 2026-10-24).

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { pcvAgeAtGraceLine } from '../intervals.js';

const DOB = '2024-08-09';           // 2nd birthday 2026-08-09
const run = (pcv, today, riskIds = []) => recommend({
  dob: DOB, today, riskIds,
  pcvDoses: pcv.map(([date, product = 'PCV20']) => ({ product, date })),
  ppsv23Doses: [],
});
const labels = (r) => r.recs.map((x) => `${x.status}: ${x.doseLabel}`);
const statuses = (r) => r.perDose.pcv.map((v) => v.status);

describe('Mila, the patient she was shown (CDSI 2013-0589)', () => {
  it('a first PCV20 4 days before age 2 completes her series', () => {
    expect(labels(run([['2026-08-05']], '2026-09-01'))).toEqual(['complete: PCV series complete']);
  });

  it('…and reads exactly as the same dose ON her birthday does', () => {
    expect(labels(run([['2026-08-05']], '2026-09-01'))).toEqual(labels(run([['2026-08-09']], '2026-09-01')));
  });

  it('…including on the dose\'s own day, when she is still 23 months old (CDSI\'s assessment date)', () => {
    expect(labels(run([['2026-08-05']], '2026-08-05'))).toEqual(['complete: PCV series complete']);
  });

  it('2 days early reads the same', () => {
    expect(labels(run([['2026-08-07']], '2026-08-07'))).toEqual(['complete: PCV series complete']);
  });
});

describe('the other children the same rule covers', () => {
  it('a PCV15 in the window reads as a PCV15 on the birthday', () => {
    expect(labels(run([['2026-08-06', 'PCV15']], '2026-09-01')))
      .toEqual(labels(run([['2026-08-09', 'PCV15']], '2026-09-01')));
  });

  it('one baby PCV13, then a dose in the window: done, as on the birthday', () => {
    const infant = ['2024-10-09', 'PCV13'];
    expect(labels(run([infant, ['2026-08-06']], '2026-09-01')))
      .toEqual(labels(run([infant, ['2026-08-09']], '2026-09-01')));
    expect(labels(run([infant, ['2026-08-06']], '2026-09-01'))[0]).toMatch(/^complete/);
  });

  it('an at-risk child: the dose counts toward the 2 doses given at 2 years or older', () => {
    expect(labels(run([['2026-08-06']], '2026-09-01', ['asplenia'])))
      .toEqual(labels(run([['2026-08-09']], '2026-09-01', ['asplenia'])));
  });

  it('a second dose 8 weeks after a dose in the window is judged as one after a birthday dose', () => {
    const shift = (iso, n) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);
    const r = (first) => run([[first], [shift(first, 56)]], '2026-11-01');
    expect(statuses(r('2026-08-06'))).toEqual(statuses(r('2026-08-09')));
    expect(labels(r('2026-08-06'))).toEqual(labels(r('2026-08-09')));
  });
});

// OWNER RULING 2026-11-09, "Only when it helps". Read as a dose ON the 2nd
// birthday, Rosa's PCV20 left "doses before 24 months" and she went from
// complete to owing a PCV. The grace is for a minimum age: it may add credit
// toward "given at 2 years or older", never take away "given before 2 years".
describe('Rosa: the grace never takes credit away', () => {
  const rosa = (pcv20Date, today = '2026-09-15', risk = ['asplenia'], product = 'PCV20') => run(
    [['2024-10-09', 'PCV13'], ['2024-12-09', 'PCV13'], [pcv20Date, product]], today, risk,
  );

  it('asplenia, PCV13 at 2 and 4 months, PCV20 2 days before age 2: still complete', () => {
    expect(labels(rosa('2026-08-07'))).toEqual(['complete: PCV complete (includes PCV20)']);
  });

  it('…reads exactly as the same PCV20 5 days early, where the grace does not reach', () => {
    expect(labels(rosa('2026-08-07'))).toEqual(labels(rosa('2026-08-04')));
  });

  it('…and complete on the dose\'s own day too', () => {
    expect(labels(rosa('2026-08-07', '2026-08-07'))[0]).toMatch(/^complete/);
  });

  it('with a PCV13 instead, both readings owe one dose, so nothing moves: the same card as 5 days early', () => {
    expect(labels(rosa('2026-08-07', '2026-09-15', ['asplenia'], 'PCV13')))
      .toEqual(labels(rosa('2026-08-04', '2026-09-15', ['asplenia'], 'PCV13')));
  });
});

describe('what does not move', () => {
  it('5 days early is still a dose before age 2, and the catch-up dose is still owed', () => {
    expect(run([['2026-08-04']], '2026-09-01').recs.map((x) => x.status)).not.toContain('complete');
  });

  it('a week early is still owed again', () => {
    expect(run([['2026-08-02']], '2026-09-01').recs.map((x) => x.status)).not.toContain('complete');
  });

  it('the 12-month line is untouched', () => {
    expect(pcvAgeAtGraceLine(11.9, '2025-08-06', DOB)).toBe(12);
    expect(pcvAgeAtGraceLine(11.8, '2025-08-04', DOB)).toBe(11.8);
  });

  it('the helper: exactly 4 days before 24 months is 24; 5 days is not; no date of birth, no grace', () => {
    expect(pcvAgeAtGraceLine(23.87, '2026-08-05', DOB)).toBe(24);
    expect(pcvAgeAtGraceLine(23.84, '2026-08-04', DOB)).toBe(23.84);
    expect(pcvAgeAtGraceLine(23.87, '2026-08-05', null)).toBe(23.87);
    expect(pcvAgeAtGraceLine(24.5, '2026-08-24', DOB)).toBe(24.5);
  });
});
