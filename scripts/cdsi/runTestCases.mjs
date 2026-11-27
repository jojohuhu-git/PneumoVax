// ─────────────────────────────────────────────────────────────────────────
// runTestCases.mjs — print CDC's CDSI pneumococcal test patients run through
// PneumoVax, patient by patient. The patients, the code mapping and the list
// of named disagreements (KNOWN) live in cdsiTestPatients.mjs, which the
// required test src/logic/__tests__/cdsi-test-patients.test.js also reads.
//
// Run:  npx vite-node scripts/cdsi/runTestCases.mjs            (summary + every disagreement)
//       npx vite-node scripts/cdsi/runTestCases.mjs --all      (every patient)
//       npx vite-node scripts/cdsi/runTestCases.mjs --json out.json
// ─────────────────────────────────────────────────────────────────────────
import { writeFileSync } from 'node:fs';
import { KNOWN, familyOf, differs, runAll } from './cdsiTestPatients.mjs';

const results = runAll();
const args = process.argv.slice(2);
const showAll = args.includes('--all');
const jsonAt = args.indexOf('--json');
if (jsonAt >= 0) writeFileSync(args[jsonAt + 1], JSON.stringify(results, null, 1) + '\n');

const print = (x) => {
  console.log(`\n${x.id} [${x.source}] ${x.name}`);
  console.log(`  born ${x.dob}, assessed ${x.today} (${x.ageToday}); risks: ${x.risks.join('; ') || 'none'} → ${x.riskIds.join(', ') || 'none'}${x.unmapped.length ? '  ⚠ no box: ' + x.unmapped.join('; ') : ''}`);
  for (const d of x.doses) console.log(`  ${d.agree ? '  ' : '✗ '}dose ${d.n} ${d.product} ${d.date} (${d.age}): CDSI ${d.cdsi} | app ${d.app}${!d.agree && d.appReason ? ' — ' + d.appReason.slice(0, 160) : ''}`);
  console.log(`  CDSI: ${x.cdsi.state}${x.cdsi.state === 'not complete' ? ` — dose ${x.cdsi.forecastNum}, earliest ${x.cdsi.earliest}, recommended ${x.cdsi.recommended}, past due ${x.cdsi.pastDue}` : ''}`);
  console.log(`  app : ${x.app.state}${x.app.date ? ' — next ' + x.app.date : ''}`);
  for (const card of x.app.cards) console.log(`        ${card}`);
  console.log(`  → doses ${x.dosesAgree ? 'AGREE' : 'DIFFERENT'}; next step ${x.forecast}`);
  const fam = familyOf(x.id);
  if (!x.dosesAgree || !x.forecast.startsWith('AGREE')) console.log(`  → ${fam.length ? 'known: ' + fam.join(' + ') : '⚠ NEW — not in the known list'}`);
};
for (const x of results) if (showAll || differs(x)) print(x);

const count = (f) => results.filter(f).length;
const allDoses = results.flatMap((x) => x.doses);
console.log('\n══ SUMMARY ══');
console.log(`patients ${results.length}: both agree ${count((x) => x.dosesAgree && x.forecast.startsWith('AGREE'))}`);
console.log(`doses ${allDoses.length}: agree ${allDoses.filter((d) => d.agree).length}, differ ${allDoses.filter((d) => !d.agree).length}`);
const tally = {};
for (const x of results) tally[x.forecast] = (tally[x.forecast] ?? 0) + 1;
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`next step — ${k}: ${v}`);
console.log('\nby family (a patient can sit in two):');
for (const [f, ids] of Object.entries(KNOWN)) {
  const hit = results.filter((x) => ids.includes(x.id) && differs(x)).length;
  console.log(`  ${hit}/${ids.length}  ${f}`);
}
const fresh = results.filter((x) => differs(x) && familyOf(x.id).length === 0);
const healed = Object.values(KNOWN).flat().filter((id) => { const x = results.find((y) => y.id === id); return x && !differs(x); });
console.log(`NEW disagreements (not in the known list): ${fresh.length}${fresh.length ? ' — ' + fresh.map((x) => x.id).join(', ') : ''}`);
console.log(`listed as known but now agreeing (remove from the list): ${healed.length}${healed.length ? ' — ' + [...new Set(healed)].join(', ') : ''}`);
const um = results.filter((x) => x.unmapped.length);
console.log(`patients with a CDC code the app has no box for: ${um.length}${um.length ? ' (' + um.map((x) => x.id).join(', ') + ')' : ''}`);
