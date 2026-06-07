// ─────────────────────────────────────────────────────────────────────────
// RISK FACTORS — pneumococcal indication catalog.
//
// Each entry declares its risk class:
//   class: 'IC'  — immunocompromising. Shorter PCV15→PPSV23 interval (≥8 weeks
//                  for adults; peds uses the IC catch-up rows of p2016 Table 4
//                  which add a 5-year-later PCV20/2nd-PPSV23 step). IC also gets
//                  the ≥8wk adult interval.
//   class: 'nonIC' — non-immunocompromising chronic condition. Adult PCV15→PPSV23
//                  interval is ≥1 year.
//   class: 'special' — cochlear implant / CSF leak: use the IC (≥8wk) interval
//                  per CDC adult notes, but are listed under non-IC in p2016
//                  Table 3 for the peds grid. Modeled as nonIC for the peds
//                  catch-up ROW but as IC-interval for the adult interval.
//   class: 'hsct' — hematopoietic stem cell transplant: advisory pathway,
//                  relative-to-transplant, no calendar due dates.
//
// Sources (CLINICAL_SPEC §C, §J): p2016 Table 3, CDC adult notes, rr7203a1.
//   • IC adult interval = ≥8 weeks; non-IC chronic adult interval = ≥1 year.
//   • Cochlear implant + CSF leak use the IC interval (CDC adult notes).
//   • IC precedence over non-IC when both present.
// ─────────────────────────────────────────────────────────────────────────

export const RISK_FACTORS = [
  // ── Immunocompromising (IC) ──────────────────────────────────────────
  {
    id: 'asplenia',
    label: 'Asplenia or splenic dysfunction / sickle cell disease',
    sublabel: 'congenital or acquired asplenia, sickle cell disease or other hemoglobinopathies',
    class: 'IC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo', 'mmwr7203a1'],
  },
  {
    id: 'immunodeficiency',
    label: 'Congenital or acquired immunodeficiency',
    class: 'IC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'immunosuppression',
    label: 'Immunosuppressive drugs or radiation therapy',
    sublabel: 'incl. long-term systemic corticosteroids; generalized malignancy, leukemia, lymphoma, Hodgkin, multiple myeloma',
    class: 'IC',
    refs: ['cdcAdultPneumo', 'mmwr7203a1'],
  },
  {
    id: 'hiv',
    label: 'HIV infection',
    class: 'IC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'solid_organ_transplant',
    label: 'Solid organ transplant',
    class: 'IC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'ckd_advanced',
    label: 'Chronic kidney disease — dialysis or nephrotic syndrome',
    sublabel: 'kidney disease on maintenance dialysis, or with nephrotic syndrome; chronic renal failure',
    class: 'IC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },

  // ── Cochlear implant / CSF leak (IC interval, non-IC peds row) ───────
  {
    id: 'cochlear_implant',
    label: 'Cochlear implant',
    sublabel: 'uses the immunocompromising (≥8-week) PCV15→PPSV23 interval (CDC adult notes)',
    class: 'special',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'csf_leak',
    label: 'Cerebrospinal fluid (CSF) leak',
    sublabel: 'uses the immunocompromising (≥8-week) PCV15→PPSV23 interval (CDC adult notes)',
    class: 'special',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },

  // ── Non-immunocompromising chronic conditions (non-IC) ──────────────
  {
    id: 'chronic_heart',
    label: 'Chronic heart disease',
    class: 'nonIC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'chronic_lung',
    label: 'Chronic lung disease',
    sublabel: 'incl. moderate/severe persistent asthma (children); COPD/emphysema/asthma (adults)',
    class: 'nonIC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'chronic_liver',
    label: 'Chronic liver disease',
    class: 'nonIC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'diabetes',
    label: 'Diabetes mellitus',
    class: 'nonIC',
    refs: ['cdcChildPneumo', 'cdcAdultPneumo'],
  },
  {
    id: 'ckd_chronic',
    label: 'Chronic kidney disease (not on dialysis / no nephrotic syndrome)',
    class: 'nonIC',
    refs: ['cdcChildPneumo'],
  },
  {
    id: 'alcoholism',
    label: 'Alcohol use disorder',
    sublabel: 'adult risk condition',
    class: 'nonIC',
    adultOnly: true,
    refs: ['cdcAdultPneumo', 'mmwr7203a1'],
  },
  {
    id: 'smoking',
    label: 'Cigarette smoking',
    sublabel: 'adult risk condition',
    class: 'nonIC',
    adultOnly: true,
    refs: ['cdcAdultPneumo', 'mmwr7203a1'],
  },

  // ── HSCT (advisory pathway) ─────────────────────────────────────────
  {
    id: 'hsct',
    label: 'Hematopoietic stem cell transplant (HSCT)',
    sublabel: 'full re-vaccination; advisory — coordinate with the transplant/ID team',
    class: 'hsct',
    refs: ['p2016Table5', 'fredHutchLTFU'],
  },
];

export const RISK_BY_ID = Object.fromEntries(RISK_FACTORS.map((r) => [r.id, r]));

// Any HSCT selected?
export function hasHSCT(riskIds = []) {
  return riskIds.includes('hsct');
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

// The PCV15→PPSV23 interval class for ADULTS:
//   IC, cochlear implant, or CSF leak → 'short' (≥8 weeks)
//   non-IC chronic only               → 'long'  (≥1 year)
// IC precedence: if any IC/special present, returns 'short'.
export function adultPpsvIntervalClass(riskIds = []) {
  if (hasIC(riskIds) || hasSpecial(riskIds)) return 'short';
  return 'long';
}

// The peds at-risk ROW class (p2016 Table 4): IC vs non-IC.
// Cochlear/CSF are listed under non-IC in p2016 Table 3 → 'nonIC' for the row.
// IC precedence: any true IC condition → 'IC'.
export function pedsRiskRowClass(riskIds = []) {
  if (hasIC(riskIds)) return 'IC';
  if (hasNonIC(riskIds) || hasSpecial(riskIds)) return 'nonIC';
  return null;
}
