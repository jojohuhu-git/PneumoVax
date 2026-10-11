# PneumoVax — Handoff after S13, Phase 6b (2026-10-11)

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`fix/s13-phase-6b-citations`**, off `main` @ `6e9dbe5`. **Pushed → PR #21, CI green
(`test: pass`), `OPEN / CLEAN` — awaiting the owner's merge decision.**

Working tree **clean** at `11636e7`. Baseline was 327 passing (29 files); now **353 passing
(35 files), all green.** Production build clean. The three PneumoRecs comparison harnesses
(`adult`, `peds`, `hsct`) are **byte-identical to the pre-S13 baseline** — no clinical verdict
moved in any of the 44 comparison cases.

This app's core promise is honesty: a silent wrong answer is worse than a crash.

## 🟢 PR #20's hold is CLEARED, and #20 is MERGED (`6e9dbe5`)

The owner released the hold on 2026-10-11 once `P3-9`'s `RiskAgeNote` landed in it. **Phase 3
is now closed.** The live site no longer gives a 15-year-old with "Cigarette smoking" ticked
an at-risk catch-up regimen — verified by driving the deployed site after the Pages deploy
succeeded. **Do not re-litigate the hold; it is history.**

## What's done this session — by ID, one commit each

1. **`P3-9` UI half** `3edb252` (in PR #20) — `RiskAgeNote`: an adult-only risk ticked on a
   child is shown, kept, and explained rather than silently ignored. Renders on **both**
   surfaces (`StepRisks` and the Results header). Keyed to `ADULT_SCHED_MIN_M` (228), not the
   18y PCV21 product gate. Wording from two live-fetched CDC sentences.
2. **`P6-3a`** `420bea1` (in PR #20) — the citation plumbing: `cite()`/`highlightUrl()` in
   `refs.js`, `components/citations.jsx`, `noteCites`/`reasonCites` on the engine.
3. **`P6-3b`** `e91590c` — **all 35 engine notes** wired to live-fetched CDC sentences
   (measured over 6,883 recommendations). Engine-wide marker/citation parity sweep added.
   Corrected a false claim in `cdcRiskIndications`'s label.
4. **`P6-4`** `53d901f` — note is `{lead, detail}` + "Why this". Median note **188 → 129**
   chars, longest **459 → 225**, over-200 count **15 → 2**.
5. **`P6-5`** `e882807` — Results reads the engine's `perDose` instead of walking the history
   twice. **Engine fix: `perDose` was `{}` not `[]` on the hard-stop path.**
6. **`P6-6`, `P6-7`, `P7-2`** `d505ffe` — toggles keep their label; the current-risk-status
   caveat + the PPSV23 ages 2–5 case; an inline-style/hex tripwire (PneumoVax is AHEAD here —
   nothing ported).
7. **Docs** `11636e7` — `architecture.md`, `testing.md`, `CLINICAL_SPEC.md`.

## Three findings the owner should know about

1. **⚠ CDC pages hide their collapsed sections rather than removing them.** Reading the
   visible text returns ~9,200 chars in which *"cochlear"* and *"diabetes"* are **also**
   absent — so a "no mention of smoking" result read that way proves **nothing**. The full
   read is 75,723 chars. **Always keep a known-present word as a positive control.** Written
   into `CLINICAL_SPEC.md` §C, the code comments, and memory.
2. **A stale rule in `testing.md` was corrected.** Invariant 7 still described the adult
   PPSV23 interval as "IC/cochlear/CSF = 8 weeks; non-IC chronic = 1 year, source
   `adultPpsvIntervalClass()`" — the rule from **before** the A-P1-1 amendment, naming a
   function that no longer exists. A session reading it would have implemented the superseded
   rule.
3. **One of my own guards was vacuous and is fixed.** The citation sweep read dose verdicts
   from the wrong property, walking **zero** verdicts while reporting green; the combined
   "sweep is not empty" check hid it because notes alone cleared the bar. It now counts notes
   and verdicts separately (9,024 and 7,452). `testing.md` gained a section on proving a new
   guard can actually fail — this session needed that twice.

## What's NOT done — the remaining queue

- **`S10-N1` (P2)** — PCV21's 18-year gate is checked against the patient's CURRENT age, not
  the age at the dose (`validate.js`). A 20-year-old with PCV21 recorded at 17 has that dose
  counted. Still deliberately left for a sourced item.
- **`S10-N2` (P3)** — the generic "repeat this dose only" line is appended to every invalid
  dose, including one dated before birth.
- **`P7-1`** — the plain-English rulebook + `rule-docs-match-code` tripwire. **This was S8's
  item, not S13's**, and is untouched.
- **S3–S9, S11, S12** unchanged. Ledger:
  `.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md` (git-ignored, updated).
  **S3's gate is satisfied** and S3 must reuse `intervals.js`'s `GRACE_DAYS` /
  `intervalMeetsMinimum`. **S4 is now P1-2, P1-3, P1-4 only.**
- **MeningoVax's own inline styles (9 of them) are untouched** — different repo. Whether to
  open a small PR there is an **owner decision**.

## Why this is a good stopping point

Phases 3 and 6 are both fully closed. Every item in this PR is independent of everything
still queued; nothing in the remaining queue is blocked by it. The suite is green, the tree is
clean, the build is clean, and the comparison harnesses prove no clinical verdict moved.

## Resuming

1. `cd ~/Downloads/PneumoVax`. **PR #21 is open and green — merge it first** unless the owner
   wants changes, then `git checkout main && git pull`.
2. Confirm the suite: **353 passing / 35 files** on the branch (or whatever `main` reports
   after the squash merge). Stop and diagnose any mismatch before new work.
3. **Say the session number and its recommended model + effort in one line, and WAIT**
   (queue rule 1). Likely next is **S3 — Opus 5 at high effort** (its gate is satisfied) or
   **S4 — Sonnet 5 at medium effort**. **Owner picks the order — ask, don't default.**
4. **Open owner decisions:** (a) merge PR #21; (b) whether to open a small PR against
   MeningoVax for its inline styles. **No clinical decisions are outstanding.** Do not
   re-litigate the adult PPSV23 interval (`CLAUDE.md` + `CLINICAL_SPEC.md` §K), the paediatric
   risk lists (§C), or PR #20's hold — all settled.
5. Per-item workflow: reproduce → failing test first (confirm it fails) → fix → full suite
   green → live-verify in the running app → one commit per finding ID. **For any guard whose
   assertion is "nothing is wrong", introduce the fault on purpose and watch it go red.**
6. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to
   `main`.**
7. **Dev-server gotcha, confirmed again this session:** `preview_start` reported port 49152
   while Vite had actually bound to **5175**; read the real port from `preview_logs`. A hidden
   Browser pane also makes `read_page` return an empty page — `get_page_text` and
   `javascript_tool` still work.
