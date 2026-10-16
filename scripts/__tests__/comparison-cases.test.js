// P2-13 (2026-10-15) — the PneumoRecs comparison harnesses are wired into the
// suite.
//
// `adultCases.mjs`, `pedsCases.mjs` and `hsctCases.mjs` (CLAUDE.md's "PneumoRecs
// comparison harnesses, dev-only") are case matrices clinicians and this app's
// own sessions compare against CDC's PneumoRecs VaxAdvisor by eye, running each
// one by hand with `node scripts/<name>.mjs`. Nothing ran them as part of
// `npm test`, so a case could rot — an id typo'd into a duplicate, a dose shape
// `recommend()` no longer accepts, a file that stopped exporting its array at
// all — and the suite would stay green while the harness silently went dark.
// `scripts/check-root-notes.sh` already had this kind of test; these three
// files did not.
//
// This is deliberately a SMOKE test, not a parity check: nobody has typed in
// what PneumoRecs itself returns for each case (several entries say so in
// their own `predict` field — the point of these files is human comparison),
// so there is nothing to assert the OUTPUT equals. What this guards is that
// every case is well-formed and the engine can actually run it.
//
// `updateVerdictCorpus.mjs` is NOT imported here on purpose: it regenerates
// the committed sweep corpora as a side effect of being loaded at all, which
// CLAUDE.md says to do only with a reason to give in the PR — importing it in
// a test would make every `npm test` silently rewrite `__corpus__/*.tsv`.
import { describe, it, expect } from 'vitest';
import { recommend } from '../../src/logic/recommend.js';
import { ADULT_CASES } from '../adultCases.mjs';
import { PEDS_CASES } from '../pedsCases.mjs';
import { HSCT_CASES } from '../hsctCases.mjs';

const SUITES = [
  ['adultCases.mjs', 'ADULT_CASES', ADULT_CASES, /^A\d+$/],
  ['pedsCases.mjs', 'PEDS_CASES', PEDS_CASES, /^P\d+$/],
  ['hsctCases.mjs', 'HSCT_CASES', HSCT_CASES, /^H\d+$/],
];

describe('P2-13 — PneumoRecs comparison harnesses stay runnable', () => {
  it.each(SUITES)('%s exports a non-empty case list', (_file, _name, cases) => {
    expect(Array.isArray(cases)).toBe(true);
    expect(cases.length).toBeGreaterThan(0);
  });

  it.each(SUITES)('%s has no duplicate case ids', (_file, _name, cases) => {
    const ids = cases.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(SUITES)('%s case ids follow this file\'s own prefix', (_file, _name, cases, idPattern) => {
    for (const c of cases) {
      expect(c.id).toMatch(idPattern);
    }
  });

  it.each(SUITES)('%s — every case runs through recommend() without throwing', (_file, _name, cases) => {
    for (const c of cases) {
      expect(
        () => recommend({
          ageMonths: c.ageMonths,
          riskIds: c.riskIds,
          pcvDoses: c.pcvDoses,
          ppsv23Doses: c.ppsv23Doses,
          // Each file pins its own TODAY for determinism; recommend() also
          // accepts no `today` at all (the suite-wide clock pin covers that
          // path elsewhere), so this only has to prove the shape is valid.
        }),
        `${c.id} (${c.label}) threw`
      ).not.toThrow();
    }
  });

  it.each(SUITES)('%s — recommend() returns a usable recs array for every case', (_file, _name, cases) => {
    for (const c of cases) {
      const out = recommend({
        ageMonths: c.ageMonths,
        riskIds: c.riskIds,
        pcvDoses: c.pcvDoses,
        ppsv23Doses: c.ppsv23Doses,
      });
      expect(Array.isArray(out.recs), `${c.id} recs`).toBe(true);
      expect(out.recs.length).toBeGreaterThan(0);
    }
  });
});
