// ── Whole-app rule checks 1, 4 and 7's forward half (required since 2026-11-07) ──
//
// CHECK 1 — the app accepts its own advice (joined 2026-11-07). A dose given on
// the date a card advised is never thrown out, called extra, called unneeded, or
// faulted for its spacing. The report called it the most valuable of the seven:
// every fault it found was the app telling a clinician to do something and then
// marking the clinician down for doing it. Noor (R1: "2nd PPSV23 due today", then
// thrown out), the children past 19 (R2), Sam (R4: "PPSV23 a year after PCV15",
// then "5 years advised"). It reached 0 patients with PR #129, so it joined the
// required tests that day, as the report's gate table says.
//
// CHECK 4 — the options agree (joined 2026-11-05, P0-1). When the app offers two
// vaccines for one dose, both follow the same wait.
//
// CHECK 7, FORWARD HALF — the advice still stands on its day (joined
// 2026-11-07). A card that names a date must, on that date, still offer that
// vaccine on that date. This is the half that found R3 (Remy: Jan 1, then Jan 29
// once the date came). The other half — the same record looked at on later days
// — is whole-app-stable-over-time-gate.test.js; it shares no work with this walk,
// so it is a separate file and runs beside this one.
//
// What it covers, in about 2½ minutes of one core:
//   • the 17,016 grid patients, each followed forward through the advice — one
//     walk, all three checks;
//   • check 4 on the first screen of all 60,480 typical patients;
//   • checks 1 and 7 on EVERY 11TH typical patient (5,499), followed forward. All
//     60,480 would add over 4 minutes. Measured 2026-11-07: the sample reaches
//     all 160 risk-and-age groups of the typical list; 11 is prime so it does
//     not fall into step with the list's own patterns.
// `npm run checks` still does the whole thing by hand, before a release.
//
// Allowed, by name, and nothing else:
//   • check 4: D3, the owner's ruling (a PPSV23 held 5 years after a thrown-out
//     one); R4, a thrown-out childhood PPSV23, pinned at exactly 16 patients;
//   • check 1: nothing;
//   • check 7's forward half: nothing (0 patients over all 77,496, 2026-11-07).
import { describe, it, expect, beforeAll } from 'vitest';
import { allPatients, firstState, view, walk } from '../../../scripts/wholeApp/replay.mjs';
import { newTally, replayChecks } from '../../../scripts/wholeApp/checks.mjs';

const TYPICAL_STRIDE = 11;
const show = (rows) => rows.map((r) => `${r.cause} — ${r.kind} — ${r.group} — e.g. ${r.examples[0]?.key}`);

let tally;
let sampled = 0;
beforeAll(() => {
  tally = newTally();
  const both = replayChecks(tally, new Set([1, 4, 7]));
  const checkOne = replayChecks(tally, new Set([1, 7]));
  const checkFour = replayChecks(tally, new Set([4]));
  allPatients({ only: 'grid' }).forEach((p) => { tally.setPatient(p); walk(p, both); });
  allPatients({ only: 'typical' }).forEach((p, i) => {
    tally.setPatient(p);
    const s = firstState(p);
    const result = view(p, s);
    if (!result.excluded) checkFour.visit({ patient: p, s, result, trail: [], first: result, quietSince: null });
    if (i % TYPICAL_STRIDE === 0) { sampled += 1; walk(p, checkOne); }
  });
}, 900_000);

describe('check 1: a dose given on the date the app advised is accepted', () => {
  it('no patient, grid or sampled typical, has advice the app then faults', () => {
    expect(sampled).toBe(5499);
    expect(show(tally.rows().filter((r) => r.check === 1))).toEqual([]);
  });
});

describe('check 7, forward half: a dated card still stands on its date', () => {
  it('no patient, grid or sampled typical, arrives on an advised date to find it moved or gone', () => {
    expect(show(tally.rows().filter((r) => r.check === 7))).toEqual([]);
  });
});

describe('check 4: alternative cards for one dose follow one wait', () => {
  it('no new disagreement, on any patient', () => {
    const allowed = new Set(['D3-ppsv23-held-5-years-after-thrown-out', 'R4-thrown-out-ppsv23-chip']);
    expect(show(tally.rows().filter((r) => r.check === 4 && !allowed.has(r.cause)))).toEqual([]);
    const r4 = tally.causes().find((c) => c.cause === 'R4-thrown-out-ppsv23-chip' && c.check === 4);
    expect({ grid: r4.grid, typical: r4.typical }).toEqual({ grid: 16, typical: 0 });
  });
});
