// @vitest-environment happy-dom
//
// OWNER DECISION 2026-11-17 — the recorded-dose date box is labelled "Date",
// not "Date (optional)".
//
// ── Why ──────────────────────────────────────────────────────────────────
//
// Since §A-UNDATED (owner decision 2026-11-15, CDC General Best Practices,
// Timing and Spacing: only written, dated records count), a PCV entered with
// no date does NOT count. The label still said "(optional)", so the screen
// told a clinician the date did not matter on the one vaccine where leaving it
// blank changes the answer. Example the owner was shown: a 65-year-old with
// PCV20 entered and the date left blank — the dose reads "Not counted — no
// date" and the card still recommends a dose.
//
// Offered three choices — label each vaccine differently, plain "Date"
// everywhere, or keep "(optional)" — she chose plain "Date". A blank date
// still works on both rows; the dose's own label explains what happened.
// So the box is not made required, and this test does not assert that.
//
// One label for both rows, because both rows come from the one shared
// `DoseEditor.jsx` (S9). The age box's "Months (optional)" is a different
// field and is untouched.
import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import StepHistory from '../StepHistory.jsx';
import { PPSV23_PRODUCT } from '../../data/brands.js';

function Harness() {
  const [state, setState] = useState({
    pcvDoses: [{ date: '', product: 'PCV20' }],
    ppsv23Doses: [{ date: '', product: PPSV23_PRODUCT.value }],
  });
  return (
    <StepHistory
      historyAnswered={true}
      ageMonths={780}
      dob={null}
      today="2026-11-17"
      pcvDoses={state.pcvDoses}
      ppsv23Doses={state.ppsv23Doses}
      onChangePcv={(pcvDoses) => setState((s) => ({ ...s, pcvDoses }))}
      onChangePpsv={(ppsv23Doses) => setState((s) => ({ ...s, ppsv23Doses }))}
    />
  );
}

describe('the recorded-dose date box says "Date", not "Date (optional)" (owner 2026-11-17)', () => {
  it('labels the PCV row and the PPSV23 row "Date"', () => {
    render(<Harness />);
    const dateBoxes = screen.getAllByLabelText('Date');
    expect(dateBoxes).toHaveLength(2);
    for (const box of dateBoxes) expect(box.type).toBe('date');
  });

  it('shows "Date (optional)" nowhere', () => {
    render(<Harness />);
    expect(screen.queryAllByLabelText('Date (optional)')).toHaveLength(0);
    expect(document.body.textContent).not.toContain('Date (optional)');
  });

  it('does not make the date required — a blank date is still allowed', () => {
    render(<Harness />);
    for (const box of screen.getAllByLabelText('Date')) expect(box.required).toBe(false);
  });

  // Second surface, found by driving the app: the History step's intro line
  // read "Date is optional (counting works without it)." — false for a PCV
  // since 2026-11-15. Offered three rewordings, the owner chose the one that
  // asks for the date and states the consequence.
  it('the History step asks for the date and says an undated PCV does not count', () => {
    render(<Harness />);
    const text = document.body.textContent.replace(/\s+/g, ' ');
    expect(text).toContain(
      'Enter the date if known; a PCV with no date does not count. ' +
      'PCV7 is recorded but never counts toward the series.'
    );
    expect(text).not.toContain('Date is optional');
    expect(text).not.toContain('counting works without it');
  });

  it('the shared editor source carries no "(optional)" on a dose field', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/DoseEditor.jsx'), 'utf8');
    expect(src).not.toContain('Date (optional)');
  });
});
