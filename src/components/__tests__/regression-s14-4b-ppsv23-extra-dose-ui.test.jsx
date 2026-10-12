// @vitest-environment happy-dom
// S14-4B (2026-10-12) — the UI half. The engine change is only half a fix if
// the chip and the explanation a clinician actually reads do not move with
// it (CLAUDE.md: a fix is not done until every surface is fixed or proven
// unaffected).
//
// `doseChipLabel.js` is vaccine-agnostic — it reads `extraDose` off the
// verdict — so the PPSV23 chip SHOULD inherit S14-4's wording and its
// off-window blue with no change to that file. This test is what proves it,
// rather than assuming it: the verdicts here come from the real engine
// (`recommend()`), not hand-written fixtures, which is also the P6-5
// guarantee (one walk, the engine's).
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';
import { recommend } from '../../logic/recommend.js';

const TODAY = '2026-10-11';

// 40y, no risk conditions. PCV20 in 2012 completed the adult series on its
// own; the PPSV23 six years later added nothing.
const NOT_NEEDED = {
  ageMonths: 489,
  dob: '1986-01-01',
  riskIds: [],
  pcvDoses: [{ product: 'PCV20', date: '2012-01-01' }],
  ppsv23Doses: [{ product: 'PPSV23', date: '2018-03-01' }],
};

// The control: the same patient, but the conjugate was a PCV15 — which
// always requires PPSV23 — so that same PPSV23 is the dose that COMPLETED
// the series.
const COMPLETED_IT = {
  ...NOT_NEEDED,
  pcvDoses: [{ product: 'PCV15', date: '2012-01-01' }],
};

// Every patient this rule touches has a `complete` or `not-indicated` PCV
// card, and RecCard collapses all three neutral statuses by default — so the
// per-dose explanation sits behind one click here, exactly as S14-4's PCV
// extra dose already did. Pre-existing and consistent, not introduced by
// S14-4B, but it means a UI test that does not expand the card proves
// nothing. This opens it the way a clinician does.
function openTheCard() {
  for (const btn of screen.getAllByRole('button', { expanded: false })) {
    if (/rec-card-head-toggle/.test(btn.className)) fireEvent.click(btn);
  }
}

function Harness({ initial }) {
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

describe('S14-4B UI — the PPSV23 extra dose is visible on the card', () => {
  it('the engine marks it an extra dose (the verdict the card is built from)', () => {
    const engine = recommend({ ...NOT_NEEDED, today: TODAY });
    expect(engine.perDose.ppsv23[0].extraDose).toBe(true);
    expect(engine.perDose.ppsv23[0].effectiveDoseNum).toBeNull();
  });

  it('the chip reads "Extra dose", not "Dose 1"', () => {
    render(<Harness initial={NOT_NEEDED} />);
    openTheCard();
    const chip = screen.getByText('Extra dose — more than this series needs');
    expect(chip).toBeTruthy();
    // Set aside for an administrative reason, not an error — off-window
    // blue, never the red invalid chip.
    expect(chip.className).toMatch(/dose-val-offwindow/);
    expect(chip.className).not.toMatch(/dose-val-invalid/);
  });

  it('the explanation names the product that completed the series', () => {
    render(<Harness initial={NOT_NEEDED} />);
    openTheCard();
    expect(screen.getByText(
      /Given after the series was already complete .*PCV20.*does not extend the series/
    )).toBeTruthy();
  });

  it('it no longer quotes an interval for a dose nothing asked for', () => {
    // 300 of the sweep's 16,250 patients used to read this sentence here.
    render(<Harness initial={NOT_NEEDED} />);
    openTheCard();
    expect(screen.queryByText(/CDC advises at least 1 year between a conjugate dose and PPSV23/))
      .toBeNull();
  });

  it('CONTROL — the PPSV23 that COMPLETED a PCV15 series still reads as a dose', () => {
    // The two cases used to render identically. This is the half that must
    // NOT have moved.
    const engine = recommend({ ...COMPLETED_IT, today: TODAY });
    expect(engine.perDose.ppsv23[0].extraDose).toBeFalsy();
    expect(engine.perDose.ppsv23[0].effectiveDoseNum).toBe(1);
    render(<Harness initial={COMPLETED_IT} />);
    openTheCard();
    expect(screen.queryByText('Extra dose — more than this series needs')).toBeNull();
    // Two "Dose 1" chips: the PCV15, and the PPSV23 that completed it.
    expect(screen.getAllByText('Dose 1')).toHaveLength(2);
  });
});
