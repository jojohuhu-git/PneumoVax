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
// Each entry: rulebook, url, label (full title), short (chip text),
// lastVerified, and — for sentence-level keys only — quote.
//
// ── `rulebook` — which schedule this source speaks for (N6, 2026-10-16) ──
//
//   'child'  the CDC child & adolescent schedule and the paediatric sources
//            beside it. Belongs on a card built for a patient under
//            ADULT_SCHED_MIN_M (19y), and must never appear on an adult's.
//   'adult'  the CDC adult schedule and the adult MMWRs. The mirror.
//   'any'    genuinely age-neutral: General Best Practice guidance, the
//            product-level MMWRs, the landing pages. Belongs on either.
//
// WHY IT IS DECLARED HERE and not filtered at the call site. A source's
// rulebook is a property OF THE SOURCE, so it is written down once, where the
// source is — the same shape `doseIntervalRules.js` uses, where each rule row
// declares its own `rulebook` rather than letting a caller's age test decide.
//
// The bug this closes (owner-reported 2026-10-16): `collectRefs()` merged each
// selected risk condition's whole refs list into the card, and a condition
// that exists at both ages lists both CDC pages — so a 55-year-old smoker's
// card cited the CHILD schedule, and a 5-year-old's cited the ADULT one.
// Measured over every risk condition: 13 of 17 one way, 12 of 17 the other.
// P3-9b had fixed one direction only, by stripping `adultOnly` ticks, and its
// comment claimed the other direction was impossible. It was not: a condition
// present at every age is not `adultOnly`, so nothing stripped it.
//
// Every entry must declare one — `regression-n6-citations-follow-the-rulebook`
// fails if a new ref is added without it, which is what stops this gate from
// quietly acquiring the hole P3-9b's had.
//
// ── What `lastVerified` attests to (P2-8, 2026-10-12) ────────────────────
//
// Every entry carries one, and `citation-freshness.test.js` fails if any is
// missing, malformed, or more than 12 months old. It is NOT decoration: it is
// the only thing in the repo that schedules the re-read, and until P2-8
// nothing in `src/` read it at all.
//
// The date means different things for the two kinds of entry, and the
// difference is deliberate — do not flatten it:
//
//   • A QUOTED (sentence-level) key: the page was opened and the `quote` was
//     confirmed to be present, verbatim, on that date. Re-verifying one means
//     re-reading the sentence — not touching the date.
//
//   • A QUOTE-FREE (whole-page / whole-document) key: these are the chips at
//     the foot of a card, citing a whole recommendation rather than one
//     sentence, so there is no sentence to re-check. The date means the
//     document still resolves at that exact URL and is still the document the
//     `label` claims.
//
// Verification depth on 2026-10-12, recorded honestly: the 12 HTML pages were
// loaded live and checked for title, canonical URL, section anchor and
// expected content; the 5 PDFs (both job aids, p2016, p3086, Fred Hutch LTFU)
// were confirmed to return HTTP 200 as `application/pdf` at those URLs with
// no redirect, but their text was NOT re-read. That is the right depth for a
// quote-free document reference and the wrong depth for a quoted one — so if
// a quote is ever added to one of those five, it must be re-verified by
// reading the PDF, not by copying this date forward.
//
// CDC pages must be read with `textContent`, never `innerText`: innerText
// silently omits CDC's collapsed accordion bodies. Keep a positive control —
// the child notes page is 75,723 chars with textContent and 9,184 with
// innerText, and "cochlear" appears in only the former. Without a control, a
// "0 matches" result means nothing.
// ─────────────────────────────────────────────────────────────────────────

export const REFS = {
  // CDC schedule notes ----------------------------------------------------
  cdcChildPneumo: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child/Adolescent Immunization Schedule — Pneumococcal notes',
    short: 'CDC Child/Adolescent Notes',
    lastVerified: '2026-10-12',
  },
  cdcAdultPneumo: {
    rulebook: 'adult',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Immunization Schedule — Pneumococcal notes',
    short: 'CDC Adult Notes',
    lastVerified: '2026-10-12',
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
    rulebook: 'adult',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Immunization Schedule — pneumococcal, the risk-factor footnote to "Age 19–49 years with certain underlying medical conditions or other risk factors"',
    short: 'CDC Adult Notes',
    quote: 'Underlying medical conditions or other risk factors include alcoholism, chronic heart/liver/lung disease, chronic renal failure, cigarette smoking',
    lastVerified: '2026-10-10',
  },
  cdcChildSpecialSituations: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Immunization Schedule — pneumococcal "Special situations", the non-immunocompromising risk group (CDC\'s complete paediatric enumeration; names neither smoking nor alcohol)',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Children and adolescents with cerebrospinal fluid leak; chronic heart disease; chronic kidney disease (excluding maintenance dialysis and nephrotic syndrome); chronic liver disease; chronic lung disease (including moderate persistent or severe persistent asthma); cochlear implant; or diabetes mellitus',
    lastVerified: '2026-10-10',
  },

  // Adult schedule-note sentences (P6-3b) ---------------------------------
  // One key per sentence the adult pathway rests on, all on the SAME page as
  // `cdcAdultPneumo` above — so they share one visible [N] (dedupe is by
  // `page`) while each links and hovers its own sentence.
  //
  // All fetched live 2026-10-10 (browser pane, `textContent`) and checked for
  // exact presence; re-read live 2026-10-16 and still exact. Three of them —
  // adultPcv15ThenPpsv, adultPcv13Only and adultPcv7Only — occur TWICE on the
  // page, because CDC prints them identically under "Age 50 years or older"
  // and under "Age 19-49 years"; the deep link lands on the first occurrence.
  //
  // S15 (2026-10-16): that duplication used to be cited as the evidence for a
  // single adult interval at every age. It is not sufficient evidence, and
  // this comment no longer claims it is. The schedule notes summarise;
  // mm7401a1 (January 2025) is the recommendation, and ITS table splits the
  // PCV15->PPSV23 interval by age band. A 19-49 adult with an
  // immunocompromising condition / cochlear implant / CSF leak is now cited to
  // `adultPcv15ThenPpsvShort` below, not to the sentence here — a card must
  // never show a quote that states a different number from the card.
  adultRoutine50: {
    rulebook: 'adult',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal, routine vaccination at age 50+ with no prior PCV or unknown history',
    short: 'CDC Adult Notes',
    quote: 'Not previously received a dose of PCV13, PCV15, PCV20, or PCV21 or whose previous vaccination history is unknown: 1 dose PCV15 or 1 dose PCV20 or 1 dose PCV21.',
    lastVerified: '2026-10-10',
  },
  adultPcv15ThenPpsv: {
    rulebook: 'adult',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal, the PCV15 -> PPSV23 interval of >=1 year, with 8 weeks named as a minimum that MAY be considered for an immunocompromising condition, cochlear implant or CSF leak. This is the citation for the YEAR: every adult 50+, and 19-49 with chronic conditions only',
    short: 'CDC Adult Notes',
    quote: 'If PCV15 is used, administer 1 dose PPSV23 at least 1 year after the PCV15 dose (may use minimum interval of 8 weeks for adults with an immunocompromising condition,',
    lastVerified: '2026-10-16',
  },
  // S15 (2026-10-16). The citation for the OTHER half of the rule: a 19-49
  // adult with an immunocompromising condition, cochlear implant or CSF leak
  // is told >=8 weeks, so the quote beside that card has to be the sentence
  // that says 8 weeks — not the schedule-notes sentence that says a year.
  //
  // Source read live 2026-10-16 at the PMC mirror the owner supplied,
  // https://pmc.ncbi.nlm.nih.gov/articles/PMC11709131/ — the quote below is
  // from mm7401a1's clinical guidance table, row "Adults aged 19-49 years
  // with an immunocompromising condition, a CSF leak, or a cochlear implant /
  // None or PCV7 only at any age". The canonical cdc.gov URL is used here.
  adultPcv15ThenPpsvShort: {
    rulebook: 'adult',
    url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm',
    label: 'ACIP 2025 (MMWR mm7401a1) — for adults aged 19-49 years with an immunocompromising condition, a CSF leak, or a cochlear implant, PPSV23 follows PCV15 by >=8 weeks. CDC\'s March 2025 Adult Pneumococcal Vaccine Timing Job Aid prints the same >=8 weeks on its 19-49 immunocompromising (p.2) and cochlear implant / CSF leak (p.3) pages',
    short: 'MMWR ≥50 expansion',
    quote: 'If PCV15 is used, administer a single dose of PPSV23* ≥8 weeks after the PCV15 dose.',
    lastVerified: '2026-10-16',
  },
  adultPcv13Only: {
    rulebook: 'adult',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal, previously received only PCV13',
    short: 'CDC Adult Notes',
    quote: 'Previously received only PCV13: 1 dose PCV20 or 1 dose PCV21 at least 1 year after the last PCV13 dose.',
    lastVerified: '2026-10-10',
  },
  adultPpsvOnly: {
    rulebook: 'adult',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal, previously received only PPSV23',
    short: 'CDC Adult Notes',
    quote: 'Previously received only PPSV23: 1 dose PCV15 or 1 dose PCV20 or 1 dose PCV21 at least 1 year after the last PPSV23 dose.',
    lastVerified: '2026-10-10',
  },
  adultBothNotAt65: {
    rulebook: 'adult',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal, PCV13 + PPSV23 where no PPSV23 was given at 65+',
    short: 'CDC Adult Notes',
    quote: 'Previously received both PCV13 and PPSV23 but NO PPSV23 was received at age 65 years or older: 1 dose PCV20 or 1 dose PCV21 at least 5 years after the last pneumococcal vaccine dose.',
    lastVerified: '2026-10-10',
  },
  adultBothAt65: {
    rulebook: 'adult',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal, PCV13 + PPSV23 with PPSV23 given at 65+ (shared clinical decision-making)',
    short: 'CDC Adult Notes',
    quote: 'Previously received both PCV13 and PPSV23, AND PPSV23 was received at age 65 years or older: Based on shared clinical decision',
    lastVerified: '2026-10-10',
  },
  adultPcv20or21Complete: {
    rulebook: 'adult',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal, a series containing PCV20 or PCV21 is complete',
    short: 'CDC Adult Notes',
    quote: 'Adults aged 19 years and older who have received PCV20 or PCV21: no additional pneumococcal vaccine dose recommended.',
    lastVerified: '2026-10-10',
  },
  adultPcv7Only: {
    rulebook: 'adult',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal, a PCV7-only history is treated as no PCV history',
    short: 'CDC Adult Notes',
    quote: 'Previously received only PCV7: follow the recommendation above.',
    lastVerified: '2026-10-10',
  },

  // Child & adolescent schedule-note sentences (P6-3b) --------------------
  // One key per sentence the paediatric pathways rest on, all on the SAME page
  // as `cdcChildPneumo` above, so they share one visible [N].
  //
  // Fetched live 2026-10-10 (browser pane, `textContent`, with "cochlear" as a
  // positive control) and each checked for exact presence. Several occur more
  // than once because CDC repeats the same row under the immunocompromising
  // and non-immunocompromising groups; the deep link lands on the first.
  pedsRoutine4Dose: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal, routine infant 4-dose PCV series',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Routine vaccination with PCV 4-dose series at 2, 4, 6, 12–15 months',
    lastVerified: '2026-10-10',
  },
  pedsHealthyCatchup: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal, catch-up for healthy children 2-4 years',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Healthy children ages 2–4 years with any incomplete* PCV series: 1 dose PCV',
    lastVerified: '2026-10-10',
  },
  pedsNoPcv20IfComplete: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal, PCV20 not indicated for a child without risk conditions who already completed an age-appropriate series',
    short: 'CDC Child/Adolescent Notes',
    quote: 'For children without risk conditions, PCV20 is not indicated if they have received 4 doses of PCV13 or PCV15 or another age appropriate complete PCV series.',
    lastVerified: '2026-10-10',
  },
  pedsRisk6to18NoPcv: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal "Special situations", at-risk 6-18 years with no prior PCV13/15/20 (and the 8-week PCV15 -> PPSV23 interval)',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Not previously received any dose of PCV13, PCV15, or PCV20: administer 1 dose of PCV15 or PCV20. If PCV15 is used and no previous receipt of PPSV23, administer 1 dose of PPSV23 at least 8 weeks after the PCV15 dose.',
    lastVerified: '2026-10-10',
  },
  pedsRiskPcv20Complete: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal "Special situations", a prior PCV20 completes an at-risk child\'s series',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Previously received at least 1 dose of PCV20: no further PCV or PPSV23 doses needed',
    lastVerified: '2026-10-10',
  },
  pedsRiskPcv13At6: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal "Special situations", at-risk child who received PCV13 only at or after age 6',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Received PCV13 only at or after age 6 years: administer 1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after the most recent PCV13 dose.',
    lastVerified: '2026-10-10',
  },
  pedsRiskDone: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal "Special situations", PCV13 + PPSV23 at or after age 6 completes the series',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Received 1 dose PCV13 and 1 dose PPSV23 at or after age 6 years: no further doses of any PCV or PPSV23 indicated.',
    lastVerified: '2026-10-10',
  },
  // P6-3c (2026-10-12): the quote was TRIMMED, and the reason is worth keeping.
  // It used to read "Pneumococcal vaccination (minimum age: 6 weeks ...)" —
  // the section heading plus the parenthetical. Checked live against the
  // rendered page on 2026-10-12: those are two separate elements (an <h*> and
  // its own <p>), so that string does not exist contiguously anywhere on the
  // page, and the `#:~:text=` deep link `cite()` builds from it matched
  // NOTHING — landing the clinician at the top of a long page with no
  // indication anything had failed. Harmless while this ref was shown to
  // nobody; the moment P6-3c put it on a verdict it would have been a dead
  // link. The parenthetical alone is one <p> and does match.
  pedsMinAge: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal minimum ages (6 weeks for PCV15/PCV20; 2 years for PPSV23)',
    short: 'CDC Child/Adolescent Notes',
    quote: '(minimum age: 6 weeks [PCV15], [PCV 20]; 2 years [PPSV23])',
    lastVerified: '2026-10-12',
  },

  // Risk-based summary sentences (P6-3b) ----------------------------------
  // Same page as `cdcRiskIndications` above, so they share its visible [N].
  // Fetched live 2026-10-10 (textContent; "PPSV23" x46 as a positive control).
  // The 5-year sentence occurs twice — CDC prints it under both the 2-5y and
  // the 6-18y groups — so the deep link lands on the first.
  pedsSecondPpsv5y: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/pneumococcal/hcp/vaccine-recommendations/risk-indications.html',
    label: 'CDC Risk-based Pneumococcal Recommendations — when PPSV23 is used for an at-risk child, a further pneumococcal vaccine follows at least 5 years later',
    short: 'CDC Risk-based Pneumococcal',
    quote: 'When PPSV23 is used, they need another pneumococcal vaccine at least 5 years later.',
    lastVerified: '2026-10-10',
  },
  pedsBefore6NoPcv20: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/pneumococcal/hcp/vaccine-recommendations/risk-indications.html',
    label: 'CDC Risk-based Pneumococcal Recommendations — the 6-18y row for a child who received PCV13 or PCV15 before age 6 and never PCV20',
    short: 'CDC Risk-based Pneumococcal',
    quote: 'Received PCV13 or PCV15 before age 6 years, never received PCV20',
    lastVerified: '2026-10-10',
  },

  // (continued) Child & adolescent sentences, verified the same way.
  pedsRiskIncompleteCatchup: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal "Special situations", at-risk 2-5y with fewer than 3 prior PCV doses',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Less than 3 PCV doses: 2 doses PCV (at least 8 weeks after the most recent dose and administered at least 8 weeks apart)',
    lastVerified: '2026-10-10',
  },
  pedsRiskPcv20orPpsv23: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal "Special situations", at-risk child who completed the PCV series without PCV20 and without PPSV23',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Not previously received PCV20: administer 1 dose PCV20 or 1 dose PPSV23 administer at least 8 weeks after the most recent PCV dose.',
    lastVerified: '2026-10-10',
  },

  // CDC job aids ----------------------------------------------------------
  cdcCatchupJobAid: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/downloads/job-aids/pneumococcal.pdf',
    label: 'CDC PCV Catch-Up Job Aid — Healthy Children 4 months–4 years (Jan 2025)',
    short: 'CDC PCV Catch-up Job Aid',
    lastVerified: '2026-10-12',
  },
  cdcAdultTimingJobAid: {
    rulebook: 'adult',
    url: 'https://www.cdc.gov/pneumococcal/downloads/Vaccine-Timing-Adults-JobAid.pdf',
    label: 'CDC Adult Pneumococcal Vaccine Timing Job Aid',
    short: 'CDC Adult Timing Job Aid',
    lastVerified: '2026-10-12',
  },
  cdcPneumoIndex: {
    rulebook: 'any',
    url: 'https://www.cdc.gov/pneumococcal/hcp/vaccine-recommendations/index.html',
    label: 'CDC — Pneumococcal Vaccine Recommendations (HCP)',
    short: 'CDC Pneumococcal Recommendations',
    lastVerified: '2026-10-12',
  },
  cdcRiskIndications: {
    rulebook: 'any',
    url: 'https://www.cdc.gov/pneumococcal/hcp/vaccine-recommendations/risk-indications.html',
    // 2026-10-10 (S13): this label used to claim the page contains the phrase
    // "received PCV only before age 6 years". Fetched live — it does not. The
    // row it means is headed "Received PCV13 or PCV15 before age 6 years,
    // never received PCV20". Corrected rather than left as a citation that
    // promises wording the source never used.
    label: 'CDC — Summary of Risk-based Pneumococcal Vaccination Recommendations (incl. the row "Received PCV13 or PCV15 before age 6 years, never received PCV20")',
    short: 'CDC Risk-based Pneumococcal',
    lastVerified: '2026-10-12',
  },

  // ACIP MMWRs ------------------------------------------------------------
  mmwr7401a1: {
    rulebook: 'adult',
    url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm',
    label: 'ACIP 2025 — Expanded routine pneumococcal vaccination of adults aged ≥50 years (MMWR mm7401a1)',
    short: 'MMWR ≥50 expansion',
    lastVerified: '2026-10-12',
  },
  mmwr7336a3: {
    rulebook: 'any',
    url: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7336a3.htm',
    label: 'ACIP 2024 — Use of 21-valent pneumococcal conjugate vaccine (PCV21/Capvaxive) in adults (MMWR mm7336a3)',
    short: 'PCV21 MMWR',
    lastVerified: '2026-10-12',
  },
  mmwr7203a1: {
    rulebook: 'adult',
    url: 'https://www.cdc.gov/mmwr/volumes/72/rr/rr7203a1.htm',
    label: 'ACIP — Use of pneumococcal vaccines among U.S. adults ≥19 years (MMWR rr7203a1)',
    short: 'Adult Pneumococcal MMWR',
    lastVerified: '2026-10-12',
  },
  mmwr7239a5: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/mmwr/volumes/72/wr/mm7239a5.htm',
    label: 'ACIP 2023 — Use of PCV20 among children (MMWR mm7239a5)',
    short: 'PCV20 Children MMWR',
    lastVerified: '2026-10-12',
  },
  mmwr7137a3: {
    rulebook: 'adult',
    url: 'https://www.cdc.gov/mmwr/volumes/71/wr/mm7137a3.htm',
    label: 'ACIP 2022 — Use of PCV15 and PCV20 among adults (MMWR mm7137a3)',
    short: 'PCV15 Adults MMWR',
    lastVerified: '2026-10-12',
  },

  // immunize.org ----------------------------------------------------------
  p2016: {
    rulebook: 'child',
    // 2026-09-13 fix: label previously claimed "Tables 1-5" — verified live
    // that p2016.pdf, as it exists now, is a 2-page document with only
    // Tables 1-4. Table 5 (the HSCT schedule) lives in p3086.pdf instead
    // (see p3086Table5 below). URL itself was already correct for these
    // Tables 1-4 call sites.
    url: 'https://www.immunize.org/wp-content/uploads/catg.d/p2016.pdf',
    label: 'immunize.org — Recommendations for Pneumococcal Vaccines Use in Children and Teens (Tables 1–4)',
    short: 'immunize.org p2016',
    lastVerified: '2026-10-12',
  },
  // P6-3c (2026-10-12): `quote` added so this stops being a bare page link and
  // starts deep-linking the sentence the rule rests on. Fetched LIVE from the
  // page on 2026-10-12 and copied verbatim — not transcribed from CLAUDE.md's
  // one-line summary of it.
  //
  // ⚠ READ THE SCOPE. The app's rule ("PCV7 never counts", CLAUDE.md) is
  // BROADER than this sentence, which speaks of "an older teen or adult
  // patient at increased risk". Two reasons that is still the right sentence
  // to show, both recorded so nobody has to re-derive them:
  //   • The AGE half is not a real gap. The quote says so itself: PCV7 was
  //     used in the US between 2000 and 2010, so anyone with a PCV7 dose on
  //     record is an older teen or an adult today.
  //   • The RISK half changes no answer. For a patient not at increased risk,
  //     counting the PCV7 or ignoring it lands on the same recommendation —
  //     the current adult schedule keys on age 50 and on risk condition, not
  //     on a PCV7 history.
  // The clinician is shown the sentence verbatim and can judge it. If a future
  // source states the rule without the risk qualifier, cite that instead.
  immPCV7: {
    rulebook: 'any',
    url: 'https://www.immunize.org/ask-experts/how-do-we-account-for-the-history-of-pcv7-vaccination-when-determining-the-pneumococcal-vaccination-needs-of-an-older-teen-or-young-adult-with-a-high-risk-condition/',
    label: 'immunize.org Ask the Experts — PCV7 history is ignored; treat high-risk patient as PCV-naïve',
    short: 'immunize.org PCV7 rule',
    quote: 'Because of the limited number of serogroups covered by PCV7 (which was used in the United States between 2000 and 2010), CDC recommends that doses of PCV7 should be ignored for the purposes of calculating the current pneumococcal vaccination needs of an older teen or adult patient at increased risk for pneumococcal disease.',
    lastVerified: '2026-10-12',
  },
  immPneumo: {
    rulebook: 'any',
    url: 'https://www.immunize.org/ask-experts/topic/pneumococcal/',
    label: 'immunize.org Ask the Experts — Pneumococcal',
    short: 'immunize.org Ask the Experts',
    lastVerified: '2026-10-12',
  },

  // HSCT sources (segregated) --------------------------------------------
  // Children <19y HSCT — p3086 Table 5 is the SOLE source.
  // 2026-09-13 fix: this used to point to p2016.pdf, which (verified live)
  // is a 2-page document with only Tables 1-4 — no Table 5, no HSCT content.
  // The real Table 5 lives in p3086.pdf ("Standing Orders for Administering
  // Pneumococcal Vaccines to Children and Teens"), page 4 of 5 — verified
  // its text matches this app's hardcoded advisory note verbatim.
  p3086Table5: {
    rulebook: 'child',
    url: 'https://www.immunize.org/wp-content/uploads/catg.d/p3086.pdf',
    label: 'immunize.org Standing Orders for Administering Pneumococcal Vaccines to Children and Teens — Table 5: Pneumococcal schedule for children <19y following HSCT (SOLE peds-HSCT source)',
    short: 'Immunize.org Table 5 (HSCT)',
    lastVerified: '2026-10-12',
  },
  // Adults ≥19y HSCT — 2026-09-14 (P0-A): ASCO 2024 replaces Fred Hutch LTFU
  // as the adult source, per owner decision in
  // docs/archive/fix-queue-2026-09-13-crossapp-hct-cart-parity.md. Fred Hutch
  // LTFU is retained below only as a superseded/historical entry (kept for
  // any archived references pointing at it) — no active rec cites it.
  ascoAdultCancer2024: {
    rulebook: 'adult',
    url: 'https://ascopubs.org/doi/10.1200/JCO.24.00032',
    label: 'ASCO Guideline: Vaccination of Adults With Cancer (J Clin Oncol 2024)',
    short: 'ASCO Vaccination of Adults With Cancer (2024)',
    quote: 'the current US recommendation is to revaccinate all HSCT recipients with the first dose of PCV-20 at 4-6 months after transplant... The subsequent two doses are given at 1-month intervals, followed by the fourth dose administered 6 months later... Earlier revaccination of HSCT recipients starting after 3 months is the preferred approach in combination with a fourth conjugate vaccine dose administered at 1 year.',
    lastVerified: '2026-09-14',
  },
  // Superseded 2026-09-14 — institution-specific, titer-guided, not ACIP.
  // Kept for historical reference only; no active rec cites this.
  fredHutchLTFU: {
    rulebook: 'adult',
    url: 'https://www.fredhutch.org/content/dam/www/research/patient-treatment-and-support/ltfu/LTFU_HSCT_guidelines_physicians.pdf',
    label: 'Fred Hutch Long-Term Follow-Up Guidelines for Referring Physicians, §IX Vaccinations, Tables IX.A1/A2 (adult HSCT — institution-specific, titer-guided, not ACIP; superseded by ASCO 2024)',
    short: 'Fred Hutch LTFU §IX (superseded)',
    lastVerified: '2026-10-12',
  },

  // CAR-T / B-cell malignancy / B-cell-depleting therapy hard stop -------
  cdcAlteredImmunocompetence: {
    rulebook: 'any',
    // P2-8 (2026-10-12): the old path
    // `/vaccines/hcp/acip-recs/general-recs/immunocompetence.html` still
    // works, but only through a CDC redirect — the page has moved to
    // imz-best-practices. Recorded here as the first thing the freshness
    // sweep caught: the link was never broken, so nothing would ever have
    // reported it, and a redirect is one reorganisation away from a 404.
    url: 'https://www.cdc.gov/vaccines/hcp/imz-best-practices/altered-immunocompetence.html',
    label: 'CDC ACIP General Best Practice Guidelines — Altered Immunocompetence',
    short: 'CDC Altered Immunocompetence',
    lastVerified: '2026-10-12',
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
