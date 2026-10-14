// @vitest-environment happy-dom
//
// S11 (2026-10-12): every label in a dose row names the box it sits above.
//
// ── What was wrong ───────────────────────────────────────────────────────
//
// The dose rows wrote `<label>Date (optional)</label>` and `<label>Product
// </label>` as plain text next to the field, with no `htmlFor` and without
// wrapping it. An HTML label is only attached to a control one of those two
// ways; written like this it is decoration. Three consequences, all real:
//
//   1. Clicking the words does nothing. Every other label in this app (Date of
//      Birth, Years, Months) focuses its box when clicked, so the dose rows
//      behaved differently from the rest of the wizard for no reason.
//   2. A screen reader announces the box with no name — "edit, blank" — so a
//      clinician using one cannot tell the date box from the product box.
//   3. The tap target on a phone is the box alone, not the box plus its
//      caption.
//
// The handoff that queued this named only the "Date (optional)" labels.
// Measured in the running app, "Product" was orphaned in exactly the same way:
// 8 labels across the two editors, not 4.
//
// ── Both surfaces ────────────────────────────────────────────────────────
//
// The dose editor exists TWICE — `StepHistory.jsx` and the inline editor in
// `Results.jsx` (the open S9 / P4-1 finding). This file asserts BOTH, because
// a fix to one of them is the single-surface fix CLAUDE.md forbids. When S9
// merges the two copies, these tests should keep passing unchanged.
//
// ── Why `useId` and not hand-written ids ─────────────────────────────────
//
// Two rows would otherwise share an id, and a duplicate id silently attaches
// every later label to the FIRST row's box — a bug that looks like the labels
// work. `useId` gives each component instance its own prefix, so the two
// editors cannot collide with each other either.
//
// ── Note for the sibling repo ────────────────────────────────────────────
//
// MeningoVax's `DoseEditor.jsx` has the identical orphaned labels (verified
// 2026-10-12). PneumoVax is AHEAD here, as with P7-2's inline styles. Recorded
// as a parity follow-up rather than silently fixed in a PneumoVax commit.
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import StepHistory from '../StepHistory.jsx';
import Results from '../Results.jsx';

const TODAY = '2026-10-12'; // the app passes the clinician's local date as an ISO string
const PCV_PRODUCTS = [
  { key: 'PCV13', label: 'PCV13 (Prevnar 13)' },
  { key: 'PCV15', label: 'PCV15 (Vaxneuvance)' },
  { key: '', label: 'Unknown PCV product' },
];

/** A synthetic 11-year-old with two PCV doses and one PPSV23 dose recorded. */
const TWO_PCV = [
  { date: '2016-03-01', product: 'PCV13' },
  { date: '2016-05-01', product: 'PCV13' },
];
const ONE_PPSV = [{ date: '2020-01-01', product: 'PPSV23' }];

/**
 * Every control that a dose-row label is supposed to name, found the way a
 * screen reader finds it. `getAllByLabelText` only matches a control the label
 * is really attached to, so this fails on a decorative label.
 */
function labelledControls(labelText) {
  return screen.queryAllByLabelText(labelText);
}

describe('S11 — dose-row labels name their field, on both editors', () => {
  describe('the history step', () => {
    function renderStep() {
      return render(
        <StepHistory
          ageMonths={141}
          today={TODAY}
          dob="2015-01-01"
          pcvDoses={TWO_PCV}
          ppsv23Doses={ONE_PPSV}
          onChangePcv={() => {}}
          onChangePpsv={() => {}}
          pcvProducts={PCV_PRODUCTS}
        />
      );
    }

    it('each recorded dose has a date box its label is attached to', () => {
      renderStep();
      // 2 PCV rows + 1 PPSV23 row = 3 date boxes.
      expect(labelledControls('Date (optional)')).toHaveLength(3);
    });

    it('each PCV dose has a product box its label is attached to', () => {
      renderStep();
      expect(labelledControls('Product')).toHaveLength(3);
    });

    it('the labels point at the real boxes, not all at the first row', () => {
      renderStep();
      const ids = labelledControls('Date (optional)').map(el => el.id);
      expect(ids).toHaveLength(3); // not vacuous: an empty list would pass below
      expect(new Set(ids).size).toBe(ids.length); // no duplicate ids
      expect(ids.every(Boolean)).toBe(true);
    });
  });

  describe('the inline editor on the results page', () => {
    const patient = {
      ageMonths: 141,
      ageGroup: 'child',
      dob: '2015-01-01',
      riskIds: [],
      pcvDoses: TWO_PCV,
      ppsv23Doses: ONE_PPSV,
    };

    function openEditor() {
      const utils = render(
        <Results state={patient} today={TODAY} onReset={() => {}}
          onChange={() => {}} onBack={() => {}} />
      );
      // The panel is behind the "Recorded doses" toggle.
      // fireEvent, not .click(): a raw DOM click fires outside React's act()
      // and the panel never re-renders, so the assertions would read a closed panel.
      fireEvent.click(screen.getByRole('button', { name: /Recorded doses/ }));
      return utils;
    }

    it('each recorded dose has a date box its label is attached to', () => {
      openEditor();
      expect(labelledControls('Date (optional)')).toHaveLength(3);
    });

    it('each PCV dose has a product box its label is attached to', () => {
      openEditor();
      expect(labelledControls('Product')).toHaveLength(3);
    });

    it('its ids do not collide with the history step\'s', () => {
      openEditor();
      const ids = labelledControls('Date (optional)').map(el => el.id);
      expect(ids).toHaveLength(3); // not vacuous: an empty list would pass below
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every(Boolean)).toBe(true);
    });
  });

  // The guard that keeps this from regressing by someone adding a ninth row:
  // no dose-row label may exist without an attachment.
  it('no label in a dose row is left decorative', () => {
    const { container } = render(
      <StepHistory
        ageMonths={141}
        today={TODAY}
        dob="2015-01-01"
        pcvDoses={TWO_PCV}
        ppsv23Doses={ONE_PPSV}
        onChangePcv={() => {}}
        onChangePpsv={() => {}}
        pcvProducts={PCV_PRODUCTS}
      />
    );
    const orphans = [...container.querySelectorAll('.dose-field label')]
      .filter(l => !l.getAttribute('for') && !l.querySelector('input, select'))
      .map(l => l.textContent);
    expect(orphans).toEqual([]);
  });
});
