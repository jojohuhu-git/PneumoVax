// ─────────────────────────────────────────────────────────────────────────
// citationMapping.mjs — how the raised [N] markers and the grey source
// buttons line up, counted over the whole patient grid.
//
// Run it:  npx vite-node scripts/citationMapping.mjs
// (vite-node, not node: it imports `citations.jsx`.)
//
// ── Why this exists ──────────────────────────────────────────────────────
//
// `scripts/proseDiff.mjs` records every citation LABEL a card prints, so it
// catches wording changes. It records neither the raised numbers nor which
// button a `[1]` points at, so a card could keep every word and still have its
// numbering wrong and proseDiff would report no change. The plan's §9 says so
// in as many words. This is the missing half, and it is a REPORT, not a gate:
// it prints counts and exits 0 whatever it finds.
//
// Deliberately not a test. Turning any of these into an assertion today would
// make the cheapest way to go green "delete a grey button", and several of
// those buttons are the only source behind a statement the card makes out loud
// (plan §4). The gate ships with C8, once the missing quotes exist.
//
// ── What it measures ─────────────────────────────────────────────────────
//
//   cards                    one recommendation card, as the reader sees it
//   buttons                  grey source buttons printed, summed over cards
//   unpointed buttons        a button no raised number on that card points at
//   cards citing a document with no button   a [N] with nothing to click
//   silent markers           a cite that consumed a number but rendered no
//                            "[c]" — it would push every later number up by one
//
// Every number is derived from the SAME functions the screen uses, so it
// cannot drift from what is rendered: the card's own `citations` for buttons,
// and `citations.jsx`'s numberer for the markers. Where the C2/C3 work is
// present (`cardSources`), the button list is taken from it instead, so the
// same command run on either branch reports that branch's real behaviour.
// ─────────────────────────────────────────────────────────────────────────
import { buildCases } from '../src/test-grid.js';
import { recommend } from '../src/logic/recommend.js';
import * as citations from '../src/components/citations.jsx';

const hasCardSources = typeof citations.cardSources === 'function';

/** How many "[c]" markers a piece of text renders. */
const markerCount = (text) => String(text ?? '').split('[c]').length - 1;

/** Markers a note renders, lead then detail — the reading order on screen. */
function noteMarkerCount(note) {
  if (typeof note === 'string') return markerCount(note);
  return markerCount(note?.lead) + markerCount(note?.detail);
}

/**
 * The cards one patient sees, each with the dose verdicts printed on it.
 * Mirrors `Results.jsx`: the first card for a vaccine carries that vaccine's
 * recorded doses, and a vaccine with doses but no card of its own is attached
 * to the first card as "other history".
 */
function cardsFor(result) {
  const recs = result.recs ?? [];
  if (recs.length === 0) return [];
  const histories = {
    PCV: { label: 'PCV', doses: result.orderedDoses.pcv, doseValidations: result.perDose.pcv },
    PPSV23: { label: 'PPSV23', doses: result.orderedDoses.ppsv23, doseValidations: result.perDose.ppsv23 },
  };
  const seen = {};
  const cards = recs.map((rec) => {
    let doseValidations = [];
    if (!seen[rec.vaccine] && histories[rec.vaccine]) {
      seen[rec.vaccine] = true;
      doseValidations = histories[rec.vaccine].doseValidations ?? [];
    }
    return { rec, doseValidations, otherValidations: [] };
  });
  const orphan = Object.values(histories).find(h => h.doses.length > 0 && !seen[h.label]);
  if (orphan) cards[0].otherValidations = orphan.doseValidations ?? [];
  return cards;
}

/** Pages a card's sentences actually cite, in reading order, markers only. */
function pagesCitedBy(card) {
  const pages = [];
  const fromValidations = (validations) => {
    for (const v of validations ?? []) {
      let consumed = 0;
      for (const reason of v?.reasons ?? []) {
        const n = markerCount(reason);
        for (const c of (v?.reasonCites ?? []).slice(consumed, consumed + n)) {
          pages.push(c.page ?? c.key);
        }
        consumed += n;
      }
    }
  };
  fromValidations(card.doseValidations);
  fromValidations(card.otherValidations);
  const noteCites = card.rec.noteCites ?? [];
  for (const c of noteCites.slice(0, noteMarkerCount(card.rec.note))) pages.push(c.page ?? c.key);
  return pages;
}

/** Cites handed to the numberer but matched to no "[c]" — a silent number. */
function silentMarkersOn(card) {
  let silent = 0;
  for (const validations of [card.doseValidations, card.otherValidations]) {
    for (const v of validations ?? []) {
      const rendered = (v?.reasons ?? []).reduce((n, r) => n + markerCount(r), 0);
      silent += Math.max(0, (v?.reasonCites ?? []).length - rendered);
    }
  }
  silent += Math.max(0, (card.rec.noteCites ?? []).length - noteMarkerCount(card.rec.note));
  return silent;
}

/** The buttons a card prints, as the branch in the working tree prints them. */
function buttonsOn(card) {
  if (hasCardSources) {
    return citations.cardSources({
      doseValidations: card.doseValidations,
      otherValidations: card.otherValidations,
      note: card.rec.note,
      noteCites: card.rec.noteCites,
      citations: card.rec.citations,
    }).sources.map(s => s.url);
  }
  return (card.rec.citations ?? []).map(c => c.url);
}

const tally = {
  patients: 0, cards: 0, buttons: 0, unpointedButtons: 0,
  cardsWithUnpointed: 0, cardsCitingAbsentDocument: 0, silentMarkers: 0,
};
const absentByDocument = new Map();
const unpointedByDocument = new Map();
const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);

for (const { input } of buildCases()) {
  tally.patients += 1;
  for (const card of cardsFor(recommend(input))) {
    tally.cards += 1;
    const cited = new Set(pagesCitedBy(card));
    const buttons = buttonsOn(card);
    tally.buttons += buttons.length;
    tally.silentMarkers += silentMarkersOn(card);

    const unpointed = buttons.filter(url => !cited.has(url));
    tally.unpointedButtons += unpointed.length;
    if (unpointed.length) tally.cardsWithUnpointed += 1;
    for (const url of unpointed) bump(unpointedByDocument, url);

    const buttonSet = new Set(buttons);
    const absent = [...cited].filter(page => !buttonSet.has(page));
    if (absent.length) {
      tally.cardsCitingAbsentDocument += 1;
      for (const page of absent) bump(absentByDocument, page);
    }
  }
}

const n = (x) => x.toLocaleString('en-US');
const pct = (x, of) => of === 0 ? '—' : `${((x / of) * 100).toFixed(1)}%`;
const shorten = (url) => url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 76);

console.log(`\nCitation mapping — ${hasCardSources ? 'WITH C2/C3 (cardSources present)' : 'without C2/C3 (today\'s behaviour)'}\n`);
console.log(`  patients on the grid                       ${n(tally.patients)}`);
console.log(`  recommendation cards rendered              ${n(tally.cards)}`);
console.log(`  grey source buttons printed                ${n(tally.buttons)}`);
console.log(`  buttons no raised number points at         ${n(tally.unpointedButtons)}  (${pct(tally.unpointedButtons, tally.buttons)} of buttons)`);
console.log(`  cards carrying at least one of those       ${n(tally.cardsWithUnpointed)}  (${pct(tally.cardsWithUnpointed, tally.cards)} of cards)`);
console.log(`  cards citing a document with NO button     ${n(tally.cardsCitingAbsentDocument)}  (${pct(tally.cardsCitingAbsentDocument, tally.cards)} of cards)`);
console.log(`  markers that consume a number silently     ${n(tally.silentMarkers)}`);

const table = (title, map) => {
  if (map.size === 0) { console.log(`\n  ${title}: none.`); return; }
  console.log(`\n  ${title}, by document:`);
  for (const [url, count] of [...map.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(n(count)).padStart(7)}  ${shorten(url)}`);
  }
};
table('Cards citing a document with no button', absentByDocument);
table('Unpointed buttons', unpointedByDocument);
console.log('');
