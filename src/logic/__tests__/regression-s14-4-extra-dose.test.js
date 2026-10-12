// S14-4 (2026-10-11) — a PCV dose recorded after the series was already
// complete by product reads as an extra dose, not a mistimed one.
//
// Root cause (S14-RC handoff): `adultPcvGapAdvice` checks only the GAP since
// the previous dose, never whether a dose already completed the series. A
// 70-year-old given PCV13, then PCV20 (completes), then PCV21 five weeks
// later used to have that PCV21 dose graded against the ≥1-year advisory —
// "given less than a year after the previous dose ... this dose still
// counts" — when no further PCV dose was ever recommended at all. The
// product list (brands.js) already marks PCV20/PCV21 `completesSeries: true`;
// this teaches the walk to use it.
//
// Mirrors MeningoVax's own "extra dose, more than this series needs" shape
// (doseChipLabel.js): a dose given after the total is met is safely
// administered but does not extend the series, is excluded from `effective`,
// and gets no `effectiveDoseNum` — distinct from `invalid` (which the record
// itself is wrong about) and from `noncounting` (PCV7, which never counted in
// the first place).
import { describe, it, expect } from 'vitest';
import { analyzeHistory } from '../validate.js';

const DOB = '1956-01-01';
const TODAY = '2026-06-01';
const AM = 845; // ~70 years

describe('S14-4 — a dose recorded after the series already completed', () => {
  it('PCV20 then PCV21 five weeks later: the PCV21 is an extra dose, not an interval advisory', () => {
    // S14-7 (2026-10-11): the PCV20 is now dated more than a year after the
    // PCV13 on purpose. An adult's PCV20/PCV21 has to fall at least a year
    // after the last PCV13 to count at all (ADULT-PCV20-21-AFTER-PCV13), and
    // the original fixture had them five weeks apart — which voided the PCV20,
    // left the series incomplete, and so stopped exercising the "extra dose"
    // path this case exists for. See the case below for that scenario's own,
    // now-different, correct answer.
    const a = analyzeHistory('PCV', [
      { date: '2024-01-05', product: 'PCV13' },
      { date: '2025-02-09', product: 'PCV20' },  // completes the series
      { date: '2025-03-16', product: 'PCV21' },  // extra — already complete
    ], AM, TODAY, DOB);

    const extra = a.perDose[2];
    expect(extra.extraDose).toBe(true);
    expect(extra.effectiveDoseNum).toBeNull();
    expect(extra.status).not.toBe('invalid');
    // Must not carry the "still counts" early-advisory wording — that implies
    // a dose this app is actively tracking against a recommendation, and none
    // is owed here.
    expect(extra.earlyAdvisory).toBeFalsy();
    expect(extra.reasons.join(' ')).toMatch(/already complete/i);
    expect(extra.reasons.join(' ')).not.toMatch(/still counts/);

    // Only the two real series doses count.
    expect(a.effective).toHaveLength(2);
    expect(a.effective.map((d) => d.product)).toEqual(['PCV13', 'PCV20']);
    expect(a.perDose[0].effectiveDoseNum).toBe(1);
    expect(a.perDose[1].effectiveDoseNum).toBe(2);
  });

  it('is not struck through like an invalid dose — it was validly given', () => {
    const a = analyzeHistory('PCV', [
      { date: '2026-02-09', product: 'PCV20' },
      { date: '2026-03-16', product: 'PCV21' },
    ], AM, TODAY, DOB);
    // extraDose doses still get the normal status their age/product checks
    // produced (valid or unknown) — doesNotCount is a display flag the UI
    // uses to grey out an invalid row, not appropriate here.
    expect(a.perDose[1].status).toBe('valid');
  });

  it('an undated dose after a completing dose asks rather than asserts', () => {
    // Undated doses sort before all dated ones (an undated historical dose is
    // assumed to be the earlier dose, matching the rest of the app's
    // convention) — so the only way for one undated dose to land AFTER
    // another in the walk is for both to be undated, in input order.
    const a = analyzeHistory('PCV', [
      { product: 'PCV20' },  // no date — assumed earlier, completes
      { product: 'PCV21' },  // no date — could be an extra, or a series dose
    ], AM, TODAY, DOB);
    const extra = a.perDose[1];
    expect(extra.extraDose).toBe(true);
    expect(extra.extraDoseUnverified).toBe(true);
    expect(extra.reasons.join(' ')).toMatch(/cannot be placed in time/i);
  });

  it('does not misfire on a healthy series with no completing dose yet', () => {
    const a = analyzeHistory('PCV', [
      { date: '2026-01-05', product: 'PCV13' },
      { date: '2026-02-09', product: 'PCV15' },
    ], AM, TODAY, DOB);
    expect(a.perDose.some((d) => d.extraDose)).toBe(false);
    expect(a.effective).toHaveLength(2);
  });

  // ADULTS ONLY — deliberately. For a CHILD, `completesSeries` means "no
  // PPSV23 follow-up needed", not "no more PCV doses of any kind": an infant
  // given PCV20 as dose 2 of 4 still needs the 12–15mo booster, and an
  // at-risk child's series only completes alongside other conditions
  // pcvRiskChild checks (age band, catch-up count) — not from the product
  // alone. Generalising this rule to children is exactly the mistake the
  // S14-RC root-cause review warned against repeating.
  it('does NOT apply to children — a PCV20 dose does not cap a routine infant series', () => {
    const a = analyzeHistory('PCV', [
      { date: '2026-04-01', product: 'PCV20' },   // infant dose, 2mo
      { date: '2026-06-01', product: 'PCV15' },   // infant dose, 4mo — still due
    ], 4, '2026-06-01', '2026-02-01');
    expect(a.perDose.some((d) => d.extraDose)).toBe(false);
    expect(a.effective).toHaveLength(2);
  });

  it('a dose that is otherwise invalid stays invalid, even after a completing dose', () => {
    // Below the minimum age for PCV21 as a product — invalid wins over extra.
    const a = analyzeHistory('PCV', [
      { date: '2026-02-09', product: 'PCV20' },
      { date: '2026-03-16', product: 'PCV21' },
    ], 200, '2026-06-01', null); // ~16.7y — PCV21 product min age is 18y
    expect(a.perDose[1].status).toBe('invalid');
    expect(a.perDose[1].extraDose).toBeFalsy();
  });
});
