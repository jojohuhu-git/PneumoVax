// ─────────────────────────────────────────────────────────────────────────
// sweep-record-problem-corpus.test.js — the impossible-entry sweep
// (owner decision, 2026-10-12).
//
// THE GUARD FOR HISTORIES A CLINICIAN COULD NEVER HAVE GIVEN.
//
// `__corpus__/record-problem-corpus.tsv` holds one line per synthetic patient
// whose record contains a dose dated before they were born, or dated after
// today. This test re-runs the engine over that grid and requires it to
// reproduce the file exactly — the same contract as `sweep-verdict-corpus`,
// over the cases that one deliberately has none of.
//
// ── Why there are two corpora and not one ────────────────────────────────
//
// Measured, not argued. With only the main sweep in place:
//
//   • Deleting `isBeforeBirth()` from validate.js outright — so the app goes
//     back to grading a dose dated before birth as an ordinary under-age dose
//     — left `sweep-verdict-corpus.test.js` GREEN, 12 of 12. The main grid
//     builds 15,340 such patients and throws every one away before testing.
//   • Short-circuiting `futureDated()` to never fire — so a dose dated 2030
//     counts toward the series — left it GREEN too. Stronger: the main grid
//     writes every dose as "days ago" and cannot express a future date at all.
//
// Three separate changes in one session each reported "0 of 16,250 moved".
// Every one of those numbers was true and none of them meant anything.
//
// The two corpora are kept apart (owner decision) so that the main one keeps
// meaning "patients a clinician could really enter": when a clinical change
// moves 300 of them the reviewer reads 300 lines, rather than 300 lost among
// 23,000 impossible records.
//
// ── What a failure means ─────────────────────────────────────────────────
//
// The same as the main sweep's. It is a CHANGE detector, not a correctness
// oracle. If the change was intended:
//
//     npm run sweep:update
//
// which rewrites BOTH corpora and prints how many verdicts moved in each. Put
// the numbers in the pull request.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import {
  recordProblemCorpusLines,
  buildRecordProblemCases,
  recordProblemVerdictOf,
  buildCases,
  RECORD_PROBLEM_CORPUS_RELATIVE_PATH,
  CORPUS_TODAY,
  GRID_AGES_MONTHS,
  GRID_RISK_PROFILES,
  GRID_FUTURE_PCV_HISTORIES,
  GRID_FUTURE_PPSV23_HISTORIES,
  GRID_DUPLICATE_PCV_HISTORIES,
} from '../../test-grid.js';

const corpusUrl = new URL(`../../../${RECORD_PROBLEM_CORPUS_RELATIVE_PATH}`, import.meta.url);

const committed = existsSync(corpusUrl)
  ? readFileSync(corpusUrl, 'utf8').split('\n').filter(Boolean)
  : null;

const split = (line) => {
  const i = line.indexOf('\t');
  return [line.slice(0, i), line.slice(i + 1)];
};
const asMap = (lines) => new Map(lines.map(split));

describe('impossible-entry sweep: the committed corpus exists', () => {
  it('there is a corpus file to compare against', () => {
    expect(
      committed,
      `${RECORD_PROBLEM_CORPUS_RELATIVE_PATH} is missing. Create it with:\n\n`
      + '    npm run sweep:update\n\n'
      + 'Without it, the two rules that refuse an impossible dose entry are guarded '
      + 'by nothing: both were deleted on purpose and the main sweep stayed green.'
    ).not.toBeNull();
    expect(committed.length).toBeGreaterThan(0);
  });
});

describe('impossible-entry sweep: the engine still refuses every impossible entry the same way', () => {
  const fresh = recordProblemCorpusLines();

  it(`reproduces all ${committed?.length ?? 0} committed verdicts`, () => {
    const before = asMap(committed ?? []);
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
        `The engine's answers changed for ${moved.length} of ${before.size} impossible-entry patients`
        + `${added.length ? `, ${added.length} cases were added` : ''}`
        + `${removed.length ? `, ${removed.length} cases disappeared` : ''}.\n\n`
        + (sample ? `${sample}\n${moved.length > 8 ? `  ... and ${moved.length - 8} more.\n` : ''}\n` : '')
        + 'These are records a clinician could never have given — a dose dated before\n'
        + 'the patient was born, or dated after today. A change here means the app has\n'
        + 'changed its mind about one of those, which is almost never intended.\n\n'
        + 'If it WAS intended, run:\n\n'
        + '    npm run sweep:update\n\n'
        + 'and put the moved count in the pull request.\n\n'
        + 'A key reads: a<age in months>|r:<risk ids>|P:<PCV product@days ago>|S:<PPSV23 days ago>.\n'
        + 'A NEGATIVE offset means that many days AFTER today. The trailing RP= field is\n'
        + 'which kind of record problem each dose was judged to be, PCV stream then PPSV23.'
      );
    }

    expect(moved).toEqual([]);
  });

  it('is reproducible — running the grid twice gives the same answers', () => {
    expect(recordProblemCorpusLines()).toEqual(fresh);
  });
});

describe('impossible-entry sweep: the grid cannot pass by sweeping nothing', () => {
  // The same lesson as the main sweep's anti-vacuous block: a grid that has
  // quietly collapsed still passes, and passes forever. These fail if this grid
  // stops containing the thing it exists for.
  const cases = buildRecordProblemCases();
  const verdicts = cases.map((c) => recordProblemVerdictOf(c.input));
  const graded = verdicts.filter((v) => v !== 'EXCLUDED');

  it('the grid is thousands of cases, with no duplicate keys', () => {
    expect(cases.length).toBeGreaterThan(10000);
    expect(new Set(cases.map((c) => c.key)).size).toBe(cases.length);
  });

  it('it shares no case with the main grid', () => {
    // Part 1 is written as the main grid's skip condition NEGATED, so an overlap
    // would mean the two have fallen out of step and some case is being graded
    // against two different corpora.
    const main = new Set(buildCases().map((c) => c.key));
    expect(cases.filter((c) => main.has(c.key)).map((c) => c.key)).toEqual([]);
  });

  it('the pinned clock is still pinned', () => {
    expect(cases.every((c) => c.input.today === CORPUS_TODAY)).toBe(true);
  });

  it('no case in this grid is graded as an ordinary, fully valid history', () => {
    // The point of the grid in one assertion. If a case here grades every dose
    // as fine, either the grid stopped building impossible records or the engine
    // stopped noticing them. (Hard-stop patients return 'EXCLUDED' before any
    // dose is graded, so they are counted out, not left out.)
    //
    // Phrased as "nothing was refused" rather than "no RECORD PROBLEM was
    // raised", because 84 cases legitimately raise none and the stronger
    // wording failed on them. Measured, and the engine is right: a 12-month-old
    // with two PCV20 rows both dated at birth has the FIRST row refused for
    // being below the 6-week minimum age, so it never enters `kept` — and the
    // second row is therefore not a duplicate of a counted dose but a second
    // under-age dose in its own right. That is `duplicateEntry` matching
    // against doses that COUNTED, which is the behaviour its own regression
    // test pins down. Of those 84, exactly 0 come back fully valid.
    const ordinary = graded.filter((v) => !/:1:[01]:/.test(v));
    expect(
      ordinary.length,
      `${ordinary.length} of ${graded.length} impossible-entry cases had nothing refused at all. `
      + `First: ${ordinary[0] ?? '(none)'}`
    ).toBe(0);
  });

  it('all three kinds of impossible entry are actually reached', () => {
    // Every kind `recordProblemFor` can return. A kind that no case reaches is
    // a rule this corpus cannot notice changing — which is how the first two
    // shipped guarded by nothing, and why a new kind must arrive with a shape.
    //
    // Counted, not just "some", so a kind cannot quietly collapse to a handful
    // of cases and still look guarded. Measured at the time of writing:
    // before-birth 14,544, future 1,980, duplicate 576.
    const count = (kind) => graded.filter((v) => new RegExp(` RP=.*${kind}`).test(v)).length;
    expect(count('before-birth')).toBeGreaterThan(1000);
    expect(count('future')).toBeGreaterThan(500);
    expect(count('duplicate')).toBeGreaterThan(100);
  });

  it('the double-entry shapes cover both a named and an unnamed second row', () => {
    // `duplicateEntry` treats a blank product as a match, on the ground that a
    // clinician who named the brand on one line and not the other wrote one
    // dose twice. A grid with only the named shape could not notice that half
    // of the rule being removed.
    const pairs = GRID_DUPLICATE_PCV_HISTORIES.filter((h) => h.length === 2);
    expect(pairs.some(([a, b]) => a[0] === b[0] && a[1] === b[1])).toBe(true);
    expect(pairs.some(([a, b]) => a[1] === b[1] && (!a[0] || !b[0]))).toBe(true);
  });

  it('a dose dated TODAY is still counted — the boundary, from both sides', () => {
    // `futureDated` is `dose.date <= today`. The whole rule turns on that `=`,
    // and "today still counts" is the half a clinician actually relies on: a
    // dose given this morning must not be refused. The grid holds a dose dated
    // tomorrow; this holds the one dated today, so narrowing the comparison to
    // `<` cannot pass.
    const today = recordProblemVerdictOf({
      ageMonths: 840, dob: '1956-10-11', today: CORPUS_TODAY, riskIds: [],
      pcvDoses: [{ product: 'PCV20', date: CORPUS_TODAY }], ppsv23Doses: [],
    });
    expect(today).toContain('RP=-/');
    expect(today).not.toContain('future');
  });

  it('the future-dated shapes span one day out and a year out, alone and beside a real dose', () => {
    // A grid of only "a year in the future" would miss a rule that compares
    // years; a grid of only lone future doses would miss one applied per patient
    // instead of per dose.
    const offsets = GRID_FUTURE_PCV_HISTORIES.flat().map(([, d]) => d)
      .concat(GRID_FUTURE_PPSV23_HISTORIES.flat());
    expect(offsets.some((d) => d === -1)).toBe(true);
    expect(offsets.some((d) => d <= -30)).toBe(true);
    expect(GRID_FUTURE_PCV_HISTORIES.some((h) => h.length > 1 && h.some(([, d]) => d > 0))).toBe(true);
  });

  it('impossible entries are swept across the whole age and risk range, not one corner', () => {
    // A rule that fired only for infants, or only for patients with no risk
    // ticks, would otherwise look fully guarded.
    const ages = new Set(cases.map((c) => c.input.ageMonths));
    const risks = new Set(cases.map((c) => c.input.riskIds.join('+')));
    expect(ages.size).toBe(GRID_AGES_MONTHS.length);
    expect(risks.size).toBe(GRID_RISK_PROFILES.length);
  });
});
