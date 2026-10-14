// @vitest-environment happy-dom
// The dose chip for a date in the future (owner decision, 2026-10-12).
//
// Noticed while live-verifying the future-dated rule last session, carried as
// an open item, and reproduced again in the app: a child who is 6 years 9
// months TODAY, with a dose dated 05/01/2030, got
//
//     D1 · May 1, 2030 · age 10 years 4 months · PCV20 (Prevnar 20)
//
// The verdict beside it was right and said the dose is not counted. The age was
// the age the patient WILL be — a number describing a visit that has not
// happened, printed in the slot that elsewhere describes a visit that did.
//
// MeningoVax prints the identical thing (its `describeDose` builds the same
// `age ${fmtAgeMonths(ageAtDose)}`), so there was nothing to copy: both apps had
// it, and the owner chose to fix both. MeningoVax's change ships in its own
// commit in its own repo — see the handoff.
//
// A date BEFORE birth already reads "age Before birth" (P3-6, via fmtAgeMonths
// returning a phrase for a negative age). That wording is unchanged here: the
// owner chose to add the future case, not to restyle the one already shipped.
//
// The decision is not re-derived in the card: `dateEntryWarning()` in
// validate.js answers "is this date in the future", using the same `futureDated`
// the engine grades with.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';

const TODAY = '2026-10-12';
const DOB = '2020-01-01';   // 6 years 9 months on TODAY

// A risk profile is on the fixture because a card with nothing to do collapses
// to a compact row (queue P1-2) and renders no dose list at all — the chips this
// test is about only exist on a card that is open.
function renderCard({ pcvDoses, riskIds = ['asplenia'], dob = DOB, ageMonths = 81 }) {
  const result = recommend({ dob, ageMonths, riskIds, pcvDoses, ppsv23Doses: [], today: TODAY });
  const rec = result.recs.find(r => r.vaccine === 'PCV') ?? result.recs[0];
  return render(
    <RecCard
      rec={rec}
      // P0: the verdict must be read beside the dose it was computed for, so
      // both come from the engine's own ordered arrays, never the input list.
      doses={result.orderedDoses.pcv}
      doseValidations={result.perDose.pcv}
      ageMonths={ageMonths}
      today={TODAY}
      dob={dob}
    />
  );
}

// Assertions read the card's own text content rather than getByText, because
// the chip line is split across child elements (status chip, citation markers)
// and a regex matcher silently finds NOTHING there — which made one `queryByText`
// negative pass while the card was in fact still printing the very string it
// claimed was gone. A vacuous pass in a regression test is worse than no test.
const cardText = (container) => container.textContent.replace(/\s+/g, ' ');

describe('a dose dated in the future does not print the age the patient will be', () => {
  it('reads "In the future" where the age would go', () => {
    const { container } = renderCard({ pcvDoses: [{ date: '2030-05-01', product: 'PCV20' }] });
    expect(cardText(container)).toMatch(/D1 · May 1, 2030 · In the future · PCV20/);
  });

  it('no longer prints "age 10 years 4 months" — the age on that future date', () => {
    const { container } = renderCard({ pcvDoses: [{ date: '2030-05-01', product: 'PCV20' }] });
    expect(cardText(container)).not.toMatch(/age 10 years 4 months/);
  });

  it('an ordinary past dose still prints its age at the dose', () => {
    // The control. Only the impossible case changes; every real dose reads as
    // it always did.
    // PCV13 rather than PCV20: a PCV20 COMPLETES this patient's series, and a
    // complete card collapses (queue P1-2) with no dose list to read.
    const { container } = renderCard({ pcvDoses: [{ date: '2024-03-01', product: 'PCV13' }] });
    expect(cardText(container)).toMatch(/D1 · Mar 1, 2024 · age 4 years 2 months · PCV13/);
    expect(cardText(container)).not.toMatch(/In the future/);
  });

  it('a dose dated TODAY prints its age, not "In the future"', () => {
    // The boundary a clinician relies on: a dose given this morning counts, and
    // must read like any other dose.
    const { container } = renderCard({ pcvDoses: [{ date: TODAY, product: 'PCV13' }] });
    expect(cardText(container)).not.toMatch(/In the future/);
    expect(cardText(container)).toMatch(/age 6 years 9 months/);
  });

  it('a dose dated before birth still reads "age Before birth" — unchanged', () => {
    // P3-6's wording is not restyled by this change.
    const { container } = renderCard({ pcvDoses: [{ date: '2019-06-01', product: 'PCV13' }] });
    expect(cardText(container)).toMatch(/age Before birth/);
  });
});
