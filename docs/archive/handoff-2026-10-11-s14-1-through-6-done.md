# PneumoVax — Handoff after S14-1…S14-6 (2026-10-11)

> **SUPERSEDED 2026-10-11** by `handoff-2026-10-11-s14-7-one-rule-table.md`. Its only open
> item, `S14-7`, is now **DONE** (commit `dfa1d92`, suite 455 passing / 41 files). Do not
> resume anything from this file — the newer handoff carries the current branch state, the
> remaining queue, and the open owner decisions.

> **Supersedes `handoff-2026-10-11-s14-interval-enforcement-root-cause.md`** for the
> mechanical half of its queue. That file's `S14-1`…`S14-6` items are now **DONE** — see
> below. `S14-7` (the five-age-gates → one rule table rewrite) is still open and that
> file's clinical rule tables, owner decisions, and "one rule that contradicts the
> sources" section are **still the source of truth for it** — read it before starting
> `S14-7`, this file does not restate that content.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`fix/s3-recorded-dose-intervals`**, off `main`. **Pushed** → PR #22, now carrying
both S3/S3-N1 (prior session) and this session's S14-1…S14-6, CI `test` check **pending**
at push time — check `gh pr checks 22` before merging. 1921 additions / 117 deletions / 24
files changed per `gh pr view`.

Baseline this session: 393 passing (38 files). Now **412 passing (40 files), all green**.
Production build clean (`npm run build`). Working tree clean at `583af34`.

This app's core promise is honesty: a silent wrong answer is worse than a crash.

## What's done this session (by item ID)

1. **`S14-1`** (`f25f3ac`) — pulled the dose chip's label/CSS-class logic out of
   `RecCard.jsx`'s inline `DoseValidation` into `src/components/doseChipLabel.js`,
   mirroring MeningoVax's own module of the same name/shape. Added the drift-guard test
   MeningoVax's own history asked for (`regression-chip-label-one-copy.test.js`) — it
   greps consumer files for hand-typed copies of the owned literals. No behavior change.
2. **`S14-2`** (`bb72cee`) — dropped the "On time" / "Valid" chip words. Every valid dose's
   chip now reads **"Dose N of M"** (or "Dose N" with no tracked total), matching
   MeningoVax's own chip exactly. The timing distinction (given within CDC's window vs.
   given sooner than CDC advises) still lives in the dose's reasons/explanation text —
   nothing was deleted, it moved off the chip. Removed the now-redundant separate
   "Dose N of M" span and its dead CSS; removed the offWindow-only blue chip color (a
   counted dose is a counted dose, win or lose the timing flag).
3. **`S14-3`** (`98ec046`) — renamed the `offWindow` flag to `earlyAdvisory` throughout
   `validate.js`, `CLINICAL_SPEC.md` §K, `docs/agent/{clinical-rules,testing}.md`, and the
   two S3-N1 test files (renamed to `regression-s3-n1-adult-early-advisory.test.js` /
   `regression-s3-n1-early-advisory-chip.test.jsx`). Pure rename: "off-window" is reserved
   for MeningoVax's sense of the word (a dose that does NOT count, repeat owed) — the old
   name collided with it for a dose that counts.
4. **`S14-4`** (`c0ec1e9`) — an **adult** PCV dose recorded after history already includes
   a completing product (PCV20/PCV21) now reads `extraDose: true`,
   `effectiveDoseNum: null`, excluded from `effective` — "Extra dose — more than this
   series needs" on the chip, instead of the old `adultPcvGapAdvice` interval message
   ("given less than a year after the previous dose ... still counts") that had no idea
   the series was already done. Fixes the PCV20→PCV21 case the S14-RC root-cause review
   named. **Deliberately gated to the current dose's age ≥ `ADULT_SCHED_MIN_M`** — the
   first pass applied it to all ages and regressed 4 pediatric tests, because
   `completesSeries` means "no PPSV23 needed" for a child, not "no more PCV doses of any
   kind." Caught by the full suite, documented in `CLINICAL_SPEC.md` §K and
   `docs/agent/clinical-rules.md` so it isn't regressed again.
5. **`S14-5`** (`f6ba721`) — removed the "Color key" legend entirely (button, panel, CSS),
   mirroring MeningoVax's decision C1. Added `Results.jsx` to the `S14-1` drift guard's
   consumer list now that its hand-typed legend copies are gone.
6. **`S14-6`** (`583af34`) — PCV7's chip now reads MeningoVax's own **"Off-window -
   repeat"** instead of "Recorded (does not count)", reusing the `dose-val-offwindow` blue
   `S14-2`/`S14-4` freed up. Internal `status` stays `'noncounting'`, distinct from
   `'invalid'` — unchanged.

All six were done in the order and at the effort level the prior handoff recommended
(Sonnet 5, medium effort, mechanical / MeningoVax-as-template). No clinical rule changed
except `S14-4`'s per-dose display fix, which does not move any `recs[].status` or
`doseLabel` — verified via the full suite (`recommend.test.js`'s 64 tests pass unchanged)
and spot-checked against `scripts/adultCases.mjs` / `pedsCases.mjs` / `hsctCases.mjs`.

## What's NOT done — the remaining queue

- **`S14-7` (Opus 5, high effort)** — replace the five age gates in `validate.js` with one
  rule table. This is the actual root-cause fix; `S14-1`…`S14-6` were the vocabulary
  cleanup that had to land first. **Read
  `handoff-2026-10-11-s14-interval-enforcement-root-cause.md` in full before starting** —
  it has the cross-checked rule rows (CDC + CDSI), the owner's clinical determination on
  the <1-year PCV20/21-after-PCV13 repeat rule (§"The one rule that contradicts the
  sources" — must be recorded as owner-determined, never cited to ACIP), and folds
  `S10-N1` into this item.
- **Everything else unchanged from the prior handoff**: `S10-N2` (P3), peds audit `P1-2`
  ("PCV dose 5 of 4"), `S3-N2`/peds audit `P0-2` (interval keying), `S4`–`S9`, `S11`,
  `S12`, `S8` (`P7-1` rulebook + `P2-7` tripwire — strong argument for doing right after
  `S14-7`), MeningoVax's 9 inline styles. Ledger:
  `.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md` (git-ignored).
- **Did NOT reproduce — do not "fix" blind**: peds audit P1-5's 2nd-PPSV23 side-note
  (unchanged from before).

## Why this is a good stopping point

`S14-1`…`S14-6` are a complete, independently-shippable unit: every item landed with a
failing-test-first reproduction, the full suite green after each, and live verification in
the running app (screenshotted). `S14-7` is a different shape of work — it deletes five
load-bearing gates and changes clinical verdicts — and the prior handoff explicitly
recommends a different model/effort for it. Stopping here keeps that boundary clean.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout fix/s3-recorded-dose-intervals && git pull`.
2. Confirm the suite: **412 passing / 40 files**. Stop and diagnose any mismatch first.
3. Check `gh pr checks 22` — CI was pending at push time; confirm it went green before
   treating PR #22 as mergeable.
4. **Open owner decision — ask, don't default:** PR #22 now contains S3/S3-N1 (prior
   session) AND S14-1…S14-6 (this session). The owner held it earlier specifically because
   S3-N1 shipped "no repeat is needed" copy that S14-2/S14-3/S14-4 have since corrected —
   worth a fresh look at whether that original hold reason still applies before merging.
5. **Say the session number and its recommended model + effort in one line, and WAIT.**
   `S14-7` is next per the owner's stated order — **Opus 5, high effort** (per the prior
   handoff). Owner picks timing — ask, don't default.
6. Per-item workflow: reproduce → failing test first (confirm it fails) → fix → full suite
   green → live-verify in the running app → one commit per item ID. For any guard whose
   assertion is "nothing is wrong," introduce the fault on purpose and watch it go red —
   `S14-4`'s pediatric regression this session is a fresh example of why: the new test
   alone didn't catch the over-generalization, the full suite did.
7. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to
   `main`.**
8. **Dev server:** `preview_start` has reported the wrong port before — read the real port
   from `preview_logs` if the page will not load.
