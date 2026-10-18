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
  // ⚠ THE ASSERTION BELOW USED TO SAY THE OPPOSITE, and it was wrong.
  //
  // It read `expect(REFS.p2016.label).not.toMatch(/Tables? 1[-–]5/)`, under a
  // comment saying "the live document has only Tables 1-4". Fetched live on
  // 2026-10-18 (HTTP 200, 211,252 bytes, "Item #P2016 (2/16/2024)") and read
  // with scripts/pdfLayout.py, p2016 contains FIVE tables; Table 5 is printed
  // at the foot of page 2. The item date is EARLIER than the 2026-09-13 check
  // that produced this test, so the document did not change — the check did
  // not see the whole page. A test can enshrine a false fact just as firmly as
  // it can guard a true one.
  //
  // ⚠ NOTHING HERE LOOSENS THE TRANSPLANT HARD STOP. Naming Table 5 in a
  // LABEL is not citing its schedule, and the app states no post-transplant
  // schedule at all: ticking the transplant box stops the engine (OWNER
  // DECISION 2026-10-16), guarded by
  // regression-2026-10-16-transplant-stop-mirrors-meningovax.test.js. The
  // second assertion below says that in test form, so a future reader cannot
  // mistake an accurate label for a re-opened pathway.
  it('p2016 label names all five tables the live document contains', () => {
    expect(REFS.p2016.label).toMatch(/Tables? 1[-–]5/);
  });

  it('no refs entry cites a post-transplant schedule', () => {
    const transplantish = Object.entries(REFS)
      .filter(([, r]) => /transplant|HSCT|hematopoietic/i.test(`${r.label} ${r.quote ?? ''}`))
      .map(([k]) => k);
    expect(transplantish, 'the transplant pathway is a hard stop and cites nothing').toEqual([]);
  });
});
