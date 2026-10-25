import React, { useState, useRef, useEffect } from 'react';
import Stepper from './components/Stepper.jsx';
import StepAge from './components/StepAge.jsx';
import StepRisks from './components/StepRisks.jsx';
import StepHistory from './components/StepHistory.jsx';
import Results from './components/Results.jsx';
import Rulebook from './components/Rulebook.jsx';
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
  // P4-4 (2026-10-16): tri-state — null = not yet asked, false = "no previous
  // doses", true = "yes, record doses". Lifted here (not local to
  // StepHistory) because `goNext` must refuse to leave the History step while
  // this is null, and `goNext` lives in App.jsx.
  historyAnswered: null,
};

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);
  const [ageError, setAgeError] = useState('');
  // C14 (2026-10-25): the rulebook page. Held as a flag rather than a route so
  // that opening it and coming back leaves the half-filled patient exactly as
  // it was — this app has no router, and a clinician three steps into a
  // history should not lose it to answer "why is it saying that?".
  const [rulebookOpen, setRulebookOpen] = useState(false);

  // P3-1: one clock read, one age. Derived here so a tab left open across
  // midnight ages the patient along with the calendar, instead of holding the
  // snapshot taken when the date of birth was typed.
  const today = todayISO();
  const ageMonths = patientAgeMonths(state, today);
  const ageGroup = ageMonths != null ? deriveGroup(ageMonths) : null;
  const patient = { ...state, ageMonths, ageGroup };
  const mainRef = useRef(null);

  // S11 / P5-3 (2026-10-12): after Next or Back, nothing was focused, so a
  // keyboard user had to press Tab once before they could type — and that one
  // stray keystroke is what makes people give up and reach for the mouse.
  //
  // Owner decision, recorded in MeningoVax's K4 and applied here unchanged:
  // always focus the step's first real field, ON PHONES TOO, even though that
  // opens the on-screen keyboard and hides part of the page there. If that
  // turns out to be annoying in practice, a narrow-screen exception is a
  // one-line change — not pre-empted here.
  //
  // The Results step is excluded on purpose: it is read, not filled in, so
  // taking focus would move a screen reader off the recommendation the
  // clinician just asked for.
  useEffect(() => {
    if (rulebookOpen) return;         // C14 — the rulebook is read, not filled in.
    if (state.step >= 3) return;      // Results — read, not filled in.
    const main = mainRef.current;
    if (!main) return;
    const target =
      // The age step offers two modes; `#dob-input` exists only in the first.
      state.step === 0 ? main.querySelector('#dob-input, #age-years') :
      state.step === 1 ? main.querySelector('input[type="checkbox"]') :
      // History: the first date box once doses are recorded, the "+ Add PCV
      // dose" button on an empty-but-answered step, or — P4-4 — the "No
      // previous doses" toggle button when the yes/no question is still
      // unanswered, which is now the step's first real control.
      (main.querySelector('.dose-field input[type="date"]') ||
       main.querySelector('.add-dose-btn') ||
       main.querySelector('.history-toggle-btn'));
    target?.focus();
  }, [state.step, rulebookOpen]);

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
    // The hard-stop exclusion (transplant / CAR-T / B-cell) needs no
    // vaccination history to show its stop message, so skip the History step
    // straight to Results. Since 2026-10-16 that includes the transplant tick,
    // which used to walk the clinician through a history it then set aside.
    if (state.step === 1 && hasExclusion(state.riskIds)) {
      setState(prev => ({ ...prev, step: 3 }));
      return;
    }
    // P4-4 (2026-10-16): an untouched History step used to look identical to
    // one the clinician answered "no previous doses" for — both left the
    // dose lists empty. Refuse to leave until the yes/no question is
    // answered; the "Select yes or no above" hint already on screen explains
    // why, so no second error message is added here.
    if (state.step === 2 && state.historyAnswered == null) return;
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
          {!rulebookOpen && <Stepper steps={STEPS} current={state.step} />}
          {/* Only when the rulebook is shut: the page carries its own way back,
              and two controls doing the same thing in the same view is noise. */}
          {!rulebookOpen && (
            <button type="button" className="rb-link" onClick={() => setRulebookOpen(true)}>
              How recommendations are made
            </button>
          )}
        </div>
      </header>

      {rulebookOpen && (
        <main className="app-main-rulebook">
          <Rulebook onClose={() => setRulebookOpen(false)} />
        </main>
      )}

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
      <form className="app-form" onSubmit={e => { e.preventDefault(); goNext(); }} hidden={rulebookOpen}>

      <main className="app-main" ref={mainRef}>
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
            historyAnswered={state.historyAnswered}
            onAnswerChange={historyAnswered => update({ historyAnswered })}
          />
        )}
        {state.step === 3 && (
          <Results state={patient} today={today} onReset={reset} onChange={update}
            onBack={goBack} />
        )}
      </main>

      {state.step < 3 && !rulebookOpen && (
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
