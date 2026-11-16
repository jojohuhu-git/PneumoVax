# MeningoVax port — Handoff after Phase 2.1, the rule table (2026-11-15)

Repos: `/Users/joannehuang/Downloads/MeningoVax-main` (the work) and
`/Users/joannehuang/Downloads/PneumoVax` (this file and the plan,
`docs/archive/plan-2026-11-08-meningovax-port.md`). Read each repo's `CLAUDE.md` first.
MeningoVax is live at https://jojohuhu-git.github.io/MeningoVax/ and is iCloud-synced: commit
early, re-apply an edit that "disappears".

**Supersedes** `handoff-2026-11-15-meningovax-stop-b-answered.md` (banner added).

## Branches and PRs

| Repo | Branch | Commit | State | Suite |
|---|---|---|---|---|
| MeningoVax | — | `f7c8b24` on `main` | #85 (CDC gate) **merged** 2026-11-16 03:04 UTC | 1,697 / 143 at session start (verified) |
| MeningoVax | `feature/2026-11-15-port-2-1-rule-table` (pushed) | `50ed11f` + a merge of `main` (no file changed by it) + a docs-status commit | **PR #86** against `main`, waiting for CI and the owner | **1,769 passed, 0 failed, 144 files**, build OK, measured on `50ed11f` |
| PneumoVax | `docs/2026-11-15-meningovax-phase1-midpoint` (pushed) | plan status + this handoff | **PR #154**, docs only, open | not run (docs only) |

## What's done

- **Baseline verified:** 1,697 / 143 green; CDC report "NEW 0, moved 0".
- **2.1 — the rule table** (MeningoVax `50ed11f`, PR #86). New `src/logic/doseRules.js`:
  `DOSE_RULES`, 34 rows, each with `schedule`, `measuredFrom`, `enforcement`
  (floor / set-aside / counts-with-note / counts / needs-input / record-problem / extra / none),
  `grace`, `authorityToday`, `label` (chip), `inventory` (Phase 0 row number), and `check`.
  `judgeDose()` walks the rows; first verdict wins; a row may carry a note instead. `validate.js`
  is now the walk only (1,370 → ~300 lines); `analyzeHistory()` also returns `decidedBy` (row id
  per dose). Inventory rows A8 and B5 are split into three rows each (one per answer to the
  risk-at-dose question); N5 (routine 16 y booster 8 weeks) has its own row; the unchecked
  travel/microbiologist/outbreak booster gap is a visible `enforcement: 'none'` row
  (`ACWY-TRAVEL-BOOSTER-GAP`); the series cap (W3) is a `check: null` row applied by the walk.
- **0 answers moved, measured:** saved answers green; `npm run prose` before/after **0 of
  23,400** differ (dumps byte-identical); CDC report "NEW 0, moved 0".
- **New test** `dose-rules-table.test.js` (55): fields from closed lists; every row seen deciding
  a dose (3 grids + 10 hand patients); every decided dose has its row's verdict and chip; promised
  orderings; no age/interval test in `validate.js`. **Six breaks**, each red then undone (listed in
  `docs/agent/testing.md`).
- Three source-scanning guards now also read `doseRules.js`; two `// extinct:` notes added.
- Docs: `testing.md` (counts 144/93, new section), `architecture.md` (file map; the table is the
  authority; two stale bullets named), `CLAUDE.md` (file names; booster cadence keyed off the LAST
  primary dose, per `intervals.js`), `MAP.md`. Plan: 2.1 marked built, usage recorded.
- **Usage:** start weekly 2%, 5-hour 8%; end weekly 3%, 5-hour 23% (recorded in the plan).

## What's NOT done

- **Not checked in the running app (deferred, and why):** `preview_start` refused twice: "Maximum
  5 dev servers per folder reached; 5 belong to other chats." The prose dump renders the real
  results screen for every saved patient (byte-identical), but no click-through was done. The
  owner can stop an old chat's server; then check one patient per vaccine.
- **Owner merges PR #86 (MeningoVax) and PR #154 (PneumoVax).** CI had not reported on #86 when
  this was written.
- **Found, not fixed (2.1 may move nothing):** no saved grid has an **undated** dose (the six
  undated rows are reached only by hand patients). Worth adding to the grid in a later PR; that
  will add saved answers, so it needs `npm run sweep:update` and a reason in the PR.
- **2.2** — "what the sources say" beside each row, from the Phase 0 inventory's quotes
  (`docs/archive/inventory-2026-11-15-every-place-a-dose-is-judged.md`, column "What the sources
  say"); likely a `sources` field per row plus a test that every row has one. Not started.
- **2.3** — CDSI comparison test: table held against CDSI's two meningococcal files with a named
  list of deliberate differences (the inventory's CDSI 4.65 column is a head start). Not started.
- **STOP C — decision packet 1** after Phase 2 (Q1 Ruling D, Q2 rows that differ incl. the travel
  booster row and 1.5 families 6, 7, 9, 10, Q3 pentavalent, Q4 rows with no source). Ask, don't
  default.
- **Phase 3** applies packet 1 and STOP B answers B-1…B-5 + the Complete rule, each with
  `verify-clinical-source` first. Phases 4–9 not started. PneumoVax follow-up (port the "answers
  moved" check into its `runTestCases.mjs`) not started.

## Why this is a good stopping point

2.1 is one self-contained PR that changes no answer, proven three ways. 2.2 and 2.3 build on its
rows but are separate PRs, and nothing in them needs an owner decision before STOP C.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 86 --json state,mergedAt`. If merged:
   `git checkout main && git pull --ff-only`; else stay on the 2.1 branch and branch 2.2 off it.
   Run `npm test`: expect **1,769 passed, 144 files**. `npx vite-node scripts/cdsi/runTestCases.mjs`:
   "NEW 0", "moved 0".
2. `preview_start` "MeningoVax dev server" — if refused for the 5-server limit, ask the owner.
3. 2.2 then 2.3, `fix-queue` loop, one PR each against `main`; prose dump before/after each.
   2.2 adds words beside the rows; it must still move 0 answers and 0 sentences on screen.
4. MeningoVax `main` is unprotected but the plan says branch + PR; PneumoVax is
   branch → PR → squash. The owner merges both.
