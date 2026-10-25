// ─────────────────────────────────────────────────────────────────────────
// HowThisWasWorkedOut.jsx — the route this patient took, on the results page.
//
// C14 (2026-10-25). The companion to the "How recommendations are made"
// page: that one is the map, this one is the line drawn on it for the patient
// on screen.
//
// It RENDERS `result.path` and computes nothing. The engine records each step
// at the branch that took it (see `pathStep` in recommend.js); if this
// component worked the route out for itself it would be a second reading of
// the same question, which is the shape of the worst bug this repo has had.
//
// Abbreviated-with-an-expander, per the owner's card rules of 2026-10-25.
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';

export default function HowThisWasWorkedOut({ path }) {
  const [open, setOpen] = useState(false);
  if (!path || !path.length) return null;
  return (
    <div className="howpath">
      <button
        type="button"
        className="howpath-toggle"
        data-testid="howpath-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        How this was worked out
        <span className="howpath-mark" aria-hidden="true">{open ? '–' : '+'}</span>
      </button>
      {open && (
        <ol className="howpath-list" data-testid="howpath-list">
          {path.map((s, i) => (
            <li key={i} className="howpath-step">
              <span className="howpath-step-name">{s.step}</span>
              <span className="howpath-step-took">{s.took}</span>
              {s.because && <span className="howpath-step-why">{s.because}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
