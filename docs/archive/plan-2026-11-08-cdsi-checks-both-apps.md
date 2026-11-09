# Plan — checking both apps against CDC's CDSI (2026-11-08)

**Status (updated 2026-11-08, later the same day): two measurements done in PneumoVax — the ages-and-gaps
comparison and CDC's 140 pneumococcal test patients (117 agree, 23 differ, 0 unexplained; report:
`report-2026-11-08-cdsi-test-patients.md`). Nothing built as a required test yet. The owner's three CDC
files are downloaded and now kept in each repo (`scripts/cdsi/cdc-files/`).**
Owner's request (2026-11-08): *"set up monthly scheduled check for both pneumovax and meningovax.
Add both CDSI comparison test and CDC's CDSI test patients to meningovax and pneumovax. Run the
pneumovax CDSI comparison tests now to make sure there are no discrepencies."*

CDSI is CDC's machine-readable version of ACIP's rules (CDC's CDSI page: the recommendations it
encodes *"are developed by the Advisory Committee on Immunization Practices (ACIP)"*). It runs behind
ACIP, so it is a **cross-check, never the authority**: where CDSI and CDC/ACIP wording differ, the
wording wins (owner rules of 2026-08-10 and 2026-10-17).

## What exists now

| Item | Where | State |
|---|---|---|
| Monthly source check, both apps | scheduled task `monthly-vaccine-source-check`, 1st of each month 09:00; state in `~/.claude/scheduled-tasks/monthly-vaccine-source-check/last-seen.json` (seeded 2026-11-08) | **Live.** First run Dec 1. Read-only: reports changes, edits no code. Runs only while the desktop app is open (else on next launch). |
| PneumoVax vs CDSI comparison | `scripts/cdsi/cdsiCompare.mjs` | **Measurement, not a test.** CDSI values are copied into it by hand from 4.65; it does not read CDSI files. |
| PneumoVax vs CDC's test patients | `scripts/cdsi/runTestCases.mjs` (+ `extractTestCases.py`, `cdc-files/`, `README.md`) | **Measurement, not a test.** 140 patients; every disagreement sorted into a named family in the script's `KNOWN` table, so a re-run prints only NEW ones. This is P-CDSI-2's findings list, done as a script. |
| MeningoVax's CDC files | MeningoVax `scripts/cdsi/cdc-files/` + `README.md` | Files only, for Phase 1.5 and 2.3 of the port plan. Nothing run. |

## The PneumoVax result, 2026-11-08 (CDSI 4.65; children's rows identical in 4.64)

`npx vite-node scripts/cdsi/cdsiCompare.mjs` → **AGREE 26, DIFFERENT 2, PARTLY 2, of 30.**

Agree: the PCV minimum age (6 weeks) with the 4-day grace; four infant gap cells; the grace on a gap;
the infant conjugate rule as a floor; the child 5-year PPSV23 rule as advice; **all 15 adult rules**
(CDSI sets no adult floor; PneumoVax has none since PR #90).

The four that do not agree — **in every one PneumoVax is stricter than CDSI** (it throws out a dose
CDSI would count):

| Rule | PneumoVax | CDSI | Why PneumoVax does it |
|---|---|---|---|
| `CHILD-PPSV23-AFTER-PCV` | PPSV23 under 8 weeks after a PCV does not count, any child | Floor only in the 2–5 chronic-conditions series; **none** for 2–5 immunocompromised or any 6–18 series | CDC child notes: PPSV23 *"at least 8 weeks after the most recent PCV dose"* — wording beats CDSI |
| `CHILD-PCV-AFTER-PPSV23` | A conjugate under 8 weeks after a PPSV23 does not count | Floor only in 2–5 chronic; none at 6–18 | Owner ruling 2026-10-25 (§K-PPSV23THENPCV), authority "This app" |
| `CHILD-PPSV23-AFTER-INVALID-PPSV23` | 5-year floor | No floor | CDC notes' *"at least 5 years after dose 1 PPSV23"* |
| `CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST` | 5-year floor | No floor | Same sentence |

Note CDSI is not consistent with itself here: it enforces 8 weeks for a 2–5-year-old with a chronic
condition but not for an immunocompromised one of the same age.

**Not compared yet (honest limits):** every other Table 2 cell (dose 3 after a dose at 7–11 months,
the 24-month cells); PPSV23's minimum age of 2 years; the 12-month-line grace (§A-GRACE12); maximum
ages; which products CDSI allows at which age; and CDC's CDSI test patients (none run).

## What to build — one PR each, `fix-queue` loop, owner merges

**Done 2026-11-08 — the owner downloaded them; copies now live in each repo's `scripts/cdsi/cdc-files/`.** Were: three files from
https://www.cdc.gov/iis/cdsi/index.html into `~/Downloads/` — Supporting Data 4.65 (zip), Test Cases
Healthy Childhood and Adult 4.46 (xlsx), Test Cases Underlying Conditions 4.6 (xlsx). cdc.gov blocks
downloads from the shell, and the browser cannot save files to disk.

### PneumoVax

- **P-CDSI-1, the comparison as a required test (~1 session, ≈ 3–4% of a week).** Commit CDSI's
  pneumococcal XML (4.65) into the repo; the test reads it directly (no hand-copied numbers) and checks
  every age and gap above plus the "not compared" list. The four rows above go in a **named list of
  deliberate differences**, each with its reason and date; any other difference fails. A new CDSI
  release then means: swap the file, run the test, read which rows moved.
  **STOP:** owner approves the four entries on that list as deliberate (no dose changes).
- **P-CDSI-2 — the findings half is DONE 2026-11-08** (`scripts/cdsi/runTestCases.mjs`, report
  `report-2026-11-08-cdsi-test-patients.md`): 5 open findings, two of them typical-patient bugs (a baby
  under 6 weeks told dose 1 is due today; the 12-month booster card gives no date). **Still to do:** make it a
  required test that fails on a NEW disagreement (~0.5 session), after the owner has seen the families.
  The original item, kept for the record: **P-CDSI-2, CDC's test patients (~1–2 sessions, ≈ 5–7%).** Read the pneumococcal cases from both
  xlsx files, run each through `recommend()`, and compare per-dose verdicts and next-dose dates. Output
  is a **findings list grouped by clinical family**, not fixes. Expected, and to be marked as such, not
  "fixed": cases where CDSI differs from an owner ruling (e.g. an extra dose that still sets the next
  date — Noor, PR #122; CDSI never measures from an extra dose). **STOP:** owner sees the families.

### MeningoVax — added to the port plan (`plan-2026-11-08-meningovax-port.md`)

- **M-CDSI-2, CDC's test patients — Phase 1, item 1.5.** An outside check before any clinical
  decision, beside the whole-app checks.
- **M-CDSI-1, the comparison test — Phase 2, item 2.3.** Built on the new rule table, reading CDSI's
  two meningococcal XML files. Expected differences already known: the booster gaps (CDSI floors,
  ACIP wording gives none — decision packet 1), the MenACWY 4-week catch-all (CDSI 8 weeks), the
  high-risk MenB dose 3 "6 months from dose 1" (CDSI none).

**Estimate for all four items:** ≈ 15–20% of one week's Pro allowance, about 4–5 sessions. The two
MeningoVax items add ≈ 7% to the port's 80–90%.
