// Every distinct sentence that shows WITHOUT a click (note.lead) on any card,
// templated, with counts and the style-rule problems a machine can see.
//   node scripts/wordingAudit/leadSentences.mjs <out.json>
import { writeFileSync } from 'node:fs';
import { recommend } from '../../src/logic/recommend.js';
import { sentencesOf } from '../../src/logic/noteFold.js';
import { buildCases, buildRecordProblemCases, buildTypicalCases } from '../../src/test-grid.js';
import { tmpl } from './whySentences.mjs';

export const LEAD_RULES = [
  ['talks about the document', /\brows?\b|\bworded\b|\bfootnote\b|\bprints?\b|\bCDC's\b|\bACIP's\b/i],
  ['semicolon', /;/],
  ['arguing', /either way|does not change/i],
  ['"~"', /~/],
  ['UK spelling', /paediatric|neighbour/i],
  ['capitals for emphasis', /\b(?!PCV|PPSV|CDC|ACIP|CSF|HIV|AAP|MMWR|US\b)[A-Z]{3,}\b/],
];
export function leadSentences() {
  const m = new Map();
  for (const cases of [buildCases(), buildRecordProblemCases(), buildTypicalCases()]) {
    for (const c of cases) {
      for (const rec of recommend(c.input).recs ?? []) {
        const lead = rec.note && typeof rec.note === 'object' ? rec.note.lead : rec.note;
        if (!lead) continue;
        for (const s of sentencesOf(lead)) {
          const t = tmpl(s);
          const k = `${rec.status}\t${t}`;
          const e = m.get(k) ?? { status: rec.status, t, n: 0, eg: c.key, problems: [] };
          e.n += 1; m.set(k, e);
        }
      }
    }
  }
  const out = [...m.values()];
  for (const e of out) {
    for (const [why, re] of LEAD_RULES) if (re.test(e.t)) e.problems.push(why);
    if ((e.t.match(/—/g) ?? []).length > 1) e.problems.push('more than one dash');
  }
  return out.sort((a, b) => b.n - a.n);
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const out = leadSentences();
  writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
  const bad = out.filter((e) => e.problems.length);
  console.log(`distinct lead sentences ${out.length}; with a problem ${bad.length}`);
}
