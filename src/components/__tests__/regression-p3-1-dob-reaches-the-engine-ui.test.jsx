// @vitest-environment happy-dom
// P3-1 (S10, 2026-10-10) — the date of birth the clinician types must reach the
// engine, and the Results step's "Adjust age" must still work afterwards.
//
// The UI half of P3-1. StepAge collected a real date of birth and converted it
// to a number of months, discarding the date, so the engine could never answer
// the question the field was added for ("was PPSV23 given on/after the 65th
// birthday?"). These tests drive the real components.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../App.jsx';
import StepAge from '../StepAge.jsx';

describe('P3-1 — StepAge hands the date of birth up', () => {
  it('reports the dob alongside the age it derived', () => {
    const seen = [];
    render(<StepAge ageMonths={null} today="2026-10-10" onChange={(p) => seen.push(p)} />);
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '1958-01-10' },
    });
    expect(seen.length).toBeGreaterThan(0);
    const last = seen[seen.length - 1];
    expect(last.dob).toBe('1958-01-10');
    // The derived age is a whole number of calendar months from that birthday.
    expect(Number.isInteger(last.ageMonths)).toBe(true);
    expect(last.ageMonths).toBeGreaterThan(780); // past the 65th birthday
  });

  it('clears the dob when the clinician switches to Years / Months', () => {
    const seen = [];
    render(<StepAge ageMonths={null} today="2026-10-10" onChange={(p) => seen.push(p)} />);
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '1958-01-10' },
    });
    fireEvent.click(screen.getByText(/years \/ months/i));
    fireEvent.change(screen.getByLabelText('Years'), { target: { value: '40' } });
    const last = seen[seen.length - 1];
    expect(last.dob).toBeFalsy();
    expect(last.ageMonths).toBe(480);
  });
});

describe('P3-1 — a date of birth survives the whole wizard', () => {
  function enterDob(iso) {
    fireEvent.change(screen.getByLabelText('Date of Birth'), { target: { value: iso } });
  }

  it('reaches Results and drives the age shown there', () => {
    render(<App />);
    enterDob('1958-01-10');
    fireEvent.click(screen.getByRole('button', { name: /next/i }));   // → Risks
    fireEvent.click(screen.getByRole('button', { name: /next/i }));   // → History
    fireEvent.click(screen.getByRole('button', { name: /no previous doses/i }));
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));
    // The patient is an older adult; the Results header prints their age band.
    expect(screen.getByText(/older adult/i)).toBeDefined();
  });

  it('"Adjust age" on Results overrides the stored date of birth', () => {
    // patientAgeMonths prefers dob over ageMonths, so adjusting the age by hand
    // must clear the dob or the adjustment would silently do nothing.
    render(<App />);
    enterDob('1958-01-10');                                            // ~68y
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /no previous doses/i }));
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));
    expect(screen.getByText(/older adult/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /adjust age/i }));
    const yearsBox = screen.getByLabelText(/^years$/i);
    fireEvent.change(yearsBox, { target: { value: '30' } });
    expect(screen.getByText(/adult \(19–49y\)/i)).toBeDefined();
  });
});
