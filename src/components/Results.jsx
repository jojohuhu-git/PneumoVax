import React, { useState } from 'react';
import { recommend } from '../logic/recommend.js';
import { fmtAgeMonths, ageGroup } from '../logic/format.js';
import { RISK_FACTORS } from '../data/riskFactors.js';
import { PCV_HISTORY_PRODUCTS } from '../data/brands.js';
import RecCard from './RecCard.jsx';
import Disclaimer from './Disclaimer.jsx';
import RiskAgeNote from './RiskAgeNote.jsx';
import { Chevron } from './icons.jsx';
import { todayISO, daysBetween } from '../logic/dateUtils.js';
import { newDoseRow, dropBlankDoseRows } from '../logic/doseIdentity.js';

export default function Results({ state, onReset, onChange, onBack, today }) {
  const { ageMonths, dob, riskIds, pcvDoses, ppsv23Doses } = state;
  // queue P1-1 / P3-7 (S10): one clock read, threaded from App — see StepHistory.
  const maxDate = todayISO(today);
  const [editingAge, setEditingAge] = useState(false);
  const [editingDoses, setEditingDoses] = useState(false);

  const result = recommend({
    // P3-1 (S10): the date of birth goes to the engine, which uses it to
    // compare dose dates against real birthdays instead of reconstructing them.
    dob,
    ageMonths: ageMonths ?? 0,
    riskIds,
    pcvDoses,
    ppsv23Doses,
    today,
  });

  const { recs, hsct, pcv21Geo, excluded, exclusionMessage, exclusionCitations } = result;

  if (excluded) {
    return (
      <div>
        <div className="advisory-banner advisory-banner-exclude" data-testid="exclusion-stop">
          <div className="advisory-banner-title">Does not apply to this patient</div>
          <div className="advisory-note">{exclusionMessage}</div>
          {exclusionCitations && exclusionCitations.length > 0 && (
            <div className="rec-citations">
              {exclusionCitations.map((c, i) => (
                <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                  className="citation-chip" title={c.label}>{c.short || c.label}</a>
              ))}
            </div>
          )}
        </div>
        <Disclaimer />
        <div className="results-actions">
          {onBack && (
            <button className="btn btn-outline" onClick={onBack}>Edit risk factors</button>
          )}
          <button className="btn btn-outline" onClick={onReset}>Start Over</button>
        </div>
      </div>
    );
  }

  // PD2/D1: answer-first summary line, composed from the same dueToday flags
  // that already drive the recommendation cards below — no new logic.
  // Item 4 parity (2026-07-23, ported from MeningoVax): a shared-decision rec
  // (e.g. PCV20/21 after PPSV23 at ≥65y) can be dueToday AND optional at the
  // same time -- "due" alone reads as mandatory. Split required vs. optional
  // so the summary never calls an optional dose flatly "due."
  let summaryLine;
  if (hsct) {
    summaryLine = 'HSCT advisory series applies. See details below.';
  } else {
    const activeRecs = recs.filter(r => r.dueToday && !r.advisory);
    const requiredVaccines = [...new Set(activeRecs.filter(r => r.status !== 'shared-decision').map(r => r.vaccine))];
    const optionalVaccines = [...new Set(activeRecs.filter(r => r.status === 'shared-decision').map(r => r.vaccine))]
      .filter(v => !requiredVaccines.includes(v));

    if (requiredVaccines.length > 0) {
      summaryLine = `Due today: ${requiredVaccines.join(' and ')}.`;
      if (optionalVaccines.length > 0) {
        summaryLine += ` ${optionalVaccines.join(' and ')} ${optionalVaccines.length > 1 ? 'are' : 'is'} optional (shared clinical decision).`;
      }
    } else if (optionalVaccines.length > 0) {
      summaryLine = `${optionalVaccines.join(' and ')} ${optionalVaccines.length > 1 ? 'are' : 'is'} optional today (shared clinical decision). No other pneumococcal doses due today.`;
    } else {
      summaryLine = 'No pneumococcal doses due today.';
    }
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
  // P6-5 (S13): the ENGINE's walk, not a second one of our own. `recommend()`
  // already ran analyzeHistory for both vaccines to build the recommendation
  // above; reading its result means the chip beside a dose can never disagree
  // with the recommendation that was computed from it. Results used to call
  // analyzeHistory again with the same arguments — the two agreed only by
  // coincidence, with nothing enforcing it.
  // P0 (2026-10-12): the doses come from the ENGINE, not from `pcvDoses` /
  // `ppsv23Doses`. Those are the raw state arrays in the order the clinician
  // typed them; the walk sorts into date order before grading, so pairing
  // them with `perDose` by index showed every verdict against the wrong dose
  // the moment a history was entered newest-first. `orderedDoses[v][i]` and
  // `perDose[v][i]` are built in the same loop and cannot disagree.
  //
  // Sorting here instead would have been a second implementation of the
  // walk's ordering — the same two-sources-of-truth shape P6-5 removed when
  // it stopped Results walking the history itself.
  const histories = {
    PCV: { label: 'PCV', doses: result.orderedDoses.pcv, doseValidations: result.perDose.pcv },
    PPSV23: { label: 'PPSV23', doses: result.orderedDoses.ppsv23, doseValidations: result.perDose.ppsv23 },
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
      <RecCard key={i} rec={r} ageMonths={ageMonths ?? 0} dob={dob} today={today} {...historyPropsFor(r.vaccine)} />
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
  const months = ageMonths != null ? Math.floor(ageMonths % 12) : '';
  function setAge(y, m) {
    const yy = parseFloat(y);
    const mm = parseFloat(m) || 0;
    if (isNaN(yy) || yy < 0) return;
    const am = yy * 12 + mm;
    // P3-1 (S10): clear the stored date of birth. patientAgeMonths prefers a
    // date of birth over an ageMonths value, so leaving it in place would make
    // this box look editable while changing nothing.
    onChange?.({ dob: null, ageMonths: am, ageGroup: ageGroup(am) });
  }

  const isAdult = (ageMonths ?? 0) >= 216;
  const pcvOptions = PCV_HISTORY_PRODUCTS.filter(p => {
    if (p.key === '') return true;
    if (p.key === 'PCV21' && !isAdult) return false;
    return true;
  });

  // P1-3 (2026-10-12): what the "Recorded doses (N)" button counts. Rows the
  // clinician has not typed in are not doses, and the engine does not count
  // them, so the button must not either — a button reading "(1)" above a card
  // showing no doses is the app contradicting itself.
  const recordedDoseCount =
    dropBlankDoseRows(pcvDoses).length + dropBlankDoseRows(ppsv23Doses).length;

  // ── Recorded-dose editors (live re-render via onChange) ──
  function addPcv() { onChange?.({ pcvDoses: [...pcvDoses, newDoseRow()] }); }
  function removePcv(i) { onChange?.({ pcvDoses: pcvDoses.filter((_, idx) => idx !== i) }); }
  function updatePcv(i, field, val) {
    onChange?.({ pcvDoses: pcvDoses.map((d, idx) => idx === i ? { ...d, [field]: val } : d) });
  }
  // The product is stamped on at creation so the card can print it;
  // `isBlankDoseRow` treats that stamp as a label, not an answer.
  function addPpsv() { onChange?.({ ppsv23Doses: [...ppsv23Doses, newDoseRow({ product: 'PPSV23' })] }); }
  function removePpsv(i) { onChange?.({ ppsv23Doses: ppsv23Doses.filter((_, idx) => idx !== i) }); }
  function updatePpsv(i, val) {
    onChange?.({ ppsv23Doses: ppsv23Doses.map((d, idx) => idx === i ? { ...d, date: val } : d) });
  }
  function updatePpsvField(i, field, val) {
    onChange?.({ ppsv23Doses: ppsv23Doses.map((d, idx) => idx === i ? { ...d, [field]: val } : d) });
  }

  // P1-3 (2026-10-12): rows the clinician added and never typed in are swept
  // when the panel CLOSES, never while it is open — a half-typed row must not
  // vanish under the cursor. The engine ignores them either way; this stops
  // them accumulating in the list.
  function closeDosePanel() {
    setEditingDoses(false);
    const pcvKept = dropBlankDoseRows(pcvDoses);
    const ppsvKept = dropBlankDoseRows(ppsv23Doses);
    if (pcvKept.length !== pcvDoses.length || ppsvKept.length !== ppsv23Doses.length) {
      onChange?.({ pcvDoses: pcvKept, ppsv23Doses: ppsvKept });
    }
  }

  // Same tick as the history step. Shown only while the row is otherwise
  // empty, which is the only case where "not typed yet" and "a dose was
  // given, details unknown" differ.
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
            when you close this panel.
          </span>
        </span>
      </label>
    );
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
            <span className="meta-chip meta-age">
              {/* P3-5: exact weeks when a date of birth is on file. */}
              {fmtAgeMonths(ageMonths, {
                // maxDate, not the raw prop: it is the one resolved clock read.
                exactDays: dob ? daysBetween(dob, maxDate) : undefined,
              })}
            </span>
            {group && <span className="meta-chip meta-group">{group}</span>}
            {riskLabels.length > 0
              ? riskLabels.map((l, i) => <span key={i} className="meta-chip meta-risk">{l}</span>)
              : <span className="meta-chip meta-norisk">No risk factors</span>}
          </div>

          {/* P3-9: the chips above list every tick, including an adult-only
              one that the engine disregarded for a child. This is the sentence
              that says so — the surface the owner's hold on PR #20 was about. */}
          <RiskAgeNote riskIds={riskIds} ageMonths={ageMonths} />
          <div className="meta-actions">
            {onChange && (
              <button type="button" className="age-edit-btn"
                onClick={() => { setEditingAge(v => !v); if (editingDoses) closeDosePanel(); }}
                aria-expanded={editingAge}>
                {/* P6-6: the label stays when open; the chevron carries the
                    state. "Done" discarded the only words saying what the
                    button controls — and with "Why this" already keeping its
                    label, it was the odd one out in its own component. */}
                Adjust age<Chevron open={editingAge} />
              </button>
            )}
            {onChange && (
              <button type="button" className="age-edit-btn"
                onClick={() => { if (editingDoses) closeDosePanel(); else setEditingDoses(true); setEditingAge(false); }}
                aria-expanded={editingDoses}>
                {/* P1-3: count DOSES, not rows. An untouched row the engine
                    ignores must not be announced as a recorded dose. */}
                {`Recorded doses${recordedDoseCount > 0 ? ` (${recordedDoseCount})` : ''}`}
                <Chevron open={editingDoses} />
              </button>
            )}
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
                      max={maxDate}
                      onChange={e => updatePcv(i, 'date', e.target.value)} />
                  </div>
                  <button className="dose-remove" onClick={() => removePcv(i)}
                    aria-label={`Remove PCV dose ${i + 1}`}>×</button>
                  {!dose.date && !dose.product && (
                    <UnknownDoseTick
                      checked={dose.detailsUnknown}
                      onToggle={(v) => updatePcv(i, 'detailsUnknown', v)}
                    />
                  )}
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
                      max={maxDate}
                      onChange={e => updatePpsv(i, e.target.value)} />
                  </div>
                  <button className="dose-remove" onClick={() => removePpsv(i)}
                    aria-label={`Remove PPSV23 dose ${i + 1}`}>×</button>
                  {!dose.date && (
                    <UnknownDoseTick
                      checked={dose.detailsUnknown}
                      onToggle={(v) => updatePpsvField(i, 'detailsUnknown', v)}
                    />
                  )}
                </div>
              ))}
              <button className="add-dose-btn" onClick={addPpsv}>+ Add PPSV23 dose</button>
            </div>

            <span className="age-edit-hint">Changes update recommendations immediately.</span>
          </div>
        )}
        {/* S14-5 (owner decision, mirrors MeningoVax decision C1): the color
            key is removed, not merely hidden. Every pill and chip states its
            own verdict in words — "Dose N of M", "Invalid", "Extra dose —
            more than this series needs" — so card fill and chip color only
            reinforce what the label already says; nothing needs a key to
            decode it. */}
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
