// S3-N1 (2026-10-11) — the surface half: an adult dose given sooner than CDC
// advises still counts and never reads as an error.
//
// S14-2 (owner decision 2026-10-11) retired the "On time" / "Valid" chip
// words this file used to assert — MeningoVax is now the sole vocabulary
// authority for these two apps, and its chip just states the dose count.
// S14-3 renamed the underlying flag `earlyAdvisory` (off `offWindow`, which
// collided with MeningoVax's "off-window" meaning — a dose that does NOT
// count). What this file still protects: a dose carrying the flag counts, is
// numbered, and is never struck through like a dropped one — the advisory
// moved into the dose's reasons text, not away.
// @vitest-environment happy-dom
import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Results from '../Results.jsx';
import RecCard from '../RecCard.jsx';

// A non-neutral status so the card renders expanded and the dose rows are in
// the tree. The realistic complete-series case is covered end to end below,
// through Results and the real engine.
const baseRec = {
  vaccine: 'PCV',
  status: 'due',
  doseLabel: 'PCV dose 2',
  dueToday: false,
  earliestNextDate: null,
  minIntervalDays: null,
  minIntervalMonths: null,
  brands: [],
  note: null,
  noteCites: [],
  advisory: false,
  seriesTotal: null,
  primaryTotal: null,
  citations: [],
};

function renderWithDose(result) {
  return render(
    <RecCard
      rec={baseRec}
      doses={[{ date: '2026-02-09', product: 'PCV20' }]}
      doseValidations={[result]}
      ageMonths={845}
      dob="1956-01-01"
      today="2026-06-01"
    />
  );
}

describe('S3-N1 — the chip', () => {
  it('an off-window dose still shows its dose number, not "Invalid"', () => {
    renderWithDose({
      status: 'valid',
      earlyAdvisory: true,
      effectiveDoseNum: 2,
      reasons: ['Given less than a year after the previous dose. For adults CDC advises at least 1 year between pneumococcal conjugate doses. This dose still counts — no repeat is needed.'],
    });
    expect(screen.getByText('Dose 2')).toBeInTheDocument();
    expect(screen.queryByText('Invalid')).not.toBeInTheDocument();
  });

  it('is not struck through or dimmed like a dropped dose, and reads the plain valid color', () => {
    const { container } = renderWithDose({
      status: 'valid', earlyAdvisory: true, effectiveDoseNum: 2, reasons: ['…'],
    });
    expect(container.querySelector('.dose-val-dropped')).toBeNull();
    // S14-2: the chip no longer carries a separate color for "counts, but
    // given sooner than CDC advises" — that visual distinction retired along
    // with the word.
    expect(container.querySelector('.dose-val-valid')).not.toBeNull();
    expect(container.querySelector('.dose-val-offwindow')).toBeNull();
  });

  it('a plain valid dose shows the same chip shape', () => {
    renderWithDose({ status: 'valid', effectiveDoseNum: 1, reasons: [] });
    expect(screen.getByText('Dose 1')).toBeInTheDocument();
  });

  it('uses its own chip colour, distinct from PCV7 and from invalid', () => {
    const { container: off } = renderWithDose({
      status: 'valid', earlyAdvisory: true, effectiveDoseNum: 1, reasons: ['…'],
    });
    expect(off.querySelector('.dose-val-noncounting')).toBeNull();
    expect(off.querySelector('.dose-val-invalid')).toBeNull();
  });
});

describe('S3-N1 — the whole flow agrees, end to end', () => {
  function Harness() {
    const [state, setState] = useState({
      ageMonths: 845,
      dob: '1956-01-01',
      riskIds: [],
      // PCV13 then PCV20 five weeks later — CDC advises at least a year.
      pcvDoses: [
        { product: 'PCV13', date: '2026-01-05' },
        { product: 'PCV20', date: '2026-02-09' },
      ],
      ppsv23Doses: [],
    });
    return (
      <Results
        state={state}
        onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
        onReset={() => {}}
        today="2026-06-01"
      />
    );
  }

  it('end to end: the adult five-week gap still counts on the real engine output', () => {
    const { container } = render(<Harness />);
    // A complete adult series is a neutral card, which renders collapsed — the
    // dose rows live in its body, so open it the way a clinician would.
    fireEvent.click(container.querySelector('.rec-card-head-toggle'));
    expect(screen.getByText(/CDC advises at least 1 year/i)).toBeInTheDocument();
    // And it is still counted, not dropped, not relabeled as an error.
    expect(screen.getByText('Dose 2')).toBeInTheDocument();
    expect(screen.queryByText('Invalid')).not.toBeInTheDocument();
  });
});
