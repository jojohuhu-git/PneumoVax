// Audit 1, second half (2026-11-08): ordinary children a WEEK TO A MONTH either
// side of each age line, plus the 6-week minimum age, checked against an
// INDEPENDENT reading of CDC's own words — read live 2026-11-08 in the browser
// pane with the accordions opened (child notes 61,523 chars; catch-up Table 2's
// pneumococcal row). The first half (1 day either side, 4–5 days short) is in
// the 2026-11-01 grey-zone work; this file does not repeat it.
//
// CDC words this oracle encodes (verbatim fragments):
//   Notes: "minimum age: 6 weeks [PCV15], [PCV 20]; 2 years [PPSV23]"
//          "Healthy children ages 2–4 years with any incomplete* PCV series: 1 dose PCV"
//          At-risk "Age 2–5 years … 3 PCV doses: 1 dose PCV (at least 8 weeks after the
//          most recent PCV dose)"; "Less than 3 PCV doses: 2 doses PCV …"
//          "Age 6–18 years … Not previously received any dose of PCV13, PCV15, or PCV20:
//          administer 1 dose of PCV15 or PCV20"; "Received PCV before age 6 years but have
//          not received PPSV23 … Not previously received PCV20: 1 dose PCV20 or 1 dose PPSV23"
//   Table 2, dose 1→2: "No further doses needed for healthy children if first dose was
//          administered at age 24 months or older / 4 weeks if first dose was administered
//          before the 1st birthday / 8 weeks (as final dose for healthy children) if first
//          dose was administered at the 1st birthday or after"
//   Table 2, dose 2→3: "No further doses needed for healthy children if previous dose was
//          administered at age 24 months or older / 4 weeks if current age is younger than
//          12 months and previous dose was administered at <7 months old / 8 weeks (as final
//          dose for healthy children) if previous dose was administered between 7–11 months
//          (wait until at least 12 months old); OR if current age is 12 months or older and
//          at least 1 dose was administered before age 12 months"
//   Table 2, dose 3→4: "8 weeks (as final dose) This dose is only necessary for children
//          age 12 through 59 months regardless of risk, or age 60 through 71 months with any
//          risk, who received 3 doses before age 12 months."
//   ACIP General Best Practices: doses up to 4 days early count; "The repeat dose should be
//          spaced after the invalid dose by the recommended minimum interval."
//
// Usage: node scripts/ageLineAudit/childLines.mjs "$PWD"   (from the repo root)
const root = process.argv[2];
const { recommend } = await import(root + '/src/logic/recommend.js');
const T = '2026-11-08';
const addM = (iso, m) => { const [y, mo, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, mo - 1 + m, d)).toISOString().slice(0, 10); };
const addD = (iso, n) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);
const maxD = (...xs) => xs.filter(Boolean).sort().at(-1);
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const monthsAt = (dob, iso) => { const [y1, m1, d1] = dob.split('-').map(Number), [y2, m2, d2] = iso.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0); };
const prodFor = (dob) => (dob < '2023-06-01' ? 'PCV13' : 'PCV20');

const WIDE = [-30, -14, -7, 7, 14, 30];
const RISK = { healthy: [], diabetes: ['diabetes'], asplenia: ['asplenia'] };

// Each case: { dob, am, risk, pcv, ppsv, counts:[bool|null], ppsvCounts:[...], next }
// next: 'NONE' | { cat: 'PCV'|'PCV20_OR_PPSV23'|'PPSV23', floor, latest, total? }
//   floor  = the earliest date CDC allows (graded: app must not be earlier)
//   latest = the latest date a reading of CDC could advise (app may be up to 31 days past it)
//   total  = the series total ("of N" on the card), only where CDC states it
const CASES = [];
const add = (line, offset, c) => CASES.push({ line, offset, ...c });

// L1 — 6-week minimum age, first PCV dose. Baby now 3 months, and a baby now 7 weeks.
for (const d of [-14, -7, -5, -4, -1, 0, 7]) {
  const dob = addM(T, -3), dd = addD(dob, 42 + d), counts = 42 + d >= 38;
  add('6 weeks (baby now 3 mo)', d, { dob, am: 3, risk: [], pcv: [{ product: 'PCV20', date: dd }], ppsv: [], counts: [counts],
    next: counts ? { cat: 'PCV', floor: addD(dd, 28), latest: maxD(addD(dd, 28), addM(dob, 4)), total: 4 }
                 : { cat: 'PCV', floor: maxD(addD(dd, 28), addD(dob, 42)), latest: maxD(addD(dd, 28), addM(dob, 2)), total: 4 } });
}
for (const ageDays of [28, 35, 39, 42]) {
  const dob = addD(T, -49), dd = addD(dob, ageDays), counts = ageDays >= 38;
  add('6 weeks (baby now 7 wk)', ageDays - 42, { dob, am: 1, risk: [], pcv: [{ product: 'PCV20', date: dd }], ppsv: [], counts: [counts],
    next: counts ? { cat: 'PCV', floor: addD(dd, 28), latest: maxD(addD(dd, 28), addM(dob, 4)), total: 4 }
                 : { cat: 'PCV', floor: maxD(addD(dd, 28), addD(dob, 42)), latest: maxD(addD(dd, 28), addM(dob, 2)), total: 4 } });
}

// L2 — 7-month line on the PREVIOUS dose (Table 2 dose 2→3). Healthy, now 9 months,
// dose 1 at 5 months, dose 2 a week to a month either side of 7 months.
for (const d of WIDE) {
  const dob = addM(T, -9), d1 = addM(dob, 5), d2 = addD(addM(dob, 7), d);
  const before7 = d < 0;
  add('7 months (dose 2)', d, { dob, am: 9, risk: [], pcv: [{ product: 'PCV20', date: d1 }, { product: 'PCV20', date: d2 }], ppsv: [], counts: [true, true],
    next: before7 ? { cat: 'PCV', floor: addD(d2, 28), latest: addD(d2, 56) }
                  : { cat: 'PCV', floor: maxD(addM(dob, 12), addD(d2, 56)), latest: maxD(addM(dob, 12), addD(d2, 56)), total: 3 } });
}

// L2b — the same 7-month line deciding whether a RECORDED dose counts. Healthy, now 10
// months: dose 1 at 4 months, dose 2 either side of 7 months, dose 3 five weeks after it.
// Previous dose under 7 months → 4 weeks is enough, dose 3 counts, the booster follows at
// 12 months. At 7–11 months → "8 weeks (as final dose) … wait until at least 12 months":
// dose 3 does not count and is repeated at >=12 months, 8 weeks after the dose given.
// (Added after the first mutation run: moving Table 2's 7-month cut to 8 changed nothing
// until this family existed.)
for (const d of WIDE) {
  const dob = addM(T, -10), d1 = addM(dob, 4), d2 = addD(addM(dob, 7), d), d3 = addD(d2, 35);
  if (d3 >= T) continue;
  const counts = d < 0;
  add('7 months (dose 3 five weeks later)', d, { dob, am: 10, risk: [], pcv: [d1, d2, d3].map((date) => ({ product: 'PCV20', date })), ppsv: [], counts: [true, true, counts],
    next: counts ? { cat: 'PCV', floor: maxD(addM(dob, 12), addD(d3, 56)), latest: maxD(addM(dob, 12), addD(d3, 56)), total: 4 }
                 : { cat: 'PCV', floor: maxD(addM(dob, 12), addD(d3, 56)), latest: maxD(addM(dob, 12), addD(d3, 56)) } });
}

// L3 — 12-month line on the FIRST dose (Table 2 dose 1→2). Healthy, now 14 months.
for (const d of WIDE) {
  const dob = addM(T, -14), d1 = addD(addM(dob, 12), d), before = d < 0;
  add('12 months (first dose)', d, { dob, am: 14, risk: [], pcv: [{ product: 'PCV20', date: d1 }], ppsv: [], counts: [true],
    next: before ? { cat: 'PCV', floor: addD(d1, 28), latest: addD(d1, 56), total: 3 }
                 : { cat: 'PCV', floor: addD(d1, 56), latest: addD(d1, 56), total: 2 } });
}

// L4 — 12-month line on the BOOSTER. Healthy, 2/4/6 months, dose 4 either side of the
// first birthday, now 16 months. Below 12 months the 4th dose is an extra infant dose
// (owner ruling 2026-10-23) and the booster is still owed at >=12 months, 8 weeks after
// dose 3 at the least (CDC's dose 3→4 cell); the app may measure from the extra dose.
for (const d of WIDE) {
  const dob = addM(T, -16), p = [2, 4, 6].map((m) => ({ product: 'PCV20', date: addM(dob, m) }));
  const b = addD(addM(dob, 12), d), extra = d < 0;
  add('12 months (booster)', d, { dob, am: 16, risk: [], pcv: [...p, { product: 'PCV20', date: b }], ppsv: [], counts: [true, true, true, extra ? null : true],
    next: extra ? { cat: 'PCV', floor: maxD(addM(dob, 12), addD(p[2].date, 56)), latest: maxD(addM(dob, 12), addD(b, 56)) } : 'NONE' });
}

// L5 — 24-month line on the previous dose, healthy. One dose at 10 months, dose 2 either
// side of 24 months, now 27 months. Before: still incomplete, "Healthy children ages 2–4
// years with any incomplete PCV series: 1 dose PCV". At/after: "No further doses needed".
for (const d of WIDE) {
  const dob = addM(T, -27), d1 = addM(dob, 10), d2 = addD(addM(dob, 24), d);
  add('24 months (healthy, dose 2)', d, { dob, am: 27, risk: [], pcv: [{ product: 'PCV20', date: d1 }, { product: 'PCV20', date: d2 }], ppsv: [], counts: [true, true],
    next: d < 0 ? { cat: 'PCV', floor: addD(d2, 56), latest: addD(d2, 56) } : 'NONE' });
}

// L6 — PPSV23's 2-year minimum age. At-risk child, 4 PCV13 doses, PPSV23 either side of
// 24 months, now 30 months. Too young → it does not count; a repeat is owed at >=24 months
// and (owner 2026-11-01) 8 weeks after the thrown-out PPSV23.
for (const [rn, risk] of [['diabetes', RISK.diabetes], ['asplenia', RISK.asplenia]]) for (const d of WIDE) {
  const dob = addM(T, -30), p = [2, 4, 6, 12].map((m) => ({ product: 'PCV13', date: addM(dob, m) }));
  const pp = addD(addM(dob, 24), d), counts = d >= -4;
  let next;
  if (!counts) next = { cat: 'PCV20_OR_PPSV23', floor: maxD(addM(dob, 24), addD(p[3].date, 56)), latest: maxD(addM(dob, 24), addD(pp, 56)) };
  else if (rn === 'asplenia') next = { cat: 'PCV20_OR_PPSV23', floor: addM(pp, 60), latest: addM(pp, 60) };
  else next = 'NONE';
  add(`2 years (PPSV23, ${rn})`, d, { dob, am: 30, risk, pcv: p, ppsv: [{ product: 'PPSV23', date: pp }], counts: [true, true, true, true], ppsvCounts: [counts], next });
}

// L7 — 5th birthday, healthy, by CURRENT age. (a) two infant doses; (b) three before 12
// months, no booster. Under 5: 1 dose PCV now. 5 or over: nothing.
for (const [hn, ms] of [['2 doses', [2, 4]], ['3 doses', [2, 4, 6]]]) for (const d of WIDE) {
  const dob = addD(addM(T, -60), -d), am = monthsAt(dob, T);
  add(`5 years (healthy, ${hn})`, d, { dob, am, risk: [], pcv: ms.map((m) => ({ product: prodFor(dob), date: addM(dob, m) })), ppsv: [], counts: ms.map(() => true),
    next: d < 0 ? { cat: 'PCV', floor: T, latest: T } : 'NONE' });
}

// L8 — 6th birthday, at risk, by CURRENT age.
// (a) 3 PCV13 doses before 12 months, no booster: under 6, "3 PCV doses: 1 dose PCV";
//     6 or over, "Received PCV before age 6 years but have not received PPSV23 … 1 dose
//     PCV20 or 1 dose PPSV23".
// (b) never vaccinated: under 6, "Less than 3 PCV doses: 2 doses PCV"; 6 or over, "1 dose
//     of PCV15 or PCV20".
for (const [rn, risk] of [['diabetes', RISK.diabetes], ['asplenia', RISK.asplenia]]) for (const d of WIDE) {
  const dob = addD(addM(T, -72), -d), am = monthsAt(dob, T);
  add(`6 years (${rn}, 3 infant doses)`, d, { dob, am, risk, pcv: [2, 4, 6].map((m) => ({ product: 'PCV13', date: addM(dob, m) })), ppsv: [], counts: [true, true, true],
    next: d < 0 ? { cat: 'PCV', floor: T, latest: T } : { cat: 'PCV20_OR_PPSV23', floor: T, latest: T } });
  add(`6 years (${rn}, unvaccinated)`, d, { dob, am, risk, pcv: [], ppsv: [], counts: [],
    next: d < 0 ? { cat: 'PCV', floor: T, latest: T, total: 2 } : { cat: 'PCV', floor: T, latest: T, total: 1 } });
}

// L9 — 19th birthday, chronic condition, 4 infant PCV13, no PPSV23. Child: PCV20 or PPSV23.
// Adult 19–49 chronic: PCV20 or PCV21 (mm7401a1) — graded as PCV.
for (const d of WIDE) {
  const dob = addD(addM(T, -228), -d), am = monthsAt(dob, T);
  add('19 years (diabetes)', d, { dob, am, risk: RISK.diabetes, pcv: [2, 4, 6, 12].map((m) => ({ product: 'PCV13', date: addM(dob, m) })), ppsv: [], counts: [true, true, true, true],
    next: d < 0 ? { cat: 'PCV20_OR_PPSV23', floor: T, latest: T } : { cat: 'PCV', floor: T, latest: T } });
}

function appView(out, dob) {
  const live = out.recs.filter((r) => !['complete', 'no-dose-now', 'not-indicated'].includes(r.status));
  const all = out.recs.map((r) => r.status + ': ' + r.doseLabel + (r.dueToday ? ' @today' : r.earliestNextDate ? ' @' + r.earliestNextDate : '')).join(' || ');
  if (!live.length) return { cat: 'NONE', labels: all };
  const r = live[0];
  const text = live.map((x) => x.doseLabel + ' ' + (x.brands || []).join(',')).join(' || ');
  // A card waiting for the first birthday names the AGE, not a date (settled design;
  // noteFold keeps "not due until the patient reaches 12 months" in view for that reason).
  const at12 = !r.dueToday && !r.earliestNextDate && /reaches 12 months/.test((r.note && r.note.lead) || '');
  const on = r.dueToday ? T : (r.earliestNextDate || (at12 ? addM(dob, 12) : T));
  // A PPSV23 that only follows a PCV15 option is the PCV15 path's second step, not a
  // PPSV23-instead-of-PCV20 choice: CDC's "1 dose of PCV15 or PCV20" for a 6–18 never-vaccinated child.
  const ppsvOnlyAfterPcv15 = live.every((x) => x.vaccine !== 'PPSV23' || /after PCV15/.test(x.doseLabel || ''));
  const cat = r.vaccine === 'PPSV23' ? 'PPSV23' : !ppsvOnlyAfterPcv15 && /PCV20[^]*PPSV23|PPSV23[^]*PCV20/.test(text) ? 'PCV20_OR_PPSV23' : 'PCV';
  const tot = /of (\d+)/.exec(r.doseLabel || '') || (/^(?:Option A: )?1 dose /.test(r.doseLabel || '') ? [0, '1'] : null);
  return { cat, on, total: tot ? Number(tot[1]) : null, labels: all };
}

const issues = new Map(); let ok = 0;
const rows = [];
const flag = (k, ex) => { if (!issues.has(k)) issues.set(k, { n: 0, ex: [] }); const v = issues.get(k); v.n++; if (v.ex.length < 3) v.ex.push(ex); };
for (const c of CASES) {
  const out = recommend({ dob: c.dob, ageMonths: c.am, today: T, riskIds: c.risk, pcvDoses: c.pcv, ppsv23Doses: c.ppsv });
  const ex = { line: c.line, offset: c.offset, dob: c.dob, hist: c.pcv.map((x) => x.product + '@' + x.date).concat(c.ppsv.map((x) => 'PPSV23@' + x.date)).join(' ') };
  let bad = false;
  const counted = (v) => v && v.status === 'valid' && !v.doesNotCount;
  c.counts.forEach((w, i) => { if (w === null) return; const v = out.perDose.pcv[i]; if (counted(v) !== w) { bad = true; flag(`${c.line}: PCV dose ${i + 1} ${w ? 'should COUNT' : 'should NOT count'}`, { ...ex, why: v && v.reasons }); } });
  (c.ppsvCounts || []).forEach((w, i) => { const v = out.perDose.ppsv23[i]; if (counted(v) !== w) { bad = true; flag(`${c.line}: PPSV23 ${w ? 'should COUNT' : 'should NOT count'}`, { ...ex, why: v && v.reasons }); } });
  const got = appView(out, c.dob);
  if (c.next === 'NONE') { if (got.cat !== 'NONE') { bad = true; flag(`${c.line}: CDC says done, app asks for ${got.cat}`, { ...ex, got: got.labels }); } }
  else if (got.cat === 'NONE') { bad = true; flag(`${c.line}: CDC wants ${c.next.cat}, app says done`, { ...ex, got: got.labels }); }
  else {
    if (got.cat !== c.next.cat) { bad = true; flag(`${c.line}: want ${c.next.cat}, got ${got.cat}`, { ...ex, got: got.labels }); }
    const floor = maxD(c.next.floor, T), latest = maxD(c.next.latest, T);
    if (got.on < floor) { bad = true; flag(`${c.line}: date EARLIER than CDC allows`, { ...ex, floor, got: got.labels }); }
    else if (days(latest, got.on) > 31) { bad = true; flag(`${c.line}: date more than a month LATER than CDC`, { ...ex, latest, got: got.labels }); }
    if (c.next.total && got.total !== c.next.total) { bad = true; flag(`${c.line}: series total ${c.next.total} by CDC, card says ${got.total}`, { ...ex, got: got.labels }); }
  }
  rows.push([c.line, c.offset, bad ? 'PROBLEM' : 'agree', got.labels].join('\t'));
  if (!bad) ok++;
}
if (process.argv.includes('--rows')) console.log(rows.join('\n'));
console.log('patients', CASES.length, 'agree', ok, 'problems', CASES.length - ok, 'kinds', issues.size);
for (const [k, v] of [...issues].sort((a, b) => b[1].n - a[1].n)) { console.log('\n' + v.n + ' × ' + k); for (const e of v.ex) console.log('   ' + JSON.stringify(e)); }
