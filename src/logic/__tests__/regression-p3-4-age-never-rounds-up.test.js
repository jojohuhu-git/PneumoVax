// P3-4 (S10, 2026-10-10) — a displayed age must floor, never round up.
//
// fmtAgeMonths used Math.round on both the years remainder and the month
// count, so an age two weeks short of a birthday printed as if it were ON it.
// Nobody is 65 until their 65th birthday, and this app prints an age directly
// beside a threshold claim about that birthday (A-P0-1).
//
// Found on the running app while verifying A-P0-1: a patient whose PPSV23 was
// given six days before their 65th birthday had that dose labelled
//   "D1 - Dec 26, 2022 - age 64 years 12 months - PPSV23"
// "64 years 12 months" is not an age anyone writes, and a clinician scanning
// the card reads it as 65 -- the very thing the dose is being graded against.
//
// The epsilon matters: an age that IS exactly 5 years can arrive from the
// arithmetic as 59.9999999 months, and flooring that bare would print 4 years.
import { describe, it, expect } from 'vitest';
import { fmtAgeMonths } from '../format.js';

describe('P3-4 — ages floor', () => {
  it('never prints "12 months" as the remainder', () => {
    // 779.8 months = 64 years 11.8 months. Math.round made it "64 years 12 months".
    expect(fmtAgeMonths(779.8)).toBe('64 years 11 months');
  });

  it('does not round a dose up onto a birthday it preceded', () => {
    expect(fmtAgeMonths(779.5)).toBe('64 years 11 months');
    expect(fmtAgeMonths(779.99)).toBe('64 years 11 months');
    expect(fmtAgeMonths(780)).toBe('65 years');
  });

  it('floors whole months under two years', () => {
    expect(fmtAgeMonths(11.9)).toBe('11 months');
    expect(fmtAgeMonths(23.9)).toBe('23 months');
  });

  it('floors weeks for young infants', () => {
    // 1.98 months is 8.6 weeks; rounding printed 9.
    expect(fmtAgeMonths(1.98)).toBe('8 weeks');
  });

  it('tolerates floating-point noise just under an exact age', () => {
    // 59.9999999 months IS five years; flooring it bare would print "4 years".
    expect(fmtAgeMonths(59.9999999)).toBe('5 years');
    expect(fmtAgeMonths(779.9999999)).toBe('65 years');
  });

  it('still prints exact ages exactly', () => {
    expect(fmtAgeMonths(0)).toBe('Birth');
    expect(fmtAgeMonths(24)).toBe('2 years');
    expect(fmtAgeMonths(30)).toBe('2 years 6 months');
  });
});
