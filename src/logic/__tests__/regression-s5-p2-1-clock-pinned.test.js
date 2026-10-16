// S5 / P2-1 (2026-10-15) — the test clock is pinned.
//
// Before this, nothing in the suite checked that `new Date()` returned a
// fixed value during tests — `test-setup.js` only ran `cleanup()`. A fixture
// built from "today" (DOB max, dose-date max, anything that calls
// `todayISO()` with no argument) was silently graded against whatever day
// the suite happened to run on, the same way MeningoVax's `L2-1` bug moved a
// fixture from valid to invalid overnight with nobody touching the code.
//
// This file is the proof the pin actually took: it asserts `new Date()` and
// `todayISO()` agree with `TEST_TODAY`, not merely that the suite is green
// (green is also what a no-op pin would look like).
import { describe, it, expect, vi } from 'vitest';
import { todayISO } from '../dateUtils.js';
import { TEST_TODAY } from '../../test-today.js';

describe('S5 / P2-1 — the suite-wide clock is pinned to TEST_TODAY', () => {
  it('vitest fake timers are active for this file', () => {
    expect(vi.isFakeTimers()).toBe(true);
  });

  it('new Date() reports TEST_TODAY, not the real calendar', () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    expect(`${y}-${m}-${d}`).toBe(TEST_TODAY);
  });

  it('todayISO() with no argument defaults to TEST_TODAY', () => {
    expect(todayISO()).toBe(TEST_TODAY);
  });

  it('todayISO(explicitToday) still honors an explicit date, pin or no pin', () => {
    expect(todayISO('2020-01-01')).toBe('2020-01-01');
  });
});
