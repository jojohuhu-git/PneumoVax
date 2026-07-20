> **SUPERSEDED 2026-07-19** — Session 2 is now fully done (PD4, PD5, and PR #8 landed). See
> `handoff-2026-07-19-session2-design-parity-done.md` for the current state. This file is kept
> for historical detail on PD1–PD3 only.

# PneumoVax — Handoff after Session 2 design parity, partial (2026-07-19)

Branch: `design/pd1-tokens`, off `main` at `a02a05e` (which is `main`'s tip, `9868d93`, plus
one docs-only commit — see item 0 below). **NOT pushed** — PneumoVax's `main` is protected
(branch → PR → `gh pr merge --squash`), and this session stopped before opening a PR.
Baseline was 133 passing tests (7 files); still **133 passing (7 files)**, all green,
confirmed by running `npm test` on this branch just now. Working tree clean at commit
`1b1dde4`.

This is **Session 2** of the cross-app parity plan at
`~/Downloads/vaxapp-main/.claude/prompts/plan-2026-07-16-crossapp-parity-port.md` (see
"SESSION 2 — PneumoVax (design parity + debloat)" for the full PD1–PD5 spec this session
worked from). Session 1 (vaxapp) and Session 3 (PneumoVax PC1) are both already done —
this file only concerns Session 2's own remaining scope.

## What's done (by item ID)

- **Item 0 (untracked docs)** — commit `a02a05e`: committed
  `docs/archive/handoff-2026-07-19-pc1-compliance-chips-done.md`, which a prior session had
  written but never committed. Not part of PD1–PD5; just housekeeping.
- **PD1 (design tokens)** — commit `934c6ab`: ported MeningoVax's `--fs-*` (7-step type
  scale) and `--sp-*` (4px spacing scale) into `src/App.css` `:root`, then swept ~40 ad-hoc
  font-size/margin/padding/gap values in that file onto them. Folded three duplicate border
  hexes (`#f0c79a`, `#f0b0b0`, `#a8cbef`) into the existing `--amd`/`--rmd`/`--bmd` vars they
  were duplicating, and added a named `--c-hover` token replacing a bare `#dcebe0`.
  Deliberately left the `.rec-card.status-*`/`.status-badge`/`.due-pill` block untouched
  (PD2 restructures it) and left the dose-val-* chip hues alone (shared cross-app
  compliance vocabulary, not PneumoVax's to change). Live-verified: full step flow at
  desktop and 375px, no regressions.
- **PD2 (card/layout patterns)** — commit `eada9f4`: ported the timing-colored header bar
  (`rec-card-head` tinted by due/catch-up/shared/neutral, not by clinical reason),
  collapsible neutral cards (complete/not-indicated/deferred collapse to a compact row,
  new `Chevron` icon in a new `src/components/icons.jsx` copied from MeningoVax), the
  answer-first `results-summary-line` ("Due today: PPSV23." / "No pneumococcal doses due
  today." / an HSCT-specific line), and a colors-only "Color key" legend toggle (third
  button next to Adjust age / Recorded doses). PneumoVax's own due-pill/advisory pill and
  `otherHistory` (PC1's addition, no MeningoVax equivalent) were preserved as-is inside the
  new header structure. Live-verified: risk-based due-today card (green header bar,
  "Risk-Based" text label, "Today" pill), a collapsed "Not indicated" card that expands on
  click with a rotating chevron, and the legend panel — at desktop and 375px.
- **PD3 (copy/icon hygiene) — partial, deliberately scoped** — commit `1b1dde4`: replaced
  decorative Unicode glyphs (`✓`, `←`/`→` nav arrows, `⚠`, `ℹ`, a decorative `○`) with the
  SVG `Check`/`Chevron` icons or plain text, and removed em-dashes from **UI chrome and
  short data labels** (`Disclaimer.jsx`, `StepAge.jsx`, `StepHistory.jsx`, `StepRisks.jsx`,
  `RecCard.jsx`'s "Product options" string, two `riskFactors.js` label/sublabel strings).
  Live-verified: step-1 checkmark renders as the new SVG, Back/Next buttons read as plain
  text, Risk Factors intro and the kidney-disease label read cleanly.
  - **NOT done, and not started**: `src/logic/recommend.js` and `src/logic/validate.js`
    contain roughly 50 more em-dashes, inside the clinical `note`/`doseLabel`/`reasons`
    strings that render directly in the rec cards (e.g. `"PPSV23 (≥1 year after PCV15) —
    completes the series"`). These are genuinely user-visible per the plan's PD3 scope, but
    a mechanical find-replace across 50 clinical-guidance strings is exactly the kind of
    blind sweep this app's rules warn against — each needs individual review to confirm the
    punctuation swap doesn't shade the clinical meaning. Left for a dedicated follow-up,
    not rushed into this commit.

## What's NOT done — the remaining queue

From the plan's SESSION 2 section:

- **PD3 remainder (P1)** — the ~50 em-dashes in `recommend.js`/`validate.js` note strings
  described above. Go file-by-file, string-by-string; each swap should be a period, comma,
  or parenthetical, never a content change. No test currently pins these exact strings
  (133/133 stayed green through PD1–PD3), so watch for tests elsewhere that might.
- **PD4 (dead CSS + inline styles)** — not started. Grep `src/components/*.jsx` for
  `style={{` (a prior grep this session found ~20 hits — `Results.jsx`, `StepAge.jsx`,
  `StepHistory.jsx`, `StepRisks.jsx`, `Disclaimer.jsx`) and move them into named `App.css`
  classes. Also grep CSS classNames against JSX usage to find orphaned rules. No visual
  change intended — verify none, at desktop and 375px.
- **PD5 (PneumoVax CLAUDE.md cleanup)** — not started. Per the plan: conservative, keep
  clinical non-negotiables (two boundary constants, PCV7-never-counts, HSCT sources,
  PCV15-requires-PPSV23, `dateUtils.js` mirror-sync) exactly as written. **The plan requires
  showing Joanne the diff in chat before committing this one** — don't commit it silently.
- **Session 2 wrap-up** — not started: no PR opened yet. Per the `ship` skill, PneumoVax's
  `main` is protected; branch → PR → `gh pr merge --squash`, and Joanne reviews before any
  merge. This session's 4 commits are only on the local `design/pd1-tokens` branch, not
  pushed to `origin`.

## Why this is a good stopping point

Each of PD1/PD2/PD3(partial) is its own commit with the full test suite green and a live
browser check after it landed — nothing is half-edited mid-commit. PD3's deferred remainder
is explicitly named rather than silently skipped. PD4 and PD5 haven't been touched, so
there's no risk of resuming into a partially-edited file.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout design/pd1-tokens`. Run `npm test` — confirm
   **133 passing (7 files)** before any new work. If the count differs, stop and reconcile.
2. Start the dev server: `preview_start` name `"PneumoVax dev server"` (config
   `~/Downloads/vaxapp-main/.claude/launch.json`, port 5182). Note: this session hit a
   browser-pane routing bug where the auto-assigned proxy port pointed at a stale/wrong
   local port — if `navigate` to the reported port is denied, check
   `lsof -i :5182 -sTCP:LISTEN` for orphaned `vite` processes from earlier sessions, kill
   them, and re-run `preview_start` so it binds cleanly to the configured port.
3. No open owner decision blocks continuing — the order (PD3 remainder → PD4 → PD5 → PR) is
   the plan's own order and nothing is ambiguous. One thing to flag to Joanne when
   convenient, not blocking: whether the ~50-string `recommend.js`/`validate.js` em-dash
   sweep should happen in this session at all, or be split into its own follow-up given its
   size relative to the rest of PD3.
4. Per-item workflow (same as this session used): make the change → run the full suite →
   live-verify anything visible in the running app at desktop and 375px → commit named by
   item ID, with a commit message stating what was verified.
5. PD5 specifically: paste the CLAUDE.md diff in chat and get Joanne's OK before committing
   it, per the plan.
6. When PD4/PD5 (or whatever subset gets done) are ready: full suite green, screenshot any
   visual change, open one PR (or a small sensible set) via the `ship` skill. Do not merge
   without Joanne's OK.
7. If work still remains afterward, write a fresh handoff and mark this file superseded,
   same as this file superseded `handoff-2026-07-19-pc1-compliance-chips-done.md`.
