// cdsiCompare.mjs — print PneumoVax's ages and gaps against CDC's CDSI rule
// file. Every CDSI number is READ from the file (cdsiRuleComparison.mjs, which
// the required test src/logic/__tests__/cdsi-rule-comparison.test.js also
// reads); until 2026-11-27 they were copied in by hand.
//
// Run:  npx vite-node scripts/cdsi/cdsiCompare.mjs
//       npx vite-node scripts/cdsi/cdsiCompare.mjs --save-facts   (after reading a new
//         release's notes: re-save cdc-files/pneumo-cdsi-rules.json, the copy the test
//         compares CDC's file against)
import { writeFileSync } from 'node:fs';
import { allComparisons, DIFFERENCES, NOT_COMPARED, CDSI_FACT_COUNT } from './cdsiRuleComparison.mjs';
import { CDSI_VERSION, readCdsiFacts, SAVED_FACTS_FILE } from './cdsiRules.mjs';

if (process.argv.includes('--save-facts')) {
  const facts = Object.fromEntries([...readCdsiFacts().values()].map((f) => [f.key, f.value]));
  writeFileSync(SAVED_FACTS_FILE, JSON.stringify({ version: CDSI_VERSION, saved: new Date().toISOString().slice(0, 10), facts }, null, 1) + '\n');
  console.log(`saved ${Object.keys(facts).length} rules to ${SAVED_FACTS_FILE}`);
}

const rows = allComparisons();
console.log(`CDSI ${CDSI_VERSION}: ${CDSI_FACT_COUNT()} rules read from the pneumococcal file\n`);
for (const r of rows) {
  const d = DIFFERENCES[r.id];
  const verdict = r.agree ? 'AGREE' : d ? `DIFFERENT (${d.status})` : 'DIFFERENT — NOT NAMED';
  console.log(`${verdict.padEnd(24)} | ${r.id} | ${r.what}\n${''.padEnd(24)} |   CDSI: ${r.cdsi}\n${''.padEnd(24)} |   app : ${r.app}`);
  if (d && !r.agree) console.log(`${''.padEnd(24)} |   why : ${d.reason}`);
}
const n = (f) => rows.filter(f).length;
console.log(`\nAGREE ${n((r) => r.agree)}  DIFFERENT, named ${n((r) => !r.agree && DIFFERENCES[r.id])}  DIFFERENT, NOT NAMED ${n((r) => !r.agree && !DIFFERENCES[r.id])}  of ${rows.length}`);
console.log(`\nNot compared (${NOT_COMPARED.length}):`);
for (const x of NOT_COMPARED) console.log(`  - ${x.what}: ${x.why}`);
