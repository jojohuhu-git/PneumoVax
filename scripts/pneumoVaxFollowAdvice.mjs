// ─────────────────────────────────────────────────────────────────────────
// pneumoVaxFollowAdvice.mjs — does following PneumoVax's own advice lead
// where the card said it would? (2026-11-01 grey-zone audit; read-only.)
//
// For each grey-zone patient, give the dose the card advises on the date it
// advises, move "today" to that date, re-run the engine, and repeat until the
// card stops asking for anything. Two paths per patient: A always picks PCV20
// when offered; B picks PCV15 (or the PPSV23 option) when offered. A step is a
// FLAG when the engine then rejects, or calls unneeded, a dose it advised.
//   node scripts/pneumoVaxFollowAdvice.mjs [G01 …]
// ─────────────────────────────────────────────────────────────────────────
import { recommend } from '../src/logic/recommend.js';
import { ALL, TODAY } from './pneumoRecsGreyCases.mjs';

const ACTION = new Set(['due', 'risk-based', 'catchup', 'routine', 'overdue']);
const isAction = (r) => ACTION.has(r.status) && !/^Review at age 50/.test(r.doseLabel ?? '');
const prod = (b) => (b ?? '').split(' ')[0];

function step(c, s, path) {
  const r = recommend({ dob: c.dob, riskIds: c.riskIds, pcvDoses: s.pcv, ppsv23Doses: s.ppsv, today: s.today });
  const acts = (r.recs ?? []).filter(isAction);
  return { r, acts };
}
function choose(acts, path) {
  if (path === 'B') {
    const p15 = acts.find((a) => a.vaccine === 'PCV' && (a.brands ?? []).some((b) => prod(b) === 'PCV15'));
    if (p15) return { rec: p15, product: 'PCV15' };
    const pp = acts.find((a) => a.vaccine === 'PPSV23');
    if (pp) return { rec: pp, product: 'PPSV23' };
  }
  const a = acts[0];
  if (a.vaccine === 'PPSV23') return { rec: a, product: 'PPSV23' };
  const bs = (a.brands ?? []).map(prod);
  return { rec: a, product: bs.includes('PCV20') ? 'PCV20' : bs[0] ?? 'PCV20' };
}
const later = (a, b) => (a > b ? a : b);

export function follow(c, path) {
  const byDate = (x, y) => (x.date < y.date ? -1 : 1);
  const s = { pcv: [...c.pcvDoses].sort(byDate), ppsv: [...c.ppsv23Doses].sort(byDate), today: TODAY };
  const log = [], flags = [];
  for (let i = 0; i < 5; i++) {
    const { r, acts } = step(c, s, path);
    // Did the engine reject or call unneeded a dose WE added on its advice?
    for (const [k, list, mine] of [['pcv', r.perDose?.pcv ?? [], s.pcv], ['ppsv23', r.perDose?.ppsv23 ?? [], s.ppsv]]) {
      list.forEach((d, j) => {
        const dose = mine[j];
        if (!dose?.advised) return;
        const why = (d.reasons ?? []).join(' ');
        if (d.status !== 'valid' || /not needed|not counted|isn.t counted|extra dose|does not count/i.test(why))
          flags.push(`advised ${dose.product} ${dose.date} later graded ${d.status}: ${why.slice(0, 220)}`);
      });
    }
    if (!acts.length) {
      log.push(`END ${s.today}: ${(r.recs ?? []).map((x) => `${x.status}·${x.doseLabel}`).join(' | ') || (r.excluded ? 'HARD STOP' : '(none)')}`);
      break;
    }
    const { rec, product } = choose(acts, path);
    const date = later(rec.earliestNextDate ?? s.today, s.today);
    log.push(`${s.today}: card "${rec.doseLabel}" → give ${product} on ${date}`);
    const dose = { product, date, advised: true };
    if (product === 'PPSV23') s.ppsv.push(dose); else s.pcv.push(dose);
    s.pcv.sort((x, y) => (x.date < y.date ? -1 : 1)); s.ppsv.sort((x, y) => (x.date < y.date ? -1 : 1));
    s.today = date;
    if (i === 4) log.push('…stopped after 5 doses');
  }
  return { log, flags, added: log.filter((l) => l.includes('→ give')).length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ids = process.argv.slice(2);
  for (const c of ALL.filter((x) => (ids.length ? ids.includes(x.id) : true))) {
    const A = follow(c, 'A'), B = follow(c, 'B');
    const same = JSON.stringify(A.log) === JSON.stringify(B.log);
    console.log(`${c.id} ${c.label}`);
    for (const [n, p] of same ? [['A=B', A]] : [['A', A], ['B', B]]) {
      console.log(`   path ${n}: ${p.added} dose(s)`);
      for (const l of p.log) console.log('      ' + l);
      for (const f of p.flags) console.log('      ⚠ ' + f);
    }
  }
}
