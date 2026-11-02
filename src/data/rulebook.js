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
// The transplant row carries group 'IC' but its own `exclude` flag, and it is
// not an immunocompromising row for any rule - it stops the engine. So it is
// listed on its own and taken out of IC, which is how the engine treats it.
export const RISK_GROUPS = ['IC', 'special', 'nonIC', 'exclude'].map((g) => ({
  group: g,
  name: GROUP_NAMES[g],
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

/**
 * What happens to a dose given inside the gap. A row may state it in its own
 * words (`ifShorter`) when the enforcement alone would say something untrue —
 * P2's child PPSV23 row counts the dose for an immunocompromised child and
 * calls it an extra dose for any other, so "Counts, with a note" is half true.
 */
export function ruleIfShorter(r) { return r.ifShorter?.short ?? ENFORCEMENT_SHORT[r.enforcement]; }

/** Which patients a row is for. */
export function ruleWho(r) {
  if (r.rulebook === 'child') return `Child (under ${monthsInWords(ADULT_SCHED_MIN_M)})`;
  if (r.rulebook === 'adult') return `Adult (${monthsInWords(ADULT_SCHED_MIN_M)} and over)`;
  return 'Any age';
}

/**
 * Which risk group, when a row has one.
 *
 * Only SIX of the twenty-one rules read the risk conditions at all, and every one
 * is an adult PPSV23-after-PCV13/15 row (re-measured 2026-10-30). Saying "Any" everywhere else is not padding:
 * it is the answer to "does my patient\'s asplenia change this interval", and
 * for fifteen rows it is no.
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
  // 2026-10-30: a row measured from a PPSV23 that did NOT count always has one
  // on the record, so a bare "no PPSV23" would read as false. These history
  // conditions are about the doses that COUNTED, and for these two rows the
  // difference is the whole point (the repeat of a rejected first dose vs. of
  // a rejected second one).
  const ppsvWords = r.vaccine === 'PPSV23' && r.anchorCounted === false ? ' that counted' : '';
  if (r.needsPriorPpsv23) parts.push(ppsvWords ? `a PPSV23${ppsvWords}` : 'PPSV23');
  if (r.needsNoPriorPpsv23) parts.push(`no PPSV23${ppsvWords}`);
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
  lastPpsv23Received: 'the most recent PPSV23 that counted or was an extra dose',
};
// P2 (2026-10-30): one pair of doses, two rows, split on whether the earlier
// dose COUNTED (`anchorCounted`). Without these words the page printed the two
// rows identically and a reader could not tell which one applied.
export function ruleFrom(r) {
  if (r.from === 'prevSameStream' && r.anchorCounted === true) {
    return 'the previous dose of the same vaccine, when that dose counted';
  }
  if (r.from === 'prevSameStream' && r.anchorCounted === false) {
    return 'the previous dose of the same vaccine, when that dose did not count';
  }
  return FROM_WORDS[r.from] ?? r.from;
}

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
  ifShorter: ruleIfShorter(r),
  ifShorterMeans: r.ifShorter?.means ?? ENFORCEMENT_MEANS[r.enforcement],
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

// ═════════════════════════════════════════════════════════════════════════
//  THE PAGE — 2026-11-01 redesign ("How PneumoVax decides")
// ═════════════════════════════════════════════════════════════════════════
//
// Built from the owner's five-board design canvas of 2026-10-31 (four rounds
// of her notes: visuals over text, the app's own chip words, every group
// saying WHAT changes, ages in weeks/months/years, "simple, succinct yet
// clinical", every Invalid case stating an action).
//
// TWO RULES HOLD EVERY SENTENCE BELOW TO THE ENGINE:
//
//   1. NO NUMBER IS TYPED. Every age and interval is interpolated from a
//      constant the engine itself reads — `ENGINE_AGE_LINES` (recommend.js's
//      own `M`), the three schedule constants, the interval constants, a
//      `DOSE_INTERVAL_RULES` row, or a CDC sentence in refs.js. The C14 guard
//      reads this file's source and fails on a typed age or interval.
//
//   2. EVERY CLAIM CARRIES A WORKED PATIENT (`ex`). The guard runs each one
//      through `recommend()` and fails if the app does not say what the page
//      says. The same patient is what the page's "Source" button runs, so the
//      quotes it shows are the ones the app's card for that patient cites —
//      generated, never transcribed.
import { recommend, ENGINE_AGE_LINES as AGE } from '../logic/recommend.js';
import {
  intervalPhrase, PCV_PPSV23_MIN_INTERVAL_DAYS, PPSV23_REVACC_MIN_MONTHS, GRACE_DAYS,
  ADULT_CONJUGATE_SUPPORTED_MIN_DAYS, PCV_MIN_INTERVAL_DAYS_UNDER_12M,
} from '../logic/intervals.js';
import { ADULT_PPSV23_INTERVAL_MONTHS, ADULT_PPSV23_SHORTER_MINIMUM_WEEKS } from './riskFactors.js';

/** The fixed "today" every worked patient is run on. */
export const EX_TODAY = '2026-11-01';

const wk = (days) => intervalPhrase({ days });
const mo = (months) => intervalPhrase({ months });
const W8 = wk(PCV_PPSV23_MIN_INTERVAL_DAYS);
const Y5 = mo(PPSV23_REVACC_MIN_MONTHS);
const Y1 = mo(ADULT_PPSV23_INTERVAL_MONTHS);
const W8_ADULT = wk(ADULT_PPSV23_SHORTER_MINIMUM_WEEKS * 7);
const yrs = (m) => monthsInWords(m);
/** "19 to 49 years": both ends from constants, the upper one inclusive. */
const band = (fromM, toM) => `${fromM / 12} to ${toM / 12 - 1} years`;
/** A DOSE_INTERVAL_RULES row's own gap, in words. */
export function gapOf(id) {
  const r = DOSE_INTERVAL_RULES.find((x) => x.id === id);
  if (!r) throw new Error(`rulebook: no interval rule ${id}`);
  return r.interval.days != null ? wk(r.interval.days) : mo(r.interval.months);
}

const doses = (product, dates) => dates.map((date) => ({ product, date }));
const INFANT_PCV13_2022 = doses('PCV13', ['2023-01-01', '2023-03-01', '2023-05-01', '2023-11-15']);

/**
 * A worked patient. `expect` lists what must be true of the app's answer:
 *   cards   — each pattern must match some card's dose label
 *   noCards — no card's dose label may match
 *   note    — each pattern must match some card's note
 *   noNote  — no card's note may match
 *   status  — some card has this status
 *   due     — the first card is due on this date ('today' = due today)
 *   chip    — [stream, index, label]: that dose's chip reads exactly this
 *   excluded — the transplant stop
 */
const ex = (who, input, expect) => ({ who, input: { today: EX_TODAY, ...input }, expect });

// ── The worked patients, shared by more than one row ─────────────────────
const P = {
  healthy3: ex('Healthy 3-year-old, PCV at 2 and 4 months only',
    { dob: '2023-11-01', riskIds: [], pcvDoses: doses('PCV15', ['2024-01-01', '2024-03-01']), ppsv23Doses: [] },
    { cards: [/^1 dose PCV \(catch-up\)$/] }),
  healthy6: ex('Healthy 6-year-old, unvaccinated',
    { dob: '2020-11-01', riskIds: [], pcvDoses: [], ppsv23Doses: [] },
    { cards: [/^Not indicated/], status: 'not-indicated' }),
  diabetic4: ex('4-year-old with diabetes, PCV13 at 2, 4, 6 and 12 months',
    { dob: '2022-11-01', riskIds: ['diabetes'], pcvDoses: INFANT_PCV13_2022, ppsv23Doses: [] },
    { cards: [/Option A: 1 dose PCV20/, /Option B: 1 dose PPSV23/] }),
  cochlear4: ex('4-year-old with a cochlear implant, PCV13 at 2, 4, 6 and 12 months',
    { dob: '2022-11-01', riskIds: ['cochlear_implant'], pcvDoses: INFANT_PCV13_2022, ppsv23Doses: [] },
    { cards: [/Option A: 1 dose PCV20/, /Option B: 1 dose PPSV23/] }),
  asplenia5ppsv: ex('5-year-old with asplenia, PCV13 series, PPSV23 at 3',
    { dob: '2021-11-01', riskIds: ['asplenia'], pcvDoses: doses('PCV13', ['2022-01-01', '2022-03-01', '2022-05-01', '2022-11-15']), ppsv23Doses: doses('PPSV23', ['2024-11-15']) },
    { cards: [/1 dose PCV20 \(immunocompromising\)/, /2nd PPSV23/], due: '2029-11-15' }),
  diabeticPcv20: ex('4-year-old with diabetes, PCV20 at 2, 4, 6 and 12 months',
    { dob: '2022-11-01', riskIds: ['diabetes'], pcvDoses: doses('PCV20', ['2023-01-01', '2023-03-01', '2023-05-01', '2023-11-15']), ppsv23Doses: [] },
    { status: 'complete', cards: [/includes PCV20/] }),
  diabetic5done: ex('5-year-old with diabetes, PCV13 series, PPSV23 at 4',
    { dob: '2021-11-01', riskIds: ['diabetes'], pcvDoses: doses('PCV13', ['2022-01-01', '2022-03-01', '2022-05-01', '2022-11-15']), ppsv23Doses: doses('PPSV23', ['2025-11-15']) },
    { status: 'complete' }),
  cochlear15: ex('15-year-old with a cochlear implant, PCV13 series, PPSV23 at 10',
    { dob: '2011-11-01', riskIds: ['cochlear_implant'], pcvDoses: doses('PCV13', ['2012-01-01', '2012-03-01', '2012-05-01', '2012-11-15']), ppsv23Doses: doses('PPSV23', ['2021-11-15']) },
    { status: 'complete', note: [/At 19, the adult schedule gives 1 dose of PCV20 or PCV21/] }),
  // The other two answers at 19 (2026-11-01 CDC re-check: the row claimed the
  // cochlear answer for every at-risk child).
  diabetic15: ex('15-year-old with diabetes, PCV13 series, PPSV23 at 10',
    { dob: '2011-11-01', riskIds: ['diabetes'], pcvDoses: doses('PCV13', ['2012-01-01', '2012-03-01', '2012-05-01', '2012-11-15']), ppsv23Doses: doses('PPSV23', ['2021-11-15']) },
    { status: 'complete', note: [/At 19, the adult schedule gives no dose now; re-evaluate at age 50/] }),
  asplenia16two: ex('16-year-old with asplenia, PCV13 series, PPSV23 at 2 and 7',
    { dob: '2010-11-01', riskIds: ['asplenia'], pcvDoses: doses('PCV13', ['2011-01-01', '2011-03-01', '2011-05-01', '2011-11-15']), ppsv23Doses: doses('PPSV23', ['2013-01-01', '2018-02-01']) },
    { status: 'complete', note: [/At 19, the adult schedule says to review again at age 50, or give 1 dose of PCV20 or PCV21/] }),
  asplenia8ppsv: ex('8-year-old with asplenia, PPSV23 4 weeks ago, no PCV',
    { dob: '2018-11-01', riskIds: ['asplenia'], pcvDoses: [], ppsv23Doses: doses('PPSV23', ['2026-10-04']) },
    { cards: [/Option A: 1 dose PCV20 \(≥8 weeks\)/, /Option B-1: 1 dose PCV15 \(≥8 weeks\)/] }),
  diabetic3partial: ex('3-year-old with diabetes, PCV at 2 and 4 months only',
    { dob: '2023-11-01', riskIds: ['diabetes'], pcvDoses: doses('PCV15', ['2024-01-01', '2024-03-01']), ppsv23Doses: [] },
    { cards: [/PCV dose 1 of 2 \(at-risk catch-up\)/] }),
  asplenia3partial: ex('3-year-old with asplenia, PCV at 2 and 4 months only',
    { dob: '2023-11-01', riskIds: ['asplenia'], pcvDoses: doses('PCV15', ['2024-01-01', '2024-03-01']), ppsv23Doses: [] },
    { cards: [/PCV dose 1 of 2 \(at-risk catch-up\)/] }),
  asplenia10none: ex('10-year-old with asplenia, unvaccinated',
    { dob: '2016-11-01', riskIds: ['asplenia'], pcvDoses: [], ppsv23Doses: [] },
    { cards: [/Option A: 1 dose PCV20/, /Option B-1: 1 dose PCV15/, /Option B-2: PPSV23/], note: [new RegExp(`PCV20 or a second PPSV23 — ≥${Y5} later`)] }),
  // 2026-11-01 (logic-order rebuild): the never-vaccinated 6-18 lane's step 3
  // read "None" for every at-risk child while the app gave an immunocompromised
  // one the 5-year dose (P1-2). These two hold both halves of that lane.
  diabetic10none: ex('10-year-old with diabetes, unvaccinated',
    { dob: '2016-11-01', riskIds: ['diabetes'], pcvDoses: [], ppsv23Doses: [] },
    { cards: [/Option A: 1 dose PCV20/, /Option B-1: 1 dose PCV15/], noNote: [new RegExp(`≥${Y5}`)] }),
  diabetic8pcv13: ex('8-year-old with diabetes, first PCV13 at 7',
    { dob: '2018-11-01', riskIds: ['diabetes'], pcvDoses: doses('PCV13', ['2025-12-01']), ppsv23Doses: [] },
    { cards: [/Option A: 1 dose PCV20/, /Option B: 1 dose PPSV23/], noCards: [/PCV15/] }),
  asplenia4pcv20: ex('4-year-old with asplenia, PCV20 at 2, 4, 6 and 12 months',
    { dob: '2022-11-01', riskIds: ['asplenia'], pcvDoses: doses('PCV20', ['2023-01-01', '2023-03-01', '2023-05-01', '2023-11-15']), ppsv23Doses: [] },
    { status: 'complete', cards: [/includes PCV20/] }),
  smoker10: ex('10-year-old who smokes, unvaccinated (smoking counts only in adults)',
    { dob: '2016-11-01', riskIds: ['smoking'], pcvDoses: [], ppsv23Doses: [] },
    { status: 'not-indicated' }),
  csf30: ex('30-year-old with a CSF leak, unvaccinated',
    { ageMonths: 360, riskIds: ['csf_leak'], pcvDoses: [], ppsv23Doses: [] },
    { cards: [/^1 dose PCV \(PCV20, PCV15, or PCV21\)$/], note: [new RegExp(`PPSV23 ≥${W8_ADULT} later`)] }),
  smoker30: ex('30-year-old who smokes, unvaccinated',
    { ageMonths: 360, riskIds: ['smoking'], pcvDoses: [], ppsv23Doses: [] },
    { cards: [/^1 dose PCV \(PCV20, PCV15, or PCV21\)$/], note: [new RegExp(`PPSV23 ≥${Y1} later`)] }),
  healthy30: ex('Healthy 30-year-old, unvaccinated',
    { ageMonths: 360, riskIds: [], pcvDoses: [], ppsv23Doses: [] },
    { noCards: [/PCV/] }),
  healthy55: ex('Healthy 55-year-old, unvaccinated',
    { ageMonths: 660, riskIds: [], pcvDoses: [], ppsv23Doses: [] },
    { cards: [/PCV20/] }),
  pcv15at55: ex('Healthy 55-year-old, PCV15 on May 1, 2026',
    { ageMonths: 660, riskIds: [], pcvDoses: doses('PCV15', ['2026-05-01']), ppsv23Doses: [] },
    { cards: [new RegExp(`^PPSV23 \\(≥${Y1} after PCV15\\)`)], due: '2027-05-01' }),
  cochlear45pcv15: ex('45-year-old with a cochlear implant, PCV15 on Sep 1, 2026',
    { ageMonths: 540, riskIds: ['cochlear_implant'], pcvDoses: doses('PCV15', ['2026-09-01']), ppsv23Doses: [] },
    { cards: [new RegExp(`^PPSV23 \\(≥${W8_ADULT} after PCV15\\)`)], due: 'today' }),
  diabetic30pcv15: ex('30-year-old with diabetes, PCV15 on Sep 1, 2026',
    { ageMonths: 360, riskIds: ['diabetes'], pcvDoses: doses('PCV15', ['2026-09-01']), ppsv23Doses: [] },
    { cards: [new RegExp(`^PPSV23 \\(≥${Y1} after PCV15\\)`)], due: '2027-09-01' }),
  asplenia60pcv15: ex('60-year-old with asplenia, PCV15 on Sep 1, 2026',
    { ageMonths: 720, riskIds: ['asplenia'], pcvDoses: doses('PCV15', ['2026-09-01']), ppsv23Doses: [] },
    { cards: [new RegExp(`^PPSV23 \\(≥${Y1} after PCV15\\)`)], note: [new RegExp(`minimum interval of ${W8_ADULT} may be considered`)] }),
  diabetic60pcv15: ex('60-year-old with diabetes, PCV15 on Sep 1, 2026',
    { ageMonths: 720, riskIds: ['diabetes'], pcvDoses: doses('PCV15', ['2026-09-01']), ppsv23Doses: [] },
    { cards: [new RegExp(`^PPSV23 \\(≥${Y1} after PCV15\\)`)] }),
  pcv13at60: ex('Healthy 60-year-old, PCV13 on Mar 1, 2026',
    { ageMonths: 720, riskIds: [], pcvDoses: doses('PCV13', ['2026-03-01']), ppsv23Doses: [] },
    { cards: [new RegExp(`PCV20 or PCV21 ≥${mo(12)} after PCV13`)], due: '2027-03-01' }),
  ppsv70: ex('Healthy 70-year-old, PPSV23 at 66',
    { ageMonths: 840, riskIds: [], pcvDoses: [], ppsv23Doses: doses('PPSV23', ['2022-11-01']) },
    { cards: [new RegExp(`PCV \\(PCV15, PCV20, or PCV21\\) ≥${mo(12)} after PPSV23`)] }),
  both60: ex('Healthy 60-year-old, PCV13 in 2020 and PPSV23 in 2022',
    { ageMonths: 720, riskIds: [], pcvDoses: doses('PCV13', ['2020-01-01']), ppsv23Doses: doses('PPSV23', ['2022-01-01']) },
    { cards: [new RegExp(`PCV20 or PCV21 ≥${Y5} after last pneumococcal dose`)], due: '2027-01-01' }),
  both72: ex('Healthy 72-year-old, PCV13 at 64 and PPSV23 at 66',
    { ageMonths: 864, riskIds: [], pcvDoses: doses('PCV13', ['2018-11-01']), ppsv23Doses: doses('PPSV23', ['2020-11-01']) },
    { status: 'shared-decision' }),
  bothHiv30: ex('30-year-old with HIV, PCV13 in 2022 and PPSV23 in 2023',
    { ageMonths: 360, riskIds: ['hiv'], pcvDoses: doses('PCV13', ['2022-01-01']), ppsv23Doses: doses('PPSV23', ['2023-11-01']) },
    { cards: [new RegExp(`PCV20 or PCV21 ≥${Y5} after last pneumococcal dose`)], due: '2028-11-01' }),
  bothCsf40: ex('40-year-old with a CSF leak, PCV13 in 2020 and PPSV23 in 2022',
    { ageMonths: 480, riskIds: ['csf_leak'], pcvDoses: doses('PCV13', ['2020-01-01']), ppsv23Doses: doses('PPSV23', ['2022-01-01']) },
    { cards: [new RegExp(`PCV20 or PCV21 ≥${Y5} after last pneumococcal dose`)] }),
  hiv30two: ex('30-year-old with HIV, PCV13 in 2012 and PPSV23 in 2013 and 2018',
    { ageMonths: 360, riskIds: ['hiv'], pcvDoses: doses('PCV13', ['2012-01-01']), ppsv23Doses: doses('PPSV23', ['2013-01-01', '2018-06-01']) },
    { cards: [new RegExp(`^Review at age ${ROUTINE_ADULT_MIN_M / 12} — or PCV20 or PCV21`)] }),
  csf40two: ex('40-year-old with a CSF leak, PCV13 in 2012 and PPSV23 in 2013 and 2018',
    { ageMonths: 480, riskIds: ['csf_leak'], pcvDoses: doses('PCV13', ['2012-01-01']), ppsv23Doses: doses('PPSV23', ['2013-01-01', '2018-06-01']) },
    { cards: [new RegExp(`^Review at age ${ROUTINE_ADULT_MIN_M / 12} — or PCV20 or PCV21`)] }),
  bothDiabetic40: ex('40-year-old with diabetes, PCV13 in 2020 and PPSV23 in 2022',
    { ageMonths: 480, riskIds: ['diabetes'], pcvDoses: doses('PCV13', ['2020-01-01']), ppsv23Doses: doses('PPSV23', ['2022-01-01']) },
    { cards: [new RegExp(`^No dose now — review at age ${ROUTINE_ADULT_MIN_M / 12}$`)] }),
  bothSmoker40: ex('40-year-old who smokes, PCV13 in 2020 and PPSV23 in 2022',
    { ageMonths: 480, riskIds: ['smoking'], pcvDoses: doses('PCV13', ['2020-01-01']), ppsv23Doses: doses('PPSV23', ['2022-01-01']) },
    { cards: [new RegExp(`^No dose now — review at age ${ROUTINE_ADULT_MIN_M / 12}$`)] }),
  pcv15ThenBad19: ex('19-year-old with diabetes, PCV15 on Sep 1, 2026 and PPSV23 19 days later (invalid)',
    { dob: '2007-10-01', riskIds: ['diabetes'], pcvDoses: doses('PCV15', ['2026-09-01']), ppsv23Doses: doses('PPSV23', ['2026-09-20']) },
    { cards: [new RegExp(`PCV20 or PCV21\\) ≥${Y1} after the PPSV23`)], noCards: [/^PPSV23/], due: '2027-09-20' }),
  complete55: ex('Healthy 55-year-old, PCV15 at 52 and PPSV23 at 53',
    { ageMonths: 660, riskIds: [], pcvDoses: doses('PCV15', ['2023-11-01']), ppsv23Doses: doses('PPSV23', ['2024-12-01']) },
    { status: 'complete' }),
  pcv20adult: ex('Healthy 60-year-old, PCV20 in 2025',
    { ageMonths: 720, riskIds: [], pcvDoses: doses('PCV20', ['2025-01-01']), ppsv23Doses: [] },
    { status: 'complete' }),
  transplant: ex('Any age, stem cell transplant ticked together with asplenia',
    { ageMonths: 120, riskIds: ['hct_cart_bcell_exclude', 'asplenia'], pcvDoses: [], ppsv23Doses: [] },
    { excluded: true }),
  childMulti: ex('4-year-old with a cochlear implant AND asplenia, PCV13 series, PPSV23 at 3',
    { dob: '2022-11-01', riskIds: ['cochlear_implant', 'asplenia'], pcvDoses: INFANT_PCV13_2022, ppsv23Doses: doses('PPSV23', ['2025-11-15']) },
    { cards: [/1 dose PCV20 \(immunocompromising\)/] }),
  adultMulti: ex('30-year-old with diabetes AND a cochlear implant, PCV15 on Sep 1, 2026',
    { ageMonths: 360, riskIds: ['diabetes', 'cochlear_implant'], pcvDoses: doses('PCV15', ['2026-09-01']), ppsv23Doses: [] },
    { cards: [new RegExp(`^PPSV23 \\(≥${W8_ADULT} after PCV15\\)`)] }),
  // Spacing and invalid doses
  infantShort: ex('Infant, PCV20 at 2 months and again 2 weeks later',
    { dob: '2026-07-01', riskIds: [], pcvDoses: doses('PCV20', ['2026-09-01', '2026-09-15']), ppsv23Doses: [] },
    { cards: [/PCV dose 2 of 4/], chip: ['pcv', 1, 'Invalid'] }),
  infantOnTime: ex('Infant, PCV20 at 2 and 4 months',
    { dob: '2026-05-01', riskIds: [], pcvDoses: doses('PCV20', ['2026-07-01', '2026-09-01']), ppsv23Doses: [] },
    { chip: ['pcv', 1, 'Dose 2 of 4'] }),
  toddler: ex('25-month-old with diabetes, PCV15 series, PPSV23 at 23½ months (too young, invalid)',
    { dob: '2024-09-30', riskIds: ['diabetes'], pcvDoses: doses('PCV15', ['2024-11-30', '2025-01-30', '2025-03-30', '2025-09-30']), ppsv23Doses: doses('PPSV23', ['2026-09-15']) },
    { cards: [/Option A: 1 dose PCV20/, /Option B: 1 dose PPSV23/], due: '2026-11-10', note: [/it can be given today if needed/], chip: ['ppsv23', 0, 'Invalid'] }),
  toddlerPcvSoon: ex('25-month-old with diabetes, PCV15 series, PPSV23 at 23½ months (too young, invalid), PCV20 4 weeks later',
    { dob: '2024-09-30', riskIds: ['diabetes'], pcvDoses: [...doses('PCV15', ['2024-11-30', '2025-01-30', '2025-03-30', '2025-09-30']), ...doses('PCV20', ['2026-10-13'])], ppsv23Doses: doses('PPSV23', ['2026-09-15']) },
    { status: 'complete', chip: ['pcv', 4, 'Dose 5'] }),
  leah: ex('7-year-old with diabetes, PCV15 on Aug 31 and PPSV23 51 days later (invalid)',
    { dob: '2019-08-15', riskIds: ['diabetes'], pcvDoses: doses('PCV15', ['2026-08-31']), ppsv23Doses: doses('PPSV23', ['2026-10-21']) },
    { cards: [/^1 dose PCV20 \(≥8 weeks\) — completes the series$/], noCards: [/PPSV23/], chip: ['ppsv23', 0, 'Invalid'] }),
  sam: ex('2-year-old with asplenia, PCV13 series, PPSV23 at 23 months and again 5 weeks later (both invalid)',
    { dob: '2023-01-01', today: '2025-03-01', riskIds: ['asplenia'], pcvDoses: doses('PCV13', ['2023-03-01', '2023-05-01', '2023-07-01', '2024-01-15']), ppsv23Doses: doses('PPSV23', ['2024-12-01', '2025-01-05']) },
    { cards: [/^1 dose PCV20/], noCards: [/PPSV23/] }),
  ppsvThenPcvSoon: ex('5-year-old with diabetes, PCV13 series, PPSV23 then PCV20 4 weeks later',
    { dob: '2021-11-01', riskIds: ['diabetes'], pcvDoses: doses('PCV13', ['2022-01-01', '2022-03-01', '2022-05-01', '2022-11-15']).concat(doses('PCV20', ['2026-10-01'])), ppsv23Doses: doses('PPSV23', ['2026-09-03']) },
    { chip: ['pcv', 4, 'Invalid'] }),
  ic2ndEarly: ex('12-year-old with asplenia, PPSV23 at 8 and again at 10',
    { dob: '2014-11-01', riskIds: ['asplenia'], pcvDoses: doses('PCV13', ['2015-01-01', '2015-03-01', '2015-05-01', '2015-11-15']), ppsv23Doses: doses('PPSV23', ['2022-11-15', '2024-11-15']) },
    { chip: ['ppsv23', 1, 'Dose 2'] }),
  nonIc2nd: ex('12-year-old with diabetes, PPSV23 at 8 and again at 10',
    { dob: '2014-11-01', riskIds: ['diabetes'], pcvDoses: doses('PCV13', ['2015-01-01', '2015-03-01', '2015-05-01', '2015-11-15']), ppsv23Doses: doses('PPSV23', ['2022-11-15', '2024-11-15']) },
    { chip: ['ppsv23', 1, 'Extra dose — more than this series needs'] }),
  pcv7: ex('3-year-old, PCV7 only',
    { dob: '2023-11-01', riskIds: [], pcvDoses: doses('PCV7', ['2024-01-01']), ppsv23Doses: [] },
    { chip: ['pcv', 0, 'Not counted'] }),
  undatedExtra: ex('Healthy 60-year-old, two PCV20 doses on record, neither dated',
    { ageMonths: 720, riskIds: [], pcvDoses: [{ product: 'PCV20', date: '' }, { product: 'PCV20', date: '' }], ppsv23Doses: [] },
    { chip: ['pcv', 1, 'Extra dose? — no date recorded'] }),
  adultEarlyPpsv: ex('Healthy 55-year-old, PCV15 on Jan 1, 2026 and PPSV23 a month later',
    { ageMonths: 660, riskIds: [], pcvDoses: doses('PCV15', ['2026-01-01']), ppsv23Doses: doses('PPSV23', ['2026-02-01']) },
    { status: 'complete', chip: ['ppsv23', 0, 'Dose 1'] }),
  adultPcvClose: ex('30-year-old with diabetes, PCV15 then PCV20 2 weeks later',
    { ageMonths: 360, riskIds: ['diabetes'], pcvDoses: doses('PCV15', ['2026-09-01']).concat(doses('PCV20', ['2026-09-15'])), ppsv23Doses: [] },
    { status: 'complete', chip: ['pcv', 1, 'Dose 2'] }),
};
export const WORKED_PATIENTS = P;

// ═════════════════════════════════════════════════════════════════════════
//  THE PAGE IN THE APP'S OWN ORDER (owner, 2026-11-01, second review)
// ═════════════════════════════════════════════════════════════════════════
//
// Her brief: *"I want this rulebook to follow the logic of the app but also be
// instructive for a user to find the relevant rule to back up a piece of
// vaccine logic without being overwhelmed by text or figures."* So the parts
// run in the order the engine decides — the transplant stop, the vaccines,
// who the patient is (age, risk group), what children and adults are given,
// then how a recorded dose is checked — and three things changed with it:
//
//   • ONE SOURCE SENTENCE PER CLAIM. A row names the sentences it rests on
//     (`cite`, refs.js keys). The Source button shows only those, and only
//     when the app's own card for the row's worked patient cites them — so a
//     row can never show a sentence the app does not use. When documents say
//     the same thing, CDC's schedule notes come first and p2016 only when no
//     CDC sentence on that card says it (her rule of 2026-10-23). When they
//     disagree, the row cites the document the app FOLLOWS (mm7401a1's "≥8
//     weeks" at 19-49 over CDC's notes' "may use").
//   • PNEUMOVAX DECISIONS ARE NUMBERED AND WRITTEN ONCE (`DECISIONS`). A row
//     names its decision by key; the chip opens that decision's own reason in
//     place, and part 6 lists them all. The four grey paragraphs under tables
//     are gone — each explained a different chip from the one beside it.
//   • THE RISK GRID IS FOLDED INTO THE SCHEDULES. Its child rows repeated the
//     children's table and its adult rows the adult history table, and its
//     colours meant three things. Each answer now has one home.

/** The parts of the page, in the order the app decides. */
export const HEADINGS = {
  vaccines: 'The vaccines',
  who: 'Age and risk group',
  kids: `Children, birth to ${ADULT_SCHED_MIN_M / 12 - 1} years`,
  lanes: `Age ${AGE.m24 / 12} to ${ADULT_SCHED_MIN_M / 12 - 1} years, by risk group`,
  adults: `Adults, ${yrs(ADULT_SCHED_MIN_M)} and over`,
  spacing: 'Doses on the record',
  decisions: 'PneumoVax decisions',
  sources: 'Sources',
};

// ── PneumoVax decisions: written once, named, opened in place ────────────
//
// Every place CDC and ACIP give no answer and the app chose one. A row says
// `decision: 'key'` (or a list); the chip reads "PneumoVax decision: <short>"
// and opens the entry below. Every entry has the same three parts, in this
// order (owner, 2026-11-01: "The problem/what the issue is and why it's a
// problem, PneumoVax decision. What CDC and ACIP provide or have lack of
// guidance for. Remove the why at the end"; she chose the gap before the
// answer): `problem` — the situation and why it needs an answer; `cdc` —
// what CDC and ACIP say, and what they leave out; `does` — what PneumoVax
// does, as an action a clinician can follow. `ex` is the patient whose card
// shows the decision.
const W4 = wk(ADULT_CONJUGATE_SUPPORTED_MIN_DAYS);
const Y1_PCV_AFTER_PPSV = gapOf('ADULT-PCV-AFTER-PPSV23');
export const DECISIONS = [
  {
    key: 'transplant',
    short: 'Transplant stop',
    problem: 'The patient has had a stem cell transplant, CAR-T or B-cell-depleting therapy. Revaccination after these therapies is individualized, so a standard schedule could be wrong for them.',
    cdc: 'Give a separate schedule for stem cell transplant recipients, outside the routine and risk-based schedules.',
    does: 'Stops and shows no recommendation, even when another condition is also selected. Follow institutional guidelines (ASCO, NCCN, IDSA, CDC).',
    ex: [P.transplant],
  },
  {
    key: 'ppsvNotRepeated',
    short: 'PPSV23 not repeated',
    problem: `A PPSV23 did not count: the first was given <${W8} after a PCV, or two PPSV23 doses on the record both did not count. Giving PPSV23 again adds another PPSV23 dose, and each additional PPSV23 dose produces a weaker immune response to some serotypes.`,
    cdc: 'Offer PPSV23 at this step, as for a patient who has not had one. They do not say what to give when a PPSV23 already on the record did not count.',
    does: 'Gives PCV20 instead (adults: PCV20 or PCV21). Does not offer PPSV23, or PCV15, because PCV15 would need a PPSV23 after it.',
    ex: [P.leah, P.sam, P.pcv15ThenBad19],
  },
  {
    key: 'invalidPpsvTiming',
    short: 'Invalid PPSV23 still sets the timing',
    problem: `A PPSV23 on the record did not count (given before ${yrs(AGE.m24)}, or <${W8} after a PCV). The patient still received it, and the spacing after a PPSV23 is about the immune response, so the next dose could be timed from it or as if it were never given.`,
    cdc: 'Give intervals measured from a PPSV23. They do not say whether a PPSV23 that did not count still starts that interval.',
    does: `Times the next dose from the PPSV23 that did not count. Children: next PCV advised ≥${W8} after it (a PCV given sooner still counts); a repeat PPSV23 ≥${Y5} after it. Adults: next PCV advised ≥${Y1_PCV_AFTER_PPSV} after it.`,
    ex: [P.toddler, P.toddlerPcvSoon, P.pcv15ThenBad19],
  },
  {
    key: 'pcvAfterPpsvInvalid',
    short: 'PCV too soon after PPSV23',
    problem: `A child's PCV is given <${W8} after a PPSV23 that counted. A PCV given soon after PPSV23 produces a weaker immune response.`,
    cdc: `Give the PCV ≥${W8} after the PPSV23. They do not say whether a PCV given sooner counts.`,
    does: `Marks the PCV Invalid; it does not count toward the series. If the series is complete without it, nothing is repeated. If a PCV is still needed, the note gives the earliest date, ≥${W8} after the invalid dose.`,
    ex: [P.ppsvThenPcvSoon],
  },
  {
    key: 'icSecondPpsvCounts',
    short: 'Early 2nd PPSV23 still counts',
    problem: `An immunocompromised child's 2nd PPSV23 is given <${Y5} after the 1st. Repeating it would mean a 3rd PPSV23, and each additional PPSV23 dose produces a weaker immune response to some serotypes.`,
    cdc: `Give the 2nd PPSV23 ≥${Y5} after the 1st. They do not say whether a 2nd dose given sooner counts.`,
    does: `Counts the dose and does not repeat it. The note under it states the actual gap and the ${Y5} recommended. No further PPSV23 is given.`,
    ex: [P.ic2ndEarly],
  },
  {
    key: 'adultPcvAfterPcv',
    short: 'Adult PCV after PCV',
    problem: `An adult receives a PCV soon after another PCV, for example PCV20 after a PCV15 that was not on the record. Other ACIP schedules (infants, transplant recipients) space PCV doses ≥${W4} apart, so there are no data on a shorter gap.`,
    cdc: 'Give no interval between two adult PCV doses, and do not say whether one given soon after another counts.',
    does: `Counts the dose at any interval. If it was given <${W4} after the earlier PCV, the note offers an optional repeat (PCV20 or PCV21) ≥${W8} after it, most worth considering for an immunocompromised patient.`,
    ex: [P.adultPcvClose],
  },
];
export const DECISION = Object.fromEntries(DECISIONS.map((d) => [d.key, d]));
/** A row's decision keys, as a list. */
export const decisionsOf = (row) => (row?.decision == null ? [] : [].concat(row.decision));

// ── 0. The stop ──────────────────────────────────────────────────────────
export const TRANSPLANT_STOP = {
  title: 'Stem cell transplant, CAR-T or B-cell-depleting therapy',
  text: 'Individualized revaccination schedule required. Refer to institutional guidelines.',
  decision: 'transplant',
  ex: [P.transplant],
};

// ── 1. The vaccines ──────────────────────────────────────────────────────
// `atRisk` is a second line for an at-risk child (owner, 2026-11-01: "PCV15 -
// at risk comment under use in children should have a separate row for it"),
// worded to say what completes the series, as the other cells do.
const AT_RISK_FOLLOW_UP = `Complete the series with PCV20 or PPSV23, ≥${W8} after the last PCV.`;
const USE = {
  PCV15: { child: 'Routine series.', atRisk: AT_RISK_FOLLOW_UP, adult: 'Follow with PPSV23 to complete the series (PCV20 or PCV21 if PPSV23 is unavailable).' },
  PCV20: { child: 'Routine series.', atRisk: 'A series that includes PCV20 is complete. PPSV23 is not needed.', adult: 'A single dose completes the series.' },
  PPSV23: { child: 'At risk only, after the PCV series.', adult: 'After PCV15, to complete the series.' },
  PCV21: { child: `Not licensed under ${yrs(PCV21_MIN_AGE_M)}.`, adult: 'A single dose completes the series.' },
  PCV13: { child: 'Counts toward the routine series.', atRisk: AT_RISK_FOLLOW_UP, adult: `Follow with PCV20 or PCV21, ≥${gapOf('ADULT-PCV20-21-AFTER-PCV13')} later, to complete the series.` },
  PCV7: { both: 'Does not count. A PCV7-only history is treated as unvaccinated.' },
};
const minAgeWords = (p) => (p.minAgeDays != null ? wk(p.minAgeDays) : yrs(p.minAgeM));
export const VACCINE_ROWS = ['current', 'history'].map((kind) => ({
  kind,
  name: kind === 'current' ? 'Current vaccines, by minimum age' : 'No longer used: history only',
  rows: ALL_PRODUCTS
    .filter((p) => (kind === 'current' ? !p.historyOnly : p.historyOnly))
    .sort((a, b) => a.minAgeM - b.minAgeM)
    .map((p) => ({
      key: p.key,
      name: p.key,
      brand: p.label.replace(/^.*\((.*)\)$/, '$1'),
      ppsv: p.type === 'PPSV23',
      old: !p.active,
      minAge: minAgeWords(p),
      valid: p.counts,
      ...USE[p.key],
    })),
}));

// The owner kept these as a quick reference (2026-11-01: "it is helpful to
// reference"). Every one is also stated in its home in parts 3 to 5, so the
// patterns carry NO interval — a sixth copy of an interval is a sixth place
// for it to drift — and no Source: the source is on the rule's home row.
export const SERIES_PATTERNS = [
  { name: 'Single dose', doses: [{ text: 'PCV20 or PCV21' }], note: 'Adults. Also at-risk children after a completed routine series (PCV20 only).', ex: [P.healthy55, P.diabetic4] },
  { name: 'Two doses', doses: [{ text: 'PCV15' }, { text: 'PPSV23', ppsv: true }], note: 'At-risk children and adults. Adults: PCV20 or PCV21 may replace PPSV23 if it is unavailable.', ex: [P.asplenia10none, P.pcv15at55] },
  { name: 'Prior PCV13', doses: [{ text: 'PCV13', old: true }, { text: 'PCV20 or PCV21' }], note: 'Adults. At-risk children after a PCV13 series: PCV20 or PPSV23.', ex: [P.pcv13at60, P.diabetic4] },
  { name: 'Prior PPSV23 only', doses: [{ text: 'PPSV23', ppsv: true }, { text: 'PCV15, PCV20 or PCV21' }], note: 'A PCV is still needed.', ex: [P.ppsv70, P.asplenia8ppsv] },
  {
    name: 'PPSV23 not repeated',
    doses: [{ text: 'PPSV23', ppsv: true, struck: true }, { text: 'PCV20 (adults: or PCV21)' }],
    note: `When the first PPSV23 was invalid because it was given <${W8} after a PCV, or another PPSV23 would be a third dose.`,
    decision: 'ppsvNotRepeated',
    ex: [P.leah, P.sam],
  },
  { name: 'Not valid', doses: [{ text: 'PCV7', old: true }], end: 'Treat as unvaccinated', ex: [P.pcv7] },
];

// ── 2. Age and risk group ────────────────────────────────────────────────
/** The three age lines, youngest first (owner, 2026-10-31: chronological). */
export const AGE_LINES = [
  { age: `${yrs(PCV21_MIN_AGE_M)}`, text: 'PCV21 may be given. A product limit only; it does not change the schedule.' },
  { age: `${yrs(ADULT_SCHED_MIN_M)}`, text: 'The adult rules apply instead of the child ones.' },
  { age: `${yrs(ROUTINE_ADULT_MIN_M)}`, text: 'Every adult is recommended a pneumococcal vaccine. Below this age, an adult needs a risk condition.' },
];

const conds = (pred) => RISK_FACTORS.filter((r) => !r.exclude && pred(r)).map((r) => r.label);
const grp = (r) => r.group ?? r.class;
export const RISK_COLUMNS = [
  { key: 'IC', name: 'Immunocompromising', conditions: conds((r) => grp(r) === 'IC') },
  { key: 'special', name: 'Cochlear implant or CSF leak', conditions: conds((r) => grp(r) === 'special') },
  { key: 'nonIC', name: 'Chronic conditions', conditions: conds((r) => grp(r) === 'nonIC' && !r.adultOnly) },
  {
    key: 'adultOnly',
    name: 'Smoking or alcohol use disorder',
    conditions: conds((r) => grp(r) === 'nonIC' && r.adultOnly),
    note: `Adults only. Not a risk condition under ${yrs(ADULT_SCHED_MIN_M)}.`,
    cite: ['cdcChildSpecialSituations'],
    ex: [P.smoker10],
  },
];

export const RISK_RANKING = {
  lead: 'The highest-ranked condition decides the recommendation. Every selected condition is listed on the result.',
  steps: [
    { name: 'Stem cell transplant, CAR-T or B-cell-depleting therapy', ex: [P.transplant] },
    { name: 'Any immunocompromising condition', ex: [P.childMulti] },
    { name: 'Cochlear implant or CSF leak', ex: [P.adultMulti, P.cochlear15] },
    { name: 'Chronic conditions, smoking or alcohol use disorder', ex: [P.diabetic30pcv15] },
  ],
};

// ── 3. Children ──────────────────────────────────────────────────────────
/** The routine infant series, read out of CDC's own sentence. */
const routineQuote = REFS.pedsRoutine4Dose.quote;
const routineAges = routineQuote.replace(/^.* at /, '').replace(/ months$/, '').split(', ');
export const ROUTINE_INFANT = {
  products: ALL_PRODUCTS.filter((p) => p.type === 'PCV' && p.active && p.counts && p.minAgeM < AGE.m24)
    .map((p) => p.key).join(' or '),
  total: Number(routineQuote.match(/(\d+)-dose/)[1]),
  ages: routineAges.map((a) => `${a.replace('–', ' to ')} months`),
  quote: routineQuote,
  cite: ['pedsRoutine4Dose'],
  ex: [P.infantOnTime, P.healthy3],
};

/**
 * The children's table, one row per patient group. Step cells are
 * 'dose' | 'none'; a cell's `note` carries the catch-up and skip rules that
 * used to sit in a bullet list under the table (owner, 2026-11-01: "Is there
 * any way to incorporate in the visual").
 */
// Owner, 2026-11-01: "Routine series should specify routine PCV series so
// the user knows to look above."
const ROUTINE_ABOVE = 'Routine PCV series (above)';
const CATCHUP_AT_RISK = `If incomplete at ${yrs(AGE.m24)} to under ${yrs(AGE.m72)}: 1 or 2 catch-up PCV doses, ≥${W8} apart`;
const SKIP_IF_PCV20 = `≥${W8} after last PCV. Not needed if the series included PCV20.`;
export const CHILD_LANES = [
  {
    group: 'Healthy',
    steps: [
      { kind: 'dose', text: ROUTINE_ABOVE, note: `If incomplete at ${yrs(AGE.m24)} to under ${yrs(AGE.m60)}: 1 catch-up PCV dose, ≥${W8} after the last dose` },
      { kind: 'none' },
      { kind: 'none' },
    ],
    result: { text: 'Complete', note: `From ${yrs(AGE.m60)}: no catch-up; not indicated. Re-evaluate at ${yrs(ROUTINE_ADULT_MIN_M)}.` },
    cite: ['pedsHealthyCatchup', 'adultRoutine50'],
    ex: [P.healthy3, P.healthy6],
  },
  {
    group: 'Chronic condition, cochlear implant or CSF leak',
    steps: [
      { kind: 'dose', text: ROUTINE_ABOVE, note: CATCHUP_AT_RISK },
      { kind: 'dose', text: 'PCV20 or PPSV23', ppsv: true, note: SKIP_IF_PCV20 },
      { kind: 'none' },
    ],
    result: { text: 'Complete' },
    cite: ['pedsRiskIncompleteCatchup', 'pedsRiskPcv20orPpsv23', 'pedsRiskPcv20CompleteAt2', 'pedsRiskSinglePpsv23AfterPcv'],
    ex: [P.diabetic4, P.cochlear4, P.diabetic5done, P.diabetic3partial, P.diabeticPcv20],
  },
  {
    group: 'Immunocompromising',
    steps: [
      { kind: 'dose', text: ROUTINE_ABOVE, note: CATCHUP_AT_RISK },
      { kind: 'dose', text: 'PCV20 or PPSV23', ppsv: true, note: SKIP_IF_PCV20 },
      { kind: 'dose', text: 'PCV20 or 2nd PPSV23', ppsv: true, note: `≥${Y5} after PPSV23 (only if step 2 was PPSV23)` },
    ],
    result: { text: 'Complete' },
    cite: ['pedsRiskIncompleteCatchup', 'pedsIcPcv20orPpsv23', 'pedsIcPpsvWaitFiveYears', 'pedsRiskPcv20CompleteAt2'],
    ex: [P.asplenia5ppsv, P.asplenia3partial, P.asplenia4pcv20],
  },
  // Owner, 2026-11-01: "What is the purpose of At risk, no PCV before 6
  // years?" It is CDC's own split at 6-18 — "Not previously received any dose
  // of PCV13, PCV15, or PCV20" is a separate row from "Received PCV before age
  // 6 years". The old label said neither the age nor "never", and a PCV13
  // first given at 6 or older is NOT this row (CDC: PCV20 or PPSV23), so it
  // now says both. Step 3 used to read None for every child; since P1-2 the
  // app gives an immunocompromised child the 5-year dose.
  {
    group: `At risk, ${AGE.m72 / 12} to ${ADULT_SCHED_MIN_M / 12 - 1} years, never had a PCV`,
    steps: [
      { kind: 'dose', text: 'PCV20 or PCV15', note: `First PCV already given at ${yrs(AGE.m72)} or older: start at step 2 (PCV20 or PPSV23)` },
      { kind: 'dose', text: 'PPSV23', ppsv: true, note: `≥${W8} after PCV15 (only if step 1 was PCV15)` },
      { kind: 'dose', text: 'PCV20 or 2nd PPSV23', ppsv: true, note: `Immunocompromising only: ≥${Y5} after PPSV23` },
    ],
    result: { text: 'Complete' },
    cite: ['pedsRisk6to18NoPcv', 'pedsIc6to18NoPcv', 'pedsRiskPcv13At6', 'pedsSecondPpsv5y'],
    ex: [P.asplenia10none, P.diabetic10none, P.diabetic8pcv13],
  },
];

/** The children's table hands over to the adult one at the child/adult line. */
export const AT_NINETEEN = `From ${yrs(ADULT_SCHED_MIN_M)}, the adult rules apply, including to doses given in childhood: see Adults, prior pneumococcal vaccines.`;

// ── 4. Adults ────────────────────────────────────────────────────────────
export const ADULT_BANDS = [
  { label: band(ADULT_SCHED_MIN_M, ROUTINE_ADULT_MIN_M), sub: 'Risk condition required', cite: ['cdcAdultRiskFactorList'], ex: [P.healthy30, P.smoker30] },
  { label: `${ROUTINE_ADULT_MIN_M / 12} and over`, sub: 'All adults', cite: ['adultRoutine50'], ex: [P.healthy55] },
];

// The ONE home of the adult PCV15 -> PPSV23 interval (it was written in five
// places). The usual interval first, the exception in parentheses (owner,
// 2026-11-01). ACIP's two verbs are kept: "administer ≥8 weeks" at 19-49,
// "can be considered" from 50 — and the 19-49 row cites mm7401a1, the
// document the app follows there, not CDC's notes ("may use").
const IC_SPECIAL = 'an immunocompromising condition, cochlear implant or CSF leak';
export const ADULT_PCV15_PPSV23 = `≥${Y1} (≥${W8_ADULT} at ${band(ADULT_SCHED_MIN_M, ROUTINE_ADULT_MIN_M)} with ${IC_SPECIAL}; from ${yrs(ROUTINE_ADULT_MIN_M)}, ≥${W8_ADULT} may be considered for these conditions)`;
export const ADULT_OPTIONS = {
  lead: 'No prior pneumococcal vaccine: either option completes the series',
  a: { doses: ['PCV20 or PCV21'] },
  b: { doses: ['PCV15', 'PPSV23'], gap: Y1 },
  note: `Option B interval: ${ADULT_PCV15_PPSV23}.`,
  cite: ['adultPcv20or21Complete', 'adultPcv15ThenPpsv', 'adultPcv15ThenPpsvShort'],
  ex: [P.csf30, P.smoker30, P.pcv15at55, P.cochlear45pcv15, P.asplenia60pcv15],
};

/**
 * Prior vaccines, with the risk group as a column where the answer splits
 * (owner, 2026-11-01: fold the risk grid into the schedules). Each `split`
 * is one row of the table; `risk: null` means every risk group.
 */
const ANY = null;
export const ADULT_HISTORY = [
  { history: 'PCV13 only', splits: [{ risk: ANY, next: `PCV20 or PCV21, ≥${gapOf('ADULT-PCV20-21-AFTER-PCV13')} after PCV13`, cite: ['adultPcv13Only'], ex: [P.pcv13at60] }] },
  { history: 'PPSV23 only', splits: [{ risk: ANY, next: `PCV15, PCV20 or PCV21, ≥${gapOf('ADULT-PCV-AFTER-PPSV23')} after the last PPSV23`, cite: ['adultPpsvOnly'], ex: [P.ppsv70] }] },
  {
    history: 'PCV15 only',
    splits: [{ risk: ANY, next: 'PPSV23, at the Option B interval above. If PPSV23 is unavailable: PCV20 or PCV21.', cite: ['adultPcv15ThenPpsv', 'jobAidPpsv23Unavailable'], ex: [P.pcv15at55, P.cochlear45pcv15] }],
  },
  // Owner, 2026-11-01: "should either give a brief explanation why PPSV23
  // isn't listed as an option here. Also consider removing 'No PPSV23'". The
  // explanation is decision 'ppsvNotRepeated', opened from the chip. And the
  // context it lacked: every adult interval is advice only (no adult row is a
  // floor since 2026-10-25), so an adult's PPSV23 can only be invalid if it
  // was given under the CHILD rules.
  {
    history: `PCV15, then an invalid PPSV23 (given before ${yrs(ADULT_SCHED_MIN_M)})`,
    splits: [{ risk: ANY, next: `PCV20 or PCV21, ≥${Y1_PCV_AFTER_PPSV} after the PPSV23`, decision: ['ppsvNotRepeated', 'invalidPpsvTiming'], cite: ['adultPpsv23Unavailable'], ex: [P.pcv15ThenBad19] }],
  },
  {
    history: `PCV13 and PPSV23, ${band(ADULT_SCHED_MIN_M, ROUTINE_ADULT_MIN_M)}`,
    splits: [
      { risk: 'Immunocompromising condition, cochlear implant or CSF leak; one PPSV23 dose', next: `PCV20 or PCV21, ≥${Y5} after the last dose`, cite: ['adultIc1949BothPcv13Ppsv'], ex: [P.bothHiv30, P.bothCsf40] },
      // Moved here from the children's "At 19" row (owner, 2026-11-01: remove
      // it, the patient is under Adults) — the adult table had not shown
      // ACIP's two-dose row at all.
      { risk: 'Immunocompromising condition, cochlear implant or CSF leak; two PPSV23 doses', next: `Review at ${yrs(ROUTINE_ADULT_MIN_M)}, or PCV20 or PCV21 ≥${Y5} after the last dose`, cite: ['mmwrIc1949TwoPpsv'], ex: [P.hiv30two, P.csf40two, P.asplenia16two] },
      { risk: 'Chronic conditions, smoking or alcohol use disorder', next: `None now; review at ${yrs(ROUTINE_ADULT_MIN_M)}`, cite: ['adultChronicOnlyReviewAt50'], ex: [P.bothDiabetic40, P.bothSmoker40, P.diabetic15] },
    ],
  },
  // Owner, 2026-11-01: "the 'from 50 years' is confusing" — it meant the
  // patient's age now.
  {
    history: `PCV13 and PPSV23, ${yrs(ROUTINE_ADULT_MIN_M)} and over`,
    splits: [{ risk: ANY, next: `PCV20 or PCV21, ≥${gapOf('ADULT-PCV20-21-5Y-AFTER-PPSV23')} after the last dose. Shared clinical decision-making if PPSV23 was given at ${yrs(AGE.y65)} or older.`, cite: ['adultBothNotAt65', 'adultBothAt65'], ex: [P.both60, P.both72] }],
  },
  { history: 'PCV20, PCV21, or PCV15 and PPSV23', splits: [{ risk: ANY, next: 'Complete', complete: true, cite: ['adultPcv20or21Complete', 'jobAidSeriesCompleteAt50'], ex: [P.pcv20adult, P.complete55] }] },
];

// ── 5. Doses on the record ───────────────────────────────────────────────
// The dose labels are the app's own words, so they carry no Source; the
// worked patients still prove each label.
export const CHIP_LEGEND = [
  // One entry for the two counted labels (owner, 2026-11-01: "Can dose 1 and
  // 2 child be combined"). `chips` pair with `ex` in order; the third patient
  // is the early-but-counted dose the last sentence describes.
  {
    chips: ['Dose 2 of 4', 'Dose 2'],
    tone: 'valid',
    text: `Counts. A baby under ${yrs(AGE.m24)} who is still in the PCV series sees the dose number and the series total, because the total depends on age at the first dose. Everyone else sees the dose number only. A dose given sooner than recommended that still counts (any adult dose, or an immunocompromised child's 2nd PPSV23) has a note under it stating the actual gap and the recommended one.`,
    ex: [P.infantOnTime, P.ic2ndEarly, P.adultEarlyPpsv],
  },
  { chip: 'Invalid', tone: 'invalid', text: 'Given before the minimum interval or the minimum age. Does not count. The note says whether to repeat it, and when.', ex: [P.infantShort] },
  { chip: 'Extra dose — more than this series needs', tone: 'extra', text: 'Given correctly, but not needed for this series. Do not repeat.', ex: [P.nonIc2nd] },
  { chip: 'Extra dose? — no date recorded', tone: 'extra', text: 'A dose with no date, beyond what the series needs. Add the date to check it.', ex: [P.undatedExtra] },
  { chip: 'Not counted', tone: 'extra', text: 'PCV7. Set aside; the patient is treated as unvaccinated. The result card says what to give.', ex: [P.pcv7] },
];

export const GRACE = {
  days: GRACE_DAYS,
  title: `${GRACE_DAYS}-day grace (CDC).`,
  text: `A dose given up to ${GRACE_DAYS} days before the minimum interval still counts. A dose given ${GRACE_DAYS + 1} or more days early is`,
};

/**
 * The children's exceptions to "an early dose does not count" (owner,
 * 2026-11-01: "use the pneumovax decision chip to explain what exceptions
 * there are when there is no CDC or ACIP guidance"). Each has its patient.
 */
export const CHILD_EXCEPTIONS = [
  { text: `Given up to ${GRACE_DAYS} days early: CDC's grace, above.`, ex: [P.infantOnTime] },
  { text: `A PCV given <${W8} after a PPSV23 that itself did not count. The ${W8} is advice only.`, decision: 'invalidPpsvTiming', ex: [P.toddlerPcvSoon] },
  { text: `An immunocompromised child's 2nd PPSV23 given <${Y5} after the first. The note states the actual gap. Other children do not need a 2nd PPSV23; it is labelled Extra dose.`, decision: 'icSecondPpsvCounts', ex: [P.ic2ndEarly, P.nonIc2nd] },
];

/** CDC Catch-up Table 2, probed out of the engine's own function. */
const pcvRule = DOSE_INTERVAL_RULES.find((r) => r.id === 'CHILD-PCV-AFTER-PCV');
const probe = (anchor, ctx) => wk(pcvRule.interval.daysFrom(anchor, ctx));
export const PCV_AFTER_PCV = {
  ruleIds: ['CHILD-PCV-AFTER-PCV'],
  rows: [
    { doses: 'Dose 1 → 2', when: `Dose 1 given before ${yrs(AGE.m12)}`, gap: probe({ ageAtDose: 6 }, { doseNumber: 2, ageAtDose: 7, anyPriorDoseBefore12: true }) },
    { doses: 'Dose 1 → 2', when: `Dose 1 given at ${yrs(AGE.m12)} or older`, gap: probe({ ageAtDose: 18 }, { doseNumber: 2, ageAtDose: 19, anyPriorDoseBefore12: false }) },
    { doses: 'Dose 2 → 3', when: `Dose 2 given before ${yrs(AGE.m7)}, and dose 3 before ${yrs(AGE.m12)}`, gap: probe({ ageAtDose: 6 }, { doseNumber: 3, ageAtDose: 7, anyPriorDoseBefore12: true }) },
    { doses: 'Dose 2 → 3', when: `Dose 2 given at ${AGE.m7} to ${AGE.m12 - 1} months`, gap: probe({ ageAtDose: 9 }, { doseNumber: 3, ageAtDose: 10, anyPriorDoseBefore12: true }) },
    { doses: 'Dose 3 → 4', when: `Dose 4 is the booster, given at ${yrs(AGE.m12)} or older`, gap: probe({ ageAtDose: 10 }, { doseNumber: 4, ageAtDose: 13, anyPriorDoseBefore12: true }) },
    { doses: 'Dose 3 → 4', when: `Dose 4 given before ${yrs(AGE.m12)}: valid (label "Dose 4 of 5"); the booster is still due`, gap: probe({ ageAtDose: 4 }, { doseNumber: 4, ageAtDose: 5, anyPriorDoseBefore12: true }) },
  ],
};

export const PCV_AND_PPSV23 = [
  { doses: 'PCV, then PPSV23', gap: gapOf('CHILD-PPSV23-AFTER-PCV'), ruleIds: ['CHILD-PPSV23-AFTER-PCV'], cite: ['pedsRiskPcv20orPpsv23'], ex: [P.diabetic4, P.leah] },
  // p2016 is the one sentence ON THIS CARD giving the gap from a PPSV23 to
  // the PCV (CDC's 6-18 notes row says only "1 dose of PCV15 or 1 dose of
  // PCV20") — her fallback rule, not a preference.
  { doses: 'PPSV23, then PCV', gap: gapOf('CHILD-PCV-AFTER-PPSV23'), decision: 'pcvAfterPpsvInvalid', text: 'A PCV given sooner is Invalid.', ruleIds: ['CHILD-PCV-AFTER-PPSV23'], cite: ['p2016NoPriorPcv6to18OptionA'], ex: [P.asplenia8ppsv, P.ppsvThenPcvSoon] },
  {
    doses: 'An invalid PPSV23, then PCV',
    gap: W8,
    decision: 'invalidPpsvTiming',
    text: `Advised ≥${W8} after the invalid PPSV23 (or the last PCV, if later). A PCV given sooner is still valid.`,
    ruleIds: [],
    ex: [P.toddler],
  },
  {
    doses: 'PPSV23, then a 2nd PPSV23',
    gap: gapOf('CHILD-PPSV23-AFTER-PPSV23'),
    decision: ['invalidPpsvTiming', 'icSecondPpsvCounts'],
    text: `Measured from the previous PPSV23, even one that did not count. Only immunocompromised children receive a 2nd PPSV23; one given <${Y5} after the 1st still counts, and the note states the actual gap.`,
    sub: 'Other children do not need a 2nd PPSV23; it is labelled',
    subChip: 'Extra dose',
    ruleIds: ['CHILD-PPSV23-AFTER-PPSV23', 'CHILD-PPSV23-AFTER-INVALID-PPSV23', 'CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST'],
    cite: ['pedsIcPpsvWaitFiveYears'],
    ex: [P.asplenia5ppsv, P.ic2ndEarly, P.nonIc2nd],
  },
];

/**
 * The visual example, FIRST in the invalid-dose box (owner, 2026-11-01:
 * "should have context ... Should it be at the top or bottom"): it shows how
 * an invalid dose is handled before the table says what to do for each kind.
 * `example` is the patient's facts (exempt from the typed-number scan, like
 * `who`); the chips are what the app shows, checked against P.infantShort.
 */
export const INVALID_EXAMPLE = {
  lead: "How an invalid dose is handled. Example: an infant's 2nd PCV given too soon",
  steps: [
    { example: '2 months', chip: 'Dose 1 of 4', tone: 'valid', text: 'Counts.' },
    { example: '2 weeks later', chip: 'Invalid', tone: 'invalid', text: `Before the minimum interval (${wk(PCV_MIN_INTERVAL_DAYS_UNDER_12M)}). Stays on the record and does not count.` },
    { example: `${wk(PCV_MIN_INTERVAL_DAYS_UNDER_12M)} or more after the invalid dose`, chip: 'Dose 2 of 4', tone: 'valid', text: 'The next counted dose takes the invalid dose\'s number: dose 2.' },
  ],
  ex: [P.infantShort],
};

export const INVALID_ACTIONS = {
  rows: [
    { dose: 'PCV', action: 'Give the next dose in the series at the minimum interval above, counted from the date of the invalid dose.', ex: [P.infantShort] },
    { dose: `PPSV23 given before ${yrs(AGE.m24)}`, action: `Give PCV20 (advised ≥${W8} after the invalid dose). A repeat PPSV23 waits ≥${Y5} after it (Option B).`, decision: 'invalidPpsvTiming', cite: ['pedsRiskPcv20orPpsv23'], ex: [P.toddler] },
    { dose: `First PPSV23, given <${W8} after a PCV`, action: 'Do not repeat PPSV23. Give PCV20.', strong: 'Give PCV20.', decision: 'ppsvNotRepeated', ex: [P.leah] },
    { dose: 'Two PPSV23 doses on record, both invalid', action: 'Do not give a third PPSV23. Give PCV20 (adults: PCV20 or PCV21).', strong: 'Give PCV20', decision: 'ppsvNotRepeated', ex: [P.sam] },
  ],
  timing: 'The interval is counted from whichever is later: the invalid dose, or the last dose that counted.',
};

export const ADULT_INTERVALS = {
  lead: 'Adult intervals are recommendations, not minimums. A dose given sooner still counts and is not repeated; its note states the actual gap and the recommended one. Doses given in childhood follow the child rules.',
  rows: [
    { doses: 'PCV15, then PPSV23', gap: null, text: ADULT_PCV15_PPSV23, ruleIds: ['ADULT-PPSV23-AFTER-PCV15', 'ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM', 'ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM-USED', 'ADULT-PPSV23-AFTER-PCV15-MEETS-SHORTER-ADVICE', 'ADULT-PPSV23-AFTER-PCV13', 'ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM', 'ADULT-PPSV23-AFTER-PCV-CATCH-ALL'], cite: ['adultPcv15ThenPpsv', 'adultPcv15ThenPpsvShort'], ex: [P.adultEarlyPpsv, P.cochlear45pcv15] },
    { doses: 'PCV13, then PCV20 or PCV21', gap: gapOf('ADULT-PCV20-21-AFTER-PCV13'), ruleIds: ['ADULT-PCV20-21-AFTER-PCV13', 'ADULT-PCV20-21-1Y-AFTER-PCV', 'ADULT-PCV-AFTER-PCV-CATCH-ALL'], cite: ['adultPcv13Only'], ex: [P.pcv13at60] },
    // Owner, 2026-11-01: "Shouldn't this have a pneumovax decision chip? What
    // have we decided on in terms of minimum acceptable interval?" CDC states
    // none; the dose counts at any gap; under 4 weeks the card also offers the
    // optional repeat (her 2026-10-25 decision, ADULT-PCV-AFTER-PCV-UNDER-4-WEEKS).
    {
      doses: 'PCV15, then PCV20 or PCV21',
      gap: null,
      text: 'CDC states no interval. Counts at any interval.',
      decision: 'adultPcvAfterPcv',
      ruleIds: ['ADULT-PCV20-21-AFTER-PCV15-NO-INTERVAL'],
      ex: [P.adultPcvClose],
    },
    { doses: 'PPSV23, then any PCV', gap: gapOf('ADULT-PCV-AFTER-PPSV23'), text: 'after the last PPSV23, including an invalid one.', decision: 'invalidPpsvTiming', ruleIds: ['ADULT-PCV-AFTER-PPSV23'], cite: ['adultPpsvOnly'], ex: [P.ppsv70, P.pcv15ThenBad19] },
    { doses: 'PCV13 and PPSV23, then PCV20 or PCV21', gap: gapOf('ADULT-PCV20-21-5Y-AFTER-PPSV23'), text: 'after the last dose.', ruleIds: ['ADULT-PCV20-21-5Y-AFTER-PPSV23'], cite: ['adultBothNotAt65'], ex: [P.both60] },
    { doses: 'PPSV23, then a 2nd PPSV23', gap: gapOf('ADULT-PPSV23-AFTER-PPSV23'), ruleIds: ['ADULT-PPSV23-AFTER-PPSV23'] },
    {
      doses: `PCV, then another PCV, <${W4} apart`,
      gap: null,
      text: `Counts. A repeat dose (PCV20 or PCV21) ≥${W8} later may be considered.`,
      decision: 'adultPcvAfterPcv',
      ruleIds: ['ADULT-PCV-AFTER-PCV-UNDER-4-WEEKS'],
      ex: [P.adultPcvClose],
    },
  ],
};

/** Every rule the engine applies must be on exactly one row of section 5. */
export const SPACING_RULE_IDS = [
  ...PCV_AFTER_PCV.ruleIds,
  ...PCV_AND_PPSV23.flatMap((r) => r.ruleIds),
  ...ADULT_INTERVALS.rows.flatMap((r) => r.ruleIds),
];

// ── Where each decision is used, generated from the rows above ───────────
// Part 6 lists these under each decision, so the list cannot name a place
// the chip is not, or miss one it is.
const USES = [
  [HEADINGS.vaccines, SERIES_PATTERNS, (r) => r.name],
  [HEADINGS.adults, ADULT_HISTORY.flatMap((h) => h.splits.map((s) => ({ ...s, label: h.history }))), (r) => r.label],
  [`${HEADINGS.spacing}, children`, [...CHILD_EXCEPTIONS.map((r) => ({ ...r, label: 'The dose still counts when' })), ...PCV_AND_PPSV23.map((r) => ({ ...r, label: r.doses })), ...INVALID_ACTIONS.rows.map((r) => ({ ...r, label: `Repeating an invalid dose, ${r.dose}` }))], (r) => r.label],
  [`${HEADINGS.spacing}, adults`, ADULT_INTERVALS.rows, (r) => r.doses],
];
export const DECISION_USES = Object.fromEntries(DECISIONS.map((d) => [d.key, [
  ...(decisionsOf(TRANSPLANT_STOP).includes(d.key) ? ['The stop, at the top of the page'] : []),
  ...USES.flatMap(([part, rows, label]) => rows.filter((r) => decisionsOf(r).includes(d.key)).map((r) => `${part}: ${label(r)}`)),
]]));

// ── The worked patient behind a row, run through the app ─────────────────
/**
 * The "Source" button's content: the CDC/ACIP sentences the app's own cards
 * cite for a row's worked patients. Generated, never transcribed: change the
 * card's citation and this changes with it.
 *
 * With `keys` (a row's `cite`), only those sentences, in that order — and
 * only if the app's card for one of the patients really cites them, so a row
 * can never show a sentence the app does not use. Without `keys`, every
 * sentence the cards cite (the old behaviour, kept for the guard that
 * measures it).
 */
export function sourcesFor(examples = [], keys = null) {
  const seen = new Map();
  for (const e of examples) {
    const out = recommend(e.input);
    for (const c of (out.recs ?? []).flatMap((r) => r.noteCites ?? [])) {
      if (!c?.quote || (keys && !keys.includes(c.key))) continue;
      const ref = REFS[c?.key];
      const id = keys ? c.key : c.quote;
      if (!seen.has(id)) seen.set(id, { key: c.key, quote: c.quote, doc: ref?.short ?? ref?.doc ?? c.key, url: c.url });
    }
  }
  const found = [...seen.values()];
  return keys ? keys.map((k) => found.find((q) => q.key === k)).filter(Boolean) : found;
}
