import React from 'react';
import { fmtDate } from '../logic/format.js';

const STATUS_LABELS = {
  'due':              'Due',
  'catchup':          'Catch-up',
  'risk-based':       'Risk-Based',
  'shared-decision':  'Shared decision',
  'complete':         'Complete',
  'not-indicated':    'Not indicated',
  'deferred':         'Deferred',
};

export default function RecCard({ rec }) {
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
