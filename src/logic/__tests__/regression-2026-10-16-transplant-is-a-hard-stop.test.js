// Transplant becomes a hard stop (OWNER DECISION 2026-10-16) — ticking the
// transplant box now stops the tool instead of printing a dose recipe.
//
// WHAT CHANGED. Until today, ticking transplant gave the clinician MORE advice,
// not less: a red advisory banner carrying a full four-dose recipe ("4 doses of
// PCV20, beginning 3-6 months after HSCT..."), AND the ordinary age/history
// schedule folded into a collapsed section below it. Now the transplant tick
// shares the existing hard stop with CAR-T / B-cell malignancy / B-cell-
// depleting therapy: no cards, no banner, no collapsed schedule.
//
// WHY. Not because the advice was low value — because it could not be kept
// true. The git history, not anyone's opinion, is the evidence: MeningoVax's
// equivalent advisory was corrected FOUR times in about five weeks (ba255ef,
// a0106f4, 03c8387, f32692e), each time having shipped a wrong clinical
// statement to a clinician-facing screen. PneumoVax needed two repairs to one
// broken citation link (3a59127, 3145db2) and then a whole-source replacement
// (077f01d, Fred Hutch -> ASCO) that was still only half-applied 32 days
// later: the code gave ASCO's series while CLAUDE.md, CLINICAL_SPEC.md and the
// checkbox's own citation chip all still said Fred Hutch. Post-transplant
// vaccination is genuinely contested between sources and it changes; wrong
// advice on a clinical screen is worse than no advice.
//
// WHAT THE STOP DELIBERATELY HIDES. Everything — including a recommendation a
// DIFFERENT ticked risk factor would produce on its own (decision 2, which
// retires the 2026-09-19 C2-6 fix), and including the ordinary age-based
// schedule this patient would get if the box were unticked. The screen says the
// recorded doses are kept but not evaluated; it does not grade them.
//
// Full plan, with all six owner decisions:
// docs/archive/plan-2026-10-16-transplant-hard-stop-both-apps.md
// The deleted schedules, verbatim with their citations:
// docs/archive/retired-2026-10-16-post-transplant-pneumococcal-schedules.md

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { hasExclusion } from '../../data/riskFactors.js';

const TODAY = '2026-10-16';

describe('2026-10-16 — the transplant tick is a hard stop, not an advisory', () => {
  // The two ages matter because the deleted advisory had a different branch
  // for each: a peds row citing immunize.org p2016 Table 5 and an adult row
  // citing ASCO. Both collapse into the same stop.
  const PATIENTS = [
    ['a child of 10', { ageMonths: 120 }],
    ['an adult of 33', { ageMonths: 400 }],
  ];

  it.each(PATIENTS)('%s with no risk factors still gets ordinary cards', (_label, patient) => {
    const r = recommend({ ...patient, riskIds: [], pcvDoses: [], ppsv23Doses: [], today: TODAY });
    // The control case: proof the stop below is the transplant tick doing it,
    // not a patient who was never getting a recommendation anyway.
    expect(r.excluded).toBeFalsy();
    expect(r.recs.length).toBeGreaterThan(0);
  });

  it.each(PATIENTS)('%s with the transplant tick gets the stop and no cards', (_label, patient) => {
    const r = recommend({ ...patient, riskIds: ['hsct'], pcvDoses: [], ppsv23Doses: [], today: TODAY });
    expect(r.excluded).toBe(true);
    expect(r.recs).toEqual([]);
    // Matched loosely on purpose — the whole string is frozen byte-for-byte
    // against MeningoVax's copy by the mirror test, which is where a wording
    // change should be caught. The non-breaking hyphen after "transplant" is
    // why this is a `.` and not a literal "-".
    expect(r.exclusionMessage).toMatch(/transplant. or therapy.specific protocol/);
    // One citation chip, the CDC altered-immunocompetence page (decision 6:
    // the authorities are named in words, not linked).
    expect(r.exclusionCitations.map((c) => c.short || c.label)).toHaveLength(1);
  });

  it('the advisory block is gone from the result shape entirely', () => {
    const r = recommend({ ageMonths: 400, riskIds: ['hsct'], pcvDoses: [], ppsv23Doses: [], today: TODAY });
    // Not `null` — absent. A consumer that still reads `result.hsct` should
    // fail loudly in review, not read a quiet `null` forever.
    expect('hsct' in r).toBe(false);
  });

  it('hasExclusion() reads the `exclude` flag, so one flag has one meaning', () => {
    // Before today `hasExclusion()` tested `class === 'exclude'` while the
    // red checkbox styling tested `exclude: true` — two flags for one idea,
    // and the transplant row is now the second row to carry it.
    expect(hasExclusion(['hsct'])).toBe(true);
    expect(hasExclusion(['bcell_car_t_therapy'])).toBe(true);
    expect(hasExclusion(['asplenia'])).toBe(false);
    expect(hasExclusion([])).toBe(false);
  });

  // Decision 2, stated as a test: the stop wins over a risk factor that would
  // have produced a card on its own. This is the one most likely to surprise
  // someone later, because the 2026-09-19 C2-6 fix decided the opposite.
  it('a ticked risk factor that would give its own card is hidden too', () => {
    const withRisk = recommend({
      ageMonths: 400, riskIds: ['asplenia'], pcvDoses: [], ppsv23Doses: [], today: TODAY,
    });
    expect(withRisk.recs.length).toBeGreaterThan(0);

    const stopped = recommend({
      ageMonths: 400, riskIds: ['asplenia', 'hsct'], pcvDoses: [], ppsv23Doses: [], today: TODAY,
    });
    expect(stopped.excluded).toBe(true);
    expect(stopped.recs).toEqual([]);
  });

  // Recorded doses are kept in memory and not graded. The engine's contract for
  // that is the empty-but-iterable shape the hard stop has returned since P6-5
  // and P0 — arrays, never `{}` — so a caller reading verdicts beside doses
  // does not have to special-case this patient.
  it('typed doses are not graded, and the verdict shape stays iterable', () => {
    const r = recommend({
      ageMonths: 400,
      riskIds: ['hsct'],
      pcvDoses: [{ product: 'PCV13', date: '2020-01-15' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2021-03-20' }],
      today: TODAY,
    });
    expect(r.excluded).toBe(true);
    expect(r.perDose.pcv).toEqual([]);
    expect(r.perDose.ppsv23).toEqual([]);
    expect(r.orderedDoses.pcv).toEqual([]);
    expect(r.orderedDoses.ppsv23).toEqual([]);
    expect(r.meta.pcvCount).toBe(0);
    expect(r.meta.ppsv23Count).toBe(0);
  });
});
