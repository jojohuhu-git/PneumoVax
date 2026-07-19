import React from 'react';

// Vaccination history for PneumoVax — two product streams in one step:
//   • PCV doses (product dropdown: PCV7/13/15/20/21 + Unknown)
//   • PPSV23 doses (date only)
// Each dose is { date?, product? }. Both optional; counting works without dates.
// Both lists are always visible and start empty — no auto-added rows.
export default function StepHistory({
  ageMonths, pcvDoses, ppsv23Doses, onChangePcv, onChangePpsv, pcvProducts,
}) {
  const isAdult = (ageMonths ?? 0) >= 216;

  function addPcv() { onChangePcv([...pcvDoses, { date: '', product: '' }]); }
  function removePcv(i) { onChangePcv(pcvDoses.filter((_, idx) => idx !== i)); }
  function updatePcv(i, field, val) {
    onChangePcv(pcvDoses.map((d, idx) => idx === i ? { ...d, [field]: val } : d));
  }
  function addPpsv() { onChangePpsv([...ppsv23Doses, { date: '', product: 'PPSV23' }]); }
  function removePpsv(i) { onChangePpsv(ppsv23Doses.filter((_, idx) => idx !== i)); }
  function updatePpsv(i, val) {
    onChangePpsv(ppsv23Doses.map((d, idx) => idx === i ? { ...d, date: val } : d));
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
                max={new Date().toISOString().slice(0, 10)}
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
          </div>
        ))}
      </div>
      <button className="add-dose-btn" onClick={addPcv}>+ Add PCV dose</button>

      {/* ── PPSV23 stream ── */}
      <div className="history-section-title" style={{ marginTop: 18 }}>PPSV23 (Pneumovax 23) doses</div>
      <div className="dose-list">
        {ppsv23Doses.map((dose, i) => (
          <div key={i} className="dose-row">
            <div className="dose-field">
              <label>Date (optional)</label>
              <input type="date" value={dose.date || ''}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => updatePpsv(i, e.target.value)} />
            </div>
            <div className="dose-field">
              <label>Product</label>
              <input type="text" value="PPSV23 (Pneumovax 23)" disabled
                style={{ background: 'var(--gy6)', color: 'var(--gy3)' }} />
            </div>
            <button className="dose-remove" onClick={() => removePpsv(i)}
              aria-label={`Remove PPSV23 dose ${i + 1}`}>×</button>
          </div>
        ))}
      </div>
      <button className="add-dose-btn" onClick={addPpsv}>+ Add PPSV23 dose</button>

      <div className="family-note" style={{ borderLeftColor: 'var(--gy4)', background: 'var(--gy6)', color: 'var(--gy3)' }}>
        Unknown / undocumented history is treated as unvaccinated. PCV7 doses are recorded for
        completeness but ignored when calculating current needs (per ACIP/immunize.org).
      </div>

      {(pcvDoses.length > 0 || ppsv23Doses.length > 0) && (
        <button type="button" className="history-clear-link" onClick={clearAll}
          style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--gy3)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>
          No previous doses (clear all)
        </button>
      )}
    </div>
  );
}
