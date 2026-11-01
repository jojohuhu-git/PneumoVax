// Adults whose dose was given SOONER than the advised spacing. Under the owner's
// 2026-10-11 determination such a dose COUNTS, with a note. Checked: (1) it
// counts, (2) the note is there, (3) the next step matches the independent
// reading of mm7401a1's table + CDC's adult notes (both read live 2026-10-31),
// copied from that day's typical-adult check.
// Usage: node scripts/earlyDoseCheckAdults.mjs "$PWD"   (from the repo root)
// Expected on main once #110 is merged: 906 agree, 0 problems (60 before it).
const root = process.argv[2];
const { recommend } = await import(root + '/src/logic/recommend.js');
const T = '2026-10-31';
const addM = (iso, m) => { const [y, mo, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, mo - 1 + Math.trunc(m), d)).toISOString().slice(0, 10); };
const addD = (iso, n) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);
const ageY = (dob, iso) => { const [y1, m1, d1] = dob.split('-').map(Number); const [y2, m2, d2] = iso.split('-').map(Number); return (y2 - y1) - ((m2 < m1 || (m2 === m1 && d2 < d1)) ? 1 : 0); };
const maxD = (...xs) => xs.filter(Boolean).sort().at(-1);
const ICCC = new Set(['hiv', 'asplenia', 'immunosuppression', 'ckd_advanced', 'cochlear_implant', 'csf_leak']);
const CHRONIC = new Set(['diabetes', 'smoking', 'chronic_lung', 'alcoholism']);

function acip(dob, risk, pcv, ppsv) {
  const age = ageY(dob, T);
  const iccc = risk.some((r) => ICCC.has(r));
  const chronic = risk.some((r) => CHRONIC.has(r));
  if (age < 50 && !iccc && !chronic) return { cat: 'NONE' };
  const conj = pcv.filter((d) => d.product !== 'PCV7');
  const last = (xs) => xs.map((d) => d.date).sort().at(-1);
  const lastAll = last([...conj, ...ppsv]);
  if (conj.some((d) => d.product === 'PCV20' || d.product === 'PCV21')) return { cat: 'NONE' };
  const p15 = conj.filter((d) => d.product === 'PCV15');
  if (p15.length) {
    const d15 = last(p15);
    if (ppsv.some((d) => d.date > d15)) return { cat: 'NONE' };
    if (ppsv.length) return { cat: 'NONE' };
    const e = age < 50 && iccc ? addD(d15, 56) : addM(d15, 12);
    return { cat: 'PPSV23', lo: e, hi: e };
  }
  const p13 = conj.filter((d) => d.product === 'PCV13');
  if (p13.length) {
    if (!ppsv.length) { const e = addM(last(p13), 12); return { cat: 'PCV20_21', lo: e, hi: e }; }
    const e5 = addM(lastAll, 60);
    if (age >= 50) {
      if (ppsv.some((d) => ageY(dob, d.date) >= 65)) return { cat: 'SCDM', lo: e5, hi: e5 };
      return { cat: 'PCV20_21', lo: e5, hi: e5 };
    }
    if (!iccc) return { cat: 'NONE' };
    if (ppsv.length === 1) return { cat: 'PCV20_21', lo: e5, hi: e5 };
    return { cat: 'PCV20_21', lo: e5, hi: e5, alsoOk: 'NONE' };
  }
  if (!ppsv.length) return { cat: 'ANY_PCV', lo: T, hi: T };
  const e = addM(last(ppsv), 12);
  return { cat: 'ANY_PCV', lo: e, hi: e };
}
function appCat(out) {
  const live = out.recs.filter((r) => !['complete', 'not-indicated'].includes(r.status));
  if (!live.length) return { cat: 'NONE', text: out.recs.map((r) => r.status + ': ' + r.doseLabel).join(' || ') };
  const text = live.map((r) => r.doseLabel).join(' || ');
  const date = live.map((r) => (r.dueToday ? T : r.earliestNextDate)).filter(Boolean).sort()[0];
  let cat;
  if (live.some((r) => r.status === 'shared-decision')) cat = 'SCDM';
  else if (/PPSV23/.test(text) && !/PCV(15|20|21)/.test(text.replace(/after PCV15|PCV15 dose/g, ''))) cat = 'PPSV23';
  else if (/PCV15/.test(text.replace(/after PCV15|PCV15 dose/g, ''))) cat = 'ANY_PCV';
  else if (/PCV20|PCV21/.test(text)) cat = 'PCV20_21';
  else cat = 'OTHER';
  return { cat, date, text: live.map((r) => r.status + ': ' + r.doseLabel + ' @' + (r.dueToday ? 'today' : r.earliestNextDate)).join(' || ') };
}

const AGES = [22, 40, 49, 52, 64, 67, 75];
const RISKS = [['diabetes'], ['chronic_lung'], ['cochlear_implant'], ['hiv'], ['asplenia'], []];
// [first product, second product, gap in days, plus optional older prior doses]
// The SECOND dose is the early one; it was given 20 days ago.
const PAIRS = [
  ['PCV15', 'PPSV23', [28, 42, 120, 270]],
  ['PCV13', 'PPSV23', [28, 42, 120, 270]],
  ['PCV13', 'PCV20', [120, 270]], ['PCV13', 'PCV21', [120]],
  ['PPSV23', 'PCV20', [120, 270]], ['PPSV23', 'PCV15', [120, 270]], ['PPSV23', 'PCV21', [120]],
  ['PPSV23', 'PPSV23', [365 * 2, 365 * 4]],
  ['PCV15', 'PCV20', [14]], ['PCV20', 'PCV20', [14]],
  ['PCV13+PPSV23', 'PCV20', [365 * 2, 365 * 4]], // PCV13 8y ago, PPSV23 at gap before the PCV20
];
// The advised spacing (not the floor) for the second dose after the first.
function advisedDays(first, second, age, iccc) {
  if (second === 'PPSV23' && (first === 'PCV15' || first === 'PCV13')) return age < 50 && iccc ? 56 : 365;
  if (second === 'PPSV23' && first === 'PPSV23') return 365 * 5;
  if (first === 'PPSV23' || first === 'PCV13') return 365;
  if (first === 'PCV13+PPSV23') return 365 * 5;
  return 28; // conjugate after conjugate
}
const issues = new Map(); let n = 0, ok = 0;
const flag = (k, ex) => { if (!issues.has(k)) issues.set(k, { n: 0, ex }); issues.get(k).n++; };
for (const a of AGES) for (const risk of RISKS) for (const [first, second, gaps] of PAIRS) for (const gap of gaps) {
  const dob = addM(T, -(a * 12 + 3));
  const d2 = addD(T, -20), d1 = addD(d2, -gap);
  if (ageY(dob, d1) < 19) continue;
  let pcv = [], ppsv = [];
  if (first === 'PCV13+PPSV23') { const p13 = addM(T, -96); if (ageY(dob, p13) < 19) continue; pcv.push({ product: 'PCV13', date: p13 }); ppsv.push({ product: 'PPSV23', date: d1 }); }
  else (first === 'PPSV23' ? ppsv : pcv).push({ product: first, date: d1 });
  (second === 'PPSV23' ? ppsv : pcv).push({ product: second, date: d2 });
  n++;
  const out = recommend({ dob, ageMonths: a * 12 + 3, today: T, riskIds: risk, pcvDoses: pcv, ppsv23Doses: ppsv });
  const iccc = risk.some((r) => ICCC.has(r));
  const ex = { age: a, risk: risk.join('+') || 'healthy', hist: `${first} then ${second} ${gap}d later (20d ago)` };
  let bad = false;
  const stream = second === 'PPSV23' ? out.perDose.ppsv23 : out.perDose.pcv;
  const v = stream[stream.length - 1];
  const counted = v.status === 'valid' && !v.doesNotCount;
  if (!counted) { bad = true; flag(`${first}→${second}: early dose NOT counted (owner: counts)`, { ...ex, why: v.reasons }); }
  const short = gap < advisedDays(first, second, a, iccc);
  const greyIc50 = second === 'PPSV23' && first !== 'PPSV23' && a >= 50 && iccc && gap >= 56; // 8 wk "can be considered"
  const noted = Boolean(v.earlyAdvisory) || (v.reasons || []).length > 0;
  if (short && !noted && !greyIc50) { bad = true; flag(`${first}→${second}: early dose has NO note`, { ...ex, v }); }
  const want = acip(dob, risk, pcv, ppsv), got = appCat(out);
  if (got.cat !== want.cat && got.cat !== want.alsoOk) { bad = true; flag(`${first}→${second}: want ${want.cat} got ${got.cat}`, { ...ex, got: got.text }); }
  else if (want.lo && got.cat !== 'NONE') {
    const gd = maxD(got.date || T, T), lo = maxD(want.lo, T);
    if (gd < lo) { bad = true; flag(`${first}→${second}: date EARLY`, { ...ex, want: lo, got: got.text }); }
    else if (Date.parse(gd) - Date.parse(lo) > 31 * 864e5) { bad = true; flag(`${first}→${second}: date LATE`, { ...ex, want: lo, got: got.text }); }
  }
  if (!bad) ok++;
}
console.log('patients', n, 'agree', ok, 'problems', n - ok, 'kinds', issues.size);
for (const [k, v] of [...issues].sort((x, y) => y[1].n - x[1].n)) console.log('\n' + v.n + ' × ' + k + '\n   ' + JSON.stringify(v.ex).slice(0, 700));
