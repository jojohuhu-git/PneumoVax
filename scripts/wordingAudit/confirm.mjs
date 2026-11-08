import { allPatients } from '../../scripts/wholeApp/replay.mjs';
import { recommend } from '../../src/logic/recommend.js';
import { RISK_FACTORS } from '../../src/data/riskFactors.js';
import { addCalendarMonths } from '../../src/logic/dateUtils.js';
const adultOnly = new Set(RISK_FACTORS.filter((r) => r.adultOnly).map((r) => r.id));
const childRisk = new Set(RISK_FACTORS.filter((r) => !r.adultOnly && !r.exclude).map((r) => r.id));
const IC = new Set(RISK_FACTORS.filter((r) => r.class === 'IC' && !r.exclude).map((r) => r.id));
const mb = (a, b) => { const [y1, m1, d1] = a.split('-').map(Number); const [y2, m2, d2] = b.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0); };
const t = {}; const add = (k) => { t[k] = (t[k] ?? 0) + 1; };
for (const p of allPatients()) {
  const { input } = p; const age = mb(input.dob, input.today);
  if (age >= 228) continue;
  const r = recommend(input);
  const txt = (r.recs ?? []).map((c) => `${c.doseLabel} ${typeof c.note === 'string' ? c.note : `${c.note?.lead ?? ''} ${c.note?.detail ?? ''}`}`).join(' ');
  const counted = (s) => (r.orderedDoses?.[s] ?? []).filter((d, i) => ['valid', 'unknown'].includes(r.perDose[s][i]?.status));
  const healthy = !input.riskIds.some((i) => childRisk.has(i));
  const tickAdult = input.riskIds.some((i) => adultOnly.has(i));
  const allNothing = (r.recs ?? []).every((c) => ['complete', 'not-indicated', 'no-dose-now'].includes(c.status));
  if (healthy && tickAdult && age >= 60) add(`smoker/alcohol 5-18: ${/age 19/.test(txt) ? 'says 19' : 'NO 19'}${/age 50/.test(txt) ? ' + says 50' : ''}`);
  if (healthy && !tickAdult && age < 60 && allNothing && (r.recs ?? []).some((c) => c.status === 'complete')) add(`healthy under 5, complete card: ${/age 50/.test(txt) ? 'says 50' : 'no 50'} [${age < 24 ? 'baby' : 'toddler'}]`);
  if (input.riskIds.some((i) => IC.has(i)) && age >= 24 && allNothing) {
    const pc = counted('pcv'), pp = counted('ppsv23');
    if (pp.length === 1 && !pc.some((d) => d.product === 'PCV20')) {
      const five = addCalendarMonths(pp[0].date, 60), nineteen = addCalendarMonths(input.dob, 228);
      add(`IC complete after one PPSV23, no PCV20: 5-year date ${five >= nineteen ? 'at/after 19 (adult answers)' : 'BEFORE 19'}`);
    }
  }
}
console.log(t);
