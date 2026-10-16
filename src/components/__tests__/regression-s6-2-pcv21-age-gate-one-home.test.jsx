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
// ── The dropdown gate this file used to guard is GONE ────────────────────
//
// PCV21-OFFLABEL (owner decision, 2026-10-15): the history dropdown no longer
// filters by age at all. Hiding PCV21 under 18 did not prevent an off-label
// dose, it only prevented the clinician from recording one, and the dose then
// vanished with no warning. The licence age does its work in `validate.js`
// instead, which already graded such a dose "it does not count".
//
// So the two tests that asserted the dropdown HIDES PCV21 one month below the
// floor — one per surface — have been DELETED, not loosened. They described
// the behaviour of the day correctly; that behaviour was the bug.
// `regression-pcv21-offlabel-recordable.test.jsx` now asserts the opposite,
// with the sources, and goes further: the offered list must be identical at
// every age, so no gate can come back under a different number.
//
// ── What these tests still hold ──────────────────────────────────────────
//
// Everything about the NUMBER 216 and what it is called, which is the hazard
// S6-2 was really about and which the above does not touch:
//
//   * PCV21 is offered at and above its product floor, on BOTH editors (the
//     18-year-old case especially — licensed for the product, still on the
//     child/adolescent rulebook).
//   * The two numbers stay a year apart.
//   * No component hand-types 216, names `PCV21_MIN_AGE_M`, or calls the
//     product floor an "adult" test.
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
          historyAnswered={true}
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

    // ("hides PCV21 one month below the product floor" was here. Deleted by
    // PCV21-OFFLABEL — see the header. The dropdown is now ungated, and
    // `regression-pcv21-offlabel-recordable.test.jsx` holds that.)

    // The floor must be the PRODUCT licence age, not the schedule boundary. A patient
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

    // ("hides PCV21 one month below the product floor" was here too. Deleted
    // by PCV21-OFFLABEL, on both surfaces together — a single-surface change
    // to this dropdown is the thing CLAUDE.md forbids.)

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

    // PCV21-OFFLABEL rewrote this one. It used to also require
    // `pcvHistoryProductsFor` to exist in `brands.js`, which was the dropdown
    // gate — now deleted, so requiring it would force the bug back.
    //
    // What survives is the part S6-2 was actually about: PCV21's licence age
    // is named ONCE, as the product's own `minAgeM` in the catalogue, and
    // never hand-typed. That is the copy `validate.js` reads to grade a dose,
    // so a stale duplicate here is still the H1 bug waiting to happen.
    it("PCV21's licence age is named once in the catalogue, never hand-typed", () => {
      const code = codeOnly(
        readFileSync(resolve(process.cwd(), 'src/data/brands.js'), 'utf8')
      );
      expect(code).toContain('PCV21_MIN_AGE_M');
      expect(code).not.toMatch(/\b216\b/);
      // And it reaches the engine as the product's minimum age, which is what
      // makes the "does not count" verdict derive from this one number.
      expect(code).toMatch(/minAgeM:\s*PCV21_MIN_AGE_M/);
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
