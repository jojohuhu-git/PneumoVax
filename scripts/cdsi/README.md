# CDC CDSI checks — PneumoVax

CDSI is CDC's machine-readable version of ACIP's schedule (CDC's software rules plus CDC's own
test patients). It is a **cross-check, never the authority**: where CDSI and CDC/ACIP wording
differ, the wording wins (owner rules 2026-08-10 and 2026-10-17). Nothing here is part of the app.

## What is in this folder

| File | What it is |
|---|---|
| `cdc-files/AntigenSupportingData-Pneumococcal-4.65.xml` | CDC's pneumococcal rules, CDSI **4.65** (Aug 2026), unchanged from CDC's zip |
| `cdc-files/ScheduleSupportingData-4.65.xml` | CDC's vaccine-code list (CVX), same release |
| `cdc-files/cdsi-healthy-childhood-and-adult-test-cases-v4.46.xlsx` | CDC's test patients, healthy (79 pneumococcal) |
| `cdc-files/CDSi-underlying-conditions-test-cases-v4.6.xlsx` | CDC's test patients, with conditions (61 pneumococcal) |
| `cdc-files/pneumo-test-cases.json` | The 140 pneumococcal patients pulled out of the two workbooks (made by `extractTestCases.py`) |
| `extractTestCases.py` | Workbooks → JSON. Python standard library only |
| `runTestCases.mjs` | Runs the 140 patients through the app and compares, dose by dose and next step |
| `cdsiCompare.mjs` | Compares the app's minimum ages and gaps with CDSI's numbers (hand-copied from 4.65) |

Source: https://www.cdc.gov/iis/cdsi/index.html (downloaded by the owner 2026-11-08; cdc.gov
blocks downloads from the shell).

## How to run

```bash
npx vite-node scripts/cdsi/runTestCases.mjs           # summary + every disagreement
npx vite-node scripts/cdsi/runTestCases.mjs --all     # every patient
npx vite-node scripts/cdsi/cdsiCompare.mjs            # ages and gaps
```

Read the last lines of `runTestCases.mjs`: **"NEW disagreements"** must be 0. Every known
disagreement is listed by family in the `KNOWN` table at the top of the script, each marked
DELIBERATE (the app follows CDC wording or an owner ruling) or OPEN (not yet decided).
Results of the first run: `docs/archive/report-2026-11-08-cdsi-test-patients.md`.

## When CDC publishes a new release

1. Download the new supporting-data zip and test-case workbooks into `~/Downloads/`.
2. Read the release notes' "Pneumococcal" paragraph.
3. Replace the files in `cdc-files/` (keep the version in the file name), update the two
   workbook names in `extractTestCases.py`, run `python3 -I scripts/cdsi/extractTestCases.py`.
4. Run both scripts. A NEW disagreement is a question for the owner, never a fix by itself:
   read the CDC/ACIP wording live first (`verify-clinical-source` skill).
5. The monthly scheduled task `monthly-vaccine-source-check` watches CDC's CDSI page and says
   when a new release is out.

**Not yet a required test.** Turning these into tests that run on every change is plan items
P-CDSI-1 and P-CDSI-2 (`docs/archive/plan-2026-11-08-cdsi-checks-both-apps.md`).
