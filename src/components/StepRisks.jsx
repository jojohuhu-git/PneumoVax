import React from 'react';
import { RISK_FACTORS } from '../data/riskFactors.js';
import { ADULT_SCHED_MIN_M } from '../logic/scheduleConstants.js';

const GROUP_LABELS = {
  IC: 'Immunocompromising conditions',
  special: 'Cochlear implant / CSF leak',
  nonIC: 'Chronic (non-immunocompromising) conditions',
  hsct: 'Hematopoietic stem cell transplant',
};
const GROUP_ORDER = ['IC', 'special', 'nonIC', 'hsct'];

export default function StepRisks({ ageMonths, riskIds, onChange }) {
  const noneSelected = riskIds.length === 0;
  // adultOnly risks (smoking, alcohol) shown only when patient is on adult rulebook (≥19y).
  const isAdult = (ageMonths ?? 0) >= ADULT_SCHED_MIN_M;

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
          const items = RISK_FACTORS.filter(rf => rf.class === group && (!rf.adultOnly || isAdult));
          if (items.length === 0) return null;
          return (
            <div key={group} className="risk-group">
              <div className="risk-group-title">{GROUP_LABELS[group]}</div>
              {items.map(rf => {
                const selected = riskIds.includes(rf.id);
                return (
                  <label key={rf.id} className={`risk-item${selected ? ' selected' : ''}`}>
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

      <label className={`risk-none${noneSelected ? ' selected' : ''}`}
        onClick={clearAll} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && clearAll()}>
        <span>No risk factors apply</span>
      </label>
    </div>
  );
}
