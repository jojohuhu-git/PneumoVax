// @vitest-environment happy-dom
// Owner request, 2026-10-24: the sentence that QUALIFIES a "complete" card —
// one dose came earlier than ACIP advises, and here is the alternative — must
// stand out from the rest of the note rather than reading as more of the same
// prose. Her words: "Make these nuanced comments in red or bolded".
//
// A note marks that span with `**...**` and `renderNoteWithCites` turns it into
// <strong class="note-emphasis">.
//
// ⚠️ THE CASE THIS FILE EXISTS FOR. The emphasised span OPENS before a `[c]`
// citation marker and CLOSES after it, because the alternative sentence cites
// its sources mid-sentence. `renderNoteWithCites` splits the note on `[c]`, so
// a naive implementation would see "**" in one piece and its partner in
// another and emphasise nothing (or everything after it). Emphasis is tracked
// ACROSS the split, and the cross-marker case below is what proves it.
//
// It also must not disturb numbering: `**` is not `[c]`, so every citation
// still lands on the number it had before. Asserted here and, over the whole
// grid, by regression-c2-c3-numbered-sources.test.jsx.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderNoteWithCites, makeCiteNumberer } from '../citations.jsx';
import { recommend } from '../../logic/recommend.js';
import { analyzeHistory } from '../../logic/validate.js';
import RecCard from '../RecCard.jsx';
import { DOSE_INTERVAL_RULES } from '../../logic/doseIntervalRules.js';

const CITE = (key) => ({ key, page: key, url: `https://example.test/${key}`, label: key, short: key });

describe('note emphasis — the renderer', () => {
  it('bolds a span with no citation in it', () => {
    render(<p>{renderNoteWithCites('plain **loud** plain', [], makeCiteNumberer())}</p>);
    const em = document.querySelector('.note-emphasis');
    expect(em).not.toBeNull();
    expect(em.textContent).toBe('loud');
  });

  it('bolds a span that OPENS before a [c] and CLOSES after it', () => {
    render(<p>{renderNoteWithCites(
      'calm **loud [c] still loud** calm again',
      [CITE('a')],
      makeCiteNumberer(),
    )}</p>);
    const ems = [...document.querySelectorAll('.note-emphasis')].map((n) => n.textContent);
    // Two runs, because the citation link sits between them — but BOTH are
    // emphasised, which is the whole point.
    expect(ems).toEqual(['loud ', ' still loud']);
    // The citation still rendered, and it is still [1].
    expect(screen.getByRole('link')).toHaveTextContent('[1]');
    // And nothing outside the span was emphasised.
    expect(document.body.textContent).toContain('calm again');
    expect(ems.join('')).not.toContain('calm');
  });

  it('leaves a note with no markers completely untouched', () => {
    render(<p>{renderNoteWithCites('nothing special here [c].', [CITE('a')], makeCiteNumberer())}</p>);
    expect(document.querySelector('.note-emphasis')).toBeNull();
    expect(document.body.textContent).toContain('nothing special here');
  });

  it('never leaves a stray ** on screen', () => {
    render(<p>{renderNoteWithCites('a **b [c] c** d', [CITE('a')], makeCiteNumberer())}</p>);
    expect(document.body.textContent).not.toContain('*');
  });
});

describe('note emphasis — wherever a card uses it, over the whole grid', () => {
  // ⚠️ WHY THIS IS NOT BOUND TO ONE CARD ANY MORE. It used to be, to family
  // 3's patient (PCV15 2026-07-19, PPSV23 2026-10-11) — the card that carried
  // the owner's qualifying sentence. Family 3 was REVERTED on 2026-10-24
  // (her later ruling the same day: that PPSV23 is invalid), so that card is
  // gone and with it the only `**` in the engine. Re-pointing this at
  // whichever card happens to carry the markers today would just set the same
  // trap again — the "card absence guards break on two-sentence cards"
  // lesson, which this repo has now paid for three times.
  //
  // So the claim is the one that cannot go stale: ANY note that marks a span
  // renders as emphasis, and NO note ever shows a reader a literal asterisk.
  // It passes trivially while nothing marks a span, and the renderer cases
  // above are what carry the proof in the meantime.
  const PATIENTS = [
    // the three families, as they stood when the markers were introduced
    { ageMonths: 840, riskIds: [], pcvDoses: [{ product: 'PCV13', date: '2016-10-13' }, { product: 'PCV20', date: '2025-10-10' }], ppsv23Doses: [{ product: 'PPSV23', date: '2021-10-13' }] },
    { ageMonths: 840, riskIds: [], pcvDoses: [{ product: 'PCV15', date: '2026-06-19' }], ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }] },
    { ageMonths: 360, riskIds: ['chronic_heart'], pcvDoses: [{ product: 'PCV15', date: '2026-07-19' }], ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }] },
    { ageMonths: 480, riskIds: ['asplenia'], pcvDoses: [{ product: 'PCV15', date: '2026-08-30' }], ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }] },
  ];

  const notesOf = (p) => recommend({ today: '2026-10-24', ...p }).recs
    .map((r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`));

  it('renders every marked span as emphasis, and never leaves an asterisk on screen', () => {
    for (const p of PATIENTS) {
      for (const text of notesOf(p)) {
        const marked = text.includes('**');
        document.body.innerHTML = '';
        render(<p>{renderNoteWithCites(text, [CITE('a'), CITE('b'), CITE('c'), CITE('d'), CITE('e')], makeCiteNumberer())}</p>);
        // Never an asterisk, marked or not.
        expect(document.body.textContent).not.toContain('*');
        // And when a span IS marked, something is actually emphasised.
        expect(document.querySelectorAll('.note-emphasis').length > 0).toBe(marked);
      }
    }
  });

  it('a marker pair is always balanced — an odd count would swallow the rest of the note', () => {
    for (const p of PATIENTS) {
      for (const text of notesOf(p)) {
        expect(text.split('**').length % 2).toBe(1);
      }
    }
  });
});

describe('note emphasis — the cards that must NOT have it', () => {
  it('an ordinary complete card carries no emphasis at all', () => {
    const out = recommend({
      today: '2026-10-24', ageMonths: 70 * 12, riskIds: [],
      pcvDoses: [{ product: 'PCV15', date: '2020-01-01' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2023-01-01' }],
    });
    const rec = out.recs.find((r) => r.status === 'complete');
    const text = typeof rec.note === 'string' ? rec.note : rec.note.lead;
    expect(text).not.toContain('**');
  });
});

describe('the owner-ruling wording is off the cards (2026-10-24)', () => {
  // Her instruction: "remove owners ruling comment from cards". What she was
  // looking at was the parenthetical "(owner ruling, 2026-10-24)" appended to
  // three recommendation messages, and that is what came off.
  //
  // ⚠️ THIS ASSERTION USED TO BE BLUNTER AND IT WAS WRONG. It forbade the
  // words "owner clinical determination" on any card at all. That held only
  // while all three rows were recommendations; two of them were reverted to
  // FLOORS the same afternoon, and a floor's own text is REQUIRED by
  // CLAUDE.md to say it rests on an owner determination rather than on ACIP —
  // "⚠️ EVERY adult floor is an OWNER CLINICAL DETERMINATION ... the app's own
  // per-dose text says so". So the blunt version made a deliberate honesty
  // feature into a test failure. Narrowed to the parenthetical she actually
  // asked about; the floors' disclosure is asserted positively below so that
  // narrowing cannot hide its removal.
  const patients = [
    // family 1 — Ruling F, still a recommendation and still counting
    { ageMonths: 840, riskIds: [], pcvDoses: [{ product: 'PCV13', date: '2016-10-13' }, { product: 'PCV20', date: '2025-10-10' }], ppsv23Doses: [{ product: 'PPSV23', date: '2021-10-13' }] },
    // family 2 — reverted to a floor
    { ageMonths: 840, riskIds: [], pcvDoses: [{ product: 'PCV15', date: '2026-06-19' }], ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }] },
    // family 3 — reverted to a floor
    { ageMonths: 360, riskIds: ['chronic_heart'], pcvDoses: [{ product: 'PCV15', date: '2026-07-19' }], ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }] },
  ];

  const everythingFor = (p) => {
    const out = recommend({ today: '2026-10-24', ...p });
    return [...out.perDose.pcv, ...out.perDose.ppsv23]
      .flatMap((d) => [...(d.reasons ?? []), d.detail ?? ''])
      .concat(out.recs.map((r) => (typeof r.note === 'string'
        ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`)))
      .join(' ');
  };

  it('no card dates a ruling at the reader — the "(owner ruling, 2026-10-24)" parenthetical is gone', () => {
    for (const p of patients) {
      expect(everythingFor(p)).not.toMatch(/owner ruling/i);
      expect(everythingFor(p)).not.toMatch(/\(owner[^)]*2026-10-24\)/i);
    }
  });

  it('no ADULT card discloses an owner determination, because no adult floor is one — but the one child floor that is HAS to', () => {
    // ── WHAT THIS ASSERTED, AND WHY IT HAS FLIPPED TWICE ─────────────
    //
    // Draft 1 forbade the phrase everywhere; that was wrong while two adult
    // rows were floors, and is recorded in the comment above. Draft 2 (the
    // morning of 2026-10-25) demanded it NOWHERE, because her adult table had
    // turned every adult floor into a recommendation and a recommendation
    // asserts only CDC's own interval — nothing of hers left to disclose.
    //
    // Draft 3, the same day: `CHILD-PCV-AFTER-PPSV23` became a FLOOR on her
    // ruling "Repeat — her table wins", and it is the FIRST paediatric floor
    // carrying her name (ACIP states the 8 weeks as timing for the next dose
    // and nowhere says an earlier dose stops counting). So the phrase is
    // required again — on exactly one row. Both halves are asserted, because
    // either one alone goes quiet in the wrong direction.
    for (const p of patients) {
      expect(everythingFor(p)).not.toMatch(/owner clinical determination/i);
    }
    // THE POSITIVE HALF. Maya, 8, asplenia: PPSV23 1 Oct, PCV20 15 Oct. Her
    // dose is set aside by a bar that is the owner's, so her card must say so
    // rather than let a clinician read the rejection as ACIP's.
    const maya = {
      ageMonths: 96,
      dob: '2018-10-01',
      riskIds: ['asplenia'],
      pcvDoses: [{ product: 'PCV20', date: '2026-10-15' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-01' }],
    };
    expect(everythingFor(maya)).toMatch(/owner clinical determination/i);
    // and she is still not told a date is a ruling at her
    expect(everythingFor(maya)).not.toMatch(/owner ruling/i);

    // THE STRUCTURAL REASON, so neither half can go quiet by accident: the
    // table's floors and their authorities, pinned by name. Three CDC rows
    // whose sources state the gap as a minimum in words, and one of hers.
    expect(DOSE_INTERVAL_RULES.filter((r) => r.enforcement === 'floor')
      .map((r) => `${r.id}/${r.authority}`))
      .toEqual([
        'CHILD-PCV-AFTER-PCV/CDC',
        'CHILD-PPSV23-AFTER-PCV/CDC',
        // P2 (2026-10-30): the second-PPSV23 floor survives only for a repeat of
        // a REJECTED PPSV23 (Ruling D); after a counted one it is advice now.
        'CHILD-PPSV23-AFTER-INVALID-PPSV23/CDC',
        'CHILD-PCV-AFTER-PPSV23/OWNER',
      ]);
  });

  it('and the narrowing did not silence the rationale — each of the three says why', () => {
    // The replacement positive half. What the reader must still get is the
    // clinical reason the dose counted, which lives in `whys` and is what the
    // "Why this" disclosure shows. If a later tidy-up strips THAT, the cards
    // go back to stating a shortfall and explaining nothing.
    for (const p of patients) {
      const out = recommend({ today: '2026-10-24', ...p });
      const chip = [...out.perDose.pcv, ...out.perDose.ppsv23]
        .find((d) => d.earlyAdvisory);
      expect(chip.whys?.length).toBeGreaterThan(0);
      expect(chip.whys.join(' ').length).toBeGreaterThan(80);
      // and the shortfall itself is still bolded on the chip, which is the
      // emphasis this whole file is about
      expect(chip.reasons.join(' ')).toMatch(/\*\*Counted;[^*]+\*\*/);
    }
  });
});

describe('a dose CHIP renders emphasis too — the owner\'s second-PPSV23 alternative', () => {
  // ⚠️ WHY THIS EXISTS. `RecCard` used to render a reason with no citations as
  // a BARE STRING, bypassing `renderNoteWithCites` entirely. Every reason had
  // been plain prose, so nothing noticed. The moment the owner asked for the
  // conjugate alternative to be bolded (2026-10-24), that path would have
  // printed a literal `**` to a clinician. Nothing in the suite covered it:
  // the renderer tests call `renderNoteWithCites` directly, and the card tests
  // only look at rec notes.
  const SECOND_PPSV23 = analyzeHistory(
    'PPSV23', [{ date: '2015-01-01' }, { date: '2018-01-01' }], 840, '2026-06-01', '1945-01-01',
  ).perDose[1];

  const renderChip = () => render(
    <RecCard
      rec={{
        // `status: 'due'` deliberately — a 'complete' card renders COLLAPSED
        // and its dose rows never mount, which is how the first draft of this
        // test passed an empty card and proved nothing.
        vaccine: 'PPSV23', status: 'due', doseLabel: 'PPSV23',
        dueToday: false, earliestNextDate: null,
        minIntervalDays: null, minIntervalMonths: null,
        brands: [], note: null, noteCites: [],
        advisory: false, seriesTotal: null, primaryTotal: null, citations: [],
      }}
      doses={[{ date: '2015-01-01' }, { date: '2018-01-01' }]}
      doseValidations={[{ status: 'valid', reasons: [] }, SECOND_PPSV23]}
      ageMonths={981}
      dob="1945-01-01"
      today="2026-06-01"
    />,
  );

  it('shows the bolded verdict and never a literal asterisk', () => {
    const { container } = renderChip();
    // A neutral card renders collapsed; the dose rows live in the body.
    container.querySelectorAll('.rec-card-head-toggle').forEach((b) => fireEvent.click(b));
    container.querySelectorAll('.dose-val-toggle, [class*="toggle"]').forEach((b) => fireEvent.click(b));
    // ⚠ THE SENTENCE CHANGED ON 2026-10-25, THE DEFECT IT GUARDS DID NOT.
    // This used to read "may be considered from Jan 1, 2019" — the conjugate
    // alternative a FLOOR offered beside a dose it had thrown away. Her adult
    // table made ADULT-PPSV23-AFTER-PPSV23 a recommendation, so the dose is
    // counted and the emphasised span is the verdict itself; the conjugate
    // alternative moved into `whys`, asserted below. What is being guarded is
    // unchanged: a reason with no citations in it must still go through
    // `renderNoteWithCites`, or a clinician reads raw `**`.
    expect(document.body.textContent).toContain('Counted; never give a third.');
    expect(document.body.textContent).not.toContain('*');
    const ems = [...document.querySelectorAll('.note-emphasis')].map((n) => n.textContent);
    expect(ems).toContain('Counted; never give a third.');
  });

  it("and the conjugate alternative is still on the screen, in \"Why this\"", () => {
    const { container } = renderChip();
    container.querySelectorAll('.rec-card-head-toggle').forEach((b) => fireEvent.click(b));
    container.querySelectorAll('.dose-val-toggle, [class*="toggle"]').forEach((b) => fireEvent.click(b));
    container.querySelectorAll('details').forEach((d) => { d.open = true; });
    // The owner's own alternative, verbatim from the rule's rationale. It left
    // the bolded span but it did not leave the card.
    expect(document.body.textContent)
      .toContain('the next dose is a conjugate — PCV20 or PCV21');
    expect(document.body.textContent).not.toContain('*');
  });
});
