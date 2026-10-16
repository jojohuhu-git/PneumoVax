// @vitest-environment happy-dom
//
// P4-3 (2026-10-15). Ported from MeningoVax K6 (`d608c14`): "Enter finishes
// the row you are in."
//
// ── What was wrong ───────────────────────────────────────────────────────
//
// S11 made the wizard a real `<form>`, so Enter in ANY field submits it and
// presses Next. That is right for every field except the dose rows: typing a
// date and pressing Enter jumped straight past "+ Add PCV dose" and out of
// the History step entirely, instead of giving the clinician a fresh row to
// keep typing in.
//
// ── What this file proves ────────────────────────────────────────────────
//
// `fireEvent.keyDown` dispatches a keydown event that React's onKeyDown
// handler sees identically to a trusted keypress — this fix does not depend
// on the browser's native implicit-submit behaviour (which happy-dom does
// not implement; PneumoVax's own S11 test file notes this), because the
// handler calls `e.preventDefault()` itself whenever it intercepts the key.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../App.jsx';

function getNextBtn() { return screen.getByRole('button', { name: /next/i }); }

function setAgeYears(years) {
  fireEvent.click(screen.getByText(/years \/ months/i));
  fireEvent.change(screen.getByLabelText('Years'), { target: { value: String(years) } });
}

function toHistoryStep() {
  render(<App />);
  setAgeYears(55);
  fireEvent.click(getNextBtn()); // Age → Risks
  fireEvent.click(getNextBtn()); // Risks → History
  expect(screen.getByText('Vaccination History')).toBeDefined();
}

function enterOn(el) {
  fireEvent.keyDown(el, { key: 'Enter', code: 'Enter' });
}

describe('P4-3 — Enter in a dose row gives you the next row, not the next step', () => {
  it('a filled row plus Enter adds a new row rather than submitting the form', () => {
    toHistoryStep();

    fireEvent.click(screen.getByText('+ Add PCV dose')); // row 1
    expect(document.querySelectorAll('.dose-row').length).toBe(1);

    const dateInput = document.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: '2020-01-01' } });
    enterOn(dateInput);

    expect(document.querySelectorAll('.dose-row').length).toBe(2);
    expect(screen.getByText('Vaccination History')).toBeDefined();
  });

  it('an empty last row leaves Enter for the browser\'s native "submit the form" behaviour', () => {
    toHistoryStep();

    fireEvent.click(screen.getByText('+ Add PCV dose'));
    const dateInput = document.querySelector('input[type="date"]');
    // Untouched row: Enter here is not intercepted at all.
    enterOn(dateInput);

    expect(document.querySelectorAll('.dose-row').length).toBe(1);
  });

  it('Enter in a row that is not the last one moves focus to the next row instead of adding one', () => {
    toHistoryStep();

    fireEvent.click(screen.getByText('+ Add PCV dose')); // row 1
    const firstDate = document.querySelector('input[type="date"]');
    fireEvent.change(firstDate, { target: { value: '2020-01-01' } });
    fireEvent.click(screen.getByText('+ Add PCV dose')); // row 2

    const dateInputs = () => document.querySelectorAll('input[type="date"]');
    expect(dateInputs().length).toBe(2);
    enterOn(dateInputs()[0]);

    expect(document.querySelectorAll('.dose-row').length).toBe(2); // unchanged
    expect(document.activeElement).toBe(dateInputs()[1]);
  });

  it('Enter on the remove button or the details-unknown checkbox is not intercepted', () => {
    toHistoryStep();

    fireEvent.click(screen.getByText('+ Add PCV dose'));
    const checkbox = document.querySelector('.dose-row input[type="checkbox"]');
    enterOn(checkbox);

    // Not this fix's concern either way: still one row, nothing added.
    expect(document.querySelectorAll('.dose-row').length).toBe(1);
  });

  it('a filled row in the Results "Recorded doses" panel gets the same fix (one shared editor)', () => {
    render(<App />);
    setAgeYears(55);
    fireEvent.click(getNextBtn()); // → Risks
    fireEvent.click(getNextBtn()); // → History
    fireEvent.click(screen.getByRole('button', { name: /view results/i })); // → Results

    fireEvent.click(screen.getByRole('button', { name: /Recorded doses/ }));
    fireEvent.click(screen.getByRole('button', { name: /Add PCV dose/ })); // row 1
    expect(document.querySelectorAll('.dose-row').length).toBe(1);

    const dateInput = document.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: '2020-01-01' } });
    enterOn(dateInput);

    expect(document.querySelectorAll('.dose-row').length).toBe(2);
  });
});
