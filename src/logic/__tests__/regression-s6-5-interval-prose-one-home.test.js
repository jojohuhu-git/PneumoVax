// S6 second half (census step 6, 2026-10-15) — the interval PROSE gets one home.
//
// ── The bug this file exists to prevent ──────────────────────────────────
//
// Every interval a clinician reads was hand-typed next to the constant that
// computes the date, so the words and the arithmetic could part company. They
// did. Measured on `main` at 999393b, by setting ADULT_PPSV23_INTERVAL_MONTHS
// to 6 and asking the engine for a 60-year-old with diabetes and a PCV15 on
// record:
//
//   doseLabel        : PPSV23 (≥1 year after PCV15) — completes the series
//   minIntervalMonths: 6
//   earliestNextDate : 2027-04-10
//
// The card said "≥1 year" while its own eligible-on date was six months away.
// A clinician reading the sentence and a clinician reading the date got two
// different answers from the same card, and nothing in the app noticed.
//
// The census (docs/archive/census-2026-10-10-pneumovax-numbers.md, step 6)
// called this "the real sync risk" and counted ~58 hand-written strings. Audit
// A-P1-1 is the same failure already having happened once: ppsvIntervalLabel
// derived "8 weeks" from the risk class while the >=50 no-history note
// hardcoded ">=1 year", so one patient was told both numbers one step apart.
//
// ── What is guarded, and in which direction ──────────────────────────────
//
// Two different jobs, because neither alone is enough:
//
//   1. BEHAVIOURAL (the `describe` blocks on the engine). The rendered words
//      must equal intervalPhrase() of the governing constant. These catch a
//      drift in either direction, in any file, under any name — including a
//      future contributor who changes the constant and leaves the sentence.
//      Proved by mutation: see the counts in docs/agent/testing.md.
//
//   2. SOURCE (the last describe block). A behavioural test can only check the
//      sentences it thinks to render; a clinician-visible string that no test
//      covers could still be hand-typed. The source guard refuses a literal
//      interval phrase inside a label or note in the two engine files, so a
//      NEW hand-typed interval is rejected at the point it is written.
//
// ── What is deliberately NOT guarded ─────────────────────────────────────
//
// Verbatim source quotes. `refs.js`'s `quote` fields and
// `doseIntervalRules.js`'s `source` provenance strings transcribe ACIP/CDC
// sentences; a transcription that silently followed one of OUR constants would
// stop being a quote and the citation would become a lie. Those stay
// hand-typed, and the source guard below is scoped to exclude them.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { recommend } from '../recommend.js';
import {
  intervalPhrase,
  intervalPhraseAdj,
  intervalArticle,
  PCV_PPSV23_MIN_INTERVAL_DAYS,
  PCV_MIN_INTERVAL_DAYS_FROM_12M,
  PPSV23_REVACC_MIN_MONTHS,
} from '../intervals.js';
import { ADULT_PPSV23_INTERVAL_MONTHS, ADULT_PPSV23_SHORTER_MINIMUM_WEEKS } from '../../data/riskFactors.js';

const TODAY = '2026-10-15';

const noteText = (r) => (typeof r.note === 'string'
  ? r.note
  : [r.note?.lead, r.note?.detail].filter(Boolean).join(' '));

/** Every clinician-visible string on a rec, joined. */
const visible = (r) => [r.doseLabel, noteText(r)].filter(Boolean).join(' ');

// ─────────────────────────────────────────────────────────────────────────
describe('intervalPhrase — the words for a number', () => {
  it('states week-based gaps in weeks', () => {
    expect(intervalPhrase({ days: 56 })).toBe('8 weeks');
    expect(intervalPhrase({ days: 28 })).toBe('4 weeks');
    expect(intervalPhrase({ days: 42 })).toBe('6 weeks');
  });

  it('states month-based gaps in years when they divide, months when they do not', () => {
    expect(intervalPhrase({ months: 12 })).toBe('1 year');
    expect(intervalPhrase({ months: 60 })).toBe('5 years');
    expect(intervalPhrase({ months: 24 })).toBe('2 years');
    expect(intervalPhrase({ months: 6 })).toBe('6 months');
  });

  it('falls back to days for a gap that is not whole weeks', () => {
    expect(intervalPhrase({ days: 5 })).toBe('5 days');
    expect(intervalPhrase({ days: 10 })).toBe('10 days');
  });

  it('says "1 week" and "1 year", never "1 weeks"', () => {
    expect(intervalPhrase({ days: 7 })).toBe('1 week');
    expect(intervalPhrase({ months: 12 })).toBe('1 year');
    expect(intervalPhrase({ months: 1 })).toBe('1 month');
  });

  // Weeks and calendar months are not interchangeable in this app (A-P2-11),
  // so the helper refuses to guess which one a bare number meant.
  it('refuses an ambiguous or empty call', () => {
    expect(() => intervalPhrase({ days: 56, months: 12 })).toThrow(/days OR months/);
    expect(() => intervalPhrase({})).toThrow(/days or months/);
    expect(() => intervalPhrase()).toThrow(/days or months/);
  });
});

// These two exist because the first pass at S6 shipped only the noun form and
// printed "the 8 weeks minimum interval" and "this 5 years gap" to 843 of the
// 16,250 swept patients. The suite was green throughout — no test asserted
// those clauses — and only a diff of the rendered prose caught it. Hence both
// a helper test and the clause assertions further down.
describe('intervalPhraseAdj — the adjectival form', () => {
  it('is hyphenated and always singular', () => {
    expect(intervalPhraseAdj({ days: 56 })).toBe('8-week');
    expect(intervalPhraseAdj({ months: 12 })).toBe('1-year');
    expect(intervalPhraseAdj({ months: 60 })).toBe('5-year');
    expect(intervalPhraseAdj({ months: 6 })).toBe('6-month');
  });

  it('never pluralises, so "a 5-year gap" cannot become "a 5-years gap"', () => {
    for (const spec of [{ days: 56 }, { months: 12 }, { months: 60 }, { days: 28 }]) {
      expect(intervalPhraseAdj(spec)).not.toMatch(/s$/);
    }
  });
});

describe('intervalArticle — so the article follows the number too', () => {
  it('says "an" before a number pronounced with a leading vowel', () => {
    expect(intervalArticle({ days: 56 })).toBe('an');   // eight weeks
    expect(intervalArticle({ months: 18 })).toBe('an'); // eighteen months
    expect(intervalArticle({ months: 11 })).toBe('an'); // eleven months
  });

  it('says "a" otherwise', () => {
    expect(intervalArticle({ months: 12 })).toBe('a');  // one year
    expect(intervalArticle({ months: 60 })).toBe('a');  // five years
    expect(intervalArticle({ days: 28 })).toBe('a');    // four weeks
  });
});

// ─────────────────────────────────────────────────────────────────────────
// The behavioural half. Each case renders a real card and asserts the words
// against intervalPhrase() of the constant that drives that card's date, so
// the assertion moves with the constant instead of pinning today's wording.
describe('the adult PCV15 -> PPSV23 card says what it computes', () => {
  const afterPcv15 = (riskIds) => recommend({
    dob: '1966-05-01', ageMonths: 725, riskIds, today: TODAY,
    pcvDoses: [{ date: TODAY, product: 'PCV15' }],
    ppsv23Doses: [],
  }).recs.find((r) => r.vaccine === 'PPSV23');

  for (const risk of ['diabetes', 'hiv', 'cochlear_implant', 'csf_leak']) {
    it(`states the recommended interval from the constant (${risk})`, () => {
      const r = afterPcv15([risk]);
      expect(r).toBeDefined();
      const words = intervalPhrase({ months: ADULT_PPSV23_INTERVAL_MONTHS });
      // The number that drives the date, and the words beside it, agree.
      expect(r.minIntervalMonths).toBe(ADULT_PPSV23_INTERVAL_MONTHS);
      expect(r.doseLabel).toContain(words);
      expect(noteText(r)).toContain(words);
    });
  }

  // A-P1-1: the 8-week option is NAMED for IC / cochlear / CSF and never
  // substituted. Its wording must follow its own constant too — that constant
  // was exported and read by nothing at all before S6.
  it('names the shorter minimum from its constant, for IC / cochlear / CSF', () => {
    const words = intervalPhrase({ days: ADULT_PPSV23_SHORTER_MINIMUM_WEEKS * 7 });
    for (const risk of ['hiv', 'cochlear_implant', 'csf_leak']) {
      expect(noteText(afterPcv15([risk]))).toContain(words);
    }
  });

  it('does not name the shorter minimum for a chronic-only adult', () => {
    const words = intervalPhrase({ days: ADULT_PPSV23_SHORTER_MINIMUM_WEEKS * 7 });
    expect(noteText(afterPcv15(['diabetes']))).not.toContain(words);
  });
});

describe('the other adult cards say what they compute', () => {
  const adult = ({ pcvDoses = [], ppsv23Doses = [], riskIds = [] }) => recommend({
    dob: '1966-05-01', ageMonths: 725, riskIds, today: TODAY, pcvDoses, ppsv23Doses,
  }).recs.find((r) => r.vaccine === 'PCV');

  const YEAR = () => intervalPhrase({ months: ADULT_PPSV23_INTERVAL_MONTHS });

  it('PCV13 only -> the 1-year gap is stated from the constant', () => {
    const r = adult({ pcvDoses: [{ date: '2020-01-01', product: 'PCV13' }] });
    expect(r.minIntervalMonths).toBe(ADULT_PPSV23_INTERVAL_MONTHS);
    expect(r.doseLabel).toContain(YEAR());
    expect(noteText(r)).toContain(YEAR());
  });

  it('PPSV23 only -> the 1-year gap is stated from the constant', () => {
    const r = adult({ ppsv23Doses: [{ date: '2020-01-01', product: 'PPSV23' }] });
    expect(r.minIntervalMonths).toBe(ADULT_PPSV23_INTERVAL_MONTHS);
    expect(r.doseLabel).toContain(YEAR());
    expect(noteText(r)).toContain(YEAR());
  });

  it('no history -> the PCV15 follow-up gap is stated from the constant', () => {
    const r = adult({});
    expect(noteText(r)).toContain(YEAR());
  });

  it('PCV13 + PPSV23 -> the 5-year gap is stated from the revaccination constant', () => {
    const r = adult({
      pcvDoses: [{ date: '2010-01-01', product: 'PCV13' }],
      ppsv23Doses: [{ date: '2012-01-01', product: 'PPSV23' }],
    });
    const words = intervalPhrase({ months: PPSV23_REVACC_MIN_MONTHS });
    expect(r.minIntervalMonths).toBe(PPSV23_REVACC_MIN_MONTHS);
    expect(visible(r)).toContain(words);
  });
});

describe('the paediatric cards say what they compute', () => {
  // An at-risk 8-year-old with PCV13 only: CDC's 6-18y special-situations
  // rows, whose gap is the PCV-to-next-pneumococcal 8 weeks.
  const child = (riskIds) => recommend({
    dob: '2018-05-01', ageMonths: 101, riskIds, today: TODAY,
    pcvDoses: [{ date: '2024-01-01', product: 'PCV13' }],
    ppsv23Doses: [],
  }).recs;

  it('states the 8-week gap from the PCV->PPSV23 constant, not a literal', () => {
    const words = intervalPhrase({ days: PCV_PPSV23_MIN_INTERVAL_DAYS });
    const recs = child(['hiv']);
    const withGap = recs.filter((r) => visible(r).includes(words));
    expect(withGap.length).toBeGreaterThan(0);
    // Whatever the words say, the computed minimum agrees with them.
    for (const r of withGap) {
      if (r.minIntervalDays != null) {
        expect(intervalPhrase({ days: r.minIntervalDays })).toBe(words);
      }
    }
  });

  // WK8 (the catch-up gap) and PCV_PPSV23_MIN_INTERVAL_DAYS (the PCV15->PPSV23
  // gap) both equal 56 today. They are DIFFERENT clinical rules keyed to
  // different CDC sentences, so this asserts the engine's own number per card
  // rather than assuming the two stay equal — the same reason CLAUDE.md
  // forbids collapsing the three schedule constants.
  it('every stated gap matches that card own computed minimum', () => {
    for (const riskIds of [['hiv'], ['csf_leak'], ['diabetes'], ['chronic_heart']]) {
      for (const r of child(riskIds)) {
        if (r.minIntervalDays != null) {
          expect(visible(r)).toContain(intervalPhrase({ days: r.minIntervalDays }));
        }
        if (r.minIntervalMonths != null) {
          expect(visible(r)).toContain(intervalPhrase({ months: r.minIntervalMonths }));
        }
      }
    }
  });

  it('the infant catch-up gap is stated from its own constant', () => {
    const words = intervalPhrase({ days: PCV_MIN_INTERVAL_DAYS_FROM_12M });
    expect(words).toBe('8 weeks');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// The recorded-dose VERDICT text, which is a separate surface from the rec
// cards above and was the one with no prose assertions at all. Both grammar
// regressions this file documents landed here and the suite stayed green.
describe('a recorded-dose verdict says what it was judged against', () => {
  /** A dated PPSV23 given `gapDays` after a dated PCV, for an adult. */
  const graded = ({ pcvProduct, gapDays, riskIds }) => {
    const pcvDate = '2026-01-10';
    const ppsvDate = new Date(Date.UTC(2026, 0, 10) + gapDays * 86400000)
      .toISOString().slice(0, 10);
    const r = recommend({
      dob: '1966-05-01', ageMonths: 725, riskIds, today: TODAY,
      pcvDoses: [{ date: pcvDate, product: pcvProduct }],
      ppsv23Doses: [{ date: ppsvDate, product: 'PPSV23' }],
    });
    return r.perDose.ppsv23[0];
  };

  it('states the floor it applied, from that rule own interval', () => {
    // 60 days after PCV15, chronic-only: short of the year, so the year bites.
    const d = graded({ pcvProduct: 'PCV15', gapDays: 60, riskIds: ['diabetes'] });
    expect(d.status).toBe('invalid');
    const year = intervalPhrase({ months: ADULT_PPSV23_INTERVAL_MONTHS });
    expect(d.reasons.join(' ')).toContain(year);
    expect(d.detail).toContain(year);
  });

  // The clause that broke. "The 8-week minimum interval applies only to..."
  // must use the ADJECTIVE; the noun form reads "the 8 weeks minimum interval".
  it('names the shorter minimum adjectivally, never as a bare plural', () => {
    const d = graded({ pcvProduct: 'PCV15', gapDays: 60, riskIds: ['diabetes'] });
    const adj = intervalPhraseAdj({ days: PCV_PPSV23_MIN_INTERVAL_DAYS });
    const noun = intervalPhrase({ days: PCV_PPSV23_MIN_INTERVAL_DAYS });
    expect(d.detail).toContain(`The ${adj} minimum interval applies`);
    expect(d.detail).not.toContain(`The ${noun} minimum interval`);
  });

  // ⚠️ REWRITTEN BY OWNER RULING F (2026-10-24). This case used to assert
  // "This 5-year gap is enforced..." on the SAME patient — the adjectival
  // form in the 5-year row's floor detail. That row is now a recommendation
  // and prints one sentence with no "gap is enforced" clause, so the old
  // assertion had no subject left. The invariant the file exists for is
  // unchanged and still covered: `intervalPhraseAdj` is asserted by the two
  // cases above, through SHORTER_MINIMUM_ADJ. What is asserted here instead
  // is that the row's new sentence reads the interval from ONE place — the
  // reason this file exists — and uses the NOUN form, which is what "at
  // least 5 years" needs.
  it('states the 5-year gap from one home, in the noun form its sentence needs', () => {
    // An adult with BOTH PCV13 and PPSV23, given a PCV20 inside the 5 years.
    const r = recommend({
      dob: '1956-05-01', ageMonths: 845, riskIds: [], today: TODAY,
      pcvDoses: [
        { date: '2016-01-10', product: 'PCV13' },
        { date: '2024-01-10', product: 'PCV20' },
      ],
      ppsv23Doses: [{ date: '2021-10-11', product: 'PPSV23' }],
    });
    const late = r.perDose.pcv.find((d) => d.intervalRuleId === 'ADULT-PCV20-21-5Y-AFTER-PPSV23');
    expect(late, 'expected a 5-year-gap verdict').toBeDefined();
    expect(late.status).toBe('valid');
    const noun = intervalPhrase({ months: PPSV23_REVACC_MIN_MONTHS });
    expect(late.reasons.join(' ')).toContain(`at least ${noun}`);
    // The old floor sentence must not come back alongside the new one.
    expect(late.detail ?? '').not.toContain('gap is enforced');
  });

  it('gets the article right in front of the shorter minimum', () => {
    // The catch-all recommendation row, which reads "...names an 8-week
    // minimum...". A hardcoded "a"/"an" is the same drift one word to the left.
    const d = graded({ pcvProduct: 'PCV15', gapDays: 90, riskIds: ['hiv'] });
    const article = intervalArticle({ days: PCV_PPSV23_MIN_INTERVAL_DAYS });
    const adj = intervalPhraseAdj({ days: PCV_PPSV23_MIN_INTERVAL_DAYS });
    const text = [d.reasons?.join(' '), d.detail, typeof d.intervalNote === 'string' ? d.intervalNote : ''].join(' ');
    expect(text).toContain(`names ${article} ${adj} minimum`);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// The source half.
function codeOnly(src) {
  const blank = (m) => m.replace(/[^\n]/g, '');
  return src
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/^\s*\/\/.*$/gm, blank)
    .replace(/\s+\/\/.*$/gm, '');
}

const read = (rel) => codeOnly(readFileSync(new URL(rel, import.meta.url), 'utf8'));

// A GAP BETWEEN DOSES, which is what this guard is about — not an AGE, which
// has its own homes (scheduleConstants.js, and S6-1/S6-3 before this).
//
// The two read differently in clinical English and the guard splits them on
// exactly that: an age takes a preposition ("at >=24 months", "before age 6"),
// a gap takes a comparator alone or an after/later/apart marker (">=8 weeks
// apart", "1 year after the PCV13 dose"). Getting this wrong in the loose
// direction is not harmless — the first draft of this guard flagged
// "fewer than 3 PCV doses by 24 months" and "a child 24-71 months", which
// would have pushed age bands through an interval formatter.
//
// "4 days" is out of scope in either reading: that is CDC's grace, a fixed
// property of the rule rather than an interval any constant varies. GRACE_DAYS
// is its home and regression-peds-p1-1-four-day-grace.test.js guards it.
const HAND_TYPED_GAP = new RegExp(
  '(?<!\\b(?:at|age|aged|by|before|until|through)\\s)'
  + '(?:≥|>=|at least|within)\\s*\\d+\\s*(?:week|month|year)s?'
  + '|\\b\\d+\\s*(?:week|month|year)s?\\s+(?:after|later|apart)\\b',
  'gi',
);

/** The lines that carry text to a clinician's screen. */
const VISIBLE_KEY = /^\s*(doseLabel|lead|detail|note|reasons|message)\s*:/;

// ── No exemptions any more (2026-10-16) ──────────────────────────────────
//
// There used to be exactly one. recommend.js's hsctAdvisory() stated the
// post-transplant series entirely in prose — "3-6 months after HSCT", "4
// weeks apart", "at least 6 months after dose 3" — with no constant anywhere
// for those words to drift away from, because the schedule was relative to
// the transplant and the app computed no date for it at all. The exemption
// carried its own reason and a standing instruction: if those rows ever gained
// computed dates, delete the exemption in the same commit.
//
// What happened instead is that the rows themselves were deleted. The
// transplant tick became a hard stop (owner decision 2026-10-16), the function
// is gone, and so every clinician-visible interval in both files now goes
// through intervalPhrase() with nothing excused. Do not re-add an exemption
// list to make a new hand-typed interval pass; add the constant.

describe('no hand-typed interval survives in a clinician-visible string', () => {
  for (const file of ['../recommend.js', '../doseIntervalRules.js']) {
    it(`${file} states every interval through intervalPhrase()`, () => {
      const src = read(file);
      const offenders = [];
      src.split('\n').forEach((line, i) => {
        const ln = i + 1;
        if (!VISIBLE_KEY.test(line)) return;
        // A `${...}` is already derived from something — only bare text counts.
        const bare = line.replace(/\$\{[^}]*\}/g, '@');
        const hits = [...bare.matchAll(HAND_TYPED_GAP)].map((m) => m[0]);
        if (hits.length) offenders.push(`${ln}: ${hits.join(', ')}  |  ${line.trim().slice(0, 110)}`);
      });
      expect(offenders, `hand-typed intervals in ${file}:\n${offenders.join('\n')}`).toEqual([]);
    });
  }

  // The guard above is only worth anything if it has nothing excused. The one
  // exemption it used to carry was for hsctAdvisory(); this is the successor
  // to the "the exemption is still honest" test, asserting that the function
  // the exemption was written for really is gone. If it comes back, the
  // exemption question comes back with it and has to be answered again.
  it('the exempted function is gone, not merely renamed around', () => {
    const src = read('../recommend.js');
    expect(src).not.toMatch(/hsctAdvisory/);
    expect(src).not.toMatch(/function hsct/i);
  });
});
