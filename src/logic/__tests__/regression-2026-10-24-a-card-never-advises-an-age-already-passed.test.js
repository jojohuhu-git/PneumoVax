// ─────────────────────────────────────────────────────────────────────────
// OWNER DECISION 2026-10-24 — a card never tells a clinician that a dose is
// due at an age the child has already passed.
//
// ── THE PATIENT ──────────────────────────────────────────────────────────
//
// A 12-month-old, healthy, whose only PCV15 was given at 2 months and who
// then missed her appointments. She is owed dose 2, whose routine age is 4
// months, and the card read:
//
//   "The next dose is due at age 4 months, following the routine
//    2, 4, 6 and 12–15 month series"
//
// to a clinician looking at a one-year-old. The DATE was never wrong —
// `advisedDate` is the latest of the minimum, the 8-week spacing and the
// routine age (C10-2), and here the routine age is genuinely the latest of
// the three. What was wrong was reading a past date out as a future
// instruction. 198 of 17,016 real patients read one.
//
// ── WHAT THIS IS NOT ─────────────────────────────────────────────────────
//
// Not a clinical change. No date moves, no verdict moves, no corpus column
// moves, and `advisedReason` still reports `routineAge` — the sentence is
// chosen by `routineAgePassed`, a flag used nowhere but the note. The tests
// below assert that explicitly, because a "wording fix" that quietly moved a
// due date would be the worst kind.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-10-24';
const pcvCard = (p) => recommend({ today: TODAY, ...p }).recs.find((r) => r.vaccine === 'PCV');

// Her, exactly: DOB 2025-10-24, one PCV15 on 2025-12-24 (age ~2 months).
const OVERDUE_INFANT = {
  dob: '2025-10-24',
  ageMonths: 12,
  riskIds: [],
  pcvDoses: [{ product: 'PCV15', date: '2025-12-24' }],
  ppsv23Doses: [],
};

// The control: the SAME child seen on time, at 3 months, with the routine age
// for dose 2 still ahead of her. Her sentence must not change.
const ON_TIME_INFANT = {
  dob: '2026-07-24',
  ageMonths: 3,
  riskIds: [],
  pcvDoses: [{ product: 'PCV15', date: '2026-09-24' }],
  ppsv23Doses: [],
};

describe('a routine age already passed is stated in the past tense', () => {
  it('does not tell a 12-month-old her dose is due at age 4 months', () => {
    const detail = pcvCard(OVERDUE_INFANT).note.detail;
    expect(detail).not.toContain('The next dose is due at age 4 months');
    expect(detail).toContain('This dose was due at age 4 months');
    expect(detail).toContain('is overdue');
  });

  it('says what the clinician can do about it', () => {
    expect(pcvCard(OVERDUE_INFANT).note.detail).toContain('it can be given now');
  });

  it('keeps naming the routine series — that is what the citation supports', () => {
    // The marker on this clause points at CDC's routine 4-dose sentence. If
    // the wording ever stops naming the series, the citation stops matching
    // the claim, which is the fault CLAUDE.md's "a card credits only the
    // documents that speak for it" exists to prevent.
    expect(pcvCard(OVERDUE_INFANT).note.detail)
      .toContain('the routine 2, 4, 6 and 12–15 month series');
  });
});

describe('the control: a child whose routine age is still ahead', () => {
  it('still reads in the future tense', () => {
    const detail = pcvCard(ON_TIME_INFANT).note.detail;
    expect(detail).toContain('The next dose is due at age 4 months');
    expect(detail).not.toContain('overdue');
  });
});

describe('nothing clinical moved', () => {
  it('the overdue child is due TODAY, and is owed no earliest-next date', () => {
    const card = pcvCard(OVERDUE_INFANT);
    expect(card.dueToday).toBe(true);
    expect(card.earliestNextDate).toBeNull();
  });

  it('the on-time child keeps her future date, unchanged', () => {
    const card = pcvCard(ON_TIME_INFANT);
    expect(card.dueToday).toBe(false);
    // 2026-07-24 + 4 calendar months.
    expect(card.earliestNextDate).toBe('2026-11-24');
  });

  it('both children owe the same dose number out of the same total', () => {
    expect(pcvCard(OVERDUE_INFANT).doseLabel).toBe('PCV dose 2 of 3');
    expect(pcvCard(ON_TIME_INFANT).doseLabel).toBe('PCV dose 2 of 4');
  });
});

describe('the sweep: no card anywhere advises an age already passed', () => {
  // The property, not an example. Any infant card naming a routine age in
  // the future tense must belong to a child who has not reached it.
  it('holds across a grid of ages and histories', () => {
    const FUTURE = /The next dose is due at age (\d+) months/;
    let checked = 0;
    let pastTense = 0;
    for (const am of [1, 2, 3, 4, 5, 6, 7, 9, 11, 12, 15, 18, 23]) {
      for (const firstAt of [null, 0, 2, 4, 6, 9, 12]) {
        if (firstAt != null && firstAt > am) continue;
        const dob = `2026-01-01`;
        const doses = firstAt == null ? [] : [{
          product: 'PCV15',
          // firstAt months after the DOB, as an ISO date.
          date: new Date(Date.UTC(2026, firstAt, 1)).toISOString().slice(0, 10),
        }];
        const card = recommend({
          dob, ageMonths: am, riskIds: [], pcvDoses: doses, ppsv23Doses: [],
          today: new Date(Date.UTC(2026, am, 1)).toISOString().slice(0, 10),
        }).recs.find((r) => r.vaccine === 'PCV');
        const detail = card?.note?.detail;
        if (typeof detail !== 'string') continue;
        checked += 1;
        if (detail.includes('This dose was due at age')) pastTense += 1;
        const m = detail.match(FUTURE);
        if (!m) continue;
        // A future-tense routine age must still be ahead of this child.
        expect(Number(m[1]), `age ${am}mo, first dose ${firstAt}: ${detail}`)
          .toBeGreaterThan(am - 1);
      }
    }
    // The sweep must actually have exercised both branches, or it proves
    // nothing — a grid that produced no past-tense card at all would pass.
    expect(checked).toBeGreaterThan(20);
    expect(pastTense).toBeGreaterThan(0);
  });
});
