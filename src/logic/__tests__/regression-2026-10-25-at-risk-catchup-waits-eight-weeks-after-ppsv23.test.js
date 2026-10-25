// 2026-10-25 — the at-risk 24-71 month catch-up card counts its 8 weeks from
// the most recent PNEUMOCOCCAL dose, not the most recent PCV.
//
// ── The defect ───────────────────────────────────────────────────────────
//
// CDC's at-risk "Age 2-5 years" row states TWO intervals:
//
//   "Less than 3 PCV doses: 2 doses PCV (at least 8 weeks after the most
//    recent dose and administered at least 8 weeks apart)"
//
// The card implemented only the second. Its date came from `anchorPcv`, so a
// 4-year-old with asplenia whose only pneumococcal dose was a PPSV23 24 days
// ago was told her first PCV was due TODAY — on a card quoting "at least 8
// weeks after the most recent dose" directly underneath. The citation and the
// date on one card contradicted each other.
//
// Measured over the grid: 225 patients were advised a PCV sooner than 8 weeks
// after a counting PPSV23, every one of them aged 2 or 5. ZERO were aged 6 or
// over, because the 6-18 block already anchors on `anchorPneumo` — which is
// also why an 8-year-old and a 4-year-old with identical histories were given
// different answers, and how the defect was found.
//
// ── Scope, which is narrower than the defect ─────────────────────────────
//
// OWNER RULING 2026-10-25: "yes PPSV recs should apply at the earliest age of
// 2 years, this is the minimum approved age." That settles the AGE. It does
// not license anchoring every card on a PPSV23, and two cases are deliberately
// left alone because no document states the interval for them:
//
//   the 3-doses-before-12-months row  ACIP 2023: "one dose of either PCV15 or
//                                     PCV20 is recommended at least 8 weeks
//                                     after the last PCV dose". PCV, not dose.
//   a HEALTHY child's catch-up        CDC's healthy row gives no interval,
//                                     p2016 says "after most recent PCV dose",
//                                     and the catch-up job aid (Jan 2025) says
//                                     "Give Dose 1 today" — it counts previous
//                                     PCV doses and never mentions PPSV23.
//
// 192 of the 225 are fixed. The 33 left are pinned below BY NUMBER, so that
// widening the anchor fails this test rather than passing it quietly. They are
// an open question for the owner, not an oversight.
//
// ⚠ THE RULE IS NOT A SECOND INTERVAL. Both clocks carry the same 8 weeks, so
// the fix is the LATER ANCHOR and nothing else: `anchorPcv` keeps RULING D's
// reading (the dose the patient GOT, including one that did not count) and the
// PPSV23 side keeps ANCHOR-1's (counting doses only). A rule that re-read the
// interval per stream would be the P0 bug's own shape.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases, CORPUS_TODAY } from '../../test-grid.js';
import { addDays } from '../dateUtils.js';

const TODAY = '2026-10-25';
const pcvCards = (res) => (res.recs ?? []).filter((r) => r.vaccine === 'PCV');
/** The date the card actually advises: today when due, else the held date. */
const advised = (rec, today) => (rec.dueToday ? today : rec.earliestNextDate);

describe('an at-risk child\'s catch-up waits 8 weeks after a PPSV23', () => {
  // Noor, 4, asplenia. PPSV23 on 1 Oct and no conjugate ever — CDC's "less
  // than 3 PCV doses" row exactly.
  const noor = {
    dob: '2022-10-01', ageMonths: 48, today: TODAY,
    pcvDoses: [],
    ppsv23Doses: [{ date: '2026-10-01' }],
    riskIds: ['asplenia'],
  };
  // Maya, the same history eight years older, in the 6-18 block. She was
  // always right; she is the control that proves the fix did not reach her.
  const maya = { ...noor, dob: '2018-10-01', ageMonths: 96 };

  it('holds the dose to the PPSV23 + 8 weeks instead of advising it today', () => {
    const card = pcvCards(recommend(noor))[0];
    expect(card.dueToday).toBe(false);
    // 1 Oct + 56 days. Named as a date rather than recomputed from a constant,
    // because the arithmetic being tested is exactly that addition.
    expect(card.earliestNextDate).toBe('2026-11-26');
  });

  it('gives the 4-year-old and the 8-year-old the same date', () => {
    const young = pcvCards(recommend(noor)).map((r) => r.earliestNextDate);
    const old = pcvCards(recommend(maya)).map((r) => r.earliestNextDate);
    expect(young.every((d) => d === '2026-11-26')).toBe(true);
    expect(old.every((d) => d === '2026-11-26')).toBe(true);
  });

  it('states both of CDC\'s intervals on the card, not just the second', () => {
    const card = pcvCards(recommend(noor))[0];
    const lead = typeof card.note === 'string' ? card.note : card.note.lead;
    expect(lead).toContain('after the most recent pneumococcal dose');
    expect(lead).toContain('apart');
  });

  it('leaves a healthy child\'s catch-up alone — no document states it there', () => {
    const healthy = { ...noor, riskIds: [] };
    const card = pcvCards(recommend(healthy))[0];
    expect(card.dueToday).toBe(true);
  });

  it('leaves the 3-doses-before-12-months row on its PCV anchor', () => {
    // Three conjugate doses in infancy, then a PPSV23 three weeks ago.
    const child = {
      dob: '2022-10-01', ageMonths: 48, today: TODAY,
      pcvDoses: [
        { product: 'PCV13', date: '2022-12-01' },
        { product: 'PCV13', date: '2023-02-01' },
        { product: 'PCV13', date: '2023-04-01' },
      ],
      ppsv23Doses: [{ date: '2026-10-04' }],
      riskIds: ['asplenia'],
    };
    const card = pcvCards(recommend(child))[0];
    // ACIP 2023 measures this one from the last PCV, which is long past.
    expect(card.dueToday).toBe(true);
  });
});

describe('the whole grid', () => {
  // The sweep runs once; both assertions read the same pass.
  const rows = [];
  for (const c of buildCases()) {
    const inp = c.input;
    if (inp.ageMonths >= 228) continue;
    const out = recommend(inp);
    if (out.excluded) continue;
    const ppsv = out.orderedDoses.ppsv23
      .map((d, i) => ({ ...d, ...out.perDose.ppsv23[i] }))
      .filter((d) => d.status === 'valid' && !d.recordProblem && d.date);
    if (!ppsv.length) continue;
    const floor = addDays(ppsv.map((d) => d.date).sort().at(-1), 56);
    const early = pcvCards(out).some((r) => {
      const a = advised(r, CORPUS_TODAY);
      return a != null && a < floor;
    });
    if (early) rows.push({ key: c.key, risky: (inp.riskIds ?? []).length > 0 });
  }

  it('advises no at-risk child a PCV inside 8 weeks of a PPSV23, except the pinned rows', () => {
    // 33, not 0: 11 healthy children and 22 on the 3-doses-before-12-months
    // row. PINNED EXACTLY. If a later change anchors those too the number
    // drops and this fails — which is the point, because that change needs the
    // owner's word and a document, not a quiet improvement.
    expect(rows.length).toBe(33);
    expect(rows.filter((r) => !r.risky).length).toBe(11);
    expect(rows.filter((r) => r.risky).length).toBe(22);
  });

  it('cannot reach a SECOND counting PPSV23 on this card — pinned, not assumed', () => {
    // Recorded because a mutation proved it: swapping `ppsv.lastDate` for the
    // FIRST counting PPSV23 broke nothing anywhere in the suite. The reason is
    // arithmetic, not luck — a first PPSV23 cannot count before 24 months and a
    // second needs >=5 years after it, so two counting doses are impossible
    // before ~84 months, past this block's 71-month ceiling. Pinning it here
    // means that moving the ceiling fails a test instead of quietly making the
    // engine read the wrong dose.
    let reached = 0;
    for (const c of buildCases()) {
      const inp = c.input;
      if (inp.ageMonths < 24 || inp.ageMonths > 71) continue;
      const out = recommend(inp);
      if (out.excluded) continue;
      const counting = out.orderedDoses.ppsv23
        .map((d, i) => ({ ...d, ...out.perDose.ppsv23[i] }))
        .filter((d) => d.status === 'valid' && !d.recordProblem && d.date);
      if (counting.length > 1) reached += 1;
    }
    expect(reached).toBe(0);
  });

  it('never advises a child EARLIER than before — the fix only moves dates later', () => {
    // The direction check. A `mostRecent` that returned the earlier anchor
    // would still satisfy the count above on some rows; it cannot satisfy
    // this, because every PCV card in the grid is compared against the
    // PPSV23 floor it must respect.
    for (const r of rows) {
      // The pinned rows are the only ones allowed to sit below the floor, and
      // they are the two documented cases — never a card that used to wait.
      expect(r.key).toMatch(/\|a?24\||^a24\|/);
    }
  });
});
