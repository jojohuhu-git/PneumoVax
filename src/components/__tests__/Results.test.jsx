// @vitest-environment happy-dom
import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';

// Stateful wrapper: Results re-renders live from onChange, same as App does.
function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return (
    <Results
      state={state}
      onChange={patch => setState(s => ({ ...s, ...patch }))}
      onReset={() => {}}
    />
  );
}

function yearsAgoISO(years) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

// Item 4 parity (2026-07-23, ported from MeningoVax): a shared-decision PCV
// rec (PCV20/21 after PPSV23 given at >=65y) can be dueToday AND optional at
// the same time -- the summary line must not call it flatly "due." Fixture:
// a 75yo, PCV13 given 10y ago, PPSV23 given 6y ago (age-at-PPSV23 = 69 >= 65
// -> shared decision; 6y since PPSV23 >= the 5y interval -> dueToday).
function sharedDecisionDueState() {
  return {
    ageMonths: 900, // 75y
    riskIds: [],
    pcvDoses: [{ product: 'PCV13', date: yearsAgoISO(10) }],
    ppsv23Doses: [{ product: 'PPSV23', date: yearsAgoISO(6) }],
  };
}

describe('Item 4 parity: required vs optional in "due today" copy', () => {
  it('summary line marks the shared-decision PCV dose optional, not "Due today: PCV"', () => {
    render(<Harness initial={sharedDecisionDueState()} />);
    const summary = screen.getByTestId('results-summary-line');
    expect(summary.textContent).not.toMatch(/^Due today: PCV\.?$/);
    expect(summary.textContent).toMatch(/optional.*\(shared clinical decision\)/i);
  });

  it('status badge reads "Optional (shared decision)"', () => {
    render(<Harness initial={sharedDecisionDueState()} />);
    expect(screen.getByText('Optional (shared decision)')).toBeDefined();
    expect(screen.queryByText('Shared decision')).toBeNull();
  });
});
