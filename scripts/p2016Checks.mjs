/**
 * C7 document 3 (immunize.org p2016) — the questions its reading raised.
 *
 * p2016's Table 4 splits almost every row by immunocompromising (IC) vs
 * non-immunocompromising (non-IC), and the two halves get DIFFERENT answers.
 * Footnote § says a non-IC child who has already had PPSV23 "is complete";
 * footnote || says an IC child in the same position still has two options --
 * PCV20 now, or a second PPSV23 at five years. So a card saying "complete"
 * has to be shown not to fire for IC children, or it is quoting a sentence
 * written about somebody else, and is also clinically short of the source.
 *
 *     npx vite-node scripts/p2016Checks.mjs
 */
import { buildCases } from '../src/test-grid.js';
import { recommend } from '../src/logic/recommend.js';

const IC = new Set(['asplenia', 'hiv']);           // Table 3's IC list, app ids
const COMPLETE = 'the paediatric high-risk series is complete';
const THREE_BY_24 = 'who had 3 PCV doses before 24 months';
const TOTAL = /(\d+) doses in total for this child/;

const buckets = {
  icCompleteNoPcv20: [],   // the suspected gap: footnote || should apply
  icCompleteWithPcv20: [], // genuinely complete under Table 4's "any risk" row
  totalsStated: new Map(), // stated series total -> card count
  threeBy24: [],
};

for (const c of buildCases()) {
  let r;
  try { r = recommend(c.input); } catch { continue; }
  if (r.excluded) continue;
  const risks = c.input.riskIds ?? [];
  const isIC = risks.some((id) => IC.has(id));
  const hasPcv20 = c.input.pcvDoses.some((d) => d.product === 'PCV20');
  const hasPcv21 = c.input.pcvDoses.some((d) => d.product === 'PCV21');
  const hist = {
    age: (c.input.ageMonths / 12).toFixed(2),
    risks: risks.join('+') || '(none)',
    pcv: c.input.pcvDoses.map((d) => `${d.product || '?'}@${d.date}`).join(',') || '(none)',
    ppsv: c.input.ppsv23Doses.map((d) => d.date).join(',') || '(none)',
    nPcv: c.input.pcvDoses.length,
  };

  for (const rec of r.recs ?? []) {
    const text = typeof rec.note === 'string'
      ? rec.note
      : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' ');
    if (!text) continue;

    if (isIC && text.includes(COMPLETE)) {
      (hasPcv20 || hasPcv21 ? buckets.icCompleteWithPcv20 : buckets.icCompleteNoPcv20).push(hist);
    }
    if (text.includes(THREE_BY_24)) buckets.threeBy24.push(hist);
    const m = text.match(TOTAL);
    if (m) buckets.totalsStated.set(m[1], (buckets.totalsStated.get(m[1]) ?? 0) + 1);
  }
}

const show = (title, rows, n = 4) => {
  console.log(`\n${'='.repeat(78)}\n${title}  —  ${rows.length} cards\n${'='.repeat(78)}`);
  rows.slice(0, n).forEach((h, i) => {
    console.log(`${i + 1}. age ${h.age}y  risks=${h.risks}  (${h.nPcv} PCV on record)`);
    console.log(`   PCV:    ${h.pcv}`);
    console.log(`   PPSV23: ${h.ppsv}`);
  });
  if (rows.length > n) console.log(`   ... and ${rows.length - n} more`);
};

show('GAP? IC child, completed PCV before 6, PPSV23 given, NO PCV20 — told COMPLETE',
  buckets.icCompleteNoPcv20);
show('OK: same but a PCV20/PCV21 is on record (Table 4 "any risk" row => complete)',
  buckets.icCompleteWithPcv20);
show('"3 PCV doses before 24 months" (p2016\'s row says all before 12 months)',
  buckets.threeBy24);

console.log(`\n${'='.repeat(78)}\nSeries totals the infant catch-up cards state\n${'='.repeat(78)}`);
for (const [n, count] of [...buckets.totalsStated.entries()].sort()) {
  const inP2016 = Number(n) <= 4;
  console.log(`  "${n} doses in total": ${count} cards   ${inP2016 ? '(p2016 Table 1 has this)' : '<-- p2016 Table 1 tops out at 4'}`);
}
