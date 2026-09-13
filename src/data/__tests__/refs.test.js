import { describe, it, expect } from 'vitest';
import { REFS } from '../refs.js';

describe('refs.js citation URLs', () => {
  // 2026-09-13 finding: this citation used to point to immunize.org's
  // p2016.pdf, which (verified live) is a 2-page document containing only
  // Tables 1-4 (routine pneumococcal schedules) — no Table 5, no HSCT
  // content at all. The actual Table 5 ("Recommended schedule for
  // administering pneumococcal conjugate vaccine to any child younger than
  // age 19 years following a hematopoietic stem cell transplant (HSCT)")
  // lives in immunize.org's p3086.pdf ("Standing Orders for Administering
  // Pneumococcal Vaccines to Children and Teens"), page 4 of 5, and its
  // text matches this app's hardcoded HSCT advisory note verbatim. The
  // clinical content was always correct; only the citation link was wrong.
  it('p3086Table5 points to p3086.pdf (the document that actually contains Table 5)', () => {
    expect(REFS.p3086Table5.url).toMatch(/p3086\.pdf$/);
  });

  // Companion fix: p2016's label used to claim "Tables 1-5", but the live
  // document only has Tables 1-4 (Table 5 lives in p3086.pdf, above).
  it('p2016 label does not overclaim Table 5 coverage', () => {
    expect(REFS.p2016.label).not.toMatch(/Tables? 1[-–]5/);
  });
});
