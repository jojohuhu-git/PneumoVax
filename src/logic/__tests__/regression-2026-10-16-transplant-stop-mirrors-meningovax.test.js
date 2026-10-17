// 2026-10-16 — the transplant hard stop is IDENTICAL in PneumoVax and
// MeningoVax, and nothing is allowed to drift it apart.
//
// ── Why this test exists ─────────────────────────────────────────────────
//
// Both apps show the same patient the same screen for the same reason: this
// tool does not apply, go and follow a transplant- or therapy-specific
// protocol. A clinician who uses both apps should not be told two different
// things, and more to the point should not have to wonder whether a wording
// difference means a clinical difference.
//
// The stop message was ALREADY byte-identical across the two apps before
// today — 550 characters each, verified — but only by luck: it was typed out
// twice and nothing compared the copies. This test is what turns that luck
// into a guarantee. The same shape caught the `dateUtils.js` mirror drifting
// (S6-4), on the same one-sided pattern: hardcode the sibling's path, SKIP
// when it is absent, because CI clones only this repo.
//
// ── Why bytes, and not "says roughly the same thing" ─────────────────────
//
// The non-breaking hyphens (U+2011) in "CAR‑T", "B‑cell", "transplant‑ or
// therapy‑specific" and "age‑based" are load-bearing: they stop those terms
// breaking mid-word on a phone. A plain hyphen would read identically in a
// code review and look wrong on a 375px screen. Comparing bytes is the only
// comparison that notices.
//
// ── What this file does NOT guard ────────────────────────────────────────
//
// It does not compare whole files. The two apps' `recommend.js` and
// `riskFactors.js` are different programs — one schedules pneumococcal
// vaccines, the other meningococcal — and must stay free to diverge. What is
// frozen is exactly the shared SURFACE: the merged risk row's four fields,
// the stop message, the banner title, and the recorded-doses line.
//
// ── When this test fails ─────────────────────────────────────────────────
//
// Change the wording in BOTH repos, in one pull request per repo, or do not
// change it. Do not "fix" this test by loosening the comparison. The decision
// it encodes is 2026-10-16's, recorded in
// docs/archive/plan-2026-10-16-transplant-hard-stop-both-apps.md.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { recommend } from '../recommend.js';
import { RISK_BY_ID } from '../../data/riskFactors.js';
import { buildCases, GRID_RISK_PROFILES, CORPUS_TODAY } from '../../test-grid.js';

const SIBLING = '/Users/joannehuang/Downloads/MeningoVax-main/src';
const EXCLUDE_ID = 'hct_cart_bcell_exclude';

/** Read a sibling-repo file, or null when the sibling is not checked out. */
function sibling(rel) {
  try {
    return readFileSync(`${SIBLING}/${rel}`, 'utf8');
  } catch {
    return null;
  }
}

/**
 * The exact text between two quotes, for one known key, out of a source file.
 * Deliberately a crude extractor rather than an import: importing
 * MeningoVax's modules into PneumoVax's test run would pull its whole engine
 * (and its own `node_modules` resolution) into this process.
 */
function quotedValue(src, key) {
  const m = src.match(new RegExp(`${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`));
  return m ? m[1].replace(/\\'/g, "'") : null;
}

describe('the transplant stop is byte-identical to MeningoVax', () => {
  // ── The half that runs everywhere, sibling or no sibling ──────────────
  //
  // Without these, a missing sibling repo would make the whole file pass
  // while checking nothing at all — the vacuity trap every skip-when-absent
  // test has.

  it('this repo has exactly one excluding risk row, and it is the merged one', () => {
    const excluding = Object.values(RISK_BY_ID).filter((r) => r.exclude === true);
    expect(excluding.map((r) => r.id)).toEqual([EXCLUDE_ID]);
  });

  it('the merged row carries the agreed id, label, sublabel and flag', () => {
    const row = RISK_BY_ID[EXCLUDE_ID];
    expect(row.label).toBe(
      'Hematopoietic cell transplant (HCT/HSCT), CAR-T therapy, B-cell malignancy, or B-cell-depleting therapy',
    );
    expect(row.sublabel).toBe(
      'this tool does not apply — needs an individualized, specialist-guided schedule',
    );
    expect(row.exclude).toBe(true);
    // Transplant is named first because it is the common tick.
    expect(row.label.indexOf('transplant')).toBeLessThan(row.label.indexOf('CAR-T'));
    // Decision 6: one citation, and the authorities in the message are words.
    expect(row.refs).toEqual(['cdcAlteredImmunocompetence']);
  });

  it('the stop message is the agreed 307 characters, non-breaking hyphens included', () => {
    const { exclusionMessage } = recommend({
      ageMonths: 400, riskIds: [EXCLUDE_ID], pcvDoses: [], ppsv23Doses: [], today: CORPUS_TODAY,
    });
    expect(exclusionMessage).toBe(
      'Revaccination after hematopoietic cell transplant, '
      + 'CAR‑T therapy, or B‑cell–depleting therapy follows a '
      + 'transplant‑ or therapy‑specific protocol, not age‑based '
      + 'scheduling, and some live vaccines may be contraindicated. Follow your '
      + 'institutional protocol or current national guidance (ASCO, NCCN, IDSA, '
      + 'CDC).',
    );
    // Spelled out separately so a failure says WHICH property broke. FIVE
    // non-breaking hyphens — CAR‑T, B‑cell, transplant‑, therapy‑specific,
    // age‑based — plus the en dash in "B‑cell–depleting", and no ASCII hyphen
    // left inside any of the hyphenated terms.
    expect([...exclusionMessage].filter((c) => c === '‑')).toHaveLength(5);
    expect([...exclusionMessage].filter((c) => c === '–')).toHaveLength(1);
    expect(exclusionMessage).not.toMatch(/CAR-T|B-cell|transplant- |age-based/);
    expect(exclusionMessage).toHaveLength(307);
  });

  it('Results.jsx renders the agreed title and recorded-doses line', () => {
    const jsx = readFileSync(new URL('../../components/Results.jsx', import.meta.url), 'utf8');
    expect(jsx).toContain('Individualized revaccination schedule required');
    expect(jsx).toContain('Recorded doses are kept but not evaluated here.');
    // The old title must be gone, not merely unused — it described the
    // software ("Does not apply to this patient") rather than the patient's
    // situation, which is why decision 5 replaced it.
    expect(jsx).not.toContain('Does not apply to this patient');
  });

  // ── The half that needs the sibling repo ──────────────────────────────

  it("matches MeningoVax's merged risk row field for field", () => {
    const src = sibling('data/riskFactors.js');
    if (src === null) return; // sibling not checked out (CI) — guards above ran

    const row = RISK_BY_ID[EXCLUDE_ID];
    expect(src, 'MeningoVax has no row with this id').toContain(`id: '${EXCLUDE_ID}'`);
    expect(quotedValue(src, 'label')).not.toBeNull();

    // Pull the sibling's row out by its id and read the three strings from it.
    const block = src.slice(src.indexOf(`id: '${EXCLUDE_ID}'`));
    const theirs = {
      label: quotedValue(block, 'label'),
      sublabel: quotedValue(block, 'sublabel'),
    };
    expect(theirs.label).toBe(row.label);
    expect(theirs.sublabel).toBe(row.sublabel);
    expect(block.slice(0, block.indexOf('},'))).toMatch(/exclude:\s*true/);
  });

  it("matches MeningoVax's stop message byte for byte", () => {
    const src = sibling('logic/recommend.js');
    if (src === null) return;

    // Both apps build the string by concatenating quoted fragments, so
    // compare the joined fragments rather than trying to eval the expression.
    const grab = (text) => {
      const i = text.indexOf('const EXCLUSION_MESSAGE =');
      expect(i, 'EXCLUSION_MESSAGE not found').toBeGreaterThan(-1);
      const decl = text.slice(i, text.indexOf(';', i));
      return [...decl.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]).join('');
    };
    const mine = readFileSync(new URL('../recommend.js', import.meta.url), 'utf8');
    const ours = grab(mine);
    expect(ours.length).toBeGreaterThan(200); // not vacuous
    expect(ours).toBe(grab(src));
  });

  it("matches MeningoVax's banner title and recorded-doses line", () => {
    const src = sibling('components/Results.jsx');
    if (src === null) return;

    for (const line of [
      'Individualized revaccination schedule required',
      'Recorded doses are kept but not evaluated here.',
    ]) {
      expect(src, `MeningoVax's Results.jsx is missing: ${line}`).toContain(line);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// The IN-REPO guard: the stop really does stop, for every patient.
//
// This is the test that would have caught the two apps diverging in the first
// place, and it is the one that would catch the `exclude` flag being lifted
// off the row. The mirror tests above compare TEXT; this one compares
// BEHAVIOUR, across every age and every history the grid knows about.
// ─────────────────────────────────────────────────────────────────────────
describe('the stop stops, at every age and with every history', () => {
  const CASES = buildCases({ today: CORPUS_TODAY })
    .filter((c) => (c.input.riskIds ?? []).includes(EXCLUDE_ID));

  it('the grid actually contains the exclude id', () => {
    // Anti-vacuity: without this, deleting the profile from the grid would
    // make every assertion below pass over an empty list.
    expect(GRID_RISK_PROFILES.some((p) => p.includes(EXCLUDE_ID))).toBe(true);
    expect(CASES.length).toBeGreaterThan(1000);
  });

  it('every one of them is excluded, with nothing to show and nothing graded', () => {
    const offenders = [];
    for (const c of CASES) {
      const r = recommend(c.input);
      if (r.excluded !== true
        || (r.recs ?? []).length !== 0
        || (r.perDose?.pcv ?? []).length !== 0
        || (r.perDose?.ppsv23 ?? []).length !== 0
        || !r.exclusionMessage) {
        offenders.push(c.key);
      }
    }
    expect(offenders.slice(0, 20), `${offenders.length} of ${CASES.length} were not stopped`)
      .toEqual([]);
  });

  it('every one of them gets the SAME message — no age branch, ever', () => {
    const distinct = new Set(CASES.map((c) => recommend(c.input).exclusionMessage));
    expect([...distinct]).toHaveLength(1);
  });
});
