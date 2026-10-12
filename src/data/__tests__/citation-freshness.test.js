// P2-8 (2026-10-12) — the citation freshness tripwire.
//
// Ported from MeningoVax's `citation-freshness.test.js` (its L2-2), which
// exists because that repo's docs sat a guideline behind on the healthy MenB
// interval after ACIP changed it, and nothing said so.
//
// `refs.js` has recorded a `lastVerified` date for some of its sources since
// September, and until this test NOTHING IN `src/` READ IT. A source could go
// a year stale and the suite stayed green. 17 of the 40 entries had no date at
// all — including every CDC schedule-notes page, every MMWR, p2016, p3086 and
// the Fred Hutch LTFU guidelines, i.e. the documents the whole app rests on.
//
// No test can tell you CDC has changed its mind. What this one does is refuse
// to let a citation sit unread for more than a year, so the re-read is
// scheduled by the suite instead of by memory.
//
// The first thing it caught, on the pass that created it: CDC had MOVED
// `cdcAlteredImmunocompetence` from /acip-recs/general-recs/ to
// /imz-best-practices/. The old URL still worked — through a redirect — so
// nothing was broken and nothing would ever have reported it, which is
// precisely the kind of quiet rot a date forces someone to look at.
//
// NOTE ON THE CLOCK. PneumoVax does not pin a global test clock today, so the
// guard below is not yet load-bearing. It is ported NOW, before P2-1 pins one,
// because the moment a suite-wide fake clock lands this tripwire would be
// measuring staleness against a date that never moves — it would stop
// measuring anything and still pass. This is the one test in the repo that
// must read the REAL calendar, via `vi.getRealSystemTime()`.
import { describe, it, expect, vi } from 'vitest';
import { REFS } from '../refs.js';

const MAX_AGE_MONTHS = 12;

// The date this tripwire was written. If the real clock ever reads earlier
// than this, something is faking it.
const PORTED_ON = '2026-10-12';

function realToday() {
  const d = new Date(vi.getRealSystemTime());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthsSince(iso, todayISO) {
  const [y1, m1, d1] = iso.split('-').map(Number);
  const [y2, m2, d2] = todayISO.split('-').map(Number);
  let months = (y2 - y1) * 12 + (m2 - m1);
  if (d2 < d1) months -= 1;
  return months;
}

describe('P2-8: every citation has been verified recently', () => {
  it('the pinned test clock does not silently freeze this tripwire', () => {
    // THE GUARD ON THE GUARD. If this fails, someone has faked the real-time
    // getter too and the staleness check below has quietly stopped measuring.
    // Do not "fix" it by moving PORTED_ON forward — find out what pinned the
    // real clock.
    expect(
      realToday() >= PORTED_ON,
      `The real system clock reads ${realToday()}, which is before this test was `
      + `written (${PORTED_ON}). Something has faked vi.getRealSystemTime(), so the `
      + '12-month staleness check below is no longer measuring anything.'
    ).toBe(true);
  });

  it('every citation records the date it was last confirmed live', () => {
    const missing = Object.entries(REFS)
      .filter(([, c]) => !/^\d{4}-\d{2}-\d{2}$/.test(c.lastVerified || ''))
      .map(([key]) => key);
    expect(
      missing,
      `These citations have no usable lastVerified date: ${missing.join(', ')}. `
      + 'Every entry in refs.js needs the date it was last read live, as YYYY-MM-DD. '
      + 'See the header of refs.js for what that date attests to — it means something '
      + 'different for a quoted sentence than for a whole-document chip.'
    ).toEqual([]);
  });

  it('every citation records a real calendar date', () => {
    const impossible = Object.entries(REFS)
      .filter(([, c]) => {
        const iso = c.lastVerified || '';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false; // the test above owns these
        const [y, m, d] = iso.split('-').map(Number);
        const parsed = new Date(Date.UTC(y, m - 1, d));
        return parsed.getUTCFullYear() !== y
          || parsed.getUTCMonth() !== m - 1
          || parsed.getUTCDate() !== d;
      })
      .map(([key, c]) => `${key} (${c.lastVerified})`);
    expect(
      impossible,
      `These lastVerified dates are not real dates — check for a typo: ${impossible.join(', ')}.`
    ).toEqual([]);
  });

  it('no citation is dated in the future', () => {
    // A typo'd year is the easy way to switch this tripwire off for a decade.
    const today = realToday();
    const ahead = Object.entries(REFS)
      .filter(([, c]) => /^\d{4}-\d{2}-\d{2}$/.test(c.lastVerified || '') && c.lastVerified > today)
      .map(([key, c]) => `${key} (${c.lastVerified})`);
    expect(
      ahead,
      'These citations claim to have been verified in the future, which cannot be true '
      + `(today is ${today}): ${ahead.join(', ')}. A future date disables the staleness `
      + 'check for as long as it stays in the future.'
    ).toEqual([]);
  });

  it('no citation has gone more than 12 months without being re-read', () => {
    const today = realToday();
    const stale = Object.entries(REFS)
      .map(([key, c]) => ({ key, date: c.lastVerified, age: monthsSince(c.lastVerified, today) }))
      .filter((c) => c.age > MAX_AGE_MONTHS)
      .sort((a, b) => b.age - a.age);

    const report = stale
      .map((c) => `  ${c.key} — last read ${c.date}, ${c.age} months ago (${REFS[c.key].short})`)
      .join('\n');

    expect(
      stale,
      'These sources have not been confirmed live in over a year, so the rules built on '
      + 'them may no longer match what the source says:\n' + report
      + '\n\nOpen each page. For a quoted citation, check the quoted sentence is still '
      + 'there and still says that; for a whole-document citation, check the document '
      + 'still resolves at that exact URL and is still what the label claims. Then update '
      + 'its lastVerified date in src/data/refs.js. If the source has CHANGED, that is a '
      + 'clinical change — follow the verify-clinical-source procedure, do not just move '
      + 'the date.'
    ).toEqual([]);
  });

  it('the tripwire is actually watching every reference, not a subset', () => {
    // Anti-vacuity. If REFS is ever restructured and this test starts reading
    // an empty or tiny object, every check above passes for free.
    const n = Object.keys(REFS).length;
    expect(n).toBeGreaterThanOrEqual(40);
    expect(Object.values(REFS).every((r) => typeof r.url === 'string' && r.url)).toBe(true);
  });
});
