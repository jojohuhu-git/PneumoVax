// @vitest-environment happy-dom
//
// P4-4 (2026-10-16). Owner decision recorded 2026-10-10, Option B: before this
// fix, an untouched History step and a step the clinician answered "no
// previous doses" for were IDENTICAL on screen — both left the PCV and
// PPSV23 lists empty. A clinician who meant to skip the step by mistake and
// one who deliberately said "nothing to record" could not be told apart.
//
// The fix: one yes/no question — "Has the patient received any pneumococcal
// vaccine?" — with "No previous doses" / "Yes, record doses" buttons. Until
// one is picked: the dose editors are hidden, a "Select yes or no above"
// hint shows, and Next is refused. "No previous doses" also clears both
// dose lists, replacing the old `.history-clear-link`.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../App.jsx';
import StepHistory from '../StepHistory.jsx';

function getNextBtn() { return screen.getByRole('button', { name: /next/i }); }

function setAgeYears(years) {
  fireEvent.click(screen.getByText(/years \/ months/i));
  fireEvent.change(screen.getByLabelText('Years'), { target: { value: String(years) } });
}

function toHistoryStep() {
  render(<App />);
  setAgeYears(40);
  fireEvent.click(getNextBtn()); // Age → Risks
  fireEvent.click(getNextBtn()); // Risks → History
  expect(screen.getByText('Vaccination History')).toBeDefined();
}

describe('P4-4 — the History step asks one yes/no question before showing dose editors', () => {
  it('hides both dose editors and shows a hint when unanswered', () => {
    toHistoryStep();
    expect(screen.queryByRole('button', { name: /\+ add pcv dose/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /\+ add ppsv23 dose/i })).toBeNull();
    expect(screen.getByText('Select yes or no above')).toBeDefined();
  });

  it('refuses to advance past History while unanswered', () => {
    toHistoryStep();
    fireEvent.click(screen.getByRole('button', { name: /view results/i }));
    // Still on History — "View Results" did nothing.
    expect(screen.getByText('Vaccination History')).toBeDefined();
    expect(screen.queryByText('Select yes or no above')).not.toBeNull();
  });

  it('"Yes, record doses" reveals both editors and lets Next advance', () => {
    toHistoryStep();
    fireEvent.click(screen.getByRole('button', { name: /yes, record doses/i }));
    expect(screen.queryByText('Select yes or no above')).toBeNull();
    expect(screen.getByRole('button', { name: /\+ add pcv dose/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /\+ add ppsv23 dose/i })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /view results/i }));
    expect(screen.queryByText('Vaccination History')).toBeNull();
  });

  it('"No previous doses" hides the editors, clears any recorded doses, and lets Next advance', () => {
    toHistoryStep();
    // Answer yes first and record a dose, to prove "No" actually clears it —
    // not just that it was never recorded.
    fireEvent.click(screen.getByRole('button', { name: /yes, record doses/i }));
    fireEvent.click(screen.getByRole('button', { name: /\+ add pcv dose/i }));
    expect(document.querySelectorAll('.dose-row').length).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: /no previous doses/i }));
    expect(screen.queryByRole('button', { name: /\+ add pcv dose/i })).toBeNull();
    expect(document.querySelectorAll('.dose-row').length).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: /view results/i }));
    expect(screen.queryByText('Vaccination History')).toBeNull();
  });

  it('answer survives Back and Next (not re-asked)', () => {
    toHistoryStep();
    fireEvent.click(screen.getByRole('button', { name: /yes, record doses/i }));
    fireEvent.click(screen.getByRole('button', { name: /back/i })); // → Risks
    fireEvent.click(getNextBtn());                                  // → History again
    expect(screen.getByRole('button', { name: /yes, record doses/i }))
      .toHaveClass('selected');
    expect(screen.queryByText('Select yes or no above')).toBeNull();
  });

  it('StepHistory in isolation: the two toggle buttons mark which is selected', () => {
    render(
      <StepHistory
        ageMonths={480} today="2026-10-16" dob={null}
        pcvDoses={[]} ppsv23Doses={[]}
        onChangePcv={() => {}} onChangePpsv={() => {}}
        historyAnswered={false} onAnswerChange={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /no previous doses/i })).toHaveClass('selected');
    expect(screen.getByRole('button', { name: /yes, record doses/i })).not.toHaveClass('selected');
  });
});
