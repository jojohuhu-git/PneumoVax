# PneumoVax — Handoff after P4-4, item 6, S7, N2, and the prose-diff harness (2026-10-16)

> ⚠️ **SUPERSEDED 2026-10-16 by `handoff-2026-10-16-transplant-hard-stop-pr2.md`.**
> Its queue is finished and its PR has merged into `main`. The transplant hard stop has
> since landed on a branch (PR #56), which deleted the `hsct` risk row, three `refs.js`
> entries and both post-transplant schedules — so anything in this file touching those is
> no longer actionable. Read the newer handoff first.

> **Two PRs are open against `main` right now, independently.** This session's branch
> (`p4-4-history-yes-no`, below) was built off `main` — it does **not** contain N1/N5/N6
> (PR [#53](https://github.com/jojohuhu-git/PneumoVax/pull/53), still open, unmerged,
> awaiting the owner's review) and PR #53 does not contain this session's work either.
> Whichever merges first, the other will need a trivial rebase/merge — neither touches the
> same files. **If PR #53 has since merged, read `handoff-2026-10-16-n1-n5-n6.md` first**
> (it lives on that branch, not on `main` yet, so you may not see it until #53 lands) — it
> supersedes `handoff-2026-10-16-s15-adult-interval.md`, which this file ALSO supersedes
> from `main`'s side. Owner decisions N1 and N5 in that file are already answered; do not
> re-ask them.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`p4-4-history-yes-no`**, off `main` @ `0556991`, pushed, five commits
(`05043bc` `01e9cdc` `8228bdc` `7397d05` `0f445f6`). Working tree **clean**.
**PR [#54](https://github.com/jojohuhu-git/PneumoVax/pull/54) is OPEN, `test` check
SUCCESS, MERGEABLE — deliberately NOT merged; the owner reviews.**
Baseline was 1001 passing / 84 files (same `main` baseline PR #53 started from); now
**1015 passing / 87 files, 0 failing.** `npm run build` exits 0.
**`main` is protected: branch → PR → squash merge. Never push to `main`.**

This app's core promise is honesty: a silent wrong answer is worse than a crash. The owner
is a clinician, not a coder — explain every what and why in plain English, in chat and UI copy.

## What this session did

The owner asked to set HSCT/N7 aside for later and work through everything else in the
standing queue. Five independent items, one commit each, in order:

1. **P4-4** (`05043bc`) — the History step now asks one yes/no question ("Has the patient
   received any pneumococcal vaccine?") covering both the PCV and PPSV23 streams, with
   "No previous doses" / "Yes, record doses" buttons. Unanswered: both dose editors stay
   hidden, a "Select yes or no above" hint shows, and Next does nothing. "No previous
   doses" clears both lists, replacing the old `.history-clear-link`. `historyAnswered`
   (tri-state) is lifted to `App.jsx` because `goNext` must refuse to advance while it is
   `null`. Pattern copied from MeningoVax's `StepHistory.jsx`. Live-verified in the running
   app (screenshots). **Measured: removing the refusal check fails 1 of 6.**

2. **Item 6** (`01e9cdc`) — a PPSV23 row's "details unknown" tick no longer says "the date
   *and product* are unknown" — PPSV23's product is fixed and shown beside the tick, only
   the date is ever really unknown there. PCV rows (product is a real dropdown) keep the
   original wording. Also deleted `PPSV23_HISTORY_PRODUCTS` from `brands.js` (exported,
   imported nowhere — confirmed by grep). Live-verified. **Measured: reverting the wording
   fails 5 of 37.**

3. **S7, re-scoped** (`8228bdc`) — CLAUDE.md flagged S7 as needing re-scoping, not done.
   Checked: the 2026-10-10 "PCV dose 5 of 4" finding was fixed same-day by P0-2, but only a
   70-case hand-written matrix (infant band only) ever checked it; `test-grid.js`'s own
   header has named this gap "owed" since S8. Added
   `regression-s7-never-event-dose-numbering.test.js`: calls `recommend()` directly over
   the WHOLE real-patient grid (17,342 cases) and impossible-entry grid (19,123), reading
   `doseLabel` — deliberately excluded from the committed verdict corpus so a wording edit
   doesn't turn it red. Needed widening `GRID_PCV_HISTORIES` with a 4-dose infant pattern
   (the grid had none wider than three); two offset attempts were silently inert
   (before-birth; under PCV20's 6-week floor) before one worked. **`npm run sweep:update`
   ran once, deliberately: 0 verdicts moved on either corpus** (1092 added/1053 removed
   real, 663 added/702 removed impossible — all from swapping the inert grid attempt for
   the working one; pure new coverage). Also **closed S12**: verified independently, no
   "Color key" anywhere in `src/`, every status is a readable text badge — genuinely done,
   no code change. **Measured: reverting P0-2's fix fails 36 of 17,342 + 72 of 19,123.**

4. **N2** (`7397d05`) — closed the stale-identifier guard's two known holes: (a) it
   required backticks, so a bare mention named nothing; (b) `srcText` included comments,
   so a deleted function's own tombstone comment counted as it "still existing." Fixing
   hole (b) alone immediately surfaced a REAL stale reference: `pcvHistoryProductsFor`,
   removed by `PCV21-OFFLABEL` (2026-10-15), survived only in comments — added to
   `RETIRED_IDENTIFIERS`. **Measured: a planted bare mention of a never-existing function,
   with the same name appearing only in a comment (the exact shape each hole individually
   misses), fails 1 of 64.**

5. **Prose-diff harness** (`0f445f6`) — `scripts/proseDiff.mjs` (`dump` / `diff`
   subcommands), a permanent version of the ad hoc tool two sessions (S6-interval-prose,
   S15) each hand-wrote in the scratchpad, because the verdict corpora deliberately hold no
   prose (S15 shipped 843 cases of broken wording with the full suite green). Smoke-tested
   the same way P2-13 tested the PneumoRecs harnesses. **Measured: a one-word wording
   mutation that leaves every other test green is caught as 13,356 of 36,465 lines
   changed.**

Every mutation proof above was applied to the real file and restored from a backup copy in
`/tmp`, never `git checkout` (per the standing rule — it can discard more than the mutation).

## What's NOT done

- **N7 — HSCT, deliberately set aside this session, owner's call.** The owner is weighing a
  bigger simplification than N7's narrow citation question: replacing BOTH the peds and
  adult HSCT advisory recommendation blocks with the same advisory-only banner the hard-stop
  exclusion already shows (no specific dose recipe, point to institutional/ASCO/NCCN/IDSA/
  CDC protocols instead). Worth noting for whoever picks this up: the app already carries
  the seed of this — ticking HSCT+CAR-T together today shows the hard-stop message, which
  already names HCT recipients and points to institutional protocols. Ticking HSCT ALONE
  shows a specific 4-dose PCV20 recipe. Those two paths currently say different things for
  overlapping patients, which is itself evidence for the simplification, not against it. N7's
  original narrow question (does the adult HSCT card's "superseded by ASCO 2024" source chip
  belong at all?) would be moot under that change, since the whole recipe block would be
  gone. **OWNER DECISION — ask, don't default**, and bring worked engine examples (what an
  HSCT patient's card looks like today, under each option) the way she's asked for before.

- **Carried forward from earlier handoffs, not touched:**
  - A dose card states one dose's age in two units at once (`fmtAgeMonths` vs `fmtAgeM`).
  - MeningoVax may still use the averaged month where it should not (`DAYS.months` ×17).
  - MeningoVax still has the orphaned dose labels in `DoseEditor.jsx`.
  - N3 (three constant pairs deliberately not merged) and N4 (MeningoVax's `weeksLabel`
    can't say "1 week") — both logged only, no code to write yet.

## Why this is a good stopping point

Five independent items, five commits, one PR, CI green, nothing half-built. P4-4 is the
most clinically meaningful of the five (it's a real safety gap: "no history recorded"
could not be told apart from "never asked"). The only item left in the non-HSCT queue was
re-scoped or closed, not skipped. N7/HSCT is cleanly fenced off as the one item needing the
owner's decision before any code gets written.

## Resuming

1. `cd ~/Downloads/PneumoVax`. Check both PRs: `gh pr view 53` and `gh pr view 54`. If
   either merged, `git checkout main && git pull` and diagnose the baseline before
   continuing — the other PR's branch will need a merge/rebase against the new `main`.
2. Confirm the suite: **1015 passing / 87 files** on this branch (or the new total once
   both PRs have merged — re-count, don't assume addition).
3. **N7/HSCT is the one open owner decision.** Ask with worked examples; do not default to
   either the narrow citation fix or the broader banner simplification.
4. Per item: reproduce → failing test first → fix → full suite green → **live-verify in the
   running app** for anything UI-observable → one commit per item ID.
5. **A new guard is not done until you've broken the code on purpose and quoted the count**
   — this session's own S7 widening needed TWO wrong attempts before the mutation actually
   reproduced the bug (silently inert grid cases are easy to write by accident; verify the
   mutation count is real and non-zero before trusting a guard).
6. **Never `git checkout <file>` to undo a mutation** — copy to `/tmp` first, restore from
   there.
7. **Before changing any clinical rule, fetch the source live and quote it.** (None of this
   session's five items touched clinical logic — all UI, test-coverage, or tooling.)
8. **Do not re-litigate:** every decision listed in `CLAUDE.md`, the four decisions in
   `handoff-2026-10-16-n1-n5-n6.md` (or `-s15-adult-interval.md` if #53 hasn't merged), and
   everything earlier handoffs list (PneumoVax-matches-MeningoVax, warn-do-not-trap, K4
   focus-on-phones, P0's date order, P1-3, S14-4C, PCV7-never-counts, P6-3c, S14-4B, the S8
   rulebook decision, the sweep hard-gate, ANCHOR-1, the 2026-10-11 adult-floor
   determination, the three `P0-2` decisions, `CLINICAL_SPEC.md` §C, the seven S14-RC
   decisions, W1's scope, the two-corpora split, duplicate = same product only, P4-4's
   Option B — now implemented — PCV21-OFFLABEL's record-flag-don't-count).
