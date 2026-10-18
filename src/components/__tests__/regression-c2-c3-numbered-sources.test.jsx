// @vitest-environment happy-dom
// C2 + C3 (2026-10-17) — the grey buttons carry the number the text uses, and
// every cited document has a button.
//
// Owner-reported: "I always see a '1' where you can hover over to see the
// language cited verbatim, but there are multiple source chips under it and I
// do not know where it came from. I also forget why there are multiple source
// chips listed if its only citing one of them."
//
// C1 answered the first half by naming the document in the hover text. This is
// the other half: the buttons themselves are numbered, so a `[2]` in a sentence
// names the button marked [2], and the row is headed "Sources" so it is clear
// what it is.
//
// ── What was actually wrong (measured, not assumed) ─────────────────────
//
// A card had two citation systems that never compared notes: numbers assigned
// at render time from `noteCites`/`reasonCites`, and a separate button list
// built in the engine from `refs`. Swept over the whole of `test-grid.js` on
// 2026-10-17, they disagreed in both directions:
//   • 26,651 of 44,461 buttons that no number pointed at;
//   • 1,380 of 17,334 cards showing a number for a document with NO button —
//     1,188 for the immunize.org PCV7 rule and 192 for the CDC risk-based
//     page. (The plan predicted one document; there were two.)
//
// Re-measured with `npx vite-node scripts/citationMapping.mjs`, because the
// branch was held while merges landed in `refs.js`. The PCV7 figure was
// unchanged at 1,188; the CDC risk-based page fell from 1,080 to 192 when PR
// #64's citation fixes landed. After this change the second line is 0.
// Of those, C3 fixes the second list. The first is item C8 — those buttons are
// holding up statements the card makes out loud without quoting them, and the
// fix is to write the missing quotes, never to delete a clinical source to
// tidy the row. Check G1 ships with C8 for that reason; adding it here would
// only pressure a future session into deleting sources.
//
// Re-verified on 2026-10-17, after the branch was rebased onto `main` at
// 5bffe00 — i.e. with PR #65, the patient-population field, merged too, which
// the figures above predate by nine minutes. All four are unchanged: 44,461
// buttons, 26,651 of them unpointed, 1,380 cards citing a document with no
// button (1,188 + 192). #65 changed which source four cards quote, but no
// card's source list, so nothing here moved with it. Measured rather than
// assumed: the tool was run once against a plain `main` checkout and once
// against this branch, and only the button total differs — 45,841 here, the
// 1,380 buttons C3 adds.
//
// ── Order of first mention (OWNER DECISION 2026-10-17) ──────────────────
//
// The sentences decide the order, "since this is how citations are normally
// ordered" — a journal's reference list. The first document a sentence cites
// is [1], and the button row is printed in that order rather than the order
// the engine happened to list them. The owner was shown three candidates
// rendered from a real card and chose this one; see `cardSources`.
import React, { useState } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';
import RecCard from '../RecCard.jsx';
import { cardSources } from '../citations.jsx';
import { REFS, documentRefFor } from '../../data/refs.js';
import { recommend } from '../../logic/recommend.js';
import { buildCases } from '../../test-grid.js';

const TODAY = '2026-10-17';

function Harness({ initial }) {
  const [state, setState] = useState(initial);
  return (
    <Results
      state={state}
      onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
      onReset={() => {}}
      today={TODAY}
    />
  );
}

function openEveryCard() {
  for (const btn of screen.getAllByRole('button', { expanded: false })) {
    if (/rec-card-head-toggle/.test(btn.className)) fireEvent.click(btn);
  }
}

// A note's "Why this" disclosure holds the rest of its markers. They are
// numbered whether it is open or shut — that is the point of seeding the whole
// note — but only the open half is in the DOM to read.
function openEveryWhyThis() {
  for (const btn of screen.queryAllByTestId('rec-note-toggle')) fireEvent.click(btn);
}

// The owner's own card: 70, no risk factors, nothing on record. Three markers
// over one document, three buttons, two of which nothing points at.
const SEVENTY_NO_RISKS = {
  ageMonths: 70 * 12,
  dob: '1956-10-17',
  riskIds: [],
  pcvDoses: [],
  ppsv23Doses: [],
};

// The card the owner was shown when choosing the numbering order: a 6-year-old
// with asplenia whose only marker cites what used to be the SECOND button.
const ASPLENIA_SIX = {
  ageMonths: 72,
  dob: '2020-10-17',
  riskIds: ['asplenia'],
  pcvDoses: [{ product: 'PCV15', date: '2022-10-17' }],
  ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-17' }],
};

// A recorded PCV7 dose: the explanation cites immunize.org, which before C3
// was the one document in refs.js with no whole-page entry to make a button
// from. 1,188 cards showed that number with nothing to click.
const PCV7_PATIENT = {
  ageMonths: 20 * 12,
  dob: '2006-01-01',
  riskIds: ['asplenia'],
  pcvDoses: [{ product: 'PCV7', date: '2008-05-02' }],
  ppsv23Doses: [],
};

/** Every inline marker on screen, in document order, as its number. */
const markerNumbers = () =>
  [...document.querySelectorAll('a.note-cite')].map((a) => a.textContent.trim());

// ── The other two surfaces that print source buttons, and why they are
// deliberately NOT numbered ─────────────────────────────────────────────
//
// `Results.jsx` prints a `.citation-chip` in two more places: the PCV21
// geographic note, and the transplant hard-stop banner. Neither contains a
// raised number — each is one block of prose with its sources beneath — so
// there is no number for a button to match, and numbering them would invent a
// "[1]" that nothing points at. The hard-stop banner is frozen byte-identical
// to MeningoVax besides. The test below pins that decision so a later session
// does not half-apply the numbering and leave the app inconsistent.
//
// Everything here therefore scopes to `.rec-card`, which is the only surface
// with both systems on it.

/** One button as [{ n, name }]. */
const chipOf = (a) => ({
  n: a.querySelector('.citation-chip-num')?.textContent.trim(),
  name: a.textContent.replace(/^\[\d+\]/, '').trim(),
  title: a.getAttribute('title'),
  href: a.getAttribute('href'),
});

/** Every button on screen, flattened across cards: [{ n, name }], in order. */
const buttonRow = () =>
  [...document.querySelectorAll('.rec-card a.citation-chip')].map(chipOf);

/**
 * The Sources row of EACH card separately, cards with no row dropped.
 *
 * The numbering restarts at [1] on every card, so an assertion about "the row
 * runs 1..n with no gaps" has to be made per card. `buttonRow()` flattens the
 * page, which silently turned into the wrong question on 2026-10-17: the IC
 * children's fix made ASPLENIA_SIX emit TWO recs (the PCV20 option and the
 * 2nd-PPSV23 alternative), so the flat query asked for [1]..[6] across two
 * independent rows and failed on a correctly-numbered screen.
 */
const buttonRowsByCard = () =>
  [...document.querySelectorAll('.rec-card')]
    .map((card) => [...card.querySelectorAll('a.citation-chip')].map(chipOf))
    .filter((row) => row.length > 0);

describe('C2 — the buttons carry the number the text uses', () => {
  it("the owner's card prints a numbered, headed Sources row", () => {
    render(<Harness initial={SEVENTY_NO_RISKS} />);
    openEveryCard();

    expect(screen.getByText('Sources')).toBeTruthy();
    openEveryWhyThis();

    const row = buttonRow();
    expect(row.map((b) => `${b.n} ${b.name}`)).toEqual([
      '[1] CDC Adult Notes',
      '[2] CDC Adult Timing Job Aid',
      '[3] MMWR ≥50 expansion',
    ]);

    // C8, document 2's CITEs (2026-10-17) landed here, on the owner's own
    // card. It used to read ['[1]','[1]','[1]'] — every marker citing the one
    // document, with buttons [2] and [3] printed below and nothing pointing at
    // either. The job aid's footnote * now carries the "A PCV7-only history
    // counts as no PCV history" sentence, so [2] appears IN THE TEXT and that
    // button is no longer a number the reader cannot account for.
    //
    // Reading order: the lead's ≥50 routine sentence [1], then in the detail
    // the PCV7 claim twice — Adult Notes [1] and the job aid [2] — then "each
    // completes the series alone" [1].
    expect(markerNumbers()).toEqual(['[1]', '[1]', '[2]', '[1]']);

    // [3] (the MMWR) is still unpointed on this card, and that is the honest
    // state of the work: document 1 kept mm7401a1 here because the ≥50
    // expansion is genuinely its subject, but no sentence quotes it yet. That
    // is what the remaining C8 documents and check G1 are for — asserted so
    // this card's progress is recorded rather than assumed complete.
    expect(markerNumbers()).not.toContain('[3]');
  });

  it('a button no number points at is kept, not dropped', () => {
    // The two unpointed buttons on that card are load-bearing: the ≥50
    // starting age and the PCV15->PPSV23 gap are stated out loud by the card
    // and come from them. Writing their quotes is C8. Deleting them to make
    // the row tidy would be the one genuinely harmful outcome of this item.
    render(<Harness initial={SEVENTY_NO_RISKS} />);
    openEveryCard();
    const names = buttonRow().map((b) => b.name);
    expect(names).toContain('CDC Adult Timing Job Aid');
    expect(names).toContain('MMWR ≥50 expansion');
  });

  it('numbers run in order of first mention, and the row follows (owner decision)', () => {
    render(<Harness initial={ASPLENIA_SIX} />);
    openEveryCard();

    const rows = buttonRowsByCard();
    // This patient emits more than one card, and each card numbers its own
    // row from [1] — so assert it of every row, not of the page.
    expect(rows.length).toBeGreaterThan(1);
    rows.forEach((row) => {
      // The row is printed in numeric order, with no gaps, on every card.
      expect(row.map((b) => b.n)).toEqual(row.map((_, i) => `[${i + 1}]`));
    });

    // And the document the text cites first is the one numbered [1] — it is
    // NOT the button the engine happened to list first.
    const firstMarker = markerNumbers()[0];
    expect(firstMarker).toBe('[1]');
    expect(rows[0][0].name).toBe('CDC Risk-based Pneumococcal');
  });

  it('a card with no citations at all prints no Sources row', () => {
    render(<RecCard rec={{ vaccine: 'PCV', status: 'due', doseLabel: 'Dose 1', dueToday: true }} />);
    expect(screen.queryByText('Sources')).toBeNull();
    expect(buttonRow()).toEqual([]);
  });

  it('the two surfaces with no raised numbers keep unnumbered buttons', () => {
    // The PCV21 geographic note is one paragraph with its source below it. No
    // sentence in it carries a "[c]", so there is nothing to match: a number
    // there would point at nothing. Reached by an Alaska-style adult card.
    render(<Harness initial={SEVENTY_NO_RISKS} />);
    const geo = document.querySelector('[data-testid="pcv21-geo-note"]');
    expect(geo, 'the 70-year-old card should show the PCV21 geographic note').toBeTruthy();
    const geoChips = [...geo.querySelectorAll('a.citation-chip')];
    expect(geoChips.length).toBeGreaterThan(0);
    for (const chip of geoChips) {
      expect(chip.querySelector('.citation-chip-num'),
        'the geographic note has no raised numbers, so its source must not be '
        + 'numbered as if it did').toBeNull();
    }
    expect(within(geo).queryByText('Sources')).toBeNull();
  });

  // ── G3, on the rendered page ──────────────────────────────────────────
  //
  // The sweep below checks that the numbers and the buttons come out of ONE
  // function. This checks the thing a reader actually relies on: the number
  // printed beside a sentence is the number printed on that document's button.
  //
  // It was added after a mutation test found the first draft blind. Numbering
  // the text from a second, independent counter did not fail a single test of
  // 1,066, because a second counter walking the same order happens to agree.
  // It stops agreeing the moment the two walks differ — which is exactly the
  // pre-P6-3 bug where the note was numbered before the doses above it — and
  // nothing would have caught that. Matched by page URL rather than by name,
  // since a marker's href is the deep link to its sentence.
  it('G3: every number in the text names the button for its own document', () => {
    render(<Harness initial={PCV7_PATIENT} />);
    openEveryCard();
    openEveryWhyThis();

    const pageOf = (href) => String(href ?? '').split('#')[0];
    const row = buttonRow();
    const byPage = new Map(row.map((b) => [pageOf(b.href), b.n]));
    // Anti-vacuity: the match below is only meaningful while one page means
    // one button on this card.
    expect(byPage.size, 'two buttons share a page, so the match is ambiguous')
      .toBe(row.length);

    const markers = [...document.querySelectorAll('.rec-card a.note-cite')];
    expect(markers.length, 'this card should carry more than one marker')
      .toBeGreaterThan(1);
    // And more than one DOCUMENT, or a single-source card would pass trivially.
    expect(new Set(markers.map((m) => pageOf(m.getAttribute('href')))).size)
      .toBeGreaterThan(1);

    for (const m of markers) {
      const page = pageOf(m.getAttribute('href'));
      expect(byPage.get(page), `no button for the document behind ${m.textContent.trim()}`)
        .toBe(m.textContent.trim());
    }
  });

  it("a button keeps the title the card's own source list gave it", () => {
    render(<Harness initial={SEVENTY_NO_RISKS} />);
    openEveryCard();
    const adultNotes = buttonRow().find((b) => b.name === 'CDC Adult Notes');
    expect(adultNotes.title).toBe(REFS.cdcAdultPneumo.label);
  });
});

describe('C3 — every cited document has a button to click', () => {
  it('a recorded PCV7 dose now has a button for the rule it cites', () => {
    render(<Harness initial={PCV7_PATIENT} />);
    openEveryCard();

    // The explanation beside the dose cites immunize.org...
    const markerTitles = [...document.querySelectorAll('a.note-cite')]
      .map((a) => a.getAttribute('title'));
    expect(markerTitles.some((t) => /immunize\.org PCV7 rule/.test(t ?? ''))).toBe(true);

    // ...and there is now a button naming that document, carrying the same
    // number. Before C3 the number was there and the button was not.
    const row = buttonRow();
    const pcv7Button = row.find((b) => b.name === 'immunize.org PCV7 rule');
    expect(pcv7Button, 'no button for the document the PCV7 explanation cites').toBeTruthy();
    expect(pcv7Button.title).toBe(REFS.immPCV7Page.label);
    expect(pcv7Button.href).toBe(REFS.immPCV7Page.url);
  });

  it('every document the app can cite has exactly one whole-page entry', () => {
    // This is what `documentRefFor` rests on, and what C3 had to add for the
    // immunize.org PCV7 page — the only document in refs.js that lacked one,
    // which is exactly why 1,188 cards showed a number with no button.
    const perUrl = new Map();
    for (const ref of Object.values(REFS)) {
      if (!perUrl.has(ref.url)) perUrl.set(ref.url, []);
      if (!ref.quote) perUrl.get(ref.url).push(ref.short);
    }
    const wrong = [...perUrl].filter(([, docs]) => docs.length !== 1);
    expect(
      wrong.map(([url, docs]) => `${url} has ${docs.length} whole-page entries`),
      'a document with no whole-page entry cannot be turned into a button; two '
      + 'of them makes the button ambiguous',
    ).toEqual([]);
  });
});

// ── The sweep: the property has to hold on every card, not one ──────────
//
// A rendered test can only reach a handful of cards. These walk every patient
// `test-grid.js` can build and assert the two properties over all of them,
// through `cardSources` — the same function the card renders from.
describe('C2 + C3 across every card the app can produce', () => {
  // Mirrors Results.jsx: the first card for a vaccine shows that vaccine's
  // recorded doses, and any history with no card of its own is attached to
  // the first card. Kept here rather than imported because it is Results'
  // layout decision, and this test must notice if the two drift apart.
  function cardsOf(result) {
    const histories = {
      PCV: { label: 'PCV', doses: result.orderedDoses?.pcv ?? [], dv: result.perDose?.pcv ?? [] },
      PPSV23: { label: 'PPSV23', doses: result.orderedDoses?.ppsv23 ?? [], dv: result.perDose?.ppsv23 ?? [] },
    };
    const seen = {};
    const cards = (result.recs ?? []).map((rec) => {
      let dv = [];
      if (!seen[rec.vaccine] && histories[rec.vaccine]) {
        seen[rec.vaccine] = true;
        dv = histories[rec.vaccine].dv;
      }
      return { rec, doseValidations: dv, otherValidations: [] };
    });
    const orphan = Object.values(histories).find((h) => h.doses.length > 0 && !seen[h.label]);
    if (orphan && cards.length > 0) cards[0].otherValidations = orphan.dv;
    return cards;
  }

  const swept = [];
  for (const c of buildCases()) {
    const result = recommend(c.input);
    if (result.excluded) continue;
    for (const card of cardsOf(result)) {
      const { rec, doseValidations, otherValidations } = card;
      const { numberFor, sources } = cardSources({
        doseValidations,
        otherValidations,
        note: rec.note,
        noteCites: rec.noteCites,
        citations: rec.citations,
      });
      swept.push({ key: c.key, rec, numberFor, sources, doseValidations, otherValidations });
    }
  }

  it('sweeps a real corpus of cards (anti-vacuity)', () => {
    expect(swept.length).toBeGreaterThan(15000);
  });

  it('every button row is numbered 1..N with no gaps and no repeats', () => {
    const bad = swept.filter(({ sources }) =>
      sources.some((s, i) => s.n !== i + 1));
    expect(bad.slice(0, 3).map((b) => `${b.key}: ${b.sources.map((s) => s.n).join(',')}`),
      'a button row that does not read 1, 2, 3 across is the fault C2 removes',
    ).toEqual([]);
  });

  it('G2: every document a number points at has a button on that card', () => {
    const markerPagesOf = ({ rec, doseValidations, otherValidations }) => {
      const { numberFor } = cardSources({
        doseValidations, otherValidations,
        note: rec.note, noteCites: rec.noteCites, citations: rec.citations,
      });
      void numberFor;
      const pages = [];
      for (const v of [...doseValidations, ...otherValidations]) {
        for (const ct of v?.reasonCites ?? []) pages.push(ct.page ?? ct.key);
      }
      for (const ct of rec.noteCites ?? []) pages.push(ct.page ?? ct.key);
      return pages;
    };

    const bad = [];
    for (const card of swept) {
      const urls = new Set(card.sources.map((s) => s.url));
      for (const page of markerPagesOf(card)) {
        if (!urls.has(page)) { bad.push(`${card.key}: ${page}`); break; }
      }
    }
    expect(bad.slice(0, 3),
      'a card shows a raised number for a document with no button to click — '
      + 'the reader is told a source exists and given no way to reach it',
    ).toEqual([]);
  });

  it('G3: a document has ONE number per card, shared by its text and its button', () => {
    const bad = [];
    for (const { key, sources, numberFor } of swept) {
      for (const s of sources) {
        // numberFor is the same function the markers were numbered through.
        if (numberFor(s.url) !== s.n) { bad.push(`${key}: ${s.url}`); break; }
      }
    }
    expect(bad.slice(0, 3),
      'a button and the text that cites it are being numbered separately',
    ).toEqual([]);
  });

  it('every button names a real document and links to it', () => {
    const bad = [];
    for (const { key, sources } of swept) {
      for (const s of sources) {
        if (!s.short || !s.url || !s.title) { bad.push(`${key}: ${JSON.stringify(s)}`); break; }
        if (!documentRefFor(s.url)) { bad.push(`${key}: no whole-page entry for ${s.url}`); break; }
      }
    }
    expect(bad.slice(0, 3)).toEqual([]);
  });
});
