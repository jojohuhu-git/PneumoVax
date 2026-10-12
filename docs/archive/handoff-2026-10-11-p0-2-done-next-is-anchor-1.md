# PneumoVax — Handoff after P0-2 + P1-2 (2026-10-11)

> **Supersedes `handoff-2026-10-11-w1-done-next-is-s3-n2.md`.** Items **2 (`S3-N2`/`P0-2`)**
> and **4 (peds `P1-2`)** of that file's queue are **DONE** — they were one bug, closed in
> one commit. Resume from item **3 (`ANCHOR-1`)** below, not from the superseded queue.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`main`**, clean, synced with origin at **`c0509d0`**.
Baseline was 468 passing; now **496 passing (43 files)**, all green.

Merged this session: **PR #26** (`45f6d88`, the P0-2 work), **PR #27** (`af23b4d`) and
**PR #28** (`c0509d0`, docs — dropping retired vaxapp; #27 was incomplete and #28 finished
it). Pages deploy **succeeded and was verified by asset hash**: a clean `npm run build`
from merged `main` produces `index-nUNgJgEI.js`, exactly what the live site serves.

## What's done

**`S3-N2` / peds audit `P0-2` + peds audit `P1-2`** (commit `92be565`, PR #26). Two defects,
one root cause: the infant series total and the next-dose interval were both computed by
formulas with no counterpart in any source.

- **Series total** — `pcvInfant`'s ladder (`Math.min(4, prior + 2)`, and a
  `prior < 1 ? 3 : 4` collapse of the whole 7–11-month band) over-stated the total in **5 of
  p2016 Table 1's 14 cells**, and could print the impossible **"PCV dose 5 of 4"** (that was
  `P1-2`, queue item 4 — never a separate bug). Now read off Table 1 cell by cell in
  `recommend.js`. The arithmetic that matters:
  **`target = (the doses the row keys on) + (the doses it says are owed)`**, never
  `prior + owed` — "1 additional dose" is counted against the row's own key, so adding it to
  every prior dose double-counts a closing dose the child already had. Getting that wrong
  turned a finished series into "catchup" (the existing H5 test caught it).
  `CLINICAL_SPEC.md` §A already described the grid **correctly**; the engine never
  implemented it.
- **Interval** — the same number was keyed two ways (scheduler: current age; validator: age
  at the previous dose). Neither can reproduce CDC Catch-up Table 2, which keys on the
  **dose number** too. New `pcvNextDoseMinIntervalDays()` in `intervals.js`. Worst case
  fixed: a 10-month-old whose last dose was at 9.5 months was advised a dose ~2 months
  before CDC would count it.
- **Knock-on, fixed here** — the note asserted a "4-dose series" for every infant, invisible
  while every total was wrongly 4 and a flat contradiction once they were right. Also
  `minIntervalDays` is now `null` when there is no earlier dated dose.

**Owner decisions, 2026-10-11 — settled, do not re-litigate** (full text: `CLINICAL_SPEC.md`
§L, which is new):
1. The **advised** interval follows CDC Table 2 dose by dose.
2. The **validity floor does not move** — a dose already given is still graded by
   `doseIntervalRules.js`'s permissive reading. Nothing a clinician did is retroactively
   invalidated.
3. **No separate "recommended" interval** over Table 2's number; the 4-vs-8-week choice is
   age-governed as p2016's footnote states it. A blanket 8-week recommendation was
   considered and **declined**.

Sources fetched live 2026-10-11 and quoted in §L: CDC Catch-up Table 2 (browser pane +
`document.body.textContent`, positive controls checked) and immunize.org p2016 Table 1
(Item #P2016, 2/16/2024 — re-fetched and **byte-identical by SHA-256** to the 2026-10-10
copy, so unchanged).

Verification: three comparison harnesses (`scripts/{adult,peds,hsct}Cases.mjs`) produce
**byte-identical** output before and after — none of their cases falls in the five broken
cells, which is how these survived; that coverage gap is worth closing in `S8`.
Live-verified in the running app: 9-month-old reads "PCV dose 2 of 3"; 10-month-old reads
"No pneumococcal doses due today" with both recorded doses still valid.

## What's NOT done — the queue

### 3. `ANCHOR-1` — the anchoring rework. **Opus 5, High effort.**
Owner decision already made — **a rejected dose does not reset the clock; every gap is
measured from the dose that counted** (reasoning + acceptance cases A/D/H/B/G are in
`handoff-2026-10-11-anchoring-decided-and-reordered-queue.md`). Needs a two-pass redesign of
`recommend.js`'s PCV/PPSV23 cross-stream handoff, which is currently circular. Reproduce
A/D/H/B/G first, write failing tests, then build. Re-run the three harnesses afterwards.
**Now lands on one source of truth** — that was the point of doing P0-2 first.

### 4. `S8` (`P7-1` rulebook + `P2-7` docs-match-code tripwire). **Sonnet 5, Medium.**
Easier now the rule table exists — compare docs against `DOSE_INTERVAL_RULES`, not prose.
**Add to its scope:** P0-2 proved the spec can be right while the engine is wrong, and that
the harnesses had no case in any of the five broken cells. A tripwire that only diffs prose
against the table would not have caught either.

### 5. `S10-N2` (P3), `S4`–`S7`, `S9`, `S11`, `S12`. **Sonnet 5, Low–Medium.**
Unranked leftovers; several predate S14 and may be moot. Re-read each before starting.

**Did NOT reproduce — do not "fix" blind:** peds audit `P1-5`'s 2nd-PPSV23 side-note, and
`S10-N1`. Both investigated and closed in earlier sessions.

**Dropped:** the old item 7 (MeningoVax inline styles) is unaffected, but **vaxapp is
retired** (owner, 2026-10-11) — do not port pneumococcal changes to it, do not probe it for
parity, do not audit it.

Cleaned this session at the owner's request: the `vaccine-parity` skill, the global
`~/.claude/CLAUDE.md`, and in this repo `CLAUDE.md`, `README.md`, `docs/agent/testing.md`
and `docs/agent/architecture.md` (PRs #27 and #28). Two source comments were deliberately
kept because they record provenance rather than direct work — `src/App.css`'s accent-colour
note and `src/logic/recommend.js:14`'s "ported from vaxapp/MeningoVax". `docs/archive/`
still mentions vaxapp and should: it is historical record.

⚠️ **Still stale, not yet cleaned** — four skills name vaxapp as a live repo to push to,
audit and style: `ship` (push-policy table, "flow for protected repos"), `app-audit`,
`design-review`, `verify-clinical-source`. If one of them sends you to vaxapp, ignore it
and offer to clean it.

## Why this is a good stopping point

P0-2 was the prerequisite the previous handoff named for `ANCHOR-1`: the interval now has a
single source of truth, so the anchoring rework lands on one number instead of two. The
commit is self-contained, the harnesses prove nothing else moved, and no part of
`ANCHOR-1` has been started.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main && git pull` — expect `c0509d0`.
2. Confirm the suite: **496 passing / 43 files.** Stop and diagnose any mismatch.
3. **Do not re-litigate:** the three P0-2 decisions above; the anchoring decision; the
   keep-the-adult-floors and order decisions; the 2026-10-11 adult-floor determination;
   `A-P1-1`; the paediatric risk lists (`CLINICAL_SPEC.md` §C); the seven S14-RC decisions;
   `W1`'s scope/wording.
4. Per item: reproduce → failing test first (**confirm it fails**) → fix → full suite green
   → **live-verify in the running app** → one commit per item ID.
5. **Before changing any interval rule**, read the header of `src/logic/doseIntervalRules.js`
   and `CLINICAL_SPEC.md` §K and §L. **Add a table row; never add an age test to the
   evaluator.** Every adult floor is an OWNER determination — never cite ACIP or CDC for one.
   `pcvNextDoseMinIntervalDays()` is deliberately **not** in the rule table: that table owns
   doses already recorded, this answers what to advise. Do not move it.
6. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to `main`.**
7. **Dev server:** `preview_start` reports the wrong port — it said 59980 this session while
   the real server was on **5174** at `/PneumoVax/`. Always read the port from `preview_logs`.
