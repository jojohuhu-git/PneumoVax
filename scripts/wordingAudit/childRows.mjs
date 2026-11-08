// Audit 3(b), children 2-18: each claim in the Rulebook's CHILD_LANES, checked over every child.
import { allPatients } from '../../scripts/wholeApp/replay.mjs';
import { recommend } from '../../src/logic/recommend.js';
import { RISK_FACTORS } from '../../src/data/riskFactors.js';
import { CHILD_LANES } from '../../src/data/rulebook.js';
import { addCalendarMonths, addDays } from '../../src/logic/dateUtils.js';
import { writeFileSync } from 'node:fs';

const cls = Object.fromEntries(RISK_FACTORS.map((r) => [r.id, r.exclude ? 'exclude' : r.adultOnly ? 'adultOnly' : r.class]));
const riskOf = (ids) => {
  const c = ids.map((i) => cls[i]);
  if (c.includes('exclude')) return 'exclude';
  if (c.includes('IC')) return 'IC';
  if (c.includes('special')) return 'special';
  if (c.includes('nonIC')) return 'chronic';
  return 'healthy'; // adult-only ticks count as healthy for a child
};
const code = (b) => String(b).split(' ')[0];
const NOTHING = new Set(['complete', 'no-dose-now', 'not-indicated']);
const t = new Map();
const add = (k, e) => { const x = t.get(k) ?? { n: 0, grid: 0, typical: 0, e }; x.n++; x[e.group]++; t.set(k, x); };
const monthsBetween = (a, b) => { const [y1, m1, d1] = a.split('-').map(Number); const [y2, m2, d2] = b.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0); };

console.log('Rulebook child lanes:', CHILD_LANES.map((l) => l.group).join(' | '));
let n = 0;
for (const p of allPatients()) {
  const { input } = p;
  const ageM = monthsBetween(input.dob, input.today);
  if (ageM < 24 || ageM >= 228) continue;
  const risk = riskOf(input.riskIds);
  if (risk === 'exclude') continue;
  n++;
  const r = recommend(input);
  const counted = (s) => (r.orderedDoses?.[s] ?? []).filter((d, i) => ['valid', 'unknown'].includes(r.perDose[s][i]?.status));
  const pcv = counted('pcv'), ppsv = counted('ppsv23');
  if ([...pcv, ...ppsv].some((d) => !d.date)) continue; // undated: out of scope
  const at = (d) => monthsBetween(input.dob, d);
  const hasPcv20 = pcv.some((d) => d.product === 'PCV20');
  const lastPcv = pcv.map((d) => d.date).sort().at(-1);
  const firstPpsv = ppsv.map((d) => d.date).sort()[0];
  const anyPcvBefore6 = pcv.some((d) => at(d.date) < 72);
  const cards = (r.recs ?? []).filter((c) => !c.advisory);
  const doseCards = cards.filter((c) => !NOTHING.has(c.status));
  const offers = (c) => (c.brands ?? []).map(code);
  const dateOf = (c) => (c.dueToday ? input.today : c.earliestNextDate);
  const leadAll = cards.map((c) => `${c.doseLabel} ${typeof c.note === 'string' ? c.note : `${c.note?.lead ?? ''} ${c.note?.detail ?? ''}`}`).join(' ');
  const ageBand = ageM < 60 ? '2-4' : ageM < 72 ? '5' : '6-18';
  const ex = { key: p.key, group: p.group, input, cards: cards.map((c) => `${c.status} | ${c.doseLabel} | ${offers(c).join('/')} | ${dateOf(c) ?? ''}`) };
  const sig = `${risk} ${ageBand}`;
  const flag = (claim, what) => add(`${claim} | ${sig} | ${what}`, ex);

  // Healthy lane
  if (risk === 'healthy') {
    if (ageM >= 60) {
      if (doseCards.length) flag('H1 "From 5 years: no catch-up; not indicated"', `card gives ${doseCards.map((c) => offers(c).join('/')).join(' + ')}`);
      const says50 = /age 50|at 50\b|turns 50/.test(leadAll);
      // Rulebook: "Re-evaluate at 50 years, unless a PCV20 has been given."
      if (says50 && hasPcv20) flag('H2 "Re-evaluate at 50, unless a PCV20 has been given"', 'says 50 though a PCV20 counted');
      if (!says50 && !hasPcv20) flag('H2 "Re-evaluate at 50, unless a PCV20 has been given"', `no age-50 line, no PCV20 (history: ${pcv.map((d) => d.product).join(',') || 'no PCV'}${ppsv.length ? ' + PPSV23' : ''})`);
    } else {
      if (doseCards.length > 1) flag('H3 "1 catch-up PCV dose"', `${doseCards.length} dose cards`);
      for (const c of doseCards) {
        if (offers(c).some((b) => b === 'PPSV23')) flag('H3 "1 catch-up PCV dose"', 'offers PPSV23');
        if (lastPcv && dateOf(c) < addDays(lastPcv, 56)) flag('H3 "≥8 weeks after the last dose"', 'date earlier than last PCV + 8 weeks');
      }
    }
    continue;
  }

  // At-risk lanes
  const nonIC = risk !== 'IC';
  const ppsvCards = doseCards.filter((c) => offers(c).includes('PPSV23'));
  const pcvOnlyCards = doseCards.filter((c) => !offers(c).includes('PPSV23'));
  for (const c of ppsvCards) {
    if (hasPcv20 && !ppsv.length) flag('R1 "Not needed if the series included PCV20"', `PPSV23 offered after a counted PCV20 (${c.doseLabel})`);
    if (lastPcv && dateOf(c) < addDays(lastPcv, 56) && !c.dueToday) flag('R2 "≥8 weeks after last PCV"', `PPSV23 card dated before last PCV + 8 weeks (${c.doseLabel})`);
    if (nonIC && ppsv.length) flag('R3 non-IC: one PPSV23 only ("only if step 2 was PPSV23" is IC-only)', `2nd PPSV23 offered (${c.doseLabel})`);
    if (!nonIC && ppsv.length && dateOf(c) < addCalendarMonths(firstPpsv, 60)) flag('R4 IC: "≥5 years after PPSV23"', `dated before first PPSV23 + 5 years (${c.doseLabel})`);
  }
  if (!nonIC && ppsv.length && !hasPcv20) {
    for (const c of doseCards) if (offers(c).includes('PCV20') && dateOf(c) < addCalendarMonths(firstPpsv, 60) && !/catch-up|dose \d of/.test(c.doseLabel)) flag('R4 IC: "≥5 years after PPSV23"', `PCV20 dated before first PPSV23 + 5 years (${c.doseLabel})`);
  }
  if (nonIC && ppsv.length && pcv.length) {
    const asks = doseCards.filter((c) => !/catch-up|dose \d of/i.test(c.doseLabel));
    if (asks.length) flag('R5 chronic lane: PPSV23 given → Complete', `still asks: ${asks.map((c) => c.doseLabel).join(' + ')}`);
  }
  if (nonIC && hasPcv20 && !doseCards.some((c) => /catch-up|dose \d of/i.test(c.doseLabel)) && doseCards.length) flag('R6 chronic lane: PCV20 in series → Complete', `still asks: ${doseCards.map((c) => c.doseLabel).join(' + ')}`);
  // "Complete" must rest on PCV20 or PPSV23 (Rulebook result column)
  if (!doseCards.length && cards.some((c) => c.status === 'complete') && !hasPcv20 && !ppsv.length) flag('R7 "Complete" only after step 2 (PCV20 or PPSV23)', `Complete with neither (history ${pcv.map((d) => d.product).join(',') || 'none'})`);
  if (!nonIC && !doseCards.length && cards.some((c) => c.status === 'complete') && !hasPcv20 && ppsv.length === 1) flag('R8 IC: step 3 after one PPSV23', 'Complete after one PPSV23, no PCV20');
  // 6-18 never had PCV: PCV20 or PCV15
  if (ageM >= 72 && !pcv.length && !ppsv.length) {
    const b = [...new Set(doseCards.flatMap(offers))].sort().join('/');
    if (b !== 'PCV15/PCV20') flag('R9 "6-18, never had a PCV: PCV20 or PCV15"', `offers ${b || 'nothing'}`);
  }
  // first PCV at 6 or older (not PCV20): step 2 PCV20 or PPSV23
  if (ageM >= 72 && pcv.length && !anyPcvBefore6 && !hasPcv20 && !ppsv.length && !pcv.some((d) => d.product === 'PCV15')) {
    const b = [...new Set(doseCards.flatMap(offers))].sort().join('/');
    if (b !== 'PCV20/PPSV23') flag('R10 "First PCV at 6 or older: start at step 2 (PCV20 or PPSV23)"', `offers ${b || 'nothing'}`);
  }
  for (const c of pcvOnlyCards) if (ageM < 72 && /catch-up/i.test(c.doseLabel) && lastPcv && dateOf(c) < addDays(lastPcv, 56)) flag('R11 at-risk catch-up "≥8 weeks apart"', `catch-up dated before last PCV + 8 weeks (${c.doseLabel})`);
}
console.log('children 2-18 checked:', n);
const rows = [...t].sort((a, b) => b[1].n - a[1].n);
writeFileSync((process.env.OUT_DIR ?? '/tmp') + '/child-out.json', JSON.stringify(rows, null, 1));
for (const [k, x] of rows) console.log(String(x.n).padStart(6), `(grid ${x.grid}, typ ${x.typical})`, k, '\n         e.g.', JSON.stringify(x.e).slice(0, 800));
