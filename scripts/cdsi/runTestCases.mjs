// ─────────────────────────────────────────────────────────────────────────
// runTestCases.mjs — run CDC's CDSI pneumococcal test patients through
// PneumoVax and say, patient by patient, where the two agree.
//
// A MEASUREMENT, NOT A TEST. CDSI is CDC's machine-readable version of ACIP's
// rules and runs behind them; where CDSI and CDC/ACIP wording differ, the
// wording wins (owner rules 2026-08-10 and 2026-10-17). So a disagreement here
// is a question to look at, never a bug by itself.
//
// Input: cdc-files/pneumo-test-cases.json, made from CDC's two workbooks by
// extractTestCases.py. Each patient is run with "today" set to CDC's own
// Assessment_Date, because CDC writes its test dates relative to that day.
//
// Run:  npx vite-node scripts/cdsi/runTestCases.mjs            (summary + every disagreement)
//       npx vite-node scripts/cdsi/runTestCases.mjs --all      (every patient)
//       npx vite-node scripts/cdsi/runTestCases.mjs --json out.json
// ─────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from 'node:fs';

const R = new URL('../../src', import.meta.url).pathname;
const { recommend } = await import(`${R}/logic/recommend.js`);
const CASES = JSON.parse(readFileSync(new URL('./cdc-files/pneumo-test-cases.json', import.meta.url), 'utf8'));

// CDC's vaccine codes (CVX) → this app's product names.
const CVX = { 100: 'PCV7', 133: 'PCV13', 215: 'PCV15', 216: 'PCV20', 327: 'PCV21', 33: 'PPSV23' };

// CDC's condition codes → this app's checkboxes. Each choice is written down
// because it is a judgement, not a lookup; the summary prints any code that
// had no box so nothing is dropped silently.
const RISK = {
  '010': 'csf_leak', '011': 'cochlear_implant', '014': 'diabetes',
  '253': 'chronic_lung',              // moderate/severe persistent asthma (the child wording)
  '042': 'smoking', '043': 'alcoholism',
  '145': 'immunodeficiency',          // severe antibody deficiency
  '151': 'immunodeficiency',          // complement deficiency
  '156': 'immunosuppression',         // generalized malignancy (app's sublabel lists it)
  '178': 'immunosuppression', '179': 'immunosuppression', '180': 'immunosuppression', '181': 'immunosuppression',
  '216': 'immunosuppression',         // iatrogenic immunosuppression
  '157': 'solid_organ_transplant', '160': 'asplenia', '186': 'hiv',
  '161': 'ckd_chronic',               // CDSI puts 161 in its chronic (non-IC) series
  '167': 'ckd_advanced',              // nephrotic syndrome
};
// 027 "Asthma": CDSI counts it only in its 19+ series; a child needs 253.
const ADULT_ONLY_CODES = { '027': 'chronic_lung' };
const NO_BOX = { '094': 'severe allergic reaction to a previous pneumococcal dose (a contraindication; the app has no such input)' };

const ageYears = (dob, d) => {
  const b = new Date(dob + 'T00:00:00Z'), t = new Date(d + 'T00:00:00Z');
  let y = t.getUTCFullYear() - b.getUTCFullYear();
  if (t.getUTCMonth() < b.getUTCMonth() || (t.getUTCMonth() === b.getUTCMonth() && t.getUTCDate() < b.getUTCDate())) y -= 1;
  return y;
};
const ageText = (dob, d) => {
  const b = new Date(dob + 'T00:00:00Z'), t = new Date(d + 'T00:00:00Z');
  let m = (t.getUTCFullYear() - b.getUTCFullYear()) * 12 + t.getUTCMonth() - b.getUTCMonth();
  if (t.getUTCDate() < b.getUTCDate()) m -= 1;
  return m < 24 ? `${m} mo` : `${Math.floor(m / 12)} y`;
};

const DONE = new Set(['complete', 'not-indicated']);

// Every disagreement found on the first full run (2026-11-08), sorted into
// families. A re-run prints any patient NOT listed here as NEW, which is the
// line to read after CDC publishes new test cases or the app changes.
// DELIBERATE = the app follows CDC/ACIP wording or an owner ruling over CDSI.
// OPEN = not yet decided; see docs/archive/report-2026-11-08-cdsi-test-patients.md.
const KNOWN = {
  'PCV7 never counts (owner, 2026-10-12); CDSI counts PCV7 — DELIBERATE':
    ['2013-0577', '2013-0594', '2013-0595', '2013-0601', '2013-0619'],
  'Repeat of an invalid dose is spaced from that dose (Ruling D, ACIP General Best Practices) — DELIBERATE':
    ['2013-0596'],
  'Advised date is 8 weeks for a 7–11-month child, minimum stated beside it (C10-2) — DELIBERATE':
    ['2013-0624'],
  'Dose 3 after a dose at 7–11 months needs 8 weeks as final dose (CDC Catch-up Table 2); same end result — DELIBERATE':
    ['2013-0612', '2013-0613', '2013-0614'],
  'Adult PCV20/21 is 5 years after the LAST dose (CDC adult notes); CDSI 4.65 data agrees, these test patients predate it — DELIBERATE':
    ['2016-UC-0165', '2016-UC-0173', '2016-UC-0178'],
  'Healthy adult under 50 with an old PPSV23: app says not indicated now, CDSI forecasts at 50 — same advice':
    ['2024-0102'],
  'Calendar: 6 months after May 31 is Nov 30 in the app, Dec 1 in CDSI — 1 day':
    ['2013-0580'],
  'Contraindication (severe allergic reaction): the app has no such input — NOT COMPARABLE':
    ['2016-UC-0014'],
  'A dose 5+ days before the 1st birthday after 3 infant doses is an extra infant dose (owner 2026-10-23); CDSI calls it too young. Same booster, same date (CDSI finding 2 fixed 2026-11-08) — DELIBERATE':
    ['2013-0598'],
  // Finding 5, settled 2026-11-09: the owner's "Sofia" ruling (2026-10-30, CLINICAL_SPEC.md §C-P2),
  // reconfirmed on this patient — "keep PCV20". CDC's immunocompromised row for PCV13 + PPSV23 at
  // 6–18 still orders a dose after the conjugate; the "no further doses" wording is the
  // non-immunocompromised list's. CDSI 4.65 builds a PPSV-PPSV-PCV series that ends at the conjugate.
  'IC child 6–18, both PPSV23 BEFORE the conjugate: PCV20 still owed (owner "Sofia" 2026-10-30, reconfirmed 2026-11-09); CDSI calls it complete — DELIBERATE':
    ['2016-UC-0171'],
};
const familyOf = (id) => Object.entries(KNOWN).filter(([, ids]) => ids.includes(id)).map(([f]) => f);

function run(c) {
  const today = c.assessmentDate;
  const riskIds = [], unmapped = [];
  for (const o of c.observations) {
    if (RISK[o.code]) riskIds.push(RISK[o.code]);
    else if (ADULT_ONLY_CODES[o.code]) { if (ageYears(c.dob, today) >= 19) riskIds.push(ADULT_ONLY_CODES[o.code]); }
    else unmapped.push(`${o.code} ${NO_BOX[o.code] ?? o.text}`);
  }
  const pcvIn = [], ppsvIn = [];
  c.doses.forEach((d, i) => {
    const product = CVX[Number(d.cvx)];
    if (!product) { unmapped.push(`CVX ${d.cvx} ${d.name}`); return; }
    (product === 'PPSV23' ? ppsvIn : pcvIn).push({ i, product, date: d.date });
  });
  const r = recommend({
    dob: c.dob, riskIds: [...new Set(riskIds)], today,
    pcvDoses: pcvIn.map(({ product, date }) => ({ product, date })),
    ppsv23Doses: ppsvIn.map(({ product, date }) => ({ product, date })),
  });

  // ── Per dose: does it count? ──
  const app = [];
  pcvIn.forEach((d, k) => { app[d.i] = r.perDose?.pcv?.[k]; });
  ppsvIn.forEach((d, k) => { app[d.i] = r.perDose?.ppsv23?.[k]; });
  const doseRows = c.doses.map((d, i) => {
    const a = app[i];
    const appCounts = a ? a.status === 'valid' : null;
    const cdsiCounts = /^valid$/i.test(d.status);
    return { n: i + 1, product: CVX[Number(d.cvx)] ?? d.cvx, date: d.date, age: ageText(c.dob, d.date),
      cdsi: d.status + (d.reason ? ` (${d.reason})` : ''), app: a ? `${a.status}/${a.disposition}` : '—',
      appReason: a?.reasons?.join(' ') ?? '', agree: appCounts === cdsiCounts };
  });

  // ── The patient: complete, or what is next and when? ──
  const recs = r.recs ?? [];
  const open = recs.filter((x) => !DONE.has(x.status));
  let appState, appDate = null;
  if (r.excluded) appState = 'stopped (transplant box)';
  else if (open.length === 0) appState = 'complete';
  else if (open.every((x) => x.status === 'shared-decision')) appState = 'shared decision only';
  else {
    appState = 'not complete';
    // A card may state an AGE instead of a date ("not due until the patient
    // reaches 12 months"); turn that age into the birthday it names.
    const dateOf = (x) => {
      if (x.dueToday) return today;
      if (x.earliestNextDate) return x.earliestNextDate;
      const m = /reaches (\d+) months/.exec(x.note?.lead ?? '');
      if (!m) return null;
      const b = new Date(c.dob + 'T00:00:00Z');
      b.setUTCMonth(b.getUTCMonth() + Number(m[1]));
      return b.toISOString().slice(0, 10);
    };
    const dates = open.filter((x) => x.status !== 'shared-decision').map(dateOf).filter(Boolean).sort();
    appDate = dates[0] ?? null;
  }
  const cdsiComplete = /^complete$/i.test(c.seriesStatus);
  const cdsiState = cdsiComplete ? 'complete' : /contra/i.test(c.seriesStatus) ? 'contraindicated' : 'not complete';

  let forecast;
  if (cdsiState === 'contraindicated') forecast = 'NOT COMPARABLE (contraindication)';
  else if (cdsiComplete || appState !== 'not complete') {
    // CDC: after a shared-decision dose is discussed, "their pneumococcal
    // vaccinations are complete" either way — so it agrees with "complete".
    const appDone = appState === 'complete' || appState === 'shared decision only';
    forecast = cdsiComplete === appDone ? 'AGREE' : 'DIFFERENT: series status';
  } else if (!appDate) forecast = 'DIFFERENT: app gives no date';
  else {
    const due = (d) => (d <= today ? today : d); // a date already passed means "due now"
    const appD = due(appDate), rec = due(c.recommended), earl = due(c.earliest);
    if (appD === rec) forecast = 'AGREE';
    else if (appD === earl) forecast = 'AGREE on earliest date';
    else if (appD < earl) forecast = 'DIFFERENT: app earlier than CDSI earliest';
    else if (c.pastDue && appD >= due(c.pastDue)) forecast = 'DIFFERENT: app at/after CDSI past-due';
    else forecast = appD < rec ? 'DIFFERENT: app between CDSI earliest and recommended' : 'DIFFERENT: app later than CDSI recommended';
  }

  return {
    id: c.id, source: c.source, name: c.name, dob: c.dob, today, ageToday: ageText(c.dob, today),
    risks: c.observations.map((o) => `${o.code} ${o.text}`), riskIds, unmapped,
    doses: doseRows, dosesAgree: doseRows.every((d) => d.agree),
    cdsi: { state: cdsiState, forecastNum: c.forecastNum, earliest: c.earliest, recommended: c.recommended, pastDue: c.pastDue, guidance: c.guidance },
    app: { state: appState, date: appDate, cards: recs.map((x) => `${x.vaccine} ${x.status}${x.dueToday ? ' due today' : x.earliestNextDate ? ' from ' + x.earliestNextDate : ''} — ${x.doseLabel ?? ''} [${(x.brands ?? []).join(', ')}]`) },
    forecast,
  };
}

const results = CASES.map(run);
const args = process.argv.slice(2);
const showAll = args.includes('--all');
const jsonAt = args.indexOf('--json');
if (jsonAt >= 0) writeFileSync(args[jsonAt + 1], JSON.stringify(results, null, 1) + '\n');

const print = (x) => {
  console.log(`\n${x.id} [${x.source}] ${x.name}`);
  console.log(`  born ${x.dob}, assessed ${x.today} (${x.ageToday}); risks: ${x.risks.join('; ') || 'none'} → ${x.riskIds.join(', ') || 'none'}${x.unmapped.length ? '  ⚠ no box: ' + x.unmapped.join('; ') : ''}`);
  for (const d of x.doses) console.log(`  ${d.agree ? '  ' : '✗ '}dose ${d.n} ${d.product} ${d.date} (${d.age}): CDSI ${d.cdsi} | app ${d.app}${!d.agree && d.appReason ? ' — ' + d.appReason.slice(0, 160) : ''}`);
  console.log(`  CDSI: ${x.cdsi.state}${x.cdsi.state === 'not complete' ? ` — dose ${x.cdsi.forecastNum}, earliest ${x.cdsi.earliest}, recommended ${x.cdsi.recommended}, past due ${x.cdsi.pastDue}` : ''}`);
  console.log(`  app : ${x.app.state}${x.app.date ? ' — next ' + x.app.date : ''}`);
  for (const card of x.app.cards) console.log(`        ${card}`);
  console.log(`  → doses ${x.dosesAgree ? 'AGREE' : 'DIFFERENT'}; next step ${x.forecast}`);
  const fam = familyOf(x.id);
  if (!x.dosesAgree || !x.forecast.startsWith('AGREE')) console.log(`  → ${fam.length ? 'known: ' + fam.join(' + ') : '⚠ NEW — not in the known list'}`);
};
const differs = (x) => !x.dosesAgree || !x.forecast.startsWith('AGREE');
for (const x of results) if (showAll || differs(x)) print(x);

const count = (f) => results.filter(f).length;
const allDoses = results.flatMap((x) => x.doses);
console.log('\n══ SUMMARY ══');
console.log(`patients ${results.length}: both agree ${count((x) => x.dosesAgree && x.forecast.startsWith('AGREE'))}`);
console.log(`doses ${allDoses.length}: agree ${allDoses.filter((d) => d.agree).length}, differ ${allDoses.filter((d) => !d.agree).length}`);
const tally = {};
for (const x of results) tally[x.forecast] = (tally[x.forecast] ?? 0) + 1;
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`next step — ${k}: ${v}`);
console.log('\nby family (a patient can sit in two):');
for (const [f, ids] of Object.entries(KNOWN)) {
  const hit = results.filter((x) => ids.includes(x.id) && differs(x)).length;
  console.log(`  ${hit}/${ids.length}  ${f}`);
}
const fresh = results.filter((x) => differs(x) && familyOf(x.id).length === 0);
const healed = Object.values(KNOWN).flat().filter((id) => { const x = results.find((y) => y.id === id); return x && !differs(x); });
console.log(`NEW disagreements (not in the known list): ${fresh.length}${fresh.length ? ' — ' + fresh.map((x) => x.id).join(', ') : ''}`);
console.log(`listed as known but now agreeing (remove from the list): ${healed.length}${healed.length ? ' — ' + [...new Set(healed)].join(', ') : ''}`);
const um = results.filter((x) => x.unmapped.length);
console.log(`patients with a CDC code the app has no box for: ${um.length}${um.length ? ' (' + um.map((x) => x.id).join(', ') + ')' : ''}`);
