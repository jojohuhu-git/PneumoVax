> **SUPERSEDED (2026-10-24)** by
> `handoff-2026-10-24-c11-grace-and-the-adult-families.md`. Its question 1 (the 4-day
> grace) is ANSWERED and shipped as C11; its question 2 (the adult extension) is now
> split into three clinical families and is an open owner decision. Do not resume from
> this file.

# PneumoVax — Handoff after RULING D, the repeat-dose anchor (2026-10-23)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json` — **always
read the real port from `preview_logs`**; it was **5176** this session while `preview_start`
reported 62459. What the app is: a client-side React SPA giving pneumococcal vaccine advice
across the lifespan. No backend; **every clinical claim on a card must be traceable to a
document that speaks for *that patient***.

Branch: **`feature/2026-10-23-ruling-d-repeat-dose-anchor`** at `9430377`, off `main` at
`9da398d`, pushed, **[PR #83](https://github.com/jojohuhu-git/PneumoVax/pull/83) open**.
Working tree clean. Suite **1,423 in 129 files → 1,432 in 130, 0 failures, 0 skips**.

Consumed and superseded: `handoff-2026-10-23-c10-2-routine-date-vs-minimum.md`.

## What merged first

**PR #81 (C10-1) and PR #82 (C10-2) are both MERGED** — `fd35c7c` and `9da398d`. #82 arrived
at this session CONFLICTING: #81 had been squash-merged while #82 was stacked on it, so git
saw C10-1's changes from two directions. Nothing had actually diverged (the two trees were
the same object, `01f4f3f`), so every conflict was resolved in favour of the branch and the
merge result was byte-identical to the pre-merge tree. **If this recurs, verify it the same
way before resolving — compare the two diffs and the tree hashes — rather than assuming.**

## What's done — RULING D (commit `9430377`, PR #83)

**The fault.** A dose given too soon is rejected, and the app then measured the next dose
from the last dose that COUNTED. Three 7-month-olds alike but for the mistimed dose's date
(28 Sep / 5 Oct / 12 Oct) were all advised **16 Nov**. The validator had followed the ruling
since ANCHOR-1; only the advice side had not.

**The split, which the handoff rightly flagged as the thing to get right.** It was already
written down on the grading side (`DOSE_INTERVAL_RULES` CHILD-PCV-AFTER-PCV takes
`ageAtPrevDose` from the anchor, `doseNumber` from the kept list), so it was copied, not
invented: **the anchor date and the age at it move together**; dose number, totals and
`anyDoseBefore12` keep counting only doses that counted. One home — `validate.js`'s `st.prev`,
exposed as the analysis `anchor`, carried by `summarizePcv` as `anchorDate` /
`anchorAgeAtDose`. **Never recompute it in `recommend.js`.**

**Three things never anchor:** PCV7; a **record problem** (future-dated or before-birth — "a
dose the patient never had"; without this a PCV20 typed as 2027 advised a return in Dec 2027);
and every **cross-stream** interval (ANCHOR-1 keys those on counting doses both ways).

**A third surface, found by driving the app and not by the suite.** The chip under the
rejected dose said "due on or after 2026-10-15" beneath a card saying "eligible Dec 7, 2026".
It was spending `earliestValidDate` (when THAT dose would have been valid). `repeatDueDate`
is its sibling — same rule, same arithmetic (`intervalFrom`), anchored on the dose given.
**Both are kept; they answer different questions.**

Measured, never quoted: **2,289** of 56,028 purpose-built patients moved, **0** of them
without a rejected dose; advised date later **828**, **earlier 0**; "due today" → a real
date **1,353**; verdict corpus **176**, record-problem corpus **990**, both `minIntervalDays`
only; prose **1,166** lines (176 real, 990 impossible); uncredited pairs **1**, unchanged.
Guard `regression-ruling-d-2026-10-23-repeat-anchored-on-invalid-dose.test.js`, proved
load-bearing four ways (2 / 1 / 3 / 3 failing tests per broken clause).

Five existing tests pinned the old anchor in that sentence and were updated, each keeping its
own original assertion. A duplicate-citation bug on 132 cards was caught by C8's own guard and
fixed by extending the de-dupe to the booster clause.

## Two owner questions in PR #83 — do not implement past them

1. **A 4-day gap now visible on one screen.** Chip "due on or after 2026-11-05" (graced — what
   the app accepts) against the card's "from 2026-11-09 … the minimum interval of 4 weeks"
   (ungraced). Both true; the grace is stated on that chip. Making the chip ungraced would
   state a date later than the app accepts, which is the P0 shape — so **ask, don't default**.
2. **The adult extension.** Ruling D is general, so it now applies to adult floors, which are
   HER clinical determinations rather than CDC minimums. An adult PCV20 five weeks after PCV13
   reads "due on or after 2027-02-05" instead of 2027-01-01.

## The remaining queue

| Priority | Item | Scope |
|---|---|---|
| **P2** | Patient E's "of 3" — **probably not a defect** | She flagged the card saying "of 3" while "the p2016 row she named gives a total of 2". E (doses at 11 and 12.5 months) has ONE dose before 12 months, so the ladder takes Table 1's "1 before age 12 months — 2 additional doses" row → total 3. **Put the two readings to her; do not change the ladder first.** |
| **P2** | Overdue children read oddly | "The next dose is due at age 4 months, following the routine…" on a 12-month-old. **Pre-existing on `main`** (verified this session, not introduced by Ruling D) — it is C10-2's routineAge wording meeting a child past that age. Wording only; the card also says due today. |
| **P2** | Unchanged | Card classes the grid can no longer reach; dead `advisory` flag; interval-prose guard blind spot; job aid footnote § unread. |
| — | **C4, C5** | MeningoVax-only, untouched, independent. |

**Closed, do not reopen:** everything the previous handoff listed, plus **Ruling D itself** and
the "still open" item CLAUDE.md used to record about the recommendation-side anchor. The Job
Aid's last statement (1,584 cards, the single remaining uncredited pair) is still the decision
she asked **not** to be re-raised.

## Why this is a good stopping point

Ruling D is complete as a unit across all three surfaces, with the owner's two questions
isolated in the PR rather than built past. Nothing in the remaining queue depends on it, and
the two P2 wording items are independent of each other.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`
2. **Check PR #83 merged first.** Branch fresh off `main`; a branch stacked on an unmerged PR
   is what produced this session's conflict.
3. `npx vitest run` — confirm **1,432 passing in 130 files**, no skips, before any new work.
   Pipe to `tail`, never `head`; for a reliable file count use `--reporter=json` and read
   `len(testResults)`.
4. `npx vite-node scripts/uncreditedSources.mjs` — confirm **1** pair. Re-measure, never quote.
5. Per item: reproduce → failing test (say the pre-fix failure count) → fix → full suite green
   → **break the fix in more than one way and quote the counts** → `node scripts/proseDiff.mjs
   dump` on both sides (plain `node`, NOT `vite-node`), compared **field by field** → **drive
   the running app** → commit per item ID.
6. Ask, don't default, on: (a) a history no document has a row for, (b) two documents giving
   different doses, (c) anything that would move a verdict.
7. Push/merge policy: **branch → PR → the owner squash-merges.** A session agent cannot merge.

## Lessons this session paid for

- **The suite was green and the card was right, and a surface was still wrong.** The chip
  contradicting the card was found only by driving the app. The corpora record
  `reasons.length`, not reason TEXT, so no sweep could have seen it.
- **Measure the control, not just the change.** "2,289 moved" means little; "0 of 11,082
  patients without a rejected dose moved" is what shows the anchor was not redefined for
  everybody.
- **A mutation caught only by the corpora is barely caught.** Reverting the interval KEY while
  leaving the date moved failed only the sweeps — which get regenerated. It needed a patient
  whose two candidate anchors straddle a Table 2 band boundary (6.93 vs 7.13 months) to be
  assertable at all.
- **A squash-merged parent PR makes a stacked branch look badly broken.** It is mechanical;
  prove it with `git merge-tree` and the tree hashes before resolving.
