# C7 — live source readings for the citation work (2026-10-17)

**STATUS: IN PROGRESS. 1 of 6 documents read.** This file is the record C7 exists to
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

---

## Documents still to read

| # | Document | Why it matters |
|---|---|---|
| 2 | CDC Adult Pneumococcal Vaccine Timing Job Aid (PDF) | 15 statements, 7,524 cards. Holds every adult interval the app states. **Note: it is a PDF; earlier sessions recorded that PDFs do not open in the browser pane** — plan for another route before starting. |
| 3 | immunize.org p2016 (PDF) | The largest by far: 34 statements, 8,678 cards. The paediatric default. |
| 4 | CDC PCV Catch-up Job Aid (PDF) | 2 statements, 1,626 cards — the children's 8-week catch-up gap. |
| 5 | CDC Child/Adolescent Notes | 3 statements, 712 cards. |
| 6 | CDC Adult Notes | 1 statement, 25 cards. |

Four of the six are PDFs. That is the main practical obstacle and should be solved once,
at the start, rather than per document.
