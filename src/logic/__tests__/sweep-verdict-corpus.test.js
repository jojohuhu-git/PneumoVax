// ─────────────────────────────────────────────────────────────────────────
// sweep-verdict-corpus.test.js — the sweep harness (S8, 2026-10-11).
//
// THE GUARD THAT MAKES A MOVED VERDICT VISIBLE.
//
// `__corpus__/verdict-corpus.tsv` holds one line per synthetic patient: their
// age, risk ticks and vaccination history, and the answer this app gives them.
// This test re-runs the engine over the whole grid and requires it to reproduce
// that file exactly.
//
// ── Why ──────────────────────────────────────────────────────────────────
//
// Twice in one week a change moved thousands of patients' answers and nothing
// in the repo noticed.
//
//   peds P0-2 — `pcvInfant` over-stated the series total in 5 of the 14 cells of
//   immunize.org p2016 Table 1. CLINICAL_SPEC.md was RIGHT; the engine was
//   wrong. The three PneumoRecs comparison harnesses came out byte-identical,
//   because no case of theirs fell in a broken cell.
//
//   ANCHOR-1 — a deliberate, owner-approved fix that moved 19,546 of 231,300
//   synthetic cases. The same three harnesses came out byte-identical AGAIN,
//   because none of their cases has a rejected dose anchoring another one.
//
// Byte-identical twice, across a change that moved nineteen thousand verdicts.
// A hand-written case list covers the cells somebody thought of; the sweep that
// found both of those was written by hand, run once, and thrown away with the
// session that wrote it. This makes it permanent and makes it a GATE.
//
// ── What a failure means, and what to do ─────────────────────────────────
//
// It does NOT automatically mean a bug. It means patients' answers changed and
// somebody has to say why. If the change was intended:
//
//     npm run sweep:update
//
// which rewrites the corpus and prints how many verdicts moved. Put that number
// in the pull request. The friction is the feature — it is the step that was
// missing both times.
//
// ── What it does not check ───────────────────────────────────────────────
//
// It is a CHANGE detector, not a correctness oracle: it cannot tell a fix from a
// regression, and a wrong answer that has always been wrong is baked into the
// corpus. That is what `CLINICAL_SPEC.md`, the audits, and the owner's review
// are for. Nor does it record note text or dose labels — see `test-grid.js` for
// why keeping prose out is deliberate.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import {
  corpusLines,
  buildCases,
  verdictOf,
  CORPUS_RELATIVE_PATH,
  CORPUS_TODAY,
  GRID_AGES_MONTHS,
  GRID_RISK_PROFILES,
  GRID_PCV_HISTORIES,
  GRID_PPSV23_HISTORIES,
} from '../../test-grid.js';
import { DOSE_INTERVAL_RULES } from '../doseIntervalRules.js';
import { RISK_FACTORS } from '../../data/riskFactors.js';
import { PCV_HISTORY_PRODUCTS } from '../../data/brands.js';

const corpusUrl = new URL(`../../../${CORPUS_RELATIVE_PATH}`, import.meta.url);

const committed = existsSync(corpusUrl)
  ? readFileSync(corpusUrl, 'utf8').split('\n').filter(Boolean)
  : null;

const split = (line) => {
  const i = line.indexOf('\t');
  return [line.slice(0, i), line.slice(i + 1)];
};
const asMap = (lines) => new Map(lines.map(split));

describe('S8 sweep: the committed verdict corpus exists', () => {
  it('there is a corpus file to compare against', () => {
    expect(
      committed,
      `${CORPUS_RELATIVE_PATH} is missing. Create it with:\n\n    npm run sweep:update\n\n`
      + 'Without it nothing stops an engine change from moving thousands of patients\' '
      + 'answers silently, which has already happened twice (peds P0-2 and ANCHOR-1).'
    ).not.toBeNull();
    expect(committed.length).toBeGreaterThan(0);
  });
});

describe('S8 sweep: the engine still gives every patient the answer it gave before', () => {
  const fresh = corpusLines();

  it(`reproduces all ${committed?.length ?? 0} committed verdicts`, () => {
    const before = asMap(committed);
    const after = asMap(fresh);

    const moved = [];
    const added = [];
    const removed = [];
    for (const [k, v] of after) {
      if (!before.has(k)) added.push(k);
      else if (before.get(k) !== v) moved.push(k);
    }
    for (const k of before.keys()) if (!after.has(k)) removed.push(k);

    if (moved.length || added.length || removed.length) {
      const sample = moved.slice(0, 8).map((k) => (
        `  ${k}\n    was: ${before.get(k)}\n    now: ${after.get(k)}`
      )).join('\n');

      throw new Error(
        `The engine's answers changed for ${moved.length} of ${before.size} synthetic patients`
        + `${added.length ? `, ${added.length} cases were added` : ''}`
        + `${removed.length ? `, ${removed.length} cases disappeared` : ''}.\n\n`
        + (sample ? `${sample}\n${moved.length > 8 ? `  ... and ${moved.length - 8} more.\n` : ''}\n` : '')
        + 'This is not automatically a bug — but somebody has to say why these patients\n'
        + 'should get a different answer now.\n\n'
        + 'If the change was intended, run:\n\n'
        + '    npm run sweep:update\n\n'
        + 'and put the moved count in the pull request description. If it was NOT\n'
        + 'intended, you have just found the kind of regression that went unnoticed\n'
        + 'twice before this gate existed (peds P0-2, ANCHOR-1).\n\n'
        + 'A key reads: a<age in months>|r:<risk ids>|P:<PCV product@days ago>|S:<PPSV23 days ago>.'
      );
    }

    expect(moved).toEqual([]);
  });

  it('is reproducible — running the grid twice gives the same answers', () => {
    // A verdict that depends on the wall clock, on object iteration order or on
    // anything else non-deterministic would make this gate fire at random, and a
    // gate that fires at random gets deleted. The pinned clock is what prevents it.
    expect(corpusLines()).toEqual(fresh);
  });
});

describe('S8 sweep: the grid cannot pass by sweeping nothing', () => {
  // MeningoVax's lesson (`regression-*-no-vacuous-negative-assertions`): a sweep
  // whose grid has quietly collapsed still passes, and passes forever. These
  // assertions fail if the grid stops producing the VARIETY the corpus needs to
  // be worth anything.
  const cases = buildCases();
  const verdicts = cases.map((c) => verdictOf(c.input));

  it('the grid is still thousands of cases, not a handful', () => {
    expect(cases.length).toBeGreaterThan(10000);
    expect(new Set(cases.map((c) => c.key)).size).toBe(cases.length); // no duplicate keys
  });

  it('the pinned clock is still pinned', () => {
    // If the corpus ever keyed off the real date it would churn daily and the
    // whole gate would be turned off within a week.
    expect(CORPUS_TODAY).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(cases.every((c) => c.input.today === CORPUS_TODAY)).toBe(true);
  });

  it('the grid produces real variety, not one answer repeated', () => {
    const distinct = new Set(verdicts);
    expect(distinct.size).toBeGreaterThan(100);
  });

  it('the grid actually reaches a hard-stop exclusion', () => {
    expect(verdicts.some((v) => v === 'EXCLUDED')).toBe(true);
  });

  it('the grid actually reaches the HSCT pathway', () => {
    expect(verdicts.some((v) => v.includes('HSCT=') && !v.includes('HSCT=-'))).toBe(true);
  });

  it('the grid actually produces doses that do not count', () => {
    // The ANCHOR-1 coverage gap in one assertion: if no case in the grid has a
    // rejected dose, the corpus cannot notice a change to what a gap is measured
    // from, which is exactly how that change came out byte-identical.
    const rejected = verdicts.filter((v) => /:1:[01]:/.test(v));
    expect(rejected.length).toBeGreaterThan(100);
  });

  it('the grid exercises a majority of the interval rules, including an adult floor', () => {
    const fired = new Set();
    for (const v of verdicts) {
      for (const m of v.matchAll(/:([A-Z][A-Z0-9-]*[A-Z0-9]):/g)) fired.add(m[1]);
    }
    const known = new Set(DOSE_INTERVAL_RULES.map((r) => r.id));
    const firedKnown = [...fired].filter((id) => known.has(id));

    expect(
      firedKnown.length,
      'The grid no longer triggers most of the interval rules, so the corpus would not '
      + `notice them changing. Fired: ${firedKnown.sort().join(', ') || '(none)'}.\n`
      + 'Add day offsets to GRID_PCV_HISTORIES / GRID_PPSV23_HISTORIES that straddle the '
      + 'missing rules\' minimums.'
    ).toBeGreaterThanOrEqual(Math.ceil(known.size / 2));

    // At least one ADULT floor must fire. Every adult floor is an owner clinical
    // determination (2026-10-11); they are the newest rules in the app and the
    // ones three of which were, until S14-7, checked by nothing at all.
    const adultFloors = DOSE_INTERVAL_RULES
      .filter((r) => r.rulebook === 'adult' && r.enforcement === 'floor')
      .map((r) => r.id);
    expect(adultFloors.some((id) => fired.has(id))).toBe(true);
  });

  it('the grid covers every risk factor the app offers, and every product', () => {
    // P2-6's "the grid covers the app" guard, applied to this grid: adding a risk
    // factor or a product to the data files without widening the grid means the
    // corpus silently stops covering the app.
    const gridRisks = new Set(GRID_RISK_PROFILES.flat());
    const appRisks = RISK_FACTORS.map((r) => r.id);
    const uncovered = appRisks.filter((id) => !gridRisks.has(id));

    // Not every risk id needs its own profile — one per PATHWAY is the design —
    // but a risk id that selects a pathway no profile reaches is a hole. Assert
    // that every GROUP the app defines is represented.
    const groupsInGrid = new Set(
      RISK_FACTORS.filter((r) => gridRisks.has(r.id)).map((r) => r.group ?? 'none')
    );
    const groupsInApp = new Set(RISK_FACTORS.map((r) => r.group ?? 'none'));
    expect(
      [...groupsInApp].filter((g) => !groupsInGrid.has(g)),
      `GRID_RISK_PROFILES has no representative for these risk groups: `
      + `${[...groupsInApp].filter((g) => !groupsInGrid.has(g)).join(', ')}. `
      + `Uncovered risk ids, for reference: ${uncovered.join(', ') || '(none)'}.`
    ).toEqual([]);

    // Products: every PCV the app knows about should appear in some history, or
    // the corpus cannot notice that product's rules changing.
    const gridProducts = new Set(GRID_PCV_HISTORIES.flat().map(([p]) => p));
    const appProducts = PCV_HISTORY_PRODUCTS.map((b) => b.key);
    const missingProducts = appProducts.filter((p) => !gridProducts.has(p));
    expect(
      missingProducts,
      `GRID_PCV_HISTORIES never records these products the app supports: `
      + `${missingProducts.join(', ')}. Add a history that uses them.`
    ).toEqual([]);
  });

  it('the grid spans infants through the oldest adults', () => {
    expect(Math.min(...GRID_AGES_MONTHS)).toBeLessThanOrEqual(2);
    expect(Math.max(...GRID_AGES_MONTHS)).toBeGreaterThanOrEqual(780);
    // Both sides of the peds/adult rulebook boundary (ADULT_SCHED_MIN_M = 228).
    expect(GRID_AGES_MONTHS.some((a) => a < 228)).toBe(true);
    expect(GRID_AGES_MONTHS.some((a) => a >= 228)).toBe(true);
    expect(GRID_PPSV23_HISTORIES.length).toBeGreaterThan(1);
  });
});
