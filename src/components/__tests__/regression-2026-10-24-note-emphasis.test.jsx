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
    // family 2 — a floor on 2026-10-24, a RECOMMENDATION again from
    // 2026-10-25 ("count like the child"), so it is grouped with family 1
    // below and no longer discloses an owner determination, because it no
    // longer rests on one.
    { ageMonths: 840, riskIds: [], pcvDoses: [{ product: 'PCV15', date: '2026-06-19' }], ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }] },
    // family 3 — still a floor
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

  it('but a FLOOR still discloses that it is an owner determination, not ACIP', () => {
    // Family 3 — the only one of the three still resting on an owner floor,
    // after 2026-10-25 took family 2 back to a recommendation. If this ever
    // goes quiet, the narrowing above has been over-applied.
    expect(everythingFor(patients[2])).toMatch(/owner clinical determination/i);
  });

  it('and a RECOMMENDATION does not — families 1 and 2 rest on CDC', () => {
    // The other half, and the reason the assertion above is narrow rather
    // than absent. A recommendation asserts only CDC's own advised interval,
    // so claiming an owner determination there would be false. Family 2
    // joined family 1 here on 2026-10-25, with its authority relabelled CDC.
    for (const p of [patients[0], patients[1]]) {
      expect(everythingFor(p)).not.toMatch(/owner clinical determination/i);
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

  it('shows the alternative in bold and never a literal asterisk', () => {
    const { container } = renderChip();
    // A neutral card renders collapsed; the dose rows live in the body.
    container.querySelectorAll('.rec-card-head-toggle').forEach((b) => fireEvent.click(b));
    container.querySelectorAll('.dose-val-toggle, [class*="toggle"]').forEach((b) => fireEvent.click(b));
    expect(document.body.textContent).toContain('may be considered from Jan 1, 2019');
    expect(document.body.textContent).not.toContain('*');
    expect(document.querySelectorAll('.note-emphasis').length).toBeGreaterThan(0);
  });
});
