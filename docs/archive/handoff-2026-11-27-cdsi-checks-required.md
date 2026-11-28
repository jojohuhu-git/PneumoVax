> **SUPERSEDED 2026-11-27** by `handoff-2026-11-27-ageentry-guard-and-em-dash.md`. Its PRs (#166, #167) are merged; do not resume from this file.

# PneumoVax — Handoff: both CDC CDSI checks are required tests (2026-11-27)

Repo `/Users/joannehuang/Downloads/PneumoVax`. Branch `feat/2026-11-27-cdsi-test-patients-required`,
off `main` 350b56c. PR body: `docs/archive/pr-draft-2026-11-27-cdsi-checks-required.md`. The owner
squash-merges. Supersedes `handoff-2026-11-27-rulebook-reorg-built.md`, whose two PRs (#165,
MeningoVax #170) are both merged.

## Done
- **P-CDSI-2**: `src/logic/__tests__/cdsi-test-patients.test.js`. 140 CDC test patients: 122 agree,
  the 18 that differ are named in `KNOWN` (`scripts/cdsi/cdsiTestPatients.mjs`) and pinned exactly.
- **P-CDSI-1**: `src/logic/__tests__/cdsi-rule-comparison.test.js`. Reads CDSI 4.65's pneumococcal
  XML directly (`scripts/cdsi/cdsiRules.mjs`, copied from MeningoVax); 35 comparisons, 28 agree,
  7 named differences in `DIFFERENCES` (`scripts/cdsi/cdsiRuleComparison.mjs`). CDC's file must
  match the saved copy `cdc-files/pneumo-cdsi-rules.json`.
- **Owner decision today:** the four child-floor differences were approved, "Yes, keep all 4"
  (memory `cdsi-four-deliberate-differences`). The other three (PCV7, PCV21 at 18, dose 3 after a
  dose at 7–11 months) rest on earlier rulings or CDC wording; they are listed in the PR body for
  her to audit, not re-asked.
- Mutation-checked: 8 of 8 changes turned the tests red (table in the PR body).
- Tests: **2,583 of 2,583 passed, 234 files** (run alone, `.claude/**` excluded).
- The CDSI-checks plan has **nothing left in PneumoVax**.

## Not done / open
1. Review and merge this PR (#166) and the two label PRs (PneumoVax #167, MeningoVax #171) (owner).
2. ANSWERED later the same day: the owner removed every "(optional)" field label from both apps.
   PneumoVax #167 ("Months"), MeningoVax #171 ("Months", "Brand"), both open, both suites green
   (2,568 and 2,773). MeningoVax's "Date (optional)" had already gone on 2026-11-20.
3. Optional, MeningoVax: its test-patient script is still a measurement, not a required test. The
   same pattern as `cdsi-test-patients.test.js` would make it one. Not asked for yet.
4. Minor, no action needed: `brands.js`'s `counts:` flag feeds only the Rulebook table, while
   `validate.js:720` decides PCV7. Both agree today.

## Resuming
`git checkout main && git pull` once the PR is merged; run `npx vitest run --exclude '.claude/**'`
on its own and expect 2,583. When CDC releases CDSI 4.66 (the monthly source check will say so),
follow `scripts/cdsi/README.md`'s "When CDC publishes a new release".
