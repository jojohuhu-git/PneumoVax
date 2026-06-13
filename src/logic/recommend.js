// ─────────────────────────────────────────────────────────────────────────
// recommend.js — the PneumoVax recommendation engine.
//
// Pure function. Given a patient (age, risks, PCV history, PPSV23 history),
// returns the current pneumococcal recommendations (PCV and PPSV23 streams),
// plus an HSCT advisory block when the HSCT risk factor is selected.
//
// Every clinical rule is traceable to a citation key in src/data/refs.js and to
// a section of CLINICAL_SPEC.md. Verified live 2026-06-06 against CDC child &
// adult schedule notes, immunize.org p2016 (Tables 1–5), the PCV7-not-counted
// article, mm7401a1 (≥50 expansion), mm7336a3 (PCV21), and the Fred Hutch LTFU
// guideline (adult HSCT, SOLE source).
//
// Design rule (ported from vaxapp/MeningoVax): all clinical logic and product
// validity live HERE; the UI consumes pre-built recs. No clinical logic in
// components.
// ─────────────────────────────────────────────────────────────────────────

import { resolveRefs } from '../data/refs.js';
import {
  RISK_BY_ID,
  hasHSCT,
  hasIC,
  hasAnyRisk,
  adultPpsvIntervalClass,
  pedsRiskRowClass,
} from '../data/riskFactors.js';
import { productByKey, pcvRecBrands } from '../data/brands.js';
import { todayISO, addDays, daysBetween, intervalElapsed, DAYS } from './dateUtils.js';
import { analyzeHistory } from './validate.js';
import { ADULT_SCHED_MIN_M } from './scheduleConstants.js';

// Age bands (months)
// y18 is the ADULT SCHEDULE boundary (228 = 19y), not the PCV21 product gate (216 = 18y).
// See scheduleConstants.js for the authoritative values and distinction.
const M = {
  m2: 2, m7: 7, m12: 12, m16: 16, m24: 24, m60: 60, m72: 72,
  y2: 24, y5: 60, y6: 72, y18: ADULT_SCHED_MIN_M, y50: 600, y65: 780,
};

const WK8 = DAYS.weeks(8);   // 56
const WK4 = DAYS.weeks(4);   // 28
const Y1  = DAYS.years(1);   // 365
const Y5  = DAYS.years(5);   // 1826

// ── rec() helper ──────────────────────────────────────────────────────────
function rec(o) {
  return {
    vaccine: o.vaccine,                 // 'PCV' | 'PPSV23'
    status: o.status,                   // due | catchup | risk-based | shared-decision | complete | not-indicated | deferred
    doseLabel: o.doseLabel,
    dueToday: !!o.dueToday,
    earliestNextDate: o.earliestNextDate ?? null,
    minIntervalDays: o.minIntervalDays ?? null,
    brands: o.brands ?? [],
    note: o.note,
    advisory: !!o.advisory,             // HSCT relative-to-transplant block
    citations: resolveRefs(o.refs ?? []),
  };
}

// Merge risk-driven ref keys with defaults, de-duplicated, preserving order.
function collectRefs(riskIds, defaults) {
  const out = [];
  for (const id of riskIds) {
    for (const k of RISK_BY_ID[id]?.refs ?? []) if (!out.includes(k)) out.push(k);
  }
  for (const k of defaults) if (!out.includes(k)) out.push(k);
  return out;
}

// ── PCV history summary helpers ───────────────────────────────────────────
// `pcvDoses` here is the EFFECTIVE list (PCV7 already excluded by validate.js).
// `am`/`today` let us bucket each dated dose by the age it was given — matching
// the age-band model CDC PneumoRecs uses (before 12mo / 12–23mo / 24–71mo / ≥6y).
// Undated doses can't be banded; they're counted in `undated` and the total only.
function summarizePcv(pcvDoses, am = 0, today = null) {
  const products = pcvDoses.map((d) => d.product).filter(Boolean);
  const has = (k) => products.includes(k);
  const hasPCV20 = has('PCV20');
  const hasPCV21 = has('PCV21');
  const hasPCV15 = has('PCV15');
  const hasPCV13 = has('PCV13');
  // A series is "complete-by-product" if it includes a PCV20 (any age) or PCV21 (adult).
  const includesCompleting = hasPCV20 || hasPCV21;
  // The most recent dose's date (for interval anchoring).
  const lastDated = [...pcvDoses].reverse().find((d) => d.date) || null;

  // Age-banded counts (months at administration), from dated doses only.
  const band = { before12: 0, m12to23: 0, m24to71: 0, ge72: 0, undated: 0 };
  for (const d of pcvDoses) {
    if (!d.date || !today) { band.undated += 1; continue; }
    const ageAtDose = am - daysBetween(d.date, today) / 30.4375;
    if (ageAtDose < M.m12) band.before12 += 1;
    else if (ageAtDose < M.m24) band.m12to23 += 1;
    else if (ageAtDose < M.m72) band.m24to71 += 1;
    else band.ge72 += 1;
  }
  // Doses "by 24 months" (p2016 Table 4 rows 1/2 split). Undated doses are folded
  // in here — an undated historical dose is assumed to be an infant dose.
  band.before24 = band.before12 + band.m12to23 + band.undated;
  // Doses given at/after 24 months (progress toward the at-risk 2-dose catch-up).
  // Dated only — we never ASSUME an undated dose was a ≥24mo catch-up dose.
  band.ge24 = band.m24to71 + band.ge72;

  // A completing dose (PCV20/PCV21) that we CANNOT prove was given before 24mo —
  // i.e. undated, or dated at ≥24mo. Used by the healthy-child completeness check:
  // a single PCV20 dated in infancy does NOT complete (case P09), but an undated
  // one gets the benefit of the doubt (preserves prior behavior).
  const hasUndatedCompleting = pcvDoses.some(
    (d) => (d.product === 'PCV20' || d.product === 'PCV21') && !d.date,
  );

  return {
    count: pcvDoses.length,
    products,
    hasPCV20, hasPCV21, hasPCV15, hasPCV13,
    includesCompleting,
    hasUndatedCompleting,
    lastDate: lastDated?.date || null,
    band,
  };
}

// Most recent of two ISO date strings (either may be null).
function mostRecent(a, b) {
  const dates = [a, b].filter(Boolean).sort();
  return dates.length ? dates[dates.length - 1] : null;
}

// Build a "due now or eligible later" pair from an anchor date + interval.
function dueState(anchorDate, intervalDays, today) {
  if (!anchorDate) return { dueToday: true, earliestNextDate: null };
  const elapsed = intervalElapsed(anchorDate, intervalDays, today);
  return {
    dueToday: elapsed,
    earliestNextDate: elapsed ? null : addDays(anchorDate, intervalDays),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  CHILDREN 2–23 months — p2016 Table 1 (routine + catch-up; all children)
// ═══════════════════════════════════════════════════════════════════════════
// Snapshot model: compute doses still needed + the next dose's min interval.
function pcvInfant(am, pcv, today) {
  const prior = pcv.count;
  const refs = ['cdcChildPneumo', 'p2016'];
  const brands = pcvRecBrands({ adult: false });
  const anchor = pcv.lastDate;

  // Determine total target doses + whether the booster (≥12mo) is the next due.
  // Reduced from p2016 Table 1 to: remaining count + next interval + 12mo floor.
  // Healthy and at-risk infants follow Table 1 alike.
  // Min interval: <12mo → 4 weeks; ≥12mo → 8 weeks.
  const minInterval = am < M.m12 ? WK4 : WK8;

  // Target total doses per CDC Table 1, computed from age band + prior doses.
  //
  // FIX M1 + M3: the old `Math.max(2, Math.min(4, prior + 1))` formula for
  // am≥12mo caused two bugs:
  //   • M1: 1 dose at 2mo → prior=1 → target=2, says "dose 2 of 2" → clinically
  //         only 1 of the 2 remaining at-this-age doses, ignoring the 12–15mo
  //         booster that is ALSO still needed.
  //   • M3: 3 doses before 12mo → prior=3 → target=4, but the booster is a
  //         separate dose, so label "dose 4 of 3" was impossible.
  //
  // Corrected logic per CDC Table 1:
  //   <7mo  → target=4 (3 primary + 1 booster), regardless of prior
  //   7–11mo → target = prior<1 ? 3 : 4  (0 before 7mo → 2+booster; ≥1 → 1+booster)
  //   ≥12mo  → target = prior<3 ? (prior<1 ? 2 : prior + 1) : 4
  //             — with ≥3 infant doses the booster is still needed (→ 4 total)
  //             — with <3 infant doses, target climbs with prior but ≥2
  //
  // Practically for a 12–23mo child: the booster IS the remaining dose, so the
  // series total must reach 4 if 3 primary doses were given <12mo.  For partial
  // histories (<3 primary), the count of "doses still needed" drives the label.
  let target;
  if (am < M.m7) {
    // Start at 0–6mo: full 4-dose series (3 primary + booster) regardless of prior.
    target = 4;
  } else if (am < M.m12) {
    // Start at 7–11mo: 0 prior → 3 total (2 primary + booster); ≥1 prior → 4 total.
    // (CDC Table 1: "7–11 months, 1 dose → 2 more doses"; "0 doses → 2 primary + 1 booster")
    const before7 = pcv.band.before12 - (pcv.band.m12to23); // doses given <7mo (approx)
    target = prior < 1 ? 3 : 4;
  } else {
    // Start at ≥12mo: child needs the booster, plus any missing primary doses.
    // With ≥3 prior infant doses: need 1 booster → total = 4.
    // With 1–2 prior doses:       need remaining primaries + booster → prior + 2, max 4.
    // With 0 prior:                2-dose catch-up at this age → total = 2.
    if (prior === 0) {
      target = 2;
    } else if (pcv.band.before12 >= 3) {
      // 3 primary doses before 12mo — booster is the only thing left → total = 4.
      target = 4;
    } else {
      // 1–2 primary doses; need remaining primaries + booster — max 4 total.
      target = Math.min(4, prior + 2);
    }
  }

  // Has a dose at ≥12mo been given? (booster satisfied)
  // FIX H5: Must check whether ≥1 dose was ADMINISTERED at ≥12mo, not just
  // whether the patient's CURRENT age is ≥12mo.  A 13-month-old with 4 doses
  // all given at <12mo still needs the ≥12mo booster — prior >= target alone
  // does not prove the series is complete.
  // Undated doses get benefit-of-the-doubt (matching completedInfantSeries logic
  // in pcvHealthyChild) — consistent with validate.js counting policy.
  const boosterGiven = (pcv.band.m12to23 + pcv.band.ge72 + pcv.band.undated) >= 1 && prior >= target;

  if (prior >= target && boosterGiven) {
    return [rec({
      vaccine: 'PCV', status: 'complete',
      doseLabel: `PCV series complete (${prior} dose${prior === 1 ? '' : 's'})`,
      note: 'The age-appropriate PCV series appears complete. If any dose was PCV15, ensure a PPSV23 follow-up is given only when a risk condition is present (PPSV23 is not routine for healthy children).',
      refs,
    })];
  }

  const remaining = Math.max(1, target - prior);
  const doseNum = prior + 1;
  const { dueToday, earliestNextDate } = dueState(anchor, minInterval, today);
  // The final dose must be at ≥12 months — if this is the last dose and the
  // child is <12mo, it is not due until 12 months.
  const isFinal = remaining === 1;
  const needs12moFloor = isFinal && am < M.m12;
  const due = needs12moFloor ? false : dueToday;

  return [rec({
    vaccine: 'PCV', status: prior === 0 ? 'due' : 'catchup',
    doseLabel: `PCV dose ${doseNum} of ${target}`,
    dueToday: due,
    earliestNextDate: needs12moFloor ? null : earliestNextDate,
    minIntervalDays: minInterval,
    brands,
    note: `Routine infant PCV (PCV15 or PCV20), 4-dose series at 2, 4, 6, and 12–15 months. Minimum interval ${am < M.m12 ? '4 weeks (under 12 months)' : '8 weeks (12 months or older)'}; the final/booster dose is given at ≥12 months.${needs12moFloor ? ' This final dose is not due until the patient reaches 12 months.' : ''} If PCV15 is used, a PPSV23 follow-up is needed only for children with a risk condition.`,
    refs,
  })];
}

// ═══════════════════════════════════════════════════════════════════════════
//  HEALTHY CHILDREN 24 months – 18 years — p2016 Table 2
// ═══════════════════════════════════════════════════════════════════════════
function pcvHealthyChild(am, pcv, ppsv, today) {
  const refs = ['cdcChildPneumo', 'p2016', 'cdcCatchupJobAid'];
  const prior = pcv.count;
  const anchor = pcv.lastDate;
  const b = pcv.band;

  // Completeness for a HEALTHY child is age-band driven, NOT "has any PCV20."
  // A single PCV20 given in infancy does NOT complete the series (that shortcut
  // is an ADULT rule — verified against CDC PneumoRecs, case P09). A healthy
  // 24–59mo child is complete only when EITHER:
  //   • the full infant series was finished (≥4 counting doses incl. a ≥12mo booster), OR
  //   • a catch-up dose was given at ≥24mo (the single 24–59mo catch-up dose suffices).
  const completedInfantSeries = prior >= 4 && (b.m12to23 >= 1 || b.undated >= 1);
  const caughtUpAt24mo = b.ge24 >= 1;

  // 24–59 months
  if (am < M.m60) {
    if (completedInfantSeries || caughtUpAt24mo || pcv.hasUndatedCompleting) {
      return [rec({
        vaccine: 'PCV', status: 'complete',
        doseLabel: 'PCV series complete',
        note: 'Healthy child 24–59 months whose age-appropriate PCV schedule is complete — no additional doses needed. (A series that includes PCV20 also needs no PPSV23.)',
        refs,
      })];
    }
    const { dueToday, earliestNextDate } = dueState(anchor, WK8, today);
    return [rec({
      vaccine: 'PCV', status: prior === 0 ? 'due' : 'catchup',
      doseLabel: '1 dose PCV (catch-up)',
      dueToday, earliestNextDate, minIntervalDays: WK8,
      brands: pcvRecBrands({ adult: false }),
      note: 'Healthy child 24–59 months with no or an incomplete PCV schedule by 24 months: 1 dose of PCV15 or PCV20, ≥8 weeks after the most recent PCV. If PCV15 is used, a PPSV23 follow-up is not routine for a healthy child (PPSV23 is risk-based).',
      refs,
    })];
  }

  // 5–18 years healthy — no additional doses (healthy older children not caught up).
  return [rec({
    vaccine: 'PCV', status: 'not-indicated',
    doseLabel: 'Not indicated (healthy 5–18y)',
    note: 'Healthy children 5–18 years with no or incomplete PCV schedule are not routinely caught up. PCV is recommended only if a risk condition is present.',
    refs,
  })];
}

// ═══════════════════════════════════════════════════════════════════════════
//  AT-RISK CHILDREN 24 months – 18 years — p2016 Table 4
// ═══════════════════════════════════════════════════════════════════════════
function pcvRiskChild(am, riskIds, pcv, ppsv, today) {
  const rowClass = pedsRiskRowClass(riskIds); // 'IC' | 'nonIC'
  const isIC = rowClass === 'IC';
  const refs = collectRefs(riskIds, ['cdcChildPneumo', 'p2016']);
  const anchorPcv = pcv.lastDate;
  // Anchor for "most recent pneumococcal vaccine" = latest of PCV or PPSV23.
  const anchorPneumo = mostRecent(pcv.lastDate, ppsv.effective.find((d) => d.date)?.date || null);
  const ppsvGiven = ppsv.count > 0;
  const out = [];

  // Row 3: completed series before 6y including ≥1 PCV20 → no additional doses.
  // FIX M2: The shortcut "includes PCV20 → complete" is an ADULT and older-child
  // rule (CDC adult notes / p2016 Table 2 for healthy children), NOT a universal
  // rule for at-risk 24–71mo children.  Per CDC Table 4, an at-risk child <6y
  // with only 1 PCV20 still needs 1 more dose (Row 1: <3 doses before 24mo → 2
  // doses at ≥24mo).  The Row-3 shortcut only applies once the child has
  // COMPLETED the age-appropriate series (i.e. the Table 4 rows-1/2 requirement
  // is fully met AND the history includes a completing dose).
  //
  // Gate: child <6y AND insufficient doses at ≥24mo → fall through to rows 1/2.
  // For child ≥6y the catch-up is a single dose regardless, so the shortcut is
  // safe once a PCV20 is present (they've had their 1 at-risk dose).
  const enoughAt24mo = am >= M.m72 || pcv.band.ge24 >= (pcv.band.before24 >= 3 ? 1 : 2);
  if (pcv.includesCompleting && (am >= M.m72 || enoughAt24mo)) {
    out.push(rec({
      vaccine: 'PCV', status: 'complete',
      doseLabel: 'PCV complete (includes PCV20)',
      note: 'At-risk child whose PCV series includes PCV20 — no additional PCV or PPSV23 doses needed.',
      refs,
    }));
    return out;
  }

  // Rows 1 & 2: 24–71 months catch-up. The at-risk catch-up doses are given at
  // ≥24 months; prior INFANT doses do NOT reduce them. CDC: "<3 prior PCV by 24mo
  // → 2 doses, regardless of 0/1/2 before 24mo"; "3 doses before 24mo → 1 dose."
  // Progress toward the catch-up = doses already given at ≥24mo (band.ge24).
  // Verified vs PneumoRecs (P11 → 2, P12 → 1, P20 → 2).
  //
  // A COMPLETED infant series (≥4 counting PCV doses) is NOT a catch-up case —
  // per CDC child notes a child who "completed the recommended PCV series but has
  // not received PPSV23" gets 1 PCV20 OR 1 PPSV23, not another plain PCV dose.
  // Such children fall through to the rows-4/5 "completed before age 6" block below.
  // Source: cdc.gov/.../child-adolescent-notes.html#note-pneumo ("Completed
  // recommended PCV series but have not received PPSV23").
  if (am < M.m72 && pcv.count < 4) {
    const target = pcv.band.before24 >= 3 ? 1 : 2; // row 2 (1) vs row 1 (2)
    const remaining = Math.max(0, target - pcv.band.ge24);
    if (remaining === 0) {
      out.push(rec({
        vaccine: 'PCV', status: 'complete',
        doseLabel: 'PCV complete (at-risk catch-up done)',
        note: 'At-risk child 24–71 months who has already received the age-appropriate at-risk PCV catch-up dose(s) at ≥24 months — complete. If PCV15 was used, ensure a PPSV23 follow-up.',
        refs,
      }));
      return out;
    }
    const { dueToday, earliestNextDate } = dueState(anchorPcv, WK8, today);
    const doseNum = target - remaining + 1;
    out.push(rec({
      vaccine: 'PCV', status: 'risk-based',
      doseLabel: target === 1 ? '1 dose PCV (at-risk catch-up)' : `PCV dose ${doseNum} of 2 (at-risk catch-up)`,
      dueToday, earliestNextDate, minIntervalDays: WK8,
      brands: pcvRecBrands({ adult: false }),
      note: target === 1
        ? 'At-risk child 24–71 months with 3 PCV doses before 24 months: 1 dose of PCV20 or PCV15 (≥8 weeks after the most recent PCV). If PCV15 is used, add PPSV23 ≥8 weeks later.'
        : 'At-risk child 24–71 months with an incomplete schedule (fewer than 3 PCV by 24 months): 2 doses of PCV20 or PCV15, ≥8 weeks apart — these are additional to any infant doses. If PCV15 is used to complete, add PPSV23 ≥8 weeks after the last PCV.',
      refs,
    }));
    return out;
  }

  // Rows 4–9: 2–18y (here ≥6y by age, but rows 4/5 say "2–18y completed before 6y").
  // Branch on whether a PCV13/15 series was completed before age 6 vs no prior PCV
  // vs PCV13-only at/after age 6. We can't see exact ages of historical doses, so:
  //   • prior counting PCV ≥3  → treat as "completed series before 6y with PCV13/15"
  //   • prior counting PCV 0   → "no prior PCV13/15/20"
  //   • prior counting PCV 1–2 (e.g. a single PCV13 at/after 6y) → "PCV13 only at/after 6y"

  if (pcv.count >= 3) {
    // Rows 4 (non-IC) / 5 (IC): completed before 6y with PCV13/15 (no PCV20, no PPSV23).
    if (ppsvGiven) {
      // non-IC: PPSV23 already given → complete.
      if (!isIC) {
        out.push(rec({
          vaccine: 'PCV', status: 'complete', doseLabel: 'Complete (PCV series + PPSV23)',
          note: 'At-risk (non-immunocompromising) child who completed the PCV series and has received PPSV23 — complete. Alternatively a single PCV20 ≥8 weeks after the last PCV also completes.',
          refs,
        }));
        return out;
      }
      // IC + PPSV23 already given: A) PCV20 ≥8wk, or B) 2nd PPSV23 ≥5y after first.
      const { dueToday, earliestNextDate } = dueState(anchorPneumo, WK8, today);
      out.push(rec({
        vaccine: 'PCV', status: 'risk-based', doseLabel: '1 dose PCV20 (immunocompromising)',
        dueToday, earliestNextDate, minIntervalDays: WK8,
        brands: ['PCV20 (Prevnar 20)'],
        note: 'Immunocompromising at-risk child who completed PCV13/15 and already received PPSV23: give 1 dose of PCV20 ≥8 weeks after the most recent pneumococcal vaccine — OR a 2nd PPSV23 ≥5 years after the first PPSV23.',
        refs,
      }));
      const ppsv2 = dueState(ppsv.effective.find((d) => d.date)?.date || anchorPneumo, Y5, today);
      out.push(rec({
        vaccine: 'PPSV23', status: 'risk-based', doseLabel: '2nd PPSV23 (alternative, ≥5y after first)',
        dueToday: ppsv2.dueToday, earliestNextDate: ppsv2.earliestNextDate, minIntervalDays: Y5,
        brands: ['PPSV23 (Pneumovax 23)'],
        note: 'Alternative to the PCV20 above: a 2nd PPSV23 ≥5 years after the first PPSV23. Choose ONE option (PCV20 or 2nd PPSV23), not both.',
        refs,
      }));
      return out;
    }
    // No PPSV23 yet. A) PCV20 ≥8wk; or B) PPSV23 ≥8wk (IC: then ≥5y → PCV20 or 2nd PPSV23).
    const { dueToday, earliestNextDate } = dueState(anchorPneumo, WK8, today);
    out.push(rec({
      vaccine: 'PCV', status: 'risk-based', doseLabel: 'Option A: 1 dose PCV20 (≥8 weeks)',
      dueToday, earliestNextDate, minIntervalDays: WK8,
      brands: ['PCV20 (Prevnar 20)'],
      note: `At-risk ${isIC ? 'immunocompromising' : 'non-immunocompromising'} child who completed PCV13/15 before age 6 (no PCV20, no PPSV23): Option A — 1 dose of PCV20 ≥8 weeks after the most recent PCV (completes the series).`,
      refs,
    }));
    out.push(rec({
      vaccine: 'PPSV23', status: 'risk-based', doseLabel: 'Option B: 1 dose PPSV23 (≥8 weeks)',
      dueToday, earliestNextDate, minIntervalDays: WK8,
      brands: ['PPSV23 (Pneumovax 23)'],
      note: isIC
        ? 'Option B — 1 dose of PPSV23 ≥8 weeks after the most recent PCV; then ≥5 years later give 1 dose of PCV20 or a 2nd PPSV23. Choose Option A or B, not both.'
        : 'Option B — 1 dose of PPSV23 ≥8 weeks after the most recent PCV. Choose Option A or B, not both.',
      refs,
    }));
    return out;
  }

  // 6–18y with no prior counting PCV (rows 6/7) OR PCV13-only at/after 6y (rows 8/9).
  const noPriorPcv = pcv.count === 0;

  // Rows 8/9 (PCV13-only at/after 6y) where PPSV23 has ALREADY been given:
  //   • non-IC → Option B (the single PPSV23) is satisfied → COMPLETE.
  //   • IC     → still owes the recurring step: 1 PCV20 ≥8wk OR a 2nd PPSV23 ≥5y
  //              after the first (p2016 Table 4 row 9).
  // Verified vs CDC child notes + PneumoRecs (P19 non-IC → complete).
  if (!noPriorPcv && ppsvGiven) {
    if (!isIC) {
      out.push(rec({
        vaccine: 'PCV', status: 'complete',
        doseLabel: 'Complete (PCV13 + PPSV23 at/after age 6)',
        note: 'Non-immunocompromising at-risk child with PCV13 at/after age 6 who has received PPSV23 — no further doses of any PCV or PPSV23 are indicated.',
        refs,
      }));
      return out;
    }
    const icState = dueState(anchorPneumo, WK8, today);
    out.push(rec({
      vaccine: 'PCV', status: 'risk-based', doseLabel: '1 dose PCV20 (immunocompromising)',
      dueToday: icState.dueToday, earliestNextDate: icState.earliestNextDate, minIntervalDays: WK8,
      brands: ['PCV20 (Prevnar 20)'],
      note: 'Immunocompromising at-risk child (PCV13 at/after age 6) who already received PPSV23: give 1 dose of PCV20 ≥8 weeks after the most recent pneumococcal vaccine — OR a 2nd PPSV23 ≥5 years after the first PPSV23. Choose ONE option.',
      refs,
    }));
    const ppsv2 = dueState(ppsv.effective.find((d) => d.date)?.date || anchorPneumo, Y5, today);
    out.push(rec({
      vaccine: 'PPSV23', status: 'risk-based', doseLabel: '2nd PPSV23 (alternative, ≥5y after first)',
      dueToday: ppsv2.dueToday, earliestNextDate: ppsv2.earliestNextDate, minIntervalDays: Y5,
      brands: ['PPSV23 (Pneumovax 23)'],
      note: 'Alternative to the PCV20 above: a 2nd PPSV23 ≥5 years after the first PPSV23. Choose ONE option (PCV20 or 2nd PPSV23), not both.',
      refs,
    }));
    return out;
  }

  const anchorForA = noPriorPcv ? anchorPneumo : anchorPcv;
  const aState = dueState(anchorForA, WK8, today);

  out.push(rec({
    vaccine: 'PCV', status: 'risk-based', doseLabel: 'Option A: 1 dose PCV20 (≥8 weeks)',
    dueToday: aState.dueToday, earliestNextDate: aState.earliestNextDate, minIntervalDays: WK8,
    brands: ['PCV20 (Prevnar 20)'],
    note: noPriorPcv
      ? `At-risk ${isIC ? 'immunocompromising' : 'non-immunocompromising'} child 6–18 years with no prior PCV: Option A — 1 dose of PCV20 ≥8 weeks after the most recent pneumococcal vaccine.`
      : `At-risk ${isIC ? 'immunocompromising' : 'non-immunocompromising'} child 6–18 years with PCV13 only (at/after age 6): Option A — 1 dose of PCV20 ≥8 weeks after the most recent PCV13.`,
    refs,
  }));

  if (noPriorPcv) {
    // Option B: PCV15 then PPSV23 ≥8wk later (rows 6/7).
    out.push(rec({
      vaccine: 'PCV', status: 'risk-based', doseLabel: 'Option B-1: 1 dose PCV15 (≥8 weeks)',
      dueToday: aState.dueToday, earliestNextDate: aState.earliestNextDate, minIntervalDays: WK8,
      brands: ['PCV15 (Vaxneuvance)'],
      note: 'Option B — 1 dose of PCV15 ≥8 weeks after the most recent pneumococcal vaccine, then ≥8 weeks later give 1 dose of PPSV23 (if PPSV23 not previously given). Choose Option A or B, not both.',
      refs,
    }));
    if (!ppsvGiven) {
      out.push(rec({
        vaccine: 'PPSV23', status: 'risk-based', doseLabel: 'Option B-2: PPSV23 (≥8 weeks after PCV15)',
        dueToday: false, earliestNextDate: null, minIntervalDays: WK8,
        brands: ['PPSV23 (Pneumovax 23)'],
        note: 'Second step of Option B: PPSV23 ≥8 weeks after the PCV15 dose. Only if PPSV23 was not previously given.',
        refs,
      }));
    }
  } else {
    // PCV13-only at/after 6y. Option B: PPSV23 ≥8wk (IC: then ≥5y → PCV20 or 2nd PPSV23).
    out.push(rec({
      vaccine: 'PPSV23', status: 'risk-based', doseLabel: 'Option B: 1 dose PPSV23 (≥8 weeks after PCV13)',
      dueToday: aState.dueToday, earliestNextDate: aState.earliestNextDate, minIntervalDays: WK8,
      brands: ['PPSV23 (Pneumovax 23)'],
      note: isIC
        ? 'Option B — 1 dose of PPSV23 ≥8 weeks after the most recent PCV13; then ≥5 years after the first PPSV23 give 1 dose of PCV20 or a 2nd PPSV23. Choose Option A or B, not both.'
        : 'Option B — 1 dose of PPSV23 ≥8 weeks after the most recent PCV13. Choose Option A or B, not both.',
      refs,
    }));
  }

  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
//  ADULTS 19–49y (risk-only) and ≥50y (routine) — CDC adult notes
// ═══════════════════════════════════════════════════════════════════════════
function pcvAdult(am, riskIds, pcv, ppsv, today) {
  const isOlderAdult = am >= M.y50;
  const anyRisk = hasAnyRisk(riskIds);
  const intervalClass = adultPpsvIntervalClass(riskIds); // 'short'(8wk) | 'long'(1y)
  const ppsvIntervalDays = intervalClass === 'short' ? WK8 : Y1;
  const ppsvIntervalLabel = intervalClass === 'short' ? '8 weeks' : '1 year';
  const refs = collectRefs(riskIds, [
    'cdcAdultPneumo', 'cdcAdultTimingJobAid', isOlderAdult ? 'mmwr7401a1' : 'mmwr7203a1',
  ]);
  const adultBrands = pcvRecBrands({ adult: true });

  // 19–49 with NO risk → not indicated (routine starts at 50).
  if (!isOlderAdult && !anyRisk) {
    return [rec({
      vaccine: 'PCV', status: 'not-indicated',
      doseLabel: 'Not indicated (no risk, <50y)',
      note: 'Routine pneumococcal vaccination begins at age 50. Adults 19–49 years are recommended a pneumococcal vaccine only with a qualifying risk condition.',
      refs,
    })];
  }

  const ppsvGiven = ppsv.count > 0;

  // ── Already complete by product ──────────────────────────────────────
  // PCV20 or PCV21 in history → complete.
  if (pcv.hasPCV20 || pcv.hasPCV21) {
    return [rec({
      vaccine: 'PCV', status: 'complete',
      doseLabel: `Complete (history includes ${pcv.hasPCV21 ? 'PCV21' : 'PCV20'})`,
      note: 'A pneumococcal series that includes PCV20 or PCV21 is complete — no PPSV23 and no further PCV needed.',
      refs,
    })];
  }
  // PCV15 + PPSV23 → complete.
  if (pcv.hasPCV15 && ppsvGiven) {
    return [rec({
      vaccine: 'PCV', status: 'complete',
      doseLabel: 'Complete (PCV15 + PPSV23)',
      note: 'PCV15 followed by PPSV23 is a complete pneumococcal series — no further doses needed.',
      refs,
    })];
  }

  // ── PCV15 only, no PPSV23 → INCOMPLETE: give PPSV23 ─────────────────
  if (pcv.hasPCV15 && !ppsvGiven) {
    const { dueToday, earliestNextDate } = dueState(pcv.lastDate, ppsvIntervalDays, today);
    return [rec({
      vaccine: 'PPSV23', status: anyRisk ? 'risk-based' : 'due',
      doseLabel: `PPSV23 (≥${ppsvIntervalLabel} after PCV15) — completes the series`,
      dueToday, earliestNextDate, minIntervalDays: ppsvIntervalDays,
      brands: ['PPSV23 (Pneumovax 23)'],
      note: `PCV15 was given but PPSV23 is still pending — the series is INCOMPLETE. Give PPSV23 ≥${ppsvIntervalLabel} after the PCV15 dose (${intervalClass === 'short' ? 'immunocompromising condition, cochlear implant, or CSF leak → ≥8 weeks' : 'chronic condition → ≥1 year'}). If PPSV23 is unavailable, a dose of PCV20 or PCV21 may be substituted to complete.`,
      refs,
    })];
  }

  // ── PPSV23 given, no PCV15/PCV13 (no prior PCV OR unknown-product PCV) →
  //    give a PCV (≥1y after PPSV23) ─────────────────────────────────────
  // Fires for both "0 PCV + PPSV23" and "unknown-product PCV + PPSV23"
  // (pcv.count>0 but neither PCV13 nor PCV15 identified). Both resolve the same
  // way per ACIP: a PCV15/20/21 ≥1y after PPSV23 completes the series.
  if (ppsvGiven && !pcv.hasPCV13 && !pcv.hasPCV15) {
    const ppsvDate = ppsv.effective.find((d) => d.date)?.date || null;
    const { dueToday, earliestNextDate } = dueState(ppsvDate, Y1, today);
    return [rec({
      vaccine: 'PCV', status: anyRisk ? 'risk-based' : 'due',
      doseLabel: 'PCV (PCV15, PCV20, or PCV21) ≥1 year after PPSV23',
      dueToday, earliestNextDate, minIntervalDays: Y1,
      brands: adultBrands,
      note: 'PPSV23 was given previously (with no prior PCV, or a PCV of unknown product): give 1 dose of PCV15, PCV20, or PCV21 ≥1 year after the PPSV23 dose. If PCV15 is chosen, no further PPSV23 is needed (the PPSV23 requirement is already met).',
      refs,
    })];
  }

  // ── PCV13 only (no PPSV23) → PCV20 or PCV21 ≥1y → complete ───────────
  if (pcv.hasPCV13 && !ppsvGiven) {
    const { dueToday, earliestNextDate } = dueState(pcv.lastDate, Y1, today);
    return [rec({
      vaccine: 'PCV', status: anyRisk ? 'risk-based' : 'due',
      doseLabel: 'PCV20 or PCV21 ≥1 year after PCV13 — completes the series',
      dueToday, earliestNextDate, minIntervalDays: Y1,
      brands: ['PCV20 (Prevnar 20)', 'PCV21 (Capvaxive)'],
      note: 'PCV13 was given previously: give 1 dose of PCV20 or PCV21 ≥1 year after the last PCV13 dose. This completes the series — no PPSV23 needed.',
      refs,
    })];
  }

  // ── PCV13 + PPSV23 → PCV20/PCV21 ≥5y (SCDM nuance by PPSV23 age) ─────
  if (pcv.hasPCV13 && ppsvGiven) {
    const anchor = lastDoseDate(pcv, ppsv);
    const { dueToday, earliestNextDate } = dueState(anchor, Y5, today);
    // PCV13+PPSV23 → shared decision ONLY when the PPSV23 dose was given at age
    // ≥65 (CDC adult notes) — NOT when the patient is merely ≥65 now. PneumoVax
    // captures both the patient's age and the PPSV23 date, so compute age-at-PPSV23
    // directly when the dose is dated; fall back to the current-age proxy only when
    // the PPSV23 dose is undated. (Verified against CDC PneumoRecs VaxAdvisor 2026-06-07.)
    const ppsvDateForAge = ppsv.effective.find((d) => d.date)?.date || null;
    let ppsvAtOrAfter65;
    if (ppsvDateForAge) {
      const ageAtPpsvMonths = am - Math.round(daysBetween(ppsvDateForAge, today) / 30.4375);
      ppsvAtOrAfter65 = ageAtPpsvMonths >= M.y65;
    } else {
      ppsvAtOrAfter65 = am >= M.y65; // proxy when PPSV23 is undated
    }
    const sharedDecision = isOlderAdult && ppsvAtOrAfter65;
    if (sharedDecision) {
      return [rec({
        vaccine: 'PCV', status: 'shared-decision',
        doseLabel: 'PCV20 or PCV21 ≥5 years (shared clinical decision-making)',
        dueToday, earliestNextDate, minIntervalDays: Y5,
        brands: ['PCV20 (Prevnar 20)', 'PCV21 (Capvaxive)'],
        note: 'PCV13 and PPSV23 already given. For adults whose PPSV23 was received at ≥65 years, an additional PCV20 or PCV21 (≥5 years after the last pneumococcal dose) is a shared clinical decision — it may be given or omitted.',
        refs,
      })];
    }
    // chronic-only adult <50: nothing now, review at 50.
    if (!isOlderAdult && !hasIC(riskIds) && !require8wk(riskIds)) {
      return [rec({
        vaccine: 'PCV', status: 'complete',
        doseLabel: 'No dose now — review at age 50',
        note: 'Adult 19–49 with a chronic (non-immunocompromising) condition who already received PCV13 + PPSV23: no additional pneumococcal dose now. Re-evaluate at age 50, when a dose of PCV20 or PCV21 (≥5 years after the last pneumococcal dose) is recommended.',
        refs,
      })];
    }
    return [rec({
      vaccine: 'PCV', status: anyRisk ? 'risk-based' : 'due',
      doseLabel: 'PCV20 or PCV21 ≥5 years after last pneumococcal dose — completes the series',
      dueToday, earliestNextDate, minIntervalDays: Y5,
      brands: ['PCV20 (Prevnar 20)', 'PCV21 (Capvaxive)'],
      note: 'PCV13 and PPSV23 already given: give 1 dose of PCV20 or PCV21 ≥5 years after the last pneumococcal dose. This completes the series.',
      refs,
    })];
  }

  // ── None / unknown / PCV7-only → start a PCV ────────────────────────
  // (PCV7-only is handled by validate.js dropping PCV7 → pcv.count===0 here.)
  return [rec({
    vaccine: 'PCV', status: anyRisk && !isOlderAdult ? 'risk-based' : 'due',
    doseLabel: '1 dose PCV (PCV20, PCV15, or PCV21)',
    dueToday: true, earliestNextDate: null,
    brands: adultBrands,
    note: isOlderAdult
      ? 'Routine pneumococcal vaccination for adults ≥50 with no (or unknown, or PCV7-only) history: 1 dose of PCV20 or PCV21 — OR 1 dose of PCV15 followed by PPSV23 ≥1 year later. PCV20 and PCV21 each complete the series alone.'
      : `Adult 19–49 with a qualifying risk condition and no (or unknown, or PCV7-only) pneumococcal history: 1 dose of PCV15, PCV20, or PCV21. If PCV15 is chosen, follow with PPSV23 ≥${ppsvIntervalLabel} later (${intervalClass === 'short' ? 'immunocompromising / cochlear implant / CSF leak' : 'chronic condition'}). PCV20 and PCV21 each complete the series alone.`,
    refs,
  })];
}

// Whether the patient needs the ≥8wk (IC) interval (IC or cochlear/CSF).
function require8wk(riskIds) {
  return adultPpsvIntervalClass(riskIds) === 'short';
}

// Most recent dose date across PCV + PPSV23 effective lists.
function lastDoseDate(pcv, ppsv) {
  const dates = [];
  if (pcv.lastDate) dates.push(pcv.lastDate);
  for (const d of ppsv.effective) if (d.date) dates.push(d.date);
  dates.sort();
  return dates.length ? dates[dates.length - 1] : null;
}

// ═══════════════════════════════════════════════════════════════════════════
//  HSCT advisory block (peds <19y = p2016 Table 5; adults ≥19y = Fred Hutch)
// ═══════════════════════════════════════════════════════════════════════════
function hsctAdvisory(am) {
  const adult = am >= M.y18;
  if (adult) {
    return {
      title: 'Post-HSCT pneumococcal series (adult) — advisory',
      coordinateFlag: 'Coordinate with the transplant/ID team — your center may use its own post-HSCT protocol. The schedule below is the Fred Hutch Long-Term Follow-Up guideline (institution-specific, titer-guided, not ACIP).',
      recs: [
        rec({
          vaccine: 'PCV', status: 'risk-based', advisory: true,
          doseLabel: 'PCV20 ×3: at ≥6 months, ≥8 months, and ≥10 months after HSCT (no PPSV23)',
          dueToday: false, earliestNextDate: null,
          brands: ['PCV20 (Prevnar 20)'],
          note: 'Adult post-HSCT: 3 doses of PCV20 at approximately ≥6, ≥8, and ≥10 months after transplant. NO PPSV23 in the adult post-HSCT row. Titer-guided: check baseline S. pneumoniae IgG (23 serotypes) before the first PCV20, and recheck 1–2 months after EACH dose. A seroprotective IgG response to ≥15 of the 20 PCV20 serotypes means no further PCV20 is needed.',
          refs: ['fredHutchLTFU'],
        }),
      ],
    };
  }
  return {
    title: 'Post-HSCT pneumococcal series (child <19y) — advisory',
    coordinateFlag: 'Coordinate with the transplant/ID team — your center may use its own post-HSCT protocol. Timing below is relative to transplant (no calendar due-dates).',
    recs: [
      rec({
        vaccine: 'PCV', status: 'risk-based', advisory: true,
        doseLabel: '4 doses of PCV20, beginning 3–6 months after HSCT: give 3 doses 4 weeks apart, then a 4th dose at least 6 months after dose 3 and at least 12 months after HSCT',
        dueToday: false, earliestNextDate: null,
        brands: ['PCV20 (Prevnar 20)'],
        note: 'Child post-HSCT (prior pneumococcal history is nullified — full re-vaccination): 4 doses of PCV20 beginning 3–6 months after HSCT. Give 3 doses 4 weeks apart, then a 4th dose ≥6 months after dose 3 AND ≥12 months after HSCT. If PCV20 is unavailable: 3 doses of PCV15 (4 weeks apart) starting 3–6 months post-HSCT, then PPSV23 ≥12 months after HSCT — OR, with chronic GVHD, a 4th PCV15 ≥12 months after HSCT instead of PPSV23.',
        refs: ['p2016Table5'],
      }),
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  PCV21 geographic advisory (adults only)
// ═══════════════════════════════════════════════════════════════════════════
function pcv21GeoNote(am, recs) {
  const adult = am >= M.y18;
  if (!adult) return null;
  const offersPcv21 = recs.some((r) => (r.brands || []).some((b) => b.includes('PCV21')));
  if (!offersPcv21) return null;
  return {
    note: 'PCV21 (Capvaxive) does not contain serotype 4. In regions where serotype 4 causes a high share of pneumococcal disease (e.g., Alaska, Colorado, the Navajo Nation, New Mexico, Oregon), PCV20 — or PCV15 followed by PPSV23 — may provide broader coverage. This is an advisory note, not a hard rule.',
    citations: resolveRefs(['mmwr7336a3']),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════
export function recommend(input) {
  const am = input.ageMonths ?? 0;
  const riskIds = input.riskIds ?? [];
  const today = todayISO(input.today);
  const rawPcv = (input.pcvDoses ?? []).filter(Boolean);
  const rawPpsv = (input.ppsv23Doses ?? []).filter(Boolean);

  // Validate + filter to effective lists (PCV7 dropped; invalid doses dropped).
  const pcvAnalysis = analyzeHistory('PCV', rawPcv, am, today);
  const ppsvAnalysis = analyzeHistory('PPSV23', rawPpsv, am, today);
  const effectivePcv = pcvAnalysis.effective;
  const effectivePpsv = ppsvAnalysis.effective;

  const pcv = summarizePcv(effectivePcv, am, today);
  const ppsv = { count: effectivePpsv.length, effective: effectivePpsv };

  // ── Standard (age/history/risk) recommendations ──────────────────────
  let recs;
  if (am < M.m24) {
    recs = pcvInfant(am, pcv, today);
  } else if (am < M.y18) {
    // Children 2–18y: at-risk pathway wins over healthy when a risk is present.
    if (pedsRiskRowClass(riskIds)) {
      recs = pcvRiskChild(am, riskIds, pcv, ppsv, today);
    } else {
      recs = pcvHealthyChild(am, pcv, ppsv, today);
    }
  } else {
    recs = pcvAdult(am, riskIds, pcv, ppsv, today);
  }

  // ── HSCT advisory block (prominent at top; standard recs still shown) ──
  const hsct = hasHSCT(riskIds) ? hsctAdvisory(am) : null;

  // ── PCV21 geographic advisory ─────────────────────────────────────────
  const pcv21Geo = pcv21GeoNote(am, recs);

  return {
    recs,
    hsct,
    pcv21Geo,
    perDose: { pcv: pcvAnalysis.perDose, ppsv23: ppsvAnalysis.perDose },
    meta: { ageMonths: am, today, riskIds, pcvCount: pcv.count, ppsv23Count: ppsv.count },
  };
}
