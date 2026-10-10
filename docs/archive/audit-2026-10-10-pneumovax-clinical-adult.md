# PneumoVax clinical audit — adults, HSCT, precedence (S2)

**Written:** 2026-10-10 · **Session:** S2 of the 13-session plan in
`.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md`
**Repo state:** `main` @ `beec94b`, clean tree, **156 passing / 11 files** before and after
(this session changed no engine code — it is a read-only audit).
**Scope:** `pcvAdult`, `adultPpsvIntervalClass`, `hsctAdvisory`, `pcv21GeoNote`, and the
precedence choices (hard stop over HSCT; age-outer / risk-inner).
**Companion deliverable:** the number census → `census-2026-10-10-pneumovax-numbers.md`
(S6's input).

**Result: 1 P0, 3 P1, 11 P2, and 17 rules verified correct. Zero owner decisions on the
clinical facts** — every question this audit opened was closed by fetching the sources.
One finding (A-P1-1) requires amending a rule currently marked non-negotiable in
`CLAUDE.md`, which is the owner's call to make; the clinical reading behind it is settled
by four tier-1 sources that agree.

---

## ⚠️ ID convention — read this before using any ID

Three documents in this project now carry findings, and two of them already collide.

| Prefix | Means | Lives in |
|---|---|---|
| **`A-P0-1`, `A-P1-2`, …** | **this** audit (adult / HSCT) | this file |
| `P0-1`, `P1-3`, `P2-1`, … | the **paediatric** audit | `audit-2026-10-10-pneumovax-clinical-peds.md` |
| `P1-3`, `P2-1`, `P3-9b`, … | the **interface-parity queue** | `.claude/prompts/fix-2026-10-10-…-parity.md` |

The peds audit and the parity queue each use a bare `P1-3` and a bare `P2-1` **for
different findings**. This audit therefore prefixes every ID with `A-` so it can never be
confused with either. Always write `A-P1-1` (adult), `peds P0-1`, or `queue P1-3` — never a
bare ID.

---

## How every claim here was checked

Each branch was read, then **run** — the real engine was called with patients built to land
on that branch, and the actual card text recorded. Each clinical number was then checked
against its source **fetched live today, 2026-10-10**. Nothing below rests on reading code
alone, and nothing rests on a remembered rule.

Vintage confirmed live: CDC serves the **July 2, 2025** schedule. Its own banner states
that the preliminary order of 16 March 2026 in *American Academy of Pediatrics et al. v.
Kennedy et al.* (No. 1:25-cv-11916, D. Mass.) **stayed all ACIP votes from the June,
September and December 2025 meetings and the Acting CDC Director's 5 January 2026 decision
memo**, and that the July 2 2025 schedule (amended 27 April 2026 for RSV) is current. So
the adult rules audited here are the ones in force, and the owner's "nothing from 2026" pin
is satisfied. **There is still no tripwire in the repo if that stay lifts** — carried
forward from the peds audit, still true.

---

# P0 — silent wrong answer

## A-P0-1 — The 65th-birthday test is wrong by up to ±15 days, in both directions

A dose CDC **recommends** is silently presented as **optional** when the PPSV23 was given in
the two weeks before the patient's 65th birthday.

**Where:** `src/logic/recommend.js:662`

```js
const ageAtPpsvMonths = am - Math.round(daysBetween(ppsvDateForAge, today) / 30.4375);
ppsvAtOrAfter65 = ageAtPpsvMonths >= M.y65;
```

`am` is a **float** month count (`dobToAgeMonths` returns `days / 30.4375`), but the elapsed
term is **rounded to whole months**. Mixing the two puts up to half a month of error into
the reconstructed age-at-dose, so the "was PPSV23 given at ≥65?" test flips either way near
the birthday.

**Proven by sweep.** 1-day steps over 365 birthdates × PPSV23 dates ±40 days around each
65th birthday: **2,782 of 29,565 (dob, dose-date) pairs misclassified — 9.4%**, every one
of them inside −14 … +15 days of the birthday, and nothing wrong outside that band.

**Repro 1 — under-recommends (the dangerous direction).** DOB `1958-01-01`, PCV13
`2005-05-01`, PPSV23 `2022-12-26` (**6 days before** the 65th birthday), today `2026-10-10`:

- App: `shared-decision` — *"PCV20 or PCV21 ≥5 years (shared clinical decision-making)"*,
  note *"…is a shared clinical decision — **it may be given or omitted**."*
- CDC: this patient is the **"NO PPSV23 … at age 65 years or older"** row, which is a plain
  recommendation, not shared decision-making.

**Repro 2 — over-recommends.** DOB `1958-01-10`, PPSV23 `2023-01-10` (**exactly** the 65th
birthday):

- App: `due` — *"PCV20 or PCV21 ≥5 years after last pneumococcal dose — completes the series"*.
- CDC: PPSV23 *was* received at ≥65 → **shared clinical decision-making**.

**Source, verbatim** (CDC Adult Immunization Schedule Notes, pneumococcal, fetched live
2026-10-10):

> "Previously received both PCV13 and PPSV23 but NO PPSV23 was received at age 65 years or
> older: 1 dose PCV20 or 1 dose PCV21 at least 5 years after the last pneumococcal vaccine
> dose."
>
> "Previously received both PCV13 and PPSV23, AND PPSV23 was received at age 65 years or
> older: Based on shared clinical decision–making, 1 dose of PCV20 or 1 dose of PCV21 at
> least 5 years after the last pneumococcal vaccine dose."

Corroborated by the CDC Adult Pneumococcal Vaccine Timing Job Aid (March 2025), p1, which
splits the same two rows on "PPSV23 at <65 yrs" versus "PPSV23 at ≥65 yrs".

**Second root cause — the fix is cheap because the data already exists.**
`src/components/StepAge.jsx` collects a real **date of birth**, and its own header says why:

> "Date of birth is the primary, recommended entry — it lets the engine compute a dose's age
> precisely (e.g. was PPSV23 given on/after the 65th birthday…)"

It then converts the DOB to `ageMonths` and **throws the DOB away** (`onChange({ ageMonths,
ageGroup })`). The engine never receives it, so it reconstructs age-at-dose with the
approximation above — the exact calculation the DOB was collected to avoid. Threading the
DOB through and comparing calendar dates removes this whole class of error.

**Suggested fixtures:** the two repros above, plus a control at +6 months
(DOB `1958-01-10`, PPSV23 `2023-07-10` → shared-decision, which the app already gets right).

**Fix alongside:** peds `P1-1` (CDC's 4-day grace and calendar-exact age-at-dose) is the
same root cause. `summarizePcv` (`recommend.js:100`) bands every dose by
`am - daysBetween(…)/30.4375` — unrounded, so better, but still DOB-free. Both belong in
**S10**, and S10 should run **before** S3 for the reason the peds audit already gave.

While in that expression: `sharedDecision = isOlderAdult && ppsvAtOrAfter65` (line 667) — the
`isOlderAdult` half is dead, since a dose received at ≥65 implies the patient is ≥65 > 50.
Harmless, but delete it rather than leave a condition that looks load-bearing.

---

# P1 — visibly wrong output

## A-P1-1 — Adults ≥50 who are immunocompromised are shown an 8-week PPSV23 interval where CDC says ≥1 year — and the app contradicts itself one step earlier

**Where:** `src/data/riskFactors.js:198-201` (`adultPpsvIntervalClass`) — it keys on risk
class with **no age term**; consumed at `recommend.js:566-568, 607-617, 706`.

**The self-contradiction, in two steps of one patient** (60y, HIV, no pneumococcal history):

| Step | What the app says |
|---|---|
| 1. Before any dose | *"1 dose of PCV20 or PCV21 — OR 1 dose of PCV15 followed by PPSV23 **≥1 year** later."* |
| 2. After recording that PCV15 | *"PPSV23 (**≥8 weeks** after PCV15) — completes the series"*, `earliestNextDate: 2026-12-05`, `minIntervalDays: 56` |

Same patient, same session, two different intervals. Step 1 is the one the sources support.

**Four tier-1 sources agree: ≥1 year is the recommendation; 8 weeks is a *minimum* that may
be used for immunocompromising conditions, cochlear implant or CSF leak.**

- **CDC Adult Schedule Notes** (live 2026-10-10), in *both* the ≥50 routine row and the
  19–49 special-situations row, identically:
  > "If PCV15 is used, administer 1 dose PPSV23 at least 1 year after the PCV15 dose (may
  > use minimum interval of 8 weeks for adults with an immunocompromising condition,*
  > cochlear implant, or cerebrospinal fluid leak)."
- **CDC Adult Timing Job Aid** (March 2025), p1 (adults ≥50), footnote †:
  > "Consider minimum interval (8 weeks) for adults with an immunocompromising condition,
  > cochlear implant, or cerebrospinal fluid leak (CSF) leak"
  — against a table that prints **"PCV15 ≥1 year† PPSV23"**.
- **ACIP rr7203a1** (8 September 2023, adults ≥19y): ≥1 year for most adults, with
  "≥8 weeks since the PCV15 dose" as the shorter **minimum** for IC / CSF leak / cochlear implant.
- **immunize.org Ask the Experts — Pneumococcal** (live 2026-10-10):
  > "…with PPSV23 typically given 1 year later (a minimum interval of 8 weeks may be
  > considered for people with immunocompromising medical conditions, cochlear implant or
  > cerebrospinal fluid leak)."

**What the app gets right — do not "fix" this half.** The job aid's *19–49* pages print the
minimum as the operative number, and the app matches them exactly:

| Job aid page | Group | Job aid says | App says |
|---|---|---|---|
| p2 | 19–49, immunocompromising | "PCV15 ≥8 weeks PPSV23" | ≥8 weeks ✓ |
| p3 | 19–49, cochlear implant / CSF leak | "PCV15 ≥8 weeks PPSV23" | ≥8 weeks ✓ |
| p4 | 19–49, chronic conditions | "PCV15 ≥1 year PPSV23" | ≥1 year ✓ |
| p1 | **≥50, all** | **"PCV15 ≥1 year† PPSV23"** | **≥8 weeks when IC/cochlear/CSF ✗** |

So the defect is exactly one cell: the app applies the 19–49 number to **every** adult age.

**Why P1 and not P0:** 8 weeks is an *allowable* minimum for these groups at any adult age,
so no invalid or unsafe dose results. What is wrong is the timing the clinician is told, and
the fact that the app states two different intervals for one patient.

**This touches a rule marked non-negotiable.** `CLAUDE.md` says:

> "**Adult PPSV23 Interval Is Risk-Class-Keyed** — Single source: `adultPpsvIntervalClass()`
> in `riskFactors.js`. IC/cochlear/CSF = ≥8 weeks; non-IC chronic = ≥1 year. Never hardcode
> the interval."

The rule has no age term, so the code is faithfully implementing it. **Amending that rule is
the owner's decision**; the clinical reading is not in doubt. Suggested shape:
`adultPpsvIntervalClass(riskIds, ageMonths)` → `'short'` only when `ageMonths < 600` **and**
IC/special, and card copy for ≥50 that reads "≥1 year (a minimum of 8 weeks may be used for
an immunocompromising condition, cochlear implant, or CSF leak)" so the option is not lost.

**Context, not authority:** ASCO's 2024 adult-cancer guideline also pairs PCV15 with PPSV23
at 8 weeks for adults with cancer. ASCO is not in the tier-1 group, but it shows 8 weeks is
normal practice for immunocompromised adults — which is why the fix should *surface* the
8-week minimum rather than delete it.

**Suggested fixtures:** 60y + HIV with a dated PCV15 → expect ≥1 year with the 8-week
minimum named; 30y + HIV, same history → expect ≥8 weeks (unchanged); 60y + diabetes →
≥1 year (unchanged).

## A-P1-2 — Adult recommendation cards cite the CDC *child* schedule notes

**Where:** `recommend.js:70-77` (`collectRefs`) + `riskFactors.js` — 13 of the 16 risk
factors list `cdcChildPneumo` in their `refs`, and `collectRefs` puts risk-factor refs
**first**, ahead of the pathway defaults.

So for any adult with a risk condition, the **first citation chip** on the card is
"CDC Child/Adolescent Notes", linking to the paediatric schedule.

**Observed** (engine run, today): 60y + HIV, 40y + diabetes, 60y + cochlear implant,
30y + CKD, 30y + HIV with PCV13+PPSV23 — all render
`CDC Child/Adolescent Notes | CDC Adult Notes | …`.

The recommendations themselves are correct; it is the "why" that points at the wrong page.
Citations are the app's evidence trail, so a clinician checking the basis of an adult
recommendation is sent to a document that does not contain it.

**Fix shape:** give each risk factor `pedsRefs` / `adultRefs`, or have `collectRefs` take
the active pathway and filter. **Feeds S8** (citation data + citation tests).

**Suggested fixture:** assert no adult rec's citations include `cdcChildPneumo`, and no
paediatric rec's include `cdcAdultPneumo`.

## A-P1-3 — A post-HSCT adult's card cites a children's document and a source the app itself marks superseded

**Where:** `riskFactors.js:78` — the `hsct` factor carries
`refs: ['p3086Table5', 'fredHutchLTFU']`, which `collectRefs` pulls onto the standard adult
card.

**Observed** — 60y, HSCT ticked, standard card citations:

```
Immunize.org Table 5 (HSCT) | Fred Hutch LTFU §IX (superseded) | CDC Adult Notes | …
```

Two problems in one line:

1. **`p3086Table5` is a children's document.** Verified live: p3086 is
   *"Standing Orders for Administering Pneumococcal Vaccines to **Children and Teens**"*
   (Item #P3086, 2/16/2026), and its Table 5 is titled *"…to any child **younger than age 19
   years** following a hematopoietic stem cell transplant"*. It is cited here on a
   60-year-old's card.
2. **`fredHutchLTFU` is superseded, and the file says so while shipping it.** `refs.js:116`
   and `:126` both assert it is "**kept for historical reference only; no active rec cites
   this**". That claim is **false** — every HSCT patient's standard card cites it. It is
   labelled in the UI as "Fred Hutch LTFU §IX (superseded)", so the clinician sees a
   citation chip that advertises its own obsolescence.

The adult **advisory** block is correctly cited to `ascoAdultCancer2024` — only the standard
card underneath is wrong.

**Fix shape:** split the `hsct` factor's refs by age pathway (peds → `p3086Table5`, adult →
`ascoAdultCancer2024`), then either drop `fredHutchLTFU` from `refs.js` or leave it with the
comment made true. Pairs with A-P1-2.

---

# P2 — citations, documentation, copy, structure

## A-P2-1 — `CLAUDE.md` names the wrong document for **both** HSCT sources

`CLAUDE.md`, under "HSCT Sources Are Fixed" — a section every session reads first:

> "Peds HSCT (<19y): **immunize.org p2016 Table 5 ONLY** — not CDC child notes."
> "Adult HSCT (≥19y): **Fred Hutch LTFU §IX ONLY** — label as institution-specific in UI copy."

Both are stale:

- **p2016 has no Table 5.** Verified live: the peds HSCT schedule is **p3086** Table 5
  (quoted verbatim below). `refs.js:80-88` already records this correction — `CLAUDE.md`
  never got it.
- **The adult row is no longer Fred Hutch.** Commit `077f01d` (2026-09-14) moved it to
  **ASCO 2024** by owner decision, and `refs.js:124-130` marks Fred Hutch superseded.

`refs.js`'s own header contradicts its own body too — lines 9-11 still say
"Adults ≥19y HSCT → Fred Hutch LTFU §IX (SOLE source)" while lines 112-123 say ASCO replaced
it.

Low clinical risk, high process risk: a future session following `CLAUDE.md` would fetch a
PDF that does not contain the table, or restore a superseded source.

## A-P2-2 — Three files hardcode the two boundary constants that `scheduleConstants.js` exists to centralize

`scheduleConstants.js`'s stated purpose is to "prevent the boundary-drift bug (H1) where the
engine and UI each hardcoded the 18y boundary independently, sometimes as 216 and sometimes
as 228", and it names its consumers. Three of them do not import it:

| File | Line | Literal | Should import |
|---|---|---|---|
| `src/components/StepHistory.jsx` | 11 | `>= 216` | `PCV21_MIN_AGE_M` |
| `src/components/Results.jsx` | 128 | `>= 216` | `PCV21_MIN_AGE_M` |
| `src/logic/format.js` | 45, 46 | `< 228`, `< 600` | `ADULT_SCHED_MIN_M` (+ a new `ROUTINE_ADULT_MIN_M`) |

Neither component imports from `scheduleConstants.js` at all. **The values are all correct
today** — this is the guard being documented but not wired. Full inventory in the census;
**S6's direct input.**

## A-P2-3 — The PCV21 geographic banner shows for patients whose actual recommendation never offers PCV21

`pcv21GeoNote(am, recs)` (`recommend.js:771-780`) scans the **standard** recs for a PCV21
brand. For a post-HSCT adult the live advice is the HSCT advisory (**PCV20 only**), and the
standard card is collapsed behind a `<details>` as reference — but the blue "PCV21
geographic note" banner renders **above** it, full width.

**Observed:** 30y HSCT+HIV and 60y HSCT both show the banner; their advisory never mentions
PCV21. Gate the banner on the recs actually being displayed as active.

## A-P2-4 — A post-HSCT patient's standard card calls them "no risk" / "healthy"

`hasAnyRisk()` deliberately excludes `class: 'hsct'` (it has its own pathway), so with HSCT
as the only tick:

- 30y → *"Not indicated (**no risk**, <50y)"*
- 10y → *"Not indicated (**healthy** 5–18y)"*

Both sit behind the collapsed "Standard age/history schedule (reference, applies after
completing the HSCT series above)", and the advisory above them is correct — so no wrong
dose follows. But describing a transplant recipient as healthy or at no risk is wrong on its
face, and this app's whole promise is that it does not say things that are not true.
Suggested copy: "Covered by the HSCT advisory above — the standard schedule adds nothing."

## A-P2-5 — `ckd_chronic` is a paediatric risk factor offered to adults, with no adult source

`riskFactors.js:134-138`: `ckd_chronic` ("Chronic kidney disease (not on dialysis / no
nephrotic syndrome)"), `class: 'nonIC'`, **`refs: ['cdcChildPneumo']`** — a child-only
citation, which is the authors' own signal.

- **For children it is right.** p3086 Table 3 lists "Chronic kidney disease (except as
  specified in the IC list)" among non-immunocompromising paediatric risk conditions.
- **For adults CDC has no such entry.** The adult IC footnote is "chronic renal failure,
  nephrotic syndrome, …" (both → the app's `ckd_advanced`, correctly IC), and the job aid's
  adult chronic-conditions list (p4) is "Alcoholism, Chronic heart disease…, Chronic liver
  disease, Chronic lung disease…, Cigarette smoking, Diabetes mellitus" — **no kidney entry
  at all**.

There is no `childOnly` mechanism — `StepRisks.jsx:33` filters on `adultOnly` only — so it is
offered to adults, and a 30-year-old whose sole tick is non-dialysis CKD gets
*"1 dose PCV (PCV20, PCV15, or PCV21)"*, `risk-based`, cited to the child notes.

**Over**-inclusion, clinically defensible, so P2 — but note it is the **mirror image of peds
`P0-3`** (an adult-only factor reaching a child), and one `childOnly` flag plus the
`StepRisks` filter fixes both directions. Fix them together.

## A-P2-6 — Two comments attribute PCV21's 18-year minimum to ACIP; ACIP says 19

- `brands.js:18` — "PCV21 product min age = 18y (216mo) per FDA label **+ ACIP mm7336a3**."
- `scheduleConstants.js:15-16` — "FDA label **+ ACIP vote mm7336a3** set this at ≥18y."

Verified live, mm7336a3: ACIP recommends **"PCV21 as an option for adults aged ≥19 years"**;
**≥18 years is the FDA approval**, not the ACIP recommendation. The code is right (see
"verified correct" #13) — the comments are not, and they are precisely the comments a future
session would read before touching the gate. Risk: someone lowers the *recommendation*
boundary to 216 believing ACIP endorses it, which the authority rule forbids (FDA never
overrides ACIP).

## A-P2-7 — The hard stop's single citation under-supports its breadth

`EXCLUSION_MESSAGE` (`recommend.js:788-795`) claims standard age-based logic "is not valid"
for HCT or CAR-T recipients and for patients with a B-cell malignancy or recent
B-cell-depleting therapy, cited solely to CDC's *Altered Immunocompetence* page.

Fetched live, that page supports individualized clinical judgment for HSCT revaccination
("Determination of the level of immune memory and the need for revaccination should be made
by the treating physician") and a ≥6-month deferral after anti-B-cell agents — but does not
state the broader claim for CAR-T or B-cell malignancy. The message already names ASCO,
NCCN, IDSA and CDC in prose; those should be real citations.

The hard stop **declines to advise**, so there is no safety exposure — this is citation
strength only, and the stop itself is the conservative choice.

## A-P2-8 — The hard stop zeroes the recorded-dose counts

`recommend.js:808-818` returns early with `perDose: { pcv: {}, ppsv23: {} }` and
`meta: { …, pcvCount: 0, ppsv23Count: 0 }` **without analysing history at all**. Observed: a
60-year-old with a PCV20 and a PPSV23 recorded reports `pcvCount: 0, ppsv23Count: 0`. The
exclusion screen replaces the cards so nothing is visibly wrong today, but any surface that
later reports "N doses recorded" from `meta` will under-report on excluded patients.

## A-P2-9 — Two owner decisions cite a decision record that is not in this repo

`recommend.js:733`, `refs.js:114` and `recommend.test.js:216` all cite
`docs/archive/fix-queue-2026-09-13-crossapp-hct-cart-parity.md` as the authority for the
ASCO switch and the GVHD removal. That path **has never existed in this repo's git history**.
The document is real — it lives in the sibling repo, at
`~/Downloads/vaxapp-main/docs/archive/fix-queue-2026-09-13-crossapp-hct-cart-parity.md`.

This repo already has the right pattern for exactly this
(`handoff-2026-09-12-hct-cart-bcell-hardstop-plan-POINTER.md`): a one-file pointer. Without
it, a session trying to confirm a settled decision finds nothing and may re-open it — the
failure mode `CLAUDE.md` explicitly warns against.

## A-P2-10 — The status chip reads "Complete" on a card that says "review at age 50"

For a 19–49 adult with a chronic condition who has had PCV13 + PPSV23, the engine returns
`status: 'complete'` with `doseLabel: "No dose now — review at age 50"`
(`recommend.js:680-685`). `RecCard`'s `STATUS_LABELS` maps `complete` → **"Complete"**, so the
chip and the label disagree on the same card.

The *advice* is correct and matches CDC verbatim (see "verified correct" #9). This is the
status vocabulary lacking a "nothing due now, revisit later" value. **Feeds S12** (status
labels).

## A-P2-11 — Year-and-longer intervals are fixed day counts; CDC specifies calendar months

`recommend.js:44-45` — `Y1 = DAYS.years(1)` → **365**, `Y5 = DAYS.years(5)` → **1826**.

CDC Adult Schedule Notes, "Additional Information", fetched live:

> "For calculating intervals between doses, 4 weeks = 28 days. **Intervals of ≥4 months are
> determined by calendar months.**"

So the 1-year and 5-year intervals should be calendar arithmetic. A fixed 365 is a day short
across a leap year, and 1826 is a day short of some 5-calendar-year spans, so
`earliestNextDate` can display a date 1–2 days early. CDC's own 4-day grace absorbs the
validity question, which is why this is P2 and not higher — but the *displayed date* is still
wrong, and the 4-week/28-day half of that quote is already how the app does `WK4`. **Feeds
S10**, with A-P0-1.

---

# Verified correct — 17 rules, each against a live quote

Recorded so no later session re-litigates them.

1. **19–49, no risk → not indicated.** The job aid has pages for 19–49 immunocompromising,
   cochlear/CSF, and chronic conditions — and none for no-risk adults under 50. Routine
   begins at 50.
2. **Routine threshold = 50y (600mo).** mm7401a1, live: *"On October 23, 2024, the Advisory
   Committee on Immunization Practices recommended a single dose of PCV for all adults aged
   ≥50 years"*, down from ≥65. The October 2024 vote pre-dates the stayed 2025 votes, so it
   stands.
3. **PCV20 or PCV21 in history → complete, at any age.** Job aid p1: *"PCV15 & PPSV23 OR
   PCV20 OR PCV21 at any age → No vaccines recommended; schedule is complete."* A PCV20 given
   in childhood correctly completes an adult.
4. **PCV15 + PPSV23 → complete, in either order.** Same row; and for the PPSV23-first order,
   the notes add *"If PCV15 is used, no additional PPSV23 doses are recommended."*
5. **PCV13 only → PCV20 or PCV21, ≥1 year, and no PCV15 option.** Notes: *"Previously
   received only PCV13: 1 dose PCV20 or 1 dose PCV21 at least 1 year after the last PCV13
   dose."* Job aid p1: *"PCV13 only at any age → ≥1 year PCV20 or PCV21 — **NO OPTION B**"*.
   The app's brand list is PCV20/PCV21 only. ✓
6. **PPSV23 only → PCV15, PCV20 or PCV21 ≥1 year after.** Notes verbatim; and the ≥1 year
   here is **not** risk-keyed in any source, so the hardcoded `Y1` at `recommend.js:626` is
   correct — the 8-week minimum applies only in the PCV15→PPSV23 direction.
7. **PCV13 + PPSV23 with PPSV23 before 65 → ≥5 years, firm recommendation.** Notes verbatim
   (quoted under A-P0-1). Job aid p1: *"PCV13 at any age & PPSV23 at <65 yrs → ≥5 years PCV20
   or PCV21."*
8. **PCV13 + PPSV23 with PPSV23 at ≥65 → shared clinical decision-making, ≥5 years.** Notes
   verbatim. Correct *as a rule*; A-P0-1 is about the boundary test, not the rule.
9. **19–49, chronic condition only, PCV13 + PPSV23 → nothing now, review at 50.** Notes:
   *"Alcoholism, chronic heart/liver/lung disease, cigarette smoking, or diabetes mellitus: no
   additional PCV or PPSV23 doses recommended at this time. Review pneumococcal
   recommendations when age 50 years or older."* The app's label is *"No dose now — review at
   age 50"*. ✓
10. **19–49, immunocompromising **or** cochlear/CSF, PCV13 + PPSV23 → ≥5 years.** Notes:
    *"Cochlear implant, cerebrospinal fluid leak, or an immunocompromising condition*: 1 dose
    PCV20 or 1 dose PCV21 at least 5 years after the last pneumococcal vaccine dose."* ✓
11. **Grouping cochlear implant and CSF leak with IC for the interval (`require8wk`) is
    right.** Neither appears in CDC's IC footnote, yet both are named alongside IC in the
    8-week parenthetical *and* grouped with IC in the 19–49 PCV13+PPSV23 row. The app's
    `'special'` class reproduces exactly that split — non-IC for the paediatric row, IC-like
    for the adult interval.
12. **PCV7 never counts.** immunize.org, live: *"doses of PCV7 should be ignored for the
    purposes of calculating the current pneumococcal vaccination needs"*, and such a patient
    should *"follow the vaccination recommendations for someone with their condition who has
    not received any doses of pneumococcal conjugate vaccine"*. The app drops PCV7 in
    `validate.js`, landing on the no-history row — which the notes confirm:
    *"Previously received only PCV7: follow the recommendation above."* ✓
13. **The two boundary constants are both correct and must stay separate.** mm7336a3 live:
    ACIP recommends PCV21 for **adults aged ≥19 years**, while FDA approved **≥18**. So
    `ADULT_SCHED_MIN_M = 228` correctly gates the *recommendation* (and CDC's adult notes
    confirm the schedule's own scope: *"Recommendations for Ages 19 Years or Older"*, with
    *"For vaccination recommendations for persons 18 years of age or younger, see the
    Recommended Child and Adolescent Immunization Schedule"*), and `PCV21_MIN_AGE_M = 216`
    correctly accepts a *recorded* dose given at 18 under the FDA label. An 18-year-old is on
    the child schedule and is correctly never offered PCV21. (Only the *comments* are wrong —
    A-P2-6.)
14. **The PCV21 geographic note's five regions are exact.** mm7336a3 names Alaska, Colorado,
    New Mexico, Oregon and the Navajo Nation as areas where serotype 4 causes ≥30% of
    invasive disease; the app names all five and no others. (*When* it shows is A-P2-3.)
15. **The paediatric HSCT recipe matches p3086 Table 5 word for word.** Source, live:
    > "4 doses of PCV20, beginning 3 to 6 months after HSCT: give 3 doses 4 weeks apart, then
    > a 4th dose at least 6 months after dose 3 and at least 12 months after HSCT"
    and footnote §: *"If PCV20 is unavailable: give 3 doses of PCV15, beginning 3 to 6 months
    after HSCT (administer 4 weeks apart), then give a dose of PPSV23 at least 12 months after
    HSCT."* The app's label and fallback note match. The GVHD clause in that footnote is
    **deliberately** omitted (owner decision 2026-09-13, commit `077f01d`: GVHD is unmodelled
    in all three apps) — **not a finding; do not re-open.**
16. **Precedence works as decided.** Hard stop beats HSCT: with both ticked, `recommend()`
    returns `excluded: true` and `hsct: null` (verified by running it) — matching the
    2026-09-12 owner decision that the stop wins and transplant advice is hidden rather than
    shown under a "does not apply" notice. Age-outer / risk-inner also holds: dispatch is
    `<24mo → pcvInfant`, `<228mo → pedsRiskRowClass ? pcvRiskChild : pcvHealthyChild`,
    `else pcvAdult`.
17. **Adults need no second PPSV23 — and that asymmetry with children is real.** CDC's
    risk-indications page, live, puts the "another pneumococcal vaccine at least 5 years
    later" rule on **children** (2–5 and 6–18 with immunocompromising conditions), with no
    adult equivalent; no adult row in the notes or the job aid mentions a second PPSV23. So
    `pcv.hasPCV15 && ppsvGiven → complete` is correct for adults **including** immunocompromised
    adults. This independently **corroborates peds `P0-1`** from a second document: p3086
    Table 4's IC rows carry *"at least 5 years later, give 1 dose of PCV20 or a second dose of
    PPSV23"*, and that row is paediatric-only.

---

# Reference sweep — all 18 refs (S8's input)

`lastVerified` and a quote are **recorded in `refs.js` for exactly one entry**
(`ascoAdultCancer2024`). The file header claims "All sources verified live 2026-06-06" as
prose. Below is this session's status; S8 should write `lastVerified` + `quote` onto each.

| Key | Verified live today | Vintage found | Note |
|---|---|---|---|
| `cdcAdultPneumo` | ✅ full text | July 2, 2025 schedule | Primary adult source. Stay banner captured. |
| `cdcAdultTimingJobAid` | ✅ full text (4 pp.) | March 2025 | Decisive on A-P1-1's age split. |
| `mmwr7401a1` | ✅ | ACIP vote 23 Oct 2024 | ≥65 → ≥50. |
| `mmwr7336a3` | ✅ | 2024 | PCV21 ≥19y (ACIP) vs ≥18y (FDA); 5 regions. |
| `mmwr7203a1` | ✅ | 8 Sep 2023 | Key points to `rr7203a1` — see naming note below. |
| `p3086Table5` | ✅ Table 5 verbatim | Item #P3086, **2/16/2026** | States it is consistent with the **AAP 2026** child schedule. |
| `immPneumo` | ✅ | n/a | PCV15→PPSV23 interval sentence. |
| `immPCV7` | ✅ | n/a | PCV7-ignored rule, verbatim. |
| `cdcRiskIndications` | ✅ partial | last reviewed n/a | Confirms the 2nd-PPSV23 rule is paediatric-only. |
| `cdcPneumoIndex` | ✅ partial | last reviewed 25 Feb 2026 | ≥50 routine. |
| `cdcAlteredImmunocompetence` | ✅ partial | n/a | Under-supports the hard stop — A-P2-7. |
| `ascoAdultCancer2024` | ❌ **blocked** | quote dated 2026-09-14 | See below. |
| `cdcChildPneumo` | — peds (S1) | July 2, 2025 | Out of S2 scope. |
| `p2016` | — peds (S1) | 2/16/2024 | Tables 1–4 only; **no Table 5** (A-P2-1). |
| `cdcCatchupJobAid` | — peds (S1) | Jan 2025 | Out of S2 scope. |
| `mmwr7239a5` | — peds (S1) | 2023 | PCV20 in children. |
| `mmwr7137a3` | ⬜ not fetched | 2022 | PCV15/PCV20 in adults; superseded in practice by rr7203a1. |
| `fredHutchLTFU` | ⬜ not fetched | superseded | Should be dropped or its comment made true — A-P1-3. |

**`ascoAdultCancer2024` could not be re-verified this session, and I am not claiming it
was.** `ascopubs.org` serves a Cloudflare bot check; bypassing bot detection is not something
I will do. The stored quote remains as recorded by the 2026-09-14 session, which verified it
live. Independent secondary summaries of the same guideline do corroborate the substance —
four doses of PCV20, startable as early as three months post-transplant. One honest caveat
for S8: ASCO's own windows are *4–6 months* (the US recommendation) and *after 3 months* (its
preferred earlier start), whereas the app's adult label reads *"beginning 3–6 months after
HSCT"* — wording identical to p3086's **paediatric** text. That identity is deliberate
(commit `077f01d` made the adult row state "the identical plan as the pediatric row"), so it
is a sourcing note, **not a finding**: S8 should simply make the stored quote and the label
line up visibly.

Also for S8: the key `mmwr7203a1` points at `/volumes/72/rr/rr7203a1.htm` — a
*Recommendations and Reports* article, not an `mm`-series one. Cosmetic, but the key reads
like a URL that does not exist.

---

# Recommended fix order

Not a change to the session plan — a suggestion, as the peds audit's was.

1. **A-P0-1 with peds `P1-1`, inside S10** (dates and ages). They are one root cause: no
   exact DOB reaches the engine. Thread the DOB through, compare calendar dates, and A-P2-11
   falls out of the same change. The peds audit already argued S10 should precede S3; this is
   a second, independent reason.
2. **A-P1-1** — needs the owner's sign-off to amend the `CLAUDE.md` interval rule first.
   Small and self-contained once decided (one function signature, one call site, two copy
   strings). The clinical reading is settled.
3. **A-P1-2 + A-P1-3 together, in S8** — one mechanism (refs split by age pathway) fixes
   both, and S8 already owns citation data and citation tests.
4. **A-P2-2 in S6**, which is the "one number, one home" refactor; the census is its input.
5. **A-P2-5 with peds `P0-3`** — one `childOnly` flag and one `StepRisks` filter close both
   directions of the same hole.
6. **The documentation set — A-P2-1, A-P2-6, A-P2-9 — in S13**, or earlier and cheaply: they
   are the findings most likely to cause a *future* wrong answer, because each one misdirects
   the next session. A-P2-9 is a single pointer file.
7. **A-P2-3, A-P2-4, A-P2-8, A-P2-10** — fold into the sessions that already touch those
   surfaces (S7 guards, S12 status labels).

**Nothing here blocks S3.** S3 needs intervals, and this audit supplies the adult ones
verbatim: 1 year (PPSV23→PCV, and PCV15→PPSV23 for ≥50 and for 19–49 chronic), 8 weeks (the
minimum for immunocompromising / cochlear / CSF, operative for 19–49), 5 years (after
PCV13 + PPSV23), the 4-day grace, and 4 weeks = 28 days with intervals ≥4 months counted in
calendar months.

---

## Stopping point

S2 is complete and read-only: every branch in scope was run and checked against a live
quote, the census is written, and the reference sweep is recorded with its one gap named. The
engine is byte-identical to `beec94b` and the suite is green at **156 / 11 files**. No code
was changed and nothing is half-done.

**Not verified visually:** `preview_start` was refused — port 5173 is held by another chat's
PneumoVax dev server, and per the queue's rule 6 I did not fall back to running a server
through Bash. Everything above is engine-level and was proven by running the engine, which is
stronger evidence than a screenshot for these claims; what remains unseen is only how the
cards look. The two that would benefit from two minutes of looking, once a slot frees:
A-P2-3 (the PCV21 banner sitting above a collapsed card) and A-P1-3 (the "superseded"
citation chip).
