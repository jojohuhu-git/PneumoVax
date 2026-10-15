# PneumoVax — Handoff after S6's safe half and S9 both merged (2026-10-15)

> **Supersedes `handoff-2026-10-13-s6-safe-half.md`.** Everything that file left open is
> now closed: its PR **#42 is MERGED** (`eda91f7`), the MeningoVax decision it asked for was
> taken (push as a reviewable PR — **#71, MERGED** as `f0ec86d`), and `S9` is **done and
> merged** (**#43**, `0a64391`). Its `S5`, `S12`, `S7` and the deferred half of `S6` are
> untouched and carried forward below, reordered.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`main`**, clean, in sync with origin at **`0a64391`**. **No open PRs.**
Suite **845 passing / 78 files**, all green. `vite build` exits 0. Pages deploy succeeded
and the live site returns **200**, with the S9 change confirmed present on it.
**`main` is protected: branch → PR → squash merge. Never push to `main`.**

Sibling repo **MeningoVax** (`~/Downloads/MeningoVax-main`): on **`main`**, clean, in sync
at **`f0ec86d`**. Suite **1635 passing / 135 files**. Its PR **#70 is still open** on a
different branch and was not touched this session.

This app's core promise is honesty: a silent wrong answer is worse than a crash. The owner
is a clinician, not a coder — explain every what and why in plain English, in chat and UI copy.

## Owner decisions this session

1. **Merge PR #42 immediately** (done — merged, deployed, live site checked).
2. **MeningoVax's `dateUtils.js` parity goes up as a reviewable PR**, not a direct push to
   its unprotected `main` (done — #71, merged).
3. **Merge PR #43 (S9) including its one visible change** — Date before Product on the
   Results panel (done — merged, deployed, verified on the live site).
4. **Stop after the merges**; add the off-label PCV21 finding to the queue; order the
   remaining queue by recommended priority.

## What's done

### `S6` safe half — PR [#42](https://github.com/jojohuhu-git/PneumoVax/pull/42), `eda91f7`
Four commits, each mutation-proved, detailed in the PR. `S6-1` routine-adult age 50 →
`ROUTINE_ADULT_MIN_M`; `S6-2` the Capvaxive gate stops being called `isAdult`; `S6-3` five
unread age-table entries deleted; `S6-4` `30.4375` → `AVG_DAYS_PER_MONTH`, plus the first
test ever on the `dateUtils.js` mirror. **Zero verdicts moved.**

### MeningoVax parity — PR [#71](https://github.com/jojohuhu-git/MeningoVax/pull/71), `f0ec86d`
The same `dateUtils.js` block, byte-for-byte. `validate.js` drops its private copy of
`30.4375`; `brands.js` keeps its own **on purpose** (recorded decision, left standing).
**Verified after merge: PneumoVax's mirror test runs — not skips — against MeningoVax on
`main` and passes 8/8.** The two copies are now genuinely in step everywhere, not just on
one laptop.

### `S9` / `P4-1` — PR [#43](https://github.com/jojohuhu-git/PneumoVax/pull/43), `0a64391`
The recorded-dose editor was written out twice; it is now one `components/DoseEditor.jsx`
used by both surfaces. Also: the PCV21 dropdown gate moved to
`brands.js` `pcvHistoryProductsFor()`; the PPSV23 key/label come from `PPSV23_PRODUCT`
(four hand-typed copies gone); the `pcvProducts` prop is gone; the panel's density moved
from a per-row margin to `.dose-list-compact`.

**One visible change, and only one:** the Results panel now renders **Date before
Product**, matching the History step and MeningoVax. The two copies had drifted; the design
parity rule settled the direction. Row spacing measured at 4px before and after.
**No verdict moved** — both corpora reproduce byte-for-byte, `sweep:update` was not run.

Five mutations, each run and counted, are in the PR and in `docs/agent/testing.md`.
`S6-2`'s source guards were **rewritten, not weakened** — its nine behavioural tests are
untouched and still pass on both surfaces, which is what says the gate's *answer* did not move.

## What's NOT done — the remaining queue, in recommended priority order

**1. `PCV21-OFFLABEL` — the app refuses to record a dose that really happened. NEW, found
during S9.** `pcvHistoryProductsFor()` hides PCV21 below 18y, so a Capvaxive dose given
off-label to a 17-year-old cannot be entered at all — no warning, no flag, just absent.
Every *other* PCV has a 6-week floor and is **not** gated, because the app's job is to
record what happened and then grade it. This contradicts the 2026-10-12 "warn, do not trap"
decision and the core promise. **Ranked first because it is the only open item where the
app silently drops clinician input.** Needs an owner decision before coding — three options
are written into the logged task. Already logged as a background task. Sonnet 5, medium.

**2. `S6` second half — the ~58 interval prose strings.** Census step 6: one
`intervalPhrase(days)` helper so the displayed words ("8 weeks", "1 year") cannot diverge
from the computed `minIntervalDays`. Confined to `recommend.js` and `riskFactors.js`.
**Deferred on purpose by the owner, not forgotten** — this one CAN change what a clinician
reads, so it needs its own PR and its own verdict-movement story. Opus 5, high effort.

**3. `P4-3` — Enter in a dose row jumps the whole step. CONFIRMED this session.** `S11`
made the wizard a real `<form>`, so Enter in a dose date field now submits and advances to
Results instead of finishing the row. MeningoVax solved this (Item 1 + K6, `d608c14`):
focus the new row's date box when a row is ADDED (not on mount, not on remove), and Enter
on a date/product field moves to the next row or adds one — deliberately excluding the "×"
and the details-unknown tick. Now a one-place change, since S9. Sonnet 5, medium.

**4. `S5` / `P2-1` — the test clock is still NOT pinned.** No `setSystemTime` anywhere;
`src/test-setup.js` only does cleanup. MeningoVax has `src/test-today.js` as a reference.
Plus `P2-13` (wire `scripts/*.mjs` into the suite — only `check-root-notes` is wired) and
`P2-11`. Cheap insurance against the suite rotting on a future date. Expect fixtures to
turn red; **fix the fixtures, do not unpin.** Sonnet 5, medium.

**5. `P4-4` — the history step never asks the yes/no question.** An untouched step is
ambiguous: no doses, or not asked? **Owner decision already recorded (2026-10-10): Option B**
— ONE question covering both streams, "Has the patient received any pneumococcal vaccine?"
with **No previous doses** / **Yes, record doses**; unanswered shows "Select yes or no
above" and Next is refused. Replaces the current `.history-clear-link`. Do not re-litigate.

**6. `PPSV23` tick wording.** The details-unknown tick says "the date and product are
unknown" on a PPSV23 row, where the product is known and shown in a disabled box beside it.
`productIsFixed` in `DoseEditor.jsx` is already the right condition. **Several tests find
this checkbox by that exact text** — split the queries per stream, do not loosen them.
Logged as a background task. Also: `PPSV23_HISTORY_PRODUCTS` in `brands.js` is exported and
imported nowhere (verified 2026-10-15) — use it or delete it.

**7. `S12` — verify and strike off, do not start.** Previously checked: the Color key
legend is gone and status labels read plainly. Confirm, then close. ~10 minutes, can be
done at any point.

**8. `S7` — needs re-scoping**, largely overtaken by `src/test-grid.js` and the two corpora.

**Did NOT reproduce, do not "fix" blind:** peds audit `P1-5`'s 2nd-PPSV23 side-note, `S10-N1`.

### Carried forward, not acted on
- **A dose card states one dose's age in two units at once.** DOB 2026-09-01 + PCV13 on
  2026-09-20: the chip says "age 2 weeks", the reason beside it says "~0 months". Cause:
  `format.js`'s `fmtAgeMonths` uses weeks below ~2 months, `validate.js`'s `fmtAgeM`
  (~line 80) uses months below 24. **`fmtAgeM`'s flooring is deliberate (P3-4) and must not
  be reverted** — extend it to speak weeks.
- **MeningoVax may still use the averaged month where it should not** — it calls
  `DAYS.months` 17 times, and that file's comments record real bugs from exactly that.
  **Those 17 call sites were never audited.** A MeningoVax session should.
- MeningoVax still has the orphaned dose labels in `DoseEditor.jsx`, still unacted.
- **CLAUDE.md still says the impossible-record corpus is 17,485; it is 18,460.**
  `testing.md` was corrected; CLAUDE.md's copy was not. Fix it in passing.

## Why this is a good stopping point

Both repos are on `main`, clean, in sync, green, with nothing open. Three PRs merged, both
deploys succeeded, and the one visible change was confirmed on the live site rather than
assumed. The shared `dateUtils.js` is provably in sync — the mirror test runs rather than
skips. Nothing is half-built, and the next item is a clean decision rather than a
continuation.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main && git pull`. Branch fresh from there.
2. Confirm the suite: **845 passing / 78 files, 0 failing.** Stop and diagnose any mismatch.
3. **ONE OPEN OWNER DECISION, and it gates item 1:** how should an off-label PCV21 dose be
   recordable? The three options are in the logged task. **Ask — do not default.** If she
   would rather not decide yet, start at item 2 or 3 instead.
4. Per item: reproduce → failing test first (**confirm it fails, and for the right reason**)
   → fix → full suite green → **live-verify in the running app** → one commit per item ID.
5. **A new guard is not done until you have broken the code on purpose and quoted the count.**
   Put the counts in the PR and in `docs/agent/testing.md`'s row for that test file.
6. **Never `git checkout <file>` to undo a mutation on uncommitted work** — copy to the
   scratchpad and restore from there. Used five times this session; it works.
7. **A UI regression test needs `// @vitest-environment happy-dom` as its first line**, and
   `fireEvent` rather than `.click()`. **`Results` is a CONTROLLED component** — use a
   stateful harness when the assertion depends on state changing.
8. **A source guard must strip comments first** (reuse `codeOnly()`), and **scope it to the
   real hazard**: S9's first draft forbade a string that also appears in a legitimate
   section heading, and forbade "PCV21" where Results.jsx prints "PCV21 geographic note:".
   Both were the guard overreaching, not the code being wrong.
9. **`React.useId()` returns ids like `:r6:`** — valid HTML, invalid CSS selectors. Use
   `document.getElementById(...)`, never `querySelector('#' + id)`, or the test throws.
10. **Dev server:** `preview_start` with `.claude/launch.json`; it reported 5173 correctly
    this session, but read the real port from `preview_logs` rather than trusting it. A
    server can also be reported started while `neverBecameReady` — check it actually serves.
    **`read_console_messages` returns the tab's whole history** — open a FRESH TAB for a
    clean reading.
11. **Do not re-litigate:** the four decisions at the top of this file; plus everything
    earlier handoffs list (PneumoVax-matches-MeningoVax, warn-do-not-trap, K4
    focus-on-phones, P0's date order, P1-3, S14-4C, PCV7-never-counts, P6-3c, S14-4B, the S8
    rulebook decision, the sweep hard-gate, ANCHOR-1, the 2026-10-11 adult-floor
    determination, `A-P1-1`, the three `P0-2` decisions, `CLINICAL_SPEC.md` §C, the seven
    S14-RC decisions, W1's scope, the two-corpora split, duplicate = same product only,
    P4-4's Option B).
