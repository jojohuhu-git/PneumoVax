import React from 'react';
import { RISK_FACTORS } from '../data/riskFactors.js';
import RiskAgeNote from './RiskAgeNote.jsx';

const GROUP_LABELS = {
  IC: 'Immunocompromising conditions',
  special: 'Cochlear implant / CSF leak',
  nonIC: 'Chronic (non-immunocompromising) conditions',
};
const GROUP_ORDER = ['IC', 'special', 'nonIC'];

export default function StepRisks({ ageMonths, riskIds, onChange }) {
  const noneSelected = riskIds.length === 0;
  // P3-9 (S13, 2026-10-10): the `adultOnly` age gate that used to hide smoking
  // and alcohol use disorder below 19y is GONE — owner decision, option (b):
  // show every risk factor at every age and explain the ones that do not act,
  // rather than withholding the checkbox.
  //
  // The gate was never a real guard in any case. It only decided what
  // RENDERED; it never cleared a tick already in state, so entering 25y,
  // ticking smoking, going Back and correcting the age to 15 carried the tick
  // through to a 15-year-old's recommendation. That hole is closed in the
  // engine by `pedsRiskIds()` (P3-9b, S10b), and RiskAgeNote below is what
  // tells the clinician the tick was seen and why it did not act.

  function toggle(id) {
    if (riskIds.includes(id)) onChange(riskIds.filter(r => r !== id));
    else onChange([...riskIds, id]);
  }
  function clearAll() { onChange([]); }

  return (
    <div className="step-card">
      <div className="step-title">Risk Factors</div>
      <div className="step-sub">
        Select all that apply. These drive the pneumococcal pathway, the PCV15→PPSV23 interval,
        and (for HSCT) the advisory series.
      </div>

      <div className="risk-list" role="group" aria-label="Risk factors">
        {GROUP_ORDER.map(group => {
          const items = RISK_FACTORS.filter(rf => rf.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="risk-group">
              <div className="risk-group-title">{GROUP_LABELS[group]}</div>
              {items.map(rf => {
                const selected = riskIds.includes(rf.id);
                return (
                  <label key={rf.id} className={`risk-item${selected ? ' selected' : ''}${rf.exclude ? ' risk-item-exclude' : ''}`}>
                    <input type="checkbox" className="risk-checkbox"
                      checked={selected} onChange={() => toggle(rf.id)} />
                    <div className="risk-text">
                      <div className="risk-label">{rf.label}</div>
                      {rf.sublabel && <div className="risk-sublabel">{rf.sublabel}</div>}
                    </div>
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>

      <RiskAgeNote riskIds={riskIds} ageMonths={ageMonths} />

      {/* S11 / P5-6 (2026-10-12): a real button, not a <label> wearing
          role="button". The old version hand-wrote an onKeyDown for Enter and
          so did nothing at all on SPACE — the key most people press on a
          button. A <button> gets both from the browser, for free. `aria-pressed`
          says whether it is currently chosen; that state used to live only in a
          CSS class, so a screen reader announced it identically either way.
          Ported from MeningoVax's StepRisks.jsx. */}
      <button type="button"
        className={`risk-none${noneSelected ? ' selected' : ''}`}
        onClick={clearAll}
        aria-pressed={noneSelected}>
        <span>No risk factors apply</span>
      </button>
    </div>
  );
}
