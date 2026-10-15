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
//   ROUTINE_ADULT_MIN_M = 600 (50y)
//     The age at which pneumococcal vaccination becomes ROUTINE for every
//     adult, whatever their risk factors. A third distinct concept: not a
//     rulebook boundary and not a product floor, but the start of age-based
//     (rather than risk-based) eligibility. ACIP lowered it from 65 to 50
//     effective 2024-10-23 (mm7401a1; CDC adult schedule notes) — it has
//     already moved once, which is exactly why it needs one home.
//     Use for: recommend.js M.y50, format.js ageGroup.
//     Added by S6-1 (2026-10-13); see CLINICAL_SPEC.md §H.
//
// NOTE: this file is mirrored in MeningoVax (dateUtils.js / Stepper.jsx also
// contain duplicated utilities). Until a shared package is extracted, keep
// these constants in sync manually. See L2 in REVIEW_FINDINGS.md.
// ─────────────────────────────────────────────────────────────────────────

/** Schedule boundary: adult pneumococcal rulebook begins at 19y (228 months). */
export const ADULT_SCHED_MIN_M = 228;

/** PCV21 product minimum age: 18y (216 months). Independent of schedule boundary. */
export const PCV21_MIN_AGE_M = 216;

/** Routine (age-based) adult vaccination begins at 50y (600 months) — mm7401a1. */
export const ROUTINE_ADULT_MIN_M = 600;
