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
  immPCV7Page:
    'C3 (2026-10-17). The WHOLE-PAGE entry for the immunize.org PCV7 page that '
    + '`immPCV7` quotes one sentence of. It is named by no source file because '
    + 'nothing names it by KEY: `documentRefFor()` finds it by URL, which is how '
    + 'a card turns a cited sentence into the grey button for its document. So '
    + 'this is a reachable entry the regex cannot see, not a lost citation.\n'
    + 'Deleting it is NOT silently safe, which is what this allowlist must never '
    + 'be used to hide: `regression-c2-c3-numbered-sources.test.jsx` asserts every '
    + 'document the app cites has exactly one whole-page entry, and fails naming '
    + 'this URL if it goes. Proved by deleting the entry on 2026-10-17: 4 tests '
    + 'fail across 2 files — 3 in that file (the PCV7 button, the whole-page '
    + 'totality property, and the all-cards sweep) and this file\'s own '
    + '"allowlist does not outlive its entries".',
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
  mmwr7203a1:
    'ACIP adult pneumococcal recommendations (2023), Kobayashi et al. Uncited '
    + 'since N5 (OWNER DECISION 2026-10-16, option A) and deliberately kept. '
    + 'TWO separate claims rested on it and both have moved on:\n'
    + '  • The adult PCV15->PPSV23 INTERVAL. S15 (2026-10-16) replaced it with '
    + 'mm7401a1 and the CDC Adult Timing Job Aid. CLAUDE.md: "rr7203a1 is '
    + 'superseded. Never cite it for an adult interval again."\n'
    + '  • The adult RISK-FACTOR LIST. Four risk conditions (asplenia, '
    + 'immunosuppression, alcohol use disorder, cigarette smoking) listed it '
    + 'while the other thirteen listed no MMWR at all, so the sources at the '
    + 'foot of an adult card changed with which box was ticked — the 2023 '
    + 'paper appeared for a smoker and not for HIV. Not wrong, just '
    + 'inconsistent: the CDC Adult Notes (already cited on every adult card) '
    + 'enumerate all four by name, read live 2026-10-16, and mm7401a1 prints '
    + 'the same list and says the 19-49 risk recommendations "have not changed '
    + 'from previous recommendations". The owner chose to drop the link.\n'
    + 'Kept as the primary-source record: it is the document the adult risk '
    + 'list came from, and mm7401a1 points back to it.\n'
    + 'RE-OPENED AND CLOSED AGAIN (OWNER DECISION 2026-10-29). On 2026-10-26 she '
    + 'said "I do want to add the MMWR pneumococcal 19 and older 2023 document to '
    + 'cite." Putting it on a card means choosing which of the two claims above it '
    + 'carries; an interval answer would also reverse her 2026-10-16 decision and '
    + 'rewrite CLAUDE.md. Shown that, she chose on 2026-10-29: leave it off for '
    + 'now, given the amount of work it takes. So this page stays uncited and the '
    + 'question is SETTLED — do not re-raise it. If it is ever revisited, the claim '
    + 'it carries is the first thing to decide.',
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
