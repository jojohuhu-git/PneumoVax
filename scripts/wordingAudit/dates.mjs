// Audit 3(a): every date written in a card's words, against the card's own date.
// Read-only. Run from the repo root: node <this file>
import { allPatients, noteText } from '../../scripts/wholeApp/replay.mjs';
import { recommend } from '../../src/logic/recommend.js';
import { writeFileSync } from 'node:fs';

const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const DATE_RE = /\b(\d{4}-\d{2}-\d{2})\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}), (\d{4})\b/g;
const iso = (m) => m[1] ?? `${m[4]}-${String(MON[m[2]]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;

const tpl = new Map(); // template -> stats
const bump = (k, rel, ex) => {
  const t = tpl.get(k) ?? { n: 0, rel: {}, ex: {} };
  t.n += 1; t.rel[rel] = (t.rel[rel] ?? 0) + 1; t.ex[rel] ??= ex; tpl.set(k, t);
};
const generic = (s) => s.replace(DATE_RE, '<D>').replace(/\b\d+(\.\d+)?\b/g, '#');

let cards = 0, withDates = 0;
for (const p of allPatients()) {
  const r = recommend(p.input);
  const today = p.input.today;
  for (const c of r.recs ?? []) {
    cards += 1;
    const fields = { label: c.doseLabel ?? '', lead: c.note?.lead ?? (typeof c.note === 'string' ? c.note : ''), detail: c.note?.detail ?? '' };
    const shown = c.dueToday ? today : c.earliestNextDate; // what the card's top says
    let any = false;
    for (const [where, text] of Object.entries(fields)) {
      // split into sentences so each date keeps its own verb
      for (const sent of text.split(/(?<=[.;])\s+/)) {
        for (const m of sent.matchAll(DATE_RE)) {
          any = true;
          const d = iso(m);
          const rel = !shown ? (c.advisory ? 'card-advisory' : `card-no-date(${c.status})`)
            : d === shown ? 'same' : d < shown ? 'EARLIER' : 'LATER';
          const relToday = d < today ? 'past' : d === today ? 'today' : 'future';
          const before = sent.slice(Math.max(0, m.index - 70), m.index);
          const key = `${where} | …${generic(before)}<D>`;
          bump(key, `${rel}/${relToday}`, { key: p.key ?? JSON.stringify(p.input).slice(0, 200), today, shown, dueToday: c.dueToday, status: c.status, label: c.doseLabel, sent });
        }
      }
    }
    if (any) withDates += 1;
  }
}
const rows = [...tpl].sort((a, b) => b[1].n - a[1].n);
writeFileSync((process.env.OUT_DIR ?? '/tmp') + '/dates-out.json', JSON.stringify(rows, null, 1));
console.log(`cards ${cards}, cards with a written date ${withDates}, templates ${rows.length}`);
for (const [k, t] of rows) console.log(String(t.n).padStart(7), JSON.stringify(t.rel), '\n        ', k);
