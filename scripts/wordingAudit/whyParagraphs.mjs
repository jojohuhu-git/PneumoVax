// Inventory every rec card's "Why this" paragraph (note.detail) over the three
// test sets, as templates (dates, ages and counts replaced), with counts.
//   node scripts/wordingAudit/whyParagraphs.mjs <out.json>
import { writeFileSync } from 'node:fs';
import { recommend } from '../../src/logic/recommend.js';
import { buildCases, buildRecordProblemCases, buildTypicalCases } from '../../src/test-grid.js';

const tmpl = (s) => s
  .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}, \d{4}\b/g, '<date>')
  .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '<date>')
  .replace(/\b\d+(\.\d+)?\b/g, '<n>');
const words = (s) => s.replace(/\[c\]/g, '').replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length;
const DOC = /\b(row|rows|table|footnote|CDC's|ACIP's|p2016|job aid|the (notes?|document|page|schedule) (says|reads|prints|states)|prints|states that|reads ")/i;

const m = new Map();
const sets = [['grid', buildCases()], ['impossible', buildRecordProblemCases()], ['typical', buildTypicalCases()]];
for (const [set, cases] of sets) {
  for (const c of cases) {
    const r = recommend(c.input);
    for (const rec of r.recs ?? []) {
      const d = typeof rec.note === 'object' && rec.note ? rec.note.detail : null;
      if (!d) continue;
      const t = tmpl(d);
      const e = m.get(t) ?? { template: t, example: d, exampleKey: `${set}:${c.key}`, status: rec.status, vaccine: rec.vaccine, cards: 0, sets: {} };
      e.cards += 1; e.sets[set] = (e.sets[set] ?? 0) + 1;
      m.set(t, e);
    }
  }
}
const out = [...m.values()].map((e) => ({ ...e, words: words(e.example), aboutDocument: DOC.test(e.template) }))
  .sort((a, b) => b.cards - a.cards);
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`distinct ${out.length}; cards ${out.reduce((a, e) => a + e.cards, 0)}; >60 words ${out.filter((e) => e.words > 60).length}; about-document ${out.filter((e) => e.aboutDocument).length}`);
