// ─────────────────────────────────────────────────────────────────────────
// replay.mjs — reading a card the way a clinician reads it, and following it.
//
// The shared half of the whole-app rule checks (2026-11-05). Everything here
// is a question about the app's own answers; nothing here knows a clinical
// rule. `checks.mjs` holds the seven checks; `run.mjs` runs them.
//
// ── The first thing this file has to get right: a card with no date ──────
//
// The throwaway version of this replay treated every action card as "give it
// on `earliestNextDate`, or today if there is none". 924 of its 990 flags came
// from that one sentence: "PCV dose 5 of 5" reads *"This final dose is not due
// until the patient reaches 12 months"*, and has no date field at all. So
// `readCard()` sorts every card into one of a closed list of kinds, and a card
// it cannot sort is reported as a HARNESS GAP. It is never defaulted to today.
// That is the rule that keeps a false flag from looking like a clinical one.
// ─────────────────────────────────────────────────────────────────────────
import { ENGINE_AGE_LINES, recommend } from '../../src/logic/recommend.js';
import { addCalendarMonths, addDays } from '../../src/logic/dateUtils.js';
import { PCV21_MIN_AGE_M } from '../../src/logic/scheduleConstants.js';
import { buildCases, buildTypicalCases } from '../../src/test-grid.js';

/** Every patient the checks run over. `grid` is the two groups the report counts apart. */
export function allPatients({ only } = {}) {
  const grid = buildCases().map((c) => ({ ...c, group: 'grid' }));
  const typical = buildTypicalCases().map((c) => ({ ...c, group: 'typical' }));
  if (only === 'grid') return grid;
  if (only === 'typical') return typical;
  return [...grid, ...typical];
}

export const code = (b) => String(typeof b === 'string' ? b : b?.key ?? b?.label ?? '').split(' ')[0];
export const noteText = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);
export const cardText = (r) => `${r.doseLabel ?? ''} ${noteText(r)}`;
export const NOTHING_OWED = new Set(['complete', 'not-indicated']);

/** The screen for one patient on one day, exactly as the app computes it from a date of birth. */
export function view(patient, s) {
  return recommend({
    dob: patient.input.dob,
    riskIds: patient.input.riskIds,
    today: s.today,
    pcvDoses: s.pcv,
    ppsv23Doses: s.ppsv,
  });
}

export function firstState(patient) {
  return {
    today: patient.input.today,
    pcv: [...patient.input.pcvDoses],
    ppsv: [...patient.input.ppsv23Doses],
  };
}

/**
 * What a card is asking. A closed list, on purpose:
 *
 *   nothing     complete / not indicated — asks for no dose.
 *   now         due today.
 *   dated       due on `earliestNextDate`.
 *   age-gated   NO date field, but the sentence names an age. Its date is that
 *               birthday, worked out from the date of birth.
 *   next-step   the second half of a two-step option ("Option B-2"): it can
 *               only be acted on after step 1, and the card written after
 *               step 1 carries the date.
 *   unreadable  anything else. Reported as a harness gap, never guessed at.
 */
export function readCard(r, dob, today) {
  if (NOTHING_OWED.has(r.status)) return { kind: 'nothing' };
  // Before the date test, because some of these DO carry a date. It is still
  // step 2 of a two-step road: nobody can take it without taking step 1, and
  // the check for a date that ignores step 1 is `optionsAgree`'s.
  if (/^Option B-2/.test(r.doseLabel ?? '')) return { kind: 'next-step', statedDate: r.earliestNextDate ?? null };
  if (r.dueToday) return { kind: 'now', date: today };
  if (r.earliestNextDate) return { kind: 'dated', date: r.earliestNextDate > today ? r.earliestNextDate : today };
  if (/not due until the patient reaches 12 months/.test(noteText(r))) {
    const date = addCalendarMonths(dob, 12);
    return { kind: 'age-gated', date: date > today ? date : today };
  }
  return { kind: 'unreadable' };
}

/**
 * Whether a clinician may pass on this card and stay in step with the app: a
 * shared decision is optional, and "Review at age 50 — or PCV20…" offers the
 * review as the first answer.
 */
export const mayDecline = (r) => r.status === 'shared-decision' || /^Review at age 50/.test(r.doseLabel ?? '');

/**
 * Every dose a screen offers: one per card, per product on that card. A card
 * naming three products is three different roads, and they do not all end in
 * the same place (PCV20 finishes where PCV15 owes a PPSV23), so each is walked.
 */
export function optionsOn(result, dob, today) {
  const options = [];
  const gaps = [];
  for (const r of result.recs ?? []) {
    const read = readCard(r, dob, today);
    if (read.kind === 'unreadable') gaps.push(r);
    if (!read.date) continue;
    const products = r.vaccine === 'PPSV23' ? ['PPSV23'] : [...new Set((r.brands ?? []).map(code).filter(Boolean))];
    if (!products.length) { gaps.push(r); continue; }
    for (const product of products) options.push({ rec: r, product, date: read.date, read });
  }
  return { options, gaps };
}

const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

export function give(s, product, date) {
  const dose = { product, date, advised: true };
  return product === 'PPSV23'
    ? { today: date, pcv: s.pcv, ppsv: [...s.ppsv, dose].sort(byDate) }
    : { today: date, pcv: [...s.pcv, dose].sort(byDate), ppsv: s.ppsv };
}

/** The ages at which the app's answer can turn, in months, from the engine's own table. */
export const AGE_LINES = [...new Set([...Object.values(ENGINE_AGE_LINES), PCV21_MIN_AGE_M])].sort((a, b) => a - b);

/** Oldest age a walk looks at: past the last line (65) and past a five-year clock from it. */
const WALK_TO_AGE_M = 852;

/**
 * The next day anything could change for a patient who is given nothing:
 * each age line, and each clock running from the last doses (8 weeks, a year,
 * five years). A walk looks at every one of them, not only at birthdays,
 * because "complete" can be undone by a clock as easily as by an age.
 */
export function checkpoints(patient, s) {
  const { dob } = patient.input;
  const out = new Set();
  for (const m of AGE_LINES) out.add(addCalendarMonths(dob, m));
  const dates = [...s.pcv, ...s.ppsv].map((d) => d.date).filter(Boolean);
  for (const d of dates) {
    out.add(addDays(d, 56));
    out.add(addCalendarMonths(d, 12));
    out.add(addCalendarMonths(d, 60));
  }
  const end = addCalendarMonths(dob, WALK_TO_AGE_M);
  return [...out].filter((d) => d > s.today && d <= end).sort();
}

/** What the screen said on the day the walk started moving with nothing given. */
const quietFrom = (result, date) => {
  const recs = result.recs ?? [];
  return {
    date,
    complete: recs.some((r) => r.status === 'complete'),
    label: recs.map((r) => r.doseLabel).join(' + '),
    text: recs.map(cardText).join(' '),
  };
};

const stateKey = (s) => `${s.today}|${s.pcv.map((d) => `${d.product}@${d.date}`).join(',')}|${s.ppsv.map((d) => d.date).join(',')}`;
const MAX_ADVISED_DOSES = 8;

/**
 * Follow one patient down every road the app offers.
 *
 * At each visit: every dose on the screen is a branch, given on the date its
 * card says. A screen that asks for nothing (or whose ask the clinician may
 * decline) walks forward to the next checkpoint with nothing given. The walk
 * ends when no checkpoint is left. A road that passes MAX_ADVISED_DOSES is
 * reported: the app would otherwise be advising doses for ever.
 *
 * `visitor` methods, all optional:
 *   visit(ctx)   every screen reached    { patient, s, result, trail, first }
 *   arrive(ctx)  reaching an advised date, BEFORE the dose is given
 *   gap(ctx)     a card this file could not read
 *   endless(ctx) the dose cap was hit
 *
 * `trail` is the doses given so far on this road, each with the card that
 * asked for it. `first` is the first screen. `quietSince` is set while the walk
 * is moving forward with nothing given: the day it started, and what the
 * screen said that day.
 */
export function walk(patient, visitor) {
  const seen = new Set();
  const { dob } = patient.input;
  const root = firstState(patient);
  const first = view(patient, root);
  if (first.excluded) return { states: 0 };
  const stack = [{ s: root, trail: [], quietSince: null }];
  while (stack.length) {
    const { s, trail, quietSince } = stack.pop();
    const k = `${stateKey(s)}|${quietSince ? `q${quietSince.complete ? 'c' : ''}` : ''}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const result = view(patient, s);
    const ctx = { patient, s, result, trail, first, quietSince };
    visitor.visit?.(ctx);
    const { options, gaps } = optionsOn(result, dob, s.today);
    if (gaps.length) visitor.gap?.({ ...ctx, gaps });

    if (options.length && trail.length >= MAX_ADVISED_DOSES) {
      visitor.endless?.(ctx);
      continue;
    }
    for (const o of options) {
      if (o.date !== s.today) {
        visitor.arrive?.({ ...ctx, option: o, onTheDay: view(patient, { ...s, today: o.date }) });
      }
      stack.push({
        s: give(s, o.product, o.date),
        trail: [...trail, {
          product: o.product, date: o.date, card: o.rec, seenOn: s.today, kind: o.read.kind, quietSince, screen: result.recs ?? [],
        }],
        quietSince: null,
      });
    }
    const asksNothing = !options.length || (result.recs ?? []).every((r) => mayDecline(r) || NOTHING_OWED.has(r.status));
    if (asksNothing) {
      const next = checkpoints(patient, s)[0];
      if (next) stack.push({ s: { ...s, today: next }, trail, quietSince: quietSince ?? quietFrom(result, s.today) });
    }
  }
  return { states: seen.size };
}
