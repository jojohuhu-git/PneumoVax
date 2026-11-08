// 2026-11-07 — a CDC schedule-notes quote links to the SECTION that holds it.
//
// WHAT WAS WRONG. CDC's child and adult schedule-notes pages keep their
// pneumococcal text inside closed sections ("accordions": click to open).
// The app linked each quoted sentence with a `#:~:text=` fragment, which asks
// the browser to scroll to those words — but a browser will not open a closed
// section to find them, so the reader landed at the TOP of a 15,000-pixel page.
// The owner confirmed it in her own browser on 2026-11-01.
//
// WHAT FIXED IT. CDC's own page script (`testDeepLinks` in
// TemplatePackage/5.0/js/app.min.js, read 2026-11-07) opens a closed section
// when the address ends in `#<that section's id>`, then scrolls to it. The
// owner clicked two test links in her own browser on 2026-11-07:
//   .../child-adolescent-notes.html#accordion-panel-pneumo-situations
//   .../child-adolescent-notes.html#accordion-panel-pneumo-situations:~:text=Received%20PCV13...
// "both open to 'special situations'" — and the second did NOT highlight the
// sentence. So the link names the section only: a link that looks as if it
// highlights a sentence and silently does not is the dead-anchor fault this
// file family exists to stop. The quote itself is still on the card, in the
// pop-up over the number, so the reader still sees the exact words.
//
// THE MAP BELOW WAS MEASURED, not inferred: each quote was searched for on the
// live page on 2026-11-07, all 44 CDC web-page quotes were found word for word,
// and the closed section around each was recorded. A quote that moves to
// another section on CDC's page needs this map AND its `section` changed —
// which is why the map is written out here and not imported.
//
// FOUR adult sentences are printed word for word in BOTH the routine (50+)
// and the Special situations (19-49) section. One is shown only to 19-49
// patients (`adultPcv15NeedsPpsvCompletion`); the other three were split into
// a 50+ key and a `...1949` key, so the link opens the section whose heading
// describes the patient — a 55-year-old is not sent to the 19-49 list.
//
// NOT covered, deliberately:
//   • `pedsMinAge` — "(minimum age: …)" is printed above the sections, in no
//     closed section, so there is nothing to open; it keeps its text fragment.
//   • CDC's risk-indications, catch-up and timing pages — their quotes are not
//     inside closed sections. Whether their text fragments scroll in her
//     browser is not yet checked; they are unchanged.
import { describe, it, expect } from 'vitest';
import { REFS, cite, highlightUrl } from '../refs.js';

const CHILD = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html';
const ADULT = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html';
const ROUTINE = 'accordion-panel-pneumo-routine';
const CATCHUP = 'accordion-panel-pneumo-catchup';
const SITUATIONS = 'accordion-panel-pneumo-situations';

// key -> the closed section CDC prints its quote in (measured 2026-11-07).
const SECTION_OF = {
  // adult notes
  adultRoutine50: ROUTINE,
  adultPpsvOnly: ROUTINE,
  adultBothNotAt65: ROUTINE,
  adultBothAt65: ROUTINE,
  cdcAdultRiskFactorList: SITUATIONS,
  adultPcv15ThenPpsv: ROUTINE,          // printed in BOTH sections; this key is the 50+ copy
  adultPcv15ThenPpsv1949: SITUATIONS,  // ...and this one the 19-49 copy
  adultPcv15NeedsPpsvCompletion: SITUATIONS,
  adultPcv13Only: ROUTINE,          // printed in BOTH sections; this key is the 50+ copy
  adultPcv13Only1949: SITUATIONS,  // ...and this one the 19-49 copy
  adultPpsvOnly1949: SITUATIONS,
  adultIc1949BothPcv13Ppsv: SITUATIONS,
  adultChronicOnlyReviewAt50: SITUATIONS,
  adultPcv20or21Complete: SITUATIONS,
  adultPcv7Only: ROUTINE,          // printed in BOTH sections; this key is the 50+ copy
  adultPcv7Only1949: SITUATIONS,  // ...and this one the 19-49 copy
  adultPpsv23Unavailable: SITUATIONS,
  // child notes
  pedsRoutine4Dose: ROUTINE,
  pedsHealthyCatchup: CATCHUP,
  pedsNoPcv20IfComplete: CATCHUP,
  cdcChildSpecialSituations: SITUATIONS,
  pedsIc6to18NoPcv: SITUATIONS,
  pedsRisk6to18NoPcv: SITUATIONS,
  pedsRiskPcv20Complete: SITUATIONS,
  pedsRiskPcv20CompleteAt2: SITUATIONS, // same words as the line above; CDC prints them under both age bands, both in this section
  pedsIcPcv20Complete: SITUATIONS,
  pedsRiskPcv13At6: SITUATIONS,
  pedsIcPcv13AndPpsvAt6: SITUATIONS,
  pedsRiskDone: SITUATIONS,
  pedsRiskIncompleteCatchup: SITUATIONS,
  pedsIcPcv20orPpsv23: SITUATIONS,
  pedsRiskPcv20orPpsv23: SITUATIONS,
  pedsRiskBefore6NoPcv20At6to18: SITUATIONS,
  pedsIcBefore6NoPcv20At6to18: SITUATIONS,
};

// Notes-page quotes printed outside every closed section (see header).
const OUTSIDE_ANY_SECTION = ['pedsMinAge'];

const page = (url) => url.split('#')[0];
const onNotesPage = (k) => REFS[k].quote && [CHILD, ADULT].includes(page(REFS[k].url));

describe('2026-11-07 — CDC notes quotes open the section that holds them', () => {
  it('the map covers every quoted notes-page entry, and only those', () => {
    const quoted = Object.keys(REFS).filter(onNotesPage).sort();
    const mapped = [...Object.keys(SECTION_OF), ...OUTSIDE_ANY_SECTION].sort();
    expect(quoted).toEqual(mapped);
    // 31 + 1 when measured, then three sentences printed in BOTH adult
    // sections were split into a 50+ and a 19-49 key: 34. A new quote on
    // these pages must be placed by hand.
    expect(Object.keys(SECTION_OF)).toHaveLength(34);
  });

  it.each(Object.entries(SECTION_OF))('%s declares section %s', (k, section) => {
    expect(REFS[k].section).toBe(section);
  });

  it.each(Object.entries(SECTION_OF))('%s links to page#section, with no text fragment', (k, section) => {
    const c = cite(k);
    expect(c.url).toBe(`${page(REFS[k].url)}#${section}`);
    expect(c.url).not.toContain(':~:text=');
    // The dedupe identity is unchanged, so numbering does not move.
    expect(c.page).toBe(REFS[k].url);
    // The quote still travels with the citation, for the pop-up.
    expect(c.quote).toBe(REFS[k].quote);
  });

  it('a quote printed outside every section keeps its text fragment', () => {
    for (const k of OUTSIDE_ANY_SECTION) {
      expect(REFS[k].section, k).toBeUndefined();
      expect(cite(k).url, k).toContain('#:~:text=');
    }
  });

  it('no entry off the two notes pages declares a section', () => {
    const stray = Object.keys(REFS).filter((k) => REFS[k].section && !onNotesPage(k));
    expect(stray).toEqual([]);
  });

  it('highlightUrl: a section wins over the quote and replaces any anchor', () => {
    expect(highlightUrl(`${CHILD}#note-pneumo`, 'a quoted sentence', undefined, SITUATIONS))
      .toBe(`${CHILD}#${SITUATIONS}`);
    // Without a section, behaviour is unchanged.
    expect(highlightUrl(`${CHILD}#note-pneumo`, 'a quoted sentence'))
      .toBe(`${CHILD}#:~:text=${encodeURIComponent('a quoted sentence')}`);
  });
});
