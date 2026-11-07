// ─────────────────────────────────────────────────────────────────────────
// noteFold.js — WORD-1 (OWNER DECISIONS 2026-11-06): what a card's note shows
// before a click, and what waits behind "Why this".
//
// The card's heading already reads the way the Rulebook does, so most of the
// note repeats it. This is the one place that decides which sentences stay in
// view. It runs once, as the last step of `recommend()`, so `note.lead` keeps
// meaning "what shows" and the engine's own steps — which read and extend
// notes while they work — never see a folded note. No component selects a
// clinical sentence.
//
// Nothing is deleted here. A sentence either stays in `lead` or moves to the
// front of `detail`, carrying its own [c] with it.
//
// The list is the report's "What must stay in view" table
// (docs/archive/report-2026-11-06-wordy-result-pages.md), and each rule names
// why. Adding a sentence the clinician must see without a click: add a rule
// here, and a line to the guard in
// regression-word-1-2026-11-06-result-page-fold.test.js.

// A card that is shut by default keeps its note whole: its one line IS the note
// once opened. `no-dose-now` is on this list for the opposite reason — she ruled
// it stays open and shows the later dose without a click (§C-COMPLETE).
const NOT_FOLDED = new Set(['complete', 'not-indicated', 'deferred', 'no-dose-now']);

// `alsoFrom: 'detail'` brings a sentence forward that sat behind "Why this" even
// before the fold. `unless` looks at the card's other sentences.
export const STAY_IN_VIEW = Object.freeze([
  { why: 'Bold: her request of 2026-10-24; these qualify the heading', re: /\*\*/ },
  { why: 'Stops two doses being given', re: /^Choose\b/, alsoFrom: 'detail' },
  { why: 'This card has no date anywhere else', re: /not due until the patient reaches 12 months/ },
  { why: 'Both numbers go on the card (C10-2)', re: /can be given (today|from) .*minimum interval/, alsoFrom: 'detail' },
  {
    why: 'Option B owes more than its heading shows, and PCV15 needs its PPSV23',
    re: /^Option B\b.*\bthen\b/,
    unless: /^This child has already had a PPSV23\b/,
  },
  { why: 'Only PCV20 avoids a further dose', re: /^Only PCV20 finishes/ },
  { why: 'PCV15 needs its follow-up, or it reads as a one-dose choice', re: /followed by PPSV23|^If PCV15 is chosen, follow|^If PCV15 is used, PPSV23 may follow/ },
  { why: 'What PCV15 means for this child, on a card that offers it', re: /^If PCV15 is used( to complete)?, (add PPSV23|no PPSV23 follows)/, alsoFrom: 'detail' },
  { why: 'The second step applies only to some patients', re: /^Only if PPSV23 was not previously given/ },
  { why: 'S15: 8 weeks is named as an option at 50 and over', re: /^A minimum interval of 8 weeks may be considered/ },
  { why: 'A child answered by the adult schedule must be told why', re: /^This patient turns 19\b|not offered at 19/ },
  { why: 'The usual PPSV23 step does not apply to this child', re: /^This child has already had a PPSV23\b/ },
  { why: 'Option B is not finished for life; Option A is (owner, 2026-11-07, Cora)', re: /^If PPSV23 is chosen, at 19\b/, alsoFrom: 'detail' },
]);

const markers = (s) => (s.match(/\[c\]/g) ?? []).length;
const bold = (s) => (s.match(/\*\*/g) ?? []).length;

// Sentences, with a bold run never cut in two: "**Held. Wait.**" is one line.
// A colon does not end one: "No further PPSV23: 1 dose has been given." is whole.
export function sentencesOf(text) {
  const out = [];
  for (const piece of text.split(/(?<=\.\*{0,2})\s+(?=[A-Z*])/)) {
    const last = out[out.length - 1];
    if (last !== undefined && bold(last) % 2 === 1) out[out.length - 1] = `${last} ${piece}`;
    else if (piece) out.push(piece);
  }
  return out;
}

function staysInView(sentence, from, all) {
  return STAY_IN_VIEW.some(({ re, alsoFrom, unless }) => re.test(sentence)
    && (from === 'lead' || alsoFrom === from)
    && !(unless && all.some((s) => unless.test(s))));
}

export function foldCard(card) {
  if (NOT_FOLDED.has(card.status) || !card.note) return card;
  const note = typeof card.note === 'string' ? { lead: card.note, detail: null } : card.note;

  // `noteCites` is one list in reading order across lead then detail, so a
  // sentence that moves has to take its own entries with it.
  const cites = card.noteCites ?? [];
  let at = 0;
  const parts = [['lead', note.lead], ['detail', note.detail]]
    .flatMap(([from, text]) => sentencesOf(text ?? '').map((s) => {
      const n = markers(s);
      at += n;
      return { from, text: s, cites: cites.slice(at - n, at) };
    }));
  const all = parts.map((p) => p.text);
  const kept = parts.filter((p) => staysInView(p.text, p.from, all));
  const folded = parts.filter((p) => !kept.includes(p));
  // Nothing changes place: leave the card exactly as the engine wrote it.
  if (parts.every((p) => (p.from === 'lead') === kept.includes(p))) return card;

  const texts = (list) => list.map((p) => p.text).join(' ');
  return {
    ...card,
    note: { ...note, lead: texts(kept), detail: texts(folded) },
    noteCites: [...kept.flatMap((p) => p.cites), ...folded.flatMap((p) => p.cites), ...cites.slice(at)],
  };
}
