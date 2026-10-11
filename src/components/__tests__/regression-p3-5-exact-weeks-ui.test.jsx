// @vitest-environment happy-dom
// P3-5 (S10b, 2026-10-10) — the UI half. All THREE surfaces that print a young
// infant's age must count the weeks from the birthday.
//
// The queue names StepAge, Results and RecCard. A fix applied to fmtAgeMonths
// alone would be invisible on any surface that does not pass `exactDays`, so
// each one is asserted here — a single-surface fix is not a fix.
//
// The sharpest case is RecCard's dose line. For a baby born 2026-08-29 with a
// PCV13 dose on 2026-10-10 — exactly 42 days, which is PCV_MIN_AGE_DAYS and
// the "6 weeks" the rule is written in — the card used to read:
//   "D1 · Oct 10, 2026 · age 5 weeks · PCV13 (Prevnar 13)"   + "On time"
// which contradicts itself: 5 weeks is below the 6-week minimum, yet the dose
// was (correctly) graded on time. Verified live after the fix, it reads
//   "D1 · Oct 10, 2026 · age 6 weeks · PCV13 (Prevnar 13)"   + "On time"
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StepAge from '../StepAge.jsx';
import Results from '../Results.jsx';
import { patientAgeMonths } from '../../logic/patientAge.js';

// 2026-08-29 + 42 days = 2026-10-10.
const TODAY = '2026-10-10';
const DOB_42_DAYS = '2026-08-29';
const DOB_7_DAYS = '2026-10-03';

describe('P3-5 — StepAge badge counts the weeks', () => {
  // StepAge is a CONTROLLED component: App derives ageMonths and passes it
  // back, and the badge only renders when that prop is non-null. So supply it
  // the way App does (patientAgeMonths), then fire the change so StepAge holds
  // the dob internally and can count the exact days from it.
  function badgeFor(dobISO) {
    const ageMonths = patientAgeMonths({ dob: dobISO, ageMonths: null }, TODAY);
    const { unmount } = render(
      <StepAge ageMonths={ageMonths} today={TODAY} onChange={() => {}} />,
    );
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: dobISO },
    });
    return { text: document.body.textContent, unmount };
  }

  it('shows 6 weeks for a baby who is exactly 42 days old', () => {
    // StepAge derives the age itself from the dob it was just given, so the
    // badge renders without App having to round-trip the value.
    const { text, unmount } = badgeFor(DOB_42_DAYS);
    expect(text).toContain('6 weeks');
    expect(text).not.toContain('5 weeks');
    unmount();
  });

  it('shows 1 week for a 7-day-old, which used to read "Birth"', () => {
    // The old "Birth" cut was am < 0.25 months, about 7.6 days.
    const { text, unmount } = badgeFor(DOB_7_DAYS);
    expect(text).toContain('1 week');
    unmount();
  });
});

describe('P3-5 — Results and RecCard count the weeks', () => {
  // Same reason: App hands Results a patient whose ageMonths is already
  // derived from the dob. Derive it here rather than hand-typing 1.3667.
  const state = {
    dob: DOB_42_DAYS,
    ageMonths: patientAgeMonths({ dob: DOB_42_DAYS, ageMonths: null }, TODAY),
    riskIds: [],
    pcvDoses: [{ product: 'PCV13', date: TODAY }],
    ppsv23Doses: [],
  };

  function renderResults() {
    return render(
      <Results
        state={state}
        today={TODAY}
        onReset={() => {}}
        onChange={() => {}}
        onBack={() => {}}
      />,
    );
  }

  it('prints the age meta chip as 6 weeks', () => {
    renderResults();
    // The chip is its own element, so query it rather than the whole page.
    const chip = document.querySelector('.meta-age');
    expect(chip).toBeTruthy();
    expect(chip.textContent.trim()).toBe('6 weeks');
  });

  it('prints the recorded dose line as "age 6 weeks", not 5', () => {
    renderResults();
    // Open the recorded-doses section if it is collapsed.
    const toggle = screen.queryByText(/Recorded doses/i);
    if (toggle) fireEvent.click(toggle);
    const body = document.body.textContent;
    expect(body).toMatch(/age 6 weeks/);
    expect(body).not.toMatch(/age 5 weeks/);
  });

  it('still grades that 42-day dose as valid, so the card cannot contradict itself', () => {
    // The display was always the only thing wrong here — validate.js works in
    // exact days. This pins the two halves agreeing.
    renderResults();
    const toggle = screen.queryByText(/Recorded doses/i);
    if (toggle) fireEvent.click(toggle);
    const body = document.body.textContent;
    expect(body).not.toMatch(/below the 6 weeks minimum/i);
  });
});
