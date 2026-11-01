import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
// C1 (2026-10-17): the hover text's wording. It lives beside `cite()` in
// refs.js, not here, because it is a pure function of a citation's fields and
// MeningoVax — which has no citations.jsx — keeps its copy in the same file.
// Same name, same file, in both repos.
import { citeTitle, documentRefFor } from '../data/refs.js';

// ── P6-3 (S13, 2026-10-10): numbered inline citations ────────────────────
//
// Before this, a recommendation note was one plain string and its sources were
// chips at the foot of the card. Reproduced live on a 70-year-old with no risks
// and no history: the note made three separate claims (PCV20-or-PCV21, the
// PCV15→PPSV23 alternative, and "each completes the series alone") above four
// unlabelled chips, with nothing saying which source backed which claim.
//
// A `[c]` placeholder in note or verdict text becomes a clickable numbered
// superscript. Numbers are assigned HERE, at render time — never hardcoded in
// the engine — so a source cannot drift to a different number by being typed
// wrong.
//
// These live in their own module because two surfaces render cited copy: the
// recommendation cards (RecCard) and the risk-age note (RiskAgeNote). Neither
// should have to import the other.

// Assign [N] by order of first mention. The key is the source DOCUMENT
// (cite()'s `page`), not the citation key, so two sentences quoted from one
// page share a number while each keeps its own link and hover text: the number
// identifies the document, the link identifies the sentence.
export function makeCiteNumberer() {
  const numberByPage = new Map();
  let nextNumber = 1;
  return (dedupeKey) => {
    if (!numberByPage.has(dedupeKey)) numberByPage.set(dedupeKey, nextNumber++);
    return numberByPage.get(dedupeKey);
  };
}

// Split text on "[c]" and replace each marker with its citation's superscript.
// `cites` is one entry per marker, in order.
//
// An orphan marker (more "[c]" than cites) is DROPPED, never paired with the
// previous citation — attaching a source to a claim it does not support is the
// one failure mode worse than no citation at all. It is dropped rather than
// shown raw so a clinician never reads "[c]" as if it meant something.
// ── Emphasis (2026-10-24, owner request) ────────────────────────────────
//
// A note may mark a span with `**...**` to have it stand out — asked for on
// the cards that say "complete" AND then qualify it, where the qualification
// is the part a clinician must not skim past.
//
// It is done HERE, in the one renderer, rather than as a third part of the
// note object, because 28 files read a note as `lead` + `detail` and a third
// part would have gone missing from every one of them — including the
// citation sweeps, whose needles sit inside the emphasised sentence.
//
// ⚠️ The span may OPEN before a `[c]` marker and CLOSE after it, so emphasis
// is tracked ACROSS the marker split rather than inside one piece of it.
// Marker counting is untouched: `**` is not `[c]`, so every cite still lands
// on the same number it did before.
function emphasised(part, startOn, key) {
  const chunks = String(part).split('**');
  let on = startOn;
  const out = [];
  chunks.forEach((chunk, i) => {
    if (chunk) {
      out.push(on
        ? <strong key={`${key}-e${i}`} className="note-emphasis">{chunk}</strong>
        : chunk);
    }
    if (i < chunks.length - 1) on = !on;
  });
  return { nodes: out, on };
}

export function renderNoteWithCites(text, cites, numberFor = makeCiteNumberer()) {
  const str = String(text ?? '');
  if (!cites || cites.length === 0) {
    if (!str.includes('**')) return text;
    return emphasised(str, false, 'n').nodes;
  }
  const parts = str.split('[c]');
  let on = false;
  return parts.flatMap((part, i) => {
    const em = emphasised(part, on, i);
    on = em.on;
    if (i === parts.length - 1) return em.nodes;
    const c = cites[i];
    if (!c) return em.nodes;
    return [...em.nodes, <CiteMark key={i} c={c} n={numberFor(c.page ?? c.key)} />];
  });
}

// ── The citation pop-up (2026-11-01, rules-page redesign) ───────────────
//
// The owner: the superscript's hover "lags". It was the browser's native
// `title` tooltip — a built-in delay of about a second, and nothing at all on
// a touch screen. Now the same text (`citeTitle`, unchanged, so MeningoVax's
// wording rule still holds) opens at once on hover or keyboard focus, and on a
// phone or tablet the first tap opens it instead of leaving the page; the
// pop-up carries the link. Three ways out, as every popover here has: moving
// or tapping away, Escape, and the marker itself.
//
// The text moved from `title` to `data-title` so the native tooltip does not
// appear on top of this one a second later. Tests read `data-title`.
function CiteMark({ c, n }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const pop = useRef(null);
  const lastPointer = useRef('mouse');
  const text = citeTitle(c) ?? '';
  const [head, ...rest] = text.split('\n');
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);
  // Placed against the WINDOW, not the card: a result card clips what
  // overflows it, and a marker near the card's right edge lost half its
  // pop-up. Fixed position, kept inside the window, closed on scroll (above).
  // Set through the element, not a `style` prop (no inline styles - p7-2).
  useLayoutEffect(() => {
    const el = pop.current;
    const anchor = wrap.current;
    if (!open || !el || !anchor || typeof window === 'undefined') return;
    const a = anchor.getBoundingClientRect();
    const gap = 8;
    const w = el.offsetWidth;
    el.style.left = `${Math.max(gap, Math.min(a.left, window.innerWidth - w - gap))}px`;
    // Flush against the marker: a gap would fire mouseleave on the way to
    // the "Open the document" link and shut the pop-up under the pointer.
    const below = a.bottom;
    el.style.top = `${below + el.offsetHeight > window.innerHeight - gap ? Math.max(gap, a.top - el.offsetHeight) : below}px`;
  }, [open]);
  return (
    <span
      className="cite-wrap"
      ref={wrap}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <a
        href={c.url}
        target="_blank"
        rel="noopener noreferrer"
        className="note-cite"
        data-title={text}
        aria-expanded={open}
        onPointerDown={(e) => { lastPointer.current = e.pointerType; }}
        onFocus={() => setOpen(true)}
        onBlur={(e) => { if (!wrap.current?.contains(e.relatedTarget)) setOpen(false); }}
        onClick={(e) => {
          // A touch has no hover: its first tap opens the pop-up; the link
          // inside it opens the document.
          if (lastPointer.current === 'touch' && !open) { e.preventDefault(); setOpen(true); }
        }}
      >
        {`[${n}]`}
      </a>
      {open && (
        <span className="cite-pop" role="tooltip" ref={pop}>
          <span className="cite-pop-head">[{n}] {head}</span>
          {rest.length > 0 && <span className="cite-pop-quote">{rest.join(' ')}</span>}
          <a href={c.url} target="_blank" rel="noopener noreferrer" className="cite-pop-link">Open the document</a>
        </span>
      )}
    </span>
  );
}

// ── How many "[c]" markers a piece of text renders ──────────────────────
export function markerCount(text) {
  return String(text ?? '').split('[c]').length - 1;
}

// ── C2 (2026-10-17): the slicing lives here, not in RecCard ─────────────
//
// `reasonCites` is ONE ordered list across a dose's whole `reasons` array, and
// `noteCites` is ONE ordered list across a note's lead and detail. Which cite
// belongs to which sentence is therefore a slicing problem, and before C2 the
// slicing was written twice: once in RecCard to render, and — implicitly —
// never at all in the numberer, which seeded from the raw lists instead.
//
// That gap is the shape of fault C2 exists to remove. A cite present in the
// list but matched to no "[c]" renders nothing yet consumed a number, so the
// buttons could start at [2]. It happens not to occur today (measured
// 2026-10-17 and again on the rebase: 0 of 17,334 cards), which is
// precisely why it needed a
// structural answer rather than a test alone — nothing would have told us when
// it started. Numbering and rendering now read the same two functions.

/** One entry per reason: the cites that reason renders, in order. */
export function reasonCiteSlices(reasons, reasonCites) {
  const slices = [];
  let consumed = 0;
  for (const r of reasons ?? []) {
    const markers = markerCount(r);
    slices.push(markers > 0 ? (reasonCites ?? []).slice(consumed, consumed + markers) : []);
    consumed += markers;
  }
  return slices;
}

/**
 * How a note's single ordered `noteCites` divides between its two halves.
 * The detail's slice is returned whether or not the disclosure is open: a
 * source must keep the same number when the reader expands "Why this".
 */
export function noteCiteSlices(note, noteCites) {
  const lead = typeof note === 'string' ? note : note?.lead;
  const detail = typeof note === 'string' ? null : note?.detail;
  const cites = noteCites ?? [];
  const leadCount = markerCount(lead);
  return {
    lead: cites.slice(0, leadCount),
    detail: cites.slice(leadCount, leadCount + markerCount(detail)),
  };
}

// ── C2 + C3 (2026-10-17): one place works out the numbers AND the list ──
//
// Owner-reported: "there are multiple source chips under it and I do not know
// where it came from. I also forget why there are multiple source chips listed
// if its only citing one of them."
//
// Before this, a card had two citation systems that never compared notes. The
// raised numbers were assigned here at render time; the grey buttons were a
// separate list built in the engine and printed unnumbered. Nothing matched
// one to the other, and measured over the whole grid on 2026-10-17 they
// disagreed in both directions — 26,651 buttons that no number pointed at, and
// 1,380 cards showing a number for a document with no button at all.
//
// Those two figures are RE-MEASURED on the rebase (the branch was held while
// three merges landed in `refs.js`, and the second had moved): reproduce them
// with `npx vite-node scripts/citationMapping.mjs`, which reports the same
// counts for whichever branch is checked out.
//
// `cardSources` is the single answer to both questions. It walks the card in
// READING ORDER and hands back the numbering function and the finished list,
// which are therefore the same computation rather than two that must agree.
//
// ── Order of first mention (owner decision, 2026-10-17) ─────────────────
//
// The sentences decide. The first document a sentence cites is [1], the next
// new one is [2], and the button row is printed in that order — "this is how
// citations are normally ordered", as a journal's reference list is. The owner
// was shown all three candidates rendered from a real card (a 6-year-old with
// asplenia, whose one marker cites what was then the second button) and chose
// this one. The rejected alternatives, so they are not re-proposed:
//   • buttons define the numbering — the row always reads 1,2,3 but a sentence
//     can show [2] with no [1] above it;
//   • buttons keep their authored order and print whatever number they got —
//     today's behaviour extended, which printed the row out of sequence on 248
//     cards and is the guessing the owner reported. That 248 is the one count
//     on this branch NOT re-measured at the rebase: it describes an option
//     that was rejected rather than anything the app does, so there is nothing
//     for it to drift against.
//
// A button no sentence points at keeps its authored position at the END of the
// list. Those are not decoration: 26,651 of them are holding up statements the
// card makes out loud without quoting (plan §4), and giving each its own quote
// is item C8. Until then they are numbered and last, never dropped — deleting
// a clinical source to tidy a list is the one outcome this must not produce.
export function cardSources({ doseValidations, otherValidations, note, noteCites, citations }) {
  const numberFor = makeCiteNumberer();
  const sources = new Map();   // dedupe key -> { n, url, short, title }

  // A sentence's citation. Its document's whole-page entry supplies the
  // button's title; `doc` (the ref's `short`, the same string C1 puts on the
  // hover text) supplies the visible name.
  const fromMarker = (c) => {
    const key = c.page ?? c.key;
    const n = numberFor(key);
    if (sources.has(key)) return;
    const document = documentRefFor(c.page);
    sources.set(key, {
      n,
      url: c.page ?? c.url,
      short: c.doc ?? document?.short,
      title: document?.label ?? c.doc,
    });
  };

  const seedValidations = (validations) => {
    for (const v of validations ?? []) {
      for (const slice of reasonCiteSlices(v?.reasons, v?.reasonCites)) {
        for (const c of slice) fromMarker(c);
      }
    }
  };

  // Reading order down the card: this vaccine's recorded doses, then any other
  // vaccine's history shown on the same card, then the note.
  seedValidations(doseValidations);
  seedValidations(otherValidations);
  const noteSlices = noteCiteSlices(note, noteCites);
  for (const c of [...noteSlices.lead, ...noteSlices.detail]) fromMarker(c);

  // Then the card's own buttons, in the order the engine lists them. One whose
  // document a sentence already cited keeps that number, and its authored
  // title wins — it was written for this card.
  for (const ch of citations ?? []) {
    const n = numberFor(ch.url);
    const existing = sources.get(ch.url);
    if (existing) {
      existing.short = ch.short || existing.short;
      existing.title = ch.label || existing.title;
    } else {
      sources.set(ch.url, { n, url: ch.url, short: ch.short || ch.label, title: ch.label });
    }
  }

  return {
    numberFor,
    sources: [...sources.values()].sort((a, b) => a.n - b.n),
  };
}
