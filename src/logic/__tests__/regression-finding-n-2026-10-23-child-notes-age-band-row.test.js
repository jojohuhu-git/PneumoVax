/**
 * FINDING N — a 6-to-18-year-old was shown CDC's Age 2-5 sentence.
 *
 * ── WHAT WENT WRONG ───────────────────────────────────────────────────────
 *
 * CDC's child pneumococcal notes answer "the conjugate series is done, no
 * PCV20, no PPSV23 yet" FOUR times, not twice: once in each at-risk list under
 * "Age 2-5 years", and once in each under "Age 6-18 years". The two parents are
 * different sentences —
 *
 *   Age 2-5    "Completed recommended PCV series but have not received PPSV23"
 *   Age 6-18   "Received PCV before age 6 years but have not received PPSV23"
 *
 * — and so are the four instructions beneath them. Only two of the four had
 * keys (`pedsRiskPcv20orPpsv23`, `pedsIcPcv20orPpsv23`, both Age 2-5), and the
 * rows-4/5 block cited them at every age it serves, which is 24 months through
 * 18 years.
 *
 * MEASURED BEFORE THE FIX — 496 cards for children aged 6 and over quoted an
 * Age 2-5 sentence:
 *
 *   210  non-IC, "Option A: 1 dose PCV20" / "Option B: 1 dose PPSV23"  (105 each)
 *   126  IC, the same pair                                             (63 each)
 *   100  non-IC, same pair, no PPSV23 on record                        (50 each)
 *    60  IC, same pair, no PPSV23 on record                            (30 each)
 *
 * ── WHY NOTHING EXISTING COULD CATCH IT ───────────────────────────────────
 *
 * `population` records the patient GROUP a sentence is about, and both
 * instances of this row are about the same group — a non-IC child, or an IC
 * child. The split here is the child's AGE NOW, inside one risk class, so the
 * population guard is blind to it by construction and `regression-2026-10-17-
 * every-quote-names-its-patient` passes either way.
 *
 * The p2016 all-columns guard cannot see it either, and for the reason
 * CLAUDE.md already records about that guard: it asks whether SOME row of a
 * document fits the patient, not whether the row the card USED fits. This is
 * that gap, in CDC's notes rather than in p2016 — the first instance of it
 * found by reading a document rather than by a guard.
 *
 * Neither verdict corpus moves: the dose, the date, the products and the status
 * are identical on all 496. What changes is the sentence quoted on hover and
 * the deep link behind the number.
 *
 * ── WHAT THIS FILE HOLDS ──────────────────────────────────────────────────
 *
 * One rule: on the "completed the PCV series before age 6, no PCV20" cards, the
 * quote's age band must match the child's age now. 24-71 months gets the Age
 * 2-5 sentence; 72 months and over gets the Age 6-18 sentence. Asserted in both
 * directions, so a later change cannot fix one half by breaking the other.
 */
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { REFS } from '../../data/refs.js';
import { buildCases, CORPUS_TODAY } from '../../test-grid.js';
import { noteCiteSlices } from '../../components/citations.jsx';

const AGE_2_5 = ['pedsRiskPcv20orPpsv23', 'pedsIcPcv20orPpsv23'];
const AGE_6_18 = ['pedsRiskBefore6NoPcv20At6to18', 'pedsIcBefore6NoPcv20At6to18'];

/** The cite keys a card actually SHOWS — sliced per marker, as the screen is. */
function shownKeys(rec) {
  const s = noteCiteSlices(rec.note, rec.noteCites);
  return [...s.lead, ...s.detail].map((c) => c.key);
}

const noteOf = (rec) => (typeof rec.note === 'string'
  ? rec.note
  : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' '));

/**
 * The cards this finding is about: the rows-4/5 pair for a child who completed
 * the conjugate series before age 6 with no PCV20, and the two "complete"
 * cards that cite the same row because that row's dose has been given.
 */
const IS_ROWS_4_5 = /completed (the PCV series|PCV13\/15) before age 6|Option [AB] —|completed the PCV series and has received PPSV23/;

describe('FINDING N — the quoted row matches the child\'s age band', () => {
  it('both Age 6-18 entries exist, quote CDC verbatim, and name one risk class each', () => {
    const nonIc = REFS.pedsRiskBefore6NoPcv20At6to18;
    const ic = REFS.pedsIcBefore6NoPcv20At6to18;
    for (const [key, ref] of [['pedsRiskBefore6NoPcv20At6to18', nonIc], ['pedsIcBefore6NoPcv20At6to18', ic]]) {
      expect(ref, `REFS.${key} is missing`).toBeTruthy();
      expect(ref.rulebook).toBe('child');
      expect(ref.short).toBe('CDC Child/Adolescent Notes');
      expect(ref.url).toBe('https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo');
      expect(ref.lastVerified).toBe('2026-10-23');
    }
    expect(nonIc.population).toEqual(['child-nonIC']);
    expect(ic.population).toEqual(['child-IC']);

    // Verbatim, including CDC's own inconsistencies. The Age 6-18 non-IC line
    // does NOT open with "administer" and its Age 2-5 twin does; that single
    // word is how the two instances are told apart on the page.
    expect(nonIc.quote).toBe('Not previously received PCV20: 1 dose PCV20 or 1 dose PPSV23 administer at least 8 weeks after the most recent PCV dose.');
    expect(REFS.pedsRiskPcv20orPpsv23.quote).toBe('Not previously received PCV20: administer 1 dose PCV20 or 1 dose PPSV23 administer at least 8 weeks after the most recent PCV dose.');
    expect(nonIc.quote).not.toBe(REFS.pedsRiskPcv20orPpsv23.quote);

    // Only the IC instances carry the five-year follow-on, and the Age 6-18 one
    // words it "either PCV20 or dose 2 PPSV23".
    expect(ic.quote).toContain('If PPSV23 is used, administer either PCV20 or dose 2 PPSV23 at least 5 years after dose 1 PPSV23.');
    expect(nonIc.quote).not.toMatch(/5 years/);
    expect(ic.quote).not.toBe(REFS.pedsIcPcv20orPpsv23.quote);
  });

  it('no card for a child aged 6 or over quotes an Age 2-5 sentence of this row', () => {
    const offenders = new Map();
    let olderCards = 0;

    for (const c of buildCases()) {
      let res;
      try { res = recommend(c.input); } catch { continue; }
      if (res.excluded) continue;
      for (const rec of res.recs ?? []) {
        if (!IS_ROWS_4_5.test(noteOf(rec))) continue;
        if (c.input.ageMonths < 72) continue;
        olderCards += 1;
        const stray = shownKeys(rec).filter((k) => AGE_2_5.includes(k));
        if (!stray.length) continue;
        const key = `age ${c.input.ageMonths}mo — ${rec.doseLabel} — ${stray.join(',')}`;
        offenders.set(key, (offenders.get(key) ?? 0) + 1);
      }
    }

    // Anti-vacuity: if these cards stopped being produced, the assertion below
    // would pass while checking nothing.
    expect(olderCards).toBeGreaterThan(400);
    expect([...offenders.entries()].slice(0, 6)).toEqual([]);
    expect([...offenders.values()].reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('and the mirror: no 24-71 month card quotes the Age 6-18 sentence', () => {
    const offenders = new Map();
    let youngerCards = 0;

    for (const c of buildCases()) {
      let res;
      try { res = recommend(c.input); } catch { continue; }
      if (res.excluded) continue;
      for (const rec of res.recs ?? []) {
        if (!IS_ROWS_4_5.test(noteOf(rec))) continue;
        if (c.input.ageMonths >= 72 || c.input.ageMonths < 24) continue;
        youngerCards += 1;
        const stray = shownKeys(rec).filter((k) => AGE_6_18.includes(k));
        if (!stray.length) continue;
        const key = `age ${c.input.ageMonths}mo — ${rec.doseLabel} — ${stray.join(',')}`;
        offenders.set(key, (offenders.get(key) ?? 0) + 1);
      }
    }

    expect(youngerCards).toBeGreaterThan(20);
    expect([...offenders.entries()].slice(0, 6)).toEqual([]);
  });

  it('a 6-year-old with asplenia is quoted the IC Age 6-18 row, five-year tail included', () => {
    // PCV13 at 2 and 3 years (two doses, 12 months apart), nothing since. The
    // conjugate series was before age 6; no PCV20; no PPSV23 yet.
    const r = recommend({
      ageMonths: 72,
      dob: '2020-10-11',
      today: CORPUS_TODAY,
      riskIds: ['asplenia'],
      pcvDoses: [
        { product: 'PCV13', date: '2022-10-11' },
        { product: 'PCV13', date: '2023-10-11' },
      ],
      ppsv23Doses: [],
    });
    const optionB = (r.recs ?? []).find((x) => /Option B/.test(x.doseLabel ?? ''));
    expect(optionB, 'no Option B card for this patient').toBeTruthy();
    expect(shownKeys(optionB)).toContain('pedsIcBefore6NoPcv20At6to18');
    expect(shownKeys(optionB)).not.toContain('pedsIcPcv20orPpsv23');
  });

  it('a 4-year-old with asplenia keeps the IC Age 2-5 row', () => {
    // The same shape one age band down, so CDC's Age 2-5 parent ("Completed
    // recommended PCV series but have not received PPSV23") is the one that
    // describes her.
    const r = recommend({
      ageMonths: 48,
      dob: '2022-10-11',
      today: CORPUS_TODAY,
      riskIds: ['asplenia'],
      // Three PCV13 doses at 16, 18 and 20 months, 8 weeks apart. All after
      // the first birthday, so this is NOT p2016's "3 doses all before 12
      // months" row; the series is complete and the rows-4/5 pair is what she
      // gets.
      pcvDoses: [
        { product: 'PCV13', date: '2024-02-11' },
        { product: 'PCV13', date: '2024-04-11' },
        { product: 'PCV13', date: '2024-06-11' },
      ],
      ppsv23Doses: [],
    });
    const cards = (r.recs ?? []).filter((x) => shownKeys(x).some((k) => [...AGE_2_5, ...AGE_6_18].includes(k)));
    expect(cards.length, 'no card cites this row at all').toBeGreaterThan(0);
    for (const card of cards) {
      expect(shownKeys(card), card.doseLabel).not.toContain('pedsIcBefore6NoPcv20At6to18');
      expect(shownKeys(card), card.doseLabel).not.toContain('pedsRiskBefore6NoPcv20At6to18');
    }
  });

  it('the non-IC 6-18 card is quoted the non-IC sentence, never the IC one', () => {
    const r = recommend({
      ageMonths: 72,
      dob: '2020-10-11',
      today: CORPUS_TODAY,
      riskIds: ['chronic_heart'],
      pcvDoses: [
        { product: 'PCV13', date: '2022-10-11' },
        { product: 'PCV13', date: '2023-10-11' },
      ],
      ppsv23Doses: [],
    });
    const optionA = (r.recs ?? []).find((x) => /Option A/.test(x.doseLabel ?? ''));
    expect(optionA).toBeTruthy();
    expect(shownKeys(optionA)).toContain('pedsRiskBefore6NoPcv20At6to18');
    expect(shownKeys(optionA)).not.toContain('pedsIcBefore6NoPcv20At6to18');
  });
});
