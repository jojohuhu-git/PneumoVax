// ─────────────────────────────────────────────────────────────────────────
// REFS — single source of truth for all reference URLs in PneumoVax.
//
// Every recommendation carries one or more citation keys from this map so the
// clinician can see the "why" behind each rec. All sources verified live
// 2026-06-06. Prefer ACIP/CDC/immunize.org over FDA package inserts (FDA-labeled
// ages are often more restrictive than current ACIP guidance).
//
// There are no post-transplant sources here any more. The three that were
// (immunize.org p3086 Table 5, Fred Hutch LTFU §IX and the 2024 ASCO adult
// cancer guideline) were deleted on 2026-10-16 when the transplant tick
// became a hard stop: the app no longer states a post-transplant schedule, so
// it no longer cites one. They are recorded verbatim in
// docs/archive/retired-2026-10-16-post-transplant-pneumococcal-schedules.md.
// The stop names ASCO, NCCN, IDSA and CDC in words and links none of them.
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
// expected content; the PDFs (both job aids and p2016 — p3086 and the Fred
// Hutch LTFU guideline were deleted on 2026-10-16 with the transplant
// pathway) were confirmed to return HTTP 200 as `application/pdf` at those
// URLs with no redirect, but their text was NOT re-read. That is the right
// depth for a quote-free document reference and the wrong depth for a quoted
// one — so if a quote is ever added to one of them, it must be re-verified by
// reading the PDF, not by copying this date forward.
//
// CDC pages must be read with `textContent`, never `innerText`: innerText
// silently omits CDC's collapsed accordion bodies. Keep a positive control —
// the child notes page is 75,723 chars with textContent and 9,184 with
// innerText, and "cochlear" appears in only the former. Without a control, a
// "0 matches" result means nothing.
// ─────────────────────────────────────────────────────────────────────────

// ── `population` — WHO THE SENTENCE IS ABOUT (2026-10-17) ───────────────
//
// `rulebook` keeps a child's source off an adult's card. It cannot see either
// of the two splits CDC's own pages turn on, and those are the two the engine
// turns on as well:
//
//   children  the IMMUNOCOMPROMISING list vs the one that is not
//   adults    Routine (50+) vs Special situations (19-49)
//
// So every QUOTED entry declares the patient group(s) its sentence is about,
// and `regression-2026-10-17-every-quote-names-its-patient` fails if a card
// shows a quote to anyone else. Quote-free entries declare none: they are
// whole documents, and a document has no patient.
//
// OWNER DECISION 2026-10-17 — it records who the sentence is ABOUT, not which
// block it was printed in. The two usually agree, but not always, and a field
// recording mere provenance would have marked 4,639 correct showings wrong:
// `adultPcv20or21Complete` sits under Special situations and says "Adults aged
// 19 years and older"; `pedsRoutine4Dose` sits under Routine vaccination, and
// CDC's at-risk rows start at Age 2-5, so the routine infant series is an
// at-risk baby's series too. Each entry's comment says which it is and why.
//
// A card that cites another group's rule ON PURPOSE — to explain a boundary,
// or to say what the patient does NOT have — marks that at the call site:
// `cite(key, { aboutAnotherGroup: 'why' })`. The guard skips those, and a
// separate assertion pins the exact set of keys allowed to do it, so a new
// exception cannot be added quietly.
export const POPULATIONS = [
  'child-routine',   // no risk condition the paediatric schedule recognises
  'child-nonIC',     // CDC's non-immunocompromising "Special situations" list
  'child-IC',        // CDC's immunocompromising list
  'adult-19to49',    // CDC's adult "Special situations" block
  'adult-50plus',    // CDC's adult "Routine vaccination" block
];

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
    // Patients this sentence is about: the ** footnote to the Age 19-49 heading, enumerating who qualifies
    population: ['adult-19to49'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Immunization Schedule — pneumococcal, the risk-factor footnote to "Age 19–49 years with certain underlying medical conditions or other risk factors"',
    short: 'CDC Adult Notes',
    quote: 'Underlying medical conditions or other risk factors include alcoholism, chronic heart/liver/lung disease, chronic renal failure, cigarette smoking',
    lastVerified: '2026-10-10',
  },
  cdcChildSpecialSituations: {
    rulebook: 'child',
    // Patients this sentence is about: it IS the non-IC list's header, enumerating that list
    population: ['child-nonIC'],
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
    // Patients this sentence is about: Routine vaccination, Age 50 years or older
    population: ['adult-50plus'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal, routine vaccination at age 50+ with no prior PCV or unknown history',
    short: 'CDC Adult Notes',
    quote: 'Not previously received a dose of PCV13, PCV15, PCV20, or PCV21 or whose previous vaccination history is unknown: 1 dose PCV15 or 1 dose PCV20 or 1 dose PCV21.',
    lastVerified: '2026-10-10',
  },
  adultPcv15ThenPpsv: {
    rulebook: 'adult',
    // Patients this sentence is about: printed identically in both adult blocks
    population: ['adult-19to49', 'adult-50plus'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal, the PCV15 -> PPSV23 interval of >=1 year, with 8 weeks named as a minimum that MAY be considered for an immunocompromising condition, cochlear implant or CSF leak. This is the citation for the YEAR: every adult 50+, and 19-49 with chronic conditions only',
    short: 'CDC Adult Notes',
    quote: 'If PCV15 is used, administer 1 dose PPSV23 at least 1 year after the PCV15 dose (may use minimum interval of 8 weeks for adults with an immunocompromising condition,',
    lastVerified: '2026-10-16',
  },
  // C8, CDC Adult Notes' last uncredited statement (2026-10-22). On the
  // 19-49 immunocompromising / cochlear implant / CSF leak card the INTERVAL
  // sentence cites ACIP (the 8 weeks), so CDC's notes sat on the card as a
  // grey button that no number pointed at -- on 25 cards. This is what they
  // are credited FOR: the requirement itself, that a PCV15 is not a complete
  // series until the PPSV23 is given.
  //
  // Read live 2026-10-22 with the pneumococcal accordion panels expanded and
  // walked as nested <li> elements, not as flat text (FINDING K's lesson).
  // The sentence is printed TWICE, identically -- under "Age 50 years or
  // older who have:" in the routine panel and under "Age 19-49 years with
  // certain underlying medical conditions or other risk factors** who have:"
  // in the special-situations panel -- so it is about both adult bands. In
  // each place its parent is "Not previously received a PCV13, PCV15, PCV20,
  // or PCV21 ... : 1 dose PCV15 or 1 dose PCV20 or 1 dose PCV21", i.e. the
  // row that CALLED FOR the PCV15 this patient has already had; the quoted
  // clause is that row's own instruction for what follows it. Same shape as
  // the owner's 2026-10-18 ruling on the 576 ("cite the row the dose
  // satisfied"), and the app already reads it this way for the >=1-year
  // patients through `adultPcv15ThenPpsv`.
  //
  // The quote stops at "1 dose PPSV23" ON PURPOSE. CDC's sentence continues
  // "at least 1 year after the PCV15 dose", and this patient is being told 8
  // weeks on ACIP's recommendation. Quoting the year to her would be a
  // right-sounding sentence aimed at the wrong patient. The INTERVAL has one
  // home and it is not here: `adultPcv15ThenPpsvShort`.
  adultPcv15NeedsPpsvCompletion: {
    rulebook: 'adult',
    // Patients this sentence is about: printed identically under the >=50
    // parent and the 19-49 at-risk parent, so both.
    population: ['adult-19to49', 'adult-50plus'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal: a PCV15 is not a complete series on its own; a PPSV23 must follow it. Cited for the REQUIREMENT, never for the interval — this card states ACIP\'s 8 weeks, which has its own citation',
    short: 'CDC Adult Notes',
    quote: 'If PCV15 is used, administer 1 dose PPSV23',
    lastVerified: '2026-10-22',
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
    // Patients this sentence is about: mm7401a1's clinical guidance table, the 19-49 IC / CSF / cochlear row
    population: ['adult-19to49'],
    url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm',
    label: 'ACIP 2025 (MMWR mm7401a1) — for adults aged 19-49 years with an immunocompromising condition, a CSF leak, or a cochlear implant, PPSV23 follows PCV15 by >=8 weeks. CDC\'s March 2025 Adult Pneumococcal Vaccine Timing Job Aid prints the same >=8 weeks on its 19-49 immunocompromising (p.2) and cochlear implant / CSF leak (p.3) pages',
    // The chip's name is deliberately AGE-NEUTRAL and must stay that way
    // (OWNER DECISION 2026-10-22). It used to read "MMWR >=50 expansion",
    // after the paper's own title -- but the app uses the clinical guidance
    // table INSIDE that paper for adults from 19 up, so 1,015 cards were
    // showing an under-50 patient a button that named a document about people
    // 50 and over. One name for one paper, with no age in it; the age band a
    // given sentence is about is carried by `population`, not by the chip.
    // Guard: regression-2026-10-22-chip-name-fits-the-patient.test.jsx.
    short: 'ACIP 2025 Adult MMWR',
    quote: 'If PCV15 is used, administer a single dose of PPSV23* ≥8 weeks after the PCV15 dose.',
    lastVerified: '2026-10-16',
  },
  adultPcv13Only: {
    rulebook: 'adult',
    // Patients this sentence is about: printed identically in both adult blocks
    population: ['adult-19to49', 'adult-50plus'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal, previously received only PCV13',
    short: 'CDC Adult Notes',
    quote: 'Previously received only PCV13: 1 dose PCV20 or 1 dose PCV21 at least 1 year after the last PCV13 dose.',
    lastVerified: '2026-10-10',
  },
  // The 19-49 twin of `adultPpsvOnly` above (patient-population field,
  // 2026-10-17). Same advice, different sentence: CDC writes "or PCV21," with
  // a comma in the 19-49 block and "or 1 dose PCV21" in the 50+ one. The app
  // showed the 50+ sentence to 230 19-49 patients. Read live 2026-10-17,
  // exactly once, in Special situations.
  adultPpsvOnly1949: {
    rulebook: 'adult',
    // Patients this sentence is about: Special situations, Age 19-49
    population: ['adult-19to49'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal "Special situations", an adult aged 19-49 who previously received only PPSV23',
    short: 'CDC Adult Notes',
    quote: 'Previously received only PPSV23: 1 dose PCV15 or 1 dose PCV20 or PCV21, at least 1 year after the last PPSV23 dose. If PCV15 is used, no additional PPSV23 doses are recommended.',
    lastVerified: '2026-10-17',
  },
  adultPpsvOnly: {
    rulebook: 'adult',
    // Patients this sentence is about: Routine 50+; the 19-49 twin is adultPpsvOnly1949
    population: ['adult-50plus'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal, previously received only PPSV23',
    short: 'CDC Adult Notes',
    quote: 'Previously received only PPSV23: 1 dose PCV15 or 1 dose PCV20 or 1 dose PCV21 at least 1 year after the last PPSV23 dose.',
    lastVerified: '2026-10-10',
  },
  // The 19-49 row for a PCV13 + one PPSV23 history (patient-population field,
  // 2026-10-17). CDC splits that history in two at 19-49: this half for
  // cochlear implant / CSF leak / an immunocompromising condition, and
  // `adultChronicOnlyReviewAt50` for chronic conditions. The app gave both
  // halves the right advice while quoting the 50+ row, which is a different
  // patient; 190 cards carried it where the advice agreed, and 175 where it
  // contradicted the card (FINDING C, fixed separately). Read live
  // 2026-10-17, exactly once, in Special situations.
  adultIc1949BothPcv13Ppsv: {
    rulebook: 'adult',
    // Patients this sentence is about: Special situations, Age 19-49, the IC / cochlear implant / CSF leak half
    population: ['adult-19to49'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal "Special situations", an adult aged 19-49 with a cochlear implant, CSF leak or immunocompromising condition who has had PCV13 and one PPSV23',
    short: 'CDC Adult Notes',
    quote: 'Cochlear implant, cerebrospinal fluid leak, or an immunocompromising condition*: 1 dose PCV20 or 1 dose PCV21 at least 5 years after the last pneumococcal vaccine dose.',
    lastVerified: '2026-10-17',
  },
  adultBothNotAt65: {
    rulebook: 'adult',
    // Patients this sentence is about: Routine 50+; the 19-49 rows for this history are adultIc1949BothPcv13Ppsv and adultChronicOnlyReviewAt50
    population: ['adult-50plus'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal, PCV13 + PPSV23 where no PPSV23 was given at 65+',
    short: 'CDC Adult Notes',
    quote: 'Previously received both PCV13 and PPSV23 but NO PPSV23 was received at age 65 years or older: 1 dose PCV20 or 1 dose PCV21 at least 5 years after the last pneumococcal vaccine dose.',
    lastVerified: '2026-10-10',
  },
  adultBothAt65: {
    rulebook: 'adult',
    // Patients this sentence is about: Routine 50+, and its content is about a dose given at 65 or older
    population: ['adult-50plus'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal, PCV13 + PPSV23 with PPSV23 given at 65+ (shared clinical decision-making)',
    short: 'CDC Adult Notes',
    quote: 'Previously received both PCV13 and PPSV23, AND PPSV23 was received at age 65 years or older: Based on shared clinical decision',
    lastVerified: '2026-10-10',
  },
  // FINDING C (2026-10-17). CDC's 19-49 "Special situations" block splits the
  // PCV13 + 1 PPSV23 patient in two: cochlear implant / CSF leak / an
  // immunocompromising condition get PCV20 or PCV21 at >=5 years, and chronic
  // conditions get nothing now with a re-check at 50. The app gave both halves
  // the right ADVICE and quoted `adultBothNotAt65` for both — a sentence from
  // the Routine 50+ block that instructs a dose. On the chronic-only card that
  // quote contradicted the card it sat on, for 175 of the grid's 16,008
  // patients. This is the sentence that card rests on.
  //
  // Read live 2026-10-17 (browser pane, accordions expanded; pneumococcal note
  // 4,785 chars, "Special situations" present at offset 1,764 as the positive
  // control that both blocks were in the fetched text). It appears exactly
  // ONCE on the page, in the 19-49 block — which is the whole point: it has no
  // 50+ twin, because at 50 the answer changes.
  adultChronicOnlyReviewAt50: {
    rulebook: 'adult',
    // Patients this sentence is about: Special situations, Age 19-49, the chronic-conditions half
    population: ['adult-19to49'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal "Special situations", an adult aged 19-49 with chronic conditions only who has had PCV13 and one PPSV23: no further dose now, re-check at age 50',
    short: 'CDC Adult Notes',
    quote: 'Alcoholism, chronic heart/liver/lung disease, cigarette smoking, or diabetes mellitus: no additional PCV or PPSV23 doses recommended at this time. Review pneumococcal recommendations when age 50 years or older.',
    lastVerified: '2026-10-17',
  },
  adultPcv20or21Complete: {
    rulebook: 'adult',
    // Patients this sentence is about: printed under Special situations, but its own words are "Adults aged 19 years and older"
    population: ['adult-19to49', 'adult-50plus'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
    label: 'CDC Adult Schedule Notes — pneumococcal, a series containing PCV20 or PCV21 is complete',
    short: 'CDC Adult Notes',
    quote: 'Adults aged 19 years and older who have received PCV20 or PCV21: no additional pneumococcal vaccine dose recommended.',
    lastVerified: '2026-10-10',
  },
  adultPcv7Only: {
    rulebook: 'adult',
    // Patients this sentence is about: printed identically in both blocks; "the recommendation above" resolves within whichever block the reader is in
    population: ['adult-19to49', 'adult-50plus'],
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
    // Patients this sentence is about: printed under Routine vaccination, but CDC's at-risk rows start at Age 2-5, so the routine infant series IS an at-risk baby's series
    population: ['child-routine', 'child-nonIC', 'child-IC'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal, routine infant 4-dose PCV series',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Routine vaccination with PCV 4-dose series at 2, 4, 6, 12–15 months',
    lastVerified: '2026-10-10',
  },
  pedsHealthyCatchup: {
    rulebook: 'child',
    // Patients this sentence is about: its own words: "Healthy children ages 2-4 years"
    population: ['child-routine'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal, catch-up for healthy children 2-4 years',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Healthy children ages 2–4 years with any incomplete* PCV series: 1 dose PCV',
    lastVerified: '2026-10-10',
  },
  pedsNoPcv20IfComplete: {
    rulebook: 'child',
    // Patients this sentence is about: its own words: "For children without risk conditions"
    population: ['child-routine'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal, PCV20 not indicated for a child without risk conditions who already completed an age-appropriate series',
    short: 'CDC Child/Adolescent Notes',
    quote: 'For children without risk conditions, PCV20 is not indicated if they have received 4 doses of PCV13 or PCV15 or another age appropriate complete PCV series.',
    lastVerified: '2026-10-10',
  },
  // The IC twin of `pedsRisk6to18NoPcv` below (patient-population field,
  // 2026-10-17). The two differ by one phrase — CDC writes "1 dose of PCV15 or
  // 1 dose of PCV20" in the IC list and "1 dose of PCV15 or PCV20" in the
  // non-IC one — which is exactly why one key could not honestly serve both.
  // 198 immunocompromised children's cards carried the non-IC sentence. Read
  // live 2026-10-17, exactly once, in the immunocompromising list.
  pedsIc6to18NoPcv: {
    rulebook: 'child',
    // Patients this sentence is about: IC list, Age 6-18
    population: ['child-IC'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal, the IMMUNOCOMPROMISING list, age 6-18 with no previous PCV13, PCV15 or PCV20',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Not previously received any dose of PCV13, PCV15, or PCV20: administer 1 dose of PCV15 or 1 dose of PCV20. If PCV15 is used and no previous receipt of PPSV23, administer 1 dose of PPSV23 at least 8 weeks after the PCV15 dose.',
    lastVerified: '2026-10-17',
  },
  pedsRisk6to18NoPcv: {
    rulebook: 'child',
    // Patients this sentence is about: non-IC list, Age 6-18 (the IC twin is pedsIc6to18NoPcv)
    population: ['child-nonIC'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal "Special situations", at-risk 6-18 years with no prior PCV13/15/20 (and the 8-week PCV15 -> PPSV23 interval)',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Not previously received any dose of PCV13, PCV15, or PCV20: administer 1 dose of PCV15 or PCV20. If PCV15 is used and no previous receipt of PPSV23, administer 1 dose of PPSV23 at least 8 weeks after the PCV15 dose.',
    lastVerified: '2026-10-10',
  },
  // FINDING K (2026-10-18) — THESE THREE ENTRIES WERE ONE, AND THE ONE WAS
  // CITED TO THE WRONG PATIENT 904 TIMES.
  //
  // CDC does not print "Previously received at least 1 dose of PCV20: no
  // further PCV or PPSV23 doses needed" as a rule. It prints it as a SUB-BULLET,
  // four times, and each parent carries conditions of its own:
  //
  //   Age 6-18 years
  //     - Received PCV before age 6 years but have not received PPSV23
  //         - ... no further PCV or PPSV23 doses needed             [non-IC]
  //         - ... no additional dose of PCV or PPSV23                   [IC]
  //   Age 2-5 years
  //     - Completed recommended PCV series but have not received PPSV23
  //         - ... no further PCV or PPSV23 doses needed    [both, same words]
  //
  // One entry held the non-IC wording with `population: ['child-nonIC',
  // 'child-IC']` and the comment "printed in both at-risk lists, same
  // instruction". Read as a flat sentence that is nearly true. Read in its
  // nesting it is wrong twice over: the IC instance at 6-18 uses DIFFERENT
  // words, and the parent restricts the patient by both age at the prior dose
  // and PPSV23 history. `population` cannot see either — it records the patient
  // GROUP, and this is a split on vaccine history.
  //
  // So the quotes stay verbatim and contiguous (a joined parent + sub-bullet
  // string exists nowhere on the page, which is exactly how `pedsMinAge`'s deep
  // link came to match nothing), the LABEL names the branch the sentence sits
  // under so a clinician hovering sees the condition, and the engine is held to
  // citing each one only inside its own branch by
  // `regression-finding-k-2026-10-18-nested-bullet-conditions.test.js`.
  //
  // Read live 2026-10-18 with the accordion expanded. All three are in
  // `accordion-panel-pneumo-situations`, which a plain page fetch never returns.
  pedsRiskPcv20Complete: {
    rulebook: 'child',
    // Patients this sentence is about: non-IC list, Age 6-18, under the parent
    // "Received PCV before age 6 years but have not received PPSV23"
    population: ['child-nonIC'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal "Special situations", age 6-18 who received PCV before age 6 and no PPSV23: a prior PCV20 completes the series',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Previously received at least 1 dose of PCV20: no further PCV or PPSV23 doses needed',
    lastVerified: '2026-10-18',
  },
  pedsIcPcv20Complete: {
    rulebook: 'child',
    // Patients this sentence is about: IC list, Age 6-18, under the same parent.
    // Its WORDS differ from the non-IC twin above; do not let the two swap places.
    population: ['child-IC'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal, the IMMUNOCOMPROMISING list, age 6-18 who received PCV before age 6 and no PPSV23: a prior PCV20 completes the series',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Previously received at least 1 dose of PCV20: no additional dose of PCV or PPSV23',
    lastVerified: '2026-10-18',
  },
  pedsRiskPcv20CompleteAt2: {
    rulebook: 'child',
    // Patients this sentence is about: the Age 2-5 instance, printed in both
    // lists in the SAME words, under "Completed recommended PCV series but have
    // not received PPSV23". Cited by the under-2 card whose own sentence says
    // "at age 2 years or later" — the age this quote is about.
    population: ['child-nonIC', 'child-IC'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal "Special situations", age 2-5 who completed the PCV series and has no PPSV23: a prior PCV20 completes the series',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Previously received at least 1 dose of PCV20: no further PCV or PPSV23 doses needed',
    lastVerified: '2026-10-18',
  },
  // FINDING K. CDC's Risk-based page states the completion in words for the one
  // history its 6-18 section does cover without an at-or-before-6 condition: a
  // child whose PCV20 was their FIRST conjugate ever. Read live 2026-10-18; the
  // sentence occurs exactly once as a leaf element on the page (checked, because
  // the page states a completion several times and only this instance sits under
  // a branch heading these patients match), under the H3 "Never received PCV13,
  // PCV15, or PCV20" inside "Children 6 through 18 years old".
  //
  // The branch's own first line is what makes it fit a child who already had a
  // PPSV23: "Give it regardless of whether the child has previously received
  // PPSV23 or PCV7."
  pedsRiskPcv20FirstConjugate: {
    rulebook: 'child',
    // Patients this sentence is about: at-risk 6-18, printed once, in a section
    // that does not split by risk class — CDC's two 6-18 branches below it do
    population: ['child-nonIC', 'child-IC'],
    url: 'https://www.cdc.gov/pneumococcal/hcp/vaccine-recommendations/risk-indications.html',
    label: 'CDC Risk-based Pneumococcal Recommendations — at-risk child 6-18 who had never received PCV13, PCV15 or PCV20: a PCV20 completes the series with no PPSV23 follow-up',
    short: 'CDC Risk-based Pneumococcal',
    quote: "It doesn't need to be followed by a dose of PPSV23. Their pneumococcal vaccinations are complete.",
    lastVerified: '2026-10-18',
  },
  // FINDING K. p2016 Table 4's row for a child who completed before age 6 WITH a
  // PCV20 — quoted here for the first time, because it is the only document with
  // a row that fits a 6-18 year old who did that AND has since had a PPSV23
  // (CDC's notes bullet for them is the one above, whose parent says "but have
  // not received PPSV23"). The row states no PPSV23 condition at all, so a prior
  // PPSV23 does not break it.
  //
  // Transcribed cell by cell from a live download 2026-10-18 (HTTP 200, 211,252
  // bytes, Item #P2016 of 2/16/2024) laid out with `scripts/pdfLayout.py`, which
  // keeps each cell tied to its own row and column. The row, in full:
  //   Child's age now            | 2 through 18 years (any risk condition)
  //   Number of previous PCV13,  | Completed PCV series before age 6 years,
  //     PCV15, or PCV20 doses    |   including one or more doses of PCV20
  //   Option A                   | No additional doses
  //   Option B (if applicable)   | (blank)
  // The quote joins the history column to Option A, which is how the table is
  // read across; the PDF deep-links by page, so no text fragment depends on it.
  p2016CompletedBefore6WithPcv20: {
    rulebook: 'child',
    // Patients this cell is about: both risk classes — the row is headed
    // "(any risk condition)" — age 2 through 18
    population: ['child-nonIC', 'child-IC'],
    url: 'https://www.immunize.org/wp-content/uploads/catg.d/p2016.pdf',
    label: 'immunize.org p2016 Table 4 — a child 2-18 with any risk condition who completed the PCV series before age 6 including a PCV20: no additional doses',
    short: 'immunize.org p2016',
    quote: 'Completed PCV series before age 6 years, including one or more doses of PCV20 — No additional doses',
    pdfPage: 2,
    lastVerified: '2026-10-18',
  },
  pedsRiskPcv13At6: {
    rulebook: 'child',
    // Patients this sentence is about: printed in both lists; the IC instance continues with the five-year tail, which the IC card cites separately
    population: ['child-nonIC', 'child-IC'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal "Special situations", at-risk child who received PCV13 only at or after age 6',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Received PCV13 only at or after age 6 years: administer 1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after the most recent PCV13 dose.',
    lastVerified: '2026-10-10',
  },
  // FINDING B (2026-10-17). Found by RE-READING a source the app already cites
  // -- which is the whole point of Finding B: the tool that picked C7's six
  // documents lists only sources a card names but never quotes, so a document
  // that IS cited could never appear in its scope.
  //
  // `recommend.js`'s branch for "PCV13 at/after age 6, PPSV23 already given"
  // carried a comment saying no source states that history and that its five
  // years was read across from p2016's Option B. CDC states it outright, in
  // the IC list, and had done all along. Read live 2026-10-17 with the
  // accordions expanded (they are shut by default, which is how the whole
  // paediatric risk rulebook stays invisible to a plain page fetch).
  //
  // Note what it CONJOINS: 8 weeks from the last PCV13 *and* 5 years from dose
  // 1 PPSV23. That is the "later of the two" gate `icPostPpsv23DueState()`
  // implements, which Finding A had reasoned its way to rather than quoted.
  //
  // Its non-IC twin, three lines earlier on the same page, is `pedsRiskDone`
  // below -- same opening words, opposite instruction ("no further doses of
  // any PCV or PPSV23 indicated"). Do not let the two swap places.
  pedsIcPcv13AndPpsvAt6: {
    rulebook: 'child',
    // Patients this sentence is about: IC list, Age 6-18
    population: ['child-IC'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal "Special situations", IMMUNOCOMPROMISING list: PCV13 + PPSV23 at or after age 6 still owes a dose, at 8 weeks AND 5 years',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Received 1 dose PCV13 and 1 dose PPSV23 at or after age 6 years: administer 1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after the most recent PCV13 dose and at least 5 years after dose 1 PPSV23.',
    lastVerified: '2026-10-17',
  },

  pedsRiskDone: {
    rulebook: 'child',
    // Patients this sentence is about: non-IC list only; the IC row three lines later says the opposite
    population: ['child-nonIC'],
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
    // Patients this sentence is about: the section heading, printed above every block, so it is about every child
    population: ['child-routine', 'child-nonIC', 'child-IC'],
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
    // Patients this sentence is about: IC list only, twice
    population: ['child-IC'],
    url: 'https://www.cdc.gov/pneumococcal/hcp/vaccine-recommendations/risk-indications.html',
    label: 'CDC Risk-based Pneumococcal Recommendations — when PPSV23 is used for an at-risk child, a further pneumococcal vaccine follows at least 5 years later',
    short: 'CDC Risk-based Pneumococcal',
    quote: 'When PPSV23 is used, they need another pneumococcal vaccine at least 5 years later.',
    lastVerified: '2026-10-10',
  },
  // FINDING A (2026-10-17). The sentence CDC writes for a child who has
  // ALREADY had one PPSV23 -- not for one who is about to get their first.
  // `pedsSecondPpsv5y` below carries the right NUMBER but is written about the
  // other patient ("When PPSV23 is used, they need another pneumococcal
  // vaccine at least 5 years later" sits under CDC's "Never received PPSV23"
  // branch), and a right-sounding quote about a different patient is the exact
  // fault C6/G4 exist to catch. Read live in the browser 2026-10-17 from the
  // page dated MAY 8, 2026; cdc.gov refuses curl, so this was copied from the
  // rendered page, not transcribed from a note.
  //
  // CDC prints it twice, word for word, under "Children 2 through 5 years old"
  // and under "Children 6 through 18 years old". The quote below is the 6-18
  // instance; the 2-5 instance differs only in the heading above it.
  //
  // It is also the sentence that overrules immunize.org P2016's footnote || --
  // see the OWNER DECISION of 2026-10-17 in CLAUDE.md and the full argument in
  // regression-2026-10-17-finding-a-ic-ppsv23-five-year-wait.test.js.
  pedsIcPpsvWaitFiveYears: {
    rulebook: 'child',
    // Patients this sentence is about: under that page's "Immunocompromising condition" heading
    population: ['child-IC'],
    url: 'https://www.cdc.gov/pneumococcal/hcp/vaccine-recommendations/risk-indications.html',
    label: 'CDC Risk-based Pneumococcal Recommendations — an immunocompromised child who has already received one PPSV23 waits 5 years from that dose, then gets PCV20 or PPSV23',
    short: 'CDC Risk-based Pneumococcal',
    quote: 'Then no pneumococcal vaccines are recommended at this time. Wait until at least 5 years have passed since they received their first PPSV23 dose. Then give 1 dose of PCV20 or PPSV23.',
    lastVerified: '2026-10-17',
  },

  pedsBefore6NoPcv20: {
    rulebook: 'child',
    // Patients this sentence is about: a 6-18y heading printed above BOTH the IC and non-IC sub-blocks
    population: ['child-nonIC', 'child-IC'],
    url: 'https://www.cdc.gov/pneumococcal/hcp/vaccine-recommendations/risk-indications.html',
    label: 'CDC Risk-based Pneumococcal Recommendations — the 6-18y row for a child who received PCV13 or PCV15 before age 6 and never PCV20',
    short: 'CDC Risk-based Pneumococcal',
    quote: 'Received PCV13 or PCV15 before age 6 years, never received PCV20',
    lastVerified: '2026-10-10',
  },

  // (continued) Child & adolescent sentences, verified the same way.
  pedsRiskIncompleteCatchup: {
    rulebook: 'child',
    // Patients this sentence is about: printed in both lists, Age 2-5, identical
    population: ['child-nonIC', 'child-IC'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal "Special situations", at-risk 2-5y with fewer than 3 prior PCV doses',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Less than 3 PCV doses: 2 doses PCV (at least 8 weeks after the most recent dose and administered at least 8 weeks apart)',
    lastVerified: '2026-10-10',
  },
  // FINDING D (2026-10-17). The IC twin of `pedsRiskPcv20orPpsv23` below.
  //
  // CDC prints this row in BOTH at-risk lists and the two are not the same
  // sentence. The non-IC one stops at the 8 weeks (and repeats the word
  // "administer" — CDC's typo, kept verbatim, and the tell for which block a
  // quote came from). The IC one goes on to require the five-year follow-on
  // dose. Until this entry existed only the non-IC sentence had a key, so an
  // immunocompromised child's card quoted the sentence that omits the dose
  // their own row owes them.
  //
  // Read live 2026-10-17 (browser pane, accordions expanded; pneumococcal note
  // 5,021 chars, both at-risk block headers found at offsets 398 and 1,972 as
  // the positive control). Appears exactly ONCE, in the immunocompromising
  // list's "Age 2-5 years" section — confirmed by the text that follows it on
  // the page being the "Age 6-18 years" heading. No trailing full stop in the
  // source; it is quoted as printed.
  pedsIcPcv20orPpsv23: {
    rulebook: 'child',
    // Patients this sentence is about: IC list only, and the only one of the pair carrying the five-year follow-on
    population: ['child-IC'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal, the IMMUNOCOMPROMISING list, age 2-5: a child who completed the PCV series without PCV20 and without PPSV23, including the second dose owed five years later',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Not previously received PCV20: administer 1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after the most recent PCV dose. If PPSV23 is used, administer 1 dose of PCV20 or dose 2 PPSV23 at least 5 years after dose 1 PPSV23',
    lastVerified: '2026-10-17',
  },
  // The NON-immunocompromising twin. Its label said only "at-risk child",
  // which is what let it be used for both classes; it now says which list it
  // is from. The quote is unchanged and still verbatim (re-counted live
  // 2026-10-17: once, in the non-IC list).
  pedsRiskPcv20orPpsv23: {
    rulebook: 'child',
    // Patients this sentence is about: non-IC list only; CDC's repeated "administer" is the tell
    population: ['child-nonIC'],
    url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo',
    label: 'CDC Child & Adolescent Schedule Notes — pneumococcal, the NON-immunocompromising "Special situations" list: a child who completed the PCV series without PCV20 and without PPSV23',
    short: 'CDC Child/Adolescent Notes',
    quote: 'Not previously received PCV20: administer 1 dose PCV20 or 1 dose PPSV23 administer at least 8 weeks after the most recent PCV dose.',
    lastVerified: '2026-10-17',
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

  // ── C8, document 2's CITEs (2026-10-17): the job aid's own sentences ───
  //
  // The six entries below are the app's FIRST quoted PDF. Every quoted source
  // before them was a web page, and two things follow from the difference:
  //
  //   1. `#:~:text=` does not work in a PDF viewer, so each declares
  //      `pdfPage` and `highlightUrl()` emits `#page=N` instead. A quoted PDF
  //      without `pdfPage` is a dead link that looks live; `refs.test.js`
  //      fails on one.
  //   2. This document prints a DIFFERENT interval for a different patient on
  //      each of its four pages, so the page IS part of the citation. The
  //      `label` names the page and the table row; `population` names who the
  //      sentence is about.
  //
  // ⚠ READ THIS BEFORE RE-VERIFYING ANY QUOTE BELOW. The embedded font maps
  // the fi/fl ligature glyph to a bare "f" in its ToUnicode table, so EVERY
  // extractor drops the character after the f: the document's "fluid" comes
  // out as "fuid", "specified" as "specifed", "deficiency" as "defciency".
  // Measured 2026-10-17 with two independent extractors (scripts/pdfLayout.py
  // and pypdf 6.13.0): the two-letter sequence "fi" occurs ZERO times across
  // all four pages, and U+FB01/U+FB02 zero times — impossible for a document
  // containing "specified immunocompromising conditions". The quotes below are
  // written as the document READS, with the dropped letters restored.
  // `docs/archive/c7-2026-10-17-source-readings.md` recorded "fuid" as "the
  // document's own typo"; that is wrong, and this is the correction.
  //
  // The duplicated "leak" in "cerebrospinal fluid leak (CSF) leak" IS the
  // document's own, and stays — it is not a ligature case.
  //
  // Read positionally, never from a flat dump: pypdf reads (G) below with the
  // row's left-hand cells spliced into the middle of the sentence, because
  // they are a different column of the same table row. That is the exact way
  // a right-sounding quote gets assembled out of two unrelated patients.
  jobAidSeriesCompleteAt50: {
    rulebook: 'adult',
    // Patients this sentence is about: it is page 1's cell, and page 1 is the >=50 page. Pages 2-4 answer the SAME history with "review again at 50" instead, which is why this quote must never be shown below 50 (document 2, decision 2)
    population: ['adult-50plus'],
    url: 'https://www.cdc.gov/pneumococcal/downloads/Vaccine-Timing-Adults-JobAid.pdf',
    pdfPage: 1,
    label: 'CDC Adult Pneumococcal Vaccine Timing Job Aid (NCIRD, March 2025) — p.1 "Adults \u226550 years old", the row "PCV15 & PPSV23 OR PCV20 OR PCV21 / at any age", spanning both Option A and Option B',
    short: 'CDC Adult Timing Job Aid',
    quote: 'No vaccines recommended; schedule is complete.',
    lastVerified: '2026-10-17',
  },
  jobAidSharedDecision65: {
    rulebook: 'adult',
    // Patients this sentence is about: its own words, "adults >=65 years old". >=65 sits inside Routine 50+; the card it appears on fires only when the PPSV23 dose was given at >=65, which implies the patient is >=65
    population: ['adult-50plus'],
    url: 'https://www.cdc.gov/pneumococcal/downloads/Vaccine-Timing-Adults-JobAid.pdf',
    pdfPage: 1,
    label: 'CDC Adult Pneumococcal Vaccine Timing Job Aid (NCIRD, March 2025) — p.1, the section "Shared clinical decision-making for those who already completed the series with PCV13 and PPSV23", row "Complete series: PCV13 at any age & PPSV23 at \u226565 yrs"',
    short: 'CDC Adult Timing Job Aid',
    quote: 'Together, with the patient, vaccine providers may choose to administer PCV20 or PCV21 to adults \u226565 years old who have already received PCV13 (but not PCV15, PCV20, or PCV21) at any age and PPSV23 at or after the age of 65 years old.',
    lastVerified: '2026-10-17',
  },
  jobAidChronic1949ReviewAt50: {
    rulebook: 'adult',
    // Patients this sentence is about: page 4 is headed "Adults 19-49 years old with chronic health conditions", and this is its PCV13 + PPSV23 row. Note the wording differs from the same row on pp.2-3 ("No vaccines ARE recommended"), and p.4's row has no Option A at all -- pp.2-3 give PCV20/21 at >=5 years, p.4 gives nothing until 50. That split IS the engine's chronic-only branch
    population: ['adult-19to49'],
    url: 'https://www.cdc.gov/pneumococcal/downloads/Vaccine-Timing-Adults-JobAid.pdf',
    pdfPage: 4,
    label: 'CDC Adult Pneumococcal Vaccine Timing Job Aid (NCIRD, March 2025) — p.4 "Adults 19\u201349 years old with chronic health conditions", the row "PCV13\u2020 and PPSV23 at any age", which has no Option A: no dose now, review at 50',
    short: 'CDC Adult Timing Job Aid',
    quote: 'No vaccines are recommended at this time. Review pneumococcal vaccine recommendations again when your patient turns 50 years old.',
    lastVerified: '2026-10-17',
  },
  jobAidEightWeekOptionAt50: {
    rulebook: 'adult',
    // Patients this sentence is about: it is page 1's footnote dagger, printed against the >=50 ">=1 year" cells. This is the sentence that makes 8 weeks an OPTION at 50+ rather than the recommendation -- the distinction CLAUDE.md forbids collapsing, and the reason the app names it only here
    population: ['adult-50plus'],
    url: 'https://www.cdc.gov/pneumococcal/downloads/Vaccine-Timing-Adults-JobAid.pdf',
    pdfPage: 1,
    label: 'CDC Adult Pneumococcal Vaccine Timing Job Aid (NCIRD, March 2025) — p.1, footnote \u2020 to the "Adults \u226550 years old" table, naming 8 weeks as a minimum interval that may be CONSIDERED (not recommended) for an immunocompromising condition, cochlear implant or CSF leak',
    short: 'CDC Adult Timing Job Aid',
    quote: 'Consider minimum interval (8 weeks) for adults with an immunocompromising condition, cochlear implant, or cerebrospinal fluid leak (CSF) leak',
    lastVerified: '2026-10-17',
  },
  jobAidPcv7CountsAsNone: {
    rulebook: 'adult',
    // Patients this sentence is about: footnote * is printed on ALL FOUR pages, against every "None*" row, so it speaks to every adult the job aid covers
    population: ['adult-19to49', 'adult-50plus'],
    url: 'https://www.cdc.gov/pneumococcal/downloads/Vaccine-Timing-Adults-JobAid.pdf',
    pdfPage: 1,
    label: 'CDC Adult Pneumococcal Vaccine Timing Job Aid (NCIRD, March 2025) — footnote * to the "None*" row, printed on all four pages: a PCV7-only history is treated as no pneumococcal history',
    short: 'CDC Adult Timing Job Aid',
    quote: 'Also applies to people who received PCV7 at any age and no other pneumococcal vaccines',
    lastVerified: '2026-10-17',
  },
  jobAidPpsv23Unavailable: {
    rulebook: 'adult',
    // Patients this sentence is about: footnote pilcrow is printed on ALL FOUR pages, against every PPSV23 cell, so it speaks to every adult the job aid covers. This is the ONLY source in the app that states the substitution, and the claim carried no citation at all before C8
    population: ['adult-19to49', 'adult-50plus'],
    url: 'https://www.cdc.gov/pneumococcal/downloads/Vaccine-Timing-Adults-JobAid.pdf',
    pdfPage: 1,
    label: 'CDC Adult Pneumococcal Vaccine Timing Job Aid (NCIRD, March 2025) — footnote \u00b6 to every PPSV23\u00b6 cell, printed on all four pages: PCV20 or PCV21 may stand in for an unavailable PPSV23',
    short: 'CDC Adult Timing Job Aid',
    quote: 'If PPSV23 is not available, PCV20 or PCV21 may be used',
    lastVerified: '2026-10-17',
  },
  // ── C8, document 1's CITEs (2026-10-17): mm7401a1's own sentences ─────
  //
  // Document 1's REMOVALS landed first: mm7401a1 came off the 5,331 cards it
  // does not speak for and kept 2,544 where it does. These seven credit those.
  //
  // Read live 2026-10-17 from https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm
  // through the browser pane — cdc.gov serves curl a shell, not the body. Six
  // are cells of the TABLE "Clinical guidance for implementing pneumococcal
  // vaccine recommendations for adults aged >=19 years"; the seventh is body
  // prose.
  //
  // ⚠ THE TRAP: the table has THREE blocks (>=50, 19-49 immunocompromising /
  // CSF leak / cochlear implant, 19-49 chronic) and each carries a row for the
  // SAME history, worded differently. "None or PCV7 only" is >=1 year in two
  // blocks and >=8 weeks in the IC one (S15, already `adultPcv15ThenPpsvShort`).
  // "PCV13 only" differs by the single word "administered". And the IC block's
  // "PCV13 + PPSV23" splits AGAIN on the NUMBER of PPSV23 doses — a split
  // `population` cannot see, because it is not an age band. Quoting a
  // neighbouring row here is the exact way a right-sounding sentence lands in
  // front of the wrong patient.
  // ── Added 2026-10-18, FINDING F ──────────────────────────────────────
  // The 2026-10-17 reading of mm7401a1 recorded only three sentences, all from
  // the Summary box and the "Recommendations for Use of PCV" narrative, and
  // SIX removals were approved on the stated ground that the document "states
  // none of these". The clinical guidance TABLE was not read until the next
  // session. Five of the six statements are in it, in full sentences. The two
  // below are the ones whose ROW HEADING is the patient's exact history, so
  // there is nothing to argue about; the owner restored both on 2026-10-18
  // after being shown each patient and each row.
  //
  // Re-read 2026-10-18 from the live page AND from the owner's PDF of the same
  // article, which agree character for character. Note the PDF of mm7336a2
  // (MMWR 12 Sep 2024, the PCV21 paper) prints the shared-decision row with
  // ONE COMMA FEWER — "PCV21, PCV20 or PCV15". The chip here links to
  // mm7401a1, so mm7401a1's punctuation is what is quoted.
  mmwrPpsvOnlyThenPcv: {
    rulebook: 'adult',
    // Patients this sentence is about: printed identically in all THREE blocks (>=50, 19-49 immunocompromising, 19-49 chronic), word for word, so it is about any adult with a PPSV23-only history
    population: ['adult-19to49', 'adult-50plus'],
    url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm',
    label: 'ACIP 2025 (MMWR mm7401a1) — clinical guidance table, the row "PPSV23 only" (identical in all three adult blocks)',
    short: 'ACIP 2025 Adult MMWR',
    quote: 'A single dose of PCV21, PCV20, or PCV15 \u22651 year after the last PPSV23 dose.',
    lastVerified: '2026-10-18',
  },
  mmwrSharedDecision65: {
    rulebook: 'adult',
    // Patients this sentence is about: the >=50 block, row "PCV13 at any age and PPSV23 at age >=65 years". The sentence names ">=65" itself, and the card is only reached when the PPSV23 dose was given at 65 or older, which implies the patient is 50+
    population: ['adult-50plus'],
    url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm',
    label: 'ACIP 2025 (MMWR mm7401a1) — clinical guidance table, "Adults aged >=50 years", the row "PCV13 at any age and PPSV23 at age >=65 years"',
    short: 'ACIP 2025 Adult MMWR',
    quote: 'Shared clinical decision-making is recommended regarding administration of either a single dose of PCV21 or PCV20 for any adult aged \u226565 years who has completed the recommended vaccination series with both PCV13 and PPSV23 (i.e., PPSV23 administered at age \u226565 years) but PCV21, PCV20, or PCV15 not yet received. If a decision to administer PCV21 or PCV20 is made, a single dose is recommended \u22655 years after the last pneumococcal vaccine dose.',
    lastVerified: '2026-10-18',
  },
  // ── Added 2026-10-18, the job aid's cell-only statements ─────────────
  // OWNER DECISION 2026-10-18 on the Adult Timing Job Aid's three remaining
  // uncredited statements: *"use MMWR table"*. The job aid prints those three
  // as TABLE CELLS and nowhere in words -- its "PCV13 & PPSV23" cell is the
  // two text runs "\u22655 years" and "PCV20 or PCV21" at different x
  // positions, with the meaning carried by the row label and the column
  // header -- so quoting it would mean assembling a sentence the document
  // does not contain. mm7401a1's table states all three in full sentences, so
  // the job aid comes off those cards and ACIP's rows are cited instead.
  //
  // Two of the three were already present (`mmwrPpsvOnlyThenPcv` and
  // `mmwrIc1949OnePpsv` / `mmwrBothPcv13Ppsv50plus`). These two are the third:
  // the "PCV13 only" row, which the table prints in two wordings ONE WORD
  // apart. Read 2026-10-18 from the live page and the article PDF.
  mmwrPcv13OnlyThenPcv: {
    rulebook: 'adult',
    // Patients this sentence is about: the >=50 block and the 19-49 CHRONIC block, which print this row word for word identically. The 19-49 immunocompromising version inserts "administered" and is mmwrPcv13OnlyThenPcv1949Ic
    population: ['adult-19to49', 'adult-50plus'],
    url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm',
    label: 'ACIP 2025 (MMWR mm7401a1) — clinical guidance table, the row "PCV13 only" (identical in the >=50 and 19-49 chronic blocks)',
    short: 'ACIP 2025 Adult MMWR',
    quote: 'A single dose of PCV21 or PCV20 \u22651 year after the PCV13 dose.',
    lastVerified: '2026-10-18',
  },
  mmwrPcv13OnlyThenPcv1949Ic: {
    rulebook: 'adult',
    // Patients this sentence is about: the 19-49 immunocompromising / CSF leak / cochlear implant block, row "PCV13 only". One word from its twin above -- "administered" -- which is why it is a separate entry rather than a widened population
    population: ['adult-19to49'],
    url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm',
    label: 'ACIP 2025 (MMWR mm7401a1) — clinical guidance table, "Adults aged 19\u201349 years with an immunocompromising condition, a CSF leak, or a cochlear implant", the row "PCV13 only"',
    short: 'ACIP 2025 Adult MMWR',
    quote: 'A single dose of PCV21 or PCV20 administered \u22651 year after the PCV13 dose.',
    lastVerified: '2026-10-18',
  },
  mmwrBothPcv13Ppsv50plus: {
    rulebook: 'adult',
    // Patients this sentence is about: the >=50 block, row "PCV13 at any age and PPSV23 at age <65 years". The >=65 twin is the shared-decision path, which this card never reaches
    population: ['adult-50plus'],
    url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm',
    label: 'ACIP 2025 (MMWR mm7401a1) — clinical guidance table, "Adults aged >=50 years", the row "PCV13 at any age and PPSV23 at age <65 years"',
    short: 'ACIP 2025 Adult MMWR',
    quote: 'A single dose of PCV21 or PCV20 \u22655 years after the last pneumococcal vaccine dose.',
    lastVerified: '2026-10-17',
  },
  // The 19-49 twin of the entry above. Its row OPENS with the same sentence,
  // so the second sentence is quoted too: a clinician hovering must be able to
  // tell which of the two rows this is, and the second sentence is also what
  // supports the card's "This completes the series".
  mmwrIc1949OnePpsv: {
    rulebook: 'adult',
    // Patients this sentence is about: the 19-49 immunocompromising / CSF leak / cochlear implant block, row "PCV13 and 1 dose of PPSV23". Reaching this card below 50 means one of those three, because the chronic-only branch is intercepted earlier
    population: ['adult-19to49'],
    url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm',
    label: 'ACIP 2025 (MMWR mm7401a1) — clinical guidance table, "Adults aged 19\u201349 years with an immunocompromising condition, a CSF leak, or a cochlear implant", the row "PCV13 and 1 dose of PPSV23"',
    short: 'ACIP 2025 Adult MMWR',
    quote: 'A single dose of PCV21 or PCV20 \u22655 years after the last pneumococcal vaccine dose. The pneumococcal vaccination series is complete, and it need not be followed by additional pneumococcal vaccine doses.',
    lastVerified: '2026-10-17',
  },
  // The SAME patient with a second PPSV23 dose, which mm7401a1 answers in its
  // own row. Note what that row leads with: review again at 50, with the dose
  // this card recommends offered as the ALTERNATIVE. The app states the dose
  // flatly. That is a difference in emphasis between the app and ACIP, not a
  // contradiction — the "Alternatively" sentence below is verbatim permission
  // for exactly what the card says — but it is raised for the owner rather
  // than papered over, and the quote is the one that supports the card.
  mmwrIc1949TwoPpsv: {
    rulebook: 'adult',
    // Patients this sentence is about: the 19-49 immunocompromising / CSF leak / cochlear implant block, row "PCV13 and 2 doses of PPSV23"
    population: ['adult-19to49'],
    url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm',
    label: 'ACIP 2025 (MMWR mm7401a1) — clinical guidance table, "Adults aged 19\u201349 years with an immunocompromising condition, a CSF leak, or a cochlear implant", the row "PCV13 and 2 doses of PPSV23"',
    short: 'ACIP 2025 Adult MMWR',
    // Extended 2026-10-18 from the "Alternatively" sentence to the WHOLE row
    // (OWNER DECISION, *"use MMWR"*). The row's first sentence is the one the
    // card now leads with, and nothing else in the app's source set states it
    // for this patient -- CDC's Adult Notes give only the dose and its five
    // years. Quoting the sentence without the one before it showed the
    // alternative while hiding what it is an alternative TO.
    quote: 'The pneumococcal vaccination recommendations should be reviewed again when the person turns age 50 years. Alternatively, a single dose of either PCV21 or PCV20 should be administered \u22655 years after the last pneumococcal vaccine dose. If PCV21 or PCV20 is used, the series is complete, and it need not be followed by additional pneumococcal vaccine doses.',
    lastVerified: '2026-10-17',
  },
  // BODY PROSE, not a table cell, and the only one of the seven that is. It
  // says "adults aged >=19 years" in its own words, so it needs no age split —
  // and it is the sentence behind the card's "no PPSV23 needed", a claim that
  // carried no citation at all before this.
  mmwrPcv13NoPpsv23ToComplete: {
    rulebook: 'adult',
    // Patients this sentence is about: its own words, "adults aged >=19 years" who began with PCV13 and have not completed the series
    population: ['adult-19to49', 'adult-50plus'],
    url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm',
    label: 'ACIP 2025 (MMWR mm7401a1) — the section "PPSV23 Use in PCV13-Experienced Adults Who Have Not Completed the Recommended Vaccination Series"',
    short: 'ACIP 2025 Adult MMWR',
    quote: 'Among adults aged \u226519 years who have started their pneumococcal vaccination series with PCV13 but have not received all recommended doses, PPSV23 is no longer recommended as an option to complete the series. Either PCV20 or PCV21 is recommended to complete the series as previously recommended.',
    lastVerified: '2026-10-17',
  },
  // The CHRONIC block's "PCV13 and 1 dose of PPSV23" row. The chronic block
  // has FOUR rows and stops here: it states nothing about a second PPSV23
  // dose, which is why 45 cards are left uncredited pending an owner decision.
  mmwrChronic1949ReviewAt50: {
    rulebook: 'adult',
    // Patients this sentence is about: the 19-49 "chronic medical conditions" block, row "PCV13 and 1 dose of PPSV23". OWNER DECISION 2026-10-18: it is also the row for a chronic patient with TWO PPSV23 doses — the block offers a second dose to nobody, so it has no other disposition for that history. The label keeps the row's real heading (provenance stays honest); `population` records who the sentence is about.
    population: ['adult-19to49'],
    url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm',
    label: 'ACIP 2025 (MMWR mm7401a1) — clinical guidance table, "Adults aged 19\u201349 years with chronic medical conditions", the row "PCV13 and 1 dose of PPSV23"',
    short: 'ACIP 2025 Adult MMWR',
    quote: 'The pneumococcal vaccination recommendations should be reviewed again when the person reaches age 50 years.',
    lastVerified: '2026-10-17',
  },
  // The one sentence in the paper that is ABOUT 19-49 adults as a group. It
  // supports the second half of the no-risk card — that a vaccine is
  // recommended at this age only with a risk condition — so that card does NOT
  // need a fifth declared cross-reference to say it.
  mmwrRiskBased1949Unchanged: {
    rulebook: 'adult',
    // Patients this sentence is about: its own words, "adults aged 19-49 years"
    population: ['adult-19to49'],
    url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm',
    label: 'ACIP 2025 (MMWR mm7401a1) — the summary "What is added by this report": the October 2024 expansion covers adults aged >=50, and the 19-49 recommendation stays risk-based',
    short: 'ACIP 2025 Adult MMWR',
    quote: 'The risk-based recommendation for adults aged 19\u201349 years is unchanged.',
    lastVerified: '2026-10-17',
  },
  // ONE entry for TWO blocks, on purpose. The ">=50" and "19-49 chronic"
  // versions of the "None or PCV7 only at any age" row are word-for-word
  // identical for these two sentences (the >=50 row then adds the 8-week
  // option, which `jobAidEightWeekOptionAt50` already carries). `population`
  // records who a sentence is ABOUT, and this one is printed about both — so
  // this is one entry, not twins. The 19-49 IMMUNOCOMPROMISING version is a
  // different sentence (>=8 weeks) and stays `adultPcv15ThenPpsvShort`.
  mmwrNoneOrPcv7Only: {
    rulebook: 'adult',
    // Patients this sentence is about: printed identically in the >=50 block and the 19-49 chronic block, "None or PCV7 only at any age"
    population: ['adult-19to49', 'adult-50plus'],
    url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm',
    label: 'ACIP 2025 (MMWR mm7401a1) — clinical guidance table, the row "None or PCV7 only at any age", printed identically for adults aged >=50 and for adults aged 19\u201349 with chronic medical conditions',
    short: 'ACIP 2025 Adult MMWR',
    quote: 'A single dose of PCV21, PCV20, or PCV15. If PCV15 is administered, a single dose of PPSV23* should be administered \u22651 year after the PCV15 dose.',
    lastVerified: '2026-10-17',
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
    //
    // FINDING J (2026-10-18): the corrected parenthetical naming that row is
    // now GONE too, and for the reason the population rule gives — this is a
    // quote-free whole-document chip, so it declares no population, "because a
    // document has no patient, only a sentence does". A chip that advertises
    // one row makes the document look like that row. Measured before the
    // change: the chip was on 1,351 cards, and on 1,008 of them a counted dose
    // had been given at or after age 6 — which the named row excludes. FINDING
    // J then needed to put this chip on 864 cards whose patient HAS a PCV20,
    // against a label reading "never received PCV20", which would have swapped
    // one wrong-patient citation for another.
    //
    // Nothing is lost: the row's own wording is quoted verbatim by
    // `pedsBefore6NoPcv20`, which declares the patients it is about and is
    // cited on the cards that row actually governs.
    label: 'CDC — Summary of Risk-based Pneumococcal Vaccination Recommendations',
    short: 'CDC Risk-based Pneumococcal',
    lastVerified: '2026-10-12',
  },

  // ACIP MMWRs ------------------------------------------------------------
  mmwr7401a1: {
    rulebook: 'adult',
    url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm',
    label: 'ACIP 2025 — Expanded routine pneumococcal vaccination of adults aged ≥50 years (MMWR mm7401a1)',
    // The chip's name is deliberately AGE-NEUTRAL and must stay that way
    // (OWNER DECISION 2026-10-22). It used to read "MMWR >=50 expansion",
    // after the paper's own title -- but the app uses the clinical guidance
    // table INSIDE that paper for adults from 19 up, so 1,015 cards were
    // showing an under-50 patient a button that named a document about people
    // 50 and over. One name for one paper, with no age in it; the age band a
    // given sentence is about is carried by `population`, not by the chip.
    // Guard: regression-2026-10-22-chip-name-fits-the-patient.test.jsx.
    short: 'ACIP 2025 Adult MMWR',
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
  // ⚠ THIS ENTRY DESCRIBED THE WRONG DOCUMENT UNTIL 2026-10-18.
  //
  // It read `rulebook: 'adult'`, "Use of PCV15 and PCV20 among adults", short
  // "PCV15 Adults MMWR". Fetched live from the URL below on 2026-10-18, the
  // document's own title is:
  //
  //   "Use of 15-Valent Pneumococcal Conjugate Vaccine Among U.S. Children:
  //    Updated Recommendations of the Advisory Committee on Immunization
  //    Practices — United States, 2022"
  //
  // A CHILDREN's report, not an adult one. Nothing had gone wrong on screen,
  // because the entry was a registered orphan — no card cited it — so the
  // mislabel put a child's document on no adult's card. It is corrected now
  // because FINDING 2 makes it a cited source for the first time.
  //
  // OWNER DECISION 2026-10-18, on a healthy 6-month-old with four PCV20 doses
  // at 1, 2, 3 and 4 months: "downloaded MMWR 2022 states in table 2: all
  // children 2-6 months last dose at age 12–15 mos". That is the sentence the
  // app's fifth dose rests on, and it is this document's, not p2016's.
  //
  // ⚠ HONEST LIMIT, stated rather than papered over. This table ALSO stops at
  // 3 previous doses, so it does not state the number FIVE either — nor does
  // p2016's Table 1, whose largest total is 4. What it states is where the
  // LAST dose goes. So the schedule claim is sourced here; the number 5 stays
  // the app's own arithmetic on the patient's record (4 given + 1 still owed
  // at 12–15 months), and the card says so in its own words rather than
  // attributing the 5 to anybody.
  // The WHOLE-PAGE entry for this document — the one the grey button is built
  // from, so it carries no `quote` and (per the population rule) no
  // `population`: a document has no patient, only a sentence does.
  mmwr7137a3: {
    rulebook: 'child',
    url: 'https://www.cdc.gov/mmwr/volumes/71/wr/mm7137a3.htm',
    label: 'ACIP 2022 — Use of 15-valent pneumococcal conjugate vaccine among U.S. children (MMWR mm7137a3)',
    short: 'PCV15 Children MMWR',
    lastVerified: '2026-10-18',
  },
  // THE INTERCHANGEABILITY SENTENCE (owner ruling, 2026-10-18): "PCV13 and
  // PCV15 are interchangeable when assessing how to move forward in the
  // schedule."
  //
  // WHY THE APP NEEDS IT IN WORDS. Every document that states a conjugate dose
  // given AT OR AFTER age 6 names PCV13 and only PCV13. Checked live
  // 2026-10-18, all three:
  //   - CDC child & adolescent notes, both at-risk lists, Age 6-18 years:
  //     "Received PCV13 only at or after age 6 years ..." and "Received 1 dose
  //     PCV13 and 1 dose PPSV23 at or after age 6 years ..."
  //   - CDC risk-indications (MAY 8, 2026): no at/after-6 branch AT ALL -- its
  //     only prior-conjugate branch is headed "before age 6 years".
  //   - immunize.org p2016 Table 4: "PCV13 only, given at or after age 6 years".
  // So for a child whose dose at that age was a PCV15, NO document has a row --
  // the "no row for this history" shape, which is an escalation and was
  // escalated. This sentence is the owner's answer, and it is ACIP's own.
  //
  // Read live 2026-10-18 from the MMWR page (44,208 chars; "interchangeably"
  // appears EXACTLY ONCE -- the positive control that this is the sentence
  // itself and not a paraphrase of it). It is the fourth sentence of
  // "Recommendations for Use of PCV", printed above every population block.
  //
  // (!) WHY `population` IS ALL THREE PAEDIATRIC GROUPS, said plainly because
  // the paragraph's own words can be read against it. The three sentences
  // before it scope THIS DOCUMENT's recommendations: "all children aged 2-59
  // months ... children aged 60-71 months with risk conditions, and persons
  // aged 6-18 years with an immunocompromising condition, cerebrospinal fluid
  // leak, or cochlear implant". An 18-year-old with chronic heart disease is
  // NOT in that list, and the app recommends for that child on CDC's current
  // authority, not on ACIP 2022's.
  //
  // It is still all three, for the reason the population rule gives: the field
  // records who the SENTENCE is about, not which block it was printed in.
  // "For all recommendations, PCV13 and PCV15 can be used interchangeably" is a
  // claim about the two PRODUCTS wherever either is recommended -- it names no
  // patient and excludes none -- and the owner confirmed on 2026-10-18 that it
  // applies to every paediatric risk class. Same shape as
  // `adultPcv20or21Complete`, whose own words outrun the block it sits under.
  pedsPcv13Pcv15Interchangeable: {
    rulebook: 'child',
    // Patients this sentence is about: the two products, in every
    // recommendation this document makes -- so every paediatric risk class.
    population: ['child-routine', 'child-nonIC', 'child-IC'],
    url: 'https://www.cdc.gov/mmwr/volumes/71/wr/mm7137a3.htm',
    label: 'ACIP 2022 — MMWR mm7137a3, "Recommendations for Use of PCV": PCV13 and PCV15 are interchangeable for all recommendations',
    short: 'PCV15 Children MMWR',
    quote: 'For all recommendations, PCV13 and PCV15 can be used interchangeably.',
    lastVerified: '2026-10-18',
  },

  // The SENTENCE this app rests on, from Table 2 of the document above.
  pedsInfantLastDose1215mo: {
    rulebook: 'child',
    // Patients this sentence is about: Table 2's "All children" block, printed
    // above its "Healthy children" and "Children with certain underlying
    // medical conditions" blocks, so it covers every paediatric risk class.
    population: ['child-routine', 'child-nonIC', 'child-IC'],
    url: 'https://www.cdc.gov/mmwr/volumes/71/wr/mm7137a3.htm',
    label: 'ACIP 2022 — MMWR mm7137a3, Table 2: all children 2–6 months, last dose at age 12–15 months',
    short: 'PCV15 Children MMWR',
    // Verbatim, Table 2, row "All children / 2–6 mos / 3 previous doses". The
    // neighbouring 1- and 2-dose rows end in the same words, "last dose at age
    // 12–15 mos". Read live 2026-10-18.
    quote: '1 additional dose at age 12–15 mos',
    lastVerified: '2026-10-18',
  },

  // immunize.org ----------------------------------------------------------
  p2016: {
    rulebook: 'child',
    // ⚠ THE 2026-09-13 COMMENT HERE WAS WRONG, corrected 2026-10-18.
    //
    // It said the label "previously claimed Tables 1-5" and that it had been
    // "verified live that p2016.pdf, as it exists now, is a 2-page document
    // with only Tables 1-4", with Table 5 living in p3086.pdf. Fetched live on
    // 2026-10-18 (HTTP 200, 211,252 bytes, "Item #P2016 (2/16/2024)") and read
    // with scripts/pdfLayout.py, p2016 is a 2-page document containing FIVE
    // tables. Table 5 is printed at the foot of page 2:
    //
    //   "Table 5. Recommended schedule for administering pneumococcal
    //    conjugate vaccine to any child younger than age 19 years following a
    //    hematopoietic stem cell transplant (HSCT)"
    //
    // The item date 2/16/2024 is EARLIER than that 2026-09-13 check, so this is
    // not immunize.org having republished — the earlier verification was simply
    // wrong, most likely read with a tool that truncated or flattened page 2.
    // Same failure as FINDING F: a reading that misses part of a document is
    // indistinguishable from a reading that found nothing there.
    //
    // ⚠ THIS CHANGES NOTHING ABOUT THE TRANSPLANT HARD STOP. Table 5 is a
    // post-transplant schedule and CLAUDE.md is explicit that ticking the
    // transplant box stops the engine and that no post-transplant schedule is
    // ever to be re-added (OWNER DECISION 2026-10-16, recorded in
    // docs/archive/retired-2026-10-16-post-transplant-pneumococcal-schedules.md).
    // Finding that a cited document still carries such a table is MORE reason
    // for that decision, not less. The only action taken here is to stop the
    // app describing this document inaccurately.
    //
    // Also checked 2026-10-18: p2016 mentions PCV21 nowhere, and no child card
    // offers PCV21 while listing it. A future change that offered PCV21 under
    // 19 would create an unsupported citation silently.
    url: 'https://www.immunize.org/wp-content/uploads/catg.d/p2016.pdf',
    label: 'immunize.org — Recommendations for Pneumococcal Vaccines Use in Children and Teens (Tables 1–5)',
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
    // Patients this sentence is about: its own words: "an older teen or adult patient at increased risk". The ENGINE applies the PCV7 rule more broadly than that (owner decision 2026-10-12: PCV7 never counts, for anyone), so a healthy child's card declares the gap at the call site rather than this field pretending the sentence says it
    population: ['child-nonIC', 'child-IC', 'adult-19to49', 'adult-50plus'],
    url: 'https://www.immunize.org/ask-experts/how-do-we-account-for-the-history-of-pcv7-vaccination-when-determining-the-pneumococcal-vaccination-needs-of-an-older-teen-or-young-adult-with-a-high-risk-condition/',
    label: 'immunize.org Ask the Experts — PCV7 history is ignored; treat high-risk patient as PCV-naïve',
    short: 'immunize.org PCV7 rule',
    quote: 'Because of the limited number of serogroups covered by PCV7 (which was used in the United States between 2000 and 2010), CDC recommends that doses of PCV7 should be ignored for the purposes of calculating the current pneumococcal vaccination needs of an older teen or adult patient at increased risk for pneumococcal disease.',
    lastVerified: '2026-10-12',
  },
  // C3 (2026-10-17): the DOCUMENT-level entry for the page `immPCV7` quotes.
  //
  // Every other document in this file has exactly one quote-free entry — the
  // whole-page reference a grey button shows — and this page was the only one
  // without. The consequence was measurable: on 1,188 cards a recorded PCV7
  // dose carried a `[N]` pointing at this page while no button named it, so
  // the reader met a number with nothing to click. The missing button and the
  // missing entry were the same gap.
  //
  // Same url and same `short` as `immPCV7`, because it is the same document;
  // C1's "one name, one document" guard reads the url, so the pair is one
  // document under one name and passes. What differs is the absence of
  // `quote`: that is what marks an entry as naming the whole page rather than
  // one sentence of it (see `citeTitle`), and `documentRefFor()` below is the
  // one reader of that distinction.
  immPCV7Page: {
    rulebook: 'any',
    url: 'https://www.immunize.org/ask-experts/how-do-we-account-for-the-history-of-pcv7-vaccination-when-determining-the-pneumococcal-vaccination-needs-of-an-older-teen-or-young-adult-with-a-high-risk-condition/',
    label: 'immunize.org Ask the Experts — How do we account for the history of PCV7 vaccination when determining pneumococcal vaccination needs?',
    short: 'immunize.org PCV7 rule',
    lastVerified: '2026-10-12',
  },
  immPneumo: {
    rulebook: 'any',
    url: 'https://www.immunize.org/ask-experts/topic/pneumococcal/',
    label: 'immunize.org Ask the Experts — Pneumococcal',
    short: 'immunize.org Ask the Experts',
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

// ── C3 (2026-10-17): the whole-page entry behind any cited sentence ──────
//
// A `[N]` in the text cites one SENTENCE; a grey button cites the whole
// DOCUMENT that sentence sits in. Until C3 the two were only ever connected by
// hand — a card listed its buttons in `refs` and its sentences in `noteCites`,
// and nothing checked that every cited document had a button. Measured over
// the whole grid, re-measured on the rebase: 1,380 cards showed a number for a document
// with no button to click.
//
// This is the lookup that closes it. Given the page a sentence came from, it
// returns the entry that names the whole page — the quote-free one, which is
// exactly how `citeTitle` already tells the two kinds apart. Built once, not
// per call: `cardSources()` asks for it on every card the app renders.
//
// Totality is a property, not a hope: `regression-c2-c3-numbered-sources`
// fails if any document cited anywhere lacks a whole-page entry, which is the
// fault `immPCV7Page` above was added to fix.
const DOCUMENT_REF_BY_URL = (() => {
  const byUrl = new Map();
  for (const ref of Object.values(REFS)) {
    if (!ref.quote && !byUrl.has(ref.url)) byUrl.set(ref.url, ref);
  }
  return byUrl;
})();

export function documentRefFor(url) {
  return url ? DOCUMENT_REF_BY_URL.get(url) : undefined;
}

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
//
// ⚠ The PDF rule (C8, document 2's CITEs, 2026-10-17). A `#:~:text=` fragment
// is an HTML text fragment: PDF viewers do not honour it, so on a PDF it is a
// DEAD anchor that still looks like a working deep link. The job aid is the
// app's first QUOTED PDF — every quoted source before it was a web page — and
// quoting a 4-page document without saying which page is most of the way to
// the "right-sounding quote attached to the wrong patient" failure, because
// this document prints a DIFFERENT interval for a different patient on each
// page. So a quoted PDF entry declares `pdfPage` and gets `#page=N`, which
// Chrome, Safari and Preview all honour.
//
// A quoted PDF entry with NO `pdfPage` would silently fall through to a text
// fragment that cannot work, so `refs.test.js` fails if one exists.
export function highlightUrl(url, quote, pdfPage = undefined) {
  if (!url) return undefined;
  if (!quote) return url;
  const page = url.split('#')[0];
  if (pdfPage != null) return `${page}#page=${pdfPage}`;
  return `${page}#:~:text=${encodeURIComponent(quote)}`;
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
//   • `label` — the quoted sentence, else the ref's full title. The sentence
//               itself, kept as its own field because `proseDiff.mjs` records
//               it as the citation's wording: a document name added for
//               display must not read there as a changed quote.
//   • `doc`   — the document's short name ("CDC Adult Notes"), the SAME text
//               the grey chip at the foot of the card prints. C1 (2026-10-17):
//               this is what lets a reader match a `[1]` to a chip, and it is
//               taken from `short` rather than re-typed so the two can never
//               disagree.
//   • `quote` — present only when this key cites one sentence. Whether it is
//               set is what `citeTitle()` keys on, instead of comparing
//               `label` against `REFS[key].label` to guess.
//
// Refs without a `quote` yet degrade to the page URL and the title: still a
// working, numbered link, just not scrolled to a sentence. S8/P2-8 owns the
// full `quote` + `lastVerified` sweep of all 18 refs.
export function cite(key, opts = undefined) {
  const c = REFS[key];
  const out = {
    key,
    page: c?.url,
    url: highlightUrl(c?.url, c?.quote, c?.pdfPage),
    label: c?.quote ?? c?.label,
    doc: c?.short,
    quote: c?.quote,
  };
  // `aboutAnotherGroup` (2026-10-17): this card is quoting a rule written about
  // a DIFFERENT patient group, deliberately — to explain a boundary ("routine
  // begins at 50"), or to say what this patient does not have. The string is
  // the reason, written at the call site so a reader meets it beside the code
  // that chose it, and the population guard skips the citation. It is not a
  // way to silence the guard: a separate assertion pins the exact set of keys
  // allowed to carry it, so adding one is a visible, counted change.
  if (opts?.aboutAnotherGroup) out.aboutAnotherGroup = opts.aboutAnotherGroup;
  return out;
}

// ── C1 (2026-10-17): the hover text names the document, then quotes it ───
//
// Owner-reported: "I always see a '1' where you can hover over to see the
// language cited verbatim, but there are multiple source chips under it and I
// do not know where it came from." The hover text showed the sentence and never
// said which document the sentence came from, so knowing the words still did
// not tell you which grey chip to click.
//
// The first line is `cite()`'s `doc`, which is the ref's `short` — the SAME
// string the chip prints, so the two can only ever agree. The sentence follows
// on its own line.
//
// Why a line break and not "Document — sentence": em dashes are banned from
// user-visible strings in both apps (owner decision 2026-07-16, D7 — the most
// recognisable "written by an AI" tell; code comments keep them). A `title`
// attribute honours "\n" in current browsers and degrades to a space where it
// does not, which still reads correctly.
//
// A quote-free ref is a whole-document reference with no sentence to show. Its
// `label` is already the full title, which names the document, so it is left
// exactly as it was: composing a blank quote onto it would present a source
// that appears to say nothing.
export function citeTitle(c) {
  if (!c) return undefined;
  if (c.quote && c.doc) return `${c.doc}\n“${c.quote}”`;
  return c.label;
}
