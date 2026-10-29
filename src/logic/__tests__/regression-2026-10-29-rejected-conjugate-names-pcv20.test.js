// 2026-10-29 — a conjugate dose thrown out for being given below the minimum
// age is told to give PCV20, not to repeat the same vaccine.
//
// ── Her ruling ───────────────────────────────────────────────────────────
//
// Five rows of her children's table say the remedy is **PCV20, not another
// dose of the same vaccine** (queue item P3). Those five rows were never
// transcribed into this repo, so the question was put to her as a patient
// instead, on 2026-10-29:
//
//   Mia, 2, with a cochlear implant, had PCV15 on 1 June and a second PCV15
//   on 20 June — only 19 days later. The app throws out the June 20 dose and
//   says "repeat this dose", meaning another PCV15. What should it say?
//
// She answered **"Always PCV20"**: any conjugate dose the app throws out is
// replaced by PCV20, whatever product was given. She was shown "PCV20 or
// PCV15" as an alternative and did not take it.
//
// ── What that reaches, and what it does not ──────────────────────────────
//
// `walk()` in validate.js has exactly ONE sentence that tells a clinician to
// give the same vaccine again — "repeat this dose only (do not restart the
// series)" — and after W1 (2026-10-11) a dose rejected for TIMING no longer
// gets it: it takes "the next dose in this series can be given from ..."
// instead, which names no product and leaves the product to the rec card.
//
// So the sentence is reached by exactly four verdicts: a conjugate below its
// minimum age (dated and dateless), and a PPSV23 below 2 years (dated and
// dateless). This commit changes the two CONJUGATE ones. The PPSV23 pair is
// deliberately left alone — her ruling is about a conjugate, and a child
// whose PPSV23 came at 18 months needs a PPSV23 at 2, not a PCV20.
//
// ── Why a PCV20 thrown out keeps the old sentence ────────────────────────
//
// "Give a dose of PCV20 instead" reads as a different product. When the dose
// thrown out WAS a PCV20, repeating it IS giving PCV20 — same clinical act,
// so the old sentence is the one that reads correctly. The remedy has not
// changed; only the word for it has.
//
// Keyed on the `remedyProduct` FIELD set by the validator, the mechanism
// built on 2026-10-26 for a child's PCV21 — never on matching text.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-10-29';
const REPEAT = /repeat this dose only/i;
const GIVE_PCV20 = /give a dose of PCV20 instead/i;
const TOO_SOON = /given too soon after the dose it is measured from/i;

const run = (args) => recommend({ today: TODAY, riskIds: [], ppsv23Doses: [], ...args });
const pcvWords = (res, i = 0) => ((res.perDose?.pcv ?? [])[i]?.reasons ?? []).join(' ');
const pcvStatus = (res, i = 0) => (res.perDose?.pcv ?? [])[i]?.status;

// Ayla, born 1 Sep 2026, given PCV15 on 6 Oct 2026 — aged 5 weeks, a week
// below the 6-week minimum, so the dose does not count.
const ayla = (product = 'PCV15') => run({
  dob: '2026-09-01', ageMonths: 1, pcvDoses: [{ product, date: '2026-10-06' }],
});

describe('a conjugate thrown out for age is remedied with PCV20', () => {
  it('Ayla\'s PCV15 at 5 weeks: the card names PCV20, not another PCV15', () => {
    const words = pcvWords(ayla('PCV15'));
    expect(pcvStatus(ayla('PCV15'))).toBe('invalid');
    expect(words).toMatch(GIVE_PCV20);
    expect(words).not.toMatch(REPEAT);
    // The rejection reason itself is untouched — the dose is still too young.
    expect(words).toMatch(/below the 6 weeks minimum age/);
    // And nothing has invented a timing fault: her dose's timing is fine.
    expect(words).not.toMatch(TOO_SOON);
  });

  it('a PCV13 at 5 weeks does too — any product, one remedy', () => {
    const words = pcvWords(ayla('PCV13'));
    expect(words).toMatch(GIVE_PCV20);
    expect(words).not.toMatch(REPEAT);
  });

  it('a dateless conjugate on a newborn\'s record does too', () => {
    // No date recorded, and the patient is too young for the dose to have been
    // valid on any date — so it cannot count, and the remedy is still PCV20.
    const words = pcvWords(run({
      dob: '2026-10-08', ageMonths: 0, pcvDoses: [{ product: 'PCV13' }],
    }));
    expect(words).toMatch(GIVE_PCV20);
    expect(words).not.toMatch(REPEAT);
  });

  it('a PCV20 thrown out keeps "repeat this dose" — repeating it IS giving PCV20', () => {
    const words = pcvWords(ayla('PCV20'));
    expect(pcvStatus(ayla('PCV20'))).toBe('invalid');
    expect(words).toMatch(REPEAT);
    expect(words).not.toMatch(GIVE_PCV20);
  });
});

describe('the two things this ruling does NOT reach', () => {
  it('a PPSV23 below 2 years still says repeat — she needs a PPSV23, not a PCV20', () => {
    // Noor, 19 months, asplenia, PPSV23 on 1 Sep 2026. Her ruling is about a
    // conjugate; the remedy here is the same vaccine once she turns 2.
    const res = run({
      dob: '2025-03-01', ageMonths: 19, riskIds: ['asplenia'],
      ppsv23Doses: [{ date: '2026-09-01' }],
    });
    const words = ((res.perDose?.ppsv23 ?? [])[0]?.reasons ?? []).join(' ');
    expect((res.perDose?.ppsv23 ?? [])[0]?.status).toBe('invalid');
    expect(words).toMatch(REPEAT);
    expect(words).not.toMatch(GIVE_PCV20);
  });

  it('a conjugate thrown out for TIMING keeps W1\'s sentence and names no product', () => {
    // Mia, 2, cochlear implant: PCV20 on 1 Jun 2026 and again on 20 Jun, 19
    // days later. Rejected for timing, so it takes the "next dose" sentence —
    // which leaves the product to the rec card, as W1 decided.
    const res = run({
      dob: '2024-06-01', ageMonths: 28, riskIds: ['cochlear_implant'],
      pcvDoses: [
        { product: 'PCV20', date: '2026-06-01' },
        { product: 'PCV20', date: '2026-06-20' },
      ],
    });
    const words = pcvWords(res, 1);
    expect(pcvStatus(res, 1)).toBe('invalid');
    expect(words).toMatch(TOO_SOON);
    expect(words).not.toMatch(REPEAT);
    expect(words).not.toMatch(GIVE_PCV20);
  });
});
