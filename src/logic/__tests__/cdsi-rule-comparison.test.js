// ── The app's ages and gaps held against CDC's CDSI rule file (P-CDSI-1, 2026-11-27) ──
//
// CDSI is CDC's machine-readable version of ACIP's schedule. Its pneumococcal
// rule file (scripts/cdsi/cdc-files/AntigenSupportingData-Pneumococcal-*.xml)
// is read directly (scripts/cdsi/cdsiRules.mjs, copied from MeningoVax), and
// the app's minimum ages, infant gaps and every row of its rule table
// (src/logic/doseIntervalRules.js) are held against the CDC rules they
// correspond to (scripts/cdsi/cdsiRuleComparison.mjs). Printed version:
// `npx vite-node scripts/cdsi/cdsiCompare.mjs`.
//
// This test does NOT require the app to agree with CDSI: CDSI runs behind
// ACIP's wording, and where they differ the wording wins (owner rules
// 2026-08-10, 2026-10-17). It requires every difference to be NAMED, and it
// fails when anything changes unexplained:
//   1. a comparison differs and is not in DIFFERENCES;
//   2. a named difference now agrees (take it off the list);
//   3. a named difference's CDSI or app value moved from what was approved;
//   4. a row of the app's rule table is not compared;
//   5. CDC's file differs from the saved copy (cdc-files/pneumo-cdsi-rules.json):
//      read the release notes, then re-save with
//      `npx vite-node scripts/cdsi/cdsiCompare.mjs --save-facts`.
// The four child-floor differences were approved by the owner 2026-11-27
// ("Yes, keep all 4"); the other three rest on earlier recorded rulings.
import { describe, it, expect } from 'vitest';
import { DOSE_INTERVAL_RULES } from '../doseIntervalRules.js';
import { readCdsiFacts, readSavedFacts, CDSI_VERSION } from '../../../scripts/cdsi/cdsiRules.mjs';
import { allComparisons, DIFFERENCES, NOT_COMPARED, adultGapFacts } from '../../../scripts/cdsi/cdsiRuleComparison.mjs';

const facts = readCdsiFacts();
const rows = allComparisons();
const byId = new Map(rows.map((r) => [r.id, r]));

describe("CDC's CDSI pneumococcal rule file is read", () => {
  it(`CDSI ${CDSI_VERSION}: all 870 rules read, each with a unique name`, () => {
    expect(CDSI_VERSION).toBe('4.65');
    expect(facts.size).toBe(870);
  });

  it('CDC\'s file matches the saved copy, rule by rule (a new release fails here first)', () => {
    const saved = readSavedFacts();
    expect(saved, 'no saved copy — run cdsiCompare.mjs --save-facts').not.toBeNull();
    const now = Object.fromEntries([...facts.values()].map((f) => [f.key, f.value]));
    expect(now).toEqual(saved);
  });

  it('CDSI states 38 adult gaps, and none of them is a floor', () => {
    const adult = adultGapFacts();
    expect(adult).toHaveLength(38);
    for (const name of adult) expect(facts.get(`PNEUMO · Pneumococcal ${name}`).abs.n, name).toBe(0);
  });
});

describe('every difference between the app and CDSI is named', () => {
  it('every row of the app\'s rule table is compared exactly once', () => {
    const compared = rows.filter((r) => r.id.startsWith('RULE ')).map((r) => r.id.slice(5));
    expect(compared.sort()).toEqual(DOSE_INTERVAL_RULES.map((r) => r.id).sort());
  });

  it('no difference is unnamed', () => {
    expect(rows.filter((r) => !r.agree && !DIFFERENCES[r.id]).map((r) => `${r.id}: CDSI ${r.cdsi} | app ${r.app}`)).toEqual([]);
  });

  it('no named difference has stopped differing (or vanished)', () => {
    for (const id of Object.keys(DIFFERENCES)) {
      expect(byId.has(id), `${id} is no longer compared`).toBe(true);
      expect(byId.get(id).agree, `${id} now agrees — take it off DIFFERENCES`).toBe(false);
    }
  });

  it('each named difference still has exactly the CDSI and app values it was approved at', () => {
    for (const [id, d] of Object.entries(DIFFERENCES)) {
      expect({ id, cdsi: byId.get(id).cdsi, app: byId.get(id).app }).toEqual({ id, cdsi: d.cdsi, app: d.app });
    }
  });

  it('each named difference says why, and who approved it', () => {
    for (const [id, d] of Object.entries(DIFFERENCES)) {
      expect(['wording', 'owner'], id).toContain(d.status);
      expect(d.reason.length, id).toBeGreaterThan(40);
      expect(d.approved, id).toMatch(/owner|CDC/);
    }
  });

  it('the list holds exactly the 7 differences measured on 2026-11-27 — 4 owner-approved that day', () => {
    expect(Object.keys(DIFFERENCES).sort()).toEqual([
      'AGE-PCV21', 'GAP-PCV-D3-AFTER-7-11', 'PCV7-COUNTS',
      'RULE CHILD-PCV-AFTER-PPSV23', 'RULE CHILD-PPSV23-AFTER-INVALID-PPSV23',
      'RULE CHILD-PPSV23-AFTER-PCV', 'RULE CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST',
    ]);
    expect(Object.values(DIFFERENCES).filter((d) => /2026-11-27/.test(d.approved))).toHaveLength(4);
    expect(rows.filter((r) => r.agree)).toHaveLength(28);
  });

  it('what is not compared is written down, with a reason', () => {
    expect(NOT_COMPARED.length).toBeGreaterThan(0);
    for (const x of NOT_COMPARED) expect(x.why.length, x.what).toBeGreaterThan(40);
  });
});
