#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// proseDiff.mjs — dump and diff every rendered sentence a clinician reads,
// across both of `test-grid.js`'s corpora.
//
//   node scripts/proseDiff.mjs dump <outfile>
//   node scripts/proseDiff.mjs diff <before-file> <after-file>
//
// ── Why this exists ──────────────────────────────────────────────────────
//
// `verdict-corpus.tsv` / `record-problem-corpus.tsv` (built from
// `test-grid.js`, gated by `sweep-verdict-corpus.test.js` and
// `sweep-record-problem-corpus.test.js`) deliberately hold no prose — see
// `test-grid.js`'s "Why there is no prose in a verdict". That is right for
// what they guard (a patient's DECISION should not turn red on a copy edit),
// but it means a wording change can break hundreds of cards while both
// sweeps, and every other test, stay green — exactly what happened to S15
// (843 cases read broken wording with the full suite green; see
// `docs/agent/testing.md`'s and `CLAUDE.md`'s "Verdict corpora do not record
// prose").
//
// Two sessions (S6-interval-prose, S15) each independently wrote a throwaway
// version of this in the scratchpad, because nothing in the repo did it.
// This is that tool, made permanent, so a third session does not have to.
//
// ── What counts as "rendered prose" ──────────────────────────────────────
//
// Everything a clinician actually reads on a card or a recorded dose:
//   • per rec card: vaccine, doseLabel, note (lead + detail if an object),
//     and every citation LABEL (not URL — a URL changing is not a wording
//     change a clinician would notice) from `citations` and `noteCites`.
//   • per recorded dose: status, detail, every reason sentence, and every
//     `why` sentence behind the chip's "Why this" disclosure.
//   • the hard-stop exclusion message, when excluded — which since
//     2026-10-16 is what a transplant patient gets. This file used to also
//     render that patient's post-transplant advisory block (its title, its
//     coordinate-care flag and its own rec cards); the app no longer has one.
//   • the PCV21 geographic advisory note, when present.
//
// Deliberately NOT included: dueToday, earliestNextDate, seriesTotal,
// minIntervalDays/Months, brands — those are exactly what the verdict
// corpora already guard, and duplicating them here would make a changed
// DECISION show up as "just wording" noise in this tool's output.
//
// ── How to use it ─────────────────────────────────────────────────────────
//
//   node scripts/proseDiff.mjs dump /tmp/prose-before.tsv
//   ... make the wording change ...
//   node scripts/proseDiff.mjs dump /tmp/prose-after.tsv
//   node scripts/proseDiff.mjs diff /tmp/prose-before.tsv /tmp/prose-after.tsv
//
// `diff` prints how many lines changed/added/removed and a sample — the
// number that belongs in the pull request beside the verdict-corpus moved
// count, same as S15's "300 of 34,710 lines changed (140 real patients, 160
// impossible entries), every one classified and none unexplained."
import { writeFileSync, readFileSync } from 'node:fs';
import { recommend } from '../src/logic/recommend.js';
import { buildCases, buildRecordProblemCases } from '../src/test-grid.js';

/**
 * Every citation label AND every chip NAME a card/dose shows, sorted,
 * deduplicated.
 *
 * 2026-10-22: `short` was added. This function recorded only `label` — the
 * hover text and the quoted sentence — and never the few words actually
 * PRINTED on the grey button. So renaming a chip changed the visible text of
 * 4,183 cards and this tool reported zero changes, which is the same shape of
 * blind spot as the verdict corpora holding no prose at all (see the header
 * above, and S15's 843 cards that read broken wording with a green suite).
 * A chip name is the shortest piece of prose on the card and the one a
 * clinician reads first when deciding whether to trust the advice.
 */
function citationLabels(...citationArrays) {
  const labels = new Set();
  for (const arr of citationArrays) {
    for (const c of arr ?? []) {
      if (c?.label) labels.add(c.label);
      if (c?.short) labels.add(`chip:${c.short}`);
    }
  }
  return [...labels].sort().join(' | ');
}

/** One rec card's prose, as a single pipe-joined field. */
function recProse(rec) {
  const note = typeof rec.note === 'string'
    ? rec.note
    : rec.note
      ? `${rec.note.lead ?? ''} ¶ ${rec.note.detail ?? ''}`
      : '';
  return [
    rec.vaccine,
    rec.doseLabel ?? '',
    note,
    citationLabels(rec.citations, rec.noteCites),
  ].join('¦');
}

/** One recorded dose's prose. */
function doseProse(d) {
  return [
    d.status,
    d.detail ?? '',
    (d.reasons ?? []).join(' / '),
    // `whys` — the sentences behind the chip's "Why this" disclosure, added
    // 2026-10-24. They are PROSE A CLINICIAN READS, one click away, and
    // nothing else sweeps them: the corpora hold verdicts, and a reader who
    // never opens the disclosure cannot see a wrong sentence in it. That is
    // the "verdict corpora do not record prose" lesson applied to a channel
    // the moment it was created, rather than after it drifted.
    (d.whys ?? []).join(' / '),
  ].join('¦');
}

/** The complete rendered text of one case's answer, one line, tab-free. */
export function proseOf(input) {
  const r = recommend(input);
  if (r.excluded) return `EXCLUDED¦${r.exclusionMessage ?? ''}¦${citationLabels(r.exclusionCitations)}`;

  const parts = [
    `R=[${(r.recs ?? []).map(recProse).join(';;')}]`,
    `PCV=[${(r.perDose?.pcv ?? []).map(doseProse).join(';;')}]`,
    `S23=[${(r.perDose?.ppsv23 ?? []).map(doseProse).join(';;')}]`,
  ];
  if (r.pcv21Geo) parts.push(`GEO=[${r.pcv21Geo.note ?? ''}]`);
  return parts.join(' ').replace(/\t/g, ' ').replace(/\n/g, ' ');
}

function allLines() {
  const real = buildCases().map((c) => `${c.key}\t${proseOf(c.input)}`);
  const impossible = buildRecordProblemCases().map((c) => `${c.key}\t${proseOf(c.input)}`);
  // Prefixed so a key collision between the two grids (there is none today,
  // but nothing enforces it) can never silently overwrite one case with the
  // other's text in the diff map.
  return [
    ...real.map((l) => `real:${l}`),
    ...impossible.map((l) => `impossible:${l}`),
  ].sort();
}

function asMap(lines) {
  return new Map(lines.map((l) => {
    const i = l.indexOf('\t');
    return [l.slice(0, i), l.slice(i + 1)];
  }));
}

function cmdDump(outPath) {
  if (!outPath) {
    console.error('Usage: node scripts/proseDiff.mjs dump <outfile>');
    process.exit(1);
  }
  process.stdout.write('Rendering prose over both grids (real patients + impossible entries)... ');
  const lines = allLines();
  writeFileSync(outPath, `${lines.join('\n')}\n`);
  console.log(`${lines.length} lines written to ${outPath}.`);
}

function cmdDiff(beforePath, afterPath) {
  if (!beforePath || !afterPath) {
    console.error('Usage: node scripts/proseDiff.mjs diff <before-file> <after-file>');
    process.exit(1);
  }
  const before = asMap(readFileSync(beforePath, 'utf8').split('\n').filter(Boolean));
  const after = asMap(readFileSync(afterPath, 'utf8').split('\n').filter(Boolean));

  const changed = [];
  const added = [];
  for (const [k, v] of after) {
    if (!before.has(k)) added.push(k);
    else if (before.get(k) !== v) changed.push(k);
  }
  const removed = [...before.keys()].filter((k) => !after.has(k));

  const realChanged = changed.filter((k) => k.startsWith('real:')).length;
  const impossibleChanged = changed.filter((k) => k.startsWith('impossible:')).length;

  console.log(`${changed.length} of ${before.size} lines changed `
    + `(${realChanged} real patients, ${impossibleChanged} impossible entries), `
    + `${added.length} added, ${removed.length} removed.`);

  if (changed.length) {
    console.log('\nSample (up to 8):');
    for (const k of changed.slice(0, 8)) {
      console.log(`\n  ${k}`);
      console.log(`    was: ${before.get(k)}`);
      console.log(`    now: ${after.get(k)}`);
    }
    if (changed.length > 8) console.log(`\n  ... and ${changed.length - 8} more.`);
  }
}

// Gated the same way `hsctCases.mjs` was fixed in P2-13 (that file is gone
// now, deleted with the advisory it exercised): `proseOf` is
// exported for a smoke test to import, and importing this file must not
// also run the CLI dispatch below (an un-gated `process.exit(1)` on an
// unrecognised/empty argv would take the whole test runner down with it).
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , cmd, a, b] = process.argv;
  if (cmd === 'dump') cmdDump(a);
  else if (cmd === 'diff') cmdDiff(a, b);
  else {
    console.error('Usage:\n'
      + '  node scripts/proseDiff.mjs dump <outfile>\n'
      + '  node scripts/proseDiff.mjs diff <before-file> <after-file>');
    process.exit(1);
  }
}
