// regression-dateUtils-m5.test.js
// Verifies that addDays() is UTC-consistent (M5 fix): the old local-midnight-parse
// + UTC-slice pattern caused DST-boundary off-by-one errors in non-UTC timezones.

import { describe, it, expect } from 'vitest';
import { addDays, daysBetween, todayISO } from '../dateUtils.js';

describe('dateUtils M5 UTC-consistent arithmetic', () => {
  it('addDays(date, 0) returns the same date (including DST boundary days)', () => {
    expect(addDays('2026-03-08', 0)).toBe('2026-03-08');  // US DST spring-forward
    expect(addDays('2026-11-01', 0)).toBe('2026-11-01');  // US DST fall-back
    expect(addDays('2026-01-15', 0)).toBe('2026-01-15');
  });

  it('addDays(date, 28) is exactly 4 weeks forward', () => {
    expect(addDays('2026-01-01', 28)).toBe('2026-01-29');
    expect(addDays('2026-03-01', 28)).toBe('2026-03-29');
  });

  it('daysBetween returns 0 for the same date', () => {
    expect(daysBetween('2026-03-08', '2026-03-08')).toBe(0);
    expect(daysBetween('2026-11-01', '2026-11-01')).toBe(0);
  });

  it('daysBetween returns exact count across DST boundary', () => {
    expect(daysBetween('2026-03-08', '2026-03-09')).toBe(1);
    expect(daysBetween('2026-11-01', '2026-11-02')).toBe(1);
  });

  it('todayISO returns a valid ISO date string', () => {
    const t = todayISO();
    expect(t).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('todayISO returns the override date when provided', () => {
    expect(todayISO('2026-06-12')).toBe('2026-06-12');
  });

  it('addDays round-trips: addDays(date, n) and daysBetween agree', () => {
    const base = '2026-06-01';
    for (const n of [0, 1, 7, 28, 56, 182, 365]) {
      const result = addDays(base, n);
      expect(daysBetween(base, result)).toBe(n);
    }
  });
});
