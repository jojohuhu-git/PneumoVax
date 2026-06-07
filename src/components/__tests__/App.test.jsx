// @vitest-environment happy-dom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../App.jsx';

function getNextBtn() { return screen.getByRole('button', { name: /next/i }); }
function getBackBtn() { return screen.queryByRole('button', { name: /back/i }); }

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

  it('advances Age → Risks after picking an age chip', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Older adult (≥50y)'));
    fireEvent.click(getNextBtn());
    expect(screen.getByText('Risk Factors')).toBeDefined();
  });

  it('drives the full wizard and renders a rec card at Results (≥50 naive)', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Older adult (≥50y)'));
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
    fireEvent.click(screen.getByText('Adult (19–49y)'));
    fireEvent.click(getNextBtn());           // → Risks
    const hsct = screen.getByLabelText(/hematopoietic stem cell transplant/i, { exact: false });
    fireEvent.click(hsct);
    fireEvent.click(getNextBtn());           // → History
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));
    expect(document.querySelector('[data-testid="hsct-card"]')).not.toBeNull();
  });

  it('Start Over resets to Age step', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Older adult (≥50y)'));
    fireEvent.click(getNextBtn());
    fireEvent.click(getNextBtn());
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));
    const startOver = screen.getByRole('button', { name: /start over/i });
    fireEvent.click(startOver);
    expect(screen.getByText('Patient Age')).toBeDefined();
  });

  it('healthy child shows not-indicated PCV', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Child (2–10y)'));
    fireEvent.click(getNextBtn());
    fireEvent.click(getNextBtn());           // no risks → History
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));
    const cards = screen.getAllByTestId('rec-card');
    const texts = cards.map(c => c.textContent).join(' ');
    expect(texts).toMatch(/not indicated/i);
  });
});
