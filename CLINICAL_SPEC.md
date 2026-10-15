# PneumoVax — Clinical Specification

> **This file is PneumoVax's RULEBOOK** (owner decision, S8, 2026-10-11). It is the single
> document that states every clinical rule the app implements, with the source for each.
> `docs/agent/clinical-rules.md` is an agent-facing companion that may summarise but must
> never contradict it; `docs/agent/architecture.md` describes structure, not rules. When a
> rule changes, this file changes in the same pull request — and for the interval rules that
> is no longer an honour system: see §K "The rule table, row by row".
>
> **Verified against code: 2026-10-11.**

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
| `mmwr7203a1` | MMWR rr7203a1 — comprehensive adult ≥19 | adult risk catalog |
| `mmwr7239a5` | MMWR mm7239a5 — PCV20 in children | peds PCV20 |
| `mmwr7137a3` | MMWR mm7137a3 — PCV15 in adults | adult PCV15 |
| `p2016` | immunize.org p2016 (Tables 1–5) | **peds dose-count grids + child HSCT (Table 5)** |
| `immPCV7` | immunize.org Ask the Experts — PCV7 not counted | PCV7-ignored rule |
| `immPneumo` | immunize.org Ask the Experts — pneumococcal topic | edge cases |
| `fredHutchLTFU` | Fred Hutch LTFU Guidelines §IX (Tables IX.A1/A2) | **adult HSCT (SOLE source)** |

**Precedence:** CDC schedule notes are primary for routine + at-risk peds/adult logic.
p2016 is the detailed companion for the peds dose-count grids. **HSCT peds = p2016 Table 5
SOLE source; HSCT adult = Fred Hutch LTFU SOLE source.**

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
- 5–18 y healthy, no/incomplete by 24mo → **no additional doses** (healthy older children
  are not caught up). (`p2016` Table 2)

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
   (If PPSV23 already given: A) 1 PCV20 ≥8wk, or B) 2nd PPSV23 ≥5y after first.)
6. 6–18 y **non-IC**, no prior PCV13/15/20: A) 1 PCV20 ≥8wk after last pneumo; **or**
   B) 1 PCV15 ≥8wk, then ≥8wk later PPSV23 (if PPSV23 not previously given).
7. 6–18 y **IC**, no prior PCV13/15/20: same A/B as non-IC.
8. 6–18 y **non-IC**, **PCV13 only at/after age 6**: A) 1 PCV20 ≥8wk after PCV13; **or**
   B) 1 PPSV23 ≥8wk after PCV13.
9. 6–18 y **IC**, **PCV13 only at/after age 6**: A) 1 PCV20 ≥8wk; **or** B) 1 PPSV23 ≥8wk,
   then ≥5y after first PPSV23 give 1 PCV20 or a 2nd PPSV23.

All peds intervals = **≥8 weeks** (Table 4 uses 8wk throughout for ≥24mo).

---

## §E — HSCT, children <19 y (p2016 Table 5 — SOLE source)

Prior pneumococcal history is nullified → full re-vaccination.
- **4 doses PCV20**, beginning 3–6 mo after HSCT: 3 doses 4 weeks apart, then a 4th ≥6 mo
  after dose 3 **and** ≥12 mo after HSCT.
- If PCV20 unavailable: 3 doses PCV15 (4 wk apart) beginning 3–6 mo post-HSCT, then PPSV23
  ≥12 mo after HSCT. With **chronic GVHD**: give a 4th PCV15 ≥12 mo after HSCT instead of PPSV23.

**Design rule:** the app does NOT capture an HSCT date → present **relative to transplant**
(advisory), no calendar due-dates, status `risk-based`, `dueToday: false`, no
`earliestNextDate`. Show "coordinate with transplant/ID team" flag.

---

## §F — HSCT, adults ≥19 y (Fred Hutch LTFU Tables IX.A1/A2 — SOLE source)

Prior pneumococcal history nullified → full re-vaccination.
- **PCV20 ×3** at **≥6, ≥8, ≥10 months** after HSCT (per Tables IX.A1 "before 12 months"
  and IX.A2 "standard": Prevnar 20 at >6m, >8m, >10m). **No PPSV23** in the adult row.
- **Titer-guided:** check baseline *S. pneumoniae* IgG (23 serotypes) **before** PCV20;
  recheck IgG 1–2 mo **after each** PCV20. A positive response — seroprotective IgG to
  **≥15 of 20 PCV20 serotypes** — means **no further PCV20**. (Footnotes 8 & 9.)
- ⚠️ Institution-specific (Fred Hutch), **not ACIP**, titer-gated.

**Design rule:** same as §E — advisory block relative to HSCT, titer steps as notes,
"coordinate with transplant/ID team; your center's protocol may differ" flag.

---

## §G — Adults 19–49 y WITH a risk condition (`cdcAdultPneumo`, `cdcAdultTimingJobAid`)

Routine starts at 50; 19–49 is **risk-only**. PCV15→PPSV23 interval differs by risk class:
**chronic conditions = ≥1 year; immunocompromising / cochlear implant / CSF leak = ≥8 weeks.**

Prior-vaccine branches:
- **None / unknown / PCV7-only:** 1 dose PCV15, PCV20, or PCV21. PCV15 → PPSV23 (≥1y, or
  ≥8wk if IC/cochlear/CSF). PCV20/PCV21 → complete.
- **PCV15 only (PPSV23 pending) → INCOMPLETE:** PPSV23 (≥1y or ≥8wk per risk); may
  substitute PCV20/PCV21 if PPSV23 unavailable.
- **PPSV23 only:** PCV15/20/21 ≥1y after PPSV23 (PCV15 → no further PPSV23).
- **PCV13 only:** PCV20 or PCV21 ≥1y after PCV13 → complete.
- **PCV13 + 1 PPSV23:** PCV20 or PCV21 ≥5y after last pneumo → complete (IC/cochlear/CSF);
  for chronic conditions, none now → review at 50.
- **Already PCV20, or PCV21, or (PCV15 & PPSV23):** none now (complete).

---

## §H — Adults ≥50 y (`cdcAdultPneumo`, `cdcAdultTimingJobAid`, `mmwr7401a1`; routine lowered 65→50 eff. 2024-10-23)

Routine for ALL adults ≥50 regardless of risk.
- **None / unknown / PCV7-only:** PCV20 or PCV21; **or** PCV15 then PPSV23 **≥1 year** (8-week minimum may be *considered* for IC / cochlear implant / CSF leak — named, never substituted; A-P1-1).
- **PPSV23 only:** PCV15/20/21 ≥1y after PPSV23 (PCV15 → no further PPSV23).
- **PCV13 only:** PCV20 or PCV21 ≥1y → complete.
- **PCV13 + PPSV23, and NO PPSV23 was received at ≥65:** PCV20 or PCV21 **≥5y** after the
  last pneumococcal dose → complete. This is a **plain recommendation**, not shared
  decision-making. (Corrected 2026-10-10, S10: this line previously said "shared clinical
  decision-making" for both rows, which is the documentation half of A-P0-1.)
- **PCV13 + PPSV23, AND PPSV23 was received at ≥65:** **shared clinical decision-making** —
  PCV20/PCV21 ≥5y, or nothing.
- **PCV15 only, no PPSV23 → INCOMPLETE:** PPSV23 **≥1 year** (or substitute PCV20/21). Series complete once given.
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
>   matrix (§G/§H), HSCT adult pathway (§F), and adult-only risk gate in StepRisks all
>   apply from 19y. Patients aged 18 use the child/adolescent rulebook (§B–§E) for
>   schedule routing even though PCV21 is a valid product choice for them.
>
> These two thresholds are kept as separate named constants (`PCV21_MIN_AGE_M = 216` and
> `ADULT_SCHED_MIN_M = 228`) in `src/logic/scheduleConstants.js`. Never collapse them
> into a single value — they govern different gates. That file also owns a third,
> equally distinct age: `ROUTINE_ADULT_MIN_M = 600` (50y), where routine age-based adult
> eligibility begins (§H; mm7401a1).

- Option for **any patient ≥18y** who qualifies for a PCV. **Not for children** (<18y).
- Geographic note: PCV21 **lacks serotype 4**. In regions where ≥30% of pneumococcal
  disease is serotype 4 (Alaska, Colorado, Navajo Nation, New Mexico, Oregon), PCV20 (or
  PCV15+PPSV23) may be preferred. Surfaced as an **advisory note**, not a hard block.

---

## §J — Adult risk catalog (`cdcAdultPneumo`, `cdcAdultTimingJobAid`, `mmwr7203a1`)

**Immunocompromising (shorter PCV→PPSV23 = ≥8wk):** chronic renal failure, nephrotic
syndrome, HIV, congenital/acquired asplenia, sickle cell / hemoglobinopathies,
immunodeficiency, generalized malignancy, leukemia, lymphoma, Hodgkin, multiple myeloma,
iatrogenic immunosuppression (incl. long-term steroids/radiation), solid organ transplant.
**Cochlear implant** and **CSF leak** use the IC (≥8wk) interval.

**Chronic conditions (≥1y interval):** chronic heart disease, chronic lung disease
(COPD/emphysema/asthma), chronic liver disease, diabetes, alcohol use, cigarette smoking.

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
  **IC precedence over non-IC** (the ≥8wk interval and the IC catch-up rows win).
- **A series containing PCV20 (or PCV21 in adults) ⇒ no PPSV23.**
- **PCV15 (without a later PCV20/21) ⇒ a PPSV23 follow-up is required to be complete.**
- **Adult PCV15→PPSV23 interval = ≥1 year, at EVERY adult age** (owner decision 2026-10-10,
  A-P1-1). CDC Adult Schedule Notes, fetched live 2026-10-10 — the sentence appears twice on
  that page, identically, under "Age 50 years or older" **and** under "Age 19–49 years with
  certain underlying medical conditions":
  > "If PCV15 is used, administer 1 dose PPSV23 at least 1 year after the PCV15 dose (may use
  > minimum interval of 8 weeks for adults with an immunocompromising condition, cochlear
  > implant, or cerebrospinal fluid leak)."

  So ≥1 year is the **recommendation** and 8 weeks a minimum that may be **considered** for
  IC / cochlear implant / CSF leak, at any adult age. The app prints the year and **names** the
  8-week option; it never substitutes one for the other. The series is complete once the
  PPSV23 is given. (CDC's Timing Job Aid prints a flat "8 weeks" on its 19–49 pages — a
  per-page simplification; the schedule notes govern.) Single source:
  `ADULT_PPSV23_INTERVAL_MONTHS` + `adultPpsvShorterMinimumApplies()`.
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
  *counting* a dose given 4 days early, not *advising* one.
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
  `'none'` → explicitly never flagged, with the reason written down). **No age test decides
  whether a rule may bite.** `CHILD-PPSV23-AFTER-PPSV23` and `ADULT-PPSV23-AFTER-PPSV23`
  read the *same* 5-year constant — proof the old age gate on that rule was pure loss — and
  a test asserts they cannot drift apart.

  #### The rule table, row by row

  **This table mirrors `DOSE_INTERVAL_RULES` exactly, and a test
  (`rule-docs-match-code.test.js`, P2-7) holds it there, cell by cell.** Every expected
  value in that test is read out of the code, so changing a rule's interval, its
  enforcement or its authority — or adding or deleting a row — fails the suite until this
  table is corrected. Nothing below is transcribed by hand.

  "Measured from" is the anchor key in `doseIntervalRules.js`, and names the dose the gap
  runs from: `prevSameStream` is the previous dated dose of the same vaccine **including
  one that did not count** (CDC: "the repeat dose should be spaced after the invalid dose by
  the recommended minimum interval"), while `lastPcv`, `lastPcv13`, `lastPcv15` and
  `lastPpsv23` read the most recent **counting** dose of that product in the other stream
  (ANCHOR-1, 2026-10-11).

  | Rule | Rulebook | Vaccine | Measured from | Minimum gap | Enforcement | Authority |
  |---|---|---|---|---|---|---|
  | `CHILD-PCV-AFTER-PCV` | child | PCV | `prevSameStream` | >=4 weeks under 12 months, >=8 weeks from 12 months | floor | CDC |
  | `CHILD-PPSV23-AFTER-PCV` | child | PPSV23 | `lastPcv` | >=8 weeks | floor | CDC |
  | `CHILD-PPSV23-AFTER-PPSV23` | child | PPSV23 | `prevSameStream` | >=5 years | floor | CDC |
  | `ADULT-PCV20-21-5Y-AFTER-PPSV23` | adult | PCV | `lastPpsv23` | >=5 years | floor | OWNER |
  | `ADULT-PCV20-21-1Y-AFTER-PCV` | adult | PCV | `lastPcv` | >=1 year | floor | OWNER |
  | `ADULT-PCV20-21-AFTER-PCV13` | adult | PCV | `lastPcv13` | >=1 year | floor | OWNER |
  | `ADULT-PCV-AFTER-PPSV23` | adult | PCV | `lastPpsv23` | >=1 year | floor | OWNER |
  | `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM` | adult | PPSV23 | `lastPcv15` | >=8 weeks | floor | OWNER |
  | `ADULT-PPSV23-AFTER-PCV15` | adult | PPSV23 | `lastPcv15` | >=1 year | floor | OWNER |
  | `ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM` | adult | PPSV23 | `lastPcv` | >=8 weeks | floor | OWNER |
  | `ADULT-PPSV23-AFTER-PCV13` | adult | PPSV23 | `lastPcv` | >=1 year | floor | OWNER |
  | `ADULT-PPSV23-AFTER-PPSV23` | adult | PPSV23 | `prevSameStream` | >=5 years | floor | OWNER |
  | `ADULT-PCV20-21-AFTER-PCV15-NO-INTERVAL` | adult | PCV | `lastPcv15` | none stated | none | CDC |
  | `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM-USED` | adult | PPSV23 | `lastPcv15` | >=1 year | recommendation | CDC |
  | `ADULT-PCV-AFTER-PCV-CATCH-ALL` | adult | PCV | `prevSameStream` | >=1 year | recommendation | CDC |
  | `ADULT-PPSV23-AFTER-PCV-CATCH-ALL` | adult | PPSV23 | `lastPcv` | >=1 year | recommendation | CDC |

  Reading the table:
  - **Enforcement** — `floor`: a shorter gap means the dose does not count and is owed a
    repeat. `recommendation`: the dose counts, keeps its number, and carries a sentence
    explaining the gap. `none`: deliberately never flagged, with the reason in the row's
    `source` field. A `none` row states no interval at all, because an interval it never
    reads would read as a live rule to the next person (asserted by P2-7).
  - **Authority** — ⚠️ `OWNER` means an **owner clinical determination dated 2026-10-11**,
    not ACIP's and not CDC's. Every adult floor is one; see the determination below. `CDC`
    appears only on the three paediatric floors, whose sources state the gap as a minimum in
    so many words, and on the rows that void nothing.
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
  was shown all of the evidence below, which disagrees, and reaffirmed. Recorded the same
  way the Fred Hutch HSCT pathway is (`CLAUDE.md`: "label as institution-specific in UI
  copy").

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
  | PCV20/PCV21, history has PCV13 **and** PPSV23 | last PPSV23 | ≥5 years | `ADULT-PCV20-21-5Y-AFTER-PPSV23` |
  | PCV20/PCV21, history has PCV13 **and** PPSV23 | last PCV | ≥1 year | `ADULT-PCV20-21-1Y-AFTER-PCV` |
  | PCV20/PCV21, history has PCV13, no PPSV23 | last PCV13 | ≥1 year | `ADULT-PCV20-21-AFTER-PCV13` |
  | PCV15/20/21, history has PPSV23 only | last PPSV23 | ≥1 year | `ADULT-PCV-AFTER-PPSV23` |
  | PPSV23, IC / cochlear implant / CSF leak | last PCV15 | ≥8 weeks | `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM` |
  | PPSV23, any other adult | last PCV15 | ≥1 year | `ADULT-PPSV23-AFTER-PCV15` |
  | PPSV23, IC / cochlear implant / CSF leak | last PCV13 | ≥8 weeks | `ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM` |
  | PPSV23, any other adult | last PCV13 | ≥1 year | `ADULT-PPSV23-AFTER-PCV13` |
  | A second PPSV23 | previous PPSV23 | ≥5 years | `ADULT-PPSV23-AFTER-PPSV23` |

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

  1. `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM-USED` — an adult with an immunocompromising
     condition, cochlear implant or CSF leak who used the 8-week option instead of waiting
     the recommended year. The dose met the minimum CDC names for them, so it counts; the
     note states that, which is information rather than second-guessing.
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
