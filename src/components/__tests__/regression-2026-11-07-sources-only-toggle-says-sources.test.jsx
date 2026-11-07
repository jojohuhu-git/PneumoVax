// @vitest-environment happy-dom
// OWNER DECISION 2026-11-07 ("Call it Sources"). Since WORD-1 (2026-11-06) the
// Sources row lives inside "Why this", so a card with sources always has the
// toggle — even when there is no sentence behind it. Ava (3, healthy, four
// PCV20) opened "Why this" to three source buttons and nothing else; she said
// "there is nothing under why this". Measured over the grid that day: 5,676 of
// 17,017 cards were like Ava's. Asked, she chose: when a card has no
// explanation sentence, the button says "Sources". A card WITH one still says
// "Why this". Layout only — no clinical wording moves.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecCard from '../RecCard.jsx';
import { recommend } from '../../logic/recommend.js';

const INFANT_DATES = ['2023-11-07', '2024-01-07', '2024-03-07', '2024-09-07'];
const toddlerCard = (product) => recommend({
  dob: '2023-09-07', today: '2026-11-07', riskIds: [], ppsv23Doses: [],
  pcvDoses: INFANT_DATES.map((date) => ({ product, date })),
}).recs[0];

// A complete card renders folded; open it the way the reader does.
function openCard() {
  for (const btn of screen.getAllByRole('button', { expanded: false })) {
    if (/rec-card-head-toggle/.test(btn.className)) fireEvent.click(btn);
  }
}

describe('a "Why this" with nothing but sources is called "Sources"', () => {
  it('Ava — no explanation sentence: the button says Sources and opens to the sources', () => {
    render(<RecCard rec={toddlerCard('PCV20')} />);
    openCard();
    const toggle = screen.getByTestId('rec-note-toggle');
    expect(toggle).toHaveTextContent(/^Sources$/);
    expect(toggle).not.toHaveTextContent('Why this');
    fireEvent.click(toggle);
    expect(document.querySelectorAll('.citation-chip').length).toBeGreaterThan(0);
    // The button already says "Sources"; the row does not repeat the word.
    expect(document.querySelector('.rec-citations-heading')).toBeNull();
  });

  it('control — four PCV15: the age-50 sentence is behind it, so it still says Why this', () => {
    render(<RecCard rec={toddlerCard('PCV15')} />);
    openCard();
    const toggle = screen.getByTestId('rec-note-toggle');
    expect(toggle).toHaveTextContent(/^Why this$/);
    fireEvent.click(toggle);
    expect(screen.getByText(/Re-evaluate at age 50/)).toBeTruthy();
    expect(document.querySelector('.rec-citations-heading')).toHaveTextContent('Sources');
  });
});
