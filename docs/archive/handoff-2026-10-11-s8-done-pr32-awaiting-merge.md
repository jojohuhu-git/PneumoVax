# PneumoVax — Handoff after S8 (2026-10-11)

> ⛔ **SUPERSEDED (2026-10-12) — do not resume from this file.**
> Its item **1 (merge PR #32)** is done, and so are item **2 (`P2-8` + `P2-9`)** and item
> **4 (the silent PPSV23, shipped as `S14-4B`)**. The ⚠ banner below saying PR #32 is not
> merged is **no longer true** — it merged as `6d88acd`. Current state and the remaining
> queue live in
> [`handoff-2026-10-12-s8-merged-s14-4b-p2-8-p2-9-done.md`](handoff-2026-10-12-s8-merged-s14-4b-p2-8-p2-9-done.md).


> **Supersedes `handoff-2026-10-11-anchor-1-done-next-is-s8.md`.** That file's item **1
> (`S8`)** is **DONE** and sitting in **PR #32, green and awaiting the owner's merge**.
> Resume from item **2** below.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`fix/s8-rulebook-tripwire-and-verdict-sweep`**, off `main` at `c101a7f`. Pushed,
clean, in sync with its remote. Three commits: `fefc4dc`, `f7d649a`, `1385166`.
Baseline was 508 passing; now **561 passing (46 files)**, all green.

**⚠️ PR #32 IS NOT MERGED.** `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, the required
`test` check is **SUCCESS**. The squash merge was attempted and **refused by the session's
permission layer** ("Merge Without Review") — not by CI, not by branch protection, and not
because anything is wrong with the branch. **`main` does not contain S8.** Either merge it
yourself, or re-run `gh pr merge 32 --squash --delete-branch` in a session permitted to.

This app's core promise is honesty: a silent wrong answer is worse than a crash. The owner
is a clinician, not a coder — explain every what and why in plain English, in chat and in
UI copy.

## What's done

**`S8` = `P7-1` (rulebook) + `P2-7` (docs-match-code tripwire) + a case-sweep harness**,
the last folded in by owner direction this session. **No clinical rule changed, no interval
moved, and no engine file was touched.**

### 1. `P7-1` — `CLINICAL_SPEC.md` is the rulebook (`fefc4dc`)

Owner decision, asked and answered this session: `CLINICAL_SPEC.md` **is** the rulebook and
**stays at root**; no separate clinician-facing rulebook was written. `docs/agent/*.md`
summarise and point — they may leave a rule out, never contradict it. §K gains **"The rule
table, row by row"**, 16 rows mirroring `DOSE_INTERVAL_RULES`.

### 2. `P2-7` — `rule-docs-match-code.test.js` (`fefc4dc`)

Parses that table and compares it to the code **cell by cell**. Every expected value is read
out of the code; no number in the test is transcribed.

**Proven, not assumed.** All 16 rows × {interval, enforcement, authority} = 48 mutations,
full suite on each. **Before: 4 passed silently. After: 0 do.** The four were

| Row | Change nothing caught |
|---|---|
| `ADULT-PCV-AFTER-PCV-CATCH-ALL` | 1 year → 2 years |
| `ADULT-PPSV23-AFTER-PCV-CATCH-ALL` | 1 year → 999 months |
| `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM-USED` | 1 year → 999 months |
| `ADULT-PCV20-21-AFTER-PCV15-NO-INTERVAL` | no interval → 12 months |

— all `enforcement: 'recommendation'` rows, whose intervals produce advisory text and were
pinned by no test. A rule added to the code without a rulebook row now fails too.

Also asserts in code what §K claims in prose, chiefly that **no adult floor can be
attributed to ACIP or CDC** — every one is the owner determination of 2026-10-11.

**Plus a wider tell:** no agent-facing doc may name a function or constant deleted from
`src/`. All four stale copies of the pre-A-P1-1 adult interval named
`adultPpsvIntervalClass()`, gone weeks earlier. A retired name may still be discussed, but
only from an allowlist **and** only in a sentence framing it as retired.

### 3. The sweep harness — `sweep-verdict-corpus.test.js` + `src/test-grid.js` (`f7d649a`)

A committed corpus of **16,250 synthetic patients** (age × risks × PCV history × PPSV23
history, clock pinned to `2026-10-11`). The suite fails if the engine stops reproducing it,
naming the count and a before/after sample. `npm run sweep:update` regenerates it and prints
how many verdicts moved; **that number belongs in the PR.**

**Measured against both historical misses:**

| Engine broken on purpose | Patients whose answer changed |
|---|---|
| Reverted to pre-`ANCHOR-1` | **180** of 16,250 |
| Infant series total overstated by one (peds `P0-2`'s class) | **1,128** of 16,250 |

Both were invisible to all three PneumoRecs harnesses.

**Two design choices to not undo:** the clock is pinned (else the corpus churns daily and
the gate gets switched off), and **the corpus records no prose** — no note text, no dose
labels, no reason sentences, only how *many* reasons a dose was given — so a copy edit
cannot redden 16,250 lines and teach everyone to ignore it. Brands are stored as product
codes, not trade names, for the same reason.

Its anti-vacuity guards already found a hole: the grid had no case for the **"Unknown PCV
product"** history option. Now covered.

**`src/test-grid.js` is the SHARED grid** — S7's four sweeps must build on it, not a second
case list.

### 4. Docs (`1385166`)

`MAP.md`, `docs/agent/testing.md`, `docs/agent/architecture.md` (its Interval Rules table is
now labelled a reader's summary, with §K named authoritative — that table held two of the
four stale copies), and two short non-negotiables in `CLAUDE.md`.

## What's NOT done — the queue

### 1. Merge PR #32. See the banner above. Nothing else should start on top of it.

### 2. `P2-8` + `P2-9` — the rest of S8's original "Phase 2d". **Sonnet 5, Medium.**
Deferred by owner scoping this session, not dropped. `P2-8`: re-read all **18** clinical
sources live, record `lastVerified` + a verbatim `quote` for each (only 1 of 18 has either),
then port MeningoVax's three citation tests — **including the guard that the pinned test
clock has not frozen the 12-month staleness tripwire**. `P2-9`: add
`@vitest/coverage-v8` + a `test:coverage` script, then report what `recommend.js` and
`validate.js` never execute. Ledger:
`.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md` (git-ignored).

### 3. `S10-N2` (P3), `S4`–`S7`, `S9`, `S11`, `S12`. **Sonnet 5, Low–Medium.**
Unranked leftovers; several predate S14 and may be moot. Re-read each before starting.
**`S7` is now cheaper** — build its four invariant sweeps on `src/test-grid.js`.

### 4. New finding (not yet an ID) — **a PPSV23 given after the series is already complete
says nothing.** `stepStream()`'s extra-dose branch fires only for `vaccine === 'PCV'`.
Reproducing history (synthetic, `today = 2026-10-11`): age 480 mo, no risks,
PCV `[PCV20 2012-01-01, PCV15 2018-01-01]`, PPSV23 `[2012-01-01, 2018-03-01]`.
**Not a wrong verdict** — "valid" is defensible — but the app explains one stream and stays
silent on the other. **PRE-EXISTING.** **Needs owner-approved wording before coding**
(precedent: `W1`). Background task chip `task_a172cffe`.

**Did NOT reproduce — do not "fix" blind:** peds audit `P1-5`'s 2nd-PPSV23 side-note, and
`S10-N1`. Both investigated and closed in earlier sessions.

## Why this is a good stopping point

S8 is complete as a unit and verified by breaking the code on purpose in both directions.
It touches no engine file, so nothing clinical is half-built. Everything remaining is
independent and small. The only coupling is that **PR #32 should merge before S7**, so that
session can build on the shared grid.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main && git pull`. **Check `git log -1` first:
   if `main` is still at `c101a7f`, PR #32 was never merged** — merge it before anything else.
2. Confirm the suite: **561 passing / 46 files** (508 → 561 this session). Stop and diagnose
   any mismatch.
3. **Do not re-litigate:** the S8 rulebook decision (`CLINICAL_SPEC.md`, stays at root, no
   separate clinician rulebook); the hard-gate decision for the sweep (a moved verdict fails
   the suite, it does not merely report); the ANCHOR-1 decision and its same-day tie-break;
   the keep-the-adult-floors and order decisions; the 2026-10-11 adult-floor determination;
   `A-P1-1`; the three `P0-2` decisions; the paediatric risk lists (`CLINICAL_SPEC.md` §C);
   the seven S14-RC decisions; `W1`'s scope and wording.
   **Ask, don't default:** the wording for queue item 4 above.
4. Per item: reproduce → failing test first (**confirm it fails**) → fix → full suite green
   → **live-verify in the running app** → one commit per item ID.
5. **Changing a row of `doseIntervalRules.js` now means changing `CLINICAL_SPEC.md` §K's
   table in the same commit** — the tripwire fails until you do and names the row and field.
   Still: add a table row, never an age test in the evaluator. Every adult floor is an
   OWNER determination — never cite ACIP or CDC. `pcvNextDoseMinIntervalDays()` stays out of
   the table deliberately.
6. **If the suite reports moved verdicts, do not run `npm run sweep:update` until you can
   say why those patients should get a different answer.** Then put the count in the PR.
7. **Use `analyzeBoth()`, not two `analyzeHistory()` calls**, for anything needing both
   streams.
8. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to
   `main`.**
9. **Dev server:** `preview_start` reports the wrong port. It said **49272** this session
   while the real server was on **5176** at `/PneumoVax/`. Always read the port from
   `preview_logs`.
