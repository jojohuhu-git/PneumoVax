# PneumoVax number census — every age, interval and series total

> **PARTLY CLOSED (2026-10-13) by S6-1 and S6-2.** Re-measure before trusting any count
> below; several moved in this document's favour. Closed so far:
> **`600`** (routine adult age) now has one home, `ROUTINE_ADULT_MIN_M` — census step 3.
> **`216`** no longer has a hand-typed copy in either dose editor — census step 2's
> component half, and the misleading `isAdult` name is gone with it.
> **`24`** (PPSV23 min age) was already closed earlier by queue `P2-12`, not by S6 —
> census step 4 needs no work. **`30.4375`** is down to **3** live copies, not the 6 this
> document claims; the rest are comments about past bugs.
> Still open: the `30.4375` export (step 1), the `M`-table aliases and dead `m16`
> (step 5), and the ~58 interval prose strings (step 6, deliberately deferred by the
> owner on 2026-10-13 so a verdict change cannot hide behind a tidy-up).

**Written:** 2026-10-10 (S2) · **Repo state:** `main` @ `beec94b`
**Purpose:** S6's input — the "one number, one home" refactor. For every clinical number in
the app: what it means, where it lives, and **how many independent copies exist**.
**Companion:** `audit-2026-10-10-pneumovax-clinical-adult.md` (finding **A-P2-2** is this
census's headline).

Counts below are from `src/`, excluding `__tests__`. "Copies" means **independent
definitions a change would have to touch** — a site that imports a shared constant is not a
copy.

---

## Summary — what needs fixing, in one table

| Number | Meaning | Independent copies | Verdict |
|---|---|---|---|
| `30.4375` | days per average month | **6** | ⚠️ worst offender; a unit, not a rule |
| `216` | PCV21 product min age (18y) | **3** (1 shared + 2 literals) | ⚠️ the drift guard is bypassed |
| `228` | adult schedule boundary (19y) | **2** (1 shared + 1 literal) | ⚠️ same |
| `600` | routine adult start (50y) | **2** literals, no shared constant | ⚠️ needs a home |
| `24` | PPSV23 min age (2y) | **2** literals | ⚠️ needs a home |
| `60` / `72` | 5y / 6y peds gates | 1 home, but **aliased twice each** | ⚠️ cosmetic, confusing |
| `780` | shared-decision age (65y) | 1 | ✅ |
| `132` | display band only (10y) | 1 | ✅ |
| `56` / `28` / `365` / `1826` | 8wk / 4wk / 1y / 5y intervals | 1 each | ✅ (but see A-P2-11) |
| interval **prose** | "≥8 weeks", "≥1 year", … | **~58 hand-written strings** | ⚠️ the real sync risk |

Nothing in this census is a wrong answer today. Every value is clinically correct as of
2026-10-10. The risk is **drift**: the numbers that exist in more than one place are the ones
a future change will desynchronize, and `CLAUDE.md` already records that this exact bug (H1)
happened once with `216`/`228`.

---

## 1. Age boundaries

### `216` — PCV21 product minimum age (18 years)

Canonical home: `src/logic/scheduleConstants.js:29` → `export const PCV21_MIN_AGE_M = 216`.

| Site | How | Status |
|---|---|---|
| `src/logic/validate.js:39` | `const Y18_MONTHS = PCV21_MIN_AGE_M` | ✅ imports |
| `src/data/brands.js:113` | `minAgeM: PCV21_MIN_AGE_M` | ✅ imports |
| `src/components/StepHistory.jsx` | `meetsPcv21MinAge = ... >= PCV21_MIN_AGE_M` | ✅ imports (S6-2) |
| `src/components/Results.jsx` | `meetsPcv21MinAge = ... >= PCV21_MIN_AGE_M` | ✅ imports (S6-2) |

**Closed by S6-2 (2026-10-13).** Both literals were **correct** (they gate the PCV21
option in the dose-entry dropdown, a product-licence question, so `216` was the right
number) — but neither component imported from `scheduleConstants.js` at all, while that
file's header already named "StepHistory/Results PCV21 age gate" as consumers. Both now
import it, and the gate is called `meetsPcv21MinAge`: the old name `isAdult` described a
different clinical number entirely, since the adult SCHEDULE begins a year later at 228.
That was the live hazard — the next person needing an adult/child test would have reused
the flag and routed every 18-year-old down the adult schedule.

### `228` — adult schedule boundary (19 years)

Canonical home: `src/logic/scheduleConstants.js:26` → `export const ADULT_SCHED_MIN_M = 228`.

| Site | How | Status |
|---|---|---|
| `src/logic/recommend.js:39` | `y18: ADULT_SCHED_MIN_M` in the `M` table | ✅ imports |
| `src/components/StepRisks.jsx:15` | `>= ADULT_SCHED_MIN_M` | ✅ imports |
| `src/logic/format.js:45` | `if (am < 228) return 'Adolescent (11–18y)'` | ❌ **literal, no import** |

`scheduleConstants.js` names "format.js ageGroup" as a consumer. It is not one.

Verified correct live (2026-10-10): CDC's adult schedule is titled *"Recommendations for Ages
19 Years or Older"* and directs *"For vaccination recommendations for persons 18 years of age
or younger, see the Recommended Child and Adolescent Immunization Schedule"*. The 19y
boundary and its separation from the 18y product gate are both right — see the audit's
"verified correct" #13. **Never collapse these two constants** (`CLAUDE.md`).

### `600` — routine adult pneumococcal start (50 years)

**No shared constant exists.** Two independent literals:

| Site | How |
|---|---|
| `src/logic/recommend.js:39` | `y50: 600` inside the `M` table (the engine's only home) |
| `src/logic/format.js:46` | `if (am < 600) return 'Adult (19–49y)'` |

Source verified live: ACIP voted **23 October 2024** to recommend a single PCV dose for all
adults aged ≥50 (mm7401a1), down from ≥65. Pre-dates the stayed 2025 votes, so it stands.

**S6 suggestion:** this deserves a named export beside the other two — e.g.
`ROUTINE_ADULT_MIN_M = 600` — because it is a third distinct clinical concept (routine start),
not a variant of either boundary. It is the one most likely to move next if ACIP revisits the
age.

### `780` — shared clinical decision-making age (65 years) ✅

One site: `src/logic/recommend.js:39` (`y65: 780`), read once at line 663. Single home, no
duplication. (The *comparison* that uses it is defective — audit **A-P0-1** — but the number
is in one place.)

### `132` — display band boundary (11 years) ✅

One site: `src/logic/format.js:44`. Display-only ("Child (2–10y)" vs "Adolescent (11–18y)"),
no clinical meaning, correctly not in `scheduleConstants.js`.

### `24` — PPSV23 minimum age (2 years)

**Two independent literals for the same clinical rule:**

| Site | How |
|---|---|
| `src/data/brands.js:129` | `minAgeM: 24, // ≥2 years` on `PPSV23_PRODUCT` |
| `src/logic/validate.js:130` | `const minAgeM = 24; // ≥2 years` |

The validator re-declares a minimum the product catalogue already owns. `validate.js` should
read `PPSV23_PRODUCT.minAgeM` (it already imports from `brands.js` for other purposes).

### `60` and `72` — the 5-year and 6-year paediatric gates

One home each (`src/logic/recommend.js:38-39`) ✅ — but **aliased**, which is its own trap:

```js
m2: 2, m7: 7, m12: 12, m16: 16, m24: 24, m60: 60, m72: 72,
y2: 24, y5:  60, y6:  72, y18: ADULT_SCHED_MIN_M, y50: 600, y65: 780,
```

`m24`/`y2` are both `24`; `m60`/`y5` are both `60`; `m72`/`y6` are both `72`. Three values
with two names apiece. A later edit to `y6` that misses `m72` would silently split a boundary
in half. **`M.m16` is dead** — defined on line 38 and read nowhere in `src/` (verified
2026-10-10); delete it.

`72` is the clinically load-bearing one: the "received PCV only before age 6 years" gate at
`recommend.js:403-418`.

---

## 2. Intervals

All four live in one place each, `src/logic/recommend.js:42-45`:

| Constant | Value | Means | Source status |
|---|---|---|---|
| `WK8` | 56 d | 8 weeks | ✅ CDC: "4 weeks = 28 days" basis |
| `WK4` | 28 d | 4 weeks | ✅ CDC verbatim |
| `Y1` | 365 d | 1 year | ⚠️ should be calendar — **A-P2-11** |
| `Y5` | 1826 d | 5 years | ⚠️ same |

Derived from `DAYS` in `src/logic/dateUtils.js:44-48` (`years: y => Math.round(y * 365.25)`).

CDC Adult Schedule Notes, live 2026-10-10: *"For calculating intervals between doses, 4 weeks
= 28 days. **Intervals of ≥4 months are determined by calendar months.**"* So `WK4`/`WK8` are
right and `Y1`/`Y5` should be calendar arithmetic. Impact is a displayed
`earliestNextDate` 1–2 days early; CDC's 4-day grace absorbs the validity question. See
**A-P2-11**.

⚠️ **`dateUtils.js` is mirror-synced byte-for-byte with MeningoVax and vaxapp** (`CLAUDE.md`).
Any change to `DAYS` must be applied to all three repos. Prefer adding a calendar helper in
`recommend.js` over editing `DAYS`, unless the sibling apps want it too.

### `30.4375` — days per average month: **6 independent copies, the worst in the app**

| Site | Use |
|---|---|
| `src/logic/dateUtils.js:46` | `DAYS.months(m)` |
| `src/logic/format.js:57` | `dobToAgeMonths` — DOB → float months |
| `src/logic/validate.js:44` | age-at-dose for validation |
| `src/logic/validate.js:66` | months → weeks, for min-age message copy |
| `src/logic/recommend.js:100` | `summarizePcv` age banding |
| `src/logic/recommend.js:662` | age-at-PPSV23 for the 65y test — **A-P0-1** |
| `src/data/brands.js:41` | `PCV_MIN_AGE_M = 42 / 30.4375` (ACIP 6 weeks) |

A unit conversion, not a clinical rule, so it belongs in `dateUtils.js` as a named export
(`DAYS_PER_MONTH`) — subject to the mirror-sync rule above. Note that **two of these six
sites disagree on method**: `recommend.js:100` and `validate.js:44` divide without rounding,
while `recommend.js:662` wraps the result in `Math.round()`. That inconsistency is the direct
cause of A-P0-1, so S6 and S10 should land this one together.

---

## 3. Series totals

No duplication. Computed once and passed down:

- `pcvSeriesShape(pcv, am, total)` — `src/logic/recommend.js:168-172` — returns
  `{ seriesTotal, primaryTotal }`, splitting the booster off the primary series.
- Called at `recommend.js:244` and `:262` (the infant pathway only).
- Carried through `rec()` (`:63-64`) and consumed for display by
  `src/components/RecCard.jsx:56, 85-91, 207-208` — "Dose N of M" and the
  "Primary series" / "Boosters" headings (owner decision 2026-09-15).
- Both are deliberately `null` on cards whose total counts a different set of doses than the
  list shows, so the list renders ungrouped rather than showing a mismatched denominator
  (`rec()`'s comment, `RecCard.jsx:82-83`).

✅ Structurally sound. **But the paediatric audit's `P0-2` found the infant *total itself* is
wrong in 5 of 14 p2016 Table 1 cells** — the plumbing is fine, the input number is not. Fixing
`P0-2` needs no census work.

### Product counts

`src/data/brands.js` — one entry per product, each the single home for its own flags
(`counts`, `requiresPPSV23`, `completesSeries`, `minAgeM`, `maxAgeM`). `maxAgeM: 999` repeats
6× as a sentinel for "no upper limit"; harmless, though a named `NO_MAX_AGE_M` would read
better. ✅ No clinical duplication.

---

## 4. The real sync risk: interval numbers written into prose

Constants are nearly clean. The **clinician-visible text** is not — intervals are hand-typed
into `doseLabel` and `note` strings:

| Phrase | Occurrences in source | In comments | Clinician-visible |
|---|---|---|---|
| "8 weeks" | 31 | 4 | **27** |
| "5 years" | 12 | 0 | **12** |
| "12 months" | 13 | 4 | **9** |
| "1 year" | 13 | 5 | **8** |
| "4 weeks" | 7 | 1 | **6** |
| "3–6 months" | 5 | 0 | **5** |

≈ **58 hand-written interval strings**, confined to just two files — `src/logic/recommend.js`
and `src/data/riskFactors.js` (the sublabels). Containment is good news for S6; the count is
not.

**This is not hypothetical.** Audit **A-P1-1** is exactly this failure: `ppsvIntervalLabel`
derives "8 weeks" from the risk class, while the ≥50 no-history note at `recommend.js:705`
hardcodes "≥1 year" — so one patient is told both numbers, one step apart. A single
interval-to-prose formatter, fed by the same constant that drives `minIntervalDays`, would
have made that impossible.

**S6 suggestion:** a small helper (e.g. `intervalPhrase(days)` → "8 weeks" / "1 year" /
"5 years") used by every label and note, so the displayed words and the computed
`minIntervalDays` cannot diverge.

---

## 5. Where the numbers come from (traceability)

Every value above was checked against a source fetched live on 2026-10-10. Full quotes are in
the audit; the mapping:

| Number | Source |
|---|---|
| 228 (19y) | CDC Adult Schedule Notes — scope line, and the child-schedule referral |
| 216 (18y) | FDA PCV21 label; **ACIP mm7336a3 says ≥19y** — see **A-P2-6** |
| 600 (50y) | mm7401a1, ACIP vote 23 Oct 2024 |
| 780 (65y) | CDC Adult Notes — the two PCV13+PPSV23 rows; job aid p1 |
| 24 (2y) | PPSV23 ≥2 years |
| 72 (6y) | CDC risk-indications "received PCV only before age 6 years"; p3086 Table 4 |
| 56 (8wk) | CDC Adult Notes minimum for IC / cochlear / CSF; p3086 Tables 1–4 |
| 28 (4wk) | CDC Adult Notes "4 weeks = 28 days"; p3086 Table 1 footnote † |
| 365 (1y) | CDC Adult Notes — PCV15→PPSV23 and PPSV23→PCV |
| 1826 (5y) | CDC Adult Notes — PCV13 + PPSV23 rows |
| 42 d (6wk) | ACIP minimum age for conjugate PCVs |

---

## 6. Recommended order for S6

1. **`30.4375` → one export**, and settle the rounding question with S10 / **A-P0-1**. Highest
   duplication *and* the only one already causing a wrong answer.
2. **Wire the three bypassed boundary literals** (`StepHistory.jsx:11`, `Results.jsx:128`,
   `format.js:45`) — **A-P2-2**. Pure mechanical change, no behaviour shift, and it restores
   the guard `scheduleConstants.js` exists to provide.
3. **Add `ROUTINE_ADULT_MIN_M = 600`** and point `recommend.js` and `format.js` at it.
4. **Point `validate.js:130` at `PPSV23_PRODUCT.minAgeM`** instead of its own `24`.
5. **De-alias the `M` table** (`m24`/`y2`, `m60`/`y5`, `m72`/`y6`) and delete the dead `m16`.
6. **`intervalPhrase(days)` for the ~58 prose strings** — do this *after* A-P1-1 is decided,
   so the helper is built against the corrected rule rather than refactored twice.

Steps 2–5 are behaviour-preserving and should leave all 156 tests green untouched. Steps 1 and
6 change observable output and need the usual per-item workflow.
