// C12 (2026-10-29) — the LAST uncredited source in the app, and the note the
// owner asked for in the same breath.
//
// ── WHAT SHE WAS SHOWN ───────────────────────────────────────────────────
//
// Nora, 10 years 5 months, no risk conditions, no pneumococcal doses ever. Her
// card, driven live in the running app before anything was asked:
//
//     Not indicated (healthy 5–18y)
//     No PCV is indicated — healthy children 5–18 years are not routinely
//     caught up [1].
//     Why this: CDC's catch-up row covers healthy children only through age 4.
//     PCV is recommended at this age only if a risk condition is present [1].
//
//     SOURCES   [1] CDC Child/Adolescent Notes   [2] CDC PCV Catch-up Job Aid
//
// Nothing on the card pointed at [2]. That is the owner's original complaint —
// "I forget why there are multiple source chips listed if its only citing one
// of them" — and after C9 took p2016 off this card, this was the LAST one left
// anywhere: `npx vite-node scripts/uncreditedSources.mjs` reported exactly ONE
// (document, statement) pair over 17,407 cards, worth 1,584 of them.
//
// ── WHY IT HAD SAT THERE SINCE 17 OCTOBER ────────────────────────────────
//
// It was C7's "document 4, statement 1" — formally an owner decision, put to
// her twice, and she asked that it not be pushed at her again. Every handoff
// since has carried "do not re-ask unprompted". On 2026-10-29 she prompted it
// herself ("start on the last citation"), so it was raised once, with the card
// above and both readings, and she chose:
//
//     "Take chip off - can you add a comment to re-evaluate pneumococcal
//      vaccines once the patient turns 50 years old and cite the necessary
//      adult reference?"
//
// ── READING THE DOCUMENT BEFORE REMOVING IT (the FINDING F discipline) ────
//
// The job aid was re-read in full on 2026-10-29 from the owner's own saved copy
// (`~/Downloads/pneumococcal.pdf`, 95,267 bytes — byte-for-byte the length
// cdc.gov serves today, and the same sha256 65aec99a… C8 recorded). All three
// pages, every table:
//
//   • page 1 — "4 through 6 months", "7 through 11 months"
//   • page 2 — "12 through 23 months"
//   • page 3 — "24 through 59 months", and the table ENDS there
//   • title, on every page — "Catch-Up Guidance for Healthy Children 4 Months
//     through 4 Years of Age"
//   • footnote 1, on every page — at-risk children are handed to CDC's notes
//
// So the document has NO row for a child of 5–18. Its own title is the only
// thing on it that touches this card, and a title says what a document covers
// rather than stating a recommendation. That is the shape the owner already
// ruled on for the ADULT job aid on 2026-10-18 ("use MMWR table"): where a job
// aid's claim is not in the document's own words, the job aid comes off and the
// document that states it in words is cited. CDC's Child/Adolescent Notes row —
// "Healthy children ages 2–4 years with any incomplete* PCV series: 1 dose PCV",
// the row that stops at 4 — is quoted on the lead and carries the claim alone.
//
// ── THE AGE-50 NOTE, AND WHY IT CITES THE ADULT SCHEDULE ──────────────────
//
// This is the ONE card in the app where a child's card carries an adult source,
// and it crosses the N6 rule deliberately rather than by accident. The sentence
// is ABOUT the adult schedule, so only the adult schedule can carry it, and
// `aboutAnotherGroup` is what says so out loud instead of widening a source's
// scope to make a wrong quote legal.
//
// `adultRoutine50` is the key, and it is already one of the four pinned
// cross-references — the adult 19–49 no-risk card states the same thing in the
// same words from the other side of the boundary ("Routine pneumococcal
// vaccination begins at age 50"). One wording, one source.
//
// Two nearer-sounding keys were considered and NOT used, because each is about
// a different patient (FINDING K: a sentence is only about the patient its
// parent bullet describes):
//   • `mmwrChronic1949ReviewAt50`  — "reviewed again when the person reaches age
//     50 years", printed about a 19–49 ADULT WITH CHRONIC CONDITIONS;
//   • `jobAidChronic1949ReviewAt50` — the same instruction, same patient.
// Both tell you to review a RISK-based decision. Nora's card states where
// ROUTINE vaccination begins, which is a different claim.
//
// `adultRoutine50` was RE-READ LIVE on 2026-10-29 before being put on this card
// (browser pane, accordions expanded — an un-expanded fetch of CDC's notes
// returns 8k of menu and looks like it worked). Its sentence occurs EXACTLY
// ONCE in the page's HTML, inside the panel `accordion-panel-pneumo-routine`,
// under the parent bullet "Age 50 years or older who have:". That parent is the
// whole reason this key carries "routine vaccination begins at age 50" —
// FINDING K: a sentence is only about the patient its parent bullet describes.
//
// ── WHAT MOVED ───────────────────────────────────────────────────────────
//
// Prose on 1,584 cards; ZERO verdicts, in either corpus — the corpora record a
// card's status, brands and dates, never its prose. So this change is invisible
// to both sweeps by design, and every assertion below reads the card's own
// words and its own chip row instead.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';
import { REFS } from '../../data/refs.js';
import { cardSources } from '../../components/citations.jsx';

const TODAY = '2026-10-29';
const DOB_10Y = '2016-05-12';          // Nora — 10 years 5 months on TODAY

const JOB_AID = 'CDC PCV Catch-up Job Aid';
const AGE_50_SENTENCE = 'Re-evaluate at age 50, when routine pneumococcal vaccination begins for every adult [c].';

const notIndicated = (out) => (out.recs ?? []).find(
  (r) => r.doseLabel === 'Not indicated (healthy 5–18y)',
);
const pcvCard = (out) => (out.recs ?? []).find((r) => r.vaccine === 'PCV');

/** The chips a clinician actually sees, in the order the card prints them. */
const renderedChips = (card) => cardSources({
  doseValidations: card.doseValidations,
  otherValidations: undefined,
  note: card.note,
  noteCites: card.noteCites,
  citations: card.citations,
}).sources;

const chipNames = (card) => renderedChips(card).map((s) => s.short || s.title);
const noteText = (card) => `${card.note?.lead ?? card.note ?? ''} ${card.note?.detail ?? ''}`;

const nora = (pcvDoses = []) => recommend({
  ageMonths: 125, dob: DOB_10Y, today: TODAY, riskIds: [], pcvDoses, ppsv23Doses: [],
});

describe('C12: the job aid comes off the healthy 5–18 card', () => {
  it("Nora's card no longer lists a document that has no row for her", () => {
    const card = notIndicated(nora());
    expect(card).toBeTruthy();
    expect(chipNames(card)).not.toContain(JOB_AID);
  });

  it('every one of the 1,584 cards in the grid loses it, and none keeps it', () => {
    let seen = 0;
    const keeping = [];
    for (const c of buildCases()) {
      let out;
      try { out = recommend(c.input); } catch { continue; }
      if (out.excluded) continue;
      const card = notIndicated(out);
      if (!card) continue;
      seen += 1;
      if (chipNames(card).includes(JOB_AID)) keeping.push(c.input);
    }
    // PINNED EXACTLY, not floored: C8/C9/C12 keep moving this card's footprint
    // and a floor absorbs each drop silently. If it fails, say which cards
    // moved and why before touching the number.
    expect(seen).toBe(1584);
    expect(keeping).toEqual([]);
  });

  // THE MIRROR GUARD (FINDING F, 2026-10-18). A removal is only safe while the
  // document stays credited where it DOES speak. `scripts/uncreditedSources.mjs`
  // is blind to this direction — it only sees a document that is ON a card — so
  // a document wrongly removed from a card it speaks for is invisible to it.
  it('the job aid keeps its place on the healthy 24–59 month cards it has rows for', () => {
    // 36 months, never vaccinated: page 3's "24 through 59 months" / 0 previous
    // doses row — "Give Dose 1 today".
    const catchup = pcvCard(recommend({
      ageMonths: 36, dob: '2023-10-29', today: TODAY, riskIds: [], pcvDoses: [], ppsv23Doses: [],
    }));
    expect(chipNames(catchup)).toContain(JOB_AID);

    // And over the whole grid, so a tidy-up cannot take it from the band where
    // its cells govern. 144 when measured on 2026-10-29 (84 catch-up + 48 due
    // + 12 complete).
    let kept = 0;
    for (const c of buildCases()) {
      let out;
      try { out = recommend(c.input); } catch { continue; }
      if (out.excluded) continue;
      for (const r of out.recs ?? []) if (chipNames(r).includes(JOB_AID)) kept += 1;
    }
    expect(kept).toBe(144);
  });
});

describe('C12: the age-50 note the owner asked for', () => {
  it("Nora's card says it, in full, in the words it was written in", () => {
    // ⚠ WHOLE SENTENCE, not a substring and not a date. Two guards on
    // 2026-10-29 passed for the wrong reason because they asserted a fragment
    // that other copy on the same card already matched.
    const card = notIndicated(nora());
    expect(card.note.detail).toContain(AGE_50_SENTENCE);
  });

  it('the number beside it points at the adult schedule, declared as a cross-reference', () => {
    const card = notIndicated(nora());
    const last = card.noteCites[card.noteCites.length - 1];
    expect(last.key).toBe('adultRoutine50');
    expect(typeof last.aboutAnotherGroup).toBe('string');
    expect(last.aboutAnotherGroup).toMatch(/routine adult vaccination begins/);
    // The marker count and the cite list move together or the numbers slide
    // onto the wrong sentences: 1 in the lead, 2 in the detail.
    expect((card.note.lead.match(/\[c\]/g) ?? []).length).toBe(1);
    expect((card.note.detail.match(/\[c\]/g) ?? []).length).toBe(2);
    expect(card.noteCites).toHaveLength(3);
  });

  it('and the clinician gets a chip to click, named for the adult schedule', () => {
    const card = notIndicated(nora());
    const names = chipNames(card);
    expect(names).toContain('CDC Child/Adolescent Notes');
    expect(names).toContain('CDC Adult Notes');
    // Every chip on this card is now numbered AND pointed at — which is the
    // whole point of the C7/C8 work, reached here for the first time on this
    // card.
    expect(names).toHaveLength(2);
  });

  it('the source it quotes is the adult schedule and says so', () => {
    expect(REFS.adultRoutine50.rulebook).toBe('adult');
    expect(REFS.adultRoutine50.population).toEqual(['adult-50plus']);
  });

  it('the dose is untouched — this is wording and sources only', () => {
    const card = notIndicated(nora());
    expect(card.status).toBe('not-indicated');
    expect(card.vaccine).toBe('PCV');
    expect(card.dueToday).toBe(false);
    expect(card.brands).toEqual([]);
  });
});

describe('C12: the note goes on the two cards where 50 is really the next event', () => {
  // ── THE WHOLE RULING, 2026-10-30 ─────────────────────────────────────────
  //
  // Asked whether the age-50 line should spread to the other children's cards
  // that end in "nothing needed", the owner was shown all nine families with
  // each one's own patient taken forward to 19 and to 50 in the running app.
  // They do not behave alike, and that is the finding:
  //
  //   GROUP A — 50 really is the next event. THESE TWO GET THE LINE.
  //     Not indicated (healthy 5-18y)  1,584  → 19: nothing. 50: a dose is due.
  //     PCV series complete (healthy 24-59mo)  12  → the same, for a toddler.
  //
  //   GROUP B — the next event is NINETEEN, not 50. 640 cards, all at-risk:
  //     Complete (PCV13 + PPSV23 at/after age 6)                        450
  //     Complete (unrecorded-product PCV + PPSV23 at/after age 6)        70
  //     PCV complete (at-risk catch-up done)                             15
  //     Complete (PCV series + PPSV23)                                    5
  //     Maya — 18, cochlear implant, PCV13 at 7y11m, PPSV23 at 12y11m —
  //     reads "no further doses of any PCV or PPSV23 are indicated", and at 19
  //     the app says "Due today: PCV20 or PCV21 >=5 years after the last
  //     pneumococcal dose". Both are right; the card just names no age.
  //     OWNER 2026-10-30: PARKED, deliberately — "think about it". Not decided,
  //     and NOT to be quietly fixed by widening the sentence below: the age
  //     would be wrong. It is written up in the handoff with Maya.
  //
  //   GROUP C — complete for life, so no "come back" line belongs at all:
  //     PCV complete (includes PCV20) 944; Complete (PCV15 + PPSV23 at/after 6)
  //     290; PCV series complete (PCV before age 6 + PPSV23) 145.
  //
  // Both counts are PINNED EXACTLY. Widening the sentence to a third card
  // fails here, which is the point: the next card to get it must be one whose
  // patient, run forward, is really doing nothing until 50.
  it('exactly the two healthy families carry the age-50 sentence', () => {
    const byCard = new Map();
    for (const c of buildCases()) {
      let out;
      try { out = recommend(c.input); } catch { continue; }
      if (out.excluded) continue;
      for (const r of out.recs ?? []) {
        if (!noteText(r).includes('Re-evaluate at age 50')) continue;
        byCard.set(r.doseLabel, (byCard.get(r.doseLabel) ?? 0) + 1);
      }
    }
    expect(Object.fromEntries([...byCard.entries()].sort())).toEqual({
      // P2-5 (2026-11-01, owner: "agree with fixing"): -404, the teens whose only
      // tick is smoking (202) or alcohol use disorder (202). The adult schedule
      // gives them a dose at 19, so their card now says 19. 1,584 - 404.
      'Not indicated (healthy 5–18y)': 1584 - 404,
      'PCV series complete': 12,
    });
  });

  it('and it says the same thing in both places, from one constant', () => {
    // Two copies of a sentence are two things that can drift. The engine holds
    // it once; this asserts the cards really do print the identical wording.
    const ivy = pcvCard(recommend({
      ageMonths: 24, dob: '2024-10-30', today: TODAY, riskIds: [], ppsv23Doses: [],
      pcvDoses: [
        { product: 'PCV13', date: '2026-03-01' },
        { product: 'PCV13', date: '2026-04-26' },
        { product: 'PCV13', date: '2026-06-21' },
      ],
    }));
    expect(ivy.doseLabel).toBe('PCV series complete');
    expect(noteText(ivy)).toContain(AGE_50_SENTENCE);
    expect(notIndicated(nora()).note.detail).toContain(AGE_50_SENTENCE);
    // Her citation is the last one on the card, so the last marker is hers.
    expect(ivy.noteCites[ivy.noteCites.length - 1].key).toBe('adultRoutine50');
    expect(chipNames(ivy)).toContain('CDC Adult Notes');
  });

  // ⚠ GROUP B WAS DECIDED THE SAME DAY (C13, OWNER RULING 2026-10-30, "One
  // line per group"). Maya's card now says what happens at 19 — but still NOT
  // the age-50 line, which would name the wrong age for her. Kept, renamed:
  // the limit it guarded (no age-50 sentence on group B) still holds.
  // Guard for the new lines: regression-c13-2026-10-30-what-happens-at-19.
  it('Maya gets the at-19 line, never the age-50 line', () => {
    const maya = pcvCard(recommend({
      ageMonths: 216, dob: '2008-10-30', today: TODAY, riskIds: ['cochlear_implant'],
      pcvDoses: [{ product: 'PCV13', date: '2016-10-13' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2021-10-11' }],
    }));
    expect(maya.doseLabel).toBe('Complete (PCV13 + PPSV23 at/after age 6)');
    expect(noteText(maya)).not.toContain('Re-evaluate at age 50');
    expect(noteText(maya)).toContain('At 19, the adult schedule gives 1 dose of PCV20 or PCV21');

    // And the reason it is parked rather than ignored: one year later the app
    // gives her a dose. Asserted so the open question cannot quietly stop
    // being true without someone noticing.
    const atNineteen = pcvCard(recommend({
      ageMonths: 228, dob: '2008-10-30', today: '2027-10-30', riskIds: ['cochlear_implant'],
      pcvDoses: [{ product: 'PCV13', date: '2016-10-13' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2021-10-11' }],
    }));
    expect(atNineteen.status).toBe('risk-based');
    expect(atNineteen.dueToday).toBe(true);
  });

  it('and no other CHILD card gains an adult source', () => {
    // N6's rule, held where N6 itself cannot look: its sweep ticks one risk
    // condition at a time, so it never reaches the healthy 5–18 card at all.
    const offenders = new Set();
    for (const c of buildCases()) {
      if (c.input.ageMonths >= 228) continue;          // ADULT_SCHED_MIN_M
      let out;
      try { out = recommend(c.input); } catch { continue; }
      if (out.excluded) continue;
      for (const r of out.recs ?? []) {
        // The two healthy cards that carry the age-50 line are the exception,
        // by name. Any THIRD child card showing an adult document fails here.
        if (r.doseLabel === 'Not indicated (healthy 5–18y)') continue;
        if (r.doseLabel === 'PCV series complete') continue;
        // C13 (2026-10-30): the four Group B cards, by name, whose "at 19" line
        // quotes the adult row for that birthday. The PCV15 twin of the
        // at/after-6 card is complete for life and is NOT excused.
        if ([
          'Complete (PCV13 + PPSV23 at/after age 6)',
          'Complete (a PCV of unrecorded product + PPSV23 at/after age 6)',
          'PCV complete (at-risk catch-up done)',
          'Complete (PCV series + PPSV23)',
          // 2026-10-31 (§B-AT19): the line now comes from the adult card at 19
          // for every at-risk "complete" card — the before-6 card C13 missed,
          // and the immunocompromised cards (owner ruling on Noah).
          'PCV series complete (PCV before age 6 + PPSV23)',
          'Complete (PCV series + 2 PPSV23)',
          'Complete (PCV13 + 2 PPSV23 at/after age 6)',
          'Complete (a PCV of unrecorded product + 2 PPSV23 at/after age 6)',
        ].includes(r.doseLabel)) continue;
        for (const name of chipNames(r)) {
          if (name === 'CDC Adult Notes') offenders.add(`${r.vaccine} / ${r.doseLabel}`);
        }
      }
    }
    expect([...offenders]).toEqual([]);
  });

  it('the adult 19–49 no-risk card still states the same boundary, unchanged', () => {
    // The control: this change must not have moved the card the sentence was
    // borrowed from.
    const adult = pcvCard(recommend({
      ageMonths: 360, dob: null, today: TODAY, riskIds: [], pcvDoses: [], ppsv23Doses: [],
    }));
    expect(adult.status).toBe('not-indicated');
    expect(noteText(adult)).toContain('Routine pneumococcal vaccination begins at age 50 [c]');
  });
});

describe('C12: the guards bite', () => {
  it('a card with no doses and one with a complete infant series both read the same', () => {
    // CHILD B of C9 — the patient the grid cannot build (0 of 17,016 children
    // aged 5–18 have an infant dose), asserted by hand. She must get the same
    // card, the same chips and the same age-50 line as Nora.
    const complete = notIndicated(nora([
      { product: 'PCV13', date: '2016-07-12' },
      { product: 'PCV13', date: '2016-09-12' },
      { product: 'PCV13', date: '2016-11-12' },
      { product: 'PCV13', date: '2017-05-12' },
    ]));
    expect(complete).toBeTruthy();
    expect(chipNames(complete)).toEqual(chipNames(notIndicated(nora())));
    expect(complete.note.detail).toContain(AGE_50_SENTENCE);
  });

  it('anti-vacuity: the grid really does reach this card, and the helpers really read it', () => {
    // If `notIndicated` ever stops matching, every sweep above passes over an
    // empty set and asserts nothing.
    const card = notIndicated(nora());
    expect(card.note.lead).toContain('healthy children 5–18 years are not routinely caught up');
    expect(renderedChips(card).every((s) => typeof s.n === 'number')).toBe(true);
    expect(buildCases().length).toBeGreaterThan(10000);
  });
});
