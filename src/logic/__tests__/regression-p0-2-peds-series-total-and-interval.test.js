// P0-2 (peds audit) + P1-2 — the infant PCV ladder and the next-dose interval.
//
// Two defects, one root cause: `pcvInfant`'s `target` ladder was a formula
// (`Math.min(4, prior + 2)` and friends) with no counterpart in the source, so
// it over-stated the series total in 5 of p2016 Table 1's 14 cells and could
// even render the impossible "PCV dose 5 of 4" (P1-2).
//
// SOURCES, both fetched live 2026-10-11 and quoted in CLINICAL_SPEC.md §L:
//
//   immunize.org p2016 Table 1 (Item #P2016, 2/16/2024) — "Recommended schedule
//   for administering pneumococcal conjugate vaccine (PCV) to all children
//   (healthy and those with risk conditions) age 2 through 23 months". Keys on
//   the child's CURRENT age band crossed with the count of prior doses SPLIT BY
//   WHEN THEY WERE GIVEN ("1 or 2 before age 7 months", "1 at age 7 months or
//   older", "1 dose at age 12 months or older").
//
//   CDC Catch-up Immunization Schedule, Table 2, pneumococcal conjugate row,
//   column "Minimum Interval Between Doses" — keys the gap on the DOSE NUMBER,
//   using current age and age-at-previous-dose together.
//
// OWNER DECISIONS, 2026-10-11, from worked examples:
//   1. The next-dose interval follows CDC Table 2 dose by dose. A single age
//      key cannot reproduce it: a patient at 12.2 months whose previous dose
//      was at 11.5 months gets 4 weeks as dose 2 and 8 weeks as dose 3, so
//      neither "current age" nor "age at previous dose" is right on its own.
//   2. The VALIDITY FLOOR is unchanged — a dose already given stays judged by
//      doseIntervalRules.js's permissive reading (p2016 footnote †). Only what
//      the app ADVISES changes. Nothing a clinician already did is
//      retroactively invalidated.
//   3. There is no separate "recommended" interval layered over CDC Table 2's
//      number: the 4-vs-8-week choice is age-governed exactly as footnote †
//      states it, and Table 2 says which age applies at which dose.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-06-07';

function dobForAgeMonths(am) {
  const d = new Date(TODAY);
  d.setMonth(d.getMonth() - am);
  return d.toISOString().slice(0, 10);
}
function doseAtAge(dob, product, am) {
  const d = new Date(dob);
  d.setMonth(d.getMonth() + Math.floor(am));
  if (am % 1) d.setDate(d.getDate() + Math.round((am % 1) * 30));
  return { product, date: d.toISOString().slice(0, 10) };
}
// Run a healthy child with PCV15 doses at the given ages-at-administration.
function run(ageNow, doseAges) {
  const dob = dobForAgeMonths(ageNow);
  const out = recommend({
    ageMonths: ageNow,
    dob,
    riskIds: [],
    pcvDoses: doseAges.map((a) => doseAtAge(dob, 'PCV15', a)),
    ppsv23Doses: [],
    today: TODAY,
  });
  return out.recs.find((r) => r.vaccine === 'PCV') || out.recs[0];
}

describe('P0-2 — the infant series total matches p2016 Table 1 in every cell', () => {
  // Every row of the audit's reproduction table, with the total p2016 Table 1
  // implies. The five that were wrong are marked; all 14 are asserted so the
  // ladder cannot drift in either direction.
  const ROWS = [
    ['2–6mo band, 0 prior',                   4,  [],        4],
    ['2–6mo band, 1 prior @ 2mo',             4,  [2],       4],
    ['2–6mo band, 2 prior @ 2,3mo',           4,  [2, 3],    4],
    ['7–11mo band, 0 prior',                  9,  [],        3],
    ['7–11mo band, 1 before 7mo (was 4)',     9,  [3],       3],
    ['7–11mo band, 2 before 7mo',             9,  [3, 5],    4],
    ['7–11mo band, 1 at ≥7mo (was 4)',        9,  [8],       3],
    ['7–11mo band, 2 at ≥7mo (was 4)',        10, [8, 9.5],  3],
    ['7–11mo band, 3 before 7mo',             9,  [2, 4, 6], 4],
    ['12–23mo band, 0 prior',                 15, [],        2],
    ['12–23mo band, 1 before 12mo',           15, [3],       3],
    ['12–23mo band, 2 before 12mo (was 4)',   15, [3, 5],    3],
    ['12–23mo band, 3 before 12mo',           15, [2, 4, 6], 4],
    ['12–23mo band, 1 dose at ≥12mo (was 3)', 15, [13],      2],
  ];

  for (const [label, ageNow, doseAges, expectedTotal] of ROWS) {
    it(`${label} → total ${expectedTotal}`, () => {
      expect(run(ageNow, doseAges).seriesTotal).toBe(expectedTotal);
    });
  }
});

describe('P1-2 — no rec may ever claim a dose number above its series total', () => {
  it('a 6-month-old with four infant doses is not "dose 5 of 4"', () => {
    // Four PCV20 doses, all legally spaced and all before 12 months. The
    // ≥12-month closing dose is genuinely still owed, so the honest total is
    // the child's own 5, never 4.
    const r = run(6, [2, 3, 4, 5]);
    expect(r.doseLabel).not.toMatch(/dose 5 of 4/);
    const m = /dose (\d+) of (\d+)/.exec(r.doseLabel);
    expect(m).not.toBeNull();
    expect(Number(m[1])).toBeLessThanOrEqual(Number(m[2]));
  });

  it('never-event sweep: no infant-band history produces dose N of M with N > M', () => {
    const histories = [
      [], [2], [2, 3], [2, 3, 4], [2, 3, 4, 5], [2, 3, 4, 5, 6],
      [8], [8, 9.5], [3], [3, 5], [2, 4, 6], [13], [13, 15], [3, 13],
    ];
    for (const ageNow of [4, 9, 10, 15, 20]) {
      for (const h of histories) {
        if (h.some((a) => a > ageNow)) continue; // no doses in the future
        const r = run(ageNow, h);
        const m = /dose (\d+) of (\d+)/.exec(r.doseLabel || '');
        if (!m) continue;
        expect(
          Number(m[1]),
          `${ageNow}mo with doses at [${h}] → "${r.doseLabel}"`,
        ).toBeLessThanOrEqual(Number(m[2]));
      }
    }
  });
});

describe('P0-2 — the advised interval follows CDC Table 2 dose by dose', () => {
  // The decisive pair: identical ages, different dose number, different CDC
  // answer. This is why a single age key can never be right.
  it('dose 2 at 12.2mo after a dose at 11.5mo → 4 weeks (first dose before the 1st birthday)', () => {
    expect(run(12.2, [11.5]).minIntervalDays).toBe(28);
  });

  it('dose 3 at 12.2mo after a dose at 11.5mo → 8 weeks (current age ≥12mo, a dose before 12mo)', () => {
    expect(run(12.2, [3, 11.5]).minIntervalDays).toBe(56);
  });

  it('dose 3 under 12mo with the previous dose before 7mo → 4 weeks', () => {
    expect(run(9, [3, 5]).minIntervalDays).toBe(28);
  });

  it('dose 3 with the previous dose at 7–11mo → 8 weeks AND not due until 12 months', () => {
    // CDC Table 2: "8 weeks (as final dose for healthy children) if previous
    // dose was administered between 7–11 months (wait until at least 12 months
    // old)". The app used to advise this dose ~2 months early.
    const r = run(10, [8, 9.5]);
    expect(r.minIntervalDays).toBe(56);
    expect(r.dueToday).toBe(false);
  });

  it('dose 2 after a first dose given at or after the 1st birthday → 8 weeks', () => {
    expect(run(15, [13]).minIntervalDays).toBe(56);
  });

  it('dose 4 → 8 weeks', () => {
    expect(run(15, [2, 4, 6]).minIntervalDays).toBe(56);
  });

  it('reports no interval at all when there is no earlier dated dose', () => {
    // An interval has to be measured from something. The old code reported a
    // number here anyway (28 or 56, whichever the patient's current age
    // implied), which was a figure nothing had been compared against.
    expect(run(4, []).minIntervalDays).toBeNull();
    expect(run(15, []).minIntervalDays).toBeNull();
  });
});

describe('P0-2 — the note never contradicts the computed total', () => {
  it('a 3-dose catch-up child is not told they are on a 4-dose series', () => {
    const r = run(10, [8, 9.5]);
    expect(r.doseLabel).toMatch(/of 3/);
    const lead = typeof r.note === 'string' ? r.note : r.note.lead;
    expect(lead).not.toMatch(/4-dose series/);
    expect(lead).toMatch(/3 doses in total/);
  });

  it('a routine 4-dose infant keeps the routine sentence unchanged', () => {
    const r = run(4, [2]);
    expect(r.doseLabel).toMatch(/of 4/);
    const lead = typeof r.note === 'string' ? r.note : r.note.lead;
    expect(lead).toMatch(/4-dose series at 2, 4, 6, and 12–15 months/);
  });

  it('every infant-band note carries exactly one citation marker', () => {
    for (const [ageNow, h] of [[4, [2]], [9, [3]], [10, [8, 9.5]], [15, [13]], [15, []]]) {
      const r = run(ageNow, h);
      const lead = typeof r.note === 'string' ? r.note : r.note.lead;
      expect((lead.match(/\[c\]/g) || []).length, `${ageNow}mo [${h}]`).toBe(1);
    }
  });
});

describe('P0-2 — owner decision 2: the validity floor is untouched', () => {
  it('a dose already given 28 days after a 9.5mo dose still counts', () => {
    // The scheduler now advises 8 weeks + a wait to 12 months for this child,
    // but a dose the clinician ALREADY gave at 4 weeks stays valid — the floor
    // is doseIntervalRules.js's, and it did not move.
    const dob = dobForAgeMonths(12);
    const out = recommend({
      ageMonths: 12,
      dob,
      riskIds: [],
      pcvDoses: [
        doseAtAge(dob, 'PCV15', 8),
        doseAtAge(dob, 'PCV15', 9.5),
        doseAtAge(dob, 'PCV15', 10.5), // ~4 weeks after the 9.5mo dose
      ],
      ppsv23Doses: [],
      today: TODAY,
    });
    expect(out.perDose.pcv[2].status).toBe('valid');
  });
});
