# PneumoVax — Clinical Specification

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

Minimum interval: <12 months = 4 weeks; ≥12 months = 8 weeks; dose 4 not before 12 months.

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
> `dosesNeeded(currentAge, priorCount, ages)` + the 4wk/8wk min-interval and the 12-mo
> floor for the booster (dose ≥ "last dose at 12–15mo"). This is the snapshot model the
> sibling apps use.

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
- **None / unknown / PCV7-only:** PCV20 or PCV21; **or** PCV15 then PPSV23 ≥1y.
- **PPSV23 only:** PCV15/20/21 ≥1y after PPSV23 (PCV15 → no further PPSV23).
- **PCV13 only:** PCV20 or PCV21 ≥1y → complete.
- **PCV13 + PPSV23 (PPSV23 at <65):** PCV20 or PCV21 **≥5y** after last pneumo (shared
  clinical decision-making) → complete.
- **PCV13 + PPSV23 (PPSV23 at ≥65):** shared clinical decision — PCV20/PCV21 ≥5y, or nothing.
- **PCV15 only, no PPSV23 → INCOMPLETE:** PPSV23 ≥1y (or substitute PCV20/21).
- **PCV15 & PPSV23, or PCV20, or PCV21 (any age):** complete.

> Implementation note on `PCV13+PPSV23 at ≥65`: PneumoVax does not store the age at which
> each historical dose was given for adults (history is dose-counts of products). It models
> the PPSV23-age branch using the **patient's current age** as a proxy: if current age ≥65
> and PCV13+PPSV23 present, the residual PCV20/21 is offered as **shared-decision** (status
> `shared-decision`); if <65, it is `due` with the ≥5y interval. Flagged in HANDOFF.

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
> into a single value — they govern different gates.

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
- **Unknown / undocumented history → treat as unvaccinated** (CDC).
- **Multiple risk conditions:** apply all relevant pathways; most protective wins;
  **IC precedence over non-IC** (the ≥8wk interval and the IC catch-up rows win).
- **A series containing PCV20 (or PCV21 in adults) ⇒ no PPSV23.**
- **PCV15 (without a later PCV20/21) ⇒ a PPSV23 follow-up is required to be complete.**
