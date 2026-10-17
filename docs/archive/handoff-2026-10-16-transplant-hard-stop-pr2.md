# PneumoVax — Handoff after PR 2 of the transplant hard-stop plan (2026-10-16)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Dev server: `.claude/launch.json`
("PneumoVax dev server"), served at `/PneumoVax/`.

**MERGED to `main`** via squash of PR
[#56](https://github.com/jojohuhu-git/PneumoVax/pull/56) (branch
`feature/2026-10-16-transplant-hard-stop`, off `main` at `452ce89`, `test` check green).
MeningoVax PR 1 ([#72](https://github.com/jojohuhu-git/MeningoVax/pull/72)) was squash-merged
immediately before it, which is the order its plan prescribes. Run `git log main --oneline -3`
for the squash shas.

Baseline was 1,041 passing tests in 89 files; now **1,046 passing in 91 files**, all green.
MeningoVax after PR 1: **1,630 passing in 135 files** (run locally before merging, not just
taken from CI).

## What's done — PR 2 of `plan-2026-10-16-transplant-hard-stop-both-apps.md`

The plan is the **single shared copy** for both repos and lives in this repo; MeningoVax
carries a pointer. It is now stamped **BOTH PRs IMPLEMENTED**, with five places the work
differed from it recorded in its header.

1. **Commit `194fc82` — the clinical move, deliberately measured alone.** The transplant tick
   stops the engine instead of printing a four-dose PCV20 advisory. `hasExclusion()` realigned
   onto `r.exclude` (one flag, one meaning). `hsctAdvisory()`, the `hsct` result field,
   `hasHSCT()`, the advisory banner, the collapsed `<details>`, `.advisory-banner-hsct`,
   `scripts/hsctCases.mjs`, three `refs.js` entries and the interval-guard's one exemption all
   deleted. New `regression-2026-10-16-transplant-is-a-hard-stop.test.js`.
   **Measured: 1,334 of 17,342 and 1,471 of 19,123 corpus rows moved, every one carrying
   `r:hsct` and every one to `EXCLUDED`, zero collateral.** Prose diff 5,610 of 36,465 lines,
   in exactly two buckets: 2,805 transplant + 2,805 CAR-T/B-cell (whose stop *wording* also
   changed — intended, and called out in the PR).
2. **Commit `8b5ae71` — the two checkboxes merged into one row** `hct_cart_bcell_exclude`
   (MeningoVax's existing id). Grid 13 profiles → 12, 17,342 → 16,008 cases. **No surviving
   row's answer changed**, proven by stripping the dropped ` HSCT=-` column from each old
   verdict and comparing key by key: 14,674 and 16,181 rows changed *only* by the column,
   **0** for any other reason.
3. **Commit `6030abb` — archive, docs, and the two guards.**
   `docs/archive/retired-2026-10-16-post-transplant-pneumococcal-schedules.md` holds §E/§F
   verbatim and every deleted dose label, note and citation. `CLAUDE.md`'s "HSCT Sources Are
   Fixed" became "Transplant Is A Hard Stop". `CLINICAL_SPEC.md`, `clinical-rules.md`,
   `architecture.md`, `testing.md`, `MAP.md`-adjacent and `README.md` updated.
   New `regression-2026-10-16-transplant-stop-mirrors-meningovax.test.js` holds both guards.
   **Mutation-proved: removing `exclude: true` fails 26 tests across 11 files and moves
   1,334 of 16,008 + 1,471 of 17,652 rows; changing one label word in PneumoVax only fails 4
   across 2 files, exactly one of which reads the sibling repo.**

**Also updated outside both repos** (leaving them is how a future session re-adds the
advisory): `~/.claude/skills/vaccine-parity/SKILL.md:31` and
`~/.claude/skills/design-review/SKILL.md:47` both carried the 2026-07 "advisory for HSCT
pathways" decision this reverses.

### One unplanned finding, fixed in commit 3
The plan assumed `rule-docs-match-code.test.js` would flag all three stale `refs.js` keys.
**It caught one.** Its regexes read `name()` and `ALL_CAPS_WITH_UNDERSCORE`; a backticked
camelCase name — the shape of *every* `refs.js` key — matched neither. Widened; it fired
immediately on `offWindow` (a *rejected* name → `RETIRED_IDENTIFIERS`) and `innerText` (a
browser API → new, tiny `PLATFORM_IDENTIFIERS` set). **Measured: replanting
`` `fredHutchLTFU` `` into `CLINICAL_SPEC.md` fails 1 of 64 with the widening, 0 of 64
without.** It also exposed a general trap worth remembering: **a test asserting a name is
ABSENT keeps that name present for this guard** — `regression-n6` named all three deleted
keys in `not.toContain()` assertions that were vacuous the moment the keys left `refs.js`,
and were blinding the guard. Replaced with the property that is actually true.

## What's NOT done — the remaining queue

**Nothing is left in the transplant plan.** Both PRs are written. The one outstanding item is
not code:

- **Both PRs are merged** — MeningoVax #72 then PneumoVax #56. Nothing in the transplant
  plan is outstanding.
- **The mirror test reads MeningoVax's files from disk** at
  `/Users/joannehuang/Downloads/MeningoVax-main/src/...`. Now that #72 is on `main`, it passes
  from either branch there; it is *skipped* in CI either way, since CI clones only one repo. If
  it ever fails locally, check which branch the MeningoVax checkout is on before assuming
  drift — and if the two really have diverged, that is the guard working, not a bug.

**Next queue: `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`**
(items C1–C8, checks G1–G5). Its own §11 says it starts only once the transplant work has
**merged in both repos** — both plans are open on `refs.js`, `riskFactors.js` and `CLAUDE.md`,
and both regenerate the corpora. Its §5a is already **struck**: this PR carried it out.
**Every count in that plan is now stale** (it was measured pre-transplant, e.g. "17,536
recommendation cards"); its §2 banner says to re-measure, which is one command. Its suggested
order after that: C1 → C4, C5 → C2, C3 + G1–G3 → C7 → C6 → C8 + G4, G5.

## Why this is a good stopping point

The hard stop is complete as a unit in this repo: behaviour, copy, corpora, docs, archive and
two guards, each verified by running the app rather than by a green suite alone. The three
commits are separable and each explains its own numbers, so the owner can review the clinical
change apart from the rename apart from the documentation. Nothing in the citations plan has
been started, and that plan explicitly must not start until these merge — so there is no
half-finished second front.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-16-transplant-hard-stop`
2. Run `npm test` — confirm **1,046 passing in 91 files** before any new work.
3. Start the dev server with `preview_start` (`.claude/launch.json`). Note: its reported port
   has been wrong before — read the real one from `preview_logs`.
4. **Ask the owner, do not default:** whether the dead `advisory` flag + its unreachable "Advisory"
   pill in `RecCard.jsx` + the `advisory` corpus column should be removed as their own change
   — it was deliberately left in place so it would not bury commit 1's 1,334 moved patients.
   A background task was filed for it.
5. Per-item workflow for the citations plan: reproduce → failing test → fix → full suite green
   → drive the running app → commit named by the item ID, one item at a time.
6. Push/merge: branch → PR → `gh pr merge --squash`; after merge confirm the Pages deploy
   (`gh run list --limit 3`) and spot-check the live site.
