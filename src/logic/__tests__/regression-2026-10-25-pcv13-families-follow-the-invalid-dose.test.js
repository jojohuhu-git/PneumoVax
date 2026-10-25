// OWNER DECISIONS 2026-10-25 — THE TWO PCV13 FAMILIES JOIN THE INVALID-DOSE
// CARD, AND THE DATE IS THE LATER OF HER TWO CLOCKS, EXPLAINED AND CITED.
//
// ── Decision 2: the PCV13/PCV15 split had no clinical basis ──────────────
//
// She was shown two 60-year-olds identical but for one product:
//
//   Patient A   PCV13 2026-07-19, PPSV23 2026-10-11 (3 months, floor 1 year)
//   Patient B   PCV15 2026-07-19, PPSV23 2026-10-11 (the same, already ruled)
//
// B's screen had agreed with itself since 2026-10-24. A's card said
// 2027-07-19 while A's own dose chip said 2027-10-11 — nearly three months
// apart, with nothing on the card saying her PPSV23 had been set aside. Of the
// 402 patients in that family, 200 were being shown two different dates.
// Her ruling: *"yes A is treated the same as B."*
//
// ── Decision 4: the same for the 8-week class, and WHICH clock ───────────
//
// `ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM`, 210 patients — immunocompromised
// / cochlear implant / CSF leak, where the PPSV23 floor is 8 weeks rather than
// a year. She said yes, and asked back: *"to confirm is the recommendation
// PCV20/21 may be given at least 1 year after the last PCV?"*
//
// That names ONE of the two clocks, and the earlier one. Shown a 40-year-old
// with asplenia (PCV13 2026-08-30, PPSV23 2026-10-11) scored three ways —
//
//   2027-08-30   1 year after the last PCV (the PCV13)
//   2027-10-11   1 year after the PPSV23 that did not count
//   2027-10-11   the LATER of the two  <- what patient B already does
//
// — she answered: *"i am thinking it is third row. i want the rationale to be
// explained and cited when its recommended."*
//
// Both intervals must be satisfied, so the conjugate waits for whichever runs
// out last. The explanation she asked for is the sentence the card already
// carried for patient B, which is why extending `CARD_FOLLOWS_INVALID_DOSE` is
// the whole behavioural change.
//
// ── AND THE CITATION DEFECT THE WIDENING CAUSED ──────────────────────────
//
// Extending the card took **mm7401a1 off 212 cards it speaks for** (3,795 ->
// 3,583 on the three C8 guards) — FINDING F's mirror, on this one card, for
// the third time. With the PPSV23 set aside the patient's COUNTING history is
// a PCV13 and nothing else, which is mm7401a1's "PCV13 only" row: "A single
// dose of PCV21 or PCV20 >=1 year after the PCV13 dose." It is cited for the
// DISPOSITION and never for the DATE, in its own sentence, because the card's
// date is later than the row's — that gap is her ruling, not the document's.
//
// docs/archive/decision-2026-10-25-pcv13-families-and-the-later-clock.md
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';

const TODAY = '2026-10-24';
const Y = (y) => y * 12;
const run = (p) => recommend({ today: TODAY, ...p });
const invalidOf = (o) => [...o.perDose.pcv, ...o.perDose.ppsv23].filter((d) => d.status === 'invalid');
const leadOf = (r) => (typeof r.note === 'string' ? r.note : r.note?.lead ?? '');
const detailOf = (r) => (typeof r.note === 'string' ? '' : r.note?.detail ?? '');

// Her two worked patients, verbatim from the conversation.
const PATIENT_A = {
  ageMonths: Y(60), riskIds: [],
  pcvDoses: [{ product: 'PCV13', date: '2026-07-19' }],
  ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
};
const PATIENT_B = {
  ageMonths: Y(60), riskIds: [],
  pcvDoses: [{ product: 'PCV15', date: '2026-07-19' }],
  ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
};
const PATIENT_D4 = {
  ageMonths: Y(40), riskIds: ['asplenia'],
  pcvDoses: [{ product: 'PCV13', date: '2026-08-30' }],
  ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
};

describe('decision 2 — A is treated the same as B', () => {
  it('the two patients differ only in the product, and now get the same answer', () => {
    const a = run(PATIENT_A);
    const b = run(PATIENT_B);
    expect(invalidOf(a)[0].intervalRuleId).toBe('ADULT-PPSV23-AFTER-PCV13');
    expect(invalidOf(b)[0].intervalRuleId).toBe('ADULT-PPSV23-AFTER-PCV15');
    // One date, on both surfaces, for both patients.
    for (const out of [a, b]) {
      expect(invalidOf(out)[0].repeatDueDate).toBe('2027-10-11');
      expect(out.recs[0].earliestNextDate).toBe('2027-10-11');
      expect(out.recs[0].doseLabel).toContain('after the PPSV23 dose of Oct 11, 2026');
      expect(leadOf(out.recs[0])).toContain('was given too soon to count');
    }
    // The card A used to show — one year after the PCV13 — is gone from both
    // the header and the date. This is the assertion that fails if the
    // widening is reverted.
    expect(a.recs[0].earliestNextDate).not.toBe('2027-07-19');
    expect(a.recs[0].doseLabel).not.toContain('after PCV13 —');
  });

  it('the control is untouched: a PPSV23 given a year after the PCV13 still counts', () => {
    // Same patient, PCV13 moved back so the gap clears a year. Nothing here
    // should see the repeat card at all.
    const out = run({
      ...PATIENT_A,
      pcvDoses: [{ product: 'PCV13', date: '2025-07-19' }],
    });
    expect(invalidOf(out)).toHaveLength(0);
    expect(leadOf(out.recs[0]) + detailOf(out.recs[0])).not.toContain('was given too soon to count');
    expect(out.recs[0].earliestNextDate).toBe('2031-10-11');
  });
});

describe('decision 4 — the 8-week class, and the LATER of her two clocks', () => {
  it('her asplenic 40-year-old gets the third row, not the first', () => {
    const out = run(PATIENT_D4);
    expect(invalidOf(out)[0].intervalRuleId).toBe('ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM');
    // THE WHOLE POINT OF THE QUESTION SHE ASKED. 2027-08-30 is one year after
    // the last PCV and is what "at least 1 year after the last PCV" would
    // give; she chose the later date instead.
    expect(out.recs[0].earliestNextDate).toBe('2027-10-11');
    expect(out.recs[0].earliestNextDate).not.toBe('2027-08-30');
    expect(invalidOf(out)[0].repeatDueDate).toBe('2027-10-11');
  });

  it('and her 8-week floor itself is untouched — only the repeat moved', () => {
    // Ruling C's limit, restated: what the app ACCEPTS does not move when what
    // it ADVISES does. 42 days is still short of 56, and the date this dose
    // would have been valid on is still measured from the PCV13.
    const out = run(PATIENT_D4);
    expect(invalidOf(out)[0].earliestValidDate).toBe('2026-10-21');
    // the control: nine weeks clears the floor and nothing is rejected
    const ok = run({
      ...PATIENT_D4,
      pcvDoses: [{ product: 'PCV13', date: '2026-06-30' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-09-01' }],
    });
    expect(invalidOf(ok)).toHaveLength(0);
  });
});

describe('the rationale is explained and cited, as she required', () => {
  it('the card states the interval ACIP gives, and says where the later date comes from', () => {
    for (const p of [PATIENT_A, PATIENT_D4]) {
      const card = run(p).recs[0];
      const text = leadOf(card) + detailOf(card);
      // ACIP's own interval, named as ACIP's
      expect(text).toContain('ACIP states this interval itself');
      expect(text).toContain('at least 1 year after the last PPSV23');
      expect(text).toContain('with no 8-week option');
      // and why it is counted from the dose that did not count
      expect(text).toContain('a repeat is spaced from the invalid dose');
    }
  });

  it("mm7401a1's PCV13-only row is cited, for the disposition and NOT for the date", () => {
    const card = run(PATIENT_A).recs[0];
    const text = detailOf(card);
    expect(text).toContain('With only the PCV13 counting');
    expect(text).toContain('at least 1 year after that PCV13');
    // the sentence must say the card's date is the LATER one, or the row would
    // read as stating 2027-07-19 while the card shows 2027-10-11
    expect(text).toContain('the later date above is the further spacing');
    // the document is on the card, with a number pointing at it
    const keys = (card.noteCites ?? []).map((c) => c.key ?? c);
    expect(keys).toContain('mmwrPcv13OnlyThenPcv');
  });

  it('the 19-49 immunocompromising block gets ACIP\'s one-word-different wording', () => {
    // mm7401a1 prints the "PCV13 only" row twice, one word apart. The picker
    // is the existing `mmwrPcv13OnlyCite`, so this asserts the reuse, not a
    // second risk-class test.
    const keys = (run(PATIENT_D4).recs[0].noteCites ?? []).map((c) => c.key ?? c);
    expect(keys).toContain('mmwrPcv13OnlyThenPcv1949Ic');
    expect(keys).not.toContain('mmwrPcv13OnlyThenPcv');
  });

  it('the job aid stays off these cards — it says nothing about a repeat', () => {
    const refs = (run(PATIENT_A).recs[0].refs ?? []).map((r) => r.key ?? r.id ?? r);
    expect(JSON.stringify(refs)).not.toContain('cdcAdultTimingJobAid');
  });
});

describe('the widening stops where she stopped it', () => {
  it('the IC adult with PCV13 and two PPSV23 doses keeps her review-at-50 card', () => {
    // The casualty of the first, too-broad draft on 2026-10-24. Her last dose
    // is a second PPSV23 given too soon — `ADULT-PPSV23-AFTER-PPSV23`, which
    // is NOT in the set — so she must still reason from her richer history.
    const out = run({
      ageMonths: Y(40), riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV13', date: '2016-10-13' }],
      ppsv23Doses: [
        { product: 'PPSV23', date: '2017-10-13' },
        { product: 'PPSV23', date: '2020-10-13' },
      ],
    });
    const card = out.recs[0];
    expect(leadOf(card) + detailOf(card)).not.toContain('was given too soon to count');
    expect(card.doseLabel).not.toContain('after the PPSV23 dose of');
  });

  it('swept: every rule now reaching this card is one of the five she approved', () => {
    const ALLOWED = new Set([
      // 'ADULT-PCV-AFTER-PPSV23' sat here until later the same day. The owner
      // made it a recommendation ("count like the child"), so it rejects
      // nothing and reaches no card; leaving it in the set would let a
      // regression that re-rejects those 132 doses pass unnoticed.
      'ADULT-PPSV23-AFTER-PCV15',
      'ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM',
      'ADULT-PPSV23-AFTER-PCV13',
      'ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM',
    ]);
    const byRule = {};
    for (const c of buildCases()) {
      let out; try { out = recommend(c.input); } catch { continue; }
      const card = out.recs?.[0];
      if (!card || !String(card.doseLabel ?? '').includes('completes the series')) continue;
      if (!String(leadOf(card)).includes('was given too soon to count')) continue;
      const bad = invalidOf(out);
      const id = bad[bad.length - 1]?.intervalRuleId;
      expect(ALLOWED.has(id)).toBe(true);
      byRule[id] = (byRule[id] ?? 0) + 1;
    }
    // PINNED PER FAMILY, not just in total, so a change that moves patients
    // BETWEEN families cannot hide inside a correct-looking sum. Measured
    // 2026-10-25; the two new rows are the +212.
    expect(byRule).toEqual({
      'ADULT-PPSV23-AFTER-PCV15': 41,
      'ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM': 15,
      'ADULT-PPSV23-AFTER-PCV13': 182,
      'ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM': 30,
    });
  });

  it('mm7401a1 is carried by every PCV13 card and by no family that lacks its row', () => {
    // The mirror of FINDING F, asserted in BOTH directions on this one card:
    // present where the "PCV13 only" row fits, absent where it does not.
    let withRow = 0; let withoutRow = 0;
    for (const c of buildCases()) {
      let out; try { out = recommend(c.input); } catch { continue; }
      const card = out.recs?.[0];
      if (!card || !String(leadOf(card)).includes('was given too soon to count')) continue;
      const cites = JSON.stringify((card.noteCites ?? []).map((x) => x.key ?? x));
      const fits = detailOf(card).includes('With only the PCV13 counting');
      if (fits) { withRow++; expect(cites).toContain('mmwrPcv13Only'); } else { withoutRow++; expect(cites).not.toContain('mmwrPcv13Only'); }
    }
    expect(withRow).toBe(212);
    // 188 until ADULT-PCV-AFTER-PPSV23 became a recommendation later on
    // 2026-10-25, taking its 132 cards out of this card family altogether.
    // They did not lose a citation — they stopped being this card.
    expect(withoutRow).toBe(56);
  });
});
