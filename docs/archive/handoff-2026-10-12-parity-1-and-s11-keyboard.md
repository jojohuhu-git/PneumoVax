# PneumoVax — Handoff after PARITY-1 and all of S11 (2026-10-12)

> **Supersedes `handoff-2026-10-12-impossible-entries-coverage-and-warnings.md`.** Its two
> "ask the owner" items are both ANSWERED and one of them was based on a **wrong premise** —
> see §1 below. Its `S11` is now **DONE in full**. `S5`, `S6`, `S9` are untouched and carried
> forward. `S7` and `S12` are re-scoped: see "What's NOT done".

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`fix/impossible-entries-coverage-and-warnings`**, off `main`, pushed and clean at
**`83b5503`**. Open PR: **[#41](https://github.com/jojohuhu-git/PneumoVax/pull/41)** — now
**10 commits**, **`test` check PASSED on `83b5503`**, awaiting the owner's review.
**`main` is protected: branch → PR → squash merge. Never push to `main`.**
Baseline at session start **743 passing / 67 files**; now **786 passing (73 test files)**,
all green, `vite build` exits 0.

Sibling repo: **MeningoVax [PR #70](https://github.com/jojohuhu-git/MeningoVax/pull/70)** is
**still open, `test` check PASSED** (it was pending when the last handoff was written —
checked today, it is green). Nothing in this session touched MeningoVax.

This app's core promise is honesty: a silent wrong answer is worse than a crash. The owner is
a clinician, not a coder — explain every what and why in plain English, in chat and UI copy.

## Owner decision this session

**"PneumoVax should match MeningoVax, not the other way around"** (2026-10-12), given in
answer to the previous handoff's two open questions. Applied. It is also what the standing
design-parity rule already said, so treat the direction as settled: design-system changes
flow MeningoVax → PneumoVax.

## What's done

### 1. `PARITY-1` — the impossible-date warning is a tinted box — `1d36e84`
**The previous handoff was WRONG about this, and the correction matters more than the fix.**
It recorded the difference as a BEHAVIOUR one: "MeningoVax's history step disables Next on a
future date; PneumoVax warns and lets you through." MeningoVax has **no `disabled` prop
anywhere in its `src/`** — it warns and lets the clinician continue, exactly as PneumoVax
does. Both apps also already block a future date of BIRTH. So the owner's **"warn, do not
trap"** decision was never in conflict with the sibling app and is unchanged.

The only real difference was appearance. `.dose-row-date-problem` is now a
declaration-for-declaration copy of MeningoVax's `.dose-row-problem`; every token it uses is
defined identically in both apps. A test compares the two rules and fails if either drifts
(it skips that one comparison when the sibling repo is not checked out, because CI clones
only this repo).

### 2. `S11` — COMPLETE. All six sub-items plus the labels
- **labels** — `18ec9f9`. 8 orphaned labels, not the 4 the handoff named: `Product` was
  broken the same way as `Date (optional)`. Fixed on **both** editors with `useId`.
- **`P5-4`** — `eff57fa`. One `:focus-visible` rule (MeningoVax's K5, ported); the dose
  fields get the age field's halo. There was no `:focus-visible` rule in the app at all.
- **`P5-1` + `P5-2`** — `931ac2d`. The wizard had **no `<form>`** (`document.forms.length`
  was 0), so Enter did nothing. Now a real form; all 16 typeless buttons carry an explicit
  `type="button"`, which had to land in the same commit or they would default to submit.
- **`P5-6`** — `a8bfc1d`. "No risk factors apply" was a `<label>` with `role="button"` that
  handled Enter but **not Space**, and carried its on/off state only in a CSS class. Now a
  real `<button>` with `aria-pressed` (MeningoVax's pattern).
- **`P5-3` + `P5-5`** — `83b5503`. The cursor lands on each step's first field (owner
  decision from MeningoVax K4: on phones too); Results deliberately keeps focus. Escape
  closes either Results panel, through the same `closeDosePanel` the mouse uses.

Every guard was proved by breaking the code on purpose and quoting the count. Everything
UI-observable was driven in the running app at desktop and 375px, no console errors.

### 3. Three mistakes worth not repeating
- A test asserting `next.type === 'submit'` **passed on the broken code**: a `<button>` with
  no type already reports `.type === "submit"`. Assert `getAttribute('type')`.
- Two source guards reported a **comment** as an offending `<button>` / `onKeyDown`, because
  the comment explaining the rule contains the words. Both now strip comments, replacing the
  text with its own newlines so line numbers stay true. Re-proved by mutation afterwards.
- An Escape `useEffect` was first written **below `Results.jsx`'s `if (excluded)` early
  return** — React would have thrown for an excluded patient. Hooks go above it.

## What's NOT done — the remaining queue

**The owner's stated order is `S6`, then `S9`, then `S5`.**

- **`S6` — one number, one home. Opus 5, high effort. START IT ON ITS OWN BRANCH.**
  It touches `recommend.js`, `validate.js` and every clinical threshold, so it must **not**
  share a PR with this session's UI work: if it moves a verdict, a reviewer cannot tell
  which half caused it. It is independent of everything on PR #41 and can branch off `main`.
  **Its census input (`docs/archive/census-2026-10-10-pneumovax-numbers.md`) is partly out of
  date, in your favour** — it claims 6 copies of `30.4375`, but only 3 are live code now;
  the rest are comments about past bugs. Re-measure before trusting any count in it.
  Still real today: `600` (age 50) has 2 literals and no shared constant, `24` (PPSV23 min
  age) has literals in 4 files, and `scheduleConstants.js` still exports only 2 constants.
  **Expect the sweep corpora to move. Do not run `npm run sweep:update` until you can say
  why**, then put both moved counts in the PR.
- **`S9` / `P4-1` — the dose editor is still duplicated** in `StepHistory.jsx` and
  `Results.jsx`. Sonnet 5, medium. **This session made the case stronger again**: the label
  fix had to be written twice, and MeningoVax has already done it (`DoseEditor.jsx`).
  It is pure UI, so unlike `S6` it would sit happily alongside this PR's work.
- **`S5` / `P2-1` — the test clock is still NOT pinned** (confirmed: no `setSystemTime`
  anywhere; `src/test-setup.js` only does cleanup). MeningoVax has `src/test-today.js` as a
  reference. Plus `P2-13` (wire `scripts/*.mjs` into the suite — only `check-root-notes` is
  wired today) and `P2-11`. Sonnet 5, medium. Expect fixtures to turn red; fix the fixtures,
  do not unpin the clock.
- **`S12` — verify and strike off, do not start.** Checked this session: the Color key
  legend is already gone and the status labels read plainly. Confirm, then close it.
- **`S7` — needs re-scoping**, largely overtaken by `src/test-grid.js` and the two corpora.
- **Did NOT reproduce, do not "fix" blind:** peds audit `P1-5`'s 2nd-PPSV23 side-note,
  `S10-N1`.

### New, found this session — not acted on
- **MeningoVax has the identical orphaned dose labels** in `DoseEditor.jsx`, and its
  `.risk-none`/keyboard work is already done. PneumoVax is now AHEAD on labels, as it
  already was on P7-2's inline styles. A small MeningoVax PR would square it.

## Why this is a good stopping point

`S11` is complete as a unit and every commit in PR #41 is UI or keyboard work — one coherent
thing for a clinician to review. CI is green, the tree is clean, nothing is half-built. The
next item, `S6`, is the one item in the queue that can silently change a clinical verdict,
and deliberately belongs in its own PR rather than stacked on ten UI commits.

## Resuming

1. `cd ~/Downloads/PneumoVax`. **PR #41 is open and green — the owner should merge it
   first.** Then `git checkout main && git pull` and branch fresh for `S6`.
   If it is not merged, `git checkout fix/impossible-entries-coverage-and-warnings`.
2. Confirm the suite: **786 passing / 73 files, 0 failing.** Stop and diagnose any mismatch.
3. **Do not re-litigate:** this session's "PneumoVax matches MeningoVax" direction;
   warn-do-not-trap (never actually in question); K4's focus-on-phones-too. Plus everything
   earlier handoffs list (P0's date order, P1-3, S14-4C, PCV7-never-counts, P6-3c, S14-4B,
   the S8 rulebook decision, the sweep hard-gate, ANCHOR-1, the 2026-10-11 adult-floor
   determination, `A-P1-1`, the three `P0-2` decisions, `CLINICAL_SPEC.md` §C, the seven
   S14-RC decisions, W1's scope, the two-corpora split, duplicate = same product only).
   **No owner decisions are currently outstanding.**
4. Per item: reproduce → failing test first (**confirm it fails, and for the right reason**)
   → fix → full suite green → **live-verify in the running app** → one commit per item ID.
5. **A new guard is not done until you have broken the code on purpose and quoted the count.**
6. **Never `git checkout <file>` to undo a mutation on uncommitted work** — copy to the
   scratchpad and restore from there.
7. **A UI regression test needs `// @vitest-environment happy-dom` as its first line**, and
   `fireEvent` rather than `.click()` — a raw DOM click fires outside React's `act()` and the
   component never re-renders, so assertions read a stale tree.
8. **`Results` is a CONTROLLED component.** A test with an `onChange` spy that only records
   will never see state change; use a stateful harness when the assertion depends on it.
9. **Dev server:** `preview_start` with `.claude/launch.json`. **Its reported port was wrong
   again** (said 59610, really 5173 — and a second stale server was live on 5174). Read the
   real port by curling it, and confirm it serves YOUR tree.
10. **The automation harness cannot trigger implicit form submission or Enter/Space button
    activation.** Proved with a control: a vanilla `<form>` injected into the page recorded
    0 submits on a harness Enter. Use `form.requestSubmit()` (the native path) to verify
    submission, and say plainly in the commit what was not observed. **Escape and real
    `Tab` DO work** under the harness — document-level key listeners receive them.
