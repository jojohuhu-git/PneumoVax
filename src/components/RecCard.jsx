import React, { useState } from 'react';
import { fmtDate, fmtAgeMonths } from '../logic/format.js';
import { ageAtDoseFromDate } from '../logic/validate.js';
import { productLabel } from '../data/brands.js';
import { todayISO, daysBetween } from '../logic/dateUtils.js';
import { Chevron } from './icons.jsx';
// P6-3: numbered inline citations, shared with RiskAgeNote.
import { renderNoteWithCites, cardCiteNumberer } from './citations.jsx';
// S14-1: the chip's wording and CSS class live in one module — see its header.
import { doseChipLabel, doseChipClass } from './doseChipLabel.js';

const STATUS_LABELS = {
  'due':              'Due',
  'catchup':          'Catch-up',
  'risk-based':       'Risk-Based',
  'shared-decision':  'Optional (shared decision)',
  'complete':         'Complete',
  'not-indicated':    'Not indicated',
  'deferred':         'Deferred',
};

// One recorded past dose → "D1 · Jul 3, 2025 · age 11 years · PCV15 (Vaxneuvance)"
function describeDose(dose, idx, ageMonths, today, dob) {
  const parts = [`D${idx + 1}`];
  parts.push(dose?.date ? fmtDate(dose.date) : 'date unknown');
  // P3-1/P3-3 (S10): with a date of birth on file this is measured from the
  // birthday, so the age printed here is the same number the validator graded
  // the dose against. Previously the card and the validator each subtracted
  // their own approximation and could disagree by half a month.
  const ageAtDose = dose?.date ? ageAtDoseFromDate(dose, ageMonths, today, dob) : null;
  // P3-5: this is the line the 42-day PCV dose lands on. With a date of birth
  // and a dose date we know the real day count, so the weeks are counted
  // rather than derived from an averaged month — a dose at exactly 42 days
  // read "5 weeks" for 181 of 400 birth dates, beside PCV's 6-week minimum.
  const daysAtDose = dob && dose?.date ? daysBetween(dob, dose.date) : undefined;
  parts.push(
    ageAtDose != null
      ? `age ${fmtAgeMonths(ageAtDose, { exactDays: daysAtDose })}`
      : 'age unknown',
  );
  parts.push(dose?.product ? productLabel(dose.product) : 'product unknown');
  return parts.join(' · ');
}

// Render a small status chip + reasons for a single recorded dose, reusing
// validate.js's analyzeHistory output (never recomputed here). PneumoVax adds
// a fourth status beyond MeningoVax's three — 'noncounting' — for PCV7,
// which was validly given but per ACIP/immunize.org never counts toward the
// series; it must not read as "Invalid".
function DoseValidation({ result, seriesTotal, numberFor }) {
  if (!result) return null;
  const { status, reasons, detail, reasonCites, effectiveDoseNum, doesNotCount } = result;

  const chipClass = doseChipClass(result);
  const chipLabel = doseChipLabel(result);

  const showReasons = reasons && reasons.length > 0;

  return (
    <div className={`dose-val${doesNotCount ? ' dose-val-dropped' : ''}`}>
      <span className={chipClass}>{chipLabel}</span>
      {effectiveDoseNum != null && status !== 'invalid' && (
        <span className="dose-val-effective">
          {seriesTotal != null ? `Dose ${effectiveDoseNum} of ${seriesTotal}` : `Dose ${effectiveDoseNum}`}
        </span>
      )}
      {showReasons && (
        <div className="dose-val-reasons">
          {/* P6-3: `reasonCites` is one entry per "[c]" across the whole
              reasons array, in order (validate.js). Each reason takes the
              slice matching its own marker count, so reasons the walk appends
              afterwards — which carry no marker — never disturb the pairing. */}
          {(() => {
            let consumed = 0;
            return reasons.map((r, i) => {
              const markers = String(r).split('[c]').length - 1;
              const cites = markers > 0 ? (reasonCites ?? []).slice(consumed, consumed + markers) : null;
              consumed += markers;
              return (
                <span key={i} className="dose-val-reason">
                  {cites && cites.length ? renderNoteWithCites(r, cites, numberFor) : r}
                </span>
              );
            });
          })()}
          {detail && <span className="dose-val-detail">{detail}</span>}
        </div>
      )}
    </div>
  );
}

// Interleave "Primary series" / "Boosters" headings into a recorded-dose list
// (owner decision 2026-09-15, option A). Ported verbatim in behaviour from
// MeningoVax's RecCard so the two apps group doses identically — the newer
// single-vaccine apps share one design system.
//
// A dose that does NOT count (PCV7, an invalid dose) has no effective dose
// number, so it cannot name its own phase. It stays in DATE order inside
// whichever group is open rather than being moved to the bottom: a PCV7 given
// at 2 months belongs where it happened in the record, so the list still lines
// up against the chart.
//
// primaryTotal == null means this card's total counts a different set of doses
// than the list shows (the at-risk >=24-month catch-up card, the adult option
// cards) — then no headings are drawn at all.
export function doseRowsWithGroups(doses, doseValidations, primaryTotal) {
  const rows = [];
  let openGroup = null;
  doses.forEach((d, i) => {
    const n = doseValidations?.[i]?.effectiveDoseNum;
    if (primaryTotal != null && n != null) {
      const phase = n <= primaryTotal ? 'primary' : 'booster';
      if (phase !== openGroup) {
        rows.push({ kind: 'group', phase, label: phase === 'primary' ? 'Primary series' : 'Boosters' });
        openGroup = phase;
      }
    }
    rows.push({ kind: 'dose', dose: d, index: i });
  });
  return rows;
}

// A list of recorded doses with validity chips, labeled by `label`.
function DoseHistoryList({ label, doses, doseValidations, ageMonths, dob = null, today = null, seriesTotal = null, primaryTotal = null, numberFor }) {
  if (!doses || doses.length === 0) return null;
  return (
    <div className="rec-progress" data-testid="rec-progress">
      <span className="rec-progress-label">{label}</span>
      <ul className="rec-progress-list">
        {doseRowsWithGroups(doses, doseValidations, primaryTotal).map((row) => (
          row.kind === 'group' ? (
            <li key={`group-${row.phase}`} className="rec-progress-group" data-testid={`dose-group-${row.phase}`}>
              {row.label}
            </li>
          ) : (
            <li key={row.index} className="rec-progress-dose-row">
              <span className="rec-progress-dose-text">{describeDose(row.dose, row.index, ageMonths, todayISO(today), dob)}</span>
              <DoseValidation result={doseValidations[row.index]} seriesTotal={seriesTotal} numberFor={numberFor} />
            </li>
          )
        ))}
      </ul>
    </div>
  );
}

// P6-4 (S13, 2026-10-10): the note is `{ lead, detail }` — `lead` is what to
// do for THIS patient, `detail` sits behind a "Why this" disclosure.
//
// Measured before the change, across the 31 distinct notes the engine can
// produce: median 188 characters, longest 459, 15 of 31 over 200. That is an
// ACIP schedule row recited to a reader who needed one line.
//
// `noteCites` stays ONE ordered list across both halves (the contract rec()
// documents): the lead's "[c]" markers consume the first entries and the
// detail's take the rest. Both halves share the card's `numberFor`, so a
// source keeps the same number whether the disclosure is open or shut — and a
// source quoted in both halves shows one number, not two.
//
// A note with no `detail` renders no toggle: most short notes stay one line.
// A plain string note is treated as all lead, so an unsplit note still works.
function RecNote({ note, noteCites, numberFor }) {
  const [open, setOpen] = useState(false);
  if (!note) return null;
  const lead = typeof note === 'string' ? note : note.lead;
  const detail = typeof note === 'string' ? null : note.detail;
  if (!lead && !detail) return null;

  const leadCiteCount = String(lead ?? '').split('[c]').length - 1;
  const cites = noteCites ?? [];

  return (
    <div className="rec-note">
      <div className="rec-note-lead">
        {renderNoteWithCites(lead, cites.slice(0, leadCiteCount), numberFor)}
      </div>
      {detail && (
        <>
          <button
            type="button"
            className="rec-note-toggle"
            data-testid="rec-note-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            Why this<Chevron open={open} />
          </button>
          {open && (
            <div className="rec-note-detail">
              {renderNoteWithCites(detail, cites.slice(leadCiteCount), numberFor)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// PD2/D9: the card head is a full-width bar tinted by TIMING only — is this
// due today, does it need catch-up, or is it a shared (optional) decision, or
// neither urgent right now. The body below stays plain white. The clinical
// REASON (routine, risk-based, shared-decision, etc.) is a small colored text
// label in the bar (status-badge) — no pill background, no card fill of its
// own. Mirrors MeningoVax's rec-card-head pattern.
function timingClass(status, dueToday) {
  if (status === 'shared-decision') return 'timing-shared';
  if (status === 'catchup') return 'timing-catchup';
  if (dueToday) return 'timing-due';
  return 'timing-neutral';
}

export default function RecCard({ rec, doses = [], doseValidations = [], ageMonths = 0, dob = null, today = null, otherHistory = null }) {
  const { vaccine, status, doseLabel, seriesTotal, primaryTotal, dueToday, earliestNextDate, brands, note, noteCites, citations, advisory } = rec;
  // P6-3: one numbering sequence for the whole card, seeded in reading order.
  const numberFor = cardCiteNumberer(doseValidations, otherHistory?.doseValidations, noteCites);
  const isNeutral = status === 'complete' || status === 'not-indicated' || status === 'deferred';
  const isShared = status === 'shared-decision';
  // PD2/D5: neutral cards (nothing to do) collapse to a compact row so due
  // items visually dominate the screen.
  const [expanded, setExpanded] = useState(!isNeutral);

  return (
    <div
      className={`rec-card ${timingClass(status, dueToday)}${isNeutral && !expanded ? ' rec-card-collapsed' : ''}`}
      data-testid="rec-card"
    >
      {isNeutral ? (
        <button
          type="button"
          className="rec-card-head rec-card-head-toggle"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
        >
          <span className="rec-vaccine-name">{vaccine}</span>
          {!expanded && <span className="rec-card-collapsed-reason">{doseLabel}</span>}
          <span className="rec-card-head-trailing">
            <span className={`status-badge ${status}`}>{STATUS_LABELS[status] || status}</span>
            <Chevron open={expanded} />
          </span>
        </button>
      ) : (
        <div className="rec-card-head">
          <span className="rec-vaccine-name">{vaccine}</span>
          <span className="rec-card-head-trailing">
            <span className={`status-badge ${status}`}>{STATUS_LABELS[status] || status}</span>
            {dueToday && !advisory && (
              <span className={`due-pill${isShared ? ' due-pill-optional' : ''}`}>
                {isShared ? 'Optional today' : 'Today'}
              </span>
            )}
            {advisory && <span className="due-pill due-pill-advisory">Advisory</span>}
          </span>
        </div>
      )}

      {expanded && (
      <div className="rec-card-inner">
        <div className="rec-dose-label">{doseLabel}</div>

        {!dueToday && earliestNextDate && !advisory && (
          <div className="next-date">Not yet due — eligible {fmtDate(earliestNextDate)}</div>
        )}

        {brands && brands.length > 0 && !isNeutral && (
          <div className="rec-brands">
            <div className="rec-brands-title">
              {brands.length > 1 ? 'Product options (choose one)' : 'Product'}
            </div>
            {brands.map((b, i) => (
              <div key={i} className="rec-brand-item">
                <span className="rec-brand-dot" />{b}
              </div>
            ))}
          </div>
        )}

        <DoseHistoryList
          label="Recorded:"
          doses={doses}
          doseValidations={doseValidations}
          ageMonths={ageMonths}
          dob={dob}
          today={today}
          seriesTotal={seriesTotal}
          primaryTotal={primaryTotal}
          numberFor={numberFor}
        />

        {otherHistory && (
          <DoseHistoryList
            label={`${otherHistory.label} history:`}
            doses={otherHistory.doses}
            doseValidations={otherHistory.doseValidations}
            ageMonths={ageMonths}
            dob={dob}
            today={today}
            numberFor={numberFor}
          />
        )}

        <RecNote note={note} noteCites={noteCites} numberFor={numberFor} />

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
      )}
    </div>
  );
}
