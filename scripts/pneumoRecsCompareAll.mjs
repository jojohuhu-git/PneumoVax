// ─────────────────────────────────────────────────────────────────────────
// pneumoRecsCompareAll.mjs — PneumoVax's answer next to CDC PneumoRecs
// VaxAdvisor's, for the same patient, on the same day (2026-10-25).
//
// NOT part of the app build and NOT part of `npm test`.
//   node scripts/pneumoRecsCompareAll.mjs              all 66 patients
//   node scripts/pneumoRecsCompareAll.mjs I01 A10      named patients
//   node scripts/pneumoRecsCompareAll.mjs --group infant
//
// PneumoVax's column is a real run of `recommend()`. PneumoRecs' column is
// resolved from its own shipped decision table — see pneumoRecsAnswer.mjs
// for how, and scripts/pneumorecs/live-captures-2026-10-25.json for the
// seven patients driven by hand through the live site to check it (7 of 7).
// ─────────────────────────────────────────────────────────────────────────
import { recommend } from '../src/logic/recommend.js';
import { ALL, TODAY } from './pneumoRecsCases.mjs';
import { pneumoRecsAnswer } from './pneumoRecsAnswer.mjs';

export function render(r) {
  if (r.excluded) return ['HARD STOP: ' + (r.exclusionMessage ?? '').replace(/\s+/g, ' ').trim()];
  const out = (r.recs ?? []).map((rec) => {
    const n = rec.note;
    const note = typeof n === 'string' ? n : n ? `${n.lead ?? ''} ${n.detail ?? ''}` : '';
    const mi = rec.minIntervalDays ? ` [min ${rec.minIntervalDays}d]` : rec.minIntervalMonths ? ` [min ${rec.minIntervalMonths}mo]` : '';
    const due = rec.dueToday ? ' [due today]' : rec.earliestNextDate ? ` [from ${rec.earliestNextDate}]` : '';
    return `${rec.vaccine} · ${rec.status}${mi}${due} — ${rec.doseLabel ?? ''}`
      + (note ? `\n        note: ${note.replace(/\s+/g, ' ').trim()}` : '');
  });
  if (!out.length) out.push('(no recommendation)');
  const flags = [];
  for (const [vax, list] of [['PCV', r.perDose?.pcv ?? []], ['PPSV23', r.perDose?.ppsv23 ?? []]]) {
    list.forEach((d, i) => {
      if (d.status === 'valid' || d.status === 'counted') return;
      flags.push(`${vax} dose ${i + 1}: ${d.status} — ${(d.reasons ?? []).join(' ')}`.replace(/\s+/g, ' ').trim());
    });
  }
  return out.concat(flags.map((f) => 'RECORDED DOSE → ' + f));
}

export function answerFor(c) {
  return recommend({ dob: c.dob, riskIds: c.riskIds, pcvDoses: c.pcvDoses, ppsv23Doses: c.ppsv23Doses, today: TODAY });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const gi = args.indexOf('--group');
  const group = gi >= 0 ? args[gi + 1] : null;
  const ids = args.filter((a) => /^[A-Z]\d+$/.test(a));
  const cases = ALL.filter((c) => (ids.length ? ids.includes(c.id) : true) && (group ? c.group === group : true));
  console.log(`PneumoVax vs CDC PneumoRecs VaxAdvisor — both answered for ${TODAY}; ${cases.length} patients\n`);
  for (const c of cases) {
    const pr = pneumoRecsAnswer(c, TODAY);
    console.log('━'.repeat(100));
    console.log(`${c.id}  ${c.label}`);
    console.log(`     born ${c.dob} · PCV: ${c.pcvDoses.map((d) => d.product + ' ' + d.date).join(', ') || 'none'} · PPSV23: ${c.ppsv23Doses.map((d) => d.date).join(', ') || 'none'}`);
    console.log(`  PneumoRecs [${pr.band}] was asked:`);
    for (const q of pr.questions) console.log('      · ' + q);
    console.log('   → ' + (pr.answer || '(no branch)').split('Footnotes')[0].replace(/\s+/g, ' ').trim());
    console.log('  PneumoVax:');
    for (const line of render(answerFor(c))) console.log('      ' + line);
  }
}
