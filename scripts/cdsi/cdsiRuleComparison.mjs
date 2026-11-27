// ─────────────────────────────────────────────────────────────────────────
// cdsiRuleComparison.mjs — PneumoVax's ages and gaps held against CDC's CDSI
// rule file, number by number (P-CDSI-1, 2026-11-27).
//
// Replaces the 2026-11-08 measurement, whose CDSI numbers were copied in by
// hand. Every CDSI value here is READ from the file
// (cdc-files/AntigenSupportingData-Pneumococcal-<version>.xml) through
// cdsiRules.mjs, by the name CDC gives the rule; a rule CDC renames or drops
// throws, so nothing can quietly fall out of the comparison.
//
// Two callers:
//   - cdsiCompare.mjs prints it for a person;
//   - src/logic/__tests__/cdsi-rule-comparison.test.js makes it binding.
//
// CDSI is CDC's machine-readable version of ACIP's rules and runs behind
// them; where CDSI and CDC/ACIP wording differ, the wording wins (owner rules
// 2026-08-10 and 2026-10-17). So the app is NOT required to agree. It is
// required to NAME every difference in DIFFERENCES below, with one of:
//   wording — the app follows CDC/ACIP wording that CDSI does not encode
//   owner   — the app follows a dated owner ruling
// and the exact CDSI and app values the difference was approved at, so a new
// CDSI release or an engine change that moves either side fails the test.
// ─────────────────────────────────────────────────────────────────────────
import { readCdsiFacts, duration } from './cdsiRules.mjs';
import { DOSE_INTERVAL_RULES } from '../../src/logic/doseIntervalRules.js';
import * as I from '../../src/logic/intervals.js';
import * as B from '../../src/data/brands.js';
import { ruleGap } from '../../src/data/rulebook.js';
import { recommend } from '../../src/logic/recommend.js';
import { addDays, addCalendarMonths } from '../../src/logic/dateUtils.js';

const facts = readCdsiFacts();
const P = 'PNEUMO · Pneumococcal ';

/** The value CDC wrote for one named rule. Throws if CDC has no such rule. */
export function fact(name) {
  const f = facts.get(P + name);
  if (!f) throw new Error(`CDSI has no rule named "${name}" — renamed or dropped in a new release?`);
  return f;
}
/** "absolute minimum X; minimum Y; …" → the absolute minimum (the floor), parsed. */
const absOf = (name) => {
  const f = fact(name);
  if (f.abs) return f.abs;
  return duration(f.value);
};
const isFloor = (d) => !!d && !d.complex && d.n > 0;
const inDays = (d) => (d.unit === 'days' ? d.n : d.unit === 'weeks' ? d.n * 7 : null);
const g = (d) => d.text;

// ── A synthetic patient, for the rules the app applies inside the engine ──
// (minimum age for PPSV23, PCV21, PCV7). Dates are fixed; "today" is passed,
// so the clock never enters.
const TODAY = '2026-11-27';
function gradeDose({ dob, riskIds = [], pcvDoses = [], ppsv23Doses = [] }, stream, k) {
  const r = recommend({ dob, today: TODAY, riskIds, pcvDoses, ppsv23Doses });
  const d = r.perDose?.[stream]?.[k];
  return d ? `${d.status === 'valid' ? 'counts' : 'does not count'} (${d.disposition})` : 'not graded';
}
const BABY = '2020-01-15';
const babyAt = (m, days = 0) => addDays(addCalendarMonths(BABY, m), days);
const BABY_PCV4 = [2, 4, 6, 12].map((m) => ({ product: 'PCV20', date: babyAt(m) }));

// ── The comparisons ──────────────────────────────────────────────────────
// Each: { id, what, cdsi, app, agree, facts: [rule names read] }.
export function allComparisons() {
  const out = [];
  const add = (id, what, factNames, cdsi, app, agree) => out.push({ id, what, facts: factNames, cdsi, app, agree });

  // A. Minimum ages ─────────────────────────────────────────────────────
  // PCV doses 1–3 (§A-DOSEAGE, ACIP GBP Table 3-2): 6, 10, 14 weeks, with
  // CDC's 4-day grace. CDSI prints them in both infant series.
  for (const n of [1, 2, 3]) {
    const names = ['4-dose series', 'dose 2 at 7 months series'].map((s) => `${s} · Dose ${n} · absolute minimum age`);
    const ds = names.map(absOf);
    const days = ds.map(inDays);
    const appDays = B.pcvMinAgeDaysForDose(n);
    const agree = days.every((d) => d === appDays) && ds.every((d) => d.graceDays === I.GRACE_DAYS)
      && I.ageMeetsMinimumDays(appDays - I.GRACE_DAYS, appDays) && !I.ageMeetsMinimumDays(appDays - I.GRACE_DAYS - 1, appDays);
    add(`AGE-PCV-D${n}`, `PCV dose ${n} minimum age`, names, ds.map(g).join(' | '),
      `${appDays} days, grace ${I.GRACE_DAYS} days`, agree);
  }
  // PPSV23: CDSI's allowable PPSV23 age in every child series is "2 years - 4 days".
  {
    const ppsvAllow = [...facts.values()].filter((f) => f.cvx === '33' && f.kind === 'allowable' && !/19\+|50\+/.test(f.series));
    const begins = [...new Set(ppsvAllow.map((f) => f.begin?.text))];
    const at4 = gradeDose({ dob: BABY, riskIds: ['asplenia'], pcvDoses: BABY_PCV4, ppsv23Doses: [{ product: 'PPSV23', date: babyAt(24, -4) }] }, 'ppsv23', 0);
    const at5 = gradeDose({ dob: BABY, riskIds: ['asplenia'], pcvDoses: BABY_PCV4, ppsv23Doses: [{ product: 'PPSV23', date: babyAt(24, -5) }] }, 'ppsv23', 0);
    add('AGE-PPSV23', 'PPSV23 minimum age (child with asplenia, full PCV series)',
      ppsvAllow.map((f) => f.key.slice(P.length)), `allowable from ${begins.join(' / ')} (${ppsvAllow.length} child series doses)`,
      `minAgeM ${B.PPSV23_PRODUCT.minAgeM}; 4 days before 2nd birthday ${at4}; 5 days before ${at5}`,
      begins.length === 1 && begins[0] === '2 years - 4 days' && B.PPSV23_PRODUCT.minAgeM === 24 && /^counts/.test(at4) && /^does not count/.test(at5));
  }
  // PCV21: CDSI allows it only in its 19+ series, from "19 years - 4 days".
  {
    const p21 = [...facts.values()].filter((f) => f.cvx === '327');
    const begins = [...new Set(p21.map((f) => f.begin?.text))];
    const at18 = gradeDose({ dob: '2007-01-15', riskIds: ['asplenia'], pcvDoses: [{ product: 'PCV21', date: '2025-07-15' }] }, 'pcv', 0);
    add('AGE-PCV21', 'PCV21 (Capvaxive) given at 18 years 6 months to a teen with asplenia',
      p21.map((f) => f.key.slice(P.length)), `allowed only in 19+ series, from ${begins.sort().join(' / ')}`,
      `minAgeM ${B.productMinAgeM('PCV21')} (licence, 18 years); dose at 18y6m ${at18}`,
      /^does not count/.test(at18));
  }
  // PCV7 (CVX 100): CDSI lists it as an allowable conjugate.
  {
    const p7 = [...facts.values()].filter((f) => f.cvx === '100');
    const got = gradeDose({ dob: BABY, pcvDoses: [{ product: 'PCV7', date: babyAt(2) }] }, 'pcv', 0);
    add('PCV7-COUNTS', 'A PCV7 dose given at 2 months', p7.map((f) => f.key.slice(P.length)),
      `allowable (${p7.length} infant series doses, from ${[...new Set(p7.map((f) => f.begin?.text))].join(' / ')})`,
      `PCV7 at 2 months ${got}`, /^counts/.test(got));
  }

  // B. Infant conjugate gaps — CDC Catch-up Table 2 / CDSI infant series ──
  const pcvGap = (p) => I.pcvNextDoseMinIntervalDays(p);
  const gapCases = [
    ['GAP-PCV-D2', 'PCV dose 2, dose 1 at 3 months', ['4-dose series · Dose 2 · gap from previous dose'], { doseNumber: 2, ageAtPrevDose: 3, currentAgeMonths: 4, anyDoseBefore12: true }],
    ['GAP-PCV-D3', 'PCV dose 3 at 5 months, dose 2 at 4 months', ['4-dose series · Dose 3 · gap from previous dose'], { doseNumber: 3, ageAtPrevDose: 4, currentAgeMonths: 5, anyDoseBefore12: true }],
    ['GAP-PCV-D3-AFTER-7-11', 'PCV dose 3 at 9 months, dose 2 at 8 months', ['dose 2 at 7 months series · Dose 3 · gap from previous dose'], { doseNumber: 3, ageAtPrevDose: 8, currentAgeMonths: 9, anyDoseBefore12: true }],
    ['GAP-PCV-D4', 'PCV dose 4 at 12 months, dose 3 at 6 months', ['4-dose series · Dose 4 · gap from previous dose', 'dose 2 at 7 months series · Dose 4 · gap from previous dose'], { doseNumber: 4, ageAtPrevDose: 6, currentAgeMonths: 12, anyDoseBefore12: true, ageAtThisDose: 12 }],
    ['GAP-PCV-D5', 'PCV dose 5 at 14 months, dose 4 at 12 months', ['4-dose series · Dose 5 · gap from previous dose', 'dose 2 at 7 months series · Dose 5 · gap from previous dose'], { doseNumber: 5, ageAtPrevDose: 12, currentAgeMonths: 14, anyDoseBefore12: true, ageAtThisDose: 14 }],
    ['GAP-PCV-START12-D2', 'PCV dose 2, dose 1 at 13 months', ['start at 12 months series · Dose 2 · gap from previous dose'], { doseNumber: 2, ageAtPrevDose: 13, currentAgeMonths: 15, anyDoseBefore12: false }],
    ['GAP-PCV-START12-D3', 'PCV dose 3, dose 2 at 13 months, none before 12', ['start at 12 months series · Dose 3 · gap from previous dose'], { doseNumber: 3, ageAtPrevDose: 13, currentAgeMonths: 15, anyDoseBefore12: false }],
  ];
  for (const [id, what, names, p] of gapCases) {
    const ds = names.map(absOf);
    const got = pcvGap(p);
    add(id, what, names, ds.map(g).join(' | '), `${got} days, grace ${I.GRACE_DAYS} days`,
      ds.every((d) => inDays(d) === got && d.graceDays === I.GRACE_DAYS));
  }
  // The grace on a gap, both sides of its edge.
  add('GAP-GRACE', 'A 4-week gap given 4 days short, and 5 days short', ['4-dose series · Dose 2 · gap from previous dose'],
    g(absOf('4-dose series · Dose 2 · gap from previous dose')),
    `24 days ${I.intervalMeetsMinimum(24, 28) ? 'counts' : 'does not count'}; 23 days ${I.intervalMeetsMinimum(23, 28) ? 'counts' : 'does not count'}`,
    I.intervalMeetsMinimum(24, 28) && !I.intervalMeetsMinimum(23, 28));

  // C. Every row of the app's rule table: does a short gap void the dose? ─
  // CDSI "floor" = an absolute minimum interval above 0 days.
  for (const r of DOSE_INTERVAL_RULES) {
    const appFloor = r.enforcement === 'floor';
    const app = `${r.enforcement}, ${ruleGap(r)}`;
    if (r.rulebook === 'adult') {
      const names = adultGapFacts();
      const floors = names.filter((n) => isFloor(absOf(n)));
      add(`RULE ${r.id}`, r.what, names, floors.length ? `floors in ${floors.length} of ${names.length} adult gaps` : `no floor in any of CDSI's ${names.length} adult gaps (all 0 days)`,
        app, !appFloor && floors.length === 0);
      continue;
    }
    const names = CHILD_RULE_FACTS[r.id];
    if (!names) throw new Error(`rule ${r.id} has no CDSI mapping — add it to CHILD_RULE_FACTS`);
    const floors = names.filter((n) => isFloor(absOf(n)));
    const cdsi = floors.length === names.length ? `floor in all ${names.length}`
      : floors.length === 0 ? `no floor in any of ${names.length}`
        : `floor in ${floors.length} of ${names.length}: ${floors.map((n) => n.replace(/ · .*/, '')).join('; ')}`;
    add(`RULE ${r.id}`, r.what, names, cdsi, app, appFloor ? floors.length === names.length : floors.length === 0);
  }
  return out;
}

// Which CDSI rules each child row of the app's table corresponds to. Written
// from the series names: PPSV-after-PCV is every PPSV23 dose whose previous
// dose is a conjugate, and so on.
export const CHILD_RULE_FACTS = {
  'CHILD-PCV-AFTER-PCV': [
    '4-dose series · Dose 2 · gap from previous dose', '4-dose series · Dose 3 · gap from previous dose',
    '4-dose series · Dose 4 · gap from previous dose', 'start at 12 months series · Dose 2 · gap from previous dose',
    'risk 2-5 years Chronic Medical Conditions PCV-PCV-PPSV series · Dose 2 · gap from previous dose',
    'risk 2-5 years Chronic Medical Conditions PPSV-PCV-PCV series · Dose 3 · gap from previous dose',
    'risk 2-5 years 4-dose series · Dose 2 · gap from previous dose',
  ],
  'CHILD-PPSV23-AFTER-PCV': [
    'risk 2-5 years Chronic Medical Conditions PCV-PCV-PPSV series · Dose 3 · gap from previous dose',
    'risk 2-5 years Chronic Medical Conditions PCV-PPSV-PCV series · Dose 2 · gap from previous dose',
    'risk 2-5 years 4-dose series · Dose 3 · gap from previous dose',
    'risk 6-18 years 2-dose PCV-PPSV series · Dose 2 · gap from previous dose',
    'risk 6-18 yrs immunocompromised PCV-PPSV-PPSV · Dose 2 · gap from previous dose',
    'risk 6-18 years immunocompromised PPSV-PCV-PPSV series · Dose 3 · gap from previous dose',
  ],
  'CHILD-PCV-AFTER-PPSV23': [
    'risk 2-5 years Chronic Medical Conditions PPSV-PCV-PCV series · Dose 2 · gap from previous dose',
    'risk 2-5 years Chronic Medical Conditions PCV-PPSV-PCV series · Dose 3 · gap from previous dose',
    'risk 6-18 years 2-dose PPSV-PCV series · Dose 2 · gap from previous dose',
    'risk 6-18 years immunocompromised PPSV-PCV-PPSV series · Dose 2 · gap from previous dose',
    'risk 6-18 years immunocompromised PPSV-PPSV-PCV series · Dose 3 · gap from previous dose',
  ],
  'CHILD-PPSV23-AFTER-PPSV23': PPSV_AFTER_PPSV(),
  'CHILD-PPSV23-AFTER-INVALID-PPSV23': PPSV_AFTER_PPSV(),
  'CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST': PPSV_AFTER_PPSV(),
};
function PPSV_AFTER_PPSV() {
  return [
    'risk 2-5 years 4-dose series · Dose 4 · gap from previous dose',
    'risk 6-18 yrs immunocompromised PCV-PPSV-PPSV · Dose 3 · gap from previous dose',
    'risk 6-18 years immunocompromised PPSV-PCV-PPSV series · Dose 3 · gap from dose 1',
    'risk 6-18 years immunocompromised PPSV-PPSV-PCV series · Dose 2 · gap from previous dose',
  ];
}
/** Every gap CDSI states in an adult (19+ / 50+) series. */
export function adultGapFacts() {
  return [...facts.values()]
    .filter((f) => /19\+|50\+/.test(f.series ?? '') && 'abs' in f && !/allowable/.test(f.key) && f.live)
    .map((f) => f.key.slice(P.length));
}

// ── The named differences ────────────────────────────────────────────────
// Each records the CDSI and app values it was approved at. The four RULE
// rows were approved by the owner on 2026-11-27 ("Yes, keep all 4"); the
// other three each rest on an owner ruling or CDC wording recorded earlier,
// and were first measured here.
export const DIFFERENCES = {
  'RULE CHILD-PPSV23-AFTER-PCV': {
    status: 'wording',
    reason: 'CDC child notes: PPSV23 "at least 8 weeks after the most recent PCV dose", for every at-risk child. CDSI floors it only for 2–5 chronic conditions.',
    approved: 'owner 2026-11-27, "Yes, keep all 4"',
    cdsi: 'floor in 2 of 6: risk 2-5 years Chronic Medical Conditions PCV-PCV-PPSV series; risk 2-5 years Chronic Medical Conditions PCV-PPSV-PCV series',
    app: 'floor, at least 8 weeks',
  },
  'RULE CHILD-PCV-AFTER-PPSV23': {
    status: 'owner',
    reason: 'Owner ruling 2026-10-25 (CLINICAL_SPEC.md §K-PPSV23THENPCV): a conjugate under 8 weeks after a PPSV23 does not count. CDSI floors it only for 2–5 chronic conditions.',
    approved: 'owner 2026-11-27, "Yes, keep all 4"',
    cdsi: 'floor in 2 of 5: risk 2-5 years Chronic Medical Conditions PPSV-PCV-PCV series; risk 2-5 years Chronic Medical Conditions PCV-PPSV-PCV series',
    app: 'floor, at least 8 weeks',
  },
  'RULE CHILD-PPSV23-AFTER-INVALID-PPSV23': {
    status: 'wording',
    reason: 'CDC child notes: the second PPSV23 "at least 5 years after dose 1 PPSV23". CDSI has no floor on any 5-year gap.',
    approved: 'owner 2026-11-27, "Yes, keep all 4"',
    cdsi: 'no floor in any of 4',
    app: 'floor, at least 5 years',
  },
  'RULE CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST': {
    status: 'wording',
    reason: 'Same sentence as CHILD-PPSV23-AFTER-INVALID-PPSV23.',
    approved: 'owner 2026-11-27, "Yes, keep all 4"',
    cdsi: 'no floor in any of 4',
    app: 'floor, at least 5 years',
  },
  'PCV7-COUNTS': {
    status: 'owner',
    reason: 'PCV7 never counts (owner, 2026-10-12; immunize.org Ask the Experts). Already a named family in the CDC test patients (5 patients).',
    approved: 'owner 2026-10-12',
    cdsi: 'allowable (11 infant series doses, from 6 weeks - 4 days)',
    app: 'PCV7 at 2 months does not count (pcv7)',
  },
  'GAP-PCV-D3-AFTER-7-11': {
    status: 'wording',
    reason: 'CDC Catch-up Table 2 (refs.js cdcCatchupDose2to3EightWeeks, read live 2026-10-23): "8 weeks (as final dose for healthy children) if previous dose was administered between 7–11 months". CDSI\'s dose-2-at-7-months series allows 4 weeks. Already a named family in the CDC test patients (3 patients, same end result).',
    approved: 'CDC wording over CDSI (owner 2026-08-10, 2026-10-17); this family was marked DELIBERATE in the test-patient report the owner ruled on 2026-11-08',
    cdsi: '4 weeks - 4 days',
    app: '56 days, grace 4 days',
  },
  'AGE-PCV21': {
    status: 'owner',
    reason: 'The app grades PCV21 by its licence age, 18 years (PCV21_MIN_AGE_M; owner decision PCV21-OFFLABEL, 2026-10-15: record the dose and grade it by the product\'s own minimum age). CDSI lists PCV21 only in its 19+ series. An 18-year-old given PCV21 is a rare history.',
    approved: 'owner 2026-10-15 (PCV21-OFFLABEL)',
    cdsi: 'allowed only in 19+ series, from 19 years / 19 years - 4 days',
    app: 'minAgeM 216 (licence, 18 years); dose at 18y6m counts (counted-early)',
  },
};

// ── Not compared, and why ────────────────────────────────────────────────
export const NOT_COMPARED = [
  { what: 'PCV dose 4 minimum age, 12 months - 4 days', why: 'The app has no single number for it: a 4th dose before the 1st birthday is an extra infant dose (owner 2026-10-23), and the 4-day grace at 12 months applies only where it means fewer doses owed (§A-GRACE12, owner 2026-11-09, "Ivy"). Guarded by regression-2026-10-31-four-day-grace-at-first-birthday and regression-2026-11-09-grace12-only-when-it-helps.' },
  { what: 'Maximum ages (a healthy child\'s PCV series ends at 5 years)', why: 'CDSI expresses it as a per-dose maximum age; the app as which card a healthy child of that age gets. The CDC test patients (cdsi-test-patients.test.js) check the result.' },
  { what: 'Dose 1 gaps of CDSI\'s start-at-12-months and start-at-24-months series, and its risk series\' gap from "most recent CVX"', why: 'They are gaps from a dose in ANOTHER CDSI series — an artefact of CDSI picking one series per patient. The app has one history per patient; the CDC test patients check the result.' },
  { what: 'Which conditions put a patient on which series, and adult product choice by age', why: 'Series selection, not an age or a gap. Checked through the CDC test patients.' },
];

export const CDSI_FACT_COUNT = () => facts.size;
