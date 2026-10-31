# PneumoVax — Clinical Specification

> **This file is PneumoVax's RULEBOOK** (owner decision, S8, 2026-10-11). It is the single
> document that states every clinical rule the app implements, with the source for each.
> `docs/agent/clinical-rules.md` is an agent-facing companion that may summarise but must
> never contradict it; `docs/agent/architecture.md` describes structure, not rules. When a
> rule changes, this file changes in the same pull request — and for the interval rules that
> is no longer an honour system: see §K "The rule table, row by row".
>
> **Verified against code: 2026-10-15.** §C and §J were found stating the risk-class-keyed
> adult PCV15→PPSV23 interval the owner amended on 2026-10-10 (A-P1-1), contradicting §K
> ten paragraphs later. Corrected, and guarded by `rule-docs-match-code.test.js`.

Every rule below is traceable to a source listed in §Sources. This document is the
authority the engine (`src/logic/recommend.js`) and validator (`src/logic/validate.js`)
implement against. **Sourcing is strict** — only the build-prompt §3 sources were used.
Where a rule could not be traced cleanly, the most protective reasonable reading was
implemented and flagged in HANDOFF.md / the final report.

Sources fetched live and read 2026-06-06.

---

## Sources

| Key | Source | Used for |
|---|---|---|
| `cdcChildPneumo` | CDC Child/Adolescent schedule notes — Pneumococcal | routine peds, healthy/at-risk catch-up |
| `cdcAdultPneumo` | CDC Adult schedule notes — Pneumococcal | adult routine ≥50, 19–49 risk, prior-vaccine matrix |
| `cdcCatchupJobAid` | CDC PCV catch-up job aid (healthy children 4mo–4y, Jan 2025) | healthy peds catch-up grid |
| `cdcAdultTimingJobAid` | CDC Adult pneumococcal timing job aid | adult intervals (≥1y vs ≥8wk) |
| `cdcPneumoIndex` | CDC HCP pneumococcal recommendations index | general |
| `mmwr7401a1` | MMWR mm7401a1 — adult ≥50 expansion (eff. 2024-10-23) | routine age lowered 65→50 |
| `mmwr7336a3` | MMWR mm7336a3 — PCV21 (Capvaxive) adults | PCV21 eligibility, serotype-4 geo note |
| `mmwr7203a1` | MMWR rr7203a1 — comprehensive adult ≥19 | **UNCITED since N5 (2026-10-16).** Kept as the primary-source record of where the adult risk list came from; superseded for the interval by `mmwr7401a1` (S15) and dropped from the risk list for consistency (§J). |
| `mmwr7239a5` | MMWR mm7239a5 — PCV20 in children | peds PCV20 |
| `mmwr7137a3` | MMWR mm7137a3 — PCV15 in **children** (whole-page entry) | the grey button for the document below |
| `pedsInfantLastDose1215mo` | MMWR mm7137a3 Table 2, "All children" block | **the infant booster at 12–15 months**, cited where the total exceeds what p2016's Table 1 prints (FINDING 2, 2026-10-18) |
| `p2016` | immunize.org p2016 (Tables 1–5) | **peds dose-count grids** |
| `immPCV7` | immunize.org Ask the Experts — PCV7 not counted | PCV7-ignored rule |
| `immPneumo` | immunize.org Ask the Experts — pneumococcal topic | edge cases |

**Precedence:** CDC schedule notes are primary for routine + at-risk peds/adult logic.
p2016 is the detailed companion for the peds dose-count grids. **There are no
post-transplant sources in this table any more** — three were deleted on 2026-10-16
(immunize.org p3086 Table 5, Fred Hutch LTFU §IX, ASCO 2024) when the app stopped stating
a post-transplant schedule. See §E/§F below.

---

## Products / brands

| Product | Name | Use | Counting |
|---|---|---|---|
| PCV7 | Prevnar (7v) | history only | **NOT counted.** High-risk → ignore entirely, treat PCV-naïve. Adult PCV7-only → treat as no prior PCV. (`immPCV7`, `cdcAdultPneumo`) |
| PCV13 | Prevnar 13 | history only | counts as prior PCV; "if only PCV13 available, may be given" (`p2016` Table footnotes) |
| PCV15 | Vaxneuvance | children + adults | counts; **requires a PPSV23 follow-up** (`cdcChildPneumo`, `cdcAdultPneumo`) |
| PCV20 | Prevnar 20 | children + adults | counts; **no PPSV23 needed**, a series incl. PCV20 = complete (`cdcAdultPneumo`, `p2016`) |
| PCV21 | Capvaxive | **adults ≥18 only** | counts (adults ≥18y); no PPSV23 needed; lacks serotype 4 (`mmwr7336a3`) |
| PPSV23 | Pneumovax 23 | risk-based, ≥2y | polysaccharide |

**Counting policy:** count PCV13/PCV15/PCV20 (+ PCV21 for patients ≥18y). PCV7 never counts.
Unknown/undocumented history → treat as unvaccinated (`cdcAdultPneumo`, CDC general).

---

## §A — Routine children 2–23 months (p2016 Table 1; `cdcChildPneumo`)

Applies to **all** children (healthy AND at-risk) age 2–23 months.

### §A-cite — which document states the infant TOTAL (C10-1, 2026-10-23)

**OWNER RULING A (2026-10-23) — the document order for paediatric intervals and totals.**
Her words: *"The Immunize.org sheet is built from the CDC/ACIP schedule. If the two ever
differ, the CDC/ACIP schedule is the authoritative source. CDC also says its catch-up table
should be used together with the Notes. The way I interpret this is the catch up table is
not the source of truth and may be considered if immunize.org does not provide a specific
recommendation."* So the order is **CDC/ACIP schedule Notes → immunize.org p2016 → CDC
catch-up table**. This does **not** disturb the 2026-10-17 rule that CDC beats immunize.org
where they disagree; it ranks the *catch-up table* below p2016 as an adjunct.

Two things verified live and recorded, because they change what may be cited for what:
- CDC's catch-up page does say, verbatim, *"Always use this table in conjunction with Table
  1 and the Notes that follow."*
- **p2016 carries no provenance statement at all** — the whole PDF was searched: no "based
  on ACIP", no CDC technical-review footer, only a pointer to CDC's PneumoRecs app.

So the ranking is an **OWNER CLINICAL DETERMINATION**, like the adult floors — not something
a document says. **Do not cite p2016 for its own authority.**

**OWNER RULING B (2026-10-23) — Table 1 states the TOTAL, for every child.** Table 1's own
heading, read live 2026-10-23 with `scripts/pdfLayout.py`:

> Table 1. Recommended schedule for administering pneumococcal conjugate vaccine (PCV) to
> **all children (healthy and those with risk conditions)** age 2 through 23 months

so it covers healthy children too and **there is no healthy/at-risk split to build**. Every
`p2016Table1_*` entry in `refs.js` therefore declares all three child populations.

**Why the infant card needs it.** The catch-up card states a total for the child in front of
you — "2 doses in total for this child" — and CDC's notes cannot carry that number: they give
the routine series and then punt, *"For other catch-up guidance, see Table 2."* Until C10-1
the card's one marker pointed at CDC's *"4-dose series at 2, 4, 6, 12–15 months"*, **a quote
stating a different number from the card**, on 781 cards. That is FINDING 2's fault (a total
ABOVE 4 credited to a document whose largest row says 4) found at the other end of the range.

**How it is cited now.** The `target` ladder in `recommend.js` IS Table 1 cell by cell, so it
RECORDS which row it used (`t1row`) and the card cites that row — but only when the row's own
stated total equals the number the card prints. A card printing a total of exactly 4 cites
CDC instead, because CDC's routine sentence states 4. This closes FINDING I ("the wrong ROW
of a document that does cover the patient") for the infant block by construction.

**p2016 comes OFF 1,633 cards** where CDC states the claim and is already cited: 1,072
at-risk Option A/B cards, 429 routine 4-dose cards, and 132 five-dose cards (Table 1's
prior-dose column stops at "2 or 3 before age 12 months", so it has no row that high).

**These entries are cited for the TOTAL only — never for an interval.** Table 1's row text is
ROUTINE spacing; its footnote † is the MINIMUM ("for children younger than age 12 months =
4 weeks; for children age 12 months or older = 8 weeks"). Mixing the two invents a divergence
that is not there.

Guard: `regression-c10-1-2026-10-23-infant-total-cites-p2016-table1.test.js`.

4-dose PCV (PCV15 or PCV20) at 2, 4, 6, 12–15 months.

Minimum interval: see **§L** — the number is CDC Catch-up Table 2's, keyed on the **dose
number** as well as the age. p2016 Table 1's footnote † ("<12 months = 4 weeks; ≥12 months
= 8 weeks") is the simplification of it, and remains the **validity floor** the recorded-dose
rule table applies. Dose 4 is not before 12 months either way.

Catch-up grid by current age band × # previous PCV13/15/20 doses × age-at-prior-doses
(p2016 Table 1 — implemented verbatim):

**2–6 months (current age):**
- 0 prior → 4 doses total (3 doses 8wk apart; last at 12–15mo).
- 1 prior → 3 more (2 doses 8wk apart; last at 12–15mo).
- 2 prior → 2 more (1 dose ≥8wk after most recent; last ≥8wk later at 12–15mo).
- 3 prior → 1 more at 12–15mo.

**7–11 months:**
- 0 before 7mo → 3 doses (2 doses 8wk apart; last at 12–15mo).
- 1 or 2 before 7mo → 2 more (1 dose 8wk after most recent; last ≥8wk later at 12–15mo).
- 3 before 7mo → 1 more at 12–15mo.
- 1 at ≥7mo → 2 more (1 dose 8wk after; last ≥8wk later at 12–15mo).
- 2 at ≥7mo → 1 more ≥8wk later at 12–15mo.

**12–23 months:**
- 0 before 12mo → 2 doses (8wk apart).
- 1 before 12mo → 2 more (1 dose ≥8wk after most recent; last ≥8wk later).
- 2 or 3 before 12mo → 1 more ≥8wk after most recent.
- 1 dose at ≥12mo → 1 more ≥8wk after most recent.

> Implementation note: PneumoVax models the **number of doses still needed and the next
> dose's minimum interval**, not a full multi-dose forecast. The grid above is reduced to:
> `dosesNeeded(currentAge, priorCount, ages)` + the §L min-interval and the 12-mo
> floor for the booster (dose ≥ "last dose at 12–15mo"). This is the snapshot model the
> sibling apps use.
>
> **The grid above was correct in this document and absent from the engine until
> 2026-10-11** (peds audit P0-2). `pcvInfant` carried a formula with no counterpart in any
> source — `Math.min(4, prior + 2)`, and a `prior < 1 ? 3 : 4` collapse of the entire 7–11
> month band — which over-stated the total in **5 of these 14 cells** and could render the
> impossible "PCV dose 5 of 4". The arithmetic the grid actually states is
> **`target = (the doses the row keys on) + (the doses it says are owed)`**, never
> `prior + owed`: "1 additional dose" is counted against the row's own key, so adding it to
> every prior dose double-counts a closing dose the child already received.

---

## §B — Healthy children 24 months – 18 years (p2016 Table 2; `cdcCatchupJobAid`)

- 24–59 mo, **completed any PCV schedule (incl. all-PCV13) by 24mo** → no additional doses.
- 24–59 mo, **no/incomplete schedule by 24mo** → **1 dose** PCV15/PCV20 ≥8wk after most recent PCV.
- 5–18 y healthy → **no additional doses** (healthy older children are not caught up).
- Both **healthy** "nothing needed" cards — the 5–18 one and the complete 24–59 month one —
  add **"Re-evaluate at age 50, when routine pneumococcal vaccination begins for every
  adult"** (`adultRoutine50`). **No at-risk card does** — see §B-50NOTE.

### §B-5TO18 — the healthy 5–18 card: what it cites, and the age-50 note

**C12, 2026-10-29. This closed the LAST uncredited source in the app**: measured over
17,407 cards, `scripts/uncreditedSources.mjs` reports **0** (document, statement) pairs, so
every grey chip on every card now has a number pointing at it. The card carried the CDC PCV
Catch-up Job Aid with nothing citing it, worth **1,584 cards** — C7's "document 4, statement
1", formally an owner decision, put to her twice in October and parked at her request.

**OWNER DECISION 2026-10-29.** Shown this card for a healthy 10-year-old with no risk
conditions and no doses, she chose: *"Take chip off - can you add a comment to re-evaluate
pneumococcal vaccines once the patient turns 50 years old and cite the necessary adult
reference?"*

**Why the job aid came off** (read in full first — the FINDING F discipline; the saved PDF
is 95,267 bytes, byte-for-byte what cdc.gov serves, sha256 `65aec99a…`, all three pages):
its oldest row is *"24 through 59 months"* and the table **ends** there, its title is
*"Catch-Up Guidance for Healthy Children 4 Months through 4 Years of Age"*, and footnote 1
hands at-risk children to CDC's notes. **It has no row for a child of 5–18.** Its title is
the only thing on it that touches this card, and a title says what a document covers rather
than stating a recommendation — the same shape the owner ruled on for the ADULT job aid on
2026-10-18 (*"use MMWR table"*). CDC's Child/Adolescent Notes row that stops at age 4
(`pedsHealthyCatchup`) carries the claim alone.

⚠ **MIRROR GUARD.** The job aid keeps its place on the **144** healthy 24–59-month cards
whose cells it states, pinned exactly. `scripts/uncreditedSources.mjs` is blind to that
direction — it only sees a document that is ON a card.

**The age-50 note is the ONE place in the app where a child's card carries an adult
source**, and the N6 rule is crossed deliberately: the sentence is *about* the adult
schedule, so only the adult schedule can carry it, and `aboutAnotherGroup` says so rather
than widening a source's scope. The key is `adultRoutine50`, already one of the four pinned
cross-references, and the adult 19–49 no-risk card states the same boundary in the same
words from the other side. **Not used:** `mmwrChronic1949ReviewAt50` and
`jobAidChronic1949ReviewAt50` — both are printed about a 19–49 adult **with chronic
conditions** and tell you to review a risk-based decision, which is a different claim.

### §B-50NOTE — which "nothing needed" cards say "come back at 50", and which must not

**OWNER DECISION 2026-10-30.** Asked whether the age-50 line should spread to the other
children's cards that end in "nothing needed", she was shown **all nine families**, each
with its own patient taken forward to 19 and to 50 in the running app. They do not behave
alike, and that is the whole rule — **the line goes only where 50 is really the next event.**

| Group | Families / cards | What the app does at 19 and at 50 | Disposition |
|---|---|---|---|
| **A — healthy** | *Not indicated (healthy 5–18y)* 1,584; *PCV series complete* (healthy 24–59 mo) 12 | 19: nothing indicated. **50: a dose is due.** | **The line, on both** |
| **B — at-risk** | *Complete (PCV13 + PPSV23 at/after 6)* 450; *unrecorded-product PCV + PPSV23 at/after 6* 70; *at-risk catch-up done* 15; *PCV series + PPSV23* 5 — **540** (the "640" first written here added its own four counts wrong) | **depends on the group — see §B-AT19** | **DECIDED 2026-10-30: one line per group (§B-AT19)** |
| **C — complete for life** | *includes PCV20* 944; *PCV15 + PPSV23 at/after 6* 290; *PCV before age 6 + PPSV23* 145 — **1,379** | complete at 19 and at 50 | **No line — nothing is ever due** |

⚠ **GROUP B WAS PARKED, THEN DECIDED THE SAME DAY — see §B-AT19 below.** What follows is the
record of why it was parked. *Maya — 18, cochlear implant,
PCV13 at 7y11m, PPSV23 at 12y11m* — reads *"no further doses of any PCV or PPSV23 are
indicated"*, and one year later the app says *"Due today: PCV20 or PCV21 ≥5 years after the
last pneumococcal dose"*. Both are correct: the paediatric schedule does finish her, and the
adult schedule does give her a dose. The card simply names no age. Shown that, the owner
chose **"think about it"** on 2026-10-30. **Never close it by putting the age-50 sentence on
these cards — the age would be wrong; the number for them is 19.** Maya is asserted in the
guard, including the dose she gets at 19, so the question cannot quietly stop being true.

**The sentence lives in ONE constant** (`REVIEW_AT_50_SENTENCE` + `reviewAt50Cite()` in
`recommend.js`) rather than being typed on each card — two copies of a sentence are two
things that can drift. Both counts are **pinned exactly**, so adding a third card fails;
the next card to earn it must be one whose patient, run forward, really does nothing until
50. **0 verdicts moved** in either corpus — the corpora record status, brands and dates,
never prose. Guard:
`regression-c12-2026-10-29-last-citation-and-the-age-50-note.test.js`; C9's guard keeps its
now-reversed line as the record of the reversal.

### §B-AT19 — Group B: each card says what the adult schedule does at 19 (owner, 2026-10-30)

**OWNER RULING 2026-10-30, "One line per group".** Before she was asked, all 540 Group B
cards were run forward to 19 in the engine. They do not share one answer, and that finding —
not the handoff's "a dose is due at 19" — is what she decided on:

| Group | Cards | What the adult card says at 19 | The line on the child's card | Cited to |
|---|---|---|---|---|
| (1) cochlear implant / CSF leak, one PPSV23 | 156 | PCV20 or PCV21 ≥5 years after the last dose | *"At 19, the adult schedule gives 1 dose of PCV20 or PCV21, at least 5 years after the last pneumococcal dose."* | CDC Adult Notes (`adultIc1949BothPcv13Ppsv`) |
| (2) chronic condition only | 282 | No dose now — review at age 50 | *"At 19, the adult schedule gives no dose now; re-evaluate at age 50."* | CDC Adult Notes (`adultChronicOnlyReviewAt50`) |
| (3) cochlear implant / CSF leak, **two** PPSV23 received | 32 | Review at 50 — or PCV20 or PCV21 ≥5 years | *"At 19, the adult schedule says to review again at age 50, or give 1 dose of PCV20 or PCV21 at least 5 years after the last pneumococcal dose."* | ACIP 2025 (`mmwrIc1949TwoPpsv`) — CDC's notes give only the dose |
| (4) a conjugate of unrecorded product | 70 | PCV15, PCV20 or PCV21 ≥1 year after the PPSV23 | *"At 19, because the earlier conjugate's product is not recorded, the adult schedule gives 1 dose of PCV15, PCV20 or PCV21, at least 1 year after the PPSV23."* | CDC Adult Notes (`adultPpsvOnly1949`) |

All four sentences read live 2026-10-30 (CDC adult notes, accordions open, each exactly
once; mm7401a1's row exactly once). Each is an adult row on a child's card, so each is a
declared `aboutAnotherGroup` cross-reference, pinned by name.

**(3) counts PPSV23 doses RECEIVED** (`ppsv.given`), an extra dose included — the count
ACIP's adult rows read. A non-IC child's second PPSV23 is now an extra dose on her own card
(§C-P2-ONTIME), and she is still a two-PPSV23 adult at 19. Reading the effective count there
put the one-dose line on those 32; a mutation proves it.

**Judgements within her ruling, dose unchanged:**
- The at/after-6 card's label is built from the product, so the same template makes
  *"Complete (PCV15 + PPSV23 at/after age 6)"* — Group **C**, complete for life. It gets no
  line; only the PCV13 and unrecorded-product labels she was shown do.
- Only the non-immunocompromised branches carry a line. The IC twin of the "at-risk
  catch-up done" card (reachable since P2, 0 grid patients) was not in her nine families.
  **Superseded 2026-10-31** — see below.

**IT WAS A SECOND READING OF THE ADULT RULES; SINCE 2026-10-31 IT IS NOT.** C13 worked the line
out from the risk class and a PPSV23 count, held to the adult card only by a grid sweep — and
the grid cannot build a vaccinated child over 2.

### §B-AT19, 2026-10-31 — every at-risk "complete" card, and the line is the adult card's own answer

**OWNER RULING 2026-10-31, on Noah** (4, no spleen; catch-up PCV13 ×2 at 2; PPSV23 at 29 and 32
months, the second counted under P2): *"Yes, add the line"* — an immunocompromised child's
"complete" card says what happens at 19 too. Run forward, Noah's adult card at 19 reads
*"Review at age 50 — or PCV20 or PCV21 ≥5 years after the last pneumococcal dose"*.

**Running the hand-built children forward found the second reading wrong in three more
families**, all invisible to the grid's 540:

| Family | The line said | The adult card at 19 says |
|---|---|---|
| PCV15 baby series + PPSV23 (`Complete (PCV series + PPSV23)`) | a dose, or "re-evaluate at 50" | **Complete (PCV15 + PPSV23)** |
| cochlear implant / CSF leak, an EARLY second PPSV23 (an extra dose, which the adult rows also leave uncounted) | "review again at age 50, or …" | PCV20 or PCV21 ≥5 years — completes the series |
| `PCV series complete (PCV before age 6 + PPSV23)`, any risk class | **no line** | often a dose |

578 of the hand-built "complete" cards disagreed with their own adult card. So `recommend()`
now runs the **same patient**, nothing more given, forward to the day they turn 19, and
`atNineteen()` prints the sentence for the row **that card cites** — one of her four above,
never a new one — or **nothing** when the card cites none of them, which is every card saying
the series is complete. `withAtNineteen()` adds it to every at-risk child's "complete" card in
one place (the end of the lead, its citation numbered in order); no card writes it itself.
The sentences, citations and every dose are unchanged.

**On the grid:** the 540 lines she was shown are unchanged. The before-6 card was a Group B
card C13 missed — the sweep's own label list was its filter — and the grid reaches it 145
times: **85 gain a line** (30 dose, 45 none, 10 unrecorded) and **60** with a PCV15 series are
complete at 19 and get none. **0 / 17,016** verdicts, **0 / 18,264** record-problem rows.

*Judgement within her ruling, dose unchanged:* Ava's card (cochlear implant; her on-time second
PPSV23 an extra dose) and a one-PPSV23 child's card are no longer word-for-word the same: at 19
the adult rows count Ava's second dose (§C-P2-ONTIME's "child today" limit), so her line leads
with the review at 50 and the other child's with the dose. Same dose, same five years.

Guards: `regression-2026-10-31-at-19-line-is-the-adult-cards-own-answer.test.js` (a hand-built
sweep: a line appears exactly when the adult card at 19 is not complete for life, and cites
that card's row) and `regression-c13-2026-10-30-what-happens-at-19.test.js` (the grid, every
line run forward, counts pinned: 186 / 327 / 32 / 80, plus the 60 without).

### What "completed by 24 months" means — FINDING M, 2026-10-22

p2016 Table 2 splits on the word **completed** and never defines it. CDC's catch-up Table 2
and the catch-up job aid do, and until 2026-10-22 the engine did not follow them: it
credited a dose given at **12–23 months** as the age-appropriate FINAL dose only when four
or more doses were on record, so a two- or three-dose series finished in the second year of
life read as incomplete and the child was offered a dose nobody recommends. **12 real
patients and 15 impossible-entry records moved.**

**OWNER RULING 2026-10-22**, in her words: *"Healthy children, PCV initiated at 12–23 months
→ 2 doses, ≥8 weeks apart is the full series. Two documented, appropriately spaced doses in
this age range satisfy that requirement. Catch-up at 24–59 months (healthy): any incomplete
schedule as of 24 months calls for 1 additional PCV dose ≥8 weeks after the most recent
dose. This applies to the child who had only a single 12–23 month dose. Interval validity
matters."*

A healthy child 24–59 months is **complete** when any of these holds:

| Dose history (counting doses only) | Complete? | The row that says so |
|---|---|---|
| A dose at **≥24 months** | yes | job aid, "Dose 1 was given after 2nd birthday" → "No dose today" |
| Series **started at 12–23 months**, **≥2** doses | yes | job aid, 2 previous doses, "Dose 1 was given after 12 months of age" → "No dose today" |
| Series **started before 12 months**, **≥3** doses, **≥1 of them at ≥12 months** | yes | job aid, 3 previous doses, "1 or more doses were given at 12 months of age or older" → "No dose today"; CDC Table 2, "Dose 2 to Dose 3" |
| **3 doses all before 12 months** | **no** — a 4th is owed | CDC Table 2, "Dose 3 to Dose 4": *"8 weeks (as final dose) This dose is only necessary for children age 12 through 59 months regardless of risk, or age 60 through 71 months with any risk, who received 3 doses before age 12 months."* |
| A **single** 12–23 month dose | **no** — a 2nd is owed | the owner's ruling above; job aid, 1 previous dose → "Give Dose 2 (Final Dose)" |

**"≥8 weeks apart" is enforced by the interval table, not here** — `CHILD-PCV-AFTER-PCV` in
`doseIntervalRules.js` is an `enforcement: 'floor'` row, so a dose following one given at
≥12 months needs 56 days with CDC's 4-day grace. Measured on the engine: 51 days does not
count, 52 days does. The completeness test counts **effective** doses, so the spacing
requirement is already satisfied by the time it looks. **Do not add a second interval test
here.** (That row was keyed on the age at the PREVIOUS dose alone until 2026-10-23; it is
now CDC's Catch-up Table 2, dose by dose — see the rule table in §K and the sub-section
below it.)

An **undated** dose counts toward the total but can never be the ≥12-month dose, because it
cannot be placed — the engine's standing policy assumes an undated historical dose is an
infant dose, which is the conservative reading (the child is still offered the dose).

Engine: `secondYearSeriesComplete` in `pcvHealthyChild` (`recommend.js`).
Test: `regression-finding-m-2026-10-22-second-year-series-is-complete.test.js`.

If a healthy 24–59mo child gets PCV15 for the catch-up dose → **PPSV23 ≥8wk later** (the
PCV15-requires-PPSV23 rule applies; `cdcChildPneumo`). If PCV20 → complete.

---

## §C — Risk conditions, children 24 mo–18 y (p2016 Table 3; `cdcChildPneumo`)

**Non-immunocompromising (non-IC):** chronic lung disease (incl. moderate/severe persistent
asthma), chronic heart disease, chronic liver disease, diabetes mellitus, CSF leak,
cochlear implant, chronic kidney disease (except IC list).

**Immunocompromising (IC):** asplenia/splenic dysfunction, congenital/acquired
immunodeficiency, immunosuppressive drugs/radiation, HIV, solid organ transplant,
sickle cell / other hemoglobinopathies, kidney disease on maintenance dialysis,
kidney disease with nephrotic syndrome.

**The two lists above are COMPLETE. An adult-only risk condition must not put a child on
the at-risk pathway** (added 2026-10-10, S10b — P3-9b / peds audit P0-3). **Cigarette
smoking** and **alcohol use disorder** are adult pneumococcal indications only (§J); they
appear in neither list here. Verified live 2026-10-10 against CDC's child & adolescent
schedule notes, pneumococcal "Special situations", whose two risk lists are CDC's complete
paediatric enumeration:

> "Children and adolescents with cerebrospinal fluid leak; chronic heart disease; chronic
> kidney disease (excluding maintenance dialysis and nephrotic syndrome); chronic liver
> disease; chronic lung disease (including moderate persistent or severe persistent
> asthma); cochlear implant; or diabetes mellitus"

> "Children and adolescents on maintenance dialysis, or with immunocompromising conditions
> such as nephrotic syndrome; congenital or acquired asplenia or splenic dysfunction;
> congenital or acquired immunodeficiencies; diseases and conditions treated with
> immunosuppressive drugs or radiation therapy, including malignant neoplasms, leukemias,
> lymphomas, Hodgkin disease, and solid organ transplant; HIV infection; or sickle cell
> disease or other hemoglobinopathies"

Neither smoking nor alcohol appears: 0 matches for `/smok|alcohol|cigarette/i` across the
fully-expanded page (60,435 characters), while "cochlear" and "diabetes" both match — so the
absence is real, not a collapsed accordion section. immunize.org p2016 Table 3 agrees (0
matches across the whole 2-page PDF). **AAP tiebreak:** no AAP page enumerating paediatric
pneumococcal risk conditions was reachable, so AAP is silent and CDC stands; there is no
sign of disagreement, since the posted July 2, 2025 schedule is the one AAP litigated to
restore in *AAP et al. v. Kennedy*.

Implemented as a single named filter, `pedsRiskIds()` in `data/riskFactors.js`, called
inside `pedsRiskRowClass()` so the rule holds however it is called, and at the engine
dispatch so an adult citation cannot reach a child's card either.

**Made visible 2026-10-10 (S13, P3-9's UI half).** Stripping the tick silently was still a
silent ignore: the Results summary listed the risk as a chip beside a recommendation that
had disregarded it, with no sentence saying why. The owner held PR #20 on that basis. The
fix is `logic/riskAgeNote.js` + `components/RiskAgeNote.jsx`, rendered on **both** surfaces
that show the tick — the risk step and the Results header. The `adultOnly` age gate in
`StepRisks.jsx` that used to HIDE the checkbox below 19y is removed (owner decision, option
(b): show every risk at every age and explain the ones that do not act). The note's
boundary is `ADULT_SCHED_MIN_M` (228), matching the engine's dispatch — **not**
`PCV21_MIN_AGE_M` (216), which would make the note disagree with the engine at 18–19y.

Its two claims are separately cited, each to the sentence that supports it, both fetched
live 2026-10-10 and confirmed to appear exactly once on their page:

> `cdcAdultRiskFactorList` — "Underlying medical conditions or other risk factors include
> alcoholism, chronic heart/liver/lung disease, chronic renal failure, cigarette smoking"

> `cdcChildSpecialSituations` — the paediatric "Special situations" non-IC list quoted
> above, which names neither.

**Risk status is TODAY's only** (stated in the UI from 2026-10-10, S13 — P6-7). The app
collects risk factors as they are now and grades doses recorded years ago against them; it
never records when a risk factor began or ended. The one case where that is visible:
**PPSV23 at ages 2–5 is only *indicated* for an at-risk child**, yet a PPSV23 already given
to a then-healthy three-year-old is counted as a valid dose if that child later becomes
at-risk. That is correct — a real vaccine at a valid age (PPSV23 minimum age 2 years) — and
is now said in `Disclaimer.jsx` rather than left to be inferred. Verified against the engine
before the copy was written, and pinned by
`regression-p6-7-current-risk-disclaimer.test.jsx`. Deliberately **not** a per-dose prompt.

⚠ **Re-verification method matters here.** CDC's notes pages keep their accordion bodies in
the DOM but collapsed, so `innerText` returns ~9,200 characters with *"cochlear"* and
*"diabetes"* both absent — a "0 matches for smoking" from that is meaningless. Use
`textContent` (75,723 characters) and keep a positive control. **`hasAnyRisk()` and
`hasNonIC()` are deliberately NOT narrowed** — both are reached only from the adult
pathway, where these two risks are genuine, and `hasAnyRisk` gates whether a 19–49 adult
gets a recommendation at all.

### §C-PPSV23ANCHOR — The at-risk catch-up's 8 weeks runs from the most recent PNEUMOCOCCAL dose (2026-10-25)

**OWNER RULING 2026-10-25,** answering "does this apply to little children too, or only 6 and
up?": *"yes PPSV recs should apply at the earliest age of 2 years, this is the minimum
approved age. Other CDC tables and p2016 have PPSV23 guidance for 24 months and older."*

**The defect.** CDC's at-risk "Age 2–5 years" row states **two** intervals and the card
implemented only the second:

> *"Less than 3 PCV doses: 2 doses PCV (**at least 8 weeks after the most recent dose** and
> administered at least 8 weeks apart)"*

The card's date came from the last **PCV**, so a 4-year-old with asplenia whose only
pneumococcal dose was a PPSV23 24 days ago was told her first conjugate was due **today**,
on a card quoting *"at least 8 weeks after the most recent dose"* underneath it. The
citation and the date contradicted each other on one screen.

It was found by comparing two patients who differ only in age. The **6–18** block already
anchors on a pneumococcal dose, so an 8-year-old with that history was correctly told 26 Nov
while a 4-year-old was told today. Measured over the grid: **225 of 17,016**, every one of
them aged 2 or 5, **none aged 6 or over**. (That block anchored on the **first** counting
PPSV23, not the most recent — right for this one-dose patient and wrong for a child with two.
Corrected 2026-10-26, §C-PPSV23LAST below.)

**CDC's own tool reads it the same way.** PneumoRecs, for a 4-year-old with asplenia, a
PPSV23 and no conjugate: *"Give 2 doses of PCV: first dose, given **8 weeks after the dose of
PPSV23**."*

**THE FIX IS A LATER ANCHOR, NEVER A SECOND INTERVAL.** Both clocks carry the same 8 weeks,
so the card takes the later of two anchors and reads the interval once:

| Side | Anchor | Which rule |
|---|---|---|
| the conjugate stream | `anchorPcv` — the dose the patient GOT, including one that did not count | RULING D |
| the polysaccharide stream | the most recent **counting** PPSV23 (`ppsv.lastDate`) | ANCHOR-1 — "an unnecessary dose cannot reset a clock" |

`ppsv.lastDate` is new and is deliberately **not** `ppsv.effective.find(...)`, which five
call sites use for the **first** PPSV23 because the five-year revaccination clock runs from
dose 1. First and last are different questions, and a child with two PPSV23 doses has them
five years apart — reading one for the other is a five-year error.

**TWO CASES WERE LEFT ON THE PCV ANCHOR on 2026-10-25, because no document states the
interval for them.** 192 of the 225 were fixed; the remaining **33** were pinned by number
so that widening the anchor would fail a test rather than pass quietly:

| Left alone | What the documents say |
|---|---|
| the **3-doses-before-12-months** row | ACIP 2023: *"one dose of either PCV15 or PCV20 is recommended at least 8 weeks after the last **PCV** dose"*; CDC's neighbouring rows say *"the most recent **PCV** dose"* |
| a **healthy** child's catch-up | CDC's healthy row states no interval; p2016 says *"after most recent **PCV** dose"*; the CDC PCV Catch-up Job Aid (Jan 2025) counts previous **PCV** doses only and says *"Give Dose 1 today"* |

**BOTH EXCEPTIONS ARE NOW CLOSED — OWNER DECISION 2026-10-29.** See §C-PPSV23ANCHOR29 below.

### §C-PPSV23ANCHOR29 — Both pinned exceptions close; the PPSV23 clock is the app's own on those two cards (OWNER DECISION 2026-10-29)

**What she was shown.** Three children, each with a PPSV23 about a month ago, run through the
engine on 2026-10-29 — two of them advised a conjugate **today**, the third held eight weeks:

| Child | 2026-10-25 behaviour |
|---|---|
| healthy 4-year-old, PPSV23 on 1 Oct, no conjugate ever | **due today** |
| the **same** child with asplenia (the control) | held to **26 Nov** |
| 4-year-old with asplenia, 3 × PCV13 in 2022–23, PPSV23 on 8 Oct | **due today** |

Asked which of the two should also wait, she chose **both**. The reason is the inconsistency
itself: one PPSV23, three children, two different answers, and in the first pair the only
difference between them is a risk condition that the PPSV23 clock does not depend on.

**⚠ ON THESE TWO CARDS THE PPSV23 CLOCK IS HERS, NOT CDC'S, AND THE CARD SAYS SO.** The
documents listed in the table above are unchanged and still say **PCV**; none was re-quoted
to cover her ruling, which is the FINDING F / "narrowing card sources" hazard run forwards.
Instead each card gains its own sentence, printed **only when the PPSV23 is what is actually
holding the dose back**:

> lead — *"…≥8 weeks after the most recent PCV [c] [c]. **Held to 8 weeks after this child's
> PPSV23 of Oct 1, 2026.**"*
>
> "Why this" — *"The 8 weeks above is CDC's, measured in every source on this card from the
> most recent PCV. Measuring it from a PPSV23 as well is this app's own determination on the
> owner's instruction of 2026-10-29, so that a healthy child and an at-risk child with the
> same recent PPSV23 are not given different dates."*

**Still one `max`, still no second interval.** Both clocks carry the same 8 weeks, so the
later anchor is simply the later date — `mostRecent(anchor, ppsv.lastDate)` in
`pcvHealthyChild`, and `anchorPneumoGiven` (which already existed) on the `target === 1` row
in `pcvRiskChild`. A child with no PPSV23 is untouched, because `mostRecent` drops a null.

**Measured, 2026-10-29** (re-measure, never quote from here):

| Corpus | Rows moved | Direction | Fields changed |
|---|---|---|---|
| `verdict-corpus.tsv` | **33 of 17,016** | all **later**, 0 earlier | `dueToday` and `earliestNextDate` only |
| `record-problem-corpus.tsv` | **24 of 18,264** | all **later**, 0 earlier | the same two |

No dose status, label, verdict or series total moved in either corpus, and the key sets are
identical — checked field by field rather than trusting `sweep:update`, which reports every
regenerated row.

**⚠ A CORRECTION THE MEASUREMENT FORCED, AND IT CHANGES WHAT THIS RULING REACHED.** The
2026-10-25 table above split the 33 as **22** on the 3-doses row and **11** healthy. **That
split was wrong.** The guard tagged a patient at-risk with `riskIds.length > 0`, and
**smoking and alcoholism are adult-only risk factors**, so a 24-month-old with alcoholism
ticked was counted as at-risk. All 33 moved verdicts are the **healthy catch-up card**: 11
with an empty risk list, 22 with only an adult-only id. **Zero** are the 3-doses row — which
**0 grid patients reach at all**, now asserted. So the sweep is no guard for that row, and
the hand-built 4-year-old (3 × PCV13, PPSV23 on 4 Oct, held to **29 Nov**) is its only
coverage. This is the `populationOf()` rule of §"Healthy is not an empty risk list" costing a
number in a spec table, exactly as it has before.

**A SECOND GUARD THAT PASSED FOR THE WRONG REASON, also found by mutating.** The no-PPSV23
control checked the healthy card's **date** and only the at-risk card's **sentence**. So
forcing `ppsvHolds` to a constant `true` broke **nothing** — and a child with no PPSV23 at
all would have read *"Held to 8 weeks after this child's PPSV23 of"* followed by a formatted
`null`. The control now asserts both cards' wording. This is the second time in one day that
a date-only assertion hid a prose defect, which is the standing lesson that the verdict
corpora do not record prose.

**Mutations that bite**, over the guard file: taking the PPSV23 side off the healthy card
fails **4**; putting the 3-doses row back on its PCV anchor fails **1** (only the hand-built
child can see it — the grid reaches that row 0 times); taking the **earlier** of the two
anchors fails **2**; printing "Held to" unconditionally fails **1** once the control above
was fixed, and **0** before it. The corpus sweeps are a mutation check in their own right:
both failed before regeneration, which is how the 33 and 24 were counted.

Guard: the same file, `regression-2026-10-25-at-risk-catchup-waits-eight-weeks-after-ppsv23.test.js`,
rewritten — the healthy child and her at-risk twin asserted to the **same** date, both cards
asserted to carry the "Held to" sentence and the "this app's own determination" reason, a
child with no PPSV23 asserted untouched on both cards **in date and in wording**, the sweep
pinned at **0**, and the 3-doses row's grid reach pinned at **0** so that quoting the sweep
as cover for it fails.

### §C-PPSV23LAST — The 8 weeks runs from the LAST counting PPSV23, not the first (2026-10-26)

**OWNER, 2026-10-26,** shown the app's two schedule sentences side by side and asked which
was wrong: *"both statements are correct. 'Give PPSV23 dose 2 ≥5 years after dose 1 PPSV23'
is the routine schedule when spacing out 2 PPSV23 doses. 'Give the next conjugate ≥8 weeks
after the most recent pneumococcal vaccine' is correct when spacing out conjugate from
PPSV23 or between conjugate vaccines."*

**So no interval changes here, and neither rule is in question.** The defect was which
**dose** the app fed into the 8-week rule.

`anchorPneumo` — the engine's "most recent pneumococcal vaccine" anchor for at-risk children,
and its own comment said so — was built from `ppsv.effective.find((d) => d.date)`.
JavaScript's `find` returns the **first** match. So for a child with two counting PPSV23
doses the eight weeks were measured from a dose up to seven years old, and the wait had
always already passed.

**Hana, 12, asplenia, no conjugate ever. PPSV23 on 1 Jan 2019 and again on 1 Sep 2026.**
The five-year spacing is satisfied (7 y 8 m apart), so both doses count.

| | |
|---|---|
| her next conjugate is due | **27 Oct 2026** — 8 weeks after 1 Sep 2026 |
| the app said, on 25 Oct | **due today**, 54 days after her real last dose, two short |
| the card's own label reads | *"≥8 weeks"* |

**The tell needs no clinical judgement at all.** A child whose **only** PPSV23 is that 1 Sep
dose was correctly held to 27 Oct. Hana has the same dose plus an older one — more history,
and the app gave her the **earlier** date.

**The fix is one line**, and it reaches for a field that already existed and already meant
this: `mostRecent(pcv.lastDate, ppsv.lastDate)`. The five call sites that want the **first**
dose keep reaching for `effective.find(...)` directly, because the five-year revaccination
clock genuinely runs from dose 1 — the rule the owner confirmed above. First and last are
different questions; this line is the one that asks for the last.

**Why the whole suite stayed green.** With one PPSV23 on record "first" and "most recent" are
the same dose. No patient in the 17,016-row grid has two counting PPSV23 doses, and none of
the 810 hand-built children of 2026-10-25 does either — the grid cannot build a vaccinated
child aged 2–18 at all. The fix therefore had to be guarded by a hand-built patient or it
would have come back silently.

**Measured** over 21,327 card rows (the grid, the 810 children of 2026-10-25, and 2,660 rows
of a new two-PPSV23 family): **408 rows moved, for 228 patients, every one of them LATER**;
0 earlier, 0 back to "due today", and the **date is the only field that changed** — no
status, no label, no verdict. **0 grid rows moved**, so both corpora are byte-identical, and
the corpus records `earliestNextDate`, which makes that a real check. **No PPSV23 card moved
at all**: the five-year clock is untouched in the measurement as well as in the code.

**Mutations, each caught by a different set:** restoring `.find(...)` → **3** failing, all in
the new guard and nothing else in the suite (which is exactly the point); dropping the PCV
side of `mostRecent` → **1**, in §D-note's five-year guard; dropping the PPSV23 side, i.e.
reverting §C-PPSV23ANCHOR → **9** across 5 files, including both corpora.

Guard: `regression-2026-10-26-eight-weeks-runs-from-the-last-ppsv23.test.js` — Hana, the
same-date comparison against the one-dose child, a direction sweep over every pair of dates
that keeps both doses counting, and three controls: the five-year clock still runs from dose
1, a dose that does **not** count (inside five years, or dated in the future) cannot push the
conjugate out, and a child with no PPSV23 is untouched.

**One related question the owner has NOT been asked.** A PPSV23 given 54 days ago but
*rejected* for falling inside five years does **not** hold off a conjugate — ANCHOR-1, *"an
unnecessary dose cannot reset a clock."* That is designed behaviour, pinned as a control in
the guard above, not part of this defect. **P2 (2026-10-30, below) narrowed who that is:** an
immunocompromised child's early second PPSV23 now COUNTS, so it does hold off a conjugate; a
child with no immunocompromising condition's is an extra dose and still does not.

### §C-P2 — A child's second PPSV23 inside five years (2026-10-30)

**Two owner rulings, one per risk class, and a third on order.** CDC's child notes, read live
2026-10-30 with the accordions open (pneumococcal section 5,106 characters; positive control
"dose 2 PPSV23", 3 occurrences; no "dose 3", "third dose" or "3rd" anywhere):

> Immunocompromising list: *"If PPSV23 is used, administer either PCV20 or dose 2 PPSV23 at
> least 5 years after dose 1 PPSV23."*
>
> Non-immunocompromising list (cochlear implant, CSF leak, chronic heart/lung/liver/kidney
> disease, diabetes): *"Not previously received PCV20: 1 dose PCV20 or 1 dose PPSV23
> administer at least 8 weeks after the most recent PCV dose"* — and no second PPSV23 at all.

Neither says a dose given inside the five years stops counting. As a FLOOR,
`CHILD-PPSV23-AFTER-PPSV23` asserted that; it is now a RECOMMENDATION, which asserts only
CDC's interval — the adult twin's relabelling of 2026-10-25 run on the child row.

| Child | History | Before | Now | Ruling |
|---|---|---|---|---|
| **Leo**, 10, no spleen (IC) | PCV13 ×4 as a baby; PPSV23 at 2 and at 6y10m | 2nd PPSV23 thrown out; card offered PCV20 or a "2nd PPSV23" — his **third** | Counts, note *"…shorter than the 5 years advised… Counted; never give a third"*; card complete and says the second came early | OWNER 2026-10-29: count, never a third |
| **Ava**, 10, cochlear implant (not IC) | same | thrown out; chip *"next dose … from Nov 15, 2027"* beside a "complete" card | **Extra dose**: *"Not needed: CDC gives a second PPSV23 only to a child with an immunocompromising condition…"* | OWNER 2026-10-30, chose "Extra dose" from her own 2026-10-23 words |
| **Sofia**, 18, no spleen | PPSV23 at 8 and 13, **then** PCV13 at 17 | PCV20 **or** "2nd PPSV23" (third) | **PCV20 only**, and the card says why | OWNER 2026-10-30 |
| **Zoe**, 14, no spleen | PCV13 at 7, **then** PPSV23 at 7y3m and 12y3m | PCV20 or "2nd PPSV23" — wrong on main, on time | **Complete** | control she was shown with Sofia |

**The grace stays — OWNER DECISION 2026-10-30.** A recommendation row normally gets no 4-day
grace. Dropping it here moved **708** of 17,016 grid patients — 22 of them adults whose card
date changed because of a PPSV23 given in childhood — because the grid dates a second PPSV23
two days short of five years, which counted silently on main. She kept the grace: a dose up
to 4 days early is on time, as before, and only a dose that used to be **thrown out** gets
the new answer. This is the one exception to "floor ⇔ grace", pinned by name.

**Order decides whether CDC's row is finished.** CDC's rows give the PPSV23 *after* the
conjugate. An IC child with two counted PPSV23 doses is complete only when **every** counted
PPSV23 came after the last counted PCV (`icTwoPpsv23Done`); otherwise the PCV20 is still owed,
alone (`IC_TWO_PPSV23_PCV20_LEAD`). A patient whose doses straddle the conjugate (the suite's
sickle-cell patient: PPSV23 at 2, PCV13 at 7, PPSV23 at 9) is read cautiously and keeps the
PCV20 — never a harmful answer. *This is a judgement within her Sofia ruling, not a ruling
of its own; it moves no grid patient.*

**Three limits, each guarded:**
- **A third PPSV23 is an extra dose** for an IC child (*"two PPSV23 doses have already been
  given … and CDC never gives a third"*). Her rulings count a *second*.
- **A repeat of a REJECTED PPSV23 is not P2.** It is RULING D's (spaced from the dose given),
  and the two rows split on `anchorCounted`. **Narrowed the same day — OWNER RULING
  2026-10-30, on Noah below**: the 5-year floor `CHILD-PPSV23-AFTER-INVALID-PPSV23` now applies
  only once a PPSV23 has COUNTED, and the repeat of a rejected FIRST dose is
  `CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST` at 8 weeks.
- **An on-time second PPSV23 for a non-IC child** — WIDENED the same day (OWNER RULING
  2026-10-30, §C-P2-ONTIME below): an extra dose too, for a patient who is a child today.

**The card sentence.** Her chosen preview read *"Ava was already complete after her first
PPSV23"*. The shipped sentence gives CDC's reason instead — "complete" is not always true (a
2–5-year-old's conjugate series can still be open) and "one PPSV23" is false for a healthy
child, who gets none. The four points she chose are kept: not needed, not harmful, not
counted, nothing to repeat.

**Measured blast radius: 96 of 17,016**, every one the Sofia family (IC 18-year-olds, PPSV23
×2 then a conjugate), "PCV20 or 2nd PPSV23" → "PCV20". No chip under any dose moved; no adult
and no healthy child moved. Record-problem corpus: see the PR.

Guard: `regression-p2-2026-10-30-child-second-ppsv23.test.js` — Leo, Ava, Maya (4, the
completed-series card), Noah (4, the catch-up card, which used to be unreachable for an IC
child), Zoe early and on time, Sofia, the two-days-short pair, the third dose and the
rejected-first repeat.

### §C-P2-REPEAT — the repeat of a rejected FIRST PPSV23 is the first PPSV23 (owner, 2026-10-30)

**Noah**, 5, no spleen (the child she was shown — not P2's 4-year-old Noah above): catch-up PCV13 at 25 and 27 months (2023-02-01, 2023-04-01); PPSV23 on
2023-04-29, 4 weeks after the PCV13 — rejected; repeated on 2023-07-10, 10 weeks after it.

| | Before | Now |
|---|---|---|
| The 2023-04-29 dose | does not count; chip: repeat *"can be given from Jun 24, 2023 at the earliest"* | unchanged |
| The 2023-07-10 repeat | **thrown out as a SECOND PPSV23** — "5 years after the first", i.e. not until Jul 10, 2028 | **counts, as PPSV23 dose 1** |
| His card | PCV20 **or 1 dose PPSV23** — offering his third PPSV23 shot | PCV20 or a 2nd PPSV23 ≥5 years after the repeat — eligible Jul 10, 2028 |

Shown that, the owner chose **"Counts as 1st PPSV23"**. The sources, read live 2026-10-30:

> CDC General Best Practices, Timing and Spacing: *"The repeat dose should be spaced after the
> invalid dose by the recommended minimum interval"* — and its worked example (a Hib second dose
> given 14 days after the first) ends *"The repeat dose is counted as the valid second dose."*
>
> CDC Child & Adolescent Notes, pneumococcal (9 occurrences): *"1 dose PPSV23 at least 8 weeks
> after the most recent PCV dose"*; and *"…dose 2 PPSV23 at least 5 years after dose 1 PPSV23"*.

The repeat takes the rejected dose's place in the series. A first PPSV23's interval is CDC's 8
weeks, so the repeat is spaced 8 weeks from the dose given — the very date the rejected dose's
chip already printed (`repeatDueDate`). The 5 years is the dose-1→dose-2 gap and governs only
the repeat of a rejected SECOND dose, which keeps its old floor. The PCV row still judges the
gap from the PCV, so the repeat must clear both. CDC's 4-day grace applies (a floor).

**Judgement, not ruled:** the row also catches a first PPSV23 rejected for **age** (under 2).
CDC's General Best Practices puts that repeat "on or after the date when the child reaches at
least the minimum age", and asks for a 28-day spacing only for live vaccines — so for a dose
given at 22–24 months, this row's 8 weeks is stricter than CDC by up to 8 weeks. Main asked for
5 years there, so the change only loosens it. 0 grid patients either way.
**Ruled 2026-10-31 — the 8 weeks stays, and the grey area is stated: §C-P2-GREY below.**

Measured: **0 / 17,016** verdicts and **0 / 18,264** record-problem rows moved (the grid never
dates a rejected PPSV23 and a repeat); 0 uncredited citation pairs over 17,311 cards.
Guard: `regression-2026-10-30-repeat-of-a-rejected-first-ppsv23.test.js`.

### §C-P2-ONTIME — a non-IC child's on-time second PPSV23 is an extra dose (owner, 2026-10-30)

**Ava**, 10, cochlear implant: PCV13 ×4 as a baby, PPSV23 at 2 and again at 7y1m — on time.
P2 made her EARLY second PPSV23 an extra dose; the on-time one still read "valid, dose 2" with
no comment, though CDC's non-immunocompromising list gives one PPSV23 and never a second.
Asked whether to widen, the owner chose **"Yes, extra dose too"**: early or on time, the same
label — *"Not needed: CDC gives a second PPSV23 only to a child with an immunocompromising
condition… This dose isn't harmful, it isn't counted, and nothing needs to be repeated."*
Her card is word-for-word the card of a child with one PPSV23, as before.

**Two limits, each measured over the grid before it was drawn:**

| Limit | Without it | Why |
|---|---|---|
| **An extra PPSV23 still holds off a conjugate for 8 weeks** — `CHILD-PCV-AFTER-PPSV23` measures from the most recent PPSV23 that counted **or was an extra dose** | 72 conjugate doses began to count, and 34 cards went from "dose owed" to "Complete" | OWNER RULING 2026-10-30, on **Ben** (18, diabetes; PPSV23 at 8 and 13, PCV13 the next day): *"Yes, still wait 8 weeks"* — the reason for her 8-week bar, a weaker conjugate response soon after a PPSV23, is about the dose the child received, needed or not |
| **Only a patient who is a child TODAY** | 16 nineteen-year-olds with a cochlear implant or CSF leak, both PPSV23 doses given in childhood, had their card switch from ACIP's "PCV13 and 2 doses of PPSV23" row to the one-dose row — a history they do not have. Same dose, same date | ACIP's adult rows count every PPSV23 received; she ruled on a child. *A judgement within her ruling, dose unchanged — listed in the PR* |

A REJECTED PPSV23 still holds off nothing across streams (ANCHOR-1, unchanged — and put to the
owner and RE-CONFIRMED 2026-10-31, §K-PPSV23THENPCV "Rosa and Eli"): only a dose that was
validly given and recorded as extra joins the 8-week anchor. **That anchor reached the dose
check only, not the card, until 2026-10-31** (same section). An immunocompromised
child's on-time THIRD PPSV23 is an extra dose too — ruled 2026-10-31, §C-P2-THIRD below.

Measured: **464 / 17,016** verdicts moved — every one a child, every one only the label under
the second PPSV23 (0 conjugate verdicts, 0 cards, 0 changed card sentences by `proseDiff`).
**0 / 18,264** record-problem rows. Guard:
`regression-2026-10-30-on-time-second-ppsv23-is-extra.test.js`.

**And a fault on a third surface, found by driving the app.** "How this was worked out" read
*"2 of 2 PPSV23 doses counted"* under a dose reading *"it isn't counted"*. It counted every
dose with status `valid`, extra or not — wrong since that panel was written, for every extra
dose in the app (infant PCV extras, adult doses after a completed series, P2's early PPSV23).
It now reads *"1 of 2 PPSV23 doses counted — 1 an extra dose, not needed, with the reason on
the dose itself."* No corpus records that panel, so no count moved.

### §C-P2-GREY — the repeat of a too-young first PPSV23: the 8 weeks stays, and the card says it is a grey area (owner, 2026-10-31)

**Sam**, 2, no spleen, a full infant PCV13 series: PPSV23 on Dec 1, 2024 at 23 months — under
the 2-year minimum, thrown out — and again on Jan 5, 2025, just past his 2nd birthday and 5
weeks later. `CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST` throws the repeat out too (8 weeks from
the invalid dose). CDC General Best Practices, Timing and Spacing (read live 2026-10-31, each
sentence once):

> *"If the first dose in a series is given ≥5 days before the recommended minimum age, the dose
> should be repeated on or after the date when the child reaches at least the minimum age"* —
> and the gap from the invalid dose is given only *"If the vaccine is a live vaccine"* (28 days).
> PPSV23 is not live, so CDC states no gap for its repeat.

Asked whether Sam's repeat should count, the owner answered: *"There is another issue that won't
have a clear answer. Is it possible to highlight this grey area and use the latter rule and
update the rulebook with such."* The latter rule is the app's 8 weeks. Shown the reading back
with a drafted note, she confirmed it and chose **"PCV20 only"**: the card's Option B would be
his THIRD PPSV23 shot. Her answer on Rosa the same day agrees: spacing from an invalid dose
*"applies when the repeat dose is the same as the invalid dose"*, and Sam's is.

| Surface | Before | Now |
|---|---|---|
| Card | Option A PCV20 / Option B PPSV23 | **1 dose PCV20 (≥8 weeks) — completes the series**; "Why this" carries the grey-area note, citing both CDC sentences |
| Chip under the Jan 5 dose | *"… It is not repeated; the next dose in this series can be given from Mar 2, 2025 at the earliest."* | *"… It is not repeated."* + the grey-area note |

The note, her draft word for word with the dates filled in: *"Grey area: CDC says a dose given
under the minimum age is repeated on or after that age, and states no gap from the invalid dose
for a vaccine that is not live. ACIP does not address this case. This app spaces the repeat 8
weeks from the invalid dose, so the Jan 5, 2025 dose is not counted. If it were counted, PCV20
would be due on or after Jan 5, 2030 and would complete the series."*

**Scoped to the card she was shown:** an immunocompromised child whose card is that Option A /
Option B pair (CDC's IC rows `pedsIcPcv20orPpsv23` at 2–5 and `pedsIcBefore6NoPcv20At6to18` at
6–18). The flag is set by validate.js only when the earlier dose's own verdict says it was
below the minimum age (`belowMinAge`), never re-tested. **The three limits this paragraph
listed as not ruled were each put to her the same afternoon — §C-P2-NOTHIRD below.**

### §C-P2-NOTHIRD — two PPSV23 shots, neither counted: no third shot is offered (owner, 2026-10-31)

Sam's ruling left out three kinds of child. Shown one patient for each, the owner ruled every
one the same way: **offer PCV20 only**, because the other path is a THIRD PPSV23 shot.

**Max** — Sam's twin with a cochlear implant, **not** immunocompromised: same two PPSV23 shots
(23 months, then 5 weeks later), both thrown out. His card offered Option A PCV20 / Option B
PPSV23 with no note. She chose **"PCV20 only + note"**. The card and chip are Sam's, citing
CDC's non-immunocompromising rows (`pedsRiskPcv20orPpsv23` at 2–5,
`pedsRiskBefore6NoPcv20At6to18` at 6–18), except the note's last sentence: a child who is not
immunocompromised is owed one PPSV23 and no follow-on, so *"If it were counted, the series
would already be complete."* Sam's tail (PCV20 five years on) is the IC row's follow-on and
must not reach him. The card's lead is Sam's word for word.

**Noah** — 5, no spleen, PCV13 ×2 at age 2. His first PPSV23 came 4 weeks after a PCV (thrown
out for spacing); the repeat 6 weeks later was thrown out too (`CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST`,
8 weeks from the invalid dose — Ruling D, which CDC states plainly, so **no grey area**). His
card offered PCV20 or PPSV23. She chose **"PCV20 only"**. His card is Sam's PCV20 card with
"Why this" reading *"A PPSV23 is not offered: it would be a third PPSV23 shot."*; the chip under
his repeat drops its promise of a further PPSV23 and gains no note.

So the trigger is **the repeat rule having thrown the dose out**, whatever voided the first
dose; the grey-area note is added only when the first was too young (`repeatOfUnderAgeDose`).
*A judgement within her rulings, listed in the PR:* **Noah's twin who is not
immunocompromised** gets PCV20 only as well — he is not a patient she saw, but both rulings
that reach him (Max: not IC; Noah: spacing) say the same. **Kai** — 8, no spleen, **never a PCV**, Sam's two PPSV23 shots. His card was the 6–18
no-prior-PCV trio — Option A PCV20 / B-1 PCV15 / B-2 PPSV23, B-2 a third shot — and a 2-year-old
like him got the 24–71-month at-risk catch-up, *"2 doses of PCV20 or PCV15"* with a PPSV23
after PCV15. She chose **"PCV20 only + note"** for both. On both the third shot hides behind
PCV15, so PCV15 goes and "Why this" says why before the grey-area note:

| Card | Now | Grey note's last sentence |
|---|---|---|
| 6–18 no-prior-PCV (IC `pedsIc6to18NoPcv` / non-IC `pedsRisk6to18NoPcv`) | **1 dose PCV20 (≥8 weeks)**, Option B dropped; *"PCV15 is not offered: after it a PPSV23 would be owed — a third PPSV23 shot."* | *"If it were counted, PCV15 could be offered too, with no PPSV23 after it."* — CDC follows PCV15 with a PPSV23 only "if … no previous receipt of PPSV23" |
| 24–71-month catch-up, both rows (`pedsRiskIncompleteCatchup`) | **PCV20** only, as product and in the lead; the PCV15 sentence becomes *"PCV15 is not offered: it would need a PPSV23 after it [p2016 ‡] — a third PPSV23 shot."* | **none** — an immunocompromised child would still owe a dose five years on, so no "if counted" sentence is true for every child on this card |

The catch-up card's two PCV15 sentences are constants shared by its builder and this swap
(`CATCHUP_PCV15_SENTENCE_ROW1/2`), so a reworded sentence cannot slip past it. *Judgements
within her rulings, listed in the PR:* the **non-immunocompromised** child on the 6–18 card
(her Max ruling reaches him), and a **repeat thrown out for spacing** on the catch-up card
(her Noah ruling; no grey note) — each has its own test.

**Ivy** (ruled 2026-10-31, evening) — 2y10m, no spleen, a full infant PCV13 series, PPSV23 at
13 and 20 months, **both thrown out for being too young**. Her second is not a "repeat after an
invalid first" (it came 7 months on, so the repeat rule passed; it failed on age), so the rule
above did not fire and her card still offered Option B PPSV23 — a third shot. Shown the
trade-off (a PPSV23 today would be her first one that counts, and CDC's Option B is not wrong
by its own rules), she chose **"PCV20 only"**. So the trigger is now **two or more PPSV23 shots
given, none counted**, whatever threw them out; the grey-area note still comes only from a
too-young first dose's repeat (`repeatOfUnderAgeDose`), so Ivy gets none. Her card is Noah's. The
chip under her second shot — found reading *"repeat this dose only"* when the app was driven,
beside a card offering no PPSV23 — now reads *"This dose does not count toward the series. It is
not repeated."*, as Noah's repeat does (his ruling: the chip under the repeat drops its promise of
a further PPSV23). `validate.js` hands over every dose's `closingSentence` and `closingLead`, so
the swap works for a shot thrown out on age as well as on timing.

A row that is not a shot is not counted as one: a dose dated in the future or before birth (a
record problem), or **a second row on the same date** — `duplicateEntry()` deliberately does
not label the twin of a dose that did not count, so the count dedupes by date itself. That also
fixed Sam-plus-a-duplicate-row reading *"3 PPSV23 doses have been given"*. *Judgements within
her rulings, listed in the PR:* Ivy's twin who is not immunocompromised, and Ivy with no
conjugate on record (the catch-up card, PCV20 only), each tested. Measured: **0 / 17,016** verdicts, **0 / 18,264** record-problem rows, **0 /
35,280** rendered lines against `main` — the grid holds no child with two PPSV23 shots under 2.

**Checked for her the same evening, no change:** whether Sam's second PPSV23 should be judged
against the **5-year** PPSV23 interval. No — CDC's 5 years runs from *"dose 1 PPSV23"*, a dose
that counted; Sam's too-young shot is not his dose 1, so his Jan 5 shot was a second try at
dose 1. CDC General Best Practices (read live 2026-10-31) states no gap from a too-young
non-live dose, and CDSI v4.64 puts its 5-year intervals only between two PPSV23 slots. He is
thrown out by the 8-week rule she kept; either rule gives the same answer for him.

Measured: **0 / 17,016** verdicts, **0 / 18,264** record-problem rows, **0 / 35,280** rendered
lines (`proseDiff` against `main`) — the grid holds no child with two PPSV23 shots this close.
Guard: `regression-2026-10-31-no-third-ppsv23-shot.test.js`. Ivy: `regression-2026-10-31-ivy-two-too-young-ppsv23.test.js`.

New sources: `cdcGbpRepeatUnderMinAge`, `cdcGbpLiveVaccine28Days` (quoted) and
`cdcGbpTimingSpacing` (the whole page). **0 / 17,016** verdicts, **0 / 18,264** record-problem
rows. Guard: `regression-2026-10-31-sam-grey-area-repeat-of-a-too-young-ppsv23.test.js`.

### §C-P2-HEALTHY — a healthy child's PPSV23 is not needed, at any age (owner, 2026-10-31)

**Zoe**, 3, healthy, four PCV20 doses, given a PPSV23 by mistake at 12 months. Her card read
*"PCV series complete"* while the chip under the PPSV23 said *"repeat this dose only (do not
restart the series)"* — an order for a dose a healthy child is not owed. The same mistake at 2½
was marked "valid" and counted with no comment. Asked, the owner chose **"Not needed" at any
age**, in Ava's words (§C-P2-ONTIME).

CDC, read live 2026-10-31. PPSV23 Vaccine Information Statement (5/29/25,
`cdc.gov/vaccines/hcp/current-vis/pneumococcal-polysaccharide.html`): *"PPSV23 is recommended as
an option for some children and adolescents with certain medical conditions or risk factors."*
CDC's pneumococcal recommendations page (updated Feb 25, 2026) gives routine childhood
vaccination as a 4-dose PCV series only, with PPSV23 under "Risk-based recommendations".

The sentence, on every PPSV23 of a child with no risk condition: *"Not needed: PPSV23 is given
only to children with certain medical conditions or risk factors, per CDC, and none is recorded
for this child. This dose isn't harmful, it isn't counted, and nothing needs to be repeated."*

| The dose | Before | Now |
|---|---|---|
| Old enough, would have counted | "valid", dose 1, no comment | **extra dose** + the sentence; still holds off a conjugate for 8 weeks (Ben's ruling — the weaker response follows the dose received) |
| Too young | invalid + "repeat this dose only" | **still invalid** (so it still holds off nothing — ANCHOR-1, re-confirmed on Rosa) + the sentence instead of "repeat" |
| Too soon after a PCV | invalid + "the next dose in this series can be given from …" | still invalid + the sentence; no date, because no PPSV23 is owed |

**Who is "healthy"** is `populationOf(...) === 'child-routine'` — the engine's one answer: it
ignores adult-only ticks (smoking, alcohol use disorder) and stops at 19, so an adult's childhood
PPSV23, which ACIP's adult rows count, is untouched. A record problem (future date, before birth,
duplicate) keeps its own wording.

**A side effect found and fixed.** The duplicate-entry check compared a row only with doses that
COUNTED, so a healthy child's PPSV23 typed twice on one day lost its "duplicate" once the first
became an extra dose (12 impossible-entry rows). An extra dose was really given, so it now joins
that comparison. Six older tests used a child with **no** risk condition to stand for "a child
who is not immunocompromised"; they now use a cochlear implant, which keeps their point.

Measured against `main`: **1,164 / 17,016** verdicts moved — every one a healthy child aged
2–18, every one only the PPSV23 going from "dose 1" to an extra dose (same status, 0 cards).
**126 / 18,264** record-problem rows, the same family. Rendered text (`proseDiff`): **1,752**
real patients' PPSV23 notes (1,098 counted→extra, 504 too young, 150 too soon) and 1,131
impossible entries — **0** cards, **0** children with a risk condition, **0** adults. Pinned
counts re-measured with reasons: forward-looking dates withdrawn 2,670 → 2,544; too-young
PPSV23 chips saying "repeat" 1,848 → 1,344. Guard:
`regression-2026-10-31-healthy-child-ppsv23-not-needed.test.js`.

### §C-P2-THIRD — an immunocompromised child's on-time third PPSV23 is an extra dose (owner, 2026-10-31)

**Lily**, 18 years 10 months, no spleen: PCV13 ×2 at age 2, PPSV23 at 2y4m, 7y5m and 12y6m —
each clear of five years. The third counted silently as "dose 3", on a card reading *"both
PPSV23 doses have been received"*. CDC's child notes print "dose 2 PPSV23" and no third
(read live 2026-10-30). Asked, the owner chose **"Extra dose"**: the same label P2 already gave
an EARLY third — *"Not needed: two PPSV23 doses have already been given (…), and CDC never
gives a third."* The early/on-time split is gone for both risk classes; the limits of
§C-P2-ONTIME (dated dose, a child today) and Ben's 8-week hold on a conjugate apply unchanged.

**The knock-on at 19, which was in the question she answered.** At 19 the adult rows count every
PPSV23 received (§C-P2-ONTIME's "child today" limit), so Lily holds three — and mm7401a1 prints
rows for one and two only. Before, a 19–49 IC / cochlear / CSF adult with three fell to the
fallback *"PCV20 or PCV21 ≥5 years … completes the series"* with **no ACIP number at all**; the
two-dose girl got *"Review at age 50 — or PCV20 or PCV21"*. Now **two or more** reads the
two-dose row, and the card names the real count (*"PCV13 and 3 doses of PPSV23"*).
*A judgement within her ruling, dose unchanged* — same products, same five years, same status,
same due date; only the words and the citation move. The card now ASKS
`mmwrBothPcv13PpsvKey()` which row speaks instead of re-testing the count, so the two cannot
drift (a mutation of the selector alone now fails 2 tests; before, it failed none).

Measured: **0 / 17,016** verdicts, **0 / 18,264** record-problem rows — the grid holds at most
two PPSV23 doses, so every patient here is hand-built. Guard:
`regression-2026-10-31-ic-child-third-ppsv23-is-extra.test.js`.

---

## §D — At-risk children 24 mo–18 y (p2016 Table 4; `cdcChildPneumo`) — each row implemented

1. 24–71 mo, any risk, **incomplete (0–2 PCV by 24mo)** → **2 doses** PCV20 or PCV15 ≥8wk apart.
2. 24–71 mo, any risk, **3 PCV all before 12mo** → **1 dose** PCV20 or PCV15.
3. 2–18 y, any risk, **completed series before 6y incl. ≥1 PCV20** → no additional doses.
4. 2–18 y **non-IC**, completed series before 6y with PCV13/15 (no PCV20, no PPSV23):
   A) 1 PCV20 ≥8wk after last PCV; **or** B) 1 PPSV23 ≥8wk after last PCV.
   (If PPSV23 already given → complete.)
5. 2–18 y **IC**, completed series before 6y with PCV13/15 (no PCV20, no PPSV23):
   A) 1 PCV20 ≥8wk; **or** B) 1 PPSV23 ≥8wk, then **≥5y later** 1 PCV20 **or** a 2nd PPSV23.
   (**If PPSV23 already given: nothing is due until ≥5 years after that first PPSV23;
   then 1 PCV20 *or* a 2nd PPSV23 — both options at the SAME five-year mark.**
   FINDING A, OWNER DECISION 2026-10-17 — see §D-note below.)
6. 6–18 y **non-IC**, no prior PCV13/15/20: A) 1 PCV20 ≥8wk after last pneumo; **or**
   B) 1 PCV15 ≥8wk, then ≥8wk later PPSV23 (if PPSV23 not previously given).
7. 6–18 y **IC**, no prior PCV13/15/20: same A/B as non-IC.
8. 6–18 y **non-IC**, **PCV13 only at/after age 6**: A) 1 PCV20 ≥8wk after PCV13; **or**
   B) 1 PPSV23 ≥8wk after PCV13.
9. 6–18 y **IC**, **PCV13 only at/after age 6**: A) 1 PCV20 ≥8wk; **or** B) 1 PPSV23 ≥8wk,
   then ≥5y after first PPSV23 give 1 PCV20 or a 2nd PPSV23.
   (**If PPSV23 already given: ≥5 years after that first PPSV23, then 1 PCV20 *or* a 2nd
   PPSV23.** No source states this history with a PPSV23 already given; it is read across
   from this row's own Option B. FINDING A, 2026-10-17 — see §D-note.)

Peds intervals are **≥8 weeks** throughout Table 4 for ≥24mo — with ONE exception, below.

### §D-note — FINDING A: an IC child who has ALREADY had a PPSV23 waits five years

**OWNER DECISION 2026-10-17. Implemented; four branches of `recommend.js`.**

An immunocompromised child or teenager who has already received one PPSV23 gets **no
pneumococcal vaccine until 5 years after that first PPSV23**, and at that point either
PCV20 **or** a 2nd PPSV23. Before this decision the app offered the PCV20 at **8 weeks**
while offering the 2nd PPSV23 at 5 years, on one card headed "choose ONE option" — a
choice between a dose available today and a dose available in 2029. **225 of the 16,008
grid patients were told PCV20 was due today when it was not**; 228 more were correctly due
(their first PPSV23 was over 5 years ago), and that split on the five-year line is what
makes this a real finding rather than a blanket misreading.

**The sources disagree, and they were published two and a half years apart.**

- **CDC, "Summary of Risk-based Pneumococcal Vaccination Recommendations"**, page dated
  **MAY 8, 2026**, read live 2026-10-17
  (`https://www.cdc.gov/pneumococcal/hcp/vaccine-recommendations/risk-indications.html`).
  Stated **twice**, word for word — once under "Children 2 through 5 years old" and once
  under "Children 6 through 18 years old":
  > "Then no pneumococcal vaccines are recommended at this time. Wait until at least 5
  > years have passed since they received their first PPSV23 dose. Then give 1 dose of
  > PCV20 or PPSV23."
- **immunize.org P2016**, Item #P2016, dated **2/16/2024**, PDF downloaded live
  2026-10-17. Table 4 footnote ‖ — the only place in that sheet addressing a child who
  has already had PPSV23, since its table columns only count conjugate doses:
  > "If PPSV23 previously given, options are (a) give one dose of PCV20 at least 8 weeks
  > after most recent pneumococcal vaccination, or (b) give a second dose of PPSV23 five
  > years after the first dose of PPSV23."

**Why CDC governs, beyond being newer: P2016 contradicts itself on this patient.** Row 5's
own Option B reads "1 dose of PPSV23 at least 8 weeks after most recent PCV dose; **at
least 5 years later**, give 1 dose of PCV20 or a second dose of PPSV23". Follow that Option
B and the child **is** this patient — conjugates before age 6, one PPSV23, no PCV20 — and
P2016 itself says the next dose is five years away. Its footnote ‖ says 8 weeks for the
identical child. The two differ only in whether the PPSV23 was given inside P2016's own
plan or before it. So this is not two credible sources disagreeing; it is a 2024 footnote
disagreeing with the May 2026 CDC page **and** with the rest of its own sheet.

**What did NOT change, and must not.** CDC's 6–18 section, for a child who has never had
any conjugate vaccine: *"Give 1 dose of PCV15 or PCV20 at least 8 weeks after the most
recent pneumococcal vaccine dose. **Give it regardless of whether the child has previously
received PPSV23 or PCV7.**"* That is an explicit instruction to ignore a prior PPSV23 and
vaccinate at 8 weeks (rows 6 and 7 above). A test holds that card at 8 weeks so the
five-year rule cannot creep onto it.

**The 8-week floor is kept, not dropped.** The gate is the **later** of (5 years after the
first PPSV23) and (8 weeks after the most recent pneumococcal dose) — a conjugate dose can
fall after the PPSV23. Measured: 0 of the 228 patients already past five years are also
inside 8 weeks, so the floor moves no committed verdict; it has its own test.

Single source: `icPostPpsv23DueState()` in `recommend.js`. Citation:
`pedsIcPpsvWaitFiveYears` in `refs.js`. Test:
`regression-2026-10-17-finding-a-ic-ppsv23-five-year-wait.test.js`.

---

## §E and §F — Transplant / CAR-T / B-cell: the app STOPS (owner decision 2026-10-16)

These two sections used to state a post-transplant pneumococcal schedule — §E for
children under 19 (immunize.org Table 5), §F for adults (Fred Hutch LTFU §IX). **The app
no longer states one.** Ticking the transplant box hard-stops the engine: `excluded:
true`, `recs: []`, no advisory banner, and not even the ordinary age-based schedule the
patient would get if the box were unticked.

| | |
|---|---|
| Risk id | `hct_cart_bcell_exclude` (one row; transplant and CAR-T/B-cell merged) |
| Engine | `hasExclusion()` → the early return in `recommend()`; `exclude: true` is the only flag |
| UI | `Results.jsx`'s `if (excluded)` arm; `App.jsx` skips the History step entirely |
| Citation shown | `cdcAlteredImmunocompetence`, and nothing else |

**What the screen says.** Title: *"Individualized revaccination schedule required."* Then
the 307-character message in `recommend.js`'s `EXCLUSION_MESSAGE`, naming ASCO, NCCN,
IDSA and CDC **in words, linked to nothing** (owner decision 6). Plus, only when doses
were typed, one italic line: *"Recorded doses are kept but not evaluated here."*

**Why there is no schedule here any more.** Not because the advice was low value —
because it could not be kept true. The adult row had been ASCO 2024 in the code since
2026-09-14 while §F here, `CLAUDE.md` and the checkbox's own citation chip all still said
Fred Hutch **32 days later** — and those are not the same schedule (four doses from three
months, versus three titer-gated doses from six). MeningoVax's equivalent advisory was
corrected four times in five weeks. Full evidence:
[docs/archive/plan-2026-10-16-transplant-hard-stop-both-apps.md](docs/archive/plan-2026-10-16-transplant-hard-stop-both-apps.md).

**The retired schedules, verbatim with their citations**, so nobody has to reconstruct
them from memory:
[docs/archive/retired-2026-10-16-post-transplant-pneumococcal-schedules.md](docs/archive/retired-2026-10-16-post-transplant-pneumococcal-schedules.md).

**Two guards hold this in place.** `regression-2026-10-16-transplant-stop-mirrors-meningovax.test.js`
freezes the row and every word of the stop byte-for-byte against MeningoVax's copy
(skipped, not failed, when the sibling repo is absent — CI clones only this repo).
`regression-2026-10-16-transplant-stop-mirrors-meningovax.test.js`'s in-repo half sweeps
`GRID_RISK_PROFILES` and asserts the exclude id returns `excluded: true` with `recs: []`
at every age and with every history.

---

## §G — Adults 19–49 y WITH a risk condition (`cdcAdultPneumo`, `cdcAdultTimingJobAid`)

Routine starts at 50; 19–49 is **risk-only**. In THIS age band the PCV15→PPSV23
**recommendation is keyed on the risk class**:

| 19–49 adult | PCV15 → PPSV23 |
|---|---|
| Immunocompromising condition, cochlear implant or CSF leak | **≥8 weeks** |
| Chronic conditions only | **≥1 year** |

The 8 weeks is the **advice** here, not an option, so the "may be considered" sentence is
**not** shown at this age. Source: `mm7401a1`'s clinical guidance table, row "Adults aged
19–49 years with an immunocompromising condition, a CSF leak, or a cochlear implant" —
"If PCV15 is used, **administer** a single dose of PPSV23 **≥8 weeks** after the PCV15
dose." The job aid prints the same ≥8 weeks on p.2 (immunocompromising) and p.3 (cochlear
implant / CSF leak), and ≥1 year on p.4 (chronic). See §K's S15 bullet.

Other 19–49 rows, which are **NOT** keyed on risk class and did not move:
- **PPSV23 only:** PCV15/20/21 **≥1 year** after PPSV23, every class.
- **PCV13 only:** PCV20 or PCV21 **≥1 year**. There is **no PPSV23 route** — the job aid
  prints "NO OPTION B" on all four pages.
- **PCV13 + 1 PPSV23:** IC / cochlear implant / CSF leak → PCV20 or PCV21 **≥5 years**
  (not a second PPSV23); chronic only → nothing now, **review at 50**.

> **Corrected 2026-10-16 (S15).** This section said the recommendation was "≥1 year for
> every adult, whatever the risk class". That was A-P1-1 (2026-10-10), taken from one
> summary sentence in the CDC adult schedule notes. `mm7401a1` (January 2025) — the ACIP
> recommendation those notes summarise — splits it by age band, and the owner ruled on
> 2026-10-16 that ACIP's wording governs. An earlier correction here (2026-10-15) replaced
> a risk-class-keyed rule that had **no age term**; this one restores the risk-class key
> **at 19–49 only**. The ≥50 band is unchanged and is in §H.
> The **validity floor** for a dose already given (S14-7) is a different question again and
> is unchanged; §K keeps the two apart and so must this section.

Prior-vaccine branches:
- **None / unknown / PCV7-only:** 1 dose PCV15, PCV20, or PCV21. PCV15 → PPSV23 (≥1y; the
  8-week minimum named as an option for IC/cochlear/CSF). PCV20/PCV21 → complete.
- **PCV15 only (PPSV23 pending) → INCOMPLETE:** PPSV23 ≥1y (8-week option named for
  IC/cochlear/CSF); may substitute PCV20/PCV21 if PPSV23 unavailable.
- **PPSV23 only:** PCV15/20/21 ≥1y after PPSV23 (PCV15 → no further PPSV23).
- **PCV13 only:** PCV20 or PCV21 ≥1y after PCV13 → complete.
- **PCV13 + 1 PPSV23:** PCV20 or PCV21 ≥5y after last pneumo → complete (IC/cochlear/CSF);
  for chronic conditions, none now → review at 50.
- **Already PCV20, or PCV21, or (PCV15 & PPSV23):** none now (complete).

---

## §H — Adults ≥50 y (`cdcAdultPneumo`, `cdcAdultTimingJobAid`, `mmwr7401a1`; routine lowered 65→50 eff. 2024-10-23)

Routine for ALL adults ≥50 regardless of risk.
- **None / unknown / PCV7-only:** PCV20 or PCV21; **or** PCV15 then PPSV23 **≥1 year** (8-week minimum may be *considered* for IC / cochlear implant / CSF leak — named, never substituted). `mm7401a1`, ≥50 row: "a single dose of PPSV23 should be administered ≥1 year after the PCV15 dose. A minimum interval of 8 weeks **can be considered** if PCV15 is used in adults with an immunocompromising condition, cochlear implant, or CSF leak." **S15 (2026-10-16): this card now carries that option sentence.** It did not before — the option appeared only once the PCV15 had been recorded, i.e. after the booking decision was made. Unlike §G, the ≥50 band is **not** keyed on risk class.
- **PPSV23 only:** PCV15/20/21 ≥1y after PPSV23 (PCV15 → no further PPSV23).
- **PCV13 only:** PCV20 or PCV21 ≥1y → complete.
- **PCV13 + PPSV23, and NO PPSV23 was received at ≥65:** PCV20 or PCV21 **≥5y** after the
  last pneumococcal dose → complete. This is a **plain recommendation**, not shared
  decision-making. (Corrected 2026-10-10, S10: this line previously said "shared clinical
  decision-making" for both rows, which is the documentation half of A-P0-1.)
- **PCV13 + PPSV23, AND PPSV23 was received at ≥65:** **shared clinical decision-making** —
  PCV20/PCV21 ≥5y, or nothing.
- **PCV15 only, no PPSV23 → INCOMPLETE:** PPSV23 **≥1 year** (or substitute PCV20/21), with the 8-week option named for IC / cochlear implant / CSF leak. Series complete once given. At **19–49** that same row is **≥8 weeks** for those conditions — see §G.
- **PCV15 & PPSV23, or PCV20, or PCV21 (any age):** complete.

> Implementation note on `PCV13+PPSV23 at ≥65` (rewritten 2026-10-10, S10 — A-P0-1).
> The split is decided on the **date of the PPSV23 dose versus the patient's real 65th
> birthday**, to the day. When the clinician enters a date of birth, the engine keeps it
> (`patientAge.js`) and compares `ppsvDate >= addCalendarMonths(dob, 780)`. "At age 65 years
> or older" includes the birthday itself.
>
> CDC's 4-day grace does **not** apply to this test: the grace governs whether a dose that
> was given counts as valid, and this test instead selects which of two recommendation rows
> the patient is on.
>
> Fallbacks, in order: an **undated** PPSV23 falls back to the patient's current age as a
> proxy; a patient entered as **Years/Months** (no date of birth) falls back to current age
> minus the calendar months since the dose. Both are approximations and are labelled as such
> in the Age step's own copy.
>
> This previously used `am - Math.round(daysBetween(ppsvDate, today) / 30.4375) >= 780` — a
> float current-age minus an elapsed span rounded to whole months — which misclassified
> 2,782 of 29,565 swept (dob, dose-date) pairs, all within −14…+15 days of the birthday.

---

## §I — PCV21 specifics (`mmwr7336a3`)

> **Two-concept distinction (important for implementation):**
> - **PCV21 product minimum age = 18 years (216 months)** — Capvaxive is FDA-approved
>   and ACIP-recommended from age 18. A patient aged 18y may receive PCV21.
> - **Adult schedule routing boundary = 19 years (228 months)** — the adult prior-vaccine
>   matrix (§G/§H) and the adult-only risk gate in StepRisks all apply from 19y. (The
>   adult post-transplant pathway used to be a third consumer of this boundary — and used
>   18, not 19, so its own title said "child <19y" for an 18y6m patient; it was deleted on
>   2026-10-16.) Patients aged 18 use the child/adolescent rulebook (§B–§D) for
>   schedule routing even though PCV21 is a valid product choice for them.
>
> These two thresholds are kept as separate named constants (`PCV21_MIN_AGE_M = 216` and
> `ADULT_SCHED_MIN_M = 228`) in `src/logic/scheduleConstants.js`. Never collapse them
> into a single value — they govern different gates. That file also owns a third,
> equally distinct age: `ROUTINE_ADULT_MIN_M = 600` (50y), where routine age-based adult
> eligibility begins (§H; mm7401a1).

- Option for **any patient ≥18y** who qualifies for a PCV. **Not for children** (<18y).
- **A PCV21 dose given off-label under 18 is always RECORDABLE, and never COUNTS.**
  Two different questions, and the app answers them separately (`PCV21-OFFLABEL`, owner
  decision 2026-10-15).
  - *Recordable:* the history dropdown offers PCV21 at **every** age. It used to hide the
    product below 18, which did not prevent an off-label dose — it only prevented the
    clinician from recording one, so the dose vanished with no warning. Every other PCV
    has always been ungated for the same reason: record what happened, then grade it.
  - *Does not count:* graded `invalid` against the product's own `minAgeM`
    (`PCV21_MIN_AGE_M`), with CDC's 4-day grace, saying so in plain words and naming the
    age at the dose. Per **CDC General Best Practices** — "Doses of any vaccine
    administered ≥5 days earlier than the minimum interval or age should not be counted
    as valid doses and should be repeated as age appropriate" — and the FDA approval for
    ages ≥18 (`mmwr7336a3`). It is **not** a record problem: the patient really received
    it, so a replacement dose **is** owed. **But the replacement is not another PCV21** —
    see §I-REMEDY below, which corrects what this bullet used to say. CDC's own words are
    "repeated **as age appropriate**", and PCV21 is not age-appropriate for a child at any
    age below 18.
- **A PCV21 dose given at 18–19 COUNTS, and says it was given before the recommended
  starting age.** **OWNER DECISION 2026-10-16 (N1), implemented.** PCV21 carries two ages
  a year apart, both from `mmwr7336a3` (read live 2026-10-16):

  | | Age | Constant | What the source says |
  |---|---|---|---|
  | FDA licence | **18y** | `PCV21_MIN_AGE_M` | licensed "for adults aged ≥18 years" |
  | ACIP recommendation | **19y** | `ADULT_SCHED_MIN_M` | "PCV21 as an option for adults aged ≥19 years who are currently recommended to receive a dose of PCV" |

  The counting floor **stays at 18y** — the dose is validly licensed, counts, and is
  **never repeated**. What changed is that the app no longer says this in silence: a dose
  in that one-year gap carries a note naming both ages. Before N1, a dose given the day
  the patient turned 18 and one given the day they turned 19 were **indistinguishable** —
  both a green "Dose 1 of 1" with `reasons: []` (measured on four patients through
  `analyzeBoth`, 2026-10-16).

  Mechanics: `adviseIfBeforeRecommendedAge()` in `validate.js`, reached through S14-3's
  `advise()` — a flag on a **valid** result, never a status of its own, so a dose that
  counts cannot stop counting. **The chip does not move**: it stays "Dose 1 of 1" per
  S14-2, which put timing in the sentence below the chip and not in the chip. Both ages
  are read from the two constants; neither is typed as a literal.

  With a date, the age **at the dose** decides (S10-N1). Without one, today's age is an
  upper bound on the age at administration, so a patient still under 19 today cannot have
  been vaccinated at 19 — the note is certain and is given. Over 19 with no date, nothing
  can be known and the app stays quiet.

  **CDSI v4.64 is noted and not followed.** It sets PCV21's *allowable* age at
  **"19 years − 4 days"**, which would make an 18-year-old's dose invalid. The owner
  ruled otherwise, and the authority rule agrees: an `allowableVaccine beginAge` derived
  from the recommendation is a CDSI *preferable* window, which yields to the FDA licence
  for the product floor — and the clinical content of the 19y boundary is carried as the
  note instead of as a rejection.
- Geographic note: PCV21 **lacks serotype 4**. In regions where ≥30% of pneumococcal
  disease is serotype 4 (Alaska, Colorado, Navajo Nation, New Mexico, Oregon), PCV20 (or
  PCV15+PPSV23) may be preferred. Surfaced as an **advisory note**, not a hard block.

### §I-REMEDY — A child's rejected PCV21 names PCV20, not a repeat (2026-10-26)

From the owner's children's table: PCV21 under 18 is *"rejected correctly; wording says
'repeat this dose' where it should name PCV20."*

**The chip contradicted itself.** Priya, 10, asplenia, PCV21 recorded 1 Jun 2026:

> *"PCV21 (Capvaxive) is licensed for adults ≥18 years only. This dose was given at
> ~10y 1m — it does not count."*
> *"This dose does not count toward the series — **repeat this dose only** (do not restart
> the series)."*

Repeating it means giving her another PCV21, which the sentence above has just said is not
licensed for her. Every repeat would be rejected again for the same reason, forever. The
**verdict was right and is unchanged**; the advice under it was unusable.

**It is a THIRD closing sentence, not one of the two that existed.** W1 (2026-10-11) split
invalid doses in two: one rejected only for **timing** was never missing, so it takes *"the
next dose can be given from…"*; every other invalid dose **is** missing and keeps *"repeat
this dose only"*. A child's PCV21 is genuinely missing — she still needs a conjugate — but
she needs a **different product**, so neither sentence fits. It now reads:

> *"This dose does not count toward the series — **give a dose of PCV20 instead** (do not
> restart the series)."*

**CDC's own phrase is the grounding**: doses given too early *"should be repeated **as age
appropriate**"*. PCV21 is not age-appropriate for anyone under 18, so "as age appropriate"
is precisely what naming PCV20 does.

**⚠ A FIELD, NOT STRING SURGERY.** `walk()` chooses the closing sentence from
`recordProblem` and `intervalRuleId`, never by matching text — *"string surgery on a
sentence built somewhere else is the kind of coupling that breaks silently when the wording
changes"*, as its own comment puts it. The new branch keys on `remedyProduct`, set by
`remedyIsAnotherProduct()` in `validate.js`, the same shape.

**A near miss, recorded.** The first draft reused `DOES_NOT_COUNT_LEAD`, which carries the
clause *"given too soon after the dose it is measured from"* — so the chip claimed a timing
fault on a dose whose timing is irrelevant. Caught by driving the engine, not by the suite,
and pinned by the guard.

**Scope.** PCV20 is named because her row names it. PCV15 is also licensed for children,
and the **four other rows** of her table saying the remedy is PCV20 rather than another
dose of the same vaccine are a separate queue item (P3) that this does not build. **No
verdict moves** — the dose was rejected before and is rejected now.

Guard: `regression-2026-10-26-pcv21-for-a-child-names-pcv20.test.js`, with controls that an
18-year-old's PCV21 still counts, a PCV20 below the minimum age names **no product at all**
(that control said *"repeat this dose only"* until §I-AGEREMEDY below replaced it), a timing
rejection still gets W1's sentence, and a grid sweep that no dose carries both sentences.

---

### §I-AGEREMEDY — A conjugate rejected on AGE names no product (OWNER DECISION 2026-10-29)

**This REVERSES an owner decision taken hours earlier the same day**, and the reversal is
the point of the section. PR #95 ("always PCV20") was **closed unmerged** rather than landed
and undone, so `main` never carried it.

**What went wrong with the earlier question.** She was asked whether a thrown-out conjugate
should be replaced by PCV20, using **Mia** — 2, cochlear implant, PCV15 on 1 June and a
second PCV15 19 days later — described as a patient the app tells to *"repeat this dose"*.
**Mia is not such a patient.** Her dose is rejected for **timing**, and since W1
(2026-10-11) a timing rejection reads *"It is not repeated; the next dose in this series can
be given from <date>"* and names no product at all. Her answer was therefore given about one
family and applied to another: babies whose conjugate was thrown out for being below the
minimum **age**. **Re-run the patient the question is built on; a described chip is not a
chip.**

**The patient who settled it.** Ayla, born 24 Sep 2026, PCV15 on 29 Oct at 35 days old —
three days below the 38 days CDC's 4-day grace allows against the 42-day minimum. Her chip
said PCV20 while the card above it offered *"PCV20 or PCV15 — choose one"*; **390 of the 462
affected cards looked like that**. Shown her, the owner asked **whether PCV20 is indicated
at that age at all**. Fetched live 2026-10-29:

| Source | Sentence |
|---|---|
| CDC Child/Adolescent Schedule Notes, pneumococcal | *"(minimum age: 6 weeks [PCV15], [PCV 20]; 2 years [PPSV23])"* |
| CDC Pneumococcal Vaccine Recommendations | *"Administer a 4-dose PCV series (PCV15 or PCV20)"* |

The two conjugates share **one** minimum age, **neither page states a preference**, and the
dose failed on age rather than on product. Her words: *"only recommend vaccines that are
approved for their age"*, then **"either is fine here"**.

**What a card now says.** An age-rejected conjugate carries a product-free sentence, in two
forms because a patient who has since passed the floor must not be shown a bar she has
cleared:

> still below the minimum today — *"This dose does not count toward the series — a further
> dose can be given from the **6 weeks** minimum age at the earliest, and **any PCV approved
> for that age** may be used (do not restart the series)."*
>
> already old enough — *"This dose does not count toward the series — give a further dose
> when due; **any PCV approved for the patient's age** may be used (do not restart the
> series)."*

**⚠ NO DATE IS STATED HERE.** The chip names the minimum **age**, which
`validateOnePCV` already holds; it never names a date. Per the owner ruling of 2026-10-24
the rec card is the only surface that states a **due** date and a chip states an
**earliest**. Ayla's card says **26 Nov** — four weeks after the dose she actually got, per
Ruling D — which is **later** than her 6-week birthday, so a date here would contradict it.

**Three families are deliberately untouched, each for its own reason:**

| Family | Keeps | Why |
|---|---|---|
| a child's **PCV21** | *"give a dose of PCV20 instead"* | barred at her age whatever the date, so a repeat fails again. §I-REMEDY, already on `main`. **This is the one case her rule selects.** |
| a too-young **PPSV23** | *"repeat this dose only"* | a child whose PPSV23 came at 18 months needs a **PPSV23** at 2; no conjugate substitutes |
| a **record problem** | its own wording | not an age rejection; the field is set at the two minimum-age call sites only, never by text matching |

**A PCV21 given just before an 18th birthday is NOT a gap, and was checked.** 198 grid chips
showed a PCV21 still saying *"repeat this dose only"*. They are patients **now 18 or older**
whose dose was given at 17y 11m: the PCV21 branch keys on **current** age, so it correctly
does not fire, and repeating PCV21 is genuinely fine for them. They take the product-free
sentence's second form.

**Measured over the whole grid, 2026-10-29** (re-measure, never quote from here): **748**
conjugate chips moved off *"repeat this dose only"* onto the product-free sentence; chips
naming PCV20 stay at **264**, every one a child's PCV21; the **1,848** too-young PPSV23 chips
are unchanged. **0 verdicts moved** — both corpora byte-identical, because a dose rejected
before is rejected now.

**A GUARD THAT PASSED FOR THE WRONG REASON, found by mutating.** The first draft asserted
`/6 weeks minimum age/` on Ayla's chip — but her **first** line already reads *"below the 6
weeks minimum age for PCV15"*, so the regex matched text that predates the change. Forcing
`stillTooYoung` to a constant `false` broke **nothing** in all 1,684 tests. The assertion now
quotes the whole clause. Mutations that do bite: never attaching the field at the dated call
site fails **8**; the `stillTooYoung` constant fails **1**; re-applying #95 fails **3**.

Guard: `regression-2026-10-29-age-rejection-names-no-product.test.js`. Two existing tests
were **widened, not loosened**: §I-REMEDY's control moved onto the new sentence, and W1's
non-timing example moved from a too-young PCV13 to a too-young **PPSV23** — the family that
still demonstrates W1's point — with the PCV13 kept beside it asserting the new wording.

---

## §J — Adult risk catalog (`cdcAdultPneumo`, `cdcAdultTimingJobAid`, `mmwr7401a1`)

### A card cites the schedule it was written from, and never the other one

**N6 (owner-reported 2026-10-16) + N5 (OWNER DECISION 2026-10-16, option A).**

Every entry in `refs.js` declares a **`rulebook`** — `'child'`, `'adult'` or `'any'` —
and `collectRefs()` in `recommend.js` keeps only the sources written for the card being
built, plus the age-neutral ones. A card's **own defaults are never filtered**: a card
that asks for a source has already decided it belongs there.

**What this fixed.** A risk condition's `refs` list used to be merged into the card
whole. Most conditions exist at every age and therefore list **both** CDC schedule
pages, so both reached whichever card was being built. Measured over every risk
condition on 2026-10-16:

| | before | after |
|---|---|---|
| risk conditions putting a **child** source on an **adult** card | 13 of 17 | **0** |
| risk conditions putting an **adult** source on a **child** card | 12 of 17 | **0** |
| adult transplant card citing the **paediatric** transplant table | yes | **no** (both cards deleted 2026-10-16 — the app now stops instead) |

Over the 16,250-patient grid: **15,604 citation chips removed, 0 added**, and **not one
of them was a source belonging to the card's own schedule** — measured, not asserted.

**This is the second escape of one bug.** P3-9b had fixed the child direction only, by
stripping `adultOnly` ticks, and left a comment in `recommend.js` claiming the other
direction was impossible. It was not: a condition present at every age is not
`adultOnly`. Routing and citation are different questions and are now answered
separately — **never add a third age test at a call site; declare the rulebook on the
source.**

**N5 — the adult risk list no longer cites `rr7203a1`.** Four conditions (asplenia,
immunosuppression, alcohol use disorder, cigarette smoking) listed the 2023 adult ACIP
paper while the other thirteen listed no MMWR at all, so the sources under an adult card
changed with which box was ticked — the paper appeared for a smoker and not for HIV. It
was not wrong, just inconsistent. Every adult card already cites the **CDC Adult Notes**,
which enumerate all four by name (read live 2026-10-16), plus the **Adult Timing Job
Aid** and **mm7401a1**, which prints the same list and says the 19–49 risk
recommendations "have not changed from previous recommendations". `rr7203a1` stays in
`refs.js` as the uncited primary-source record, logged in `citation-orphans.test.js`.

Guarded by `src/data/__tests__/regression-n6-citations-follow-the-rulebook.test.js`.

### A card credits the documents it rests on — the Adult Timing Job Aid, quoted

**C8, document 2 (OWNER DECISION 2026-10-17: a (document, statement) pair is either
cited or taken off that card, never left listed-but-unexplained).** The removals landed
first; this is the crediting half.

The **CDC Adult Pneumococcal Vaccine Timing Job Aid** (NCIRD, **March 2025**) was a grey
button on **6,805** cards that no raised number pointed at — the whole of the owner's
report, *"I forget why there are multiple source chips listed if its only citing one of
them"*. Eleven of its fourteen statements now quote the document's own sentence, so
**6,805 → 3,189** and **14 distinct statements → 3**. **3,616 cards gained a citation;
no advice moved and no card's wording changed** beyond the superscript numbers
themselves.

| The sentence the card now quotes | Where it sits | Shown to |
|---|---|---|
| "No vaccines recommended; schedule is complete." | p.1, the `PCV15 & PPSV23 OR PCV20 OR PCV21` row | **50+ only** |
| "Together, with the patient, vaccine providers may choose to administer PCV20 or PCV21 to adults ≥65 years old…" | p.1, shared clinical decision-making | 50+ |
| "No vaccines are recommended at this time. Review pneumococcal vaccine recommendations again when your patient turns 50 years old." | **p.4**, the `PCV13† and PPSV23` row | **19–49 only** |
| "Consider minimum interval (8 weeks) for adults with an immunocompromising condition, cochlear implant, or cerebrospinal fluid leak (CSF) leak" | p.1, footnote † | **50+ only** |
| "Also applies to people who received PCV7 at any age and no other pneumococcal vaccines" | footnote `*`, all four pages | either |
| "If PPSV23 is not available, PCV20 or PCV21 may be used" | footnote `¶`, all four pages | either |

**The page is part of the citation.** The four pages state different rules for different
patients — p.1 *Adults ≥50*, p.2 *19–49 immunocompromising*, p.3 *19–49 cochlear implant
or CSF leak*, p.4 *19–49 chronic* — and **the same table row answers "schedule is
complete" on p.1 and "review again at 50" on pp.2–4.** So each quoted entry declares a
`pdfPage`, and every `population` was checked page by page. The 50+/19–49 split is the
engine's existing `isOlderAdult` (i.e. `ROUTINE_ADULT_MIN_M`) — **never a second age
test**; a hand-typed `am >= 600` there fails `regression-s6-1`.

**A quoted PDF deep-links to its page, not to a sentence.** `#:~:text=` is an HTML text
fragment and no PDF viewer honours it, so `highlightUrl()` emits `#page=N` for a PDF
instead. These are the app's first quoted PDF citations; before them every quoted source
was a web page. A quoted PDF with no `pdfPage` is a dead link that still looks live, so
`refs.test.js` fails on one.

⚠ **The ligature trap, and why a quote here must not be copied from a text dump.** The
job aid's embedded font maps the fi/fl ligature to a bare `f`, so **every** extractor
drops the following character: the document's *fluid* comes out *fuid*, *specified* as
*specifed*, *deficiency* as *defciency*. Measured 2026-10-17 with two independent
extractors: the letter pair **"fi" occurs zero times in all four pages**, and
U+FB01/U+FB02 zero times — impossible for a document containing "specified
immunocompromising conditions". `docs/archive/c7-2026-10-17-source-readings.md` recorded
"fuid" as *"the document's own typo"*; **it is not**, and the quotes above are written as
the document reads. (The doubled "leak" in "fluid leak (CSF) leak" **is** the document's
own and stays.) A second trap: read this document **positionally** — a flat dump splices
the row's left-hand cells into the middle of the shared-decision sentence, assembling a
quote out of two unrelated patients.

**Three statements are deliberately still uncredited (3,189 cards), pending the owner.**
Each rests only on a table **cell** — `≥5 years`, `≥1 year`, `NO OPTION B` — which this
document states in **no prose anywhere**:

| Cards | The statement |
|---|---|
| 1,512 | PCV13 + PPSV23 given → PCV20/21 at ≥5 years |
| 1,154 | PPSV23 given → a PCV at ≥1 year |
| 523 | PCV13 given → PCV20/21 at ≥1 year, no PPSV23 needed |

Under the cite-or-remove rule these are a clinical decision (quote the cell, or take the
job aid off those cards) and so are the owner's, not a session's. All three are pinned as
uncredited by `regression-c8-doc2-job-aid-cites-its-own-sentences.test.js`, so inventing
a sentence the document does not contain fails a test.

Guarded by `src/logic/__tests__/regression-c8-doc2-job-aid-cites-its-own-sentences.test.js`
(23 tests; **13 failing / 10 passing before the fix**).

### What the risk class decides

What the class decides on the adult pathway — **four separate questions**. Since S15
(2026-10-16) the recommended interval IS one of them, but **only together with the age
band**: the class alone does not decide it, and neither does age alone.

| | IC / cochlear implant / CSF leak | Chronic conditions only |
|---|---|---|
| **Recommended** PCV15→PPSV23 interval, **19–49** | **8 weeks** | 1 year |
| **Recommended** PCV15→PPSV23 interval, **50+** | 1 year | 1 year |
| The 8-week option is **named** as a choice (50+ only — at 19–49 it is the advice above) | yes | no |
| **Validity floor** for a dose already given (S14-7; **owner determination 2026-10-11**, never ACIP) — **no age term** | 8 weeks | 1 year |
| The 19–49 **PCV13+PPSV23** row | PCV20/PCV21 ≥5 years | no dose now, review at 50 |

Read the first two rows together: an adult with HIV is told 8 weeks at 30 and a year at 55.
Read rows 1 and 4 together: at 19–49 the recommendation and the floor coincide at 8 weeks;
at 50+ they differ, and that is deliberate — the app recommends the year and still counts a
dose given at 8 weeks.

**Immunocompromising:** chronic renal failure, nephrotic
syndrome, HIV, congenital/acquired asplenia, sickle cell / hemoglobinopathies,
immunodeficiency, generalized malignancy, leukemia, lymphoma, Hodgkin, multiple myeloma,
iatrogenic immunosuppression (incl. long-term steroids/radiation), solid organ transplant.
**Cochlear implant** and **CSF leak** are treated as IC for all three questions above (CDC
adult notes), while p2016 Table 3 lists them under non-IC, so they stay nonIC for the **peds
catch-up row**.

**Chronic conditions:** chronic heart disease, chronic lung disease
(COPD/emphysema/asthma), chronic liver disease, diabetes, alcohol use, cigarette smoking.

> **Corrected 2026-10-15.** The two headings above read "Immunocompromising (shorter
> PCV→PPSV23 = ≥8wk)" and "Chronic conditions (≥1y interval)" — the pre-A-P1-1 keying,
> stated as the recommendation. Three of the app's own files said it too; `riskFactors.js`'s
> header was the worst, carrying it two hundred lines above the correct constants.

---

## §K — Cross-cutting rules

- **PCV7 ignored** for everyone — not counted in the PCV13/15/20-based tables (`immPCV7`).
  **UI wording (S14-6, owner decision 2026-10-11):** the chip reads MeningoVax's own
  "Off-window - repeat" rather than "Recorded (does not count)" — high-risk patients are
  treated as PCV-naïve for these doses, so a dose genuinely is owed, the same shape as
  MeningoVax's meaning of the words. Internally `status` stays `'noncounting'`, distinct
  from `'invalid'`: PCV7 was validly given, it just never counts.
- **Unknown / undocumented history → treat as unvaccinated** (CDC).
- **Multiple risk conditions:** apply all relevant pathways; most protective wins;
  **IC precedence over non-IC** — the IC catch-up rows win, the 8-week option is named, and
  the 8-week validity floor applies. At **19–49** it DOES also mean the shorter
  *recommended* interval (S15, 2026-10-16); at **50+** it does not — see the S15 bullet
  below. (Corrected twice: 2026-10-15, where this bullet read "the ≥8wk interval and the IC
  catch-up rows win" with no age term at all; and 2026-10-16, where it read "≥1 year for
  every adult".)
- **A series containing PCV20 (or PCV21 in adults) ⇒ no PPSV23.**
- **PCV15 (without a later PCV20/21) ⇒ a PPSV23 follow-up is required to be complete.**
- **Adult PCV15→PPSV23 interval = ≥8 weeks at 19–49 for IC / cochlear implant / CSF leak,
  ≥1 year otherwise** (owner decision **2026-10-16, S15**). This supersedes A-P1-1
  (2026-10-10), which flattened it to ≥1 year for every adult, and the 2026-10-15 plan,
  which would have keyed it on risk class with no age term.

  **Governing sources, both read live 2026-10-16** — `mm7401a1` (ACIP, **January 2025**,
  https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm) and CDC's **Adult Pneumococcal
  Vaccine Timing Job Aid** (NCIRD, **March 2025**). **`rr7203a1` (2023) is superseded and
  must never be cited for an adult interval.** mm7401a1's clinical guidance table, verbatim
  — note the verb, which is the whole rule:
  > ≥50: "If PCV15 is administered, a single dose of PPSV23 **should be administered ≥1
  > year** after the PCV15 dose. A minimum interval of 8 weeks **can be considered** if
  > PCV15 is used in adults with an immunocompromising condition, cochlear implant, or CSF
  > leak."

  > 19–49 with an immunocompromising condition, a CSF leak, or a cochlear implant:
  > "If PCV15 is used, **administer** a single dose of PPSV23 **≥8 weeks** after the PCV15
  > dose."

  > 19–49 with chronic medical conditions: "If PCV15 is administered, a single dose of
  > PPSV23 should be administered **≥1 year** after the PCV15 dose."

  The job aid renders the same split: ≥8 weeks inline on p.2 and p.3, ≥1 year on p.4 and on
  p.1, where p.1 carries the 8 weeks only as footnote †. **This also retires A-P1-1's claim
  that the job aid's 19–49 "8 weeks" was a "per-page simplification" — it is mm7401a1's own
  19–49 row.** The CDC adult schedule notes still print one sentence for both bands; they
  summarise mm7401a1, and where they differ in register the recommendation document governs.

  The owner was shown both readings — follow ACIP's wording, or flatten to 8 weeks for that
  class at every adult age — with the patient count for each, and chose the wording. **Do
  not extend the 8 weeks to 50+, and do not re-flatten it, without a new owner decision.**
  The series is complete once the PPSV23 is given. Single source:
  `adultPpsvRecommendedInterval()` + `adultPpsvShorterMinimumOffered()` in `riskFactors.js`,
  with the age boundary read from `ROUTINE_ADULT_MIN_M`.
- **Two 2026-10-15 plan findings are OBSOLETE, and the app was already right on both.**
  Both came from rr7203a1; the current sources contradict them. Do not "fix" either.
  (a) *PCV13→PPSV23 is 8-week keyed* — no: PCV13 only → PCV20 or PCV21 at **≥1 year**, and
  the job aid prints **"NO OPTION B"** on all four pages, so there is no PPSV23-after-PCV13
  route at any adult age. (b) *cochlear implant / CSF leak are not IC-equivalent for the
  second PPSV23* — no: current guidance groups all three and gives **PCV20/PCV21 at ≥5
  years**, not a second PPSV23.
- **The 19–49 PCV13+PPSV23 row split is a SEPARATE rule** from the interval above, even though
  both name IC / cochlear implant / CSF leak. Cochlear implant, CSF leak or an
  immunocompromising condition → PCV20/PCV21 **≥5 years**; chronic conditions only → no dose
  now, review at 50. One predicate used to serve both and must not again (A-P1-1).
- **CDC's 4-day grace** (added 2026-10-10, S10 — peds audit P1-1). CDC Child and Adult
  Schedule Notes, "Additional Information", both fetched live 2026-10-10:
  > "Vaccine doses administered ≤4 days before the minimum age or interval are considered
  > valid. Doses of any vaccine administered ≥5 days earlier than the minimum age or minimum
  > interval should not be counted as valid and should be repeated as age appropriate."

  Implemented in `logic/intervals.js` (`GRACE_DAYS = 4`) and applied to the minimum-age
  checks in `validate.js`. It is a **validity** rule and deliberately does **not** move the
  scheduler: `earliestNextDate` still shows the real minimum, because CDC's sentence permits
  *counting* a dose given 4 days early, not *advising* one. Reaffirmed as an owner ruling on
  2026-10-24 and extended to the one date that had slipped across the line — the repeat date
  on a rejected dose's chip. See §L's Ruling D entry.
- **Interval arithmetic** (added 2026-10-10, S10 — A-P2-11). Same source, same sentence
  block:
  > "For calculating intervals between doses, 4 weeks = 28 days. Intervals of ≥4 months are
  > determined by calendar months."

  So the 4-week and 8-week minimums are exact day counts (`DAYS.weeks`), and the 1-year and
  5-year gaps are **calendar** months (`addCalendarMonths`, 12 and 60). A rec reports
  whichever unit applies: `minIntervalDays` or `minIntervalMonths`, exactly one non-null.
- **Minimum intervals BETWEEN recorded doses** (added 2026-10-11, S3 — queue P1-0, peds
  audit P1-4/P1-5). Until S3 the validator graded every dose in isolation, so a PCV series
  recorded at 2, 2.5, 3 and 3.5 months counted as a complete 4-dose series. The minimum
  NUMBERS live in `logic/intervals.js`; since S14-7 the RULES that use them live in
  `logic/doseIntervalRules.js`, which the validator reads, and `recommend.js` reads the
  numbers directly for its forward-looking scheduler.

  The validator enforces an interval **only where a source states it as a minimum**, which
  is the paediatric schedule. Three rules, all fetched live 2026-10-11:

  1. **PCV → PCV.** CDC Catch-up Schedule (Table 2), under the column heading *"Minimum
     Interval Between Doses"*:
     > "4 weeks if first dose was administered before the 1st birthday / 8 weeks (as final
     > dose for healthy children) if first dose was administered at the 1st birthday or after"

     and p2016 Table 1's footnote, keyed the same way: *"for children younger than age 12
     months = 4 weeks; for children age 12 months or older = 8 weeks"*. Keyed on the age at
     the **earlier** dose. `pcvSeriesMinIntervalDays()`.
  2. **PCV → PPSV23 = ≥8 weeks**, and never the same visit. CDC Child Notes:
     > "administer 1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after the most recent PCV
     > dose" … "PCV15 and PPSV23 should not be administered during the same visit."
  3. **PPSV23 dose 2 = ≥5 calendar years** after dose 1. CDC Child Notes: *"administer
     either PCV20 or dose 2 PPSV23 at least 5 years after dose 1 PPSV23."*

  **A dose below a minimum is `invalid`, not a new middle verdict** — CDC states the
  consequence itself: such doses "should not be counted as valid and should be repeated as
  age appropriate", and "the repeat dose should be spaced after the invalid dose by the
  recommended minimum interval". That last clause is why an **invalid dose still anchors**
  the next one *in its own stream*: the dose replacing it is measured from it, not from the
  last dose that counted. PCV7 anchors nothing — it is a properly given dose of a superseded
  product, not a mistimed one, and no source states an interval from it.

  **ANCHORING ACROSS the two streams is the opposite, and deliberately so (ANCHOR-1, OWNER
  DECISION 2026-10-11).** A PCV dose measured from a PPSV23 — or a PPSV23 measured from a
  PCV — is measured from a dose **that COUNTED**. A dose that did not count anchors nothing
  in the other stream.

  The two halves are not in tension, because they answer different questions. CDC's
  repeat-dose sentence is about *replacing* a mistimed dose: the replacement is spaced from
  the dose it replaces, which is same-stream by construction. Nothing in it says a dose the
  app has already set aside should start the clock for a *different* vaccine.

  The owner's reasoning, in her words, on the 70-year-old whose second PPSV23 was rejected:
  that dose "is rejected not because it is too soon but because it was unnecessary", and an
  unnecessary dose cannot reset a clock. Her acceptance cases, with a control:

  | History (adult 70) | Before | After |
  |---|---|---|
  | PPSV23 2015 ✓, PPSV23 2018 ✗ (5-yr), PCV20 2018-06 | PCV20 rejected | **PCV20 counts** |
  | PCV13 2010 ✓, PPSV23 2012 ✓, PPSV23 2014 ✗ (5-yr), PCV20 2018 | PCV20 rejected | **PCV20 counts** |
  | PPSV23 2018-01 ✓, PCV20 2018-03 (a real 2-month gap) | PCV20 rejected | **unchanged — still rejected** |

  The third row is the point: only a dose caught behind *someone else's rejected dose* is
  rescued. A dose that was simply given too early after a dose that counted is still
  rejected. The cheaper alternative — downgrading the two adult conjugate-after-PPSV23 rows
  from `floor` to `recommendation` — would have fixed rows 1 and 2 as well, and was
  **declined** because it would also have let row 3 through.

  **Same-day pairs.** When a PCV and a PPSV23 are recorded on the same date, the PCV is
  judged first, so a same-visit PPSV23 is still measured against the PCV15 it was given
  alongside — the co-administration error the rule table is ordered around. The consequence
  runs the other way too: a PCV dose is no longer judged against a PPSV23 given at the same
  visit. For a same-day PCV15 + PPSV23 pair the app now sets aside the **PPSV23** (the dose
  that was early) and counts the PCV15, where it used to do the reverse — discard the
  correct PCV15 and advise restarting the conjugate.

  Implemented as ONE chronological walk over both streams (`validate.js` `analyzeBoth`),
  not as two walks that hand each other lists. Two walks can only get this right one way
  round, because each needs the other's verdicts; one walk in date order has no circularity
  to resolve, since every interval is measured from an EARLIER dose.

  **Rules 1–3 above are the PAEDIATRIC rows, and they are paediatric because the CHILD
  schedule is where CDC states them as minimums.** The adult notes were searched live
  2026-10-11 (positive control: "pneumococcal", 13 hits, so the whole page including its
  collapsed sections was read): they contain **no** "same visit" sentence, **no** "8 weeks
  after the most recent PCV", and **no** "8 weeks after the PCV15 dose". So the paediatric
  wording must never appear on an adult's dose. The adult answers come from their own rows —
  see the next bullet.
- **Every interval rule lives in ONE table** (added 2026-10-11, S14-7 — root cause S14-RC).
  `logic/doseIntervalRules.js` holds them; `validate.js` calls `evaluateDoseInterval()` once
  per dose and owns no interval logic at all.

  **The bug this replaced.** `validate.js` had five functions that each decided whether a
  timing rule may void a dose **from the patient's age, not from what the rule says** —
  `checkPcvInterval`, `checkPpsvAfterPcv`, `checkPpsvRevaccInterval` returned early at
  `ageAtDose >= ADULT_SCHED_MIN_M`, and `adultPcvGapAdvice`, `adultPpsvGapAdvice` returned
  early below it. Below 19 every gap could void a dose; at 19+ none could. **Three adult
  gaps fell in the hole between the two halves and were checked by nothing at all** — the
  worst being a 70-year-old's second PPSV23 two years after the first, which read
  `status: 'valid'`, numbered, with an empty `reasons` array. Silent.

  In the table, the two questions are two separate **fields** on every row:
  `rulebook` (child / adult / any — which schedule states the rule, so which interval and
  which citation apply) and `enforcement` (`'floor'` → a short gap voids the dose and CDC's
  4-day grace applies; `'recommendation'` → the dose counts and carries a note, no grace;
  `'none'` → explicitly never flagged, with the reason written down — with ONE exception to
"no grace", `CHILD-PPSV23-AFTER-PPSV23`, by owner decision 2026-10-30, §C-P2). **No age test decides
  whether a rule may bite.** `CHILD-PPSV23-AFTER-PPSV23` and `ADULT-PPSV23-AFTER-PPSV23`
  read the *same* 5-year constant — proof the old age gate on that rule was pure loss — and
  a test asserts they cannot drift apart.

  #### The rule table — look a patient up

  **REORGANISED 2026-10-25, at the owner's request:** *"I also want to reorganize the
  rulebook to show the acceptable vaccine intervals between doses based on age, risks and
  last pneumococcal dose given. This will be easier to follow than a line list of rules...
  I anticipate more bugs to come up in the future and I need something for me to check back
  on when verifying rules."* It was a flat list keyed on rule id; it is now a lookup keyed
  on the patient, and the rule id has moved to the last column where a clinician never has
  to look at it.

  **"Already on the record" is a column because the rules demand it.** Her three axes were
  age, risk and the last dose. Seven of the twenty-one rules actually split on a FOURTH
  thing — a 55-year-old and a 70-year-old with the same PPSV23 get different gaps because
  one of them also has a PCV13 on file. Leave it out and the table has rows that look
  identical and disagree.

  **Risk is "Any" on fifteen of the twenty-one, and that is the answer, not padding.** Only
  six rules read the risk conditions at all, every one an adult PPSV23-after-PCV13/15 row.
  (Counts re-measured 2026-10-30 from the describers, after the repeat-of-a-rejected-first-PPSV23 row was added and the 5-year row narrowed; the earlier "eighteen / fourteen /
  sixteen / two" had already drifted on main, which had 19 / 5 / 13 / 6.) "Does my
  patient's asplenia change this interval?" is a question the table now answers.

  **This table mirrors `DOSE_INTERVAL_RULES` exactly, and a test
  (`rule-docs-match-code.test.js`, P2-7) holds it there, cell by cell.** Every cell is
  generated by the describer functions in `src/data/rulebook.js` — the same ones the
  in-app "How recommendations are made" page renders from — so the screen, this document
  and the engine cannot say three different things. Nothing below is transcribed by hand.

  "Measured from" names the dose the gap runs from. **The previous dose of the same
  vaccine** includes one that did **not** count (CDC: "the repeat dose should be spaced
  after the invalid dose by the recommended minimum interval", and RULING D), while **the
  most recent X that counted** reads the other stream and skips a dose that was rejected
  (ANCHOR-1, 2026-10-11) — "an unnecessary dose cannot reset a clock".

  The paediatric conjugate row is the one cell that is a grid rather than a number: CDC's
  Catch-up Table 2 keys it on the dose number and on two different ages. All six cells are
  spelled out, probed from the engine's own function.

  | Patient | Risk group | Already on the record | Dose being given | Measured from | Shortest acceptable gap | If it is shorter | Who says so | Rule |
  |---|---|---|---|---|---|---|---|---|
  | Child (under 19 years) | Any | Anything | Any PCV | the previous dose of the same vaccine — including one that did not count | Dose 2, when dose 1 was given before the first birthday: at least 4 weeks; Dose 2, when dose 1 was given at the first birthday or later: at least 8 weeks; Dose 3, given under 12 months, previous dose before 7 months: at least 4 weeks; Dose 3, previous dose at 7–11 months: at least 8 weeks; Dose 4 or later, given under 12 months (an extra infant dose): at least 4 weeks; Dose 4 or later, given at 12 months or over (the booster): at least 8 weeks | Does not count | CDC / ACIP | `CHILD-PCV-AFTER-PCV` |
  | Child (under 19 years) | Any | Anything | Any PCV | the most recent PPSV23 that counted or was an extra dose | at least 8 weeks | Does not count | This app | `CHILD-PCV-AFTER-PPSV23` |
  | Child (under 19 years) | Any | Anything | PPSV23 | the most recent PCV that counted | at least 8 weeks | Does not count | CDC / ACIP | `CHILD-PPSV23-AFTER-PCV` |
  | Child (under 19 years) | Any | Anything | PPSV23 | the previous dose of the same vaccine, when that dose counted | at least 5 years | Immunocompromised: counts, with a note. Otherwise: an extra dose, not counted | CDC / ACIP | `CHILD-PPSV23-AFTER-PPSV23` |
  | Child (under 19 years) | Any | a PPSV23 that counted | PPSV23 | the previous dose of the same vaccine, when that dose did not count | at least 5 years | Does not count | CDC / ACIP | `CHILD-PPSV23-AFTER-INVALID-PPSV23` |
  | Child (under 19 years) | Any | no PPSV23 that counted | PPSV23 | the previous dose of the same vaccine, when that dose did not count | at least 8 weeks | Does not count | CDC / ACIP | `CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST` |
  | Adult (19 years and over) | Any | Anything | Any PCV | the previous dose of the same vaccine — including one that did not count | at least 4 weeks | Counts, with a note | This app | `ADULT-PCV-AFTER-PCV-UNDER-4-WEEKS` |
  | Adult (19 years and over) | Any | PCV13, PPSV23 | PCV20 or PCV21 | the most recent PCV that counted | at least 1 year | Counts, with a note | This app | `ADULT-PCV20-21-1Y-AFTER-PCV` |
  | Adult (19 years and over) | Any | PCV13, PPSV23 | PCV20 or PCV21 | the most recent PPSV23 that counted | at least 5 years | Counts, with a note | CDC / ACIP | `ADULT-PCV20-21-5Y-AFTER-PPSV23` |
  | Adult (19 years and over) | Any | PCV13, no PPSV23 | PCV20 or PCV21 | the most recent PCV13 that counted | at least 1 year | Counts, with a note | CDC / ACIP | `ADULT-PCV20-21-AFTER-PCV13` |
  | Adult (19 years and over) | Any | no PCV of any kind, PPSV23 | PCV15 or PCV20 or PCV21 | the most recent PPSV23 that counted | at least 1 year | Counts, with a note | CDC / ACIP | `ADULT-PCV-AFTER-PPSV23` |
  | Adult (19 years and over) | Any | PCV15 | PCV20 or PCV21 | the most recent PCV15 that counted | none stated | Never flagged | CDC / ACIP | `ADULT-PCV20-21-AFTER-PCV15-NO-INTERVAL` |
  | Adult (19 years and over) | Any | Anything | Any PCV | the previous dose of the same vaccine — including one that did not count | at least 1 year | Counts, with a note | CDC / ACIP | `ADULT-PCV-AFTER-PCV-CATCH-ALL` |
  | Adult (19 years and over) | Immunocompromising condition, cochlear implant or CSF leak | Anything | PPSV23 | the most recent PCV15 that counted | at least 8 weeks | Counts, with a note | CDC / ACIP | `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM` |
  | Adult (19 years and over) | Every other risk group | Anything | PPSV23 | the most recent PCV15 that counted | at least 1 year | Counts, with a note | CDC / ACIP | `ADULT-PPSV23-AFTER-PCV15` |
  | Adult (19 years and over) | Immunocompromising condition, cochlear implant or CSF leak | Anything | PPSV23 | the most recent PCV that counted | at least 8 weeks | Counts, with a note | CDC / ACIP | `ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM` |
  | Adult (19 years and over) | Every other risk group | Anything | PPSV23 | the most recent PCV that counted | at least 1 year | Counts, with a note | CDC / ACIP | `ADULT-PPSV23-AFTER-PCV13` |
  | Adult (19 years and over) | Any | Anything | PPSV23 | the previous dose of the same vaccine — including one that did not count | at least 5 years | Counts, with a note | CDC / ACIP | `ADULT-PPSV23-AFTER-PPSV23` |
  | Adult (19 years and over) | Immunocompromising condition, cochlear implant or CSF leak | Anything | PPSV23 | the most recent PCV15 that counted | at least 1 year | Counts, with a note | CDC / ACIP | `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM-USED` |
  | Adult (19 years and over) | Immunocompromising condition, cochlear implant or CSF leak | Anything | PPSV23 | the most recent PCV15 that counted | none stated | Never flagged | CDC / ACIP | `ADULT-PPSV23-AFTER-PCV15-MEETS-SHORTER-ADVICE` |
  | Adult (19 years and over) | Any | Anything | PPSV23 | the most recent PCV that counted | at least 1 year | Counts, with a note | CDC / ACIP | `ADULT-PPSV23-AFTER-PCV-CATCH-ALL` |

  Reading the table:
  - **Enforcement** — `floor`: a shorter gap means the dose does not count and is owed a
    repeat. `recommendation`: the dose counts, keeps its number, and carries a sentence
    explaining the gap. **A dose may collect more than one such sentence** — since the
    owner's *"mention both gaps"* decision of 2026-10-24 the walk no longer stops at the
    first unmet recommendation, so a patient inside two advised intervals is told about
    both. An unmet **floor** still ends the walk and discards any sentence collected before
    it: every recommendation sentence ends by saying the dose counts, which would read as a
    contradiction printed beside a rejection. `none`: deliberately never flagged, with the reason in the row's
    `source` field. A `none` row states no interval at all, because an interval it never
    reads would read as a live rule to the next person (asserted by P2-7).
  - **Authority** — ⚠️ `OWNER` means an **owner clinical determination dated 2026-10-11**,
    not ACIP's and not CDC's. Every adult floor is one; see the determination below. `CDC`
    appears only on the three paediatric floors, whose sources state the gap as a minimum in
    so many words, and on the rows that void nothing.
    `ADULT-PCV20-21-1Y-AFTER-PCV` is the one row carrying `OWNER` that is **not** a floor:
    it was downgraded on 2026-10-24 (§K-CONJUGATE below) and keeps the owner's name because,
    unlike every other recommendation row, no ACIP or CDC source states its interval **in
    any form** — not as a minimum and not as advice. Its message tells the clinician that
    in words. Never relabel it `CDC` to make the pair of conjugate rows look symmetrical.
  - **Minimum gap** is the gap the rule *enforces*, which for adults is a different question
    from the gap the app *recommends*. The app recommends ≥1 year after a PCV15 for every
    adult (A-P1-1) and merely **names** the 8-week option; the two 8-week rows above judge a
    dose that was *already given* inside that year.

  Rows whose floor CDC states **as a minimum in so many words** (`authority: 'CDC'`): the
  three **paediatric** rows, and only those.

  > ⚠️ **CORRECTED 2026-10-11, same day.** An earlier draft of this section also claimed the
  > adult 8-week PCV15→PPSV23 gap as a CDC-stated floor, on the grounds that "minimum
  > interval" appears in the adult notes. **That was wrong, and it was wrong because the
  > sentence had been transcribed from a handoff file rather than read from the source.**
  > rr7203a1, fetched live:
  >
  > > "A minimum interval of 8 weeks **can be considered** for adults with an
  > > immunocompromising condition, a CSF leak, or a cochlear implant **to minimize the time
  > > of risk** for IPD caused by serotypes unique to PPSV23 in these groups at increased
  > > risk for pneumococcal disease."
  >
  > It is permission to vaccinate **sooner**, not a bar to fall below. rr7203a1's recurring
  > phrase is "**minimum recommended** interval" — the shortest *recommended* spacing for a
  > group — which is a different concept from the General Best Practices "minimum interval"
  > that carries the repeat-the-dose consequence. On the whole page: "should be repeated" 0
  > hits, "not be counted" / "does not count" 0 hits, with "interval" at 64 hits as the
  > positive control. So **every adult floor in this app is the owner's determination**, the
  > 8-week one included, and the app's own per-dose text says so.

- ⚠️ **ADULT INTERVALS AS VALIDITY FLOORS — OWNER CLINICAL DETERMINATION, 2026-10-11.
  Never cite ACIP or CDC for this.** Every `authority: 'OWNER'` row in
  `doseIntervalRules.js` rests on it, and the per-dose explanation the app prints says so in
  words ("an owner clinical determination dated 2026-10-11, not ACIP").

  **The determination:** an interval is an interval. An adult dose given inside one was not
  validly given, does not count, and is owed a repeat — with CDC's 4-day grace. The owner
  was shown all of the evidence below, which disagrees, and reaffirmed. It is recorded
  the way any non-ACIP rule in this app must be: labelled, in the app's own words, as the
  owner's determination rather than a guideline's. (The precedent for that was the Fred
  Hutch post-transplant pathway, labelled institution-specific in UI copy — deleted
  2026-10-16, but the labelling practice is the point and it stands.)

  **What the published sources actually say, all checked live 2026-10-11:**
  - **CDSI v4.64** (CDC's own machine-readable rule set; local copy). Each interval carries
    `minInt` (the recommended gap) and `absMinInt` (the hard floor below which a dose is
    invalid). Where CDC intends a floor it writes `minInt − 4 days` — infant PCV dose 2 is
    `absMinInt = 4 weeks − 4 days`, i.e. **CDC encodes the grace itself**. Series
    *"Pneumococcal 50+ 2-dose PCV13"*: `minInt = 1 year`, `earliestRecInt = 1 year`,
    **`absMinInt = 0 days`**. Same for every adult 5-year interval.
  - **rr7203a1 / mm7336a3 / mm7401a1** (the three current adult MMWRs): "grace" 0 hits;
    "should be repeated" / "does not count" 0 hits. Adult gaps are stated as advice for the
    *next* dose — "1 dose PCV20 or 1 dose PCV21 at least 1 year after the last PCV13 dose".
  - **CDC General Best Practices**: the grace attaches to *minimum* intervals, and Table 3-2
    gives adult PCV none (footnote x defers to ACIP prose).

  **The adult floors, enumerated — never generalised** (owner decision 6). Each is a row id
  in `doseIntervalRules.js`:

  | Dose judged | Measured from | Floor | Row |
  |---|---|---|---|
  | PCV20/PCV21, history has PCV13 **and** PPSV23 | last PCV | ≥1 year | `ADULT-PCV20-21-1Y-AFTER-PCV` |
  | PCV20/PCV21, history has PCV13, no PPSV23 | last PCV13 | ≥1 year | `ADULT-PCV20-21-AFTER-PCV13` |
  | PCV15/20/21, history has PPSV23 only | last PPSV23 | ≥1 year | `ADULT-PCV-AFTER-PPSV23` |
  | PPSV23, IC / cochlear implant / CSF leak | last PCV15 | ≥8 weeks | `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM` |
  | PPSV23, any other adult | last PCV15 | ≥1 year | `ADULT-PPSV23-AFTER-PCV15` |
  | PPSV23, IC / cochlear implant / CSF leak | last PCV13 | ≥8 weeks | `ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM` |
  | PPSV23, any other adult | last PCV13 | ≥1 year | `ADULT-PPSV23-AFTER-PCV13` |
  | A second PPSV23 | previous PPSV23 | ≥5 years | `ADULT-PPSV23-AFTER-PPSV23` |

  ### OWNER RULING F (2026-10-24) — one row left that table

  **`ADULT-PCV20-21-5Y-AFTER-PPSV23` is no longer a floor.** An adult PCV20 or PCV21 given
  sooner than 5 years after a PPSV23 now **counts**, carries a timing note, and the series
  reads complete. This **reverses the owner's own determination of 2026-10-11 for that row
  only** — every other adult floor above is unchanged.

  Shown a 70-year-old with no risk factors (PCV13 2016-10-13, PPSV23 2021-10-13, PCV20
  2025-10-10), whose card read *"PCV20 or PCV21 … due TODAY"*, she ruled:
  > "Nothing further is due if they are healthy, with chronic conditions, or
  > immunocompromised. Once an adult has received PCV20, ACIP recommends no additional
  > pneumococcal doses… The only issue is timing. If the doses were given about 4 years
  > apart… the PCV20 came before the recommended ≥5 years after the PPSV23. ACIP describes
  > that as recommended timing and does not say an earlier dose is invalid or must be
  > repeated."

  **The row's authority changed with its enforcement, and that is the point.** While it was
  a floor it asserted something no source states — that an early dose stops counting — so it
  had to carry `authority: 'OWNER'`. As a recommendation it asserts only CDC's own advised
  interval, so it reads `authority: 'CDC'`, like every other recommendation row in the
  table. Ruling F **removed** an owner-invented bar; it did not add an owner-invented
  recommendation.

  **⚠️ The row order in `doseIntervalRules.js` moved, and it is load-bearing.**
  `evaluateDoseInterval` returns on the **first unmet row of either kind**. With the 5-year
  recommendation still sitting ahead of `ADULT-PCV20-21-1Y-AFTER-PCV`, a dose missing *both*
  gaps would have been handed the note and the 1-year floor would never have run. The floor
  is therefore ordered first. Such a dose is still rejected; it is now told about the
  1-year gap rather than the 5-year one. Guard:
  `regression-ruling-f-2026-10-24-early-conjugate-counts.test.js`.

  **⚠️ An open question over the row that remains.** Reasoning about a *different* patient
  that same day, the owner said an adult conjugate-to-conjugate interval *"exists in no
  document"* — which is in tension with `ADULT-PCV20-21-1Y-AFTER-PCV` existing at all. She
  was asked and chose to **leave it unchanged for now**: raised, not decided.

  The two **PCV13→PPSV23** rows were added 2026-10-11, on the owner's instruction that this
  pair gets no exception. Their interval is rr7203a1's, verified live that day:
  > "When PPSV23 is used instead of PCV20, the minimum recommended interval between PCV13
  > and PPSV23 administration is ≥8 weeks for adults with an immunocompromising condition, a
  > CSF leak, or a cochlear implant and ≥1 year for adults without these conditions."

  They carry `anchorMustBeProduct: 'PCV13'`, so they apply only while PCV13 really is the
  patient's most recent conjugate dose — "previously received PCV13" stops describing
  someone once a PCV15 is also on the record, and the PCV15 rows then govern.

  Two keying decisions inside that table, both deliberate:
  - **CDC's prior-vaccine rows are selected from the HISTORY's products, never from risk
    class.** Whether a second PPSV23 was *indicated* is the recommendation engine's
    question; the validator only judges the timing of a dose that was given. Keying the
    5-year floor on the risk row is what left it unchecked for adults in the first place.
  - **`adultPpsvShorterMinimumApplies()` is used for the INTERVAL only** — which floor an
    adult's PPSV23-after-PCV15 is judged against — and never to pick a CDC recommendation
    row. That coupling is what A-P1-1 broke apart and it must not come back.

  **Deliberately never flagged**, as its own `enforcement: 'none'` row so a reader can tell
  a decision from an oversight: **PCV20/PCV21 after an adult PCV15** (the "PPSV23 not
  available" substitute path) — CDC states no interval for that substitution, and inventing
  one would claim more than the source does.

  **A-P1-1 is untouched.** ≥1 year remains what the app **recommends** after a PCV15 at
  every adult age, and the 8-week option is still **named** rather than substituted. S14-7
  changes only what happens to a dose that was *already given* inside the interval.
- **Adult gaps that are still a note, not a floor** (amended 2026-10-11, S14-7). Two rows
  keep `earlyAdvisory: true` on a `status: 'valid'` result — the dose **counts**, carries a
  sentence, and keeps its `effectiveDoseNum`. **It is a flag, never a status**; nothing that
  counts doses may mistake it for a dropped one. No 4-day grace, deliberately: the grace is
  CDC's rule for whether a dose that missed a *minimum* still counts, and nothing is being
  voided here, so a day short of the year is a day short.

  1. `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM-USED` — an adult **aged 50+** with an
     immunocompromising condition, cochlear implant or CSF leak who used the 8-week option
     instead of waiting the recommended year. The dose met the minimum CDC names for them,
     so it counts; the note states that, which is information rather than second-guessing.

     **S15 (2026-10-16) added `shorterIsTheAdvice: false` to this row, and a sibling for the
     other age band.** At **19–49** the 8 weeks is the *recommendation*, so a dose at or past
     it has met the advice in full and there is nothing to report — that is
     `ADULT-PPSV23-AFTER-PCV15-MEETS-SHORTER-ADVICE`, `enforcement: 'none'`, which states no
     interval and takes no grace. Before the split, a 30-year-old with HIV whose PPSV23 came
     at 10 weeks was told "CDC recommends PPSV23 at least 1 year after PCV15" beside a card
     reading "≥8 weeks" — the A-P1-1 self-contradiction, one surface along, and exactly what
     the comment in `evaluateDoseInterval()` warns about. **The floor is untouched**: a dose
     under 8 weeks is still voided by `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM`, whose own
     message now states the year or the 8 weeks according to the patient instead of
     hardcoding "the recommended interval is 1 year".
  2. `ADULT-PCV-AFTER-PCV-CATCH-ALL` and `ADULT-PPSV23-AFTER-PCV-CATCH-ALL` — any adult pair
     the enumerated rows do not name (PCV13→PCV15, or a PPSV23 after a PCV20). Keyed on
     ≥1 year, the *shortest* adult gap CDC states, so they under-flag rather than over-flag.
     They exist so that "enumerate, never generalise" cannot turn into silence — which was
     the S14-7 root cause.

     **A catch-all may never speak for a pair an enumerated row already named**
     (`catchAll: true`, checked by the evaluator). A catch-all is risk-blind by design — it
     quotes one flat interval — so letting it talk over a specific rule reproduces the
     A-P1-1 mistake one rule along. It did: an immunocompromised adult whose PPSV23 came 10
     weeks after PCV13 had **met** the 8-week interval rr7203a1 states for them, and was
     told "CDC advises at least 1 year" by a row that cannot see risk class. A dose whose
     own rule named it and was satisfied — including one that passed on the 4-day grace —
     now says nothing at all.

  **S14-2 (owner decision 2026-10-11): the chip no longer carries this distinction in a
  word.** Every recorded dose's chip reads **"Dose N of M"** (or "Dose N" when the card
  tracks no total) regardless of timing; the advisory sentence appears in the dose's own
  explanation text, so the information has moved off the chip rather than been lost.
- **An ADULT PCV dose recorded after the series was already complete by product is an
  extra dose, not a mistimed one** (added 2026-10-11, S14-4). An adult series containing
  PCV20 or PCV21 is complete — the engine's own "already complete by product" check
  (`pcvAdult`) says so (`adultPcv20or21Complete`). Before S14-4, `validate.js` had no
  matching per-dose rule: a PCV21
  given after a completing PCV20 was graded purely on the gap since the previous dose, so
  a 70-year-old's PCV21 five weeks after PCV20 read "given less than a year after the
  previous dose ... this dose still counts" — an advisory for a dose no recommendation
  ever asked for. Such a dose now reads `extraDose: true`, `effectiveDoseNum: null`,
  excluded from the effective count — validly administered, but it does not extend the
  series. Mirrors MeningoVax's own "extra dose" shape (`doseChipLabel.js`); an undated
  extra dose asks rather than asserts (`extraDoseUnverified`), because the app cannot
  place an undated row in time.

  **ADULTS ONLY, deliberately** (`ADULT_SCHED_MIN_M`, not the PCV21 product gate — ages
  18–18.99y route through the paediatric rulebook, see scheduleConstants.js). For a CHILD,
  `completesSeries` on a product means "no PPSV23 follow-up needed," not "no more PCV
  doses of any kind" — a PCV20 given as infant dose 2 of 4 still leaves the 12–15mo
  booster due, and an at-risk child's series only completes alongside other conditions
  `pcvRiskChild` checks (age band, catch-up dose count), never from the product alone.
  Generalising this rule to children was exactly the mistake the S14-RC root-cause review
  (docs/archive/) found and warned against repeating.
- **The same rule for an ADULT PPSV23 dose** (added 2026-10-12, S14-4B). S14-4 taught the
  walk about an extra **PCV** dose and stopped there: `stepStream`'s branch opened with
  `vaccine === 'PCV'`, so the mirror-image record said nothing. An adult's PPSV23 dated
  after a counting PCV20 or PCV21 was labelled **"series dose 1"** with no comment, which
  read **identically** to a PPSV23 that had actually *completed* a PCV15 series — the app
  could not tell a clinician apart a dose that finished the job from one that added
  nothing. Where an interval row did speak, it was worse than silence: 300 of the sweep's
  16,250 patients were told *"CDC advises at least 1 year between a conjugate dose and
  PPSV23. This dose still counts"* about a dose no recommendation had ever asked for —
  the A-P1-1 mistake one rule along.

  **No new clinical rule.** The premise is §H's, already cited: an adult series containing
  PCV20 or PCV21 is complete — `pcvAdult`'s complete-by-product branch says in so many
  words "no PPSV23 and no further PCV needed" (`adultPcv20or21Complete`), which is exactly
  what `completesSeries` has always meant in `brands.js`. **Owner decision 2026-10-12:**
  mirror the PCV sentence exactly — stop numbering such a dose as a series dose, and print
  the same sentence. Moved 648 of 16,250 sweep verdicts (348 formerly silent, 300 formerly
  carrying the 1-year advisory); no recommendation and no PCV-stream verdict changed.

  **One deliberate limit, narrower than the PCV side** (the second, "strictly earlier",
  was lifted by S14-4C below):
  1. **No undated mirror.** The PCV side asks rather than asserts when a dose has no date
     (`extraDoseUnverified`). That is not carried over: an undated PPSV23 alongside a
     PCV20 is overwhelmingly an old dose whose date was forgotten and which was given
     *before* the conjugate — the opposite of an extra dose — so the question would be
     wrong more often than right.

  **ADULTS ONLY**, for S14-4's reasons, and measured at the dose: 117 sweep patients whose
  PPSV23 fell before their 19th birthday correctly did not move. A PCV20/PCV21 that is
  itself **invalid** completes nothing (12 more non-moves) — a gap is measured from the
  dose that counted (ANCHOR-1).
- **A dose given at the SAME VISIT as the completing dose** (added 2026-10-12, S14-4C).
  S14-4B's "strictly earlier" limit protected the *sentence* and abandoned the *verdict*.
  A same-day PCV20 + PPSV23 fell through to `ADULT-PPSV23-AFTER-PCV-CATCH-ALL` and read
  *"CDC advises at least 1 year between a conjugate dose and PPSV23. This dose still
  counts"* — which tells a clinician to fix a spacing problem that is not the problem,
  because **no PPSV23 follows a PCV20 or PCV21 at any interval**. 144 of 16,250 patients.

  It was also an **asymmetry, not a principle.** The PCV arm of the same branch reads
  `kept`, which by walk order already holds a same-day completing dose (ANCHOR-1's
  tie-break steps PCV before PPSV23 on equal dates), so a PCV21 recorded the same day as a
  PCV20 was **already** an extra dose — and was already saying "after" about two doses
  carrying one date, the exact falseness the PPSV23 limit existed to avoid.

  **Owner decision 2026-10-12:** fix both surfaces together — chip *and* sentence. A
  same-day dose joins the same extra-dose class a dose one day later already gets (one day
  cannot move a verdict from "Dose 1 of 1" to "Extra dose"), and gets a **second
  sentence** rather than the "after" one: *"Given at the same visit as the PCV20 (Prevnar
  20) dose, which completes the adult series on its own: no PPSV23 was needed, and this
  dose does not add to the series."* Both sentences live in one place
  (`validate.js`, `extraDoseSentence`) because both streams print them.

  **The bound that makes it safe.** A PPSV23 that an **earlier** PCV15 already owed
  (`requiresPPSV23`) is the dose that *completes* that series. When a PCV20 and that
  PPSV23 land at one visit, either one finishes the job and which to call surplus is
  arbitrary — so the app calls neither and counts both, as it did before. Only the
  same-day case needs the guard: once the completing conjugate is strictly earlier, the
  series really was finished before this PPSV23, whatever an older PCV15 once owed.
  Without the guard the naive fix relabels a legitimately owed PPSV23 "not needed", which
  is a clinical error rather than a wording one.

  **Measured, not assumed.** 144 moved in exactly 4 history shapes, every one an adult
  PPSV23 dated the same day as a PCV20/PCV21; 0 recommendations and 0 PCV-stream verdicts
  changed; 0 cases added or removed. The transition is uniform: the rule id and the series
  number go, `earlyAdvisory` clears, `status` stays `valid`.
- **What `ADULT-PPSV23-AFTER-PCV-CATCH-ALL` is actually for** (corrected 2026-10-12,
  S14-4C). S14-4B's note above claimed the same-day pair was the "**only**" pair that row
  could still speak for. That was wrong, and S14-4C measured it: **324** of the 16,250
  grid patients reach the row, in 9 history shapes, of which the completing-product
  same-day pair is **144** (4 shapes). The other **180** (5 shapes) are anchored on a PCV
  dose whose **product the clinician could not name** — the "Unknown PCV product" option
  on the history step. No product-keyed row can select on an unnamed product, so no
  enumerated row will *ever* name those pairs, and the generic ≥1-year sentence is the
  right thing to say about them. That — not the same-day pair — is the row's standing job,
  and it is why the row stays. `regression-s14-7-one-rule-table.test.js` now anchors its
  catch-all assertion there, having been moved off a completing-product pair twice.
- **Age at a recorded dose** (added 2026-10-10, S10 — P3-1/P3-3). Measured from the
  patient's date of birth when one was entered (`patientAge.ageAtDoseMonths`), so a dose on
  a birthday lands on an exact whole number of months. Patients entered as Years/Months keep
  an approximation, because the app does not know their birthday.
- **A dose dated before the date of birth is refused as impossible**, with a message naming
  that rather than "below the minimum age" (P3-6).
- **An age no living person can have is refused** (added 2026-10-10, S10b — P3-8). This is a
  **plausibility bound, not a clinical rule** — no ACIP/CDC guidance turns on it, and no
  source is cited for it. 120 whole years is the bound the Years box already advertised
  (`MAX_PLAUSIBLE_AGE_YEARS`); the whole of the 120th year is allowed and the first age
  refused is 121, because refusing a real patient is the worse error. Both entry modes ask
  one module, `logic/ageEntry.js`, so the two doors cannot drift. It matters clinically only
  in what it prevents: a birth year typed as `0026` instead of `2026` used to be accepted
  silently and produced a routine **adult** recommendation for an infant.
- **A young infant's age in weeks is counted from the birthday** (added 2026-10-10, S10b —
  P3-5), via `fmtAgeMonths(am, { exactDays })` → `Math.floor(exactDays / 7)`. Deriving weeks
  from the age in months (`× 4.348`) double-averages, and PCV's minimum age is stated in
  weeks (6 weeks = `PCV_MIN_AGE_DAYS` 42): a dose at exactly 42 days printed "5 weeks" for
  181 of 400 birth dates, beside the 6-week rule it satisfied. The band is still chosen from
  the age in months, so this changes the number of weeks and never the unit; a patient
  entered as Years/Months has no birthday and keeps the approximation. Applies on all three
  surfaces that print an infant age — `StepAge`, `Results`, `RecCard`.

### §K-INFANTFLOORS — The infant floors are 38 / 66 / 94 for a routinely-vaccinated child (2026-10-26)

**P5 of the owner's children's table**: doses 1–3 are invalid before **38 / 66 / 94 days**.
The previous handoff marked the row *"already correct, no work needed — 38+28+28 = 94
exactly. Zero slack, so it deserves a guard."* **The conclusion is right and the arithmetic
is not**, which measuring the engine shows:

| | dose 1 | dose 2 | dose 3 |
|---|---|---|---|
| Her row: invalid before | 38 | 66 | 94 |
| App, prior doses at the **routine** ages (42 / 70) | **38** ✓ | **66** ✓ | **94** ✓ |
| App, each prior dose at **its own earliest** | **38** | **62** | **86** |

The app does not add 28. For a dose **already given** it adds 28 − 4, because the grace
applies to the interval as well as to the age — so the chain from each dose's own earliest
is 38 + 24 + 24 = **86**, eight days under her row.

**That is not a defect.** CDC, General Best Practices, *Timing and Spacing of
Immunobiologics*, fetched live 2026-10-26:

> *"grace period", vaccine doses administered ≤4 days before the minimum interval or age
> are considered valid.*

**"the minimum interval OR age"** — each minimum gets the grace, independently. The page's
DTaP-4 footnote applies it to both at once for a single dose (the minimum age of 15 months
**and** the minimum interval between DTaP-3 and DTaP-4), and nothing on the page bars a dose
validated by the grace from anchoring the next interval; CDC measures the next interval from
the dose the patient **got**, which is the sentence Ruling D rests on (§L).

So **both readings are right about different children**. Her 38 / 66 / 94 describes a child
vaccinated on the routine schedule, and the app matches it exactly there. A child whose
earlier doses were themselves four days early is a different child, and her floors move with
her doses.

**No code changed.** The floors are a composition of three constants — `PCV_MIN_AGE_DAYS`
42, `PCV_MIN_INTERVAL_DAYS_UNDER_12M` 28, `GRACE_DAYS` 4 — and nothing asserted the result,
so changing any one of them moved every floor in silence. The guard pins the day numbers a
clinician actually sees, **both chains**, and states the shortfall as arithmetic (one grace
per earlier interval) rather than as three magic numbers. Proved load-bearing: grace 4 → 0
fails **52** tests, minimum age 42 → 41 fails **9**, interval 28 → 27 fails **28**, each
including this guard.

Guard: `regression-2026-10-26-infant-dose-floors-38-66-94.test.js`.

### §K-INVALID — What an invalid ADULT dose leaves owing, and when (OWNER, 2026-10-24)

**OWNER CLINICAL DETERMINATION dated 2026-10-24.** Never cite ACIP or CDC for the
combination below. Her own framing: *"ACIP's tables are built on valid history, so they
time the conjugate from the PPSV23. They do not address what to do after an invalid
conjugate."* Full readings, counts and the alternatives she declined:
`docs/archive/decision-2026-10-24-invalid-adult-dose-repeat-rule.md`.

**Her four steps, verbatim:**

1. *"Decide what is being repeated. Base this on the valid history."*
2. *"Start the clock at the invalid dose. Under CDC's rule, every interval runs from the
   most recent dose given, valid or not."*
3. *"Use the interval for the prior vaccine type, counted from that invalid dose."*
4. *"Check the earlier valid doses too... In practice, use whichever date comes later."*

**What is owed: 1 dose of PCV20 or PCV21.** Never a repeat PPSV23 — *"ACIP's only
PPSV23 → PPSV23 interval is ≥5 years"*, and *"repeating polysaccharide doses less than 5
years apart is linked to hyporesponsiveness"*. Never PCV15 — *"PCV15 adds nothing over the
patient's prior dose"*. Constant: `ADULT_OWED_AFTER_INVALID_DOSE`.

**The interval, for both clocks — one year, every adult risk group.** Asked whether the
shorter interval should apply to an immunocompromised adult here she answered *"can you use
1 year for adults and 8 weeks for pediatrics with risks?"*, so the adult clock does not vary
by risk class and children are not routed through it at all.

| The clock is anchored on | Interval to the owed conjugate | Standing of that number |
|---|---|---|
| a **PPSV23** | ≥1 year | **STATED.** CDC adult notes: *"1 dose PCV15 or 1 dose PCV20 or 1 dose PCV21 at least 1 year after the last PPSV23 dose."* Every risk group; CDSi v4.64 gives 1 year here even in its immunocompromised series. |
| a **conjugate** | ≥1 year | **INTERPRETED.** CDC states exactly one adult conjugate-to-conjugate interval — *"1 dose PCV20 or 1 dose PCV21 at least 1 year after the last PCV13 dose"* — and this applies it to a conjugate that must be REPEATED, which CDC does not discuss. |

Both read live 2026-10-24 from
`https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo`, as was the
rule that invalidates the dose in the first place: *"Doses of any vaccine administered ≥5
days earlier than the minimum age or minimum interval should not be counted as valid and
should be repeated."*

**NOT 8 WEEKS, and the reason is recorded.** A flat 8-week second clock was built first and
she declined it. The only 8-week conjugate-to-conjugate figure is paediatric — CDC's
**catch-up** schedule, whose own scope line reads *"Children age 4 months through 6
years"* — and CDSi v4.64 carries `absMinInt = 8 weeks − 4 days` there against
`absMinInt = 0 days` on **all 39** adult pneumococcal intervals. Her ground for the year:
*"Conservative should mean meeting every published interval, not waiting the longest."*

**The card must say which number is which** (her instruction, verbatim): *"make it clear
that the 8 week interval is pediatric data with nothing clarifying adults. Cite the
reference. State using 1 year is an interpretation from ACIP minimum interval for adults
between PCV13 and the next conjugate. Cite this too."* The clause is emphasised, and the
paediatric table is named in prose rather than given a numbered citation — a number asserts
"this document states my claim", and the claim is partly about what no adult document says.

**Step 4 is inert today, deliberately kept, and guarded as unreachable.** Both legs carry a
year and the invalid dose is always on or after the last valid dose, so the invalid-dose
clock always wins: measured, 0 of 10,349 adult invalid doses across both grids. Per
CLAUDE.md a branch nothing can execute cannot be tested, so the unreachability is the
assertion.

**Two families are deliberately OUT of this rule.**

- **A mistimed second PPSV23** keeps its 5-year date — *"PPSV23 to PPSV23 spacing should be
  5 years"* — and gains her emphasised alternative instead: *"bold the alternative option
  that a PCV20/21 could be considered 1 year later and summarize the following reasoning
  and citation: A repeat PPSV23 should wait ≥5 years after the early PPSV23, because ACIP
  requires ≥5 years between PPSV23 doses. PCV20 or PCV21 can be given ≥1 year after it,
  because ACIP schedules any conjugate ≥1 year after the last PPSV23."* Applying the general
  rule there would have moved 66 corpus rows FOUR YEARS earlier.
- **Every adult family except FIVE keeps the recommendation card it had.** The card follows
  the invalid dose only for `ADULT-PCV-AFTER-PPSV23`, `ADULT-PPSV23-AFTER-PCV15`,
  `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM` (2026-10-24) and the two PCV13 rows added
  2026-10-25 below. Fired for every adult floor it moved 667 of 17,016 verdicts and
  overrode cards reasoning from a richer history: an immunocompromised adult with PCV13 +
  two PPSV23 doses lost her mm7401a1 "review again at age 50" card altogether. That patient
  is still out — her last dose is a second PPSV23, `ADULT-PPSV23-AFTER-PPSV23`.

#### The two PCV13 families, added by the owner 2026-10-25

`ADULT-PPSV23-AFTER-PCV13` (402 patients) stood here as **flagged, not taken** until she
took it. Shown two 60-year-olds alike but for one product — PCV13 against PCV15 on
2026-07-19, each followed by a PPSV23 on 2026-10-11 — she ruled *"yes A is treated the same
as B."* The PCV15 patient's two surfaces had agreed since 2026-10-24; the PCV13 patient's
card said 2027-07-19 against her own chip's 2027-10-11, and **200 of the 402 were being
shown two different dates**. Nothing separates them: rr7203a1 states both halves in one
sentence, and §K already recorded the two rows as having the same two-tier shape for the
same reason. `ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM` (210, the 8-week class) came with
it.

**WHICH CLOCK — she was asked and chose the later one.** Confirming the second family she
asked back *"to confirm is the recommendation PCV20/21 may be given at least 1 year after
the last PCV?"*, which names one clock and the earlier one. Shown a 40-year-old with
asplenia (PCV13 2026-08-30, PPSV23 2026-10-11) scored three ways — 2027-08-30 from the
PCV13, 2027-10-11 from the PPSV23 that did not count, 2027-10-11 taking the later — she
answered *"i am thinking it is third row. i want the rationale to be explained and cited
when its recommended."* Both ACIP intervals have to be satisfied, so the conjugate waits for
whichever runs out last; this is step 4 of her own four steps above, no longer inert for
these families.

**mm7401a1's "PCV13 only" row is CITED ON THESE CARDS, for the disposition and never for
the date.** With the PPSV23 set aside the counting history is a PCV13 and nothing else, so
the row — *"A single dose of PCV21 or PCV20 ≥1 year after the PCV13 dose"* (one word
different in the 19–49 immunocompromising block) — states her disposition outright. Its
year runs from the PCV13 and the card's date is later, so the claim gets its own sentence
saying so. **Omitting it was the first draft's defect**: extending the card took mm7401a1
off **212 cards it speaks for** (3,795 → 3,583), FINDING F's mirror on this card for the
third time, caught by the three C8 guards. The job aid stays off — it says nothing about
repeating a dose.

Measured 2026-10-25: **212 cards changed wording** (0 added, 0 removed over 35,280 rendered
lines), of which **179 of 17,016 moved a verdict** and 33 changed wording only — those 33
are patients whose repeat date has already passed, so the card said "now" before and after.
**0 of 18,264** record-problem rows moved.

**A repaired series gets no repeat card**, per her proviso of 2026-10-23: *"if a later dose
given helps correct the mistake in giving a vaccine early, this should be noted and marked
as complete if appropriate."* Only an invalid dose that is the LAST dose on the record
leaves anything owing.

Guards: `regression-2026-10-24-invalid-adult-dose-owes-a-conjugate.test.js`,
`regression-2026-10-24-card-and-chip-agree-after-an-invalid-dose.test.js` (its per-family
pin is now 400, was 188) and
`regression-2026-10-25-pcv13-families-follow-the-invalid-dose.test.js`.

---

### §K-CONJUGATE — One adult conjugate soon after another is ADVICE, not a floor (OWNER, 2026-10-24)

**The decision.** The last two adult rows asserting that a conjugate given sooner than a
year after another conjugate **does not count** were downgraded to recommendations:
`ADULT-PCV20-21-AFTER-PCV13` and `ADULT-PCV20-21-1Y-AFTER-PCV`. The dose now counts and the
card explains the timing.

**Why.** Both were owner clinical determinations of 2026-10-11, not minimums any source
states — §K's determination below says so in capitals, and CDSI v4.64 sets
`absMinInt = 0 days` for every adult pneumococcal interval. Reasoning about a different
patient on 2026-10-24 the owner had already said an adult conjugate-to-conjugate interval
*"exists in no document"*, and the rows were left standing as raised-not-decided. They were
put to her again with two patients, each scored both ways through the real engine:

| Patient | History | Before | After |
|---|---|---|---|
| 68 y, chronic heart disease | PCV13 2026-02-10, PCV20 2026-09-10 | PCV20 thrown out; return 2027-09-10 | PCV20 counts; series complete |
| 70 y, no risk conditions | PPSV23 2018-06-01, PCV13 2026-01-15, PCV20 2026-08-15 | PCV20 thrown out; return 2027-08-15 | PCV20 counts; series complete |

She chose to relax both, with a wording instruction: *"make the wording more clinical and
nuanced since this is clinically likely ok but data free. Also bold it."*

**The wording was then revised twice more the same day, reading the result on screen.**
First: *"the bolded and nonbolded text on the card — meningovax has an abbreviated
explanation that you can expand. Do that here while also tailoring the language to sound
more clinical yet succinct."* So a recommendation's `message` may return
`{ reason, why }` — one short clinical line on the dose chip, the rationale behind a
"Why this" disclosure, the shape MeningoVax's rec notes have used since P6-4. The
disposition is what carries the `**...**` emphasis, because it is what a clinician reads
first. Second, shown patient C: *"the 5 years isn't being met right?"* — and it was not,
2 years 2 months against an advised 5. **Every chip line now states the SHORTFALL, not
just the interval** ("— shorter than the 5 years ACIP advises"); a note that recites a
rule and leaves the reader to do the subtraction is not a clinical note. Both halves are
guarded, because a split that silently dropped the rationale would pass a test that only
read the chip.

**⚠️ The two rows do not share an authority.** `ADULT-PCV20-21-AFTER-PCV13`'s year is CDC's
own sentence — *"Previously received only PCV13: 1 dose PCV20 or 1 dose PCV21 at least 1
year after the last PCV13 dose"* — so as a recommendation it carries `authority: 'CDC'`,
the same relabelling Ruling F performed on `ADULT-PCV20-21-5Y-AFTER-PPSV23` and for the same
reason: what was removed was an owner-invented **bar**, leaving CDC's advice behind.
`ADULT-PCV20-21-1Y-AFTER-PCV` has no such sentence in any source. It keeps
`authority: 'OWNER'` and its message tells the clinician, in words, that the interval is the
app's own convention. Never relabel it to make the pair look symmetrical.

**⚠️ Measured blast radius: 0 of 35,280.** Neither corpus can build a patient either row
touches — the two above were typed by hand. "0 in the grid" is not "0 in a clinic"; the
sweeps simply cannot see this change, which is why the guard holds named patients rather
than a count.

**And the walk changed with it.** Asked about a third patient — 70 y, PPSV23 2024-06-01,
PCV13 2026-01-15, PCV20 2026-08-15 — who is inside the 1-year conjugate gap **and** inside
the 5-year gap after her PPSV23, and who was being told only about the first, the owner
chose *"mention both gaps"*. `evaluateDoseInterval` now collects unmet recommendations and
keeps walking instead of returning at the first. An unmet **floor** still returns at once
and discards anything collected before it — every recommendation sentence ends by saying
the dose counts, which would contradict a rejection printed beside it.

Guard: `regression-2026-10-24-conjugate-gaps-are-advice-not-floors.test.js`.

### §K-PCV20CHILD2023 — ACIP's 2023 PCV20-in-children report on the cards (OWNER, 2026-10-25)

**The document.** *Use of 20-Valent Pneumococcal Conjugate Vaccine Among U.S. Children:
Updated Recommendations of the Advisory Committee on Immunization Practices — United
States, 2023*, CDC/ACIP, Supplementary Report to MMWR 72(39), stacks date 2023-09-22, 19
pages. **Table 1 is on page 10.** Downloaded and read live 2026-10-25 (477.11 KB):
`https://stacks.cdc.gov/view/cdc/133252/cdc_133252_DS1.pdf`.

**⚠️ THE MMWR PAGE IS NOT THIS DOCUMENT.** `cdc.gov/mmwr/volumes/72/wr/mm7239a5.htm`
(the pre-existing `mmwr7239a5` entry) is a ONE-PARAGRAPH NOTICE, fetched live the same day:
it records that ACIP voted on 22 June 2023 and points at the Supplementary Report. It
contains no table and no recommendation text. Both entries are kept and they are different
documents; **never cite the notice for a Table 1 row.**

**Table 1's row, verbatim.** Heading: *"Children aged 2–18 years with any risk condition
who completed a recommended PCV series before age 6 years"*. It then splits:

| | Table 1 says | Where it goes |
|---|---|---|
| **Completed series includes ≥1 dose of PCV20** | *"No additional doses of any pneumococcal vaccine are indicated."* | the "PCV complete (includes PCV20)" card — **replacing immunize.org p2016**, 56 cards |
| **Completed series using PCV13 or PCV15 (no PCV20)** | *"Either a single dose of PCV20 or PPSV23 using previously recommended dosing and schedules is recommended to complete the recommended vaccine series."* | the Option A and Option B cards — **added** beside CDC's child notes, 432 cards |

**The swap is a RANKING, not a removal for silence — so it is not FINDING F.** p2016 Table 4
has a fitting row and it was re-read live the same day: *"Completed PCV series before age 6
years, including one or more doses of PCV20 | No additional doses"*. Both documents state
the claim; the owner's standing rule of 2026-10-23 prefers CDC where both speak, which is
the same disposition she gave the 840 at/after-6 cards.

**⚠️ THE SWAP IS SCOPED, AND THE SCOPE IS THE PPSV23.** Only the **56** cards where no
PPSV23 counts lose p2016. The **40** sibling cards where one HAS been given keep it — her
decision of 2026-10-23, which turns on CDC's child-notes branch being headed *"but have not
received PPSV23"* where p2016's row carries no such condition. 56 + 40 = the 96 that
`regression-finding-j-...` previously pinned as one bucket; it now pins both halves
separately. The p2016 footprint moves **3,459 → 3,403**.

**⚠️ TABLE 1 STATES NO INTERVAL.** Half B offers the choice and says nothing about 8 weeks
— that number is CDC's child notes' and p2016's. Its marker therefore sits on **its own
sentence** ("Either a single dose of PCV20 or a PPSV23 completes the recommended series"),
never on the clause carrying the interval, which would give one sentence two numbers for
two claims. Likewise the IC card's "≥5 years later" clause belongs to `pedsSecondPpsv5y`;
Table 1 is silent on it.

**Both quotes are verbatim and contiguous bullets**, not a bullet joined to its heading
(FINDING K) — the heading's conditions live in each entry's `label`. Both declare
`population: ['child-nonIC','child-IC']`, which is transcription: the row is headed "any
risk condition" and the report's footnote lists both classes in one list.

### §K-PPSV23THENPCV — A child's conjugate soon after a PPSV23 DOES NOT COUNT (OWNER, 2026-10-25)

**⚠ THIS SECTION REVERSED ON THE DAY IT WAS WRITTEN, AND BOTH RULINGS ARE THE OWNER'S.**
It shipped in `a66219a` as *"the dose COUNTS, and the card offers the repeat"*, on her
morning answer: *"I think this a grey zone where it could be considered complete but an
alternative suggest should be listed that allows a clinician to repeat the dose 8 weeks
after the early PCV20 if conservative due to lack of direct CDC/ACIP guidance."* She was
then asked directly — **"Child's PCV <52 days after a PPSV23 — count (this morning's
ruling) or repeat?"** — and answered **"Repeat — her table wins."** Her interval table gives
the row the basis **"ACIP rule"** plus the **2014 *Vaccine*** report on a blunted conjugate
response after PPSV23. The repeat is what is built. Do not re-raise it.

**The gap it was built for.** The app had **no rule at all** for a conjugate given after a
PPSV23 in a child. An 8-year-old with asplenia, PPSV23 on 1 Oct and PCV20 on 15 Oct, was
accepted in **total silence** — no note, no number, nothing — on a screen whose other card
quoted an 8-week interval. It was found from the advice side (§C-PPSV23ANCHOR).

**The interval is ACIP's.** *Use of 20-Valent Pneumococcal Conjugate Vaccine Among U.S.
Children*, 22 September 2023, under *"Children 6–18 years with any risk condition with no
previous PCV13, PCV15, or PCV20 vaccination"*:

> *"a single dose of PCV15 or PCV20 is recommended **≥8 weeks after the most recent dose of
> pneumococcal vaccination, regardless of whether the child has previously received PPSV23**,
> even if PCV7 was received."*

Table 1 states it again; CDC's Child & Adolescent Schedule Notes say the same for the
younger band (*"Less than 3 PCV doses: 2 doses PCV (at least 8 weeks after the most recent
dose …)"*), and CDC's PneumoRecs names the PPSV23 as the anchor for a 4-year-old.

**⚠ BUT THE BAR IS HERS — `authority: 'OWNER'`, the FIRST paediatric floor that is.** Every
sentence above states **the interval**. None of them says a dose given inside it **stops
counting**. That is the distinction §K's header draws between ACIP's *"minimum **recommended**
interval"* and the General Best Practices *"minimum interval"* that carries the
repeat-the-dose consequence, and it is why:

- the row carries her name, not CDC's — relabelling it CDC would make the app cite ACIP for
  a consequence ACIP does not state;
- **the dose's own text discloses it**: *"ACIP states the 8 weeks as the timing for the next
  pneumococcal dose and does not direct that an earlier dose be repeated; setting the dose
  aside is an owner clinical determination of this app, made because immunogenicity at the
  shorter interval has not been established."* The phrase **"owner clinical determination"**
  had been removed from the whole app hours earlier, when her adult table turned every adult
  floor into a recommendation. It is back for **exactly one row**, and
  `regression-2026-10-24-note-emphasis.test.jsx` now asserts **both halves** — absent on
  every adult card, present on this child's.

This is **Ruling F's relabelling run backwards**: Ruling F took her name *off* rows whose bar
was removed; this puts it *on* a row that has gained one.

**Two dates, and each answers its own question.** Maya, 8, asplenia — PPSV23 1 Oct 2026,
PCV20 15 Oct 2026:

| | Date | Measured from | Grace |
|---|---|---|---|
| when **this** dose would have counted | **22 Nov 2026** | the PPSV23 (1 Oct) + 8 weeks | **−4 days**, because the dose was already given |
| when the **repeat** may be given | **10 Dec 2026** | the dose she **got** (15 Oct) + 8 weeks | none — advice stays outside the grace |

The first is RULING D's anchor (*"the repeat dose should be spaced from the invalid dose by
the minimum interval"*); the second is the 2026-10-24 ruling that no **advised** date sits
inside the four-day window. Both come from `intervalFrom`, one arithmetic path.

**`optionalRepeat` is gone from the row.** It existed so a *recommendation* could name a date
for a repeat nobody owed. A floor owes the repeat outright and `repeatDueDate` already
carries its date, so leaving the flag on would put **two clocks on one dose** — the P0 bug's
own shape.

**⚠ NO LONGER ASYMMETRIC WITH `CHILD-PPSV23-AFTER-PCV` IN `enforcement` — BUT STILL A
DIFFERENT RULE.** Both are now floors at the same 8 weeks in opposite directions. The
difference moved to **`authority`**: CDC instructs the PPSV23 itself (*"administer 1 dose
PPSV23 at least 8 weeks after the most recent PCV dose"*, nine times, plus *"PCV15 and PPSV23
should not be administered during the same visit"*), so that bar is CDC's. Two rows, two
authorities, one number — never collapsed into one row, and the 8 weeks stays in a single
constant (`PCV_PPSV23_MIN_INTERVAL_DAYS`).

**Measured.** **231 of 17,016** verdicts and **22 of 18,264** record-problem rows moved —
exactly the 231 doses the rule flags across the grid. Three consequences, all intended:

| What moved | How many | Why |
|---|---|---|
| the judged dose, `valid` → `invalid` | **231** | the ruling itself |
| a **later** dose's number, e.g. dose 2 → dose 1 | **66** | a dose that did not count is not a "previous dose" |
| the **recommendation card** | **115** | the series is no longer complete, so a dose is owed. 35 of those gain the PCV21 serotype-4 note, because a card now offers PCV21 |

**⚠ THE RULING REACHES ADULTS, by design.** `rulebookOf` keys on the age **at the dose**, so
a 19-year-old whose PCV13 came three weeks after a PPSV23 at 14 is judged by this child row
and now has **no counting conjugate**. Every one of the 231 grid patients is aged 216–228
months for that reason — the grid builds no vaccinated 5-to-18-year-old (see
`docs/archive/` and the hand-built Maya and Noor in the guard). One rejection can
cascade: a second conjugate 29 days after the first is then rejected by
`CHILD-PCV-AFTER-PCV`, which ACIP's General Best Practices expressly allows (*"The repeat
dose should be spaced after the invalid dose by the recommended minimum interval"*).

**24 pinned card counts moved** across 14 citation guards, each re-measured with its delta
written beside it. **Every "zero uncredited" and "zero unfitting row" invariant beside them
is unchanged** — only the sizes of the card families moved, which is the point of pinning
them exactly.

Guard: `regression-2026-10-25-child-conjugate-after-ppsv23-repeats.test.js` (renamed from
`...-counts.test.js`, which asserted the opposite and is kept as the record of the reversal).

**THE SECOND SURFACE, NOW FIXED — the card and the chip name ONE date (owner approved,
2026-10-25).** Making this row a floor produced the **first case in the app where a dose is
thrown out by a CROSS-STREAM rule**, and the recommendation card did not follow RULING D
there. Maya's chip promised the repeat *"from 10 Dec"* while her card said *"Not yet due —
eligible **26 Nov**"* — 14 days apart, for the same next dose. The card measured 8 weeks from
her PPSV23, because `anchorPneumo` keys on doses that **COUNT** (ANCHOR-1, *"an unnecessary
dose cannot reset a clock"*) and her only conjugate no longer counted, leaving the PCV side
of its anchor empty.

**The card's date was the harmful one, checked in the engine rather than reasoned about.**
PCV20 given on 26 Nov is rejected *again* by `CHILD-PCV-AFTER-PCV` (42 days, needs 56) and
she still reads incomplete; given on 10 Dec it is valid and she reads **Complete**. ACIP's
General Best Practices (*"The repeat dose should be spaced after the invalid dose by the
recommended minimum interval"*) and RULING D both give 10 Dec; no document gives 26 Nov.

**The fix is the LATER of two clocks — the same shape the 24–71-month block already used,
and one line:**

```js
const anchorForA = noPriorPcv ? mostRecent(anchorPneumo, anchorPcv) : anchorPcv;
```

| Anchor | Whose rule | What it is |
|---|---|---|
| `anchorPcv` | RULING D | the dose the patient **got**, including one that did not count |
| `anchorPneumo` | ANCHOR-1 | the most recent pneumococcal dose that **counted** |

Both carry the same 8 weeks, so the later anchor is simply the later date and **no second
interval enters the engine**. All three cards in the 6–18 block read one `aState`, so one
line moved all of them.

**Measured: 750 card dates moved LATER, 0 earlier, 0 "due today" flips**, over 18,667 card
rows from the grid plus 810 hand-built children. Every one is in the **6–18** block (ages 6,
8, 11, 14, 17 — 150 each), two cards per patient across 375 patients. **No grid patient moved
at all**, which is why both verdict corpora are byte-identical — and the corpus records
`earliestNextDate`, so that is a real check and not a blind one. **A child with no conjugate
at all is untouched**: `anchorPcv` is null, `mostRecent` drops it, and nothing of hers was set
aside, so there is no repeat to space from.

Guards: `regression-2026-10-25-card-and-chip-name-one-date.test.js` (Maya, two controls, and
the hand-built sweep pinned at 810 built / 600 rejected / 0 clashes). Reverting the line fails
3 tests; dropping the pneumococcal half fails 6, including both corpora and the no-conjugate
control.

**⚠ AND ONE BLIND SPOT IT DELIBERATELY DOES NOT CLOSE.** Substituting `anchorPneumoGiven` for
`anchorPneumo` on that line **passes all 1,643 tests**: the two differ only in which PPSV23
they take — the **first** counting dose against the **most recent** — and nothing in the suite
builds a child with two counting PPSV23 doses. It matters: a 12-year-old with asplenia, PPSV23
in 2019 and again 54 days ago and no conjugate, is told her PCV20 is **due today** on a card
whose label reads "≥8 weeks". **Verified identical on `main`, so it predates this work** and is
recorded as its own finding, not folded in here. This fix is unaffected — `mostRecent` can only
push a date later — and the behaviour must **not** be pinned by a test, which would freeze it.

#### §K-PPSV23THENPCV, 2026-10-31 — a THROWN-OUT PPSV23 holds off nothing; an EXTRA one now holds the card too

**Three owner answers in one day, the later two withdrawing the first.**

1. **Eli** (asplenia; catch-up PCV13 Feb 1 and Apr 1, 2023; PPSV23 Apr 29, thrown out — 28 days
   after the PCV13; PCV20 Jun 1, 33 days after that PPSV23): *"Yes, 8 weeks after any PPSV23."*
2. Built, that moved **22 / 17,016** verdicts and **66 / 18,264** record-problem rows — **every
   one a baby given PPSV23 under age 2** (thrown out for AGE), and **0** of Eli's own kind
   (thrown out for spacing). Asked with **Rosa** (PCV13 at 2, 4, 6 months; PPSV23 given by
   mistake at 12 months; PCV13 booster a week later): *"The Sep 8 PCV13 dose should count as a
   valid dose 4, and no repeat is needed. Per CDC: repeat dose should be spaced after the invalid
   dose by the recommended minimum interval. This means this rule applies when the repeat dose
   is the same as the invalid dose."*
3. Her reason covers Eli too, so he was put back to her dose by dose, on/off schedule marked:
   *"Count it."*

**So ANCHOR-1 stands for this direction**: a PPSV23 thrown out — for spacing or for age — holds
off no conjugate. The answer-1 change was reverted before commit; nothing of it shipped.

**What the question found, and what DID change.** Ben's ruling of 2026-10-30 (an EXTRA PPSV23
holds a conjugate 8 weeks) had reached the dose check and not the card. The check measured
from the last PPSV23 that counted **or was extra**; every card's 8-week hold measured from the
last that **counted**. A diabetic 5-year-old whose extra PPSV23 was 3 weeks old was told her
catch-up conjugate was **due today** — and the app threw that dose out when it was given: the
P0 bug's shape (CLAUDE.md, "advises and grades by one number"). Both sides now call one
function, `lastPpsv23HoldingAConjugate()` in `doseIntervalRules.js`; validate.js returns its
answer as `conjugateHold` and `recommend.js` reads it as `ppsv.holdDate` at all ten places
that held a conjugate after a PPSV23 (the old `ppsv.lastDate` is gone). A hand-built sweep
gives every child the conjugate on the date its card advises: **22 were thrown out before, 0
now.** **0 / 17,016** verdicts and **0 / 18,264** record-problem rows moved — the grid builds
no child with an extra PPSV23 and a conjugate still owed.

One older control asserted the bug: `regression-2026-10-26-eight-weeks-runs-from-the-last-ppsv23`
used a cochlear-implant child's EXTRA dose as its example of "a dose that does not count cannot
push the conjugate out". It now asserts Ben's ruling (held to 8 weeks after the extra dose).

Guard: `regression-2026-10-31-card-holds-a-conjugate-after-an-extra-ppsv23.test.js` (Eli and
Rosa as she ruled them, the extra-dose child, and the advice-equals-grading sweep). Mutations:
the card reading counted doses only fails 3; dropping extras on both sides fails 19; on the
card side only, 4.

### §K-READING — Two rules about what a card may say (OWNER, 2026-10-24)

Neither is a clinical rule; both are about whether a clinician can read the card correctly.
No date, verdict or corpus column moves under either.

**1. A card never advises an age the child has already passed.** A 12-month-old whose only
PCV15 was at 2 months read *"The next dose is due at age 4 months"*. The date was right —
`advisedDate` is the latest of the minimum, the 8-week spacing and the routine age (§L /
C10-2), and the routine age genuinely was the latest here — but a past date was printed as
a future instruction, on **198 of 17,016** real patients. Past tense now, plus what to do:
*"This dose was due at age 4 months in the routine 2, 4, 6 and 12–15 month series and is
overdue — it can be given now."* The series is still named, because that is what the
clause's citation supports. The "can be given now" half is conditional on the dose actually
being due, so a card held to the first birthday does not contradict its own lead.
Guard: `regression-2026-10-24-a-card-never-advises-an-age-already-passed.test.js`.

**2. One date format on the screen.** The rec card printed *"eligible Dec 7, 2026"* while
the dose chip beside it printed *"from 2026-09-25"* — **5,620 chip sentences** in computer
format. Every patient date a clinician READS now goes through `fmtDate`. **The DATA fields
stay ISO** — `earliestValidDate`, `repeatDueDate`, `earliestNextDate` and every corpus
column — because they are compared, sorted and committed, and a display format in a data
field is how a corpus starts failing on a copy edit. **One date is deliberately left raw:**
*"an owner clinical determination dated 2026-10-11"* is provenance, not a patient date. The
guard sweeps five patients for bare ISO dates, allows exactly that one shape, and asserts
separately that the exception is still reachable so the filter cannot become dead code.
Guard: `regression-2026-10-24-one-date-format-on-the-screen.test.js`.

**And the prose sweep was extended with the disclosure.** `scripts/proseDiff.mjs` now
renders each dose's `whys` alongside its reasons and detail. Those sentences are prose a
clinician reads, one click away, and nothing else sees them — the corpora hold verdicts,
and a reader who never opens the disclosure cannot notice a wrong sentence inside it. This
is the "verdict corpora do not record prose" lesson applied to a channel as it was created
rather than after it drifted.

### §K-NOPROMISE — A rejected dose does not name a date for a dose nobody is asking for (OWNER, 2026-10-25)

**The defect.** A dose rejected for TIMING carried the sentence *"...It is not repeated; the
next dose in this series can be given from `<date>` at the earliest."* Measured over the
grid, **647 of the 814 children** whose PPSV23 was rejected were shown that date on a screen
where every card said they were finished or needed nothing — 398 at risk with a complete
PCV20-containing series, 111 with PCV20 whose card read "Not indicated", 138 with no PCV20
and a complete or not-indicated card. The patient who found it: a 5-year-old with asplenia,
PCV20 on 2026-06-01 and a PPSV23 21 days later.

**The owner's ruling, and her document.** Asked what such a child is actually owed, she
answered with CDC/ACIP's **Table 1** and told the app it may cite that document for
paediatric recommendations:

> *"Children aged 2–18 years with any risk condition who completed a recommended PCV series
> before age 6 years: **Completed series includes ≥1 dose of PCV20:** No additional doses of
> any pneumococcal vaccine are indicated."*

**Use of 20-Valent Pneumococcal Conjugate Vaccine Among U.S. Children: Updated
Recommendations of the Advisory Committee on Immunization Practices — United States, 2023**,
CDC/ACIP, published **22 September 2023**, Table 1 —
`https://stacks.cdc.gov/view/cdc/133252`, verified live 2026-10-25. The table is in the PDF;
the stacks landing page carries metadata only. Table 1's other half, for a completed series
**without** PCV20, reads *"Either a single dose of PCV20 or PPSV23 using previously
recommended dosing and schedules is recommended to complete the recommended vaccine
series."*

**The recommendation CARDS already honoured this** — `pcvInfant`'s complete branch has said
"the series already includes PCV20, so no further pneumococcal dose is needed" since
FINDING D. Only the dose note did not, so this is a wording fix and moves no dose.

**THE TEST IS "IS ANYTHING OWED AT ALL", NOT "IS A DOSE OF THIS VACCINE OWED."** An adult
whose PPSV23 was rejected IS owed something — a conjugate, per §K-INVALID — so her clause
stays and goes on matching her card's date. Keying on the vaccine stream would have stripped
it from every one of those adults one commit after the owner ruled that the two surfaces
must agree. It is **not an age test** either: what separates these children is that nothing
is owed, which `recs` states directly. `complete` and `not-indicated` are the only two card
statuses that ask for nothing.

**The lead always survives.** Only the forward-looking half goes; the dose still does not
count, and it is still not repeated.

**Where it lives.** `validate.js` emits both halves and hands `recommend.js` the exact
sentence to swap and its replacement (`forwardLookingReason` / `withoutForwardLook`).
`validate.js` cannot see the cards, and `recommend.js` must not match the sentence by text —
string surgery on a sentence built elsewhere breaks silently when the wording changes.

Measured 2026-10-25 over both grids: **3,282 of 35,280 rendered lines changed** (2,930 real
patients, 352 impossible entries), 0 added, 0 removed, and **every changed line is explained
entirely by the clause being withdrawn** — no line gained it and nothing else moved. **Both
corpora are blind to this** (they record a reason COUNT, not its text, and the swap keeps the
count), which is why the guard sweeps the rendered sentences instead.

Guard: `regression-2026-10-25-no-date-for-a-dose-nobody-asks-for.test.js`, pinned on both
sides — 2,930 withdrawn and 2,335 kept.

---

## §L — The next dose's minimum interval, children <24 months (`cdcCatchupJobAid`)

**Added 2026-10-11 (peds audit P0-2 / queue S3-N2).** Owner decisions of the same date,
taken from worked engine runs.

### The finding

The app held the same number twice, keyed two different ways: `recommend.js`'s scheduler
used the patient's **current age**, and `doseIntervalRules.js`'s validator the **age at the
previous dose**. Neither can reproduce CDC Catch-up Table 2, because Table 2 keys on the
**dose number** as well. The decisive pair — identical ages, different dose number,
different CDC answer:

| Case | Patient | Old scheduler | Old validator | CDC Table 2 |
|---|---|---|---|---|
| A | 12.2 mo, 1 dose @ 11.5 mo | 56 d | 28 d | **28 d** |
| B | 12.2 mo, 2 doses @ 3, 11.5 mo | 56 d | 28 d | **56 d** |
| C | 10 mo, 2 doses @ 8, 9.5 mo | 28 d | 28 d | **56 d + wait to 12 mo** |

In case C the app advised a dose roughly **two months before CDC would count it**.

### The source, fetched live 2026-10-11

CDC Catch-up Immunization Schedule ("Addendum updated July 2, 2025"), table **"Children age
4 months through 6 years"**, pneumococcal conjugate row, column **"Minimum Interval Between
Doses"**:
<https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-catch-up.html>

- **Dose 1 to Dose 2** — "4 weeks if first dose was administered before the 1st birthday" /
  "8 weeks (as final dose for healthy children) if first dose was administered at the 1st
  birthday or after"
- **Dose 2 to Dose 3** — "4 weeks if current age is younger than 12 months and previous dose
  was administered at <7 months old" / "8 weeks (as final dose for healthy children) if
  previous dose was administered between 7–11 months (wait until at least 12 months old);
  OR if current age is 12 months or older and at least 1 dose was administered before age
  12 months"
- **Dose 3 to Dose 4** — "8 weeks (as final dose)"

Both cells also carry a "No further doses needed for healthy children" terminator at a dose
given **at age 24 months or older**; it cannot arise for a child under 24 months, so it is
not implemented here (§B owns that age band).

### The owner decisions

1. **The advised interval follows CDC Table 2, dose by dose.**
   `pcvNextDoseMinIntervalDays()` in `intervals.js`. A single age key is not an option.
2. **The validity floor does not move.** A dose **already given** is still graded by
   `doseIntervalRules.js`'s more permissive reading (p2016 footnote †). The app's job is to
   stop *advising* a dose that will not count; it does not retroactively invalidate a dose a
   clinician already gave. Case C's 4-week dose therefore stays **valid** while the app now
   advises 8 weeks and a wait to the first birthday.
3. **There is no separate "recommended" interval layered over Table 2's number.** p2016
   Table 1's body says "8 weeks apart" at every infant interval, and a blanket 8-week
   recommendation was considered and **declined**: the 4-vs-8-week choice is age-governed
   exactly as footnote † states it, and Table 2 says which age applies at which dose.
   (Contrast the adult rule, A-P1-1 / §K, where recommendation and floor *are* separate.)

### Where it lives

`pcvNextDoseMinIntervalDays()` is in `intervals.js`, **not** in `doseIntervalRules.js`. That
table owns gaps between doses **already recorded**; this answers what to advise for a dose
not yet given. Do not move it there, and do not key a table row off it.

### §L-2 — C10-2 (2026-10-23): the advised date is the ROUTINE one; the minimum is stated beside it

⚠ **THIS REVERSES OWNER DECISION 3 ABOVE**, which declined "a separate 'recommended'
interval layered over Table 2's number". It is reversed by two LATER owner rulings of
2026-10-23, and the difference between what was declined then and what is built now matters:

* **Declined 2026-10-11:** a *blanket* 8-week recommendation at every infant interval.
* **Built 2026-10-23:** 8 weeks **only where a p2016 Table 1 catch-up row states it**
  (ages 7–23 months — all eight rows say 8 weeks), and in the routine 2–6-month band
  **CDC's routine AGES** instead (2, 4, 6, 12–15 months). The 2–6-month band is
  deliberately NOT given the 8 weeks: p2016's rows there read "4 doses … last dose at age
  12–15 months" and, as C7's reading of the PDF recorded, p2016 "never prints the 2/4/6
  months", so no document on the card would state it.

**RULING A (2026-10-23)** ranks the paediatric documents — CDC/ACIP schedule Notes →
immunize.org p2016 → CDC catch-up table — on the strength of the catch-up page's own
sentence, read live 2026-10-23: *"Always use this table in conjunction with Table 1 and the
Notes that follow."* So where p2016 states a spacing, p2016's number is the **advice** and
the catch-up table's is the **floor**.

**RULING C (2026-10-23)** is the limit: *"the validity floor does NOT change. A dose already
given is graded by the rule that applied to that dose. Only the recommended number moves."*

#### The rule, as implemented

| Child | Advised date for the next PCV dose |
|---|---|
| 2–6 months (routine band, no Table 1 row) | the routine **age** for that dose number — 2, 4, 6 months; the closing dose at ≥12 months |
| 7–23 months (a Table 1 catch-up row governs) | **8 weeks** after the most recent dose |
| any child whose routine date has already passed | the **minimum** — the routine term stops binding and the advice collapses to the floor |

The advised date is the **latest** of the minimum date, the 8-week spacing date (where a row
states it) and the routine-age date. That single `max` is also the answer to "what about a
child genuinely behind": she has no routine date left, so the minimum is what remains.
**Nothing is ever advised earlier than the floor allows** — measured over 3,305 cards, 145
moved later and 0 earlier.

#### Both numbers go on the card, and that is not optional

The P0 fix of the same day removed a state where the app named one date and then silently
accepted a dose given earlier. Rulings A and C together deliberately re-create two numbers
(advise 8 weeks, accept 4), so the card **states** the minimum rather than hiding it:

> The next dose is due at age 6 months, following the routine 2, 4, 6 and 12–15 month
> series; it can be given today if needed, as the minimum interval of 4 weeks has already
> passed [2]; the final/booster dose is given at ≥12 months.

A second number the reader can see is not the P0 bug; an invisible one is.

#### Who is cited for which number

Each clause credits the one document whose own words carry it — the advice and the floor now
come from **different documents**, which is why they are cited separately:

| Number on the card | Document cited |
|---|---|
| the routine ages | CDC Child/Adolescent Notes, "4-dose series at 2, 4, 6, 12–15 months" |
| the 8-week catch-up spacing | the p2016 Table 1 row this child keyed on |
| the minimum interval | **CDC's Catch-up Immunization Schedule, Table 2** — the cell the engine actually used |

CDC's catch-up schedule had appeared on **no card in the app** before C10-2, while being the
document `intervals.js` is built from cell by cell. The owner ruled on 2026-10-23: *"add a
refs.js entry for CDC's Catch-up Immunization Schedule and cite it for the INTERVAL cells
only (dose 1→2, 2→3, 3→4), never for a total."* Five cell entries plus one whole-page entry
are in `refs.js`, read live 2026-10-23.

**The cell is returned by the same call that returns the number** —
`pcvNextDoseMinIntervalCell()` in `intervals.js`, which `pcvNextDoseMinIntervalDays()` now
wraps. A caller that re-tested the ages to pick a citation would be a *third* reading of
Table 2, free to drift from the figure it cites; two readings is precisely the P0 bug.

#### Where it lives

`pcvInfant()` in `recommend.js`. The guard is
`regression-c10-2-2026-10-23-routine-date-recommended-minimum-commented.test.js`, proved
load-bearing four ways (4 / 3 / 3 / 2 failing tests when each clause is broken separately).

### §L-3 — RULING D (2026-10-23): the repeat is measured from the dose the patient GOT

**OWNER RULING D, 2026-10-23:** *"the repeat dose should be spaced from the invalid dose by
the minimum interval. This should be followed."*

**Source, read live 2026-10-23.** ACIP General Best Practices, "Timing and Spacing of
Immunobiologics": *"The repeat dose should be spaced after the invalid dose by the
recommended minimum interval (Table 3-2)."* The page states its per-vaccine exceptions
explicitly: **hepatitis B is the only one** that anchors the repeat on the VALID dose
(*"as early as 8 weeks after the 2nd valid dose"*); Hib and hepatitis A follow the general
rule; live vaccines have their own 28-day rule. **Pneumococcal appears four times on that
page and not once about repeat or invalid doses** — all four are simultaneous-administration
findings — so the general rule governs and there is no pneumococcal override to look for.

**What was wrong.** The validator had followed this since ANCHOR-1. The recommendation side
had not: `recommend()` summarises the EFFECTIVE list, so a card measured from the last dose
that COUNTED. Three otherwise identical 7-month-olds whose mistimed dose fell on 28 Sep, 5
Oct and 12 Oct were all advised the same return date.

**What moves and what does not.** The split is not invented here — it is the validator's own
(`DOSE_INTERVAL_RULES` CHILD-PCV-AFTER-PCV takes `ageAtPrevDose` from the anchor and
`doseNumber` from the kept list), copied so the two sides cannot hold separate readings:

| Moves to the dose actually given | Stays on doses that COUNTED |
|---|---|
| the anchor date | the dose number and series totals |
| the age at that anchor dose | `anyDoseBefore12` |

The anchor is computed once, in `validate.js` (`st.prev`), exposed as the analysis's
`anchor`, and carried by `summarizePcv` as `anchorDate` / `anchorAgeAtDose` — distinct from
`lastDate` / `lastAgeAtDose`, which keep their own meaning. For a patient with no rejected
dose the two are the same date, which is why nothing else moved.

**Three things never anchor.** PCV7 (a superseded product properly given, not a mistimed
one). A **record problem** — a dose dated in the future or before birth — because it is *"a
dose the patient never had"*, the same reason `validate.js` already withholds its repeat
sentence. And every **cross-stream** interval (PPSV23 measured from a PCV; the 5-year rows),
which ANCHOR-1 keys on counting doses in both directions: Ruling D is about repeating the
mistimed dose, not about a different vaccine that follows it.

**The third surface.** The chip under a rejected dose read *"the next dose in this series is
due on or after …"* and printed `earliestValidDate` — the date **that dose** would have been
valid, measured from the one before it. `repeatDueDate` is its sibling: same rule, same
arithmetic (`intervalFrom`), anchored on the dose given. Both are kept, because they answer
different questions:

| Field | Answers |
|---|---|
| `earliestValidDate` | when THIS dose would have counted (anchor + gap) |
| `repeatDueDate` | when its REPEAT may be given (this dose + gap) |

They differ in one thing more, and it is an **OWNER RULING of 2026-10-24** — the answer to
the first question PR #83 left open. `earliestValidDate` carries CDC's 4-day grace;
`repeatDueDate` does **not**.

> *"I don't need the app to recommend dates within the 4 day grace period. Just the routine
> date next dose is due with a comment on the earliest date it could be given."*

The reason is the division this spec has drawn since the grace was added (§ "CDC's 4-day
grace" above): the grace permits *counting* a dose given 4 days early, not *advising* one,
so it belongs to the validator and never to the scheduler. `earliestValidDate` asks a
validity question about a dose **already given** and keeps it. `repeatDueDate` is advice
about a dose **not yet given**, so it takes the full interval — the first graced date the
app had ever printed as advice, and the only one.

Shipped with it, for the same reason: the chip names that date as the **earliest**, never as
the date the dose is **due**. The rec card is the only surface that states a due date,
because it is the only one that knows C10-2's routine age and spacing. Before, a
7-month-old's screen carried three dates for one dose — header *"eligible Dec 7, 2026"*,
chip *"due on or after 2026-11-05"*, note *"can be given from 2026-11-09 … the minimum
interval of 4 weeks"*. It now carries two, and they are the routine date and the earliest
date her ruling asks for.

Measured over both grids: 10,712 chip sentences moved, every one of them **+4 days later**
and none earlier; 0 verdicts moved in either corpus (`earliestValidDate`, the field the
corpora record, did not change). The app advises the 9th and still **accepts** the 5th.

Guards: `regression-ruling-d-2026-10-23-repeat-anchored-on-invalid-dose.test.js` and
`regression-2026-10-24-advice-never-inside-the-four-day-grace.test.js`.
