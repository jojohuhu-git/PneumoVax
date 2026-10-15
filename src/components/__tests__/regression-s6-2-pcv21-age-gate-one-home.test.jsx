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
// Both surfaces are tested because the dose editor USED to exist twice
// (`StepHistory.jsx` and the inline editor in `Results.jsx`). A fix to one
// was the single-surface fix CLAUDE.md forbids, and this gate is the example:
// the same line had to be written into both copies.
//
// S9 (2026-10-15) merged the two into `DoseEditor.jsx` and moved this gate
// into `brands.js`. Both surfaces are STILL asserted, deliberately — they are
// now expected to agree for a structural reason rather than by coincidence,
// and a future change that gives either screen its own dropdown again is
// exactly what should fail here.
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import StepHistory from '../StepHistory.jsx';
import Results from '../Results.jsx';
import { PCV21_MIN_AGE_M, ADULT_SCHED_MIN_M } from '../../logic/scheduleConstants.js';

const TODAY = '2026-10-13';

// S9 removed the `pcvProducts` prop this test used to inject. The catalogue
// reached the wizard as a prop while Results imported it directly, and each
// copy then applied its own filter; both now ask `brands.js` the one question.
// So these assertions run against the REAL catalogue, which is stricter: a
// product quietly added or dropped there now shows up here.

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

  // ── The source guards ─────────────────────────────────────────────────
  //
  // S9 (2026-10-15) moved the gate, so these moved with it. They used to say
  // "each editor names `PCV21_MIN_AGE_M` and types no bare 216", which was the
  // strongest statement available while the filter was written out in BOTH
  // editors. It is now written once, in `brands.js`'s
  // `pcvHistoryProductsFor`, beside the catalogue it filters — so the guard
  // can say the stronger thing: the components do not know this rule at all.
  //
  // Every behavioural test above is unchanged and still passes on both
  // surfaces, which is what says the extraction did not move the gate's
  // ANSWER — only where it is computed.
  describe('the source guards', () => {
    it.each([...EDITORS, '../DoseEditor.jsx'])(
      '%s does not type the product floor at all, as a number or a name',
      (rel) => {
        const code = codeOnly(readFileSync(new URL(rel, import.meta.url), 'utf8'));
        expect(code).not.toMatch(/\b216\b/);
        // Not even the constant: a component that reads it is a component
        // deciding a product's licence floor, which is the shape S9 removed.
        // Scoped to the CONSTANT, not the bare word "PCV21" — Results.jsx
        // prints "PCV21 geographic note:" in an advisory banner, which is
        // prose about the product, not a copy of its licence floor.
        expect(code).not.toContain('PCV21_MIN_AGE_M');
      }
    );

    it('the gate is computed in exactly one place, from the constant', () => {
      const code = codeOnly(
        readFileSync(resolve(process.cwd(), 'src/data/brands.js'), 'utf8')
      );
      expect(code).toContain('PCV21_MIN_AGE_M');
      expect(code).toContain('pcvHistoryProductsFor');
      // Derived from the constant, never a hand-typed 216.
      expect(code).not.toMatch(/\b216\b/);
    });

    // The naming hazard in its own right: a component-level flag called
    // `isAdult` that actually holds the 18y product floor is how an
    // 18-year-old ends up on the adult schedule a year early.
    it.each([...EDITORS, '../DoseEditor.jsx', '../../data/brands.js'])(
      '%s does not call the product floor an adult test',
      (rel) => {
        const code = codeOnly(readFileSync(new URL(rel, import.meta.url), 'utf8'));
        expect(code).not.toMatch(/\bisAdult\b/);
      }
    );
  });
});
