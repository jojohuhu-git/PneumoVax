import React, { useState } from 'react';
import Stepper from './components/Stepper.jsx';
import StepAge from './components/StepAge.jsx';
import StepRisks from './components/StepRisks.jsx';
import StepHistory from './components/StepHistory.jsx';
import Results from './components/Results.jsx';
import { PCV_HISTORY_PRODUCTS } from './data/brands.js';

const STEPS = ['Age', 'Risks', 'History', 'Results'];

const INITIAL_STATE = {
  step: 0,
  ageMonths: null,
  ageGroup: null,
  riskIds: [],
  pcvDoses: [],
  ppsv23Doses: [],
};

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);
  const [ageError, setAgeError] = useState('');

  function update(patch) {
    setState(prev => ({ ...prev, ...patch }));
  }

  function goNext() {
    if (state.step === 0) {
      if (state.ageMonths == null || state.ageMonths < 0) {
        setAgeError('Please enter a valid age before continuing.');
        return;
      }
      setAgeError('');
    }
    setState(prev => ({ ...prev, step: Math.min(prev.step + 1, STEPS.length - 1) }));
  }

  function goBack() {
    setState(prev => ({ ...prev, step: Math.max(prev.step - 1, 0) }));
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

      <main className="app-main">
        {state.step === 0 && (
          <StepAge
            ageMonths={state.ageMonths}
            ageGroup={state.ageGroup}
            error={ageError}
            onChange={({ ageMonths, ageGroup }) => {
              update({ ageMonths, ageGroup });
              if (ageMonths != null) setAgeError('');
            }}
          />
        )}
        {state.step === 1 && (
          <StepRisks
            ageMonths={state.ageMonths}
            riskIds={state.riskIds}
            onChange={riskIds => update({ riskIds })}
          />
        )}
        {state.step === 2 && (
          <StepHistory
            ageMonths={state.ageMonths}
            pcvDoses={state.pcvDoses}
            ppsv23Doses={state.ppsv23Doses}
            onChangePcv={pcvDoses => update({ pcvDoses })}
            onChangePpsv={ppsv23Doses => update({ ppsv23Doses })}
            pcvProducts={PCV_HISTORY_PRODUCTS}
          />
        )}
        {state.step === 3 && (
          <Results state={state} onReset={reset} onChange={update}
            onBack={() => update({ step: 2 })} />
        )}
      </main>

      {state.step < 3 && (
        <div className="app-nav">
          <div className="app-nav-inner">
            {state.step > 0 ? (
              <button className="btn btn-back" onClick={goBack}>← Back</button>
            ) : (
              <span />
            )}
            <button className="btn btn-next" onClick={goNext}>
              {state.step === 2 ? 'View Results →' : 'Next →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
