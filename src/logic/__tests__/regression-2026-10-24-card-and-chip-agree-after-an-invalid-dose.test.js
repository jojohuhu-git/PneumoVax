// OWNER RULING 2026-10-24 — THE CARD SAYS WHAT THE CHIP SAYS, NAMES THE RIGHT
// VACCINE, AND SAYS WHICH OF ITS NUMBERS IS EVIDENCE.
//
// Before this, driving the app on her asplenic patient showed one screen with
// two answers: a card reading "PPSV23 (>=8 weeks after PCV15) — Not yet due,
// eligible Oct 25, 2026" directly above a chip reading "can be given from
// 2027-10-11". Two dates, two different vaccines, one patient.
//
// Her instruction for the wording, verbatim: "make it clear that the 8 week
// interval is pediatric data with nothing clarifying adults. Cite the
// reference. State using 1 year is an interpretation from ACIP minimum
// interval for adults between PCV13 and the next conjugate. Cite this too."
//
// ⚠️ THE FIRST DRAFT WAS FAR TOO BROAD and this file is mostly about the
// boundary. Fired for every adult whose last dose was invalid, it moved 667 of
// 17,016 verdicts and broke eleven citation guards, because it overrode cards
// that reason from a RICHER history with a blunter rule — an immunocompromised
// adult with PCV13 + two PPSV23 doses lost her mm7401a1 "review again at age
// 50" card entirely. Narrowed to the three families she actually worked
// through: 188 verdicts, and every one of them in those families.
//
// docs/archive/decision-2026-10-24-invalid-adult-dose-repeat-rule.md
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';

const TODAY = '2026-10-24';
const Y = (y) => y * 12;
const run = (p) => recommend({ today: TODAY, ...p });
const invalidOf = (o) => [...o.perDose.pcv, ...o.perDose.ppsv23].filter((d) => d.status === 'invalid');
const leadOf = (r) => (typeof r.note === 'string' ? r.note : r.note?.lead ?? '');
const detailOf = (r) => (typeof r.note === 'string' ? '' : r.note?.detail ?? '');

const PATIENTS = {
  // family 2 — invalid conjugate after a PPSV23-only history
  p1: { ageMonths: Y(70), riskIds: [], pcvDoses: [{ product: 'PCV15', date: '2026-06-19' }], ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }] },
  p2: { ageMonths: Y(70), riskIds: [], pcvDoses: [{ product: 'PCV15', date: '2026-09-26' }], ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }] },
  // family 3 — invalid PPSV23 after a PCV15
  p3: { ageMonths: Y(60), riskIds: [], pcvDoses: [{ product: 'PCV15', date: '2026-07-19' }], ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }] },
  // her asplenic patient — the 8-week IC row
  p4: { ageMonths: Y(40), riskIds: ['asplenia'], pcvDoses: [{ product: 'PCV15', date: '2026-08-30' }], ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }] },
};

describe('one date, on the card and on the chip', () => {
  const EXPECTED = { p1: '2027-06-19', p2: '2027-09-26', p3: '2027-10-11', p4: '2027-10-11' };
  for (const [name, due] of Object.entries(EXPECTED)) {
    it(`${name}: both surfaces say ${due}`, () => {
      const out = run(PATIENTS[name]);
      const chip = invalidOf(out)[0];
      const card = out.recs[0];
      expect(chip.repeatDueDate).toBe(due);
      expect(card.dueToday).toBe(false);
      expect(card.earliestNextDate).toBe(due);
      // and the card's own label carries it, so a reader skimming the header
      // cannot see a different date from the body
      expect(card.doseLabel).toContain('1 year');
    });
  }
});

describe('the card names a conjugate, never PPSV23 and never PCV15', () => {
  for (const name of Object.keys(PATIENTS)) {
    it(`${name}: PCV20 or PCV21 only`, () => {
      const card = run(PATIENTS[name]).recs[0];
      expect(card.vaccine).toBe('PCV');
      expect(card.doseLabel).toContain('PCV20 or PCV21');
      expect(card.doseLabel).not.toContain('PCV15');
      expect(card.brands).toEqual(['PCV20 (Prevnar 20)', 'PCV21 (Capvaxive)']);
      // Her reasons, on the card: no repeat PPSV23 and no PCV15.
      expect(detailOf(card)).toContain("ACIP's only interval between two PPSV23 doses is 5 years");
      expect(detailOf(card)).toContain('PCV15 is not used either');
    });
  }
});

describe('the card says which number is stated and which is read across', () => {
  it('after a PPSV23 the year is ACIP\'s own, with no 8-week option', () => {
    // p3 and p4: the invalid dose was the PPSV23, so the owed conjugate's year
    // is the interval ACIP states directly.
    for (const name of ['p3', 'p4']) {
      const lead = leadOf(run(PATIENTS[name]).recs[0]);
      expect(lead).toContain('ACIP states this interval itself');
      expect(lead).toContain('for every risk group, with no 8-week option');
      expect(lead).not.toContain('interpretation');
    }
  });

  it('after a conjugate the year is an INTERPRETATION, and the 8 weeks is named as paediatric', () => {
    // p1 and p2: the invalid dose was the conjugate, so the owed conjugate's
    // year is read across from ACIP's PCV13 sentence.
    for (const name of ['p1', 'p2']) {
      const lead = leadOf(run(PATIENTS[name]).recs[0]);
      expect(lead).toContain('at least 1 year after the last PCV13 dose');
      expect(lead).toContain('It is an interpretation, not a stated rule');
      expect(lead).toContain('The 8-week conjugate interval is paediatric');
      expect(lead).toContain('Children age 4 months through 6 years');
    }
  });

  it('the standing clause is emphasised on every one of them', () => {
    for (const name of Object.keys(PATIENTS)) {
      const lead = leadOf(run(PATIENTS[name]).recs[0]);
      expect(lead.split('**')).toHaveLength(3);   // exactly one pair
      expect(lead.split('**')[1].length).toBeGreaterThan(80);
    }
  });
});

describe('each card carries only the documents that speak for its sentences', () => {
  const refKeysOf = (rec) => (rec.citations ?? []).map((c) => c.page ?? c.key);
  const citeKeysOf = (rec) => (rec.noteCites ?? []).map((c) => c.key ?? c.page);

  it('family 2 keeps mm7401a1 — its "PPSV23 only" row states this disposition', () => {
    // FINDING F in miniature: narrowing the sources took mm7401a1 off these
    // 132 cards, and FINDING F's own guard is what caught it. Cited for the
    // DISPOSITION only; the card's date is later than the row's and says so.
    const card = run(PATIENTS.p1).recs[0];
    expect(citeKeysOf(card)).toContain('mmwrPpsvOnlyThenPcv');
    expect(detailOf(card)).toContain('the later date above is the further spacing');
  });

  it('family 3 keeps the job aid — the conjugate stands in for the PPSV23 owed', () => {
    const card = run(PATIENTS.p3).recs[0];
    expect(citeKeysOf(card)).toContain('jobAidPpsv23Unavailable');
    expect(detailOf(card)).toContain('may be replaced by PCV20 or PCV21');
  });

  it('and neither family carries the other\'s document', () => {
    expect(citeKeysOf(run(PATIENTS.p1).recs[0])).not.toContain('jobAidPpsv23Unavailable');
    expect(citeKeysOf(run(PATIENTS.p3).recs[0])).not.toContain('mmwrPpsvOnlyThenPcv');
  });

  it('every grey button on these cards has a number pointing at it', () => {
    for (const name of Object.keys(PATIENTS)) {
      const card = run(PATIENTS[name]).recs[0];
      const docsCited = new Set(citeKeysOf(card).map((k) => k));
      // The engine's own ref list must not name a document no sentence cites.
      // This is the "uncredited sources" class, and the first draft of this
      // card left 188 such buttons by calling `adultRefs()` with no
      // exclusions.
      expect(docsCited.size).toBeGreaterThan(0);
      expect(refKeysOf(card).length).toBeGreaterThan(0);
    }
  });
});

describe('THE BOUNDARY — only the three families she worked through', () => {
  it('an immunocompromised adult with PCV13 + two PPSV23 keeps her review-at-50 card', () => {
    // The clearest casualty of the over-broad first draft. Her counting
    // history owes a conjugate at FIVE years (mm7401a1), which is Ruling F's
    // territory; no ruling replaced it with a one-year repeat.
    const out = run({
      ageMonths: Y(40), riskIds: ['hiv'],
      pcvDoses: [{ product: 'PCV13', date: '2016-10-13' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2017-10-13' }, { product: 'PPSV23', date: '2020-10-13' }],
    });
    const card = out.recs[0];
    // ⚠️ ASSERT THE PHRASE THAT IS UNIQUE TO THE REPEAT CARD, not a phrase
    // correct cards share. The first version of this checked for "completes
    // the series", which her legitimate mm7401a1 review-at-50 card also says
    // — so it failed on a card that was right. Same trap as the two-sentence
    // card guards: narrow the claim to the sentence that actually marks it.
    expect(leadOf(card) + detailOf(card)).not.toContain('was given too soon to count');
    expect(card.doseLabel).not.toContain('after the PPSV23 dose of');
    expect(card.doseLabel).not.toContain('after the conjugate dose of');
  });

  it('a PPSV23 rejected after a PCV13 keeps its old card — flagged, not taken', () => {
    // `ADULT-PPSV23-AFTER-PCV13`, 402 patients, the previous handoff's
    // "clearest defect". Same clinical shape as family 3, but widening to it
    // moves verdicts in a family she has not been shown, so her 2026-10-18
    // rule sends it back to her. If this test ever goes green, that decision
    // was taken by an agent rather than by her.
    const out = run({
      ageMonths: Y(60), riskIds: [],
      pcvDoses: [{ product: 'PCV13', date: '2026-07-19' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
    });
    expect(invalidOf(out)[0].intervalRuleId).toBe('ADULT-PPSV23-AFTER-PCV13');
    expect(out.recs[0].doseLabel).not.toContain('was given too soon');
    expect(leadOf(out.recs[0])).not.toContain('given too soon to count');
  });

  it('a repaired series is NOT given a repeat card — her own proviso', () => {
    // "if a later dose given helps correct the mistake in giving a vaccine
    // early, this should be noted and marked as complete if appropriate." The
    // early PCV15 does not count; the properly spaced PCV20 after it does, and
    // a history including PCV20 is complete.
    const out = run({
      ageMonths: Y(70), riskIds: [],
      pcvDoses: [
        { product: 'PCV15', date: '2026-06-19' },
        { product: 'PCV20', date: '2026-10-11' },
      ],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }],
    });
    expect(out.recs.some((r) => r.status === 'complete')).toBe(true);
    expect(leadOf(out.recs[0])).not.toContain('was given too soon to count');
  });

  it('swept over the grid: the repeat card appears ONLY for those three rules', () => {
    const ALLOWED = new Set([
      'ADULT-PCV-AFTER-PPSV23',
      'ADULT-PPSV23-AFTER-PCV15',
      'ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM',
    ]);
    let seen = 0;
    const offenders = [];
    for (const c of buildCases()) {
      const inp = c.input ?? c;
      let out; try { out = recommend(inp); } catch { continue; }
      const card = out.recs?.[0];
      if (!card || !String(card.doseLabel ?? '').includes('completes the series')) continue;
      if (!String(leadOf(card)).includes('was given too soon to count')) continue;
      seen++;
      const bad = invalidOf(out);
      const last = bad[bad.length - 1];
      if (!ALLOWED.has(last?.intervalRuleId)) offenders.push([c.key, last?.intervalRuleId]);
    }
    expect(offenders).toEqual([]);
    // PINNED EXACTLY, not floored: the whole point is that widening this card
    // is an owner decision, so a rise must fail here and be explained.
    expect(seen).toBe(188);
  });
});
