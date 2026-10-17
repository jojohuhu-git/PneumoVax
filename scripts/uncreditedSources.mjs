/**
 * List every (listed source, statement) pair the cards do NOT credit.
 *
 * Why this exists (C7/C8, 2026-10-17). `recommend.js` merges a fixed default
 * set of sources into every card of a pathway (`recommend.js:859` for adults;
 * `['cdcChildPneumo', 'p2016']` for children), so a card lists those documents
 * whether or not anything it says rests on them. That is the whole of the
 * owner's question "why there are multiple source chips listed if its only
 * citing one of them", and it is what C8 works through.
 *
 * The dedupe key here is cardSources()'s own key -- marker `c.page ?? c.key`,
 * button `ch.url` -- so this answers the same question the screen does rather
 * than a nearby one.
 *
 * Two normalisations matter, and getting either wrong changes the count by
 * orders of magnitude:
 *   - a note is either a plain string or a `{ lead, detail }` pair, and the
 *     card renders BOTH halves, so both belong to the statement;
 *   - interpolated calendar DATES are masked, and nothing else is. Every other
 *     number in a note (an interval, an age band, a dose count) is part of the
 *     clinical claim, so collapsing those would merge two different statements
 *     into one row.
 *
 * Verified 2026-10-17 against the figures in
 * `docs/archive/plan-2026-10-16-citations-which-chip-did-this-come-from.md`:
 * 16,202 cards, 68 pairs over 6 documents (p2016 8,678/34, Adult Timing Job
 * Aid 7,524/15, mm7401a1 7,479/13, Catch-up Job Aid 1,626/2, Child/Adolescent
 * Notes 712/3, Adult Notes 25/1).
 *
 *     npx vite-node scripts/uncreditedSources.mjs [document-substring]
 *
 * It needs vite-node (not plain node) because `citations.jsx` has to be
 * transformed. Pass a substring to print one document's statements only.
 */
import { buildCases } from '../src/test-grid.js';
import { recommend } from '../src/logic/recommend.js';
import { reasonCiteSlices, noteCiteSlices } from '../src/components/citations.jsx';

const filter = process.argv[2] ?? '';
const byDoc = new Map();     // document short -> Map(statement -> { cards, status })
let cards = 0;

for (const c of buildCases()) {
  let result;
  try {
    result = recommend(c.input);
  } catch {
    continue;
  }
  if (result.excluded) continue;

  for (const rec of result.recs ?? []) {
    cards++;

    // Every document a raised number on this card points at.
    const cited = new Set();
    const seed = (validations) => {
      for (const v of validations ?? []) {
        for (const slice of reasonCiteSlices(v?.reasons, v?.reasonCites)) {
          for (const x of slice) cited.add(x.page ?? x.key);
        }
      }
    };
    seed(rec.doseValidations);
    seed(result.otherHistory?.doseValidations);
    const slices = noteCiteSlices(rec.note, rec.noteCites);
    for (const x of [...slices.lead, ...slices.detail]) cited.add(x.page ?? x.key);

    const noteText = typeof rec.note === 'string'
      ? rec.note
      : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' ');
    const statement = (noteText || `(no note; status=${rec.status}; ${rec.doseLabel})`)
      .replace(/\d{4}-\d{2}-\d{2}/g, '<date>');

    // Every grey button no number points at.
    for (const chip of rec.citations ?? []) {
      if (cited.has(chip.url)) continue;
      const doc = chip.short || chip.label;
      if (!byDoc.has(doc)) byDoc.set(doc, new Map());
      const statements = byDoc.get(doc);
      if (!statements.has(statement)) {
        statements.set(statement, { cards: 0, status: new Set() });
      }
      const entry = statements.get(statement);
      entry.cards++;
      entry.status.add(rec.status);
    }
  }
}

const instances = (m) => [...m.values()].reduce((sum, e) => sum + e.cards, 0);
console.log(`cards produced: ${cards}`);
let pairs = 0;
for (const [doc, statements] of [...byDoc.entries()].sort((a, b) => instances(b[1]) - instances(a[1]))) {
  pairs += statements.size;
  if (filter && !doc.toLowerCase().includes(filter.toLowerCase())) continue;
  console.log(`\n${'='.repeat(78)}`);
  console.log(`${doc}  —  ${instances(statements)} card instances, ${statements.size} distinct statements`);
  console.log('='.repeat(78));
  [...statements.entries()]
    .sort((a, b) => b[1].cards - a[1].cards)
    .forEach(([statement, e], i) => {
      console.log(`\n[#${i + 1}] ${e.cards} cards | status: ${[...e.status].join(',')}`);
      console.log(`  ${statement}`);
    });
}
console.log(`\nTOTAL distinct (source, statement) pairs: ${pairs}`);
