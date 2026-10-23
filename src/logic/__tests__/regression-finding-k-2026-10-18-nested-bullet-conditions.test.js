// FINDING K (2026-10-18) — a sentence CDC prints as a SUB-BULLET is only about
// the patient its parent bullet describes.
//
// HOW IT WAS FOUND. The handoff's next queue item was "the CDC Risk-based
// Pneumococcal chip is on 864 cards and needs a number", with a warning that
// every completion sentence on that page sits under a branch heading an
// 18-year-old whose PCV20 came at 17 does not match. That was true. Checking it
// meant reading the OTHER document on those same cards — CDC's Child &
// Adolescent Schedule Notes, which the app already quoted there — and the quote
// it was already showing is worse.
//
// WHAT THE DOCUMENT ACTUALLY SAYS. Read live 2026-10-18 from
// child-adolescent-notes.html#note-pneumo with the accordion expanded (shut by
// default; the whole paediatric risk rulebook is invisible to a plain fetch).
// The sentence the app cites is not a free-standing rule. It is a sub-bullet,
// and it occurs FOUR times — once in each of {non-IC, IC} x {Age 2-5, Age 6-18}
// — each time under a parent that carries its own conditions:
//
//   Age 6-18 years
//     - Received PCV before age 6 years but have not received PPSV23
//         - Previously received at least 1 dose of PCV20: no further PCV or
//           PPSV23 doses needed                                      [non-IC]
//         - Previously received at least 1 dose of PCV20: no additional dose
//           of PCV or PPSV23                                             [IC]
//   Age 2-5 years
//     - Completed recommended PCV series but have not received PPSV23
//         - Previously received at least 1 dose of PCV20: no further PCV or
//           PPSV23 doses needed                            [both lists, same]
//
// `recommend.js` carried the opposite in a comment — that the sentence "carries
// no age condition in its own words, which is what the population rule asks
// about, so it speaks for this patient at either age". Read FLAT that is true.
// Read in its nesting the parent carries two conditions, and both fail on most
// of the cards that were showing it. This is the `stale comment causes the bug`
// shape and the FINDING F shape at once: a reading that did not look at the
// structure around the sentence.
//
// (For the record, `docs/archive/c7-2026-10-17-source-readings.md` line 1328
// records this sentence as occurring 3 times, "non-IC x2 and IC". It occurs 4
// times. That reading noted the ambiguity and never opened the parent bullets.)
//
// MEASURED BEFORE THE FIX — 992 cards showed that quote:
//
//     56  6-18y, PCV incl. PCV20 before age 6, no PPSV23   -> parent FITS
//     40  6-18y, PCV incl. PCV20 before age 6, PPSV23 given -> "have not
//         received PPSV23" fails
//    864  6-18y, NO PCV before age 6 (PCV20 given at 17-18) -> "before age 6"
//         fails; 640 of them also have a PPSV23
//     32  15-month-olds, 3x PCV20 at 10-12 months          -> see below
//
// So 56 of 992 fitted. 904 did not.
//
// THE 32 ARE LEFT ALONE, DELIBERATELY. Their card says "no further pneumococcal
// dose is needed AT AGE 2 YEARS OR LATER" — it names the age it is talking
// about, and at age 2 that child is exactly the patient CDC's Age 2-5 parent
// bullet describes (series complete, no PPSV23). The quote is about who they
// will be, and the card says so in words. Reviewed and kept, not overlooked.
//
// WHAT THE 864 GET INSTEAD, and the OWNER DECISION behind it. They split by
// history, and the split is what decides the question:
//
//   288  the PCV20 is the only conjugate they ever had. CDC's Risk-based page
//        covers them exactly, in words, under "Children 6 through 18 years old"
//        -> "Never received PCV13, PCV15, or PCV20" -> "Give it regardless of
//        whether the child has previously received PPSV23 or PCV7" -> "When
//        PCV20 is used ... Their pneumococcal vaccinations are complete." A
//        fitting row that states the completion. Added, with CDC's notes row
//        for the dose itself, so both chips are credited.
//
//   576  a conjugate at age 8-13, then the PCV20 at 17. NO document states a
//        completion for that history — escalation case (a). Put to the owner as
//        patients on 2026-10-18 with the three options, and she ruled: CITE THE
//        ROW THE PCV20 SATISFIED — CDC's "Received PCV13 only at or after age 6
//        years: administer 1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after
//        the most recent PCV13 dose" — and have the card say that dose has been
//        given, so the row's instruction is carried out. The completion is then
//        the app's own statement following from a cited instruction, rather than
//        a quote lifted from a document that never says it.
//
//     40  p2016 Table 4 prints a row whose every column fits them: "2 through
//         18 years (any risk condition) | Completed PCV series before age 6
//         years, including one or more doses of PCV20 | Option A: No additional
//         doses". It says nothing about PPSV23, so a prior PPSV23 does not
//         break it. Verified cell by cell from a live download 2026-10-18
//         (HTTP 200, 211,252 bytes, Item #P2016 of 2/16/2024) laid out with
//         `scripts/pdfLayout.py`. Quoted here for the first time.
//
// WHY p2016 IS **NOT** PUT BACK ON THE 576, though it prints a parallel row
// ("6 through 18 years (non-IC/IC) | PCV13 only, given at or after age 6 years
// | Option A: 1 dose of PCV20 at least 8 weeks after most recent PCV13 dose" —
// the same instruction, satisfied by the same dose). Admitting it would mean
// widening the all-columns guard's predicate for that row to accept a patient
// who HAS a PCV20, and `!hasCompletingProduct` in that predicate is what
// FINDING J rests on — p2016 itself keeps "PCV13 only" away from "including one
// or more doses of PCV20". So FINDING J's removal stands and this is recorded
// as a judgement call for the owner rather than taken silently.
//
// THE DOSE DOES NOT MOVE on any of the 992. Only which document is credited,
// and the words that say why.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases, CORPUS_TODAY } from '../../test-grid.js';
import { calendarMonthsBetween } from '../dateUtils.js';

/** The sub-bullet, in both its wordings. */
const NESTED_PCV20_COMPLETE = [
  'Previously received at least 1 dose of PCV20: no further PCV or PPSV23 doses needed',
  'Previously received at least 1 dose of PCV20: no additional dose of PCV or PPSV23',
];
const RISK_BASED_FIRST_CONJUGATE = "It doesn't need to be followed by a dose of PPSV23";
const ROW_THE_PCV20_SATISFIED = 'Received PCV13 only at or after age 6 years';
const P2016_COMPLETED_BEFORE_6_WITH_PCV20 = 'Completed PCV series before age 6 years, including one or more doses of PCV20';
const COMPLETE_CARD = 'no additional PCV or PPSV23 doses needed';

const counted = (v) => v && v.status !== 'invalid' && v.status !== 'noncounting';
const quotesOf = (rec) => (rec.noteCites ?? []).map((c) => c?.quote ?? '');
const chipsOf = (rec) => (rec.citations ?? []).map((c) => c.short);
const noteOf = (rec) => (typeof rec.note === 'string'
  ? rec.note
  : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' '));

/**
 * The patient as CDC's parent bullets describe them, from the doses the ENGINE
 * accepted — a PCV7 is not a dose any row is written about, and neither is one
 * the engine rejected.
 */
function asCdcBranch(c, res) {
  const pcv = (res.orderedDoses?.pcv ?? [])
    .map((d, i) => ({ d, v: res.perDose?.pcv?.[i] }))
    .filter(({ v }) => counted(v))
    .map(({ d }) => ({
      product: d.product || null,
      ageM: d.date ? calendarMonthsBetween(c.input.dob, d.date) : null,
    }));
  const ppsvCount = (res.orderedDoses?.ppsv23 ?? [])
    .filter((_, i) => counted(res.perDose?.ppsv23?.[i])).length;
  return {
    ageMonths: Math.round(calendarMonthsBetween(c.input.dob, CORPUS_TODAY)),
    pcv,
    ppsvCount,
    anyPcvBefore6: pcv.some((d) => d.ageM !== null && d.ageM < 72),
    // "Never received PCV13, PCV15, or PCV20" at the moment the PCV20 was
    // given: true exactly when every counted dose is a named completing
    // product, so there was no earlier conjugate to have received.
    pcv20IsFirstConjugate: pcv.length > 0
      && pcv.every((d) => d.product === 'PCV20' || d.product === 'PCV21'),
  };
}

/** Walk the grid once; hand each "complete" card and its patient to `visit`. */
function sweep(visit) {
  for (const c of buildCases()) {
    let res;
    try { res = recommend(c.input); } catch { continue; }
    if (res.excluded) continue;
    const p = asCdcBranch(c, res);
    for (const rec of res.recs ?? []) visit(rec, p, c);
  }
}

describe('FINDING K — a nested CDC sub-bullet is cited only inside its parent branch', () => {
  it('no card shows the "1 dose of PCV20 -> no further doses" sub-bullet outside its parent branch', () => {
    const outside = new Map();
    let inside = 0;

    sweep((rec, p) => {
      if (!quotesOf(rec).some((q) => NESTED_PCV20_COMPLETE.some((n) => q.includes(n)))) return;
      // The Age 2-5 parent bullet, reached by the under-2 card that names
      // "at age 2 years or later" in its own words. Its PPSV23 condition is
      // still checked — "Completed recommended PCV series but have not received
      // PPSV23" — so this is an exemption from the age half only, not a hole.
      if (p.ageMonths < 24 && p.ppsvCount === 0) { inside += 1; return; }
      // The Age 6-18 parent: "Received PCV before age 6 years BUT HAVE NOT
      // received PPSV23". Both halves, because both are printed.
      if (p.anyPcvBefore6 && p.ppsvCount === 0) { inside += 1; return; }
      const why = !p.anyPcvBefore6 ? 'no PCV before age 6' : `PPSV23 x${p.ppsvCount} already given`;
      const key = `age ${p.ageMonths}mo, doses at [${p.pcv.map((d) => (d.ageM === null ? '?' : Math.round(d.ageM))).join(',')}]mo — ${why}`;
      outside.set(key, (outside.get(key) ?? 0) + 1);
    });

    // Anti-vacuity: if the sentence stopped appearing anywhere, the assertion
    // below would pass while checking nothing.
    expect(inside).toBeGreaterThan(50);
    expect([...outside.entries()].slice(0, 6)).toEqual([]);
    expect([...outside.values()].reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('a 6-18y at-risk child whose PCV20 was their FIRST conjugate gets CDC\'s Risk-based completion sentence', () => {
    let cited = 0;
    const missing = [];
    sweep((rec, p, c) => {
      if (!noteOf(rec).includes(COMPLETE_CARD)) return;
      if (p.ageMonths < 72 || p.anyPcvBefore6 || !p.pcv20IsFirstConjugate) return;
      if (quotesOf(rec).some((q) => q.includes(RISK_BASED_FIRST_CONJUGATE))) cited += 1;
      else missing.push(c.key);
    });
    expect(missing.slice(0, 5)).toEqual([]);
    expect(cited).toBe(288);
  });

  it('a 6-18y at-risk child with an earlier conjugate at/after age 6 is cited the row that PCV20 satisfied', () => {
    let cited = 0;
    const missing = [];
    const strayRiskBasedChip = [];
    sweep((rec, p, c) => {
      if (!noteOf(rec).includes(COMPLETE_CARD)) return;
      if (p.ageMonths < 72 || p.anyPcvBefore6 || p.pcv20IsFirstConjugate) return;
      if (quotesOf(rec).some((q) => q.includes(ROW_THE_PCV20_SATISFIED))) cited += 1;
      else missing.push(c.key);
      // CDC's Risk-based page has no branch for "a conjugate at or after age 6,
      // then a PCV20": its only two prior-conjugate branches are "Never
      // received PCV13, PCV15, or PCV20" and "Received PCV13 or PCV15 before
      // age 6 years, never received PCV20". So its chip comes off.
      if (chipsOf(rec).includes('CDC Risk-based Pneumococcal')) strayRiskBasedChip.push(c.key);
    });
    expect(missing.slice(0, 5)).toEqual([]);
    expect(strayRiskBasedChip.slice(0, 5)).toEqual([]);
    expect(cited).toBe(576);
  });

  it('the card says the PCV20 has been given, so the cited row is not read as still owing a dose', () => {
    const silent = [];
    sweep((rec, p, c) => {
      if (!noteOf(rec).includes(COMPLETE_CARD)) return;
      if (p.ageMonths < 72 || p.anyPcvBefore6 || p.pcv20IsFirstConjugate) return;
      // The owner's ruling is only honest if the card states WHY a row that
      // asks for a dose is the authority for needing none.
      if (!/has (?:already )?been given|that dose has been given/i.test(noteOf(rec))) silent.push(c.key);
    });
    expect(silent.slice(0, 5)).toEqual([]);
  });

  it('a 6-18y child who completed before age 6 WITH a PPSV23 is cited p2016\'s row, which fits', () => {
    let cited = 0;
    const missing = [];
    sweep((rec, p, c) => {
      if (!noteOf(rec).includes(COMPLETE_CARD)) return;
      if (p.ageMonths < 72 || !p.anyPcvBefore6 || p.ppsvCount === 0) return;
      if (quotesOf(rec).some((q) => q.includes(P2016_COMPLETED_BEFORE_6_WITH_PCV20))) cited += 1;
      else missing.push(c.key);
    });
    expect(missing.slice(0, 5)).toEqual([]);
    expect(cited).toBe(40);
  });

  it('the two documents this finding moves are chips only where a quote credits them', () => {
    // Scoped to the two documents FINDING K adds and removes. The CDC
    // Child/Adolescent Notes chip is NOT in scope: it reaches every at-risk
    // card through the risk-condition list on the same page
    // (`cdcChildSpecialSituations`), which is a pre-existing uncredited pair
    // that `scripts/uncreditedSources.mjs` counts and the C8 queue owns.
    const MOVED = ['immunize.org p2016', 'CDC Risk-based Pneumococcal'];
    const uncredited = new Map();
    const citedWithoutChip = new Map();
    sweep((rec, p) => {
      if (!noteOf(rec).includes(COMPLETE_CARD)) return;
      if (p.ageMonths < 72) return;
      const quoted = new Set((rec.noteCites ?? []).map((c) => c?.doc).filter(Boolean));
      const chips = new Set(chipsOf(rec));
      for (const doc of MOVED) {
        if (chips.has(doc) && !quoted.has(doc)) uncredited.set(doc, (uncredited.get(doc) ?? 0) + 1);
        // The mirror direction, FINDING F's lesson: a numbered citation whose
        // document is not among the card's grey buttons is a number pointing
        // at nothing.
        if (quoted.has(doc) && !chips.has(doc)) citedWithoutChip.set(doc, (citedWithoutChip.get(doc) ?? 0) + 1);
      }
    });
    expect([...uncredited.entries()], JSON.stringify([...uncredited.entries()])).toEqual([]);
    expect([...citedWithoutChip.entries()], JSON.stringify([...citedWithoutChip.entries()])).toEqual([]);
  });

  it("ACIP's interchangeability sentence is a chip wherever it is a number", () => {
    // FINDING L, the part FINDING K owns. The bridge sentence's numbered
    // citation pointed at a document that was not among the card's grey buttons
    // -- a reader clicking the number finds no chip to match it. Measured over
    // the grid before the fix: 864 instances on FIVE cards, across all four of
    // the call sites that print the sentence:
    //
    //      310  Complete (PCV15 + PPSV23 at/after age 6)
    //      228  1 dose PCV20 (immunocompromising)
    //      144  PCV complete (includes PCV20)          <- added by FINDING K
    //      112  Option A: 1 dose PCV20 (>=8 weeks)
    //       70  Complete (a PCV of unrecorded product + PPSV23 ...)
    //
    // 144 of those are FINDING K's own, which is why the whole mechanism is
    // fixed here instead of queued: shipping K alone would have made a known
    // fault worse. This sweeps EVERY card, not just the four this finding
    // touches, because the helper is shared.
    const DOC = 'PCV15 Children MMWR';
    const orphaned = new Map();
    let paired = 0;
    sweep((rec) => {
      const cited = (rec.noteCites ?? []).some((x) => x?.key === 'pedsPcv13Pcv15Interchangeable');
      if (!cited) return;
      if (chipsOf(rec).includes(DOC)) paired += 1;
      else orphaned.set(String(rec.doseLabel), (orphaned.get(String(rec.doseLabel)) ?? 0) + 1);
    });
    expect(paired, 'the sentence should still be printed somewhere').toBeGreaterThan(700);
    expect([...orphaned.entries()], JSON.stringify([...orphaned.entries()])).toEqual([]);
  });

  it('and adding the chip did not leave it on a card with no number', () => {
    // The mirror, because the fix could have been taken by folding the key into
    // the block-level refs -- which would put a grey button with no number on
    // every other card in the same block.
    const DOC = 'PCV15 Children MMWR';
    const chipWithNoNumber = new Map();
    sweep((rec) => {
      if (!chipsOf(rec).includes(DOC)) return;
      const cited = (rec.noteCites ?? []).some((x) => x?.doc === DOC);
      if (!cited) chipWithNoNumber.set(String(rec.doseLabel), (chipWithNoNumber.get(String(rec.doseLabel)) ?? 0) + 1);
    });
    expect([...chipWithNoNumber.entries()], JSON.stringify([...chipWithNoNumber.entries()])).toEqual([]);
  });
});
