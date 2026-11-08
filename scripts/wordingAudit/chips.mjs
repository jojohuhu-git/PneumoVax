import { allPatients } from '../../scripts/wholeApp/replay.mjs';
import { recommend } from '../../src/logic/recommend.js';
import { doseChipLabel } from '../../src/components/doseChipLabel.js';
const mb = (a, b) => { const [y1, m1, d1] = a.split('-').map(Number); const [y2, m2, d2] = b.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0); };
const t = new Map(); const add = (k, e) => { const x = t.get(k) ?? { n: 0, e }; x.n++; t.set(k, x); };
for (const p of allPatients()) {
  const { input } = p; const age = mb(input.dob, input.today);
  const r = recommend(input);
  if (r.meta?.excluded || !r.perDose) continue;
  for (const c of r.recs ?? []) if (age < 216 && (c.brands ?? []).some((b) => /PCV21/.test(b))) add(`V1 PCV21 offered under 18 | ${c.doseLabel}`, { key: p.key, age });
  const totals = (r.recs ?? []).map((c) => c.seriesTotal).filter((x) => x != null);
  for (const s of ['pcv', 'ppsv23']) (r.perDose[s] ?? []).forEach((v, i) => {
    const label = doseChipLabel(v, s === 'pcv' ? totals[0] ?? null : null) ?? '(none)';
    const words = `${(v.reasons ?? []).join(' ')} ${v.detail ?? ''}`;
    const kind = label.replace(/\d+/g, '#');
    add(`chip ${s}: ${kind}`, null);
    if (/ of #/.test(kind) && age >= 24) add(`C1 "Dose N of M" shown at age ${age >= 228 ? '19+' : '2-18'}`, { key: p.key, label });
    if (v.status === 'invalid') {
      const says = /\brepeat|Not repeated|no need|not needed|does not need/i.test(words);
      if (!says) add(`C2 Invalid chip, note does not say whether to repeat | ${kind}`, { key: p.key, input, words });
      if (/\brepeat (it|this dose)\b|Repeat\b/.test(words) && !/(from|on or after|after) \w{3} \d+, \d{4}|today/.test(words)) add(`C3 Invalid chip says repeat but gives no when | ${kind}`, { key: p.key, input, words });
    }
    if (/^Extra/.test(label) && !/not (be )?repeat|do not repeat|Not repeated|no need to repeat|nothing needs to be repeated/i.test(words)) add(`C4 Extra chip, note does not say "do not repeat" | ${kind}`, { key: p.key, words: words.slice(0, 300) });
  });
}
for (const [k, x] of [...t].sort((a, b) => b[1].n - a[1].n)) console.log(String(x.n).padStart(7), k, x.e ? '\n          e.g. ' + JSON.stringify(x.e).slice(0, 700) : '');
