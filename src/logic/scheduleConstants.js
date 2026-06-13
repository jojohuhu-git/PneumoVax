// ─────────────────────────────────────────────────────────────────────────
// scheduleConstants.js — shared schedule-boundary constants for PneumoVax.
//
// PURPOSE: prevent the boundary-drift bug (H1) where the engine and UI each
// hardcoded the 18y boundary independently, sometimes as 216 (child) and
// sometimes as 228 (adult). Both meanings are clinically distinct:
//
//   ADULT_SCHED_MIN_M = 228 (19y)
//     The age at which the ADULT pneumococcal rulebook takes effect (CDC adult
//     schedule notes). Use for: engine dispatch (pcvAdult vs pcvRiskChild),
//     hsctAdvisory adult vs peds routing, validator adult-vs-peds routing,
//     format.js ageGroup, StepAge "Adult" chip, StepRisks adultOnly gate.
//
//   PCV21_MIN_AGE_M = 216 (18y)
//     The PRODUCT minimum age for PCV21 (Capvaxive). FDA label + ACIP vote
//     mm7336a3 set this at ≥18y, independently of the schedule boundary.
//     Use for: brands.js PCV21 minAgeM, validate.js child-invalid check,
//     StepHistory/Results PCV21 age gate.
//
// NOTE: this file is mirrored in MeningoVax (dateUtils.js / Stepper.jsx also
// contain duplicated utilities). Until a shared package is extracted, keep
// these constants in sync manually. See L2 in REVIEW_FINDINGS.md.
// ─────────────────────────────────────────────────────────────────────────

/** Schedule boundary: adult pneumococcal rulebook begins at 19y (228 months). */
export const ADULT_SCHED_MIN_M = 228;

/** PCV21 product minimum age: 18y (216 months). Independent of schedule boundary. */
export const PCV21_MIN_AGE_M = 216;
