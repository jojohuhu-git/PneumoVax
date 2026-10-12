// P2-8 (2026-10-12) — the citation ORPHAN tripwire.
//
// Ported from the second half of MeningoVax's `citation-integrity.test.js`
// (its L2-3). PneumoVax already had the DANGLING half — a rec citing a key
// that no longer exists — covered by `regression-p6-3b-note-cite-parity.js`'s
// "every citation resolves to a real reference". This is the other direction:
// an entry sitting in refs.js that NOTHING in the app names.
//
// Why that matters here, concretely. An orphan is one of two things, and both
// are worth knowing:
//   • a rule that LOST its citation — the rule still runs, the clinician just
//     stops being shown what it rests on; or
//   • a source left behind by a rule that was removed, which then goes on
//     being re-verified by the freshness tripwire forever, for nothing.
//
// ── Why this is a STATIC check, not a sweep ──────────────────────────────
//
// The obvious design is to run the engine over `test-grid.js` and collect the
// citations it emits. That was tried first and it is the WRONG test: it
// cannot tell "no rule names this source" from "a rule names it but no grid
// patient reaches that rule". `pedsNoPcv20IfComplete` is the proof — it is
// cited twice in recommend.js and emitted by NONE of the 16,250 grid cases,
// so a sweep-based version reported it as an orphan when it is nothing of the
// sort. Naming a key in source is the thing being asserted, so the check reads
// the source.
import { describe, it, expect } from 'vitest';
import { REFS } from '../refs.js';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Entries deliberately kept in refs.js although nothing names them today.
// Every line is a reason, checked against the code on 2026-10-12 — not a
// place to park a finding to avoid dealing with it. Deleting a key from this
// list without wiring the citation up will fail the suite, which is the point.
const KNOWN_UNCITED = {
  // `pedsMinAge` and `immPCV7` were both listed here until P6-3c wired them
  // (2026-10-12). They are deliberately NOT replaced with a softer excuse:
  // they are now cited on the per-dose verdicts in validate.js, so if either
  // key stops appearing in src/ this test will fail, which is the point.
  cdcPneumoIndex:
    'CDC\'s pneumococcal landing page. Kept as the general "where this all comes '
    + 'from" pointer; every specific rule cites the schedule notes or an MMWR '
    + 'instead, deliberately (one source per rule).',
  immPneumo:
    'immunize.org Ask the Experts topic index — the landing page above immPCV7. '
    + 'Same reason as cdcPneumoIndex: a pointer, not a rule source.',
  mmwr7239a5:
    'ACIP PCV20-in-children MMWR (2023). The paediatric PCV20 rules it introduced '
    + 'are cited to the CDC child schedule notes, which restate them and are the '
    + 'page a clinician can actually navigate. Kept as the primary-source record.',
  mmwr7137a3:
    'ACIP PCV15-in-adults MMWR (2022). Superseded for citation purposes by '
    + 'mmwr7203a1 (the 2023 adult recommendations), which IS cited. Kept as the '
    + 'primary-source record of where PCV15 came from.',
};

const SRC = resolve(process.cwd(), 'src');

function sourceFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      // Tests may name a key for any reason; they are not the app citing it.
      if (entry !== '__tests__' && entry !== '__corpus__') sourceFiles(p, out);
    } else if (/\.(js|jsx)$/.test(entry) && !p.endsWith(join('data', 'refs.js'))) {
      out.push(p);
    }
  }
  return out;
}

const FILES = sourceFiles(SRC);
const BLOB = FILES.map((f) => readFileSync(f, 'utf8')).join('\n');
const namedInSource = (key) => new RegExp(`['"\`]${key}['"\`]`).test(BLOB);

describe('P2-8: no citation sits in refs.js with nothing naming it', () => {
  it('reads a real set of source files (anti-vacuity)', () => {
    // If the walk ever returns nothing, every key is "unreferenced" and the
    // allowlist check below inverts into nonsense.
    expect(FILES.length).toBeGreaterThan(15);
    expect(BLOB.length).toBeGreaterThan(50000);
    // Positive control: a key that IS cited must be found by the matcher.
    expect(namedInSource('adultPcv20or21Complete')).toBe(true);
    // Negative control: a key that does not exist must not be.
    expect(namedInSource('thisKeyDoesNotExist')).toBe(false);
  });

  it('every reference is named by the app, or listed with a reason', () => {
    const orphans = Object.keys(REFS)
      .filter((k) => !namedInSource(k))
      .filter((k) => !(k in KNOWN_UNCITED));
    expect(
      orphans,
      `These entries in refs.js are named by no source file: ${orphans.join(', ')}.\n`
      + 'Either a rule lost its citation (wire it back up), or the rule was removed '
      + '(delete the entry). If it is deliberately kept, add it to KNOWN_UNCITED in '
      + 'this file WITH THE REASON — an unexplained entry there is how a lost citation '
      + 'becomes permanent.'
    ).toEqual([]);
  });

  it('the allowlist does not outlive its entries', () => {
    // The other direction: a key wired up later, or deleted, must not leave a
    // stale excuse behind pretending to explain something.
    const stale = Object.keys(KNOWN_UNCITED)
      .filter((k) => !(k in REFS) || namedInSource(k));
    expect(
      stale,
      `These keys are on the KNOWN_UNCITED allowlist but no longer need to be `
      + `(they are now cited, or no longer exist): ${stale.join(', ')}. Remove them.`
    ).toEqual([]);
  });

  it('every allowlist entry carries an actual reason', () => {
    const empty = Object.entries(KNOWN_UNCITED)
      .filter(([, why]) => typeof why !== 'string' || why.trim().length < 40)
      .map(([k]) => k);
    expect(
      empty,
      `These allowlist entries have no usable reason: ${empty.join(', ')}. `
      + 'A bare key is an unexplained exception.'
    ).toEqual([]);
  });
});
