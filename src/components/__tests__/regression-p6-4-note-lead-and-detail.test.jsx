// @vitest-environment happy-dom
// P6-4 (S13, 2026-10-10): a recommendation note was one paragraph. Measured
// across 31 distinct notes the engine can produce: median 188 characters,
// longest 459, and 15 of the 31 over 200 — a whole ACIP schedule row recited
// to a reader who needed one line. (MeningoVax measured median 128 / longest
// 530 before making the same change in its U1.)
//
// The note is now `{ lead, detail }`: `lead` is what to do for THIS patient,
// and `detail` sits behind a "Why this" disclosure. A note with no `detail`
// shows no toggle at all — most short notes stay one line.
//
// The contract that is easy to get wrong, and so is pinned hard here:
// `noteCites` stays ONE ordered list across BOTH halves. The lead's "[c]"
// markers consume the first entries and the detail's take the rest, so a
// source keeps the same number whether the disclosure is open or shut.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('P6-4 — note lead, with detail behind a disclosure', () => {
  it('shows the lead and hides the detail until asked', () => {
    render(<RecCard rec={{
      ...baseRec,
      note: { lead: 'Give 1 dose of PCV20 today.', detail: 'The series is then complete.' },
    }} />);
    expect(screen.getByText('Give 1 dose of PCV20 today.')).toBeTruthy();
    expect(screen.queryByText('The series is then complete.')).toBeNull();
    fireEvent.click(screen.getByTestId('rec-note-toggle'));
    expect(screen.getByText('The series is then complete.')).toBeTruthy();
  });

  it('shows no toggle when there is no detail', () => {
    render(<RecCard rec={{ ...baseRec, note: { lead: 'Give 1 dose of PCV20 today.', detail: null } }} />);
    expect(screen.getByText('Give 1 dose of PCV20 today.')).toBeTruthy();
    expect(screen.queryByTestId('rec-note-toggle')).toBeNull();
  });

  it('still accepts a plain string note, as the whole lead', () => {
    // Back-compat: a note that was never split is simply all lead.
    render(<RecCard rec={{ ...baseRec, note: 'A plain one-line note.' }} />);
    expect(screen.getByText('A plain one-line note.')).toBeTruthy();
    expect(screen.queryByTestId('rec-note-toggle')).toBeNull();
  });

  it('numbers a detail citation after the lead\'s, and links it once opened', () => {
    render(<RecCard rec={{
      ...baseRec,
      note: { lead: 'The lead cites this [c].', detail: 'The detail cites another page [c].' },
      noteCites: [
        { key: 'leadSource', page: 'https://example.test/lead', url: 'https://example.test/lead#x', label: 'Lead source' },
        { key: 'detailSource', page: 'https://example.test/detail', url: 'https://example.test/detail#y', label: 'Detail source' },
      ],
    }} />);
    // Shut: only the lead's marker is on screen, and it is [1] — the detail's
    // source has not stolen the number.
    expect(marker('[1]').getAttribute('href')).toBe('https://example.test/lead#x');
    expect(queryMarker('[2]')).toBeNull();
    fireEvent.click(screen.getByTestId('rec-note-toggle'));
    expect(marker('[2]').getAttribute('href')).toBe('https://example.test/detail#y');
    expect(marker('[2]').getAttribute('title')).toBe('Detail source');
  });

  it('a lead with no marker leaves the whole citation list to the detail', () => {
    render(<RecCard rec={{
      ...baseRec,
      note: { lead: 'The lead makes no cited claim.', detail: 'The detail does [c].' },
      noteCites: [{ key: 'only', page: 'https://example.test/only', url: 'https://example.test/only#z', label: 'Detail only' }],
    }} />);
    expect(queryMarker('[1]')).toBeNull();
    fireEvent.click(screen.getByTestId('rec-note-toggle'));
    expect(marker('[1]').getAttribute('href')).toBe('https://example.test/only#z');
  });

  it('a source cited in BOTH halves keeps one number across the disclosure', () => {
    const page = 'https://example.test/same';
    render(<RecCard rec={{
      ...baseRec,
      note: { lead: 'Lead claim [c].', detail: 'Detail claim from the same page [c].' },
      noteCites: [
        { key: 'a', page, url: `${page}#one`, label: 'Sentence one' },
        { key: 'b', page, url: `${page}#two`, label: 'Sentence two' },
      ],
    }} />);
    expect(marker('[1]')).toBeTruthy();
    fireEvent.click(screen.getByTestId('rec-note-toggle'));
    // Same document, so still [1] in both halves — never a stray [2].
    expect(markers('[1]')).toHaveLength(2);
    expect(queryMarker('[2]')).toBeNull();
  });

  it('the toggle reports its open/shut state for screen readers', () => {
    render(<RecCard rec={{
      ...baseRec,
      note: { lead: 'Lead.', detail: 'Detail.' },
    }} />);
    const toggle = screen.getByTestId('rec-note-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.tagName).toBe('BUTTON');
    // P5-2: must be type="button", or it submits the wizard's form.
    expect(toggle.getAttribute('type')).toBe('button');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });
});
