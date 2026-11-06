#!/usr/bin/env node
// wordingChecks.mjs — two faults the live-source reading found, measured.
//
// The seven checks compare dates and doses, so neither of these can reach them:
// both are a card's WORDS disagreeing with the record or with its own date.
//   W1  A card says the doses were given "at or after age 6" when some were
//       given before 6. Same dose either way, so this is wording and citation.
//   W2  A card says a dose "may be given now" above a date still in the future.
//
//   node scripts/wholeApp/wordingChecks.mjs
import { recommend } from '../../src/logic/recommend.js';
import { addCalendarMonths } from '../../src/logic/dateUtils.js';
import { allPatients, cardText } from './replay.mjs';

const SAYS_AFTER_SIX = /at\/after age 6|at or after age 6/;
const counts = new Map();
const add = (k, p) => {
  const c = counts.get(k) ?? { n: 0, grid: 0, typical: 0, ex: p.key };
  c.n += 1; c[p.group] += 1; counts.set(k, c);
};

for (const p of allPatients()) {
  const r = recommend(p.input);
  const six = addCalendarMonths(p.input.dob, 72);
  const counted = (s) => (r.orderedDoses?.[s] ?? []).filter((d, i) => {
    const v = r.perDose[s][i];
    return v.status === 'valid' || v.status === 'unknown';
  });
  for (const c of r.recs ?? []) {
    const text = cardText(c);
    if (SAYS_AFTER_SIX.test(text)) {
      const pcvEarly = counted('pcv').some((d) => d.date < six);
      const ppsvEarly = counted('ppsv23').some((d) => d.date < six);
      if (pcvEarly || ppsvEarly) add(`W1 ${pcvEarly ? 'a conjugate' : 'the PPSV23'} before 6 | ${c.doseLabel}`, p);
    }
    if (/may be given now/.test(text) && !c.dueToday && c.earliestNextDate) add(`W2 ${c.doseLabel}`, p);
  }
}
const rows = [...counts].sort((a, b) => b[1].n - a[1].n);
for (const [k, c] of rows) console.log(`${String(c.n).padStart(6)}  grid ${c.grid}, typical ${c.typical}  ${k}\n        e.g. ${c.ex}`);
for (const w of ['W1', 'W2']) {
  const mine = rows.filter(([k]) => k.startsWith(w));
  console.log(`${w} total: ${mine.reduce((a, [, c]) => a + c.n, 0)} cards (grid ${mine.reduce((a, [, c]) => a + c.grid, 0)}, typical ${mine.reduce((a, [, c]) => a + c.typical, 0)})`);
}
