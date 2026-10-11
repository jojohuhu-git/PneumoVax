import { RISK_FACTORS, RISK_BY_ID } from '../data/riskFactors.js';
import { cite } from '../data/refs.js';
import { ADULT_SCHED_MIN_M } from './scheduleConstants.js';

/**
 * P3-9, UI half (S13, 2026-10-10) — the sentence that makes a disregarded
 * risk tick visible instead of silent.
 *
 * The logic half shipped in S10b: `pedsRiskIds()` strips `adultOnly` risks so
 * a 15-year-old whose only tick is "Cigarette smoking" is no longer handed an
 * at-risk catch-up regimen. Correct, but SILENT — the engine disregarded the
 * tick, the Results summary still listed it as a chip beside a recommendation
 * that ignored it, and nothing said why. **The owner held PR #20 rather than
 * ship that** (2026-10-10): "don't ship a silent ignore." This is the note
 * that clears the hold.
 *
 * Owner decision 2026-10-10, option (b): show the adult-only risk at every
 * age and say plainly that it does not change a child's schedule. Nothing is
 * withheld — the note raises the doubt and the clinician decides.
 *
 * Returns `null` when there is nothing to explain (no adult-only tick, or the
 * patient is on the adult rulebook where the risk genuinely acts), so a
 * caller can render it unconditionally.
 *
 * ── Why ADULT_SCHED_MIN_M and not PCV21_MIN_AGE_M ──────────────────────────
 * The boundary here must be the SCHEDULE routing boundary (228 = 19y) — the
 * same one `recommend.js` dispatches on and `pedsRiskIds()` is applied under.
 * `PCV21_MIN_AGE_M` (216 = 18y) is a product min-age and a different clinical
 * concept; using it would make the note disagree with the engine for a
 * patient aged 18–19, claiming no effect while the adult rulebook acted on
 * the tick. See CLAUDE.md, "Two Boundary Constants — Never Collapse".
 *
 * ── Sources (fetched live 2026-10-10, both verified to appear exactly once) ─
 * Smoking and alcohol use disorder ARE adult pneumococcal risk factors —
 * CDC Adult Schedule Notes, the footnote to "Age 19-49 years with certain
 * underlying medical conditions or other risk factors":
 *   "Underlying medical conditions or other risk factors include alcoholism,
 *    chronic heart/liver/lung disease, chronic renal failure, cigarette
 *    smoking, ..."
 * And they are absent from the paediatric lists — CDC Child & Adolescent
 * Schedule Notes, pneumococcal "Special situations", whose two risk groups
 * are CDC's complete paediatric enumeration: 0 matches for
 * /smok|alcohol|cigarette/i across the 75,723-character page, while
 * "cochlear" and "diabetes" both match, so the absence is real rather than a
 * collapsed accordion. AAP is silent (no AAP page enumerating paediatric
 * pneumococcal risk conditions was reachable), so CDC stands — per CLAUDE.md
 * the AAP tiebreak applies only to disagreement, and silence is not
 * disagreement.
 *
 * The wording is drawn from those two sentences rather than invented, and
 * each half carries its own `[c]` marker pointing at the one that supports it.
 */
export function riskAgeNote(riskIds = [], ageMonths) {
  // An unknown age cannot be said to be under 19, so there is nothing to claim.
  if (ageMonths == null) return null;
  if (ageMonths >= ADULT_SCHED_MIN_M) return null;

  // Preserve the order risks appear in the picker, not the click order, so the
  // sentence reads the same way every time for the same selection.
  const ignored = RISK_FACTORS
    .filter((rf) => rf.adultOnly && riskIds.includes(rf.id))
    .map((rf) => rf.label);
  if (ignored.length === 0) return null;

  const plural = ignored.length > 1;
  const names = plural
    ? `${ignored.slice(0, -1).join(', ')} and ${ignored[ignored.length - 1]}`
    : ignored[0];

  return {
    lines: [
      `${names} ${plural ? 'are adult pneumococcal risk factors' : 'is an adult pneumococcal risk factor'} [c].`,
      `CDC's child and adolescent schedule does not list ${plural ? 'them' : 'it'} among the`
      + ` conditions that place a child on the at-risk pathway [c], so this selection does not`
      + ` change this patient's recommendation.`,
    ],
    // One entry per "[c]" above, in order.
    cites: [cite('cdcAdultRiskFactorList'), cite('cdcChildSpecialSituations')],
    footer: 'Kept in the record, not acted on at this age. If the patient is 19 or older, check the age.',
  };
}

// Exported for the test that pins the note against the risk data: every
// `adultOnly` risk must be one the note can name.
export const ADULT_ONLY_RISK_IDS = RISK_FACTORS.filter((rf) => rf.adultOnly).map((rf) => rf.id);
export { RISK_BY_ID };
