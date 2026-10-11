# PneumoVax — Handoff after S3, the recorded-dose interval check (2026-10-11)

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`fix/s3-recorded-dose-intervals`**, off `main` @ `9a27e5a`. **Pushed → PR #22,
CI green (`test: pass`), `OPEN / MERGEABLE` — awaiting the owner's merge decision.**

Working tree **clean** at `8ca1295`. Baseline was 353 passing (35 files); now **371 passing
(36 files), all green.** Production build clean. All three PneumoRecs comparison harnesses
(`adult`, `peds`, `hsct`) are **byte-identical before and after this change** — no clinical
verdict moved on a correctly spaced record.

This app's core promise is honesty: a silent wrong answer is worse than a crash.

## 🟢 PR #21 is MERGED (`9a27e5a`); Phases 3 and 6 are closed

S13's work is on `main` and the Pages deploy succeeded. Do not re-litigate it.

## What's done this session

1. **queue `P1-0` + peds audit `P1-4`/`P1-5`** `0ae88c6` — the validator now checks the gap
   between two recorded doses, in both streams. It never did before: a PCV series recorded
   at 2, 2.5, 3 and 3.5 months was graded "On time" four times and counted as a complete
   4-dose series. Three minimums now live in `logic/intervals.js` and are read by **both**
   the validator and the scheduler (they were only ever inside `recommend.js`, which is half
   of why the validator had no rule to apply): PCV→PCV 4 weeks / 8 weeks keyed on the
   **earlier** dose; PCV→PPSV23 ≥8 weeks and never the same visit; PPSV23 dose 2 ≥5 calendar
   years. Sub-minimum → `invalid`. `analyzeHistory` gained an options argument so the PPSV23
   walk can see the PCV doses that counted (the cross-stream design P1-4 asked for).
2. **Docs** `8ca1295` — `CLINICAL_SPEC.md` §K, `docs/agent/clinical-rules.md`,
   `docs/agent/testing.md` (new invariant 10), and closure notes on the two peds-audit items.

## Three things the owner should know

1. **This item's own spec was wrong, and a test caught it.** P1-0 said to anchor each gap
   on the previous **kept** dose. CDC says otherwise — *"The repeat dose should be spaced
   after the invalid dose by the recommended minimum interval"* — so an **invalid** dose
   anchors the dose replacing it. The first draft kept two doses out of the 2/2.5/3/3.5-month
   series instead of one. PCV7 anchors nothing (a properly given dose of a superseded
   product, not a mistimed one).
2. **Adults are deliberately not interval-checked, and this created a new owner decision
   (`S3-N1`).** CDC's adult notes state gaps as recommendations for the *next* dose ("at
   least 1 year after the last PCV13 dose"), never as minimums, and never say a short adult
   gap stops a dose counting. Read live 2026-10-11 with "pneumococcal" (13 hits) as a
   positive control that the collapsed sections had loaded: the adult page has **no**
   same-visit sentence and **no** 8-week floor. Invalidating an adult dose would substitute
   a minimum for a recommendation — the mistake A-P1-1 was raised to correct. The cost: a
   70-year-old given PCV13 then PCV20 five weeks later still reads "On time".
3. **A stale clinical rule was still live in the agent guide.**
   `docs/agent/clinical-rules.md` described the adult PCV15→PPSV23 interval as risk-class
   keyed and named `adultPpsvIntervalClass()`, deleted weeks ago — the rule from *before*
   A-P1-1. S13 fixed this same stale rule in `testing.md` and missed this copy. Corrected.
   **Worth a sweep:** a third copy may exist somewhere neither session looked.

## What's NOT done — the remaining queue

**New, from this session (both written up in the ledger):**
- **`S3-N1` (P2) — DECIDED 2026-10-11: build it. Recommend Opus 5 at high effort.** An
  adult's too-close doses read "On time" with no caveat. The answer is a **third dose
  status** — *counts, but earlier than CDC advises* — which is the "off-window" middle
  verdict P1-0 asked about. It is right for adults and wrong for children (children have a
  real minimum, so they get `invalid`).
  **Why Opus:** the clinical question is already settled and sourced, so this is not
  research — it earns Opus on the ledger's "a refactor touches many files at once" rule plus
  one specific risk. The new status must be added in `validate.js` and then handled
  correctly by every surface that renders a dose chip **and** by the engine's effective-dose
  list. If any one of them treats "counts but early" as not-counting, an adult silently
  loses a dose from their series — a dose-counting error, the category this app exists not
  to produce. Needs the `design-review` skill: the copy must not read as an error.
- **`S3-N2` (P2)** — CDC Table 2's stricter dose-2→3 cell (previous dose at 7–11 months
  needs 8 weeks **and** age ≥12 months) is not enforced; the validator uses p2016's gentler
  footnote, so it can never demand a repeat CDC would have accepted. It is a **keying**
  question, which peds audit `P0-2` owns — do both halves together or the app will advise a
  date it then rejects.
- **The stale-clinical-rule sweep → fold into S8, Sonnet 5 at medium effort** (owner
  direction, 2026-10-11). S3 found a superseded rule still live in
  `docs/agent/clinical-rules.md`; a third copy may exist somewhere. **Do not run this as its
  own session.** S8 already carries `P7-1` (the plain-English rulebook) + `P2-7`
  (`rule-docs-match-code.test.js`), and its stopping point is "the 12-month staleness
  tripwire is live". S8 has to read every current rule statement anyway to build the
  rulebook, so the sweep is nearly free there and duplicated work anywhere else. A one-off
  sweep finds today's copy; the tripwire stops a fourth from appearing.

**Pre-existing:**
- **`S10-N1` (P2)** — PCV21's 18-year gate is checked against CURRENT age, not age at the
  dose (`validate.js`). A 20-year-old with PCV21 recorded at 17 has that dose counted.
- **`S10-N2` (P3)** — the generic "repeat this dose only" line is appended to every invalid
  dose, including one dated before birth.
- **peds audit `P1-2`** — "PCV dose 5 of 4". **Reproduced again this session** with four
  *legitimately* spaced doses all before 12 months (2/4/6/8 months). Still open; it is a
  label bug, not a counting one.
- **peds audit `P0-2`** — `pcvInfant` over-states the series total in 5 of 14 p2016 Table 1
  cells. Owns the interval **keying** question, so it now also owns `S3-N2`.
- **`P7-1`** — the plain-English rulebook + `rule-docs-match-code` tripwire (S8's item).
- **S4–S9, S11, S12** unchanged. Ledger:
  `.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md` (git-ignored, updated).
  **S4 is P1-2, P1-3, P1-4 only.**
- **MeningoVax's own inline styles (9 of them) are untouched** — different repo, **owner
  decision** whether to open a small PR there.

**Did NOT reproduce — do not "fix" it blind:** peds audit P1-5's side-note that the engine
offers a "2nd PPSV23 (≥5y after first)" to a patient who already has two. An IC 13-year-old
with two PPSV23 doses 5 years apart returns `PCV series complete` and offers no further
PPSV23. Re-reproduce before writing anything.

## Why this is a good stopping point

P1-0 was the most serious finding in either audit and it is closed, with the paediatric
audit's P1-4 closed alongside it because they are the same code path. The suite is green,
the tree is clean, the build is clean, and the comparison harnesses prove no verdict moved
on a well-spaced record. Nothing remaining in the queue is blocked by this work, and the two
items it spawned are both deliberately deferred with reasons, not dropped.

## Resuming

1. `cd ~/Downloads/PneumoVax`. **PR #22 is open and green — merge it first** unless the
   owner wants changes, then `git checkout main && git pull`.
2. Confirm the suite: **371 passing / 36 files** (or whatever `main` reports after the
   squash merge). Stop and diagnose any mismatch before new work.
3. **Say the session number and its recommended model + effort in one line, and WAIT**
   (queue rule 1). **The owner's chosen order, 2026-10-11:** `S3-N1` first (**Opus 5 /
   high**), then **S8** (**Sonnet 5 / medium**) with the stale-rule sweep folded in. After
   those, likely **S4 — Sonnet 5 / medium**. **Owner picks the order — ask, don't default.**
4. **Open owner decisions:** (a) merge PR #22; (b) whether to open a small PR against
   MeningoVax for its inline styles. **`S3-N1` is no longer a decision — it was approved on
   2026-10-11; build it.** **No clinical decisions are outstanding** — do not re-litigate
   the adult PPSV23 interval (`CLAUDE.md` + `CLINICAL_SPEC.md` §K), the paediatric risk
   lists (§C), or the adult interval-check exclusion (§K, and `S3-N1`).
5. Per-item workflow: reproduce → failing test first (confirm it fails) → fix → full suite
   green → live-verify in the running app → one commit per finding ID. **For any guard whose
   assertion is "nothing is wrong", introduce the fault on purpose and watch it go red.**
   S3 is a live example of why: the test that caught the anchoring error was a behavioural
   one, and eight of its 18 tests exist only to prove the check does not over-reach.
6. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to
   `main`.**
7. **Dev-server note:** `preview_start` reported port **5173** this session and that was
   correct, but it has been wrong before — read the real port from `preview_logs` if the
   page will not load. A `git stash`/`stash pop` churns every tracked file and floods the
   HMR log; that is not a component edit.
8. **CDC pages:** always read them with a known-present word as a positive control. The
   collapsed sections are hidden, not absent, so "the page doesn't mention X" proves nothing
   without one. This session used "pneumococcal" (13 hits on the adult page).
