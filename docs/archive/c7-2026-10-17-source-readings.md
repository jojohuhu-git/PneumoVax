# C7 — live source readings for the citation work (2026-10-17)

**STATUS: IN PROGRESS. 4 of 6 documents read.** This file is the record C7 exists to
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

### ✅ OWNER DECISIONS 2026-10-17 — document 2 is settled, ready for C8

Both brought to the owner with the quotes and the measured card counts above, and both
decided. **Nothing is applied to code yet** — C8 applies all six documents' dispositions as
one mechanism change, because the root cause is one mechanism (`recommend.js:859`).

**1. Statement #8 (171 cards) — REMOVE the job aid.** *"Yes, remove it."* The job aid never
states "routine pneumococcal vaccination begins at age 50" in prose; only its page headings
imply it. The card keeps `adultRoutine50` (CDC Adult Notes) and `cdcAdultRiskFactorList`,
both already cited, so no clinician-visible wording changes.

**2. Statements #1 and #4 (3,524 cards) — CITE at 50+, REMOVE at 19–49.** The job aid is
credited on the **2,589** cards aged 50+, where page 1's **(D)** genuinely says "schedule is
complete", and comes **off** the **935** cards aged 19–49, where the same row says **(E)**
instead. This applies the cite-or-remove rule exactly and changes no card prose.

> The rejected third option, recorded so it is not re-proposed: change what those 935 cards
> *say* to CDC's own "review again when your patient turns 50 years old" and cite pp.2–4
> there. It is the most faithful to the source, but it rewrites clinical text on 935 cards,
> which is a different decision from fixing a citation and should not ride inside one. It
> remains available as its own item if the owner ever wants it.

**What this requires of C8, and it is new:** a card's source list currently cannot vary by
age band — `collectRefs()` hands every adult card the same three defaults. Decision 2 needs
`cdcAdultTimingJobAid` present on the 50+ half of two statements and absent on the 19–49
half. So C8 is not only "delete entries"; it needs sources attached **per card**, which is
the structural fix for the root cause rather than a patch over it. Note that the engine
already has the predicate it needs — `ROUTINE_ADULT_MIN_M` — and must not grow a second age
test (`CLAUDE.md`, "Never add an age test that decides whether a rule may bite").

---

---

## Document 3 — immunize.org p2016

- **URL:** https://www.immunize.org/wp-content/uploads/catg.d/p2016.pdf
- **Edition, read off the document itself:** `www.immunize.org/catg.d/p2016.pdf / Item #P2016
  (2/16/2024)`, page 2 footer. 2 pages, 211,252 bytes.
- **Read:** 2026-10-17. Downloaded straight from the address above by command line
  (HTTP 200) — unlike the CDC PDFs, immunize.org does not block it. Read with
  `scripts/pdfLayout.py`, so every table cell is tied to its row and column.
- **What it is:** *Recommendations for Pneumococcal Vaccines Use in Children and Teens.*

### ⚠ Two corrections to what the app records about this document

**1. It has FIVE tables, not four.** `refs.js` labels it "(Tables 1–4)" and carries a
comment dated 2026-09-13 stating it was "verified live" that the document "as it exists now,
is a 2-page document with only Tables 1–4", and that Table 5 "lives in p3086.pdf". **Read
live today, p2016 contains Table 5**, printed at the foot of page 2:

> "Table 5. Recommended schedule for administering pneumococcal conjugate vaccine to any
> child younger than age 19 years following a hematopoietic stem cell transplant (HSCT)"

The document's item date is **2/16/2024**, which is *earlier* than that 2026-09-13 check, so
this is not immunize.org having republished — the earlier verification was simply wrong, most
likely read with a tool that truncated page 2 or flattened it. The label and the comment both
need correcting.

**This changes NOTHING about the transplant hard stop.** Table 5 is a post-transplant
schedule, and `CLAUDE.md` is explicit that ticking the transplant box stops the engine and
that no post-transplant schedule is ever to be re-added (OWNER DECISION 2026-10-16). Finding
that a cited document still contains such a table is *more* evidence for that decision, not
less: it is the fifth time in six weeks that a post-transplant source statement has been
found misdescribed. **Do not propose re-adding Table 5's schedule.** The only action here is
to stop the app describing this document inaccurately.

**2. p2016 never mentions PCV21.** Every option it gives is PCV15 or PCV20. Checked against
the engine: **0** child cards offer PCV21 while listing p2016, so nothing is wrong today —
but a future change that offers PCV21 under 19 would silently create an unsupported citation.

### What the document contains

| Table | Covers |
|---|---|
| 1 | PCV for **all** children (healthy and at-risk) age 2–23 months, by age now × previous doses |
| 2 | PCV for **healthy** children 24 months–18 years |
| 3 | The risk-condition list, split **non-IC** / **IC** |
| 4 | Children 24 months–18 years **with risk conditions** — Option A / Option B, split non-IC vs IC |
| 5 | Post-HSCT (see correction 1 — not used by this app, and must not be) |

### Sentences verified, with the table and row each sits in

**(A) Table 1, footnote `†`** — the source of both infant interval variants the app states:

> "Minimum interval between doses: for children younger than age 12 months = 4 weeks; for
> children age 12 months or older = 8 weeks"

**(B) Table 1, footnote `*`** (also printed under Table 2):

> "If only PCV13 is available when the child is scheduled to receive PCV, PCV13 may be given
> as previously recommended."

**(C) Table 2, row `5 through 18 years` / `No previous doses or any incomplete PCV schedule
by 24 months`:**

> "No additional doses"

**(D) Table 2, row `24 through 59 months` / `No previous doses, or any incomplete PCV
schedule by age 24 months`:**

> "1 additional dose, at least 8 wks after most recent PCV dose"

**(E) Table 4, row `2 through 18 years (any risk condition)` / `Completed PCV series before
age 6 years, including one or more doses of PCV20`:**

> "No additional doses"

**(F) Table 4, row `24 through 71 months (any risk condition)` / `Any incomplete schedule of
0, 1, or 2 PCV doses by age 24 months`, Option A:**

> "2 doses of PCV20 or PCV15,‡ given at least 8 weeks apart"

**(G) Table 4, row `24 through 71 months (any risk condition)` / `3 doses of PCV, all before
12 months`, Option A:**

> "1 dose of PCV20 or PCV15‡"

**(H) Table 4, rows `6 through 18 years (non-IC)` and `6 through 18 years (IC)` / `No
previous dose of PCV13, PCV15, or PCV20`, Option B:**

> "1 dose of PCV15 at least 8 weeks after most recent pneumococcal vaccination. At least 8
> weeks later, give 1 dose of PPSV23, if PPSV23 not previously given. If PPSV23 previously
> given, do not give another dose of PPSV23."

**(I) Table 4, row `6 through 18 years (IC)` / `PCV13 only, given at or after age 6 years`,
Option B** — note the 5-year follow-on, which the **non-IC** row of the same history does
**not** have:

> "1 dose of PPSV23 at least 8 weeks after most recent PCV13 dose; at least 5 years after the
> first PPSV23 dose, give 1 dose of PCV20 or a second dose of PPSV23"

**(J) Table 4, footnote `§`** — attached to the **non-IC** row's `no PPSV23§`:

> "If PPSV23 previously given, then child is complete."

**(K) Table 4, footnote `ǁ`** — attached to the **IC** row's `no PPSV23ǁ`:

> "If PPSV23 previously given, options are (a) give one dose of PCV20 at least 8 weeks after
> most recent pneumococcal vaccination, or (b) give a second dose of PPSV23 five years after
> the first dose of PPSV23."

**(L) Table 4, footnote `‡`:**

> "If PCV15 is used, one or two additional pneumococcal vaccine doses will be needed."

### Patient population each sentence was written about (C6's note)

| Quote | Ages | Risk class |
|---|---|---|
| (A), (B) | 2–23 months (A); any child (B) | any, healthy included |
| (C) | **5–18 years** | **healthy only** — Table 2's title |
| (D) | **24–59 months** | **healthy only** |
| (E) | 2–18 years | any risk condition |
| (F), (G) | **24–71 months** | any risk condition |
| (H) | **6–18 years** | either, the wording is identical in both rows |
| (I) | **6–18 years** | **IC only** |
| (J) | 2–18 years | **non-IC only** |
| (K) | 2–18 years | **IC only** |
| (L) | 24 months–18 years | any risk condition |

⚠ **(J) and (K) are the pair to be most careful with.** They answer the same question — *what
if PPSV23 has already been given?* — and give **opposite** answers depending on risk class:
non-IC is finished, IC still has two doses available to it. Attaching (J) to an
immunocompromised child is both a wrong-population citation and clinically short of the
source. That is not hypothetical here — see finding 1 below.

### Disposition for this document's 34 statements

**30 → CITE.** The match is unusually good: this is the document the paediatric engine was
built from, and many card sentences are near-verbatim. Highlights:

| # | Cards | Quote it earns | Population checked |
|---|---|---|---|
| 1 | 1,494 | **(C)** | healthy 5–18 ✓ |
| 2 | 960 | **(E)** | any risk ✓ |
| 3 | 896 | **(F)** + **(L)** for the PCV15 half | 24–71 mo, any risk ✓ |
| 5 | 528 | **(H)** — verbatim, including "if PPSV23 not previously given" | 6–18 ✓ |
| 6 | 456 | **(K)** | **456 IC, 0 non-IC** ✓ exactly footnote ǁ |
| 7 | 408 | **(K)** | IC ✓ |
| 13, 15, 20, 16, 22, 29, 9 | 1,064 | **(A)** for the 4-week vs 8-week split; Table 1's own rows for the dose counts | 2–23 mo ✓ |
| 18 | 153 | **(I)** — verbatim, and the card correctly calls it "the immunocompromising row" | IC ✓ |
| 19 | 132 | **(D)** | healthy 24–59 mo ✓ |
| 21 | 96 | **(H)**'s second sentence | 6–18 ✓ |
| 23 | 80 | **(J)** | **0 IC, 80 non-IC** ✓ exactly footnote § |
| 31–34 | 80 | Table 4's `Completed PCV series before age 6` rows, non-IC and IC taken separately | ✓ |

**4 → HELD. Each is a finding beyond citation, and each needs the owner.** Set out in full
below rather than buried in this table.

### ⚠ Finding 1 — 69 immunocompromised children are told "complete" where p2016 gives two more options

Statement **#12** (208 cards) reads:

> "No further PCV or PPSV23 is needed — the paediatric high-risk series is complete. All
> conjugate doses on record were given before age 6 (72 months) and PPSV23 has been received,
> which completes the series."

Measured, that card fires for **78 immunocompromised children** as well as 130 non-IC ones.
Splitting the IC group by whether a PCV20 is on record:

| IC children getting "complete" | Cards | p2016's answer |
|---|---|---|
| a PCV20 or PCV21 **is** on record | **9** | **(E)** — "No additional doses". The app is right. |
| **no PCV20** on record, PPSV23 given | **69** | **(K)** — "options are (a) give one dose of PCV20 at least 8 weeks after most recent pneumococcal vaccination, or (b) give a second dose of PPSV23 five years after the first dose of PPSV23" |

So for **69 cards** — e.g. a 6-year-old with asplenia, one PCV15 at age 4, PPSV23 since —
the app says the series is complete and p2016 says the child still has PCV20 or a second
PPSV23 available. The app is applying footnote **(J)**, the non-IC rule, to an IC child.

**The engine already knows this rule** — statement #26 states exactly (K) for an IC child,
and fires on 48 cards. The branch that is missing it is specifically **IC + series completed
before age 6 + PPSV23 already given**. Nearby cases are handled correctly: #33/#34 give an
IC child who completed before 6 **without** PPSV23 both options, and #26 covers an IC child
whose PCV13 was given **at or after** 6.

**This is a clinical gap, not a citation defect, and it is not C8's to fix on its own
initiative.** It needs the `verify-clinical-source` procedure against CDC's child schedule
(document 5, not yet read) before any code moves, since `CLAUDE.md`'s authority rule puts
ACIP/CDC and AAP above immunize.org.

### ⚠ Finding 2 — 110 cards state a 5-dose infant series; p2016's Table 1 tops out at 4

Statements **#24** and **#27** say "Catch-up infant PCV (PCV15 or PCV20): **5 doses in
total** for this child [c]", with the marker crediting p2016. Totals the infant cards state,
measured:

| Stated total | Cards | In p2016 Table 1? |
|---|---|---|
| 2 doses | 264 | yes |
| 3 doses | 297 | yes |
| **5 doses** | **110** | **no — Table 1's largest is 4** |

What produces it: a 6-month-old with **four** PCV20 doses already given, 4 weeks apart, all
before age 7 months. None of them is the ≥12-month booster, so a fifth is still owed. Table
1's rows stop at "3" previous doses, so the document has no row for this record at all.

**The app's reasoning is sound** — Table 1 does require the last dose "at age 12–15 months",
and (A) supplies the 4-week minimum these doses were given at. What is wrong is only that
the marker credits p2016 for the number **5**, which p2016 never states. This is the "card
states a figure its quote never says" class the plan counts separately (1,039 cards).

### ⚠ Finding 3 — 32 cards cite a row whose label describes a different history

Statement **#30** says "This is the at-risk catch-up for a child 24–71 months who had **3 PCV
doses before 24 months**". p2016's row (G) is labelled "3 doses of PCV, all **before 12
months**". Measured, all 32 cards are children whose three doses were given at roughly **16,
18 and 20 months** — i.e. all *after* 12 months, so (G)'s row does not describe them, and
neither does (F), which is for "0, 1, or 2 PCV doses". **p2016's Table 4 has no row for this
history.**

The advice itself is defensible — three doses after 12 months is at least as well primed as
three before 12 months, and the app gives the same single dose (G) gives — but the card
describes itself in words p2016 does not use for that history, which is the wrong-row
cousin of a wrong-population quote.

---

---

## Document 5 — CDC Child & Adolescent Immunization Schedule, pneumococcal notes

- **URL:** https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo
- **Read live:** 2026-10-17 in the browser pane, with the page's collapsed "Special
  situations" sections **expanded** — they are shut by default, and a reader who does not
  expand them sees only the section titles. This is the whole of the paediatric risk-based
  rulebook and it is invisible until you click.
- **Edition, read off the page:** *Recommendations for Ages 18 Years or Younger, United
  States, 2025*, **July 2, 2025**.
- ⚠ **Read and record the page's own legal banner**, because it determines which edition is
  current:

> "Pursuant to the preliminary order issued on March 16, 2026, in American Academy of
> Pediatrics et al. v. Kennedy et al., No. 1:25-cv-11916 (D. Mass.), which stayed all votes
> taken by the ACIP during its June, September and December 2025 meetings, and further
> stayed the Acting CDC Director's January 5, 2026 Decision Memo revising the CDC's
> childhood immunization schedule, the July 2, 2025 immunization schedule posted here is the
> current CDC Child and Adolescent Immunization Schedule by Age for Healthcare
> Professionals."

So the **July 2, 2025** schedule is current, and the later ACIP votes and the January 2026
decision memo are stayed. Any future session tempted to "update to the newest CDC child
schedule" must read this banner first.

### Sentences verified

**(A) "Routine vaccination with PCV":**

> "4-dose series at 2, 4, 6, 12–15 months"

**(B) "Catch-up vaccination with PCV":**

> "Healthy children ages 2–4 years with any incomplete* PCV series: 1 dose PCV"

**(C) Special situations, the NON-IC list** (CSF leak; chronic heart; chronic kidney
excluding dialysis/nephrotic; chronic liver; chronic lung incl. moderate/severe persistent
asthma; **cochlear implant**; diabetes), **Age 2–5 years:**

> "Completed recommended PCV series but have not received PPSV23 — Previously received at
> least 1 dose of PCV20: no further PCV or PPSV23 doses needed — Not previously received
> PCV20: administer 1 dose PCV20 or 1 dose PPSV23 administer at least 8 weeks after the most
> recent PCV dose."

**(D) Same NON-IC list, Age 6–18 years:**

> "Received 1 dose PCV13 and 1 dose PPSV23 at or after age 6 years: no further doses of any
> PCV or PPSV23 indicated."

**(E) Special situations, the **IC** list** (maintenance dialysis, nephrotic syndrome,
asplenia or splenic dysfunction, congenital or acquired immunodeficiencies, immunosuppressive
drugs or radiation therapy incl. malignant neoplasms / leukaemias / lymphomas / Hodgkin /
solid organ transplant, HIV, sickle cell or other haemoglobinopathies), **Age 2–5 years:**

> "Completed recommended PCV series but have not received PPSV23 — Previously received at
> least 1 dose of PCV20: no further PCV or PPSV23 doses needed — Not previously received
> PCV20: administer 1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after the most recent PCV
> dose. **If PPSV23 is used, administer 1 dose of PCV20 or dose 2 PPSV23 at least 5 years
> after dose 1 PPSV23**"

**(F) Same IC list, Age 6–18 years:**

> "Received PCV before age 6 years but have not received PPSV23 — Previously received at
> least 1 dose of PCV20: no additional dose of PCV or PPSV23 — Not previously received
> PCV20: administer 1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after the most recent PCV
> dose. **If PPSV23 is used, administer either PCV20 or dose 2 PPSV23 at least 5 years after
> dose 1 PPSV23.**"

**(G) Same IC list, Age 6–18 years:**

> "Received 1 dose PCV13 and 1 dose PPSV23 at or after age 6 years: administer 1 dose PCV20
> or 1 dose PPSV23 at least 8 weeks after the most recent PCV13 dose and at least 5 years
> after dose 1 PPSV23."

**(H) Footnote `**`:**

> "When both PCV15 and PPSV23 are indicated, administer all doses of PCV15 first. PCV15 and
> PPSV23 should not be administered during the same visit."

**(I) "Additional information":**

> "For calculating intervals between doses, 4 weeks = 28 days."

### Patient population each sentence was written about (C6's note)

| Quote | Ages | Risk class |
|---|---|---|
| (A) | infants | any, healthy included |
| (B) | **2–4 years** | **healthy only** |
| (C) | **2–5 years** | **non-IC special situations only** |
| (D) | **6–18 years** | **non-IC only** |
| (E) | **2–5 years** | **IC only** |
| (F), (G) | **6–18 years** | **IC only** |
| (H), (I) | any child | any |

⚠ **(C) vs (E), and (D) vs (G), are the same question answered differently by risk class** —
the same trap as p2016's footnotes § and ǁ, and CDC draws it in the same place. The IC
version always carries a **further dose at 5 years** that the non-IC version does not.

### Disposition for this document's 3 statements

| # | Cards | Statement | Disposition |
|---|---|---|---|
| 1 | 456 | "Alternative to the PCV20 above: a 2nd PPSV23 ≥5 years after the first PPSV23. Choose ONE option (PCV20 or 2nd PPSV23), not both." | **CITE (E)/(F)** — near-verbatim, and measured **456 IC / 0 non-IC**, so it is correctly confined to the risk class those sentences were written about. |
| 2 | 208 | "No further PCV or PPSV23 is needed — the paediatric high-risk series is complete…" | **HELD — this is finding 1.** The same card as p2016 #12. |
| 3 | 48 | "At-risk child 24–71 months who has already received the age-appropriate at-risk PCV catch-up dose(s) at ≥24 months — complete. If PCV15 was used, ensure a PPSV23 follow-up." | **HELD — findings 4a and 4b.** Note it carries **no `[c]` marker at all**, so it is an uncited statement outright. |

Also worth noting for C8: **(A) is the true source for the "4-dose series at 2, 4, 6, and
12–15 months" wording** in statements #13/#15/#20, which currently credit p2016 — p2016
states "4 doses … last dose at age 12–15 months" but never prints the 2/4/6 months. And
**(B) is the source for "CDC's catch-up row covers healthy children only through age 4"** in
statement #1.

---

## ⛔ FINDING 1 — ADJUDICATED, AND CONFIRMED BY BOTH SOURCES

`CLAUDE.md`'s authority rule puts ACIP/CDC above immunize.org, so finding 1 was held until
CDC's own child schedule could be read. **It has been, and CDC says the same thing as
p2016.** The finding stands.

**The patients:** an immunocompromised child (asplenia, HIV) who completed PCV13/PCV15
before age 6, has had PPSV23, and has **no PCV20** on record. **69 cards.**

| Source | What it says for exactly this patient |
|---|---|
| CDC child notes **(F)**, IC, 6–18 y | "Not previously received PCV20: administer 1 dose PCV20 or 1 dose PPSV23 … **If PPSV23 is used, administer either PCV20 or dose 2 PPSV23 at least 5 years after dose 1 PPSV23.**" |
| CDC child notes **(E)**, IC, 2–5 y | "…**If PPSV23 is used, administer 1 dose of PCV20 or dose 2 PPSV23 at least 5 years after dose 1 PPSV23**" |
| immunize.org p2016 footnote **ǁ** | "If PPSV23 previously given, options are (a) give one dose of PCV20 at least 8 weeks after most recent pneumococcal vaccination, or (b) give a second dose of PPSV23 five years after the first dose of PPSV23." |
| **The app** | "No further PCV or PPSV23 is needed — the paediatric high-risk series is complete." |

**The control check that makes this a real gap and not a reading error.** Every one of those
69 patients was re-run and **every card they see** was listed. Each sees exactly **one**
card — `PCV/complete: PCV series complete (PCV before age 6 + PPSV23)` — and no PPSV23 or
PCV20 recommendation anywhere else. Nothing is recovered on another card.

The engine **already states the correct rule elsewhere** (statement #26, 48 cards, for an IC
child whose PCV13 came at or after age 6), and handles the neighbouring cases correctly
(#33/#34 give an IC child who completed before 6 **without** PPSV23 both options). The branch
that is wrong is specifically **IC + completed before age 6 + PPSV23 already given**, where
it applies the **non-IC** rule.

## ⛔ FINDING 4 — the same root cause, two more branches, 23 more cards

Found while dispositioning document 5's statement #3. Same control check applied: each of
these patients also sees **exactly one card**, saying complete.

**4a — 8 cards. An at-risk child 24–71 months, PCV13 only, NO PPSV23, no PCV20.**
e.g. age 5, asplenia or cochlear implant, three PCV13 doses given at ≥24 months.

| Source | For this patient |
|---|---|
| CDC **(C)** non-IC / **(E)** IC, 2–5 y | "Not previously received PCV20: **administer 1 dose PCV20 or 1 dose PPSV23** at least 8 weeks after the most recent PCV dose." |
| **The app** | "complete. If PCV15 was used, ensure a PPSV23 follow-up." — and PCV15 was *not* used, so nothing is offered. |

**4b — 15 cards. An IC child 24–71 months, PCV13 only, PPSV23 given five years ago, no
PCV20.** Same root as finding 1: CDC **(E)** gives "1 dose of PCV20 or dose 2 PPSV23 at
least 5 years after dose 1 PPSV23", which is now due; the app says complete.

The 25 remaining cards under that statement are **non-IC with PPSV23 already given**, and
for those "complete" is right — CDC **(C)** has no 5-year follow-on. The app is not
uniformly wrong; it is wrong exactly where the IC/non-IC split falls.

### Total exposure, measured

| Finding | Patients | Who they are | What is missed |
|---|---|---|---|
| 1 | **69** | IC child, PCV completed before 6, PPSV23 given | PCV20 now, or 2nd PPSV23 at ≥5 y |
| 4a | **8** | At-risk child 24–71 mo, PCV13 only, no PPSV23 | PCV20 **or** PPSV23 at ≥8 weeks |
| 4b | **15** | IC child 24–71 mo, PCV13 only, PPSV23 given | PCV20, or 2nd PPSV23 at ≥5 y |
| | **92** | | |

**Why no test caught it.** Both verdict corpora record `status` and `brands` — a card that
says `complete` with no brands is a committed, green line. Neither corpus asks whether
`complete` is the *right* answer for the risk class, and no test compares an IC branch to
its non-IC twin. This is the same blind spot as "verdict corpora do not record prose",
one level up: the corpora do not record **clinical adequacy**, only stability.

**These are not C8's to fix.** C8 adds and removes citations. Changing what 92 children are
recommended is a clinical change, needs its own failing tests, and needs the owner's
decision — brought to her 2026-10-17, together with the quotes above.

---

## Documents still to read

| # | Document | Why it matters |
|---|---|---|
| 4 | CDC PCV Catch-up Job Aid (PDF) | 2 statements, 1,626 cards — the children's 8-week catch-up gap. |
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
