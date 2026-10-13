import { todayISO } from '../logic/dateUtils.js';
import { newDoseRow } from '../logic/doseIdentity.js';
import DoseDateProblem from './DoseDateProblem.jsx';
import React from 'react';

// Vaccination history for PneumoVax — two product streams in one step:
//   • PCV doses (product dropdown: PCV7/13/15/20/21 + Unknown)
//   • PPSV23 doses (date only)
// Each dose is { date?, product? }. Both optional; counting works without dates.
// Both lists are always visible and start empty — no auto-added rows.
export default function StepHistory({
  ageMonths, pcvDoses, ppsv23Doses, onChangePcv, onChangePpsv, pcvProducts,
  today, dob,
}) {
  // queue P1-1 / P3-7 (S10): the clinician's LOCAL today, read once in App and
  // passed down. `new Date().toISOString()` is the UTC date, which is already
  // tomorrow after ~17:00 Pacific, so the picker offered a date validate.js
  // then correctly refused as being in the future.
  const maxDate = todayISO(today);
  const isAdult = (ageMonths ?? 0) >= 216;

  function addPcv() { onChangePcv([...pcvDoses, newDoseRow()]); }
  function removePcv(i) { onChangePcv(pcvDoses.filter((_, idx) => idx !== i)); }
  function updatePcv(i, field, val) {
    onChangePcv(pcvDoses.map((d, idx) => idx === i ? { ...d, [field]: val } : d));
  }
  // The product is stamped on at creation because the recommendation card
  // prints the product of every recorded dose; `isBlankDoseRow` knows it is a
  // label rather than an answer, so an untouched row is still not a dose.
  function addPpsv() { onChangePpsv([...ppsv23Doses, newDoseRow({ product: 'PPSV23' })]); }
  function removePpsv(i) { onChangePpsv(ppsv23Doses.filter((_, idx) => idx !== i)); }
  function updatePpsv(i, val) {
    onChangePpsv(ppsv23Doses.map((d, idx) => idx === i ? { ...d, date: val } : d));
  }
  function updatePpsvField(i, field, val) {
    onChangePpsv(ppsv23Doses.map((d, idx) => idx === i ? { ...d, [field]: val } : d));
  }

  // P1-3 (2026-10-12): an empty row means two things — "I have not typed yet"
  // and "a dose was given, but I have no card". The app cannot tell them
  // apart, and it used to guess the second, so a row nobody had touched was
  // graded as a dose of unknown date. The clinician now says which it is.
  // The tick appears only while the row is otherwise empty, because that is
  // the only case where the two readings differ.
  function UnknownDoseTick({ checked, onToggle }) {
    return (
      <label className="dose-row-unknown">
        <input
          type="checkbox"
          className="risk-checkbox"
          checked={!!checked}
          onChange={e => onToggle(e.target.checked)}
        />
        <span>
          A dose was given, but the date and product are unknown.
          <span className="dose-row-unknown-hint">
            Tick this to keep the dose on the record. An empty row is removed
            when you continue.
          </span>
        </span>
      </label>
    );
  }

  function clearAll() {
    onChangePcv([]);
    onChangePpsv([]);
  }

  // PCV product options: hide PCV21 for children (not licensed <18y), but allow
  // recording it for adults. Always include the "Unknown PCV product" sentinel.
  const pcvOptions = pcvProducts.filter(p => {
    if (p.key === '') return true;               // unknown sentinel
    if (p.key === 'PCV21' && !isAdult) return false;
    return true;
  });

  return (
    <div className="step-card">
      <div className="step-title">Vaccination History</div>
      <div className="step-sub">
        Record prior pneumococcal doses (optional, leave empty if none).
        Date is optional (counting works without it). PCV7 is recorded but never
        counts toward the series.
      </div>

      {/* ── PCV stream ── */}
      <div className="history-section-title">PCV (conjugate) doses</div>
      <div className="dose-list">
        {pcvDoses.map((dose, i) => (
          <div key={i} className="dose-row">
            <div className="dose-field">
              <label>Date (optional)</label>
              <input type="date" value={dose.date || ''}
                max={maxDate}
                onChange={e => updatePcv(i, 'date', e.target.value)} />
            </div>
            <div className="dose-field">
              <label>Product</label>
              <select value={dose.product || ''}
                onChange={e => updatePcv(i, 'product', e.target.value)}>
                {pcvOptions.map(p => (
                  <option key={p.key || 'unknown'} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
            <button className="dose-remove" onClick={() => removePcv(i)}
              aria-label={`Remove PCV dose ${i + 1}`}>×</button>
            <DoseDateProblem dose={dose} ageMonths={ageMonths} today={today} dob={dob} />
            {!dose.date && !dose.product && (
              <UnknownDoseTick
                checked={dose.detailsUnknown}
                onToggle={(v) => updatePcv(i, 'detailsUnknown', v)}
              />
            )}
          </div>
        ))}
      </div>
      <button className="add-dose-btn" onClick={addPcv}>+ Add PCV dose</button>

      {/* ── PPSV23 stream ── */}
      <div className="history-section-title history-section-title-spaced">PPSV23 (Pneumovax 23) doses</div>
      <div className="dose-list">
        {ppsv23Doses.map((dose, i) => (
          <div key={i} className="dose-row">
            <div className="dose-field">
              <label>Date (optional)</label>
              <input type="date" value={dose.date || ''}
                max={maxDate}
                onChange={e => updatePpsv(i, e.target.value)} />
            </div>
            <div className="dose-field">
              <label>Product</label>
              <input type="text" value="PPSV23 (Pneumovax 23)" disabled
                className="dose-field-disabled" />
            </div>
            <button className="dose-remove" onClick={() => removePpsv(i)}
              aria-label={`Remove PPSV23 dose ${i + 1}`}>×</button>
            <DoseDateProblem dose={dose} ageMonths={ageMonths} today={today} dob={dob} />
            {!dose.date && (
              <UnknownDoseTick
                checked={dose.detailsUnknown}
                onToggle={(v) => updatePpsvField(i, 'detailsUnknown', v)}
              />
            )}
          </div>
        ))}
      </div>
      <button className="add-dose-btn" onClick={addPpsv}>+ Add PPSV23 dose</button>

      <div className="family-note family-note-neutral">
        Unknown / undocumented history is treated as unvaccinated. PCV7 doses are recorded for
        completeness but ignored when calculating current needs (per ACIP/immunize.org).
      </div>

      {(pcvDoses.length > 0 || ppsv23Doses.length > 0) && (
        <button type="button" className="history-clear-link" onClick={clearAll}>
          No previous doses (clear all)
        </button>
      )}
    </div>
  );
}
