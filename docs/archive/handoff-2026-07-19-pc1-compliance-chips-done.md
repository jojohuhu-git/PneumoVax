# PneumoVax — Handoff after PC1 compliance-audit chips (2026-07-19)

> **SUPERSEDED** for the "what's next" question by
> `docs/archive/handoff-2026-07-19-session2-design-parity-partial.md`. This file's PC1
> record is still accurate (PC1 is merged and done); go to the newer file for the current
> queue — Session 2 (design parity) is now in progress on its own branch, not unstarted.

Branch: `main`. Clean, up to date with `origin/main` at commit `9868d93` (PR #7,
squash-merged). Baseline was 126 passing tests (6 files); now **133 passing (7 files)**,
all green, confirmed by running `npm test` on `main` at this commit. Deploy to GitHub
Pages fired automatically on merge and succeeded (`gh run list` confirmed both the
`Tests` and `Deploy to GitHub Pages` workflow runs green); spot-checked the live site at
`https://jojohuhu-git.github.io/PneumoVax/` — loads fine.

This session is **Session 3** of the cross-app parity plan at
`~/Downloads/vaxapp-main/.claude/prompts/plan-2026-07-16-crossapp-parity-port.md`.

## What's done (by item ID)

- **PC1 (compliance-audit table)** — done, but not as originally specified. The plan said
  to mirror `MeningoVax-main/src/components/ComplianceAudit.jsx`. That file no longer
  exists: MeningoVax built it (commit `1661921`, item B1) and then deliberately removed
  it (commit `1d0be1e`, item E5) because it duplicated the same per-dose validity info
  already shown inline under each vaccine card, in a different section with different
  wording. **Owner confirmed**: build PneumoVax's version as inline chips, matching what
  MeningoVax actually ships today, not the deleted standalone-table pattern.
  - Added a "Recorded:" dose list under each `RecCard`, with a status chip per dose:
    **On time** (green, valid), **Invalid** (red, below min age), **Unknown** (gray, no
    date), **Recorded (does not count)** (amber — PneumoVax's own 4th state, for PCV7,
    which was validly given but never counts toward the series per ACIP/immunize.org).
  - Reuses `validate.js`'s existing `analyzeHistory()` output directly — no validity
    logic was recomputed in the UI, per CLAUDE.md's "All Clinical Logic in the Engine"
    rule. Exported the previously-private `ageAtDoseFromDate` from `validate.js` for
    `RecCard` to compute the "age at administration" line (mirrors MeningoVax's
    architecture, where the same helper is exported for the same reason).
  - **Gap found during live-testing, fixed in the same PR**: PneumoVax's engine only
    emits a card for a vaccine when there's something actionable to say (e.g. a
    completed PCV series with PPSV23 still pending renders *only* a PPSV23 card — no PCV
    card at all). That left the recorded PCV doses, including the PCV7-never-counts
    note, with nowhere to render. **Owner confirmed** the fix: when a vaccine's history
    has no card of its own, attach it as a labeled secondary block (`"PCV history:"`) on
    the first card that does render, via a new `otherHistory` prop on `RecCard`. This
    never happens in MeningoVax (which always emits exactly one card per vaccine), so
    it's a genuine PneumoVax-specific addition, not a port.
  - Added `--amd` / `--rmd` (amber/red medium-border) CSS custom properties to
    `App.css`, following the existing `--gmd`/`--cmd` naming convention. Chips use
    PneumoVax's current px/rem CSS units (Session 2's design-token port hasn't landed
    yet — per the plan, that's fine, the design session will sweep this later).
  - Tests: `src/components/__tests__/RecCard.test.jsx` (new, 6 tests — one per chip
    state + the dose descriptor), plus one App-level integration test in
    `App.test.jsx` reproducing the exact orphan-history scenario end to end (adult,
    chronic lung disease, PCV7 dose + PCV15 dose, no PPSV23 → only a PPSV23 card
    renders, PCV history still shows the "does not count" chip and full ACIP note).
  - Live-verified in the browser: the orphan-history scenario above, plus a normal
    scenario (single PCV card with its own doses attaches directly, no duplication,
    label reads "Recorded:" not "PCV history:").
  - Merged as [PR #7](https://github.com/jojohuhu-git/PneumoVax/pull/7), commit
    `9868d93`.

## What's NOT done — the remaining queue

From `~/Downloads/vaxapp-main/.claude/prompts/plan-2026-07-16-crossapp-parity-port.md`:

- **Session 2 — PneumoVax design parity + debloat**: still untouched. Port MeningoVax's
  design tokens (7-size type scale, 4px spacing scale, shadow/radius hierarchy, teal
  option-box color, unified amber), the card/layout patterns (timing-colored header bar,
  answer-first summary, collapsible complete/not-indicated/deferred cards, colors-only
  legend), copy/icon hygiene (no em-dashes, no Unicode glyphs), dead-CSS/inline-style
  cleanup, and PneumoVax's own `CLAUDE.md` cleanup. See "SESSION 2" in the plan file for
  the full PD1–PD5 breakdown. Independent of this session — can run before or after.
  - Note for whoever does Session 2: this session's new `--amd`/`--rmd` vars and
    `.dose-val-*` / `.rec-progress-*` chip CSS use PneumoVax's *current* px/rem units,
    not the `--fs-*`/`--sp-*` token scale Session 2 will introduce. Sweep those onto the
    new tokens when Session 2 lands — the plan already expects this ("if the design-token
    port hasn't happened yet, that's fine — build with current styles; the design
    session will sweep it later").
- Nothing else remains from the cross-app parity plan — vaxapp (Session 1) closed out in
  the prior session (`vaxapp-main/docs/archive/handoff-2026-07-19-session1-complete.md`,
  now superseded by this file for the "what's left" question — vaxapp's own queue is
  still fully closed, only the cross-repo "what's next" pointer moves here).

## Why this is a good stopping point

PC1 is fully merged, tested (133/133), and live-verified, including a real gap this
session found and fixed rather than shipping around. Session 2 is unstarted, independent,
and in the same repo but a different concern (styling vs. clinical data display) — no
half-finished work sits between them.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main && git pull`. Run `npm test` — confirm
   **133 passing (7 files)** before any new work. If the count differs, stop and
   reconcile before proceeding.
2. Next work is **Session 2 (design parity)** in this same repo — read "SESSION 2" in
   `~/Downloads/vaxapp-main/.claude/prompts/plan-2026-07-16-crossapp-parity-port.md`.
   No open owner decision blocks starting it.
3. Per-item workflow: reproduce/verify → failing test if applicable → minimal fix → full
   suite green → live-verify in the running app (design work must be *seen*, screenshot
   it) → commit named by item ID (PD1–PD5).
4. PneumoVax's `main` is protected — branch → PR → `gh pr merge --squash`, same as this
   session. Confirm with the `ship` skill before pushing.
5. Dev server: `preview_start` name `"PneumoVax dev server"` — this session added that
   entry to `~/Downloads/vaxapp-main/.claude/launch.json` (port 5182, autoPort enabled;
   port 5180 was occupied by another session's server).
