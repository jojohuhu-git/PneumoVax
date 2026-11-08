// Audit 3(b): every adult card against the Rulebook's Adults table (rulebook.js ADULT_*).
// For each adult, classify history from the doses that COUNTED, find the Rulebook row,
// and check the card's products, status and date against that row's words.
import { allPatients } from '../../scripts/wholeApp/replay.mjs';
import { recommend } from '../../src/logic/recommend.js';
import { RISK_FACTORS } from '../../src/data/riskFactors.js';
import { addCalendarMonths, addDays } from '../../src/logic/dateUtils.js';
import { writeFileSync } from 'node:fs';

const cls = Object.fromEntries(RISK_FACTORS.map((r) => [r.id, r.exclude ? 'exclude' : r.class]));
const riskOf = (ids) => (ids.some((i) => cls[i] === 'exclude') ? 'exclude'
  : ids.some((i) => ['IC', 'special'].includes(cls[i])) ? 'ICS'
  : ids.length ? 'chronic' : 'none');
const code = (b) => String(b).split(' ')[0];
const NOTHING = new Set(['complete', 'no-dose-now', 'not-indicated']);

const t = new Map();
const add = (k, e) => { const x = t.get(k) ?? { n: 0, grid: 0, typical: 0, e }; x.n++; x[e.group]++; t.set(k, x); };

for (const p of allPatients()) {
  const { input } = p;
  const age = input.ageMonths ?? null;
  const r = recommend(input);
  const dob = input.dob;
  const ageM = (() => { const [y1, m1, d1] = dob.split('-').map(Number); const [y2, m2, d2] = input.today.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0); })();
  if (ageM < 228) continue;
  const risk = riskOf(input.riskIds);
  if (risk === 'exclude') continue;
  const band = ageM >= 600 ? '50+' : '19-49';
  const counted = (s) => (r.orderedDoses?.[s] ?? []).filter((d, i) => ['valid', 'unknown'].includes(r.perDose[s][i]?.status));
  const pcv = counted('pcv'), ppsv = counted('ppsv23');
  const prods = new Set(pcv.map((d) => d.product));
  const undated = [...pcv, ...ppsv].some((d) => !d.date);
  const invalidPpsv = (r.orderedDoses?.ppsv23 ?? []).filter((d, i) => r.perDose.ppsv23[i]?.status === 'invalid');
  let hist;
  if (prods.has('PCV20') || prods.has('PCV21')) hist = 'PCV20/21 given';
  else if (prods.has('PCV15') && ppsv.length) hist = 'PCV15 + PPSV23';
  else if (prods.has('PCV15') && prods.has('PCV13')) hist = 'PCV13 + PCV15 (no row)';
  else if (prods.has('PCV15') && invalidPpsv.length) hist = 'PCV15 + invalid PPSV23';
  else if (prods.has('PCV15')) hist = 'PCV15 only';
  else if (prods.has('PCV13') && ppsv.length) hist = `PCV13 + PPSV23 x${ppsv.length}`;
  else if (prods.has('PCV13')) hist = 'PCV13 only';
  else if (ppsv.length) hist = 'PPSV23 only';
  else if (prods.size) hist = `other: ${[...prods]}`;
  else hist = 'none';
  if (undated) hist += ' (undated dose)';

  const cards = (r.recs ?? []).filter((c) => !c.advisory);
  const doseCards = cards.filter((c) => !NOTHING.has(c.status));
  const statuses = [...new Set(cards.map((c) => c.status))].sort().join('+');
  const brands = [...new Set(doseCards.flatMap((c) => (c.brands ?? []).map(code)))].sort().join('/');
  const shown = doseCards.map((c) => (c.dueToday ? input.today : c.earliestNextDate)).filter(Boolean).sort()[0];
  const lastOf = (xs, prod) => xs.filter((d) => d.date && (!prod || d.product === prod)).map((d) => d.date).sort().at(-1);
  const lastAny = [lastOf(pcv), lastOf(ppsv)].filter(Boolean).sort().at(-1);
  const maxT = (d) => (d && d > input.today ? d : input.today);

  // Expected, from the Rulebook's own words (rulebook.js ADULT_BANDS / ADULT_OPTIONS / ADULT_HISTORY).
  const exp = (() => {
    const eligible = band === '50+' || risk !== 'none';
    if (!eligible) return { nothing: true, why: 'Risk condition required at 19-49' };
    switch (hist) {
      case 'none': return { brands: 'PCV15/PCV20/PCV21', date: input.today, why: 'No prior: PCV20/21, or PCV15 then PPSV23' };
      case 'PCV13 only': return { brands: 'PCV20/PCV21', date: maxT(addCalendarMonths(lastOf(pcv, 'PCV13'), 12)), why: 'PCV13 only: PCV20 or PCV21 >=1 year after PCV13' };
      case 'PPSV23 only': return { brands: 'PCV15/PCV20/PCV21', date: maxT(addCalendarMonths(lastOf(ppsv), 12)), why: 'PPSV23 only: PCV15/20/21 >=1y after last PPSV23' };
      case 'PCV15 only': {
        const wk8 = band === '19-49' && risk === 'ICS';
        return { brands: 'PPSV23', brandsAlso: 'PCV20/PCV21/PPSV23', date: maxT(wk8 ? addDays(lastOf(pcv, 'PCV15'), 56) : addCalendarMonths(lastOf(pcv, 'PCV15'), 12)), why: `PCV15 only: PPSV23 at ${wk8 ? '8 weeks' : '1 year'}` };
      }
      case 'PCV15 + invalid PPSV23': return { brands: 'PCV20/PCV21', date: maxT(addCalendarMonths(invalidPpsv.map((d) => d.date).sort().at(-1), 12)), why: 'PCV15 then invalid PPSV23: PCV20/21 >=1y after the PPSV23' };
      case 'PCV15 + PPSV23': case 'PCV20/21 given': return { nothing: true, status: 'complete', why: 'Complete' };
      default:
        if (hist.startsWith('PCV13 + PPSV23')) {
          const n = ppsv.length;
          if (band === '19-49' && risk === 'chronic') return { nothing: true, status: 'no-dose-now', why: 'Chronic 19-49: none now, review at 50' };
          return { brands: 'PCV20/PCV21', date: maxT(addCalendarMonths(lastAny, 60)), why: `PCV13+PPSV23 ${band} ${risk} x${n}: PCV20/21 >=5y after last dose` };
        }
        return null;
    }
  })();
  const sig = `${band} | ${risk} | ${hist}`;
  const ex = { key: p.key, group: p.group, input, statuses, brands, shown, labels: cards.map((c) => `${c.status}: ${c.doseLabel}`) };
  if (!exp) { add(`NO-ROW ${sig} -> ${statuses} [${brands}]`, ex); continue; }
  const probs = [];
  if (exp.nothing) {
    if (doseCards.length) probs.push(`gives a dose (${brands}) where the row says ${exp.why}`);
    else if (exp.status && !statuses.includes(exp.status)) probs.push(`status ${statuses}, row says ${exp.status}`);
  } else {
    if (!doseCards.length) probs.push(`gives no dose (${statuses}) where the row says ${exp.why}`);
    else {
      if (brands !== exp.brands && brands !== exp.brandsAlso) probs.push(`products ${brands}, row says ${exp.brands}`);
      if (shown !== exp.date) probs.push(`date ${shown} vs row ${exp.date} (${shown < exp.date ? 'EARLIER' : 'LATER'})`);
    }
  }
  if (probs.length) add(`MISMATCH ${sig} | ${probs.join(' ; ').replace(/\d{4}-\d{2}-\d{2}/g, 'D')}`, { ...ex, exp });
  else add(`ok ${sig}`, ex);
}
const rows = [...t].sort((a, b) => b[1].n - a[1].n);
writeFileSync((process.env.OUT_DIR ?? '/tmp') + '/adult-out.json', JSON.stringify(rows, null, 1));
for (const [k, x] of rows) { console.log(String(x.n).padStart(6), `(grid ${x.grid}, typ ${x.typical})`, k); if (!k.startsWith('ok')) console.log('         e.g.', JSON.stringify(x.e).slice(0, 700)); }
