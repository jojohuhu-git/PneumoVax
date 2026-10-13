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
  return verdictFromResult(recommend(input));
}

/**
 * The same line, from an already-computed result.
 *
 * Split out so the record-problem corpus can append its own field without
 * running `recommend()` twice over its own ~17,000 cases.
 */
function verdictFromResult(r) {
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

// ─────────────────────────────────────────────────────────────────────────
// THE IMPOSSIBLE-ENTRY GRID (owner decision, 2026-10-12)
// ─────────────────────────────────────────────────────────────────────────
//
// A second corpus, in its own file, for histories a clinician could never
// really have given: a dose dated before the patient was born, and a dose
// dated after today.
//
// ── Why it is separate, and why it exists at all ─────────────────────────
//
// The grid above skips every case where a dose falls before birth — 15,340 of
// its 31,590 combinations, nearly half, thrown away on one line. The rule that
// judges those doses was therefore guarded by nothing: deleting `isBeforeBirth`
// outright left `sweep-verdict-corpus.test.js` green, 12 of 12. The same was
// true of `futureDated` — stronger still, because a dose dated after today
// cannot even be WRITTEN in the grid above, whose every offset is "days ago".
//
// Three changes in one session reported "0 of 16,250 moved". All three were
// honest and none was informative.
//
// They live in a SEPARATE corpus rather than being folded into the one above
// (owner decision) so that the 16,250 figure keeps meaning "patients a
// clinician could really enter". When a real clinical change moves 300 of
// them, the reviewer reads 300 lines — not 300 buried among 23,000 patients
// whose records are impossible.
//
// ── What is in it ────────────────────────────────────────────────────────
//
//   • Every combination the grid above REFUSES to build. Free coverage: it is
//     the exact complement of `buildCases()`, machine-enumerated over the same
//     ages and risk profiles, so it cannot drift from the main grid's shape.
//   • Future-dated shapes, which the grid above cannot express. A negative
//     offset here means "that many days AFTER today".
//
// Add a new impossible-entry rule to `recordProblemFor()` and add its shape
// here in the same commit, or the rule ships unguarded exactly as these two did.

/**
 * PCV histories dated in the FUTURE. Offsets are days before today, so a
 * negative number is a date after today.
 *
 *   -1    tomorrow — one day the far side of the boundary, and the reason the
 *         boundary is worth a case at all: a dose dated TODAY still counts
 *         (`dose.date <= today`), and nothing but a case on each side of that
 *         line stops someone "simplifying" it to `<`.
 *   -30   the ordinary typo: a clinic appointment typed into the history.
 *   365 / -365  a real dose and a future one in the same record, which is the
 *         shape that proves the rule is judged per dose rather than per patient.
 */
export const GRID_FUTURE_PCV_HISTORIES = [
  [],
  [['PCV20', -1]],
  [['PCV20', -30]],
  [['PCV13', 365], ['PCV20', -365]],
];

/** PPSV23 histories dated in the future. Same convention. */
export const GRID_FUTURE_PPSV23_HISTORIES = [
  [],
  [-1],
  [-30],
];

/**
 * One shot recorded on TWO rows — the third impossible entry (owner decision,
 * 2026-10-12).
 *
 * Added in the same commit as the rule, under the standing rule this file's
 * whole existence argues for. Without it the duplicate rule would have shipped
 * exactly as the other two did: neither corpus contains a single same-product
 * same-date pair, because nobody writing the grid thought to put one there.
 *
 *   PCV20 twice on one day       the plain double entry.
 *   PCV20 + an unnamed product   the same dose written down twice, once with
 *                                the brand and once without — which is why
 *                                `duplicateEntry` treats a blank product as a
 *                                match rather than as a different vaccine.
 *
 * Two DIFFERENT named products on one day is deliberately NOT here: it is not a
 * record problem, it keeps its ordinary verdict plus a sentence, and the main
 * grid already carries it as `[['PCV15', 730], ['PCV20', 730]]`.
 */
export const GRID_DUPLICATE_PCV_HISTORIES = [
  [],
  [['PCV20', 365], ['PCV20', 365]],
  [['PCV20', 365], ['', 365]],
];

/** The same, for PPSV23 — one product, so only the plain double entry exists. */
export const GRID_DUPLICATE_PPSV23_HISTORIES = [
  [],
  [365, 365],
];

const caseKey = (ageMonths, riskIds, pcvPattern, ppsvPattern) => key([
  `a${ageMonths}`,
  `r:${riskIds.join('+')}`,
  `P:${pcvPattern.map(([p, d]) => `${p || '?'}@${d}`).join(',')}`,
  `S:${ppsvPattern.join(',')}`,
]);

const caseInput = (ageMonths, dob, riskIds, pcvPattern, ppsvPattern, today) => ({
  ageMonths,
  dob,
  today,
  riskIds,
  pcvDoses: pcvPattern.map(([product, d]) => ({ product, date: addDays(today, -d) })),
  ppsv23Doses: ppsvPattern.map((d) => ({ product: 'PPSV23', date: addDays(today, -d) })),
});

/**
 * Enumerate the impossible-entry grid.
 *
 * Part 1 is the complement of `buildCases()` — the same four loops, keeping
 * exactly what that function skips. Written as the same condition negated, not
 * as a hand-listed set, so the two can never fall out of step.
 *
 * Parts 2 and 3 cross the future-dated and double-entry shapes. The empty/empty
 * pair is dropped from each: it contains no impossible entry and would duplicate
 * a case the main grid already owns.
 */
export function buildRecordProblemCases({ today = CORPUS_TODAY } = {}) {
  const cases = [];
  for (const ageMonths of GRID_AGES_MONTHS) {
    const dob = addCalendarMonths(today, -ageMonths);
    for (const riskIds of GRID_RISK_PROFILES) {
      // Part 1 — the cases buildCases() throws away.
      for (const pcvPattern of GRID_PCV_HISTORIES) {
        for (const ppsvPattern of GRID_PPSV23_HISTORIES) {
          const offsets = [...pcvPattern.map(([, d]) => d), ...ppsvPattern];
          if (!offsets.some((d) => addDays(today, -d) < dob)) continue;
          cases.push({
            key: caseKey(ageMonths, riskIds, pcvPattern, ppsvPattern),
            input: caseInput(ageMonths, dob, riskIds, pcvPattern, ppsvPattern, today),
          });
        }
      }
      // Parts 2 and 3 — dates after today, and one shot on two rows. Both are
      // "cross these shapes and drop the pair that contains neither", so they
      // share one loop rather than two copies of it.
      for (const [pcvShapes, ppsvShapes] of [
        [GRID_FUTURE_PCV_HISTORIES, GRID_FUTURE_PPSV23_HISTORIES],
        [GRID_DUPLICATE_PCV_HISTORIES, GRID_DUPLICATE_PPSV23_HISTORIES],
      ]) {
        for (const pcvPattern of pcvShapes) {
          for (const ppsvPattern of ppsvShapes) {
            if (!pcvPattern.length && !ppsvPattern.length) continue;
            cases.push({
              key: caseKey(ageMonths, riskIds, pcvPattern, ppsvPattern),
              input: caseInput(ageMonths, dob, riskIds, pcvPattern, ppsvPattern, today),
            });
          }
        }
      }
    }
  }
  return cases;
}

/**
 * One impossible-entry case's answer.
 *
 * The whole ordinary verdict, plus `RP=` — which KIND of record problem each
 * recorded dose was judged to be, in dose order, PCV stream then PPSV23.
 *
 * The kind is in here because it is the thing this corpus exists to watch, and
 * because without it the line could not tell "the rule fired" from "the rule
 * fired for the wrong reason" — the PCV21-licence misblame that `recordProblemFor`
 * was built to stop would have looked identical. It is a one-word verdict, not
 * prose: the sentences themselves stay out, for the reason test-grid.js gives.
 */
export function recordProblemVerdictOf(input) {
  const r = recommend(input);
  const base = verdictFromResult(r);
  if (base === 'EXCLUDED') return base;
  const kinds = (stream) => (r.perDose?.[stream] ?? [])
    .map((d) => d.recordProblem ?? '-')
    .join(',');
  return `${base} RP=${kinds('pcv')}/${kinds('ppsv23')}`;
}

/** The impossible-entry corpus, one `key\tverdict` line per case, sorted. */
export function recordProblemCorpusLines({ today = CORPUS_TODAY } = {}) {
  return buildRecordProblemCases({ today })
    .map((c) => `${c.key}\t${recordProblemVerdictOf(c.input)}`)
    .sort();
}

export const RECORD_PROBLEM_CORPUS_RELATIVE_PATH =
  'src/logic/__tests__/__corpus__/record-problem-corpus.tsv';
