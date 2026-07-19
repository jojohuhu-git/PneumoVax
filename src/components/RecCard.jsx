import React from 'react';
import { fmtDate, fmtAgeMonths } from '../logic/format.js';
import { ageAtDoseFromDate } from '../logic/validate.js';
import { productLabel } from '../data/brands.js';
import { todayISO } from '../logic/dateUtils.js';

const STATUS_LABELS = {
  'due':              'Due',
  'catchup':          'Catch-up',
  'risk-based':       'Risk-Based',
  'shared-decision':  'Shared decision',
  'complete':         'Complete',
  'not-indicated':    'Not indicated',
  'deferred':         'Deferred',
};

// One recorded past dose → "D1 · Jul 3, 2025 · age 11 years · PCV15 (Vaxneuvance)"
function describeDose(dose, idx, ageMonths, today) {
  const parts = [`D${idx + 1}`];
  parts.push(dose?.date ? fmtDate(dose.date) : 'date unknown');
  const ageAtDose = dose?.date ? ageAtDoseFromDate(dose, ageMonths, today) : null;
  parts.push(ageAtDose != null ? `age ${fmtAgeMonths(ageAtDose)}` : 'age unknown');
  parts.push(dose?.product ? productLabel(dose.product) : 'product unknown');
  return parts.join(' · ');
}

// Render a small status chip + reasons for a single recorded dose, reusing
// validate.js's analyzeHistory output (never recomputed here). PneumoVax adds
// a fourth status beyond MeningoVax's three — 'noncounting' — for PCV7,
// which was validly given but per ACIP/immunize.org never counts toward the
// series; it must not read as "Invalid".
function DoseValidation({ result }) {
  if (!result) return null;
  const { status, reasons, detail, effectiveDoseNum, doesNotCount } = result;

  const chipClass =
    status === 'valid' ? 'dose-val-chip dose-val-valid'
    : status === 'invalid' ? 'dose-val-chip dose-val-invalid'
    : status === 'noncounting' ? 'dose-val-chip dose-val-noncounting'
    : 'dose-val-chip dose-val-unknown';

  const chipLabel =
    status === 'valid' ? 'On time'
    : status === 'invalid' ? 'Invalid'
    : status === 'noncounting' ? 'Recorded (does not count)'
    : 'Unknown';

  const showReasons = reasons && reasons.length > 0;

  return (
    <div className={`dose-val${doesNotCount ? ' dose-val-dropped' : ''}`}>
      <span className={chipClass}>{chipLabel}</span>
      {effectiveDoseNum != null && status !== 'invalid' && (
        <span className="dose-val-effective">Effective dose {effectiveDoseNum}</span>
      )}
      {showReasons && (
        <div className="dose-val-reasons">
          {reasons.map((r, i) => (
            <span key={i} className="dose-val-reason">{r}</span>
          ))}
          {detail && <span className="dose-val-detail">{detail}</span>}
        </div>
      )}
    </div>
  );
}

// A list of recorded doses with validity chips, labeled by `label`.
function DoseHistoryList({ label, doses, doseValidations, ageMonths }) {
  if (!doses || doses.length === 0) return null;
  return (
    <div className="rec-progress" data-testid="rec-progress">
      <span className="rec-progress-label">{label}</span>
      <ul className="rec-progress-list">
        {doses.map((d, i) => (
          <li key={i} className="rec-progress-dose-row">
            <span className="rec-progress-dose-text">{describeDose(d, i, ageMonths, todayISO())}</span>
            <DoseValidation result={doseValidations[i]} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RecCard({ rec, doses = [], doseValidations = [], ageMonths = 0, otherHistory = null }) {
  const { vaccine, status, doseLabel, dueToday, earliestNextDate, brands, note, citations, advisory } = rec;
  const isNeutral = status === 'complete' || status === 'not-indicated' || status === 'deferred';
  const isShared = status === 'shared-decision';

  return (
    <div className={`rec-card status-${status}`} data-testid="rec-card">
      <div className="rec-card-inner">
        <div className="rec-card-head">
          <span className="rec-vaccine-name">{vaccine}</span>
          <span className={`status-badge ${status}`}>{STATUS_LABELS[status] || status}</span>
          {dueToday && !isNeutral && !advisory && (
            <span className={`due-pill${isShared ? ' due-pill-optional' : ''}`}>
              {isShared ? 'Optional today' : 'Today'}
            </span>
          )}
          {advisory && <span className="due-pill due-pill-advisory">Advisory</span>}
        </div>

        <div className="rec-dose-label">{doseLabel}</div>

        {!dueToday && earliestNextDate && !advisory && (
          <div className="next-date">Eligible {fmtDate(earliestNextDate)}</div>
        )}

        {brands && brands.length > 0 && !isNeutral && (
          <div className="rec-brands">
            <div className="rec-brands-title">
              {brands.length > 1 ? 'Product options — choose one' : 'Product'}
            </div>
            {brands.map((b, i) => (
              <div key={i} className="rec-brand-item">
                <span className="rec-brand-dot" />{b}
              </div>
            ))}
          </div>
        )}

        <DoseHistoryList label="Recorded:" doses={doses} doseValidations={doseValidations} ageMonths={ageMonths} />

        {otherHistory && (
          <DoseHistoryList
            label={`${otherHistory.label} history:`}
            doses={otherHistory.doses}
            doseValidations={otherHistory.doseValidations}
            ageMonths={ageMonths}
          />
        )}

        {note && <div className="rec-note">{note}</div>}

        {citations && citations.length > 0 && (
          <div className="rec-citations">
            {citations.map((c, i) => (
              <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                className="citation-chip" title={c.label}>
                {c.short || c.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
