// ─────────────────────────────────────────────────────────────────────────
// checks.mjs — the seven whole-app rule checks (2026-11-05).
//
// Each one asks whether the app agrees with ITSELF, over every patient. None
// of them can tell you the app agrees with CDC: an app that was consistently
// wrong would pass all seven. That is what the live-source comparison in the
// report is for.
//
//   1  Advice is accepted      a dose given on the advised date is never
//                              rejected, called extra, or warned about.
//   2  The plan holds          following the card to the end needs no dose the
//                              first card did not mention.
//   3  Complete means complete no later visit asks for another dose. Owner rule,
//                              2026-11-01: "Complete should only be used if no
//                              additional doses/boosters are needed."
//   4  Options agree           alternative cards for one dose follow one wait.
//   5  Card and chip agree     on the date of the same dose. `earliestValidDate`
//                              is left out on purpose: CLAUDE.md records that it
//                              answers a different question from `repeatDueDate`
//                              ("Keep both"), and only the latter is the date a
//                              clinician is told to act on.
//   6  Age lines are clean     a day either side of a line changes only what the
//                              rule says, and on-the-line matches just-inside.
//   7  Stable over time        looking at the same record on a later date does
//                              not change the advice unexpectedly.
// ─────────────────────────────────────────────────────────────────────────
import { addCalendarMonths, addDays } from '../../src/logic/dateUtils.js';
import { fmtDate } from '../../src/logic/format.js';
import { recommend } from '../../src/logic/recommend.js';
import { askTurnsToComplete, causeOf } from './causes.mjs';
import {
  AGE_LINES, NOTHING_OWED, cardText, code, firstState, mayDecline, noteText, optionsOn, readCard, view,
} from './replay.mjs';

export const CHECK_NAMES = {
  1: 'Advice is accepted',
  2: 'The plan holds',
  3: 'Complete means complete',
  4: 'Options agree',
  5: 'Card and chip agree',
  6: 'Age lines are clean',
  7: 'Stable over time',
};

// ── Counting ─────────────────────────────────────────────────────────────
// One tally per (check, kind, group). A patient is counted once per group
// however many roads reach the fault, and `flags` keeps the raw count of roads.
export function newTally() {
  const groups = new Map();
  const causes = new Map();
  let current = null;
  return {
    setPatient(p) { current = p; },
    add(check, kind, group, detail) {
      const cause = causeOf(check, kind, group);
      const ck = `${cause}\t${check}`;
      let c = causes.get(ck);
      if (!c) { c = { cause, check, grid: 0, typical: 0, last: null }; causes.set(ck, c); }
      if (c.last !== current.key) { c.last = current.key; c[current.group] += 1; }
      const all = `${cause}\tall`;
      let a = causes.get(all);
      if (!a) { a = { cause, check: 'all', grid: 0, typical: 0, last: null }; causes.set(all, a); }
      if (a.last !== current.key) { a.last = current.key; a[current.group] += 1; }
      const k = `${check}\t${kind}\t${group}`;
      let g = groups.get(k);
      if (!g) { g = { check, kind, group, cause, flags: 0, grid: 0, typical: 0, last: null, examples: [] }; groups.set(k, g); }
      g.flags += 1;
      if (g.last !== current.key) {
        g.last = current.key;
        g[current.group] += 1;
        if (g.examples.length < 4) g.examples.push({ key: current.key, input: current.input, detail });
      }
    },
    rows() { return [...groups.values()].map(({ last, ...g }) => g); },
    causes() { return [...causes.values()].map(({ last, ...c }) => c); },
  };
}

const plain = (t) => String(t ?? '')
  .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '<date>')
  .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}, \d{4}/g, '<date>')
  .replace(/\s+/g, ' ')
  .trim();

const road = (trail) => trail.map((d) => `${d.product} ${d.date}`).join(' → ') || '(nothing given yet)';

const ageBand = (m) => (m < 24 ? 'under 2' : m < 72 ? '2-5' : m < 228 ? '6-18' : m < 600 ? '19-49' : m < 780 ? '50-64' : '65+');
const ageMonthsOn = (dob, date) => {
  const [y, m, d] = dob.split('-').map(Number);
  const [Y, M, D] = date.split('-').map(Number);
  return (Y - y) * 12 + (M - m) - (D < d ? 1 : 0);
};

// ── 1. Advice is accepted ────────────────────────────────────────────────
const NOT_ACCEPTED = /not needed|not counted|isn.t counted|extra dose|does not count/i;

function adviceAccepted(tally) {
  return {
    visit({ s, result, trail }) {
      for (const [stream, label] of [['pcv', 'PCV'], ['ppsv23', 'PPSV23']]) {
        const ordered = result.orderedDoses?.[stream] ?? [];
        const verdicts = result.perDose?.[stream] ?? [];
        ordered.forEach((dose, i) => {
          const given = trail.find((t) => t.date === dose.date && t.product === dose.product);
          if (!given) return;
          const v = verdicts[i];
          const why = (v.reasons ?? []).join(' ');
          const kind = v.status !== 'valid' ? 'rejected'
            : v.extraDose ? 'called-extra'
              : NOT_ACCEPTED.test(why) ? 'said-not-needed'
                : v.earlyAdvisory ? 'warned-short' : null;
          if (!kind) return;
          tally.add(1, kind, `${given.card.doseLabel} [${label}] rule=${v.intervalRuleId ?? '-'}`, {
            road: road(trail), advised: `${given.product} on ${given.date} (card seen ${given.seenOn})`,
            viewed: s.today, why: plain(why).slice(0, 260),
          });
        });
      }
    },
  };
}

// ── 2. The plan holds ────────────────────────────────────────────────────
// "Mentioned" is read from the card the clinician chose, not the alternative
// beside it: choosing PCV20 does not mean having read Option B's next steps.
const SAYS_FINISHED = /completes the series/i;
const FOLLOW_ON = /\b(then|followed by|further|next dose|later|booster|another|second|final dose|\d(st|nd|rd|th) (dose|PPSV23))\b/i;

function stripNegatives(t) {
  return t
    .replace(/\b(no|without|not)\s+(a\s+|any\s+)?(further\s+|second\s+|more\s+|additional\s+)?PPSV23\b/gi, '')
    .replace(/Only if PPSV23 was not previously given\.?/gi, '');
}

/** The total a card promises: its own `seriesTotal`, or "dose 1 of 2" in its label. */
function promisedTotal(card) {
  const m = /dose \d+ of (\d+)/.exec(card.doseLabel ?? '');
  return card.seriesTotal ?? (m ? Number(m[1]) : null);
}

function planMentions(first, dose, doneOnThisRoad, alternatives) {
  const text = stripNegatives(cardText(first));
  // §B-OPTIONB19 (owner, 2026-11-07, Cora): Option B now names the adult dose
  // at 19 itself, so a conjugate after it was mentioned.
  if (/If PPSV23 is chosen, at 19\b/.test(text) && /PCV/.test(dose.product ?? '')) return true;
  if (dose.product === 'PPSV23') return /PPSV23/.test(text);
  // "If PCV15 is used, add PPSV23", then a screen offering PCV20 OR that PPSV23:
  // the further dose WAS mentioned, and PCV20 is the other way of giving it.
  if (alternatives.some((r) => r.vaccine === 'PPSV23') && /PPSV23/.test(text)) return true;
  const total = promisedTotal(first);
  const start = Number(/dose (\d+) of/.exec(first.doseLabel ?? '')?.[1] ?? 0);
  if (first.vaccine === 'PCV' && total != null && start && start + doneOnThisRoad - 1 <= total) return true;
  return FOLLOW_ON.test(text) && /PCV/.test(text);
}

function planHolds(tally) {
  return {
    visit({ s, result, trail, quietSince, patient }) {
      if (trail.length < 2 || quietSince) return;
      const last = trail[trail.length - 1];
      if (last.date !== s.today) return;
      const firstCard = trail[0].card;
      const earlier = trail.slice(0, -1);
      const finisher = earlier.find((t) => SAYS_FINISHED.test(t.card.doseLabel ?? ''));
      const when = last.quietSince ? 'after a quiet spell' : 'in sequence';
      const age = ageMonthsOn(patient.input.dob, last.date);
      if (finisher) {
        tally.add(2, 'said-finished', `${finisher.card.doseLabel} ⇒ ${last.card.doseLabel} (${when}, age ${ageBand(age)})`, {
          road: road(trail), finisher: `${finisher.product} ${finisher.date}`, next: `${last.product} ${last.date}`,
        });
        return;
      }
      if (!planMentions(firstCard, last, trail.filter((t) => t.product !== 'PPSV23').length, last.screen ?? [])) {
        tally.add(2, 'not-mentioned', `${firstCard.doseLabel} ⇒ ${last.product}: ${last.card.doseLabel} (${when}, age ${ageBand(age)})`, {
          road: road(trail), firstCard: plain(cardText(firstCard)).slice(0, 300),
        });
      }
    },
  };
}

// ── 3. Complete means complete ───────────────────────────────────────────
const SAID_LATER = /at 19\b|age 19|turns 19|age 50|review again|re-evaluate/i;
const SAID_AT_TWO = /falls? due|fall due/i;

function completeMeansComplete(tally) {
  return {
    visit({ s, result, trail, quietSince, patient }) {
      const recs = result.recs ?? [];
      const asks = recs.filter((r) => !NOTHING_OWED.has(r.status));
      if (asks.length && recs.some((r) => r.status === 'complete')) {
        tally.add(3, 'complete-beside-an-ask', recs.map((r) => r.doseLabel).join(' + '), { road: road(trail), on: s.today });
      }
      if (!quietSince?.complete || !asks.length) return;
      const from = ageMonthsOn(patient.input.dob, quietSince.date);
      const to = ageMonthsOn(patient.input.dob, s.today);
      const crossed = [...AGE_LINES].reverse().find((l) => from < l && to >= l);
      const when = crossed != null ? `at age line ${crossed}m` : 'on a clock, no age line';
      const optional = asks.every(mayDecline) ? 'optional' : 'asks';
      const said = crossed === 24 && SAID_AT_TWO.test(quietSince.text) ? 'says complete, and that a dose falls due at 2'
        : SAID_LATER.test(quietSince.text) ? 'card warned of it' : 'card silent';
      tally.add(3, `${optional}, ${said}`, `${quietSince.label} ⇒ ${asks[0].doseLabel} (${when})`, {
        road: road(trail), completeOn: quietSince.date, askOn: s.today,
        said: plain(quietSince.text).slice(0, 300),
      });
    },
  };
}

// ── 4. Options agree ─────────────────────────────────────────────────────
function optionsAgree(tally) {
  return {
    visit({ s, result, trail, patient }) {
      const { options } = optionsOn(result, patient.input.dob, s.today);
      // "Option B-2" is not an alternative to B-1 but the step after it, so it
      // cannot fall before B-1's own date plus the 8 weeks it names.
      for (const r of result.recs ?? []) {
        const stated = readCard(r, patient.input.dob, s.today).statedDate;
        const stepOne = options.find((o) => /^Option B-1/.test(o.rec.doseLabel ?? ''));
        if (stated && stepOne && stated < addDays(stepOne.date, 56)) {
          tally.add(4, 'second-step-dated-before-the-first-allows', r.doseLabel, {
            road: road(trail), on: s.today, stepOne: stepOne.date, stepTwo: stated,
          });
        }
      }
      const cards = new Map();
      for (const o of options) if (!cards.has(o.rec)) cards.set(o.rec, o.date);
      if (cards.size < 2) return;
      const dates = [...new Set(cards.values())];
      if (dates.length < 2) return;
      const labels = [...cards.keys()].map((r) => r.doseLabel).join(' + ');
      const held = [...cards.keys()].some((r) => /Held to 5 years after/.test(noteText(r)));
      tally.add(4, held ? 'held-by-ruling' : 'different-dates', labels, {
        road: road(trail), on: s.today,
        cards: [...cards].map(([r, d]) => `${r.doseLabel}: ${r.dueToday ? 'today' : d}`).join(' | '),
      });
    },
  };
}

// ── 5. Card and chip agree ───────────────────────────────────────────────
function cardAndChipAgree(tally) {
  return {
    visit({ s, result, trail, patient }) {
      const recs = result.recs ?? [];
      for (const [stream, vaccine] of [['pcv', 'PCV'], ['ppsv23', 'PPSV23']]) {
        for (const d of result.perDose?.[stream] ?? []) {
          const chip = d.repeatDueDate;
          if (!chip) continue;
          // The owner withdrew the date from a chip when nothing is owed
          // (2026-10-25); a chip that no longer prints it has nothing to agree on.
          const said = (d.reasons ?? []).join(' ');
          if (!said.includes(fmtDate(chip))) continue;
          // A date already gone agrees with any card: "from last March".
          if (chip <= s.today) continue;
          const asks = recs.filter((r) => !NOTHING_OWED.has(r.status));
          const same = asks.filter((r) => r.vaccine === vaccine);
          const cards = same.length ? same : asks;
          if (!cards.length) {
            tally.add(5, 'chip-promises-a-date-no-card-asks-for', `${vaccine} rule=${d.intervalRuleId ?? '-'}`, { road: road(trail), on: s.today, chip });
            continue;
          }
          for (const r of cards) {
            const read = readCard(r, patient.input.dob, s.today);
            if (!read.date) continue;
            if (read.date === chip) continue;
            const kind = read.date < chip ? 'card-earlier-than-chip'
              : noteText(r).includes(fmtDate(chip)) ? 'card-later-names-chip-date' : 'card-later-chip-date-unnamed';
            tally.add(5, kind, `${r.doseLabel} vs ${vaccine} chip rule=${d.intervalRuleId ?? '-'}${same.length ? '' : ' (other vaccine)'}`, {
              road: road(trail), on: s.today, chip, card: read.date,
            });
          }
        }
      }
    },
  };
}

// ── 7's replay half: a dated card still stands on its date ───────────────
function adviceStillStands(tally) {
  return {
    arrive({ s, result, option, onTheDay, patient, trail }) {
      const { options } = optionsOn(onTheDay, patient.input.dob, option.date);
      const stands = options.some((o) => o.product === option.product && o.date === option.date);
      if (stands) return;
      const from = ageMonthsOn(patient.input.dob, s.today);
      const to = ageMonthsOn(patient.input.dob, option.date);
      const crossed = [...AGE_LINES].reverse().find((l) => from < l && to >= l);
      const later = options.find((o) => o.product === option.product);
      tally.add(7, later ? 'advice-moved-on-its-day' : 'advice-gone-on-its-day',
        `${option.rec.doseLabel} [${option.product}]${crossed != null ? ` crossed ${crossed}m` : ''} ⇒ ${(onTheDay.recs ?? []).map((r) => r.doseLabel).join(' + ') || '(no card)'}`,
        { road: road(trail), seenOn: s.today, advised: option.date, movedTo: later?.date ?? null });
    },
  };
}

/** The checks that follow the app's advice forward, combined into one walk. */
export function replayChecks(tally, wanted) {
  const list = [];
  if (wanted.has(1)) list.push(adviceAccepted(tally));
  if (wanted.has(2)) list.push(planHolds(tally));
  if (wanted.has(3)) list.push(completeMeansComplete(tally));
  if (wanted.has(4)) list.push(optionsAgree(tally));
  if (wanted.has(5)) list.push(cardAndChipAgree(tally));
  if (wanted.has(7)) list.push(adviceStillStands(tally));
  return {
    visit: (ctx) => list.forEach((v) => v.visit?.(ctx)),
    arrive: (ctx) => list.forEach((v) => v.arrive?.(ctx)),
    gap: (ctx) => ctx.gaps.forEach((g) => tally.add('harness', 'unreadable-card', g.doseLabel, { on: ctx.s.today })),
    endless: (ctx) => tally.add('harness', 'dose-cap-reached', ctx.trail.at(-1)?.card?.doseLabel ?? '-', { road: road(ctx.trail) }),
  };
}

// ── 6. Age lines are clean ───────────────────────────────────────────────
// Only the AGE moves. The date of birth shifts a day each way while today and
// every dose date stay put, so no interval changes and a difference can only
// come from the age. (Moving today instead would drag every interval a day and
// make the 8-week and 5-year edges of the grid look like age faults.)
const CARD_FIELDS = ['vaccine', 'status', 'doseLabel', 'dueToday', 'seriesTotal', 'primaryTotal'];
const DOSE_FIELDS = ['status', 'intervalRuleId', 'effectiveDoseNum', 'doesNotCount', 'earlyAdvisory', 'extraDose'];

export function signature(result) {
  const cards = (result.recs ?? []).map((r) => ({
    ...Object.fromEntries(CARD_FIELDS.map((f) => [f, r[f] ?? null])),
    dated: !!r.earliestNextDate,
    brands: (r.brands ?? []).map(code).join('/'),
  }));
  const doses = {};
  for (const stream of ['pcv', 'ppsv23']) {
    doses[stream] = (result.perDose?.[stream] ?? []).map((d) => Object.fromEntries(DOSE_FIELDS.map((f) => [f, d[f] ?? null])));
  }
  return { excluded: !!result.excluded, cards, doses };
}

/** Plain field-by-field differences between two signatures, as short strings. */
export function differences(a, b) {
  const out = [];
  if (a.cards.length !== b.cards.length || a.cards.some((c, i) => c.doseLabel !== b.cards[i].doseLabel)) {
    out.push(`cards: ${a.cards.map((c) => c.doseLabel).join(' + ') || '(none)'} → ${b.cards.map((c) => c.doseLabel).join(' + ') || '(none)'}`);
  } else {
    a.cards.forEach((c, i) => {
      for (const f of Object.keys(c)) if (c[f] !== b.cards[i][f]) out.push(`card ${c.doseLabel}: ${f} ${c[f]} → ${b.cards[i][f]}`);
    });
  }
  for (const stream of ['pcv', 'ppsv23']) {
    a.doses[stream].forEach((d, i) => {
      for (const f of DOSE_FIELDS) if (d[f] !== b.doses[stream][i]?.[f]) out.push(`${stream} dose ${i + 1}: ${f} ${d[f]} → ${b.doses[stream][i]?.[f]}`);
    });
  }
  return out;
}

const seeOn = (patient, dob) => recommend({
  dob, riskIds: patient.input.riskIds, today: patient.input.today,
  pcvDoses: patient.input.pcvDoses, ppsv23Doses: patient.input.ppsv23Doses,
});

export function ageLineCheck(tally, patient, expected) {
  const { dob, ageMonths, today } = patient.input;
  if (!AGE_LINES.includes(ageMonths)) return;
  const short = addDays(dob, 1);
  const inside = addDays(dob, -1);
  const dates = [...patient.input.pcvDoses, ...patient.input.ppsv23Doses].map((d) => d.date);
  if (dates.some((d) => d < short)) return;
  const seen = [short, dob, inside].map((x) => seeOn(patient, x));
  const [a, b, c] = seen.map(signature);
  const onVsInside = differences(b, c);
  if (!onVsInside.length) {
    const words = (r) => plain((r.recs ?? []).map(cardText).join(' ¦ '));
    if (words(seen[1]) !== words(seen[2])) {
      tally.add(6, 'on-the-line-reads-differently-from-just-inside', `${ageMonths}m: ${(seen[1].recs ?? []).map((r) => r.doseLabel).join(' + ')}`, {
        on: words(seen[1]).slice(0, 400), inside: words(seen[2]).slice(0, 400),
      });
    }
  }
  if (onVsInside.length) {
    tally.add(6, 'on-the-line-differs-from-just-inside', `${ageMonths}m: ${onVsInside[0]}`, { all: onVsInside.slice(0, 6), today });
  }
  const newestDose = dates.reduce((x, y) => (x > y ? x : y), '');
  for (const d of differences(a, b)) {
    // A verdict on a dose given long ago has no business moving on a birthday,
    // so those are called out apart from a card moving, which is the line's job.
    const aboutADose = /^(pcv|ppsv23) dose/.test(d);
    const allowed = expected(ageMonths, d, patient);
    // A dose dated this very day moves across the line WITH the date of birth,
    // so its age at the dose really did change: that is the rule working.
    // R2's ruling covers a date ON or AFTER the 19th birthday. A dose already due
    // the day before stays a child's dose, so it is named apart: a card that is
    // merely DATED and still turns to Complete is the fault itself, and stays red.
    const dueNow = (seen[0].recs ?? []).some((r) => r.dueToday);
    const kind = askTurnsToComplete(ageMonths, d) ? `${dueNow ? 'due-today' : 'ask'}-turns-to-complete-at-19`
      : allowed || (aboutADose && newestDose === today) ? 'line-changes-what-the-rule-says'
        : aboutADose ? 'recorded-dose-changed-at-line' : 'line-changes-something-else';
    tally.add(6, kind, `${ageMonths}m: ${plain(d)}`, { today });
  }
}

/**
 * Doses given a day either side of a line. The patient is viewed on one fixed
 * later date, so the only thing different between the runs is the age at which
 * the last dose was given. Comparing the dose ON the line with the dose a day
 * after it is the ruling her first-birthday fix turned on ("an age-line fix
 * must reach the spacing rules"); -1, -4 and -5 show CDC's 4-day grace.
 */
export const DOSE_LINES = [
  { product: 'PCV20', stream: 'pcv', atM: [7, 12, 24, 60, 72, 216, 228, 600, 780] },
  { product: 'PCV15', stream: 'pcv', atM: [7, 12, 24, 60, 72, 228, 600] },
  { product: 'PCV13', stream: 'pcv', atM: [7, 12, 24, 72] },
  { product: 'PCV21', stream: 'pcv', atM: [216, 228] },
  { product: 'PPSV23', stream: 'ppsv23', atM: [24, 72, 228, 600, 780] },
];
const DOSE_LINE_PRIORS = [
  { name: 'nothing before', pcv: [] },
  { name: 'one dose at 2m', pcv: [['PCV13', 2]] },
  { name: 'three at 2-4-6m', pcv: [['PCV13', 2], ['PCV13', 4], ['PCV13', 6]] },
  { name: 'four to 12m', pcv: [['PCV13', 2], ['PCV13', 4], ['PCV13', 6], ['PCV13', 12]] },
];
const DOSE_LINE_DOB = '2000-03-10';

export function doseLineCases(riskProfiles) {
  const cases = [];
  for (const { product, stream, atM } of DOSE_LINES) {
    for (const L of atM) {
      for (const prior of DOSE_LINE_PRIORS) {
        if (prior.pcv.some(([, at]) => at >= L)) continue;
        for (const riskIds of riskProfiles) cases.push({ product, stream, L, prior, riskIds });
      }
    }
  }
  return cases;
}

export function doseLineCheck(tally, c, expected) {
  const { product, stream, L, prior, riskIds } = c;
  const line = addCalendarMonths(DOSE_LINE_DOB, L);
  const today = addDays(line, 90);
  const pcvBase = prior.pcv.map(([p, at]) => ({ product: p, date: addCalendarMonths(DOSE_LINE_DOB, at) }));
  const see = (shift) => {
    const dose = { product, date: addDays(line, shift) };
    return signature(recommend({
      dob: DOSE_LINE_DOB, riskIds, today,
      pcvDoses: stream === 'pcv' ? [...pcvBase, dose] : pcvBase,
      ppsv23Doses: stream === 'ppsv23' ? [dose] : [],
    }));
  };
  const on = see(0);
  const after = see(1);
  const where = `${product} at ${L}m, ${prior.name}`;
  const onVsInside = differences(on, after);
  if (onVsInside.length) {
    tally.add(6, 'dose-on-the-line-differs-from-a-day-after', `${product} at ${L}m: ${onVsInside[0]}`, { where, riskIds, all: onVsInside.slice(0, 6) });
  }
  // CDC's four-day grace: a dose up to 4 days short of an age floor counts.
  const graced = differences(see(-4), on);
  const before = differences(see(-5), see(-4));
  for (const d of [...graced.map((x) => `inside grace: ${x}`), ...before.map((x) => `edge of grace: ${x}`)]) {
    const allowed = expected(L, d, { product, prior, riskIds });
    tally.add(6, allowed ? 'dose-line-changes-what-the-rule-says' : 'dose-line-changes-something-else', `${product} at ${L}m: ${plain(d)}`, { where, riskIds });
  }
}

// ── 7. Stable over time ──────────────────────────────────────────────────
export const LATER_VIEWS = [1, 7, 28, 90, 365, 1827];

const DOSE_STABLE_FIELDS = ['status', 'intervalRuleId', 'effectiveDoseNum', 'doesNotCount', 'extraDose', 'earlyAdvisory', 'repeatDueDate', 'earliestValidDate'];

export function stableOverTime(tally, patient) {
  const s = firstState(patient);
  const base = view(patient, s);
  if (base.excluded) return;
  const { dob, today } = patient.input;
  const lineDates = AGE_LINES.map((m) => addCalendarMonths(dob, m));
  for (const k of LATER_VIEWS) {
    const later = addDays(today, k);
    const r = view(patient, { ...s, today: later });
    // A recorded dose was given when it was given. Nothing about looking at it
    // on a later day can change whether it counted, across any age line.
    for (const stream of ['pcv', 'ppsv23']) {
      (base.perDose?.[stream] ?? []).forEach((d, i) => {
        const e = r.perDose?.[stream]?.[i];
        for (const f of DOSE_STABLE_FIELDS) {
          if ((d[f] ?? null) !== (e?.[f] ?? null)) {
            const crossed19 = addCalendarMonths(dob, 228) > today && addCalendarMonths(dob, 228) <= later;
            tally.add(7, 'recorded-dose-verdict-changed', `${stream} ${f}: ${d[f] ?? '-'} → ${e?.[f] ?? '-'}${crossed19 ? ' (crossing 19)' : ''}`, { viewedLater: later, was: d[f] ?? null, now: e?.[f] ?? null });
          }
        }
      });
    }
    if (lineDates.some((d) => d > today && d <= later)) continue;
    for (const c of base.recs ?? []) {
      const same = (r.recs ?? []).find((x) => x.vaccine === c.vaccine && x.doseLabel === c.doseLabel);
      if (!same) {
        tally.add(7, 'card-changed-with-no-age-line', `${c.doseLabel} ⇒ ${(r.recs ?? []).map((x) => x.doseLabel).join(' + ') || '(none)'}`, { viewedLater: later, was: c.earliestNextDate ?? (c.dueToday ? 'due' : c.status) });
        continue;
      }
      if (c.earliestNextDate) {
        const expectDue = later >= c.earliestNextDate;
        if (expectDue ? !same.dueToday : same.earliestNextDate !== c.earliestNextDate) {
          tally.add(7, 'advised-date-moved', `${c.doseLabel}`, { viewedLater: later, was: c.earliestNextDate, now: same.earliestNextDate ?? (same.dueToday ? 'due' : same.status) });
        }
      } else if (c.dueToday && !same.dueToday) {
        tally.add(7, 'due-today-stopped-being-due', `${c.doseLabel}`, { viewedLater: later, now: same.earliestNextDate ?? same.status });
      } else if (c.status !== same.status) {
        tally.add(7, 'status-changed-with-no-age-line', `${c.doseLabel}: ${c.status} → ${same.status}`, { viewedLater: later });
      }
    }
  }
}

