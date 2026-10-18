// P6-3 (S13, 2026-10-10): numbered inline citations need a per-occurrence
// citation object, not just the whole-page chip that `resolveRefs` returns.
//
// `cite(key)` is that object: `{ key, page, url, label }`.
//   • `page` — the plain page URL, WITH any section anchor. This is the
//     dedupe identity: two keys quoting different sentences in the same
//     document share one visible [N] (MeningoVax's owner decision,
//     2026-07-24 — the number identifies the source document, while the
//     link and hover text stay specific to the sentence).
//   • `url`  — deep-links to the quoted sentence via `#:~:text=`, so the
//     browser scrolls to it. Falls back to the page URL when the ref has no
//     `quote` yet (17 of PneumoVax's 18 refs; S8/P2-8 fills the rest in).
//   • `label` — the quoted sentence when there is one, else the ref's full
//     title. This is the hover text, because #:~:text= does not visibly
//     scroll in every browser (MeningoVax owner decision, 2026-07-23).
//
// ⚠ The second test here is the one that matters most in PneumoVax, and it
// is NOT hypothetical. `cdcChildPneumo` and `cdcAdultPneumo` — the two most
// cited refs in the app — both carry a `#note-pneumo` section anchor. Naive
// concatenation produces ".../adult-notes.html#note-pneumo#:~:text=...":
// TWO fragments in one URL, which no browser honours, so the superscript
// silently stops scrolling to the sentence it cites. MeningoVax hit exactly
// this (its 2026-09-17 fix) on the one ref that had a section anchor; here
// the anchored refs are the common case, not the exception.
import { describe, it, expect } from 'vitest';
import { REFS, cite, highlightUrl } from '../refs.js';

describe('P6-3 — cite() builds a per-occurrence citation object', () => {
  it('returns key, page, url and label', () => {
    const c = cite('cdcAdultPneumo');
    expect(c.key).toBe('cdcAdultPneumo');
    expect(c.page).toBe(REFS.cdcAdultPneumo.url);
    expect(typeof c.url).toBe('string');
    expect(typeof c.label).toBe('string');
  });

  it('every quoted ref builds a link with exactly one "#" fragment', () => {
    const broken = Object.keys(REFS)
      .filter((k) => REFS[k].quote)
      .map((k) => ({ k, url: cite(k).url }))
      .filter(({ url }) => (url.match(/#/g) || []).length !== 1);
    expect(
      broken,
      'These citation links have the wrong number of "#" fragments, so the '
      + 'browser will not scroll to the quoted sentence: '
      + broken.map((b) => `${b.k} -> ${b.url}`).join(', '),
    ).toEqual([]);
  });

  // C8, document 2's CITEs (2026-10-17): narrowed by DOCUMENT TYPE, not
  // relaxed. The hazard is unchanged — a reader who clicks a number must land
  // on the sentence, not the top of a long document — but a PDF cannot honour
  // an HTML text fragment, so the two kinds deep-link differently and each is
  // now asserted. Before this the rule was written as "every quoted ref gets
  // #:~:text=", which was the same thing only while every quoted ref was a
  // web page.
  it('a quoted HTML ref deep-links to its sentence via #:~:text=', () => {
    const quoted = Object.keys(REFS).filter((k) => REFS[k].quote && !REFS[k].url.endsWith('.pdf'));
    expect(quoted.length, 'expected at least one quoted HTML ref').toBeGreaterThan(0);
    for (const k of quoted) {
      expect(cite(k).url, `${k} should deep-link to its quote`).toMatch(/#:~:text=/);
      expect(cite(k).label, `${k}'s hover text should be the quote`).toBe(REFS[k].quote);
    }
  });

  it('a quoted PDF ref deep-links to its PAGE, because text fragments do not work in a PDF', () => {
    const quoted = Object.keys(REFS).filter((k) => REFS[k].quote && REFS[k].url.endsWith('.pdf'));
    expect(quoted.length, 'expected at least one quoted PDF ref').toBeGreaterThan(0);
    for (const k of quoted) {
      expect(cite(k).url, `${k} should deep-link to its page`).toMatch(/#page=\d+$/);
      expect(cite(k).url, `${k} must not carry a dead text fragment`).not.toMatch(/#:~:text=/);
      expect(cite(k).label, `${k}'s hover text should be the quote`).toBe(REFS[k].quote);
    }
  });

  // The hole the rule above would otherwise leave. A quoted PDF with no
  // `pdfPage` falls through to a `#:~:text=` that no PDF viewer honours: a
  // link that looks live and silently does nothing. It also loses the page
  // number, which for the Adult Timing Job Aid IS part of the citation — the
  // document prints a different interval for a different patient on each of
  // its four pages.
  it('a quoted PDF ref must declare pdfPage', () => {
    const missing = Object.keys(REFS)
      .filter((k) => REFS[k].quote && REFS[k].url.endsWith('.pdf') && REFS[k].pdfPage == null);
    expect(
      missing,
      'these quoted PDF refs have no `pdfPage`, so their deep link is dead: '
      + missing.join(', '),
    ).toEqual([]);
  });

  it('pdfPage is only meaningful on a quoted ref, and must name a real page', () => {
    for (const [k, ref] of Object.entries(REFS)) {
      if (ref.pdfPage == null) continue;
      expect(ref.quote, `${k} declares pdfPage but has no quote`).toBeTruthy();
      expect(ref.url.endsWith('.pdf'), `${k} declares pdfPage but is not a PDF`).toBe(true);
      expect(Number.isInteger(ref.pdfPage), `${k}'s pdfPage should be an integer`).toBe(true);
      expect(ref.pdfPage, `${k}'s pdfPage should be 1 or more`).toBeGreaterThanOrEqual(1);
    }
  });

  it('an unquoted ref falls back to the page URL and the full title', () => {
    // mmwr7137a3 has no `quote` (S8/P2-8 owns the full sweep). Until then the
    // superscript must still link somewhere useful rather than to `undefined`.
    expect(REFS.mmwr7137a3.quote).toBeUndefined();
    const c = cite('mmwr7137a3');
    expect(c.url).toBe(REFS.mmwr7137a3.url);
    expect(c.label).toBe(REFS.mmwr7137a3.label);
  });

  // highlightUrl is tested directly, with synthetic inputs, so the
  // anchor-stripping rule is pinned unconditionally — it must not depend on
  // which refs happen to carry a `quote` today. The two most-cited refs in
  // this app (`cdcChildPneumo`, `cdcAdultPneumo`) both end in `#note-pneumo`,
  // so this is the common case here, not an edge case.
  it('highlightUrl replaces an existing section anchor instead of appending', () => {
    const anchored = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo';
    const out = highlightUrl(anchored, 'a quoted sentence');
    expect((out.match(/#/g) || []).length).toBe(1);
    expect(out).not.toContain('note-pneumo');
    expect(out).toBe(
      'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html'
      + `#:~:text=${encodeURIComponent('a quoted sentence')}`,
    );
  });

  it('highlightUrl returns the URL untouched when there is no quote', () => {
    const anchored = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html#note-pneumo';
    expect(highlightUrl(anchored, undefined)).toBe(anchored);
    expect(highlightUrl(anchored, '')).toBe(anchored);
  });

  it('cite() keeps the section anchor on `page`, which is the dedupe identity', () => {
    // The chip and the dedupe key keep the anchor so the reader lands in the
    // right section of a long notes page; only the quote link drops it.
    expect(REFS.cdcAdultPneumo.url).toMatch(/#note-pneumo$/);
    expect(cite('cdcAdultPneumo').page).toMatch(/#note-pneumo$/);
  });

  it('an unknown key does not throw', () => {
    expect(() => cite('noSuchRef')).not.toThrow();
    expect(cite('noSuchRef').url).toBeUndefined();
  });
});
