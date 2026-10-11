// ─────────────────────────────────────────────────────────────────────────
// REFS — single source of truth for all reference URLs in PneumoVax.
//
// Every recommendation carries one or more citation keys from this map so the
// clinician can see the "why" behind each rec. All sources verified live
// 2026-06-06. Prefer ACIP/CDC/immunize.org over FDA package inserts (FDA-labeled
// ages are often more restrictive than current ACIP guidance).
//
// HSCT sources are intentionally segregated:
//   • Children <19y HSCT → immunize.org p3086 Table 5 (SOLE source).
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

  // Sentence-level citations (P6-3) ---------------------------------------
  // These point at the SAME two pages as cdcChildPneumo / cdcAdultPneumo
  // above, but each carries the ONE sentence a particular claim rests on, so
  // cite() can deep-link the reader straight to it. The whole-page keys stay
  // quote-free on purpose: they are the chips at the foot of a card, and a
  // chip cites the whole recommendation rather than one sentence inside it.
  // Two keys quoting one page share a single visible [N] (dedupe is by
  // `page`), while each keeps its own link and hover text.
  //
  // Both quotes below were fetched live 2026-10-10 via the browser pane and
  // confirmed to appear EXACTLY once on their page. (`innerText` silently
  // omits CDC's collapsed accordion bodies — 9,184 chars with "cochlear" and
  // "diabetes" both absent; `textContent` returns the real 75,723. Any future
  // re-verification must use textContent and keep a positive control, or a
  // "0 matches" result means nothing.)
  cdcAdultRiskFactorList: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Immunization Schedule — pneumococcal, the risk-factor footnote to "Age 19–49 years with certain underlying medical conditions or other risk factors"',
    short: 'CDC Adult Notes',
    quote: 'Underlying medical conditions or other risk factors include alcoholism, chronic heart/liver/lung disease, chronic renal failure, cigarette smoking',
    lastVerified: '2026-10-10',
  },
  cdcChildSpecialSituations: {
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Immunization Schedule — pneumococcal "Special situations", the non-immunocompromising risk group (CDC\'s complete paediatric enumeration; names neither smoking nor alcohol)',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Children and adolescents with cerebrospinal fluid leak; chronic heart disease; chronic kidney disease (excluding maintenance dialysis and nephrotic syndrome); chronic liver disease; chronic lung disease (including moderate persistent or severe persistent asthma); cochlear implant; or diabetes mellitus',
    lastVerified: '2026-10-10',
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
    // 2026-09-13 fix: label previously claimed "Tables 1-5" — verified live
    // that p2016.pdf, as it exists now, is a 2-page document with only
    // Tables 1-4. Table 5 (the HSCT schedule) lives in p3086.pdf instead
    // (see p3086Table5 below). URL itself was already correct for these
    // Tables 1-4 call sites.
    url: 'https://www.immunize.org/wp-content/uploads/catg.d/p2016.pdf',
    label: 'immunize.org — Recommendations for Pneumococcal Vaccines Use in Children and Teens (Tables 1–4)',
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
  // Children <19y HSCT — p3086 Table 5 is the SOLE source.
  // 2026-09-13 fix: this used to point to p2016.pdf, which (verified live)
  // is a 2-page document with only Tables 1-4 — no Table 5, no HSCT content.
  // The real Table 5 lives in p3086.pdf ("Standing Orders for Administering
  // Pneumococcal Vaccines to Children and Teens"), page 4 of 5 — verified
  // its text matches this app's hardcoded advisory note verbatim.
  p3086Table5: {
    url: 'https://www.immunize.org/wp-content/uploads/catg.d/p3086.pdf',
    label: 'immunize.org Standing Orders for Administering Pneumococcal Vaccines to Children and Teens — Table 5: Pneumococcal schedule for children <19y following HSCT (SOLE peds-HSCT source)',
    short: 'Immunize.org Table 5 (HSCT)',
  },
  // Adults ≥19y HSCT — 2026-09-14 (P0-A): ASCO 2024 replaces Fred Hutch LTFU
  // as the adult source, per owner decision in
  // docs/archive/fix-queue-2026-09-13-crossapp-hct-cart-parity.md. Fred Hutch
  // LTFU is retained below only as a superseded/historical entry (kept for
  // any archived references pointing at it) — no active rec cites it.
  ascoAdultCancer2024: {
    url: 'https://ascopubs.org/doi/10.1200/JCO.24.00032',
    label: 'ASCO Guideline: Vaccination of Adults With Cancer (J Clin Oncol 2024)',
    short: 'ASCO Vaccination of Adults With Cancer (2024)',
    quote: 'the current US recommendation is to revaccinate all HSCT recipients with the first dose of PCV-20 at 4-6 months after transplant... The subsequent two doses are given at 1-month intervals, followed by the fourth dose administered 6 months later... Earlier revaccination of HSCT recipients starting after 3 months is the preferred approach in combination with a fourth conjugate vaccine dose administered at 1 year.',
    lastVerified: '2026-09-14',
  },
  // Superseded 2026-09-14 — institution-specific, titer-guided, not ACIP.
  // Kept for historical reference only; no active rec cites this.
  fredHutchLTFU: {
    url: 'https://www.fredhutch.org/content/dam/www/research/patient-treatment-and-support/ltfu/LTFU_HSCT_guidelines_physicians.pdf',
    label: 'Fred Hutch Long-Term Follow-Up Guidelines for Referring Physicians, §IX Vaccinations, Tables IX.A1/A2 (adult HSCT — institution-specific, titer-guided, not ACIP; superseded by ASCO 2024)',
    short: 'Fred Hutch LTFU §IX (superseded)',
  },

  // CAR-T / B-cell malignancy / B-cell-depleting therapy hard stop -------
  cdcAlteredImmunocompetence: {
    url: 'https://www.cdc.gov/vaccines/hcp/acip-recs/general-recs/immunocompetence.html',
    label: 'CDC ACIP General Best Practice Guidelines — Altered Immunocompetence',
    short: 'CDC Altered Immunocompetence',
  },
};

// Resolve an array of ref keys to {url, label, short} objects, dropping unknowns.
// These are the whole-card chips at the foot of a recommendation: always the
// plain page URL (with its section anchor), never a #:~:text= fragment, because
// a chip cites the whole recommendation rather than one sentence inside it.
export function resolveRefs(keys = []) {
  return keys.map((k) => REFS[k]).filter(Boolean);
}

// ── P6-3 (S13, 2026-10-10): per-occurrence citations for inline [N] markers ──
//
// Build the deep link that scrolls the reader to the exact sentence a claim
// rests on. Kept as a pure function of (url, quote) rather than of a ref key
// so the anchor rule below can be tested on its own.
//
// ⚠ The anchor rule. A URL may already carry a section anchor —
// `.../adult-notes.html#note-pneumo` — and naive concatenation would produce
// `.../adult-notes.html#note-pneumo#:~:text=...`: TWO fragments in one URL,
// which no browser honours, so the superscript silently stops jumping to the
// sentence. So the quote link is built on the page part only. The anchor is
// not lost: `cite()` keeps it on `page`, which is what the chips and the
// dedupe identity use. MeningoVax hit this on its one anchored citation
// (2026-09-17); here BOTH of the most-cited refs are anchored, so it is the
// normal case rather than an edge one.
export function highlightUrl(url, quote) {
  if (!url) return undefined;
  if (!quote) return url;
  return `${url.split('#')[0]}#:~:text=${encodeURIComponent(quote)}`;
}

// One citation occurrence: keyed, but deliberately NOT numbered. Each one
// corresponds to a single literal "[c]" placeholder in a note or a dose
// verdict, in order. RecCard assigns the visible [N] at render time (by order
// of first mention within the card, deduping repeats of the same `page`), so
// the engine never hardcodes a number and a source cannot drift to a
// different one by being typed wrong.
//
//   • `page`  — the plain page URL WITH its anchor. The dedupe identity: two
//               keys quoting different sentences of the same document share
//               one visible [N], while each keeps its own link and hover text.
//   • `url`   — deep-links to the quoted sentence when there is a quote.
//   • `label` — the quoted sentence, else the ref's full title. Shown on
//               hover, because #:~:text= does not visibly scroll in every
//               browser.
//
// Refs without a `quote` yet degrade to the page URL and the title: still a
// working, numbered link, just not scrolled to a sentence. S8/P2-8 owns the
// full `quote` + `lastVerified` sweep of all 18 refs.
export function cite(key) {
  const c = REFS[key];
  return {
    key,
    page: c?.url,
    url: highlightUrl(c?.url, c?.quote),
    label: c?.quote ?? c?.label,
  };
}
