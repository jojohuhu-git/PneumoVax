// @vitest-environment happy-dom
// P3-8 (S10b, 2026-10-10) — the UI half. An impossible age must be refused as
// it is typed, and must not be allowed through to a recommendation.
//
// The logic half lives in regression-p3-8-impossible-age-refused.test.js. This
// file drives the real components, because the live failure was a UI one: the
// badge read "2000 years · Older adult (≥50y)", Next stayed enabled, and the
// Results step produced a routine adult recommendation for an infant.
//
// Both entry modes must ask the same module, so the two doors cannot drift.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../App.jsx';
import StepAge from '../StepAge.jsx';

const TODAY = '2026-10-10';

function renderStepAge() {
  const seen = [];
  const view = render(
    <StepAge ageMonths={null} today={TODAY} onChange={(p) => seen.push(p)} />,
  );
  return { seen, view };
}

describe('P3-8 — StepAge refuses an impossible date of birth', () => {
  it('shows the problem and clears the age for the 0026 typo', () => {
    const { seen } = renderStepAge();
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '0026-10-10' },
    });
    // The message is on screen…
    expect(screen.getByText(/over 120 years old/i)).toBeTruthy();
    // …and names where to look.
    expect(screen.getByText(/two-digit year such as 26/i)).toBeTruthy();
    // …and no age was handed up, so Next cannot open.
    expect(seen.at(-1)).toEqual({ dob: null, ageMonths: null, ageGroup: null });
    // The badge that read "2000 years · Older adult (>=50y)" is gone.
    expect(screen.queryByText(/2000 years/)).toBeNull();
  });

  // The future-dated-dob MESSAGE is deliberately not asserted here. It cannot
  // be reached in this environment: happy-dom enforces the input's max
  // attribute itself, so fireEvent.change with '2027-01-01' leaves the value
  // as '' and fires no event at all (probed 2026-10-10 — onChange was never
  // called). A real browser does NOT do this: checked live on the running app,
  // the value is kept ('2027-01-01'), validity.rangeOverflow is true, and the
  // guard renders "That date of birth is in the future. Check the year — if it
  // is a typo, correct it." So the message is real and it is covered — by
  // ageEntryProblem in regression-p3-8-impossible-age-refused.test.js, plus
  // that live check. Asserting it here would only test happy-dom.
  //
  // What IS assertable here is the first line of defence: the box tells the
  // browser the limit.
  it('caps the date of birth box at today', () => {
    renderStepAge();
    expect(screen.getByLabelText('Date of Birth').getAttribute('max')).toBe(TODAY);
  });

  it('still accepts an ordinary date of birth, with no message', () => {
    const { seen } = renderStepAge();
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '2011-10-10' },
    });
    expect(screen.queryByText(/120 years/i)).toBeNull();
    expect(screen.queryByText(/in the future/i)).toBeNull();
    expect(seen.at(-1).dob).toBe('2011-10-10');
    expect(seen.at(-1).ageMonths).toBeGreaterThan(0);
  });

  it('clears the message once the year is corrected', () => {
    renderStepAge();
    const input = screen.getByLabelText('Date of Birth');
    fireEvent.change(input, { target: { value: '0026-10-10' } });
    expect(screen.getByText(/over 120 years old/i)).toBeTruthy();
    fireEvent.change(input, { target: { value: '2026-02-10' } });
    expect(screen.queryByText(/over 120 years old/i)).toBeNull();
  });
});

describe('P3-8 — StepAge refuses an impossible Years / Months entry', () => {
  function switchToYearsMonths() {
    fireEvent.click(screen.getByText(/Years \/ Months/));
  }

  it('refuses 999 in the Years box, which max="120" did not stop', () => {
    const { seen } = renderStepAge();
    switchToYearsMonths();
    fireEvent.change(screen.getByLabelText('Years'), { target: { value: '999' } });
    expect(screen.getByText(/cannot be more than 120 years old/i)).toBeTruthy();
    expect(seen.at(-1)).toEqual({ dob: null, ageMonths: null, ageGroup: null });
  });

  it('refuses 12 or more in the Months box and points at the Years box', () => {
    const { seen } = renderStepAge();
    switchToYearsMonths();
    fireEvent.change(screen.getByLabelText('Months (optional)'), {
      target: { value: '12' },
    });
    expect(screen.getByText(/Years box/)).toBeTruthy();
    expect(seen.at(-1).ageMonths).toBeNull();
  });

  it('still accepts an ordinary Years / Months entry', () => {
    const { seen } = renderStepAge();
    switchToYearsMonths();
    fireEvent.change(screen.getByLabelText('Years'), { target: { value: '15' } });
    expect(screen.queryByText(/cannot be more than/i)).toBeNull();
    expect(seen.at(-1).ageMonths).toBe(180);
  });

  it('accepts a 2-month-old (0 years, 2 months)', () => {
    const { seen } = renderStepAge();
    switchToYearsMonths();
    fireEvent.change(screen.getByLabelText('Months (optional)'), {
      target: { value: '2' },
    });
    expect(screen.queryByText(/cannot be more than/i)).toBeNull();
    expect(seen.at(-1).ageMonths).toBe(2);
  });
});

describe('P3-8 — the whole app will not advance on an impossible age', () => {
  it('a 0026 date of birth cannot reach a recommendation', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '0026-10-10' },
    });
    fireEvent.click(screen.getByText('Next'));
    // Still on the Age step — the step title is the proof.
    expect(screen.getByText('Patient Age')).toBeTruthy();
    // Pre-fix, this walked through to "Older adult (≥50y)" and a PCV card.
    expect(screen.queryByText(/Older adult/)).toBeNull();
    expect(screen.queryByText(/2000 years/)).toBeNull();
  });

  it('an ordinary date of birth still advances', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '2011-10-10' },
    });
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Risk Factors')).toBeTruthy();
  });
});
