// ── Whole-app rule check 7, "Stable over time": the LATER-LOOK half ──
// (required since 2026-11-07)
//
// Check 7 has two halves. This one opens the same record on later days. The
// other — a card's advised date still stands when that day comes, the half that
// found R3 — rides on the forward walk in whole-app-forward-checks-gate.test.js.
// Neither half alone is check 7: undoing R3 (P2-2) leaves THIS file green.
//
// Looking at the same record on a later day must not change the answer for no
// reason. Each patient is opened on their own date and again 1, 7, 28, 90, 365
// and 1,827 days later, with nothing new recorded. Two things are checked:
//   • a dose already given keeps its verdict (counted, thrown out, extra) —
//     it was given when it was given;
//   • with no age line crossed in between, every card is still there, a card's
//     advised date stays put until it arrives (and then the card is due), and a
//     due card stays due.
//
// The 2026-11-05 report found 1,833 patients failing this (R2, R3, R4) and said
// it should become required "when R2 and R3 land". R2 (the adult answer past 19)
// and R3 (P2-2, PR #125: an infant's advised date holds across 7 months) have
// both landed; measured 2026-11-07 over all 77,496 patients, 16 remain, all R4,
// all in this half.
//
// Allowed, by name, and nothing else:
//   • D2 and D5 — owner rulings §C-P2-ONTIME and §C-P1-3: a child's extra PPSV23
//     or conjugate is COUNTED once the patient turns 19, because the adult rows
//     count every dose received. causes.mjs sorts only the one-way move ("extra"
//     to "counted", on the 19th birthday); the reverse would be a new fault.
//   • p2-9 — information, not a fault (§L-2): a baby's card reads "Routine" until
//     the routine date passes, then "Catch-up".
//   • R4 — parked (the report's P2, an unlikely history the owner asked on
//     2026-10-31 not to be brought to her). A child with a PPSV23 that did not
//     count is held 5 years on Option B's second step; that date can fall before
//     the 8 weeks after Option B's own PCV15, and it vanishes once it passes.
//     PINNED at exactly 16 grid patients and 0 typical: more means it spread,
//     fewer means it was fixed and this pin should go.
//
// What it covers, in about 26 seconds of one core: all 17,016 grid patients and
// every 11th typical patient (5,499; the same sample as check 1, which reaches
// all 160 risk-and-age groups), each seen seven times. All 60,480 typical took
// 2 minutes 52 seconds when measured on 2026-11-07, which would make this the
// slowest file in the suite. That same day the whole typical list held 0 R4 and
// 0 unsorted, so the sample loses nothing known. `npm run checks` still runs
// the whole list. It is its own file, not part of
// whole-app-forward-checks-gate.test.js, because it shares no work with the
// forward walk there, and two files run side by side.
import { describe, it, expect, beforeAll } from 'vitest';
import { allPatients } from '../../../scripts/wholeApp/replay.mjs';
import { newTally, stableOverTime } from '../../../scripts/wholeApp/checks.mjs';

const TYPICAL_STRIDE = 11;
const ALLOWED = new Set([
  'D2-extra-dose-counts-at-19',
  'D5-extra-pcv15-counts-at-19',
  'p2-9-routine-then-behind',
  'R4-thrown-out-ppsv23-chip',
]);
const show = (rows) => rows.map((r) => `${r.cause} — ${r.kind} — ${r.group} — e.g. ${r.examples[0]?.key}`);

let tally;
let grid = 0;
let sampled = 0;
beforeAll(() => {
  tally = newTally();
  allPatients({ only: 'grid' }).forEach((p) => { grid += 1; tally.setPatient(p); stableOverTime(tally, p); });
  allPatients({ only: 'typical' }).forEach((p, i) => {
    if (i % TYPICAL_STRIDE) return;
    sampled += 1;
    tally.setPatient(p);
    stableOverTime(tally, p);
  });
}, 900_000);

describe('check 7: a later look at the same record does not change the answer', () => {
  it('reads every grid patient and the sampled typical ones', () => {
    expect({ grid, sampled }).toEqual({ grid: 17016, sampled: 5499 });
  });

  it('no change on any patient except the four groups allowed by name', () => {
    expect(show(tally.rows().filter((r) => r.check === 7 && !ALLOWED.has(r.cause)))).toEqual([]);
  });

  it('R4 is pinned at exactly 16 grid patients, 0 typical', () => {
    const r4 = tally.causes().find((c) => c.cause === 'R4-thrown-out-ppsv23-chip' && c.check === 7);
    expect({ grid: r4?.grid, typical: r4?.typical }).toEqual({ grid: 16, typical: 0 });
  });

  it('the two at-19 rulings only ever turn an extra dose into a counted one', () => {
    // causes.mjs sorts by pattern; this asserts the pattern's promise directly,
    // so a widened pattern cannot let the reverse move through.
    const moves = tally.rows().filter((r) => r.check === 7 && /^D[25]-/.test(r.cause));
    expect(moves.length).toBeGreaterThan(0);
    for (const r of moves) expect(r.group).toMatch(/^(pcv|ppsv23) (extraDose: true → -|effectiveDoseNum: - → \d) \(crossing 19\)$/);
  });
});
