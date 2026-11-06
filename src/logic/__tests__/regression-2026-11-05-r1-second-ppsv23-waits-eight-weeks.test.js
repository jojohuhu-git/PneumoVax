// ── P0-1 / R1 (2026-11-05): the 2nd PPSV23 waits for the 8 weeks too ───────
//
// An immunocompromised child who has had a PPSV23 is offered one further dose:
// PCV20, or a 2nd PPSV23. CDC gives that dose two waits, and both apply to both
// vaccines. Child Notes, read live 2026-11-05, immunocompromised list, age 6-18:
//
//   "administer 1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after the most
//    recent PCV13 dose and at least 5 years after dose 1 PPSV23."
//
// The PCV20 card asked `icPostPpsv23DueState()`, which takes the later of the
// two. The 2nd-PPSV23 card beside it worked out five years alone, in four
// separate places in `recommend.js`. So Noor (below) read "due today" on one
// card and "Nov 22" on the other, and a PPSV23 given today was thrown out.
// 2,110 of 77,496 patients. The grid held only 66 of them, because it has no
// vaccinated child between 6 and 18: that is why the old comment "the floor
// changes no committed verdict" stood for so long.
//
// ⚠ ONLY ONE OF THE FOUR PLACES CAN ACTUALLY DISAGREE. The other three serve a
// child whose conjugate doses all came before age 6, and the first PPSV23
// cannot count before age 2, so five years after it is age 7 or later: by then
// any conjugate is at least a year old and 8 weeks has long passed. Those three
// were moved to the helper anyway so that one rule has one reading, and they are
// held by the source check at the end of this file, because no patient can tell
// them apart. See `CLINICAL_SPEC.md` §D-note.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { recommend } from '../recommend.js';

const pcv20Card = (r) => r.recs.find((x) => x.doseLabel === '1 dose PCV20 (immunocompromising)');
const ppsv2Card = (r) => r.recs.find((x) => x.doseLabel.startsWith('2nd PPSV23'));

const NOOR_DOB = '2016-10-11';
const babySeries = ['2016-12-11', '2017-02-11', '2017-04-11', '2017-10-11']
  .map((date) => ({ product: 'PCV13', date }));

/** Noor: 10, HIV. PCV13 baby series, PPSV23 at 5, a PCV15 on `pcv15On`. */
const noor = ({ today = '2026-10-11', pcv15On = '2026-09-27', ppsv23 = ['2021-10-11'] } = {}) => recommend({
  dob: NOOR_DOB,
  ageMonths: 120,
  riskIds: ['hiv'],
  today,
  pcvDoses: [...babySeries, { product: 'PCV15', date: pcv15On }],
  ppsv23Doses: ppsv23.map((date) => ({ product: 'PPSV23', date })),
});

describe('Noor: both cards wait for the same day', () => {
  it('neither card is due today: both name 8 weeks after the PCV15', () => {
    const r = noor();
    expect(pcv20Card(r).dueToday).toBe(false);
    expect(pcv20Card(r).earliestNextDate).toBe('2026-11-22');
    expect(ppsv2Card(r).dueToday).toBe(false);
    expect(ppsv2Card(r).earliestNextDate).toBe('2026-11-22');
  });

  it('a PPSV23 given on the advised day counts', () => {
    const r = noor({ today: '2026-11-22', ppsv23: ['2021-10-11', '2026-11-22'] });
    expect(r.perDose.ppsv23[1].status).toBe('valid');
  });

  it('the dose check did not move: a PPSV23 given 14 days after the PCV15 is still thrown out', () => {
    const r = noor({ ppsv23: ['2021-10-11', '2026-10-11'] });
    expect(r.perDose.ppsv23[1].status).toBe('invalid');
    expect(r.perDose.ppsv23[1].intervalRuleId).toBe('CHILD-PPSV23-AFTER-PCV');
  });
});

describe('the later of the two waits decides, on both cards', () => {
  const bothCards = (r) => [pcv20Card(r), ppsv2Card(r)];

  it('the 8 weeks is later: the day before it, not due', () => {
    for (const c of bothCards(noor({ today: '2026-11-21' }))) {
      expect(c.dueToday).toBe(false);
      expect(c.earliestNextDate).toBe('2026-11-22');
    }
  });

  it('the 8 weeks is later: on its day, due', () => {
    for (const c of bothCards(noor({ today: '2026-11-22' }))) expect(c.dueToday).toBe(true);
  });

  it('the 5 years is later: a recent PPSV23 and an older PCV15 wait for the five years', () => {
    // Noor's PPSV23 three years ago, the PCV15 well over 8 weeks ago.
    const r = noor({ today: '2026-10-11', pcv15On: '2025-06-01', ppsv23: ['2023-10-11'] });
    for (const c of bothCards(r)) {
      expect(c.dueToday).toBe(false);
      expect(c.earliestNextDate).toBe('2028-10-11');
    }
  });

  it('the 5 years is later even when the 8 weeks is also still running', () => {
    const r = noor({ today: '2026-10-11', ppsv23: ['2023-10-11'] });
    for (const c of bothCards(r)) {
      expect(c.dueToday).toBe(false);
      expect(c.earliestNextDate).toBe('2028-10-11');
    }
  });

  it('both waits have passed: both cards are due today', () => {
    const r = noor({ today: '2026-10-11', pcv15On: '2025-06-01' });
    for (const c of bothCards(r)) expect(c.dueToday).toBe(true);
  });
});

// The three places no patient can tell apart. Each gets a real child, so that a
// change to its reachability is noticed: if the arithmetic in the header stops
// being true, the two cards here are where it shows.
describe('the other three places: the cards agree', () => {
  const pairAgrees = (r) => {
    expect(ppsv2Card(r)).toBeTruthy();
    expect(ppsv2Card(r).dueToday).toBe(pcv20Card(r).dueToday);
    expect(ppsv2Card(r).earliestNextDate).toBe(pcv20Card(r).earliestNextDate);
  };

  it('aged 2-5, catch-up done, one PPSV23', () => {
    pairAgrees(recommend({
      dob: '2022-10-11', ageMonths: 48, riskIds: ['asplenia'], today: '2026-10-11',
      pcvDoses: [{ product: 'PCV13', date: '2025-01-10' }, { product: 'PCV13', date: '2025-03-20' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2025-06-01' }],
    }));
  });

  it('aged 6 or over, fewer than 3 conjugate doses, all before 6, one PPSV23', () => {
    pairAgrees(recommend({
      dob: '2016-10-11', ageMonths: 120, riskIds: ['asplenia'], today: '2026-10-11',
      pcvDoses: [{ product: 'PCV13', date: '2019-01-10' }, { product: 'PCV13', date: '2019-03-20' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2024-06-01' }],
    }));
  });

  it('aged 6 or over, baby series before 6, one PPSV23', () => {
    pairAgrees(recommend({
      dob: NOOR_DOB, ageMonths: 120, riskIds: ['asplenia'], today: '2026-10-11',
      pcvDoses: babySeries,
      ppsv23Doses: [{ product: 'PPSV23', date: '2024-06-01' }],
    }));
  });
});

describe('one rule, one reading', () => {
  const source = readFileSync(resolve(__dirname, '../recommend.js'), 'utf8');

  it('nothing outside icPostPpsv23DueState() dates a dose by five years from the first PPSV23', () => {
    // Comments are stripped first: this asks about code, not about history.
    const code = source.replace(/\/\/.*$/gm, '');
    const firstPpsvThenMo60 = /dueStateMonths\(\s*(?:firstPpsv|ppsv\.effective\.find\(\(d\) => d\.date\)\?\.date \|\| anchorPneumo),\s*MO60/g;
    const matches = code.match(firstPpsvThenMo60) ?? [];
    // One: the helper's own `dueStateMonths(firstPpsv, MO60, today)`.
    expect(matches).toEqual(['dueStateMonths(firstPpsv, MO60']);
  });

  it('every 2nd-PPSV23 card sits beside the PCV20 card that shares its date', () => {
    const cards = source.match(/doseLabel: '2nd PPSV23 \(alternative, ≥5y after first\)'/g) ?? [];
    expect(cards).toHaveLength(4);
  });
});

// ── The line that says why (OWNER DECISION 2026-11-05) ─────────────────────
//
// Once both cards waited for the 8 weeks, Noor's read "eligible Nov 22" over
// text that names only the five years, and her five years were already up, so
// nothing on the screen said why. Shown that, the owner chose one short line. It
// appears only when the 8 weeks is what the child is waiting for, and only while
// the card still shows the date the line names: a thrown-out dose moves the card
// to a later date, and the line would then contradict it.
describe('the line that says why the card waits', () => {
  const lead = (c) => (typeof c.note === 'string' ? c.note : c.note.lead);
  const LINE = '**Wait until Nov 22, 2026: 8 weeks after the PCV15 of Sep 27, 2026.**';

  it('Noor: both cards say it, at the end of the short text', () => {
    const r = noor();
    expect(lead(pcv20Card(r)).endsWith(LINE)).toBe(true);
    expect(lead(ppsv2Card(r)).endsWith(LINE)).toBe(true);
  });

  it('says no [c] of its own, so the numbered sources do not shift', () => {
    expect(LINE).not.toContain('[c]');
    const r = noor();
    const markers = (c) => `${lead(c)} ${c.note.detail}`.split('[c]').length - 1;
    for (const c of [pcv20Card(r), ppsv2Card(r)]) expect(markers(c)).toBe(c.noteCites.length);
  });

  it('never names a product the record does not show', () => {
    const r = recommend({
      dob: NOOR_DOB, ageMonths: 120, riskIds: ['hiv'], today: '2026-10-11',
      pcvDoses: [...babySeries, { product: '', date: '2026-09-27' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2021-10-11' }],
    });
    expect(lead(pcv20Card(r))).toContain('**Wait until Nov 22, 2026: 8 weeks after the PCV of Sep 27, 2026.**');
    expect(lead(ppsv2Card(r))).toContain('**Wait until Nov 22, 2026: 8 weeks after the PCV of Sep 27, 2026.**');
  });

  it('names the PPSV23 when a second PPSV23 is the dose being waited on', () => {
    // The sweep found this one: an early draft always named the last PCV, and
    // printed "8 weeks after the PCV13 of Oct 1, 2023" on a card dated Nov 2026.
    const r = recommend({
      dob: '2014-10-11', ageMonths: 144, riskIds: ['asplenia'], today: '2026-10-11',
      pcvDoses: [{ product: 'PCV13', date: '2023-10-01' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2020-10-01' }, { product: 'PPSV23', date: '2026-09-27' }],
    });
    expect(lead(pcv20Card(r)).endsWith('**Wait until Nov 22, 2026: 8 weeks after the PPSV23 of Sep 27, 2026.**')).toBe(true);
  });

  it('present when the five years ends soon but the 8 weeks ends later', () => {
    // Her five years end on Oct 20, nine days away, and the 8 weeks on Nov 22.
    // Found by breaking the code: a line shown only once the five years had
    // fully passed got through every other test here.
    const r = noor({ ppsv23: ['2021-10-20'] });
    for (const c of [pcv20Card(r), ppsv2Card(r)]) {
      expect(c.earliestNextDate).toBe('2026-11-22');
      expect(lead(c).endsWith(LINE)).toBe(true);
    }
  });

  it('absent when the five years is the later wait', () => {
    const r = noor({ ppsv23: ['2023-10-11'] });
    for (const c of [pcv20Card(r), ppsv2Card(r)]) expect(lead(c)).not.toContain('Wait until');
  });

  it('absent once the dose is due', () => {
    const r = noor({ today: '2026-11-22' });
    for (const c of [pcv20Card(r), ppsv2Card(r)]) expect(lead(c)).not.toContain('Wait until');
  });

  it('absent when a thrown-out PPSV23 has moved the card to a later date', () => {
    const r = noor({ ppsv23: ['2021-10-11', '2026-10-11'] });
    expect(pcv20Card(r).earliestNextDate).toBe('2026-12-06');
    expect(ppsv2Card(r).earliestNextDate).toBe('2031-10-11');
    for (const c of [pcv20Card(r), ppsv2Card(r)]) expect(lead(c)).not.toContain('Wait until');
  });

  it('leaves no working field behind on the card', () => {
    for (const c of noor().recs) expect(c).not.toHaveProperty('eightWeekWait');
  });
});
