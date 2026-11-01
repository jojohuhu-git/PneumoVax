// N1 (owner decision 2026-10-16) — PCV21 given between 18 and 19 counts, and
// says so out loud.
//
// THE GAP. PCV21 (Capvaxive) has two different ages attached to it, one year
// apart, and until now the app only knew about one of them:
//
//   FDA licence          >= 18 years   PCV21_MIN_AGE_M   (216 months)
//   ACIP recommendation  >= 19 years   ADULT_SCHED_MIN_M (228 months)
//
// Sources, both read live on 2026-10-16 (MMWR mm7336a3,
// https://www.cdc.gov/mmwr/volumes/73/wr/mm7336a3.htm):
//   "21-valent pneumococcal conjugate vaccine (PCV) (PCV21; CAPVAXIVE; Merck
//    Sharp & Dohme, LLC) for adults aged >=18 years"
//   "PCV21 as an option for adults aged >=19 years who are currently
//    recommended to receive a dose of PCV"
//
// Measured before the fix, with four patients through `analyzeBoth`: a PCV21
// dose given the day the patient turned 18, at 18y 6m, and the day they turned
// 19 were **indistinguishable on screen** — all three read a green
// "Dose 1 of 1" chip with `reasons: []`, nothing said. A dose a year ahead of
// ACIP's recommendation looked exactly like one on schedule.
//
// THE OWNER'S DECISION (2026-10-16): count the dose — it is validly licensed —
// but say it was given before the recommended starting age, and say plainly
// that it does **not** need repeating. Her words: "it is ok to count 18y as a
// valid dose but would make a note that this is given off schedule since CDC
// recommends starting PCV21 [at] age 19. It does not need repeating though."
//
// WHY THERE IS NO NEW CHIP. S14-2 (owner decision 2026-10-11) settled that the
// chip says how a dose COUNTS and timing lives in the sentence below it. This
// is a timing caveat on a dose that counts, so it reuses `advise()` — the same
// surface three interval rules already use — and the chip stays the green
// "Dose 1 of 1". Asserted below on both halves: the chip does NOT move, the
// sentence DOES appear.
//
// The two numbers in the sentence come from the two constants, never from a
// hand-typed "18" or "19" — CLAUDE.md forbids collapsing them, and a sentence
// naming them both is where a collapse would show first.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeBoth } from '../validate.js';
import { doseChipLabel, doseChipClass } from '../../components/doseChipLabel.js';
import { PCV21_MIN_AGE_M, ADULT_SCHED_MIN_M } from '../scheduleConstants.js';

const TODAY = '2026-10-16';

// One PCV21 dose, one patient. `riskIds` only decides whether a dose is owed;
// it never touches the age verdict, so every case here uses the same tick.
function pcv21Dose({ dob, doseDate, ageMonths }) {
  const out = analyzeBoth({
    pcvDoses: [{ date: doseDate ?? undefined, product: 'PCV21' }],
    ppsv23Doses: [],
    ageMonths,
    today: TODAY,
    dob,
    riskIds: ['hiv'],
  });
  return out.pcv.perDose[0];
}

const noteOf = (d) => (d.reasons ?? []).find((r) => /recommend/i.test(r) && /PCV21/.test(r)) ?? null;

describe('N1 — a PCV21 dose given before ACIP\'s recommended age counts, and says so', () => {
  it('a dose given the day the patient turned 18 counts, and carries the note', () => {
    // dob 2008-10-16 → turns 18 exactly on TODAY; the dose is dated today.
    const d = pcv21Dose({ dob: '2008-10-16', doseDate: '2026-10-16', ageMonths: 216 });

    expect(d.status).toBe('valid');
    expect(d.doesNotCount).toBeFalsy();
    expect(d.effectiveDoseNum).toBe(1);
    expect(d.earlyAdvisory).toBe(true);

    const note = noteOf(d);
    expect(note).not.toBeNull();
    // Both ages named, so the clinician can see the one-year gap itself.
    expect(note).toContain('18 years');
    expect(note).toContain('19 years');
    // The reassurance the owner asked for, in her terms.
    expect(note).toMatch(/does not need repeating/i);
    // And it must never read like the repeat advice an invalid dose gets.
    expect(note).not.toMatch(/does not count/i);
  });

  it('the chip does NOT move — it still reads "Dose 1 of 1", still green (S14-2)', () => {
    const d = pcv21Dose({ dob: '2008-10-16', doseDate: '2026-10-16', ageMonths: 216 });
    expect(doseChipLabel(d, 1)).toBe('Dose 1 of 1');
    expect(doseChipClass(d)).toBe('dose-val-chip dose-val-valid');
    // Specifically NOT a chip that means the dose does not count.
    expect(doseChipLabel(d, 1)).not.toMatch(/repeat|Invalid|Off-window|Not counted/i);
  });

  it('a dose given at 18y 6m to a patient now 19y 6m still carries the note', () => {
    // The verdict must follow the age AT THE DOSE, not the age today — the
    // S10-N1 lesson, which this rule is the newest instance of.
    const d = pcv21Dose({ dob: '2007-04-16', doseDate: '2025-10-16', ageMonths: 234 });
    expect(d.status).toBe('valid');
    expect(noteOf(d)).not.toBeNull();
  });

  it('18y 11m — the last month before the recommendation — carries the note', () => {
    const d = pcv21Dose({ dob: '2007-11-16', doseDate: '2026-10-16', ageMonths: 227 });
    expect(d.status).toBe('valid');
    expect(noteOf(d)).not.toBeNull();
  });

  // ── Controls: the three verdicts that must NOT move ──────────────────
  it('CONTROL — a dose given the day the patient turned 19 says nothing', () => {
    const d = pcv21Dose({ dob: '2007-10-16', doseDate: '2026-10-16', ageMonths: 228 });
    expect(d.status).toBe('valid');
    expect(d.earlyAdvisory).toBeFalsy();
    expect(noteOf(d)).toBeNull();
  });

  it('CONTROL — a 55-year-old\'s dose says nothing', () => {
    const d = pcv21Dose({ dob: '1971-10-16', doseDate: '2026-10-16', ageMonths: 660 });
    expect(d.status).toBe('valid');
    expect(noteOf(d)).toBeNull();
  });

  it('CONTROL — below 18 is still INVALID, and that verdict is untouched', () => {
    const d = pcv21Dose({ dob: '2008-11-16', doseDate: '2026-10-16', ageMonths: 215 });
    expect(d.status).toBe('invalid');
    expect(d.doesNotCount).toBe(true);
    expect(d.reasons.join(' ')).toMatch(/licensed for adults ≥18 years only/);
    // The owner's "counts from 18" ruling must not have loosened the floor.
    expect(d.reasons.join(' ')).toMatch(/does not count/);
  });

  // ── The dateless dose: say it only when it is certain ────────────────
  it('an undated PCV21 on a patient who is currently 18 carries the note', () => {
    // A past dose cannot have been given later than today, so a patient who is
    // 18 TODAY cannot have had it at 19 — the note is certain even with no
    // date. Same reasoning the dateless minimum-age verdict already uses.
    const d = pcv21Dose({ dob: '2008-10-16', doseDate: null, ageMonths: 216 });
    expect(d.status).toBe('unknown');
    expect(d.doesNotCount).toBeFalsy();
    expect(noteOf(d)).not.toBeNull();
  });

  it('CONTROL — an undated PCV21 on a 25-year-old says nothing (it cannot be known)', () => {
    const d = pcv21Dose({ dob: '2001-10-16', doseDate: null, ageMonths: 300 });
    expect(d.status).toBe('unknown');
    expect(noteOf(d)).toBeNull();
  });
});

describe('N1 — the two ages come from the two constants, not from typed numbers', () => {
  const srcPath = path.resolve(process.cwd(), 'src/logic/validate.js');
  const src = fs.readFileSync(srcPath, 'utf8');

  it('the constants still mean different things (CLAUDE.md: never collapse)', () => {
    expect(PCV21_MIN_AGE_M).toBe(216);
    expect(ADULT_SCHED_MIN_M).toBe(228);
    expect(PCV21_MIN_AGE_M).not.toBe(ADULT_SCHED_MIN_M);
  });

  it('validate.js does not hand-type "19 years" into the note', () => {
    // The sentence must be built from ADULT_SCHED_MIN_M. A literal would let
    // the constant move while the clinician kept reading the old number — the
    // exact failure S6-1 and S15 were both cleaning up after.
    expect(src).not.toMatch(/'19 years'|"19 years"|`19 years`/);
    expect(src).not.toMatch(/'18 years'|"18 years"|`18 years`/);
  });

  it('the note is reached through advise(), so the dose keeps its number', () => {
    // advise() is deliberately a flag on a VALID result (S14-3). If this rule
    // ever switches to its own status, a dose that counts could stop counting.
    expect(src).toMatch(/pcv21RecommendedAgeNote|adviseIfBeforeRecommendedAge/);
  });
});
