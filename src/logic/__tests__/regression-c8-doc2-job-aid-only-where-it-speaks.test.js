// C8, document 2 (2026-10-17) — the CDC Adult Timing Job Aid comes off the
// cards it does not speak for, and stays on the ones it does.
//
// WHAT THE CLINICIAN ASKED. "I also forget why there are multiple source chips
// listed if its only citing one of them." The honest answer was that they were
// never the card's sources at all: `recommend.js` handed every adult card the
// same three default documents, whether or not anything the card said rested
// on them. C7 read all six documents live and sorted every (document,
// statement) pair into one of exactly two outcomes — cite it, or take it off
// that card (OWNER DECISION 2026-10-17, the disposition rule). This file
// applies document 2's share of that, which is the only document whose
// removals the owner has signed off.
//
// ── The two decisions this test holds ──────────────────────────────────────
//
// 1. "Routine pneumococcal vaccination begins at age 50." REMOVE the job aid.
//    *"Yes, remove it."* The job aid never says this in words — it is
//    inferable only from the document's STRUCTURE, that page 1 is headed
//    "Adults >=50" and pages 2-4 all require a risk class. Citing a table of
//    contents as the source of a prose claim is exactly the "right-sounding
//    quote that isn't there" failure. The card keeps `adultRoutine50` (CDC
//    Adult Notes) and `cdcAdultRiskFactorList`, both already cited, so no
//    wording a clinician reads changes.
//
// 2. The two "the series is complete" statements. CITE at 50+, REMOVE at
//    19-49. Page 1's row `PCV15 & PPSV23 OR PCV20 OR PCV21 / at any age`
//    answers (D) "schedule is complete" — but only on page 1, which is the
//    >=50 page. On pages 2-4, the same history for a 19-49 patient answers
//    (E) "Review pneumococcal vaccine recommendations again when your patient
//    turns 50 years old", which is not what those cards say. So the job aid
//    cannot carry that statement for the younger half.
//
//    THE APP'S CLINICAL ANSWER IS NOT WRONG and does not move here. Followed
//    through, a 19-49 patient holding PCV20 lands at 50 in that same page-1
//    row, whose answer is still (D): complete. CDC's "review again at 50"
//    resolves, for this row, to nothing new — and the app already has a
//    separate re-evaluate card for the one 19-49 history where the review does
//    yield something. What was wrong is only WHICH DOCUMENT IS CREDITED TO
//    WHOM. The rejected third option is recorded in the C7 log so it is not
//    re-proposed: rewrite what those 935 cards SAY into CDC's own "review again
//    at 50" wording. It is the most faithful to the source and it rewrites
//    clinical text on 935 cards, which is a different decision from fixing a
//    citation and should not ride inside one.
//
// ── Why this needed a mechanism change, not a deletion ─────────────────────
//
// Decision 2 needs one document present on one half of a statement's cards and
// absent on the other. A card's source list could not vary that way: a single
// `collectRefs(riskIds, [...three defaults], 'adult')` was computed once per
// pathway and spread onto all ten adult cards. So the adult pathway now asks
// per card (`adultRefs()`), which is the structural fix for the root cause
// rather than a patch over it.
//
// The age boundary is `ROUTINE_ADULT_MIN_M` through the engine's existing
// `isOlderAdult`, never a second age test — `CLAUDE.md`, "Never add an age
// test that decides whether a rule may bite". The two tests at the bottom of
// this file are what hold that: 600 months keeps the button, 599 does not.
//
// ── Measured, not assumed (this branch, 17,334 cards) ──────────────────────
//
//   statement                            cards   <50    >=50
//   series includes PCV20/21 → complete   2,610    630   1,980
//   PCV15 + PPSV23 → complete               914    305     609
//   routine begins at age 50                180    180       0
//
// So 2,589 cards keep the job aid button and 1,115 lose it. The C7 log quotes
// 171 for the last row and 16,202 cards overall; both were measured before the
// IC-children fix grew the grid, so the numbers above are re-measured here and
// are the ones that count.
//
// WHY NO EXISTING GUARD CAUGHT ANY OF THIS. Both verdict corpora record a
// card's status, brands and dates and never its citations, so a card's source
// list can be wrong while every verdict stays green — which is precisely how
// this survived to be reported by a clinician instead of by a test.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { ROUTINE_ADULT_MIN_M } from '../scheduleConstants.js';

const TODAY = '2026-10-11';
const JOB_AID = 'CDC Adult Timing Job Aid';

const adult = (ageMonths, { riskIds = [], pcvDoses = [], ppsv23Doses = [] } = {}) =>
  recommend({ ageMonths, dob: null, today: TODAY, riskIds, pcvDoses, ppsv23Doses });

const shorts = (rec) => (rec.citations ?? []).map((c) => c.short);
const hasJobAid = (rec) => shorts(rec).includes(JOB_AID);

// The note's full text, both halves, because a card renders lead and detail.
const noteText = (rec) => (typeof rec.note === 'string'
  ? rec.note
  : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' '));

const findByNote = (result, needle) =>
  (result.recs ?? []).find((r) => noteText(r).includes(needle));

const SAYS = {
  complete20or21: 'A pneumococcal series that includes PCV20 or PCV21 is complete',
  complete15plus: 'PCV15 followed by PPSV23 is a complete pneumococcal series',
  routineAt50: 'Routine pneumococcal vaccination begins at age 50',
};

// 55y and 35y: one side of ROUTINE_ADULT_MIN_M each, both well inside the
// adult rulebook so nothing here depends on the 18/19 boundary.
const OLDER = 660;
const YOUNGER = 420;

describe('decision 1 — the job aid never says "routine begins at 50", so it comes off that card', () => {
  const rec = () => findByNote(adult(YOUNGER), SAYS.routineAt50);

  it('the card still exists and still says it', () => {
    expect(rec()).toBeDefined();
    expect(rec().status).toBe('not-indicated');
  });

  it('the job aid button is gone', () => {
    expect(hasJobAid(rec())).toBe(false);
  });

  it('the two documents that DO state it are still there', () => {
    // The claim's real homes: the Adult Notes sentence the card already
    // quotes, and the risk-factor list for the second half of the sentence.
    const urls = (rec().citations ?? []).map((c) => c.url);
    expect(urls.some((u) => u.includes('adult-notes.html'))).toBe(true);
    expect(shorts(rec())).toContain('ACIP 2025 Adult MMWR');
  });
});

describe('decision 2 — "the series is complete" keeps the job aid only at 50+', () => {
  const withPcv20 = (ageMonths) => findByNote(
    adult(ageMonths, { riskIds: ['diabetes'], pcvDoses: [{ date: '2024-03-01', product: 'PCV20' }] }),
    SAYS.complete20or21,
  );
  const withPcv15AndPpsv = (ageMonths) => findByNote(
    adult(ageMonths, {
      riskIds: ['diabetes'],
      pcvDoses: [{ date: '2022-03-01', product: 'PCV15' }],
      ppsv23Doses: [{ date: '2024-03-01' }],
    }),
    SAYS.complete15plus,
  );

  it('a series including PCV20 keeps it at 50+ (page 1 answers (D) there)', () => {
    expect(withPcv20(OLDER)).toBeDefined();
    expect(hasJobAid(withPcv20(OLDER))).toBe(true);
  });

  it('…and loses it at 19-49, where the same row answers (E) instead', () => {
    expect(withPcv20(YOUNGER)).toBeDefined();
    expect(hasJobAid(withPcv20(YOUNGER))).toBe(false);
  });

  it('PCV15 + PPSV23 keeps it at 50+', () => {
    expect(withPcv15AndPpsv(OLDER)).toBeDefined();
    expect(hasJobAid(withPcv15AndPpsv(OLDER))).toBe(true);
  });

  it('…and loses it at 19-49', () => {
    expect(withPcv15AndPpsv(YOUNGER)).toBeDefined();
    expect(hasJobAid(withPcv15AndPpsv(YOUNGER))).toBe(false);
  });

  // "The advice" means the WORDS A CLINICIAN READS, so the comparison strips
  // the `[c]` markers (C8, document 2's CITEs, 2026-10-17). A marker is not a
  // word: it renders as a superscript number, and the whole point of decision
  // 2 is that the 50+ card credits the job aid while the 19-49 card does not —
  // which necessarily means one more number at 50+. Comparing the raw strings
  // asserted something stronger than the decision, and stronger than is true.
  //
  // What must not move is the clinical sentence, and that is still pinned
  // exactly: byte-for-byte identical at both ages once the markers are gone.
  const advice = (rec) => noteText(rec).replace(/ ?\[c\]/g, '');

  it('the advice itself is untouched on both sides — only the credit moved', () => {
    for (const age of [OLDER, YOUNGER]) {
      expect(withPcv20(age).status).toBe('complete');
      expect(withPcv15AndPpsv(age).status).toBe('complete');
    }
    // The same sentence, word for word, at both ages.
    expect(advice(withPcv20(YOUNGER))).toBe(advice(withPcv20(OLDER)));
    expect(advice(withPcv15AndPpsv(YOUNGER))).toBe(advice(withPcv15AndPpsv(OLDER)));

    // And the credit DID move, in the one direction decision 2 chose: the 50+
    // card points a number at the job aid, the 19-49 card neither lists it nor
    // cites it. Asserted here so "the advice is unchanged" can never be
    // satisfied by the credit having failed to change either.
    const citesJobAid = (rec) => (rec.noteCites ?? [])
      .some((c) => c.key === 'jobAidSeriesCompleteAt50');
    expect(citesJobAid(withPcv20(OLDER))).toBe(true);
    expect(citesJobAid(withPcv20(YOUNGER))).toBe(false);
    expect(citesJobAid(withPcv15AndPpsv(OLDER))).toBe(true);
    expect(citesJobAid(withPcv15AndPpsv(YOUNGER))).toBe(false);
  });

  it('the boundary is ROUTINE_ADULT_MIN_M itself, not a number typed again', () => {
    expect(hasJobAid(withPcv20(ROUTINE_ADULT_MIN_M))).toBe(true);
    expect(hasJobAid(withPcv20(ROUTINE_ADULT_MIN_M - 1))).toBe(false);
  });
});

describe('the control — every other adult card keeps all three defaults', () => {
  it('a 19-49 card the owner did not decide about is unchanged', () => {
    // An adult 19-49 with a risk condition and no history: statement #14 in
    // the C7 log, a CITE, so nothing about it moves.
    const rec = (adult(YOUNGER, { riskIds: ['diabetes'] }).recs ?? [])[0];
    expect(rec).toBeDefined();
    expect(hasJobAid(rec)).toBe(true);
  });

  it('a 50+ card with no history keeps all three', () => {
    const rec = (adult(OLDER).recs ?? [])[0];
    expect(shorts(rec)).toContain(JOB_AID);
    expect(shorts(rec)).toContain('ACIP 2025 Adult MMWR');
  });
});

describe('swept over every patient the grid can build', () => {
  // One pass, every adult card, so this cannot be true of a fixture and false
  // of the app. Counts are pinned: if a clinical change moves which patients
  // reach these three statements, this fails and asks why rather than
  // quietly re-baselining.
  const tally = {};
  for (const key of Object.keys(SAYS)) {
    tally[key] = { total: 0, under50: 0, ge50: 0, jobAidUnder50: 0, jobAidGe50: 0 };
  }
  let adultCards = 0;
  let jobAidElsewhere = 0;

  for (const c of buildCases()) {
    let result;
    try {
      result = recommend(c.input);
    } catch {
      continue;
    }
    if (result.excluded) continue;
    const am = result.meta?.ageMonths ?? -1;
    const older = am >= ROUTINE_ADULT_MIN_M;
    for (const rec of result.recs ?? []) {
      const text = noteText(rec);
      let matched = false;
      for (const [key, needle] of Object.entries(SAYS)) {
        if (!text.includes(needle)) continue;
        matched = true;
        const t = tally[key];
        t.total += 1;
        if (older) {
          t.ge50 += 1;
          if (hasJobAid(rec)) t.jobAidGe50 += 1;
        } else {
          t.under50 += 1;
          if (hasJobAid(rec)) t.jobAidUnder50 += 1;
        }
      }
      if (hasJobAid(rec)) {
        adultCards += 1;
        if (!matched) jobAidElsewhere += 1;
      }
    }
  }

  it('the grid really reaches all three statements (anti-vacuity)', () => {
    // 2026-10-24, RULING F: the 363 patients whose early PCV20 now counts
    // read "Complete (history includes PCV20)" instead of a dose-due card.
    // All 363 are at 50+. They split by the mm7401a1 row their OLD card
    // used: 253 from the flat ">=5 years after the last pneumococcal dose"
    // row, and 110 from the shared-clinical-decision row at >=65, which
    // already carried a job-aid button. Measured with scripts/proseDiff.mjs
    // over both grids; see CLINICAL_SPEC.md section K, Ruling F.
    // +363: every one of them lands on this very card.
      // 2026-10-25: her adult table removed every adult floor, so patients
      // whose early adult dose was rejected now read a different card, and the
      // buttons move with the card. +33 is the measured net movement on this
      // count. The invariant beside it — zero uncredited — is unchanged, and
      // `scripts/uncreditedSources.mjs` reports no new (source, statement) pair.
      expect(tally.complete20or21.total).toBe(2610 + 363 + 33);
    expect(tally.complete15plus.total).toBe(914 + 188);  // +183 at 50+, +5 under 50
    expect(tally.routineAt50.total).toBe(180);
  });

  it('the 2,589 cards at 50+ keep the job aid', () => {
    // +363 on both lines, and they must stay equal: all 363 are at 50+,
    // and a complete-by-PCV20 card at 50+ must CARRY the job aid, not
    // merely be counted at 50+.
      // 2026-10-25: her adult table removed every adult floor, so patients
      // whose early adult dose was rejected now read a different card, and the
      // buttons move with the card. +33 is the measured net movement on this
      // count. The invariant beside it — zero uncredited — is unchanged, and
      // `scripts/uncreditedSources.mjs` reports no new (source, statement) pair.
      expect(tally.complete20or21.ge50).toBe(1980 + 363 + 33);
    expect(tally.complete15plus.ge50).toBe(609 + 183);  // 2026-10-25
      // 2026-10-25: her adult table removed every adult floor, so patients
      // whose early adult dose was rejected now read a different card, and the
      // buttons move with the card. +33 is the measured net movement on this
      // count. The invariant beside it — zero uncredited — is unchanged, and
      // `scripts/uncreditedSources.mjs` reports no new (source, statement) pair.
      expect(tally.complete20or21.jobAidGe50).toBe(1980 + 363 + 33);
    expect(tally.complete15plus.jobAidGe50).toBe(609 + 183);  // 2026-10-25
  });

  it('the 1,115 cards it does not speak for have lost it', () => {
    expect(tally.complete20or21.under50).toBe(630);
      // 2026-10-25: her adult table removed every adult floor, so patients
      // whose early adult dose was rejected now read a different card, and the
      // buttons move with the card. +5 is the measured net movement on this
      // count. The invariant beside it — zero uncredited — is unchanged, and
      // `scripts/uncreditedSources.mjs` reports no new (source, statement) pair.
      expect(tally.complete15plus.under50).toBe(305 + 5);
    expect(tally.routineAt50.under50).toBe(180);
    expect(tally.complete20or21.jobAidUnder50).toBe(0);
    expect(tally.complete15plus.jobAidUnder50).toBe(0);
    expect(tally.routineAt50.jobAidUnder50).toBe(0);
    expect(tally.routineAt50.jobAidGe50).toBe(0);
  });

  it('no other adult card lost its job aid button as a side effect', () => {
    // 7,920 cards carried it before this change; 1,115 were decided away, so
    // 6,805 remained and 2,589 of those are the two statements above.
    // 2026-10-18: a further 3,189 came off — the three statements the job aid
    // prints only as table CELLS, replaced by mm7401a1's sentences (owner:
    // *"use MMWR table"*). 6,805 - 3,189 = 3,616.
    // 2026-10-24, RULING F: + 253. The rise is 253 and not 363 because
    // this sweep counts a document once per CARD, and 110 of the 363 were
    // shared-decision cards that already carried a job-aid button.
      // 2026-10-25: her adult table removed every adult floor, so patients
      // whose early adult dose was rejected now read a different card, and the
      // buttons move with the card. +213 is the measured net movement on this
      // count. The invariant beside it — zero uncredited — is unchanged, and
      // `scripts/uncreditedSources.mjs` reports no new (source, statement) pair.
      expect(adultCards).toBe(6805 - 3189 + 253 + 213);
    // 'Elsewhere' is every job-aid card that is NOT one of the two matched
    // statements, so Ruling F moves it twice: the total rose by 253, and
    // the MATCHED group rose by 363 — the 110 shared-decision cards that
    // already carried the button have moved INTO it. 3,869 - 2,952 = 917.
    // 2026-10-25: the total rose by 213 and the MATCHED group by 33 + 183,
    // so "elsewhere" falls by 3. Both legs are written out rather than
    // netted, because the two movements have different causes.
    expect(jobAidElsewhere).toBe((6805 - 3189 + 253 + 213) - (2589 + 363 + 33 + 183));
  });
});
