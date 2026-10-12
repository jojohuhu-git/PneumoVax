// ─────────────────────────────────────────────────────────────────────────
// test-grid.js — the shared patient grid, and the verdict corpus built from it.
//
// ONE source of synthetic cases (S8, 2026-10-11). The four invariant sweeps
// that S7 still owes (never-events, two-run relations, dose-counter, and the
// grid-covers-the-app guard) must be built on THIS grid rather than inventing a
// second list, or "the sweeps cover every risk factor" stops being checkable.
//
// ── Why this file exists ─────────────────────────────────────────────────
//
// Twice in one week a change moved thousands of patients' verdicts and every
// guard the repo had stayed silent.
//
//   P0-2 (peds series totals) — the spec was RIGHT and the engine was wrong in
//   5 of p2016 Table 1's 14 cells. The three PneumoRecs comparison harnesses
//   (`scripts/{adult,peds,hsct}Cases.mjs`) came out byte-identical, because not
//   one of their cases fell in a broken cell.
//
//   ANCHOR-1 (a gap is measured from the dose that counted) — a deliberate,
//   owner-approved change that moved 19,546 of 231,300 synthetic cases. The
//   same three harnesses came out byte-identical AGAIN, because none of their
//   cases has a rejected dose anchoring another one.
//
// A hand-written case list only ever covers the cells somebody thought of. The
// sweep that found both of those was written by hand, run once, and thrown away
// with the session. This file makes it permanent.
//
// ── What it does ─────────────────────────────────────────────────────────
//
// `buildCases()` enumerates age x risk profile x PCV history x PPSV23 history.
// `verdictOf()` renders one case's answer as a single line with NO prose in it.
// `corpusLines()` returns the whole sorted corpus.
//
// The lines are committed to `logic/__tests__/__corpus__/verdict-corpus.tsv`,
// and `sweep-verdict-corpus.test.js` fails if the engine stops reproducing it.
// So a change that moves verdicts cannot merge quietly: the author has to run
// `npm run sweep:update`, which puts "19,546 lines changed" in the pull request
// diff where the owner can see it and ask why.
//
// ── Why there is no prose in a verdict ───────────────────────────────────
//
// Deliberate. The corpus records what the app DECIDES — what is due, when, with
// what dose numbering, and whether each recorded dose counts and under which
// rule. It does not record note text, dose labels or reason sentences, only how
// MANY reasons a dose was given.
//
// If wording were in here, every copy edit would turn the suite red across tens
// of thousands of lines, and a gate that cries wolf is a gate someone deletes.
// Keeping prose out means a red corpus always means the same thing: a patient's
// answer changed. Wording has its own guards (`regression-p6-3b-note-cite-parity`,
// `regression-p6-4-note-lead-and-detail`, `dose-group-headings`).
//
// The one prose-adjacent thing kept is `reasons.length`, because "this dose is
// explained" versus "this dose says nothing" is a verdict, not a wording choice
// — it is the open finding about a PPSV23 given after the series is complete.
import { recommend } from './logic/recommend.js';
import { addCalendarMonths, addDays } from './logic/dateUtils.js';

/**
 * The pinned clock.
 *
 * Every date in the grid is derived from it, so the corpus is reproducible on
 * any machine on any day. Without this the snapshot would churn daily and be
 * worthless. (The repo-wide pinned clock is still P2-1's to add; this is a
 * local pin for the corpus only.)
 */
export const CORPUS_TODAY = '2026-10-11';

/**
 * Ages in months, chosen to sit ON the boundaries the rules turn on rather than
 * sampling evenly — an evenly spaced grid misses exactly the cells that break.
 *
 *   2, 4, 6, 7, 12, 15, 24   p2016 Table 1 / Table 2 infant and catch-up cells
 *                            (the five cells peds P0-2 found wrong)
 *   60, 72                   mid-childhood, Table 4 risk rows
 *   216                      PCV21_MIN_AGE_M — PCV21's product floor (18y)
 *   227, 228                 ADULT_SCHED_MIN_M — the peds/adult rulebook
 *                            boundary (19y), from both sides
 *   600                      50y, where routine adult vaccination now begins
 *   780                      65y, the PPSV23 shared-decision age
 *   840                      70y — the patient of the S14-RC bug, whose second
 *                            PPSV23 two years after the first read "valid"
 *                            with an empty reasons array
 */
export const GRID_AGES_MONTHS = [
  2, 4, 6, 7, 12, 15, 24, 60, 72, 216, 227, 228, 600, 780, 840,
];

/**
 * Risk profiles. Singles that select a different pathway, plus two pairs and
 * the hard stop — not the full 2^17, which would be 131,072 profiles per age.
 * S7's never-events sweep is the one that owes every risk id singly and paired;
 * this grid needs one representative per PATHWAY.
 */
export const GRID_RISK_PROFILES = [
  [],
  ['asplenia'],                     // IC
  ['hiv'],                          // IC
  ['cochlear_implant'],             // special — carries the 8-week option
  ['csf_leak'],                     // special — carries the 8-week option
  ['chronic_heart'],                // non-IC chronic
  ['diabetes'],                     // non-IC chronic
  ['smoking'],                      // adult-only (P3-9b's trap)
  ['alcoholism'],                   // adult-only
  ['hsct'],                         // the transplant pathway
  ['bcell_car_t_therapy'],          // the hard stop, which wins over HSCT
  ['asplenia', 'cochlear_implant'], // IC + special
  ['chronic_heart', 'diabetes'],    // two non-IC
];

/**
 * PCV histories, as (product, days before today).
 *
 * The day offsets straddle every floor in `DOSE_INTERVAL_RULES` with a
 * just-short and a just-over neighbour, because a floor's bugs live on its
 * edges and in CDC's 4-day grace:
 *
 *   27 / 28 / 29       4 weeks  — the paediatric series minimum under 12 months
 *   52 / 56 / 57       8 weeks  — PPSV23 after PCV, and the adult 8-week option
 *   364 / 365 / 366    1 year   — the adult PCV->PPSV23 and PCV->PCV intervals
 *   1824 / 1825 / 1826 5 years  — a second PPSV23, and PCV20/21 after PPSV23
 *   0                  same visit — the likeliest real co-administration error
 *
 * Patterns with TWO doses where the first is itself too early are the ones that
 * ANCHOR-1 turned on and no harness had: a rejected dose anchoring a later one.
 */
export const GRID_PCV_HISTORIES = [
  [],
  [['PCV13', 3650]],
  [['PCV15', 730]],
  [['PCV20', 365]],
  [['PCV21', 365]],
  [['PCV7', 3650]],                                   // never counts
  [['PCV13', 3650], ['PCV20', 366]],                  // 1 year + 1 day: clears
  [['PCV13', 3650], ['PCV20', 364]],                  // 1 day short: voided
  [['PCV15', 730], ['PCV20', 730]],                   // same visit
  [['PCV13', 1825], ['PCV13', 1797]],                 // 28 days apart
  [['PCV13', 200], ['PCV13', 172], ['PCV13', 144]],   // 28-day infant spacing
  [['PCV7', 3650], ['PCV13', 1825], ['PCV20', 365]],
  [['PCV15', 1825], ['PCV15', 1797]],
  [['PCV13', 224], ['PCV13', 168], ['PCV13', 112]],   // 8-week infant spacing
  [['PCV13', 140], ['PCV13', 112]],
  [['PCV15', 112], ['PCV15', 84]],
  // "Unknown PCV product" — a real option on the history step, for a dose the
  // clinician knows was given but cannot name. The engine counts it as a generic
  // PCV ("Product not recorded — counted as a generic PCV dose"), which means the
  // product-keyed rules cannot select on it, so it deserves covering. The grid
  // had no case for it until the coverage guard in sweep-verdict-corpus.test.js
  // said so.
  [['', 365]],
  [['', 3650], ['PCV20', 365]],
];

/** PPSV23 histories, as days before today. Same edge-straddling logic. */
export const GRID_PPSV23_HISTORIES = [
  [],
  [3650],
  [1826],
  [1824],          // 1 day short of 5 years
  [365],
  [56],
  [0],             // today
  [3650, 1824],    // two doses, 1 day short of the 5-year minimum apart
  [3650, 1826],    // two doses, just clear of it
];

const key = (parts) => parts.join('|');

/**
 * Enumerate the grid.
 *
 * A case is SKIPPED when any of its doses would fall before the patient was
 * born — a 2-month-old cannot have had a dose ten years ago. Skipping the whole
 * case rather than silently dropping the impossible dose matters: dropping it
 * would collapse several different histories onto one, and the corpus would
 * then carry duplicate keys whose verdicts disagreed.
 *
 * ("Before birth" has its own guard, `regression-p3-6-before-birth`. The corpus
 * is for cases a clinician could really enter.)
 */
export function buildCases({ today = CORPUS_TODAY } = {}) {
  const cases = [];
  for (const ageMonths of GRID_AGES_MONTHS) {
    const dob = addCalendarMonths(today, -ageMonths);
    for (const riskIds of GRID_RISK_PROFILES) {
      for (const pcvPattern of GRID_PCV_HISTORIES) {
        for (const ppsvPattern of GRID_PPSV23_HISTORIES) {
          const allOffsets = [
            ...pcvPattern.map(([, d]) => d),
            ...ppsvPattern,
          ];
          if (allOffsets.some((d) => addDays(today, -d) < dob)) continue;

          cases.push({
            key: key([
              `a${ageMonths}`,
              `r:${riskIds.join('+')}`,
              // `?` for the "Unknown PCV product" option, whose key is the empty
              // string — without it that case's key would read "@365" and a
              // reader could not tell it from a corrupted line.
              `P:${pcvPattern.map(([p, d]) => `${p || '?'}@${d}`).join(',')}`,
              `S:${ppsvPattern.join(',')}`,
            ]),
            input: {
              ageMonths,
              dob,
              today,
              riskIds,
              pcvDoses: pcvPattern.map(([product, d]) => ({ product, date: addDays(today, -d) })),
              ppsv23Doses: ppsvPattern.map((d) => ({ product: 'PPSV23', date: addDays(today, -d) })),
            },
          });
        }
      }
    }
  }
  return cases;
}

const nn = (v) => (v == null ? '-' : String(v));
const bool = (v) => (v ? '1' : '0');

/**
 * A brand offered, as its product code alone.
 *
 * `brands` holds display strings — "PCV20 (Prevnar 20)". Storing those would
 * put a trade name in 14,000 lines and turn the corpus red on a label edit,
 * which is the churn this file is built to avoid. The product code in front of
 * the bracket is the stable half, and it is the half that is clinically load-
 * bearing: WHICH product, not how it is spelled on the card.
 */
const brandCode = (b) => String(typeof b === 'string' ? b : b?.key ?? b?.label ?? '?')
  .split(' ')[0];

/** One recommendation card, structural fields only. */
function recVerdict(rec) {
  return [
    rec.vaccine,
    rec.status,
    bool(rec.dueToday),
    nn(rec.earliestNextDate),
    nn(rec.seriesTotal),
    nn(rec.primaryTotal),
    bool(rec.advisory),
    nn(rec.minIntervalDays),
    nn(rec.minIntervalMonths),
    (rec.brands ?? []).map(brandCode).join('/'),
  ].join('/');
}

/** One recorded dose's verdict. `reasons` contributes its COUNT, never its text. */
function doseVerdict(d) {
  return [
    d.status,
    nn(d.intervalRuleId),
    nn(d.effectiveDoseNum),
    bool(d.doesNotCount),
    bool(d.earlyAdvisory),
    nn(d.earliestValidDate),
    `n${(d.reasons ?? []).length}`,
  ].join(':');
}

/**
 * One case's complete answer, as a single prose-free line.
 *
 * Everything a patient would act on is in here: whether they are excluded, what
 * is recommended and when, the series numbering, and for every dose already on
 * the record whether it counts and which rule judged it.
 */
export function verdictOf(input) {
  const r = recommend(input);
  if (r.excluded) return 'EXCLUDED';
  return [
    `R=${(r.recs ?? []).map(recVerdict).join(';')}`,
    `PCV=${(r.perDose?.pcv ?? []).map(doseVerdict).join(',')}`,
    `S23=${(r.perDose?.ppsv23 ?? []).map(doseVerdict).join(',')}`,
    `HSCT=${r.hsct ? `${nn(r.hsct.pathway ?? r.hsct.status ?? 'y')}/${(r.hsct.recs ?? []).length}` : '-'}`,
    `GEO=${bool(r.pcv21Geo)}`,
  ].join(' ');
}

/** The whole corpus, one `key\tverdict` line per case, sorted for a stable diff. */
export function corpusLines({ today = CORPUS_TODAY } = {}) {
  return buildCases({ today })
    .map((c) => `${c.key}\t${verdictOf(c.input)}`)
    .sort();
}

export const CORPUS_RELATIVE_PATH = 'src/logic/__tests__/__corpus__/verdict-corpus.tsv';
