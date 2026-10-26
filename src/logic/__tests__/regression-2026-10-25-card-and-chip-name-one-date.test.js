// 2026-10-25 — the recommendation card and the dose chip name ONE date for one
// dose, after a conjugate is set aside because of a PPSV23.
//
// ── THE DEFECT, AND WHAT CREATED IT ──────────────────────────────────────
//
// Making `CHILD-PCV-AFTER-PPSV23` a floor (her ruling *"Repeat — her table
// wins"*) produced the FIRST case in this app where a dose is thrown out by a
// CROSS-STREAM rule — a conjugate rejected because of a PPSV23. The rec card
// did not follow RULING D there, and said so on screen:
//
//   Maya, 8, asplenia — PPSV23 1 Oct 2026, PCV20 15 Oct 2026
//     chip:  "the next dose ... can be given from Dec 10, 2026 at the earliest"
//     card:  "Not yet due — eligible Nov 26, 2026"
//
// Two dates, 14 days apart, for the same next dose. The card measured 8 weeks
// from her PPSV23, because `anchorPneumo` keys on doses that COUNT (ANCHOR-1,
// *"an unnecessary dose cannot reset a clock"*) and her only conjugate no
// longer counts, so the PCV side of the card's anchor was empty.
//
// ⚠ AND THE CARD'S DATE WAS THE HARMFUL ONE — checked in the engine, not
// reasoned about. Maya given PCV20 on 26 Nov is rejected AGAIN by
// `CHILD-PCV-AFTER-PCV` (42 days, needs 56) and still reads incomplete; given
// it on 10 Dec the dose is valid and she reads Complete. ACIP's General Best
// Practices (*"The repeat dose should be spaced after the invalid dose by the
// recommended minimum interval"*) and RULING D both give 10 Dec. No document
// and no ruling gives 26 Nov.
//
// ── THE FIX IS THE LATER OF TWO CLOCKS, NOT A THIRD READING ──────────────
//
// `anchorForA` takes the LATER of the two anchors it already had access to:
//
//   `anchorPcv`     RULING D's — the dose the patient GOT, including one that
//                   did not count
//   `anchorPneumo`  ANCHOR-1's — the most recent pneumococcal dose that COUNTED
//
// Both carry the same 8 weeks, so the later anchor is simply the later date and
// no second interval enters the engine. This is the identical shape the
// 24–71-month catch-up card has used since earlier the same day — which is why
// children aged 2–5 never showed the defect and are untouched here.
//
// ── WHY THE SUITE COULD NOT SEE IT ───────────────────────────────────────
//
// The grid builds no vaccinated child aged 2–18: only 11 of its patients reach
// the rule at all and none of them clash. Measured over 810 HAND-BUILT children
// aged 2–18 with a PPSV23 and a conjugate 1–55 days later: on the parent commit
// 0 had a rejected dose, so 0 could disagree; with the floor in place 600 are
// rejected and 375 carried a card earlier than the chip — 750 cards, two per
// patient, every one of them in the 6–18 block. So this file builds its own
// patients and the sweep below is the guard.
//
// ── A BLIND SPOT THIS FILE DOES NOT CLOSE, found by a mutation that PASSED ─
//
// Swapping `anchorPneumo` for `anchorPneumoGiven` in the fixed line passes all
// 1,643 tests. The two differ only in WHICH PPSV23 they take —
// `anchorPneumo` reads `ppsv.effective.find((d) => d.date)`, the FIRST
// counting dose, while `anchorPneumoGiven` reads `ppsv.lastDate`, the most
// recent — and no test anywhere builds a child with two counting PPSV23 doses
// where that choice shows.
//
// It shows, and it is wrong, and it is NOT this change's doing: a 12-year-old
// with asplenia, PPSV23 on 2019-01-01 and again on 2026-09-01 and no conjugate
// at all, is told her PCV20 is **due today** on a card whose own label reads
// "≥8 weeks" — 54 days after her most recent pneumococcal dose. It anchors on
// 2019, though `anchorPneumo`'s own comment says "latest of PCV or PPSV23".
// Verified identical on `main`, so it predates all of today's work, and it is
// reported as its own finding rather than widened into this one.
//
// This fix is unaffected either way: it takes `mostRecent(...)`, so the term it
// adds can only push a date LATER, never paper over an anchor that is already
// too early. Do not "close" the blind spot by pinning the current behaviour —
// that would freeze the defect.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-10-25';
const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// Maya, the patient the defect was found on.
const maya = {
  today: TODAY, dob: '2018-10-01', ageMonths: 96, riskIds: ['asplenia'],
  pcvDoses: [{ product: 'PCV20', date: '2026-10-15' }],
  ppsv23Doses: [{ date: '2026-10-01' }],
};
const pcvCards = (out) => (out.recs ?? []).filter((r) => r.vaccine === 'PCV');

describe('Maya: the card and the chip name one date', () => {
  it('every PCV card she is shown names the chip\'s date, not the earlier one', () => {
    const out = recommend(maya);
    const chip = out.perDose.pcv[0];
    expect(chip.status).toBe('invalid');
    expect(chip.repeatDueDate).toBe('2026-12-10');

    const dated = pcvCards(out).filter((r) => r.earliestNextDate);
    // Anti-vacuity: she really is shown cards with dates on them.
    expect(dated.length).toBeGreaterThan(0);
    for (const r of dated) {
      expect(r.earliestNextDate, r.doseLabel).toBe('2026-12-10');
    }
  });

  it('and following the card now yields a dose that COUNTS', () => {
    // The clinical point of the whole fix, asserted end to end rather than
    // inferred from a date. On the old anchor this same assertion failed at
    // 26 Nov: the dose was rejected and the series stayed incomplete.
    const advised = pcvCards(recommend(maya)).find((r) => r.earliestNextDate).earliestNextDate;
    const after = recommend({
      ...maya, today: advised, ageMonths: 98,
      pcvDoses: [...maya.pcvDoses, { product: 'PCV20', date: advised }],
    });
    const second = after.perDose.pcv[1];
    expect(second.status).toBe('valid');
    expect(after.recs.some((r) => r.status === 'complete')).toBe(true);
  });
});

describe('the controls — these patients must NOT move', () => {
  it('a child with NO conjugate at all still anchors on her PPSV23', () => {
    // `anchorPcv` is null for her, so the later of the two clocks IS the
    // pneumococcal one. If this moves, the fix has reached patients it was
    // never about: nothing of hers was set aside, so there is no repeat to
    // space from.
    const out = recommend({ ...maya, pcvDoses: [] });
    const dated = pcvCards(out).filter((r) => r.earliestNextDate);
    expect(dated.length).toBeGreaterThan(0);
    // 1 Oct + 8 weeks, no grace — advice stays outside the four-day window.
    for (const r of dated) expect(r.earliestNextDate, r.doseLabel).toBe('2026-11-26');
  });

  it('a child whose conjugate COUNTED is untouched', () => {
    // 8 weeks apart, so nothing is rejected and no repeat date exists.
    const out = recommend({
      ...maya, today: '2026-12-20',
      pcvDoses: [{ product: 'PCV20', date: '2026-12-10' }],
    });
    expect(out.perDose.pcv[0].status).toBe('valid');
    expect(out.perDose.pcv[0].repeatDueDate ?? null).toBe(null);
  });
});

describe('swept over hand-built children aged 2-18 — the grid cannot build these', () => {
  const RISKS = [['asplenia'], ['hiv'], ['cochlear_implant'], ['chronic_heart'], ['chronic_lung']];
  const PRODUCTS = ['PCV13', 'PCV15', 'PCV20'];
  const AGES = [2, 3, 4, 5, 6, 8, 11, 14, 17];
  const GAPS = [1, 7, 14, 28, 42, 55];

  let built = 0; let rejected = 0; let carded = 0;
  const clashes = [];
  for (const ageY of AGES) {
    for (const risk of RISKS) {
      for (const product of PRODUCTS) {
        for (const gap of GAPS) {
          const ppsvDate = '2026-09-01';
          let out;
          try {
            out = recommend({
              today: TODAY, dob: `${2026 - ageY}-10-01`, ageMonths: ageY * 12 + 1,
              riskIds: risk,
              pcvDoses: [{ product, date: addDays(ppsvDate, gap) }],
              ppsv23Doses: [{ date: ppsvDate }],
            });
          } catch { continue; }
          if (out.excluded || !out.recs?.length) continue;
          built += 1;
          const chip = out.perDose.pcv[0];
          if (chip.status !== 'invalid' || !chip.repeatDueDate) continue;
          rejected += 1;
          for (const r of pcvCards(out).filter((x) => x.earliestNextDate)) {
            carded += 1;
            if (r.earliestNextDate < chip.repeatDueDate) {
              clashes.push(`${ageY}y ${risk.join('+')} ${product} +${gap}d: card ${r.earliestNextDate} < chip ${chip.repeatDueDate}`);
            }
          }
        }
      }
    }
  }

  it('no card ever advises a date earlier than the repeat the chip promises', () => {
    expect(clashes.slice(0, 8)).toEqual([]);
    expect(clashes.length).toBe(0);
  });

  it('and the sweep really reached these patients — the pinned shape', () => {
    // PINNED EXACTLY. 810 children built, 600 of them with a dose set aside by
    // the floor. Before the fix 375 of those 600 carried a card earlier than
    // the chip (750 cards, two each), all of them aged 6+. A fall in
    // `rejected` means the floor has stopped biting; a fall in `carded` means
    // cards have lost their dates, which would make the test above vacuous.
    expect({ built, rejected }).toEqual({ built: 810, rejected: 600 });
    expect(carded).toBeGreaterThan(600);
  });
});
