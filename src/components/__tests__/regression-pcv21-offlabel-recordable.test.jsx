// @vitest-environment happy-dom
//
// PCV21-OFFLABEL — a Capvaxive dose that really happened can always be typed
// in, at any age, and is then graded.
//
// ── What was wrong ───────────────────────────────────────────────────────
//
// `pcvHistoryProductsFor(ageMonths)` removed PCV21 from the history dropdown
// whenever the patient was under 18 today. So a Capvaxive dose given
// off-label to a 17-year-old had nowhere to go: no warning, no flag, no
// "that's unusual, are you sure" — the product simply was not in the list.
// The clinician's input was dropped, silently, which is the one failure mode
// this app exists to avoid.
//
// It was also the only such gate. Every other PCV carries `minAgeM =
// PCV_MIN_AGE_M` (6 weeks) and is NOT gated: a dose given too early is a real
// event, and the engine's job is to record it and then grade it invalid.
//
// ── What the sources say ─────────────────────────────────────────────────
//
// The dose does NOT count, and the app already said so — this change did not
// touch that verdict, only the clinician's ability to enter the dose at all.
//
//   FDA / ACIP (MMWR mm7336a3):
//     "On June 17, 2024, the Food and Drug Administration approved 21-valent
//      pneumococcal conjugate vaccine (PCV) (PCV21; CAPVAXIVE; Merck Sharp &
//      Dohme, LLC) for adults aged ≥18 years."
//     https://www.cdc.gov/mmwr/volumes/73/wr/mm7336a3.htm
//
//   CDC General Best Practices, Timing and Spacing of Immunobiologics:
//     "Doses of any vaccine administered ≥5 days earlier than the minimum
//      interval or age should not be counted as valid doses and should be
//      repeated as age appropriate."
//     https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html
//
// So the two halves are different questions with different answers, and this
// file asserts both: the dose is always RECORDABLE, and below the licence
// floor it DOES NOT COUNT.
//
// ── Owner decision, 2026-10-15 ───────────────────────────────────────────
//
// Asked whether an off-label PCV21 dose should count, the owner was first
// shown — and corrected by — the two sources above plus CDSI v4.64, which
// sets PCV21's allowable age at "19 years - 4 days". Decision: record it and
// flag it, do NOT count it. The counting floor stays at `PCV21_MIN_AGE_M`
// (18y, the licence) for this change; whether it should instead be CDC's 19y
// is logged as its own queue item, to be decided from worked examples.
//
// This replaces the two `S6-2` tests that asserted the dropdown HIDES PCV21
// below the floor. Those described the bug, correctly, as the behaviour of
// the day; they are gone rather than loosened. Every other `S6-2` assertion
// — including all three source guards — is untouched and still passes.
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import StepHistory from '../StepHistory.jsx';
import Results from '../Results.jsx';
import { analyzeBoth } from '../../logic/validate.js';
import { PCV21_MIN_AGE_M } from '../../logic/scheduleConstants.js';

const TODAY = '2026-10-15';

// One undated PCV row, so there is a product dropdown to inspect. A PCV row's
// product is what makes it a dose, so no date is needed to render the select.
const ONE_PCV = [{ date: '', product: 'PCV13' }];

/** The product keys offered by the first PCV dropdown on screen. */
function offeredProducts() {
  const select = screen.getAllByLabelText('Product')[0];
  return [...select.options].map((o) => o.value);
}

function renderHistoryAt(ageMonths) {
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

function openResultsEditorAt(ageMonths) {
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
  // fireEvent, not .click(): a raw DOM click fires outside React's act() and
  // the panel never re-renders, so assertions would read a closed one.
  fireEvent.click(screen.getByRole('button', { name: /Recorded doses/ }));
}

// Ages spanning the whole lifespan the app serves, on both sides of the
// licence floor. 204 = 17y, the case in the finding.
const AGES = [2, 24, 120, 204, PCV21_MIN_AGE_M - 1, PCV21_MIN_AGE_M, 228, 780];

describe('PCV21-OFFLABEL — the dose is recordable at any age', () => {
  describe('the history step', () => {
    it('offers PCV21 to a 17-year-old', () => {
      renderHistoryAt(204);
      expect(offeredProducts()).toContain('PCV21');
    });

    it('offers PCV21 one month below the licence floor', () => {
      renderHistoryAt(PCV21_MIN_AGE_M - 1);
      expect(offeredProducts()).toContain('PCV21');
    });

    it('offers PCV21 to a 2-year-old, because the app records what happened', () => {
      renderHistoryAt(24);
      expect(offeredProducts()).toContain('PCV21');
    });
  });

  describe('the inline editor on the results page', () => {
    it('offers PCV21 to a 17-year-old', () => {
      openResultsEditorAt(204);
      expect(offeredProducts()).toContain('PCV21');
    });

    it('offers PCV21 one month below the licence floor', () => {
      openResultsEditorAt(PCV21_MIN_AGE_M - 1);
      expect(offeredProducts()).toContain('PCV21');
    });
  });

  // The strongest statement available, and the one that catches a gate coming
  // back in ANY form — a different age, a different file, a different
  // condition. The dropdown's answer must not depend on the patient's age at
  // all. A gate keyed on some other number would slip past a guard that only
  // forbids `PCV21_MIN_AGE_M`; it cannot slip past this.
  describe('the dropdown does not depend on age at all', () => {
    it.each([
      ['the history step', renderHistoryAt],
      ['the results editor', openResultsEditorAt],
    ])('%s offers the same products at every age', (_label, renderAt) => {
      // `cleanup()` between ages, not one render after another: both helpers
      // read the FIRST "Product" select on screen, so a left-over render would
      // have every later age inspecting the first age's dropdown and the test
      // would pass no matter what the gate did.
      const seen = AGES.map((age) => {
        renderAt(age);
        const offered = offeredProducts().join('|');
        cleanup();
        return offered;
      });
      // Every age produced an identical list...
      expect(new Set(seen).size).toBe(1);
      // ...and it is not vacuously short.
      expect(seen[0].split('|')).toContain('PCV21');
      expect(seen[0].split('|')).toContain('PCV13');
    });
  });
});

describe('PCV21-OFFLABEL — and below the licence floor it does not count', () => {
  // A 17-year-old today, whose Capvaxive dose was given a month ago. Before
  // this change this patient could not be entered at all, so this verdict was
  // unreachable from either screen.
  const DOB = '2009-06-01';     // 17y4m on TODAY
  const DOSE = '2026-09-15';    // given at 17y3m
  const offLabel = () =>
    analyzeBoth({
      pcvDoses: [{ date: DOSE, product: 'PCV21' }],
      ppsv23Doses: [],
      ageMonths: 208,
      today: TODAY,
      dob: DOB,
      riskIds: [],
    }).pcv;

  const allText = (v) => [...v.reasons, v.detail ?? ''].join(' ');

  it('grades the dose invalid and excludes it from the series', () => {
    const r = offLabel();
    expect(r.perDose[0].status).toBe('invalid');
    expect(r.perDose[0].doesNotCount).toBe(true);
    expect(r.effective.length).toBe(0);
  });

  it('says in plain words that it does not count, and names the licensed age', () => {
    const text = allText(offLabel().perDose[0]);
    expect(text).toMatch(/does not count/i);
    expect(text).toMatch(/≥18 years/);
  });

  it('is a real dose given at the wrong age, NOT a record problem', () => {
    // The distinction S10-N2 drew: a mistyped record must not be "repeated",
    // but a dose the patient genuinely received at too young an age is exactly
    // the case CDC says to repeat as age appropriate.
    expect(offLabel().perDose[0].recordProblem).toBeUndefined();
  });

  // Control: the floor itself did not move. An 18-year-old's Capvaxive is
  // licensed and counts, which is what makes the test above a statement about
  // the floor rather than about PCV21 in general.
  it('counts the same dose when it was given at 18', () => {
    const r = analyzeBoth({
      pcvDoses: [{ date: '2026-09-15', product: 'PCV21' }],
      ppsv23Doses: [],
      ageMonths: 220,              // 18y4m today
      dob: '2008-06-01',           // 18y3m at the dose
      today: TODAY,
      riskIds: [],
    }).pcv;
    expect(r.perDose[0].status).not.toBe('invalid');
    expect(r.effective.length).toBe(1);
  });
});
