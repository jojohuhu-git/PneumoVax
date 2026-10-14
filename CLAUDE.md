# PneumoVax Agent Guide

## What This App Is

Standalone client-side React SPA for **pneumococcal** vaccine clinical decision support (PCV15/PCV20/PCV21/Capvaxive + PPSV23) across the full lifespan (infants → adults). No backend, no auth, no DB. Sibling of MeningoVax; independent codebase that mirrors MeningoVax's architecture.

## Start Here

```bash
npm install
npm run dev        # dev server on /PneumoVax/
npm test           # Vitest run
npm run build      # production build to dist/
```

Dev server config: `.claude/launch.json` ("PneumoVax dev server").

All public asset paths MUST use `import.meta.env.BASE_URL` (Vite sets `base: '/PneumoVax/'`).

The save-time guardrail (flags stray top-level notes — see Root Directory Hygiene) turns on automatically during `npm install`. If a session finds it off (e.g. a freshly re-downloaded copy), re-run `npm install` or `npm run prepare` to switch it back on, and remind the owner.

Also read before changing any rule: `CLINICAL_SPEC.md` (every rule with source citations).

## Source of Truth Files

| What | Where |
|---|---|
| Plain-English folder guide (owner is a non-coder) | [MAP.md](MAP.md) |
| Architecture, file map, engine API, schedule constants | [docs/agent/architecture.md](docs/agent/architecture.md) |
| Pneumococcal clinical rules, product semantics, HSCT | [docs/agent/clinical-rules.md](docs/agent/clinical-rules.md) |
| Test files and coverage requirements | [docs/agent/testing.md](docs/agent/testing.md) |
| PneumoRecs comparison harnesses (dev-only) | `scripts/{adult,peds,hsct}Cases.mjs` |
| Session history (2026-06-07 through 2026-06-12) | [docs/archive/agent-session-log.md](docs/archive/agent-session-log.md) |

## Non-Negotiable Rules

### Root Directory Hygiene
Only `CLAUDE.md`, `MAP.md`, `README.md`, and `CLINICAL_SPEC.md` live at the repo root (`CLINICAL_SPEC.md` stays — code/test comments cite it by that path). Never create new root-level `.md` files. Session notes/handoffs/reviews go to `docs/archive/`; comparison scripts go to `scripts/`. Keep `MAP.md` current when folders change.

### Clinical Authority
ACIP/CDC/AAP/immunize.org over FDA package inserts. Sources per topic are in `CLINICAL_SPEC.md`.

Within that group, AAP is a tiebreak, not a ranking (owner decision, 2026-08-10): where ACIP/CDC and AAP agree, cite either; where they disagree, AAP governs; never adopt a CDC revision recommending fewer doses or narrower eligibility than AAP; where AAP is silent, CDC/MMWR stands.

### Two Boundary Constants — Never Collapse
`src/logic/scheduleConstants.js` exports two distinct constants:
- **`ADULT_SCHED_MIN_M = 228` (19y)** — schedule routing boundary (peds vs adult rulebook)
- **`PCV21_MIN_AGE_M = 216` (18y)** — PCV21 (Capvaxive) product min-age only

These are separate clinical concepts. Never merge them back into one constant.

### All Clinical Logic in the Engine
Product validity, the PCV15→PPSV23 requirement, the prior-vaccine matrix, and the PCV7-not-counted rule are computed in `recommend.js`. UI consumes pre-built recs. Do NOT re-derive clinical logic in components.

### PCV7 Never Counts
Recorded as `noncounting`, dropped from effective series. High-risk patients treated as PCV-naïve. Source: immunize.org Ask the Experts.

### HSCT Sources Are Fixed
- Peds HSCT (<19y): **immunize.org p2016 Table 5 ONLY** — not CDC child notes.
- Adult HSCT (≥19y): **Fred Hutch LTFU §IX ONLY** — label as institution-specific in UI copy.

### PCV15 Always Requires PPSV23
`requiresPPSV23: true` in `brands.js`. Never emit a PCV15 rec without the PPSV23 follow-up path.

### Adult PCV15→PPSV23 Interval Is ≥1 Year, With 8 Weeks Named As An Option
**Amended 2026-10-10 by owner decision (A-P1-1).** The previous rule ("risk-class-keyed: IC/cochlear/CSF = ≥8 weeks; non-IC chronic = ≥1 year") had no age term and substituted the minimum *for* the recommendation.

When PCV15 is used it is followed by PPSV23 **≥1 year later**, for **every adult (19+)**, and the series is then complete. The **8-week minimum may be *considered*** for an immunocompromising condition, cochlear implant, or CSF leak — the app **names** that option in the note and never silently substitutes it. Single source: `ADULT_PPSV23_INTERVAL_MONTHS` + `adultPpsvShorterMinimumApplies()` in `riskFactors.js`. Never hardcode the interval.

CDC's adult schedule notes print this sentence identically under *both* "Age 50 years or older" and "Age 19–49 years…", so there is no age split. CDC's Timing Job Aid shows a flat "8 weeks" on its 19–49 pages; that is a per-page simplification and the schedule notes govern.

`adultPpsvShorterMinimumApplies()` answers the **interval** question only. Do not reuse it to decide which CDC *row* a patient is on — the predicate it replaced did both jobs, and that coupling is why flattening the interval nearly moved 19–49 cochlear/CSF patients off the "≥5 years" row onto "review at 50".

**S14-7 (2026-10-11) added a second, separate job for the same two numbers: validity.** The ≥1 year above is still what the app **recommends**, unchanged. A dose that was *already given* inside the interval is now judged against a **floor** — 8 weeks for IC / cochlear implant / CSF leak (CDC's own words), the year for every other adult (owner determination). Recommendation and floor are different questions; do not let one answer stand in for the other.

### The Rulebook Is `CLINICAL_SPEC.md`, And A Test Holds It To The Code
`CLINICAL_SPEC.md` is the rulebook (owner decision, S8, 2026-10-11) — the one document
stating every clinical rule with its source. `docs/agent/*.md` summarise and point; they may
leave a rule out, never contradict it. §K's **"The rule table, row by row"** mirrors
`DOSE_INTERVAL_RULES` exactly, and `rule-docs-match-code.test.js` compares the two cell by
cell on every run. **Change a rule row → update that table in the same commit.** The same
test fails if any doc names a function or constant deleted from `src/` — the tell shared by
all four stale copies of the pre-A-P1-1 adult interval.

### A Verdict That Moves Must Be Explained
TWO corpora, both built from `src/test-grid.js`, both gates. `sweep-verdict-corpus.test.js`
re-runs the engine over **16,250 patients a clinician could really enter**;
`sweep-record-problem-corpus.test.js` re-runs it over **17,485 impossible ones** — a dose
dated before the patient was born, or dated after today. Either fails if an answer differs
from its committed corpus. **Do not run `npm run sweep:update` (which regenerates both) until
you can say why those patients should get a different answer**, then put both moved counts in
the PR. This exists because peds `P0-2` and `ANCHOR-1` each moved thousands of verdicts while
all three PneumoRecs harnesses stayed byte-identical. New sweeps build on `src/test-grid.js`
— never a second case list.

**Why the impossible entries are a second FILE and not more rows in the first** (owner
decision, 2026-10-12): so 16,250 keeps meaning "real patients", and a clinical change that
moves 300 of them reads as 300 lines rather than 300 lost among 23,000 impossible records.
The main grid *discards* 15,340 before-birth combinations on one line and cannot express a
future date at all, so both record-problem rules were guarded by nothing: deleting
`isBeforeBirth()` left the main sweep green 12/12, and so did disabling `futureDated()`.
Against the second corpus the same two mutations move **14,304** and **1,980** of 17,485.
**Add a rule to `recordProblemFor()` → add its shape to `GRID_FUTURE_*` in the same commit.**

### Every Interval Rule Lives In One Table
`src/logic/doseIntervalRules.js` holds every gap-between-recorded-doses rule. `validate.js` calls `evaluateDoseInterval()` once per dose and owns **no** interval logic.

Each row declares **`rulebook`** (child / adult / any — which schedule states it, so which number and which citation apply) and **`enforcement`** separately: `'floor'` voids the dose and gets CDC's 4-day grace; `'recommendation'` keeps the dose and adds a note, no grace; `'none'` is never flagged, with the reason written down. **Never add an age test that decides whether a rule may bite** — that was the S14-RC root cause, and three adult gaps fell in the hole it left. Add a row instead.

⚠️ **EVERY adult floor is an OWNER CLINICAL DETERMINATION dated 2026-10-11 — never cite ACIP or CDC for one.** The *intervals* are ACIP's (rr7203a1 keys both PCV13→PPSV23 and PCV15→PPSV23 at 8 weeks for an immunocompromising condition / cochlear implant / CSF leak and 1 year otherwise); treating them as floors is not. Watch ACIP's vocabulary: "**minimum recommended** interval" is the shortest *recommended* spacing, **not** the General Best Practices "minimum interval" that voids a dose. rr7203a1's 8 weeks is explicitly something that "can be considered… to minimize the time of risk" — permission to vaccinate sooner. CDSI v4.64 sets `absMinInt = 0 days` for every adult pneumococcal interval and the current adult MMWRs never say a short gap means repeat the dose; the owner was shown that and reaffirmed. Rows carry `authority: 'OWNER'` and the app's own per-dose text says so. Full evidence and the enumerated rows: `CLINICAL_SPEC.md` §K.

### dateUtils.js Is Mirror-Synced
`dateUtils.js` is byte-for-byte identical across PneumoVax and MeningoVax. If you change it here, apply the same change to MeningoVax.

## Testing Expectations

- When changing a rule: update `CLINICAL_SPEC.md`, the engine, and the test.
- At least one test per `CLINICAL_SPEC.md` § sub-section.
- When changing `scheduleConstants.js`: verify both constants remain distinct and all consumers import the right one.
→ See [docs/agent/testing.md](docs/agent/testing.md)

## Documentation Maintenance

| Content type | Destination |
|---|---|
| Current commands, required workflow, short non-negotiable rules | Root `CLAUDE.md` (this file) |
| Architecture, engine API, file map, schedule constants | `docs/agent/architecture.md` |
| Pneumococcal clinical rules with source citations | `docs/agent/clinical-rules.md` + `CLINICAL_SPEC.md` |
| Test files, coverage requirements, key invariants | `docs/agent/testing.md` |
| Dated "session changes" / "changes shipped" history | `docs/archive/agent-session-log.md` |
| Handoffs, reviews, finished plans | `docs/archive/` |
| Comparison/verification harnesses | `scripts/` |
| Plain-English folder explanations for the owner | `MAP.md` |

Do not add dated session logs, implementation narratives, or stale local paths to this file.
