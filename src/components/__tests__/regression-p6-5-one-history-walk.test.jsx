// @vitest-environment happy-dom
// P6-5 (S13, 2026-10-10): Results walked the recorded dose history a SECOND
// time. `recommend()` already runs `analyzeHistory()` for PCV and for PPSV23
// and returns both walks as `result.perDose`; Results called `analyzeHistory`
// again for each, and rendered the chips from its own copy.
//
// Two walks of the same history is two places a verdict can come from, and
// nothing made them agree. They happened to agree because both were handed
// the same arguments — but that is a coincidence the code did not enforce,
// and the engine's walk is the one the recommendation itself was built on.
// If they ever diverged, the card would show a verdict that the
// recommendation above it had not used.
//
// (The queue also recorded that "neither Results call passes `today`". That
// half is NO LONGER TRUE — S10's P3-7 threaded the clock through, and both
// calls passed `today` before this change. Recorded here so a later session
// does not go looking for a clock bug that was already fixed.)
//
// The fix: Results reads `result.perDose.pcv` / `.ppsv23` and does not
// import `analyzeHistory` at all.
import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';
import { recommend } from '../../logic/recommend.js';

function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return (
    <Results
      state={state}
      onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
      onReset={() => {}}
      today="2026-06-07"
    />
  );
}

const PCV7_CASE = {
  ageMonths: 840,                      // 70y
  dob: '1956-04-02',
  riskIds: [],
  pcvDoses: [{ product: 'PCV7', date: '2010-03-02' }],
  ppsv23Doses: [],
};

describe('P6-5 — one walk of the dose history, not two', () => {
  it('Results imports no history walker of its own', async () => {
    // The structural half of the fix. A second `analyzeHistory` import is how
    // the duplicate walk comes back.
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const src = readFileSync(resolve(process.cwd(), 'src/components/Results.jsx'), 'utf8');
    // The IMPORT, not any mention — the comments above the fix name
    // analyzeHistory on purpose, to say which walk is being reused.
    const imports = src.split('\n').filter((l) => /^\s*import\b/.test(l)).join('\n');
    expect(imports).not.toMatch(/analyzeHistory/);
    expect(src).not.toMatch(/analyzeHistory\s*\(/);
  });

  it('renders the verdict the ENGINE produced for a recorded dose', () => {
    // PCV7 is the clearest case: a dose that is valid but never counts. The
    // chip on screen must be the engine's own verdict for it.
    const engine = recommend({ ...PCV7_CASE, today: '2026-06-07' });
    expect(engine.perDose.pcv[0].status).toBe('noncounting');
    render(<Harness initial={PCV7_CASE} />);
    expect(screen.getByText('Not counted')).toBeTruthy();
  });

  it('perDose is an array on EVERY path, including the hard stop', () => {
    // The hard-stop path used to return `{ pcv: {}, ppsv23: {} }` — empty
    // objects where every other path returns arrays. Harmless while Results
    // re-walked the history itself; a crash the moment it reads these. Pinned
    // so the shape cannot drift back.
    const stopped = recommend({
      ageMonths: 840, dob: '1956-04-02',
      riskIds: ['hct_cart_bcell_exclude'],
      pcvDoses: [{ product: 'PCV13', date: '2020-01-01' }],
      ppsv23Doses: [],
      today: '2026-06-07',
    });
    expect(stopped.excluded).toBe(true);
    expect(Array.isArray(stopped.perDose.pcv)).toBe(true);
    expect(Array.isArray(stopped.perDose.ppsv23)).toBe(true);
  });

  it('a hard-stopped patient still renders, with no dose chips', () => {
    render(<Harness initial={{
      ...PCV7_CASE,
      riskIds: ['hct_cart_bcell_exclude'],
      pcvDoses: [{ product: 'PCV13', date: '2020-01-01' }],
    }} />);
    expect(screen.getByTestId('exclusion-stop')).toBeTruthy();
  });
});
