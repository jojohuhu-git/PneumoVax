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
const ENFORCEMENT_MEANS = {
  floor: 'The dose does not count. It stays on the record with an explanation, and the series still owes a dose.',
  recommendation: 'The dose counts. The app notes that the gap was shorter than recommended and says by how much.',
  none: 'Never flagged — the reason is recorded in the rule itself.',
};
export const INTERVAL_RULES = DOSE_INTERVAL_RULES.map((r) => ({
  id: r.id,
  what: r.what,
  rulebook: r.rulebook,
  vaccine: r.vaccine,
  enforcement: r.enforcement,
  enforcementMeans: ENFORCEMENT_MEANS[r.enforcement],
  authority: r.authority ?? null,
  // ⚠️ THE OWNER HALF USED TO BE ONE SENTENCE FOR EVERY ROW, AND IT WAS WRONG
  // FOR ONE OF THEM. It read "The interval is theirs; treating it as a hard
  // cut-off is ours" — true of the five floors, false of
  // ADULT-PCV20-21-1Y-AFTER-PCV, where no source states the interval at all
  // ("No ACIP or CDC source specifies an interval between adult conjugate
  // doses; the 1 year interval applied here is this app's own convention",
  // its own message to the clinician). Found by driving the page, not by a
  // test: the sentence was accurate for the rows a reader was most likely to
  // look at. The two are different KINDS of judgement call and the page now
  // says which is which.
  authorityMeans: r.authority !== 'OWNER'
    ? 'CDC or ACIP state this interval themselves.'
    : r.enforcement === 'floor'
      ? 'The interval is CDC\'s or ACIP\'s. Treating it as a cut-off that stops the dose counting is this app\'s decision, and the app says so on the dose itself.'
      : 'No CDC or ACIP source states this interval at all. The number applied is this app\'s own convention, and the note on the dose says so.',
  sourceKey: typeof r.source === 'string' ? r.source : null,
}));

// ── Where the app is making a judgement call ─────────────────────────────
//
// OWNER REQUEST 2026-10-25, in her words: "I also want the rulebook updated to
// highlight cases where there are no clear CDC/ACIP recommendations so the app
// is making a judgement call."
//
// The page already said this once per row, in the last column of the
// dose-spacing table, where a reader has to open a section and then read down
// a third column to find it. This is the same fact gathered into one place and
// named.
//
// TWO HALVES, and the page says which is which, exactly as the rest of this
// file does.
//
//   GENERATED  every interval row carrying `authority: 'OWNER'`. That flag is
//              the engine's own record of "the interval is ACIP's; treating it
//              as a cut-off is ours", so this list cannot drift from the table
//              it is drawn from — a row that loses the flag leaves here in the
//              same commit.
//   WRITTEN    the judgement calls that are NOT rows. They live in sentences
//              the engine builds, so nothing generates them. Each one is
//              DRIVEN THROUGH THE ENGINE by
//              regression-c14-2026-10-25-rulebook-matches-the-engine.test.js,
//              which fails if the app stops saying it — a typed sentence about
//              behaviour is the failure mode this whole page exists to avoid.
export const OWNER_INTERVAL_CALLS = INTERVAL_RULES.filter((r) => r.authority === 'OWNER');

export const WRITTEN_JUDGEMENT_CALLS = [
  {
    id: 'repeat-conjugate-interval',
    name: 'How long to wait before repeating a conjugate dose',
    means: 'ACIP states one interval between two conjugate doses in an adult — a PCV20 or PCV21 after a PCV13 — and says nothing at all about a conjugate that has to be given again because it was given too soon. The app reads that interval across to the repeat.',
    says: 'Every card and every dose note that uses the number says in its own words that it is an interpretation and not a stated rule, and names the paediatric table as paediatric rather than citing it.',
  },
  {
    id: 'transplant-stop',
    name: 'Stem-cell transplant, CAR-T, and B-cell-depleting therapy',
    means: 'These patients are revaccinated on a transplant- or therapy-specific protocol rather than on an age-based schedule. Published schedules differ from each other and are revised, so the app does not choose one.',
    says: 'It gives no schedule at all — not even the age-based one the patient would otherwise get — names the bodies whose current guidance to follow, and links to none of them, because a sentence naming them stays true longer than a link.',
  },
];

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
