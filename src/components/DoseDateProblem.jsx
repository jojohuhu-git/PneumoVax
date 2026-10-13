import { dateEntryWarning } from '../logic/validate.js';
import React from 'react';

/**
 * An impossible dose date, said under the row as it is typed.
 *
 * Owner decision, 2026-10-12: WARN, do not trap. Typing 05/01/2030 into a dose
 * row used to show nothing at all — no warning, "View Results" fully enabled —
 * while the AGE step already stopped you dead on the identical slip ("That date
 * of birth is in the future. Check the year"). The two date fields disagreed
 * about the same mistake. The step now says so immediately, the results card
 * keeps its fuller explanation, and nothing is blocked: a clinician who means
 * it can still see the rest of the record.
 *
 * ── Why this is its own file ─────────────────────────────────────────────
 *
 * The dose editor exists TWICE — `StepHistory.jsx` and the inline editor in
 * `Results.jsx` (the open `S9` / `P4-1` finding). A warning hand-written into
 * one of them is a warning the other surface silently lacks, which is the
 * single-surface fix CLAUDE.md forbids. One component, used by both.
 *
 * ── Why the decision is not made here ────────────────────────────────────
 *
 * It isn't: `dateEntryWarning` lives in validate.js and calls the very same
 * `futureDated` and `isBeforeBirth` predicates the engine grades with. A
 * component that decided for itself what an impossible entry IS would be the
 * second copy of a rule, which is how a date before birth once got blamed on
 * PCV21's licence. `regression-history-step-warns-on-impossible-dates` asserts
 * that the kind shown here equals the `recordProblem` the engine reports for
 * the same row.
 *
 * Renders nothing when the row is fine, including an undated row.
 */
export default function DoseDateProblem({ dose, ageMonths, today, dob }) {
  const warning = dateEntryWarning(dose, { ageMonths, today, dob });
  if (!warning) return null;
  return (
    <div className="dose-row-date-problem" role="status" data-problem={warning.kind}>
      {warning.text}
    </div>
  );
}
