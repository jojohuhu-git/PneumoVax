// N6 (owner-reported 2026-10-16) — a card cites the schedule it was written
// from, and never the other one. Plus N5: the risk list stops citing rr7203a1.
//
// WHAT THE OWNER SAW. On a 55-year-old smoker's card, and on a 30-year-old
// with asplenia, the source chips at the foot included **CDC Child/Adolescent
// Notes**. "There also should not be CDC child notes source chips under these
// adult cases." She was right, and it was not a stray four — measured over
// every risk condition through `recommend()` on 2026-10-16:
//
//   13 of 17 risk conditions put a CHILD source on an ADULT card
//   12 of 17 put an ADULT source on a CHILD card
//   HSCT put immunize.org Table 5 — which CLAUDE.md names as the PAEDIATRIC
//     HSCT source, and only that — on an adult's ordinary PCV card
//
// ROOT CAUSE, and why this is the SECOND escape of one bug. `collectRefs()`
// merged every selected risk condition's whole `refs` list into the card. A
// condition that exists at both ages (asplenia, HIV, diabetes…) lists both
// CDC pages, so both landed on whichever card was being built.
//
// P3-9b already fixed this ONE WAY ROUND — and said so in a comment in
// recommend.js: an adult-only tick "cannot drag an adult citation
// (cdcAdultPneumo / mmwr7203a1) into a child's card via collectRefs either."
// That claim was FALSE as measured. P3-9b strips ticks flagged `adultOnly`
// (alcoholism, smoking), which is the right filter for the question it was
// answering — WHICH PATHWAY the patient routes to. It is the wrong filter for
// this question. A condition that exists at every age is not `adultOnly`, so
// nothing stripped it, and 12 child cards kept citing the adult schedule.
//
// THE FIX, and why it is not another filter at the call site. The rulebook a
// source belongs to is a property OF THE SOURCE, so it is declared once on the
// source, in `refs.js`, exactly as `doseIntervalRules.js` declares `rulebook`
// on each rule row. `collectRefs()` then takes the card's rulebook and keeps
// only sources written for it, plus the age-neutral ones. A new ref cannot
// join the map without declaring where it belongs — asserted below.
//
// N5 (OWNER DECISION 2026-10-16, option A). Four conditions — asplenia,
// immunosuppression, alcohol use disorder, cigarette smoking — also carried
// `mmwr7203a1`, the 2023 adult ACIP paper, while the other 13 carried no MMWR
// at all. So the source list at the foot of an adult card changed depending on
// which box was ticked, for no clinical reason: the 2023 paper appeared for a
// smoker and not for HIV.
//
// It was not WRONG — that paper is where the adult risk list came from, and
// mm7401a1 (ACIP, Jan 2025, read live 2026-10-16) says "Recommendations for
// PCVs among adults aged 19-49 years with risk conditions and PCV13-vaccinated
// adults have not changed from previous recommendations", pointing back to it.
// It was INCONSISTENT. The owner chose to drop it from the risk list: every
// adult card already cites the CDC Adult Notes — which enumerate all four by
// name, read live 2026-10-16 — plus the Adult Timing Job Aid and mm7401a1.
// rr7203a1 stays in `refs.js` as the primary-source record, uncited, the same
// way `mmwr7137a3` already is.
import { describe, it, expect } from 'vitest';
import { REFS } from '../refs.js';
import { RISK_FACTORS } from '../riskFactors.js';
import { recommend, collectRefs } from '../../logic/recommend.js';
import { ADULT_SCHED_MIN_M } from '../../logic/scheduleConstants.js';

const TODAY = '2026-10-16';

// Resolve a rendered citation object back to its key. `citations` carries
// resolved objects, so the test reads what the CLINICIAN sees and works back,
// rather than reading the input list and assuming it survived.
const keyOf = (c) => Object.keys(REFS).find((k) => REFS[k].url === c.url && REFS[k].label === c.label);

function citedKeys(ageMonths, riskIds) {
  const out = recommend({ ageMonths, today: TODAY, dob: null, riskIds, pcvDoses: [], ppsv23Doses: [] });
  const keys = new Set();
  for (const r of out.recs ?? []) for (const c of r.citations ?? []) keys.add(keyOf(c));
  for (const r of out.hsct?.recs ?? []) for (const c of r.citations ?? []) keys.add(keyOf(c));
  return [...keys];
}

const rulebookOf = (key) => REFS[key]?.rulebook;

// Ages either side of the one boundary that decides which rulebook applies.
// Two adult ages because 19-49 and 50+ build different cards (S15).
const ADULT_AGES = [360, 660];           // 30y, 55y
const CHILD_AGES = [24, 60, 216];        // 2y, 5y, 18y — 18 routes CHILD (§I)

describe('N6 — every source declares which schedule it belongs to', () => {
  it('every entry in REFS has a rulebook of child, adult or any', () => {
    const missing = Object.keys(REFS).filter((k) => !['child', 'adult', 'any'].includes(rulebookOf(k)));
    expect(missing).toEqual([]);
  });

  it('the boundary is ADULT_SCHED_MIN_M, and 18 is still a CHILD age', () => {
    // §I: a patient of 18 uses the child/adolescent rulebook for routing even
    // though PCV21 is a valid product for them. If this ever flips, the ages
    // above stop testing what they claim to.
    expect(ADULT_SCHED_MIN_M).toBe(228);
    expect(Math.max(...CHILD_AGES)).toBeLessThan(ADULT_SCHED_MIN_M);
    expect(Math.min(...ADULT_AGES)).toBeGreaterThanOrEqual(ADULT_SCHED_MIN_M);
  });
});

describe('N6 — a card never cites the other schedule', () => {
  it('no adult card carries a child source, for any risk condition', () => {
    const offenders = [];
    for (const r of RISK_FACTORS) {
      for (const age of ADULT_AGES) {
        const bad = citedKeys(age, [r.id]).filter((k) => rulebookOf(k) === 'child');
        if (bad.length) offenders.push(`${r.id} @${age}m → ${bad.join(', ')}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('no child card carries an adult source, for any risk condition', () => {
    const offenders = [];
    for (const r of RISK_FACTORS) {
      for (const age of CHILD_AGES) {
        const bad = citedKeys(age, [r.id]).filter((k) => rulebookOf(k) === 'adult');
        if (bad.length) offenders.push(`${r.id} @${age}m → ${bad.join(', ')}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('nor with several conditions ticked at once', () => {
    // The real failure shape: a clinician ticks three boxes, and the union of
    // three refs lists reaches the card.
    const many = RISK_FACTORS.filter((r) => r.class === 'IC' || r.class === 'nonIC').map((r) => r.id);
    expect(citedKeys(660, many).filter((k) => rulebookOf(k) === 'child')).toEqual([]);
    expect(citedKeys(60, many).filter((k) => rulebookOf(k) === 'adult')).toEqual([]);
  });

  it('HSCT: an adult\'s cards never cite the paediatric HSCT table', () => {
    // CLAUDE.md, non-negotiable: peds HSCT is immunize.org p2016 Table 5 ONLY,
    // adult HSCT is its own source. The HSCT ADVISORY block already got this
    // right per age; the leak was into the ordinary PCV card beside it.
    for (const age of ADULT_AGES) {
      expect(citedKeys(age, ['hsct'])).not.toContain('p3086Table5');
    }
    // And the mirror: a child's cards never cite the adult HSCT source.
    for (const age of CHILD_AGES) {
      expect(citedKeys(age, ['hsct'])).not.toContain('fredHutchLTFU');
      expect(citedKeys(age, ['hsct'])).not.toContain('ascoAdultCancer2024');
    }
  });
});

describe('N5 — the adult risk list no longer cites the 2023 paper', () => {
  it('no risk condition lists mmwr7203a1', () => {
    const still = RISK_FACTORS.filter((r) => (r.refs ?? []).includes('mmwr7203a1')).map((r) => r.id);
    expect(still).toEqual([]);
  });

  it('and it reaches no card', () => {
    for (const r of RISK_FACTORS) {
      for (const age of [...ADULT_AGES, ...CHILD_AGES]) {
        expect(citedKeys(age, [r.id])).not.toContain('mmwr7203a1');
      }
    }
  });

  it('the paper itself stays in REFS as the primary-source record', () => {
    // Dropping the citation must not delete the document. It is the paper the
    // adult risk list came from, and mm7401a1 points back to it.
    expect(REFS.mmwr7203a1).toBeTruthy();
    expect(REFS.mmwr7203a1.url).toContain('rr7203a1');
  });
});

describe('N5/N6 — the controls: what every card must STILL cite', () => {
  it('an adult card still cites the adult notes, the job aid and mm7401a1', () => {
    // This is the owner\'s own answer to "both the appropriate MMWR link and
    // CDC adult notes could be cited?" — it was already true, and must remain
    // true after the 2023 paper is removed.
    for (const age of ADULT_AGES) {
      const keys = citedKeys(age, ['smoking', 'asplenia']);
      expect(keys).toContain('cdcAdultPneumo');
      expect(keys).toContain('cdcAdultTimingJobAid');
      expect(keys).toContain('mmwr7401a1');
    }
  });

  it('a child card still cites the child notes and p2016', () => {
    const keys = citedKeys(60, ['asplenia']);
    expect(keys).toContain('cdcChildPneumo');
    expect(keys).toContain('p2016');
  });

  it('an age-neutral source reaches BOTH cards, and a schedule-bound one only its own', () => {
    // Tested against collectRefs directly, not end-to-end, and the reason is
    // written into recommend.js: no risk condition shipping today carries an
    // 'any' source that reaches a card (the only one that lists one is the
    // B-cell/CAR-T exclusion, which builds no card), so the 'any' branch
    // cannot be reached through `recommend()`. Deleting that branch leaves the
    // whole suite green — measured, 1026/1026 — which is exactly the kind of
    // untested branch that becomes a silent bug the day it matters.
    expect(REFS.cdcAlteredImmunocompetence.rulebook).toBe('any');

    const anySource = collectRefs(['bcell_car_t_therapy'], [], 'adult');
    expect(anySource).toContain('cdcAlteredImmunocompetence');
    expect(collectRefs(['bcell_car_t_therapy'], [], 'child')).toContain('cdcAlteredImmunocompetence');

    // And the filter still bites on a schedule-bound source either way round.
    expect(collectRefs(['asplenia'], [], 'adult')).not.toContain('cdcChildPneumo');
    expect(collectRefs(['asplenia'], [], 'child')).toContain('cdcChildPneumo');
    expect(collectRefs(['asplenia'], [], 'child')).not.toContain('cdcAdultPneumo');
  });

  it('a card\'s OWN defaults are never filtered', () => {
    // The defaults are the card author's deliberate choice. Filtering them
    // would let this guard quietly delete a source a card asked for.
    expect(collectRefs([], ['cdcChildPneumo', 'p2016'], 'adult'))
      .toEqual(['cdcChildPneumo', 'p2016']);
  });

  it('a no-risk patient\'s card is unchanged at both ages', () => {
    expect(citedKeys(660, [])).toContain('cdcAdultPneumo');
    expect(citedKeys(60, [])).toContain('cdcChildPneumo');
    expect(citedKeys(660, [])).not.toContain('cdcChildPneumo');
  });
});
