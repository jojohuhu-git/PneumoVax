// @vitest-environment happy-dom
//
// S9 / P4-1 — the recorded-dose editor exists ONCE.
//
// ── What was wrong ───────────────────────────────────────────────────────
//
// The box a clinician types a recorded dose into was written out twice, in
// full: once in `StepHistory.jsx` (the wizard's History step) and once inside
// `Results.jsx` (the "Recorded doses" panel). Same two streams, same fields,
// same remove button, same "a dose was given, details unknown" tick —
// two copies.
//
// The cost is not tidiness, it is silent single-surface fixes. Three times
// over, the same one-line change had to be found and made twice:
//
//   • `S6-2` (2026-10-13) — the Capvaxive age gate was `isAdult = ... >= 216`
//     in BOTH files. The fix had to be written twice and its test had to
//     assert both surfaces, or an 18-year-old would see the right dropdown on
//     one screen and the wrong one on the other.
//   • `P1-3` (2026-10-12) — the details-unknown tick had to be added twice.
//   • `S11` (2026-10-12) — label-to-box association had to be done twice, and
//     needed a per-instance `useId` prefix precisely BECAUSE both copies
//     render the same field names into one document.
//
// And the copies had already drifted, which is the proof the risk is real and
// not theoretical. The original finding records it: the wizard put **Date**
// first, the Results panel put **Product** first. Nobody decided that; one
// copy was edited and the other was not.
//
// ── What these tests hold ────────────────────────────────────────────────
//
// 1. The row markup lives in `DoseEditor.jsx` and NOWHERE else, so the next
//    one-line fix cannot be applied to one screen and missed on the other.
//    Source guards, comment-stripped — the comments here and in the
//    components name the very markup being forbidden.
//
// 2. Both surfaces render the same fields in the same order. This is the
//    assertion that fails on the pre-fix code, on the Results panel, for
//    exactly the drift described above.
//
//    Date-before-Product is the settled direction, not a new preference:
//    MeningoVax's shared `DoseEditor.jsx` renders Date then Brand, the design
//    parity rule sends MeningoVax's layout decisions to PneumoVax, and
//    PneumoVax's own wizard already did it. Only the Results panel moves.
//
// 3. Every label still points at its OWN box on both surfaces (`S11`), and
//    the two instances do not collide. MeningoVax's `DoseEditor` has bare
//    `<label>` elements with no `htmlFor`; sharing a component must not import
//    that regression into PneumoVax, which fixed it.
//
// 4. The details-unknown tick still appears when, and only when, the row
//    holds nothing the clinician typed — on both surfaces, for both streams.
//    The condition legitimately DIFFERS between the streams (a PPSV23 row is
//    born carrying `product: 'PPSV23'`, which the app stamped on rather than
//    anybody telling us), so this is the behaviour most likely to be quietly
//    broken by merging the two copies.
import React, { useState } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import StepHistory from '../StepHistory.jsx';
import Results from '../Results.jsx';
import { PPSV23_PRODUCT } from '../../data/brands.js';

const TODAY = '2026-10-15';

/**
 * The file with its comments removed, so a guard scans real code only.
 *
 * Comment text becomes its own newlines, so a reported line number still
 * points at the right line of the real file. Shared shape with the `S6-1`,
 * `S6-2`, `S6-4` and `S11` guards.
 */
function codeOnly(src) {
  const blank = (m) => m.replace(/[^\n]/g, '');
  return src
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, blank)
    .replace(/^\s*\/\/.*$/gm, blank)
    .replace(/\s+\/\/.*$/gm, '');
}

const read = (rel) => codeOnly(readFileSync(new URL(rel, import.meta.url), 'utf8'));

// The two files that used to hold a copy of the editor each.
const CALLERS = ['../StepHistory.jsx', '../Results.jsx'];

// ── Harnesses ────────────────────────────────────────────────────────────
// Both are stateful: `Results` is a CONTROLLED component, so an assertion
// about a row being added reads a stale list unless the harness stores it.

function HistoryHarness({ initial = { pcvDoses: [], ppsv23Doses: [] }, ageMonths = 24 }) {
  const [state, setState] = useState(initial);
  return (
    <StepHistory
      historyAnswered={true}
      ageMonths={ageMonths}
      dob={null}
      today={TODAY}
      pcvDoses={state.pcvDoses}
      ppsv23Doses={state.ppsv23Doses}
      onChangePcv={(pcvDoses) => setState((s) => ({ ...s, pcvDoses }))}
      onChangePpsv={(ppsv23Doses) => setState((s) => ({ ...s, ppsv23Doses }))}
    />
  );
}

function ResultsHarness({ initial, ageMonths = 24 }) {
  const [state, setState] = useState({
    ageMonths,
    ageGroup: null,
    dob: null,
    riskIds: [],
    pcvDoses: [],
    ppsv23Doses: [],
    ...initial,
  });
  return (
    <Results
      state={state}
      today={TODAY}
      onReset={() => {}}
      onBack={() => {}}
      onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
    />
  );
}

/** Render the surface and leave its dose rows on screen, ready to inspect. */
function renderSurface(which, initial, ageMonths = 24) {
  if (which === 'history') {
    render(<HistoryHarness initial={initial} ageMonths={ageMonths} />);
    return;
  }
  render(<ResultsHarness initial={initial} ageMonths={ageMonths} />);
  // fireEvent, not .click(): a raw DOM click fires outside React's act() and
  // the panel never re-renders, so assertions would read a closed one.
  fireEvent.click(screen.getByRole('button', { name: /Recorded doses/ }));
}

const SURFACES = ['history', 'results'];

/** The visible field labels of dose row `i`, in the order they are rendered. */
function fieldLabelsOfRow(i) {
  const rows = document.querySelectorAll('.dose-row');
  return [...rows[i].querySelectorAll('.dose-field label')].map((l) =>
    l.textContent.trim()
  );
}

const ONE_OF_EACH = {
  pcvDoses: [{ date: '', product: 'PCV13' }],
  ppsv23Doses: [{ date: '2020-01-01', product: 'PPSV23' }],
};

const unknownTicks = () =>
  screen.queryAllByRole('checkbox', {
    name: /a dose was given, but the date and product are unknown/i,
  });

// ─────────────────────────────────────────────────────────────────────────
describe('S9 — the dose editor has one home', () => {
  describe('the source guards', () => {
    it('DoseEditor.jsx exists and renders the row markup', () => {
      const code = read('../DoseEditor.jsx');
      expect(code).toContain('dose-field');
      expect(code).toContain('dose-row-unknown');
      expect(code).toContain('dose-remove');
    });

    // The point of the item: a row cannot be hand-written into a caller any
    // more, so a fix to the row reaches both screens or neither.
    it.each(CALLERS)('%s no longer hand-writes a dose row', (rel) => {
      const code = read(rel);
      expect(code).not.toContain('dose-field');
      expect(code).not.toContain('dose-row-unknown');
      expect(code).not.toContain('dose-remove');
      expect(code).not.toMatch(/type="date"/);
    });

    it.each(CALLERS)('%s renders the shared editor', (rel) => {
      expect(read(rel)).toContain('DoseEditor');
    });

    // The PPSV23 stream has exactly one product. The value shown in its
    // disabled Product box, and the key stamped onto a new row, were typed out
    // by hand in BOTH editors — four copies of two strings that have to agree
    // with `brands.js`, or the card prints a product the engine never recorded.
    // Both now come from `PPSV23_PRODUCT`.
    //
    // Scoped to those two uses on purpose. The section HEADING above each list
    // ("PPSV23 (Pneumovax 23) doses") is prose a human wrote for this screen,
    // not a value the engine round-trips, so it is deliberately not forced to
    // read from the catalogue.
    it.each([...CALLERS, '../DoseEditor.jsx'])(
      '%s does not hand-type the PPSV23 product value or key',
      (rel) => {
        const code = read(rel);
        expect(code).not.toMatch(/value=["']PPSV23 \(Pneumovax 23\)["']/);
        expect(code).not.toMatch(/product:\s*'PPSV23'/);
      }
    );
  });

  // ── 2. The drift this item exists to end ───────────────────────────────
  describe('both surfaces render the same fields in the same order', () => {
    it.each(SURFACES)('%s puts Date before Product on a PCV row', (which) => {
      renderSurface(which, ONE_OF_EACH);
      expect(fieldLabelsOfRow(0)).toEqual(['Date (optional)', 'Product']);
    });

    it.each(SURFACES)('%s puts Date before Product on a PPSV23 row', (which) => {
      renderSurface(which, ONE_OF_EACH);
      expect(fieldLabelsOfRow(1)).toEqual(['Date (optional)', 'Product']);
    });

    it.each(SURFACES)('%s shows the PPSV23 product as fixed, not a dropdown', (which) => {
      renderSurface(which, ONE_OF_EACH);
      const rows = document.querySelectorAll('.dose-row');
      // The PCV row's product is chosen; the PPSV23 row's is stated.
      expect(rows[0].querySelector('select')).not.toBeNull();
      expect(rows[1].querySelector('select')).toBeNull();
      const fixed = rows[1].querySelector('input[type="text"]');
      expect(fixed.disabled).toBe(true);
      expect(fixed.value).toBe(PPSV23_PRODUCT.label);
    });
  });

  // ── 3. S11 must survive the merge ──────────────────────────────────────
  describe('every label still points at its own box (S11)', () => {
    it.each(SURFACES)('%s gives each row its own ids', (which) => {
      renderSurface(which, {
        pcvDoses: [{ date: '', product: 'PCV13' }, { date: '', product: 'PCV15' }],
        ppsv23Doses: [],
      });
      const rows = [...document.querySelectorAll('.dose-row')];
      expect(rows).toHaveLength(2);

      const idsSeen = new Set();
      for (const row of rows) {
        for (const label of row.querySelectorAll('.dose-field label')) {
          const htmlFor = label.getAttribute('for');
          // A bare label with no `for` is MeningoVax's unfixed state; it points
          // at nothing, and a click on it moves no cursor.
          expect(htmlFor).toBeTruthy();
          // Two rows sharing one id silently point every label at the FIRST
          // row's box — a bug that looks like it works.
          expect(idsSeen.has(htmlFor)).toBe(false);
          idsSeen.add(htmlFor);
          // getElementById, not querySelector('#...'): `useId` returns ids
          // like `:r6:`, which are valid HTML ids but invalid CSS selectors,
          // so a selector-based lookup throws rather than reporting a result.
          const box = document.getElementById(htmlFor);
          expect(box).not.toBeNull();
          expect(row.contains(box)).toBe(true);
        }
      }
    });
  });

  // ── 4. The tick condition differs per stream, and must keep doing so ───
  describe('the details-unknown tick, on both surfaces', () => {
    it.each(SURFACES)('%s offers it on an untouched PCV row', (which) => {
      renderSurface(which, { pcvDoses: [], ppsv23Doses: [] });
      expect(unknownTicks()).toHaveLength(0);
      fireEvent.click(screen.getByText('+ Add PCV dose'));
      expect(unknownTicks()).toHaveLength(1);
    });

    it.each(SURFACES)('%s withdraws it once a PCV product is chosen', (which) => {
      renderSurface(which, { pcvDoses: [{ date: '', product: '' }], ppsv23Doses: [] });
      expect(unknownTicks()).toHaveLength(1);
      fireEvent.change(screen.getByLabelText('Product'), {
        target: { value: 'PCV13' },
      });
      expect(unknownTicks()).toHaveLength(0);
    });

    // A PPSV23 row is BORN carrying `product: 'PPSV23'` — stamped by the app,
    // not typed by anybody. So "otherwise empty" for this stream means "no
    // date", and judging it by the product too would hide the tick forever.
    it.each(SURFACES)('%s offers it on an untouched PPSV23 row', (which) => {
      renderSurface(which, { pcvDoses: [], ppsv23Doses: [] });
      fireEvent.click(screen.getByText('+ Add PPSV23 dose'));
      expect(unknownTicks()).toHaveLength(1);
    });

    it.each(SURFACES)('%s withdraws it once a PPSV23 date is entered', (which) => {
      renderSurface(which, { pcvDoses: [], ppsv23Doses: [{ date: '', product: 'PPSV23' }] });
      expect(unknownTicks()).toHaveLength(1);
      fireEvent.change(screen.getByLabelText('Date (optional)'), {
        target: { value: '2020-01-01' },
      });
      expect(unknownTicks()).toHaveLength(0);
    });
  });

  // ── Adding and removing rows still works on both surfaces ──────────────
  describe('adding and removing rows, on both surfaces', () => {
    it.each(SURFACES)('%s adds a PCV row', (which) => {
      renderSurface(which, { pcvDoses: [], ppsv23Doses: [] });
      expect(document.querySelectorAll('.dose-row')).toHaveLength(0);
      fireEvent.click(screen.getByText('+ Add PCV dose'));
      expect(document.querySelectorAll('.dose-row')).toHaveLength(1);
    });

    it.each(SURFACES)('%s removes the row it is told to', (which) => {
      renderSurface(which, {
        pcvDoses: [{ date: '2020-01-01', product: 'PCV13' }, { date: '2021-01-01', product: 'PCV15' }],
        ppsv23Doses: [],
      });
      fireEvent.click(screen.getByRole('button', { name: 'Remove PCV dose 1' }));
      const rows = [...document.querySelectorAll('.dose-row')];
      expect(rows).toHaveLength(1);
      // The SECOND dose is what survived, not the first re-rendered.
      expect(within(rows[0]).getByLabelText('Product').value).toBe('PCV15');
    });
  });
});
