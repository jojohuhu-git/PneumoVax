import React, { useState, useEffect } from 'react';
import { recommend } from '../logic/recommend.js';
import { fmtAgeMonths, ageGroup } from '../logic/format.js';
import { RISK_FACTORS } from '../data/riskFactors.js';
import { PPSV23_PRODUCT, PCV_HISTORY_PRODUCTS } from '../data/brands.js';
import RecCard from './RecCard.jsx';
import Disclaimer from './Disclaimer.jsx';
import RiskAgeNote from './RiskAgeNote.jsx';
import DoseEditor from './DoseEditor.jsx';
import { Chevron } from './icons.jsx';
import { todayISO, daysBetween } from '../logic/dateUtils.js';
import { dropBlankDoseRows } from '../logic/doseIdentity.js';

export default function Results({ state, onReset, onChange, onBack, today }) {
  const { ageMonths, dob, riskIds, pcvDoses, ppsv23Doses } = state;
  // queue P1-1 / P3-7 (S10): one clock read, threaded from App — see StepHistory.
  const maxDate = todayISO(today);
  const [editingAge, setEditingAge] = useState(false);
  const [editingDoses, setEditingDoses] = useState(false);

  // S11 / P5-5 (2026-10-12): Escape closes whichever panel is open. Both
  // panels could be opened and neither could be closed from the keyboard
  // without tabbing back to the toggle that opened it; Escape is what people
  // press.
  //
  // The dose panel goes first — it is the more specific, more nested edit
  // surface. It closes through `closeDosePanel`, the same function the toggle
  // calls, so Escape cannot take a different path from the mouse and leave the
  // never-typed rows behind that closing by mouse sweeps away.
  //
  // `pcvDoses` / `ppsv23Doses` are dependencies because `closeDosePanel` reads
  // them: without that, the listener would close over the dose list as it was
  // before the clinician's most recent edit.
  //
  // It sits HERE, above the `if (excluded)` early return below, because a hook
  // has to run on every render. Placed after that return it would be skipped
  // for an excluded patient and React would throw "rendered fewer hooks than
  // expected". `closeDosePanel` is a hoisted function declaration, so calling
  // it from above its definition is fine.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== 'Escape') return;
      if (editingDoses) closeDosePanel();
      else if (editingAge) setEditingAge(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [editingAge, editingDoses, pcvDoses, ppsv23Doses]);

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

  const { recs, pcv21Geo, excluded, exclusionMessage, exclusionCitations } = result;

  if (excluded) {
    // Decision 3 of the 2026-10-16 hard-stop plan: typed doses stay in memory
    // (going back a step still shows them) but are not evaluated, and the
    // screen says so in one line. Conditional, deliberately — a CAR-T patient
    // skips the history step entirely, so saying it unconditionally would
    // report on doses nobody was ever asked for.
    const hasRecordedDoses =
      dropBlankDoseRows(pcvDoses).length > 0 || dropBlankDoseRows(ppsv23Doses).length > 0;
    return (
      <div>
        <div className="advisory-banner advisory-banner-exclude" data-testid="exclusion-stop">
          <div className="advisory-banner-title">Individualized revaccination schedule required</div>
          <div className="advisory-note">{exclusionMessage}</div>
          {hasRecordedDoses && (
            <div className="advisory-banner-flag" data-testid="exclusion-doses-kept">
              Recorded doses are kept but not evaluated here.
            </div>
          )}
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
            <button type="button" className="btn btn-outline" onClick={onBack}>Edit risk factors</button>
          )}
          <button type="button" className="btn btn-outline" onClick={onReset}>Start Over</button>
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
  {
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

  // P1-3 (2026-10-12): what the "Recorded doses (N)" button counts. Rows the
  // clinician has not typed in are not doses, and the engine does not count
  // them, so the button must not either — a button reading "(1)" above a card
  // showing no doses is the app contradicting itself.
  const recordedDoseCount =
    dropBlankDoseRows(pcvDoses).length + dropBlankDoseRows(ppsv23Doses).length;

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


  // S9 / P4-1 (2026-10-15): the rows below are `DoseEditor.jsx`, shared with
  // the wizard's History step. This panel used to hand-write them, and so did
  // StepHistory — two copies, which is how `S6-2`, `P1-3` and `S11` each had
  // to be fixed twice, and how this panel came to render Product before Date
  // while the wizard rendered Date before Product. `onChange` here sends a
  // patch to the app's state; the wizard has a setter per stream. The editor
  // knows about neither: it hands back the whole next list.
  const doseEditorShared = {
    ageMonths,
    today,
    dob,
    listClassName: 'dose-list-compact',
    unknownHint: 'An empty row is removed when you close this panel.',
  };

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
              <DoseEditor
                {...doseEditorShared}
                doses={pcvDoses}
                onChange={(next) => onChange?.({ pcvDoses: next })}
                product={{ kind: 'select', options: PCV_HISTORY_PRODUCTS }}
                addDoseLabel="+ Add PCV dose"
                removeLabel={(i) => `Remove PCV dose ${i + 1}`}
                emptyMessage="No PCV doses recorded."
              />
            </div>

            {/* PPSV23 doses */}
            <div className="dose-history-block">
              <div className="history-edit-section-title">PPSV23 (Pneumovax 23) doses</div>
              <DoseEditor
                {...doseEditorShared}
                doses={ppsv23Doses}
                onChange={(next) => onChange?.({ ppsv23Doses: next })}
                product={{ kind: 'fixed', key: PPSV23_PRODUCT.key, label: PPSV23_PRODUCT.label }}
                addDoseLabel="+ Add PPSV23 dose"
                removeLabel={(i) => `Remove PPSV23 dose ${i + 1}`}
                emptyMessage="No PPSV23 doses recorded."
              />
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

      {/* Standard recommendations. One arm only since 2026-10-16: the
          transplant tick used to fold these into a collapsed "reference"
          <details> beneath its advisory banner, and now it never reaches this
          line at all — those patients return at the hard stop above. */}
      <div className="rec-section">
        <div className="rec-section-title">Recommendation</div>
        {buildCards(recs)}
      </div>

      <Disclaimer />

      <div className="results-actions">
        {onBack && (
          <button type="button" className="btn btn-outline" onClick={onBack}>Edit history</button>
        )}
        <button type="button" className="btn btn-outline" onClick={onReset}>Start Over</button>
      </div>
    </div>
  );
}
