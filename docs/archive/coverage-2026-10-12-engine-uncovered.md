# P2-9 — What the engine never executes (2026-10-12)

The deliverable the ledger asked for: coverage tooling, then **the list of what
`recommend.js` and `validate.js` never run during the suite**, as the input to deciding
where the next tests go.

Run it yourself:

```bash
npm run test:coverage
```

## The numbers, as measured

Suite: **585 passing / 50 files**. Coverage scoped deliberately to the two files that
decide what a clinician is told — everything else is UI or data.

| File | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| `recommend.js` | 100% | 96.57% | 100% | 100% |
| `validate.js` | 98.86% | 88.63% | 95.45% | 98.86% |

**No threshold is enforced, on purpose.** A coverage percentage is not evidence a rule is
right — the peds `P0-2` bug sat inside fully-covered lines. Read the list below, not the
number.

## What this already found and fixed

`validate.js` held **two dead functions**, `fmtDays()` and `fmtDayCount()`, both
unreachable and both duplicated verbatim in `doseIntervalRules.js` (its own lines 103 and
111). They format the sentence that tells a clinician how long a gap was — stranded in the
one file this repo's rules say must own **no** interval logic, since S14-7 moved every
interval message into the table. **Deleted**, with a note in their place saying where to
reach instead.

## Still uncovered — the list

### 1. `validateHistory()` — exported, called by nothing

`validate.js:653`. An exported wrapper around `analyzeHistory().perDose`. No source file
calls it and no test covers it. **Not deleted here**: removing an export changes the
module's public contract, which is a judgment call rather than dead-code cleanup. Decide
whether it is a supported entry point or a leftover of the pre-`analyzeBoth` API.

### 2. Two real clinical branches: an UNDATED dose below the minimum age

These have clinician-facing wording that no test has ever rendered:

| Where | The branch |
|---|---|
| `validate.js:228` | A **PCV** dose with no date, where the patient's *current* age is already below the product's minimum. "A past dose cannot have been given later than today, so it could not have been given at a valid age." |
| `validate.js:275` | The same for **PPSV23** and its 2-year floor. |

The reasoning is sound — current age is an upper bound on age-at-administration — but it is
untested in both streams. **This is the highest-value gap on the page**, because it is the
only uncovered code that produces a verdict a clinician reads.

Noticed while reading it: `validate.js:274` still hardcodes `const minAgeM = 24; // ≥2
years`, its own second copy of PPSV23's 2-year floor, which `recommend.js` knows as
`M.m24`. That is the open `P2-12` item (one-number-one-home), recorded here because this is
where it is visible.

### 3. The rest — defensive fallbacks, not clinical paths

The remaining uncovered branches are null-guards and formatter arms that no realistic input
reaches. Listed for completeness so a later session does not re-derive the triage:

**`recommend.js` (11 branches)** — `resolveRefs(o.refs ?? [])` (L87), the risk-ref merge's
`?? []` (L95), a plural-vs-singular arm (L356), the `|| anchorPneumo` fallback in the
5-year second-PPSV23 path (L598, L665), a `dueState` vs `dueStateMonths` arm (L798), an
empty-dates guard (L964), the PCV21 geo-advisory's `(r.brands || [])` (L1016), and the
entry point's `?? []` / `?? 0` input defaults (L1049, L1054).

**`validate.js` (25 branches)** — `fmtAgeM`'s null and before-birth arms (L69, L70, L79),
`fmtMinAge`'s year/week/month arms (L94, L99, L101), the `reasonCites` guard (L113), the
`beforeBirth` label fallback (L130), cross-stream `?? []` filters (L265, L266, L304, L305,
L359), the same-day PCV-before-PPSV23 tiebreak arm (L545), and the input-normalising `??`
defaults in `analyzeHistory` / `analyzeBoth` (L592, L627, L628, L632).

Several of these are reachable only by calling the engine with malformed input, which the
UI cannot produce. Covering them would raise the percentage and prove nothing — which is
the reason there is no threshold.

## Suggested order for Phase 3

1. The two undated-below-minimum-age branches (§2) — real verdicts, real wording, no test.
2. Decide `validateHistory()`'s fate (§1).
3. Leave §3 alone unless a specific bug points at one.
