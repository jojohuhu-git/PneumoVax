// @vitest-environment happy-dom
// The history step says so straight away when a dose date is impossible
// (owner decision, 2026-10-12).
//
// Reproduced before the fix, in the running app: typing 05/01/2030 into a PCV
// row showed nothing at all. No red text, no hint, "View Results" fully
// enabled. The clinician found out only on the results card afterwards.
//
// Meanwhile the AGE step already stops you dead on the same mistake — type 2030
// into Date of Birth and it says "That date of birth is in the future. Check the
// year — if it is a typo, correct it," and the Next button goes nowhere. The two
// date fields disagreed about the same slip.
//
// The owner chose the middle option deliberately: warn under the row at the
// moment the date is typed, AND keep the results-card explanation, but do NOT
// block "View Results". A clinician who means it can still see the rest of the
// record; nobody is trapped behind a row they would rather leave as it is.
//
// The decision itself is NOT re-derived here. `dateEntryWarning()` calls the
// same `futureDated` and `isBeforeBirth` predicates the engine grades with, and
// `agrees with the engine` below pins the two together so the warning and the
// verdict cannot drift apart.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import StepHistory from '../StepHistory.jsx';
import Results from '../Results.jsx';
import { fireEvent } from '@testing-library/react';
import { dateEntryWarning, analyzeBoth } from '../../logic/validate.js';

const TODAY = '2026-10-12';
const DOB = '2020-01-01';

function renderStep({ pcvDoses = [], ppsv23Doses = [], dob = DOB, ageMonths = 81 } = {}) {
  return render(
    <StepHistory
      ageMonths={ageMonths}
      today={TODAY}
      dob={dob}
      pcvDoses={pcvDoses}
      ppsv23Doses={ppsv23Doses}
      onChangePcv={() => {}}
      onChangePpsv={() => {}}
    />
  );
}

describe('the history step warns under the row, at the moment the date is typed', () => {
  it('a PCV dose dated in the future is flagged on the step itself', () => {
    renderStep({ pcvDoses: [{ date: '2030-05-01', product: 'PCV20' }] });
    expect(screen.getByText(/this date is in the future/i)).toBeTruthy();
  });

  it('a PCV dose dated before the patient was born is flagged too', () => {
    renderStep({ pcvDoses: [{ date: '2019-05-01', product: 'PCV13' }] });
    expect(screen.getByText(/before the patient was born/i)).toBeTruthy();
  });

  it('a PPSV23 dose dated in the future is flagged the same way', () => {
    renderStep({
      ppsv23Doses: [{ date: '2030-05-01', product: 'PPSV23' }],
      ageMonths: 849,
      dob: '1956-01-01',
    });
    expect(screen.getByText(/this date is in the future/i)).toBeTruthy();
  });

  it('an ordinary past dose is not flagged', () => {
    renderStep({ pcvDoses: [{ date: '2024-03-01', product: 'PCV20' }] });
    expect(screen.queryByText(/this date is in the future/i)).toBeNull();
    expect(screen.queryByText(/before the patient was born/i)).toBeNull();
  });

  it('a dose dated TODAY is not flagged — it was given this morning', () => {
    renderStep({ pcvDoses: [{ date: TODAY, product: 'PCV20' }] });
    expect(screen.queryByText(/this date is in the future/i)).toBeNull();
  });

  it('an undated row is not flagged', () => {
    renderStep({ pcvDoses: [{ date: '', product: 'PCV20' }] });
    expect(screen.queryByText(/this date is in the future/i)).toBeNull();
    expect(screen.queryByText(/before the patient was born/i)).toBeNull();
  });

  it('with no date of birth on file, a future date is still caught', () => {
    // Years/Months entry. "Before birth" needs a birthday to compare against,
    // but "after today" never did.
    renderStep({ pcvDoses: [{ date: '2030-05-01', product: 'PCV20' }], dob: null });
    expect(screen.getByText(/this date is in the future/i)).toBeTruthy();
  });

  it('flags the offending row only, not every row', () => {
    renderStep({
      pcvDoses: [
        { date: '2024-03-01', product: 'PCV13' },
        { date: '2030-05-01', product: 'PCV20' },
      ],
    });
    expect(screen.getAllByText(/this date is in the future/i).length).toBe(1);
  });

  it('does NOT block the step — the owner chose to warn, not to trap', () => {
    // There is no Next/View Results button inside this component (App owns it),
    // so the guarantee to assert is that the component renders no disabled
    // state and no blocking banner of its own: the warning is advisory text.
    const { container } = renderStep({ pcvDoses: [{ date: '2030-05-01', product: 'PCV20' }] });
    expect(container.querySelectorAll('button[disabled]').length).toBe(0);
  });
});

// The dose editor exists TWICE (the open S9 / P4-1 finding): this step, and the
// inline "Recorded doses" editor on the results screen. CLAUDE.md forbids a
// single-surface fix, so the second surface is asserted here rather than assumed
// from the shared component's existence.
describe('the OTHER dose editor — the inline one on the results screen', () => {
  function renderResults(pcvDoses) {
    return render(
      <Results
        state={{
          ageMonths: 81, dob: DOB, riskIds: [], pcvDoses, ppsv23Doses: [],
        }}
        today={TODAY}
        onChange={() => {}}
        onReset={() => {}}
        onBack={() => {}}
      />
    );
  }

  it('warns about a future date once the editor is opened', () => {
    renderResults([{ date: '2030-05-01', product: 'PCV20' }]);
    fireEvent.click(screen.getByText(/Recorded doses/i));
    expect(screen.getByText(/this date is in the future/i)).toBeTruthy();
  });

  it('warns about a before-birth date too', () => {
    renderResults([{ date: '2019-06-01', product: 'PCV13' }]);
    fireEvent.click(screen.getByText(/Recorded doses/i));
    expect(screen.getByText(/before the patient was born/i)).toBeTruthy();
  });

  it('says nothing about an ordinary past date', () => {
    renderResults([{ date: '2024-03-01', product: 'PCV20' }]);
    fireEvent.click(screen.getByText(/Recorded doses/i));
    expect(screen.queryByText(/this date is in the future/i)).toBeNull();
    expect(screen.queryByText(/before the patient was born/i)).toBeNull();
  });
});

describe('the warning and the verdict cannot drift apart', () => {
  it('agrees with the engine on every shape, because it calls the same predicates', () => {
    const rows = [
      { date: '2030-05-01', product: 'PCV20' },  // future
      { date: '2019-05-01', product: 'PCV13' },  // before birth
      { date: '2024-03-01', product: 'PCV20' },  // ordinary
      { date: TODAY, product: 'PCV15' },         // today — counts
      { product: 'PCV20' },                      // undated
    ];
    for (const row of rows) {
      const warning = dateEntryWarning(row, { ageMonths: 81, today: TODAY, dob: DOB });
      const verdict = analyzeBoth({
        pcvDoses: [row], ppsv23Doses: [], ageMonths: 81, today: TODAY, dob: DOB, riskIds: [],
      }).pcv.perDose[0];
      const engineKind = verdict?.recordProblem ?? null;
      expect(
        warning?.kind ?? null,
        `the step and the engine disagree about ${JSON.stringify(row)}`
      ).toBe(engineKind);
    }
  });

  it('the short warning and the full explanation name the same two causes', () => {
    // The step's text is shorter than the results card's on purpose, but both
    // are written in validate.js beside each other so an edit to one is made
    // looking at the other.
    const fut = dateEntryWarning({ date: '2030-05-01' }, { ageMonths: 81, today: TODAY, dob: DOB });
    expect(fut.kind).toBe('future');
    expect(fut.text).toMatch(/check the year/i);

    const pre = dateEntryWarning({ date: '2019-05-01' }, { ageMonths: 81, today: TODAY, dob: DOB });
    expect(pre.kind).toBe('before-birth');
    expect(pre.text).toMatch(/check the year/i);
  });
});
