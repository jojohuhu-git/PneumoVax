import { describe, it, expect } from 'vitest';
import { REFS } from '../refs.js';

describe('refs.js citation URLs', () => {
  // This file used to hold a second test, asserting that `p3086Table5`
  // pointed at p3086.pdf rather than p2016.pdf — a 2026-09-13 fix to a
  // genuinely wrong citation link. The `p3086Table5` entry was deleted on
  // 2026-10-16: the transplant tick became a hard stop, the app stopped
  // stating a post-transplant schedule, and so it stopped citing one. The
  // deleted entry and the schedule it supported are recorded in
  // docs/archive/retired-2026-10-16-post-transplant-pneumococcal-schedules.md.
  //
  // The p2016 assertion below is the half that still has a live subject. Its
  // label used to claim "Tables 1-5"; the live document has only Tables 1-4.
  it('p2016 label does not overclaim Table 5 coverage', () => {
    expect(REFS.p2016.label).not.toMatch(/Tables? 1[-–]5/);
  });
});
