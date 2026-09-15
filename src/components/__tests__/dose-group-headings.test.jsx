// @vitest-environment happy-dom
// dose-group-headings.test.jsx
//
// UI layer for the "Primary series" / "Boosters" headings on the recorded-dose
// list (owner decision 2026-09-15, option A). The clinical boundary itself is
// locked in src/logic/__tests__/primary-vs-booster-boundary.test.js.
//
// Mirrors MeningoVax's test file of the same name — the two apps share one
// design system, so the grouping must behave identically in both.

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecCard, { doseRowsWithGroups } from '../RecCard.jsx';

const infantRec = {
  vaccine: 'PCV',
  status: 'catchup',
  doseLabel: 'PCV dose 4 of 4',
  seriesTotal: 4,
  primaryTotal: 3,
  citations: [],
};

const valid = (n) => ({ status: 'valid', effectiveDoseNum: n, reasons: [] });

describe('doseRowsWithGroups', () => {
  it('opens Primary series, then Boosters at the first dose past the primary total', () => {
    const rows = doseRowsWithGroups(
      [{}, {}, {}, {}],
      [valid(1), valid(2), valid(3), valid(4)],
      3,
    );
    expect(rows.map((r) => (r.kind === 'group' ? r.label : `dose${r.index}`))).toEqual([
      'Primary series', 'dose0', 'dose1', 'dose2', 'Boosters', 'dose3',
    ]);
  });

  it('keeps a non-counting PCV7 dose in date order, above the first heading', () => {
    // PCV7 at 2 months never counts, so the doses after it renumber from 1 —
    // but it keeps its place in the record so the list matches the chart.
    const rows = doseRowsWithGroups(
      [{ product: 'PCV7' }, {}, {}],
      [{ status: 'noncounting', effectiveDoseNum: null }, valid(1), valid(2)],
      3,
    );
    expect(rows.map((r) => (r.kind === 'group' ? r.label : `dose${r.index}`))).toEqual([
      'dose0', 'Primary series', 'dose1', 'dose2',
    ]);
  });

  it('keeps a non-counting dose that falls mid-series inside the open group', () => {
    const rows = doseRowsWithGroups(
      [{}, {}, {}],
      [valid(1), { status: 'invalid', effectiveDoseNum: null }, valid(2)],
      3,
    );
    expect(rows.map((r) => (r.kind === 'group' ? r.label : `dose${r.index}`))).toEqual([
      'Primary series', 'dose0', 'dose1', 'dose2',
    ]);
  });

  it('draws no headings when the card does not supply a primary total', () => {
    const rows = doseRowsWithGroups([{}, {}], [valid(1), valid(2)], null);
    expect(rows.every((r) => r.kind === 'dose')).toBe(true);
  });
});

describe('RecCard renders the headings and the denominator', () => {
  it('shows both headings and "Dose N of M" for a completed infant series', () => {
    render(
      <RecCard
        rec={infantRec}
        doses={[
          { product: 'PCV15', date: '2025-08-06' },
          { product: 'PCV15', date: '2025-10-06' },
          { product: 'PCV15', date: '2025-12-06' },
          { product: 'PCV15', date: '2026-06-06' },
        ]}
        doseValidations={[valid(1), valid(2), valid(3), valid(4)]}
        ageMonths={13}
      />,
    );
    expect(screen.getByTestId('dose-group-primary')).toHaveTextContent('Primary series');
    expect(screen.getByTestId('dose-group-booster')).toHaveTextContent('Boosters');
    expect(screen.getByText('Dose 1 of 4')).toBeTruthy();
    expect(screen.getByText('Dose 4 of 4')).toBeTruthy();
    // the old wording is gone
    expect(screen.queryByText(/Effective dose/)).toBeNull();
  });

  it('shows no Boosters heading while the booster is still owed', () => {
    render(
      <RecCard
        rec={infantRec}
        doses={[{ product: 'PCV15', date: '2025-08-06' }, { product: 'PCV15', date: '2025-10-06' }]}
        doseValidations={[valid(1), valid(2)]}
        ageMonths={6}
      />,
    );
    expect(screen.getByTestId('dose-group-primary')).toBeTruthy();
    expect(screen.queryByTestId('dose-group-booster')).toBeNull();
  });

  it('falls back to a bare "Dose N" when the card supplies no total', () => {
    render(
      <RecCard
        rec={{ ...infantRec, seriesTotal: null, primaryTotal: null, doseLabel: '1 dose PCV (at-risk catch-up)' }}
        doses={[{ product: 'PCV13', date: '2025-08-06' }]}
        doseValidations={[valid(1)]}
        ageMonths={30}
      />,
    );
    expect(screen.getByText('Dose 1')).toBeTruthy();
    expect(screen.queryByTestId('dose-group-primary')).toBeNull();
  });
});
