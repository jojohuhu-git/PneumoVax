// Children 2-18 with ONE dose given too early, checked against an INDEPENDENT
// reading of CDC's Child/Adolescent Schedule Notes (pneumococcal section, read
// live 2026-10-31 in the browser pane, accordions opened, 5,128 chars) and CDC
// Catch-up Table 2 / ACIP General Best Practices ("The repeat dose should be
// spaced after the invalid dose by the recommended minimum interval"; doses up
// to 4 days early count).
// Usage: node scripts/earlyDoseCheckChildren.mjs "$PWD"   (from the repo root)
// Expected on main once #111 is merged: 630 agree, 0 problems. Encodes the
// owner's §C-P2-ONE ruling (Leah): only PPSV23 thrown out too soon after a
// PCV -> PCV20 only, 8 weeks after the PCV. Proved 2026-10-31 (before that
// ruling) by breaking the app: the PPSV23-after-PCV floor at 4 weeks raised the
// problem kinds 3 -> 12; the booster's 8 weeks at 4 raised problems 168 -> 363.
const root = process.argv[2];
const { recommend } = await import(root + '/src/logic/recommend.js');
const T = '2026-10-31';
const addM = (iso, m) => { const [y, mo, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, mo - 1 + m, d)).toISOString().slice(0, 10); };
const addD = (iso, n) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);
const maxD = (...xs) => xs.filter(Boolean).sort().at(-1);
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

const AGES_M = [27, 36, 48, 62, 70, 84, 120, 186, 204];      // 2y3m … 15y6m
const RISKS = { healthy: [], diabetes: ['diabetes'], cochlear: ['cochlear_implant'], asplenia: ['asplenia'], hiv: ['hiv'] };
const IC = new Set(['asplenia', 'hiv']);
const SHORT = [5, 14, 25];       // days short of the minimum (all beyond the 4-day grace)
const CONTROL = [-2, 0];         // 2 days short (inside grace) and exactly on the minimum: must COUNT

// Each scenario builds a history and states CDC's answer.
// want: { counts: [bool per PCV dose], ppsvCounts: [...], next: 'NONE' | {vacc:'PCV'|'PPSV23'|'PCV20_OR_PPSV23', on: date} }
const SCEN = {
  // Baby series bunched: 2, 4, 11 months, then the 12-month booster too soon after dose 3.
  booster_too_soon(dob, am, risk, short) {
    const d3 = addM(dob, 11), b = maxD(addM(dob, 12), addD(d3, 56 - short));
    const prod = dob < '2023-01-01' ? 'PCV13' : 'PCV20';
    const pcv = [addM(dob, 2), addM(dob, 4), d3, b].map((date) => ({ product: prod, date }));
    const counts = short <= 4;
    const healthy = !risk.length;
    let next;
    if (counts) next = healthy ? 'NONE' : am < 72 ? (prod === 'PCV20' ? 'NONE' : { vacc: 'PCV20_OR_PPSV23', on: addD(b, 56) }) : (prod === 'PCV20' ? 'NONE' : { vacc: 'PCV20_OR_PPSV23', on: addD(b, 56) });
    else if (healthy) next = am < 60 ? { vacc: 'PCV', on: addD(b, 56) } : 'NONE';
    else if (am < 72) next = { vacc: 'PCV', on: addD(b, 56) };                 // 3 PCV doses: 1 dose PCV ≥8 wk after most recent
    else next = prod === 'PCV20' ? 'NONE' : { vacc: 'PCV20_OR_PPSV23', on: addD(b, 56) }; // 6-18: PCV before 6, no PPSV23
    return { pcv, ppsv: [], earlyIdx: 3, counts: [true, true, true, counts], next, hist: `${prod} 2,4,11mo + booster ${days(d3, b)}d after` };
  },
  // At-risk 2-5 with 2 baby doses: catch-up PCV, then the 2nd catch-up dose too soon.
  catchup_2nd_too_soon(dob, am, risk, short) {
    if (am < 27 || am >= 72) return null;
    const c2 = addD(T, -7), c1 = addD(c2, -(56 - short));
    if (c1 < addM(dob, 24)) return null;
    const prod = dob < '2023-01-01' ? 'PCV13' : 'PCV15';
    const pcv = [addM(dob, 2), addM(dob, 4), c1, c2].map((date) => ({ product: prod, date }));
    const counts = short <= 4;
    const healthy = !risk.length;
    let next;
    if (healthy) next = am < 60 ? 'NONE' : 'NONE';   // healthy 2-4 incomplete: 1 dose → done at c1
    else if (counts) next = { vacc: 'PCV20_OR_PPSV23', on: addD(c2, 56) };
    else next = { vacc: 'PCV', on: addD(c2, 56) };   // 3 counted: 1 more PCV ≥8 wk after most recent dose GIVEN
    return { pcv, ppsv: [], earlyIdx: 3, counts: [true, true, true, healthy ? null : counts], next, hist: `${prod} 2,4mo + catch-up, 2nd ${56 - short}d later` };
  },
  // At-risk child, complete baby series (PCV13/15), then PPSV23 too soon after a late PCV.
  ppsv_too_soon_after_pcv(dob, am, risk, short) {
    if (!risk.length) return null;
    const pp = addD(T, -10), pc = addD(pp, -(56 - short));
    if (pc < addM(dob, 24)) return null;
    // baby series 2,4,6,12 + an at-risk dose of PCV15 (child received PCV15 at 2+, as a clinician might)
    const prod = dob < '2023-01-01' ? 'PCV13' : 'PCV15';
    const pcv = [2, 4, 6, 12].map((m) => ({ product: prod, date: addM(dob, m) }));
    pcv.push({ product: 'PCV15', date: pc });
    const counts = short <= 4;
    const ic = risk.some((r) => IC.has(r));
    let next;
    if (counts) next = ic ? { vacc: 'PCV20_OR_PPSV23', on: addM(pp, 60) } : 'NONE';
    else next = { vacc: 'PCV', on: addD(pc, 56) };
    return { pcv, ppsv: [{ product: 'PPSV23', date: pp }], earlyIdx: 'ppsv0', counts: [true, true, true, true, true], ppsvCounts: [counts], next, hist: `${prod} x4 + PCV15 at 2+, PPSV23 ${56 - short}d after` };
  },
  // Teen with PCV7 only as a baby (never counts): PCV15, then PPSV23 too soon.
  teen_pcv7_pcv15_ppsv_too_soon(dob, am, risk, short) {
    if (!risk.length || am < 120 || dob > '2010-06-01') return null;
    const pp = addD(T, -10), pc = addD(pp, -(56 - short));
    const pcv = [2, 4, 6, 12].map((m) => ({ product: 'PCV7', date: addM(dob, m) }));
    pcv.push({ product: 'PCV15', date: pc });
    const counts = short <= 4;
    const ic = risk.some((r) => IC.has(r));
    let next;
    if (counts) next = ic ? { vacc: 'PCV20_OR_PPSV23', on: addM(pp, 60) } : 'NONE';
    else next = { vacc: 'PCV', on: addD(pc, 56) };
    return { pcv, ppsv: [{ product: 'PPSV23', date: pp }], earlyIdx: 'ppsv0', counts: [false, false, false, false, true], ppsvCounts: [counts], next, hist: `PCV7 x4, PCV15 at ${Math.floor(am / 12)}y, PPSV23 ${56 - short}d after` };
  },
  // Never vaccinated at-risk child 6-18: PCV15, then PPSV23 too soon.
  naive_6plus_pcv15_ppsv_too_soon(dob, am, risk, short) {
    if (!risk.length || am < 72) return null;
    const pp = addD(T, -10), pc = addD(pp, -(56 - short));
    const counts = short <= 4;
    const ic = risk.some((r) => IC.has(r));
    let next;
    if (counts) next = ic ? { vacc: 'PCV20_OR_PPSV23', on: addM(pp, 60) } : 'NONE';
    else next = { vacc: 'PCV', on: addD(pc, 56) };
    return { pcv: [{ product: 'PCV15', date: pc }], ppsv: [{ product: 'PPSV23', date: pp }], earlyIdx: 'ppsv0', counts: [true], ppsvCounts: [counts], next, hist: `unvaccinated, PCV15 at ${Math.floor(am / 12)}y, PPSV23 ${56 - short}d after` };
  },
};

function appView(out) {
  const live = out.recs.filter((r) => !['complete', 'not-indicated'].includes(r.status));
  if (!live.length) return { cat: 'NONE', labels: out.recs.map((r) => r.status + ': ' + r.doseLabel).join(' || ') };
  const r = live[0];
  const text = live.map((x) => x.doseLabel + ' ' + (x.brands || []).join(',')).join(' || ');
  const on = r.dueToday ? T : (r.earliestNextDate || T);
  let cat = r.vaccine === 'PPSV23' ? 'PPSV23' : /PCV20[^]*PPSV23|PPSV23[^]*PCV20/.test(text) ? 'PCV20_OR_PPSV23' : 'PCV';
  const pp = live.find((x) => x.vaccine === 'PPSV23');
  const ppsvOn = pp ? (pp.dueToday ? T : (pp.earliestNextDate || T)) : null;
  return { cat, on, ppsvOn, labels: live.map((x) => x.status + ': ' + x.doseLabel + ' @' + (x.dueToday ? 'today' : x.earliestNextDate)).join(' || ') };
}

const issues = new Map(); let n = 0, ok = 0;
const flag = (k, ex) => { if (!issues.has(k)) issues.set(k, { n: 0, ex }); issues.get(k).n++; };
for (const am of AGES_M) for (const [rn, risk] of Object.entries(RISKS)) for (const [sn, fn] of Object.entries(SCEN)) for (const short of [...SHORT, ...CONTROL]) {
  const dob = addM(T, -am);
  const s = fn(dob, am, risk, short); if (!s) continue;
  n++;
  const out = recommend({ dob, ageMonths: am, today: T, riskIds: risk, pcvDoses: s.pcv, ppsv23Doses: s.ppsv });
  const ex = { age: `${Math.floor(am / 12)}y${am % 12}m`, risk: rn, scen: sn, short, hist: s.hist };
  let bad = false;
  const counted = (v) => v.status === 'valid' && !v.doesNotCount;
  s.counts.forEach((c, i) => { if (c === null) return; const v = out.perDose.pcv[i]; if (counted(v) !== c) { bad = true; flag(`${sn}: PCV dose ${i + 1} ${c ? 'should COUNT' : 'should NOT count'}`, { ...ex, why: v.reasons }); } });
  (s.ppsvCounts || []).forEach((c, i) => { const v = out.perDose.ppsv23[i]; if (counted(v) !== c) { bad = true; flag(`${sn}: PPSV23 ${i + 1} ${c ? 'should COUNT' : 'should NOT count'}`, { ...ex, why: v.reasons }); } });
  const got = appView(out);
  if (s.next === 'NONE') { if (got.cat !== 'NONE') { bad = true; flag(`${sn}: CDC done, app asks for ${got.cat}`, { ...ex, got: got.labels }); } }
  else if (got.cat === 'NONE') { bad = true; flag(`${sn}: CDC wants ${s.next.vacc}, app says done`, { ...ex, got: got.labels }); }
  else {
    if (got.cat !== s.next.vacc) { bad = true; flag(`${sn}: want ${s.next.vacc} got ${got.cat}`, { ...ex, got: got.labels }); }
    const want = maxD(s.next.on, T);
    if (got.on < want) { bad = true; flag(`${sn}: date EARLY`, { ...ex, want, got: got.labels }); }
    else if (days(want, got.on) > 31) { bad = true; flag(`${sn}: date LATE >1 month`, { ...ex, want, got: got.labels }); }
    if (s.next.ppsvOn && got.ppsvOn) { const w = maxD(s.next.ppsvOn, T); if (got.ppsvOn < w) { bad = true; flag(`${sn}: PPSV23 option dated before the repeat rule allows`, { ...ex, want: w, got: got.labels }); } else if (days(w, got.ppsvOn) > 31) { bad = true; flag(`${sn}: PPSV23 option LATE`, { ...ex, want: w, got: got.labels }); } }
  }
  if (!bad) ok++;
}
console.log('patients', n, 'agree', ok, 'problems', n - ok, 'kinds', issues.size);
for (const [k, v] of [...issues].sort((a, b) => b[1].n - a[1].n)) console.log('\n' + v.n + ' × ' + k + '\n   ' + JSON.stringify(v.ex));
