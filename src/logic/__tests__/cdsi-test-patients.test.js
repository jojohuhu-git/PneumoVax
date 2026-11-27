// ── CDC's CDSI test patients, as a required test (P-CDSI-2, 2026-11-27) ──
//
// CDC publishes test patients with the answer its own rules (CDSI) give for
// each. 140 of them are pneumococcal (79 healthy, 61 with conditions). They
// were first run through this app on 2026-11-08 as a measurement
// (docs/archive/report-2026-11-08-cdsi-test-patients.md); the owner ruled on
// the five open findings 2026-11-08/09, and every disagreement left is named
// in KNOWN (scripts/cdsi/cdsiTestPatients.mjs) with the reason the app
// differs. This test makes that list binding.
//
// It does NOT require the app to agree with CDSI. CDSI runs behind ACIP's
// wording, and where they differ the wording wins (owner rules 2026-08-10 and
// 2026-10-17). It requires every disagreement to be NAMED, and it fails when
// any answer changes without someone looking:
//   1. a patient disagrees and is not in KNOWN (a new disagreement);
//   2. a patient in KNOWN now agrees (take it off the list, say why);
//   3. a named patient's answer changed shape or date (PINNED below);
//   4. the number agreeing is not exactly 122;
//   5. a CDC condition code has no box in the app, other than the one
//      contraindication the app has no input for.
// Printed version for a person: `npx vite-node scripts/cdsi/runTestCases.mjs`.
//
// When it fails: read the patient with --all, then the CDC/ACIP wording live
// (verify-clinical-source skill). A new disagreement is a question for the
// owner, never a fix by itself.
import { describe, it, expect } from 'vitest';
import { CASES, KNOWN, familyOf, differs, runAll } from '../../../scripts/cdsi/cdsiTestPatients.mjs';

const results = runAll();
const byId = new Map(results.map((x) => [x.id, x]));
const shapeOf = (x) => ({
  dosesDiffer: x.doses.filter((d) => !d.agree).map((d) => d.n),
  nextStep: x.forecast,
  app: `${x.app.state}${x.app.date ? ' ' + x.app.date : ''}`,
});

// Every patient that disagrees, written out. "app" is the app's own answer:
// complete, or not complete plus the date of the next dose. Measured
// 2026-11-27 on main 350b56c; identical to the 2026-11-09 run's families.
const PINNED = {
  '2013-0577': { dosesDiffer: [1], nextStep: 'DIFFERENT: app earlier than CDSI earliest', app: 'not complete 2010-03-01' },
  '2013-0580': { dosesDiffer: [], nextStep: 'DIFFERENT: app between CDSI earliest and recommended', app: 'not complete 2026-11-30' },
  '2013-0594': { dosesDiffer: [1], nextStep: 'DIFFERENT: series status', app: 'not complete 2011-04-29' },
  '2013-0595': { dosesDiffer: [1, 2], nextStep: 'DIFFERENT: series status', app: 'not complete 2010-07-27' },
  '2013-0596': { dosesDiffer: [], nextStep: 'DIFFERENT: app later than CDSI recommended', app: 'not complete 2026-09-02' },
  '2013-0598': { dosesDiffer: [4], nextStep: 'AGREE', app: 'not complete 2026-09-30' },
  '2013-0601': { dosesDiffer: [1, 2, 3, 4], nextStep: 'DIFFERENT: app earlier than CDSI earliest', app: 'not complete 2010-07-01' },
  '2013-0612': { dosesDiffer: [3], nextStep: 'AGREE', app: 'not complete 2026-09-30' },
  '2013-0613': { dosesDiffer: [3], nextStep: 'AGREE', app: 'complete' },
  '2013-0614': { dosesDiffer: [3], nextStep: 'AGREE', app: 'complete' },
  '2013-0619': { dosesDiffer: [1, 2, 3, 4], nextStep: 'AGREE', app: 'complete' },
  '2013-0624': { dosesDiffer: [], nextStep: 'DIFFERENT: app at/after CDSI past-due', app: 'not complete 2026-09-30' },
  '2024-0102': { dosesDiffer: [], nextStep: 'DIFFERENT: series status', app: 'complete' },
  '2016-UC-0014': { dosesDiffer: [1], nextStep: 'NOT COMPARABLE (contraindication)', app: 'not complete 2007-09-11' },
  '2016-UC-0165': { dosesDiffer: [], nextStep: 'DIFFERENT: app later than CDSI recommended', app: 'not complete 2022-08-01' },
  '2016-UC-0171': { dosesDiffer: [], nextStep: 'DIFFERENT: series status', app: 'not complete 2021-11-16' },
  '2016-UC-0173': { dosesDiffer: [], nextStep: 'DIFFERENT: app later than CDSI recommended', app: 'not complete 2022-08-21' },
  '2016-UC-0178': { dosesDiffer: [], nextStep: 'DIFFERENT: app later than CDSI recommended', app: 'not complete 2017-08-03' },
};

describe("CDC's CDSI test patients are read", () => {
  it('all 140 pneumococcal patients load (79 healthy, 61 with conditions)', () => {
    expect(CASES).toHaveLength(140);
    expect(CASES.filter((c) => /healthy/.test(c.source))).toHaveLength(79);
    expect(CASES.filter((c) => /conditions/.test(c.source))).toHaveLength(61);
  });

  it('every CDC condition and vaccine code has a box, except the one contraindication', () => {
    const unmapped = results.filter((x) => x.unmapped.length).map((x) => [x.id, x.unmapped]);
    expect(unmapped).toEqual([['2016-UC-0014', [expect.stringMatching(/^094 severe allergic reaction/)]]]);
  });

  it('every patient KNOWN names is one of CDC\'s patients', () => {
    for (const id of Object.values(KNOWN).flat()) expect(byId.has(id), id).toBe(true);
  });
});

describe('every disagreement with CDSI is named', () => {
  it('no NEW disagreement: every patient that disagrees is in KNOWN', () => {
    const fresh = results.filter((x) => differs(x) && familyOf(x.id).length === 0).map((x) => x.id);
    expect(fresh).toEqual([]);
  });

  it('no stale entry: every patient in KNOWN still disagrees', () => {
    const healed = [...new Set(Object.values(KNOWN).flat())].filter((id) => !differs(byId.get(id)));
    expect(healed).toEqual([]);
  });

  it('exactly 122 of 140 patients agree with CDSI on every dose and the next step', () => {
    expect(results.filter((x) => !differs(x))).toHaveLength(122);
  });

  it('each named patient gives exactly the answer it gave when it was named', () => {
    const now = Object.fromEntries(results.filter(differs).map((x) => [x.id, shapeOf(x)]));
    expect(now).toEqual(PINNED);
  });

  it('KNOWN and PINNED list the same 18 patients', () => {
    expect([...new Set(Object.values(KNOWN).flat())].sort()).toEqual(Object.keys(PINNED).sort());
  });
});
