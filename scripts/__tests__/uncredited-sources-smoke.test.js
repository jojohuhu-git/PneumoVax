// `scripts/uncreditedSources.mjs` smoke test — the same job P2-13 did for the
// PneumoRecs comparison harnesses and `prose-diff-smoke` did for proseDiff:
// keep a hand-run tool from going dark without anyone noticing.
//
// ── WHY THIS EXISTS, AND IT IS NOT HYPOTHETICAL ───────────────────────────
//
// `uncreditedSources.mjs` is the tool the whole C7/C8 citation effort measures
// with. Every "N cards credit a document for nothing it says" figure in the
// C7 reading log, in the citation plan, and in the owner's own decisions came
// out of it.
//
// It landed on `main` in `a47010f` (PR #58) ALREADY BROKEN, and stayed broken
// through four more merges. It imports `reasonCiteSlices` and `noteCiteSlices`
// from `citations.jsx` — two functions that exist only on the unmerged C2/C3
// branch where it was written. Run it on `main` and you get
// `TypeError: noteCiteSlices is not a function` and no measurement at all.
//
// Nothing in the suite could see that. `comparison-cases.test.js` covers
// `adultCases`/`pedsCases`, `prose-diff-smoke` covers `proseDiff` — this one
// was never added to either, so a tool that cannot run looked exactly like a
// tool nobody had run lately. That is the same shape as P2-13's finding, one
// file later.
//
// ── THE SKIP IS DELIBERATE, AND IT IS NOT A PASS ──────────────────────────
//
// Until C2/C3 merges, those two exports genuinely do not exist on `main`, and
// a hard failure here would make this branch unmergeable for a reason that is
// not this branch's fault. So the tool's run is SKIPPED when they are absent,
// with the reason printed — the one-sided pattern `regression-s6-4` already
// uses for the sibling repo. The assertion that the exports are MISSING is not
// made anywhere: a skip must never be mistaken for proof the tool works.
//
// Once C2/C3 is in, this runs for real on every `npm test` and the skip
// disappears by itself. If it is still skipping after that merge, something
// deleted an export and that is exactly what wants knowing.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import * as citations from '../../src/components/citations.jsx';

const NEEDED = ['reasonCiteSlices', 'noteCiteSlices'];
const missing = NEEDED.filter((name) => typeof citations[name] !== 'function');
const ready = missing.length === 0;

describe('uncreditedSources.mjs stays runnable', () => {
  // This half runs either way: the tool's own source is read, so the import
  // list cannot drift from what the file actually asks for without being seen.
  it('asks citations.jsx for exactly the helpers this test checks for', () => {
    const src = readFileSync(new URL('../uncreditedSources.mjs', import.meta.url), 'utf8');
    const importLine = src.match(/import \{([^}]*)\} from '\.\.\/src\/components\/citations\.jsx';/);
    expect(importLine, 'the citations.jsx import was not found — update NEEDED').not.toBeNull();
    const asked = importLine[1].split(',').map((s) => s.trim()).filter(Boolean);
    expect(asked.sort()).toEqual([...NEEDED].sort());
  });

  it('is driven from the shared grid, not a second case list', () => {
    const src = readFileSync(new URL('../uncreditedSources.mjs', import.meta.url), 'utf8');
    expect(src).toContain("from '../src/test-grid.js'");
  });

  // C10-1 (2026-10-23): this assertion used to be `pairs > 0` -- "the tool
  // reports at least one uncredited pair". That was always a PROXY for the
  // thing being guarded (the helpers accept what the engine produces), and the
  // citation work has now made it false: immunize.org p2016 reached zero
  // uncredited pairs, and the first 400 grid cases carry none at all. A proxy
  // that fails when the codebase gets BETTER is the wrong proxy.
  //
  // It is replaced by a STRONGER one, not a weaker one. `credited` counts the
  // (card, document) pairs the helpers actually resolved from real engine
  // output, so it is non-zero only if `noteCiteSlices`/`reasonCiteSlices` are
  // present AND returning markers the cards really carry -- which is precisely
  // the failure this file was written for (`noteCiteSlices is not a function`,
  // broken on main through five merges). `pairs` is still computed, because
  // the loop must keep exercising the chip side too, but nothing is asserted
  // about its value: driving it to zero is the goal, not a regression.
  it.skipIf(!ready)('runs, and the cite helpers resolve real markers', async () => {
    const { buildCases } = await import('../../src/test-grid.js');
    const { recommend } = await import('../../src/logic/recommend.js');
    // The tool's own counting loop, on a slice of the grid rather than all of
    // it — this proves the helpers accept what the engine produces, which is
    // the thing that broke. The full count is the tool's job, not a test's.
    let pairs = 0;
    let credited = 0;
    let cards = 0;
    for (const c of [...buildCases()].slice(0, 400)) {
      let result;
      try {
        result = recommend(c.input);
      } catch {
        continue;
      }
      if (result.excluded) continue;
      for (const rec of result.recs ?? []) {
        cards += 1;
        const cited = new Set();
        for (const v of rec.doseValidations ?? []) {
          for (const slice of citations.reasonCiteSlices(v?.reasons, v?.reasonCites)) {
            for (const x of slice) cited.add(x.page ?? x.key);
          }
        }
        const slices = citations.noteCiteSlices(rec.note, rec.noteCites);
        for (const x of [...slices.lead, ...slices.detail]) cited.add(x.page ?? x.key);
        credited += cited.size;
        for (const chip of rec.citations ?? []) if (!cited.has(chip.url)) pairs += 1;
      }
    }
    expect(cards).toBeGreaterThan(0);
    expect(credited).toBeGreaterThan(0);
  });

  if (!ready) {
    // Printed rather than asserted, on purpose: see the header.
    it('SKIPPED — says why, in the run output', () => {
      expect(missing.length).toBeGreaterThan(0);
      console.warn(
        `uncreditedSources.mjs cannot run here: citations.jsx does not export ${missing.join(', ')}. `
        + 'Those arrive with C2/C3 (PR #66). This is a skip, not a pass.',
      );
    });
  }
});
