> **SUPERSEDED (2026-10-15) by `handoff-2026-10-15-s6-interval-prose-merged.md`.**
> This file's queue items **2, 3 and 4 are all DONE and MERGED** — item 3 (`P4-3`) as PR #47
> (`7b1a1e5`), item 4 (`S5`/`P2-1`+`P2-13`) as PR #48 (`999393b`), and item 2 (`S6`'s second
> half) as PR #49 (`9b4d321`). Items **3 and 4 merged without a handoff being written**, so
> this file was two PRs stale by the time a session resumed from it. Items 5-8 and N1-N2 are
> carried forward in the new file, numbering preserved, with MeningoVax parity checked for
> each. **Do not resume from this file.**

# PneumoVax — Handoff after PCV21-OFFLABEL merged (2026-10-15)

> **Supersedes `handoff-2026-10-15-s6-and-s9-merged.md`.** That file's queue item 1
> (`PCV21-OFFLABEL`) is **done and merged** (PR **#45**, `9861f4d`). Its items 2–8 are
> untouched and carried forward below with their numbering preserved, so the IDs still
> cross-reference. Two of its "carried forward" notes are corrected here.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`main`**, clean, in sync with origin at **`9861f4d`**. **No open PRs.**
Suite **854 passing / 79 files**, all green (verified on merged `main`, not remembered).
`npm run build` exits 0. Pages deploy succeeded and the change is **confirmed on the live
site**, not assumed.
**`main` is protected: branch → PR → squash merge. Never push to `main`.**

Sibling repo **MeningoVax** (`~/Downloads/MeningoVax-main`): on **`main`**, clean, at
`f0ec86d`. **Not modified this session** — checked for the same bug and it does not have it
(see below). Its PR **#70 is still open** on a different branch and was not touched.

This app's core promise is honesty: a silent wrong answer is worse than a crash. The owner
is a clinician, not a coder — explain every what and why in plain English, in chat and UI copy.

## Owner decisions this session

1. **`PCV21-OFFLABEL`: record it, flag it, do NOT count it.** Taken after being shown the
   sources — the first framing put to her (mine) wrongly recommended *counting* the dose,
   which contradicted both CDC and a verdict the app already shipped. She was shown the
   correction and chose the source-consistent option. **Do not re-litigate.**
2. **The 18-vs-19 counting floor is a separate question**, to be settled from worked
   examples rather than a rule quote. Logged, not decided. See the queue below.
3. **Merge #45 and verify the deploy** (done — merged, deployed, live site checked).

## What's done

### `PCV21-OFFLABEL` — PR [#45](https://github.com/jojohuhu-git/PneumoVax/pull/45), `9861f4d`

The history dropdown hid PCV21 whenever the patient was under 18 **today**, so a Capvaxive
dose given off-label to a 17-year-old could not be entered at all — the clinician's input
dropped with no warning. The gate is **deleted**, parameter and all; both dose editors now
take `PCV_HISTORY_PRODUCTS` (every PCV, every age). Files: `src/data/brands.js`,
`StepHistory.jsx`, `Results.jsx`.

**The verdict did not change and was not touched.** `validate.js` already graded such a
dose `invalid` — "licensed for adults ≥18 years only… it does not count" — against the
product's own `minAgeM`. It simply became reachable from the screen for the first time.
Sources quoted in full in the PR, in `CLINICAL_SPEC.md` §I, and in the test header: FDA
approval ≥18 (MMWR mm7336a3) and CDC General Best Practices ("Doses of any vaccine
administered ≥5 days earlier than the minimum interval or age should not be counted as
valid doses and should be repeated as age appropriate").

**No verdict moved.** Both corpora reproduce byte-for-byte; `sweep:update` was NOT run.
The gate was UI-only and never reached the engine.

Suite 845/78 → **854/79**: +11 new in
`regression-pcv21-offlabel-recordable.test.jsx`, −2 deleted from
`regression-s6-2-pcv21-age-gate-one-home.test.jsx` (its two "hides PCV21 below the floor"
tests, one per surface — **deleted, not loosened**: they described the bug correctly as the
behaviour of the day). All three S6-2 source guards survive; one was rewritten because it
required the deleted function to exist.

Four mutations, each run, counted and restored from the scratchpad, are in the PR and in
`docs/agent/testing.md`. The one worth knowing: **deleting `validate.js`'s explicit
"licensed for adults ≥18 only" branch fails only 2 of 854** — the generic minimum-age check
still refuses the dose, with different wording. Two independent paths refuse to count it.

### Also landed in #45
- `CLINICAL_SPEC.md` §I now states both halves (always recordable, never counts) with
  sources, plus the open 18-vs-19 question.
- `docs/agent/architecture.md` no longer describes the deleted function as current.
- `docs/agent/testing.md`: stale corpus count `17,485` → `18,460` **(the previous handoff
  had this backwards — it said CLAUDE.md was stale and testing.md corrected; CLAUDE.md was
  already right at both of its mentions).**

## What's NOT done — the remaining queue, in recommended priority order

Numbering continues from the previous handoff; item 1 is now done.

**2. `S6` second half — the ~58 interval prose strings.** One `intervalPhrase(days)` helper
so the displayed words ("8 weeks", "1 year") cannot diverge from the computed
`minIntervalDays`. Confined to `recommend.js` and `riskFactors.js`. **Deferred on purpose
by the owner, not forgotten** — this one CAN change what a clinician reads, so it needs its
own PR and its own verdict-movement story. Opus 5, high effort.

**3. `P4-3` — Enter in a dose row jumps the whole step.** `S11` made the wizard a real
`<form>`, so Enter in a dose date field submits and advances to Results instead of finishing
the row. MeningoVax solved this (Item 1 + K6, `d608c14`): focus the new row's date box when
a row is ADDED (not on mount, not on remove); Enter on a date/product field moves to the
next row or adds one — deliberately excluding the "×" and the details-unknown tick. A
one-place change since S9. Sonnet 5, medium.

**4. `S5` / `P2-1` — the test clock is still NOT pinned.** No `setSystemTime` anywhere;
`src/test-setup.js` only does cleanup. MeningoVax has `src/test-today.js` as a reference.
Plus `P2-13` (wire `scripts/*.mjs` into the suite — only `check-root-notes` is wired) and
`P2-11`. Expect fixtures to turn red; **fix the fixtures, do not unpin.** Sonnet 5, medium.

**5. `P4-4` — the history step never asks the yes/no question.** **Owner decision already
recorded (2026-10-10): Option B** — ONE question covering both streams, "Has the patient
received any pneumococcal vaccine?" with **No previous doses** / **Yes, record doses**;
unanswered shows "Select yes or no above" and Next is refused. Do not re-litigate.
**New this session: the reference implementation is `MeningoVax/src/components/StepHistory.jsx`,
which already does exactly this, wording and all. Copy it rather than designing it.**

**6. `PPSV23` tick wording.** The details-unknown tick says "the date and product are
unknown" on a PPSV23 row, where the product is known and shown in a disabled box beside it.
`productIsFixed` in `DoseEditor.jsx` is already the right condition. **Several tests find
this checkbox by that exact text** — split the queries per stream, do not loosen them.
Also: `PPSV23_HISTORY_PRODUCTS` in `brands.js` is exported and imported nowhere (still true
after #45) — use it or delete it.

**7. `S12` — verify and strike off, do not start.** Previously checked: the Color key legend
is gone and status labels read plainly. Confirm, then close. ~10 minutes.

**8. `S7` — needs re-scoping**, largely overtaken by `src/test-grid.js` and the two corpora.

### New items logged this session (both have background-task chips)

**N1. PCV21's counting floor: 18y or 19y? — OWNER DECISION, deliberately deferred.**
The app counts a PCV21 dose from **18y** (the FDA licence, `PCV21_MIN_AGE_M`). But **CDSI
v4.64** (`supporting-data-4.64-508.zip` in `~/Downloads`; PCV21 is **CVX 327**) lists
`preferableVaccine beginAge` **"19 years"** and `allowableVaccine beginAge` **"19 years −
4 days"** — CDC's own hard boundary with the 4-day grace already applied — and ACIP's
recommendation itself begins at 19. So CDC's logic would refuse a dose this app counts: one
given to an 18-year-old. **She asked for worked examples of an 18- and a 19-year-old from
real engine runs, plus the corpus movement count, before ruling.** Written up as an open
question in `CLINICAL_SPEC.md` §I. Part of the question is whether an `allowableVaccine
beginAge` is a CDSI "absolute" field (a hard limit) or a "preferable" one (yields to ACIP).

**N2. `rule-docs-match-code.test.js`'s stale-identifier guard has two holes.** It stayed
green while `architecture.md` described `pcvHistoryProductsFor()` after I deleted it.
(a) Its regex only matches names in **backticks**; that doc wrote the name bare.
(b) `srcText` includes **comments**, so a deleted function politely mentioned in its own
tombstone comment still counts as "exists in src/" — which defeats the guard in exactly the
situation it was built for (the four stale copies of the pre-A-P1-1 interval all named a
deleted function). Suggested fix: strip comments with `codeOnly()` before building
`srcText`, and widen the doc regex. Expect it to surface other legitimately-retired names.
Its own PR, with a mutation count proving it would have caught this escape.

### Carried forward, not acted on
- **A dose card states one dose's age in two units at once.** DOB 2026-09-01 + PCV13 on
  2026-09-20: the chip says "age 2 weeks", the reason beside it says "~0 months". Cause:
  `format.js`'s `fmtAgeMonths` uses weeks below ~2 months, `validate.js`'s `fmtAgeM`
  (~line 80) uses months below 24. **`fmtAgeM`'s flooring is deliberate (P3-4) and must not
  be reverted** — extend it to speak weeks.
- **MeningoVax may still use the averaged month where it should not** — `DAYS.months` ×17,
  never audited. A MeningoVax session should.
- MeningoVax still has the orphaned dose labels in `DoseEditor.jsx`, still unacted.
- **Checked and NOT a bug (new this session):** MeningoVax does **not** have PneumoVax's
  dropdown-gate bug. It passes flat `MENACWY_HISTORY_BRANDS` / `MENB_HISTORY_BRANDS`
  constants with no age filtering anywhere, so PneumoVax's gate was the odd one out and
  #45 brings the two apps into line. No parity PR is owed.

## Why this is a good stopping point

Both repos are on `main`, clean, green, with nothing open. The PR is merged, the deploy
succeeded, and the change was confirmed on the live site rather than assumed. Nothing is
half-built. The one open owner decision (N1) blocks nothing — every remaining queue item
can proceed without it.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main && git pull`. Branch fresh from there.
2. Confirm the suite: **854 passing / 79 files, 0 failing.** Stop and diagnose any mismatch.
3. **No decision gates the next item.** Items 2–8 can all start cold. If she wants a
   decision settled first, N1 is the one waiting — **ask, do not default**, and bring
   worked engine output, not a rule quote.
4. Per item: reproduce → failing test first (**confirm it fails, and for the right
   reason**) → fix → full suite green → **live-verify in the running app** → one commit per
   item ID.
5. **A new guard is not done until you have broken the code on purpose and quoted the
   count.** Put the counts in the PR and in `docs/agent/testing.md`'s row for that file.
6. **Before changing any clinical rule, fetch the source live and quote it** — the
   `verify-clinical-source` skill. This session is the reason: the first option put to the
   owner was wrong, and only reading `validate.js` and CDC's own page caught it. A handoff
   or a code comment is not a source.
7. **Never `git checkout <file>` to undo a mutation on uncommitted work** — copy to the
   scratchpad and restore from there. Used five times this session; it works.
8. **A UI regression test needs `// @vitest-environment happy-dom` as its first line**, and
   `fireEvent` rather than `.click()`. **`Results` is a CONTROLLED component.** When
   rendering the same component at several inputs in ONE test, call `cleanup()` between
   renders — queries that read "the first X on screen" otherwise inspect a stale render and
   the test passes no matter what the code does.
9. **A source guard must strip comments first** (reuse `codeOnly()`), and **scope it to the
   real hazard**. Prefer a BEHAVIOURAL guard where one exists: #45's strongest assertion is
   that the offered product list is identical at eight ages, which catches a gate keyed on
   any number, in any file, under any name — a name-based guard catches none of those.
10. **Dev server:** `preview_start` with `.claude/launch.json`. **It reported port 55115
    this session and the real port was 5174** (5173 was taken by another session's server) —
    always read the real port from `preview_logs`.
11. **Do not re-litigate:** the three decisions at the top of this file; plus everything
    earlier handoffs list (PneumoVax-matches-MeningoVax, warn-do-not-trap, K4
    focus-on-phones, P0's date order, P1-3, S14-4C, PCV7-never-counts, P6-3c, S14-4B, the S8
    rulebook decision, the sweep hard-gate, ANCHOR-1, the 2026-10-11 adult-floor
    determination, `A-P1-1`, the three `P0-2` decisions, `CLINICAL_SPEC.md` §C, the seven
    S14-RC decisions, W1's scope, the two-corpora split, duplicate = same product only,
    P4-4's Option B).
