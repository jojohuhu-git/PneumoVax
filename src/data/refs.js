// ─────────────────────────────────────────────────────────────────────────
// REFS — single source of truth for all reference URLs in PneumoVax.
//
// Every recommendation carries one or more citation keys from this map so the
// clinician can see the "why" behind each rec. All sources verified live
// 2026-06-06. Prefer ACIP/CDC/immunize.org over FDA package inserts (FDA-labeled
// ages are often more restrictive than current ACIP guidance).
//
// HSCT sources are intentionally segregated:
//   • Children <19y HSCT → p2016 Table 5 (SOLE source).
//   • Adults ≥19y HSCT   → Fred Hutch LTFU §IX (SOLE source).
//
// Each entry: url, label (full title), short (chip text).
// ─────────────────────────────────────────────────────────────────────────

export const REFS = {
  // CDC schedule notes ----------------------------------------------------
  cdcChildPneumo: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child/Adolescent Immunization Schedule — Pneumococcal notes',
    short: 'CDC Child/Adolescent Notes',
  },
  cdcAdultPneumo: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Immunization Schedule — Pneumococcal notes',
    short: 'CDC Adult Notes',
  },

  // CDC job aids ----------------------------------------------------------
  cdcCatchupJobAid: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/downloads/job-aids/pneumococcal.pdf',
    label: 'CDC PCV Catch-Up Job Aid — Healthy Children 4 months–4 years (Jan 2025)',
    short: 'CDC PCV Catch-up Job Aid',
  },
  cdcAdultTimingJobAid: {
    url: 'https://www.cdc.gov/pneumococcal/downloads/Vaccine-Timing-Adults-JobAid.pdf',
    label: 'CDC Adult Pneumococcal Vaccine Timing Job Aid',
    short: 'CDC Adult Timing Job Aid',
  },
  cdcPneumoIndex: {
    url: 'https://www.cdc.gov/pneumococcal/hcp/vaccine-recommendations/index.html',
    label: 'CDC — Pneumococcal Vaccine Recommendations (HCP)',
    short: 'CDC Pneumococcal Recommendations',
  },
  cdcRiskIndications: {
    url: 'https://www.cdc.gov/pneumococcal/hcp/vaccine-recommendations/risk-indications.html',
    label: 'CDC — Summary of Risk-based Pneumococcal Vaccination Recommendations (incl. "received PCV only before age 6 years")',
    short: 'CDC Risk-based Pneumococcal',
  },

  // ACIP MMWRs ------------------------------------------------------------
  mmwr7401a1: {
    url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm',
    label: 'ACIP 2025 — Expanded routine pneumococcal vaccination of adults aged ≥50 years (MMWR mm7401a1)',
    short: 'MMWR ≥50 expansion',
  },
  mmwr7336a3: {
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7336a3.htm',
    label: 'ACIP 2024 — Use of 21-valent pneumococcal conjugate vaccine (PCV21/Capvaxive) in adults (MMWR mm7336a3)',
    short: 'PCV21 MMWR',
  },
  mmwr7203a1: {
    url: 'https://www.cdc.gov/mmwr/volumes/72/rr/rr7203a1.htm',
    label: 'ACIP — Use of pneumococcal vaccines among U.S. adults ≥19 years (MMWR rr7203a1)',
    short: 'Adult Pneumococcal MMWR',
  },
  mmwr7239a5: {
    url: 'https://www.cdc.gov/mmwr/volumes/72/wr/mm7239a5.htm',
    label: 'ACIP 2023 — Use of PCV20 among children (MMWR mm7239a5)',
    short: 'PCV20 Children MMWR',
  },
  mmwr7137a3: {
    url: 'https://www.cdc.gov/mmwr/volumes/71/wr/mm7137a3.htm',
    label: 'ACIP 2022 — Use of PCV15 and PCV20 among adults (MMWR mm7137a3)',
    short: 'PCV15 Adults MMWR',
  },

  // immunize.org ----------------------------------------------------------
  p2016: {
    url: 'https://www.immunize.org/wp-content/uploads/catg.d/p2016.pdf',
    label: 'immunize.org — Recommendations for Pneumococcal Vaccines Use in Children and Teens (Tables 1–5)',
    short: 'immunize.org p2016',
  },
  immPCV7: {
    url: 'https://www.immunize.org/ask-experts/how-do-we-account-for-the-history-of-pcv7-vaccination-when-determining-the-pneumococcal-vaccination-needs-of-an-older-teen-or-young-adult-with-a-high-risk-condition/',
    label: 'immunize.org Ask the Experts — PCV7 history is ignored; treat high-risk patient as PCV-naïve',
    short: 'immunize.org PCV7 rule',
  },
  immPneumo: {
    url: 'https://www.immunize.org/ask-experts/topic/pneumococcal/',
    label: 'immunize.org Ask the Experts — Pneumococcal',
    short: 'immunize.org Ask the Experts',
  },

  // HSCT sources (segregated) --------------------------------------------
  // Children <19y HSCT — p2016 Table 5 is the SOLE source.
  p2016Table5: {
    url: 'https://www.immunize.org/wp-content/uploads/catg.d/p2016.pdf',
    label: 'immunize.org p2016 Table 5 — Pneumococcal schedule for children <19y following HSCT (SOLE peds-HSCT source)',
    short: 'p2016 Table 5 (HSCT)',
  },
  // Adults ≥19y HSCT — Fred Hutch LTFU is the SOLE source.
  fredHutchLTFU: {
    url: 'https://www.fredhutch.org/content/dam/www/research/patient-treatment-and-support/ltfu/LTFU_HSCT_guidelines_physicians.pdf',
    label: 'Fred Hutch Long-Term Follow-Up Guidelines for Referring Physicians, §IX Vaccinations, Tables IX.A1/A2 (adult HSCT — institution-specific, titer-guided, not ACIP)',
    short: 'Fred Hutch LTFU §IX',
  },
};

// Resolve an array of ref keys to {url, label, short} objects, dropping unknowns.
export function resolveRefs(keys = []) {
  return keys.map((k) => REFS[k]).filter(Boolean);
}
