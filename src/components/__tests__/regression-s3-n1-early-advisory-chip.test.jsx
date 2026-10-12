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

  it('uses the plain valid chip colour, distinct from PCV7 and from invalid', () => {
    const { container: off } = renderWithDose({
      status: 'valid', earlyAdvisory: true, effectiveDoseNum: 1, reasons: ['…'],
    });
    expect(off.querySelector('.dose-val-valid')).not.toBeNull();
    // S14-6: PCV7 (noncounting) now uses this same blue — a counted dose
    // must never be mistaken for one that is not.
    expect(off.querySelector('.dose-val-offwindow')).toBeNull();
    expect(off.querySelector('.dose-val-invalid')).toBeNull();
  });
});

describe('S3-N1 — the whole flow agrees, end to end', () => {
  // S14-7 (owner decision 2026-10-11) changed which history produces an
  // advisory. PCV13 → PCV20 five weeks apart — the fixture this harness used
  // to carry — now VOIDS the PCV20, so it no longer exercises the flag at all.
  // PCV13 → PCV15 does: CDC recommends no such sequence, so no enumerated row
  // names it, and ADULT-PCV-AFTER-PCV-CATCH-ALL notes it rather than voiding
  // it. That is the surface this file is for — a dose that counts, carries a
  // note, and never reads as an error.
  function Harness({ pcvDoses }) {
    const [state, setState] = useState({
      ageMonths: 845,
      dob: '1956-01-01',
      riskIds: [],
      pcvDoses,
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

  function openEveryCard(container) {
    // A neutral card renders collapsed; its dose rows live in the body.
    container.querySelectorAll('.rec-card-head-toggle').forEach((b) => fireEvent.click(b));
  }

  it('end to end: an adult five-week PCV13 → PCV15 gap counts on the real engine output', () => {
    const { container } = render(<Harness pcvDoses={[
      { product: 'PCV13', date: '2026-01-05' },
      { product: 'PCV15', date: '2026-02-09' },
    ]} />);
    openEveryCard(container);
    expect(screen.getByText(/CDC advises at least 1 year/i)).toBeInTheDocument();
    // Still counted, not dropped, not relabeled as an error.
    expect(screen.getAllByText(/^Dose 2( of \d+)?$/).length).toBeGreaterThan(0);
    expect(screen.queryByText('Invalid')).not.toBeInTheDocument();
    expect(container.querySelector('.dose-val-dropped')).toBeNull();
  });

  it('end to end: an adult five-week PCV13 → PCV20 gap now reads as a dose that does not count', () => {
    const { container } = render(<Harness pcvDoses={[
      { product: 'PCV13', date: '2026-01-05' },
      { product: 'PCV20', date: '2026-02-09' },
    ]} />);
    openEveryCard(container);
    expect(screen.getByText(/at least 1 year after the last PCV13 dose/i)).toBeInTheDocument();
    expect(screen.getByText(/repeat this dose only/i)).toBeInTheDocument();
    // The clinician must be able to see this is the owner's rule, not ACIP's.
    expect(screen.getByText(/owner clinical determination/i)).toBeInTheDocument();
    // And it must NOT still claim the dose counts.
    expect(screen.queryByText(/This dose still counts/i)).not.toBeInTheDocument();
  });
});
