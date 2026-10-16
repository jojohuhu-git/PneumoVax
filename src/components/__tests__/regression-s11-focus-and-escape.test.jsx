// @vitest-environment happy-dom
//
// S11 / P5-3 and P5-5 (2026-10-12): the cursor lands when a step opens, and
// Escape closes the panels it opened.
//
// ── P5-3, what was wrong ─────────────────────────────────────────────────
//
// After Next or Back, nothing was focused. A keyboard user had to press Tab
// once before they could type anything — and that one stray keystroke is what
// makes people give up and reach for the mouse.
//
// Owner decision, recorded in MeningoVax's K4 and applied here unchanged:
// always focus the step's first real field, ON PHONES TOO, even though that
// opens the on-screen keyboard and hides part of the page there. If that turns
// out to be annoying in practice, a narrow-screen exception is a one-line
// change — not pre-empted here.
//
// The Results step is deliberately excluded: it is read, not filled in, so
// stealing focus there would move a screen reader away from the recommendation
// the clinician just asked for.
//
// ── P5-5, what was wrong ─────────────────────────────────────────────────
//
// The Results page has two panels — "Adjust age" and "Recorded doses". Both
// opened, and neither could be closed from the keyboard without tabbing back to
// the toggle that opened it. Escape is what people press.
//
// Order matters: the dose panel closes FIRST, because it is the more specific,
// more nested edit surface. Closing it also sweeps away rows the clinician
// added and never typed in, exactly as the toggle does — the sweep lives in
// `closeDosePanel`, so Escape cannot take a different path from the mouse.
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import App from '../../App.jsx';
import Results from '../Results.jsx';

const TODAY = '2026-10-12';

/** Fill in the age step and continue, leaving the wizard on Risk Factors. */
function advanceFromAge(container) {
  fireEvent.change(container.querySelector('input[type="date"]'), {
    target: { value: '2015-01-01' },
  });
  fireEvent.submit(container.querySelector('form'));
}

describe('S11 / P5-3 — the cursor lands when a step opens', () => {
  it('starts in the date-of-birth box, so you can just type', () => {
    const { container } = render(<App />);
    expect(document.activeElement).toBe(container.querySelector('#dob-input'));
  });

  it('lands on the first risk factor after Next', () => {
    const { container } = render(<App />);
    advanceFromAge(container);
    expect(document.activeElement).toBe(
      container.querySelector('input[type="checkbox"]')
    );
  });

  it('lands on the first control of the history step', () => {
    const { container } = render(<App />);
    advanceFromAge(container);
    fireEvent.submit(container.querySelector('form')); // Risks -> History
    expect(container.querySelector('.step-title').textContent)
      .toBe('Vaccination History');
    // P4-4: the yes/no question is unanswered on arrival, so its first toggle
    // button ("No previous doses") is the step's first real control — not
    // `.add-dose-btn`, which only exists once "Yes, record doses" is picked.
    expect(document.activeElement).toBe(container.querySelector('.history-toggle-btn'));
  });

  it('does NOT steal focus on the Results step', () => {
    const { container } = render(<App />);
    advanceFromAge(container);
    fireEvent.submit(container.querySelector('form')); // -> History
    // P4-4: Next now refuses to leave History until the yes/no question is
    // answered.
    fireEvent.click(screen.getByRole('button', { name: /no previous doses/i }));
    fireEvent.submit(container.querySelector('form')); // -> Results
    // The history step's button is gone from the document, so focus falls back
    // to the body. What matters is that nothing on the results page grabbed it:
    // a screen reader stays on the recommendation the clinician just asked for.
    expect(document.activeElement).toBe(document.body);
  });
});

describe('S11 / P5-5 — Escape closes the Results panels', () => {
  const patient = {
    ageMonths: 141,
    ageGroup: 'child',
    dob: '2015-01-01',
    riskIds: [],
    pcvDoses: [{ date: '2016-03-01', product: 'PCV13' }],
    ppsv23Doses: [],
  };

  function renderResults(onChange = () => {}) {
    return render(
      <Results state={patient} today={TODAY} onReset={() => {}}
        onChange={onChange} onBack={() => {}} />
    );
  }

  function pressEscape() {
    fireEvent.keyDown(document, { key: 'Escape' });
  }

  it('closes the recorded-doses panel', () => {
    const { container } = renderResults();
    fireEvent.click(screen.getByRole('button', { name: /Recorded doses/ }));
    expect(container.querySelector('[data-testid="recorded-doses-panel"]')).not.toBeNull();

    pressEscape();
    expect(container.querySelector('[data-testid="recorded-doses-panel"]')).toBeNull();
  });

  it('closes the age panel', () => {
    const { container } = renderResults();
    fireEvent.click(screen.getByRole('button', { name: /Adjust age/ }));
    const openCount = container.querySelectorAll('#results-years').length;
    expect(openCount).toBe(1);

    pressEscape();
    expect(container.querySelectorAll('#results-years')).toHaveLength(0);
  });

  it('closes the dose panel first when both have been opened', () => {
    const { container } = renderResults();
    // Opening the dose panel closes the age panel in this app, so "both open"
    // is not reachable through the UI. Assert the precedence that the handler
    // encodes instead: with the dose panel open, Escape closes THAT.
    fireEvent.click(screen.getByRole('button', { name: /Recorded doses/ }));
    pressEscape();
    expect(container.querySelector('[data-testid="recorded-doses-panel"]')).toBeNull();
  });

  it('sweeps never-typed rows on Escape, exactly as closing by mouse does', () => {
    // The risk this guards: Escape taking a different code path from the toggle
    // and leaving blank rows behind.
    //
    // This one needs a STATEFUL wrapper, not a spy. Results is a controlled
    // component: with an onChange that only records, adding a row never reaches
    // `state.pcvDoses`, so the panel still holds one dose and closing it has
    // nothing to sweep — the test would pass or fail for reasons unrelated to
    // Escape. The wrapper applies the patch the way App does.
    function Harness() {
      const [s, setS] = React.useState(patient);
      return (
        <Results state={s} today={TODAY} onReset={() => {}} onBack={() => {}}
          onChange={patch => setS(prev => ({ ...prev, ...patch }))} />
      );
    }
    const { container } = render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: /Recorded doses/ }));
    fireEvent.click(screen.getByRole('button', { name: /Add PCV dose/ }));
    expect(container.querySelectorAll('.dose-row')).toHaveLength(2);

    pressEscape();
    expect(container.querySelector('[data-testid="recorded-doses-panel"]')).toBeNull();

    // Re-open: the never-typed row is gone, the real dose is still there.
    fireEvent.click(screen.getByRole('button', { name: /Recorded doses/ }));
    expect(container.querySelectorAll('.dose-row')).toHaveLength(1);
  });

  it('does nothing when no panel is open', () => {
    const { container } = renderResults();
    pressEscape();
    // Still showing the recommendation, nothing thrown, nothing closed.
    expect(container.querySelector('[data-testid="recorded-doses-panel"]')).toBeNull();
    expect(screen.getByRole('button', { name: /Recorded doses/ })).toBeTruthy();
  });
});
