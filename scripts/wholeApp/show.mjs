#!/usr/bin/env node
// show.mjs — print every screen along one road, for reading a flag by hand.
//   node scripts/wholeApp/show.mjs '<patient key>' ['PCV15 2026-10-11 → PPSV23 2026-10-13']
// The key is the one run.mjs prints. The road is the `road` text of a flag.
import { allPatients, firstState, give, noteText, view } from './replay.mjs';

const [, , key, roadText] = process.argv;
const patient = allPatients().find((p) => p.key === key);
if (!patient) { console.error('No such patient key.'); process.exit(1); }

function screen(s) {
  const r = view(patient, s);
  console.log(`\n── ${s.today} (age ${r.meta?.ageMonths} months) ──`);
  console.log(`   PCV:    ${s.pcv.map((d) => `${d.product || '?'} ${d.date}`).join(', ') || 'none'}`);
  console.log(`   PPSV23: ${s.ppsv.map((d) => d.date).join(', ') || 'none'}`);
  for (const c of r.recs ?? []) {
    console.log(`   CARD [${c.status}] ${c.doseLabel} | ${c.dueToday ? 'DUE TODAY' : c.earliestNextDate ?? 'no date'} | ${(c.brands ?? []).join(', ')}`);
    console.log(`        ${noteText(c)}`);
  }
  for (const stream of ['pcv', 'ppsv23']) {
    (r.perDose?.[stream] ?? []).forEach((d, i) => {
      const o = r.orderedDoses[stream][i];
      console.log(`   CHIP ${o.product || '?'} ${o.date}: ${d.status}${d.extraDose ? ' extra' : ''}${d.earlyAdvisory ? ' early' : ''} ${d.intervalRuleId ?? ''} ${d.repeatDueDate ? `repeat ${d.repeatDueDate}` : ''} | ${(d.reasons ?? []).join(' ')}`);
    });
  }
  return r;
}

console.log(`Patient ${key}: born ${patient.input.dob}, ${patient.input.riskIds.join(', ') || 'no risk condition'}`);
let s = firstState(patient);
screen(s);
for (const step of (roadText ?? '').split('→').map((x) => x.trim()).filter(Boolean)) {
  const [product, date] = step.split(' ');
  if (date !== s.today) { s = { ...s, today: date }; screen(s); }
  s = give(s, product, date);
  console.log(`\n>>> given: ${product} on ${date}`);
  screen(s);
}
