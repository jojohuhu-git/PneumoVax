// @vitest-environment happy-dom
// queue P1-2: a rec card could end up with its body hidden AND no control to
// bring it back.
//
// The card has two kinds of head. A "neutral" status (complete /
// not-indicated / deferred — nothing to do) gets a clickable head that
// collapses the body, so the things a clinician must act on dominate the
// screen (PD2/D5). Any other status gets a plain, non-clickable head and
// always shows its body.
//
// The bug: whether the body showed was remembered in state seeded ONCE when
// the card first appeared (`useState(!isNeutral)`), while whether the toggle
// button rendered was read from the CURRENT status. Change the status from
// neutral to due — press "Adjust age" on the Results step and a complete
// card becomes a due card — and the two disagreed: the remembered answer
// still said "collapsed", and the button that could undo it was gone. The
// whole recommendation vanished with no way back.
//
// The fix: what is SHOWN is derived from the current status every render.
// State only records the clinician's own click, and only matters while the
// card is collapsible.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';

const completeRec = {
  vaccine: 'PCV',
  status: 'complete',
  doseLabel: 'Series complete',
  dueToday: false,
};

const dueRec = {
  vaccine: 'PCV',
  status: 'due',
  doseLabel: 'Dose 1',
  dueToday: true,
  brands: ['PCV20 (Prevnar 20)'],
};

const body = () => document.querySelector('.rec-card-inner');
const toggle = () => document.querySelector('.rec-card-head-toggle');
// The compact-row look is driven by this class, which must agree with whether
// the body is actually showing — otherwise an expanded card is styled as a
// one-line summary, or a collapsed one leaves a full-height empty box.
const looksCollapsed = () =>
  document.querySelector('.rec-card').className.includes('rec-card-collapsed');

describe('queue P1-2 — a card body is never hidden with no way back', () => {
  it('a complete card starts collapsed, with a head you can click', () => {
    render(<RecCard rec={completeRec} />);
    expect(body()).toBeNull();
    expect(toggle()).not.toBeNull();
    expect(looksCollapsed()).toBe(true);
  });

  it('a card that becomes due shows its body again, though it never had a click', () => {
    const { rerender } = render(<RecCard rec={completeRec} />);
    expect(body()).toBeNull();          // collapsed by default, as designed
    rerender(<RecCard rec={dueRec} />); // "Adjust age" turns it into a due card
    expect(toggle()).toBeNull();        // a due card has no collapse control...
    expect(body()).not.toBeNull();      // ...so its body must be showing
    expect(looksCollapsed()).toBe(false);
    expect(screen.getByText('Dose 1')).toBeTruthy();
  });

  it('a due card that becomes complete collapses, and can be opened again', () => {
    const { rerender } = render(<RecCard rec={dueRec} />);
    expect(body()).not.toBeNull();
    rerender(<RecCard rec={completeRec} />);
    expect(body()).toBeNull();
    expect(toggle()).not.toBeNull();
    expect(looksCollapsed()).toBe(true);
  });

  it('once a clinician opens a complete card, it stays open', () => {
    render(<RecCard rec={completeRec} />);
    fireEvent.click(toggle());
    expect(body()).not.toBeNull();
    expect(looksCollapsed()).toBe(false);
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
  });
});
