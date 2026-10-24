// C8, document 1's CITEs (2026-10-17) — mm7401a1 now quotes itself.
//
// WHAT THIS IS THE OTHER HALF OF. `CLAUDE.md`: "Each (document, statement)
// pair gets exactly one of two outcomes, never a third — cite it, or take it
// off that card" (OWNER DECISION 2026-10-17). Document 1's REMOVALS landed in
// `1ec86c6` — mm7401a1 came off the 5,331 cards it does not speak for, and
// kept the 2,544 where it does. This does the citing for those 2,544.
//
// ── MEASURED on this branch, 17,334 grid cards ────────────────────────────
//
//   cards LISTING mm7401a1                                      2,564
//   of those, already credited (`adultPcv15ThenPpsvShort`)         20
//   uncredited before this change                               2,544
//   uncredited after                                               45
//   cards that gain an mm7401a1 citation                        2,499
//
// No clinical sentence changes. The only edit to a card's words is the raised
// marker itself; the advice, products, intervals and dates are untouched, and
// a test below asserts that marker-for-marker.
//
// ── THE SOURCE, read by me rather than copied forward ─────────────────────
//
// https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm, fetched live
// 2026-10-17 through the browser pane (cdc.gov serves curl a shell, not the
// body). Kobayashi M, Leidner AJ, Gierke R, et al. MMWR 2025;74:1–8. The
// quotes below come from its TABLE, "Clinical guidance for implementing
// pneumococcal vaccine recommendations for adults aged ≥19 years — United
// States, October 2024", except `mmwrPcv13NoPpsv23ToComplete`, which is body
// prose from the section "PPSV23 Use in PCV13-Experienced Adults Who Have Not
// Completed the Recommended Vaccination Series".
//
// ── THE TRAP THIS DOCUMENT SETS: THREE BLOCKS, NEARLY IDENTICAL ROWS ──────
//
// The table has three blocks — ≥50, 19–49 immunocompromising/CSF/cochlear,
// and 19–49 chronic — and each carries a row for the SAME vaccination
// history. The rows are not the same sentence:
//
//   "None or PCV7 only"   ≥50 and 19–49 chronic say PPSV23 at ≥1 YEAR after
//                         PCV15; 19–49 IC says ≥8 WEEKS. (This is S15, and
//                         `adultPcv15ThenPpsvShort` is already the 8-week
//                         half — note [7] of the measurement, the one card
//                         shape that was ALREADY crediting mm7401a1.)
//
//   "PCV13 only"          ≥50 and 19–49 chronic read "A single dose of PCV21
//                         or PCV20 ≥1 year after the PCV13 dose"; 19–49 IC
//                         inserts the word "administered". One word apart,
//                         three rows.
//
//   "PCV13 + PPSV23"      the 19–49 IC block splits again on the NUMBER of
//                         PPSV23 doses — 1 dose gets "≥5 years … the series
//                         is complete", 2 doses gets "reviewed again … at age
//                         50 years. Alternatively, … ≥5 years". The 19–49
//                         CHRONIC block has no 2-dose row at all.
//
// That last split is why this file counts EFFECTIVE PPSV23 doses rather than
// recorded ones, and why 45 cards are left uncredited below. It is not
// visible to `population`, which records a patient's age band and cannot see
// a dose count.
//
// ── THE LAST 45, SETTLED 2026-10-18 (OWNER DECISION) ─────────────────────
//
// A 19–49 adult with CHRONIC conditions only, PCV13 and TWO effective PPSV23
// doses. The app says "no dose now, re-evaluate at 50". mm7401a1's chronic
// block has only one row for a PCV13 + PPSV23 history — "PCV13 and 1 dose of
// PPSV23" — and prints no second-dose row, so this file originally left the
// 45 cards uncredited and took the question to the owner.
//
// Her ruling, verbatim: *"for chronic condition with PCV13 and 2 doses of
// PPSV23 I would use the citation covering PCV13 and 1 dose of PPSV23 in
// patients 19-49 with chronic conditions: The pneumococcal vaccination
// recommendations should be reviewed again when the person reaches age 50
// years."*
//
// The clinical reason the count does not change the row: in the CHRONIC block
// a second PPSV23 is never offered at all. ACIP offers one only inside the
// immunocompromising block ("When a second PPSV23 dose is used instead of
// PCV21 or PCV20…", mm7336a2's own wording of the same row). The chronic
// 1-dose row offers nothing but the review at 50, so there is no second-dose
// disposition for a second dose to land on — the row is the block's answer to
// "PCV13 and PPSV23", and a third dose on record cannot move it.
//
// ⚠ THE IC BLOCK STILL SPLITS ON THE COUNT AND MUST KEEP SPLITTING. There,
// one dose and two doses get materially different sentences ("the series is
// complete" versus "reviewed again … Alternatively, … ≥5 years"). This
// decision collapses the chronic side's *cite-or-nothing*, NOT that split.
//
// ── WHY NOTHING EXISTING COULD CATCH THIS ─────────────────────────────────
//
// Both verdict corpora record a card's status, brands and dates and never its
// citations, so all 33,660 swept patients stay green while a card credits the
// wrong document, or no document, for what it says out loud.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { REFS, cite } from '../../data/refs.js';
import { buildCases } from '../../test-grid.js';
import { noteCiteSlices } from '../../components/citations.jsx';
import { ROUTINE_ADULT_MIN_M } from '../scheduleConstants.js';

const TODAY = '2026-10-11';
const MMWR_URL = 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7401a1.htm';

const run = (input) => recommend({ today: TODAY, riskIds: [], pcvDoses: [], ppsv23Doses: [], ...input });

const noteText = (rec) => (typeof rec.note === 'string'
  ? rec.note
  : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' '));

const findByNote = (result, needle) =>
  (result.recs ?? []).find((r) => noteText(r).startsWith(needle));

const citeKeys = (rec) => (rec.noteCites ?? []).map((c) => c.key);
const buttonUrls = (rec) => (rec.citations ?? []).map((c) => c.url);
const effectivePpsv = (result) =>
  (result.perDose?.ppsv23 ?? []).filter((d) => d.effectiveDoseNum != null).length;

// Every document a raised number on this card points at — the same
// computation `scripts/uncreditedSources.mjs` and the screen itself perform.
const creditedUrls = (rec) => {
  const slices = noteCiteSlices(rec.note, rec.noteCites);
  return new Set([...slices.lead, ...slices.detail].map((c) => c.page));
};

// ── The seven quotes, exactly as mm7401a1 reads ──────────────────────────
// Kept here as literals so the test states the source independently of
// refs.js: if someone edits a quote, this file is the second opinion.
const QUOTES = {
  mmwrBothPcv13Ppsv50plus:
    'A single dose of PCV21 or PCV20 ≥5 years after the last pneumococcal vaccine dose.',
  mmwrIc1949OnePpsv:
    'A single dose of PCV21 or PCV20 ≥5 years after the last pneumococcal vaccine dose. The pneumococcal vaccination series is complete, and it need not be followed by additional pneumococcal vaccine doses.',
  // Extended 2026-10-18 to the whole row — see
  // regression-c8-2026-10-18-ic-two-ppsv-follows-acip-order.test.js.
  mmwrIc1949TwoPpsv:
    'The pneumococcal vaccination recommendations should be reviewed again when the person turns age 50 years. Alternatively, a single dose of either PCV21 or PCV20 should be administered ≥5 years after the last pneumococcal vaccine dose. If PCV21 or PCV20 is used, the series is complete, and it need not be followed by additional pneumococcal vaccine doses.',
  mmwrPcv13NoPpsv23ToComplete:
    'Among adults aged ≥19 years who have started their pneumococcal vaccination series with PCV13 but have not received all recommended doses, PPSV23 is no longer recommended as an option to complete the series. Either PCV20 or PCV21 is recommended to complete the series as previously recommended.',
  mmwrChronic1949ReviewAt50:
    'The pneumococcal vaccination recommendations should be reviewed again when the person reaches age 50 years.',
  mmwrRiskBased1949Unchanged:
    'The risk-based recommendation for adults aged 19–49 years is unchanged.',
  mmwrNoneOrPcv7Only:
    'A single dose of PCV21, PCV20, or PCV15. If PCV15 is administered, a single dose of PPSV23* should be administered ≥1 year after the PCV15 dose.',
};

const POPULATION_OF = {
  mmwrBothPcv13Ppsv50plus: ['adult-50plus'],
  mmwrIc1949OnePpsv: ['adult-19to49'],
  mmwrIc1949TwoPpsv: ['adult-19to49'],
  mmwrPcv13NoPpsv23ToComplete: ['adult-19to49', 'adult-50plus'],
  mmwrChronic1949ReviewAt50: ['adult-19to49'],
  mmwrRiskBased1949Unchanged: ['adult-19to49'],
  mmwrNoneOrPcv7Only: ['adult-19to49', 'adult-50plus'],
};

describe('the seven new entries are mm7401a1, quoted faithfully', () => {
  it('all seven exist, quote mm7401a1, and name the patient they are about', () => {
    for (const [key, quote] of Object.entries(QUOTES)) {
      const ref = REFS[key];
      expect(ref, `${key} should exist`).toBeDefined();
      expect(ref.url, key).toBe(MMWR_URL);
      expect(ref.quote, `${key}'s quote must be the document's own words`).toBe(quote);
      expect(ref.rulebook, key).toBe('adult');
      expect(ref.short, key).toBe('ACIP 2025 Adult MMWR');
      expect(ref.population, key).toEqual(POPULATION_OF[key]);
      expect(ref.lastVerified, key).toBe('2026-10-17');
    }
  });

  it('is an HTML page, so each deep-links by text fragment and never by #page=', () => {
    // The mirror image of document 2's rule. A PDF honours #page= and ignores
    // a text fragment; an HTML page is the other way round. Citing this one
    // with a pdfPage would produce a link that silently lands at the top.
    for (const key of Object.keys(QUOTES)) {
      expect(REFS[key].pdfPage, `${key} is HTML and must not carry a pdfPage`).toBeUndefined();
      expect(cite(key).url, key).toContain('#:~:text=');
    }
  });

  it('the three near-identical table rows stay distinguishable', () => {
    // The >=50 and 19-49 IC "PCV13 + PPSV23" rows open with the same sentence.
    // The IC entry carries the row's second sentence too, so a clinician
    // hovering can tell which patient the row was written about.
    expect(QUOTES.mmwrIc1949OnePpsv.startsWith(QUOTES.mmwrBothPcv13Ppsv50plus)).toBe(true);
    expect(QUOTES.mmwrIc1949OnePpsv).not.toBe(QUOTES.mmwrBothPcv13Ppsv50plus);
    // And the 8-week half of the "None or PCV7 only" row is a DIFFERENT entry
    // that already existed (S15). These two must never collapse into one.
    expect(REFS.adultPcv15ThenPpsvShort.quote).toContain('≥8 weeks');
    expect(QUOTES.mmwrNoneOrPcv7Only).toContain('≥1 year');
  });
});

describe('each card credits the row that was written about its own patient', () => {
  const IC_19_49 = { ageMonths: 228, dob: '2007-10-11', riskIds: ['asplenia'] };
  const CHRONIC_19_49 = { ageMonths: 228, dob: '2007-10-11', riskIds: ['chronic_heart'] };
  const AT_50 = { ageMonths: 600, dob: '1976-10-11' };
  const PCV13 = [{ product: 'PCV13', date: '2016-10-13' }];
  const ONE_PPSV = [{ product: 'PPSV23', date: '2021-10-11' }];
  // Two EFFECTIVE PPSV23 doses: the PCV13 pair is late enough that both
  // polysaccharide doses clear their intervals.
  const TWO_PCV13 = [{ product: 'PCV13', date: '2021-10-12' }, { product: 'PCV13', date: '2021-11-09' }];
  const TWO_PPSV = [{ product: 'PPSV23', date: '2016-10-13' }, { product: 'PPSV23', date: '2021-10-11' }];

  it('S1 · 50+ with PCV13 + PPSV23 quotes the >=50 row', () => {
    const r = run({ ...AT_50, pcvDoses: PCV13, ppsv23Doses: ONE_PPSV });
    const card = findByNote(r, 'PCV13 and PPSV23 already given');
    expect(card).toBeDefined();
    expect(citeKeys(card)).toContain('mmwrBothPcv13Ppsv50plus');
    expect(creditedUrls(card).has(MMWR_URL)).toBe(true);
  });

  it('S1 · 19-49 immunocompromised with ONE PPSV23 quotes the 1-dose row', () => {
    const r = run({ ...IC_19_49, pcvDoses: PCV13, ppsv23Doses: ONE_PPSV });
    expect(effectivePpsv(r)).toBe(1);
    const card = findByNote(r, 'PCV13 and PPSV23 already given');
    expect(citeKeys(card)).toContain('mmwrIc1949OnePpsv');
    expect(citeKeys(card)).not.toContain('mmwrIc1949TwoPpsv');
  });

  // 2026-10-18: this card's lead changed to ACIP's order, so it no longer
  // opens with "PCV13 and PPSV23 already given". The citation assertion is
  // unchanged -- which row it quotes is still the point.
  it('S1 · 19-49 immunocompromised with TWO PPSV23 quotes the 2-dose row', () => {
    const r = run({ ...IC_19_49, pcvDoses: TWO_PCV13, ppsv23Doses: TWO_PPSV });
    expect(effectivePpsv(r)).toBe(2);
    const card = findByNote(r, 'Review the pneumococcal recommendations again at age 50');
    expect(card).toBeDefined();
    expect(citeKeys(card)).toContain('mmwrIc1949TwoPpsv');
    expect(citeKeys(card)).not.toContain('mmwrIc1949OnePpsv');
  });

  it('S2 · PCV13 only credits the body prose that retires PPSV23 as a completer', () => {
    for (const who of [IC_19_49, AT_50]) {
      const r = run({ ...who, pcvDoses: PCV13 });
      const card = findByNote(r, 'PCV13 was given previously');
      expect(card, JSON.stringify(who)).toBeDefined();
      expect(citeKeys(card)).toContain('mmwrPcv13NoPpsv23ToComplete');
    }
  });

  it('S3 · 19-49 chronic with ONE PPSV23 quotes the chronic review-at-50 row', () => {
    const r = run({ ...CHRONIC_19_49, pcvDoses: PCV13, ppsv23Doses: ONE_PPSV });
    expect(effectivePpsv(r)).toBe(1);
    const card = findByNote(r, 'No additional pneumococcal dose now');
    expect(citeKeys(card)).toContain('mmwrChronic1949ReviewAt50');
  });

  // OWNER DECISION 2026-10-18. Was the opposite assertion until that date:
  // "credits NOTHING — ACIP has no such row". See the header for her ruling
  // and the clinical reason the dose count does not change the chronic row.
  it('S3 · 19-49 chronic with TWO PPSV23 quotes the SAME chronic review-at-50 row', () => {
    const r = run({ ...CHRONIC_19_49, pcvDoses: TWO_PCV13, ppsv23Doses: TWO_PPSV });
    expect(effectivePpsv(r)).toBe(2);
    const card = findByNote(r, 'No additional pneumococcal dose now');
    expect(citeKeys(card)).toContain('mmwrChronic1949ReviewAt50');
    expect(buttonUrls(card)).toContain(MMWR_URL);
    // The button now has a raised number behind it — the G1 promise.
    expect(creditedUrls(card).has(MMWR_URL)).toBe(true);
  });

  it('S3 · the chronic row is cited for ONE and TWO doses with the identical key', () => {
    const one = run({ ...CHRONIC_19_49, pcvDoses: PCV13, ppsv23Doses: ONE_PPSV });
    const two = run({ ...CHRONIC_19_49, pcvDoses: TWO_PCV13, ppsv23Doses: TWO_PPSV });
    const keys = (r) => citeKeys(findByNote(r, 'No additional pneumococcal dose now'));
    expect(keys(one)).toEqual(keys(two));
  });

  // The guard on the half the owner's ruling does NOT touch. If someone
  // "simplifies" the chronic collapse into the immunocompromising branch too,
  // the IC block's two different sentences become one and this fails.
  it('S3 · the IC block still answers one dose and two doses differently', () => {
    const one = run({ ...IC_19_49, pcvDoses: PCV13, ppsv23Doses: ONE_PPSV });
    const two = run({ ...IC_19_49, pcvDoses: TWO_PCV13, ppsv23Doses: TWO_PPSV });
    // The two cards now differ in their lead sentence as well as their quote
    // (2026-10-18), so each is found by its own opening.
    const keyIn = (r, lead) => citeKeys(findByNote(r, lead)).find((k) => k.startsWith('mmwrIc1949'));
    expect(keyIn(one, 'PCV13 and PPSV23 already given')).toBe('mmwrIc1949OnePpsv');
    expect(keyIn(two, 'Review the pneumococcal recommendations again at age 50')).toBe('mmwrIc1949TwoPpsv');
    expect(REFS.mmwrIc1949OnePpsv.quote).not.toBe(REFS.mmwrIc1949TwoPpsv.quote);
  });

  it('S4 · the 19-49 no-risk card credits the sentence about 19-49 adults', () => {
    const r = run({ ageMonths: 228, dob: '2007-10-11' });
    const card = findByNote(r, 'Routine pneumococcal vaccination begins at age 50');
    expect(citeKeys(card)).toContain('mmwrRiskBased1949Unchanged');
  });

  it('S5 · 50+ with no history quotes the >=50 "None or PCV7 only" row', () => {
    const r = run({ ...AT_50 });
    const card = findByNote(r, 'Give 1 dose of PCV20 or PCV21');
    expect(citeKeys(card)).toContain('mmwrNoneOrPcv7Only');
  });

  it('S8 · 19-49 chronic with no history quotes the same row, which ACIP prints for both', () => {
    const r = run({ ...CHRONIC_19_49 });
    const card = findByNote(r, 'Give 1 dose of PCV15, PCV20, or PCV21');
    expect(noteText(card)).toContain('≥1 year');
    expect(citeKeys(card)).toContain('mmwrNoneOrPcv7Only');
  });

  it('S7 · 19-49 immunocompromised with no history keeps the 8-WEEK row, not the year', () => {
    // The pre-existing credit, and the trap: one code site, two intervals.
    const r = run({ ...IC_19_49 });
    const card = findByNote(r, 'Give 1 dose of PCV15, PCV20, or PCV21');
    expect(noteText(card)).toContain('≥8 weeks');
    expect(citeKeys(card)).toContain('adultPcv15ThenPpsvShort');
    expect(citeKeys(card)).not.toContain('mmwrNoneOrPcv7Only');
  });
});

describe('over the whole grid', () => {
  // One pass, reused by every assertion below.
  const stats = (() => {
    let listing = 0;
    let uncredited = 0;
    const uncreditedNotes = new Map();
    for (const c of buildCases()) {
      let r;
      try { r = recommend(c.input); } catch { continue; }
      if (r.excluded) continue;
      for (const rec of r.recs ?? []) {
        if (!buttonUrls(rec).includes(MMWR_URL)) continue;
        listing++;
        if (creditedUrls(rec).has(MMWR_URL)) continue;
        uncredited++;
        const k = noteText(rec).replace(/\d{4}-\d{2}-\d{2}/g, '<date>');
        uncreditedNotes.set(k, (uncreditedNotes.get(k) ?? 0) + 1);
      }
    }
    return { listing, uncredited, uncreditedNotes };
  })();

  // Was `uncredited === 45` until the owner's 2026-10-18 ruling retired the
  // last one. mm7401a1 is now the first of the app's six documents to reach
  // zero: every card that lists it has a raised number pointing at it.
  it('every card listing mm7401a1 credits it — zero exceptions', () => {
    // 2,564 after document 1's removals; + 1,594 restored by FINDING F on
    // 2026-10-18 (1,154 "PPSV23 only" + 440 shared-decision), each of which
    // arrived with its own cite, so the zero below is unaffected.
    // 2026-10-24, RULING F: the 363 patients whose early PCV20 now counts
    // read "Complete (history includes PCV20)" instead of a dose-due card.
    // All 363 are at 50+. They split by the mm7401a1 row their OLD card
    // used: 253 from the flat ">=5 years after the last pneumococcal dose"
    // row, and 110 from the shared-clinical-decision row at >=65, which
    // already carried a job-aid button. Measured with scripts/proseDiff.mjs
    // over both grids; see CLINICAL_SPEC.md section K, Ruling F.
    expect(stats.listing).toBe(2564 + 1154 + 440 - 363 + 77);
    expect(stats.uncredited).toBe(0);
    expect([...stats.uncreditedNotes.keys()]).toEqual([]);
  });

  // The 45 are the cards the ruling was about, so they are counted by name
  // rather than left to the aggregate above: a future change that credits
  // 2,564 cards by crediting the wrong row would still pass that one.
  it('the chronic review-at-50 card credits mm7401a1 at one dose and at two', () => {
    const seen = { one: 0, two: 0 };
    for (const c of buildCases()) {
      let r;
      try { r = recommend(c.input); } catch { continue; }
      if (r.excluded) continue;
      for (const rec of r.recs ?? []) {
        if (!noteText(rec).startsWith('No additional pneumococcal dose now')) continue;
        expect(citeKeys(rec)).toContain('mmwrChronic1949ReviewAt50');
        expect(creditedUrls(rec).has(MMWR_URL)).toBe(true);
        const n = (r.perDose?.ppsv23 ?? []).filter((d) => d.effectiveDoseNum != null).length;
        if (n === 1) seen.one++; else if (n === 2) seen.two++;
      }
    }
    expect(seen).toEqual({ one: 165, two: 45 });
  });

  it('no card shows a quote at an age band it was not written about', () => {
    // `population` is already enforced engine-wide by the 2026-10-17 guard;
    // this asserts it for the seven new entries specifically, so a widened
    // population cannot make a wrong quote legal here unnoticed.
    const NEW = new Set(Object.keys(QUOTES));
    for (const c of buildCases()) {
      let r;
      try { r = recommend(c.input); } catch { continue; }
      if (r.excluded) continue;
      const band = c.input.ageMonths >= ROUTINE_ADULT_MIN_M ? 'adult-50plus' : 'adult-19to49';
      for (const rec of r.recs ?? []) {
        for (const k of citeKeys(rec)) {
          if (!NEW.has(k)) continue;
          expect(
            REFS[k].population,
            `${k} shown to ${band} at ageMonths=${c.input.ageMonths}`,
          ).toContain(band);
        }
      }
    }
  });

  it('none of the seven is a declared cross-reference', () => {
    // `aboutAnotherGroup` is the sanctioned way to quote another group's rule.
    // These seven are not exceptions, and must not quietly become ones.
    for (const c of buildCases()) {
      let r;
      try { r = recommend(c.input); } catch { continue; }
      if (r.excluded) continue;
      for (const rec of r.recs ?? []) {
        for (const ct of rec.noteCites ?? []) {
          if (!QUOTES[ct.key]) continue;
          expect(ct.aboutAnotherGroup, `${ct.key} must stand on its own`).toBeUndefined();
        }
      }
    }
  });
});
