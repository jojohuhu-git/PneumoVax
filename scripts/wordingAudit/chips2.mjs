import { allPatients } from '../../scripts/wholeApp/replay.mjs';
import { recommend } from '../../src/logic/recommend.js';
import { addCalendarMonths } from '../../src/logic/dateUtils.js';
const mb = (a, b) => { const [y1, m1, d1] = a.split('-').map(Number); const [y2, m2, d2] = b.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0); };
const t = {}; const add = (k) => { t[k] = (t[k] ?? 0) + 1; };
for (const p of allPatients()) {
  const { input } = p; const age = mb(input.dob, input.today);
  const r = recommend(input);
  for (const c of r.recs ?? []) if (age < 216 && (c.brands ?? []).some((b) => /PCV21/.test(b))) {
    const d = c.dueToday ? input.today : c.earliestNextDate;
    add(`PCV21 under 18: card date ${d >= addCalendarMonths(input.dob, 216) ? 'at/after 18th birthday' : 'BEFORE 18'}`);
  }
  for (const s of ['pcv', 'ppsv23']) (r.perDose?.[s] ?? []).forEach((v) => {
    if (v.status !== 'invalid') return;
    const w = (v.reasons ?? []).join(' ');
    const why = /minimum age|below the/.test(w) ? 'age' : /interval|after the last|since/.test(w) ? 'interval' : 'other';
    const last = (v.reasons ?? []).at(-1) ?? '';
    add(`${s} invalid (${why}) closes: ${last.replace(/\w{3} \d+, \d{4}/g, '<D>').replace(/\d+/g, '#').slice(0, 110)}`);
  });
}
for (const [k, n] of Object.entries(t).sort((a, b) => b[1] - a[1])) console.log(String(n).padStart(6), k);
