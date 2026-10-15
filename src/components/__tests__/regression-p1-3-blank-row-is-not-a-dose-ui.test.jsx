// @vitest-environment happy-dom
// P1-3 (2026-10-12) — the UI half: the clinician can still record a dose they
// have no card for, and an untouched row is cleaned up rather than counted.
//
// The engine half is in `src/logic/__tests__/regression-p1-3-blank-row-is-
// not-a-dose.test.js`. This file covers what the engine cannot see:
//
//   • the tick exists, and appears only while a row is otherwise empty —
//     that is the only case where "I have not typed yet" and "a dose was
//     given, details unknown" are different claims;
//   • ticking it keeps the dose on the record;
//   • "Recorded doses (N)" counts doses, not rows, so the button cannot say
//     "(1)" above a card showing none;
//   • untouched rows are swept when the clinician LEAVES the panel, never
//     while they are still in it.
//
// MUTATION-TESTED 2026-10-12, across this file and its logic twin (22 tests
// between them). Measured, not estimated:
//   • `isBlankDoseRow` always returns false (nothing is ever blank)
//       → 11 of 22 fail.
//   • the `STAMPED_AT_CREATION` exception removed, so a new PPSV23 row looks
//     filled in because the app stamped its product on
//       → 1 of 22 fails — the one test written for exactly that half.
//   • `analyzeBoth` stops dropping blank rows (the single filter point)
//       → 4 of 22 fail.
//   • the Results panel sweeps while it is still OPEN, so a row vanishes
//     under the cursor
//       → 2 of this file's 9 fail.
//
// A fifth mutation found a REAL defect in the first draft rather than in the
// code: `recommend.js` filtered blank rows a second time before handing them
// to the walk, and removing that filter broke nothing, because the walk
// already does it and `meta.pcvCount` is counted from the walk's output. A
// second place deciding what a dose is, that no test could see. Deleted — see
// the comment left in its place.
import React, { useState } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';
import StepHistory from '../StepHistory.jsx';

const TODAY = '2026-10-12';

function ResultsHarness({ initial }) {
  const [state, setState] = useState(initial);
  return (
    <Results
      state={state}
      onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
      onReset={() => {}}
      today={TODAY}
    />
  );
}

function HistoryHarness({ initial = { pcvDoses: [], ppsv23Doses: [] } }) {
  const [state, setState] = useState(initial);
  return (
    <StepHistory
      ageMonths={24}
      pcvDoses={state.pcvDoses}
      ppsv23Doses={state.ppsv23Doses}
      onChangePcv={(pcvDoses) => setState((s) => ({ ...s, pcvDoses }))}
      onChangePpsv={(ppsv23Doses) => setState((s) => ({ ...s, ppsv23Doses }))}
      today={TODAY}
    />
  );
}

const unknownTicks = () =>
  screen.queryAllByRole('checkbox', { name: /a dose was given, but the date and product are unknown/i });

describe('P1-3 UI — the history step', () => {
  it('a new, untouched row offers the tick', () => {
    render(<HistoryHarness />);
    expect(unknownTicks()).toHaveLength(0);
    fireEvent.click(screen.getByText('+ Add PCV dose'));
    expect(unknownTicks()).toHaveLength(1);
  });

  it('the tick disappears once the row says anything', () => {
    // Only an otherwise-empty row is ambiguous. Once a date or a product is
    // there, the row is a dose and the question does not arise.
    const { container } = render(<HistoryHarness />);
    fireEvent.click(screen.getByText('+ Add PCV dose'));
    // The "Date (optional)" <label> is not associated with its input — an
    // existing accessibility gap, S11's territory, not this item's. Selected
    // by type so this test is not blocked on it.
    const dateInput = container.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: '2025-03-01' } });
    expect(unknownTicks()).toHaveLength(0);
  });

  it('an untouched PPSV23 row offers it too', () => {
    // The PPSV23 row is born carrying `product: 'PPSV23'` so the card can
    // print it. That stamp must not make the row look filled in — this is the
    // half of P1-3 that a naive "is every field empty?" check would miss.
    render(<HistoryHarness />);
    fireEvent.click(screen.getByText('+ Add PPSV23 dose'));
    expect(unknownTicks()).toHaveLength(1);
  });

  it('ticking it records the dose', () => {
    let latest = null;
    function Spy() {
      const [state, setState] = useState({ pcvDoses: [], ppsv23Doses: [] });
      latest = state;
      return (
        <StepHistory
          ageMonths={24}
          pcvDoses={state.pcvDoses}
          ppsv23Doses={state.ppsv23Doses}
          onChangePcv={(pcvDoses) => setState((s) => ({ ...s, pcvDoses }))}
          onChangePpsv={(ppsv23Doses) => setState((s) => ({ ...s, ppsv23Doses }))}
          today={TODAY}
        />
      );
    }
    render(<Spy />);
    fireEvent.click(screen.getByText('+ Add PCV dose'));
    fireEvent.click(unknownTicks()[0]);
    expect(latest.pcvDoses[0].detailsUnknown).toBe(true);
  });
});

describe('P1-3 UI — the Results "Recorded doses" panel', () => {
  const ADULT = {
    ageMonths: 840,
    dob: '1956-01-01',
    riskIds: [],
    pcvDoses: [],
    ppsv23Doses: [],
  };

  const dosesButton = () => screen.getByRole('button', { name: /^Recorded doses/ });

  it('the button counts doses, not rows', () => {
    render(<ResultsHarness initial={ADULT} />);
    fireEvent.click(dosesButton());
    expect(dosesButton().textContent).toBe('Recorded doses');   // no count at zero
    fireEvent.click(screen.getByText('+ Add PCV dose'));
    // A row nobody typed in: the engine does not count it, so neither does
    // the button. Before the fix this read "Recorded doses (1)".
    expect(dosesButton().textContent).toBe('Recorded doses');
  });

  it('a ticked row IS counted', () => {
    render(<ResultsHarness initial={ADULT} />);
    fireEvent.click(dosesButton());
    fireEvent.click(screen.getByText('+ Add PCV dose'));
    fireEvent.click(unknownTicks()[0]);
    expect(dosesButton().textContent).toBe('Recorded doses (1)');
  });

  it('an untouched row survives while the panel is OPEN', () => {
    // It must not vanish under the cursor of someone who is mid-entry.
    render(<ResultsHarness initial={ADULT} />);
    fireEvent.click(dosesButton());
    fireEvent.click(screen.getByText('+ Add PCV dose'));
    const panel = screen.getByTestId('recorded-doses-panel');
    expect(within(panel).getAllByLabelText(/Remove PCV dose/)).toHaveLength(1);
  });

  it('and is swept when the panel is closed', () => {
    render(<ResultsHarness initial={ADULT} />);
    fireEvent.click(dosesButton());
    fireEvent.click(screen.getByText('+ Add PCV dose'));
    fireEvent.click(dosesButton());               // close
    fireEvent.click(dosesButton());               // reopen
    const panel = screen.getByTestId('recorded-doses-panel');
    expect(within(panel).queryAllByLabelText(/Remove PCV dose/)).toHaveLength(0);
    expect(within(panel).getByText(/No PCV doses recorded/)).toBeTruthy();
  });

  it('closing the panel never sweeps a row that holds anything', () => {
    // The control. Sweeping must only ever remove rows nobody touched.
    render(<ResultsHarness initial={{
      ...ADULT,
      pcvDoses: [{ date: '2020-01-01', product: 'PCV13' }],
    }} />);
    fireEvent.click(dosesButton());
    fireEvent.click(screen.getByText('+ Add PCV dose'));   // one real, one blank
    fireEvent.click(dosesButton());
    fireEvent.click(dosesButton());
    const panel = screen.getByTestId('recorded-doses-panel');
    expect(within(panel).getAllByLabelText(/Remove PCV dose/)).toHaveLength(1);
    expect(dosesButton().textContent).toBe('Recorded doses (1)');
  });
});
