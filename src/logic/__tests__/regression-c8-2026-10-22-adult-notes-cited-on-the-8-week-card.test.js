// C8, CDC Adult Notes — the last uncredited statement on that document
// (2026-10-22). 25 cards.
//
// ── The patient ──────────────────────────────────────────────────────────
//
//   19-49, an immunocompromising condition / cochlear implant / CSF leak,
//   PCV15 given, PPSV23 not yet given.
//
// Her card is "PPSV23 (>=8 weeks after PCV15) — completes the series". It
// carried a grey button for CDC's Adult Schedule Notes that no raised number
// pointed at, which is the fault C8 exists to remove: a document is credited
// on a card, and nothing on the card says what it is credited FOR.
//
// Why only 25 cards, and only this risk class: the card's interval sentence
// cites whichever document states the number the card states (S15, owner
// 2026-10-16). At >=50, and at 19-49 with chronic conditions only, that is
// CDC's notes (`adultPcv15ThenPpsv`, the YEAR) — so the notes are already
// numbered there. At 19-49 with an immunocompromising condition it is ACIP's
// mm7401a1 (`adultPcv15ThenPpsvShort`, the 8 WEEKS), and the notes were left
// on the card with nothing pointing at them.
//
// ── Read live 2026-10-22, nesting included (FINDING K's lesson) ──────────
//
// `adult-notes.html`, the pneumococcal accordion panels expanded and walked
// as nested <li> elements rather than as flat text. The sentence
//
//     "If PCV15 is used, administer 1 dose PPSV23 at least 1 year after the
//      PCV15 dose (may use minimum interval of 8 weeks for adults with an
//      immunocompromising condition,* cochlear implant, or cerebrospinal
//      fluid leak)."
//
// is printed TWICE, identically, under two different parents:
//
//   routine panel     "Age 50 years or older who have:"
//                       > "Not previously received a dose of PCV13, PCV15,
//                          PCV20, or PCV21 or whose previous vaccination
//                          history is unknown: 1 dose PCV15 or 1 dose PCV20
//                          or 1 dose PCV21."
//   situations panel  "Age 19-49 years with certain underlying medical
//                      conditions or other risk factors** who have:"
//                       > the same "Not previously received ..." row.
//
// So it is about BOTH adult bands — `population` records both — and the
// parent it sits under is the row that CALLED FOR the PCV15 this patient has
// already had. Citing it here is the same shape as the owner's 2026-10-18
// ruling on the 576 ("cite the row the dose satisfied"), and the app already
// reads it this way for the >=1-year patients.
//
// ── What is quoted, and what deliberately is not ─────────────────────────
//
// Only the contiguous opening, "If PCV15 is used, administer 1 dose PPSV23".
// That is the claim this card's detail sentence makes — a PCV15 is not a
// complete series until the PPSV23 is given. The rest of CDC's sentence
// carries "at least 1 year", and this patient is being told 8 weeks on ACIP's
// recommendation; putting the year in front of her would be a right-sounding
// quote aimed at the wrong patient, which is the whole thing `population`
// and C8 exist to prevent. The INTERVAL keeps its own single home
// (`adultPcv15ThenPpsvShort`), already numbered on this card.
//
// ── And it must not take a SECOND number ─────────────────────────────────
//
// At >=50 and at 19-49 chronic-only, CDC's notes are already numbered on this
// card through the interval sentence. The new citation is therefore added
// only where they are not — keyed on the same S15 decision, never on a second
// age or risk test. This mirrors the existing `mmwrNoneRowCites` rule a few
// lines above it in `recommend.js`.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { REFS } from '../../data/refs.js';

const TODAY = '2026-10-22';
const KEY = 'adultPcv15NeedsPpsvCompletion';

/**
 * An adult of `ageYears` with `riskIds`, PCV15 given 2026-07-24 and no
 * PPSV23 — the history that produces the "completes the series" card.
 *
 * `ageMonths` / `pcvDoses` / `ppsv23Doses` is the engine's input shape, as
 * `regression-s15-adult-ppsv23-interval-19-49.test.js` uses it.
 */
function card({ ageYears, riskIds }) {
  const r = recommend({
    ageMonths: ageYears * 12,
    riskIds,
    today: TODAY,
    pcvDoses: [{ date: '2026-07-24', product: 'PCV15' }],
    ppsv23Doses: [],
  });
  return (r.recs ?? []).find((x) => /completes the series/.test(x.doseLabel ?? ''));
}

const citeKeys = (c) => (c?.noteCites ?? []).map((x) => x.key);
const chipShorts = (c) => (c?.citations ?? []).map((x) => x.short);
const markerCount = (c) => {
  const n = c?.note;
  const text = typeof n === 'string' ? n : `${n?.lead ?? ''} ${n?.detail ?? ''}`;
  return text.split('[c]').length - 1;
};

describe('CDC Adult Notes earns its number on the 8-week PCV15 card', () => {
  it('the entry exists, quotes the page verbatim, and names both adult bands', () => {
    const ref = REFS[KEY];
    expect(ref, `REFS.${KEY} is missing`).toBeTruthy();
    expect(ref.url).toBe('https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo');
    expect(ref.short).toBe('CDC Adult Notes');
    expect(ref.rulebook).toBe('adult');
    // The sentence is printed under an "Age 50 years or older" parent AND an
    // "Age 19-49 years with certain underlying medical conditions" parent.
    expect(ref.population).toEqual(['adult-19to49', 'adult-50plus']);
    expect(ref.quote).toBe('If PCV15 is used, administer 1 dose PPSV23');
    // The interval is NOT in this quote: it has its own home, and this
    // patient's number is 8 weeks, not the year CDC's full sentence names.
    expect(ref.quote).not.toMatch(/1 year|8 weeks/);
  });

  it('a 19-49 adult with asplenia now has a number pointing at the notes', () => {
    const c = card({ ageYears: 30, riskIds: ['asplenia'] });
    expect(c, 'no PCV15->PPSV23 card for this patient').toBeTruthy();
    expect(c.doseLabel).toMatch(/≥8 weeks after PCV15/);
    expect(citeKeys(c)).toContain(KEY);
    // The chip was always there; now something on the card says what for.
    expect(chipShorts(c)).toContain('CDC Adult Notes');
    // Every raised number has a citation behind it and vice versa.
    expect(markerCount(c)).toBe((c.noteCites ?? []).length);
  });

  it('the sentence it is cited beside is the completion claim, not the interval', () => {
    const c = card({ ageYears: 30, riskIds: ['asplenia'] });
    expect(c.note.detail).toMatch(/the pneumococcal series is complete once it is given \[c\]/);
    // The interval sentence keeps ACIP as its source: one number, one home.
    expect(citeKeys(c)[0]).toBe('adultPcv15ThenPpsvShort');
  });

  it('cochlear implant and CSF leak are treated the same way', () => {
    for (const risk of ['cochlear_implant', 'csf_leak']) {
      const c = card({ ageYears: 30, riskIds: [risk] });
      expect(c, `no card for ${risk}`).toBeTruthy();
      expect(citeKeys(c), risk).toContain(KEY);
    }
  });

  it('it does NOT take a second number where the notes are already cited', () => {
    // >=50, any risk class: the interval sentence already cites CDC's notes
    // for the year, so a second marker for the same document would give one
    // paper two numbers on one card.
    const older = card({ ageYears: 60, riskIds: ['asplenia'] });
    expect(older).toBeTruthy();
    expect(citeKeys(older)).toContain('adultPcv15ThenPpsv');
    expect(citeKeys(older)).not.toContain(KEY);

    // 19-49 with chronic conditions only: the year applies, same reasoning.
    const chronic = card({ ageYears: 30, riskIds: ['diabetes'] });
    expect(chronic).toBeTruthy();
    expect(citeKeys(chronic)).toContain('adultPcv15ThenPpsv');
    expect(citeKeys(chronic)).not.toContain(KEY);
  });

  it("CDC's notes are cited exactly once on every variant of this card", () => {
    // The precise invariant. Citing one document twice on a card is NOT
    // wrong in general — this very card cites the Timing Job Aid twice, for
    // the 8-week option and for the PPSV23-unavailable substitution, and the
    // two markers share one number (C2/C3's G3 guards that grid-wide). What
    // must not happen is CDC's notes picking up a redundant second marker
    // for the same claim, which is what adding the new citation
    // unconditionally would have done at >=50 and at 19-49 chronic-only.
    const NOTES = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo';
    for (const patient of [
      { ageYears: 30, riskIds: ['asplenia'] },
      { ageYears: 30, riskIds: ['cochlear_implant'] },
      { ageYears: 30, riskIds: ['diabetes'] },
      { ageYears: 60, riskIds: ['asplenia'] },
      { ageYears: 60, riskIds: [] },
    ]) {
      const c = card(patient);
      if (!c) continue;
      const onNotes = (c.noteCites ?? []).filter((x) => x.page === NOTES);
      expect(onNotes.length, `${JSON.stringify(patient)} cites CDC's notes ${onNotes.length} times`)
        .toBe(1);
    }
  });
});
