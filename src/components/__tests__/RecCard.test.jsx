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

  it('labels an invalid dose "Invalid" (red)', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '2024-01-01', product: 'PCV15' }]}
        doseValidations={[{ status: 'invalid', reasons: ['Given too soon: does not count.'], doesNotCount: true }]}
      />
    );
    const chip = screen.getByText('Invalid');
    expect(chip.className).toMatch(/dose-val-invalid/);
  });

  it('labels an unknown-date dose "Unknown" (gray)', () => {
    render(
      <RecCard
        rec={baseRec}
        doses={[{ date: '', product: 'PCV15' }]}
        doseValidations={[{ status: 'unknown', reasons: ['No date recorded.'] }]}
      />
    );
    const chip = screen.getByText('Unknown');
    expect(chip.className).toMatch(/dose-val-unknown/);
  });

  // S14-6: reuses MeningoVax's own "Off-window - repeat" — PCV7 never
  // counts, so a dose IS genuinely owed (high-risk patients are treated as
  // PCV-naïve for these doses).
  it('labels a PCV7 dose "Off-window - repeat" (blue), never "Invalid"', () => {
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
    const chip = screen.getByText('Off-window - repeat');
    expect(chip.className).toMatch(/dose-val-offwindow/);
    expect(screen.queryByText('Invalid')).toBeNull();
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
        doseValidations={[{ status: 'unknown', reasons: ['No date recorded.'] }]}
        ageMonths={132}
      />
    );
    expect(screen.getByText(/age unknown/)).toBeTruthy();
  });
});
