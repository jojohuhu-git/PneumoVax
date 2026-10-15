# PneumoVax — Testing Reference

## Framework

- **Vitest** — `npm test` = `vitest run`
- **Coverage** — `npm run test:coverage` (P2-9, 2026-10-12). Scoped to `recommend.js` and
  `validate.js` only, and **no threshold is enforced on purpose**: a percentage is not
  evidence a rule is right (peds `P0-2` lived inside fully-covered lines). Read the
  uncovered-line list. The standing report is
  [docs/archive/coverage-2026-10-12-engine-uncovered.md](../archive/coverage-2026-10-12-engine-uncovered.md).
- All tests run in the default `node` environment
- Test files live in `src/logic/__tests__/` and `src/components/__tests__/`

## Test Files

| File | What it covers |
|---|---|
| `src/logic/__tests__/recommend.test.js` | Engine unit tests — all rec paths, every p2016 Table 4 row, both HSCT pathways, adult history × interval, PCV7-ignored, PCV21 geo, multi-condition precedence |
| `src/logic/__tests__/validate.test.js` | Dose validation — PCV7 noncounting, PCV21 child invalid, min ages, intervals |
| `src/logic/__tests__/regression-boundary-and-fixes.test.js` | Two-boundary split (ADULT_SCHED_MIN_M vs PCV21_MIN_AGE_M), infant booster H5, at-risk peds M1/M2/M3, ageGroup L1; incl. 18y0m/18y6m/19y0m boundaries |
| `src/components/__tests__/App.test.jsx` | Wizard render/flow tests |
| `src/data/__tests__/citation-freshness.test.js` | **The citation freshness tripwire (P2-8).** Every entry in `refs.js` must carry a real, non-future `lastVerified` date no more than 12 months old. Reads the REAL clock via `vi.getRealSystemTime()`, with a guard-on-the-guard that fails if anything fakes it — ported before `P2-1` pins a suite-wide clock, because a pinned clock would freeze this check silently. Caught on its first run: CDC had moved `cdcAlteredImmunocompetence`, and the old URL only still worked through a redirect. |
| `src/logic/__tests__/regression-p6-3c-verdict-citations.test.js` + `src/components/__tests__/regression-p6-3c-verdict-citations-ui.test.jsx` | **P6-3c — the first per-dose verdict citations.** `immPCV7` on the PCV7 "does not count" verdict, `pedsMinAge` on the minimum-age verdicts. The control is the half that matters: PCV21's 18 years cites **nothing**, because `pedsMinAge`'s sentence states only 6 weeks and 2 years, and a source attached to a claim it does not support is worse than no source. The UI half asserts the marker becomes a numbered link and that raw `[c]` never reaches a clinician. Mutation-proven three ways (citation unwired; the quote put back to its dead-deep-link form; `minAgeCites` made unconditional). |
| `src/data/__tests__/citation-orphans.test.js` | **The citation orphan tripwire (P2-8).** An entry in `refs.js` that no source file names is either a rule that lost its citation or a source left behind by a deleted rule. A **static** check, deliberately — a sweep-based version could not tell "nothing names it" from "a rule names it but no grid patient reaches it", and reported `pedsNoPcv20IfComplete` (cited twice in `recommend.js`) as an orphan. Exceptions live in `KNOWN_UNCITED` and must carry a reason; the test also fails on a stale exception. |
| `src/data/__tests__/regression-p6-3-cite-and-highlight-url.test.js` | `cite()` / `highlightUrl()`; the one-`#`-fragment rule for quote deep links |
| `src/components/__tests__/regression-p6-3-note-citations.test.jsx` | `[c]` → numbered superscripts; per-card numbering in reading order; dedupe by page; orphan markers dropped |
| `src/logic/__tests__/regression-p6-3b-note-cite-parity.test.js` | Engine-wide sweep: marker/citation parity and no dead refs. **Counts notes and verdicts separately — a combined total once hid a sweep walking zero verdicts** |
| `src/components/__tests__/regression-p6-4-note-lead-and-detail.test.jsx` | `{lead, detail}` + "Why this"; one citation list spanning both halves |
| `src/components/__tests__/regression-p6-5-one-history-walk.test.jsx` | Results reads the engine's `perDose`; `perDose` is an array on every path |
| `src/logic/__tests__/regression-p0-ordered-doses-pair-with-verdicts.test.js` | `orderedDoses[i]` is the dose `perDose[i]` was computed for, over all 16,250 grid patients; date order; array on the hard stop |
| `src/components/__tests__/regression-p0-row-order-ui.test.jsx` | A history typed newest-first shows each verdict on its own dose row, oldest first, with D1/D2 following |
| `src/logic/__tests__/regression-p1-3-blank-row-is-not-a-dose.test.js` | A row nobody typed in is not a dose; a `detailsUnknown` row is; the stamped PPSV23 product is not an answer |
| `src/components/__tests__/regression-p1-3-blank-row-is-not-a-dose-ui.test.jsx` | The "dose given, details unknown" tick; "Recorded doses (N)" counts doses not rows; blanks swept on leaving, never while editing |
| `src/components/__tests__/regression-p6-6-toggle-labels.test.jsx` | Header toggles keep their label; no "Done" |
| `src/components/__tests__/regression-p6-7-current-risk-disclaimer.test.jsx` | The current-risk-only caveat, and that the engine really behaves as it claims |
| `src/components/__tests__/regression-p7-2-no-inline-styles.test.js` | Tripwire: no inline styles or hex literals (the regression MeningoVax has) |
| `src/components/__tests__/regression-p3-9-risk-age-note.test.jsx` | `RiskAgeNote` on both surfaces; keyed to `ADULT_SCHED_MIN_M`, not the 18y product gate |
| `src/logic/__tests__/regression-p0-2-peds-series-total-and-interval.test.js` | p2016 Table 1's series total in **all 14 cells**; the never-event sweep (no "dose N of M" with N > M, the old "dose 5 of 4"); the advised interval per CDC Catch-up Table 2 dose by dose, incl. the pair that proves a single age key cannot work; that the validity floor did **not** move; that the note never contradicts the computed total |
| `src/logic/__tests__/regression-p1-0-recorded-dose-intervals.test.js` | Minimum intervals between recorded doses: PCV→PCV (4/8 weeks, keyed on the earlier dose), PCV→PPSV23 (8 weeks + same-visit), PPSV23 dose 2 (5 calendar years); the grace on each; invalid doses anchor, PCV7 does not; **and that adult doses are left alone** |
| `src/logic/__tests__/rule-docs-match-code.test.js` | **The document-versus-code tripwire (P2-7).** Parses the 16-row table in `CLINICAL_SPEC.md` §K and compares it to `DOSE_INTERVAL_RULES` cell by cell — interval, enforcement, authority, rulebook, anchor. Every expected value is read out of the code, so no number in the test is transcribed. Also asserts the invariants the prose states: no adult floor may cite ACIP or CDC, only paediatric floors cite CDC, a never-flagged row carries no interval, and the 4-day grace tracks enforcement. **Proven by mutating all 16 rows × 3 fields: before it, 4 mutations passed silently; after it, 0 do.** |
| `src/components/__tests__/regression-future-dose-chip-says-in-the-future.test.jsx` | **The dose chip for a future date** (owner decision, 2026-10-12). A child 6y9m today with a dose dated 05/01/2030 read "age 10 years 4 months" — the age they WILL be. Now "In the future". Controls: an ordinary past dose keeps its age, a dose dated TODAY keeps its age, and a before-birth dose still reads "age Before birth" (P3-6's wording is not restyled). **Note the two traps this file documents**: the fixture carries a risk factor because a card with nothing to do collapses (queue P1-2) and renders no dose list; and assertions read `container.textContent`, not `getByText`, because the chip line is split across child elements — a regex matcher finds nothing there, which made one negative assertion pass while the card still printed the string it claimed was gone. |
| `src/components/__tests__/regression-history-step-warns-on-impossible-dates.test.jsx` | **The history step says so as the date is typed** (owner decision, 2026-10-12). Typing 05/01/2030 into a dose row used to show nothing while the AGE step already stopped you dead on the identical slip. Asserts the warning appears for a future date and a before-birth date, on both PCV and PPSV23 rows, on the offending row ONLY, and NOT for an ordinary past date, a date of TODAY, or an undated row; that it works with no date of birth on file; and that nothing is disabled (warn, do not trap). **The drift guard is the one that matters:** for every shape it asserts `dateEntryWarning(...).kind` equals the `recordProblem` the engine reports for the same row, so the step and the results card cannot disagree. |
| `src/logic/__tests__/regression-duplicate-row-is-a-record-problem.test.js` | **One shot on two rows, and two brands on one day.** Same product (or one row with no brand) on one date -> record problem `duplicate`, with the interval wording and the due date proved GONE. Two different named products on one date -> verdict and S14-4C's wording unchanged, plus a "check the record" sentence, including the child shape S14-4C never reached. Controls: a PCV and a PPSV23 sharing a date stay two real doses; a genuinely-too-close pair keeps the interval wording (W1 not reopened); matching is against doses that COUNTED, not every row walked (PCV7); undated rows are never duplicates. |
| `src/logic/__tests__/sweep-record-problem-corpus.test.js` | **The impossible-entry sweep gate (owner decision, 2026-10-12).** Re-runs the engine over `buildRecordProblemCases()`'s 18,460 synthetic patients whose record holds a dose dated **before birth** or **after today**, and requires it to reproduce `__corpus__/record-problem-corpus.tsv` exactly. Its lines carry an extra `RP=` field — which KIND of record problem each dose was judged to be — so "the rule fired" can be told from "the rule fired for the wrong reason" (the PCV21-licence misblame). A second FILE rather than more rows in the main corpus so 16,250 keeps meaning "real patients". **Measured: deleting `isBeforeBirth()` leaves the main sweep green 12/12 and moves 14,304 of 17,485 here; disabling `futureDated()` leaves it green and moves 1,980; narrowing `<=` to `<`, so a dose given today is refused, moves 1,224 (that one the main sweep also catches).** Carries its own anti-vacuity guards: no overlap with the main grid, pinned clock, every graded case contains a refused dose, both kinds reached, a dose dated TODAY still counts, the future shapes span one day and a year out both alone and beside a real dose, and every age and risk profile is swept. |
| `src/logic/__tests__/regression-s6-4-avg-days-per-month-one-home.test.js` | **The averaged month has one home (S6-4).** `dateUtils.js`, `validate.js` and `brands.js` each wrote `30.4375` out; it is now `AVG_DAYS_PER_MONTH`, exported from `dateUtils.js` (MeningoVax's own name for it). Naming it matters beyond duplication: it is an APPROXIMATION whose misuse is already on the record in that file's comments, and one word makes every remaining use of the rough ruler greppable. Asserts the constant, that `DAYS.months` and `PCV_MIN_AGE_M` derive from it, that the sub-2-month minimum still reads "6 weeks" (derived from `PCV_MIN_AGE_DAYS / 7`, not typed), and that no file writes the number out again. **Also the FIRST guard on the dateUtils.js mirror** — CLAUDE.md requires it byte-identical across both apps and nothing checked it; this compares the two files comment-stripped, so the sanctioned mirror-note difference is automatic. Skipped, not failed, when the sibling repo is absent (CI clones one repo). **Measured: restoring the bare literal in `validate.js` fails 1 of 8; changing `weeks: (w) => w * 7` to `* 7.0` in one repo only fails 1 of 8 on the mirror guard.** |
| `src/logic/__tests__/regression-s6-3-no-dead-age-bands.test.js` | **No dead or duplicated age bands (S6-3).** `recommend.js`'s `M` table held thirteen thresholds, five referenced nowhere: `m2`, `m16`, and the three aliases `y2` (= `m24`), `y5` (= `m60`), `y6` (= `m72`). The aliases were the hazard — a reader cannot tell whether `y2` and `m24` are one rule written twice or two rules sharing a number today, so changing "the 2-year threshold" means guessing which name it travels under. Asserts generically, not by name (a test naming the five would guard nothing once they are gone): **no** entry may be unused, and **no two** entries may hold the same number. Carries an anti-vacuity guard, since a renamed table would make the parsing match nothing and pass silently. **Measured: adding `y2: 24` back fails 2 of 3.** |
| `src/logic/__tests__/regression-s6-1-routine-adult-age-one-home.test.js` | **The routine-adult age (50y) has one home (S6-1).** `recommend.js`'s `M.y50` and `format.js`'s `ageGroup()` each held their own `600`; both now read `ROUTINE_ADULT_MIN_M`. Asserts the constant exists, that all THREE schedule constants stay distinct, that the displayed age band turns over exactly at the constants, and — the guards that bite — that neither `ageGroup()` nor the engine's age-band table writes `228`/`600` out by hand. **Measured: restoring the bare `600` in `format.js` fails 1 of 5; setting the constant to 660 (age 55) moves 569 of 16,250 real patients and 112 of 18,460 impossible entries, all at exactly age 50, from "due" to "risk-based"** — which is the evidence the constant drives the clinical decision and is not merely imported. |
| `src/components/__tests__/regression-s6-2-pcv21-age-gate-one-home.test.jsx` | **The PCV21 age gate has one home, on BOTH editors (S6-2).** Both dose editors opened `const isAdult = (ageMonths ?? 0) >= 216` — a hand-typed copy of `PCV21_MIN_AGE_M`, under a name that describes a DIFFERENT clinical number (the adult schedule starts a year later, at 228). Asserts the dropdown offers PCV21 at exactly the product floor and hides it a month below, on the history step AND the Results inline editor, plus the case that matters: an 18-year-old is offered Capvaxive while still being scheduled as an adolescent. Source guards, rewritten by S9 when the gate moved into `brands.js`'s `pcvHistoryProductsFor()`, now say the stronger thing: NEITHER component — nor the shared `DoseEditor.jsx` — names `PCV21_MIN_AGE_M`, types a bare `216`, or uses the name `isAdult`, and the gate is computed in exactly one place from the constant. Every behavioural test is unchanged across that move, which is what says the extraction did not change the gate's ANSWER. **Measured: gating on `ADULT_SCHED_MIN_M` instead — the realistic mistake, which would deny every 18-year-old Capvaxive — fails 4 of 15, on both surfaces. Hand-typing `216` back into the gate fails 1 of 15.** |
| `src/components/__tests__/regression-s9-one-dose-editor.test.jsx` | **The recorded-dose editor exists ONCE (S9 / P4-1).** The editor was written out in full in both `StepHistory.jsx` and `Results.jsx`, which is why `S6-2`, `P1-3` and `S11` each had to be fixed twice — and the two copies HAD drifted: the wizard rendered Date then Product, the Results panel rendered Product then Date. Source guards (comment-stripped) hold that the row markup lives only in `DoseEditor.jsx`, that neither caller hand-writes a dose row, and that the PPSV23 product value and key come from `PPSV23_PRODUCT` rather than being typed out. Behavioural tests assert, on BOTH surfaces: Date before Product on both streams, each label pointing at its own box with no id collisions (`S11` must survive the merge — MeningoVax's own `DoseEditor` has bare labels and that regression must not be imported), the details-unknown tick appearing exactly when the row holds nothing the clinician typed — whose condition legitimately DIFFERS per stream, because a PPSV23 row is born carrying the product the app stamped on — and add/remove. **Measured, five mutations: re-inlining a dose row into `Results.jsx` fails 8 of 28; putting Product before Date again fails 4 of 28 (now on BOTH surfaces at once, which is the point); collapsing the per-stream tick condition fails 4 of 28; stripping `htmlFor` from the labels fails 15 of 35 across this file and the `S11` one.** |
| `src/logic/__tests__/sweep-verdict-corpus.test.js` | **The sweep gate (S8).** Re-runs the engine over `src/test-grid.js`'s 16,250 synthetic patients and requires it to reproduce `__corpus__/verdict-corpus.tsv` exactly. A moved verdict fails the suite with the count and a before/after sample; `npm run sweep:update` regenerates it and prints how many moved, which belongs in the PR. **Measured: reverting ANCHOR-1 moves 180 cases; overstating the infant series total by one moves 1,128 — both were invisible to the three PneumoRecs harnesses.** Carries its own anti-vacuity guards (grid size, pinned clock, verdict variety, hard stop and HSCT reached, rejected doses produced, half the interval rules and ≥1 adult floor fired, every risk group and recordable product covered). |

## Coverage Requirements

- When changing a rule: update `CLINICAL_SPEC.md`, the engine (`recommend.js`), and the test.
- **At least one test per `CLINICAL_SPEC.md` § sub-section** — every Table 4 row, both HSCT pathways, every adult history branch × interval.
- When changing `scheduleConstants.js`: verify the three constants (`ADULT_SCHED_MIN_M`, `PCV21_MIN_AGE_M` and `ROUTINE_ADULT_MIN_M`) remain distinct and that all consumers import the right one.
- When changing `dateUtils.js`: apply the same change to MeningoVax (mirror-synced).
- **When changing any row of `doseIntervalRules.js`: update the table in `CLINICAL_SPEC.md` §K in the same commit.** `rule-docs-match-code.test.js` fails until you do, and names the row and the field.
- **When the suite reports moved verdicts, do not regenerate the corpus until you can say why they moved.** `npm run sweep:update` is for a change you meant to make; the count it prints goes in the pull request description. This gate exists because two changes (peds `P0-2` and `ANCHOR-1`) each moved thousands of verdicts past byte-identical harnesses.
- **A rule added to `recordProblemFor()` needs a shape in `GRID_FUTURE_*` in the same commit**, or it ships guarded by nothing — which is exactly what happened to both existing record-problem rules.
- **Build new sweeps on `src/test-grid.js`, not a new case list.** S7's four invariant sweeps (never-events, two-run relations, dose-counter, grid-covers-the-app) share this grid, or "the sweeps cover every risk factor" stops being checkable.

## Key Invariants to Test

1. **PCV7 never counts** — dropped from effective series, treated as PCV-naïve.
2. **PCV21 for child (<228m) → INVALID** — not just excluded from recs but flagged in validation.
3. **Two-boundary separation** — `ADULT_SCHED_MIN_M=228` for schedule routing; `PCV21_MIN_AGE_M=216` for product min-age only. Test both 18y-something and 19y patients.
4. **Completed infant series → Option A/B, not a 5th dose** — 4-dose-completed 24–71mo at-risk child must fall through to PCV20-or-PPSV23 block.
5. **Band-based counting** — `band.ge24` progress, not total dose count, for 24–71mo catch-up.
6. **PCV13+PPSV23 shared-decision** — date-driven (age at PPSV23, not current age); fallback to current age only when undated.
7. **Adult PPSV23 interval** — **≥1 year for EVERY adult 19+**, with 8 weeks *named* as a
   minimum that may be considered for an immunocompromising condition, cochlear implant or
   CSF leak. Source: `ADULT_PPSV23_INTERVAL_MONTHS` + `adultPpsvShorterMinimumApplies()` in
   `data/riskFactors.js`.
   *(Corrected 2026-10-10, S13. This line previously read "IC/cochlear/CSF = ≥8wk; non-IC
   chronic = ≥1y. Source: `adultPpsvIntervalClass()`" — that was the rule BEFORE the owner's
   A-P1-1 amendment, and `adultPpsvIntervalClass()` no longer exists. See `CLAUDE.md`.)*
8. **The 8-week option must be in the note's `lead`, not its `detail`** — P6-4 put the note
   behind a "Why this" disclosure, and a rule that is only *named* behind a click is not
   named. `regression-a-p1-1-*` asserts against `lead` specifically.
9. **Every `[c]` marker has exactly one citation** — across both halves of a note, and
   across a verdict's whole `reasons` array. Swept engine-wide by
   `regression-p6-3b-note-cite-parity`.
10. **Recorded-dose intervals are enforced, and only where a source states a minimum**
    (S3, queue P1-0). Two halves, and a test that only checks the first half will let the
    second rot:
    - *It bites.* A PCV series at 2, 2.5, 3 and 3.5 months keeps **one** dose, not four.
      An invalid dose still **anchors** the next one, because CDC spaces a repeat dose from
      the dose it repeats — so three bad gaps invalidate three doses, not two.
    - *It does not over-reach — but "over-reach" changed meaning in S14-7.* Adults are no
      longer exempt from interval verdicts; they have their own rows with their own
      numbers. What must still never happen is the paediatric WORDING on an adult's dose
      (no "same visit", no "8 weeks" for a non-IC adult) — `regression-p1-0-*` asserts
      that, and `regression-s14-7-*` asserts the adult rows produce their own messages.
11. **Every interval rule lives in one table, and no age test decides whether a rule may
    bite** (S14-7). `regression-s14-7-one-rule-table` is the guard file. Six of its
    assertions are "nothing is wrong" guards; each was confirmed to fail with the fault
    introduced on purpose (see *Prove a new guard can fail* below):
    - the child and adult PPSV23-revaccination rows read the **same** constant — if they
      diverge, someone has re-introduced an age-keyed interval;
    - every `authority: 'OWNER'` row says "OWNER CLINICAL DETERMINATION 2026-10-11" and
      "not ACIP, not CDC" in its own source text, and no `'CDC'` row claims to be the
      owner's;
    - floors carry the 4-day grace, recommendations never do;
    - none of the five deleted functions reappears in `validate.js`;
    - `validate.js` imports no interval minimums (they belong to the table);
    - `ADULT_SCHED_MIN_M` appears in `doseIntervalRules.js` exactly twice outside comments —
      the import, and the one comparison inside `rulebookOf()`.
12. **An adult dose that keeps `earlyAdvisory` still COUNTS** (S3-N1, narrowed by S14-7).
    Most adult gaps now void the dose; the flag survives for the two cases where the dose
    genuinely counts (the legitimate 8-week option, and a pair no enumerated row names).
    Where it appears it is a flag on a `'valid'` result, never a status: `status` stays
    `'valid'` and `effectiveDoseNum` is still assigned. (Named `earlyAdvisory`, not
    `offWindow` — S14-3 — because "off-window" is MeningoVax's name for a dose that does
    NOT count.) `regression-s3-n1-*` asserts that explicitly, and those assertions are what
    should stop a future change promoting it to a status of its own.
    **Test the wiring, not just the unit.** The unit tests passed `riskIds` straight into
    `analyzeHistory` and stayed green while `recommend.js` was not forwarding it at all —
    so every adult was judged against the flat 1-year advice and an immunocompromised
    patient who had legitimately used the 8-week option was told their dose was early.
    Driving the running app is what caught it. The `riskIds actually reach the validator`
    block goes through `recommend()` for exactly that reason; verified it fails without
    the forwarding line.
13. **An extra PCV dose after the series completed does not extend it, and is adults
    only** (S14-4). `regression-s14-4-extra-dose` keeps both halves live: *it bites* (a
    PCV21 given after a completing PCV20 gets `extraDose: true`, `effectiveDoseNum: null`,
    dropped from `effective`, not graded against `earlyAdvisory`); *it does not over-reach*
    (the identical history pattern in a child — PCV20 as an early infant dose, another PCV
    dose still due — keeps counting normally, because `completesSeries` means "no PPSV23"
    for a child, not "no more doses"). Gated on the CURRENT dose's age vs.
    `ADULT_SCHED_MIN_M`. **This check runs AFTER the interval table**, so a dose the table
    voids reads `invalid`, not "extra" — which is why its fixture has to space the doses
    more than a year apart now that the adult PCV13→PCV20 gap is a floor.
    **S14-4B (2026-10-12) adds the PPSV23 half**, in
    `regression-s14-4b-ppsv23-extra-dose.test.js` (logic) and
    `regression-s14-4b-ppsv23-extra-dose-ui.test.jsx` (UI). The UI half matters more than
    usual here: every patient this rule touches has a `complete` or `not-indicated` card,
    and RecCard collapses those by default — so the test has to OPEN the card, exactly as a
    clinician does, or it proves nothing. Its verdicts come from `recommend()`, never from
    hand-written fixtures. Both files carry the control case the bug was really about: the
    PPSV23 that COMPLETED a PCV15 series must keep reading "Dose 1", because before S14-4B
    the two rendered identically.

## Prove a new guard can fail

Twice in S13 a test passed while testing nothing: five `RiskAgeNote` "no note here" cases
passed before the component existed, and the citation sweep read dose verdicts from the
wrong property and walked **zero** of them while still reporting green.

So for any test whose assertion is "nothing is wrong" — an empty-array expectation, a
`queryBy*` returning null, a sweep over generated cases — **introduce the fault on purpose
and watch it go red** before trusting it. Where a sweep counts what it visited, count each
*kind* separately: a combined total lets one kind fall to zero unnoticed.
