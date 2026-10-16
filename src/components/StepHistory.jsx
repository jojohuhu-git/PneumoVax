import { PPSV23_PRODUCT, PCV_HISTORY_PRODUCTS } from '../data/brands.js';
import DoseEditor from './DoseEditor.jsx';

// Vaccination history for PneumoVax — two product streams in one step:
//   • PCV doses (product dropdown: PCV7/13/15/20/21 + Unknown)
//   • PPSV23 doses (date only)
// Each dose is { date?, product? }. Both optional; counting works without dates.
//
// S9 / P4-1 (2026-10-15): the rows themselves are `DoseEditor.jsx`, shared with
// the inline editor on the Results page. This step used to hand-write them, and
// so did `Results.jsx`, which is how three separate fixes (`S6-2`, `P1-3`,
// `S11`) each had to be made twice and how the two copies came to render their
// fields in different orders. What is left here is what genuinely belongs to
// this step: the headings, the wording, and the yes/no question.
// S9 also dropped the `pcvProducts` prop. The catalogue used to reach this
// step as a prop from App.jsx while `Results.jsx` imported it directly — the
// same list arriving two different ways on the two surfaces, and each copy
// then applying its own age filter. Both now ask `brands.js` the one question
// ("which PCV products may a patient of this age have recorded?"), so neither
// the catalogue nor the gate can differ between the screens.
//
// P4-4 (2026-10-16): the step used to show both empty dose lists with a
// "No previous doses (clear all)" link beside them — so a clinician who left
// the step untouched looked identical to one who was asked and had nothing to
// add. There was no way to tell "no doses" from "not asked". Owner decision
// (2026-10-10), Option B: ONE yes/no question covers both streams —
// `historyAnswered` is lifted to App.jsx (it gates whether Next may advance,
// so App needs to read it) and is `null` (unanswered) / `false` (no previous
// doses) / `true` (yes, record doses). Answering "no" clears both lists, the
// same as the old clear-all link did. MeningoVax's `StepHistory.jsx` has the
// same toggle for a single vaccine; this mirrors it for two streams at once.
export default function StepHistory({
  ageMonths, pcvDoses, ppsv23Doses, onChangePcv, onChangePpsv,
  today, dob, historyAnswered = null, onAnswerChange = () => {},
}) {
  function handleNo() {
    onAnswerChange(false);
    onChangePcv([]);
    onChangePpsv([]);
  }

  function handleYes() {
    onAnswerChange(true);
  }

  const shared = { ageMonths, today, dob };

  return (
    <div className="step-card">
      <div className="step-title">Vaccination History</div>
      <div className="step-sub">Has the patient received any pneumococcal vaccine?</div>

      <div className="history-toggle">
        <button
          type="button"
          className={`history-toggle-btn${historyAnswered === false ? ' selected' : ''}`}
          onClick={handleNo}
        >
          No previous doses
        </button>
        <button
          type="button"
          className={`history-toggle-btn${historyAnswered === true ? ' selected' : ''}`}
          onClick={handleYes}
        >
          Yes, record doses
        </button>
      </div>

      {historyAnswered === true && (
        <>
          <div className="step-sub history-detail-sub">
            Date is optional (counting works without it). PCV7 is recorded but never
            counts toward the series.
          </div>

          {/* ── PCV stream ── */}
          <div className="history-section-title">PCV (conjugate) doses</div>
          <DoseEditor
            {...shared}
            doses={pcvDoses}
            onChange={onChangePcv}
            product={{ kind: 'select', options: PCV_HISTORY_PRODUCTS }}
            addDoseLabel="+ Add PCV dose"
            removeLabel={(i) => `Remove PCV dose ${i + 1}`}
            unknownHint="An empty row is removed when you continue."
          />

          {/* ── PPSV23 stream ── */}
          <div className="history-section-title history-section-title-spaced">PPSV23 (Pneumovax 23) doses</div>
          <DoseEditor
            {...shared}
            doses={ppsv23Doses}
            onChange={onChangePpsv}
            product={{ kind: 'fixed', key: PPSV23_PRODUCT.key, label: PPSV23_PRODUCT.label }}
            addDoseLabel="+ Add PPSV23 dose"
            removeLabel={(i) => `Remove PPSV23 dose ${i + 1}`}
            unknownHint="An empty row is removed when you continue."
          />
        </>
      )}

      {historyAnswered == null && (
        <div className="history-select-hint">Select yes or no above</div>
      )}

      <div className="family-note family-note-neutral">
        Unknown / undocumented history is treated as unvaccinated. PCV7 doses are recorded for
        completeness but ignored when calculating current needs (per ACIP/immunize.org).
      </div>
    </div>
  );
}
