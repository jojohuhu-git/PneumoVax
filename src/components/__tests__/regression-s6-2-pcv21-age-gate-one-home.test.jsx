// @vitest-environment happy-dom
//
// S6-2 — the age that decides whether Capvaxive (PCV21) can be recorded.
//
// ── What was wrong ───────────────────────────────────────────────────────
//
// Both dose editors opened with the same line:
//
//     const isAdult = (ageMonths ?? 0) >= 216;
//
// and used it for exactly one thing — whether PCV21 appears in the product
// dropdown. Two problems, and the second is the dangerous one.
//
//   1. `216` is typed out by hand in two files, while
//      `scheduleConstants.js` exists specifically to own it
//      (`PCV21_MIN_AGE_M`). That file was created to stop this exact drift:
//      the H1 bug, where the engine and the UI each kept their own copy of a
//      boundary and the copies disagreed.
//
//   2. The name is wrong in a way that invites a clinical bug. 216 months is
//      18 years — Capvaxive's PRODUCT licence floor. It is NOT the age at
//      which a patient becomes an adult for scheduling purposes, which is 19
//      years (`ADULT_SCHED_MIN_M = 228`). An 18-year-old is still on the
//      child/adolescent rulebook. So anything named `isAdult` sitting in a
//      component is a loaded gun: the next person who needs an adult/child
//      test will reuse it, and every 18-year-old will be routed down the
//      adult schedule a year early. CLAUDE.md names never collapsing these
//      two numbers as a non-negotiable rule, and a variable called `isAdult`
//      holding the product floor collapses them in spirit already.
//
// ── What these tests hold ────────────────────────────────────────────────
//
// The dropdown gate is asserted on BOTH editors, derived from the constant
// rather than from the number 216 — so if ACIP or the FDA ever moves
// Capvaxive's floor, changing `PCV21_MIN_AGE_M` moves these tests with it and
// a stale hand-typed copy is what fails.
//
// Both surfaces are tested because the dose editor exists twice
// (`StepHistory.jsx` and the inline editor in `Results.jsx` — the open
// S9 / P4-1 duplication). A fix to one is the single-surface fix CLAUDE.md
// forbids.
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import React from 'react';
import StepHistory from '../StepHistory.jsx';
import Results from '../Results.jsx';
import { PCV21_MIN_AGE_M, ADULT_SCHED_MIN_M } from '../../logic/scheduleConstants.js';

const TODAY = '2026-10-13';

// The catalogue the app passes down, including PCV21 and the unknown sentinel.
const PCV_PRODUCTS = [
  { key: 'PCV13', label: 'PCV13 (Prevnar 13)' },
  { key: 'PCV15', label: 'PCV15 (Vaxneuvance)' },
  { key: 'PCV20', label: 'PCV20 (Prevnar 20)' },
  { key: 'PCV21', label: 'PCV21 (Capvaxive)' },
  { key: '', label: 'Unknown PCV product' },
];

// One undated PCV row, so there is a product dropdown to inspect. An undated
// row needs no extra flag: a PCV row's product is what makes it a dose.
const ONE_PCV = [{ date: '', product: 'PCV13' }];

/** The product keys offered by the first PCV dropdown on screen. */
function offeredProducts() {
  const select = screen.getAllByLabelText('Product')[0];
  return [...select.options].map((o) => o.value);
}

/**
 * The file with its comments removed, so a guard scans real code only.
 *
 * The comments in these components explain the 18y-vs-19y distinction and name
 * both numbers on purpose; matching raw source would report a comment as an
 * offending literal. Comment text becomes its own newlines, so a reported line
 * number still points at the right line of the real file.
 */
function codeOnly(src) {
  const blank = (m) => m.replace(/[^\n]/g, '');
  return src
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, blank)
    .replace(/^\s*\/\/.*$/gm, blank)
    .replace(/\s+\/\/.*$/gm, '');
}

const EDITORS = ['../StepHistory.jsx', '../Results.jsx'];

describe('S6-2 — the PCV21 age gate has one home', () => {
  // Sanity: the two numbers really are different, so the tests below are not
  // accidentally asserting the same thing twice.
  it('the product floor and the schedule boundary are a year apart', () => {
    expect(ADULT_SCHED_MIN_M - PCV21_MIN_AGE_M).toBe(12);
  });

  describe('the history step', () => {
    function renderAt(ageMonths) {
      render(
        <StepHistory
          ageMonths={ageMonths}
          today={TODAY}
          dob={null}
          pcvDoses={ONE_PCV}
          ppsv23Doses={[]}
          onChangePcv={() => {}}
          onChangePpsv={() => {}}
          pcvProducts={PCV_PRODUCTS}
        />
      );
    }

    it('offers PCV21 at exactly the product floor', () => {
      renderAt(PCV21_MIN_AGE_M);
      expect(offeredProducts()).toContain('PCV21');
    });

    it('hides PCV21 one month below the product floor', () => {
      renderAt(PCV21_MIN_AGE_M - 1);
      const offered = offeredProducts();
      expect(offered).not.toContain('PCV21');
      // Not vacuous: the other products are still there.
      expect(offered).toContain('PCV13');
    });

    // The gate must be the PRODUCT floor, not the schedule boundary. A patient
    // between the two — 18y0m to 18y11m — may be given Capvaxive while still
    // being scheduled as an adolescent.
    it('offers PCV21 to an 18-year-old, who is not yet on the adult schedule', () => {
      renderAt(ADULT_SCHED_MIN_M - 1);
      expect(offeredProducts()).toContain('PCV21');
    });
  });

  describe('the inline editor on the results page', () => {
    function openEditorAt(ageMonths) {
      render(
        <Results
          state={{
            ageMonths,
            ageGroup: null,
            dob: null,
            riskIds: [],
            pcvDoses: ONE_PCV,
            ppsv23Doses: [],
          }}
          today={TODAY}
          onReset={() => {}}
          onChange={() => {}}
          onBack={() => {}}
        />
      );
      // fireEvent, not .click(): a raw DOM click fires outside React's act()
      // and the panel never re-renders, so assertions would read a closed one.
      fireEvent.click(screen.getByRole('button', { name: /Recorded doses/ }));
    }

    it('offers PCV21 at exactly the product floor', () => {
      openEditorAt(PCV21_MIN_AGE_M);
      expect(offeredProducts()).toContain('PCV21');
    });

    it('hides PCV21 one month below the product floor', () => {
      openEditorAt(PCV21_MIN_AGE_M - 1);
      const offered = offeredProducts();
      expect(offered).not.toContain('PCV21');
      expect(offered).toContain('PCV13');
    });

    it('offers PCV21 to an 18-year-old, who is not yet on the adult schedule', () => {
      openEditorAt(ADULT_SCHED_MIN_M - 1);
      expect(offeredProducts()).toContain('PCV21');
    });
  });

  describe('the source guards', () => {
    it.each(EDITORS)('%s reads the shared constant instead of typing 216', (rel) => {
      const code = codeOnly(readFileSync(new URL(rel, import.meta.url), 'utf8'));
      expect(code).not.toMatch(/\b216\b/);
      expect(code).toContain('PCV21_MIN_AGE_M');
    });

    // The naming hazard in its own right: a component-level flag called
    // `isAdult` that actually holds the 18y product floor is how an
    // 18-year-old ends up on the adult schedule a year early.
    it.each(EDITORS)('%s does not call the product floor an adult test', (rel) => {
      const code = codeOnly(readFileSync(new URL(rel, import.meta.url), 'utf8'));
      expect(code).not.toMatch(/\bisAdult\b/);
    });
  });
});
