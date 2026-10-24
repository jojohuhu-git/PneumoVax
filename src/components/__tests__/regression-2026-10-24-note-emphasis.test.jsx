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
import { render, screen } from '@testing-library/react';
import { renderNoteWithCites, makeCiteNumberer } from '../citations.jsx';
import { recommend } from '../../logic/recommend.js';

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

describe('note emphasis — on the card the owner asked about', () => {
  // Her family-3 patient: PCV15 2026-07-19, PPSV23 2026-10-11, 30 years old
  // with chronic heart disease. The card reads complete AND qualifies it.
  const note = () => {
    const out = recommend({
      today: '2026-10-24', ageMonths: 30 * 12, riskIds: ['chronic_heart'],
      pcvDoses: [{ product: 'PCV15', date: '2026-07-19' }],
      ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }],
    });
    const rec = out.recs.find((r) => r.status === 'complete');
    return typeof rec.note === 'string' ? rec.note : rec.note.lead;
  };

  it('marks the qualifying sentence, and only that sentence', () => {
    const text = note();
    // Exactly one pair of markers.
    expect(text.split('**')).toHaveLength(3);
    const [before, emphasised] = text.split('**');
    // The completion claim stays plain; the qualification is what stands out.
    expect(before).toContain('is a complete pneumococcal series');
    expect(before).not.toContain('given earlier than');
    expect(emphasised).toContain('One dose in this series was given earlier than');
    expect(emphasised).toContain('also completes the series');
  });

  it('renders it as one emphasised block spanning its citations', () => {
    const text = note();
    render(<p>{renderNoteWithCites(text, [CITE('a'), CITE('b'), CITE('c'), CITE('d'), CITE('e')], makeCiteNumberer())}</p>);
    const ems = [...document.querySelectorAll('.note-emphasis')].map((n) => n.textContent);
    expect(ems.length).toBeGreaterThan(1); // broken by the [c] markers inside it
    expect(ems.join('')).toContain('One dose in this series was given earlier');
    expect(ems.join('')).toContain('also completes the series');
    expect(document.body.textContent).not.toContain('*');
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
  // Her instruction: "remove owners ruling comment from cards". The rulings
  // stay recorded in each rule's `source` and in CLINICAL_SPEC.md, where the
  // audit trail belongs — they are not something a clinician reading a dose
  // chip needs to be told.
  const patients = [
    // family 1
    { ageMonths: 840, riskIds: [], pcvDoses: [{ product: 'PCV13', date: '2016-10-13' }, { product: 'PCV20', date: '2025-10-10' }], ppsv23Doses: [{ product: 'PPSV23', date: '2021-10-13' }] },
    // family 2
    { ageMonths: 840, riskIds: [], pcvDoses: [{ product: 'PCV15', date: '2026-06-19' }], ppsv23Doses: [{ product: 'PPSV23', date: '2025-10-11' }] },
    // family 3
    { ageMonths: 360, riskIds: ['chronic_heart'], pcvDoses: [{ product: 'PCV15', date: '2026-07-19' }], ppsv23Doses: [{ product: 'PPSV23', date: '2026-10-11' }] },
  ];

  it('no dose verdict and no card mentions an owner ruling or determination', () => {
    for (const p of patients) {
      const out = recommend({ today: '2026-10-24', ...p });
      const everything = [
        ...out.perDose.pcv, ...out.perDose.ppsv23,
      ].flatMap((d) => [...(d.reasons ?? []), d.detail ?? ''])
        .concat(out.recs.map((r) => (typeof r.note === 'string'
          ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`)))
        .join(' ');
      expect(everything).not.toMatch(/owner ruling/i);
      expect(everything).not.toMatch(/owner clinical determination/i);
    }
  });
});
