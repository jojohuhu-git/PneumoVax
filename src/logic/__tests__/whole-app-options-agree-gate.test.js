// ── Whole-app rule checks, check 4: the options agree (P0-1, 2026-11-05) ──
//
// When the app offers two vaccines for one dose, both must follow the same wait.
// This check found Noor (`regression-2026-11-05-r1-second-ppsv23-waits-eight-
// weeks.test.js`): PCV20 said Nov 22, the 2nd PPSV23 beside it said "due today",
// and a PPSV23 given that day was thrown out. It joined the required tests the
// day that fix landed, as the report's gate table says.
//
// What it covers, in about 2 minutes of one core:
//   • the 17,016 grid patients, each followed forward through the advice;
//   • the first screen of the 60,480 typical patients. They are not followed
//     forward here, because that alone takes over 3 minutes. That is where most
//     of Noor's fault lived, and it shows on the first screen.
// `npm run checks` still does the whole thing by hand, before a release.
//
// Two things are allowed, by name, and nothing else:
//   • D3, the owner's ruling: a PPSV23 held 5 years after a thrown-out one;
//   • R4, a thrown-out childhood PPSV23. Pinned at exactly 16 patients, because
//     it is a known open item (fix queue P2-5), so it cannot quietly grow.
import { describe, it, expect } from 'vitest';
import { allPatients, firstState, view, walk } from '../../../scripts/wholeApp/replay.mjs';
import { newTally, replayChecks } from '../../../scripts/wholeApp/checks.mjs';

describe('check 4: alternative cards for one dose follow one wait', () => {
  it('no new disagreement, on any patient', () => {
    const tally = newTally();
    const visitor = replayChecks(tally, new Set([4]));
    for (const p of allPatients()) {
      tally.setPatient(p);
      if (p.group === 'grid') walk(p, visitor);
      else {
        const s = firstState(p);
        const result = view(p, s);
        if (!result.excluded) visitor.visit({ patient: p, s, result, trail: [], first: result, quietSince: null });
      }
    }
    const rows = tally.rows();
    const allowed = new Set(['D3-ppsv23-held-5-years-after-thrown-out', 'R4-thrown-out-ppsv23-chip']);
    expect(rows.filter((r) => !allowed.has(r.cause)).map((r) => `${r.cause} — ${r.kind} — ${r.group}`)).toEqual([]);

    const r4 = tally.causes().find((c) => c.cause === 'R4-thrown-out-ppsv23-chip' && c.check === 4);
    expect({ grid: r4.grid, typical: r4.typical }).toEqual({ grid: 16, typical: 0 });
  }, 900_000);
});
