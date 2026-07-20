// @vitest-environment happy-dom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../App.jsx';

function getNextBtn() { return screen.getByRole('button', { name: /next/i }); }
function getBackBtn() { return screen.queryByRole('button', { name: /back/i }); }

// DOB is the default entry mode; tests that just need a round age use the
// Years/Months fallback instead of picking a date.
function setAgeYears(years) {
  fireEvent.click(screen.getByText(/years \/ months/i));
  fireEvent.change(screen.getByLabelText('Years'), { target: { value: String(years) } });
}

describe('App wizard', () => {
  it('renders the Age step on load', () => {
    render(<App />);
    expect(screen.getByText('Patient Age')).toBeDefined();
  });

  it('shows stepper with 4 steps', () => {
    render(<App />);
    expect(screen.getByText('Age')).toBeDefined();
    expect(screen.getByText('Risks')).toBeDefined();
    expect(screen.getByText('History')).toBeDefined();
    expect(screen.getByText('Results')).toBeDefined();
  });

  it('errors if Next clicked with no age', () => {
    render(<App />);
    fireEvent.click(getNextBtn());
    expect(screen.getByText(/please enter a valid age/i)).toBeDefined();
  });

  it('no Back button on step 0', () => {
    render(<App />);
    expect(getBackBtn()).toBeNull();
  });

  it('advances Age → Risks after entering an age', () => {
    render(<App />);
    setAgeYears(55);
    fireEvent.click(getNextBtn());
    expect(screen.getByText('Risk Factors')).toBeDefined();
  });

  it('drives the full wizard and renders a rec card at Results (≥50 naive)', () => {
    render(<App />);
    setAgeYears(55);
    fireEvent.click(getNextBtn());           // → Risks
    expect(screen.getByText('Risk Factors')).toBeDefined();
    fireEvent.click(getNextBtn());           // → History (no risks)
    expect(screen.getByText('Vaccination History')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));

    const cards = screen.getAllByTestId('rec-card');
    expect(cards.length).toBeGreaterThan(0);
    const links = document.querySelectorAll('a[href*="cdc.gov"], a[href*="immunize.org"]');
    expect(links.length).toBeGreaterThan(0);
  });

  it('shows HSCT advisory card when HSCT selected (adult)', () => {
    render(<App />);
    setAgeYears(30);
    fireEvent.click(getNextBtn());           // → Risks
    const hsct = screen.getByLabelText(/hematopoietic stem cell transplant/i, { exact: false });
    fireEvent.click(hsct);
    fireEvent.click(getNextBtn());           // → History
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));
    expect(document.querySelector('[data-testid="hsct-card"]')).not.toBeNull();
  });

  it('Start Over resets to Age step', () => {
    render(<App />);
    setAgeYears(55);
    fireEvent.click(getNextBtn());
    fireEvent.click(getNextBtn());
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));
    const startOver = screen.getByRole('button', { name: /start over/i });
    fireEvent.click(startOver);
    expect(screen.getByText('Patient Age')).toBeDefined();
  });

  it('healthy child shows not-indicated PCV', () => {
    render(<App />);
    setAgeYears(6);
    fireEvent.click(getNextBtn());
    fireEvent.click(getNextBtn());           // no risks → History
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));
    const cards = screen.getAllByTestId('rec-card');
    const texts = cards.map(c => c.textContent).join(' ');
    expect(texts).toMatch(/not indicated/i);
  });

  // PC1: when the engine emits only a PPSV23 card (PCV series already
  // complete), the recorded PCV history — including the PCV7-does-not-count
  // note — must still surface somewhere, not disappear silently.
  it('shows PCV history (with PCV7 does-not-count note) under the PPSV23 card when no PCV card renders', () => {
    render(<App />);
    setAgeYears(30);
    fireEvent.click(getNextBtn());           // → Risks
    fireEvent.click(screen.getByLabelText(/chronic lung disease/i, { exact: false }));
    fireEvent.click(getNextBtn());           // → History
    fireEvent.click(screen.getByRole('button', { name: /\+ add pcv dose/i }));
    fireEvent.click(screen.getByRole('button', { name: /\+ add pcv dose/i }));
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2005-06-01' } });
    fireEvent.change(dateInputs[1], { target: { value: '2026-05-01' } });
    const productSelects = document.querySelectorAll('select');
    fireEvent.change(productSelects[0], { target: { value: 'PCV7' } });
    fireEvent.change(productSelects[1], { target: { value: 'PCV15' } });
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));

    const cards = screen.getAllByTestId('rec-card');
    expect(cards.map(c => c.querySelector('.rec-vaccine-name')?.textContent)).toEqual(['PPSV23']);
    expect(screen.getByText('PCV history:')).toBeTruthy();
    expect(screen.getByText('Recorded (does not count)')).toBeTruthy();
    expect(screen.getByText(/PCV7 \(Prevnar 7\) is not counted/)).toBeTruthy();
  });
});
