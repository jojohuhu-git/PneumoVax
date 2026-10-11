import React from 'react';

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
export function renderNoteWithCites(text, cites, numberFor = makeCiteNumberer()) {
  if (!cites || cites.length === 0) return text;
  const parts = String(text).split('[c]');
  return parts.flatMap((part, i) => {
    if (i === parts.length - 1) return [part];
    const c = cites[i];
    if (!c) return [part];
    return [part, (
      <a
        key={i}
        href={c.url}
        target="_blank"
        rel="noopener noreferrer"
        className="note-cite"
        title={c.label}
      >
        {`[${numberFor(c.page ?? c.key)}]`}
      </a>
    )];
  });
}

// One numbering sequence per CARD, so the note and a dose verdict can never
// show a different [1] for the same document.
//
// The map is pre-seeded here, in the order the reader meets the citations
// going down the card — recorded doses, then any other-vaccine history, then
// the note — because React runs a child component's body after its parent's,
// so seeding on first render would number the note before the verdicts above
// it. (Same rule as MeningoVax's cardCiteNumberer, applied to this layout:
// PneumoVax has no booster line, and its note sits below both dose lists.)
export function cardCiteNumberer(doseValidations, otherValidations, noteCites) {
  const numberFor = makeCiteNumberer();
  const seed = (validations) => {
    for (const v of validations || []) {
      for (const c of v?.reasonCites || []) numberFor(c.page ?? c.key);
    }
  };
  seed(doseValidations);
  seed(otherValidations);
  for (const c of noteCites || []) numberFor(c.page ?? c.key);
  return numberFor;
}
