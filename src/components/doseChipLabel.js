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
  const { status, effectiveDoseNum } = result;

  if (status === 'noncounting') return 'Recorded (does not count)';
  if (status === 'valid') {
    if (seriesTotal == null) return `Dose ${effectiveDoseNum}`;
    if (effectiveDoseNum <= seriesTotal) return `Dose ${effectiveDoseNum} of ${seriesTotal}`;
    // Defensive floor, mirroring MeningoVax's own: never print a dose number
    // greater than the total. Nothing in PneumoVax should reach this once
    // S14-4 gives a dose recorded past an already-complete series its own
    // "Extra dose" wording instead of a numbered slot.
    return 'Booster';
  }
  if (status === 'invalid') return 'Invalid';
  return 'Unknown';
}

/** The chip's CSS class, which follows the same verdict. */
export function doseChipClass(result) {
  const { status } = result;
  if (status === 'noncounting') return 'dose-val-chip dose-val-noncounting';
  if (status === 'valid') return 'dose-val-chip dose-val-valid';
  if (status === 'invalid') return 'dose-val-chip dose-val-invalid';
  return 'dose-val-chip dose-val-unknown';
}
