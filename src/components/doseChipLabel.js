// What the chip on a recorded dose says — written down once.
//
// This is display wording, not clinical logic: every input here has already
// been decided by validate.js (`analyzeHistory`). Nothing in this file may
// compute a rule. It chooses words for a verdict already made.
//
// S14-1: extracted out of RecCard.jsx's DoseValidation, which computed the
// label and the chip's CSS class inline. Mirrors the shape of MeningoVax's
// own doseChipLabel.js (the sibling app already paid to learn that a second,
// hand-typed copy of this wording drifts from the first) — this file is the
// guard against that happening here, see
// __tests__/regression-chip-label-one-copy.test.js.
//
// The order of the branches below is load-bearing: a dose can be more than
// one thing at once (e.g. recorded against an already-complete series AND
// given too close to the prior dose), and the branch that fires first is the
// one the chip shows.
import { doseDisposition } from '../logic/doseDisposition.js';

/**
 * The chip text for one recorded PCV/PPSV23 dose.
 *
 * @param {object|null} result      one entry of `analyzeHistory().perDose`
 * @param {number|null} [seriesTotal] the total this patient's series runs
 *   to, when the card tracks one. Timing (on-time vs. given sooner than CDC
 *   advises) is NOT part of this word — S14-2 (2026-10-11, owner decision):
 *   it lives in the dose's reasons/explanation text instead, so the chip can
 *   say what MeningoVax's already says for a counted dose.
 * @returns {string|null} the label, or null when there is nothing to show
 */
export function doseChipLabel(result, seriesTotal) {
  if (!result) return null;
  const { effectiveDoseNum } = result;
  // OWNER DECISION 2026-11-08 (§DOSE-LABELS): one label per dose, from a
  // closed list. The engine stamps `disposition`; a result built without it
  // (a test calling `analyzeHistory` directly) is named the same way.
  const disposition = result.disposition ?? doseDisposition(result);
  // A baby still in the PCV series needs the dose number on every counted
  // dose, because the total depends on age at the first dose.
  const ofTotal = seriesTotal != null && effectiveDoseNum != null && effectiveDoseNum <= seriesTotal
    ? ` (dose ${effectiveDoseNum} of ${seriesTotal})` : '';
  switch (disposition) {
    case 'counted':
      if (seriesTotal == null) return `Dose ${effectiveDoseNum}`;
      if (effectiveDoseNum <= seriesTotal) return `Dose ${effectiveDoseNum} of ${seriesTotal}`;
      // Defensive floor, mirroring MeningoVax's own: never print a dose
      // number greater than the total.
      return 'Booster';
    case 'counted-early': return `Counted — given early, accepted${ofTotal}`;
    case 'counted-not-needed': return 'Counted — not needed. No more PPSV23.';
    case 'counted-product-unknown': return `Counted — product not recorded${ofTotal}`;
    case 'counted-date-unknown': return `Counted — date not recorded${ofTotal}`;
    // Her wording, 2026-11-08, replacing "Extra dose — more than this series needs".
    case 'extra': return 'Not counted — Extra. Do not repeat.';
    // The DATE stays on the result card (owner ruling 2026-10-24: the chip
    // never states the due date — only the card knows the routine date).
    case 'repeat': return 'Not counted — repeat';
    case 'no-repeat': return 'Not counted — do not repeat';
    // OWNER DECISION 2026-10-31: PCV7 "should say not counted". It is set
    // aside, and the card says what is owed; "do not repeat" would read as
    // "no more PCV", which is wrong for a patient treated as PCV-naive.
    case 'pcv7': return 'Not counted — PCV7';
    // An extra dose with no date ASKS rather than asserts (G6, MeningoVax
    // 2026-09-16): it may be a series dose whose date is missing.
    case 'check-date': return result.extraDoseUnverified ? 'Check the date — none recorded' : 'Check the date';
    default: return 'Unknown';
  }
}

/** The chip's CSS class, which follows the same verdict. */
export function doseChipClass(result) {
  switch (result.disposition ?? doseDisposition(result)) {
    case 'counted': case 'counted-early': case 'counted-not-needed':
    case 'counted-product-unknown': case 'counted-date-unknown':
      return 'dose-val-chip dose-val-valid';
    // Set aside for a reason that is not an error: MeningoVax's "off-window" blue.
    case 'extra': case 'pcv7': return 'dose-val-chip dose-val-offwindow';
    case 'repeat': case 'no-repeat': return 'dose-val-chip dose-val-invalid';
    default: return 'dose-val-chip dose-val-unknown';
  }
}
