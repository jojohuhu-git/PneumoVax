// @vitest-environment happy-dom
// P1-3 (2026-10-12) — the UI half: the clinician can still record a dose they
// have no card for, and an untouched row is cleaned up rather than counted.
//
// The engine half is in `src/logic/__tests__/regression-p1-3-blank-row-is-
// not-a-dose.test.js`. This file covers what the engine cannot see:
//
//   • a dose with no date is kept by CHOOSING ITS PRODUCT (OWNER DECISION
//     2026-11-27: the details-unknown tick this file was written for is gone
//     from both apps), and the row says what the missing date means — a PCV is
//     not counted, a PPSV23 still is;
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
//     (That exception is itself gone since 2026-11-27: nothing is stamped.)
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
      historyAnswered={true}
      ageMonths={24}
      pcvDoses={state.pcvDoses}
      ppsv23Doses={state.ppsv23Doses}
      onChangePcv={(pcvDoses) => setState((s) => ({ ...s, pcvDoses }))}
      onChangePpsv={(ppsv23Doses) => setState((s) => ({ ...s, ppsv23Doses }))}
      today={TODAY}
    />
  );
}

const anyTick = () => screen.queryAllByRole('checkbox');
const selects = (c) => [...c.querySelectorAll('select')];

describe('P1-3 UI — the history step', () => {
  it('no row offers a details-unknown tick any more (OWNER DECISION 2026-11-27)', () => {
    render(<HistoryHarness />);
    fireEvent.click(screen.getByText('+ Add PCV dose'));
    fireEvent.click(screen.getByText('+ Add PPSV23 dose'));
    expect(anyTick()).toHaveLength(0);
    expect(screen.queryByText(/date is unknown|date and product are unknown/i)).toBeNull();
  });

  it('a PPSV23 row is born empty and CHOOSES its product, like a PCV row', () => {
    // Until 2026-11-27 it was born carrying `product: 'PPSV23'`, which is why
    // only the tick could tell an undated PPSV23 from an untouched row.
    let latest = null;
    function Spy() {
      const [state, setState] = useState({ pcvDoses: [], ppsv23Doses: [] });
      latest = state;
      return (
        <StepHistory historyAnswered={true} ageMonths={24} pcvDoses={state.pcvDoses} ppsv23Doses={state.ppsv23Doses}
          onChangePcv={(pcvDoses) => setState((s) => ({ ...s, pcvDoses }))}
          onChangePpsv={(ppsv23Doses) => setState((s) => ({ ...s, ppsv23Doses }))} today={TODAY} />
      );
    }
    const { container } = render(<Spy />);
    fireEvent.click(screen.getByText('+ Add PPSV23 dose'));
    expect(latest.ppsv23Doses[0].product).toBe('');
    const [ppsvSelect] = selects(container);
    expect([...ppsvSelect.options].map((o) => o.textContent)).toEqual(['Choose product', 'PPSV23 (Pneumovax 23)']);
    // Typing a date chooses the only product, so the card never says "product unknown".
    fireEvent.change(container.querySelector('input[type="date"]'), { target: { value: '2025-03-01' } });
    expect(latest.ppsv23Doses[0].product).toBe('PPSV23');
  });

  it('a PCV chosen with no date is kept, and its row says it is not counted', () => {
    const { container } = render(<HistoryHarness />);
    fireEvent.click(screen.getByText('+ Add PCV dose'));
    expect(container.querySelector('[data-problem="no-date"]')).toBeNull();   // untouched: says nothing
    fireEvent.change(selects(container)[0], { target: { value: 'PCV20' } });
    expect(container.querySelector('[data-problem="no-date"]').textContent).toMatch(/^With no date, this dose is not counted/);
  });

  it('a PPSV23 chosen with no date is kept, and its row says it still counts', () => {
    const { container } = render(<HistoryHarness />);
    fireEvent.click(screen.getByText('+ Add PPSV23 dose'));
    fireEvent.change(selects(container)[0], { target: { value: 'PPSV23' } });
    expect(container.querySelector('[data-problem="no-date"]').textContent).toMatch(/^With no date, this PPSV23 still counts: CDC accepts an undated PPSV23 record/);
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

  it('a row with a product and no date IS on the record', () => {
    const { container } = render(<ResultsHarness initial={ADULT} />);
    fireEvent.click(dosesButton());
    fireEvent.click(screen.getByText('+ Add PPSV23 dose'));
    const panel = screen.getByTestId('recorded-doses-panel');
    fireEvent.change(panel.querySelectorAll('select')[0], { target: { value: 'PPSV23' } });
    expect(dosesButton().textContent).toBe('Recorded doses (1)');
    expect(container.querySelector('[data-problem="no-date"]')).not.toBeNull();
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
