// ─────────────────────────────────────────────────────────────────────────
// RISK FACTORS — pneumococcal indication catalog.
//
// `group` is DISPLAY ONLY (which StepRisks.jsx section a checkbox renders
// under) and is separate from `class` (the clinical logic engine reads).
// HSCT and the CAR-T/B-cell exclusion both display under "Immunocompromising
// conditions" (owner decision, 2026-09-13) but keep their own `class` values
// so recommend.js's hasHSCT()/hasExclusion() checks are unaffected.
//
// ── What the class does NOT decide: the recommended adult interval ──────
//
// This header stated, until 2026-10-15, that the adult PCV15→PPSV23 interval
// is keyed on the risk class — "IC adult interval = ≥8 weeks; non-IC chronic
// adult interval = ≥1 year". That is the rule the owner AMENDED on 2026-10-10
// (A-P1-1), and it had survived here, in the very file that owns the two
// constants, two hundred lines above their correct explanation. It was the
// fifth stale copy of that rule found; four earlier ones were fixed in S8.
//
// What is actually true, in two parts that must not be run together
// (CLAUDE.md: "Recommendation and floor are different questions; do not let
// one answer stand in for the other"):
//
//   • The RECOMMENDATION is ≥1 year for EVERY adult 19+, whatever the class.
//     The 8-week minimum is NAMED as an option for an immunocompromising
//     condition, cochlear implant or CSF leak — never substituted for the
//     year. ADULT_PPSV23_INTERVAL_MONTHS and
//     ADULT_PPSV23_SHORTER_MINIMUM_WEEKS below, with the CDC quote.
//   • The VALIDITY FLOOR, for a dose already given, IS keyed on the class: 8
//     weeks for IC / cochlear implant / CSF leak, the year for every other
//     adult. Added by S14-7 (2026-10-11). Every adult floor is an OWNER
//     CLINICAL DETERMINATION of that date — never cite ACIP or CDC for one.
//     Lives in logic/doseIntervalRules.js; see CLINICAL_SPEC.md §K.
//
// So what the class below decides, on the adult pathway, is which option gets
// NAMED, which floor applies, and which 19–49 prior-vaccine row the patient is
// on — not what the app recommends.
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
//   class: 'hsct' — hematopoietic stem cell transplant: advisory pathway,
//                  relative-to-transplant, no calendar due dates.
//
// Sources (CLINICAL_SPEC §C, §J, §K): p2016 Table 3, CDC adult notes, rr7203a1.
//   • Adult PCV15→PPSV23 RECOMMENDATION = ≥1 year at every adult age (A-P1-1).
//   • Cochlear implant + CSF leak are treated as IC for the adult questions.
//   • IC precedence over non-IC when both present.
// ─────────────────────────────────────────────────────────────────────────

export const RISK_FACTORS = [
  // ── Immunocompromising (IC) ──────────────────────────────────────────
  {
    id: 'asplenia',
    label: 'Asplenia or splenic dysfunction / sickle cell disease',
    sublabel: 'congenital or acquired asplenia, sickle cell disease or other hemoglobinopathies',
    class: 'IC', group: 'IC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo', 'mmwr7203a1'],
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
    refs: ['cdcAdultPneumo', 'mmwr7203a1'],
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

  // ── HSCT (advisory pathway) — displays under Immunocompromising conditions ──
  {
    id: 'hsct',
    label: 'Hematopoietic stem cell transplant (HSCT)',
    sublabel: 'full re-vaccination; advisory, coordinate with the transplant/ID team',
    class: 'hsct', group: 'IC',
    refs: ['p3086Table5', 'fredHutchLTFU'],
  },

  // ── Hard stop: too heterogeneous for one safe recipe — displays under
  //    Immunocompromising conditions, styled distinctly via `exclude: true` ──
  {
    id: 'bcell_car_t_therapy',
    label: 'CAR-T therapy, B-cell malignancy, or B-cell-depleting therapy',
    sublabel: 'this tool does not apply — needs an individualized, specialist-guided schedule',
    class: 'exclude', group: 'IC', exclude: true,
    refs: ['cdcAlteredImmunocompetence'],
  },

  // ── Cochlear implant / CSF leak (IC interval, non-IC peds row) ───────
  {
    id: 'cochlear_implant',
    label: 'Cochlear implant',
    sublabel: 'uses the immunocompromising (≥8-week) PCV15→PPSV23 interval (CDC adult notes)',
    class: 'special', group: 'special',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'csf_leak',
    label: 'Cerebrospinal fluid (CSF) leak',
    sublabel: 'uses the immunocompromising (≥8-week) PCV15→PPSV23 interval (CDC adult notes)',
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
    refs: ['cdcAdultPneumo', 'mmwr7203a1'],
  },
  {
    id: 'smoking',
    label: 'Cigarette smoking',
    sublabel: 'adult risk condition',
    class: 'nonIC', group: 'nonIC',
    adultOnly: true,
    refs: ['cdcAdultPneumo', 'mmwr7203a1'],
  },
];

export const RISK_BY_ID = Object.fromEntries(RISK_FACTORS.map((r) => [r.id, r]));

// Any HSCT selected?
export function hasHSCT(riskIds = []) {
  return riskIds.includes('hsct');
}

// CAR-T therapy / B-cell malignancy / B-cell-depleting therapy selected?
// This hard-stops the whole engine — too heterogeneous for one safe recipe.
export function hasExclusion(riskIds = []) {
  return riskIds.some((id) => RISK_BY_ID[id]?.class === 'exclude');
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

// Any risk condition at all that indicates pneumococcal vaccine (excludes HSCT,
// which is handled by its own advisory pathway)?
export function hasAnyRisk(riskIds = []) {
  return riskIds.some((id) => {
    const c = RISK_BY_ID[id]?.class;
    return c === 'IC' || c === 'nonIC' || c === 'special';
  });
}

// The PCV15→PPSV23 interval for ADULTS — one recommendation, at every adult age.
//
// OWNER DECISION 2026-10-10 (A-P1-1), amending the CLAUDE.md rule "Adult PPSV23
// Interval Is Risk-Class-Keyed", which keyed the interval on risk class with no
// age term and substituted the 8-week minimum FOR the recommendation:
//
//   "When PCV15 is used, it should be followed by a dose of PPSV23 at least
//    1 year later. The minimum interval (8 weeks) can be considered in adults
//    with an immunocompromising condition, cochlear implant, or cerebrospinal
//    fluid leak. Their pneumococcal vaccinations are then complete."
//
// Source, CDC Adult Immunization Schedule Notes, fetched live 2026-10-10. The
// sentence appears EXACTLY TWICE on that page, identically — once under
// "Routine vaccination / Age 50 years or older" and once under "Special
// situations / Age 19–49 years with certain underlying medical conditions":
//
//   "If PCV15 is used, administer 1 dose PPSV23 at least 1 year after the PCV15
//    dose (may use minimum interval of 8 weeks for adults with an
//    immunocompromising condition,* cochlear implant, or cerebrospinal fluid
//    leak)."
//
// So the primary source carries NO age distinction. ≥1 year is the
// recommendation for every adult; 8 weeks is a minimum that MAY BE CONSIDERED
// for IC / cochlear implant / CSF leak, at any adult age. The app states the
// year and NAMES the option — it never silently substitutes one for the other.
// (CDC's Timing Job Aid prints a flat "8 weeks" on its 19–49 pages; that is a
// per-page simplification of the sentence above, which governs.)

/** The recommended PCV15→PPSV23 interval for any adult, in calendar months. */
export const ADULT_PPSV23_INTERVAL_MONTHS = 12;

/** The shorter minimum that may be considered, in weeks. */
export const ADULT_PPSV23_SHORTER_MINIMUM_WEEKS = 8;

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
