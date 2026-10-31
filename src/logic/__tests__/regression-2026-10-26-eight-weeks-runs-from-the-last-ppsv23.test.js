// 2026-10-26 — the 8-week wait before a conjugate is measured from the child's
// MOST RECENT counting PPSV23, not from her FIRST one.
//
// ── The defect, which predates the 2026-10-25 ruling ─────────────────────
//
// `anchorPneumo` is the engine's "most recent pneumococcal vaccine" anchor
// inside `pcvRiskChild`, and its own comment said so. It was built from
// `ppsv.effective.find((d) => d.date)` — JavaScript's `find`, which returns
// the FIRST match. So for a child with two counting PPSV23 doses the engine
// measured eight weeks from a dose given up to seven years earlier, and the
// wait had always already passed.
//
// OWNER, 2026-10-26, shown both schedule sentences: "both statements are
// correct. 'Give PPSV23 dose 2 >=5 years after dose 1 PPSV23' is the routine
// schedule when spacing out 2 PPSV23 doses. 'Give the next conjugate >=8 weeks
// after the most recent pneumococcal vaccine' is correct when spacing out
// conjugate from PPSV23 or between conjugate vaccines."
//
// So NEITHER RULE IS IN QUESTION and no interval changes here. The defect is
// which DOSE was fed into the 8-week rule. The 5-year revaccination clock
// genuinely runs from dose 1 and five call sites reach for the first dose
// directly for it; they are untouched, and the control below proves it.
//
// ── Why the whole suite stayed green ─────────────────────────────────────
//
// With one PPSV23 on record "first" and "most recent" are the same dose. No
// patient in the 17,016-row grid, and none of the 810 hand-built children of
// 2026-10-25, has TWO counting PPSV23 doses — the grid cannot build a
// vaccinated child aged 2-18 at all. The candidate fix moved 0 of 18,667 card
// rows, so this file is the only thing standing between the fix and a silent
// return: it hand-builds the patient, as the Maya and Noor fixtures do.
//
// The tell that found it needs no clinical judgement at all: two children with
// the SAME most-recent dose were given different dates, and the one with MORE
// history was given the EARLIER one.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { addDays } from '../dateUtils.js';

const TODAY = '2026-10-25';
const WK8 = 56;

/** Hana, 12, asplenia, no conjugate ever. PPSV23 doses as given. */
const hana = (ppsv23Doses) => recommend({
  today: TODAY,
  dob: '2014-10-01',
  ageMonths: 144,
  riskIds: ['asplenia'],
  pcvDoses: [],
  ppsv23Doses,
});

const pcvCards = (res) => (res.recs ?? []).filter((r) => r.vaccine === 'PCV');
/** The date the card advises: today when due, else the date it holds. */
const advised = (rec) => (rec.dueToday ? TODAY : rec.earliestNextDate);
const ppsvStatuses = (res) => (res.perDose?.ppsv23 ?? []).map((d) => d.status);

describe('a child\'s 8-week conjugate wait runs from her LAST counting PPSV23', () => {
  // Her second PPSV23 is 7y 8m after the first, so the 5-year spacing is
  // satisfied and BOTH doses count. 8 weeks after 1 Sep 2026 is 27 Oct 2026 —
  // two days after today, so a correct engine holds the dose and a broken one
  // says "due today".
  const TWO_COUNTING = [{ date: '2019-01-01' }, { date: '2026-09-01' }];
  const EIGHT_WEEKS_AFTER_THE_LAST = addDays('2026-09-01', WK8); // 2026-10-27

  it('both doses count, so the engine really does have two dates to choose from', () => {
    expect(ppsvStatuses(hana(TWO_COUNTING))).toEqual(['valid', 'valid']);
    expect(EIGHT_WEEKS_AFTER_THE_LAST).toBe('2026-10-27');
  });

  it('holds the conjugate until 8 weeks after the SECOND PPSV23', () => {
    const cards = pcvCards(hana(TWO_COUNTING));
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.dueToday).toBe(false);
      expect(card.earliestNextDate).toBe(EIGHT_WEEKS_AFTER_THE_LAST);
    }
  });

  it('gives her the SAME date as a child whose only PPSV23 is that dose', () => {
    // The tell, stated as an assertion. An older extra dose is history; it
    // cannot bring a conjugate forward.
    const withOlderDoseToo = pcvCards(hana(TWO_COUNTING)).map(advised);
    const thatDoseAlone = pcvCards(hana([{ date: '2026-09-01' }])).map(advised);
    expect(withOlderDoseToo).toEqual(thatDoseAlone);
    expect(thatDoseAlone.every((d) => d === EIGHT_WEEKS_AFTER_THE_LAST)).toBe(true);
  });

  it('never advises a conjugate EARLIER than 8 weeks after any counting PPSV23', () => {
    // The direction check, over every pair of dates that keeps both doses
    // counting. A `mostRecent` that returned the earlier anchor passes the
    // single-patient tests on some rows; it cannot pass this.
    const firstDates = ['2016-01-01', '2018-06-15', '2019-01-01'];
    const secondOffsets = [0, 14, 41, 54, 55, 56, 57, 120];
    let checked = 0;
    for (const first of firstDates) {
      for (const off of secondOffsets) {
        const second = addDays(TODAY, -off);
        const res = hana([{ date: first }, { date: second }]);
        if (ppsvStatuses(res).join() !== 'valid,valid') continue;
        const floor = addDays(second, WK8);
        for (const card of pcvCards(res)) {
          expect(advised(card) >= floor).toBe(true);
          checked += 1;
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('CONTROL — the 5-year PPSV23 clock still runs from dose 1', () => {
    // The rule the owner confirmed is correct and that this fix must not
    // touch. A single PPSV23 on 1 Jan 2019 makes dose 2 due 1 Jan 2024, which
    // is in the past, so the card must not be holding it for a later date.
    const res = hana([{ date: '2019-01-01' }]);
    const ppsvCards = (res.recs ?? []).filter((r) => r.vaccine === 'PPSV23');
    for (const card of ppsvCards) {
      if (card.earliestNextDate) expect(card.earliestNextDate <= TODAY).toBe(true);
    }
    // And a child only two years past dose 1 is still held to the 5 years.
    const early = hana([{ date: '2024-10-01' }]);
    const earlyPpsv = (early.recs ?? []).filter((r) => r.vaccine === 'PPSV23');
    for (const card of earlyPpsv) {
      if (card.minIntervalMonths === 60 || /5 year/i.test(card.doseLabel ?? '')) {
        expect(card.dueToday).toBe(false);
      }
    }
  });

  it('CONTROL — a dose that does not count cannot push the conjugate out', () => {
    // ANCHOR-1, "an unnecessary dose cannot reset a clock", and the
    // record-problem rule, "a dose the patient never had". Both second doses
    // below are 54 days ago; neither may hold the conjugate, because neither
    // is a dose the engine credits.
    //
    // ⚠️ P2 (2026-10-30) MOVED WHICH CHILD SHOWS IT. Hana has no spleen, and
    // an immunocompromised child's early second PPSV23 now COUNTS (owner
    // ruling 2026-10-29) — so for her it is a credited dose and DOES hold the
    // conjugate, to 8 weeks after it, exactly as this file's own ruling says
    // of a last counting PPSV23. The same dose for a child with a cochlear
    // implant is an EXTRA dose (owner ruling 2026-10-30) — not credited — so
    // the control's principle is now shown by her.
    const twoDoses = [{ date: '2024-01-01' }, { date: '2026-09-01' }];
    const cochlear = recommend({
      today: TODAY, dob: '2014-10-01', ageMonths: 144, riskIds: ['cochlear_implant'],
      pcvDoses: [], ppsv23Doses: twoDoses,
    });
    expect(cochlear.perDose.ppsv23[1].extraDose).toBe(true);
    expect(pcvCards(cochlear).length).toBeGreaterThan(0);
    for (const card of pcvCards(cochlear)) expect(card.dueToday).toBe(true);

    // ...and Hana's counted dose holds her to 2026-09-01 + 56 days.
    const insideFiveYears = hana(twoDoses);
    expect(ppsvStatuses(insideFiveYears)).toEqual(['valid', 'valid']);
    expect(pcvCards(insideFiveYears).length).toBeGreaterThan(0);
    for (const card of pcvCards(insideFiveYears)) expect(advised(card)).toBe('2026-10-27');

    const futureDated = hana([{ date: '2019-01-01' }, { date: '2027-09-01' }]);
    expect((futureDated.perDose?.ppsv23 ?? [])[1]?.recordProblem).toBeTruthy();
    for (const card of pcvCards(futureDated)) expect(card.dueToday).toBe(true);
  });

  it('CONTROL — a child with no PPSV23 at all is untouched', () => {
    const none = hana([]);
    for (const card of pcvCards(none)) expect(card.dueToday).toBe(true);
  });
});
