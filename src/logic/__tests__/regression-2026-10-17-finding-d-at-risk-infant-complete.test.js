// FINDING D + E (2026-10-17) — the "series complete" card for a baby with a
// risk condition, which quoted a sentence about children who have none, and
// said nothing about the dose that falls due on the child's second birthday.
//
// FINDING D, what the clinician saw. A 15-month-old with asplenia whose PCV
// series is finished gets:
//
//     PCV series complete (4 doses)
//     The age-appropriate PCV series appears complete [1]
//
// and [1] hovered, verbatim:
//
//     "For children WITHOUT RISK CONDITIONS, PCV20 is not indicated if they
//      have received 4 doses of PCV13 or PCV15 or another age appropriate
//      complete PCV series."
//
// The quote's own words exclude the patient it is shown to. `pcvInfant()` did
// not receive `riskIds` at all, so the under-2 pathway could not tell a baby
// with asplenia from a healthy one, and both got the healthy child's sentence.
//
// FINDING E, found while fixing D. CDC's at-risk rows start at "Age 2-5
// years", so an at-risk baby whose series is complete today is genuinely
// complete today — and owes a further dose the day they turn 2:
//
//     "Completed recommended PCV series but have not received PPSV23 /
//      Not previously received PCV20: administer 1 dose PCV20 or 1 dose
//      PPSV23 ... at least 8 weeks after the most recent PCV dose."
//
// The engine gives that dose correctly at 24 months. At 15 months it said
// nothing, so a clinician reading "complete" had no reason to re-check. The
// app already does this for adults — "No dose now, review at age 50" — and
// this is the paediatric mirror of it. OWNER DECISION 2026-10-17: say it.
//
// SOURCES, read live 2026-10-17 (browser pane, accordions expanded;
// pneumococcal note 5,021 chars, "cochlear" present, both block headers found
// at offsets 398 and 1,972 as the positive control). Occurrence-counted, not
// just found: the non-IC sentence appears ONCE in the non-IC block, and the IC
// sentence TWICE, both in the IC block. CDC's own non-IC wording repeats the
// word "administer"; it is quoted exactly as printed, typo included.
//
// WHY NO SWEEP SAW IT. `GRID_PCV_HISTORIES`' only completed infant series is
// four doses of PCV20 — a child who needs nothing further at 2 either way. So
// all 32 at-risk infants the grid could reach were right by luck, and the case
// that matters (a finished PCV13 series) was not in the grid at all. A history
// for it is added in the same commit.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { REFS } from '../../data/refs.js';
import { buildCases } from '../../test-grid.js';
import { pedsRiskRowClass } from '../../data/riskFactors.js';

const TODAY = '2026-10-11';

// A finished four-dose infant series at 2, 4, 6 and 12 months, for a child who
// is 15 months old today. Synthetic; no real patient data.
const fourDoses = (product) => [
  { product, date: '2025-09-11' },
  { product, date: '2025-11-11' },
  { product, date: '2026-01-11' },
  { product, date: '2026-08-11' },
];

const infant = (riskIds, product = 'PCV13') => recommend({
  ageMonths: 15,
  dob: '2025-07-11',
  today: TODAY,
  riskIds,
  pcvDoses: fourDoses(product),
  ppsv23Doses: [],
});

const completeCard = (out) => (out.recs ?? []).find((r) => r.status === 'complete');
const citeKeys = (card) => (card.noteCites ?? []).map((c) => c.key);
const allText = (card) => [
  card.doseLabel,
  typeof card.note === 'string' ? card.note : `${card.note.lead} ${card.note.detail ?? ''}`,
].join(' ');

describe('FINDING D — an at-risk baby is never shown the "without risk conditions" sentence', () => {
  it('reproduces on the immunocompromising side', () => {
    const card = completeCard(infant(['asplenia']));
    expect(card).toBeTruthy();
    expect(citeKeys(card)).not.toContain('pedsNoPcv20IfComplete');
    for (const c of card.noteCites) {
      expect(c.quote ?? '').not.toMatch(/without risk conditions/i);
    }
  });

  it('reproduces on the non-immunocompromising side too', () => {
    const card = completeCard(infant(['chronic_heart']));
    expect(citeKeys(card)).not.toContain('pedsNoPcv20IfComplete');
    for (const c of card.noteCites) {
      expect(c.quote ?? '').not.toMatch(/without risk conditions/i);
    }
  });

  it('the healthy baby keeps the sentence that was written about them', () => {
    // The control. That quote is not wrong — it was on the wrong card.
    const card = completeCard(infant([]));
    expect(citeKeys(card)).toContain('pedsNoPcv20IfComplete');
    expect(allText(card)).not.toMatch(/age 2|second birthday/i);
  });

  it('each side is cited to the sentence printed in its own CDC block', () => {
    // Which key holds which sentence was measured from the live page against
    // the STORED strings, not against strings typed from the page's structure:
    // `pedsRiskPcv20orPpsv23` turned out to hold the NON-IC sentence (CDC
    // repeats the word "administer" there, and that typo is the tell), so the
    // IC sentence had no key at all and IC children were quoted the non-IC one.
    expect(citeKeys(completeCard(infant(['asplenia'])))).toContain('pedsIcPcv20orPpsv23');
    expect(citeKeys(completeCard(infant(['chronic_heart'])))).toContain('pedsRiskPcv20orPpsv23');
  });

  it('the two sentences are stored verbatim, and they are not the same sentence', () => {
    // IC: ends at the 8 weeks, then adds the five-year follow-on.
    expect(REFS.pedsIcPcv20orPpsv23.quote).toBe(
      'Not previously received PCV20: administer 1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after the most recent PCV dose. If PPSV23 is used, administer 1 dose of PCV20 or dose 2 PPSV23 at least 5 years after dose 1 PPSV23',
    );
    // Non-IC: CDC's own repeated "administer", quoted as printed, and NO tail.
    expect(REFS.pedsRiskPcv20orPpsv23.quote).toBe(
      'Not previously received PCV20: administer 1 dose PCV20 or 1 dose PPSV23 administer at least 8 weeks after the most recent PCV dose.',
    );
    expect(REFS.pedsIcPcv20orPpsv23.rulebook).toBe('child');
    expect(REFS.pedsIcPcv20orPpsv23.quote).not.toBe(REFS.pedsRiskPcv20orPpsv23.quote);
    // The difference that matters clinically: only the IC sentence carries the
    // five-year follow-on dose.
    expect(REFS.pedsIcPcv20orPpsv23.quote).toMatch(/5 years after dose 1 PPSV23/);
    expect(REFS.pedsRiskPcv20orPpsv23.quote).not.toMatch(/5 years/);
  });
});

describe('FINDING E — the card says what falls due at age 2', () => {
  it('an at-risk baby with no PCV20 is told a dose is due at age 2', () => {
    for (const risk of ['asplenia', 'hiv', 'chronic_heart', 'diabetes', 'cochlear_implant']) {
      const card = completeCard(infant([risk]));
      expect(card, risk).toBeTruthy();
      expect(allText(card), risk).toMatch(/age 2 years/);
      expect(allText(card), risk).toMatch(/PCV20.*PPSV23/);
    }
  });

  it('the same for a finished PCV15 series — the rule is "no PCV20", not "no PCV13"', () => {
    const card = completeCard(infant(['asplenia'], 'PCV15'));
    expect(allText(card)).toMatch(/age 2 years/);
  });

  it('an at-risk baby whose series INCLUDES PCV20 is told the opposite, and why', () => {
    const card = completeCard(infant(['asplenia'], 'PCV20'));
    expect(allText(card)).toMatch(/includes PCV20/);
    expect(allText(card)).not.toMatch(/is due/);
    expect(citeKeys(card)).toContain('pedsRiskPcv20Complete');
  });

  it('the promise is kept: the same child at 24 months is actually offered that dose', () => {
    // Ties the foreshadow to the engine's own later answer, so the two cannot
    // drift apart silently.
    const at24 = recommend({
      ageMonths: 24,
      dob: '2024-10-11',
      today: TODAY,
      riskIds: ['asplenia'],
      pcvDoses: fourDoses('PCV13'),
      ppsv23Doses: [],
    });
    const offered = (at24.recs ?? []).map((r) => r.doseLabel).join(' | ');
    expect(offered).toMatch(/PCV20/);
    expect(offered).toMatch(/PPSV23/);
    expect(completeCard(at24)).toBeUndefined();
  });

  it('the status is still "complete" — this changes what the card says, not the verdict', () => {
    const card = completeCard(infant(['asplenia']));
    expect(card.status).toBe('complete');
    expect(card.dueToday).toBeFalsy();
    expect(card.brands ?? []).toEqual([]);
  });
});

describe('FINDING D — swept over the whole grid', () => {
  const cases = buildCases();

  it('no child with a risk condition anywhere carries the healthy-child sentence', () => {
    // Scoped by `pedsRiskRowClass`, not by "any tick": a child whose only tick
    // is an adult-only one (smoking, alcohol use disorder) routes as HEALTHY
    // by P3-9b, and the healthy child's sentence is the right one for them.
    // Using "any tick" here flagged 8 such children as offenders, which would
    // have been a false alarm written into a guard.
    const offenders = [];
    for (const c of cases) {
      const out = recommend(c.input);
      if (out.excluded) continue;
      if (c.input.ageMonths >= 228) continue;
      if (!pedsRiskRowClass(c.input.riskIds)) continue;
      for (const r of out.recs ?? []) {
        if ((r.noteCites ?? []).some((x) => x.key === 'pedsNoPcv20IfComplete')) {
          offenders.push(`${c.key}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the grid now contains a finished non-PCV20 infant series, so this class is reachable', () => {
    // The blind spot FINDING E was hiding in. If this history is ever removed,
    // the sweep above goes quiet instead of going red.
    const reached = cases.some((c) => c.input.ageMonths < 24
      && pedsRiskRowClass(c.input.riskIds)
      && c.input.pcvDoses.length >= 4
      && !c.input.pcvDoses.some((d) => d.product === 'PCV20'));
    expect(reached).toBe(true);
  });
});
