// Audit 3(a), part 3: undated numbers in a card's VISIBLE words (label + lead),
// against the card's own date.
//   G1  the card's date is EARLIER than an interval its own words state
//   G2  the card says Today but a stated interval has not run out yet (grace aside)
//   G3  the card's date matches none of the intervals it states, nor an age line, nor today
import { allPatients } from '../../scripts/wholeApp/replay.mjs';
import { recommend } from '../../src/logic/recommend.js';
import { addCalendarMonths, addDays } from '../../src/logic/dateUtils.js';
import { writeFileSync } from 'node:fs';

const UNIT = String.raw`(\d+) (weeks?|months?|years?)`;
// "≥8 weeks after the most recent PCV", "≥5 years after first PPSV23", "(≥8 weeks)" bare
const PHRASE = new RegExp(String.raw`≥\s?${UNIT}(?: (?:after|from) (?:the |this child's |his |her )?(most recent|last|first|previous)? ?(PCV15|PCV20|PCV13|PCV|PPSV23|pneumococcal dose|dose)?)?`, 'g');
const plus = (d, n, u) => (/week/.test(u) ? addDays(d, n * 7) : /month/.test(u) ? addCalendarMonths(d, n) : addCalendarMonths(d, n * 12));
const sorted = (xs) => xs.filter((x) => x.date).map((x) => x.date).sort();

const t = new Map();
const add = (k, e) => { const x = t.get(k) ?? { n: 0, e }; x.n++; t.set(k, x); };
const generic = (s) => s.replace(/\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d+, \d{4}/g, '<D>');

for (const p of allPatients()) {
  const { input } = p;
  const r = recommend(input);
  const pcv = sorted(input.pcvDoses), ppsv = sorted(input.ppsv23Doses), all = [...pcv, ...ppsv].sort();
  const ok = (s) => (r.orderedDoses?.[s] ?? []).filter((d, i) => ['valid', 'unknown'].includes(r.perDose[s][i]?.status) && d.date).map((d) => d.date).sort();
  const cpcv = ok('pcv'), cppsv = ok('ppsv23'), call = [...cpcv, ...cppsv].sort();
  const lines = [2, 4, 6, 7, 12, 15, 24, 60, 72, 228, 600, 780].map((m) => addCalendarMonths(input.dob, m));
  for (const c of r.recs ?? []) {
    if (c.advisory) continue;
    const visible = `${c.doseLabel ?? ''} || ${c.note?.lead ?? (typeof c.note === 'string' ? c.note : '')}`;
    const shown = c.dueToday ? input.today : c.earliestNextDate;
    if (!shown) continue;
    const sums = [];
    for (const m of visible.matchAll(PHRASE)) {
      const [, n, u, which, prod] = m;
      const bare = !prod && !which;
      const kind = prod === 'PPSV23' || (!prod && which === 'first') ? 'ppsv' : prod && /PCV/.test(prod) ? 'pcv' : 'all';
      const raw = { ppsv, pcv, all }[kind], cnt = { ppsv: cppsv, pcv: cpcv, all: call }[kind];
      const pick = (xs) => (which === 'first' ? xs[0] : xs.at(-1));
      const a = pick(raw), b = pick(cnt);
      if (!a) continue;
      sums.push({ phrase: m[0], sum: plus(a, Number(n), u), sumCounted: b ? plus(b, Number(n), u) : null, differs: a !== b, which: which ?? (bare ? 'bare' : 'last'), bare });
    }
    if (!sums.length) continue;
    const ex = { key: p.key, input, shown, dueToday: c.dueToday, status: c.status, visible: visible.slice(0, 700) };
    const shape = `${c.dueToday ? 'TODAY' : 'DATE'} | ${generic(c.doseLabel ?? '')}`;
    for (const s of sums.filter((x) => !x.bare)) {
      if (!c.dueToday && s.sum > shown && s.sumCounted === shown) { add(`E2 words name the ${s.which} dose on the record, date counts from the ${s.which} that COUNTED | "${s.phrase}" | ${shape}`, ex); continue; }
      if (!c.dueToday && s.sum > shown) add(`G1 date earlier than its own "${s.phrase}" | ${shape}`, { ...ex, sum: s.sum });
      if (c.dueToday && addDays(s.sum, -4) > input.today) add(`G2 says Today, "${s.phrase}" not yet run | ${shape}`, { ...ex, sum: s.sum });
    }
    if (!c.dueToday) {
      const e1 = sums.find((s) => s.sum !== shown && s.sumCounted === shown && s.differs);
      if (e1) { add(`E1 words name the ${e1.which} dose on the record, date counts from the ${e1.which} that COUNTED | "${e1.phrase}" | ${shape}`, ex); continue; }
      const fmt = (d) => { const [y, m, dd] = d.split('-').map(Number); return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1]} ${dd}, ${y}`; };
      const namesItsDate = visible.includes(fmt(shown)) || visible.includes(shown);
      if (namesItsDate && !sums.some((s) => s.sum === shown)) { add(`ok-dated the words name the date itself | ${/did not count/.test(visible) ? 'thrown-out PPSV23 hold (R4 family)' : 'wait-until'} | ${shape}`, null); continue; }
      const explained = sums.some((s) => s.sum === shown) || lines.includes(shown) || shown === input.today;
      if (!explained) add(`G3 date not any stated interval/age line | ${shape} | ${sums.map((s) => s.phrase).join(' ; ')}`, ex);
      else add('ok explained', null);
    }
  }
}
const rows = [...t].sort((a, b) => b[1].n - a[1].n);
writeFileSync((process.env.OUT_DIR ?? '/tmp') + '/gaps3-out.json', JSON.stringify(rows, null, 1));
for (const [k, x] of rows) { console.log(String(x.n).padStart(6), k); if (x.e) console.log('        e.g.', JSON.stringify(x.e).slice(0, 900)); }
