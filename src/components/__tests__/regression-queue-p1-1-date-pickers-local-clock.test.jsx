// @vitest-environment happy-dom
// queue P1-1 + P3-7 (S10, 2026-10-10) — the date pickers must offer the
// clinician's LOCAL today, not UTC's.
//
// All five `type="date"` inputs capped themselves with
//   max={new Date().toISOString().slice(0, 10)}
// which is the UTC date. After about 17:00 Pacific, UTC is already tomorrow,
// so the picker offered a date that validate.js then correctly refused as being
// in the future. dateUtils.todayISO() already derived the local date and was
// simply unused in the components.
//
// P3-7: the clock is now read ONCE, in App, and threaded down, so the pickers,
// the engine and the cards cannot disagree about what day it is.
process.env.TZ = 'America/Los_Angeles';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '../../App.jsx';

// 2026-07-16T06:30:00Z is 2026-07-15 23:30 in Los Angeles: UTC has already
// rolled over to the 16th while the clinician is still on the 15th.
const EVENING = new Date('2026-07-16T06:30:00Z');
const LOCAL_TODAY = '2026-07-15';
const UTC_TODAY = '2026-07-16';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(EVENING); });
afterEach(() => { vi.useRealTimers(); });

function maxesOnPage() {
  return Array.from(document.querySelectorAll('input[type="date"]'))
    .map((el) => el.getAttribute('max'));
}

describe('queue P1-1 — every date picker caps at the local date', () => {
  it('the date-of-birth picker on the Age step', () => {
    render(<App />);
    const maxes = maxesOnPage();
    expect(maxes.length).toBeGreaterThan(0);
    expect(maxes).not.toContain(UTC_TODAY);
    expect(maxes.every((m) => m === LOCAL_TODAY)).toBe(true);
  });

  it('both dose-date pickers on the History step', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '1960-01-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, record doses/i }));
    fireEvent.click(screen.getByRole('button', { name: /add pcv dose/i }));
    fireEvent.click(screen.getByRole('button', { name: /add ppsv23 dose/i }));

    const maxes = maxesOnPage();
    expect(maxes.length).toBe(2);
    expect(maxes).not.toContain(UTC_TODAY);
    expect(maxes.every((m) => m === LOCAL_TODAY)).toBe(true);
  });

  it('both dose-date pickers in the Results edit panel', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '1960-01-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /no previous doses/i }));
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));
    fireEvent.click(screen.getByRole('button', { name: /recorded doses/i }));
    fireEvent.click(screen.getByRole('button', { name: /add pcv dose/i }));
    fireEvent.click(screen.getByRole('button', { name: /add ppsv23 dose/i }));

    const maxes = maxesOnPage();
    expect(maxes.length).toBe(2);
    expect(maxes).not.toContain(UTC_TODAY);
    expect(maxes.every((m) => m === LOCAL_TODAY)).toBe(true);
  });
});
