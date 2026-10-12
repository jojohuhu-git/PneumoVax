# PneumoVax — Handoff after W1 merged (2026-10-11)

> **Supersedes `handoff-2026-10-11-anchoring-decided-and-reordered-queue.md`.** Item 1
> (`W1`) of that file's queue is **DONE and MERGED**. Resume from item 2 (`S3-N2`) below,
> not from the superseded file's queue.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`main`**, clean, synced with origin at **`e209170`** (PR #24, squash-merged).
Suite: **468 passing (42 files), all green.**

Deploy to GitHub Pages **succeeded** and was spot-checked: the live site serves
`assets/index-BbEyjr5U.js`, the same hash as a local `npm run build` of merged `main` —
proof the deployed site is exactly the merged code.

## What's done this session

**`W1`** (PR #24, commit `e209170`) — the "repeat this dose" wording was wrong for a
dose rejected only for being given **too soon** after another dose; nothing was missing,
so there was nothing to repeat. Fixed in two files:

- `src/logic/doseIntervalRules.js` — added `earliestValidDate()`, which computes the
  earliest date a floor's dose could validly have been given (anchor date + the rule's
  own interval, minus the 4-day grace), and attaches it to every floor verdict.
- `src/logic/validate.js` — the generic invalid-dose sentence now checks
  `result.intervalRuleId` (already set only when the rejection came from the interval
  rule table): if present, it names the earliest valid date instead of saying "repeat
  this dose only." Every other rejection reason (below minimum age, wrong product for
  the patient's age, dated before birth) is unaffected and keeps the original sentence,
  which is correct for those — the dose really is missing in those cases.

**Scope and exact wording were approved by the owner before any code was written**, per
the open item the superseded handoff left. Wording: *"This dose does not count toward
the series — given too soon after the dose it is measured from. It is not repeated; the
next dose in this series is due on or after \<date\>."*

Nothing clinical changed — no dose's valid/invalid verdict moved, in any test or in the
live app. New test file `regression-w1-too-soon-not-repeated.test.js` (3 tests); two
existing tests whose old assertions captured the now-superseded wording were updated to
match. Suite: 465 → 468. Live-verified: a 70-year-old with PCV13 (2026-01-05) then PCV20
(2026-02-09) now reads "...due on or after 2027-01-01" instead of "repeat this dose
only," in the running app.

A pending doc-only commit from the prior session (marking the 10-12 handoff superseded,
adding the 10-11 anchoring-decision handoff) was also sitting uncommitted; it landed in
the same PR, squashed into `e209170`.

## What's NOT done — the queue, unchanged from the superseded handoff except item 1

### 2. `S3-N2` / peds audit `P0-2` — two sources for one number. **Opus 5, High effort.**
`recommend.js:37` still imports `pcvSeriesMinIntervalDays` from `intervals.js` while
`validate.js` uses the rule table — and they key the interval off **different ages** (the
patient's age now vs. the age at the earlier dose). Same class of silent bug as S14-RC.
Needs `verify-clinical-source` on CDC child schedule Table 2. Doing this **before** item 3
means the anchoring rework (item 3) lands on one source of truth instead of two.

### 3. `ANCHOR-1` — the anchoring rework. **Opus 5, High effort.**
Owner decision already made (see the superseded handoff for the full reasoning and the
acceptance cases A/D/H/B/G) — **a rejected dose does not reset the clock; every gap is
measured from the dose that counted.** Implementation needs a two-pass redesign of
`recommend.js:1005`'s PCV/PPSV23 cross-stream handoff, because it is currently circular.
Reproduce cases A/D/H/B/G first, write failing tests, then build. Confirm the three
comparison harnesses (`scripts/{adult,peds,hsct}Cases.mjs`) for unintended movement.

### 4. Peds audit `P1-2` — "PCV dose 5 of 4". **Sonnet 5, Medium effort.**
A visible counting bug a clinician notices immediately. Self-contained, any time.

### 5. `S8` (`P7-1` rulebook + `P2-7` docs-match-code tripwire). **Sonnet 5, Medium.**
Easier now the rule table exists — compare docs against `DOSE_INTERVAL_RULES`, not prose.

### 6. `S10-N2` (P3), `S4`–`S7`, `S9`, `S11`, `S12`. **Sonnet 5, Low–Medium.**
Unranked leftovers; several predate S14 and may be moot. Re-read each before starting.

### 7. MeningoVax's 9 inline styles — **owner decision still open**, Sonnet 5, Low.
Different repo. Ledger: `.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md`.

**Did NOT reproduce — do not "fix" blind:** peds audit `P1-5`'s 2nd-PPSV23 side-note, and
`S10-N1`. Both were investigated and closed in an earlier session.

## Why this is a good stopping point

W1 is merged, deployed, and verified live by asset hash. It touched only wording, so it
carries zero risk of having moved anything in items 2 or 3. The owner's three queue
decisions (anchoring rule, keep-the-adult-floors, order-the-rework-last) all still stand
unchanged. Nothing is half-built.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main && git pull`.
2. Confirm the suite: **468 passing / 42 files.** Stop and diagnose any mismatch first.
3. **Ask, don't default:** whether to open the MeningoVax inline-styles PR (item 7).
   **Do not re-litigate:** the anchoring decision, keep-the-adult-floors decision, or
   order decision (all in the superseded handoff); the 2026-10-11 adult-floor
   determination; `A-P1-1`; the paediatric risk lists (`CLINICAL_SPEC.md` §C); the seven
   S14-RC decisions; rr7203a1's PCV13→PPSV23 floor (answered: no exception); or W1's
   scope/wording (answered above — ask only if extending W1's wording to other rejection
   reasons comes up, since that option was explicitly declined this session).
4. Per item: reproduce → failing test first (**confirm it fails**) → fix → full suite
   green → **live-verify in the running app** → one commit per item ID.
5. **Before changing any interval rule**, read the header of
   `src/logic/doseIntervalRules.js` and `CLINICAL_SPEC.md` §K. **Add a table row; never
   add an age test to the evaluator.** Every adult floor is an OWNER determination dated
   2026-10-11 — never cite ACIP or CDC.
6. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to
   `main`.**
7. **Dev server:** `preview_start` has reported a wrong port before — always read the
   real port from `preview_logs`.
