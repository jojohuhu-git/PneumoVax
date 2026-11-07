# PneumoVax — Handoff after making check 5 a required test (2026-11-07)

> **SUPERSEDED 2026-11-07** by `handoff-2026-11-07-r6-owen-age-50.md`. Check 5 merged as #133;
> R6's leftover was ruled on and built (#134). Resume from the newer file.

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React page for pneumococcal vaccine advice.
Its promise: never guess, and every clinical line rests on a document that says it. Read `CLAUDE.md` first.

Branch: `test/2026-11-07-check-5-card-and-chip-gate-on-main`, off `main` at `e72887d` (#131, check 7,
merged). Pushed, with [PR #133](https://github.com/jojohuhu-git/PneumoVax/pull/133). `main` is protected:
branch, PR, squash merge, and she merges. Baseline was 2,300 passing; now **2,301 passing, 0 failed, 208
files**, measured with vitest's JSON reporter on a tree identical to `34df4af`. This handoff's commit
changes documents only.

[PR #132](https://github.com/jojohuhu-git/PneumoVax/pull/132) is CLOSED, superseded by #133: it was opened
stacked on #131's branch moments before #131 merged, and force-pushing the rebase was blocked. Its remote
branch `test/2026-11-07-check-5-card-and-chip-gate` is left in place, unused; delete it only if she asks.

## What's done

| Item | What changed | Commit |
|---|---|---|
| Check 5 ("card and chip agree") | Joined the forward walk in `whole-app-forward-checks-gate.test.js`: grid walk, first screen of all typical, every 11th typical walked. Allows R4 only, pinned at exactly **41 grid / 5 sampled typical**. File ~2 min 39 s → ~3 min 7 s | `34df4af` |
| Measurement | `node scripts/wholeApp/run.mjs --checks 5` over 77,496 patients: 41 grid + 60 typical, all R4, 0 unsorted. All four groups are the "(other vaccine)" shape: PPSV23 chip's 5-year date vs a PCV card asking sooner | — |
| Proof | Rejected PCV's chip date +14 days → 14 new groups, only check 5 failed. Child PPSV23 chip's 5-year rule removed → R4 pin failed (0 / 24). Both restored from a copy | — |
| Docs | `CLINICAL_SPEC.md` (the whole-app checks paragraph), `docs/agent/testing.md` row | `34df4af` |

Worth knowing: the 60 typical R4 patients are all a few screens into the walk, not on the first screen,
so the every-11th sample sees 5. Removing the 5-year chip rule turned **only** check 5 red in that file —
check that something else in the suite guards §C-P2-FIVE before relying on this file alone (not checked).

## What's NOT done

**Needs her ruling. Ask, don't default** (carried unchanged from the check 7 handoff):
- **R6's leftover:** a child with chronic conditions only, whose Option B leads to a dose at 50.
- **The 24–59-month healthy card** carries "Re-evaluate at 50" even with PCV20 in the series or an
  adult-only tick. Noted in §B-50BABY; not raised with her.
- **CDC deep links** open at the top of the page. Memory `cdc-schedule-pages-ignore-sentence-links`.
- **MeningoVax Ruling D**, in `/Users/joannehuang/Downloads/MeningoVax-main`. Not checked.
- **"eligible" beside an earlier "can be given from" date**, on Remy's card.

**Not started, no ruling needed:**
- The three audits proposed 2026-11-01 (age-line doses for children, the same for adults, wording against
  the Rulebook). Not confirmed whether the whole-app checks already cover them.

**Not gates, by the report's own advice:** checks 2 and 3 read words by pattern; run by hand before
release. With check 5 in, **every check the report called a gate (1, 4, 5, 6, 7) is now required.**

**Parked, older:** R4 itself (now pinned in checks 4, 5 and 7), Leah's card with two invalid PPSV23, the
unvaccinated-to-6 PCV15 row, the mixed history, P4, the "next dose from" sentence on the asplenia
5-year-old.

## Why this is a good stopping point

The report's gate list is finished. One commit, tests and documents only, no answer moved, one PR. What
is left either needs her ruling or is an audit she has not yet confirmed she wants.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`, once #133 is merged.
2. Run `npx vitest run`. Expect **2,301 passing**.
3. Every remaining no-ruling item is an unconfirmed audit; ask her which, if any, before starting. Ask
   her the ruling items one at a time, with a named patient (memory `explain-in-plain-language-with-patients`).
4. Per item: reproduce, failing test, fix, full suite, break the fix (restore from a copy, not git),
   `scripts/proseDiff.mjs` (plain `node`), `node scripts/wholeApp/run.mjs`, running app, commit by ID.
5. Branch, PR, she merges. Never push to `main`. Don't stack a PR on an open one — wait for the merge,
   or force-push will be needed and is blocked.
