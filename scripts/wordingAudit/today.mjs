import { allPatients } from '../../scripts/wholeApp/replay.mjs';
import { recommend } from '../../src/logic/recommend.js';
const t = new Map(); const add = (k, e) => { const x = t.get(k) ?? { n: 0, e }; x.n++; t.set(k, x); };
const gen = (s) => s.replace(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d+, \d{4}|\d{4}-\d{2}-\d{2}/g, '<D>').replace(/\d+/g, '#');
for (const p of allPatients()) {
  const r = recommend(p.input);
  for (const c of r.recs ?? []) {
    if (c.advisory) continue;
    const lead = c.note?.lead ?? (typeof c.note === 'string' ? c.note : '');
    const future = !c.dueToday && c.earliestNextDate && c.earliestNextDate > p.input.today;
    for (const sent of `${c.doseLabel ?? ''}. ${lead}`.split(/(?<=[.;])\s+/)) {
      if (future && /\b(today|now|immediately)\b/i.test(sent) && !/can be given today if needed|no (PPSV23|dose)[^.]*now|none follows[^.]*now|No dose now|not (needed|due) now/i.test(sent))
        add(`F1 future-dated card, sentence says today/now | ${c.status} | ${gen(sent).slice(0, 160)}`, { key: p.key, group: p.group, shown: c.earliestNextDate, today: p.input.today, label: c.doseLabel, sent });
      if (c.dueToday && /\b(wait until|not yet due|not due until|held to)\b/i.test(sent))
        add(`F2 Today card, sentence says wait | ${c.status} | ${gen(sent).slice(0, 160)}`, { key: p.key, group: p.group, label: c.doseLabel, sent });
    }
  }
}
for (const [k, x] of [...t].sort((a, b) => b[1].n - a[1].n)) console.log(String(x.n).padStart(6), k, '\n        e.g.', JSON.stringify(x.e).slice(0, 600));
