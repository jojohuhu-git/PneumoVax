// @vitest-environment happy-dom
// PC1: per-dose validity chips inline in each RecCard's "Recorded:" list,
// reusing validate.js's analyzeHistory output directly (no re-derivation).
// Mirrors MeningoVax's RecCard.test.jsx pattern/vocabulary (E5), extended
// with PneumoVax's fourth status — 'noncounting' — for the PCV7-never-counts
// rule (a PCV7 dose was validly given, it just never counts toward the
// series, so it must not read as "Invalid").
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';

const baseRec = {
  vaccine: 'PCV',
  status: 'due',
  doseLabel: 'Dose 1',
  dueToday: true,
};

describe('RecCard dose-validation chip (PC1)', () => {
  // S14-2: the chip states the dose count, not a timing word.
  it('labels a valid dose "Dose N of M" (green)', () => {
    render(
      <RecCard
        rec={{ ...baseRec, seriesTotal: 1 }}
        doses={[{ date: '2024-01-01', product: 'PCV15' }]}
        doseValidations={[{ status: 'valid', reasons: [], effectiveDoseNum: 1 }]}
      />
    );
    const chip = screen.getByText('Dose 1 of 1');
    expect(chip.className).toMatch(/dose-val-valid/);
  });

  // §DOSE-LABELS (2026-11-08): "Invalid" became "Not counted — repeat" or
  // "Not counted — do not repeat". A hand-built invalid dose with no timing
  // rule behind it is a missing dose, so it is repeated.
  it('labels an invalid dose "Not counted — repeat" (red)', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2024-01-01', product: 'PCV15' }]}
        doseValidations={[{ status: 'invalid', reasons: ['Given too soon: does not count.'], doesNotCount: true }]}
      />
    );
    const chip = screen.getByText('Not counted — repeat');
    expect(chip.className).toMatch(/dose-val-invalid/);
  });

  // §DOSE-LABELS: an undated dose is COUNTED, so it is green and says so.
  it('labels an unknown-date dose "Counted — date not recorded" (green)', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '', product: 'PCV15' }]}
        doseValidations={[{ status: 'unknown', undated: true, effectiveDoseNum: 1, reasons: ['No date recorded.'] }]}
      />
    );
    const chip = screen.getByText('Counted — date not recorded');
    expect(chip.className).toMatch(/dose-val-valid/);
  });

  // Owner decision 2026-10-31, reversing S14-6: PCV7 reads "Not counted",
  // no longer MeningoVax's "Off-window - repeat" — PCV7 is set aside, not
  // repeated, and the patient is treated as PCV-naïve.
  it('labels a PCV7 dose "Not counted — PCV7" (blue), never "Invalid" or "repeat"', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2005-01-01', product: 'PCV7' }]}
        doseValidations={[{
          status: 'noncounting',
          effectiveDoseNum: null,
          doesNotCount: true,
          reasons: ['PCV7 (Prevnar 7) is not counted toward the pneumococcal series.'],
        }]}
      />
    );
    const chip = screen.getByText('Not counted — PCV7');
    expect(chip.className).toMatch(/dose-val-offwindow/);
    expect(screen.queryByText('Invalid')).toBeNull();
    expect(screen.queryByText(/repeat/i)).toBeNull();
  });
});

// Recorded doses show the product and age at which each was given, so a
// clinician can compare recommended timing against actual administration age.
describe('RecCard recorded-dose descriptor', () => {
  it('shows the product label and age at administration for a dated dose', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2020-06-01', product: 'PCV15' }]}
        doseValidations={[{ status: 'valid', reasons: [], effectiveDoseNum: 1 }]}
        ageMonths={132}
      />
    );
    expect(screen.getByText(/PCV15/)).toBeTruthy();
    expect(screen.getByText(/age \d+ years?( \d+ months?)?/)).toBeTruthy();
  });

  it('shows "age unknown" for a dose with no date', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '', product: 'PCV15' }]}
        doseValidations={[{ status: 'unknown', undated: true, effectiveDoseNum: 1, reasons: ['No date recorded.'] }]}
        ageMonths={132}
      />
    );
    expect(screen.getByText(/age unknown/)).toBeTruthy();
  });
});
