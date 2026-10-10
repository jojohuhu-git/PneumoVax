# PneumoVax — Handoff after S2, the adult / HSCT clinical audit (2026-10-10)

Repo: `~/Downloads/PneumoVax`. Branch: **`main`**, at `beec94b`, **in sync with origin**.
**No commits were made** — S2 is a read-only audit session; its deliverable is two documents.
Baseline was 156 passing tests; still **156 passing (11 files), all green** (`npm test` run
three times — before, during and after; engine code was never touched).

Working tree: **two untracked files**, both deliverables —
`docs/archive/audit-2026-10-10-pneumovax-clinical-adult.md` and
`docs/archive/census-2026-10-10-pneumovax-numbers.md`. **Nothing is committed; see
"Open decision" below.** All six scratch probe scripts were written to the session scratchpad,
never to the repo.

This app's core promise is honesty: a silent wrong answer is worse than a crash. One of this
audit's findings is a silent wrong answer.

## What's done

1. **S2 — clinical audit of the adult + HSCT pathways.** Scope was `pcvAdult`,
   `adultPpsvIntervalClass`, `hsctAdvisory`, `pcv21GeoNote`, and the precedence choices
   (hard stop over HSCT; age-outer / risk-inner). Every branch was run with real patients
   through the real engine, then checked against its source **fetched live 2026-10-10**.
   → **`docs/archive/audit-2026-10-10-pneumovax-clinical-adult.md`**
   **1 P0, 3 P1, 11 P2, 17 rules verified correct, 0 open clinical decisions.**
2. **The number census** — every age threshold, interval and series total: what it means,
   where it lives, how many independent copies exist, plus a recommended order for S6.
   → **`docs/archive/census-2026-10-10-pneumovax-numbers.md`**
3. **The 18-reference sweep is recorded** (S8's input): 11 verified live today, 4 are
   paediatric and belong to S1, 2 not fetched, **1 blocked** — see the caveat below.
4. **Progress ledger updated** — S2 marked DONE in
   `.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md`, and its ID-collision
   warning now names all **three** ID spaces. (That folder is git-ignored; the edit is
   local-only by design.)

## ⚠️ IDs: S2's findings are all `A-`prefixed

`A-P0-1`, `A-P1-1` … belong to **this** audit. Bare `P0-1`/`P1-3`/`P2-1` mean something
different in the peds audit *and* in the queue file, which already collide with each other.
Write `A-P0-1` (adult), `peds audit P0-1`, or `queue P1-3` — never a bare ID.

## The findings, in one line each

- **A-P0-1 (P0) — the 65th-birthday test is wrong by up to ±15 days, both ways.**
  `recommend.js:662` mixes a *float* current-age with an elapsed interval *rounded to whole
  months*, so "was PPSV23 given at ≥65?" flips near the birthday. **2,782 of 29,565 swept
  (DOB, dose-date) pairs misclassified — 9.4%.** The dangerous direction turns a dose CDC
  recommends into "it may be given or omitted". Second root cause: `StepAge.jsx` collects a
  real **date of birth** — its own comment says it does so precisely to answer this question
  — then discards it, passing only `ageMonths`.
- **A-P1-1 (P1) — adults ≥50 who are immunocompromised are shown an 8-week PPSV23 interval
  where CDC says ≥1 year, and the app contradicts itself one step earlier.** Four tier-1
  sources agree: ≥1 year is the recommendation, 8 weeks a *minimum* for IC / cochlear / CSF.
  The 19–49 behaviour is **correct** — don't change that half. **Needs the owner to amend a
  `CLAUDE.md` non-negotiable rule** (the rule has no age term); the clinical reading is settled.
- **A-P1-2 (P1) — adult cards cite the CDC *child* schedule notes.** 13 of 16 risk factors
  list `cdcChildPneumo`, and `collectRefs` puts risk-factor refs first, so it is the **first
  citation chip** on any at-risk adult's card.
- **A-P1-3 (P1) — a post-HSCT adult's card cites a children's document and a source the app
  itself marks superseded.** `refs.js` asserts "no active rec cites" Fred Hutch; every HSCT
  patient's standard card does.
- **11 P2s** — stale `CLAUDE.md` HSCT sources (names a table that doesn't exist and a
  superseded source), three files bypassing `scheduleConstants.js`, the PCV21 banner showing
  for patients never offered PCV21, a post-HSCT patient's card calling them "healthy",
  `ckd_chronic` (a paediatric risk factor) offered to adults, and more. All in the audit.

**Nothing was fixed.** S2's stopping point is "STOP after writing the files."

## What's NOT done — the remaining queue

**S3–S13 are all NOT STARTED.** The ledger in the queue file is the source of truth.

**Next up: S10 — Phase 3, dates and ages. Opus 5 at high effort.** Owner decision
2026-10-10 moved it ahead of S3 (see Decisions below). It should fix **`A-P0-1` + peds
`P1-1` + `A-P2-11`** in one pass — all three are the same root cause, that no exact date of
birth reaches the engine.

**S3 is sourced and ready whenever it runs.** Its gate was "do not start before S1 and S2
are both merged — the intervals must be sourced first". The adult intervals are now recorded
verbatim: 1 year, 8 weeks, 5 years, CDC's 4-day grace, 4 weeks = 28 days, and intervals
≥4 months counted in calendar months. See the audit's "Recommended fix order".

## Decisions — two settled 2026-10-10, one still open

1. ~~Commit the audit documents?~~ **SETTLED: yes.** Landed docs-only via
   `docs/s2-adult-clinical-audit` → PR → squash merge, same shape as S1's PR #16.
2. **STILL OPEN — A-P1-1 needs a rule change.** `CLAUDE.md`'s "Adult PPSV23 Interval Is
   Risk-Class-Keyed" is currently non-negotiable and has **no age term**, so the code
   faithfully implements it. Four tier-1 sources say the interval is also age-dependent
   (≥1 year for ≥50 even when immunocompromised); the 19–49 behaviour is correct and must not
   change. The clinical question is **not** a judgment call; amending a declared
   non-negotiable rule is. **Ask the owner; do not pick.** Blocks only A-P1-1.
3. ~~Sequencing?~~ **SETTLED: S10 runs BEFORE S3.** Two independent audits pointed the same
   way — `A-P0-1` and peds `P1-1` share one root cause (no exact DOB reaches the engine), and
   building S3's interval checks on an age floor that is up to 15 days out would bake the
   error in. The ledger in the queue file records this against both rows.

## Why this is a good stopping point

S2 was scoped as a self-contained read-only unit and is complete: every branch in scope was
run and checked against a live quote, the census is written, and the reference sweep's one
gap is named rather than papered over. Nothing is half-changed — the engine is byte-identical
to `beec94b` and the suite is green. S3 is an independent code session and needs nothing from
S2 except the intervals, which are now recorded verbatim.

## One honest caveat — what I could NOT verify

**`ascoAdultCancer2024` was not re-verified this session.** `ascopubs.org` serves a Cloudflare
bot check; bypassing bot detection is not something I will do. The stored quote stands as
recorded by the 2026-09-14 session, which verified it live. Independent secondary summaries
corroborate the substance (four doses of PCV20, startable as early as three months
post-transplant), and the audit records a sourcing note for S8: ASCO's own windows are
*4–6 months* and *after 3 months*, while the app's adult label reads *"beginning 3–6 months"*
— wording identical to p3086's **paediatric** text, which commit `077f01d` made deliberate.
Not a finding; S8 should just make the quote and the label line up.

## Note on the dev server

`preview_start` was **refused** — port 5173 is held by another chat's "PneumoVax dev server",
and `preview_stop` cannot stop another chat's server. Per the queue's rule 6 I did **not**
fall back to running the server through Bash, and I did not edit `.claude/launch.json` to
dodge it. Everything in this audit is engine-level and was proven by *running the engine*,
which is stronger evidence for these claims than a screenshot. What remains unseen is only
how the cards look. Two would benefit from two minutes of looking once a slot frees:
**A-P2-3** (the PCV21 banner sitting above a collapsed card) and **A-P1-3** (the citation chip
that advertises itself as "superseded").

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main` (already there, in sync at `beec94b`).
2. `npm test` — confirm **156 passing / 11 files** before any new work.
3. **Say the session number and its recommended model + effort, in one line, and WAIT.**
   Next is **S10 — Opus 5 at high effort** (moved ahead of S3 by owner decision; the ledger
   records it). Nothing else first; the owner changes the setting herself and it cannot be
   changed mid-session.
4. Then read the SESSION PLAN at the top of
   `.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md` and confirm S1 **and** S2
   both show DONE in the ledger, and that S10 is marked NEXT.
5. **S10 is a code session**, so rule 6 applies: start the dev server first
   (`preview_start`, name "PneumoVax dev server"). If the slot is still held by another chat,
   say so and ask the owner to close one — do **not** fall back to Bash, and do not claim a
   fix is verified without driving it. Decision (2) above is still open but blocks only
   A-P1-1, which is not S10's work.
6. Per-item workflow for the **code** sessions (S3 onward): reproduce → failing test first →
   fix → full suite green → live-verify in the running app → one commit per finding ID → PR
   per the `ship` skill.
7. Push/merge policy: **`main` is protected — branch, PR, squash merge.** Never push to
   `main` directly.
