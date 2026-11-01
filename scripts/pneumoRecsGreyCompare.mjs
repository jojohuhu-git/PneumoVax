// ─────────────────────────────────────────────────────────────────────────
// pneumoRecsGreyCompare.mjs — PneumoVax next to CDC PneumoRecs for the
// 2026-11-01 grey-zone patients (pneumoRecsGreyCases.mjs). Read-only; not part
// of `npm test`. Same resolver and renderer as pneumoRecsCompareAll.mjs.
//   node scripts/pneumoRecsGreyCompare.mjs [G01 G02 …] [--json out.json]
// ─────────────────────────────────────────────────────────────────────────
import { writeFileSync } from 'node:fs';
import { recommend } from '../src/logic/recommend.js';
import { ALL, TODAY } from './pneumoRecsGreyCases.mjs';
import { pneumoRecsAnswer } from './pneumoRecsAnswer.mjs';
import { render } from './pneumoRecsCompareAll.mjs';

const args = process.argv.slice(2);
const ji = args.indexOf('--json');
const ids = args.filter((a) => /^G\d+$/.test(a));
const cases = ALL.filter((c) => (ids.length ? ids.includes(c.id) : true));
const out = [];
console.log(`PneumoVax vs CDC PneumoRecs — grey-zone patients, both answered for ${TODAY}; ${cases.length} patients\n`);
for (const c of cases) {
  const pr = pneumoRecsAnswer(c, TODAY);
  const r = recommend({ dob: c.dob, riskIds: c.riskIds, pcvDoses: c.pcvDoses, ppsv23Doses: c.ppsv23Doses, today: TODAY });
  const pv = render(r);
  const cdc = (pr.answer || '(no branch)').split('Footnotes')[0].replace(/\s+/g, ' ').trim();
  out.push({ ...c, cdcBand: pr.band, cdcQuestions: pr.questions, cdc, cdcAlsoFits: pr.alsoFits, cdcUnresolved: pr.unresolvedIds, pneumovax: pv,
    refs: (r.recs ?? []).map((x) => (x.citations ?? []).map((k) => k.key ?? k).join(',')) });
  console.log('━'.repeat(100));
  console.log(`${c.id}  [${c.family}]  ${c.label}`);
  console.log(`     born ${c.dob} · risks: ${c.riskIds.join(', ') || 'none'} · PCV: ${c.pcvDoses.map((x) => x.product + ' ' + x.date).join(', ') || 'none'} · PPSV23: ${c.ppsv23Doses.map((x) => x.date).join(', ') || 'none'}`);
  console.log(`  PneumoRecs [${pr.band}]:`);
  for (const q of pr.questions) console.log('      · ' + q);
  if (pr.unresolvedIds.length) console.log('      ! unresolved: ' + pr.unresolvedIds.join(', '));
  console.log('   → ' + cdc);
  console.log('  PneumoVax:');
  for (const line of pv) console.log('      ' + line);
}
if (ji >= 0) writeFileSync(args[ji + 1], JSON.stringify(out, null, 2));
