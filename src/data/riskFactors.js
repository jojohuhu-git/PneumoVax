// ─────────────────────────────────────────────────────────────────────────
// RISK FACTORS — pneumococcal indication catalog.
//
// `group` is DISPLAY ONLY (which StepRisks.jsx section a checkbox renders
// under) and is separate from `class` (the clinical logic engine reads).
//
// The transplant tick and the CAR-T/B-cell tick used to be two checkboxes,
// both displaying under "Immunocompromising conditions" (owner decision,
// 2026-09-13). They are ONE row since 2026-10-16: `hct_cart_bcell_exclude`,
// carrying `exclude: true`. `exclude` is the ONE flag — it drives `hasExclusion()`, the
// engine's hard stop and the red checkbox styling alike. Until 2026-10-16 the
// engine tested `class === 'exclude'` while the styling tested `exclude: true`:
// two flags for one idea, and a row could have carried one without the other.
// See docs/archive/plan-2026-10-16-transplant-hard-stop-both-apps.md.
//
// ── What the class decides about the adult interval, and what AGE decides ──
//
// This header stated, until 2026-10-15, that the adult PCV15→PPSV23 interval
// is keyed on the risk class alone — "IC adult interval = ≥8 weeks; non-IC
// chronic adult interval = ≥1 year", with no age term. That was wrong twice
// over: it was the rule A-P1-1 amended on 2026-10-10, and it had survived
// here, in the very file that owns the two constants, two hundred lines above
// their explanation. It was the fifth stale copy found; S8 fixed four others.
//
// What is true since S15 (OWNER DECISION 2026-10-16), in three parts that must
// not be run together (CLAUDE.md: "Recommendation and floor are different
// questions; do not let one answer stand in for the other"):
//
//   • The RECOMMENDATION takes BOTH the age band and the class —
//     `adultPpsvRecommendedInterval()` below is its only home. ≥8 weeks for a
//     19–49 adult with an immunocompromising condition, cochlear implant or
//     CSF leak; ≥1 year for every other adult, at either age band.
//   • The 8-week OPTION is still NAMED, but only where ACIP names it: at 50+
//     for that same class — `adultPpsvShorterMinimumOffered()`. At 19–49 it is
//     no longer an option, it is the advice, so the sentence is dropped there.
//   • The VALIDITY FLOOR, for a dose already given, is keyed on the class with
//     NO age term: 8 weeks for IC / cochlear implant / CSF leak, the year for
//     every other adult. Added by S14-7 (2026-10-11) and UNCHANGED by S15 —
//     the owner reconfirmed it on 2026-10-16. Every adult floor is an OWNER
//     CLINICAL DETERMINATION of 2026-10-11 — never cite ACIP or CDC for one.
//     Lives in logic/doseIntervalRules.js; see CLINICAL_SPEC.md §K.
//
// So what the class below decides, on the adult pathway, is one half of the
// recommended interval (age is the other half), whether the 8-week option gets
// NAMED, which floor applies, and which 19–49 prior-vaccine row the patient is
// on.
//
// S15 imports ROUTINE_ADULT_MIN_M rather than writing 600 here, so the age the
// interval turns on is the SAME 50 that routine eligibility uses — one home,
// per CLAUDE.md's "Three Schedule Constants" rule. scheduleConstants.js
// imports nothing, so there is no cycle.
//
// Each entry declares its risk class:
//   class: 'IC'  — immunocompromising. Gets the 8-week option named and the
//                  8-week validity floor; on the 19–49 PCV13+PPSV23 row it
//                  means PCV20/21 ≥5 years rather than "review at 50". Peds
//                  uses the IC catch-up rows of p2016 Table 4, which add a
//                  5-year-later PCV20 / 2nd-PPSV23 step.
//   class: 'nonIC' — non-immunocompromising chronic condition. No shorter
//                  option named, the 1-year floor, and "review at 50" on the
//                  19–49 PCV13+PPSV23 row.
//   class: 'special' — cochlear implant / CSF leak: treated as IC for all
//                  three adult questions above (CDC adult notes), but listed
//                  under non-IC in p2016 Table 3, so modelled as nonIC for the
//                  peds catch-up ROW.
//   (A row with `exclude: true` has NO class — it stops the engine before any
//    of the questions above is asked. See the transplant / CAR-T row.)
//
// Sources (CLINICAL_SPEC §C, §J, §K): p2016 Table 3, mm7401a1 + the CDC adult
// Timing Job Aid for every adult interval, CDC adult notes for the rest.
//   • Adult PCV15→PPSV23 RECOMMENDATION = ≥8 weeks at 19–49 for IC / cochlear
//     implant / CSF leak, ≥1 year for every other adult (S15, 2026-10-16).
//   • Cochlear implant + CSF leak are treated as IC for the adult questions.
//   • IC precedence over non-IC when both present.
// ─────────────────────────────────────────────────────────────────────────

import { ROUTINE_ADULT_MIN_M } from '../logic/scheduleConstants.js';

export const RISK_FACTORS = [
  // ── Immunocompromising (IC) ──────────────────────────────────────────
  {
    id: 'asplenia',
    label: 'Asplenia or splenic dysfunction / sickle cell disease',
    sublabel: 'congenital or acquired asplenia, sickle cell disease or other hemoglobinopathies',
    class: 'IC', group: 'IC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'immunodeficiency',
    label: 'Congenital or acquired immunodeficiency',
    class: 'IC', group: 'IC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'immunosuppression',
    label: 'Immunosuppressive drugs or radiation therapy',
    sublabel: 'incl. long-term systemic corticosteroids; generalized malignancy, leukemia, lymphoma, Hodgkin, multiple myeloma',
    class: 'IC', group: 'IC',
    refs: ['cdcAdultPneumo'],
  },
  {
    id: 'hiv',
    label: 'HIV infection',
    class: 'IC', group: 'IC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'solid_organ_transplant',
    label: 'Solid organ transplant',
    class: 'IC', group: 'IC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'ckd_advanced',
    label: 'Chronic kidney disease (dialysis or nephrotic syndrome)',
    sublabel: 'kidney disease on maintenance dialysis, or with nephrotic syndrome; chronic renal failure',
    class: 'IC', group: 'IC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },

  // ── The hard stop. ONE row (owner decision 2026-10-16, decision 1): these
  //    were two checkboxes until today, and from the moment the transplant
  //    tick stopped printing its own advisory the two said the same thing and
  //    did the same thing. Transplant is named FIRST because it is the common
  //    tick.
  //
  //    `exclude: true` is the single flag driving the engine's stop
  //    (`hasExclusion()`), the red checkbox styling, and App.jsx skipping the
  //    History step. Displays under Immunocompromising conditions.
  //
  //    MIRRORED: this row's id, label, sublabel and flag are byte-identical to
  //    MeningoVax's, frozen by
  //    regression-2026-10-16-transplant-stop-mirrors-meningovax.test.js. The
  //    id is MeningoVax's existing one; PneumoVax renamed onto it rather than
  //    the reverse, so MeningoVax's stored risk ids did not have to move. ──
  {
    id: 'hct_cart_bcell_exclude',
    label: 'Hematopoietic cell transplant (HCT/HSCT), CAR-T therapy, B-cell malignancy, or B-cell-depleting therapy',
    sublabel: 'this tool does not apply — needs an individualized, specialist-guided schedule',
    group: 'IC', exclude: true,
    refs: ['cdcAlteredImmunocompetence'],
  },

  // ── Cochlear implant / CSF leak (IC interval, non-IC peds row) ───────
  {
    id: 'cochlear_implant',
    label: 'Cochlear implant',
    sublabel: 'treated as immunocompromising for the adult PCV15→PPSV23 interval — ≥8 weeks at 19–49, ≥1 year at 50+ (mm7401a1)',
    class: 'special', group: 'special',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'csf_leak',
    label: 'Cerebrospinal fluid (CSF) leak',
    sublabel: 'treated as immunocompromising for the adult PCV15→PPSV23 interval — ≥8 weeks at 19–49, ≥1 year at 50+ (mm7401a1)',
    class: 'special', group: 'special',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },

  // ── Non-immunocompromising chronic conditions (non-IC) ──────────────
  {
    id: 'chronic_heart',
    label: 'Chronic heart disease',
    class: 'nonIC', group: 'nonIC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'chronic_lung',
    label: 'Chronic lung disease',
    sublabel: 'incl. moderate/severe persistent asthma (children); COPD/emphysema/asthma (adults)',
    class: 'nonIC', group: 'nonIC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'chronic_liver',
    label: 'Chronic liver disease',
    class: 'nonIC', group: 'nonIC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'diabetes',
    label: 'Diabetes mellitus',
    class: 'nonIC', group: 'nonIC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'ckd_chronic',
    label: 'Chronic kidney disease (not on dialysis / no nephrotic syndrome)',
    class: 'nonIC', group: 'nonIC',
    refs: ['cdcChildPneumo'],
  },
  {
    id: 'alcoholism',
    label: 'Alcohol use disorder',
    sublabel: 'adult risk condition',
    class: 'nonIC', group: 'nonIC',
    adultOnly: true,
    refs: ['cdcAdultPneumo'],
  },
  {
    id: 'smoking',
    label: 'Cigarette smoking',
    sublabel: 'adult risk condition',
    class: 'nonIC', group: 'nonIC',
    adultOnly: true,
    refs: ['cdcAdultPneumo'],
  },
];

export const RISK_BY_ID = Object.fromEntries(RISK_FACTORS.map((r) => [r.id, r]));

// Transplant / CAR-T therapy / B-cell malignancy / B-cell-depleting therapy
// selected? This hard-stops the whole engine — too heterogeneous for one safe
// recipe.
//
// It reads `r.exclude`, the same flag StepRisks.jsx styles the checkbox red
// from and the same test MeningoVax's copy uses. It tested `class ===
// 'exclude'` until 2026-10-16, which meant a row could carry the red styling
// without stopping the engine, or the reverse.
export function hasExclusion(riskIds = []) {
  return riskIds.some((id) => RISK_BY_ID[id]?.exclude === true);
}

// Any immunocompromising condition selected (true IC, NOT cochlear/CSF)?
export function hasIC(riskIds = []) {
  return riskIds.some((id) => RISK_BY_ID[id]?.class === 'IC');
}

// Any cochlear implant / CSF leak ("special": IC interval, non-IC peds row)?
export function hasSpecial(riskIds = []) {
  return riskIds.some((id) => RISK_BY_ID[id]?.class === 'special');
}

// Any non-IC chronic condition selected?
export function hasNonIC(riskIds = []) {
  return riskIds.some((id) => RISK_BY_ID[id]?.class === 'nonIC');
}

// Any risk condition at all that indicates pneumococcal vaccine? The
// hard-stop rows carry no class, so they cannot answer yes here — and the
// engine never gets this far for them anyway.
export function hasAnyRisk(riskIds = []) {
  return riskIds.some((id) => {
    const c = RISK_BY_ID[id]?.class;
    return c === 'IC' || c === 'nonIC' || c === 'special';
  });
}

// ── The PCV15→PPSV23 interval for ADULTS: age band AND risk class ────────
//
// OWNER DECISION 2026-10-16 (S15). The owner rejected the premise of
// plan-2026-10-15-adult-interval-risk-class-audit.md, which was built on ACIP
// **rr7203a1 (2023)**, and named two newer sources as governing. Both were
// read live on 2026-10-16:
//
//   • **mm7401a1** — ACIP, January 2025, the recommendation that lowered
//     routine adult PCV to ≥50. https://pmc.ncbi.nlm.nih.gov/articles/PMC11709131/
//   • CDC **Pneumococcal Vaccine Timing for Adults** job aid, NCIRD, March 2025.
//     https://www.cdc.gov/pneumococcal/downloads/Vaccine-Timing-Adults-JobAid.pdf
//
// **rr7203a1 is superseded. Never cite it for an adult interval again.**
//
// mm7401a1's clinical guidance table, verbatim. The VERB differs between the
// two age bands, and that difference IS the rule:
//
//   Adults aged ≥50 years / None or PCV7 only at any age:
//     "If PCV15 is administered, a single dose of PPSV23 SHOULD BE
//      ADMINISTERED ≥1 year after the PCV15 dose. A minimum interval of 8
//      weeks CAN BE CONSIDERED if PCV15 is used in adults with an
//      immunocompromising condition, cochlear implant, or CSF leak."
//
//   Adults aged 19–49 years with an immunocompromising condition, a CSF leak,
//   or a cochlear implant / None or PCV7 only at any age:
//     "If PCV15 is used, ADMINISTER a single dose of PPSV23 ≥8 weeks after the
//      PCV15 dose."
//
//   Adults aged 19–49 years with chronic medical conditions / None or PCV7:
//     "If PCV15 is administered, a single dose of PPSV23 should be
//      administered ≥1 year after the PCV15 dose."
//
// The job aid renders the same split: ≥8 weeks inline on p.2 (19–49
// immunocompromising) and p.3 (19–49 cochlear implant / CSF leak); ≥1 year on
// p.4 (19–49 chronic) and on p.1 (≥50), where the 8 weeks appears only as
// footnote †, "Consider minimum interval (8 weeks) for adults with an
// immunocompromising condition, cochlear implant, or cerebrospinal fluid leak".
//
// The owner was shown both readings — follow ACIP's wording, or flatten to 8
// weeks for the risk class at EVERY adult age — with the count of patients each
// would move, and chose the wording. **Do not extend the 8 weeks to 50+ without
// a new owner decision**: ACIP prints it as an option there, so the app would
// be stating as advice what its own citation offers as a choice.
//
// This also CORRECTS the paragraph A-P1-1 left here, which called the job
// aid's 19–49 "8 weeks" a "per-page simplification". It is not a
// simplification — it is mm7401a1's own 19–49 row.

/** The recommended PCV15→PPSV23 interval, in calendar months, where the year applies. */
export const ADULT_PPSV23_INTERVAL_MONTHS = 12;

/** The shorter interval, in weeks — the advice at 19–49, an option at 50+. */
export const ADULT_PPSV23_SHORTER_MINIMUM_WEEKS = 8;

/**
 * The recommended PCV15→PPSV23 interval for ONE adult — the only place this
 * is decided. Returns the shape `intervalPhrase()` and the due-date helpers
 * take, so the words, the number and the date can never disagree (S6).
 *
 * @param {number} ageMonths patient age in months
 * @param {string[]} riskIds selected risk condition ids
 * @returns {{days: number} | {months: number}} exactly one of days/months
 */
export function adultPpsvRecommendedInterval(ageMonths, riskIds = []) {
  return adultPpsvShorterIntervalIsTheAdvice(ageMonths, riskIds)
    ? { days: ADULT_PPSV23_SHORTER_MINIMUM_WEEKS * 7 }
    : { months: ADULT_PPSV23_INTERVAL_MONTHS };
}

/**
 * Is the 8 weeks this adult's RECOMMENDATION (rather than an option)?
 * True only for 19–49 with an immunocompromising condition, cochlear implant
 * or CSF leak — mm7401a1's second block.
 */
export function adultPpsvShorterIntervalIsTheAdvice(ageMonths, riskIds = []) {
  return ageMonths < ROUTINE_ADULT_MIN_M && adultPpsvShorterMinimumApplies(riskIds);
}

/**
 * Should the card NAME the 8 weeks as something that may be considered?
 * True only at 50+ for that same class — the one place mm7401a1 phrases it as
 * a choice. At 19–49 it is the advice, so naming it as an option would have
 * the card offer the patient the number it has just recommended.
 */
export function adultPpsvShorterMinimumOffered(ageMonths, riskIds = []) {
  return ageMonths >= ROUTINE_ADULT_MIN_M && adultPpsvShorterMinimumApplies(riskIds);
}

/**
 * May the 8-week minimum be considered for this adult?
 * True for an immunocompromising condition, cochlear implant or CSF leak.
 *
 * This answers ONLY the interval question. It is deliberately not reused to
 * decide which CDC row a patient is on — the predicate it replaced was doing
 * both jobs, so flattening the interval would silently have moved 19–49
 * cochlear/CSF patients off CDC's ">=5 years" row onto "review at 50".
 * Call sites that mean "is this patient IC or cochlear/CSF" say so directly.
 */
export function adultPpsvShorterMinimumApplies(riskIds = []) {
  return hasIC(riskIds) || hasSpecial(riskIds);
}

/**
 * The risk ids that mean anything on the PAEDIATRIC pathway (<19y) — i.e. the
 * selection with the `adultOnly` conditions removed.
 *
 * P3-9b / peds audit P0-3 (S10b, 2026-10-10). `smoking` and `alcoholism` are
 * `class: 'nonIC'` because that is what they are FOR ADULTS, and the adult
 * pathway depends on it. But CDC's paediatric risk lists do not contain them,
 * so on a child they must mean nothing at all. Before this filter,
 * pedsRiskRowClass returned 'nonIC' for any nonIC tick, and a 15-year-old
 * whose only tick was "Cigarette smoking" was given the same three-option
 * at-risk catch-up regimen as a 15-year-old with diabetes.
 *
 * Sources, fetched live 2026-10-10 — CDC's complete paediatric enumeration,
 * verbatim from the child & adolescent schedule notes, "Pneumococcal
 * vaccination / Special situations":
 *
 *   non-IC: "Children and adolescents with cerebrospinal fluid leak; chronic
 *     heart disease; chronic kidney disease (excluding maintenance dialysis and
 *     nephrotic syndrome); chronic liver disease; chronic lung disease
 *     (including moderate persistent or severe persistent asthma); cochlear
 *     implant; or diabetes mellitus"
 *   IC: "Children and adolescents on maintenance dialysis, or with
 *     immunocompromising conditions such as nephrotic syndrome; congenital or
 *     acquired asplenia or splenic dysfunction; congenital or acquired
 *     immunodeficiencies; diseases and conditions treated with
 *     immunosuppressive drugs or radiation therapy, including malignant
 *     neoplasms, leukemias, lymphomas, Hodgkin disease, and solid organ
 *     transplant; HIV infection; or sickle cell disease or other
 *     hemoglobinopathies"
 *
 * Neither smoking nor alcohol appears in either list (0 matches across the
 * fully-expanded page), and immunize.org p2016 Table 3 agrees. CDC's ADULT
 * notes do list them: "Alcoholism, chronic heart/liver/lung disease, cigarette
 * smoking, or diabetes mellitus…". So the filter is scoped to paediatrics.
 *
 * WHY THE FILTER IS HERE AND NOT IN `hasAnyRisk`. hasAnyRisk and hasNonIC are
 * reached only from pcvAdult, where these two risks are genuine. hasAnyRisk in
 * particular gates `if (!isOlderAdult && !anyRisk)` — the test that decides
 * whether a 19–49 adult gets a recommendation at all. Narrowing those helpers
 * to fix the paediatric row would have silently withdrawn the recommendation
 * from every adult smoker, which is the mirror image of the bug being fixed.
 *
 * The `adultOnly` flag itself stays on the risk entries: P3-9's RiskAgeNote is
 * what will tell the clinician the tick was seen and why it did not act on a
 * child, so the data must keep knowing which risks are adult ones.
 */
export function pedsRiskIds(riskIds = []) {
  return riskIds.filter((id) => !RISK_BY_ID[id]?.adultOnly);
}

// The peds at-risk ROW class (p2016 Table 4): IC vs non-IC.
// Cochlear/CSF are listed under non-IC in p2016 Table 3 → 'nonIC' for the row.
// IC precedence: any true IC condition → 'IC'.
// adultOnly risks are stripped first (P3-9b) — filtering INSIDE this helper, so
// the rule holds however it is called, rather than at one call site.
export function pedsRiskRowClass(riskIds = []) {
  const peds = pedsRiskIds(riskIds);
  if (hasIC(peds)) return 'IC';
  if (hasNonIC(peds) || hasSpecial(peds)) return 'nonIC';
  return null;
}
