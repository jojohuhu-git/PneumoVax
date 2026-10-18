# C7 — live source readings for the citation work (2026-10-17)

**STATUS: ALL 6 DOCUMENTS READ (2026-10-17).** The reading phase of C7 is complete.
One disposition is open and needs the owner: document 4's statement 1, below. This file is the record C7 exists to
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

**68 distinct (uncredited source, statement) pairs**, over 6 documents.
⚠ **Re-measured 2026-10-17 after the IC-children fix: now 71.** The current table is in
document 6's section below; the figures here are the ones the plan was written against:

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
> aid, which prints them.

### ✅ OWNER DECISION + APPLIED 2026-10-17 — all six removals

*"Approve all six removals."* Brought to the owner as one batch with each statement's live
quote and its re-measured card count. **Removals applied**, held by
`regression-c8-doc1-mmwr-only-where-it-speaks.test.js` (17 tests; 10 passing / 7 failing
before the fix, 17 after).

| cards | statement | mm7401a1 |
|---|---|---|
| 2,610 | series includes PCV20/21 → complete | REMOVED |
| 1,154 | ≥1 year after the PPSV23 dose | REMOVED |
| 914 | PCV15 + PPSV23 → complete | REMOVED |
| 440 | ≥5 years is a shared clinical decision | REMOVED |
| 138 | PPSV23 ≥1 year after PCV15 | REMOVED |
| 75 | …the same, plus the 8-week option | REMOVED |
| **5,331** | **six statements** | **off** |
| 2,544 | the seven ≥50-expansion / PCV13-experienced statements | kept |

Measured on the combined tree: every mm7401a1 button **7,920 → 2,564**; the uncredited
subset **7,875 → 2,544**; total grey buttons **45,841 → 39,395**; unpointed buttons
**26,651 → 20,205**; cards carrying at least one unpointed button **16,878 → 15,943**; and
**"cards citing a document with no button" still 0** — no removal orphaned a citation.

⚠ **It collided with a pre-existing test, and the collision was real.** S15 asserted
mm7401a1 on *every* adult card, using the PCV15-only fixture — one of the six removals. S15
exists because a 19–49 card once linked the superseded **rr7203a1 (2023)** and not
mm7401a1. **Checked before narrowing anything:** rr7203a1 reaches **0 of 17,334 cards both
before and after** this change, and the PCV15-only card is left holding the Adult Notes and
the job aid, the document that prints its interval. So the assertion was narrowed to the
hazard S15 actually names, in both directions, and S15's own comment — which claimed
rr7203a1 was "still reachable" via risk conditions — was stale and is corrected.

**The two PCV13 cards keep mm7401a1 for the "PCV20 or PCV21, and NOT PPSV23" half only.**
The ≥1 year and ≥5 years in those same sentences are the job aid's, and that is a document 2
CITE, still unwritten. Do not let one quote cover both halves.

### ✅ OWNER DECISION 2026-10-18 — the job aid's 3 cell-only statements: *"use MMWR table"*

The three statements held open at the top of document 2's section (3,189 cards) rested on
job-aid table **cells** and on no prose anywhere in that document. Pulled with coordinates,
its page-1 `PCV13 at any age & PPSV23 at <65 yrs` row contains exactly two pieces of text:

```
y= 266.6  x= 246.1-286.9 | ≥5 years
y= 267.5  x= 309.5-396.3 | PCV20 or PCV21
```

Two fragments at two x positions; the meaning is carried by the row label and the column
header. A readable quote would have to be **assembled**, which is the same failure that
already dispositioned the job aid's statement #8 (171 cards) as REMOVE for resting on page
headings rather than words.

The owner's answer was to cite ACIP instead, naming all three rows herself:

| Card | mm7401a1's row, her words |
|---|---|
| PPSV23 only (1,154) | "A single dose of PCV21, PCV20, or PCV15 ≥1 year after the last PPSV23 dose." |
| PCV13 only (523) | "A single dose of PCV21 or PCV20 **administered** ≥1 year after the PCV13 dose." |
| PCV13 + PPSV23 (1,512) | "A single dose of PCV21 or PCV20 ≥5 years after the last pneumococcal vaccine dose. The pneumococcal vaccination series is complete, and it need not be followed by additional pneumococcal vaccine doses." |

Two of the three were already on the cards (`mmwrPpsvOnlyThenPcv` from FINDING F below, and
`mmwrIc1949OnePpsv` / `mmwrBothPcv13Ppsv50plus` from document 1's CITEs). The third is new.

⚠ **The "PCV13 only" row is printed in TWO wordings, ONE WORD apart.** The 19–49
immunocompromising block inserts "administered"; the ≥50 and 19–49 chronic blocks do not.
Her quote is the IC one, which matches the patient she was shown (19y, asplenia). Two
entries, not one widened population: `mmwrPcv13OnlyThenPcv1949Ic` and
`mmwrPcv13OnlyThenPcv`. The predicate choosing between them is the **S15 interval decision**
(`ppsvIntervalDays != null` ⟺ 19–49 IC / cochlear / CSF), reused rather than re-derived, so
the risk-class split keeps one home.

**Applied 2026-10-18.** The job aid comes off those 3,189 cards: **6,805 → 3,616 buttons,
and 0 uncredited** — the second document to finish. Prose over both corpora: **3,361 of
35,280 lines differ**, and on every one the only change is the added marker, the two new
quotes and the two button labels — **no advice moved**. New file:
`regression-c8-2026-10-18-job-aid-cells-replaced-by-acip.test.js`.

⚠ **A blind assertion caught while writing that file.** Its `JOB_AID` constant was first
written as the job aid's `label`, but a card exposes `short` — so `not.toContain(JOB_AID)`
passed on every card in the app, including ones that list the document. Three of five
"failing" tests were passing vacuously. The file now asserts `short !== label` so the same
blind spot cannot return silently. Compare the `not.toContain('deletedName')` hazard in the
stale-identifier guard: an assertion that can never fail reads as coverage.

---

### ⚠️ FINDING F, 2026-10-18 — this reading never read the document's table

**What is wrong with the section above.** Document 1's reading records three sentences —
**(A)** and **(B)** from the Summary box, **(C)** from the body prose under "Recommendations
for Use of PCV". It does not mention mm7401a1's **clinical guidance table** at all. The six
removals were dispositioned on that basis ("Nothing in mm7401a1 states this"), the owner
approved them as a batch, and `1ec86c6` took the document off 5,356 cards.

The table was first read the **following session**, which cited it seven times (`1a4d968`).
Nobody re-checked the removals against it.

**Five of the six statements are in the table, in full sentences.** Re-read 2026-10-18 from
the live page and from the owner's PDF of the article; they agree character for character.

| Cards | Removed because mm7401a1 "doesn't say it" | The table's row |
|---|---|---|
| **1,154** | PCV15/20/21 **≥1 year** after PPSV23 | **"PPSV23 only"**, all three blocks: *"A single dose of PCV21, PCV20, or PCV15 ≥1 year after the last PPSV23 dose."* |
| **440** | ≥5 y is a **shared clinical decision** ("this paper does not discuss the shared-decision path") | **"PCV13 at any age and PPSV23 at age ≥65 years"**: *"Shared clinical decision-making is recommended regarding administration of either a single dose of PCV21 or PCV20 for any adult aged ≥65 years…"* |
| 138 | PPSV23 **≥1 year** after PCV15 | *"If PCV15 is administered, a single dose of PPSV23 should be administered ≥1 year after the PCV15 dose"* — printed inside the **"None or PCV7 only"** row |
| 75 | …plus the **8-week option** | *"A minimum interval of 8 weeks can be considered if PCV15 is used in adults with an immunocompromising condition, cochlear implant, or CSF leak"* — same row |
| 25 | PPSV23 **≥8 weeks** after PCV15 (19–49 IC) | 19–49 IC block, same row: *"If PCV15 is used, administer a single dose of PPSV23 ≥8 weeks after the PCV15 dose."* |

The remaining removal (2,610 + 914 cards, the two "series is complete" families) is correct:
the table never says a series containing PCV20/PCV21 is complete, nor that PCV15 followed by
PPSV23 completes one.

**The recorded accounting was also 25 short.** It totals the removals at 5,331; measured on
the current tree the document is absent from **5,356** cards in 9 prose variants. The missing
25 are the 19–49 IC "PPSV23 ≥8 weeks after PCV15" variant of the PCV15-only card, which the
six-row table does not list separately.

#### ✅ OWNER DECISION 2026-10-18 — restore two, leave three

Brought as patients, with each row quoted:

- **RESTORED, 1,594 cards.** The two whose table **row heading is the patient's exact
  history**, so the sentence cannot be about anyone else: 19–49 or 50+ with PPSV23 only
  (1,154), and ≥65 with PCV13 and a PPSV23 given at 65 or older (440). Both now carry the
  row as a raised number, not just a button.
- **LEFT REMOVED, 238 cards.** PCV15 given, PPSV23 pending. The sentence fits the advice but
  is printed inside the "None or PCV7 only" row — the instruction for a clinician *choosing*
  PCV15, read by a patient already past that choice. Owner: *"use job aid since PCV15 isn't
  listed in the MMWR table"*.

⚠ **One wording trap, checked.** The owner's quote of the shared-decision row came from her
PDF of **mm7336a2** (MMWR 12 Sep 2024, the PCV21 paper), which prints it with **one comma
fewer** — "PCV21, PCV20 or PCV15". The chip links to **mm7401a1**, so mm7401a1's punctuation
is what `refs.js` carries, and a test asserts the mm7336a2 form is *not* present.

**Applied 2026-10-18.** Two new `refs.js` entries, `mmwrPpsvOnlyThenPcv` and
`mmwrSharedDecision65`. `regression-c8-doc1-mmwr-only-where-it-speaks.test.js` corrected:
LOSES drops from six statements to four, the two reversed assertions now assert the opposite
(the document **is** present) rather than being deleted, and the button count moves
**2,564 → 4,158**. Prose over both corpora: **1,637 of 35,280 lines differ**, and on every
one the only change is the added markers, the two new quotes and the restored button label —
**no advice moved**. New file:
`regression-c8-2026-10-18-mmwr-table-rows-restored.test.js`.

**The lesson, in one line: `scripts/uncreditedSources.mjs` can only see a document that is
ON a card.** A document wrongly removed from a card it speaks for is invisible to it — which
is why that script reported this work as finished while 1,594 cards were missing a source.

---

### ✅ OWNER DECISION 2026-10-18 — the last 45, and mm7401a1 reaches zero

The document's final uncredited statement was a **19–49 adult with chronic conditions only,
PCV13 and two effective PPSV23 doses** (45 cards): "No additional pneumococcal dose now —
re-evaluate at age 50." mm7401a1's chronic block prints one row for a PCV13 + PPSV23
history, headed **"PCV13 and 1 dose of PPSV23"**, and no second-dose row, so this file left
the 45 uncredited and took "remove it, or leave it" to the owner.

She chose a third answer — **cite the one-dose row**:

> *"for chronic condition with PCV13 and 2 doses of PPSV23 I would use the citation covering
> PCV13 and 1 dose of PPSV23 in patients 19-49 with chronic conditions: The pneumococcal
> vaccination recommendations should be reviewed again when the person reaches age 50
> years."*

**Why the count cannot change the row.** In the chronic block a second PPSV23 is never
*offered*. ACIP offers one only inside the immunocompromising block — mm7336a2 states the
same row as "When a second PPSV23 dose is used instead of PCV21 or PCV20, it should be
administered ≥8 weeks after the PCV13 dose and ≥5 years after the first PPSV23 dose" — while
the chronic 1-dose row offers nothing but the review at 50. So there is no second-dose
disposition for an extra dose to select; the row is the block's whole answer to "PCV13 and
PPSV23", and a chronic patient with two doses received one ACIP's chronic pathway never
recommended. **Checked in both papers:** neither mm7401a1 (Jan 2025) nor mm7336a2 (Sept
2024) has a chronic two-dose row, so the silence is the schedule's shape, not one document's
omission.

**Applied 2026-10-18.** `mmwrBothPcv13PpsvKey()`'s chronic branch returns the row
unconditionally; the IC branch still splits on `ppsv.count` and is now guarded by its own
test. Measured after: mm7401a1 **2,564 cards list it, 0 uncredited** — the first of the six
documents to finish. Total (source, statement) pairs over all documents **46 → 45**. Prose
over both grids: **45 of 35,280 lines differ, and on every one the only change is one added
`[c]` marker plus the new quote in the source list** — no advice moved.

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

### ⬖ PARTLY APPLIED 2026-10-17 — the two owner DECISIONS are in; the 12 CITEs are NOT

**Read this heading literally.** Document 2's disposition has two halves and only one of them
has landed. The REMOVE and the cite-or-remove split — the two things the owner decided — are
in the code. The **12 CITE statements are untouched**: each one still needs its inline `[c]`
marker pointed at the job aid's own sentence, with the quote recorded.

Measured on the combined tree (C2/C3 + this), **the job aid is still an uncredited button on
6,805 cards across 14 distinct statements.** That number falling is what finishing the CITEs
looks like; the 1,115 below is only the removals.

**Branch `feature/2026-10-17-c8-per-card-sources`, off `main` at `5bffe00`.** Both decisions
below — and only those two — are now in `recommend.js`, held by
`regression-c8-doc2-job-aid-only-where-it-speaks.test.js` (15 tests; 9 passing / 6 failing
before the fix, 15 after). **C2/C3 merged as PR #66 while this branch was being written**,
so the branch was rebased onto it: suite **1,178 passing in 102 files**, and the
`uncreditedSources.mjs` smoke test's skip is gone.

It never depended on C2/C3: the change is in the engine, not the renderer. Every mutation
count here was re-measured on the merged tree rather than carried over from the pre-merge
one, and four of them moved — documents 1 and 2 share one expression, so each other's tests
now catch more.

**The mechanism change the decisions needed is done and is reusable.** The adult pathway no
longer computes one source list and spreads it over all ten cards: `ADULT_DEFAULT_REFS` is
the default and a card asks for its own list through `adultRefs(...)`. A card that does not
ask is byte-identical to before, so **documents 1, 3, 5 and 6 need no further plumbing** —
only the owner's sign-off on their removals.

**Counts re-measured before applying, and they had moved.** The table below was measured
over 16,202 cards; the grid is now 17,334 after the IC-children fix. Statement #8 is **180
cards, not 171**; #1 (2,610 = 630 under 50 + 1,980 at 50+) and #4 (914 = 305 + 609) were
unchanged, so decision 2 moves **2,589 keep / 935 lose**, as decided. Measured effect on the
whole grid: grey buttons 45,841 → 44,726, unpointed buttons 26,651 → 25,536, the job aid's
own unpointed count 7,920 → 6,805 — all three exactly −1,115 — and "cards citing a document
with no button" stayed at 0.

**Checked live**, one patient with only the age changed: 35y with diabetes and a PCV20 on
record shows `[1]` CDC Adult Notes, `[2]` MMWR; at 55y the same card shows `[1]` CDC Adult
Notes, `[2]` CDC Adult Timing Job Aid, `[3]` MMWR — same sentence, word for word.

### ✅ OWNER DECISIONS 2026-10-17 — the two decisions, as made

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

## Document 6 — CDC Adult Immunization Schedule, pneumococcal notes

- **URL:** https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo
- **Read live:** 2026-10-17 in the browser pane. Unlike the child notes, this page's
  pneumococcal section was **already expanded** — both "Routine vaccination" and "Special
  situations" were in the page text without a click. 4,774 characters between the
  "Pneumococcal vaccination" heading and the next vaccine's, extracted by document range so
  the two age blocks could not be interleaved.
- **Edition, read off the page:** *Recommendations for Ages 19 Years or Older, United
  States, 2025*, **July 2, 2025**.
- The page's legal banner is the adult twin of document 5's, with one addition — an
  amendment this file had not recorded:

> "Pursuant to the preliminary order issued on March 16, 2026, in American Academy of
> Pediatrics et al. v. Kennedy et al., No. 1:25-cv-11916 (D. Mass.), which stayed all votes
> taken by the ACIP during its June, September and December 2025 meetings, and further
> stayed the Acting CDC Director's January 5, 2026 Decision Memo revising the CDC's
> childhood immunization schedule, the July 2, 2025 immunization schedule (as amended on
> April 27, 2026 to add the ACIP's April 2025 RSV recommendation as adopted by HHS) posted
> here is the current CDC Adult Immunization Schedule by Age for Healthcare Professionals."

### Which 25 cards these are

One statement, and it is the adult **"PCV15 given, PPSV23 still pending"** card
(`recommend.js:1097`). The card's interval sentence cites whichever document states the
number the card states — `adultPcv15ThenPpsv` (CDC Adult Notes) for the year,
`adultPcv15ThenPpsvShort` (mm7401a1) for the 8 weeks. So on the **19–49
immunocompromising / cochlear implant / CSF leak** cards the interval points at mm7401a1,
and the listed "CDC Adult Notes" button is left with nothing pointing at it. That is the
25.

### The statement, and the sentence that holds it up

The uncredited statement, as the engine renders it:

> "Give PPSV23 ≥8 weeks after the PCV15 dose [c] — the series is INCOMPLETE until then.
> PCV15 was given but PPSV23 is still pending; the pneumococcal series is complete once it
> is given. **If PPSV23 is unavailable, a dose of PCV20 or PCV21 may be substituted to
> complete.**"

The bolded sentence carries **no `[c]` at all** today, and CDC's Adult Notes states it
almost word for word, under "Special situations":

> "PPSV23 not available: adults aged 19 years or older who received PCV15 but have not yet
> completed PPSV23 series, can complete the series with either 1 dose of PCV20 or 1 dose of
> PCV21 if they no longer have access to PPSV23."

| Statement | Cards | Disposition |
|---|---|---|
| "If PPSV23 is unavailable, a dose of PCV20 or PCV21 may be substituted to complete." | 25 | **CITE (C).** Quote above. Give the sentence its own inline `[c]` → `cdcAdultPneumo`. |

**Document 6 produces no removals.** It is the only one of the six so far that does not,
and the reason is worth stating: its button was uncredited not because the page is
irrelevant to the card, but because the one sentence it *does* support had never been
given a marker.

**The population matches exactly**, which is the test this item exists to apply. CDC's
sentence is written about "adults aged 19 years or older who received PCV15 but have not
yet completed PPSV23 series" — which is this card's gate (`pcv.hasPCV15 && !ppsvGiven`),
not a near neighbour. The 25 cards are 19–49, and CDC's sentence says "19 years or older",
so it covers them.

### Checked and NOT a finding: the interval wording

The Adult Notes word the PCV15→PPSV23 interval **identically in both age blocks** — under
"Routine vaccination" (≥50) and under "Special situations" (19–49):

> "If PCV15 is used, administer 1 dose PPSV23 at least 1 year after the PCV15 dose (may use
> minimum interval of 8 weeks for adults with an immunocompromising condition,* cochlear
> implant, or cerebrospinal fluid leak)."

So on **this page** the 8 weeks is an option at 19–49, where mm7401a1's clinical guidance
table says "administer a single dose of PPSV23 ≥8 weeks after the PCV15 dose". That
difference is the S15 decision's subject matter and **the app already handles it
correctly** — it is not a new finding and must not be reopened here:

- `refs.js` stores this sentence verbatim as `adultPcv15ThenPpsv`, and its label already
  says *"This is the citation for the YEAR: every adult 50+, and 19-49 with chronic
  conditions only"*. Read live today, the stored quote matches the page **word for word**.
- The 8-week claim therefore never rests on this page: it cites `adultPcv15ThenPpsvShort`
  (mm7401a1 + the March 2025 Timing Job Aid). No card quotes the Adult Notes for a number
  the Adult Notes calls optional.

This is the same shape as document 2's split disposition, already decided, and it needs no
second decision.

### Re-measured counts (2026-10-17, post-IC-fix)

`npx vite-node scripts/uncreditedSources.mjs` re-run on this branch. **The totals in
"The measured scope" above are out of date**: the IC-children fix added cards and
statements, so the figure is now **71 pairs, not 68**.

| Document | Card instances | Distinct statements | Change since the first measurement |
|---|---|---|---|
| immunize.org p2016 | 8,789 | 37 | +111 cards, **+3 statements** (the new IC cards) |
| CDC Adult Timing Job Aid | 7,524 | 15 | unchanged |
| MMWR ≥50 expansion | 7,479 | 13 | unchanged |
| CDC PCV Catch-up Job Aid | 1,626 | 2 | unchanged |
| CDC Child/Adolescent Notes | 742 | 3 | +30 cards, same 3 statements |
| CDC Adult Notes | 25 | 1 | unchanged |
| **Total pairs** | | **71** | **+3** |

⚠ **The tool cannot run on `main`.** `scripts/uncreditedSources.mjs` imports
`noteCiteSlices` from `citations.jsx`, which exists only on the held C2/C3 branch — the
script was cherry-picked to `main` with the reading commits but its dependency was not. On
`main` it dies with `noteCiteSlices is not a function`. Run it from the C2/C3 branch until
that work merges.

---

## Document 4 — CDC PCV Catch-up Job Aid (PDF)

- **URL:** https://www.cdc.gov/vaccines/hcp/imz-schedules/downloads/job-aids/pneumococcal.pdf
- **Read:** 2026-10-17 from `~/Downloads/pneumococcal.pdf` — the owner had already saved it,
  so the one click this file recorded as the blocker was spent in an earlier session. 3
  pages, 93,006 bytes. Read with `python3 scripts/pdfLayout.py`, page by page, **positional
  not flat**, because every page is one wide table and a flat dump interleaves the columns.
- **Edition, read off every page footer:** **Revised January 2025**. Publisher mark
  `NCIRDWT`, pages numbered "1 of 3" … "3 of 3".
- `refs.js` describes it as *"CDC PCV Catch-Up Job Aid — Healthy Children 4 months–4 years
  (Jan 2025)"*. **That description is accurate** — checked against the document, unlike the
  p2016 "Tables 1–4" label that document 3 found wrong.

### What the document actually contains

One table, continued across three pages, keyed on **current age**:

| Page | Age band in the "IF current age is" column |
|---|---|
| 1 | 4 through 6 months; 7 through 11 months |
| 2 | 12 through 23 months |
| 3 | **24 through 59 months** — and the table ends here |

**There is no row past 59 months.** Every page carries the same footnote 1, which is the
document telling you what it is not:

> "Refer to the notes of the Recommended Child and Adolescent Immunization Schedule for Ages
> 18 Years or Younger–United States, 2025, for immunization guidance for children at
> increased risk for pneumococcal disease."

So: **healthy children only, 4 months through 4 years 11 months.** At-risk children are
handed to document 5. The intro sentence adds the precondition the app's validator already
enforces — "previous doses must be documented and must meet minimum age requirements and
minimum intervals between doses".

### Statement 2 of 2 — CITE, and it closes a real mismatch

The card (`recommend.js:509`, healthy child 24–59 months, PCV schedule incomplete):

> "Give 1 dose of PCV15 or PCV20, **≥8 weeks** after the most recent PCV [c]. This is the
> catch-up for a healthy child 24–59 months whose PCV schedule was not complete by 24
> months. If PCV15 is used, a PPSV23 follow-up is NOT routine for a healthy child — PPSV23
> here is risk-based only."

That `[c]` currently points at `pedsHealthyCatchup`, whose quote is from the Child/
Adolescent Notes:

> "Healthy children ages 2–4 years with any incomplete* PCV series: 1 dose PCV"

**That quote contains no interval at all.** The card states ≥8 weeks and its citation is
silent on the number — the same class of fault as a quote about the wrong patient, one step
sideways. The job aid states it verbatim, in the 24-through-59-months rows:

> "It has been at least 8 weeks since Dose 1" → "Give Dose 2 (Final Dose) today"
> "It has not been at least 8 weeks since Dose 1" → "Give Dose 2 (Final Dose) at least 8
> weeks after Dose 1"

and the same "at least 8 weeks" phrasing runs through the Dose 3 and Dose 4 rows. The app's
constant is `WK8 = DAYS.weeks(8)` = 56 days, rendered "≥8 weeks" — the **same number in the
same words**.

**Population match:** the job aid's row is keyed "IF current age is 24 through 59 months",
for a healthy child (footnote 1), with an incomplete series. That is this card's gate
exactly, not a near neighbour.

| Statement | Cards | Disposition |
|---|---|---|
| "Give 1 dose of PCV15 or PCV20, ≥8 weeks after the most recent PCV." | 132 | **CITE (C).** Attach the job aid to the **≥8-week interval**. The product names (PCV15/PCV20) are NOT in this document — the job aid says only "Dose" — so they keep resting on the Notes. One claim, one source. |

### Statement 1 of 2 — an OWNER DECISION, not a disposition I can take

The card (`recommend.js:524`, healthy 5–18 years), **1,494 cards — the largest single block
in C7**:

> "No PCV is indicated — healthy children 5–18 years are not routinely caught up [c].
> CDC's catch-up row covers healthy children only through age 4. PCV is recommended at this
> age only if a risk condition is present [c]."

Its two markers point at `pedsHealthyCatchup` (Child/Adolescent Notes) and
`cdcChildSpecialSituations`. The job aid is listed on the card and credited by neither.

The problem is that the card makes **two different kinds of claim** and the job aid holds up
only one of them:

| The card's claim | Is it in this document? |
|---|---|
| "CDC's catch-up row covers healthy children only through age 4" | **Yes — this is a claim about the document itself**, and the document says it twice over: its age column stops at "24 through 59 months", and its own title is "Healthy Children 4 months–4 years". |
| "healthy children 5–18 years are not routinely caught up" | **No. Not in any words.** The document has no row past 59 months, and that is all. |
| "PCV is recommended at this age only if a risk condition is present" | **No** — and it already cites `cdcChildSpecialSituations`, which is right. |

**This is document 2 statement 8's shape, with one difference that matters.** There the
rejected claim was *clinical* ("routine vaccination begins at age 50") inferred from a
document's structure, and it was removed. Here the supportable sentence is *bibliographic* —
it describes what the job aid covers — and that is readable from the table rather than
guessed from it.

**The finding underneath, which is bigger than the citation question:** *no document read in
this file states, in words, that healthy children 5–18 are not caught up.* Every source's
catch-up table simply stops at age 4 — the job aid at "24 through 59 months", the Child/
Adolescent Notes at "ages 2–4 years". The app's sentence is a sound clinical inference that
nothing quotes, so **no re-citation makes it quotable**. Recorded here, not fixed.

**The two readings, both defensible:**

| | What lands on the 1,494 cards |
|---|---|
| **(a) Cite the scope sentence** | Give "CDC's catch-up row covers healthy children only through age 4" its own `[c]` → the job aid, quoting the title and the final row. The button becomes credited; nothing is removed; the clinical sentence keeps resting on the Notes. |
| **(b) Remove the job aid** | Take the button off these 1,494 cards, consistent with document 2 statement 8. It stays on the 132 catch-up cards, where it earns its place. The clinical sentence is then backed by the Notes alone — which, per the finding above, does not state it in words either. |

Either way the *clinical* sentence gains no new source, because none exists. The choice is
only whether the job aid is credited for describing its own scope, or taken off the card.

**Not implemented. Awaiting the owner.**

---

## Documents still to read — none

All six are read. What is left is not reading but deciding and applying:

| Open | Where |
|---|---|
| Document 4 statement 1 — reading (a) or (b) | this file, document 4 above. **1,494 cards.** |
| Apply all six documents' dispositions | item **C8** in the parent plan. |

**The PDF obstacle is solved** (2026-10-17) and is not four documents but three — the
Child/Adolescent Notes and the Adult Notes are ordinary web pages.

| PDF | How to read it |
|---|---|
| Adult Timing Job Aid | **in `~/Downloads`**, saved 2026-10-17 10:31. Read. |
| immunize.org `p2016.pdf` | **downloads normally by command line** (211,252 bytes, HTTP 200). |
| CDC PCV Catch-up Job Aid | **in `~/Downloads/pneumococcal.pdf`**. Read 2026-10-17. cdc.gov's CDN returns **403** to every non-browser client, so a fresh copy still needs a browser save — but the owner had already saved this one, and the block this file recorded was therefore already spent. Check `~/Downloads` before asking for the click. |

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

---

# FINDING B closed: the 25 CITED quotes, all re-read live (2026-10-17)

**Owner decided 2026-10-17: yes, C7 must re-read the sources it already cites.**

C7's six documents were chosen by `scripts/uncreditedSources.mjs`, which lists sources a
card **names but never quotes**. A document that IS quoted therefore could never appear in
its scope — the blind spot a measurement cannot see about itself. This closes it by going
the other way: take every stored `quote` in `refs.js` and check it against the live page.

## Scope — the whole of it, not a sample

**25 stored quotes across 5 documents.** All 25 were checked, by exact string match after
normalising whitespace and dash characters, against the page fetched live on 2026-10-17.

| Document | Quotes | Verbatim? |
|---|---|---|
| CDC Child & Adolescent Schedule Notes (pneumococcal) | 11 | 11/11 ✓ |
| CDC Adult Schedule Notes (pneumococcal) | 9 | 9/9 ✓ |
| CDC Summary of Risk-based Pneumococcal Recommendations | 3 | 3/3 ✓ |
| ACIP MMWR mm7401a1 | 1 | 1/1 ✓ |
| immunize.org Ask the Experts (PCV7) | 1 | 1/1 ✓ |

**Result: 25 of 25 are verbatim accurate. Zero mis-citations.** The stored text is the
source's text.

⚠ Both CDC schedule-notes pages are accordions, **shut by default**. A plain fetch of the
child notes returns 8,409 characters of table of contents and not one word of the
pneumococcal rulebook. Expanded, the page is 62,265 characters. Any future check must
expand them or it will "verify" nothing and report success.

## What the re-read DID find

### 1. A rule the app had recorded as an inference, which CDC states outright

Finding A shipped branch 4 of the paediatric engine — PCV13 at/after age 6, PPSV23 already
given — with a comment saying **no source states that history** and that its five years was
read across from p2016. CDC's child notes state it, in the immunocompromising list:

> "Received 1 dose PCV13 and 1 dose PPSV23 at or after age 6 years: administer 1 dose PCV20
> or 1 dose PPSV23 at least 8 weeks after the most recent PCV13 dose **and at least 5 years
> after dose 1 PPSV23**."

It **conjoins** the two conditions — which is exactly what `icPostPpsv23DueState()`
computes. Finding A reasoned its way to a "later of the two" gate that was quotable all
along. Corrected in the code, cited as `pedsIcPcv13AndPpsvAt6`, and held by a test that
fails (verified by deliberately swapping the citation) if the card is ever cited to the
non-IC twin instead.

### 2. Six quotes that are accurate and still ambiguous — OPEN, not fixed

A quote can be word-perfect and still fail to say **which patient it was written about**.
Six of the 25 appear **more than once on their own source page**, once in each half of a
split the app's own logic turns on:

| Citation | Times on page | The split it straddles |
|---|---|---|
| `pedsRiskPcv20Complete` | 3 | non-IC ×2 and IC |
| `pedsRiskPcv13At6` | 2 | non-IC and IC |
| `pedsRiskIncompleteCatchup` | 2 | non-IC and IC |
| `adultPcv15ThenPpsv` | 2 | Routine (50+) and Special situations (19–49) |
| `adultPcv13Only` | 2 | Routine (50+) and Special situations (19–49) |
| `adultPcv7Only` | 2 | Routine (50+) and Special situations (19–49) |

`pedsRiskPcv13At6` is the sharp one: in the IC list that sentence is **followed** by "If
PPSV23 is used, administer 1 dose of PCV20 or dose 2 PPSV23 at least 5 years after dose 1
PPSV23", and the stored quote is the shared prefix with the IC tail cut off. A clinician
shown it cannot tell which list it came from.

**Nothing in the suite can see this.** `regression-n6-citations-follow-the-rulebook.test.js`
checks a citation's `rulebook` (child / adult / any), which separates a child's sources from
an adult's — it cannot separate IC from non-IC, or 19–49 from 50+, and those are the two
splits that actually matter here.

**The remedy is the patient-population field, and it is NOT started.** Deliberately: it is
a field on every ref plus a test, and guessing at its shape mid-session is how half-applied
rules happen. Recorded with its measured scope — 6 of 25 — so the next session can size it.

## Method, so this is repeatable

1. `refs.js` → every entry carrying a `quote`, grouped by URL.
2. Open each URL in the browser pane (cdc.gov returns 403 to curl), expand every
   `.collapse` and `[aria-expanded="false"]`.
3. Slice the pneumococcal section, normalise, and `indexOf` each quote — recording the
   **occurrence count**, not just found/not-found. The count is what surfaced finding 2.
