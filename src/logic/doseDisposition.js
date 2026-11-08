// What the app concluded about ONE recorded dose, as one word from a closed list.
//
// OWNER DECISION 2026-11-08 (CLINICAL_SPEC.md §DOSE-LABELS): every recorded
// dose starts with exactly one of nine labels, so a clinician sees the answer
// first, whether the dose counted, whether it was needed, and whether to
// repeat it. Before this, a counted dose nobody needed (her test patient's
// second PPSV23 at 66, 28 days after the first) read "Dose 2", the same as an
// on-time dose.
//
// This file DECIDES NOTHING NEW. Every input below was already set by the
// engine (validate.js, recommend.js): it only names the verdict they reached.
// `doseChipLabel.js` turns the word into the words on the screen.
//
// The order is load-bearing: a dose can carry more than one flag (a mistimed
// PPSV23 in a healthy child is both `invalid` and `notNeeded`), and the first
// test that matches wins.

/** The closed list. A dose outside it is a bug, and the sweep test says so. */
export const DISPOSITIONS = Object.freeze([
  'counted',                  // on schedule; the chip shows the dose number, no line
  'counted-early',            // counted, given sooner than recommended
  'counted-not-needed',       // counted, but nothing called for it (L2)
  'counted-product-unknown',  // counted as a generic PCV: product not recorded
  'counted-date-unknown',     // counted, but no date was recorded to check it
  'extra',                    // given correctly, not needed, not counted
  'repeat',                   // not counted, and a replacement dose is owed
  'no-repeat',                // not counted, and this dose is not replaced
  'pcv7',                     // PCV7: set aside, the patient treated as PCV-naive
  'check-date',               // the date is missing or impossible
]);

/**
 * @param {object|null} v one entry of `perDose.pcv` / `perDose.ppsv23`
 * @returns {string|null} one of DISPOSITIONS
 */
export function doseDisposition(v) {
  if (!v) return null;
  // An impossible entry (dated in the future, before birth, or a duplicate),
  // or an extra dose with no date: nothing to grade until the date is fixed.
  if (v.recordProblem || v.extraDoseUnverified) return 'check-date';
  if (v.status === 'noncounting') return 'pcv7';
  if (v.extraDose) return 'extra';
  if (v.status === 'invalid') {
    // A later PPSV23 already replaced it (§C-P2-LATER, owner 2026-10-31: "It
    // was repeated on <date> — see that dose"). Her word is "repeated", so
    // the label agrees with the line, whatever the reason it was thrown out.
    // A healthy child never needed it, so a later one replaced nothing.
    if (v.notNeeded) return 'no-repeat';
    if (v.repeatedOn) return 'repeat';
    // A dose thrown out for TIMING is not repeated: the next dose in the
    // series is simply due once the interval has passed (W1, owner-approved
    // 2026-10-11). Nor is one whose card offers no further PPSV23 (§C-P2-NOTHIRD).
    if (v.notRepeated || v.intervalRuleId) return 'no-repeat';
    // Too young, or the wrong product for the age: the dose is missing, and
    // the card asks for its replacement.
    return 'repeat';
  }
  if (v.status === 'unknown') return v.undated ? 'counted-date-unknown' : 'counted-product-unknown';
  if (v.status === 'valid') {
    if (v.notNeeded) return 'counted-not-needed';
    if (v.earlyAdvisory) return 'counted-early';
    return 'counted';
  }
  return null;
}

/** Stamp the disposition onto every dose of a `perDose` list. */
export const withDisposition = (list) => (list ?? []).map((v) => ({ ...v, disposition: doseDisposition(v) }));
