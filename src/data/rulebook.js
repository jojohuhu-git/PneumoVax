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
import {
  GRACE_DAYS,
  PCV_PPSV23_MIN_INTERVAL_DAYS,
  PPSV23_REVACC_MIN_MONTHS,
  ADULT_ADVISED_PCV_GAP_MONTHS,
  intervalPhrase,
} from '../logic/intervals.js';
import { REFS } from './refs.js';

/** Months as a clinician would say them. 228 -> "19 years". */
export function monthsInWords(m) {
  if (m == null) return '';
  if (m < 24) return `${m} month${m === 1 ? '' : 's'}`;
  if (m % 12 === 0) return `${m / 12} years`;
  return `${Math.floor(m / 12)} years ${m % 12} months`;
}

/**
 * A product's minimum age in the unit a clinician would say it in.
 *
 * OWNER, 2026-10-25: "the youngest age should be described in the appropriate
 * weeks months or years. 42 days is hard to comprehend." The conjugate
 * minimum is stored in DAYS because that is how CDC states it and how
 * validate.js enforces it, and this page used to print the stored figure.
 *
 * A day-stated minimum goes through `intervalPhrase`, the app's single place
 * where a day count becomes words, so "42 days" reads "6 weeks" here and in
 * every verdict sentence from the same number. A month-stated one goes
 * through monthsInWords. Nothing converts twice: the two inputs are different
 * fields on the product, not two readings of one.
 */
export function ageInWords({ months, days } = {}) {
  if (days != null) return intervalPhrase({ days });
  if (months == null) return '';
  // A stored month figure can be fractional (the conjugate minimum is 42 days
  // expressed in months); round before putting it into words.
  return monthsInWords(Math.round(months));
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
  // Generated from whichever unit the product states, so the page never has
  // to choose between them in JSX.
  youngestAge: ageInWords({ months: p.minAgeM, days: p.minAgeDays }),
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

// ── The three things that can happen to a dose already given ────────────
//
// OWNER, 2026-10-25, on the previous version of this page: "simplify the
// explanations [of] how the app determines if doses are given on time and
// valid, off schedule valid, or invalid that require revaccination." These
// three rows are her three outcomes, and they are the ONLY vocabulary the
// dose-spacing table uses — `enforcement` maps onto them one to one, so a
// reader never meets the engine's word for a thing and the page's word for
// the same thing.
export const OUTCOMES = [
  {
    enforcement: null,
    name: 'On time',
    means: 'The gap met the interval. The dose counts and nothing is flagged.',
  },
  {
    enforcement: 'recommendation',
    name: 'Off schedule, still valid',
    means: 'The gap was shorter than the recommended one. The dose counts, and the app writes on it how short the gap was. Nothing is repeated.',
  },
  {
    enforcement: 'floor',
    name: 'Not valid — repeat it',
    means: 'The gap was shorter than a minimum. The dose stays on the record with an explanation, does not count, and the series still owes a dose.',
  },
  {
    enforcement: 'none',
    name: 'Not judged',
    means: 'No interval is applied to this pair of doses at all. Nothing is ever flagged.',
  },
];

const OUTCOME_BY_ENFORCEMENT = OUTCOMES.reduce((acc, o) => {
  if (o.enforcement) acc[o.enforcement] = o;
  return acc;
}, {});

// ── Who states a rule, explained ONCE rather than on every row ───────────
//
// This used to repeat the same two sentences on all 17 rows, which is most of
// what made the section long. A row now carries a short tag and the reader
// meets the explanation once.
export const AUTHORITIES = [
  {
    authority: 'CDC',
    name: 'CDC / ACIP',
    means: 'CDC or ACIP state this interval themselves.',
  },
  {
    authority: 'OWNER',
    name: 'This app',
    means: 'The interval is CDC’s or ACIP’s, but treating it as a cut-off that voids a dose is this app’s own clinical judgement. The app says so on the dose itself.',
  },
];

// ── The child / adult split, said out loud ──────────────────────────────
//
// OWNER, 2026-10-25: "for the rules make it clear distinctions on child vs
// adult rules." The rules were already grouped by `rulebook`, under a small
// grey heading that said only "Children" / "Adults" — which names the group
// without saying what is DIFFERENT about it. The difference is the whole
// point of the evidence block below: a child's numbers are CDC's minimums and
// an adult's are CDC's recommended spacing, so the same short gap means two
// different things.
//
// The ages are interpolated from ADULT_SCHED_MIN_M, so this heading and
// section 1's boundary table can never name different lines.
export const RULEBOOK_GROUPS = [
  {
    rulebook: 'child',
    name: `Children — under ${monthsInWords(ADULT_SCHED_MIN_M)}`,
    means: 'CDC states these as MINIMUM intervals, in those words. A dose given sooner does not count, and the series still owes one.',
  },
  {
    rulebook: 'adult',
    name: `Adults — ${monthsInWords(ADULT_SCHED_MIN_M)} and over`,
    means: 'CDC states these as the RECOMMENDED spacing for the next dose, and states no minimum at all. Where a rule below still refuses a dose, it is tagged “this app” and the reason is in the block above.',
  },
  {
    rulebook: 'any',
    name: 'Any age',
    means: 'Rules stated the same way for a child and for an adult.',
  },
];

// ── GENERATED: every rule about the gap between two recorded doses ───────
//
// `interval` is the row's own `interval:` spec turned into words by
// `intervalPhrase` — the same function the verdict sentences use, fed from the
// same constant that decided the verdict. The paediatric conjugate row is the
// one row whose minimum is a FUNCTION of the child's age and dose number
// (CDC's Catch-up Table 2), so it has no single number to print and says so.
function ruleInterval(rule) {
  const iv = rule.interval;
  if (!iv) return null;
  if (typeof iv.daysFrom === 'function') return null;
  return intervalPhrase(iv);
}

export const INTERVAL_RULES = DOSE_INTERVAL_RULES.map((r) => ({
  id: r.id,
  what: r.what,
  rulebook: r.rulebook,
  vaccine: r.vaccine,
  interval: ruleInterval(r),
  // A floor's number is a minimum; a recommendation's is the recommended
  // spacing. Saying which is the difference between "repeat it" and "note it",
  // so the row names it rather than leaving the reader to infer it from the
  // outcome line below.
  intervalLabel: r.interval == null ? null : (r.enforcement === 'floor' ? 'Minimum' : 'Recommended'),
  // WRITTEN, and true of exactly one row — the only row with no single
  // number. Asserted against `ruleInterval` returning null.
  intervalVaries: ruleInterval(r) == null && r.interval != null
    ? 'set by CDC’s catch-up table — it depends on how old the child was at the earlier dose and which dose in the series this one is'
    : null,
  enforcement: r.enforcement,
  // Only the never-flagged rows have one, and they must: see the field's note
  // in doseIntervalRules.js.
  whyNotJudged: r.whyNotJudged ?? null,
  outcome: OUTCOME_BY_ENFORCEMENT[r.enforcement].name,
  outcomeMeans: OUTCOME_BY_ENFORCEMENT[r.enforcement].means,
  authority: r.authority ?? null,
  sourceKey: typeof r.source === 'string' ? r.source : null,
}));

// ── Where the evidence runs out ──────────────────────────────────────────
//
// OWNER, 2026-10-25: "there should be a section where nuance is applied. For
// example we discussed there is no data discussing the minimum duration
// between a PPSV23 to PPSV23, PCV to PCV or PPSV23 to PCV if the latter
// vaccine was given earlier."
//
// All of this is already in CLINICAL_SPEC.md §K, where it has only ever been
// readable by whoever opens that file. It is her own determination of
// 2026-10-11 and its evidence, said plainly to the clinician the rule is
// applied to.
//
// ONE CORRECTION TO THE PREMISE, and it is why this is split child/adult: for
// a CHILD the minimum intervals ARE published — CDC's catch-up schedule
// prints a column headed "Minimum Interval Between Doses" for the conjugate
// series, and that column is what voided the 15-month-old's third dose on
// 2026-10-23. The absence of evidence is an ADULT fact.
//
// Every number below comes from the constant the engine enforces, and the
// three "what the app does" claims are driven through the real validator by
// regression-2026-10-25-rulebook-evidence-limits.test.js — so a rule that
// changes makes this section fail rather than quietly lie.
const YEAR = intervalPhrase({ months: ADULT_ADVISED_PCV_GAP_MONTHS });
const FIVE_YEARS = intervalPhrase({ months: PPSV23_REVACC_MIN_MONTHS });
const EIGHT_WEEKS = intervalPhrase({ days: PCV_PPSV23_MIN_INTERVAL_DAYS });

export const EVIDENCE = {
  lead: 'The intervals above are not all the same kind of rule. For a child most of them are published minimums. For an adult none of them is — and that changes what a short gap should mean to you.',
  points: [
    {
      name: 'For a child, the minimums are published',
      means: `CDC’s catch-up schedule prints a column headed “Minimum Interval Between Doses” for the pneumococcal conjugate series, and the Child & Adolescent Notes say a PPSV23 is given at least ${EIGHT_WEEKS} after the most recent PCV. Those are minimums in CDC’s own words, so a child’s dose given sooner genuinely does not count.`,
    },
    {
      name: 'For an adult, no document states a minimum at all',
      means: `The adult intervals — ${YEAR}, ${FIVE_YEARS}, ${EIGHT_WEEKS} — are published as the recommended spacing for the NEXT dose. None of the three current ACIP adult papers says that a shorter gap makes a dose invalid or that it should be repeated, and CDC’s own machine-readable rule set sets no absolute minimum for any adult pneumococcal interval. Where this app refuses an adult dose on timing, that is this app’s clinical judgement, and those rows are tagged “this app” above.`,
    },
    {
      name: 'The three pairs with no evidence either way',
      means: 'Nothing published says what to do when a second PPSV23, one conjugate after another, or a conjugate after a PPSV23 was given sooner than the recommended gap. The app does not treat the three alike, and the table below is what it actually does.',
    },
    {
      name: 'So a rule tagged “this app” is a prompt, not a requirement',
      means: 'If you judge that a dose given inside one of those adult intervals was reasonable, no published guidance contradicts you. Read the app’s note as a flag to check, and record your own decision.',
    },
  ],
  // WRITTEN, and every cell is driven through the validator by this section's
  // guard test on a named patient. Keep the two in step: the test names the
  // patient it drove for each cell in its own comments.
  //
  // Each row carries its own "in a child" / "in an adult" label rather than
  // relying on a column header, because the page's mobile rule hides table
  // headers and stacks the cells — which left two sentences running together
  // with no way to tell which patient each was about. Checked at 390px.
  pairs: [
    {
      pair: 'A second PPSV23 after the first',
      childLabel: 'In a child',
      adultLabel: 'In an adult',
      child: `Not valid before ${FIVE_YEARS}. CDC words this one as “at least ${FIVE_YEARS}”, so it is CDC’s minimum.`,
      adult: `Not valid before ${FIVE_YEARS} — this app’s judgement. ACIP recommends the gap and does not say a shorter one must be repeated.`,
    },
    {
      pair: 'One conjugate after another',
      childLabel: 'In a child',
      adultLabel: 'In an adult',
      child: 'Not valid inside CDC’s catch-up minimum for that dose of the series.',
      adult: 'Counts, with a note saying how short the gap was. Nothing is repeated.',
    },
    {
      pair: 'A conjugate after a PPSV23',
      childLabel: 'In a child',
      adultLabel: 'In an adult',
      child: 'No rule at all — the app applies no interval and says nothing.',
      adult: `Not valid before ${YEAR} when the PPSV23 is the only dose on the record — this app’s judgement. Where a PCV13 is on the record too, it counts with a note.`,
    },
  ],
  grace: `One grace CDC does state, for every vaccine: a dose given up to ${GRACE_DAYS} days before a minimum still counts. It applies only to a dose already given — never to the dates this app advises for a dose still to come.`,
  asOf: 'Each dose is judged as of the day it was given, not against today. A dose that did not count stays on the record with its explanation, and a later, properly spaced dose still completes the series.',
};

// ── GENERATED: every document the app can cite, newest check first ───────
export const SOURCES = Object.values(
  Object.entries(REFS).reduce((acc, [, v]) => {
    if (!v || !v.url) return acc;
    const page = (v.page ?? v.url).split('#')[0];
    const key = v.short ?? v.doc ?? page;
    if (!acc[key] || (v.lastVerified ?? '') > (acc[key].lastVerified ?? '')) {
      acc[key] = { name: key, label: v.label ?? key, url: page, rulebook: v.rulebook ?? 'any', lastVerified: v.lastVerified ?? null };
    }
    return acc;
  }, {}),
).sort((a, b) => a.name.localeCompare(b.name));
