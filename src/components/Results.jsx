import React, { useState } from 'react';
import { recommend } from '../logic/recommend.js';
import { analyzeHistory } from '../logic/validate.js';
import { fmtAgeMonths, ageGroup } from '../logic/format.js';
import { RISK_FACTORS } from '../data/riskFactors.js';
import { PCV_HISTORY_PRODUCTS } from '../data/brands.js';
import RecCard from './RecCard.jsx';
import Disclaimer from './Disclaimer.jsx';
import { Chevron } from './icons.jsx';

export default function Results({ state, onReset, onChange, onBack }) {
  const { ageMonths, riskIds, pcvDoses, ppsv23Doses } = state;
  const [editingAge, setEditingAge] = useState(false);
  const [editingDoses, setEditingDoses] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const result = recommend({
    ageMonths: ageMonths ?? 0,
    riskIds,
    pcvDoses,
    ppsv23Doses,
  });

  const { recs, hsct, pcv21Geo } = result;

  // PD2/D1: answer-first summary line, composed from the same dueToday flags
  // that already drive the recommendation cards below — no new logic.
  let summaryLine;
  if (hsct) {
    summaryLine = 'HSCT advisory series applies. See details below.';
  } else {
    const dueVaccines = [...new Set(recs.filter(r => r.dueToday && !r.advisory).map(r => r.vaccine))];
    summaryLine = dueVaccines.length > 0
      ? `Due today: ${dueVaccines.join(' and ')}.`
      : 'No pneumococcal doses due today.';
  }

  // PC1: recorded-dose validity chips, reusing validate.js's analyzeHistory
  // (never recomputed here). A scenario can produce more than one PCV- or
  // PPSV23-tagged card (e.g. "Option A" / "Option B" alternatives) — the
  // full recorded history is attached to only the FIRST card of each vaccine
  // type so it isn't duplicated across alternative-option cards.
  //
  // The engine only emits a card for a vaccine when there's something
  // actionable to say about it (e.g. a completed PCV series with PPSV23
  // still pending renders ONLY a PPSV23 card). When that leaves a vaccine
  // with recorded doses but no card of its own, its history is attached as
  // a labeled secondary block on the first card that DOES render, so a
  // clinician can still see it (and, critically, the "PCV7 does not count"
  // note) rather than it silently disappearing.
  const histories = {
    PCV: { label: 'PCV', doses: pcvDoses, doseValidations: analyzeHistory('PCV', pcvDoses, ageMonths ?? 0).perDose },
    PPSV23: { label: 'PPSV23', doses: ppsv23Doses, doseValidations: analyzeHistory('PPSV23', ppsv23Doses, ageMonths ?? 0).perDose },
  };
  const seenVaccine = {};
  function historyPropsFor(vaccine) {
    if (seenVaccine[vaccine]) return {};
    seenVaccine[vaccine] = true;
    const h = histories[vaccine];
    return h ? { doses: h.doses, doseValidations: h.doseValidations } : {};
  }
  function buildCards(recList) {
    const cards = recList.map((r, i) => (
      <RecCard key={i} rec={r} ageMonths={ageMonths ?? 0} {...historyPropsFor(r.vaccine)} />
    ));
    const orphan = Object.values(histories).find(
      h => h.doses.length > 0 && !seenVaccine[h.label]
    );
    if (orphan && cards.length > 0) {
      cards[0] = React.cloneElement(cards[0], { otherHistory: orphan });
    }
    return cards;
  }
  const group = ageGroup(ageMonths);
  const riskLabels = riskIds.map(id => RISK_FACTORS.find(r => r.id === id)?.label).filter(Boolean);

  const years = ageMonths != null ? Math.floor(ageMonths / 12) : '';
  const months = ageMonths != null ? Math.round(ageMonths % 12) : '';
  function setAge(y, m) {
    const yy = parseFloat(y);
    const mm = parseFloat(m) || 0;
    if (isNaN(yy) || yy < 0) return;
    const am = yy * 12 + mm;
    onChange?.({ ageMonths: am, ageGroup: ageGroup(am) });
  }

  const isAdult = (ageMonths ?? 0) >= 216;
  const pcvOptions = PCV_HISTORY_PRODUCTS.filter(p => {
    if (p.key === '') return true;
    if (p.key === 'PCV21' && !isAdult) return false;
    return true;
  });

  // ── Recorded-dose editors (live re-render via onChange) ──
  function addPcv() { onChange?.({ pcvDoses: [...pcvDoses, { date: '', product: '' }] }); }
  function removePcv(i) { onChange?.({ pcvDoses: pcvDoses.filter((_, idx) => idx !== i) }); }
  function updatePcv(i, field, val) {
    onChange?.({ pcvDoses: pcvDoses.map((d, idx) => idx === i ? { ...d, [field]: val } : d) });
  }
  function addPpsv() { onChange?.({ ppsv23Doses: [...ppsv23Doses, { date: '', product: 'PPSV23' }] }); }
  function removePpsv(i) { onChange?.({ ppsv23Doses: ppsv23Doses.filter((_, idx) => idx !== i) }); }
  function updatePpsv(i, val) {
    onChange?.({ ppsv23Doses: ppsv23Doses.map((d, idx) => idx === i ? { ...d, date: val } : d) });
  }

  return (
    <div>
      {/* PD2/D1: answer-first verdict, before any detail. */}
      <div className="results-summary-line" data-testid="results-summary-line">
        {summaryLine}
      </div>

      {/* Summary header */}
      <div className="results-header">
        <div className="results-title">Pneumococcal Recommendation</div>
        <div className="results-meta">
          <div className="meta-chips">
            <span className="meta-chip meta-age">{fmtAgeMonths(ageMonths)}</span>
            {group && <span className="meta-chip meta-group">{group}</span>}
            {riskLabels.length > 0
              ? riskLabels.map((l, i) => <span key={i} className="meta-chip meta-risk">{l}</span>)
              : <span className="meta-chip meta-norisk">No risk factors</span>}
          </div>
          <div className="meta-actions">
            {onChange && (
              <button type="button" className="age-edit-btn"
                onClick={() => { setEditingAge(v => !v); setEditingDoses(false); setShowLegend(false); }}
                aria-expanded={editingAge}>
                {editingAge ? 'Done' : <>Adjust age<Chevron open={editingAge} /></>}
              </button>
            )}
            {onChange && (
              <button type="button" className="age-edit-btn"
                onClick={() => { setEditingDoses(v => !v); setEditingAge(false); setShowLegend(false); }}
                aria-expanded={editingDoses}>
                {editingDoses ? 'Done'
                  : <>{`Recorded doses${(pcvDoses.length + ppsv23Doses.length) > 0 ? ` (${pcvDoses.length + ppsv23Doses.length})` : ''}`}<Chevron open={editingDoses} /></>}
              </button>
            )}
            <button type="button" className="age-edit-btn"
              onClick={() => { setShowLegend(v => !v); setEditingAge(false); setEditingDoses(false); }}
              aria-expanded={showLegend}>
              Color key<Chevron open={showLegend} />
            </button>
          </div>
        </div>
        {editingAge && (
          <div className="age-edit-row" data-testid="age-edit-row">
            <div className="age-field">
              <label htmlFor="results-years">Years</label>
              <input id="results-years" type="number" min="0" max="120"
                value={years} onChange={e => setAge(e.target.value, months)} />
            </div>
            <div className="age-field">
              <label htmlFor="results-months">Months</label>
              <input id="results-months" type="number" min="0" max="11"
                value={months} onChange={e => setAge(years, e.target.value)} />
            </div>
            <span className="age-edit-hint">Recommendations update as you change the age.</span>
          </div>
        )}
        {editingDoses && (
          <div className="age-edit-row dose-history-panel" data-testid="recorded-doses-panel">

            {/* PCV doses */}
            <div className="dose-history-block">
              <div className="history-edit-section-title">PCV (conjugate) doses</div>
              {pcvDoses.length === 0 && (
                <div className="dose-edit-empty">
                  No PCV doses recorded.
                </div>
              )}
              {pcvDoses.map((dose, i) => (
                <div key={i} className="dose-row dose-row-compact">
                  <div className="dose-field">
                    <label>Product</label>
                    <select value={dose.product || ''}
                      onChange={e => updatePcv(i, 'product', e.target.value)}>
                      {pcvOptions.map(p => (
                        <option key={p.key || 'unknown'} value={p.key}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="dose-field">
                    <label>Date (optional)</label>
                    <input type="date" value={dose.date || ''}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={e => updatePcv(i, 'date', e.target.value)} />
                  </div>
                  <button className="dose-remove" onClick={() => removePcv(i)}
                    aria-label={`Remove PCV dose ${i + 1}`}>×</button>
                </div>
              ))}
              <button className="add-dose-btn" onClick={addPcv}>+ Add PCV dose</button>
            </div>

            {/* PPSV23 doses */}
            <div className="dose-history-block">
              <div className="history-edit-section-title">PPSV23 (Pneumovax 23) doses</div>
              {ppsv23Doses.length === 0 && (
                <div className="dose-edit-empty">
                  No PPSV23 doses recorded.
                </div>
              )}
              {ppsv23Doses.map((dose, i) => (
                <div key={i} className="dose-row dose-row-compact">
                  <div className="dose-field">
                    <label>Product</label>
                    <input type="text" value="PPSV23 (Pneumovax 23)" disabled
                      className="dose-field-disabled" />
                  </div>
                  <div className="dose-field">
                    <label>Date (optional)</label>
                    <input type="date" value={dose.date || ''}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={e => updatePpsv(i, e.target.value)} />
                  </div>
                  <button className="dose-remove" onClick={() => removePpsv(i)}
                    aria-label={`Remove PPSV23 dose ${i + 1}`}>×</button>
                </div>
              ))}
              <button className="add-dose-btn" onClick={addPpsv}>+ Add PPSV23 dose</button>
            </div>

            <span className="age-edit-hint">Changes update recommendations immediately.</span>
          </div>
        )}
        {/* PD2/E6/D6: what the colors used throughout this page mean. */}
        {showLegend && (
          <div className="age-edit-row legend-panel dose-history-panel" data-testid="legend-panel">
            <div className="dose-history-block">
              <div className="history-edit-section-title">Vaccine box colors</div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-due" /><span>Due today: on schedule, expected now</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-catchup" /><span>Catch-up: behind the routine schedule, needed now to catch up</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-shared" /><span>Shared decision: optional, patient and provider decide together</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-neutral" /><span>Not currently due (complete, not indicated, or deferred)</span></div>
            </div>
            <div className="dose-history-block">
              <div className="history-edit-section-title">Recorded-dose validity colors</div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-valid" /><span>On time</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-noncounting" /><span>Recorded (does not count): valid dose, doesn't count toward the series (e.g. PCV7)</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-invalid" /><span>Invalid (does not count)</span></div>
              <div className="legend-row"><span className="legend-swatch legend-swatch-unknown" /><span>Unknown (no date recorded)</span></div>
            </div>
          </div>
        )}
      </div>

      {/* HSCT advisory block — alert banner, prominent at top */}
      {hsct && (
        <div className="advisory-banner advisory-banner-hsct" data-testid="hsct-card">
          <div className="advisory-banner-title">
            Advisory: {hsct.title}
          </div>
          <div className="advisory-banner-flag">{hsct.coordinateFlag}</div>
          {hsct.recs.map((r, i) => (
            <div key={i}>
              <div className="advisory-dose-line">{r.doseLabel}</div>
              {r.note && <div className="advisory-note">{r.note}</div>}
              {r.citations && r.citations.length > 0 && (
                <div className="rec-citations">
                  {r.citations.map((c, j) => (
                    <a key={j} href={c.url} target="_blank" rel="noopener noreferrer"
                      className="citation-chip" title={c.label}>{c.short || c.label}</a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PCV21 geographic advisory — blue info banner */}
      {pcv21Geo && (
        <div className="advisory-banner advisory-banner-info" data-testid="pcv21-geo-note">
          <div className="advisory-banner-title">
            PCV21 geographic note:
          </div>
          <div className="advisory-note">{pcv21Geo.note}</div>
          {pcv21Geo.citations && pcv21Geo.citations.length > 0 && (
            <div className="rec-citations">
              {pcv21Geo.citations.map((c, i) => (
                <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                  className="citation-chip" title={c.label}>{c.short || c.label}</a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Standard recommendations — collapsed under HSCT when HSCT active */}
      {hsct ? (
        <details className="rec-section">
          <summary className="history-edit-summary">
            Standard age/history schedule (reference, applies after completing the HSCT series above)
          </summary>
          {buildCards(recs)}
        </details>
      ) : (
        <div className="rec-section">
          <div className="rec-section-title">Recommendation</div>
          {buildCards(recs)}
        </div>
      )}

      <Disclaimer />

      <div className="results-actions">
        {onBack && (
          <button className="btn btn-outline" onClick={onBack}>Edit history</button>
        )}
        <button className="btn btn-outline" onClick={onReset}>Start Over</button>
      </div>
    </div>
  );
}
