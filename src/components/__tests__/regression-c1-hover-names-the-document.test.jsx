// @vitest-environment happy-dom
// C1 (2026-10-17) — hovering a raised number names the DOCUMENT, not just the
// sentence.
//
// Owner-reported: "I always see a '1' where you can hover over to see the
// language cited verbatim, but there are multiple source chips under it and I
// do not know where it came from."
//
// The cause (plan-2026-10-16-citations-which-chip-did-this-come-from.md §1):
// the raised number and the grey buttons are two citation systems that do not
// know about each other. The buttons carry no numbers, so there is no way to
// match a `[1]` to a button. The missing piece was on the hover text: it showed
// the quoted sentence and never said which document the sentence came from, so
// even knowing the words did not tell you which button to click.
//
// C1 is the smallest fix that answers the question on its own, and it moves
// nothing on the screen. C2 (numbering the buttons) is a separate item.
//
// ── Why the document name goes on its own LINE and not after an em dash ──
//
// The plan sketched `CDC Adult Notes — "quote"`. Em dashes are banned from
// every user-visible string in both apps (owner decision 2026-07-16, D7: they
// are the most recognisable "written by an AI" tell; code comments keep them).
// A `title` attribute honours "\n" as a line break in current browsers, and
// degrades to a single space where it does not — readable either way, and no
// new punctuation to sweep later.
//
// Every surface at once: all three places an inline marker renders (a card's
// note, a recorded dose's explanation, the risk-age note) go through
// `renderNoteWithCites`, so one change covers all three. The tests below hit
// two of them through the real engine plus the shared helper directly.
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from '../Results.jsx';
// citeTitle lives in refs.js beside cite(), the same file MeningoVax keeps it in.
import { cite, citeTitle, REFS } from '../../data/refs.js';

const TODAY = '2026-10-17';

function openTheCard() {
  for (const btn of screen.getAllByRole('button', { expanded: false })) {
    if (/rec-card-head-toggle/.test(btn.className)) fireEvent.click(btn);
  }
}

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

// The owner's own card, reproduced: 70 years old, no risk factors, no doses on
// record. Its note makes three claims over one document, so every marker on it
// reads `[1]` — which is correct, and is exactly why the hover text has to say
// which document that is.
const SEVENTY_NO_RISKS = {
  ageMonths: 70 * 12,
  dob: '1956-10-17',
  riskIds: [],
  pcvDoses: [],
  ppsv23Doses: [],
};

// A PCV7 dose the app sets aside — a recorded-dose explanation, i.e. the second
// surface, cited to immunize.org rather than to a CDC schedule page.
const PCV7_PATIENT = {
  ageMonths: 20 * 12,
  dob: '2006-01-01',
  riskIds: [],
  pcvDoses: [{ product: 'PCV7', date: '2008-05-02' }],
  ppsv23Doses: [],
};

describe('C1 — the hover text on a raised number names its document', () => {
  it('the owner\'s 70-year-old card: every [1] says "CDC Adult Notes" and keeps the quote', () => {
    const { container } = render(<Harness initial={SEVENTY_NO_RISKS} />);
    openTheCard();

    const links = [...container.querySelectorAll('a.note-cite')];
    expect(links.length, 'the note renders no citation links at all')
      .toBeGreaterThan(0);

    for (const a of links) {
      const title = a.getAttribute('title') ?? '';
      expect(title, `a [${a.textContent}] hover text does not name its document`)
        .toMatch(/^CDC Adult Notes\n/);
      // The verbatim sentence is still there — C1 ADDS the document name, it
      // does not replace the quote the owner relies on.
      expect(title.split('\n').slice(1).join('\n').length,
        'the quoted sentence was lost from the hover text').toBeGreaterThan(20);
    }
  });

  it('a recorded dose\'s explanation does the same, with its own document', () => {
    const { container } = render(<Harness initial={PCV7_PATIENT} />);
    openTheCard();

    const a = [...container.querySelectorAll('a.note-cite')]
      .find((x) => /immunize\.org/.test(x.getAttribute('href') ?? ''));
    expect(a, 'the PCV7 verdict renders no citation link').toBeTruthy();

    // "immunize.org PCV7 rule", not the bare domain: three PneumoVax sources
    // live on immunize.org, so the short name is what distinguishes them — and
    // distinguishing them is the whole point of C1.
    const title = a.getAttribute('title') ?? '';
    expect(title).toMatch(/^immunize\.org PCV7 rule\n/);
    expect(title, 'the quote itself must survive unchanged')
      .toMatch(/doses of PCV7 should be ignored/);
  });

  it('no hover text anywhere gains an em dash (owner decision 2026-07-16, D7)', () => {
    for (const [key, ref] of Object.entries(REFS)) {
      const composed = citeTitle(cite(key));
      const added = composed.replace(ref.quote ?? '', '').replace(ref.label ?? '', '');
      expect(added, `citeTitle added an em dash around ${key}`).not.toMatch(/—/);
    }
  });

  it('a quote-free source keeps its full title and gains no empty quotation marks', () => {
    // These are the whole-document references. There is no sentence to show,
    // so the hover text stays the full title, which already names the
    // document. Composing a blank quote onto it would read as a source that
    // says nothing.
    const quoteFree = Object.keys(REFS).filter((k) => !REFS[k].quote);
    expect(quoteFree.length, 'no quote-free refs left to cover this case')
      .toBeGreaterThan(0);

    for (const key of quoteFree) {
      expect(citeTitle(cite(key)), `${key} should fall back to its full title`)
        .toBe(REFS[key].label);
    }
  });

  it('a quoted source puts the document first and the sentence second', () => {
    const quoted = Object.keys(REFS).filter((k) => REFS[k].quote);
    expect(quoted.length).toBeGreaterThan(0);

    for (const key of quoted) {
      const title = citeTitle(cite(key));
      const [first, ...rest] = title.split('\n');
      expect(first, `${key} does not lead with its document's short name`)
        .toBe(REFS[key].short);
      expect(rest.join('\n'), `${key} does not carry its quote verbatim`)
        .toContain(REFS[key].quote);
    }
  });

  // ── The property C1's promise rests on ────────────────────────────────
  //
  // C1 says the first line of the hover text tells you which grey chip the
  // number came from. That is only true while a short name identifies exactly
  // one document. Add a second ref with an existing `short` and every card
  // carrying both would show one name for two different sources, and the
  // reader is back where they started — silently, because nothing else in the
  // suite reads `short` at all.
  //
  // Measured 2026-10-17: 15 short names over 15 documents, 1:1 both ways.
  // MeningoVax is the same (37 keys, no two documents sharing a name) even
  // though 17 of its keys print "ACIP 2020 MMWR" — those 17 are one document.
  it('a short name identifies exactly one document, and vice versa', () => {
    const pageOf = (r) => r.url.split('#')[0];

    const docsPerName = new Map();
    const namesPerDoc = new Map();
    for (const ref of Object.values(REFS)) {
      if (!docsPerName.has(ref.short)) docsPerName.set(ref.short, new Set());
      docsPerName.get(ref.short).add(pageOf(ref));
      if (!namesPerDoc.has(pageOf(ref))) namesPerDoc.set(pageOf(ref), new Set());
      namesPerDoc.get(pageOf(ref)).add(ref.short);
    }

    const nameOnTwoDocs = [...docsPerName].filter(([, d]) => d.size > 1);
    expect(nameOnTwoDocs.map(([n]) => n),
      'one chip name now covers two different documents, so the hover text '
      + 'no longer tells a reader which chip the number came from').toEqual([]);

    const docUnderTwoNames = [...namesPerDoc].filter(([, n]) => n.size > 1);
    expect(docUnderTwoNames.map(([d, n]) => `${d}: ${[...n].join(' / ')}`),
      'one document is printed under two different names, so the same source '
      + 'looks like two').toEqual([]);
  });

  it('citeTitle survives a missing citation rather than printing "undefined"', () => {
    expect(citeTitle(undefined)).toBeUndefined();
    expect(citeTitle({})).toBeUndefined();
  });
});
