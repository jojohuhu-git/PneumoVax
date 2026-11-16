> **SUPERSEDED (2026-11-15)** by `handoff-2026-11-15-meningovax-phase2-3-cdsi-rules.md`. #87 merged;
> Phase 2.3 is built and open as MeningoVax PR #88. Do not resume from this file.

# MeningoVax port — Handoff after Phase 2.2, what the sources say (2026-11-15)

Repos: `/Users/joannehuang/Downloads/MeningoVax-main` (the work) and
`/Users/joannehuang/Downloads/PneumoVax` (this file and the plan,
`docs/archive/plan-2026-11-08-meningovax-port.md`). Read each repo's `CLAUDE.md` first.
MeningoVax is live at https://jojohuhu-git.github.io/MeningoVax/ and is iCloud-synced: commit
early, re-apply an edit that "disappears".

**Supersedes** `handoff-2026-11-15-meningovax-phase2-1-rule-table.md` (banner added).

## Branches and PRs

| Repo | Branch | Commit | State | Suite |
|---|---|---|---|---|
| MeningoVax | `main` | `22446e1` | #86 (2.1, rule table) **merged** 2026-11-16 03:27 UTC | 1,769 / 144 at session start (verified) |
| MeningoVax | `feature/2026-11-15-port-2-2-sources-beside-rows` (pushed) | `dc64a73` | **PR #87** against `main`, waiting for CI and the owner | **1,808 passed, 0 failed, 144 files** (verified after the last edit) |
| PneumoVax | `docs/2026-11-15-meningovax-phase1-midpoint` (pushed) | plan status + this handoff | **PR #154**, docs only, open | not run (docs only) |

## Dev servers (why the last session could not preview)

The app allows **5 dev servers per folder**. Earlier chats had left five MeningoVax servers
running (ports 5175–5179), so `preview_start` was refused. This session stopped all five
(`kill`, after confirming each was a MeningoVax vite server from this folder) and started one on
5175. If refused again: `lsof -nP -iTCP -sTCP:LISTEN | grep node`, check each one's folder with
`lsof -a -p <pid> -d cwd`, stop the stale ones, then retry.

## What's done

- **2.1 checked in the running app** (deferred last session): asplenia patient, 21 y, Menveo
  2016-05-01 and 2016-06-01, Bexsero 2024-01-01 and 2024-01-15. Both early doses read Invalid with
  the right minimum (8 weeks; 4 weeks), next dose due today. Correct.
- **2.2: `sourcesSay` on every row** (MeningoVax `dc64a73`, PR #87). Each of the 35 rows has a
  verdict (`stated` 10, `schedule-only` 4, `differs` 4, `owner-decided` 10, `no-source` 4,
  `record-keeping` 3), `refs` (keys into `src/data/refs.js`) and a plain-English `note`.
  - All quotes were confirmed live 2026-11-15 as exact page text, in the built-in browser. CDC
    blocks curl ("Access Denied"); don't try to get around it. Pages: CDC child/adolescent
    notes (updated 2025-07-01), ACIP RR-9 `rr6909a1`, ACIP `mm7349a3`.
  - 12 new `refs.js` entries; 11 existing entries re-read and re-dated. Not re-read:
    `waDohMenQuadfiAapAlignment`, which only an owner-decided row uses.
  - CDC notes entries need the section anchor (`#note-mening` / `#note-mening-b`), or
    `regression-c1-hover-names-the-document` fails.
  - `dose-rules-table.test.js` section 5 (+39 checks). It freezes the STOP C lists: **Q2** = the
    8 differs/schedule-only rows, **Q4** = the 4 no-source rows (both listed in the PR body).
    Four breaks were shown to turn it red (listed in `docs/agent/testing.md`).
- **0 moved, measured:** prose dump 0 of 23,400 (byte-identical); CDC report "NEW 0, moved 0";
  build OK; app loads with no console errors.
- **Confirmed live:** R-4a. ACIP's "4 weeks between any 2 doses" is in the MenB section only;
  for MenACWY the report says "an 8-week minimum interval".
- Docs updated: `docs/agent/testing.md`, `docs/agent/architecture.md`, `CLAUDE.md` status, and the
  pointer file. Plan: 2.2 marked built.

## What's NOT done

- **Owner merges PR #87 (MeningoVax) and PR #154 (PneumoVax).**
- **Deferred:** CDC's general advice on **undated** records (General Best Practice Guidelines)
  was not read. Two Q4 rows (undated doses count) need it before STOP C. Read it live and
  quote it.
- **2.3, not started.** A CDSI comparison test: hold the table against CDSI's two meningococcal
  files (`scripts/cdsi/cdc-files/`), with a named list of deliberate differences. The
  `sourcesSay` notes already name CDSI's numbers for most rows, so they are a head start.
- **STOP C, decision packet 1:** after 2.3. Q1 Ruling D (asplenia patient, Menveo 8/1, 8/22);
  Q2 = the 8 rows; Q3 pentavalent; Q4 = the 4 rows. Each question gets a meningococcal patient
  and a control. Ask, don't default.
- Still open from 2.1: no saved grid has an **undated** dose (needs `npm run sweep:update` and a
  reason in the PR). Phases 3–9 not started. PneumoVax follow-up (port the "answers moved" check
  into its `runTestCases.mjs`) not started.
- Usage for 2.2 was not recorded.

## Why this is a good stopping point

2.2 is one self-contained PR. It changes no answer and no sentence, proven three ways. 2.3 reads
the same rows but is its own PR, and nothing before STOP C needs an owner decision.

## Resuming

1. `cd ~/Downloads/MeningoVax-main && git fetch && gh pr view 87 --json state,mergedAt`. If merged:
   `git checkout main && git pull --ff-only`; else branch 2.3 off the 2.2 branch. `npm test`:
   expect **1,808 passed, 144 files**. `npx vite-node scripts/cdsi/runTestCases.mjs`: "NEW 0",
   "moved 0".
2. `preview_start` "MeningoVax dev server" (see Dev servers above if refused).
3. 2.3, then the undated-records read, then STOP C. One PR each against `main`; prose dump
   before and after each.
4. MeningoVax `main` is unprotected, but the plan says branch + PR. PneumoVax is branch → PR →
   squash. The owner merges both.
