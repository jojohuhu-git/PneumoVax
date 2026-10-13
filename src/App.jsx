import React, { useState } from 'react';
import Stepper from './components/Stepper.jsx';
import StepAge from './components/StepAge.jsx';
import StepRisks from './components/StepRisks.jsx';
import StepHistory from './components/StepHistory.jsx';
import Results from './components/Results.jsx';
import { PCV_HISTORY_PRODUCTS } from './data/brands.js';
import { dropBlankDoseRows } from './logic/doseIdentity.js';
import { hasExclusion } from './data/riskFactors.js';
import { patientAgeMonths } from './logic/patientAge.js';
import { todayISO } from './logic/dateUtils.js';
import { ageGroup as deriveGroup } from './logic/format.js';

const STEPS = ['Age', 'Risks', 'History', 'Results'];

const INITIAL_STATE = {
  step: 0,
  // P3-1 (S10): the date of birth is kept whenever the clinician gives one, and
  // the age is derived from it at render rather than frozen at typing time.
  // `ageMonths` is still the stored value for the Years/Months fallback, where
  // there is no birthday to derive from.
  dob: null,
  ageMonths: null,
  ageGroup: null,
  riskIds: [],
  pcvDoses: [],
  ppsv23Doses: [],
};

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);
  const [ageError, setAgeError] = useState('');

  // P3-1: one clock read, one age. Derived here so a tab left open across
  // midnight ages the patient along with the calendar, instead of holding the
  // snapshot taken when the date of birth was typed.
  const today = todayISO();
  const ageMonths = patientAgeMonths(state, today);
  const ageGroup = ageMonths != null ? deriveGroup(ageMonths) : null;
  const patient = { ...state, ageMonths, ageGroup };

  function update(patch) {
    setState(prev => ({ ...prev, ...patch }));
  }

  // P1-3 (2026-10-12): rows the clinician added and never typed in are swept
  // when they LEAVE the history step — never while they are in it, or a
  // half-typed row would disappear under the cursor. The engine ignores blank
  // rows regardless; this stops them accumulating in the list the clinician
  // comes back to.
  function sweepHistory(prev) {
    const pcvDoses = dropBlankDoseRows(prev.pcvDoses);
    const ppsv23Doses = dropBlankDoseRows(prev.ppsv23Doses);
    if (pcvDoses.length === (prev.pcvDoses ?? []).length &&
        ppsv23Doses.length === (prev.ppsv23Doses ?? []).length) return prev;
    return { ...prev, pcvDoses, ppsv23Doses };
  }

  function goNext() {
    if (state.step === 0) {
      if (ageMonths == null || ageMonths < 0) {
        setAgeError('Please enter a valid age before continuing.');
        return;
      }
      setAgeError('');
    }
    // The hard-stop exclusion (CAR-T/B-cell) needs no vaccination history to
    // show its stop message, so skip the History step straight to Results.
    if (state.step === 1 && hasExclusion(state.riskIds)) {
      setState(prev => ({ ...prev, step: 3 }));
      return;
    }
    setState(prev => ({ ...sweepHistory(prev), step: Math.min(prev.step + 1, STEPS.length - 1) }));
  }

  function goBack() {
    if (state.step === 3 && hasExclusion(state.riskIds)) {
      setState(prev => ({ ...prev, step: 1 }));
      return;
    }
    setState(prev => ({ ...sweepHistory(prev), step: Math.max(prev.step - 1, 0) }));
  }

  function reset() {
    setState(INITIAL_STATE);
    setAgeError('');
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">
            <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="PneumoVax" className="app-logo-icon" />
            <div>
              <div className="app-logo-title">PneumoVax</div>
              <div className="app-logo-sub">Pneumococcal Vaccine Advisor</div>
            </div>
          </div>
          <Stepper steps={STEPS} current={state.step} />
        </div>
      </header>

      {/* S11 / P5-1 (2026-10-12): a real <form>, so Enter continues the wizard
          the way it does on every other web page. Before this the app had no
          form at all (measured: document.forms.length === 0), so typing a date
          of birth and pressing Enter did nothing and a keyboard user had to Tab
          past every control on the step to reach Next.

          Deliberately NOT a document-level keydown listener: a global listener
          fires no matter what has focus, which turns every button in the wizard
          into an Enter trap. MeningoVax had exactly that and removed it in K2.

          It wraps BOTH <main> and the nav below, because Next lives in the nav
          and a submit button only submits the form it is inside. Every other
          button in the app carries an explicit type="button" — inside a form a
          typeless button is a SUBMIT button, which would have made "+ Add PCV
          dose" advance the step. */}
      <form className="app-form" onSubmit={e => { e.preventDefault(); goNext(); }}>

      <main className="app-main">
        {state.step === 0 && (
          <StepAge
            ageMonths={ageMonths}
            ageGroup={ageGroup}
            today={today}
            error={ageError}
            onChange={({ dob, ageMonths: am, ageGroup: ag }) => {
              update({ dob: dob ?? null, ageMonths: am, ageGroup: ag });
              if (am != null) setAgeError('');
            }}
          />
        )}
        {state.step === 1 && (
          <StepRisks
            ageMonths={ageMonths}
            riskIds={state.riskIds}
            onChange={riskIds => update({ riskIds })}
          />
        )}
        {state.step === 2 && (
          <StepHistory
            ageMonths={ageMonths}
            today={today}
            dob={state.dob}
            pcvDoses={state.pcvDoses}
            ppsv23Doses={state.ppsv23Doses}
            onChangePcv={pcvDoses => update({ pcvDoses })}
            onChangePpsv={ppsv23Doses => update({ ppsv23Doses })}
            pcvProducts={PCV_HISTORY_PRODUCTS}
          />
        )}
        {state.step === 3 && (
          <Results state={patient} today={today} onReset={reset} onChange={update}
            onBack={goBack} />
        )}
      </main>

      {state.step < 3 && (
        <div className="app-nav">
          <div className="app-nav-inner">
            {state.step > 0 ? (
              <button type="button" className="btn btn-back" onClick={goBack}>Back</button>
            ) : (
              <span />
            )}
            {/* S11 / P5-1: the form's submit button, and the only thing that
                calls goNext(). Pressing Enter anywhere in the step is the
                browser pressing THIS button — no keyboard listener of our own.
                It keeps no onClick: submitting is what runs goNext, whether the
                click came from a mouse or from Enter. */}
            <button type="submit" className="btn btn-next">
              {state.step === 2 ? 'View Results' : 'Next'}
            </button>
          </div>
        </div>
      )}

      </form>
    </div>
  );
}
