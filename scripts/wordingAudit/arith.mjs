// Audit 3(a), part 2: the arithmetic inside dated sentences.
//  - "N weeks/years after the X of D"  -> D + N  vs the card's shown date
//  - "Wait until W: ..."                -> W vs shown
//  - the dose "of D" must be on the record, as that product
//  - "turns N on D" / "19th birthday, D" -> DOB + N years
import { allPatients } from '../../scripts/wholeApp/replay.mjs';
import { recommend } from '../../src/logic/recommend.js';
import { addCalendarMonths, addDays } from '../../src/logic/dateUtils.js';

const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const D = String.raw`(\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4})`;
const toIso = (s) => {
  if (/^\d{4}-/.test(s)) return s;
  const [, mo, d, y] = s.match(/(\w+) (\d+), (\d+)/);
  return `${y}-${String(MON[mo]).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};
const AFTER = new RegExp(String.raw`(\d+) (weeks?|years?|months?) after (?:the |this child's )?(PCV15|PCV20|PCV13|PPSV23|PCV)\b[^.;]*? of ${D}`, 'g');
const WAIT = new RegExp(String.raw`(?:Wait until|Held to|Advised)[^.;]*?${D}`);
const TURNS = new RegExp(String.raw`turns (\d+) on ${D}`, 'g');
const BDAY19 = new RegExp(String.raw`19th birthday, ${D}`, 'g');

const tally = new Map();
const add = (k, ex) => { const t = tally.get(k) ?? { n: 0, ex }; t.n += 1; tally.set(k, t); };

for (const p of allPatients()) {
  const { input } = p;
  const r = recommend(input);
  const rec = (s) => [...(s === 'PPSV23' ? input.ppsv23Doses : input.pcvDoses)];
  for (const c of r.recs ?? []) {
    const text = `${c.doseLabel ?? ''} ${c.note?.lead ?? ''} ${c.note?.detail ?? ''}`;
    const shown = c.dueToday ? input.today : c.earliestNextDate;
    const ex = { input, shown, dueToday: c.dueToday, status: c.status, label: c.doseLabel, lead: c.note?.lead };
    for (const m of text.matchAll(AFTER)) {
      const [, n, unit, prod, ds] = m; const d = toIso(ds);
      const pool = prod === 'PPSV23' ? input.ppsv23Doses : input.pcvDoses;
      const onRecord = pool.some((x) => x.date === d && (prod === 'PCV' || prod === 'PPSV23' || x.product === prod));
      const isLast = pool.filter((x) => x.date).map((x) => x.date).sort().at(-1) === d;
      const plus = /week/.test(unit) ? addDays(d, Number(n) * 7) : /year/.test(unit) ? addCalendarMonths(d, Number(n) * 12) : addCalendarMonths(d, Number(n));
      const tag = `${n} ${unit} after ${prod}`;
      if (!onRecord) add(`A1 named dose not on record: ${tag}`, ex);
      else if (!isLast) add(`A2 named dose is not the latest of its kind: ${tag}`, ex);
      if (!shown) add(`A3 arithmetic, card shows no date: ${tag}`, ex);
      else if (plus === shown) add(`ok sum equals shown: ${tag}`, ex);
      else if (c.dueToday && plus <= input.today) add(`ok due today, sum already passed: ${tag}`, ex);
      else add(`A4 sum ${plus < shown ? 'EARLIER' : 'LATER'} than shown${c.dueToday ? ' (card says today)' : ''}: ${tag}`, { ...ex, plus });
    }
    const w = text.match(WAIT);
    if (w) { const d = toIso(w[1]); add(d === shown ? 'ok wait/held/advised date = shown' : `W1 wait/held/advised first date != shown (${d < (shown ?? '') ? 'earlier' : 'later/none'})`, { ...ex, d }); }
    for (const m of text.matchAll(TURNS)) {
      const exp = addCalendarMonths(input.dob, Number(m[1]) * 12);
      add(toIso(m[2]) === exp ? `ok turns ${m[1]} on` : `T1 turns ${m[1]} on wrong date`, { ...ex, exp, said: m[2] });
    }
    for (const m of text.matchAll(BDAY19)) {
      const exp = addCalendarMonths(input.dob, 228);
      add(toIso(m[1]) === exp ? 'ok 19th birthday' : 'T2 19th birthday wrong', { ...ex, exp, said: m[1] });
    }
  }
}
for (const [k, t] of [...tally].sort()) {
  console.log(String(t.n).padStart(7), k);
  if (!k.startsWith('ok')) console.log('         e.g.', JSON.stringify(t.ex).slice(0, 900));
}
