// P3-9b / peds audit P0-3 (S10b, 2026-10-10) — an adult-only risk condition
// must not put a child on the at-risk paediatric pathway.
//
// `smoking` ("Cigarette smoking") and `alcoholism` ("Alcohol use disorder") are
// both marked `adultOnly: true` in riskFactors.js and both cite ADULT sources
// only. But they also carry `class: 'nonIC'`, and `pedsRiskRowClass` returned
// 'nonIC' for ANY nonIC tick, so recommend.js routed a 2–18y patient to the
// at-risk child pathway whenever one of them was ticked.
//
// REPRODUCED before the fix (2026-10-10, ageMonths 180 = 15y, no doses):
//   riskIds ['smoking']    → "Option A: 1 dose PCV20 (>=8 weeks)" + Option B-1
//                             + Option B-2, i.e. byte-identical to ['diabetes']
//   riskIds []             → "Not indicated (healthy 5-18y)"
// A 15-year-old smoker was given a three-option at-risk catch-up regimen.
//
// Why it is reachable today, not latent: the `adultOnly` gate in StepRisks.jsx
// filters which checkboxes RENDER; it never clears a risk id already in state,
// and App.jsx does not prune riskIds when the age changes. Enter 25y, tick
// "Cigarette smoking", go Back, change the age to 15y — the checkbox
// disappears, the tick survives, and the child gets the at-risk regimen.
//
// CLINICAL SOURCES — fetched live 2026-10-10 (S10b), not ported from memory:
//
// 1. CDC Child & Adolescent Immunization Schedule Notes, "Pneumococcal
//    vaccination / Special situations". Its two risk lists are CDC's COMPLETE
//    paediatric enumeration, quoted verbatim:
//      non-IC: "Children and adolescents with cerebrospinal fluid leak; chronic
//        heart disease; chronic kidney disease (excluding maintenance dialysis
//        and nephrotic syndrome); chronic liver disease; chronic lung disease
//        (including moderate persistent or severe persistent asthma); cochlear
//        implant; or diabetes mellitus"
//      IC: "Children and adolescents on maintenance dialysis, or with
//        immunocompromising conditions such as nephrotic syndrome; congenital
//        or acquired asplenia or splenic dysfunction; congenital or acquired
//        immunodeficiencies; diseases and conditions treated with
//        immunosuppressive drugs or radiation therapy, including malignant
//        neoplasms, leukemias, lymphomas, Hodgkin disease, and solid organ
//        transplant; HIV infection; or sickle cell disease or other
//        hemoglobinopathies"
//    Neither smoking nor alcohol appears. Measured on the fully-expanded page:
//    0 matches for /smok|alcohol|cigarette/i in 60,435 characters, while
//    "cochlear" and "diabetes" each matched — so the absence is real, not an
//    artifact of a collapsed accordion section.
//    https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html#note-pneumo
//
// 2. immunize.org p2016 Table 3, "Risk conditions for which additional doses of
//    PCV15, PCV20, or pneumococcal polysaccharide (PPSV23) vaccines are
//    indicated for children age 24 months through 18 years" — its complete
//    non-IC / IC grid likewise contains no smoking and no alcohol (0 matches
//    for the same pattern across the whole 2-page PDF).
//    https://www.immunize.org/wp-content/uploads/catg.d/p2016.pdf
//
// 3. The counterpart claim, so these two risks keep working for ADULTS: CDC
//    Adult Immunization Schedule Notes lists them verbatim as adult risk
//    factors — "Alcoholism, chronic heart/liver/lung disease, cigarette
//    smoking, or diabetes mellitus: no additional PCV or PPSV23 doses
//    recommended at this time. Review pneumococcal recommendations when age 50
//    years or older." (This also closes the gap S1's audit flagged: S1 never
//    fetched the adult page, so P0-3 rested only on the paediatric lists.)
//    https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo
//
// AAP tiebreak (CLAUDE.md authority rule): no AAP page enumerating paediatric
// pneumococcal risk conditions was reachable (aap.org's pneumococcal page 404s),
// so AAP is silent on this mechanic and CDC stands. There is no sign of
// disagreement: the currently-posted July 2, 2025 schedule is the one AAP
// litigated to restore in AAP et al. v. Kennedy, per the banner on CDC's own
// page.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import {
  pedsRiskRowClass,
  pedsRiskIds,
  hasAnyRisk,
  hasNonIC,
  hasIC,
  hasSpecial,
  adultPpsvShorterMinimumApplies,
  RISK_BY_ID,
} from '../../data/riskFactors.js';

const ADULT_ONLY = ['smoking', 'alcoholism'];
const TODAY = '2026-10-10';
const y = (years) => years * 12;

const labels = (riskIds, ageMonths) =>
  recommend({ ageMonths, riskIds, doses: [], today: TODAY }).recs.map((r) => r.doseLabel);

describe('P3-9b — the data file still knows which risks are adult-only', () => {
  it('marks smoking and alcohol use disorder adultOnly, citing adult sources only', () => {
    for (const id of ADULT_ONLY) {
      expect(RISK_BY_ID[id].adultOnly).toBe(true);
      // P3-9's RiskAgeNote needs this flag to survive; the guard must not
      // "fix" the problem by deleting the thing the note depends on.
      expect(RISK_BY_ID[id].refs).not.toContain('cdcChildPneumo');
    }
  });
});

describe('P3-9b — an adult-only risk does not create a paediatric at-risk row', () => {
  it.each(ADULT_ONLY)('pedsRiskRowClass([%s]) is null', (id) => {
    expect(pedsRiskRowClass([id])).toBeNull();
  });

  it('is null for both adult-only risks together', () => {
    expect(pedsRiskRowClass(ADULT_ONLY)).toBeNull();
  });

  it('strips only the adult-only ids, via one named peds filter', () => {
    expect(pedsRiskIds(ADULT_ONLY)).toEqual([]);
    expect(pedsRiskIds(['smoking', 'diabetes'])).toEqual(['diabetes']);
    expect(pedsRiskIds(['diabetes'])).toEqual(['diabetes']);
    expect(pedsRiskIds([])).toEqual([]);
    // A non-adult-only id survives the filter: `asplenia` here, because the
    // id that used to make this point (`hsct`) was merged into
    // `hct_cart_bcell_exclude` on 2026-10-16, and that row never reaches this
    // filter at all — it hard-stops the engine first.
    expect(pedsRiskIds(['asplenia', 'smoking'])).toEqual(['asplenia']);
  });

  it('does NOT narrow the shared helpers, which the adult pathway depends on', () => {
    // P3-9b says to check hasAnyRisk / hasNonIC for the same hole. They do not
    // have it: both are called only from pcvAdult, where smoking and alcohol
    // use disorder are GENUINE non-IC risk factors per CDC's adult notes.
    // hasAnyRisk in particular gates `if (!isOlderAdult && !anyRisk)` — the
    // test that decides whether a 19-49 adult gets a recommendation at all.
    // Narrowing it to fix the paediatric row would have silently withdrawn the
    // recommendation from every adult smoker. The guard is peds-scoped instead.
    expect(hasAnyRisk(ADULT_ONLY)).toBe(true);
    expect(hasNonIC(ADULT_ONLY)).toBe(true);
  });

  it('still returns a row when a genuine paediatric risk is also ticked', () => {
    // The guard must drop the adult-only tick, not the whole selection.
    expect(pedsRiskRowClass(['smoking', 'diabetes'])).toBe('nonIC');
    expect(pedsRiskRowClass(['smoking', 'hiv'])).toBe('IC');
    expect(pedsRiskRowClass(['alcoholism', 'cochlear_implant'])).toBe('nonIC');
    expect(hasAnyRisk(['smoking', 'diabetes'])).toBe(true);
  });

  it('leaves every genuine paediatric risk class untouched', () => {
    // CDC's two paediatric lists, quoted in the header, mapped to app ids.
    expect(pedsRiskRowClass(['csf_leak'])).toBe('nonIC');
    expect(pedsRiskRowClass(['chronic_heart'])).toBe('nonIC');
    expect(pedsRiskRowClass(['chronic_lung'])).toBe('nonIC');
    expect(pedsRiskRowClass(['chronic_liver'])).toBe('nonIC');
    expect(pedsRiskRowClass(['diabetes'])).toBe('nonIC');
    expect(pedsRiskRowClass(['ckd_chronic'])).toBe('nonIC');
    expect(pedsRiskRowClass(['cochlear_implant'])).toBe('nonIC');
    expect(pedsRiskRowClass(['asplenia'])).toBe('IC');
    expect(pedsRiskRowClass(['hiv'])).toBe('IC');
    expect(pedsRiskRowClass(['ckd_advanced'])).toBe('IC');
    expect(pedsRiskRowClass(['immunodeficiency'])).toBe('IC');
    expect(pedsRiskRowClass(['immunosuppression'])).toBe('IC');
    expect(pedsRiskRowClass(['solid_organ_transplant'])).toBe('IC');
  });
});

describe('P3-9b — the engine gives a child with an adult-only risk the healthy answer', () => {
  it('a 15-year-old whose only tick is smoking is not caught up (the P0)', () => {
    const healthy = labels([], y(15));
    expect(healthy).toEqual(['Not indicated (healthy 5–18y)']);
    // Pre-fix this was ['Option A: 1 dose PCV20 (≥8 weeks)', 'Option B-1: …',
    // 'Option B-2: …'] — identical to the diabetes answer below.
    expect(labels(['smoking'], y(15))).toEqual(healthy);
    expect(labels(['alcoholism'], y(15))).toEqual(healthy);
    expect(labels(ADULT_ONLY, y(15))).toEqual(healthy);
  });

  it('a 15-year-old with a real paediatric risk is still caught up', () => {
    const atRisk = labels(['diabetes'], y(15));
    expect(atRisk.length).toBeGreaterThan(1);
    expect(atRisk[0]).toContain('PCV20');
    // And the adult-only tick neither adds to nor subtracts from that answer.
    expect(labels(['diabetes', 'smoking'], y(15))).toEqual(atRisk);
  });

  it('holds across the paediatric age range, not just at 15', () => {
    for (const age of [y(2), y(5), y(6), y(10), y(18)]) {
      expect(labels(['smoking'], age)).toEqual(labels([], age));
    }
  });

  it('does not change the infant pathway, which takes no risk factors at all', () => {
    for (const age of [2, 7, 12, 23]) {
      expect(labels(['smoking'], age)).toEqual(labels([], age));
    }
  });
});

describe('P3-9b — adults are untouched; smoking is a real adult indication', () => {
  it('a 25-year-old whose only tick is smoking still gets a recommendation', () => {
    // CDC adult notes list cigarette smoking and alcoholism as adult risk
    // factors (quote 3 in the header). Guarding the PAEDIATRIC row must not
    // silently withdraw the adult one.
    const adult = labels(['smoking'], y(25));
    expect(adult.length).toBeGreaterThan(0);
    expect(adult).not.toEqual(labels([], y(25)));
  });

  it('the adult interval predicates are unaffected either way', () => {
    // A-P1-1's predicate answers the interval question only; smoking is nonIC,
    // so it was never IC/special and must not become so.
    expect(hasIC(['smoking'])).toBe(false);
    expect(hasSpecial(['smoking'])).toBe(false);
    expect(adultPpsvShorterMinimumApplies(['smoking'])).toBe(false);
    expect(adultPpsvShorterMinimumApplies(['smoking', 'hiv'])).toBe(true);
  });
});
