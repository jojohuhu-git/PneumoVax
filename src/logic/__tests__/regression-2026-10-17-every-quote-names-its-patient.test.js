// THE PATIENT-POPULATION FIELD (2026-10-17) — every quoted source says which
// patient the sentence was written about, and a card may not show a quote to
// anyone else.
//
// THE OWNER'S FEAR, stated before any of this was measured: "a right-sounding
// quote written about a different patient". `rulebook` (child / adult / any)
// already stops a child's source appearing on an adult's card (N6). It cannot
// see either of the two splits CDC's own pages turn on, and those are the
// splits the app's logic turns on too:
//
//   • children — the IMMUNOCOMPROMISING list vs the one that isn't
//   • adults   — Routine (50+) vs Special situations (19-49)
//
// WHY THE FIELD RECORDS WHO THE SENTENCE IS ABOUT, NOT WHERE IT WAS PRINTED
// (OWNER DECISION 2026-10-17). Measured over the 17,016-patient grid, eight
// quotes reached a patient outside the block they are printed in, across 5,711
// showings — but 4,639 of those are correct, and a field recording mere
// provenance would mark every one of them wrong:
//
//   adultPcv20or21Complete  2,079  printed under Special situations, and its
//                                  own words are "Adults aged 19 years and
//                                  older" — it covers every adult.
//   cdcChildSpecialSituations 1,584 cited ON PURPOSE on a healthy child's card,
//                                  to say what the patient does NOT have.
//   pedsRoutine4Dose            976 printed under "Routine vaccination", but
//                                  CDC's at-risk rows start at "Age 2-5
//                                  years", so the routine infant series is an
//                                  at-risk baby's series too.
//
// So `population` is a judgement about SCOPE, declared per source with its
// reason, and the handful of deliberate cross-references are marked at the ONE
// call site each, with the reason written there — visible, countable, and
// asserted below so a new one cannot be added quietly.
//
// THE FOUR THIS CAUGHT. Each is the right advice quoting the wrong instance,
// and in every case CDC prints the patient's own sentence a few lines away:
//
//   adultPpsvOnly        -> 19-49 adults   230 showings
//   pedsRisk6to18NoPcv   -> IC children    198
//   adultBothNotAt65     -> 19-49 adults   190
//   pedsRiskPcv20orPpsv23-> IC children     24
//
// The last is the one that matters clinically: the IC twin of that sentence
// continues "If PPSV23 is used, administer 1 dose of PCV20 or dose 2 PPSV23 at
// least 5 years after dose 1 PPSV23", and the non-IC one simply stops. An
// immunocompromised child was being shown the sentence that omits the dose
// their own row owes them.
//
// SOURCES. All three new quotes read live 2026-10-17 with the accordions
// expanded, and counted rather than merely found: each appears EXACTLY ONCE,
// in the block claimed. Adult notes 4,785 chars with "Special situations" at
// offset 1,764; child notes 5,021 chars with "cochlear" present and both
// at-risk block headers at offsets 398 and 1,972 — the positive controls that
// both halves were in the text being searched.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { REFS, cite, POPULATIONS } from '../../data/refs.js';
import { populationOf } from '../../data/riskFactors.js';
import { buildCases } from '../../test-grid.js';
import { ADULT_SCHED_MIN_M, ROUTINE_ADULT_MIN_M } from '../scheduleConstants.js';

const TODAY = '2026-10-11';
const quotedKeys = Object.keys(REFS).filter((k) => REFS[k].quote);

describe('the field itself', () => {
  it('every quoted source declares the patients its sentence is about', () => {
    const missing = quotedKeys.filter((k) => !Array.isArray(REFS[k].population) || REFS[k].population.length === 0);
    expect(missing).toEqual([]);
  });

  it('every declared value is one of the five patient groups', () => {
    const bad = [];
    for (const k of quotedKeys) {
      for (const p of REFS[k].population) if (!POPULATIONS.includes(p)) bad.push(`${k} → ${p}`);
    }
    expect(bad).toEqual([]);
  });

  it('a quote-free source declares none — a document has no patient', () => {
    // These are the grey chips at the foot of a card: a whole document, not a
    // sentence. `rulebook` is what governs those, and it already does.
    const wrong = Object.keys(REFS).filter((k) => !REFS[k].quote && REFS[k].population);
    expect(wrong).toEqual([]);
  });

  it('only these sources span more than one patient group, and each says why', () => {
    // THE ONE WAY TO SILENCE THIS GUARD QUIETLY, found by mutation-testing it:
    // instead of quoting the patient's own sentence, widen the source's scope
    // until the wrong quote becomes legal. Reverting the 19-49 PPSV23 fix AND
    // widening `adultPpsvOnly` to both adult groups left the sweep green — only
    // the two specific assertions caught it, and a source with no specific test
    // would have slipped through entirely.
    //
    // So the set of sources claiming more than one group is pinned. Widening
    // any other source now fails here, and widening one of these is a visible,
    // reviewable edit to this list. A test cannot re-read cdc.gov, so a SCOPE
    // claim is ultimately a human judgement — this is what makes changing one
    // impossible to do by accident.
    const spanning = quotedKeys.filter((k) => REFS[k].population.length > 1).sort();
    expect(spanning).toEqual([
      'adultPcv13Only',           // printed identically in both adult blocks
      'adultPcv15ThenPpsv',       // printed identically in both adult blocks
      'adultPcv20or21Complete',   // its own words: "Adults aged 19 years and older"
      'adultPcv7Only',            // printed identically in both adult blocks
      'immPCV7',                  // "older teen or adult ... at increased risk"
      // C8, document 2's CITEs (2026-10-17). Both are FOOTNOTES printed on all
      // four pages of the Adult Timing Job Aid — against every "None*" row and
      // every "PPSV23\u00b6" cell respectively — so they speak to every adult the
      // document covers, at both age bands. Checked page by page, not inferred:
      // the job aid's page-specific sentences (the two "complete"/"review at
      // 50" rows and the 8-week option) are each pinned to ONE group above,
      // because this document says different things on different pages.
      'jobAidPcv7CountsAsNone',   // footnote * on pp.1-4, against every "None*" row
      'jobAidPpsv23Unavailable',  // footnote pilcrow on pp.1-4, against every PPSV23 cell
      // C8, document 1's CITEs (2026-10-17). mm7401a1's table splits into
      // three blocks and most of its rows are pinned to ONE group above --
      // these two are not. `mmwrNoneOrPcv7Only` is the "None or PCV7 only at
      // any age" row, which the >=50 block and the 19-49 CHRONIC block print
      // word for word identically (the 19-49 IMMUNOCOMPROMISING version says
      // >=8 weeks instead and is `adultPcv15ThenPpsvShort`, pinned to one
      // group). `mmwrPcv13NoPpsv23ToComplete` is body prose, not a table row
      // at all, and names its own scope: "adults aged >=19 years".
      'mmwrNoneOrPcv7Only',       // the same row, verbatim, in the >=50 and 19-49 chronic blocks
      'mmwrPcv13NoPpsv23ToComplete', // its own words: "adults aged >=19 years"
      // FINDING F (2026-10-18). mm7401a1's "PPSV23 only" row is printed in
      // ALL THREE blocks -- >=50, 19-49 immunocompromising and 19-49 chronic
      // -- character for character identical, products and interval alike.
      // Checked row by row against the live page and the article PDF, not
      // inferred from one block. Its twin `mmwrSharedDecision65` is pinned to
      // one group above, because that row exists only in the >=50 block.
      // 2026-10-18, the job aid's cell-only statements. mm7401a1's "PCV13
      // only" row is word for word identical in the >=50 and 19-49 CHRONIC
      // blocks. The 19-49 immunocompromising version inserts "administered"
      // and is `mmwrPcv13OnlyThenPcv1949Ic`, pinned to one group -- a
      // separate entry rather than a widened population, which is the whole
      // point of this list.
      'mmwrPcv13OnlyThenPcv',     // the same row, verbatim, in the >=50 and 19-49 chronic blocks
      'mmwrPpsvOnlyThenPcv',      // the same row, verbatim, in all three adult blocks
      'pedsBefore6NoPcv20',       // a heading above BOTH the IC and non-IC sub-blocks
      'pedsMinAge',               // the section heading, above every block
      'pedsRiskIncompleteCatchup',// printed in both at-risk lists
      'pedsRiskPcv13At6',         // printed in both at-risk lists
      'pedsRiskPcv20Complete',    // printed in both at-risk lists
      'pedsRoutine4Dose',         // at-risk rows start at age 2, so it is every baby's series
    ]);
  });

  it('population never contradicts rulebook', () => {
    // A source written for the child schedule cannot be about an adult.
    const bad = [];
    for (const k of quotedKeys) {
      const { rulebook, population } = REFS[k];
      if (rulebook === 'child' && population.some((p) => p.startsWith('adult'))) bad.push(`${k} (child) → ${population}`);
      if (rulebook === 'adult' && population.some((p) => p.startsWith('child'))) bad.push(`${k} (adult) → ${population}`);
    }
    expect(bad).toEqual([]);
  });
});

describe('populationOf — which patient is this card for', () => {
  it('splits children on the immunocompromising list, not on "has any risk"', () => {
    expect(populationOf(60, [])).toBe('child-routine');
    expect(populationOf(60, ['chronic_heart'])).toBe('child-nonIC');
    expect(populationOf(60, ['cochlear_implant'])).toBe('child-nonIC');   // CDC lists it non-IC
    expect(populationOf(60, ['asplenia'])).toBe('child-IC');
    expect(populationOf(60, ['hiv'])).toBe('child-IC');
    // IC wins when both are ticked, exactly as pedsRiskRowClass decides it.
    expect(populationOf(60, ['chronic_heart', 'asplenia'])).toBe('child-IC');
    // An adult-only tick does not make a child "at risk" (P3-9b).
    expect(populationOf(60, ['smoking'])).toBe('child-routine');
  });

  it('splits adults at ROUTINE_ADULT_MIN_M and children at ADULT_SCHED_MIN_M', () => {
    expect(populationOf(ADULT_SCHED_MIN_M - 1, ['asplenia'])).toBe('child-IC');
    expect(populationOf(ADULT_SCHED_MIN_M, ['asplenia'])).toBe('adult-19to49');
    expect(populationOf(ROUTINE_ADULT_MIN_M - 1, [])).toBe('adult-19to49');
    expect(populationOf(ROUTINE_ADULT_MIN_M, [])).toBe('adult-50plus');
    // No second age test anywhere: both boundaries are the constants.
    expect(ADULT_SCHED_MIN_M).toBe(228);
    expect(ROUTINE_ADULT_MIN_M).toBe(600);
  });
});

describe('the four quotes this caught — each card now quotes its own patient', () => {
  const adult = (ageMonths, riskIds, pcvDoses, ppsv23Doses = []) => recommend({
    ageMonths, dob: null, today: TODAY, riskIds, pcvDoses, ppsv23Doses,
  });
  const keysOf = (card) => (card.noteCites ?? []).map((c) => c.key);

  it('a 19-49 adult with PPSV23 only quotes the 19-49 sentence', () => {
    const out = adult(420, ['diabetes'], [], [{ product: 'PPSV23', date: '2016-10-11' }]);
    expect(keysOf(out.recs[0])).toContain('adultPpsvOnly1949');
    expect(keysOf(out.recs[0])).not.toContain('adultPpsvOnly');
  });

  it('...and a 50+ adult still quotes the 50+ one (the control)', () => {
    const out = adult(660, ['diabetes'], [], [{ product: 'PPSV23', date: '2016-10-11' }]);
    expect(keysOf(out.recs[0])).toContain('adultPpsvOnly');
    expect(keysOf(out.recs[0])).not.toContain('adultPpsvOnly1949');
  });

  it('a 19-49 adult with an immunocompromising condition, PCV13 + PPSV23, quotes the 19-49 row', () => {
    const out = adult(420, ['asplenia'],
      [{ product: 'PCV13', date: '2016-10-11' }], [{ product: 'PPSV23', date: '2017-10-11' }]);
    const card = out.recs[0];
    expect(card.doseLabel).toMatch(/≥5 years/);          // advice unchanged
    expect(keysOf(card)).toContain('adultIc1949BothPcv13Ppsv');
    expect(keysOf(card)).not.toContain('adultBothNotAt65');
  });

  it('...and cochlear implant / CSF leak go the same way, since CDC groups them', () => {
    for (const id of ['cochlear_implant', 'csf_leak']) {
      const out = adult(420, [id],
        [{ product: 'PCV13', date: '2016-10-11' }], [{ product: 'PPSV23', date: '2017-10-11' }]);
      expect(keysOf(out.recs[0]), id).toContain('adultIc1949BothPcv13Ppsv');
    }
  });

  it('an immunocompromised 6-18y child with no PCV quotes the IC sentence', () => {
    const out = recommend({
      ageMonths: 120, dob: null, today: TODAY, riskIds: ['asplenia'], pcvDoses: [], ppsv23Doses: [],
    });
    const keys = out.recs.flatMap(keysOf);
    expect(keys).toContain('pedsIc6to18NoPcv');
    expect(keys).not.toContain('pedsRisk6to18NoPcv');
  });

  it('...and a non-immunocompromised child of the same age keeps the non-IC one', () => {
    const out = recommend({
      ageMonths: 120, dob: null, today: TODAY, riskIds: ['chronic_heart'], pcvDoses: [], ppsv23Doses: [],
    });
    const keys = out.recs.flatMap(keysOf);
    expect(keys).toContain('pedsRisk6to18NoPcv');
    expect(keys).not.toContain('pedsIc6to18NoPcv');
  });

  it('the IC twin is the sentence that carries the five-year follow-on', () => {
    expect(REFS.pedsIc6to18NoPcv.quote).toBe(
      'Not previously received any dose of PCV13, PCV15, or PCV20: administer 1 dose of PCV15 or 1 dose of PCV20. If PCV15 is used and no previous receipt of PPSV23, administer 1 dose of PPSV23 at least 8 weeks after the PCV15 dose.',
    );
    // The two differ by one phrase; that is why one key could not serve both.
    expect(REFS.pedsIc6to18NoPcv.quote).not.toBe(REFS.pedsRisk6to18NoPcv.quote);
    expect(REFS.adultPpsvOnly1949.quote).toBe(
      'Previously received only PPSV23: 1 dose PCV15 or 1 dose PCV20 or PCV21, at least 1 year after the last PPSV23 dose. If PCV15 is used, no additional PPSV23 doses are recommended.',
    );
    expect(REFS.adultIc1949BothPcv13Ppsv.quote).toBe(
      'Cochlear implant, cerebrospinal fluid leak, or an immunocompromising condition*: 1 dose PCV20 or 1 dose PCV21 at least 5 years after the last pneumococcal vaccine dose.',
    );
  });
});

describe('the guard — swept over every patient the grid can build', () => {
  const cases = buildCases();

  // Walk the whole engine result, not just rec cards, so a citation hiding in
  // a per-dose note or a geography advisory is swept too.
  function collectCites(node, found) {
    if (node == null || typeof node !== 'object') return found;
    if (Array.isArray(node)) { for (const v of node) collectCites(v, found); return found; }
    if (typeof node.key === 'string' && REFS[node.key]) found.push(node);
    for (const v of Object.values(node)) collectCites(v, found);
    return found;
  }

  it('no card shows a quote to a patient it was not written about', () => {
    const offenders = new Map();
    for (const c of cases) {
      const out = recommend(c.input);
      if (out.excluded) continue;
      const pop = populationOf(c.input.ageMonths, c.input.riskIds);
      for (const cit of collectCites(out, [])) {
        const ref = REFS[cit.key];
        if (!ref.quote) continue;                 // a document, not a sentence
        if (cit.aboutAnotherGroup) continue;      // declared cross-reference
        if (ref.population.includes(pop)) continue;
        const id = `${cit.key} → ${pop}`;
        offenders.set(id, (offenders.get(id) ?? 0) + 1);
      }
    }
    expect([...offenders.entries()].map(([k, n]) => `${k} (${n})`)).toEqual([]);
  });

  it('every cross-reference is declared, with a reason, at exactly the keys expected', () => {
    // If a future change marks a new citation as "about another group", this
    // fails until the key is listed here — the exception stays countable.
    const seen = new Map();
    for (const c of cases) {
      const out = recommend(c.input);
      if (out.excluded) continue;
      for (const cit of collectCites(out, [])) {
        if (!cit.aboutAnotherGroup) continue;
        expect(typeof cit.aboutAnotherGroup, cit.key).toBe('string');
        expect(cit.aboutAnotherGroup.length, cit.key).toBeGreaterThan(20);
        seen.set(cit.key, (seen.get(cit.key) ?? 0) + 1);
      }
    }
    // Four, each for a different reason, all of them a boundary or a negation:
    //   adultRoutine50            "routine begins at 50" told to someone younger
    //   adultBothNotAt65          what this 19-49 patient will be due AT 50
    //   cdcChildSpecialSituations the risk list a healthy child does NOT match
    //   immPCV7                   a rule the owner extended past its source's
    //                             stated scope (2026-10-12), declared rather
    //                             than hidden by widening the source
    expect([...seen.keys()].sort()).toEqual([
      'adultBothNotAt65', 'adultRoutine50', 'cdcChildSpecialSituations', 'immPCV7',
    ]);
  });

  it('the three false alarms stay quiet, because their scope says so', () => {
    // These are the 4,639 showings a provenance-only field would have flagged.
    expect(REFS.adultPcv20or21Complete.population).toEqual(
      expect.arrayContaining(['adult-19to49', 'adult-50plus']),
    );
    expect(REFS.pedsRoutine4Dose.population).toEqual(
      expect.arrayContaining(['child-routine', 'child-nonIC', 'child-IC']),
    );
    // cdcChildSpecialSituations is the opposite case: its scope is narrow and
    // honest, and the healthy-child card declares the cross-reference instead.
    expect(REFS.cdcChildSpecialSituations.population).toEqual(['child-nonIC']);
  });

  it('the guard bites — a quote moved to the wrong patient is caught', () => {
    // Proof by breaking it, rather than trusting a green run: pretend the IC
    // sentence is about non-IC children and the sweep must find the cards.
    const real = REFS.pedsIcPcv20orPpsv23.population;
    REFS.pedsIcPcv20orPpsv23.population = ['child-nonIC'];
    try {
      let caught = 0;
      for (const c of cases) {
        const out = recommend(c.input);
        if (out.excluded) continue;
        const pop = populationOf(c.input.ageMonths, c.input.riskIds);
        for (const cit of collectCites(out, [])) {
          const ref = REFS[cit.key];
          if (!ref.quote || cit.aboutAnotherGroup) continue;
          if (cit.key === 'pedsIcPcv20orPpsv23' && !ref.population.includes(pop)) caught++;
        }
      }
      expect(caught).toBeGreaterThan(0);
    } finally {
      REFS.pedsIcPcv20orPpsv23.population = real;
    }
  });
});

describe('cite() carries the declaration', () => {
  it('a plain cite has no cross-reference flag', () => {
    expect(cite('adultRoutine50').aboutAnotherGroup).toBeUndefined();
  });

  it('a marked cite carries the reason it was given', () => {
    const c = cite('adultRoutine50', { aboutAnotherGroup: 'explains the 50-year boundary to a younger patient' });
    expect(c.aboutAnotherGroup).toMatch(/50-year boundary/);
    expect(c.key).toBe('adultRoutine50');
    expect(c.quote).toBe(REFS.adultRoutine50.quote);
  });
});
