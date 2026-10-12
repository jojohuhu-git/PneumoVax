> ## ⛔ SUPERSEDED — 2026-10-11
>
> Item **1 (`S8`)** below is **DONE** (PR #32, green, awaiting merge). Do not resume this
> queue. Read **`handoff-2026-10-11-s8-done-pr32-awaiting-merge.md`** instead.

# PneumoVax — Handoff after ANCHOR-1 (2026-10-11)

> **Supersedes `handoff-2026-10-11-p0-2-done-next-is-anchor-1.md`.** That file's item **3
> (`ANCHOR-1`)** is **DONE and MERGED** (PR #30). Resume from item **4 (`S8`)** below, not
> from the superseded queue.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`main`**, clean, synced with origin at **`b094ff7`**. No open PRs.
Baseline was 496 passing; now **508 passing (44 files)**, all green.
Deploy to GitHub Pages succeeded; Case A spot-checked on the live site.

This app's core promise is honesty: a silent wrong answer is worse than a crash. The owner
is a clinician, not a coder — explain every what and why in plain English, in chat and in
UI copy.

## What's done

**`ANCHOR-1`** — *a gap is measured from the dose that COUNTED* (commit `b094ff7`, PR #30).
Implements the owner's decision of 2026-10-11. **No interval changed**; only what a gap is
measured *from*. Every adult floor remains an owner clinical determination (`CLINICAL_SPEC.md`
§K), never ACIP's or CDC's, and none was shortened.

- **Root cause.** The engine analysed the two streams in **two separate calls, and the order
  of them was the bug**. The PCV call ran first and got the PPSV23 list *including doses that
  did not count* (their verdicts did not exist yet); the PPSV23 call then got only the PCV
  doses that **did** count. So a rejected PPSV23 could void a later PCV, but not the reverse.
  Whichever stream ran first was going to have this problem.
- **Fix.** Both streams are now walked **together in date order**, one pass —
  `validate.js` `analyzeBoth()`, replacing the two `analyzeHistory` calls in `recommend.js`.
  This looks circular but is not: **every interval is measured from an EARLIER dose**, so by
  the time a dose is judged everything that could anchor it already has a verdict. No
  iteration, no fixed point.
- **Same-date tie → PCV judged first**, so a same-visit PPSV23 still sees its PCV15 (the
  co-administration error the rule table is ordered around). Consequence the other way: a
  PCV is no longer judged against a PPSV23 given at the same visit.
- Files: `src/logic/validate.js` (`freshStreamState` / `stepStream` / `runWalk` /
  `walkBothStreams` / `analyzeBoth`), `src/logic/recommend.js`, `CLINICAL_SPEC.md` §K,
  `docs/agent/architecture.md`, and a new test file
  `src/logic/__tests__/regression-anchor-1-counting-doses-only.test.js` (12 tests).

### Evidence

All five owner acceptance cases behave as decided, **including the control H** (a PCV20 two
months after a PPSV23 that COUNTED is still rejected — the reason the cheaper
"downgrade the two rules to recommendations" option was declined).

A **231,300-case synthetic sweep** was run through both the old and new engine and **every**
difference classified — not only the expected ones:

| Cases | What changed |
|---|---|
| 21,310 | PCV rescued by the two rules in scope — the fix |
| 2,728 | Still rejected; the rule now named is anchored on a dose that counted |
| 710 | Same-visit PCV15 + PPSV23 — the PCV15 now counts and the early PPSV23 is set aside. The app used to discard the correct PCV15 and advise restarting the conjugate. |
| 32 | A second PPSV23 6–14 years after the first now counts instead of being measured against an extra PCV15 that does not extend the series (all clear the 5-year minimum) |
| **0** | child verdicts moved · crashes · cases where a dose rejected against a *counting* anchor was let through |

The three harnesses (`scripts/{adult,peds,hsct}Cases.mjs`) are **byte-identical** before and
after — expected, not reassuring: none of their cases has a rejected dose anchoring another,
which is how this survived. Same coverage gap `P0-2` hit. Worth closing in `S8`.

Live-verified in the running app on all three surfaces (rec card, recorded-dose chips, note
text), and Case A re-checked on the deployed site.

## What's NOT done — the queue

### 1. `S8` (`P7-1` rulebook + `P2-7` docs-match-code tripwire). **Sonnet 5, Medium.**
Compare docs against `DOSE_INTERVAL_RULES`, not prose. **Scope note carried forward:**
`P0-2` proved the spec can be right while the engine is wrong, and the harnesses had no
case in any of the five broken cells. ANCHOR-1 has now reproduced that exact pattern a
second time — byte-identical harnesses across a change that moved 19,546 cases. A tripwire
that only diffs prose against the table would have caught neither. Consider adding a
**case-sweep harness** (the one used for ANCHOR-1 is a good model: enumerate histories,
classify every verdict difference) so a future engine change cannot move thousands of
verdicts invisibly.

### 2. `S10-N2` (P3), `S4`–`S7`, `S9`, `S11`, `S12`. **Sonnet 5, Low–Medium.**
Unranked leftovers; several predate S14 and may be moot. Re-read each before starting.

### 3. New finding (not yet an ID) — **a PPSV23 given after the series is already complete
says nothing.** `stepStream()`'s extra-dose branch fires only for `vaccine === 'PCV'`: an
adult PCV after a PCV20/PCV21 is told "Given after the series was already complete … this
dose does not extend the series", while a PPSV23 in the same position is counted silently.
Reproducing history (synthetic, `today = 2026-10-11`): age 480 mo, no risks,
PCV `[PCV20 2012-01-01, PCV15 2018-01-01]`, PPSV23 `[2012-01-01, 2018-03-01]`.
**Not a wrong verdict** — "valid" is defensible, that dose clears the 5-year minimum — but
the app explains one stream and stays silent on the other.
**PRE-EXISTING, not caused by ANCHOR-1**; ANCHOR-1 only made these histories reachable.
**Needs owner-approved wording before coding** (precedent: `W1`). A background task chip was
raised for this (`task_a172cffe`).

**Did NOT reproduce — do not "fix" blind:** peds audit `P1-5`'s 2nd-PPSV23 side-note, and
`S10-N1`. Both investigated and closed in earlier sessions.

## ⚠️ Another chat was committing in this same folder

During this session `HEAD` moved under me from `af23b4d` to `9114cc7` (PRs #28 and #29,
docs-only) because a second chat was working in `~/Downloads/PneumoVax` at the same time.
Nothing was lost — the changes were uncommitted in the working tree and survived — but
**check `git log -1` before trusting a baseline sha**, and prefer one chat per folder.

## Why this is a good stopping point

ANCHOR-1 was the last and largest item of the interval programme, and the one the owner
asked to be done last so nothing was built on top of it. It is merged, deployed, and
verified against the live site. Every remaining item is independent and small. Nothing is
half-built and no file is mid-edit.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main && git pull`.
2. Confirm the suite: **508 passing / 44 files.** Stop and diagnose any mismatch.
3. **Do not re-litigate:** the ANCHOR-1 decision and its same-day tie-break; the
   keep-the-adult-floors and order decisions; the 2026-10-11 adult-floor determination;
   `A-P1-1`; the three `P0-2` decisions; the paediatric risk lists (`CLINICAL_SPEC.md` §C);
   the seven S14-RC decisions; `W1`'s scope and wording.
   **Ask, don't default:** the wording for queue item 3 above.
4. Per item: reproduce → failing test first (**confirm it fails**) → fix → full suite green
   → **live-verify in the running app** → one commit per item ID.
5. **Before changing any interval rule**, read the header of `src/logic/doseIntervalRules.js`
   and `CLINICAL_SPEC.md` §K and §L. **Add a table row; never add an age test to the
   evaluator.** Every adult floor is an OWNER determination — never cite ACIP or CDC for one.
   `pcvNextDoseMinIntervalDays()` is deliberately **not** in the rule table: that table owns
   doses already recorded, this answers what to advise. Do not move it.
6. **Use `analyzeBoth()`, not two `analyzeHistory()` calls**, for anything that needs both
   streams. `analyzeHistory` remains for single-stream callers and takes the other stream on
   trust; only `analyzeBoth` gets the anchoring right in both directions.
7. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to `main`.**
8. **Dev server:** `preview_start` reports the wrong port — it said 63046 this session while
   the real server was on **5175** at `/PneumoVax/`. Always read the port from `preview_logs`.
