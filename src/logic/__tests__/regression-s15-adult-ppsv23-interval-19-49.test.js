// S15 (2026-10-16) — the adult PCV15 → PPSV23 recommendation is keyed on risk
// class AT 19–49 ONLY. Adults 50+ keep the year, with 8 weeks named as an option.
//
// ── OWNER DECISION 2026-10-16 ────────────────────────────────────────────
// Taken after the owner rejected the premise of
// `plan-2026-10-15-adult-interval-risk-class-audit.md`, which was built on
// ACIP **rr7203a1 (2023)**. She supplied two newer sources and instructed that
// they govern: CDC's **Pneumococcal Vaccine Timing for Adults** job aid
// (NCIRD, **March 2025**) and **mm7401a1** (ACIP, **January 2025**,
// https://pmc.ncbi.nlm.nih.gov/articles/PMC11709131/). Both read live
// 2026-10-16. rr7203a1 is superseded; do not cite it for an adult interval.
//
// mm7401a1's clinical guidance table, quoted verbatim from the live page —
// note that the VERB differs by age band, and that difference IS the rule:
//
//   Adults aged >=50 years / None or PCV7 only at any age:
//     "A single dose of PCV21, PCV20, or PCV15. If PCV15 is administered, a
//      single dose of PPSV23 should be administered >=1 year after the PCV15
//      dose. A minimum interval of 8 weeks CAN BE CONSIDERED if PCV15 is used
//      in adults with an immunocompromising condition, cochlear implant, or
//      CSF leak."
//
//   Adults aged 19-49 years with an immunocompromising condition, a CSF leak,
//   or a cochlear implant / None or PCV7 only at any age:
//     "A single dose of PCV21, PCV20, or PCV15. If PCV15 is used, ADMINISTER a
//      single dose of PPSV23 >=8 weeks after the PCV15 dose."
//
//   Adults aged 19-49 years with chronic medical conditions /
//   None or PCV7 only at any age:
//     "A single dose of PCV21, PCV20, or PCV15. If PCV15 is administered, a
//      single dose of PPSV23 should be administered >=1 year after the PCV15
//      dose."
//
// The job aid renders the same split: >=8 weeks printed inline on p.2 (19-49
// immunocompromising) and p.3 (19-49 cochlear implant / CSF leak); >=1 year on
// p.4 (19-49 chronic) and on p.1 (>=50), where p.1 carries the 8 weeks only as
// footnote dagger, "Consider minimum interval (8 weeks) for adults with an
// immunocompromising condition, cochlear implant, or cerebrospinal fluid leak
// (CSF) leak".
//
// The owner was shown both readings — follow ACIP's wording (8 weeks at 19-49
// only) versus flatten to 8 weeks for the risk class at every adult age — with
// the count of affected patients for each, and chose to follow the wording.
// **Do not extend the 8 weeks to 50+ without a new owner decision**: ACIP
// prints it as an option there, so the app would be ahead of its own citation.
//
// ── What this does NOT change ───────────────────────────────────────────
// The VALIDITY FLOORS (S14-7, owner determination 2026-10-11) are untouched.
// Recommendation and floor stay different questions. A floor already keys on
// risk class at every adult age and already permits the 8 weeks; the owner
// confirmed on 2026-10-16 that the floors behave as she intends and that an
// invalidly-early dose must be re-anchored to the last VALID dose — both were
// measured as already correct before this change.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import {
  ADULT_PPSV23_INTERVAL_MONTHS,
  ADULT_PPSV23_SHORTER_MINIMUM_WEEKS,
} from '../../data/riskFactors.js';
import { ROUTINE_ADULT_MIN_M } from '../scheduleConstants.js';

const noteLead = (r) => (typeof r.note === 'string' ? r.note : (r.note?.lead ?? ''));

const TODAY = '2026-10-16';
const PCV15_ON = '2026-10-16';

// Derived from the constants, never typed as literals — the S6 rule.
const SHORT_DAYS = ADULT_PPSV23_SHORTER_MINIMUM_WEEKS * 7;
const SHORT_PHRASE = new RegExp(`${ADULT_PPSV23_SHORTER_MINIMUM_WEEKS} weeks`);
const YEAR_PHRASE = new RegExp(`${ADULT_PPSV23_INTERVAL_MONTHS / 12} year`);

/** mm7401a1's three blocks, as the app's risk ids. */
const SHORTER_AT_19_49 = ['hiv', 'asplenia', 'cochlear_implant', 'csf_leak'];
const CHRONIC = ['diabetes', 'chronic_heart', 'smoking'];

const YOUNG = 360; // 30y — inside 19-49
const OLDER = 660; // 55y — inside >=50

function afterPcv15(ageMonths, riskIds) {
  const r = recommend({
    ageMonths, riskIds, today: TODAY,
    pcvDoses: [{ date: PCV15_ON, product: 'PCV15' }],
    ppsv23Doses: [],
  });
  return r.recs.find((x) => x.vaccine === 'PPSV23');
}

function naive(ageMonths, riskIds) {
  return recommend({
    ageMonths, riskIds, today: TODAY, pcvDoses: [], ppsv23Doses: [],
  }).recs[0];
}

describe('S15 — 19-49 with IC / cochlear implant / CSF leak is told >=8 weeks', () => {
  for (const risk of SHORTER_AT_19_49) {
    it(`30y + ${risk}: the number, the unit and the date all say 8 weeks`, () => {
      const r = afterPcv15(YOUNG, [risk]);
      expect(r).toBeDefined();
      expect(r.minIntervalDays).toBe(SHORT_DAYS);
      expect(r.minIntervalMonths).toBe(null);
      expect(r.doseLabel).toMatch(SHORT_PHRASE);
      expect(r.doseLabel).not.toMatch(YEAR_PHRASE);
      // 2026-10-16 + 56 days.
      expect(r.earliestNextDate).toBe('2026-12-11');
    });
  }

  it('the "may be considered" sentence is dropped — 8 weeks IS the advice here', () => {
    const r = afterPcv15(YOUNG, ['hiv']);
    expect(noteLead(r)).toMatch(SHORT_PHRASE);
    expect(noteLead(r)).not.toMatch(/may be considered/i);
  });
});

describe('S15 — 19-49 with a chronic condition only keeps the year', () => {
  for (const risk of CHRONIC) {
    it(`30y + ${risk} is told >=1 year, and is offered no shorter option`, () => {
      const r = afterPcv15(YOUNG, [risk]);
      expect(r.minIntervalMonths).toBe(ADULT_PPSV23_INTERVAL_MONTHS);
      expect(r.minIntervalDays).toBe(null);
      expect(r.doseLabel).toMatch(YEAR_PHRASE);
      expect(noteLead(r)).not.toMatch(SHORT_PHRASE);
    });
  }
});

describe('S15 — CONTROL: adults 50+ must not move, in either direction', () => {
  for (const risk of [...SHORTER_AT_19_49, ...CHRONIC]) {
    it(`55y + ${risk} is still told >=1 year`, () => {
      const r = afterPcv15(OLDER, [risk]);
      expect(r.minIntervalMonths).toBe(ADULT_PPSV23_INTERVAL_MONTHS);
      expect(r.minIntervalDays).toBe(null);
      expect(r.doseLabel).toMatch(YEAR_PHRASE);
      expect(r.earliestNextDate).toBe('2027-10-16');
    });
  }

  it('55y + IC/cochlear/CSF is still OFFERED the 8 weeks, as mm7401a1 does', () => {
    for (const risk of SHORTER_AT_19_49) {
      const lead = noteLead(afterPcv15(OLDER, [risk]));
      expect(lead).toMatch(SHORT_PHRASE);
      expect(lead).toMatch(/may be considered/i);
    }
  });

  it('55y + a chronic condition is offered nothing shorter', () => {
    for (const risk of CHRONIC) {
      expect(noteLead(afterPcv15(OLDER, [risk]))).not.toMatch(SHORT_PHRASE);
    }
  });

  // Mutation M7 was caught by NOTHING: deleting the option sentence from the
  // >=50 no-history card left all 987 tests green. Every other >=50 surface
  // named the 8 weeks, so an IC adult saw the option only AFTER the PCV15 was
  // recorded — the point at which it is least useful, since the choice of
  // when to book the PPSV23 is made when the PCV15 is given.
  // mm7401a1 names it in that very row: "A minimum interval of 8 weeks can be
  // considered if PCV15 is used in adults with an immunocompromising
  // condition, cochlear implant, or CSF leak."
  it('the 8-week option is named BEFORE the PCV15 is given, not only after', () => {
    for (const risk of SHORTER_AT_19_49) {
      const lead = noteLead(naive(OLDER, [risk]));
      expect(lead).toMatch(SHORT_PHRASE);
      expect(lead).toMatch(/may be considered/i);
    }
  });

  it('...and is still not named for a chronic condition at that same step', () => {
    for (const risk of CHRONIC) {
      expect(noteLead(naive(OLDER, [risk]))).not.toMatch(SHORT_PHRASE);
    }
  });
});

describe('S15 — the quote beside the card states the card\'s own number', () => {
  // Found by driving the running app, not by the suite: after the interval
  // moved, a 30-year-old with HIV read "PPSV23 (>=8 weeks after PCV15)" above
  // a citation quoting "administer 1 dose PPSV23 at least 1 year after the
  // PCV15 dose". A clinician checking the source would have been shown a
  // sentence contradicting the advice. Nothing failed, because no test
  // compared the two.
  const quotesOf = (r) => (r.noteCites ?? []).map((c) => c.label ?? '').join(' ⧫ ');

  it('19-49 + IC/cochlear/CSF is cited to a sentence that says 8 weeks', () => {
    for (const risk of SHORTER_AT_19_49) {
      const q = quotesOf(afterPcv15(YOUNG, [risk]));
      expect(q).toMatch(SHORT_PHRASE);
      expect(q).not.toMatch(/at least 1 year after the PCV15/);
    }
  });

  it('50+ is cited to the sentence that says the year', () => {
    for (const risk of SHORTER_AT_19_49) {
      expect(quotesOf(afterPcv15(OLDER, [risk]))).toMatch(/1 year after the PCV15/);
    }
  });

  // ── NARROWED 2026-10-17 (C8 document 1), and here is exactly why ────────
  //
  // This test used to assert mm7401a1 on EVERY adult card, using the
  // PCV15-only fixture below. C7 read mm7401a1 live and found that card's
  // claim -- the PCV15 -> PPSV23 interval -- is not in the paper at all; the
  // CDC Adult Timing Job Aid's `PCV15 only` row prints it, confirmed cell by
  // cell against the job aid itself. The owner approved removing mm7401a1
  // from that card and five others on 2026-10-17 (*"Approve all six
  // removals."*), so "every adult card" is no longer the rule and this
  // assertion had to move with it.
  //
  // IT IS NARROWED TO THE RULE IT ALWAYS MEANT, NOT RELAXED TO GO GREEN.
  // What S15 was built to prevent is named in its own comment: before S15 a
  // 19-49 card linked rr7203a1 (2023) and NOT mm7401a1, so the newest ACIP
  // recommendation was absent from exactly the age band whose rule it had
  // changed. That hazard is "the superseded paper is there and the current one
  // is not" -- and it is now asserted directly, in both directions, instead of
  // through the proxy "mm7401a1 is on everything".
  //
  // CHECKED BEFORE NARROWING, because a removal could have recreated the exact
  // state S15 exists to stop: measured over the whole grid, rr7203a1 reaches
  // **0 of 17,334 cards both before and after document 1**, and the PCV15-only
  // card at 19-49 is left holding the Adult Notes and the job aid -- the
  // document that actually prints its interval. So nothing regressed.
  //
  // ALSO FOUND, and corrected here: the old comment claimed rr7203a1 "is still
  // reachable here, pulled in by individual risk conditions (asplenia,
  // immunosuppression) that cite it as the source for the adult risk-factor
  // LIST". That is no longer true of any card -- the measurement above is 0
  // before document 1, not merely after it. The open question it recorded for
  // the owner ("whether to re-source those entries") is therefore already
  // answered: no card cites it. `refs.js` still holds the entry.
  it('no adult card links rr7203a1 — the superseded 2023 paper', () => {
    for (const ageMonths of [YOUNG, OLDER]) {
      for (const risk of [...SHORTER_AT_19_49, ...CHRONIC]) {
        const out = recommend({
          ageMonths, riskIds: [risk], today: TODAY,
          pcvDoses: [{ date: PCV15_ON, product: 'PCV15' }], ppsv23Doses: [],
        });
        const urls = (out.recs[0].citations ?? []).map((x) => x.url ?? '').join(' ');
        expect(urls).not.toMatch(/rr7203a1/);
      }
    }
  });

  it('mm7401a1 IS linked on the cards whose claim it states, at both age bands', () => {
    // The >=50 expansion and the PCV13-experienced rule are what the paper
    // says, so these are the cards it belongs on -- document 1 kept it here.
    // A no-history card and a PCV13-only card, at 19-49 and at 50+: if a
    // future change took mm7401a1 off the adult pathway altogether, this
    // fails, which is the other half of the hazard.
    for (const ageMonths of [YOUNG, OLDER]) {
      for (const risk of [...SHORTER_AT_19_49, ...CHRONIC]) {
        for (const pcvDoses of [[], [{ date: PCV15_ON, product: 'PCV13' }]]) {
          const out = recommend({
            ageMonths, riskIds: [risk], today: TODAY, pcvDoses, ppsv23Doses: [],
          });
          const urls = (out.recs[0].citations ?? []).map((x) => x.url ?? '').join(' ');
          expect(urls, `age ${ageMonths}, ${risk}, ${pcvDoses.length} dose(s)`).toMatch(/mm7401a1/);
        }
      }
    }
  });
});

describe('S15 — the boundary is ROUTINE_ADULT_MIN_M, not a second copy of 50', () => {
  it('one month below the boundary gets 8 weeks; the boundary itself gets the year', () => {
    const below = afterPcv15(ROUTINE_ADULT_MIN_M - 1, ['hiv']);
    expect(below.minIntervalDays).toBe(SHORT_DAYS);

    const at = afterPcv15(ROUTINE_ADULT_MIN_M, ['hiv']);
    expect(at.minIntervalMonths).toBe(ADULT_PPSV23_INTERVAL_MONTHS);
  });
});

describe('S15 — A-P1-1\'s original bug must not come back', () => {
  // The app must state the SAME interval before and after the PCV15 is
  // recorded. The pre-A-P1-1 code said ">=1 year" while naive and ">=8 weeks"
  // once the dose was entered; that self-contradiction is what A-P1-1 fixed,
  // and keying the interval again is exactly how it could return.
  for (const ageMonths of [YOUNG, OLDER]) {
    for (const risk of [...SHORTER_AT_19_49, ...CHRONIC]) {
      it(`${ageMonths === YOUNG ? '30y' : '55y'} + ${risk}: same words either side of the dose`, () => {
        const before = noteLead(naive(ageMonths, [risk]));
        const after = afterPcv15(ageMonths, [risk]).doseLabel;
        const saysShort = (s) => SHORT_PHRASE.test(s) && !/may be considered/i.test(
          s.replace(new RegExp(`.*?${ADULT_PPSV23_SHORTER_MINIMUM_WEEKS} weeks`), ''),
        );
        // Whichever interval governs, BOTH surfaces must name it.
        const governs = after.match(SHORT_PHRASE) ? SHORT_PHRASE : YEAR_PHRASE;
        expect(before).toMatch(governs);
        expect(after).toMatch(governs);
        expect(saysShort(after)).toBe(governs === SHORT_PHRASE);
      });
    }
  }
});

describe('S15 — CONTROL: the rows mm7401a1 keys at >=1 year for EVERY class', () => {
  // Job aid, all four pages, and mm7401a1's three blocks: "PPSV23 only" and
  // "PCV13 only" are >=1 year regardless of risk class or age. A change that
  // moves either of these has over-reached.
  for (const ageMonths of [YOUNG, OLDER]) {
    for (const risk of [...SHORTER_AT_19_49, ...CHRONIC]) {
      it(`${ageMonths === YOUNG ? '30y' : '55y'} + ${risk}: PPSV23 only -> PCV at >=1 year`, () => {
        const r = recommend({
          ageMonths, riskIds: [risk], today: TODAY,
          pcvDoses: [], ppsv23Doses: [{ date: '2024-10-16', product: 'PPSV23' }],
        }).recs[0];
        expect(r.minIntervalMonths).toBe(ADULT_PPSV23_INTERVAL_MONTHS);
        expect(r.doseLabel).toMatch(YEAR_PHRASE);
      });

      it(`${ageMonths === YOUNG ? '30y' : '55y'} + ${risk}: PCV13 only -> PCV20/21 at >=1 year, no PPSV23 route`, () => {
        const r = recommend({
          ageMonths, riskIds: [risk], today: TODAY,
          pcvDoses: [{ date: '2023-10-16', product: 'PCV13' }], ppsv23Doses: [],
        }).recs[0];
        expect(r.minIntervalMonths).toBe(ADULT_PPSV23_INTERVAL_MONTHS);
        expect(r.doseLabel).toMatch(/PCV20 or PCV21/);
        // "NO OPTION B" on every job-aid page: there is no PPSV23-after-PCV13
        // route in current guidance. The 2023-sourced plan claimed otherwise.
        expect(r.doseLabel).not.toMatch(/PPSV23/);
      });
    }
  }
});

describe('S15 — CONTROL: PCV13 + PPSV23 at 19-49 splits by class, and already did', () => {
  // mm7401a1, 19-49 IC/CSF/cochlear, "PCV13 and 1 dose of PPSV23": "A single
  // dose of PCV21 or PCV20 >=5 years after the last pneumococcal vaccine dose."
  // 19-49 chronic, same history: "reviewed again when the person reaches age
  // 50 years." Both groups get PCV20/21 — NOT a second PPSV23. The plan's
  // claim that IC alone earns a second PPSV23 came from rr7203a1 and is stale.
  const history = {
    pcvDoses: [{ date: '2015-10-16', product: 'PCV13' }],
    ppsv23Doses: [{ date: '2016-10-16', product: 'PPSV23' }],
  };

  for (const risk of SHORTER_AT_19_49) {
    it(`30y + ${risk} gets PCV20/21 at >=5 years, not a second PPSV23`, () => {
      const r = recommend({ ageMonths: YOUNG, riskIds: [risk], today: TODAY, ...history }).recs[0];
      expect(r.minIntervalMonths).toBe(60);
      expect(r.doseLabel).toMatch(/PCV20 or PCV21/);
      expect(r.doseLabel).not.toMatch(/review at age 50/i);
    });
  }

  for (const risk of CHRONIC) {
    it(`30y + ${risk} gets "review at age 50"`, () => {
      const r = recommend({ ageMonths: YOUNG, riskIds: [risk], today: TODAY, ...history }).recs[0];
      expect(r.doseLabel).toMatch(/review at age 50/i);
    });
  }
});
