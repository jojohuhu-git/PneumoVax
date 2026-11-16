# MeningoVax port — Handoff after Phase 2.3, the rule table against CDSI's rules (2026-11-15)

Repos: `/Users/joannehuang/Downloads/MeningoVax-main` (the work) and
`/Users/joannehuang/Downloads/PneumoVax` (this file and the plan,
`docs/archive/plan-2026-11-08-meningovax-port.md`). Read each repo's `CLAUDE.md` first.
MeningoVax is live at https://jojohuhu-git.github.io/MeningoVax/ and is iCloud-synced: commit
early, re-apply an edit that "disappears".

**Supersedes** `handoff-2026-11-15-meningovax-phase2-2-sources.md` (banner added).

## Branches and PRs

| Repo | Branch | Commit | State | Suite |
|---|---|---|---|---|
| MeningoVax | `main` | `4c1ff52` | #87 (2.2) **merged** 2026-11-16 03:51 UTC | 1,808 / 144 at session start (verified) |
| MeningoVax | `feature/2026-11-15-port-2-3-cdsi-comparison` (pushed) | `2c1e15e` | **PR #88** against `main`, CI not yet reported at handoff, waiting for the owner | **1,824 passed, 0 failed, 145 files** (verified after the last edit) |
| PneumoVax | `docs/2026-11-15-meningovax-phase1-midpoint` (pushed) | plan status + this handoff | **PR #154**, docs only, still open | not run (docs only) |

Dev server: "MeningoVax dev server" ran on port 5176 this session (5175 was taken). If
`preview_start` is refused, see the 2.2 handoff's note on stale servers (limit 5 per folder).

## What's done

- **2.3 — the rule table held against CDSI** (MeningoVax `6cf2340`, PR #88).
  - `scripts/cdsi/cdsiRules.mjs` reads CDSI 4.65's two meningococcal XML files into **442 named
    facts** (small built-in XML reader; no new dependency). Saved copy:
    `scripts/cdsi/cdc-files/meningo-cdsi-rules.json`.
  - `scripts/cdsi/cdsiRuleMap.mjs`: every one of the 35 rows of `doseRules.js` is either compared
    (18) or says why CDSI has no counterpart (17). Plus `CDSI_ONLY` (rules the app lacks),
    `OTHER_NUMBERS` (10 app ages that aren't dose rules), `NOT_COMPARED` (patterns + reasons).
  - Result: **57 agree; 26 differ** — 3 `wording`, 5 `owner`, 18 `open` (= 9 STOP C questions).
    Printed by `npx vite-node scripts/cdsi/runRuleComparison.mjs`.
  - Test `src/logic/__tests__/cdsi-rule-comparison.test.js` (16 tests). Shown red by five breaks,
    each undone (listed in MeningoVax `docs/agent/testing.md`).
  - **New findings for STOP C Q2** (engine-checked patients in the report): N1 pentavalent counted
    at 26+ (CDSI stops at 26); N2 high-risk Bexsero 2-dose course before 2024-10-25 (app asks
    dose 3, CDSI complete); N3 healthy MenB dose 2 1–4 days before 6 months (app rescue dose 3,
    CDSI complete via grace); N4 upper ages for counting a dose; plus grace on high-risk MenB
    dose 3 at 4 months; N5 MenQuadfi from 6 weeks — does it reach an unknown-brand dose and dose 1
    of the infant series (CDSI starts that series at 2 months)? Report: MeningoVax `docs/archive/report-2026-11-15-cdsi-rule-comparison.md`.
  - Corrections: the 2.2 `sourcesSay` note on `MENB-HEALTHY-EARLY-DOSE-2` (lowest CDSI dose-2
    gap is 4 weeks for both brands, not "Trumenba 4 months"); `scripts/cdsi/README.md`'s claim
    that CDSI fully agrees on MenQuadfi from 6 weeks (product yes, infant series no).
- **0 moved, measured:** prose dump 0 of 23,400 (byte-identical); CDC test patients "NEW 0,
  moved 0"; build OK; app loads with no console errors.
- Docs: MeningoVax `CLAUDE.md` status, `MAP.md`, `docs/agent/testing.md` (counts + section),
  `scripts/cdsi/README.md`, pointer file. PneumoVax: port plan (2.3 BUILT) and CDSI plan row.

## What's NOT done

- **Owner merges PR #88 (MeningoVax) and PR #154 (PneumoVax).**
- **Answered this session:** the owner asked (2026-11-15) that the two MenQuadfi-from-6-weeks
  consequences be questions, not owner-decided labels. Done (`2c1e15e`): now N5 on the Q2 list.
- **Before STOP C, read live and quote** (`verify-clinical-source`): (a) CDC's General Best
  Practice advice on **undated** records (the two Q4 undated rows; deferred since 2.2); (b) what
  CDC/ACIP say about pentavalents from 26 years (N1); (c) whether ACIP's October 2024 Bexsero
  statement `mm7349a3` says a completed 2-dose course stands (N2). CDC blocks curl; use the
  built-in browser.
- **STOP C, decision packet 1** — not started. Q1 Ruling D (asplenia patient, Menveo 8/1, 8/22);
  Q2 = 2.2's 8 rows plus 2.3's N1–N5 and the MenB dose-3 grace; Q3 pentavalent; Q4 = the 4
  no-source rows. Each question: a meningococcal patient, a control, issue / sources with quotes /
  recommendation (memory `clinical-questions-issue-sources-recommendation-examples`). Ask, don't
  default.
- Still open: no saved grid has an **undated** dose (needs `npm run sweep:update` + reason).
  Phases 3–9 not started. PneumoVax follow-ups not started: port the "answers moved" check into
  its `runTestCases.mjs`; P-CDSI-1 (could reuse MeningoVax's `cdsiRules.mjs` and map pattern).
- **Not compared by 2.3** (honest limits, in the report): series selection and series size
  (CDSI "skip" rules — only N2 was checked against the engine), dated historic rules, preferred
  products. Usage for 2.3 was not recorded.

## Why this is a good stopping point

2.3 is one self-contained PR that changes no answer, proven three ways, and finishes Phase 2.
What comes next (three live reads, then STOP C) is owner-facing and needs fresh context.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 88 --json state,mergedAt`. If merged:
   `git checkout main && git pull --ff-only`. `npm test`: expect **1,824 passed, 145 files**.
   `npx vite-node scripts/cdsi/runRuleComparison.mjs`: "declared wrongly 0", "unaccounted for 0",
   "changed since saved 0". `npx vite-node scripts/cdsi/runTestCases.mjs`: "NEW 0", "moved 0".
2. `preview_start` "MeningoVax dev server".
3. The three live reads above, recorded in `refs.js` / the report, then build the STOP C packet
   and ask the owner. No code changes before her answers.
4. MeningoVax `main` is unprotected, but the plan says branch + PR. PneumoVax is branch → PR →
   squash. The owner merges both.
