// C8, document 1 (2026-10-17) — mm7401a1 comes off the 5,331 cards it does
// not speak for, and keeps the 2,544 it does.
//
// OWNER DECISION 2026-10-17: *"Approve all six removals."* Brought to her as
// one batch with every statement's live quote and re-measured card count, per
// the disposition rule — a removal is a clinical act and goes to the owner per
// document.
//
// ── WHAT mm7401a1 ACTUALLY IS ─────────────────────────────────────────────
//
// `MMWR ≥50 expansion` is ACIP's January 2025 paper, and its whole subject is
// one thing: routine adult pneumococcal vaccination moving from 65 to 50. It
// also carries the PCV13-experienced incomplete-series rule. That is the
// extent of it. It was reaching 7,875 adult cards as an uncredited grey button
// because `collectRefs()` handed it to every adult card as a pathway default.
//
// ── THE SIX REMOVALS, EACH FOR A STATED REASON ────────────────────────────
//
//   cards  the card says                              why mm7401a1 is not it
//   2,610  "a series that includes PCV20 or PCV21      the CDC Adult Notes'
//           is complete"                              sentence, and that
//                                                      button is already on
//                                                      the card and cited
//     914  "PCV15 followed by PPSV23 is a complete     same
//           pneumococcal series"
//   1,154  "≥1 year after the PPSV23 dose"            the interval is the
//     138  "PPSV23 ≥1 year after the PCV15 dose"       Timing Job Aid's; its
//      75   …the same, plus the 8-week option          `PPSV23 only` and
//                                                      `PCV15 only` rows
//                                                      print these numbers
//     440  "≥5 years … is a shared clinical            the paper never
//           decision"                                  discusses that path
//
// Each of the five interval rows was held "pending document 2" when document 1
// was first read, precisely because "that number belongs to the Timing Job
// Aid" is a claim about another document and could not be assumed. Document 2
// was then read live and its own table cells confirm all five (its quote (I)).
//
// ── WHAT IT KEEPS — 2,544 cards, and this is the control ──────────────────
//
// The ≥50 expansion rows (its subject) and the PCV13-experienced rule: the two
// PCV13 cards (1,512 + 523), "re-evaluate at age 50" (210), "routine begins at
// age 50" (180), the two ≥50-routine cards (54 + 45) and the 19-49 risk card
// (20). 5,331 + 2,544 = 7,875, every one of the document's 13 statements
// accounted for — which is the arithmetic that says this is the whole document
// and not a sample of it.
//
// NOTE ON THE TWO PCV13 CARDS, so a later session does not "finish" them by
// mistake. mm7401a1 stays there for the "PCV20 or PCV21, and NOT PPSV23" half
// only. The ≥1 year and ≥5 years in those same sentences are NOT in this paper
// — they are the job aid's. Do not let one quote cover both halves; that is a
// document 2 CITE, still unwritten.
//
// ── MEASURED (combined tree: C2/C3 + C8 document 2 + this) ────────────────
//
// mm7401a1 as an uncredited button: 7,875 cards → 2,544. Every count in this
// file was re-measured with `npx vite-node scripts/uncreditedSources.mjs`
// rather than read out of the C7 log, which predates the IC-children fix.
//
// NO ADVICE MOVES. Not one word of any card's text changes, and both verdict
// corpora are untouched — which is also why neither could ever have caught
// this: they record status, brands and dates, never which document a card
// credits.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { ROUTINE_ADULT_MIN_M } from '../scheduleConstants.js';

const TODAY = '2026-10-11';
const MMWR = 'MMWR ≥50 expansion';
const JOB_AID = 'CDC Adult Timing Job Aid';
const ADULT_NOTES = 'CDC Adult Notes';

const adult = (ageMonths, { riskIds = [], pcvDoses = [], ppsv23Doses = [] } = {}) =>
  recommend({ ageMonths, dob: null, today: TODAY, riskIds, pcvDoses, ppsv23Doses });

const shorts = (rec) => (rec.citations ?? []).map((c) => c.short);
const noteText = (rec) => (typeof rec.note === 'string'
  ? rec.note
  : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' '));
const findByNote = (result, needle) =>
  (result.recs ?? []).find((r) => noteText(r).includes(needle));

// The six statements losing it, and the seven keeping it.
// ⚠ CORRECTED 2026-10-18 (FINDING F). This file was written as "the six
// statements mm7401a1 does not state", and TWO of the six were not in that
// class at all: the reading the removals rested on had recorded only three
// sentences, all narrative, and had never read the document's clinical
// guidance TABLE. The table has a row whose HEADING is each of those two
// patients' exact history. They move to KEEPS below; the owner approved the
// restoration on 2026-10-18 after seeing both patients and both rows. The
// four that remain here are still correct — the table really does not say a
// series containing PCV20/PCV21 is complete, nor that PCV15 then PPSV23
// completes one, and its PCV15 sentence is printed inside the "None or PCV7
// only" row (owner: *"use job aid since PCV15 isn't listed in the MMWR
// table"*).
const LOSES = {
  complete20or21: 'A pneumococcal series that includes PCV20 or PCV21 is complete',
  complete15plus: 'PCV15 followed by PPSV23 is a complete pneumococcal series',
  ppsvAfterPcv15: 'the series is INCOMPLETE until then',
};
const KEEPS = {
  pcv13AndPpsv: 'PCV13 and PPSV23 already given',
  pcv13Only: 'PCV13 was given previously',
  reEvaluateAt50: 'No additional pneumococcal dose now — re-evaluate at age 50',
  routineAt50: 'Routine pneumococcal vaccination begins at age 50',
  noHistory: 'A PCV7-only history counts as no PCV history',
  // Restored 2026-10-18 — see the note above.
  afterPpsvOnly: 'after the PPSV23 dose',
  sharedDecision: 'is a shared clinical decision',
};

const OLDER = 660;     // 55y
const YOUNGER = 420;   // 35y

describe('the four statements mm7401a1 does not state have lost it, and the two it does are back', () => {
  const pcv20 = (am) => findByNote(
    adult(am, { riskIds: ['diabetes'], pcvDoses: [{ date: '2024-03-01', product: 'PCV20' }] }),
    LOSES.complete20or21,
  );
  const pcv15AndPpsv = (am) => findByNote(
    adult(am, {
      riskIds: ['diabetes'],
      pcvDoses: [{ date: '2022-03-01', product: 'PCV15' }],
      ppsv23Doses: [{ date: '2024-03-01' }],
    }),
    LOSES.complete15plus,
  );
  const ppsvOnly = (am) => findByNote(
    adult(am, { riskIds: ['diabetes'], ppsv23Doses: [{ date: '2020-03-01' }] }),
    KEEPS.afterPpsvOnly,
  );
  const pcv15NoPpsv = (am) => findByNote(
    adult(am, { riskIds: ['diabetes'], pcvDoses: [{ date: '2024-03-01', product: 'PCV15' }] }),
    LOSES.ppsvAfterPcv15,
  );
  const shared = () => findByNote(
    adult(840, {   // 70y, so the PPSV23 below was given at >=65
      riskIds: ['diabetes'],
      pcvDoses: [{ date: '2014-03-01', product: 'PCV13' }],
      ppsv23Doses: [{ date: '2023-03-01' }],   // age ~66 at that dose
    }),
    KEEPS.sharedDecision,
  );

  it('"series includes PCV20 or PCV21 is complete" — at both ages', () => {
    for (const am of [OLDER, YOUNGER]) {
      expect(pcv20(am), `no card at ${am}`).toBeDefined();
      expect(shorts(pcv20(am))).not.toContain(MMWR);
    }
  });

  it('"PCV15 followed by PPSV23 is complete" — at both ages', () => {
    for (const am of [OLDER, YOUNGER]) {
      expect(pcv15AndPpsv(am)).toBeDefined();
      expect(shorts(pcv15AndPpsv(am))).not.toContain(MMWR);
    }
  });

  // REVERSED 2026-10-18. Was `not.toContain(MMWR)`. mm7401a1's table carries a
  // row headed "PPSV23 only" in all three adult blocks, word for word the
  // same, giving both the products and the ≥1 year. The paper does print it.
  it('the ≥1 year after PPSV23 interval — the paper DOES print it, in its table', () => {
    for (const am of [OLDER, YOUNGER]) {
      expect(ppsvOnly(am)).toBeDefined();
      expect(shorts(ppsvOnly(am))).toContain(MMWR);
      expect(shorts(ppsvOnly(am))).toContain(JOB_AID);
    }
  });

  it('the PPSV23-after-PCV15 interval, both the plain and the 8-week variants', () => {
    for (const am of [OLDER, YOUNGER]) {
      expect(pcv15NoPpsv(am)).toBeDefined();
      expect(shorts(pcv15NoPpsv(am))).not.toContain(MMWR);
    }
    // The 8-week sentence only appears for IC / cochlear / CSF at 19-49 (S15),
    // so it is a different statement row in the measurement and is checked
    // on its own rather than assumed to follow.
    const ic = findByNote(
      adult(YOUNGER, { riskIds: ['hiv'], pcvDoses: [{ date: '2024-03-01', product: 'PCV15' }] }),
      LOSES.ppsvAfterPcv15,
    );
    expect(ic).toBeDefined();
    expect(shorts(ic)).not.toContain(MMWR);
  });

  // REVERSED 2026-10-18. Was `not.toContain(MMWR)`, under the title "the
  // shared-decision path this paper never discusses". The paper gives it a
  // table row: "PCV13 at any age and PPSV23 at age ≥65 years".
  it('the shared-decision path — this paper gives it a row of its own', () => {
    expect(shared()).toBeDefined();
    expect(shared().status).toBe('shared-decision');
    expect(shorts(shared())).toContain(MMWR);
  });

  it('what remains on them is a document that does state the claim', () => {
    // The two "complete" cards keep the Adult Notes, whose sentence is the
    // one they quote. A card must never be left with no source at all.
    for (const am of [OLDER, YOUNGER]) {
      expect(shorts(pcv20(am))).toContain(ADULT_NOTES);
      expect(shorts(pcv15AndPpsv(am))).toContain(ADULT_NOTES);
      expect((pcv20(am).citations ?? []).length).toBeGreaterThan(0);
      expect((pcv15AndPpsv(am).citations ?? []).length).toBeGreaterThan(0);
    }
  });
});

describe('the seven statements it does state have kept it — the control', () => {
  it('both PCV13 rows keep it, for the "PCV20/PCV21, not PPSV23" half', () => {
    const bothGiven = findByNote(
      adult(OLDER, {
        riskIds: ['diabetes'],
        pcvDoses: [{ date: '2014-03-01', product: 'PCV13' }],
        ppsv23Doses: [{ date: '2016-03-01' }],
      }),
      KEEPS.pcv13AndPpsv,
    );
    const pcv13Only = findByNote(
      adult(OLDER, { riskIds: ['diabetes'], pcvDoses: [{ date: '2014-03-01', product: 'PCV13' }] }),
      KEEPS.pcv13Only,
    );
    expect(bothGiven).toBeDefined();
    expect(pcv13Only).toBeDefined();
    expect(shorts(bothGiven)).toContain(MMWR);
    expect(shorts(pcv13Only)).toContain(MMWR);
  });

  it('"routine begins at age 50" keeps it — its own subject', () => {
    const rec = findByNote(adult(YOUNGER), KEEPS.routineAt50);
    expect(rec).toBeDefined();
    expect(shorts(rec)).toContain(MMWR);
    // And document 2 still holds: the job aid is off this card.
    expect(shorts(rec)).not.toContain(JOB_AID);
  });

  it('"re-evaluate at age 50" keeps it', () => {
    const rec = findByNote(
      adult(YOUNGER, {
        riskIds: ['diabetes'],
        pcvDoses: [{ date: '2014-03-01', product: 'PCV13' }],
        ppsv23Doses: [{ date: '2016-03-01' }],
      }),
      KEEPS.reEvaluateAt50,
    );
    expect(rec).toBeDefined();
    expect(shorts(rec)).toContain(MMWR);
  });

  it('the no-history cards keep it at both ages', () => {
    for (const am of [OLDER, YOUNGER]) {
      const rec = findByNote(adult(am, { riskIds: ['diabetes'] }), KEEPS.noHistory);
      expect(rec, `no card at ${am}`).toBeDefined();
      expect(shorts(rec)).toContain(MMWR);
    }
  });
});

describe('swept over every patient the grid can build', () => {
  // Counts pinned so that a clinical change which moves these populations
  // fails and asks why, instead of re-baselining in silence.
  let mmwrCards = 0;
  let jobAidCards = 0;
  const onLosers = {};
  for (const k of Object.keys(LOSES)) onLosers[k] = { cards: 0, withMmwr: 0 };
  const onKeepers = {};
  for (const k of Object.keys(KEEPS)) onKeepers[k] = { cards: 0, withMmwr: 0 };
  let cardsWithNoSourceAtAll = 0;

  for (const c of buildCases()) {
    let result;
    try {
      result = recommend(c.input);
    } catch {
      continue;
    }
    if (result.excluded) continue;
    const am = result.meta?.ageMonths ?? -1;
    for (const rec of result.recs ?? []) {
      const list = shorts(rec);
      const hasMmwr = list.includes(MMWR);
      if (hasMmwr) mmwrCards += 1;
      if (list.includes(JOB_AID)) jobAidCards += 1;
      // Adult cards must never end up sourceless. Child cards have their own
      // defaults, so this is scoped to the adult rulebook by age.
      if (am >= 228 && list.length === 0) cardsWithNoSourceAtAll += 1;
      const text = noteText(rec);
      for (const [k, needle] of Object.entries(LOSES)) {
        if (!text.includes(needle)) continue;
        onLosers[k].cards += 1;
        if (hasMmwr) onLosers[k].withMmwr += 1;
      }
      for (const [k, needle] of Object.entries(KEEPS)) {
        if (!text.includes(needle)) continue;
        onKeepers[k].cards += 1;
        if (hasMmwr) onKeepers[k].withMmwr += 1;
      }
    }
  }

  it('the grid reaches every statement on both lists (anti-vacuity)', () => {
    for (const [k, v] of Object.entries(onLosers)) {
      expect(v.cards, `${k} never appeared`).toBeGreaterThan(0);
    }
    for (const [k, v] of Object.entries(onKeepers)) {
      expect(v.cards, `${k} never appeared`).toBeGreaterThan(0);
    }
  });

  it('not one of the four statements it does not state still carries mm7401a1', () => {
    for (const [k, v] of Object.entries(onLosers)) {
      expect(v.withMmwr, `${k} still carries it on ${v.withMmwr} cards`).toBe(0);
    }
  });

  it('every one of the seven it does state still carries it', () => {
    for (const [k, v] of Object.entries(onKeepers)) {
      expect(v.withMmwr, `${k} lost it`).toBe(v.cards);
    }
  });

  it('mm7401a1 is a button on 4,158 cards — 2,564 after the removals, plus the 1,594 restored', () => {
    // Two different numbers, both true, and they are easy to confuse:
    //   7,920 -> 2,564  every mm7401a1 BUTTON on a card (what this sweep counts)
    //   7,875 -> 2,544  only the ones no raised number points at (what
    //                   `scripts/uncreditedSources.mjs` reports)
    // The 20-card gap is where a number does point at it. Both measured on
    // the combined tree (C2/C3 + C8 documents 2 and 1) with
    // `scripts/citationMapping.mjs`, which also reports "cards citing a
    // document with NO button" still **0** — no removal orphaned a citation.
    // 2026-10-18: + 1,154 (PPSV23 only) + 440 (shared decision) = 4,158.
    expect(mmwrCards).toBe(2564 + 1154 + 440);
  });

  it("document 2's result is unchanged by this — the job aid is still on 6,805", () => {
    expect(jobAidCards).toBe(6805);
  });

  it('no adult card was left with no source at all', () => {
    expect(cardsWithNoSourceAtAll).toBe(0);
  });

  it('the age boundary is still only ROUTINE_ADULT_MIN_M', () => {
    // Document 1's removals carry no age term at all — the paper either
    // states a claim or it does not. Only document 2's split is age-keyed.
    expect(ROUTINE_ADULT_MIN_M).toBe(600);
  });
});
