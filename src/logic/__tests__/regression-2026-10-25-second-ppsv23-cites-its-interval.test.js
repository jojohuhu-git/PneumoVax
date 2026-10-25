// ─────────────────────────────────────────────────────────────────────────
// A second adult PPSV23 inside five years credits the document that states
// the five years — and nothing else on that dose credits anybody.
//
// OWNER, 2026-10-25, asked whether rr7203a1 should be cited here: "yes cite
// PPSV23->PPSV23."
//
// WHY THIS NEEDED HER WORD AT ALL. CLAUDE.md and CLINICAL_SPEC.md §K both
// carried, in capitals, "rr7203a1 (2023) is superseded — never cite it for an
// adult interval again" (her own decision of 2026-10-16). That ban was made
// about the adult PCV15->PPSV23 interval, where mm7401a1 (2025) states a
// different, age-split rule. No 2025 document has been shown to state a
// five-year gap between two PPSV23 doses at all, so for THIS interval
// rr7203a1 is the only source — which is why she narrowed the ban rather than
// reversing it. All four documents now say "never for an adult CONJUGATE
// interval".
//
// ── THE SPLIT THIS FILE EXISTS TO HOLD ───────────────────────────────────
//
// Two claims are made about this dose, and only ONE of them is ACIP's:
//
//   "a second PPSV23 is given at least 5 years after the first"  ← rr7203a1
//   "...so this dose does not count and must wait"               ← the OWNER
//
// §K is explicit that the second is a clinical determination of this app and
// that ACIP must never be cited for it ("the INTERVALS are ACIP's; treating
// them as floors is not"). So the marker goes on the interval sentence and
// nowhere else, and the owner sentence in `detail` stays credited to nobody.
// A future session that "tidies" the citation onto the whole verdict would be
// putting ACIP's name on a rule ACIP does not state; this file fails if it
// does.
import { describe, it, expect } from 'vitest';
import { analyzeBoth } from '../validate.js';
import { DOSE_INTERVAL_RULES } from '../doseIntervalRules.js';

const TODAY = '2026-10-25';

// A 60-year-old with no risk factors: PPSV23 on 2024-01-01, a second on
// 2025-01-01 — one year apart, where ACIP states five.
const PATIENT = {
  ageMonths: 729, dob: '1966-10-25', riskIds: [],
  pcvDoses: [], ppsv23Doses: [{ date: '2024-01-01' }, { date: '2025-01-01' }],
  today: TODAY,
};

function secondDose() {
  const r = analyzeBoth(PATIENT);
  return r.ppsv23.perDose[1];
}

describe('the second adult PPSV23 credits rr7203a1 for its interval', () => {
  it('the dose is rejected by the rule this test is about', () => {
    const d = secondDose();
    expect(d.status).toBe('invalid');
    expect(d.intervalRuleId).toBe('ADULT-PPSV23-AFTER-PPSV23');
  });

  it('exactly one citation is attached, and it is the 2023 adult MMWR', () => {
    const d = secondDose();
    expect(d.reasonCites).toHaveLength(1);
    expect(d.reasonCites[0].key).toBe('mmwr7203a1');
    expect(d.reasonCites[0].url).toContain('rr7203a1');
  });

  it('the marker sits on the INTERVAL sentence, not on the rejection', () => {
    const d = secondDose();
    // One "[c]" across the whole reasons array, and it is in the sentence that
    // states the five years.
    const markers = d.reasons.join(' ').match(/\[c\]/g) ?? [];
    expect(markers).toHaveLength(1);
    expect(d.reasons[0]).toContain('at least 5 years after the first.[c]');
    for (const r of d.reasons.slice(1)) expect(r).not.toContain('[c]');
  });

  it('the owner\'s half of the rule still credits nobody', () => {
    const d = secondDose();
    // The sentence that says a short gap VOIDS the dose is hers, and it says
    // so in words. ACIP's name must not reach it.
    expect(d.detail).toContain('owner clinical determination');
    expect(d.detail).not.toContain('[c]');
    expect(d.reasons.find((r) => /does not count/.test(r))).not.toContain('[c]');
  });

  it('one marker per citation — the pairing RecCard relies on', () => {
    const d = secondDose();
    const markers = (d.reasons.join(' ').match(/\[c\]/g) ?? []).length;
    expect(markers).toBe(d.reasonCites.length);
  });

  it('no OTHER floor rule has quietly acquired a citation with it', () => {
    // The mechanism added for this one row is general, so a future row could
    // use it. That is fine — but it must be a deliberate act, not a copy-paste
    // that spreads ACIP's name onto the owner's determinations.
    const withCites = DOSE_INTERVAL_RULES.filter((r) => {
      if (typeof r.message !== 'function' || r.enforcement !== 'floor') return false;
      const src = r.message.toString();
      return src.includes('reasonCites');
    }).map((r) => r.id);
    expect(withCites).toEqual(['ADULT-PPSV23-AFTER-PPSV23']);
  });
});
