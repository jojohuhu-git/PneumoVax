// ─────────────────────────────────────────────────────────────────────────
// rulebook.js — the content of the "How recommendations are made" page.
//
// WHY THIS FILE EXISTS. A clinician asked to be able to follow the rules the
// app is using, the way PediVax's Rulebook screen lets you. PediVax can print
// its rulebook straight from its data files because every rule there is
// written down as data. PneumoVax is not built that way: most of its rules
// are branching code in recommend.js. So this page is assembled two ways, and
// every item says which it is:
//
//   GENERATED  — read live from the same file the engine reads, so it cannot
//                drift. The ages, the products, the risk conditions and the
//                whole dose-spacing table are generated.
//   WRITTEN    — a sentence someone typed, describing what the code does.
//                These are the risk. Every WRITTEN claim that contains a
//                number or a rule name is checked against the engine by
//                regression-2026-10-25-rulebook-matches-the-engine.test.js,
//                which fails if the two stop agreeing.
//
// Nothing here is a clinical source. The page points at the real sources; it
// does not restate them.
// ─────────────────────────────────────────────────────────────────────────
import { ADULT_SCHED_MIN_M, PCV21_MIN_AGE_M, ROUTINE_ADULT_MIN_M } from '../logic/scheduleConstants.js';
import { ALL_PRODUCTS } from './brands.js';
import { RISK_FACTORS } from './riskFactors.js';
import { DOSE_INTERVAL_RULES } from '../logic/doseIntervalRules.js';
import { REFS } from './refs.js';

/** Months as a clinician would say them. 228 -> "19 years". */
export function monthsInWords(m) {
  if (m == null) return '';
  if (m < 24) return `${m} month${m === 1 ? '' : 's'}`;
  if (m % 12 === 0) return `${m / 12} years`;
  return `${Math.floor(m / 12)} years ${m % 12} months`;
}

// ── GENERATED: the three ages that decide which rulebook a patient gets ──
export const BOUNDARIES = [
  {
    name: 'The child / adult line',
    constant: 'ADULT_SCHED_MIN_M',
    months: ADULT_SCHED_MIN_M,
    means: 'At and above this age the adult rules apply instead of the child ones.',
  },
  {
    name: 'Routine adult vaccination begins',
    constant: 'ROUTINE_ADULT_MIN_M',
    months: ROUTINE_ADULT_MIN_M,
    means: 'From this age a pneumococcal vaccine is recommended for every adult, with or without a risk condition. Below it, only a risk condition qualifies someone.',
  },
  {
    name: 'The youngest age PCV21 may be given',
    constant: 'PCV21_MIN_AGE_M',
    months: PCV21_MIN_AGE_M,
    means: 'This is about the product, not the schedule — it is the licensed minimum age for PCV21 (Capvaxive) and nothing else.',
  },
];

// ── The four pathways. The AGES are generated; the descriptions are WRITTEN
//    and are checked against the engine by driving it at each boundary. ────
export const PATHWAYS = [
  {
    id: 'exclusion',
    name: 'Stem-cell transplant, CAR-T, or B-cell-depleting therapy',
    whenWritten: 'Whenever that box is ticked, at any age — it overrides everything else, including other risk conditions ticked alongside it.',
    fromMonths: null,
    toMonths: null,
    writtenSummary: 'The app stops and gives no schedule at all. These patients are revaccinated on a transplant- or therapy-specific protocol, not on an age-based schedule, so an age-based answer here would be wrong rather than incomplete.',
    engineFn: 'the exclusion check at the top of recommend()',
  },
  {
    id: 'infant',
    name: 'Babies and toddlers under 2',
    whenWritten: 'Under 24 months.',
    fromMonths: 0,
    toMonths: 24,
    writtenSummary: 'Works out how many doses this child needs IN TOTAL from the age the first dose was given, then how many are still owed and when the next one is due. The total is not always four: a child who starts late needs fewer.',
    engineFn: 'pcvInfant',
  },
  {
    id: 'child',
    name: 'Children 2 up to the adult line',
    whenWritten: `From 24 months up to ${monthsInWords(ADULT_SCHED_MIN_M)}.`,
    fromMonths: 24,
    toMonths: ADULT_SCHED_MIN_M,
    writtenSummary: 'Splits on whether a risk condition is ticked. A healthy child is only caught up to age 5; an at-risk child follows the risk rules at any age in this band, and those rules differ again between immunocompromising conditions and the rest.',
    engineFn: 'pcvRiskChild when a risk condition applies, otherwise pcvHealthyChild',
  },
  {
    id: 'adult',
    name: 'Adults',
    whenWritten: `${monthsInWords(ADULT_SCHED_MIN_M)} and over.`,
    fromMonths: ADULT_SCHED_MIN_M,
    toMonths: null,
    writtenSummary: `Below ${monthsInWords(ROUTINE_ADULT_MIN_M)} a vaccine is recommended only with a qualifying risk condition; from ${monthsInWords(ROUTINE_ADULT_MIN_M)} it is recommended for everyone. What is offered then depends on what is already on the record.`,
    engineFn: 'pcvAdult',
  },
];

// ── GENERATED: the products, and what each one does to a series ──────────
export const PRODUCTS = ALL_PRODUCTS.map((p) => ({
  key: p.key,
  label: p.label,
  type: p.type,
  counts: p.counts,
  completesSeries: p.completesSeries,
  requiresPPSV23: p.requiresPPSV23,
  minAgeM: p.minAgeM,
  minAgeDays: p.minAgeDays,
  active: p.active,
  historyOnly: p.historyOnly,
}));

// ── GENERATED: the risk conditions, in the three groups the rules use ────
const GROUP_NAMES = {
  IC: 'Immunocompromising conditions',
  special: 'Cochlear implant or CSF leak',
  nonIC: 'Chronic conditions',
  exclude: 'Transplant, CAR-T or B-cell-depleting therapy',
};
const GROUP_MEANS = {
  IC: 'These owe the most: an extra dose later, and a shorter wait before the PPSV23 in adults aged 19 to 49.',
  special: 'Grouped with the immunocompromising conditions for the adult PCV15-to-PPSV23 wait, but not for the extra later dose.',
  nonIC: 'Qualify a patient for vaccination, but on the ordinary intervals.',
  exclude: 'Stops the app. See the pathway above.',
};
// The transplant row carries group 'IC' but its own `exclude` flag, and it is
// not an immunocompromising row for any rule - it stops the engine. So it is
// listed on its own and taken out of IC, which is how the engine treats it.
export const RISK_GROUPS = ['IC', 'special', 'nonIC', 'exclude'].map((g) => ({
  group: g,
  name: GROUP_NAMES[g],
  means: GROUP_MEANS[g],
  conditions: RISK_FACTORS.filter((r) => (g === 'exclude' ? !!r.exclude : !r.exclude && (r.group ?? r.class) === g))
    .map((r) => ({ id: r.id, label: r.label, sublabel: r.sublabel ?? null, adultOnly: !!r.adultOnly })),
})).filter((g) => g.conditions.length);

// ── GENERATED: every rule about the gap between two recorded doses ───────
//
// OWNER REQUEST 2026-10-25: *"I want to reorganize the rulebook to show the
// acceptable vaccine intervals between doses based on age, risks and last
// pneumococcal dose given. This will be easier to follow than a line list of
// rules... I anticipate more bugs to come up in the future and I need
// something for me to check back on when verifying rules. It\'s confusing for
// me to go back to each reference document on my own."*
//
// So this is a LOOKUP, not a list. You arrive with a patient — an age, a risk
// group, what is already on their record — and the dose in front of you, and
// you read across. Three things follow from that sentence of hers:
//
//   • the ROWS ARE SORTED BY PATIENT, not by rule name, and the rule id moves
//     to the end where a clinician never has to look at it;
//   • "what else is already on the record" IS A COLUMN. Her three axes were
//     age, risk and last dose, but 14 of the 18 rules actually split on a
//     FOURTH thing — a 55-year-old and a 70-year-old with the same PPSV23 are
//     given different gaps because one of them also has a PCV13 on file. Hide
//     that and the table has rows that look identical and disagree;
//   • every row CARRIES ITS OWN SOURCE SENTENCE, so that checking a rule does
//     not mean opening a CDC page.
//
// EVERY CELL IS DERIVED FROM `DOSE_INTERVAL_RULES`. `rule-docs-match-code.test.js`
// builds CLINICAL_SPEC.md\'s expected table from these same functions, so the
// screen, the rulebook and the engine cannot say three different things.
const ENFORCEMENT_MEANS = {
  floor: 'The dose does not count. It stays on the record with an explanation, and the series still owes a dose.',
  recommendation: 'The dose counts. The app notes that the gap was shorter than recommended and says by how much.',
  none: 'Never flagged — the reason is recorded in the rule itself.',
};
const ENFORCEMENT_SHORT = {
  floor: 'Does not count',
  recommendation: 'Counts, with a note',
  none: 'Never flagged',
};

/** Which patients a row is for. */
export function ruleWho(r) {
  if (r.rulebook === 'child') return `Child (under ${monthsInWords(ADULT_SCHED_MIN_M)})`;
  if (r.rulebook === 'adult') return `Adult (${monthsInWords(ADULT_SCHED_MIN_M)} and over)`;
  return 'Any age';
}

/**
 * Which risk group, when a row has one.
 *
 * Only TWO of the eighteen rules read the risk conditions at all, and both are
 * adult PPSV23-after-PCV15 rows. Saying "Any" everywhere else is not padding:
 * it is the answer to "does my patient\'s asplenia change this interval", and
 * for sixteen rows it is no.
 */
export function ruleRisk(r) {
  if (r.shorterMinimum === true || r.shorterIsTheAdvice === true) {
    return 'Immunocompromising condition, cochlear implant or CSF leak';
  }
  if (r.shorterMinimum === false || r.shorterIsTheAdvice === false) {
    return 'Every other risk group';
  }
  return 'Any';
}

/** What must already be on the record for the row to apply. */
export function ruleRecord(r) {
  const parts = [];
  if (r.needsPriorPcv) parts.push(r.needsPriorPcv.join(' and '));
  if (r.needsNoPriorPcv) parts.push('no PCV of any kind');
  if (r.needsPriorPpsv23) parts.push('PPSV23');
  if (r.needsNoPriorPpsv23) parts.push('no PPSV23');
  return parts.length ? parts.join(', ') : 'Anything';
}

/** The dose being judged. */
export function ruleGiving(r) {
  if (r.vaccine === 'PPSV23') return 'PPSV23';
  return r.products ? r.products.join(' or ') : 'Any PCV';
}

/** The earlier dose the gap is measured from, in a clinician\'s words. */
const FROM_WORDS = {
  prevSameStream: 'the previous dose of the same vaccine — including one that did not count',
  lastPcv: 'the most recent PCV that counted',
  lastPcv13: 'the most recent PCV13 that counted',
  lastPcv15: 'the most recent PCV15 that counted',
  lastPpsv23: 'the most recent PPSV23 that counted',
};
export function ruleFrom(r) { return FROM_WORDS[r.from] ?? r.from; }

const weeksWords = (d) => (d % 7 === 0 ? `at least ${d / 7} weeks` : `at least ${d} days`);
const monthsWords = (m) => (m % 12 === 0
  ? `at least ${m / 12} year${m / 12 === 1 ? '' : 's'}`
  : `at least ${m} months`);

/**
 * The six cells of CDC Catch-up Table 2, probed out of the engine\'s own
 * function rather than transcribed.
 *
 * One row of the table cannot hold this: the paediatric conjugate minimum
 * depends on the DOSE NUMBER and on two different ages, which is a grid and
 * not a number. It gets its own small grid on the page, and changing any
 * branch of `pcvNextDoseMinIntervalDays` changes these strings — which is the
 * whole mechanism, the same one `rule-docs-match-code.test.js` relies on.
 */
export function childPcvGrid(r) {
  if (typeof r.interval?.daysFrom !== 'function') return null;
  const cell = (when, anchor, ctx) => ({
    when, gap: weeksWords(r.interval.daysFrom(anchor, ctx)),
  });
  return [
    cell('Dose 2, when dose 1 was given before the first birthday',
      { ageAtDose: 6 }, { doseNumber: 2, ageAtDose: 7, anyPriorDoseBefore12: true }),
    cell('Dose 2, when dose 1 was given at the first birthday or later',
      { ageAtDose: 18 }, { doseNumber: 2, ageAtDose: 19, anyPriorDoseBefore12: false }),
    cell('Dose 3, given under 12 months, previous dose before 7 months',
      { ageAtDose: 6 }, { doseNumber: 3, ageAtDose: 7, anyPriorDoseBefore12: true }),
    cell('Dose 3, previous dose at 7–11 months',
      { ageAtDose: 9 }, { doseNumber: 3, ageAtDose: 10, anyPriorDoseBefore12: true }),
    cell('Dose 4 or later, given under 12 months (an extra infant dose)',
      { ageAtDose: 4 }, { doseNumber: 4, ageAtDose: 5, anyPriorDoseBefore12: true }),
    cell('Dose 4 or later, given at 12 months or over (the booster)',
      { ageAtDose: 10 }, { doseNumber: 4, ageAtDose: 13, anyPriorDoseBefore12: true }),
  ];
}

/** The shortest acceptable gap, as one phrase for the screen. */
export function ruleGap(r) {
  const iv = r.interval;
  if (iv == null) return 'none stated';
  if (typeof iv.daysFrom === 'function') return 'depends on the dose number and the age — see the grid below';
  return iv.days != null ? weeksWords(iv.days) : monthsWords(iv.months);
}

/**
 * The same gap written out in full, for CLINICAL_SPEC.md.
 *
 * The screen can say "see the grid below" because the grid is directly
 * beneath it. The rulebook is a document, and a cell that points at
 * something else is a cell nobody can check — so the paediatric row spells
 * all six cells here, probed out of the engine exactly as `childPcvGrid`
 * does. `rule-docs-match-code.test.js` builds its expectation from this
 * function, so changing any branch of `pcvNextDoseMinIntervalDays` changes
 * this string and the rulebook stops matching until it is corrected.
 */
export function ruleGapExact(r) {
  const grid = childPcvGrid(r);
  if (grid) return grid.map((c) => `${c.when}: ${c.gap}`).join('; ');
  return ruleGap(r);
}

export const INTERVAL_TABLE = DOSE_INTERVAL_RULES.map((r) => ({
  id: r.id,
  what: r.what,
  who: ruleWho(r),
  risk: ruleRisk(r),
  record: ruleRecord(r),
  giving: ruleGiving(r),
  from: ruleFrom(r),
  gap: ruleGap(r),
  grid: childPcvGrid(r),
  ifShorter: ENFORCEMENT_SHORT[r.enforcement],
  ifShorterMeans: ENFORCEMENT_MEANS[r.enforcement],
  enforcement: r.enforcement,
  authority: r.authority ?? null,
  authorityMeans: r.authority === 'OWNER'
    ? 'This one is a clinical judgement of this app, not something CDC or ACIP states. The interval is theirs; treating it as a hard cut-off is ours, and the app says so on the dose itself.'
    : 'CDC or ACIP state this interval themselves.',
  // The sentence the rule rests on, so that checking a rule does not mean
  // opening a CDC page. This is the owner\'s stated reason for the whole
  // reorganisation, so it is a first-class column and not an appendix.
  source: typeof r.source === 'string' ? r.source : null,
}));

/** The table as a clinician reads it: by patient, then by the dose in hand. */
const GROUP_ORDER = { child: 0, any: 1, adult: 2 };
export const INTERVAL_GROUPS = ['child', 'any', 'adult']
  .map((book) => ({
    book,
    name: book === 'child' ? 'Children' : book === 'adult' ? 'Adults' : 'Any age',
    rows: DOSE_INTERVAL_RULES
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.rulebook === book)
      // Within a patient group, the vaccine in hand is what a clinician knows
      // first, so PCV rows come before PPSV23 rows; otherwise source order,
      // which is the order the engine itself walks them.
      .sort((a, b) => (a.r.vaccine === b.r.vaccine ? a.i - b.i : (a.r.vaccine === 'PCV' ? -1 : 1)))
      .map(({ i }) => INTERVAL_TABLE[i]),
  }))
  .filter((g) => g.rows.length)
  .sort((a, b) => GROUP_ORDER[a.book] - GROUP_ORDER[b.book]);

// ── GENERATED: every document the app can cite, ORGANISED ────────────────
//
// OWNER REQUEST 2026-10-25: *"The reference documents in the app should also
// be organized in a way that is easy to find a document in question. Right now
// it seems random."*
//
// It was not random, it was alphabetical by an INTERNAL KEY — so "CDC
// Child/Adolescent Notes", "CDC PCV Catch-up Job Aid" and "CDC Risk-based
// Pneumococcal" sat in a block while "MMWR mm7401a1" and "immunize.org p2016"
// landed wherever their key fell, and nothing told a reader which of them
// governed the patient in front of her.
//
// Organised on the two questions someone actually arrives with:
//   WHO IS IT ABOUT   children, adults, or any age — the same `rulebook`
//                     field that keeps a child\'s quote off an adult\'s card
//   WHO PUBLISHED IT  CDC/ACIP first, then everyone else, because the
//                     authority rule in CLAUDE.md ranks them that way
//
// and each one now says HOW MUCH THE APP LEANS ON IT — the number of distinct
// sentences quoted from it. A document the app quotes 30 times and one it
// quotes once are different things to go and check, and the old list showed
// them identically.
const PUBLISHER = (r) => {
  const u = r.url ?? '';
  if (u.includes('cdc.gov')) return 'CDC / ACIP';
  if (u.includes('immunize.org')) return 'immunize.org';
  return 'Other';
};
const PUBLISHER_RANK = { 'CDC / ACIP': 0, 'immunize.org': 1, Other: 2 };

export const SOURCES = Object.values(
  Object.entries(REFS).reduce((acc, [, v]) => {
    if (!v || !v.url) return acc;
    const page = (v.page ?? v.url).split('#')[0];
    const key = v.short ?? v.doc ?? page;
    const prev = acc[key];
    acc[key] = {
      name: key,
      // ⚠ THE DOCUMENT'S NAME, NEVER A LABEL. A ref entry's `label` describes
      // the SENTENCE it quotes, not the document - "CDC Child & Adolescent
      // Schedule Notes - pneumococcal: the PCV15 to PPSV23 interval of >=1
      // year, with 8 weeks named as a minimum that MAY be considered..." is a
      // fine chip title and a useless thing to go looking for a document by.
      // The first draft here picked the LONGEST label and produced exactly
      // that list. `short` is the document's own name and is what a reader
      // scans. A whole-page entry's label is kept as the subtitle, because it
      // does describe the document.
      label: key,
      describes: v.quote ? (prev?.describes ?? null) : (v.label ?? prev?.describes ?? null),
      url: page,
      rulebook: v.rulebook ?? prev?.rulebook ?? 'any',
      publisher: PUBLISHER(v),
      // Distinct quoted sentences, which is what "how much does the app lean
      // on this" means. A whole-page entry carries no quote and adds nothing.
      quotes: new Set([...(prev?.quotes ?? []), ...(v.quote ? [v.quote] : [])]),
      lastVerified: (v.lastVerified ?? '') > (prev?.lastVerified ?? '') ? v.lastVerified : prev?.lastVerified ?? null,
    };
    return acc;
  }, {}),
).map((d) => ({ ...d, quotes: d.quotes.size }));

const SCOPE_NAME = { child: 'About children', adult: 'About adults', any: 'Used at any age' };
export const SOURCE_GROUPS = ['child', 'adult', 'any']
  .map((book) => ({
    book,
    name: SCOPE_NAME[book],
    docs: SOURCES
      .filter((d) => d.rulebook === book)
      .sort((a, b) => (PUBLISHER_RANK[a.publisher] - PUBLISHER_RANK[b.publisher])
        || b.quotes - a.quotes
        || a.name.localeCompare(b.name)),
  }))
  .filter((g) => g.docs.length);
