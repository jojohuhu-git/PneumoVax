# PneumoVax — Handoff after the wording audit's two fixes, P2-1 and P2-2 (2026-11-08)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React page that gives pneumococcal vaccine advice.
Its promise: never guess, and every clinical line rests on a document that says it. Read `CLAUDE.md` first.

Branch `audit/2026-11-08-wording-vs-rulebook`, off `main` at `f2b3009` (#141). Pushed with a PR (see
`gh pr list`); **she merges** — `main` is protected and the safety check blocks `gh pr merge`.
Baseline was **2,435 passing**; now **2,446 passing, 0 failed, 219 files** (vitest JSON reporter,
`.claude/**` excluded), at the commit that adds this file.

## What's done

| Item | What changed | Commit |
|---|---|---|
| Audit 3 (wording vs. Rulebook) | The read-only audit itself: `docs/archive/fix-2026-11-08-wording-vs-rulebook.md` (now marked DONE) and its sweeps in `scripts/wordingAudit/` | `a1c593d` |
| **P2-1** | Rulebook page, healthy-child row: the "Re-evaluate" note now names all three rulings (Kai's PCV15 + PPSV23, smoking/alcohol at 19 from age 5, under-5 complete series at 50). Three new worked patients plus `smoker10` sit on the row, each asserting its card's own sentence; the row cites `cdcAdultRiskFactorList` for "at 19" (page sentence pin 42 → 43). Rulebook only; no engine file touched. | `e82696a` |
| **P2-NOTE-1** | Same commit: the Invalid chip legend says the recommendation card gives the date, instead of promising the note does. | `e82696a` |
| **P2-2** | Owner ruling 2026-11-08, **"Name the date"**. Where the first PPSV23 on the record did not count, the five-year cards say "≥5 years after the PPSV23 of Nov 8, 2026" instead of "first PPSV23" (label, lead and detail). One helper, `fiveYearsFrom(ppsv)`, at all four sites; flag `ppsv.firstOnRecordDidNotCount` set once in the summary. Measured: audit's 104 flagged cards → 0; 48 more same-history cards also name the dose; grid prose changed for 12 patients, each only by those words; both corpora 0 moved; whole-app checks identical apart from one group re-keyed by the new label. Live-checked on the named patient. | `5032f01` |

Note on the count: the audit said "6 grid patients" for P2-2; `proseDiff` shows 12 (ages 216 and 227
months × asplenia / asplenia+cochlear / HIV × two PPSV23 offsets). All 12 are the intended history.

## What's NOT done

**Parked, as the audit recommended (not put to her):**
- **P2-PARK-1** — adult words name the last dose; the date counts from the last that counted (164 grid
  cards, 0 typical). Fixing it is a Ruling D scope question (does an Invalid PCV13 restart the adult
  1-year clock?), not wording.

**Known, small, unrealistic:** the Rulebook's healthy row now says "under 5 years, once the series is
complete" → re-evaluate at 50. A child under 5 with smoking or alcohol use disorder selected gets no
line at all (`healthyReviewAt50` is off for an adult-only tick). Not worth a clause; recorded here.

**Carried from `handoff-2026-11-07-remy-next-dose-due.md`, still needing her (ask, don't default):**
- Today's card reads a future-dated PPSV23 in its own wording (192 of 1,980 future-dated grid entries;
  unreachable through the form). Ask whether to bother.
- R7's leftover: a baby with smoking/alcohol selected, "series complete" names no later age (208 grid).
- MeningoVax: the "eligible" wording and Ruling D — **wait until PneumoVax is done** (her ruling
  2026-11-07, memory `meningovax-waits-until-pneumovax-done`).

**The other two audits proposed 2026-11-01:**
- Audit 2 (adults near a line): the queue file recommends calling it done (2026-11-05 checks plus 0 adult
  Rulebook mismatches). Confirm with her.
- Audit 1 (children near an age line): half done. Not covered: the 6-week minimum age; a week to a month
  either side of a line; checking against CDC's own words. Not started; needs her go-ahead.

**Parked earlier:** R4, Leah's card with two invalid PPSV23, the unvaccinated-to-6 PCV15 row, the mixed
history, P4, the "next dose from" sentence on the asplenia 5-year-old.

## Why this is a good stopping point

The wording audit's queue is finished: both fixes landed with tests that fail on the old behaviour, a
mutation check, prose and whole-app comparisons against `main`, and a live check. Everything left either
needs her or was parked on purpose.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull` once this PR is merged
   (`gh pr view <N> --json state`). Run the suite: expect **2,446 passing**.
2. Ask her the open items one at a time, each with a named patient run through the engine (memory
   `explain-in-plain-language-with-patients`). She picks the order.
3. Per item: reproduce, failing test, fix, full suite, break the fix (restore from a copy, not git),
   `node scripts/proseDiff.mjs` against a `git worktree` of `main` in the scratchpad (symlink
   `node_modules`), `node scripts/wholeApp/run.mjs --out <file>` on both sides (exit 1 on both is the
   known R4/R7 lines — compare the files), the matching `scripts/wordingAudit/*.mjs` sweep (copy the
   folder into the worktree for the "before" run), running app, commit by ID.
4. Branch, PR, she merges. Never push to `main`. Check `gh pr view N --json state` before adding to a PR
   branch.
