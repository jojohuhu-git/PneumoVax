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
import { REFS, highlightUrl } from './refs.js';

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
  lastPcvReceived: 'the most recent PCV that counted or was an extra dose',
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
// 2026-11-27 (owner mock-up E16): the screen now groups them by TYPE of
// document, as MeningoVax does (SOURCE_TYPES, at the end of this file), and
// shows no count of quoted sentences and no read date. Both are still worked
// out here — the count orders a group, and the date is what the freshness
// tripwire reads.
const PUBLISHER = (r) => {
  const u = r.url ?? '';
  if (u.includes('cdc.gov')) return 'CDC / ACIP';
  if (u.includes('immunize.org')) return 'immunize.org';
  return 'Other';
};

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

// The screen groups these by type of document (SOURCE_TYPES, below).


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
  intervalPhrase, intervalPhraseAdj, PCV_PPSV23_MIN_INTERVAL_DAYS, PPSV23_REVACC_MIN_MONTHS, GRACE_DAYS,
  ADULT_CONJUGATE_SUPPORTED_MIN_DAYS, PCV_MIN_INTERVAL_DAYS_UNDER_12M,
} from '../logic/intervals.js';
import { addDays, addCalendarMonths } from '../logic/dateUtils.js';
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
    { cards: [/^Not indicated/], status: 'not-indicated', note: [/Re-evaluate at age 50/] }),
  // P2-1 (2026-11-08): one worked patient per clause of the healthy row's
  // "Re-evaluate" note, so the page's sentence is held to the cards.
  healthy4done: ex('Healthy 4-year-old, PCV13 at 2, 4, 6 and 12 months',
    { dob: '2022-11-01', riskIds: [], pcvDoses: INFANT_PCV13_2022, ppsv23Doses: [] },
    { status: 'complete', note: [/Re-evaluate at age 50/] }),
  healthy10pcv20: ex('Healthy 10-year-old, PCV20 at 2, 4, 6 and 12 months',
    { dob: '2016-11-01', riskIds: [], pcvDoses: doses('PCV20', ['2017-01-01', '2017-03-01', '2017-05-01', '2017-11-15']), ppsv23Doses: [] },
    { cards: [/^Not indicated/], noNote: [/Re-evaluate/] }),
  healthy10pcv15ppsv: ex('Healthy 10-year-old, PCV15 at 2, 4, 6 and 12 months, PPSV23 at 2',
    { dob: '2016-11-01', riskIds: [], pcvDoses: doses('PCV15', ['2017-01-01', '2017-03-01', '2017-05-01', '2017-11-15']), ppsv23Doses: doses('PPSV23', ['2018-11-15']) },
    { cards: [/^Not indicated/], noNote: [/Re-evaluate/] }),
  diabetic4: ex('4-year-old with diabetes, PCV13 at 2, 4, 6 and 12 months',
    { dob: '2022-11-01', riskIds: ['diabetes'], pcvDoses: INFANT_PCV13_2022, ppsv23Doses: [] },
    { cards: [/Option A: 1 dose PCV20/, /Option B: 1 dose PPSV23/] }),
  cochlear4: ex('4-year-old with a cochlear implant, PCV13 at 2, 4, 6 and 12 months',
    { dob: '2022-11-01', riskIds: ['cochlear_implant'], pcvDoses: INFANT_PCV13_2022, ppsv23Doses: [] },
    { cards: [/Option A: 1 dose PCV20/, /Option B: 1 dose PPSV23/] }),
  asplenia5ppsv: ex('5-year-old with asplenia, PCV13 series, PPSV23 at 3',
    { dob: '2021-11-01', riskIds: ['asplenia'], pcvDoses: doses('PCV13', ['2022-01-01', '2022-03-01', '2022-05-01', '2022-11-15']), ppsv23Doses: doses('PPSV23', ['2024-11-15']) },
    { cards: [/1 dose PCV20 \(≥5 years after first PPSV23\)/, /2nd PPSV23/], due: '2029-11-15' }),
  diabeticPcv20: ex('4-year-old with diabetes, PCV20 at 2, 4, 6 and 12 months',
    { dob: '2022-11-01', riskIds: ['diabetes'], pcvDoses: doses('PCV20', ['2023-01-01', '2023-03-01', '2023-05-01', '2023-11-15']), ppsv23Doses: [] },
    { status: 'complete', cards: [/includes PCV20/] }),
  diabetic5done: ex('5-year-old with diabetes, PCV13 series, PPSV23 at 4',
    { dob: '2021-11-01', riskIds: ['diabetes'], pcvDoses: doses('PCV13', ['2022-01-01', '2022-03-01', '2022-05-01', '2022-11-15']), ppsv23Doses: doses('PPSV23', ['2025-11-15']) },
    { status: 'complete' }),
  sadie15m: ex('15-month-old with no spleen, PCV13 at 2, 4, 6 and 12 months: up to date, and a dose falls due at 2',
    { dob: '2025-08-01', riskIds: ['asplenia'], pcvDoses: doses('PCV13', ['2025-10-01', '2025-12-01', '2026-02-01', '2026-08-01']), ppsv23Doses: [] },
    { status: 'no-dose-now', cards: [/^PCV series up to date for age \(4 doses\)$/], note: [/One further dose falls due at age 2 years/] }),
  cochlear15: ex('15-year-old with a cochlear implant, PCV13 series, PPSV23 at 10',
    { dob: '2011-11-01', riskIds: ['cochlear_implant'], pcvDoses: doses('PCV13', ['2012-01-01', '2012-03-01', '2012-05-01', '2012-11-15']), ppsv23Doses: doses('PPSV23', ['2021-11-15']) },
    { status: 'complete', note: [/At 19, the adult schedule gives 1 dose of PCV20 or PCV21/] }),
  // The other two answers at 19 (2026-11-01 CDC re-check: the row claimed the
  // cochlear answer for every at-risk child).
  diabetic15: ex('15-year-old with diabetes, PCV13 series, PPSV23 at 10',
    { dob: '2011-11-01', riskIds: ['diabetes'], pcvDoses: doses('PCV13', ['2012-01-01', '2012-03-01', '2012-05-01', '2012-11-15']), ppsv23Doses: doses('PPSV23', ['2021-11-15']) },
    { status: 'complete', note: [/At 19, the adult schedule gives no dose until a review at age 50/] }),
  asplenia16two: ex('16-year-old with asplenia, PCV13 series, PPSV23 at 2 and 7',
    { dob: '2010-11-01', riskIds: ['asplenia'], pcvDoses: doses('PCV13', ['2011-01-01', '2011-03-01', '2011-05-01', '2011-11-15']), ppsv23Doses: doses('PPSV23', ['2013-01-01', '2018-02-01']) },
    { status: 'complete', note: [/At 19, the adult schedule says to review again at age 50, or give 1 dose of PCV20 or PCV21/] }),
  // R2 (OWNER RULINGS 2026-11-05): the next dose falls at 19 or later.
  tess14: ex('14-year-old with asplenia, PCV15 series, PPSV23 at 14: the wait ends after the adult schedule starts',
    { dob: '2012-10-11', riskIds: ['asplenia'], pcvDoses: doses('PCV15', ['2012-12-11', '2013-02-11', '2013-04-11', '2013-10-11']), ppsv23Doses: doses('PPSV23', ['2026-10-12']) },
    { status: 'complete', cards: [/^Complete at 19 \(PCV15 \+ PPSV23\)$/] }),
  rafi14: ex('14-year-old with asplenia, PCV13 series, PPSV23 at 14: the same wait, and the adult schedule still gives a dose',
    { dob: '2012-10-11', riskIds: ['asplenia'], pcvDoses: doses('PCV13', ['2012-12-11', '2013-02-11', '2013-04-11', '2013-10-11']), ppsv23Doses: doses('PPSV23', ['2026-10-12']) },
    { cards: [/^PCV20 or PCV21 ≥/], noCards: [/^2nd PPSV23/], due: '2031-10-12' }),
  noorExtra: ex('10-year-old with HIV, PCV13 series before 6, PPSV23 at 5, then a PCV15: extra, and the next dose still waits',
    { dob: '2016-10-11', riskIds: ['hiv'], pcvDoses: [...doses('PCV13', ['2016-12-11', '2017-02-11', '2017-04-11', '2017-10-11']), ...doses('PCV15', ['2026-09-27'])], ppsv23Doses: doses('PPSV23', ['2021-10-11']) },
    { cards: [/^1 dose PCV20/, /^2nd PPSV23/], due: '2026-11-22', chip: ['pcv', 4, 'Not counted — Extra. Do not repeat.'] }),
  // §C-P1-3, the other three families she ruled on the same day.
  lenaExtra: ex('10-year-old with a cochlear implant, PCV13 series before 6, no PPSV23 yet, then a PCV15: extra, and PCV20 or PPSV23 is still owed',
    { dob: '2016-10-11', riskIds: ['cochlear_implant'], pcvDoses: [...doses('PCV13', ['2016-12-11', '2017-02-11', '2017-04-11', '2017-10-11']), ...doses('PCV15', ['2026-09-27'])], ppsv23Doses: [] },
    { cards: [/^Option A: 1 dose PCV20/, /^Option B: 1 dose PPSV23/], due: '2026-11-22', chip: ['pcv', 4, 'Not counted — Extra. Do not repeat.'] }),
  theoExtra: ex('10-year-old with no spleen, PCV13 series before 6, two PPSV23 doses, then a PCV15: extra, and still complete',
    { dob: '2016-10-11', riskIds: ['asplenia'], pcvDoses: [...doses('PCV13', ['2016-12-11', '2017-02-11', '2017-04-11', '2017-10-11']), ...doses('PCV15', ['2026-09-27'])], ppsv23Doses: doses('PPSV23', ['2018-10-11', '2023-10-11']) },
    { cards: [/^PCV series complete/], status: 'complete', chip: ['pcv', 4, 'Not counted — Extra. Do not repeat.'] }),
  mateoExtra: ex('10-year-old with a cochlear implant, PCV13 series before 6, one PPSV23, then a PCV20: extra, and still complete',
    { dob: '2016-10-11', riskIds: ['cochlear_implant'], pcvDoses: [...doses('PCV13', ['2016-12-11', '2017-02-11', '2017-04-11', '2017-10-11']), ...doses('PCV20', ['2026-09-27'])], ppsv23Doses: doses('PPSV23', ['2018-10-11']) },
    { cards: [/^PCV series complete/], status: 'complete', chip: ['pcv', 4, 'Not counted — Extra. Do not repeat.'] }),
  benExtra: ex('Healthy 10-year-old, PCV13 series before 6, then a PCV15: extra',
    { dob: '2016-10-11', riskIds: [], pcvDoses: [...doses('PCV13', ['2016-12-11', '2017-02-11', '2017-04-11', '2017-10-11']), ...doses('PCV15', ['2026-09-27'])], ppsv23Doses: [] },
    { cards: [/^Not indicated/], status: 'not-indicated', chip: ['pcv', 4, 'Not counted — Extra. Do not repeat.'] }),
  priyaFirst: ex('Healthy 10-year-old, no doses before, then a first PCV20: stays valid, dose 1',
    { dob: '2016-10-11', riskIds: [], pcvDoses: doses('PCV20', ['2026-09-27']), ppsv23Doses: [] },
    { cards: [/^Not indicated/], status: 'not-indicated', chip: ['pcv', 0, 'Dose 1'] }),
  cal18: ex('Weeks from the adult schedule, heart disease, a first PCV15 this week: the adult wait replaces the child\'s',
    { dob: '2007-12-05', riskIds: ['chronic_heart'], pcvDoses: doses('PCV15', ['2026-10-31']), ppsv23Doses: [] },
    { cards: [/^PPSV23 \(≥/], due: '2027-10-31' }),
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
    { cards: [/Option A: 1 dose PCV20/, /Option B-1: 1 dose PCV15/, /Option B-2: PPSV23/], note: [new RegExp(`PCV20 or a second PPSV23, ≥${Y5} later`)] }),
  // 2026-11-01 (logic-order rebuild): the never-vaccinated 6-18 lane's step 3
  // read "None" for every at-risk child while the app gave an immunocompromised
  // one the 5-year dose (P1-2). These two hold both halves of that lane.
  diabetic10none: ex('10-year-old with diabetes, unvaccinated',
    { dob: '2016-11-01', riskIds: ['diabetes'], pcvDoses: [], ppsv23Doses: [] },
    { cards: [/Option A: 1 dose PCV20/, /Option B-1: 1 dose PCV15/], noNote: [new RegExp(`≥${Y5}`)] }),
  // 2026-11-27 (owner edit): a 6-18 child with a PCV before 6 follows the
  // chronic / immunocompromising rows, not the "no PCV before 6" row.
  diabetic10before6: ex('10-year-old with diabetes, PCV13 at 2, 4, 6 and 12 months',
    { dob: '2016-11-01', riskIds: ['diabetes'], pcvDoses: doses('PCV13', ['2017-01-01', '2017-03-01', '2017-05-01', '2017-11-15']), ppsv23Doses: [] },
    { cards: [/^Option A: 1 dose PCV20/, /^Option B: 1 dose PPSV23/], noCards: [/PCV15/] }),
  // 2026-11-27 (owner edit): the "first PCV at 6 or older" row, one patient per
  // product it names, and an immunocompromised one for its 5-year line.
  diabetic9pcv15: ex('9-year-old with diabetes, first PCV15 at 9',
    { dob: '2016-11-01', riskIds: ['diabetes'], pcvDoses: doses('PCV15', ['2026-06-01']), ppsv23Doses: [] },
    { cards: [/^Option A: 1 dose PCV20/, /^Option B: 1 dose PPSV23/] }),
  asplenia9pcv13: ex('9-year-old with asplenia, first PCV13 at 9',
    { dob: '2016-11-01', riskIds: ['asplenia'], pcvDoses: doses('PCV13', ['2026-06-01']), ppsv23Doses: [] },
    { cards: [/^Option A: 1 dose PCV20/, /^Option B: 1 dose PPSV23/], note: [new RegExp(`≥${Y5} after the first PPSV23`)] }),
  diabetic9pcv20: ex('9-year-old with diabetes, first PCV20 at 9',
    { dob: '2016-11-01', riskIds: ['diabetes'], pcvDoses: doses('PCV20', ['2026-06-01']), ppsv23Doses: [] },
    { status: 'complete', cards: [/includes PCV20/] }),
  diabetic8pcv13: ex('8-year-old with diabetes, first PCV13 at 7',
    { dob: '2018-11-01', riskIds: ['diabetes'], pcvDoses: doses('PCV13', ['2025-12-01']), ppsv23Doses: [] },
    { cards: [/Option A: 1 dose PCV20/, /Option B: 1 dose PPSV23/], noCards: [/PCV15/] }),
  asplenia4pcv20: ex('4-year-old with asplenia, PCV20 at 2, 4, 6 and 12 months',
    { dob: '2022-11-01', riskIds: ['asplenia'], pcvDoses: doses('PCV20', ['2023-01-01', '2023-03-01', '2023-05-01', '2023-11-15']), ppsv23Doses: [] },
    { status: 'complete', cards: [/includes PCV20/] }),
  smoker10: ex('10-year-old who smokes, unvaccinated (smoking counts only in adults)',
    { dob: '2016-11-01', riskIds: ['smoking'], pcvDoses: [], ppsv23Doses: [] },
    { status: 'not-indicated', note: [/Re-evaluate at age 19/], noNote: [/Re-evaluate at age 50/] }),
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
    { cards: [new RegExp(`^PPSV23 \\(≥${Y1} after PCV15; completes the series\\)`)], due: '2027-05-01' }),
  cochlear45pcv15: ex('45-year-old with a cochlear implant, PCV15 on Sep 1, 2026',
    { ageMonths: 540, riskIds: ['cochlear_implant'], pcvDoses: doses('PCV15', ['2026-09-01']), ppsv23Doses: [] },
    { cards: [new RegExp(`^PPSV23 \\(≥${W8_ADULT} after PCV15; completes the series\\)`)], due: 'today' }),
  diabetic30pcv15: ex('30-year-old with diabetes, PCV15 on Sep 1, 2026',
    { ageMonths: 360, riskIds: ['diabetes'], pcvDoses: doses('PCV15', ['2026-09-01']), ppsv23Doses: [] },
    { cards: [new RegExp(`^PPSV23 \\(≥${Y1} after PCV15; completes the series\\)`)], due: '2027-09-01' }),
  asplenia60pcv15: ex('60-year-old with asplenia, PCV15 on Sep 1, 2026',
    { ageMonths: 720, riskIds: ['asplenia'], pcvDoses: doses('PCV15', ['2026-09-01']), ppsv23Doses: [] },
    { cards: [new RegExp(`^PPSV23 \\(≥${Y1} after PCV15; completes the series\\)`)], note: [new RegExp(`minimum interval of ${W8_ADULT} may be considered`)] }),
  diabetic60pcv15: ex('60-year-old with diabetes, PCV15 on Sep 1, 2026',
    { ageMonths: 720, riskIds: ['diabetes'], pcvDoses: doses('PCV15', ['2026-09-01']), ppsv23Doses: [] },
    { cards: [new RegExp(`^PPSV23 \\(≥${Y1} after PCV15; completes the series\\)`)] }),
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
    { cards: [new RegExp(`^Review at age ${ROUTINE_ADULT_MIN_M / 12} \\(or PCV20 or PCV21`)] }),
  csf40two: ex('40-year-old with a CSF leak, PCV13 in 2012 and PPSV23 in 2013 and 2018',
    { ageMonths: 480, riskIds: ['csf_leak'], pcvDoses: doses('PCV13', ['2012-01-01']), ppsv23Doses: doses('PPSV23', ['2013-01-01', '2018-06-01']) },
    { cards: [new RegExp(`^Review at age ${ROUTINE_ADULT_MIN_M / 12} \\(or PCV20 or PCV21`)] }),
  bothDiabetic40: ex('40-year-old with diabetes, PCV13 in 2020 and PPSV23 in 2022',
    { ageMonths: 480, riskIds: ['diabetes'], pcvDoses: doses('PCV13', ['2020-01-01']), ppsv23Doses: doses('PPSV23', ['2022-01-01']) },
    { status: 'no-dose-now', cards: [new RegExp(`^No dose now\\. Review at age ${ROUTINE_ADULT_MIN_M / 12}$`)] }),
  bothSmoker40: ex('40-year-old who smokes, PCV13 in 2020 and PPSV23 in 2022',
    { ageMonths: 480, riskIds: ['smoking'], pcvDoses: doses('PCV13', ['2020-01-01']), ppsv23Doses: doses('PPSV23', ['2022-01-01']) },
    { cards: [new RegExp(`^No dose now\\. Review at age ${ROUTINE_ADULT_MIN_M / 12}$`)] }),
  pcv15ThenBad19: ex('19-year-old with diabetes, PCV15 on Sep 1, 2026 and PPSV23 19 days later (invalid)',
    { dob: '2007-10-01', riskIds: ['diabetes'], pcvDoses: doses('PCV15', ['2026-09-01']), ppsv23Doses: doses('PPSV23', ['2026-09-20']) },
    { cards: [new RegExp(`PCV20 or PCV21\\) ≥${Y1} after the PPSV23`)], noCards: [/^PPSV23/], due: '2027-09-20' }),
  // Owner, 2026-11-07 (Sam, §C-P2-ONE-ADULT): Leah's one-shot ruling, at 19.
  samAt19: ex('19-year-old with alcohol use disorder, a PCV and a PPSV23 on the same day at 18 (PPSV23 invalid)',
    { dob: '2007-06-01', riskIds: ['alcoholism'], pcvDoses: [{ product: '', date: '2025-08-01' }], ppsv23Doses: doses('PPSV23', ['2025-08-01']) },
    { cards: [/^1 dose PCV \(PCV20 or PCV21\)$/], noCards: [/PCV15/, /^PPSV23/] }),
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
    { cards: [/1 dose PCV20 \(≥5 years after first PPSV23\)/] }),
  adultMulti: ex('30-year-old with diabetes AND a cochlear implant, PCV15 on Sep 1, 2026',
    { ageMonths: 360, riskIds: ['diabetes', 'cochlear_implant'], pcvDoses: doses('PCV15', ['2026-09-01']), ppsv23Doses: [] },
    { cards: [new RegExp(`^PPSV23 \\(≥${W8_ADULT} after PCV15; completes the series\\)`)] }),
  // Spacing and invalid doses
  infantShort: ex('Infant, PCV20 at 2 months and again 2 weeks later',
    { dob: '2026-07-01', riskIds: [], pcvDoses: doses('PCV20', ['2026-09-01', '2026-09-15']), ppsv23Doses: [] },
    { cards: [/PCV dose 2 of 4/], chip: ['pcv', 1, 'Not counted — do not repeat'] }),
  infantOnTime: ex('Infant, PCV20 at 2 and 4 months',
    { dob: '2026-05-01', riskIds: [], pcvDoses: doses('PCV20', ['2026-07-01', '2026-09-01']), ppsv23Doses: [] },
    { chip: ['pcv', 1, 'Dose 2 of 4'] }),
  toddler: ex('25-month-old with diabetes, PCV15 series, PPSV23 at 23½ months (too young, invalid)',
    { dob: '2024-09-30', riskIds: ['diabetes'], pcvDoses: doses('PCV15', ['2024-11-30', '2025-01-30', '2025-03-30', '2025-09-30']), ppsv23Doses: doses('PPSV23', ['2026-09-15']) },
    { cards: [/Option A: 1 dose PCV20/, /Option B: 1 dose PPSV23/], due: '2026-11-10', note: [/It can be given today if needed/], chip: ['ppsv23', 0, 'Not counted — repeat'] }),
  toddlerPcvSoon: ex('25-month-old with diabetes, PCV15 series, PPSV23 at 23½ months (too young, invalid), PCV20 4 weeks later',
    { dob: '2024-09-30', riskIds: ['diabetes'], pcvDoses: [...doses('PCV15', ['2024-11-30', '2025-01-30', '2025-03-30', '2025-09-30']), ...doses('PCV20', ['2026-10-13'])], ppsv23Doses: doses('PPSV23', ['2026-09-15']) },
    { status: 'complete', chip: ['pcv', 4, 'Dose 5'] }),
  leah: ex('7-year-old with diabetes, PCV15 on Aug 31 and PPSV23 51 days later (invalid)',
    { dob: '2019-08-15', riskIds: ['diabetes'], pcvDoses: doses('PCV15', ['2026-08-31']), ppsv23Doses: doses('PPSV23', ['2026-10-21']) },
    { cards: [/^1 dose PCV20 \(≥8 weeks; completes the series\)$/], noCards: [/PPSV23/], chip: ['ppsv23', 0, 'Not counted — do not repeat'] }),
  sam: ex('2-year-old with asplenia, PCV13 series, PPSV23 at 23 months and again 5 weeks later (both invalid)',
    { dob: '2023-01-01', today: '2025-03-01', riskIds: ['asplenia'], pcvDoses: doses('PCV13', ['2023-03-01', '2023-05-01', '2023-07-01', '2024-01-15']), ppsv23Doses: doses('PPSV23', ['2024-12-01', '2025-01-05']) },
    { cards: [/^1 dose PCV20/], noCards: [/PPSV23/] }),
  ppsvThenPcvSoon: ex('5-year-old with diabetes, PCV13 series, PPSV23 then PCV20 4 weeks later',
    { dob: '2021-11-01', riskIds: ['diabetes'], pcvDoses: doses('PCV13', ['2022-01-01', '2022-03-01', '2022-05-01', '2022-11-15']).concat(doses('PCV20', ['2026-10-01'])), ppsv23Doses: doses('PPSV23', ['2026-09-03']) },
    { chip: ['pcv', 4, 'Not counted — do not repeat'] }),
  ic2ndEarly: ex('12-year-old with asplenia, PPSV23 at 8 and again at 10',
    { dob: '2014-11-01', riskIds: ['asplenia'], pcvDoses: doses('PCV13', ['2015-01-01', '2015-03-01', '2015-05-01', '2015-11-15']), ppsv23Doses: doses('PPSV23', ['2022-11-15', '2024-11-15']) },
    { chip: ['ppsv23', 1, 'Counted — given early, accepted'] }),
  nonIc2nd: ex('12-year-old with diabetes, PPSV23 at 8 and again at 10',
    { dob: '2014-11-01', riskIds: ['diabetes'], pcvDoses: doses('PCV13', ['2015-01-01', '2015-03-01', '2015-05-01', '2015-11-15']), ppsv23Doses: doses('PPSV23', ['2022-11-15', '2024-11-15']) },
    { chip: ['ppsv23', 1, 'Not counted — Extra. Do not repeat.'] }),
  pcv7: ex('3-year-old, PCV7 only',
    { dob: '2023-11-01', riskIds: [], pcvDoses: doses('PCV7', ['2024-01-01']), ppsv23Doses: [] },
    { chip: ['pcv', 0, 'Not counted — PCV7'] }),
  adultEarlyPpsv: ex('Healthy 55-year-old, PCV15 on Jan 1, 2026 and PPSV23 a month later',
    { ageMonths: 660, riskIds: [], pcvDoses: doses('PCV15', ['2026-01-01']), ppsv23Doses: doses('PPSV23', ['2026-02-01']) },
    { status: 'complete', chip: ['ppsv23', 0, 'Counted — given early, accepted'] }),
  adultPcvClose: ex('30-year-old with diabetes, PCV15 then PCV20 2 weeks later',
    { ageMonths: 360, riskIds: ['diabetes'], pcvDoses: doses('PCV15', ['2026-09-01']).concat(doses('PCV20', ['2026-09-15'])), ppsv23Doses: [] },
    { status: 'complete', chip: ['pcv', 1, 'Counted — given early, accepted'] }),
  // §DOSE-LABELS (2026-11-08): one worked patient for each label the key
  // gained that no patient above already shows.
  productUnknown: ex('30-year-old with diabetes, a PCV on Sep 1, 2026, product not recorded',
    { ageMonths: 360, riskIds: ['diabetes'], pcvDoses: [{ product: '', date: '2026-09-01' }], ppsv23Doses: [] },
    { chip: ['pcv', 0, 'Counted — product not recorded'] }),
  // §A-UNDATED (OWNER DECISION 2026-11-15): only an undated PPSV23 is still
  // counted; an undated PCV is "Not counted — no date" (Ruth, below).
  dateUnknown: ex('Healthy 70-year-old, PPSV23 on record with no date',
    { ageMonths: 840, riskIds: [], pcvDoses: [], ppsv23Doses: [{ product: 'PPSV23', date: '' }] },
    { chip: ['ppsv23', 0, 'Counted — date not recorded'] }),
  noDate: ex('Healthy 65-year-old, PCV20 on record with no date',
    { ageMonths: 780, riskIds: [], pcvDoses: [{ product: 'PCV20', date: '' }], ppsv23Doses: [] },
    { status: 'due', chip: ['pcv', 0, 'Not counted — no date'] }),
  ppsv2ndNotNeeded: ex('Healthy 72-year-old, PCV13 at 65, PPSV23 at 65 and again 28 days later, PCV20 at 71',
    { dob: '1954-10-01', riskIds: [], pcvDoses: [...doses('PCV13', ['2019-10-17']), ...doses('PCV20', ['2026-09-01'])], ppsv23Doses: doses('PPSV23', ['2020-09-25', '2020-10-23']) },
    { status: 'complete', chip: ['ppsv23', 1, 'Counted — not needed. No more PPSV23.'] }),
  futureDated: ex('Infant, PCV20 at 2 months and a second dated next year',
    { dob: '2026-05-01', riskIds: [], pcvDoses: doses('PCV20', ['2026-07-01', '2027-01-01']), ppsv23Doses: [] },
    { chip: ['pcv', 1, 'Check the date'] }),
  // Rulebook reorganization (owner mock-up 2026-11-27, E15): the two dose
  // lines the new adult decisions quote are THESE patients' lines, read off the
  // engine, never typed.
  adultPcv20Soon: ex('Healthy 60-year-old, PPSV23 on Jan 10, 2026 and PCV20 3 months later',
    { ageMonths: 720, riskIds: [], pcvDoses: doses('PCV20', ['2026-04-10']), ppsv23Doses: doses('PPSV23', ['2026-01-10']) },
    { status: 'complete', chip: ['pcv', 0, 'Counted — given early, accepted'] }),
  hivSameDay: ex('30-year-old with HIV, PCV15 and PPSV23 on the same day',
    { ageMonths: 360, riskIds: ['hiv'], pcvDoses: doses('PCV15', ['2026-01-10']), ppsv23Doses: doses('PPSV23', ['2026-01-10']) },
    { status: 'complete', chip: ['ppsv23', 0, 'Counted — given early, accepted'] }),
  // Step 5's PCV-after-PCV table: the two catch-up cells a card quotes (the
  // card states the minimum only when the routine date is later than it).
  catchup1to2: ex('3½-month-old, PCV20 at 6 weeks',
    { dob: '2026-07-15', riskIds: [], pcvDoses: doses('PCV20', ['2026-08-26']), ppsv23Doses: [] },
    { cards: [/^PCV dose 2 of 4$/], due: '2026-11-15' }),
  catchup2to3: ex('4½-month-old, PCV20 at 2 and 3 months',
    { dob: '2026-06-15', riskIds: [], pcvDoses: doses('PCV20', ['2026-08-15', '2026-09-15']), ppsv23Doses: [] },
    { cards: [/^PCV dose 3 of 4$/], due: '2026-12-15' }),
};
export const WORKED_PATIENTS = P;

// ═════════════════════════════════════════════════════════════════════════
//  THE PAGE — "How PneumoVax decides", in MeningoVax's layout (2026-11-27)
// ═════════════════════════════════════════════════════════════════════════
//
// The owner reviewed this page as a mock-up on 2026-11-27
// (docs/archive/mockup-2026-11-27-pneumovax-rulebook-v1.html; edits E1-E18,
// layout L1-L5). Its wording is hers: copied here, with every age and interval
// interpolated from the engine's own constants. In her words: "use the same
// show and show all buttons as meningovax."
//
//   L1  One fold, "How PneumoVax decides", of five steps, each a fold holding
//       its section; below a "Reference" label, the decisions and the
//       sources. Every fold starts closed.
//   L3  Gone because each repeated another part: the row of jump buttons,
//       "Common series patterns", the Age lines box and the separate
//       risk-group lists. A group's conditions sit under its name.
//   L4  "More than one condition" appears once in each schedule.
//   L5  Step 5 is "Time between doses" (she did not understand MeningoVax's
//       "Set the dates"; MeningoVax takes this name too).
//
// What has NOT changed, and is still how every sentence is held to the app:
//
//   • ONE SOURCE SENTENCE PER CLAIM. A row names the sentences it rests on
//     (`cite`, refs.js keys). The Source button shows only those, and only
//     when the app's own card for the row's worked patient cites them. ONE
//     named exception, `RULEBOOK_ONLY_SOURCES` below (owner, 2026-11-27).
//   • NO NUMBER IS TYPED, and EVERY CLAIM CARRIES A WORKED PATIENT (`ex`),
//     both enforced by the C14 guard.
//   • PNEUMOVAX DECISIONS ARE WRITTEN ONCE (`DECISIONS`), named, and opened in
//     place from a chip; "Applies in" is generated from the rows that name
//     them, so it cannot name a place the chip is not.

const wk4 = wk(PCV_MIN_INTERVAL_DAYS_UNDER_12M);
const W4 = wk(ADULT_CONJUGATE_SUPPORTED_MIN_DAYS);
const Y1_PCV_AFTER_PPSV = gapOf('ADULT-PCV-AFTER-PPSV23');
const Y1_AFTER_PCV13 = gapOf('ADULT-PCV20-21-AFTER-PCV13');
const Y5_AFTER_BOTH = gapOf('ADULT-PCV20-21-5Y-AFTER-PPSV23');
const Y5_SECOND_ADULT = gapOf('ADULT-PPSV23-AFTER-PPSV23');
const ADULT_AT = yrs(ADULT_SCHED_MIN_M);                 // "19 years"
const ROUTINE_AT = yrs(ROUTINE_ADULT_MIN_M);              // "50 years"
const CHILD_TO = `${ADULT_SCHED_MIN_M / 12 - 1} years`;  // "18 years"
const ADULT_BAND = band(ADULT_SCHED_MIN_M, ROUTINE_ADULT_MIN_M).replace(' to ', '–');   // "19–49 years"
const IC_SPECIAL = 'an immunocompromising condition, cochlear implant or CSF leak';
/** Who gets the adult 8 weeks, and how (ACIP's two verbs): one home, used twice. */
const W8_WHEN = `(${ADULT_BAND}; an option from ${ROUTINE_AT})`;
/** A worked patient's own dose line: the first line under that dose, as the app writes it. */
function lineOf(e, stream, i) {
  const line = recommend(e.input).perDose?.[stream]?.[i]?.reasons?.[0];
  if (!line) throw new Error(`rulebook: ${e.who} has no line under ${stream} dose ${i}`);
  return line;
}

/** The page's parts. Step titles are the fold names; L5 names step 5. */
export const HEADINGS = {
  how: 'How PneumoVax decides',
  stop: 'Stop check',
  record: 'Read the record',
  kids: 'Children\'s schedule',
  adults: 'Adults\' schedule',
  spacing: 'Time between doses',
  decisions: 'PneumoVax decisions',
  sources: 'Sources',
};

// ── E1: the intro and its two-item key ───────────────────────────────────
export const INTRO = {
  text: 'Recommendations are based on age, risk conditions and dated vaccine history.',
  key: [
    { kind: 'source', tag: 'Source', text: 'CDC or ACIP text the rule rests on' },
    { kind: 'decision', tag: 'PneumoVax decision', text: 'a rule CDC and ACIP do not state' },
  ],
};

// ── PneumoVax decisions (E14, E15): written once, named, opened in place ──
// The same three parts for every decision, in this order (owner, 2026-11-01):
// `problem`, `cdc` (what CDC and ACIP say, and what they leave out), `does`.
// The order is the order of the steps that use them.
export const DECISIONS = [
  {
    key: 'transplant',
    short: 'Transplant stop',
    problem: 'Stem cell transplant, CAR-T therapy, B-cell malignancy or B-cell-depleting therapy. Revaccination is individualized.',
    cdc: 'These patients need a separate revaccination schedule, outside the routine and risk-based schedules this app follows.',
    does: 'No recommendation is shown, even with another condition selected. Follow institutional guidelines (ASCO, NCCN, IDSA, CDC).',
    ex: [P.transplant],
  },
  {
    // E6: renamed from "A conjugate nobody asked for".
    key: 'conjugateNobodyAskedFor',
    short: 'A PCV given when none was due',
    problem: 'A child received a PCV the card did not recommend: PCV15 where PCV20 or PPSV23 was offered, a PCV after the series was complete, or a PCV for a healthy child for whom it was not indicated.',
    cdc: `After an at-risk child's PCV series, the next dose is PCV20 or PPSV23, not another PCV15. Once a series is complete, no further PCV is given, and a healthy child ${yrs(AGE.m60)} or older needs none. They do not say whether a PCV given anyway counts.`,
    does: `Labelled "Not counted — Extra. Do not repeat." A completed series stays complete. A dose still owed is given ≥${W8} after the extra PCV. Not applied to a healthy child's first dose, PCV13, an at-risk child under ${yrs(AGE.m72)}, or from ${ADULT_AT}.`,
    ex: [P.noorExtra, P.lenaExtra, P.theoExtra, P.mateoExtra, P.benExtra, P.priyaFirst],
  },
  {
    key: 'ppsvNotRepeated',
    short: 'PPSV23 not repeated',
    problem: `A PPSV23 did not count: the first was given <${W8} after a PCV, or two PPSV23 doses were given and neither counted. Each additional PPSV23 dose produces a weaker immune response to some serotypes.`,
    cdc: 'After the PCV, the next dose offered is PPSV23 (children: PCV20 or PPSV23; adults: PPSV23 after PCV15). That advice is written for a patient who has never had PPSV23. They do not say what to give when a PPSV23 is on the record but did not count.',
    does: 'PCV20 instead (adults: PCV20 or PCV21). Not PPSV23, and not PCV15, which would require PPSV23 after it.',
    ex: [P.leah, P.samAt19, P.sam, P.pcv15ThenBad19],
  },
  {
    key: 'invalidPpsvTiming',
    short: 'Invalid PPSV23 still sets the timing',
    problem: `A PPSV23 did not count (given before ${yrs(AGE.m24)}, or <${W8} after a PCV), but the patient received it.`,
    cdc: `The next dose is timed from the last PPSV23, for example a child's PCV ≥${W8} after it. They do not say whether a PPSV23 that did not count starts that clock.`,
    does: `The next dose is timed from it. Children: PCV ≥${W8} after it (a PCV given sooner still counts); a repeat PPSV23 ≥${Y5} after it. Adults: PCV ≥${Y1_PCV_AFTER_PPSV} after it.`,
    ex: [P.toddler, P.toddlerPcvSoon, P.pcv15ThenBad19],
  },
  {
    key: 'nextDoseIsAnAdults',
    short: `Next dose falls after ${ADULT_AT}`,
    problem: `A child's next dose falls at ${ADULT_AT} or later, when the adult schedule may differ: no dose, another product, or a longer interval.`,
    cdc: `The child schedule applies up to ${CHILD_TO}, the adult schedule from ${ADULT_AT}. They do not say which one applies when the child schedule's next dose falls at ${ADULT_AT} or later.`,
    does: `The card gives the adult schedule's answer and states why. A dose that can be given before ${ADULT_AT} stays on the child schedule.`,
    ex: [P.tess14, P.rafi14, P.cal18],
  },
  {
    key: 'pcvAfterPpsvInvalid',
    short: 'PCV too soon after PPSV23',
    problem: `A child's PCV was given <${W8} after a PPSV23 that counted. A PCV given soon after PPSV23 produces a weaker immune response.`,
    cdc: `A child who has had PPSV23 gets the PCV ≥${W8} after it. They do not say whether a PCV given sooner counts.`,
    does: `Not counted. If the series is complete without it, nothing more is given. If a PCV is still needed, it is given ≥${W8} after the one that did not count.`,
    ex: [P.ppsvThenPcvSoon],
  },
  {
    key: 'icSecondPpsvCounts',
    short: 'Early 2nd PPSV23 still counts',
    problem: `An immunocompromised child's 2nd PPSV23 was given <${Y5} after the 1st. Repeating it would mean a 3rd PPSV23.`,
    cdc: `An immunocompromised child gets the 2nd PPSV23 ≥${Y5} after the 1st. They do not say whether a 2nd PPSV23 given sooner counts.`,
    does: `Counted and not repeated. The line under the dose states the interval given and the ${Y5} recommended. No further PPSV23.`,
    ex: [P.ic2ndEarly],
  },
  {
    // E15 (owner, 2026-11-27). The facts behind the CDC line, measured that
    // day: of DOSE_INTERVAL_RULES the adult rows are 'recommendation' or
    // 'none', 0 floors (owner ruling 2026-10-25, PR #90); mm7401a1, rr7203a1
    // and CDC's Adult Notes, read live 2026-11-27, never call an early adult
    // dose invalid; CDSI v4.64 sets absMinInt = 0 days for every adult
    // pneumococcal interval. The example is adultPcv20Soon's own dose line.
    key: 'adultEarlyCounts',
    short: 'An early adult dose still counts',
    problem: `An adult dose was given sooner than recommended after an earlier dose, for example PCV20 ${lineOf(P.adultPcv20Soon, 'pcv', 0).match(/^Given (.+?) after/)[1]} after PPSV23, where ${Y1_PCV_AFTER_PPSV} is recommended.`,
    cdc: `Adult intervals are recommended timing: ${W8_ADULT} for PPSV23 after a PCV with ${IC_SPECIAL} ${W8_WHEN}; ${Y1} for PPSV23 after a PCV in other adults, PCV20 or PCV21 after PCV13, and any PCV after PPSV23; ${Y5_AFTER_BOTH} for PCV20 or PCV21 after PCV13 and PPSV23, and for a second PPSV23. They do not say an earlier dose is invalid or must be repeated. CDC's immunization software sets no minimum for any adult interval.`,
    does: `The dose counts and is not repeated. The line under the dose states the interval, for example "${lineOf(P.adultPcv20Soon, 'pcv', 0)}" Exceptions with their own entries: PPSV23 under ${W8_ADULT} after a PCV; Adult PCV after PCV. A second PPSV23 without ${IC_SPECIAL} is labelled "Counted — not needed. No more PPSV23."`,
    ex: [P.adultPcv20Soon, P.adultEarlyPpsv, P.ppsv2ndNotNeeded],
  },
  {
    // E15. The CDC line is split by age (OWNER DECISION 2026-11-27, shown
    // both readings): mm7401a1, read live that day, prints "A minimum
    // interval of 8 weeks can be considered" in its >=50 row only, and at
    // 19-49 for these conditions "administer a single dose of PPSV23 >=8
    // weeks after the PCV15 dose". The example is hivSameDay's own dose line.
    key: 'adultPpsvUnderEightWeeks',
    short: `PPSV23 under ${W8_ADULT} after a PCV`,
    problem: `An adult's PPSV23 was given <${W8_ADULT} after a PCV. ACIP calls the ${W8_ADULT} a "minimum interval", unlike any other adult interval.`,
    cdc: `${W8_ADULT} is the recommended interval at ${ADULT_BAND} for ${IC_SPECIAL}. From ${ROUTINE_AT}, "a minimum interval of ${W8_ADULT} can be considered", sooner than the usual ${Y1}. They do not say whether a PPSV23 given before ${W8_ADULT} counts.`,
    does: `Counted and not repeated, because another PPSV23 produces a weaker immune response to some serotypes. The line under the dose states the interval, for example "${lineOf(P.hivSameDay, 'ppsv23', 0)}"`,
    ex: [P.hivSameDay],
  },
  {
    key: 'adultPcvAfterPcv',
    short: 'Adult PCV after PCV',
    problem: `An adult received a PCV <${W4} after another PCV, for example PCV20 after an unrecorded PCV15. Other ACIP schedules (infants, transplant recipients) space PCV doses ≥${W4} apart; there are no data on a shorter interval.`,
    cdc: 'They state no interval between two PCV doses in an adult, and do not say whether a second PCV given soon after the first counts.',
    does: `Counted at any interval. Under ${W4}, the line under the dose offers an optional repeat (PCV20 or PCV21) ≥${W8} later, mainly for an immunocompromised patient.`,
    ex: [P.adultPcvClose],
  },
  {
    key: 'noDoseNowLabel',
    short: 'No dose now, not Complete',
    problem: `The patient has had every dose due today, but another dose or a review is due later. For example, a toddler with no spleen who has finished the infant PCV series still needs PCV20 or PPSV23 at ${yrs(AGE.m24)}. Calling that toddler "Complete" would suggest nothing more is needed.`,
    cdc: 'When the later dose is due. They have no word for the time before it, when the patient is up to date but not finished.',
    does: `The status reads "No dose now", and the card shows the later dose and when it is due. "Complete" is kept for a patient who needs nothing more on the current schedule. One exception: a child who finishes the child schedule reads "Complete", even if the adult schedule may add a dose at ${ADULT_AT}. The card says so.`,
    ex: [P.sadie15m, P.bothDiabetic40],
  },
];
export const DECISION = Object.fromEntries(DECISIONS.map((d) => [d.key, d]));
/** A row's decision keys, as a list. */
export const decisionsOf = (row) => (row?.decision == null ? [] : [].concat(row.decision));

// ═════ Step 1: Stop check ════════════════════════════════════════════════
// E2: the heading is the checkbox's own label, which names all four
// conditions and is frozen byte-identical to MeningoVax's by
// regression-2026-10-16-transplant-stop-mirrors-meningovax. MeningoVax's
// Rulebook takes its heading from the same label, so the two cannot differ.
export const TRANSPLANT_STOP = {
  title: RISK_FACTORS.find((r) => r.exclude).label,
  text: 'Individualized revaccination schedule required. No recommendation is shown.',
  decision: 'transplant',
  ex: [P.transplant],
};

// ═════ Step 2: Read the record ═══════════════════════════════════════════
// E3: three columns (the "Counts?" column is gone: PCV7's row says it).
const W8_CHILD_AFTER_PCV = `≥${W8} after the last PCV`;
const USE = {
  // One line per instruction (owner, 2026-11-27).
  PCV15: { child: ['routine series.', `At risk: then PCV20 or PPSV23, ${W8_CHILD_AFTER_PCV}.`], adult: ['then PPSV23.', 'If PPSV23 is unavailable: PCV20 or PCV21.'] },
  PCV20: { child: ['routine series.', 'A series that includes PCV20 needs no PPSV23.'], adult: 'one dose completes the series.' },
  PCV21: { adult: ['one dose completes the series.', `Not licensed under ${yrs(PCV21_MIN_AGE_M)}.`] },
  PPSV23: { child: 'at risk only, after the PCV series.', adult: 'after PCV15, to complete the series.' },
  PCV13: { child: ['counts toward the routine series.', `At risk: then PCV20 or PPSV23, ${W8_CHILD_AFTER_PCV}.`], adult: `then PCV20 or PCV21, ≥${Y1_AFTER_PCV13} later.` },
  PCV7: { both: ['Does not count.', 'A PCV7-only history is treated as unvaccinated.'] },
};
const minAgeWords = (p) => (p.minAgeDays != null ? wk(p.minAgeDays) : yrs(p.minAgeM));
export const VACCINES = {
  lead: 'Conjugate vaccines (PCV) form every series. PPSV23 is added after a PCV, for at-risk patients only.',
};
export const VACCINE_ROWS = ['current', 'history'].map((kind) => ({
  kind,
  // The current vaccines need no heading (mock-up E3); history-only ones do.
  name: kind === 'current' ? null : 'No longer used: history only',
  rows: ALL_PRODUCTS
    .filter((p) => (kind === 'current' ? !p.historyOnly : p.historyOnly))
    // Conjugates first, then PPSV23; youngest minimum age first within each.
    .sort((a, b) => (a.type === b.type ? a.minAgeM - b.minAgeM : (a.type === 'PPSV23' ? 1 : -1)))
    .map((p) => ({
      key: p.key,
      name: p.key,
      brand: p.label.replace(/^.*\((.*)\)$/, '$1'),
      ppsv: p.type === 'PPSV23',
      minAge: minAgeWords(p),
      valid: p.counts,
      ...USE[p.key],
    })),
}));

// E4. OWNER DECISION 2026-11-08 (§DOSE-LABELS): every dose starts with
// exactly one of these labels. The engine picks it (doseDisposition.js).
// `chips` pair with `ex` in order.
export const CHIP_LEGEND = [
  {
    chips: ['Dose 2 of 4', 'Dose 1'],
    tone: 'valid',
    text: `Counted, on schedule. A child under ${yrs(AGE.m24)} still in the PCV series also sees the series total, which depends on age at dose 1.`,
    ex: [P.infantOnTime, P.priyaFirst],
  },
  { chip: 'Counted — given early, accepted', tone: 'valid', text: 'Given sooner than recommended. The line under the dose states the interval given and the one recommended. Not repeated.', ex: [P.adultEarlyPpsv] },
  { chip: 'Counted — not needed. No more PPSV23.', tone: 'valid', text: `An adult's second PPSV23 within ${Y5}, without ${IC_SPECIAL}. ACIP gives a second PPSV23 only to those three groups.`, ex: [P.ppsv2ndNotNeeded] },
  { chip: 'Counted — product not recorded', tone: 'valid', text: 'Counted as a PCV of unknown product.', ex: [P.productUnknown] },
  { chip: 'Counted — date not recorded', tone: 'valid', text: 'A PPSV23 with no date. CDC accepts an undated PPSV23 record. Its age and interval are not checked until a date is added.', ex: [P.dateUnknown] },
  { chip: 'Not counted — Extra. Do not repeat.', tone: 'extra', text: 'Given correctly, but not needed.', ex: [P.nonIc2nd] },
  { chip: 'Not counted — repeat', tone: 'invalid', text: 'Given below the minimum age, or the wrong product for the age. The result card gives the date of the replacement dose.', ex: [P.toddler] },
  { chip: 'Not counted — do not repeat', tone: 'invalid', text: 'Given too soon after the previous dose. The next dose is due once the interval has passed; the result card gives the date.', ex: [P.infantShort] },
  // §A-UNDATED (OWNER DECISION 2026-11-15).
  { chip: 'Not counted — no date', tone: 'unknown', text: 'A PCV with no date. CDC accepts only written, dated PCV records. The result card plans as if it was not given.', ex: [P.noDate] },
  { chip: 'Not counted — PCV7', tone: 'extra', text: 'Set aside. The patient is treated as having had no PCV.', ex: [P.pcv7] },
  { chip: 'Check the date', tone: 'unknown', text: 'Dated in the future or before birth. Not counted until the date is corrected.', ex: [P.futureDated] },
];

// E5: general rules, a worked example, then the special cases.
export const NOT_COUNTED = {
  general: [
    { text: 'Repeat that dose only. Do not restart the series.', ex: [P.infantShort, P.toddler] },
    { text: 'The next dose is given at least the minimum interval after the dose that did not count.', ex: [P.infantShort] },
    // OWNER DECISION 2026-11-27: a general rule here, with the PPSV23
    // exception said in the same place ("state the exceptions such as PPSV23
    // if applicable"). The label key below says it per label too.
    {
      text: 'A dose with no date stays on the record but does not count: only written, dated records are accepted. Exception: a PPSV23 with no date counts, because CDC names PPSV23 as the exception. Its age and interval are not checked until a date is added.',
      cite: ['gbpWrittenDatedRecords'],
      ex: [P.noDate, P.dateUnknown],
    },
  ],
  special: [
    { dose: `PPSV23 given before ${yrs(AGE.m24)}`, action: [`PCV20, ≥${W8} after it.`, `A repeat PPSV23 waits ≥${Y5} after it.`], decision: 'invalidPpsvTiming', cite: ['pedsRiskPcv20orPpsv23'], ex: [P.toddler] },
    { dose: `First PPSV23, <${W8} after a PCV`, action: 'PCV20 (adults: PCV20 or PCV21), not PPSV23.', decision: 'ppsvNotRepeated', ex: [P.leah, P.samAt19] },
    { dose: 'Two PPSV23 doses, neither counted', action: 'PCV20 (adults: PCV20 or PCV21), not a third PPSV23.', decision: 'ppsvNotRepeated', ex: [P.sam] },
    // E6: it is not counted, so it is a special case of a dose that does not count.
    { dose: 'A PCV the card did not recommend, after a PCV series', action: ['Labelled "Not counted — Extra. Do not repeat."', 'A completed series stays complete.'], decision: 'conjugateNobodyAskedFor', ex: [P.noorExtra, P.lenaExtra, P.theoExtra, P.mateoExtra, P.benExtra] },
  ],
};

/**
 * The worked example under the general rules. `example` is the patient's
 * facts (exempt from the typed-number scan, like `who`); the chips are what
 * the app shows, checked against P.infantShort.
 */
export const INVALID_EXAMPLE = {
  lead: 'Example: an infant\'s 2nd PCV given too soon',
  steps: [
    { example: '2 months', chip: 'Dose 1 of 4', tone: 'valid', text: '' },
    { example: '2 weeks later', chip: 'Not counted — do not repeat', tone: 'invalid', text: `Before the ${intervalPhraseAdj({ days: PCV_MIN_INTERVAL_DAYS_UNDER_12M })} minimum interval.` },
    { example: `≥${wk4} after that dose`, chip: 'Dose 2 of 4', tone: 'valid', text: 'The next counted dose takes its number.' },
  ],
  ex: [P.infantShort],
};

// ═════ Step 3: Children's schedule ═══════════════════════════════════════
const conds = (pred) => RISK_FACTORS.filter((r) => !r.exclude && pred(r)).map((r) => r.label);
const grp = (r) => r.group ?? r.class;
const COND = {
  IC: conds((r) => grp(r) === 'IC'),
  special: conds((r) => grp(r) === 'special'),
  chronicChild: conds((r) => grp(r) === 'nonIC' && !r.adultOnly),
  chronicAdult: conds((r) => grp(r) === 'nonIC'),
};
const AGES_2_TO_4 = `${AGE.m24 / 12}–${AGE.m60 / 12 - 1} years`;
const AGES_2_TO_5 = `${AGE.m24 / 12}–${AGE.m72 / 12 - 1} years`;
const AGES_6_TO_18 = `${AGE.m72 / 12}–${CHILD_TO}`;
/** The routine infant series, read out of CDC's own sentence. */
const routineQuote = REFS.pedsRoutine4Dose.quote;
const routineAges = routineQuote.replace(/^.* at /, '').replace(/ months$/, '').split(', ');
const ROUTINE_TOTAL = Number(routineQuote.match(/(\d+)-dose/)[1]);
const PCV20_ENDS = 'Any dose in the series was PCV20: nothing more.';
/** Each option's own last step, worded once (owner, 2026-11-27: "IC" after defining it). */
const IC_AFTER_B = `Option B, IC: PCV20 or a 2nd PPSV23, ≥${Y5} after the PPSV23.`;

/**
 * E7: Group | PCV doses | After the PCV series. "Details" under a group's
 * name opens its conditions and its Source (MeningoVax's group table).
 */
export const CHILD_GROUPS = [
  {
    key: 'healthy',
    group: 'Healthy',
    // 2026-11-27 (owner edit): the row names the series instead of "Routine
    // series", which pointed at the table without saying what was in it.
    doses: [`The routine series of ${ROUTINE_TOTAL} doses (table above).`, `${AGES_2_TO_4} with an incomplete series: 1 catch-up dose.`],
    // E8. Each clause has a worked patient whose card says it (P2-1).
    after: `None. Not indicated from ${yrs(AGE.m60)}.`,
    afterNote: `The card adds a re-evaluation age: ${ROUTINE_AT}, or ${ADULT_AT} if smoking or alcohol use disorder is selected. Not added if the series includes PCV20, or PCV15 and PPSV23.`,
    conditions: [],
    cite: ['pedsHealthyCatchup', 'adultRoutine50', 'cdcAdultRiskFactorList'],
    ex: [P.healthy3, P.healthy4done, P.healthy6, P.healthy10pcv20, P.healthy10pcv15ppsv, P.smoker10],
  },
  {
    key: 'chronic',
    group: 'Chronic condition, cochlear implant or CSF leak',
    doses: ['The routine series.', `${AGES_2_TO_5} with an incomplete series: 1 or 2 catch-up doses, ≥${W8} apart.`],
    // One line per recommendation (owner, 2026-11-27), worded as the cards are.
    after: [PCV20_ENDS, `Otherwise, choose one, ${W8_CHILD_AFTER_PCV}:`, 'Option A: PCV20.', 'Option B: PPSV23.', 'Then nothing more.'],
    conditions: [...COND.chronicChild, ...COND.special],
    cite: ['pedsRiskIncompleteCatchup', 'pedsRiskPcv20orPpsv23', 'pedsRiskPcv20CompleteAt2', 'pedsRiskSinglePpsv23AfterPcv'],
    ex: [P.diabetic4, P.cochlear4, P.diabetic5done, P.diabetic3partial, P.diabeticPcv20],
  },
  {
    key: 'IC',
    group: 'Immunocompromising (IC)',
    doses: 'Same as the row above.',
    after: [PCV20_ENDS, `Otherwise, choose one, ${W8_CHILD_AFTER_PCV}:`, 'Option A: PCV20. Then nothing more.', `Option B: PPSV23. Then PCV20 or a 2nd PPSV23, ≥${Y5} after the PPSV23.`],
    conditions: COND.IC,
    cite: ['pedsRiskIncompleteCatchup', 'pedsIcPcv20orPpsv23', 'pedsIcPpsvWaitFiveYears', 'pedsRiskPcv20CompleteAt2'],
    ex: [P.asplenia5ppsv, P.asplenia3partial, P.asplenia4pcv20],
  },
  {
    // CDC's own split at 6-18: "Not previously received any dose of PCV13,
    // PCV15, or PCV20" is a separate row from "Received PCV before age 6
    // years"; a PCV first given at 6 or older goes to PCV20 or PPSV23.
    key: 'late',
    // 2026-11-27 (owner edit): "At risk, 6-18, no PCV yet" did not say which
    // conditions, or how the row differs from the two above it. Then, the same
    // day: the child whose first PCV came at 6 or older "should have its own
    // line", and every "after it" must name the dose it is after.
    key: 'late',
    // A list is one line per option (owner, 2026-11-27: the column "should be
    // clear on what needs to be given and what the options are if multiple").
    group: `Any condition in the rows above, ${AGES_6_TO_18}, never had a PCV`,
    // Owner, 2026-11-27: say in THIS column who an option is for, not only in
    // the next one. Both options are for every condition; only the dose that
    // follows Option B's PPSV23 is immunocompromised-only.
    doses: [
      'Choose one (any condition):',
      'Option A: PCV20.',
      `Option B: PCV15, then PPSV23 ≥${W8} later.`,
    ],
    after: ['Option A: nothing more.', 'Option B, not IC: nothing more.', IC_AFTER_B],
    conditions: [],
    cite: ['pedsRisk6to18NoPcv', 'pedsIc6to18NoPcv', 'pedsSecondPpsv5y'],
    ex: [P.asplenia10none, P.diabetic10none],
  },
  {
    // CDC's own split at 6-18: "Received PCV13 only at or after age 6 years"
    // is a row of its own. PCV15 is read the same way (owner ruling
    // 2026-10-18, PCV13 and PCV15 interchangeable going forward).
    key: 'lateStarted',
    group: `Any condition in the rows above, ${AGES_6_TO_18}, first PCV given at ${yrs(AGE.m72)} or older`,
    doses: [
      'That PCV was PCV20: nothing more.',
      `PCV13 or PCV15: choose one (any condition), ≥${W8} after it:`,
      'Option A: PCV20.',
      'Option B: PPSV23.',
    ],
    after: ['Option A: nothing more.', 'Option B, not IC: nothing more.', IC_AFTER_B],
    afterNote: `A child ${AGES_6_TO_18} who had a PCV before ${yrs(AGE.m72)} follows the row for their condition above.`,
    conditions: [],
    cite: ['pedsRiskPcv13At6', 'pedsSecondPpsv5y'],
    ex: [P.diabetic8pcv13, P.diabetic9pcv15, P.asplenia9pcv13, P.diabetic9pcv20, P.diabetic10before6],
  },
];

const pcvProduct = ALL_PRODUCTS.find((p) => p.key === 'PCV20');
const pcvRule = DOSE_INTERVAL_RULES.find((r) => r.id === 'CHILD-PCV-AFTER-PCV');
const probe = (anchor, ctx) => wk(pcvRule.interval.daysFrom(anchor, ctx));
/** CDC Catch-up Table 2's cells, probed out of the engine's own function. */
const CELL = {
  d2Under12: probe({ ageAtDose: 6 }, { doseNumber: 2, ageAtDose: 7, anyPriorDoseBefore12: true }),
  d2From12: probe({ ageAtDose: 18 }, { doseNumber: 2, ageAtDose: 19, anyPriorDoseBefore12: false }),
  d3Under7: probe({ ageAtDose: 6 }, { doseNumber: 3, ageAtDose: 7, anyPriorDoseBefore12: true }),
  d3From7: probe({ ageAtDose: 9 }, { doseNumber: 3, ageAtDose: 10, anyPriorDoseBefore12: true }),
  booster: probe({ ageAtDose: 10 }, { doseNumber: 4, ageAtDose: 13, anyPriorDoseBefore12: true }),
  extraInfant: probe({ ageAtDose: 4 }, { doseNumber: 4, ageAtDose: 5, anyPriorDoseBefore12: true }),
};
const M12 = yrs(AGE.m12);
const M7_TO_11 = `${AGE.m7}–${AGE.m12 - 1} months`;
export const ROUTINE_INFANT = {
  title: 'Routine PCV series',
  total: ROUTINE_TOTAL,
  ages: routineAges.map((a) => `${a} months`),
  quote: routineQuote,
  // Dose | Routine | Minimum interval, the minimum column grey (MeningoVax).
  rows: [
    { dose: 'Dose 1', min: `Minimum age ${wk(pcvProduct.minAgeDays)}` },
    { dose: 'Dose 2', min: [`${CELL.d2Under12} after dose 1.`, `${CELL.d2From12} if dose 1 was at ≥${M12}.`] },
    { dose: 'Dose 3', min: [`${CELL.d3Under7} after dose 2.`, `${CELL.d3From7} if dose 2 was at ${M7_TO_11}.`] },
    { dose: 'Dose 4', min: `${CELL.booster} after dose 3, at ≥${M12}` },
  ].map((r, i) => ({ ...r, routine: `${routineAges[i]} months` })),
  cite: ['pedsRoutine4Dose'],
  ex: [P.infantOnTime, P.healthy3],
};

/**
 * E9: how many PCV doses a child gets in all, by age at dose 1. GENERATED:
 * each band's answer is what recommend() gives an unvaccinated healthy child
 * at that band's first AND last month, and the module refuses to load if the
 * two ends disagree. The bands are the engine's own age lines.
 */
// Two weeks past the month line, so the child is plainly inside the band.
const HALF_MONTH_DAYS = PCV_MIN_INTERVAL_DAYS_UNDER_12M / 2;   // 14 days
function unvaccinatedAt(months) {
  const dob = addDays(addCalendarMonths(EX_TODAY, -months), -HALF_MONTH_DAYS);
  return ex(`Healthy child, unvaccinated, ${months} months old`, { dob, riskIds: [], pcvDoses: [], ppsv23Doses: [] }, {});
}
function dosesInAll(e) {
  const r = recommend(e.input).recs.find((x) => x.vaccine === 'PCV');
  if (r?.status === 'not-indicated') return 'None (not indicated)';
  if (r?.seriesTotal) return String(r.seriesTotal);
  const n = r?.doseLabel?.match(/^(\d+) dose/)?.[1];
  if (!n) throw new Error(`rulebook: cannot read a dose total from "${r?.doseLabel}"`);
  return n;
}
const DOSES_BANDS = [
  { age: `${routineAges[0]}–${AGE.m7 - 1} months`, from: Number(routineAges[0]), to: AGE.m7 - 1 },
  { age: M7_TO_11, from: AGE.m7, to: AGE.m12 - 1 },
  { age: `${AGE.m12}–${AGE.m24 - 1} months`, from: AGE.m12, to: AGE.m24 - 1 },
  { age: `${AGES_2_TO_4}, healthy`, from: AGE.m24, to: AGE.m60 - 1 },
  { age: `${yrs(AGE.m60)} and older, healthy`, from: AGE.m60, to: ADULT_SCHED_MIN_M - 1 },
];
export const DOSES_BY_AGE = {
  title: 'Doses in all, by age at dose 1',
  rows: DOSES_BANDS.map((b) => {
    const ends = [unvaccinatedAt(b.from), unvaccinatedAt(b.to)];
    const [lo, hi] = ends.map(dosesInAll);
    if (lo !== hi) throw new Error(`rulebook: ${b.age} gives ${lo} doses at one end and ${hi} at the other`);
    return { age: b.age, total: lo, ex: ends };
  }),
  note: 'At-risk children: see the group table below.',
  // The sentences the cards cite for those totals: CDC's notes for the 4, and
  // p2016 Table 1 for the 3 and the 2 (C10-1: only where CDC states no total).
  cite: ['pedsRoutine4Dose', 'p2016Table1_7to11_noneBefore7', 'p2016Table1_12to23_noneBefore12', 'pedsHealthyCatchup'],
};
DOSES_BY_AGE.ex = DOSES_BY_AGE.rows.flatMap((r) => r.ex);

// E10: moved here from the spacing part.
export const FROM_NINETEEN = {
  title: `From ${ADULT_AT}`,
  text: `The adult schedule applies, and counts doses given in childhood (step 4). A child's next dose that falls at ${ADULT_AT} or later is answered by the adult schedule.`,
  decision: 'nextDoseIsAnAdults',
  ex: [P.tess14, P.rafi14, P.cal18],
};

// L4: "More than one condition", once in each schedule.
const MULTI_LEAD = 'The highest-ranked group decides. Every selected condition is listed on the result.';
export const CHILD_RANKING = {
  lead: MULTI_LEAD,
  steps: [
    { name: 'Immunocompromising', ex: [P.childMulti] },
    { name: 'Cochlear implant or CSF leak', ex: [P.cochlear15] },
    { name: 'Chronic condition', ex: [P.diabetic4] },
  ],
  // The children's list has no smoking or alcohol use disorder: adult-only.
  note: { text: `Smoking and alcohol use disorder are not risk conditions under ${ADULT_AT}.`, cite: ['cdcChildSpecialSituations'], ex: [P.smoker10] },
};

// ═════ Step 4: Adults' schedule ══════════════════════════════════════════
// E11: Group | Recommended, Details under each group.
export const ADULT_GROUPS = [
  {
    key: 'icSpecial',
    group: `${ADULT_BAND}: immunocompromising condition, cochlear implant or CSF leak`,
    recommended: ['Option A or B (table below).', `Option B interval: ≥${W8_ADULT}.`],
    conditions: [...COND.IC, ...COND.special],
    cite: ['adultPcv15ThenPpsvShort'],
    ex: [P.csf30, P.cochlear45pcv15],
  },
  {
    key: 'chronic',
    group: `${ADULT_BAND}: chronic condition, smoking or alcohol use disorder`,
    recommended: ['Option A or B (table below).', `Option B interval: ≥${Y1}.`],
    conditions: COND.chronicAdult,
    cite: ['adultPcv15ThenPpsv1949'],
    ex: [P.smoker30, P.diabetic30pcv15],
  },
  {
    key: 'none',
    group: `${ADULT_BAND}: no risk condition`,
    recommended: ['Not indicated.', `Routine vaccination begins at ${ROUTINE_AT}.`],
    conditions: [],
    cite: ['adultRoutine50', 'cdcAdultRiskFactorList'],
    ex: [P.healthy30],
  },
  {
    key: 'routine',
    group: `${ROUTINE_AT} and over`,
    recommended: ['Option A or B (table below).', `Option B interval: ≥${Y1}.`, `≥${W8_ADULT} may be considered for ${IC_SPECIAL}.`],
    conditions: [],
    cite: ['adultRoutine50', 'adultPcv15ThenPpsv', 'jobAidEightWeekOptionAt50'],
    ex: [P.healthy55, P.pcv15at55, P.asplenia60pcv15],
  },
];

export const ADULT_OPTIONS = {
  title: 'No prior pneumococcal vaccine',
  a: { doses: ['PCV20 or PCV21'] },
  b: { doses: ['PCV15', 'PPSV23'], gap: 'Option B interval' },
  cite: ['adultPcv20or21Complete', 'adultPcv15ThenPpsv', 'adultPcv15ThenPpsvShort'],
  ex: [P.csf30, P.smoker30, P.pcv15at55, P.cochlear45pcv15, P.asplenia60pcv15],
};

/** E11: prior vaccines, the risk group folded into the history (no "Any" column). */
export const ADULT_HISTORY = [
  { history: 'PCV13 only', next: `PCV20 or PCV21, ≥${Y1_AFTER_PCV13} after PCV13`, cite: ['adultPcv13Only'], ex: [P.pcv13at60] },
  { history: 'PPSV23 only', next: `PCV15, PCV20 or PCV21, ≥${Y1_PCV_AFTER_PPSV} after the last PPSV23`, cite: ['adultPpsvOnly'], ex: [P.ppsv70] },
  { history: 'PCV15 only', next: ['PPSV23 at the Option B interval.', 'If PPSV23 is unavailable: PCV20 or PCV21.'], cite: ['adultPcv15ThenPpsv', 'jobAidPpsv23Unavailable'], ex: [P.pcv15at55, P.cochlear45pcv15] },
  // Every adult interval is advice only (no adult floor since 2026-10-25), so
  // an adult's PPSV23 can only fail to count if it was given under the CHILD rules.
  { history: ['PCV15', `Then a PPSV23 given before ${ADULT_AT} that did not count`], next: `PCV20 or PCV21, ≥${Y1_PCV_AFTER_PPSV} after the PPSV23`, decision: ['ppsvNotRepeated', 'invalidPpsvTiming'], cite: ['adultPpsv23Unavailable'], ex: [P.pcv15ThenBad19] },
  { history: ['PCV13 and 1 dose of PPSV23', ADULT_BAND, IC_SPECIAL.replace(/^an i/, 'I')], next: `PCV20 or PCV21, ≥${Y5_AFTER_BOTH} after the last dose`, cite: ['adultIc1949BothPcv13Ppsv'], ex: [P.bothHiv30, P.bothCsf40] },
  { history: ['PCV13 and 2 doses of PPSV23', ADULT_BAND, IC_SPECIAL.replace(/^an i/, 'I')], next: [`Review at ${ROUTINE_AT}.`, `Or: PCV20 or PCV21, ≥${Y5_AFTER_BOTH} after the last dose.`], cite: ['mmwrIc1949TwoPpsv'], ex: [P.hiv30two, P.csf40two, P.asplenia16two] },
  { history: ['PCV13 and PPSV23 (1 or 2 doses)', ADULT_BAND, 'Chronic condition, smoking or alcohol use disorder'], next: ['None now.', `Review at ${ROUTINE_AT}.`], decision: 'noDoseNowLabel', cite: ['adultChronicOnlyReviewAt50'], ex: [P.bothDiabetic40, P.bothSmoker40, P.diabetic15] },
  { history: ['PCV13 and PPSV23', `${ROUTINE_AT} and over`], next: [`PCV20 or PCV21, ≥${Y5_AFTER_BOTH} after the last dose.`, `Shared clinical decision-making if PPSV23 was given at ≥${yrs(AGE.y65)}.`], cite: ['adultBothNotAt65', 'adultBothAt65'], ex: [P.both60, P.both72] },
  { history: 'PCV20, PCV21, or PCV15 and PPSV23', next: 'Complete', complete: true, cite: ['adultPcv20or21Complete', 'jobAidSeriesCompleteAt50'], ex: [P.pcv20adult, P.complete55] },
];

export const ADULT_RANKING = {
  lead: MULTI_LEAD,
  steps: [
    { name: 'Immunocompromising', ex: [P.bothHiv30] },
    { name: 'Cochlear implant or CSF leak', ex: [P.adultMulti] },
    { name: 'Chronic condition, smoking or alcohol use disorder', ex: [P.diabetic30pcv15] },
  ],
};

// ═════ Step 5: Time between doses ════════════════════════════════════════
// E12: the heading lists no count (it said 3 and listed 5).
//
// RULEBOOK-ONLY SOURCES (OWNER DECISION 2026-11-27). The one exception to "a
// Source shows only a sentence a card cites". CDC's grace sentence is the rule
// the engine applies (GRACE_DAYS), but no card quotes it — the line under a
// too-soon dose says "per CDC" with no number. Shown the choice, she chose
// "Rulebook only": the sentence shows here and no card changes. Pinned by
// name in regression-2026-11-27-rulebook-reorg.
export const RULEBOOK_ONLY_SOURCES = ['gbpFiveDaysEarlyNotCounted'];
export const GRACE = {
  days: GRACE_DAYS,
  title: 'Children: a dose given before the minimum interval does not count',
  text: `A dose given ${GRACE_DAYS + 1} or more days early does not count. Up to ${GRACE_DAYS} days early still counts.`,
  cite: ['gbpFiveDaysEarlyNotCounted'],
  ex: [P.infantShort],
};

/** CDC Catch-up Table 2, as Doses | When | Minimum interval. */
export const PCV_AFTER_PCV = {
  title: 'PCV after PCV',
  ruleIds: ['CHILD-PCV-AFTER-PCV'],
  rows: [
    { doses: 'Dose 1 → 2', when: `Dose 1 before ${M12}`, gap: CELL.d2Under12 },
    { doses: 'Dose 1 → 2', when: `Dose 1 at ≥${M12}`, gap: CELL.d2From12 },
    { doses: 'Dose 2 → 3', when: `Dose 2 before ${yrs(AGE.m7)}, dose 3 before ${M12}`, gap: CELL.d3Under7 },
    { doses: 'Dose 2 → 3', when: `Dose 2 at ${M7_TO_11}`, gap: CELL.d3From7 },
    { doses: 'Dose 3 → 4', when: `Dose 4 is the booster, at ≥${M12}`, gap: CELL.booster },
    { doses: 'Dose 3 → 4', when: [`Dose 4 before ${M12}: counted ("Dose 4 of 5").`, 'The booster is still due.'], gap: CELL.extraInfant },
  ],
  // The two cells a card quotes: it states the minimum only when the routine
  // date is later than it, which the 8-week cells never are.
  cite: ['cdcCatchupDose1to2FourWeeks', 'cdcCatchupDose2to3FourWeeks'],
  ex: [P.catchup1to2, P.catchup2to3],
};

/** E13: Doses | Minimum interval | If given sooner. */
export const PCV_AND_PPSV23 = {
  title: 'PCV and PPSV23',
  rows: [
    { doses: 'PCV, then PPSV23', gap: gapOf('CHILD-PPSV23-AFTER-PCV'), sooner: 'Not counted', ruleIds: ['CHILD-PPSV23-AFTER-PCV'], cite: ['pedsRiskPcv20orPpsv23'], ex: [P.diabetic4, P.leah] },
    { doses: 'PPSV23, then PCV', gap: gapOf('CHILD-PCV-AFTER-PPSV23'), sooner: 'Not counted', decision: 'pcvAfterPpsvInvalid', ruleIds: ['CHILD-PCV-AFTER-PPSV23'], cite: ['p2016NoPriorPcv6to18OptionA'], ex: [P.asplenia8ppsv, P.ppsvThenPcvSoon] },
    { doses: 'PPSV23 that did not count, then PCV', gap: `${W8} (advised)`, sooner: 'Counted', decision: 'invalidPpsvTiming', ruleIds: [], ex: [P.toddler, P.toddlerPcvSoon] },
    {
      doses: 'PPSV23, then a 2nd PPSV23 (immunocompromising only)',
      gap: gapOf('CHILD-PPSV23-AFTER-PPSV23'),
      sooner: 'Counted, not repeated',
      decision: 'icSecondPpsvCounts',
      ruleIds: ['CHILD-PPSV23-AFTER-PPSV23', 'CHILD-PPSV23-AFTER-INVALID-PPSV23', 'CHILD-PPSV23-REPEAT-AFTER-INVALID-FIRST'],
      cite: ['pedsIcPpsvWaitFiveYears'],
      ex: [P.asplenia5ppsv, P.ic2ndEarly],
    },
  ],
  note: { text: 'A 2nd PPSV23 for any other child is labelled "Not counted — Extra. Do not repeat."', ex: [P.nonIc2nd] },
};

/** Adults: Doses | Recommended interval | If given sooner. */
export const ADULT_PCV_PPSV23 = [`≥${Y1}.`, `≥${W8_ADULT} for ${IC_SPECIAL} ${W8_WHEN}.`];
export const ADULT_INTERVALS = {
  title: 'Adults: a dose given sooner than recommended still counts',
  decision: 'adultEarlyCounts',
  ex: [P.adultPcv20Soon],
  rows: [
    { doses: 'PCV, then PPSV23', gap: ADULT_PCV_PPSV23, sooner: `Counted, even under ${W8_ADULT}`, decision: 'adultPpsvUnderEightWeeks', ruleIds: ['ADULT-PPSV23-AFTER-PCV15', 'ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM', 'ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM-USED', 'ADULT-PPSV23-AFTER-PCV15-MEETS-SHORTER-ADVICE', 'ADULT-PPSV23-AFTER-PCV13', 'ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM', 'ADULT-PPSV23-AFTER-PCV-CATCH-ALL'], cite: ['adultPcv15ThenPpsv', 'adultPcv15ThenPpsvShort'], ex: [P.adultEarlyPpsv, P.hivSameDay, P.cochlear45pcv15] },
    { doses: 'PCV13, then PCV20 or PCV21', gap: Y1_AFTER_PCV13, sooner: 'Counted', ruleIds: ['ADULT-PCV20-21-AFTER-PCV13', 'ADULT-PCV20-21-1Y-AFTER-PCV', 'ADULT-PCV-AFTER-PCV-CATCH-ALL'], cite: ['adultPcv13Only'], ex: [P.pcv13at60] },
    { doses: 'PPSV23, then any PCV', gap: [`${Y1_PCV_AFTER_PPSV}.`, 'Also after a PPSV23 that did not count.'], sooner: 'Counted', decision: 'invalidPpsvTiming', ruleIds: ['ADULT-PCV-AFTER-PPSV23'], cite: ['adultPpsvOnly'], ex: [P.ppsv70, P.pcv15ThenBad19, P.adultPcv20Soon] },
    { doses: 'PCV13 and PPSV23, then PCV20 or PCV21', gap: `${Y5_AFTER_BOTH} after the last dose`, sooner: 'Counted', ruleIds: ['ADULT-PCV20-21-5Y-AFTER-PPSV23'], cite: ['adultBothNotAt65'], ex: [P.both60] },
    { doses: 'PPSV23, then a 2nd PPSV23', gap: Y5_SECOND_ADULT, sooner: ['Counted.', `Without ${IC_SPECIAL}: "Counted — not needed. No more PPSV23."`], ruleIds: ['ADULT-PPSV23-AFTER-PPSV23'], ex: [P.ppsv2ndNotNeeded] },
    { doses: 'PCV15, then PCV20 or PCV21', gap: 'None stated', sooner: 'Counted at any interval', decision: 'adultPcvAfterPcv', ruleIds: ['ADULT-PCV20-21-AFTER-PCV15-NO-INTERVAL'], ex: [P.adultPcvClose] },
    { doses: `PCV, then another PCV, <${W4} apart`, gap: 'None stated', sooner: ['Counted.', `A repeat (PCV20 or PCV21) ≥${W8} later may be considered.`], decision: 'adultPcvAfterPcv', ruleIds: ['ADULT-PCV-AFTER-PCV-UNDER-4-WEEKS'], ex: [P.adultPcvClose] },
  ],
  note: { text: `Doses given before ${ADULT_AT} follow the children's rules. A dose below the vaccine's minimum age does not count.`, ex: [P.pcv15ThenBad19, P.samAt19] },
};

/** Every rule the engine applies must be on exactly one row of step 5. */
export const SPACING_RULE_IDS = [
  ...PCV_AFTER_PCV.ruleIds,
  ...PCV_AND_PPSV23.rows.flatMap((r) => r.ruleIds),
  ...ADULT_INTERVALS.rows.flatMap((r) => r.ruleIds),
];

// ═════ How PneumoVax decides: five steps, each its own fold (L1) ═════════
export const PATH_STEPS = [
  { key: 'stop', n: 1, title: HEADINGS.stop, sum: 'A transplant, CAR-T therapy or B-cell therapy stops the app.' },
  { key: 'record', n: 2, title: HEADINGS.record, sum: 'Each recorded dose is checked and given one label.' },
  { key: 'kids', n: 3, title: HEADINGS.kids, sum: `Birth to ${CHILD_TO}. The risk group decides what follows the PCV series.` },
  { key: 'adults', n: 4, title: HEADINGS.adults, sum: `${ADULT_AT} and over. A risk condition is required until ${ROUTINE_AT}.` },
  { key: 'spacing', n: 5, title: HEADINGS.spacing, sum: 'The shortest and the recommended time between two doses, and what happens to a dose given too soon.' },
];
const STEP = Object.fromEntries(PATH_STEPS.map((s) => [s.key, s]));

// ── "Applies in" (E14), generated from the rows that carry each chip ─────
// "Step 2, A dose that does not count": the step's number and the part of it
// the chip sits in. Places in one step are joined; steps with " · ".
const USES = [
  ['stop', 'Stop check', [TRANSPLANT_STOP]],
  ['record', 'A dose that does not count', [...NOT_COUNTED.general, ...NOT_COUNTED.special]],
  ['kids', FROM_NINETEEN.title, [FROM_NINETEEN]],
  ['adults', 'Prior pneumococcal vaccines', ADULT_HISTORY],
  ['spacing', 'children\'s PCV and PPSV23 table', PCV_AND_PPSV23.rows],
  ['spacing', 'adults\' table', [ADULT_INTERVALS, ...ADULT_INTERVALS.rows]],
];
export const DECISION_USES = Object.fromEntries(DECISIONS.map((d) => {
  const byStep = new Map();
  for (const [step, place, rows] of USES) {
    if (!rows.some((r) => decisionsOf(r).includes(d.key))) continue;
    if (!byStep.has(step)) byStep.set(step, []);
    if (!byStep.get(step).includes(place)) byStep.get(step).push(place);
  }
  return [d.key, [...byStep].map(([step, places]) => `Step ${STEP[step].n}, ${places.join(', ')}`)];
}));

// ── Sources (E16): grouped by type, no counts or read dates ──────────────
// MeningoVax's five groups, in its order; a document goes in the first that
// fits. Within a group, the documents the app quotes most come first.
const SOURCE_TYPE_RULES = [
  ['ACIP recommendations', (u) => /cdc\.gov\/mmwr\/|stacks\.cdc\.gov\//.test(u)],
  ['CDC schedule notes', (u) => /cdc\.gov\/vaccines\/hcp\/imz-schedules\/[^/]+\.html$/.test(u)],
  ['Other CDC and ACIP guidance', (u) => /cdc\.gov\//.test(u)],
  ['immunize.org', (u) => /immunize\.org\//.test(u)],
  ['Other', () => true],
];
export const SOURCE_TYPES = SOURCE_TYPE_RULES.map(([name]) => ({ name, docs: [] }));
for (const d of [...SOURCES].sort((a, b) => b.quotes - a.quotes || a.name.localeCompare(b.name))) {
  SOURCE_TYPES[SOURCE_TYPE_RULES.findIndex(([, fits]) => fits(d.url))].docs.push(d);
}

// E17: the footer is in rulebookFooter.js, identical in both apps.

// ── The worked patient behind a row, run through the app ─────────────────
/**
 * The "Source" button's content: the CDC/ACIP sentences the app's own cards
 * cite for a row's worked patients, in the note or on a recorded dose's line. Generated, never transcribed: change the
 * card's citation and this changes with it.
 *
 * With `keys` (a row's `cite`), only those sentences, in that order — and
 * only if the app's card for one of the patients really cites them, so a row
 * can never show a sentence the app does not use. The one exception is
 * `RULEBOOK_ONLY_SOURCES`, shown straight from refs.js. Without `keys`, every
 * sentence the cards cite (kept for the guard that measures it).
 */
export function sourcesFor(examples = [], keys = null) {
  const seen = new Map();
  for (const e of examples) {
    const out = recommend(e.input);
    // The card's note AND the lines under its recorded doses: both are what the
    // app's own card shows (MeningoVax's Rulebook reads both too). Added
    // 2026-11-27 for the undated-dose rule, whose sentence is on the dose line.
    const doseLines = Object.values(out.perDose ?? {}).flat().flatMap((d) => d?.reasonCites ?? []);
    for (const c of [...(out.recs ?? []).flatMap((r) => r.noteCites ?? []), ...doseLines]) {
      if (!c?.quote || (keys && !keys.includes(c.key))) continue;
      const ref = REFS[c?.key];
      const id = keys ? c.key : c.quote;
      if (!seen.has(id)) seen.set(id, { key: c.key, quote: c.quote, doc: ref?.short ?? ref?.doc ?? c.key, url: c.url });
    }
  }
  for (const k of keys ?? []) {
    const ref = REFS[k];
    if (!RULEBOOK_ONLY_SOURCES.includes(k) || seen.has(k) || !ref?.quote) continue;
    seen.set(k, { key: k, quote: ref.quote, doc: ref.short, url: highlightUrl(ref.url, ref.quote, ref.pdfPage, ref.section, ref.fragment) });
  }
  const found = [...seen.values()];
  return keys ? keys.map((k) => found.find((q) => q.key === k)).filter(Boolean) : found;
}
