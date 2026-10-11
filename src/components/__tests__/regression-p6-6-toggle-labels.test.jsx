// @vitest-environment happy-dom
// P6-6 (S13, 2026-10-10): the toggle buttons in the Results header labelled
// themselves two different ways. "Adjust age" and "Recorded doses" swapped
// their label to "Done" when open; "Color key" kept its label and rotated its
// chevron. The queue called it trivial but visible, and said: pick one.
//
// Picked: keep the label, rotate the chevron. Three reasons, in order of
// weight —
//   1. It was already the majority pattern inside this very component (Color
//      key did it, and P6-4's "Why this" disclosure does it too), so the odd
//      ones out were the "Done" pair.
//   2. It matches MeningoVax, and the two sibling apps share one design
//      system (design-review: MeningoVax design decisions flow to PneumoVax).
//   3. "Done" throws away the only thing that says what the button controls.
//      A reader who looks away and back sees a bare "Done" with no clue what
//      it closes — and with two of them open at once, two identical buttons.
//
// `aria-expanded` already carried the open/shut state for screen readers, and
// still does; this is about what the sighted reader sees.
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';

function Harness() {
  const [state, setState] = useState({
    ageMonths: 840,
    dob: '1956-04-02',
    riskIds: [],
    pcvDoses: [{ product: 'PCV13', date: '2020-01-15' }],
    ppsv23Doses: [],
  });
  return (
    <Results
      state={state}
      onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
      onReset={() => {}}
      today="2026-06-07"
    />
  );
}

describe('P6-6 — a toggle keeps its label when open', () => {
  it('"Adjust age" still says "Adjust age" once open', () => {
    render(<Harness />);
    const btn = screen.getByRole('button', { name: /Adjust age/i });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    expect(screen.getByRole('button', { name: /Adjust age/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Adjust age/i }).getAttribute('aria-expanded')).toBe('true');
  });

  it('"Recorded doses" keeps its label and its count once open', () => {
    render(<Harness />);
    const btn = screen.getByRole('button', { name: /Recorded doses/i });
    fireEvent.click(btn);
    const open = screen.getByRole('button', { name: /Recorded doses/i });
    expect(open.getAttribute('aria-expanded')).toBe('true');
    expect(open.textContent).toMatch(/\(1\)/);
  });

  it('no toggle in the results header renders the word "Done"', () => {
    render(<Harness />);
    for (const name of [/Adjust age/i, /Recorded doses/i, /Color key/i]) {
      fireEvent.click(screen.getByRole('button', { name }));
    }
    expect(screen.queryByRole('button', { name: /^Done$/ })).toBeNull();
  });

  it('all three header toggles report state through aria-expanded', () => {
    render(<Harness />);
    for (const name of [/Adjust age/i, /Recorded doses/i, /Color key/i]) {
      const btn = screen.getByRole('button', { name });
      expect(btn.getAttribute('aria-expanded')).toBe('false');
      fireEvent.click(btn);
      expect(screen.getByRole('button', { name }).getAttribute('aria-expanded')).toBe('true');
    }
  });
});
