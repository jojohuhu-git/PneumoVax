# C7 — live source readings for the citation work (2026-10-17)

**STATUS: IN PROGRESS. 2 of 6 documents read.** This file is the record C7 exists to
produce: each quoted source read live, with the sentence and the heading it sits under,
so C8 can credit a statement without re-deriving the rule from scratch.

Parent plan: `plan-2026-10-16-citations-which-chip-did-this-come-from.md` (items C7, C8,
checks G1/G4/G5). Do not re-quote from memory or from the app's own stored copy — that is
the whole point of the item.

---

## Why this file exists, in one paragraph

The owner reported, mid-session on 2026-10-17, looking at the newly numbered Sources row:
*"in the current work I see only citation 1 cited, but there are still references 2 and 3
listed"*, and then the rule: **"all sources need to be cited in the explanations if it
will be listed as a source."** That is the plan's own decision 5.2, restated. Numbering
the buttons (C2) made the gap visible rather than creating it.

## The measured scope (2026-10-17, post-transplant, post-C2/C3)

**68 distinct (uncredited source, statement) pairs**, over 6 documents:

| Document | Card instances | Distinct statements |
|---|---|---|
| immunize.org p2016 | 8,678 | 34 |
| CDC Adult Timing Job Aid | 7,524 | 15 |
| MMWR ≥50 expansion (mm7401a1) | 7,479 | 13 |
| CDC PCV Catch-up Job Aid | 1,626 | 2 |
| CDC Child/Adolescent Notes | 712 | 3 |
| CDC Adult Notes | 25 | 1 |

**The cause is structural, not 68 separate oversights.** `recommend.js` merges a fixed
default set into every card of a pathway — `collectRefs(riskIds, ['cdcAdultPneumo',
'cdcAdultTimingJobAid', 'mmwr7401a1'], 'adult')` at `recommend.js:859`, and
`['cdcChildPneumo', 'p2016']` for children. A card lists those whether or not anything it
says rests on them. That is the honest answer to the owner's second question, *"I also
forget why there are multiple source chips listed if its only citing one of them"*: they
are defaults for the pathway, not sources for the card.

## The disposition rule (OWNER DECISION 2026-10-17)

For each pair, one of two outcomes — never a third:

1. **The source does hold up something the card says** → give that statement its own
   inline `[c]` marker, with a quote read live and recorded below.
2. **The source holds up nothing the card says** → **take it off that card.** The owner
   chose this over keeping it as background reading: *"Take it off that card."*

A removal is a clinical act. Bring the proposed removals to the owner per document before
they land; do not batch them invisibly into a large diff.

---

## Document 1 — MMWR mm7401a1 (`MMWR ≥50 expansion`)

- **URL:** https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm
- **Read live:** 2026-10-17, in the browser pane (46,040 characters of page text; the
  page title and the Recommendations section were both present, so this is the real page
  and not an error stub).
- **What it is:** *Expanded Recommendations for Use of Pneumococcal Conjugate Vaccines
  Among Adults Aged ≥50 Years: Recommendations of the Advisory Committee on Immunization
  Practices — United States, 2024.*

### Sentences verified, with the heading each sits under

**(A) Under the "Summary" box, "What is added by this report?":**

> "On October 23, 2024, the Advisory Committee on Immunization Practices recommended a
> single dose of PCV for all adults aged ≥50 years who are PCV-naïve or who have unknown
> vaccination history. The risk-based recommendation for adults aged 19–49 years is
> unchanged."

**(B) Under the heading "Recommendations for Use of PCV":**

> "ACIP recommended PCV for all PCV-naïve adults aged ≥50 years. Recommendations for PCVs
> for adults aged 19–49 years with a risk condition and for adults who have previously
> received PCV13 remain unchanged (Table)."

**(C) Under the heading "PPSV23 Use in PCV13-Experienced Adults Who Have Not Completed
the Recommended Vaccination Series":**

> "Among adults aged ≥19 years who have started their pneumococcal vaccination series
> with PCV13 but have not received all recommended doses, PPSV23 is no longer recommended
> as an option to complete the series. Either PCV20 or PCV21 is recommended to complete
> the series as previously recommended."

### Patient population each sentence was written about (C6's note)

| Quote | Ages | Risk class |
|---|---|---|
| (A), (B) | ≥50 for the age-based half; 19–49 for the risk-based half, which both sentences explicitly say is **unchanged** | any |
| (C) | ≥19, **PCV13-experienced with an incomplete series** | any |

⚠ (C) is about patients who have had PCV13 and have **not finished**. Do not attach it to
a card about a patient whose series is already complete — that is precisely the
wrong-population error C6 exists to prevent.

### Proposed disposition for this document's 13 statements

Confirmed by the reading above, **not yet applied to code**:

| Card statement | Disposition |
|---|---|
| "Routine pneumococcal vaccination begins at age 50. Adults 19–49 … only if …" | **Cite** (A) or (B) |
| "No additional pneumococcal dose now — re-evaluate at age 50 …" (19–49, chronic only) | **Cite** (A) or (B) |
| "Give 1 dose of PCV20 or PCV21 — OR PCV15 followed by PPSV23 ≥1 year later. Routine pneumococcal vaccination for adults ≥50 …" **(the owner's own card)** | **Cite** (A)/(B) for the ≥50 half; the interval half belongs to the Timing Job Aid (document 2, not yet read) |
| "Give 1 dose of PCV15, PCV20, or PCV21. … This is an adult 19–49 …" | **Cite** (A) or (B) |
| "PCV13 was given previously: give 1 dose of PCV20 or PCV21 ≥1 year after the last PCV13 dose." | **Cite** (C) for the *"PCV20 or PCV21, not PPSV23"* half. The **≥1 year** itself is NOT in this paper — that number belongs to the Timing Job Aid / Adult Notes. Do not let one quote cover both halves. |
| "PCV13 and PPSV23 already given: give 1 dose of PCV20 or PCV21 ≥5 years after …" | Same split as above; the **≥5 years** is not in this paper. |
| "A pneumococcal series that includes PCV20 or PCV21 is complete — no PPSV23 and no further PCV needed." (2,610 cards) | **REMOVE.** Nothing in mm7401a1 states this. It is the CDC Adult Notes' statement, and that button is already on the card and already cited. |
| "PCV15 followed by PPSV23 is a complete pneumococcal series — no further doses needed." (914 cards) | **REMOVE**, same reason. |
| "Give 1 dose of PCV15, PCV20, or PCV21 ≥1 year after the PPSV23 dose." (1,154 cards) | **REMOVE** from this document — the interval is the Timing Job Aid's. Re-check after document 2 is read. |
| "An additional PCV20 or PCV21 ≥5 years … is a shared clinical decision" | **REMOVE** pending document 2; this paper does not discuss the shared-decision path. |
| "Give PPSV23 ≥1 year after the PCV15 dose — the series is INCOMPLETE until then" (×2 variants) | **REMOVE** from this document; the interval is the Timing Job Aid's. |

**Do not apply the removals until document 2 is read**, because several of them say "that
number belongs to the Timing Job Aid" and that has to be confirmed against the job aid
rather than assumed.

> #### ✅ RESOLVED 2026-10-17 — document 2 has now been read, and it confirms all five
>
> Every mm7401a1 row above that was held "pending document 2" said the number in question
> belongs to the Timing Job Aid. Checked against the job aid's own table cells (see
> document 2's quote **(I)**), each one does:
>
> | mm7401a1 row held pending | Where the number actually is | Verdict |
> |---|---|---|
> | PCV13 only → PCV20/21 **≥1 year** | job aid `PCV13 only` row, all 4 pages | **REMOVE from mm7401a1** stands |
> | PCV13 + PPSV23 → PCV20/21 **≥5 years** | job aid `PCV13 & PPSV23` row | **REMOVE** stands |
> | PPSV23 given → PCV15/20/21 **≥1 year** (1,154 cards) | job aid `PPSV23 only` row | **REMOVE** stands |
> | PPSV23 **≥1 year** after PCV15, series incomplete (×2) | job aid `PCV15 only` row | **REMOVE** stands |
> | additional PCV20/21 ≥5 y is a **shared clinical decision** | job aid **(G)**, its own p.1 section | **REMOVE** stands |
>
> So mm7401a1 keeps only what it actually says — the ≥50 expansion (A)/(B) and the
> PCV13-experienced-incomplete-series rule (C) — and the five intervals move to the job
> aid, which prints them. None of this is applied to code yet.

---

---

## Document 2 — CDC Adult Pneumococcal Vaccine Timing Job Aid

- **URL:** https://www.cdc.gov/pneumococcal/downloads/Vaccine-Timing-Adults-JobAid.pdf
- **Edition, read off the document itself:** footer of pp.2–4 reads **"NCIRD | March 2025"**.
  This is the edition `CLAUDE.md` names as governing, now confirmed from the file rather
  than from the prompt.
- **Read:** 2026-10-17. 4 pages, 78,054 bytes, downloaded from the cdc.gov address above on
  2026-10-17 at 10:31 through the browser pane's save dialog (the previous session's
  handoff recorded that attempt as a failure; the file had in fact landed in `~/Downloads`).
  Re-fetching it by command line is **impossible** — cdc.gov's CDN returns **403** to every
  non-browser client, tested with a browser user-agent, a referer and the bare host.
- **How it was read:** text extracted with position coordinates, so each table cell is tied
  to the row and column it is printed in. A flat text dump of this document interleaves the
  columns and cannot tell you which interval belongs to which prior-vaccine row — the exact
  way a right-sounding quote gets attached to the wrong patient.

### What the document actually contains — one page per population

Each page is a table: rows = prior vaccines, columns = **Option A** and **Option B**.

| Page | Population (the page's own heading) | PCV15 → PPSV23 interval it prints |
|---|---|---|
| 1 | *Adults ≥50 years old* | **≥1 year†** |
| 2 | *Adults 19–49 years old with specified immunocompromising conditions* | **≥8 weeks** |
| 3 | *Adults 19–49 years old with a cochlear implant or cerebrospinal fluid leak* | **≥8 weeks** |
| 4 | *Adults 19–49 years old with chronic health conditions* | **≥1 year** |

**This is independent live confirmation of the S15 rule in `CLAUDE.md`**, page by page: 8
weeks at 19–49 for immunocompromise / cochlear implant / CSF leak, a year for 19–49 chronic
and for every adult ≥50. It also re-confirms **"NO OPTION B"**, which appears **8 times, on
all four pages** — twice per page, in the `PCV15 only` row and in a cell merged across the
`PCV13`-containing rows.

### Sentences verified, with the page and row each sits in

**(A) p.1, footnote `†`** (the marker printed against the ≥50 `≥1 year` cells):

> "Consider minimum interval (8 weeks) for adults with an immunocompromising condition,
> cochlear implant, or cerebrospinal fuid leak (CSF) leak"

*("fuid" is the document's own typo — the ligature is dropped in its embedded font.)*
This is the sentence that makes 8 weeks an **option** at ≥50 rather than the
recommendation, which is the distinction `CLAUDE.md` forbids collapsing.

**(B) p.1, footnote `*`** (printed against every `None` row, all four pages):

> "Also applies to people who received PCV7 at any age and no other pneumococcal vaccines"

**(C) p.1, footnote `¶`:**

> "If PPSV23 is not available, PCV20 or PCV21 may be used"

**(D) p.1, row `PCV15 & PPSV23 OR PCV20 OR PCV21 / at any age`,** spanning both columns:

> "No vaccines recommended; schedule is complete."

**(E) pp.2–4, the same row,** spanning both columns — **different words for 19–49:**

> "No vaccines recommended at this time. Review pneumococcal vaccine recommendations again
> when your patient turns 50 years old."

**(F) p.4, row `PCV13† and PPSV23 at any age`** (19–49, chronic conditions):

> "No vaccines are recommended at this time. Review pneumococcal vaccine recommendations
> again when your patient turns 50 years old."

**(G) p.1, section heading + body, `Shared clinical decision-making for those who already
completed the series with PCV13 and PPSV23` / `Shared clinical decision-making option for
adults ≥65 years old`:**

> "Together, with the patient, vaccine providers may choose to administer PCV20 or PCV21 to
> adults ≥65 years old who have already received PCV13 (but not PCV15, PCV20, or PCV21) at
> any age and PPSV23 at or after the age of 65 years old."

**(H) p.4, footnote `†`:**

> "Adults with chronic medical conditions were previously not recommended to receive PCV13"

**(I) Table cells, by row** — identical on all four pages unless noted:

| Row | Option A | Option B |
|---|---|---|
| `None*` | PCV20 or PCV21 | PCV15 → *(interval per page)* → PPSV23¶ |
| `PCV15 only at any age` | *(interval)* → PPSV23¶ | **NO OPTION B** |
| `PPSV23 only at any age` | PCV20 or PCV21, **≥1 year** | PCV15, **≥1 year** |
| `PCV13 only at any age` | PCV20 or PCV21, **≥1 year** | **NO OPTION B** |
| `PCV13 & PPSV23` | PCV20 or PCV21, **≥5 years** | **NO OPTION B** (p.1) / review at 50 (pp.2–4) |

### Patient population each sentence was written about (C6's note)

| Quote | Ages | Risk class |
|---|---|---|
| (A) | **≥50 only** — it is page 1's footnote | immunocompromising / cochlear implant / CSF leak |
| (B), (C) | any adult | any |
| (D) | **≥50 only** | any |
| (E) | **19–49 only** | IC (p.2), cochlear/CSF (p.3), chronic (p.4) |
| (F) | **19–49 only** | chronic health conditions only |
| (G) | **≥65 only** | any |
| (I) `≥1 year` / `≥8 weeks` cells | **per page** — never quote one page's interval for another page's patient | per page |

⚠ **(D) and (E) are the same table row saying two different things to two different age
bands.** Quoting (D) to a 19–49 patient is the wrong-population error C6 exists to prevent,
and it is not hypothetical here — see the two held items below.

### Disposition for this document's 15 statements

Measured against the live engine over `test-grid.js` (16,202 cards): the job aid is listed
on **7,524** cards carrying **15** distinct statements that nothing on the card credits it
for. Every count below is from that run, and every statement's **actual** age span and risk
profiles were measured rather than inferred.

**12 statements → CITE.** Each one's measured population matches the page the quote is on:

| # | Cards | Statement (abbreviated) | Quote to attach | Population checked |
|---|---|---|---|---|
| 2 | 1,302 | PCV13 + PPSV23 given → PCV20/21 **≥5 years** | (I) `PCV13 & PPSV23` row | adult, any age ✓ |
| 3 | 1,154 | PPSV23 given → PCV15/20/21 **≥1 year** | (I) `PPSV23 only` row | adult, any age ✓ |
| 5 | 424 | PCV13 given → PCV20/21 **≥1 year**, no PPSV23 needed | (I) `PCV13 only` row **+ NO OPTION B** | adult, any age ✓ |
| 6 | 397 | additional PCV20/21 ≥5 y is a **shared decision** | **(G)** | **65.0–70.0y** ✓ exactly ≥65 |
| 7 | 175 | no dose now — **re-evaluate at 50** | **(F)** | **19.0y, chronic only** ✓ exactly p.4 |
| 9 | 138 | PPSV23 **≥1 year** after PCV15 | (I) `PCV15 only` row + **(C)** for the substitution half | adult ✓ |
| 10 | 75 | …plus **8 weeks may be considered** | **(A)** | **50.0–70.0y, IC/cochlear/CSF** ✓ exactly p.1 † |
| 11 | 54 | ≥50 routine, PCV7 counts as none | (I) `None` row + **(B)** for the PCV7 half | ≥50 ✓ |
| 12 | 45 | …plus the 8-week option | as #11 + **(A)** | ≥50 ✓ |
| 13 | 25 | PPSV23 **≥8 weeks** after PCV15 | (I) `PCV15 only` row, **pp.2–3** | **19.0y, IC/cochlear/CSF** ✓ exactly pp.2–3 |
| 14 | 20 | 19–49 risk, PCV15 → PPSV23 **≥8 weeks** | (I) `None` row, **pp.2–3** + **(B)** | 19.0y, IC/cochlear/CSF ✓ |
| 15 | 20 | 19–49 risk, PCV15 → PPSV23 **≥1 year** | (I) `None` row, **p.4** + **(B)** | 19.0y, chronic ✓ |

Note #5: the job aid is the **best** source for "no PPSV23 needed" — that is what its
**NO OPTION B** cell means, printed on all four pages. Nothing else in the app's source set
states it as plainly.

**1 statement → REMOVE.**

| # | Cards | Statement | Why |
|---|---|---|---|
| 8 | 171 | "Routine pneumococcal vaccination begins at age 50. Adults 19–49 years are recommended a pneumococcal vaccine only with a qualifying risk condition." | The job aid **never says this in words.** It is inferable only from the document's *structure* — that page 1 is headed "Adults ≥50" and pages 2–4 all require a risk class. Citing a table of contents as the source of a prose claim is the "right-sounding quote that isn't there" failure. The statement's real homes are mm7401a1 (A)/(B) and the Adult Notes, and this card already cites `adultRoutine50` and `cdcAdultRiskFactorList`. |

**2 statements → HELD for the owner.** See the section below; they are the (D)/(E) split.

| # | Cards | Measured ages | The problem |
|---|---|---|---|
| 1 | 2,610 | **19.0y – 70.0y** (630 at 19–49, 1,980 at 50+) | "A pneumococcal series that includes PCV20 or PCV21 is complete — no PPSV23 and no further PCV needed." |
| 4 | 914 | **19.0y – 70.0y** (305 at 19–49, 609 at 50+) | "PCV15 followed by PPSV23 is a complete pneumococcal series — no further doses needed." |

**935 of those 3,524 cards are 19–49**, where the job aid prints **(E)** — "Review
pneumococcal vaccine recommendations again when your patient turns 50 years old" — not
**(D)**'s "schedule is complete". So the job aid cannot carry these two statements as
written for that population.

**The app's clinical answer is not wrong.** Followed through, a 19–49 patient holding PCV20
lands at 50 in page 1's own `PCV15 & PPSV23 OR PCV20 OR PCV21 / at any age` row, whose
answer is (D): still complete. CDC's "review again at 50" resolves, for this row, to
nothing new. That is also why the app already has a re-evaluate card (#7) for the **one**
19–49 history where the review does yield something — PCV13 + PPSV23 under chronic
conditions, which gains PCV20/21 at ≥5 years. The distinction the engine draws is sound.
What is wrong is only **which document is credited to whom.**

---

## Documents still to read

| # | Document | Why it matters |
|---|---|---|
| 3 | immunize.org p2016 (PDF) | The largest by far: 34 statements, 8,678 cards. The paediatric default. |
| 4 | CDC PCV Catch-up Job Aid (PDF) | 2 statements, 1,626 cards — the children's 8-week catch-up gap. |
| 5 | CDC Child/Adolescent Notes | 3 statements, 712 cards. |
| 6 | CDC Adult Notes | 1 statement, 25 cards. |

**The PDF obstacle is solved** (2026-10-17) and is not four documents but three — the
Child/Adolescent Notes and the Adult Notes are ordinary web pages.

| PDF | How to read it |
|---|---|
| Adult Timing Job Aid | **in `~/Downloads`**, saved 2026-10-17 10:31. Read. |
| immunize.org `p2016.pdf` | **downloads normally by command line** (211,252 bytes, HTTP 200). |
| CDC PCV Catch-up Job Aid | cdc.gov's CDN returns **403** to every non-browser client. The browser pane raises a save dialog that only the owner can accept — one click, and it lands in `~/Downloads` like the adult job aid did. |

Read them with **positional** text extraction, not a flat dump: these documents are tables,
and a flat dump interleaves the columns so you cannot tell which interval belongs to which
prior-vaccine row. The helper used for document 2 walks each page's text with x/y
coordinates and prints them in reading order.

## The two tools this reading used, both kept in `scripts/`

| Tool | What it answers |
|---|---|
| `python3 scripts/pdfLayout.py <file.pdf> [page]` | a PDF's text **with x/y coordinates, in reading order** — so a table cell can be tied to its row and column. Needs no install; poppler is not required. |
| `npx vite-node scripts/uncreditedSources.mjs [document]` | the live list of **(listed source, statement) pairs nothing on the card credits** — the 68. Re-run it before trusting any count in this file. Needs `vite-node`, not plain `node`, because `citations.jsx` must be transformed. |

Both were written for document 2 and verified to reproduce the plan's committed figures
(16,202 cards; 68 pairs; 7,524/15 for the job aid). The measurement is sensitive to two
normalisations that are documented in the script's own header — a `{ lead, detail }` note
counts as one statement, and **only** calendar dates are masked. Masking numbers as well
collapses 68 to 45; masking nothing at all inflates it past 5,300.
