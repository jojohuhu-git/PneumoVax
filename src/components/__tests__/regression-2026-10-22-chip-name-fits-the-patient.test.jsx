// 2026-10-22 — a grey button's NAME must not describe a patient the card is
// not about.
//
// Runs in the default `node` environment, per the convention in
// `vite.config.js` ("logic tests run in node; UI rendering tests opt into
// happy-dom per file"). Nothing here renders: it calls `cardSources`, the same
// function `RecCard` builds its button row from, so what it checks is what the
// reader sees without paying for a DOM on a 17,000-patient sweep.
//
// ── How this was found ───────────────────────────────────────────────────
//
// While checking the handoff's FINDING L (which did not reproduce — see
// `regression-c2-c3-numbered-sources.test.jsx` G2, which already guards the
// class it describes), one of its example cards was this patient:
//
//     a 19-year-old with asplenia, PCV15 already given
//
// Her card reads "Give PPSV23 ≥8 weeks after the PCV15 dose [1] — the series
// is INCOMPLETE until then", and button [1] was named `MMWR ≥50 expansion`.
//
// Everything about that citation was right except its name. The sentence is
// mm7401a1's, quoted verbatim from the 19–49 immunocompromising / CSF leak /
// cochlear implant row of its clinical guidance table; the entry's
// `population` correctly reads `['adult-19to49']`, so
// `regression-2026-10-17-every-quote-names-its-patient.test.js` was right to
// pass. The defect was only in the chip's own label, which came from the
// paper's TITLE ("Expanded Recommendations … Adults Aged ≥50 Years") while the
// app uses the table inside it for adults from 19 up.
//
// Measured over the grid before the fix: **1,015 cards shown to an adult aged
// 19–49 carried a button named `MMWR ≥50 expansion`**, across eight different
// recommendations — including "PPSV23 (≥8 weeks after PCV15) — completes the
// series" (25) and "PCV20 or PCV21 ≥5 years after last pneumococcal dose"
// (185). OWNER DECISION 2026-10-22: one age-neutral name everywhere, rather
// than two names for one document (a reader would take two differently-named
// buttons opening the same paper for two different papers).
//
// ── Why the age is the thing tested ──────────────────────────────────────
//
// The owner's standing fear, recorded in CLAUDE.md, is a right-sounding
// citation written about a different patient. `population` catches that for
// the QUOTE. Nothing caught it for the chip's NAME, and an age written into a
// name is the only form of it the app actually contains — so that is what is
// asserted here, over every card the grid can produce rather than the one
// patient who exposed it.
//
// This is deliberately a rule with no allowlist. Once renamed there are no
// exceptions, and an exception list is how a guard quietly stops biting.
import { describe, it, expect } from 'vitest';
import { cardSources } from '../citations.jsx';
import { REFS } from '../../data/refs.js';
import { recommend } from '../../logic/recommend.js';
import { buildCases } from '../../test-grid.js';

// `ADULT_SCHED_MIN_M` and `ROUTINE_ADULT_MIN_M`, by value: `M` in recommend.js
// is module-local, and these two are the schedule boundaries this test's
// patient bands are cut on — 19 years and 50 years.
const ADULT_19Y_M = 228;
const ROUTINE_50Y_M = 600;

/** A name claiming to be about people aged 50 and over. */
const CLAIMS_FIFTY_PLUS = /(≥|>=)\s*50|50\s*\+|aged 50|50 years and older|50 and older/i;

/**
 * The cards one patient sees, mirroring `Results.jsx`: the first card for a
 * vaccine carries that vaccine's recorded doses, and a vaccine with doses but
 * no card of its own is attached to the first card as "other history".
 */
function cardsOf(result) {
  const recs = result.recs ?? [];
  if (recs.length === 0) return [];
  const histories = {
    PCV: { label: 'PCV', doses: result.orderedDoses.pcv, dv: result.perDose.pcv },
    PPSV23: { label: 'PPSV23', doses: result.orderedDoses.ppsv23, dv: result.perDose.ppsv23 },
  };
  const seen = {};
  const cards = recs.map((rec) => {
    let doseValidations = [];
    if (!seen[rec.vaccine] && histories[rec.vaccine]) {
      seen[rec.vaccine] = true;
      doseValidations = histories[rec.vaccine].dv ?? [];
    }
    return { rec, doseValidations, otherValidations: [] };
  });
  const orphan = Object.values(histories).find((h) => h.doses.length > 0 && !seen[h.label]);
  if (orphan) cards[0].otherValidations = orphan.dv ?? [];
  return cards;
}

/** The buttons the reader sees, exactly as `RecCard` builds them. */
const buttonsOn = (card) => cardSources({
  doseValidations: card.doseValidations,
  otherValidations: card.otherValidations,
  note: card.rec.note,
  noteCites: card.rec.noteCites,
  citations: card.rec.citations,
}).sources;

// Swept once; every assertion below reads this.
const swept = [];
for (const c of buildCases()) {
  const result = recommend(c.input);
  if (result.excluded) continue;
  const am = result.meta?.ageMonths;
  if (am == null) continue;
  for (const card of cardsOf(result)) {
    swept.push({ key: c.key, ageMonths: am, rec: card.rec, buttons: buttonsOn(card) });
  }
}

describe("a grey button's name fits the patient whose card it is on", () => {
  it('sweeps a real corpus of cards, including under-50 adults (anti-vacuity)', () => {
    expect(swept.length).toBeGreaterThan(15000);
    const youngAdults = swept.filter(
      (s) => s.ageMonths >= ADULT_19Y_M && s.ageMonths < ROUTINE_50Y_M,
    );
    expect(youngAdults.length, 'no 19-49 adult cards swept, so the rule below proves nothing')
      .toBeGreaterThan(1000);
    // And those adults must really be carrying mm7401a1, or renaming it would
    // make this test pass for the wrong reason.
    const carryingMmwr = youngAdults.filter(
      (s) => s.buttons.some((b) => b.url === REFS.mmwr7401a1.url),
    );
    expect(carryingMmwr.length, 'no 19-49 adult cites mm7401a1, so the rename is untested')
      .toBeGreaterThan(1000);
  });

  it('no card for an adult under 50 shows a button named for the 50-and-over paper', () => {
    const bad = [];
    for (const s of swept) {
      if (s.ageMonths < ADULT_19Y_M || s.ageMonths >= ROUTINE_50Y_M) continue;
      for (const b of s.buttons) {
        if (CLAIMS_FIFTY_PLUS.test(b.short ?? '')) {
          bad.push(`${s.key} (${s.rec.doseLabel}): [${b.n}] ${b.short}`);
        }
      }
    }
    expect(bad.length, `${bad.length} cards name a ≥50 document to an under-50 adult`
      + `\n  e.g. ${bad.slice(0, 3).join('\n       ')}`).toBe(0);
  });

  it('no card for a child shows a button named for an adult age band', () => {
    const bad = [];
    for (const s of swept) {
      if (s.ageMonths >= ADULT_19Y_M) continue;
      for (const b of s.buttons) {
        if (CLAIMS_FIFTY_PLUS.test(b.short ?? '')) {
          bad.push(`${s.key} (${s.rec.doseLabel}): [${b.n}] ${b.short}`);
        }
      }
    }
    expect(bad.slice(0, 3)).toEqual([]);
  });

  it('mm7401a1 still has exactly one name, and it is age-neutral', () => {
    // The owner chose one name over two (2026-10-22). Two buttons opening the
    // same paper under different names reads as two papers.
    const namesForThePaper = new Set(
      Object.values(REFS)
        .filter((r) => r.url === REFS.mmwr7401a1.url)
        .map((r) => r.short),
    );
    expect([...namesForThePaper]).toHaveLength(1);
    expect(CLAIMS_FIFTY_PLUS.test([...namesForThePaper][0])).toBe(false);
    // It must still be recognisable as that paper, or the fix has traded a
    // misleading name for an anonymous one.
    expect([...namesForThePaper][0]).toMatch(/MMWR/);
  });

  it('the renamed entry still points at mm7401a1 and still quotes its 19-49 row', () => {
    // A rename must not become a re-citation: same document, same sentence,
    // same declared patient group.
    expect(REFS.adultPcv15ThenPpsvShort.url).toBe('https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm');
    expect(REFS.adultPcv15ThenPpsvShort.population).toEqual(['adult-19to49']);
    expect(REFS.adultPcv15ThenPpsvShort.quote)
      .toBe('If PCV15 is used, administer a single dose of PPSV23* ≥8 weeks after the PCV15 dose.');
  });
});
