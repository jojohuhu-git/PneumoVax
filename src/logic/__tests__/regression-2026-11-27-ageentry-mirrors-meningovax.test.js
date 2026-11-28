// PNEUMO-AGEENTRY-GUARD (2026-11-27) — `ageEntry.js` is the same code in both apps.
//
// ── Why ──────────────────────────────────────────────────────────────────
//
// `ageEntry.js` decides which ages the Age step refuses (a date of birth in
// the future, a patient over 120, Months above 11) and words the message the
// clinician sees. The owner asked for those messages to read the same in both
// apps (E2, 2026-11-26: "Both apps"), and MeningoVax's Phase 9 measured the
// two copies equal on 2026-11-27, comments aside.
//
// Nothing checked it. The em-dash clean-up (#164) shows how it drifts: it
// changed this file's messages here, and a folder still on an older branch
// kept the old wording — a hand-kept mirror only stays a mirror while someone
// remembers it is one.
//
// ── What it compares ─────────────────────────────────────────────────────
//
// Code only, comments stripped — the same rule as the `dateUtils.js` guard
// (`regression-s6-4-…`). The two files' opening comments tell each app's own
// history (P3-8 here, P0-1 there) and are allowed to differ; every line of
// code, every message included, must match.
//
// It is SKIPPED, and shows as skipped, when the MeningoVax folder is not on
// this computer: CI clones only this repo. So a local run is what catches
// drift.
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const MENINGO_AGEENTRY = '/Users/joannehuang/Downloads/MeningoVax-main/src/logic/ageEntry.js';
const MINE = new URL('../ageEntry.js', import.meta.url);

/** The file with its comments removed, so the comparison sees real code only. */
function codeLines(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s+\/\/.*$/gm, '')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter(Boolean);
}

describe('PNEUMO-AGEENTRY-GUARD: ageEntry.js matches MeningoVax', () => {
  it.skipIf(!existsSync(MENINGO_AGEENTRY))(
    "is MeningoVax's copy line for line, comments aside",
    () => {
      const mine = codeLines(readFileSync(MINE, 'utf8'));
      const theirs = codeLines(readFileSync(MENINGO_AGEENTRY, 'utf8'));
      expect(mine.length).toBeGreaterThan(30); // not vacuous
      expect(mine).toEqual(theirs);
    },
  );

  // The comparison must still see the messages: a stripper that ate string
  // contents would let the wording drift with this test green.
  it('the code it compares includes every message the clinician can see', () => {
    const code = codeLines(readFileSync(MINE, 'utf8')).join('\n');
    for (const words of [
      'That date of birth is in the future.',
      'That date of birth cannot be read.',
      'Years cannot be a negative number.',
      'Months cannot be a negative number.',
      'For a whole year or more, use the Years box.',
      'Check the Years box.',
    ]) {
      expect(code).toContain(words);
    }
  });
});
