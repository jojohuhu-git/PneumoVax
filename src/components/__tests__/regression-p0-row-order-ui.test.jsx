// @vitest-environment happy-dom
// P0 (2026-10-12) — THE VERDICT WAS SHOWN AGAINST THE WRONG DOSE.
//
// `validate.js` sorts a patient's doses into DATE order before grading them
// (ANCHOR-1's single chronological pass needs that — a gap can only ever be
// measured from a dose given earlier). `perDose` therefore comes back in date
// order. Results passed the RAW state arrays — the order the clinician typed
// them in — alongside `perDose`, and `RecCard.doseRowsWithGroups` paired the
// two BY INDEX.
//
// Type the newest dose first and every verdict lands on the wrong row. The
// reproduction below is the one from the handoff, and it is the worst shape
// this bug has: the app tells a clinician that a good PCV20 does not count,
// and that a PCV7 does. Both are wrong, and both are wrong in the direction
// that changes what the patient is given.
//
// `validate.js`'s own header still promised "perDose — parallel to input".
// That stopped being true when the sort went in; the comment is corrected in
// the same commit.
//
// OWNER DECISION 2026-10-12 — render the list in DATE order.
// The two honest fixes were (a) re-key the verdicts back to the typed order,
// or (b) show the doses in the order the engine reasons about them. The owner
// chose (b): a dose list reads like a vaccination history, oldest first, and
// it also fixes the "D1 / D2" labels, which `describeDose` derives from the
// row's position and which were wrong for the same reason.
//
// THE STRUCTURAL FIX, not just the symptom: the engine now returns the doses
// themselves next to their verdicts (`result.orderedDoses`), built in the
// same loop that builds `perDose`. The UI no longer owns a dose order at all,
// so it cannot pick the wrong one. A sort re-implemented in the component
// would have been a second source of truth for the same ordering — the exact
// shape of bug this repo keeps finding.
import React, { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';
import { recommend } from '../../logic/recommend.js';

function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return (
    <Results
      state={state}
      onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
      onReset={() => {}}
      today="2026-10-12"
    />
  );
}

// The handoff's reproduction, on a card that actually shows its dose list:
// a 70-year-old whose adult PCV was typed first and whose childhood PCV7 was
// typed second. The engine grades this pair exactly as it graded the
// handoff's PCV20 pair — ['noncounting', 'valid'] in date order — but this
// patient still has a dose owed, so the card is open and the list is on
// screen. (A `complete` or `not-indicated` card collapses its body, which is
// why the handoff's own PCV20 pair has no visible surface to mis-label. Same
// bug, no window onto it.)
const NEWEST_FIRST = {
  ageMonths: 840,
  dob: '1956-01-01',
  riskIds: [],
  pcvDoses: [
    { product: 'PCV13', date: '2024-01-01' },
    { product: 'PCV7', date: '2008-05-02' },
  ],
  ppsv23Doses: [],
};

function doseRowTexts() {
  const list = screen.getByTestId('rec-progress');
  return within(list)
    .getAllByRole('listitem')
    .map((li) => li.textContent);
}

describe('P0 — a dose verdict belongs to the dose it was computed for', () => {
  it('the engine grades these two doses in date order, PCV7 first', () => {
    // The premise of the whole bug, pinned so the test cannot quietly pass
    // because the engine stopped sorting.
    const engine = recommend({ ...NEWEST_FIRST, today: '2026-10-12' });
    expect(engine.perDose.pcv.map((v) => v.status)).toEqual(['noncounting', 'valid']);
  });

  it('the PCV7 row says it does not count, and the PCV13 row says Dose 1', () => {
    render(<Harness initial={NEWEST_FIRST} />);
    const rows = doseRowTexts();

    const pcv7Row = rows.find((t) => t.includes('PCV7'));
    const pcv13Row = rows.find((t) => t.includes('PCV13'));
    expect(pcv7Row).toBeTruthy();
    expect(pcv13Row).toBeTruthy();

    // Before the fix these were swapped: the PCV13 row carried
    // the PCV7 chip (then 'Off-window - repeat', now 'Not counted'), the
    // PCV7 row carried 'Dose 1'.
    expect(pcv7Row).toContain('Not counted');
    expect(pcv13Row).toContain('Dose 1');
    expect(pcv7Row).not.toContain('Dose 1');
    expect(pcv13Row).not.toContain('Not counted');
  });

  it('the PCV7 explanation sits on the PCV7 row', () => {
    render(<Harness initial={NEWEST_FIRST} />);
    const rows = doseRowTexts();
    const pcv7Row = rows.find((t) => t.includes('PCV7'));
    const pcv13Row = rows.find((t) => t.includes('PCV13'));
    expect(pcv7Row).toMatch(/is not counted toward the pneumococcal series/);
    expect(pcv13Row).not.toMatch(/is not counted toward the pneumococcal series/);
  });

  it('the rows are listed oldest first, and D1/D2 follow that order', () => {
    // The second half of the owner's decision. `describeDose` numbers a row
    // from its position in the list, so a list in typed order numbered the
    // 2024 dose "D1" and the 2008 dose "D2" — a history that reads backwards.
    render(<Harness initial={NEWEST_FIRST} />);
    const rows = doseRowTexts();
    const pcv7Index = rows.findIndex((t) => t.includes('PCV7'));
    const pcv13Index = rows.findIndex((t) => t.includes('PCV13'));
    expect(pcv7Index).toBeLessThan(pcv13Index);
    expect(rows[pcv7Index]).toContain('D1');
    expect(rows[pcv13Index]).toContain('D2');
  });

  it('a history already typed oldest-first is unchanged', () => {
    // The control. The fix must not move a list that was already right.
    render(<Harness initial={{
      ...NEWEST_FIRST,
      pcvDoses: [
        { product: 'PCV7', date: '2008-05-02' },
        { product: 'PCV13', date: '2024-01-01' },
      ],
    }} />);
    const rows = doseRowTexts();
    const pcv7Row = rows.find((t) => t.includes('PCV7'));
    const pcv13Row = rows.find((t) => t.includes('PCV13'));
    expect(pcv7Row).toContain('Not counted');
    expect(pcv7Row).toContain('D1');
    expect(pcv13Row).toContain('Dose 1');
    expect(pcv13Row).toContain('D2');
  });
});
