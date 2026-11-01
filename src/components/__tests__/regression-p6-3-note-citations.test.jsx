// @vitest-environment happy-dom
// P6-3 (S13, 2026-10-10): a recommendation note renders as one plain string
// and its sources appear only as chips at the foot of the card. Reproduced
// live on the running app this session with a 70-year-old, no risks, no
// history: the note makes THREE separate claims —
//
//   "Routine pneumococcal vaccination for adults >=50 with no (or unknown,
//    or PCV7-only) history: 1 dose of PCV20 or PCV21 — OR 1 dose of PCV15
//    followed by PPSV23 >=1 year later. PCV20 and PCV21 each complete the
//    series alone."
//
// — and the card showed three chips (CDC Adult Notes, CDC Adult Timing Job
// Aid, MMWR >=50 expansion) with `document.querySelectorAll('.note-cite')`
// returning 0. Nothing tells the reader which source backs which claim.
//
// The contract: `rec.noteCites` is an ORDERED list of cite() objects, one per
// literal "[c]" in the note text, in order. RecCard assigns the visible [N]
// at render time — by order of first mention, deduped by source `page`, and
// numbered ONCE PER CARD so the note and the dose verdicts can never show a
// different [1] for the same document. recommend.js never hardcodes a number,
// so a source cannot drift to a different one by being typed wrong.
//
// Note here is still a plain STRING. P6-4 splits it into {lead, detail}; the
// slicing cases that only exist once there is a disclosure belong with that
// item, not this one.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';

const baseRec = {
  vaccine: 'PCV',
  status: 'due',
  doseLabel: 'Dose 1',
  dueToday: true,
};

// C2 (2026-10-17): the grey buttons now print the SAME "[N]" the sentence
// does — that is the whole point of the item — so a bare text query for "[1]"
// now matches the marker and its button both. These helpers scope every query
// below to the inline marker, which is what each assertion here is about. The
// button row has its own tests in regression-c2-c3-numbered-sources.
const isMarker = (el) => String(el.className).includes('note-cite');
const markers = (text) => screen.getAllByText(text).filter(isMarker);
const marker = (text) => {
  const found = markers(text);
  expect(found, `expected exactly one inline marker reading ${text}`).toHaveLength(1);
  return found[0];
};
const queryMarker = (text) => screen.queryAllByText(text).filter(isMarker)[0] ?? null;

describe('P6-3 — numbered inline note citations', () => {
  it('renders a [c] placeholder as a numbered [1] link to the cited URL', () => {
    render(<RecCard rec={{
      ...baseRec,
      note: 'PCV20 and PCV21 each complete the series alone [c].',
      noteCites: [{
        key: 'cdcAdultPneumo',
        page: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo',
        url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#:~:text=example',
        label: 'CDC Adult Notes — the quoted sentence',
      }],
    }} />);
    const link = marker('[1]');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href'))
      .toBe('https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#:~:text=example');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('data-title')).toBe('CDC Adult Notes — the quoted sentence');
    expect(link.className).toContain('note-cite');
  });

  it('numbers two different sources in order of first mention', () => {
    render(<RecCard rec={{
      ...baseRec,
      note: 'One dose of PCV20 or PCV21 [c] — or PCV15 followed by PPSV23 >=1 year later [c].',
      noteCites: [
        { key: 'mmwr7401a1', page: 'https://example.test/page-a', url: 'https://example.test/page-a#a', label: 'A' },
        { key: 'cdcAdultPneumo', page: 'https://example.test/page-b', url: 'https://example.test/page-b#b', label: 'B' },
      ],
    }} />);
    expect(marker('[1]').getAttribute('href')).toBe('https://example.test/page-a#a');
    expect(marker('[2]').getAttribute('href')).toBe('https://example.test/page-b#b');
  });

  it('reuses one number when the same source repeats in a note', () => {
    render(<RecCard rec={{
      ...baseRec,
      note: 'Cited here [c] and again here [c].',
      noteCites: [
        { key: 'cdcAdultPneumo', page: 'https://example.test/a', url: 'https://example.test/a', label: 'A' },
        { key: 'cdcAdultPneumo', page: 'https://example.test/a', url: 'https://example.test/a', label: 'A' },
      ],
    }} />);
    expect(markers('[1]')).toHaveLength(2);
    expect(queryMarker('[2]')).toBeNull();
  });

  it('same-page, different-sentence citations share a number but keep their own href and hover', () => {
    // Both of these are real: CDC's adult notes print the PCV15->PPSV23
    // interval sentence and the ">=50 routine" sentence on ONE page.
    const page = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo';
    render(<RecCard rec={{
      ...baseRec,
      note: 'Routine at >=50 [c]; PCV15 is followed by PPSV23 >=1 year later [c].',
      noteCites: [
        { key: 'adultRoutine50', page, url: `${page.split('#')[0]}#:~:text=routine`, label: 'Routine at age 50' },
        { key: 'adultPpsvInterval', page, url: `${page.split('#')[0]}#:~:text=interval`, label: 'PPSV23 one year later' },
      ],
    }} />);
    const links = markers('[1]');
    expect(links).toHaveLength(2);
    expect(queryMarker('[2]')).toBeNull();
    expect(links[0].getAttribute('href')).toMatch(/#:~:text=routine$/);
    expect(links[1].getAttribute('href')).toMatch(/#:~:text=interval$/);
    expect(links[0].getAttribute('data-title')).toBe('Routine at age 50');
    expect(links[1].getAttribute('data-title')).toBe('PPSV23 one year later');
  });

  it('a note with no noteCites renders as plain text, with no stray links', () => {
    render(<RecCard rec={{ ...baseRec, note: 'A plain note with no citations.', noteCites: [] }} />);
    expect(screen.getByText('A plain note with no citations.')).toBeTruthy();
    expect(queryMarker('[1]')).toBeNull();
  });

  it('an extra [c] does not borrow the previous citation', () => {
    // Honesty guard: if a note carries more [c] markers than noteCites
    // entries, the extra marker must NOT silently reuse the last citation —
    // that would attach a source to a claim the source does not support.
    // The orphan marker is dropped from the text rather than shown raw, so a
    // clinician never reads "[c]" as if it meant something. The real
    // protection against the mismatch arising at all is the engine-wide
    // marker/cite count guard that lands with the wired notes (P6-3b).
    render(<RecCard rec={{
      ...baseRec,
      note: 'Sourced [c], but this second claim has none [c].',
      noteCites: [{ key: 'only', page: 'https://example.test/a', url: 'https://example.test/a', label: 'A' }],
    }} />);
    expect(markers('[1]')).toHaveLength(1);
    expect(queryMarker('[2]')).toBeNull();
    expect(document.querySelector('.rec-note').textContent).not.toContain('[c]');
  });

  it('the note and a dose verdict share one numbering sequence, in reading order', () => {
    // The CARD is the numbering scope, and numbers run in the order the
    // reader meets them top to bottom — not in the order React happens to
    // render children. In PneumoVax's card the recorded-dose list sits ABOVE
    // the note, so a dose verdict's source is [1] and the note's is [2].
    // (Same rule as MeningoVax's cardCiteNumberer, applied to this layout.)
    render(<RecCard
      rec={{
        ...baseRec,
        note: 'Routine series [c].',
        noteCites: [{ key: 'a', page: 'https://example.test/note', url: 'https://example.test/note', label: 'Note source' }],
      }}
      doses={[{ date: '2020-01-01', product: 'PCV13' }]}
      doseValidations={[{
        status: 'invalid',
        reasons: ['This dose was given below the minimum age [c].'],
        reasonCites: [{ key: 'b', page: 'https://example.test/dose', url: 'https://example.test/dose', label: 'Dose source' }],
      }]}
      ageMonths={840}
    />);
    expect(marker('[1]').getAttribute('href')).toBe('https://example.test/dose');
    expect(marker('[2]').getAttribute('href')).toBe('https://example.test/note');
  });
});
