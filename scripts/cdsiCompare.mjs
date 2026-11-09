// Measurement (not yet a test), first run 2026-11-08: PneumoVax's minimum ages and gaps against CDSI 4.65.
// CDSI values below were read from supporting-data-4.65 (pneumococcal XML) the same day;
// children's rows are identical in 4.64 (on disk). Nothing in src/ is changed.
const R = new URL('../src', import.meta.url).pathname;
const { DOSE_INTERVAL_RULES } = await import(`${R}/logic/doseIntervalRules.js`);
const I = await import(`${R}/logic/intervals.js`);
const B = await import(`${R}/data/brands.js`);
const { ruleGap } = await import(`${R}/data/rulebook.js`);

const out = [];
const row = (what, cdsi, app, verdict) => out.push({ what, cdsi, app, verdict });
const same = (a, b) => (a === b ? 'AGREE' : 'DIFFERENT');

// ── A. Minimum ages, with CDC's 4-day grace ─────────────────────────────
row('PCV dose 1 minimum age (days)', '6 weeks = 42, valid from 38', `${B.PCV_MIN_AGE_DAYS}`, same(B.PCV_MIN_AGE_DAYS, 42));
row('PCV dose 1 given at 38 days (4 early)', 'valid (grace)', String(I.ageMeetsMinimumDays(38, 42)), same(I.ageMeetsMinimumDays(38, 42), true));
row('PCV dose 1 given at 37 days (5 early)', 'not valid', String(I.ageMeetsMinimumDays(37, 42)), same(I.ageMeetsMinimumDays(37, 42), false));

// ── B. Infant conjugate gaps (CDC Catch-up Table 2 / CDSI infant series) ─
const pcv = (p) => I.pcvNextDoseMinIntervalDays(p);
const cases = [
  ['dose 2, dose 1 at 3 mo', '4 weeks (4-dose series D2)', 28, { doseNumber: 2, ageAtPrevDose: 3, currentAgeMonths: 4, anyDoseBefore12: true }],
  ['dose 2, dose 1 at 13 mo', '8 weeks (start-at-12-months D2)', 56, { doseNumber: 2, ageAtPrevDose: 13, currentAgeMonths: 15, anyDoseBefore12: false }],
  ['dose 3 at 5 mo, dose 2 at 4 mo', '4 weeks (4-dose series D3)', 28, { doseNumber: 3, ageAtPrevDose: 4, currentAgeMonths: 5, anyDoseBefore12: true }],
  ['dose 4 at 12 mo, dose 3 at 6 mo', '8 weeks (4-dose series D4)', 56, { doseNumber: 4, ageAtPrevDose: 6, currentAgeMonths: 12, anyDoseBefore12: true, ageAtThisDose: 12 }],
];
for (const [what, cdsi, want, p] of cases) { const got = pcv(p); row(`PCV gap: ${what}`, cdsi, `${got} days`, same(got, want)); }
row('PCV gap 24 days vs 28 (4 short)', 'valid (grace)', String(I.intervalMeetsMinimum(24, 28)), same(I.intervalMeetsMinimum(24, 28), true));
row('PCV gap 23 days vs 28 (5 short)', 'not valid', String(I.intervalMeetsMinimum(23, 28)), same(I.intervalMeetsMinimum(23, 28), false));

// ── C. Every rule row: does a short gap void the dose? ──────────────────
// CDSI "floor" = absMinInt above 0. Children's risk series, read 2026-11-08:
//   2-5 chronic: PCV->PPSV 8w-4d, PPSV->PCV 8w-4d, PCV->PCV 8w-4d
//   2-5 4-dose (IC): PCV->PPSV 0 days, PPSV->PPSV 5 years 0 days
//   6-18 (all four series): every gap 0 days
//   every adult (19+/50+) gap: 0 days (38 of 38)
const CDSI_CHILD = {
  'CHILD-PPSV23-AFTER-PCV': '2-5 chronic: floor 8w. 2-5 IC and 6-18: no floor',
  'CHILD-PCV-AFTER-PPSV23': '2-5 chronic: floor 8w. 6-18: no floor',
  'CHILD-PPSV23-AFTER-PPSV23': 'no floor (5 years, 0 days)',
  'CHILD-PPSV23-AFTER-INVALID-PPSV23': 'no floor (5 years, 0 days)',
  'CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST': 'no floor (5 years, 0 days)',
};
for (const r of DOSE_INTERVAL_RULES) {
  const isFloor = r.enforcement === 'floor';
  if (r.rulebook === 'adult') {
    row(`rule ${r.id}`, 'no floor (0 days)', `${r.enforcement}, ${ruleGap(r)}`, isFloor ? 'DIFFERENT' : 'AGREE');
  } else if (r.id === 'CHILD-PCV-AFTER-PCV') {
    row(`rule ${r.id}`, 'floor (4w/8w - 4 days)', `${r.enforcement}`, isFloor ? 'AGREE' : 'DIFFERENT');
  } else if (CDSI_CHILD[r.id]) {
    const cdsi = CDSI_CHILD[r.id];
    const v = /no floor \(/.test(cdsi) && !/floor 8w/.test(cdsi)
      ? (isFloor ? 'DIFFERENT' : 'AGREE')
      : (isFloor ? 'PARTLY (agrees 2-5 chronic only)' : 'PARTLY');
    row(`rule ${r.id}`, cdsi, `${r.enforcement}, ${ruleGap(r)}, authority ${r.authority}`, v);
  } else {
    row(`rule ${r.id}`, '(no mapping written)', `${r.enforcement}`, 'NOT COMPARED');
  }
}

for (const o of out) console.log(`${o.verdict.padEnd(34)} | ${o.what} | CDSI: ${o.cdsi} | app: ${o.app}`);
const n = (v) => out.filter((o) => o.verdict.startsWith(v)).length;
console.log(`\nAGREE ${n('AGREE')}  DIFFERENT ${n('DIFFERENT')}  PARTLY ${n('PARTLY')}  NOT COMPARED ${n('NOT COMPARED')}  of ${out.length}`);
