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

**CDC vs immunize.org (owner decision, 2026-10-17).** Where a **current CDC page** and an
**older immunize.org handout** disagree and AAP is silent, **CDC governs** — and say both
documents' dates in the commit, the spec and the code comment, because the gap between
them is usually the explanation. Until today this was unranked and decided case by case;
FINDING A is what forced it (CDC's May 2026 risk-indications page against immunize.org
P2016 of 2/16/2024 — `CLINICAL_SPEC.md` §D-note). Before applying it, **check the older
document against itself**: P2016 turned out to contradict its own Table 4 row, which
settled the question far better than the date did.

### Three Schedule Constants — Never Collapse
`src/logic/scheduleConstants.js` exports three distinct constants:
- **`ADULT_SCHED_MIN_M = 228` (19y)** — schedule routing boundary (peds vs adult rulebook)
- **`PCV21_MIN_AGE_M = 216` (18y)** — PCV21 (Capvaxive) product min-age only
- **`ROUTINE_ADULT_MIN_M = 600` (50y)** — where routine (age-based) adult eligibility
  begins, whatever the risk factors; ACIP lowered it 65→50 eff. 2024-10-23 (mm7401a1).
  Added by S6-1 (2026-10-13) because `recommend.js` and `format.js` each held their own
  copy of `600`, so the engine could route a patient one way while the screen described
  them another.

These are separate clinical concepts. Never merge any of them into one constant.

### All Clinical Logic in the Engine
Product validity, the PCV15→PPSV23 requirement, the prior-vaccine matrix, and the PCV7-not-counted rule are computed in `recommend.js`. UI consumes pre-built recs. Do NOT re-derive clinical logic in components.

### A Card Credits Only The Documents That Speak For It
A card's grey source buttons are the card's **own** sources, not the pathway's. The adult
pathway holds `ADULT_DEFAULT_REFS` and each card asks through **`adultRefs(...)`** — never a
single list computed once and spread over every card, which is what made a card cite
documents nothing it said rested on (the owner's "I forget why there are multiple source
chips listed if its only citing one of them"). Each (document, statement) pair gets exactly
one of two outcomes, never a third — **cite it, or take it off that card** (OWNER DECISION
2026-10-17). **A removal is a clinical act: it goes to the owner per document before it
lands.** Only **document 2** (the CDC Adult Timing Job Aid) is signed off and applied;
documents 1, 3, 5 and 6 have proposed removals still waiting, and **doc 4 statement 1 is an
open owner decision she has asked not to be re-raised.** Readings, dispositions and counts:
`docs/archive/c7-2026-10-17-source-readings.md`. Measure with
`npx vite-node scripts/uncreditedSources.mjs` and `scripts/citationMapping.mjs` — never
quote a count from the log, which predates the IC-children fix and reads low.

Where a disposition splits by age, the predicate is the engine's existing `isOlderAdult`
(i.e. `ROUTINE_ADULT_MIN_M`). **Never a second age test** — a hand-typed `am >= 600` there
passed all 1,156 tests, so `regression-s6-1-routine-adult-age-one-home.test.js` now guards
the whole engine's source, not just the `M` table.

### PCV7 Never Counts
Recorded as `noncounting`, dropped from effective series. High-risk patients treated as PCV-naïve. Source: immunize.org Ask the Experts.

### Transplant Is A Hard Stop — Never Re-Add A Post-Transplant Schedule
Ticking `hct_cart_bcell_exclude` (hematopoietic cell transplant, CAR-T, B-cell malignancy or
B-cell-depleting therapy) **stops the engine**: `excluded: true`, `recs: []`, History step
skipped, and **not even the ordinary age-based schedule** the patient would get otherwise —
including one a *different* ticked risk factor would produce on its own. One row, one
`exclude: true` flag, one message naming ASCO/NCCN/IDSA/CDC **in words, linked to nothing**.
OWNER DECISION 2026-10-16; it retires the 2026-09-19 C2-6 fix and reverses the 2026-07
"standalone apps are advisory for HSCT pathways" decision.

**The reason is not that the advice was low value — it is that it could not be kept true.**
Across the two apps the post-transplant rule was wrong or half-applied **five times in five
weeks**. PneumoVax's own worst case: the adult row was ASCO 2024 in the code from 2026-09-14
while `CLINICAL_SPEC.md` §F, this file and the checkbox's citation chip all still said Fred
Hutch **32 days later** — and those are different schedules (4 doses from 3 months vs. 3
titer-gated doses from 6). Nothing in the suite could see it, because no test compares a
document's prose to a card's prose.

The retired schedules, verbatim with their citations:
`docs/archive/retired-2026-10-16-post-transplant-pneumococcal-schedules.md`. The decision and
its evidence: `docs/archive/plan-2026-10-16-transplant-hard-stop-both-apps.md`.

**Byte-identical to MeningoVax**, frozen by
`regression-2026-10-16-transplant-stop-mirrors-meningovax.test.js` — the row's id, label,
sublabel and flag, the whole message, the banner title, the recorded-doses line. Change the
wording in **both repos or neither**; never loosen that test to let one side move.

### PCV15 Always Requires PPSV23
`requiresPPSV23: true` in `brands.js`. Never emit a PCV15 rec without the PPSV23 follow-up path.

### Adult PCV15→PPSV23 Interval: ≥8 Weeks At 19–49 For IC / Cochlear / CSF, Else ≥1 Year

**OWNER DECISION 2026-10-16 (S15). Implemented.** This replaces both A-P1-1 (2026-10-10)
and the 2026-10-15 reversal banner that stood here.

| Adult | Recommended PCV15 → PPSV23 interval |
|---|---|
| **19–49** with an immunocompromising condition, cochlear implant or CSF leak | **≥8 weeks** |
| 19–49 with chronic conditions only | ≥1 year |
| **50+**, any risk class | ≥1 year, with 8 weeks **named as an option** |

**The governing sources are `mm7401a1` (ACIP, January 2025) and CDC's Adult Pneumococcal
Vaccine Timing Job Aid (NCIRD, March 2025).** Both read live 2026-10-16.
**`rr7203a1` (2023) is superseded — never cite it for an adult interval again.**

mm7401a1's clinical guidance table uses a **different verb per age band, and that
difference is the rule**: 19–49 IC/CSF/cochlear reads "If PCV15 is used, **administer** a
single dose of PPSV23 **≥8 weeks** after the PCV15 dose"; ≥50 reads "should be administered
**≥1 year** … A minimum interval of 8 weeks **can be considered**". The job aid renders the
same split — inline on pp. 2–3, as footnote † on p. 1.

The owner was shown both readings — follow ACIP's wording, or flatten to 8 weeks for that
risk class at every adult age — with the patient count for each, and chose the wording.
**Do not extend the 8 weeks to 50+ without a new owner decision**: ACIP prints it as an
option there, so the app would state as advice what its own citation offers as a choice.
**Do not re-flatten it either.** Single source: `adultPpsvRecommendedInterval()` and
`adultPpsvShorterMinimumOffered()` in `riskFactors.js`. Never hardcode the interval, and
never add a second age test — the boundary is `ROUTINE_ADULT_MIN_M`.

**Two findings in `docs/archive/plan-2026-10-15-adult-interval-risk-class-audit.md` are
OBSOLETE** — both came from rr7203a1, and the current sources contradict them. The app was
already right on both; **do not "fix" either**:
- *"PCV13→PPSV23 is 8-week keyed too"* — no. Every current source gives PCV13 only →
  PCV20 or PCV21 at ≥1 year, and the job aid prints **"NO OPTION B"** on all four pages.
- *"cochlear implant / CSF leak are NOT IC-equivalent for the second PPSV23"* — no. Current
  guidance groups all three and gives **PCV20/PCV21 at ≥5 years**, not a second PPSV23.

**S14-7's separation of recommendation from validity still stands, unchanged.** The
**floors** for a dose *already given* key on risk class with **no age term** — 8 weeks for
IC / cochlear implant / CSF leak, the year for every other adult — and remain an **OWNER
CLINICAL DETERMINATION of 2026-10-11**, reconfirmed 2026-10-16. Recommendation and floor
are different questions; do not let one answer stand in for the other. Also confirmed
already correct and not to be changed: a dose given too early is rejected and the next one
is anchored to the **last valid dose**, not to the rejected one.


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
re-runs the engine over **16,008 patients a clinician could really enter**;
`sweep-record-problem-corpus.test.js` re-runs it over **17,652 impossible ones** — a dose
dated before the patient was born, or dated after today. Either fails if an answer differs
from its committed corpus. **Do not run `npm run sweep:update` (which regenerates both) until
you can say why those patients should get a different answer**, then put both moved counts in
the PR. This exists because peds `P0-2` and `ANCHOR-1` each moved thousands of verdicts while
all three PneumoRecs harnesses stayed byte-identical. New sweeps build on `src/test-grid.js`
— never a second case list.

**Why the impossible entries are a second FILE and not more rows in the first** (owner
decision, 2026-10-12): so 16,008 keeps meaning "real patients", and a clinical change that
moves 300 of them reads as 300 lines rather than 300 lost among 23,000 impossible records.
The main grid *discards* 15,340 before-birth combinations on one line and cannot express a
future date at all, so both record-problem rules were guarded by nothing: deleting
`isBeforeBirth()` left the main sweep green 12/12, and so did disabling `futureDated()`.
Against the second corpus the same two mutations moved **14,304** and **1,980** when that
was measured, of the 18,460 rows the corpus held then. (Both corpus SIZES above were
re-counted from the committed files on 2026-10-17 and corrected here — they had drifted.
The two mutation figures are left as measured and not rescaled.)
**Add a rule to `recordProblemFor()` → add its shape to `GRID_FUTURE_*` in the same commit.**

### Every Quote Names The Patient It Was Written About
`rulebook` (child / adult / any) keeps a child's source off an adult's card. It cannot see
the two splits CDC's pages — and this engine — actually turn on: a child's
**immunocompromising** list vs the one that is not, and an adult's **Routine 50+** vs
**Special situations 19–49**. So every QUOTED entry in `refs.js` also declares
**`population`**, and `regression-2026-10-17-every-quote-names-its-patient.test.js` fails if
a card shows a quote to anyone else. Quote-free entries declare none — a document has no
patient.

**It records who the sentence is ABOUT, not which block it was printed in** (owner decision
2026-10-17). The two usually agree; where they differ the sentence wins, and the entry's
comment says why. Recording provenance instead would have marked **4,639 correct showings
wrong** — `adultPcv20or21Complete` is printed under Special situations and says "Adults aged
19 years and older"; CDC's at-risk rows start at age 2, so `pedsRoutine4Dose` is an at-risk
baby's series too.

A card may quote another group's rule **deliberately** — to state a boundary, or to say what
the patient is not — via `cite(key, { aboutAnotherGroup: 'why' })`. There are exactly four
(`adultRoutine50`, `adultBothNotAt65`, `cdcChildSpecialSituations`, `immPCV7`) and the set is
pinned by name, as is the set of sources spanning more than one group. **Never widen a
source's `population` to make a wrong quote legal** — that is the one mutation that made the
sweep go quiet, which is why both lists are pinned. Fix the call site instead.

### Every Interval Rule Lives In One Table
`src/logic/doseIntervalRules.js` holds every gap-between-recorded-doses rule. `validate.js` calls `evaluateDoseInterval()` once per dose and owns **no** interval logic.

Each row declares **`rulebook`** (child / adult / any — which schedule states it, so which number and which citation apply) and **`enforcement`** separately: `'floor'` voids the dose and gets CDC's 4-day grace; `'recommendation'` keeps the dose and adds a note, no grace; `'none'` is never flagged, with the reason written down. **Never add an age test that decides whether a rule may bite** — that was the S14-RC root cause, and three adult gaps fell in the hole it left. Add a row instead.

⚠️ **EVERY adult floor is an OWNER CLINICAL DETERMINATION dated 2026-10-11 — never cite ACIP or CDC for one.** The *intervals* are ACIP's (rr7203a1 keys both PCV13→PPSV23 and PCV15→PPSV23 at 8 weeks for an immunocompromising condition / cochlear implant / CSF leak and 1 year otherwise); treating them as floors is not. Watch ACIP's vocabulary: "**minimum recommended** interval" is the shortest *recommended* spacing, **not** the General Best Practices "minimum interval" that voids a dose. rr7203a1's 8 weeks is explicitly something that "can be considered… to minimize the time of risk" — permission to vaccinate sooner. CDSI v4.64 sets `absMinInt = 0 days` for every adult pneumococcal interval and the current adult MMWRs never say a short gap means repeat the dose; the owner was shown that and reaffirmed. Rows carry `authority: 'OWNER'` and the app's own per-dose text says so. Full evidence and the enumerated rows: `CLINICAL_SPEC.md` §K.

### dateUtils.js Is Mirror-Synced
`dateUtils.js` is identical across PneumoVax and MeningoVax **apart from the `L2 MIRROR NOTE` comment, which exists only in PneumoVax's copy** (measured 2026-10-13: that comment is the only difference; zero lines of code differ). If you change it here, apply the same change to MeningoVax.

Since S6-4 a test enforces this: `regression-s6-4-avg-days-per-month-one-home.test.js` compares the two files comment-stripped and fails on any code divergence. It is **skipped, not failed**, when the sibling repo is not checked out, because CI clones only this repo — so a local run is what catches drift. Note the two apps *use* the shared file differently and that is fine: PneumoVax calls only `DAYS.weeks`, while MeningoVax uses `DAYS.months` (17×) and `DAYS.years` (12×). PneumoVax deliberately moved its month/year comparisons onto the calendar-exact helpers.

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
