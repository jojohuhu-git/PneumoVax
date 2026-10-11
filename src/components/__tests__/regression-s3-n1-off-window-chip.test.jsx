// S3-N1 (2026-10-11) — the surface half: an adult dose given sooner than CDC
// advises reads "Valid", not "On time", and never reads as an error.
//
// Vocabulary mirrors vaxapp's settled pair (design-review, cross-app copy
// parity): "Done · on time" = within the routine window; "Done · valid" =
// outside it but still counts toward the series. vaxapp's third term,
// "off-window · repeat", means a dose that does NOT count — this is not that,
// and the copy here must never imply a repeat is owed.
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
  it('reads "Valid" for an off-window dose, not "On time"', () => {
    renderWithDose({
      status: 'valid',
      offWindow: true,
      effectiveDoseNum: 2,
      reasons: ['Given less than a year after the previous dose. For adults CDC advises at least 1 year between pneumococcal conjugate doses. This dose still counts — no repeat is needed.'],
    });
    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.queryByText('On time')).not.toBeInTheDocument();
    expect(screen.queryByText('Invalid')).not.toBeInTheDocument();
  });

  it('still shows the dose number — an off-window dose counts', () => {
    renderWithDose({ status: 'valid', offWindow: true, effectiveDoseNum: 2, reasons: ['…'] });
    expect(screen.getByText(/Dose 2/)).toBeInTheDocument();
  });

  it('is not struck through or dimmed like a dropped dose', () => {
    const { container } = renderWithDose({
      status: 'valid', offWindow: true, effectiveDoseNum: 2, reasons: ['…'],
    });
    expect(container.querySelector('.dose-val-dropped')).toBeNull();
    expect(container.querySelector('.dose-val-offwindow')).not.toBeNull();
  });

  it('a plain valid dose still reads "On time"', () => {
    renderWithDose({ status: 'valid', effectiveDoseNum: 1, reasons: [] });
    expect(screen.getByText('On time')).toBeInTheDocument();
    expect(screen.queryByText('Valid')).not.toBeInTheDocument();
  });

  it('uses its own chip colour, distinct from PCV7 and from invalid', () => {
    const { container: off } = renderWithDose({
      status: 'valid', offWindow: true, effectiveDoseNum: 1, reasons: ['…'],
    });
    expect(off.querySelector('.dose-val-noncounting')).toBeNull();
    expect(off.querySelector('.dose-val-invalid')).toBeNull();
  });
});

describe('S3-N1 — the legend explains it, and the whole flow agrees', () => {
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

  it('the colour key says the dose still counts and needs no repeat', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /Color key/i }));
    expect(screen.getByText(/given sooner than CDC advises, but it still counts/i)).toBeInTheDocument();
    expect(screen.getByText(/given within the window CDC recommends/i)).toBeInTheDocument();
  });

  it('end to end: the adult five-week gap renders as Valid on the real engine output', () => {
    const { container } = render(<Harness />);
    // A complete adult series is a neutral card, which renders collapsed — the
    // dose rows live in its body, so open it the way a clinician would.
    fireEvent.click(container.querySelector('.rec-card-head-toggle'));
    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByText(/CDC advises at least 1 year/i)).toBeInTheDocument();
    // And it is still counted, not dropped.
    expect(screen.getByText(/Dose 2/)).toBeInTheDocument();
  });
});
