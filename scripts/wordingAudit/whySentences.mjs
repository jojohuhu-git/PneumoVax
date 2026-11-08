// Every distinct sentence behind a rec card's "Why this", templated, with counts.
//   node scripts/wordingAudit/whySentences.mjs <out.json>
import { writeFileSync } from 'node:fs';
import { recommend } from '../../src/logic/recommend.js';
import { sentencesOf } from '../../src/logic/noteFold.js';
import { buildCases, buildRecordProblemCases, buildTypicalCases } from '../../src/test-grid.js';

export const tmpl = (s) => s
  .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}, \d{4}\b/g, '<date>')
  .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '<date>');
export function whySentences() {
  const m = new Map();
  for (const cases of [buildCases(), buildRecordProblemCases(), buildTypicalCases()]) {
    for (const c of cases) {
      for (const rec of recommend(c.input).recs ?? []) {
        const d = rec.note && typeof rec.note === 'object' ? rec.note.detail : null;
        if (!d) continue;
        for (const s of sentencesOf(d)) {
          const t = tmpl(s);
          const e = m.get(t) ?? { t, n: 0 };
          e.n += 1; m.set(t, e);
        }
      }
    }
  }
  return [...m.values()].sort((a, b) => b.n - a.n);
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const out = whySentences();
  writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
  console.log(`distinct sentences ${out.length}`);
}
