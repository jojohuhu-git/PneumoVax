// @vitest-environment happy-dom
// S14-4C (2026-10-12) — the UI half of the same-visit fix.
//
// The decision the owner took was explicitly "chip AND sentence together":
// a note reading "this dose does not add to the series" beside a chip reading
// "Dose 1 of 1" is the single-surface fix CLAUDE.md forbids. The engine test
// (`src/logic/__tests__/regression-s14-4c-same-day-completing-dose.test.js`)
// asserts the chip WORD via `doseChipLabel`; this file asserts the chip a
// clinician can actually see, rendered by the real component from the real
// engine's verdict.
//
// Same collapsed-card problem as S14-4B's UI test: every patient this rule
// touches has a `complete` or `not-indicated` card, and RecCard collapses
// those by default, so a test that does not open the card proves nothing.
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';
import { recommend } from '../../logic/recommend.js';

const TODAY = '2026-10-11';
const VISIT = '2018-03-01';

// 40y, no risk conditions. The PCV20 completed the adult series by itself,
// and the PPSV23 went into the same arm at the same visit.
const ONE_VISIT = {
  ageMonths: 489,
  dob: '1986-01-01',
  riskIds: [],
  pcvDoses: [{ product: 'PCV20', date: VISIT }],
  ppsv23Doses: [{ product: 'PPSV23', date: VISIT }],
};

// The control S14-4C is bounded by: a PCV15 six years earlier OWED a PPSV23,
// so when the PCV20 and that PPSV23 land at one visit either dose finishes
// the series and the app calls neither one surplus.
const PPSV23_WAS_OWED = {
  ...ONE_VISIT,
  pcvDoses: [{ product: 'PCV15', date: '2012-01-01' }, { product: 'PCV20', date: VISIT }],
};

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

describe('S14-4C UI — a same-visit PPSV23 reads the same as one given a day later', () => {
  it('the engine marks it an extra dose (the verdict the card is built from)', () => {
    const engine = recommend({ ...ONE_VISIT, today: TODAY });
    expect(engine.perDose.ppsv23[0].extraDose).toBe(true);
    expect(engine.perDose.ppsv23[0].effectiveDoseNum).toBeNull();
  });

  it('the chip reads "Extra dose", not "Dose 1"', () => {
    render(<Harness initial={ONE_VISIT} />);
    openTheCard();
    const chip = screen.getByText('Extra dose — more than this series needs');
    expect(chip.className).toMatch(/dose-val-offwindow/);
    expect(chip.className).not.toMatch(/dose-val-invalid/);
  });

  it('the explanation says "same visit" and names the product that completed the series', () => {
    render(<Harness initial={ONE_VISIT} />);
    openTheCard();
    expect(screen.getByText(
      /Given at the same visit as the .*PCV20.*no PPSV23 was needed, and this dose does not add to the series/
    )).toBeTruthy();
  });

  it('it never says "after" about two doses carrying one date', () => {
    render(<Harness initial={ONE_VISIT} />);
    openTheCard();
    expect(screen.queryByText(/after the series was already complete/)).toBeNull();
  });

  it('it no longer advises a 1-year gap for a dose no interval would have fixed', () => {
    // 144 of the sweep's 16,250 patients read that sentence here.
    render(<Harness initial={ONE_VISIT} />);
    openTheCard();
    expect(screen.queryByText(/CDC advises at least 1 year between a conjugate dose and PPSV23/))
      .toBeNull();
    expect(screen.queryByText(/This dose still counts/)).toBeNull();
  });

  it('CONTROL — a PPSV23 an earlier PCV15 owed still reads as a dose', () => {
    const engine = recommend({ ...PPSV23_WAS_OWED, today: TODAY });
    expect(engine.perDose.ppsv23[0].extraDose).toBeFalsy();
    expect(engine.perDose.ppsv23[0].effectiveDoseNum).toBe(1);
    render(<Harness initial={PPSV23_WAS_OWED} />);
    openTheCard();
    expect(screen.queryByText('Extra dose — more than this series needs')).toBeNull();
  });
});
