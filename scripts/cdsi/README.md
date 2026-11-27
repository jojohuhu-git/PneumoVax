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
| `cdsiTestPatients.mjs` | The shared core: code mapping, the run, and `KNOWN` — every named disagreement with its reason |
| `runTestCases.mjs` | Prints the 140 patients run through the app, dose by dose and next step |
| `cdsiRules.mjs` | Reads CDC's rule file into 870 named rules (copied from MeningoVax; fix the reader in both repos) |
| `cdsiRuleComparison.mjs` | Holds the app's minimum ages, gaps and rule-table rows against those rules; `DIFFERENCES` names every one that differs, with its reason and approval |
| `cdsiCompare.mjs` | Prints that comparison; `--save-facts` re-saves `cdc-files/pneumo-cdsi-rules.json` |
| `cdc-files/pneumo-cdsi-rules.json` | The saved copy of CDC's 870 rules; the test fails when CDC's file differs from it |

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
4. Run both scripts, then `cdsiCompare.mjs --save-facts` once the release notes are read, and
   update `CDSI_VERSION` in `cdsiRules.mjs`. A NEW disagreement is a question for the owner, never a fix by itself:
   read the CDC/ACIP wording live first (`verify-clinical-source` skill).
5. The monthly scheduled task `monthly-vaccine-source-check` watches CDC's CDSI page and says
   when a new release is out.

**The test patients are a required test** since 2026-11-27 (P-CDSI-2):
`src/logic/__tests__/cdsi-test-patients.test.js` fails on a disagreement not in `KNOWN`, on a
`KNOWN` patient that now agrees, and on any change to a named patient's answer (pinned in the
test). When it fails, change `KNOWN` and the pin only after the owner has ruled.

**The ages-and-gaps comparison is a required test too** since 2026-11-27 (P-CDSI-1):
`src/logic/__tests__/cdsi-rule-comparison.test.js` reads CDC's file directly (no hand-copied
numbers) and fails on an unnamed difference, on a named one that moved or stopped differing,
on a rule-table row nothing compares, and on any change to CDC's file against the saved copy.
Its four child-floor differences were approved by the owner on 2026-11-27 ("Yes, keep all 4").
