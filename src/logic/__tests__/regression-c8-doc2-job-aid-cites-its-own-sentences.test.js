// C8, document 2's CITEs (2026-10-17) — the job aid now quotes itself.
//
// WHAT THIS IS THE OTHER HALF OF. `CLAUDE.md`: "Each (document, statement)
// pair gets exactly one of two outcomes, never a third — cite it, or take it
// off that card" (OWNER DECISION 2026-10-17). The branch's earlier commits did
// the taking-off, for the statements the job aid does not state. This does the
// citing, for the ones it does.
//
// Before this, the CDC Adult Pneumococcal Vaccine Timing Job Aid was a grey
// button on 6,805 cards that no raised number pointed at — the whole of the
// owner's report, "I forget why there are multiple source chips listed if its
// only citing one of them". Eleven of its fourteen statements now carry the
// document's own sentence.
//
// ── MEASURED on this branch, 17,334 grid cards ────────────────────────────
//
//   the job aid's uncredited (statement, card) pairs   6,805 → 3,189
//   its uncredited distinct statements                    14 → 3
//   cards that gained a job-aid citation                       3,616
//
// The 3,189 that remain are the THREE statements that rest only on a table
// CELL — "≥5 years", "≥1 year", "NO OPTION B" — with no prose anywhere in the
// document stating them. Those are an open owner decision (cite the cell, or
// take the job aid off those cards) and are asserted below as still
// uncredited, so this file records where the work actually stopped rather than
// implying it finished.
//
// ── THE SOURCE, read by me rather than copied forward ─────────────────────
//
// `~/Downloads/Vaccine-Timing-Adults-JobAid.pdf`, 78,054 bytes, sha256
// 7128682e…, footer "NCIRD | March 2025", read 2026-10-17 with
// `scripts/pdfLayout.py` (positional) and cross-checked with pypdf 6.13.0.
//
// ⚠ TWO TRAPS, both hit on the way in, both of which would have put a WRONG
// quote in front of a clinician while every test in the suite stayed green:
//
//  1. THE LIGATURE. The embedded font maps the fi/fl ligature glyph to a bare
//     "f", so every extractor drops the next character: "fluid" → "fuid",
//     "specified" → "specifed", "deficiency" → "defciency". The two-letter
//     sequence "fi" occurs ZERO times in all four pages, and U+FB01/U+FB02
//     zero times — impossible for a document containing "specified
//     immunocompromising conditions". `docs/archive/c7-2026-10-17-source-
//     readings.md` recorded "fuid" as "the document's own typo"; it is not,
//     and the quotes here are written as the document READS. The duplicated
//     "leak" in "cerebrospinal fluid leak (CSF) leak" IS the document's own.
//
//  2. THE READING ORDER. pypdf reads the shared-decision sentence with the
//     row's left-hand cells ("≥5 years PCV20 or PCV21") spliced into the
//     middle of it, because they are a different column of the same row. A
//     flat dump of this document assembles quotes out of unrelated patients.
//     Positional extraction is not a preference here.
//
// ── WHY THE PAGE IS PART OF THE CITATION ──────────────────────────────────
//
// The four pages state DIFFERENT rules for different patients: p.1 "Adults ≥50
// years old", p.2 19–49 immunocompromising, p.3 19–49 cochlear implant / CSF
// leak, p.4 19–49 chronic. The same table row answers "schedule is complete"
// on p.1 and "review again at 50" on pp.2–4. So each quoted entry declares a
// `pdfPage`, and `population` is checked page by page rather than inferred.
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
import { markerCount, noteCiteSlices } from '../../components/citations.jsx';
import { ROUTINE_ADULT_MIN_M } from '../scheduleConstants.js';

const TODAY = '2026-10-11';
const JOB_AID_URL = 'https://www.cdc.gov/pneumococcal/downloads/Vaccine-Timing-Adults-JobAid.pdf';

const adult = (ageMonths, { riskIds = [], pcvDoses = [], ppsv23Doses = [], dob = null } = {}) =>
  recommend({ ageMonths, dob, today: TODAY, riskIds, pcvDoses, ppsv23Doses });

const noteText = (rec) => (typeof rec.note === 'string'
  ? rec.note
  : [rec.note?.lead, rec.note?.detail].filter(Boolean).join(' '));

const findByNote = (result, needle) =>
  (result.recs ?? []).find((r) => noteText(r).includes(needle));

const citeKeys = (rec) => (rec.noteCites ?? []).map((c) => c.key);
const buttonUrls = (rec) => (rec.citations ?? []).map((c) => c.url);

// 55y and 35y: one side of ROUTINE_ADULT_MIN_M each.
const OLDER = 660;
const YOUNGER = 420;
const SEVENTY = 840;

// ── The six quotes, exactly as the document reads ────────────────────────
// Kept here as literals so the test states the source independently of
// refs.js: if someone edits a quote, this file is the second opinion.
const QUOTES = {
  jobAidSeriesCompleteAt50: 'No vaccines recommended; schedule is complete.',
  jobAidSharedDecision65: 'Together, with the patient, vaccine providers may choose to administer PCV20 or PCV21 to adults ≥65 years old who have already received PCV13 (but not PCV15, PCV20, or PCV21) at any age and PPSV23 at or after the age of 65 years old.',
  jobAidChronic1949ReviewAt50: 'No vaccines are recommended at this time. Review pneumococcal vaccine recommendations again when your patient turns 50 years old.',
  jobAidEightWeekOptionAt50: 'Consider minimum interval (8 weeks) for adults with an immunocompromising condition, cochlear implant, or cerebrospinal fluid leak (CSF) leak',
  jobAidPcv7CountsAsNone: 'Also applies to people who received PCV7 at any age and no other pneumococcal vaccines',
  jobAidPpsv23Unavailable: 'If PPSV23 is not available, PCV20 or PCV21 may be used',
};

describe('the six new entries are the job aid, quoted faithfully', () => {
  it('all six exist, quote the job aid, and name the page they sit on', () => {
    for (const [key, quote] of Object.entries(QUOTES)) {
      const ref = REFS[key];
      expect(ref, `${key} should exist`).toBeDefined();
      expect(ref.url, key).toBe(JOB_AID_URL);
      expect(ref.quote, `${key}'s quote must be the document's own words`).toBe(quote);
      expect(ref.rulebook, key).toBe('adult');
      expect(ref.pdfPage, `${key} must name its page`).toBeGreaterThanOrEqual(1);
      expect(ref.short, key).toBe('CDC Adult Timing Job Aid');
      expect(ref.lastVerified, key).toBe('2026-10-17');
    }
  });

  it('the ligature trap is closed — no quote carries a dropped letter', () => {
    // The four words the extractors mangle. If any reappears in a quote,
    // someone has copied from a flat dump or from the C7 log.
    for (const [key, quote] of Object.entries(QUOTES)) {
      for (const bad of ['fuid', 'specifed', 'defciency', 'defciencies']) {
        expect(quote.includes(bad), `${key} contains the extraction artefact "${bad}"`).toBe(false);
      }
    }
    // And the one real duplication in the document is preserved, not tidied.
    expect(QUOTES.jobAidEightWeekOptionAt50).toContain('fluid leak (CSF) leak');
  });

  it('each deep-links to its own page, not to a dead text fragment', () => {
    for (const key of Object.keys(QUOTES)) {
      const c = cite(key);
      expect(c.url, key).toBe(`${JOB_AID_URL}#page=${REFS[key].pdfPage}`);
      expect(c.url, key).not.toContain('#:~:text=');
      expect(c.page, `${key}'s dedupe identity is the document`).toBe(JOB_AID_URL);
    }
  });

  it('the page-specific quotes are pinned to one patient group, the footnotes to both', () => {
    // This is the trap the pages themselves set: the SAME table row says
    // "schedule is complete" on p.1 and "review again at 50" on pp.2-4.
    expect(REFS.jobAidSeriesCompleteAt50.population).toEqual(['adult-50plus']);
    expect(REFS.jobAidSeriesCompleteAt50.pdfPage).toBe(1);
    expect(REFS.jobAidChronic1949ReviewAt50.population).toEqual(['adult-19to49']);
    expect(REFS.jobAidChronic1949ReviewAt50.pdfPage).toBe(4);
    expect(REFS.jobAidSharedDecision65.population).toEqual(['adult-50plus']);
    expect(REFS.jobAidEightWeekOptionAt50.population).toEqual(['adult-50plus']);
    // Footnotes * and ¶ are printed on all four pages.
    expect(REFS.jobAidPcv7CountsAsNone.population).toEqual(['adult-19to49', 'adult-50plus']);
    expect(REFS.jobAidPpsv23Unavailable.population).toEqual(['adult-19to49', 'adult-50plus']);
  });
});

describe('statements #1 and #4 — "the series is complete", cited at 50+ only', () => {
  // `diabetes` at both ages: below 50 a patient with no risk condition is
  // "not indicated" and produces no complete card, so without it the 19-49
  // side of every assertion here would pass vacuously.
  const withPcv20 = (am) => findByNote(
    adult(am, { riskIds: ['diabetes'], pcvDoses: [{ date: '2024-01-10', product: 'PCV20' }] }),
    'includes PCV20 or PCV21 is complete',
  );
  const withPcv15AndPpsv = (am) => findByNote(
    adult(am, {
      riskIds: ['diabetes'],
      pcvDoses: [{ date: '2022-01-10', product: 'PCV15' }],
      ppsv23Doses: [{ date: '2023-06-10' }],
    }),
    'PCV15 followed by PPSV23 is a complete',
  );

  it('at 50+ the card quotes page 1, which says exactly that', () => {
    for (const rec of [withPcv20(OLDER), withPcv15AndPpsv(OLDER)]) {
      expect(citeKeys(rec)).toContain('jobAidSeriesCompleteAt50');
      expect(buttonUrls(rec)).toContain(JOB_AID_URL);
    }
  });

  it('at 19-49 it neither quotes nor lists it, because pp.2-4 say something else', () => {
    for (const rec of [withPcv20(YOUNGER), withPcv15AndPpsv(YOUNGER)]) {
      expect(citeKeys(rec)).not.toContain('jobAidSeriesCompleteAt50');
      expect(buttonUrls(rec)).not.toContain(JOB_AID_URL);
    }
  });

  it('the boundary is ROUTINE_ADULT_MIN_M itself, not a number typed again', () => {
    expect(citeKeys(withPcv20(ROUTINE_ADULT_MIN_M))).toContain('jobAidSeriesCompleteAt50');
    expect(citeKeys(withPcv20(ROUTINE_ADULT_MIN_M - 1))).not.toContain('jobAidSeriesCompleteAt50');
  });
});

describe('statement #6 — shared clinical decision-making', () => {
  const rec = () => findByNote(
    adult(SEVENTY, {
      pcvDoses: [{ date: '2015-01-10', product: 'PCV13' }],
      // Dated so the dose lands at ~68, i.e. at or after 65 -- the card turns
      // on the age AT THE DOSE, not today's age (A-P0-1). A 2016 date here
      // would be age ~59 and would route to the >=5 years card instead.
      ppsv23Doses: [{ date: '2024-06-10' }],
    }),
    'is a shared clinical decision',
  );

  // FINDING F (2026-10-18) added a third number: mm7401a1's own table row for
  // this history, which had been removed from the card on the ground that the
  // paper never discusses shared decision-making. The job aid's position in
  // the list is what this test is about, so the assertion keeps naming every
  // key in order rather than loosening to "contains".
  it('the card quotes the job aid alongside the Adult Notes and ACIP', () => {
    expect(rec()).toBeDefined();
    expect(rec().status).toBe('shared-decision');
    const { lead } = noteCiteSlices(rec().note, rec().noteCites);
    expect(lead.map((c) => c.key)).toEqual([
      'adultBothAt65', 'jobAidSharedDecision65', 'mmwrSharedDecision65',
    ]);
  });

  it('the quote is the sentence about a patient of 65 or older', () => {
    const c = (rec().noteCites ?? []).find((x) => x.key === 'jobAidSharedDecision65');
    expect(c.quote).toContain('adults ≥65 years old who have already received PCV13');
    expect(c.quote).toContain('PPSV23 at or after the age of 65 years old');
  });
});

describe('statement #7 — no dose now, review at 50', () => {
  const rec = () => findByNote(
    adult(YOUNGER, {
      riskIds: ['diabetes'],
      pcvDoses: [{ date: '2015-01-10', product: 'PCV13' }],
      ppsv23Doses: [{ date: '2016-01-10' }],
    }),
    're-evaluate at age 50',
  );

  it('the lead quotes page 4, the only page whose row has no Option A', () => {
    const { lead } = noteCiteSlices(rec().note, rec().noteCites);
    expect(lead.map((c) => c.key)).toEqual([
      'adultChronicOnlyReviewAt50',
      'jobAidChronic1949ReviewAt50',
      // C8, document 1's CITE (2026-10-17), added after this file was
      // written: mm7401a1's own chronic-block row for the same history. The
      // job aid's page-4 cite is unmoved and still second — this list grew,
      // it did not change.
      'mmwrChronic1949ReviewAt50',
    ]);
  });

  it('it is page 4’s wording, with "are", not pages 2-3’s', () => {
    // pp.2-4 share the row at the top of the table and read "No vaccines
    // recommended at this time"; p.4's PCV13 + PPSV23 row reads "No vaccines
    // ARE recommended". Same meaning, different sentence — and only one of
    // them is about this patient's history.
    const c = (rec().noteCites ?? []).find((x) => x.key === 'jobAidChronic1949ReviewAt50');
    expect(c.quote.startsWith('No vaccines are recommended at this time.')).toBe(true);
    expect(REFS.jobAidChronic1949ReviewAt50.pdfPage).toBe(4);
  });

  it('a 19-49 patient with an IC condition gets the OTHER answer, uncited here', () => {
    // pp.2-3 give this history PCV20/21 at >=5 years instead, which is the
    // engine's own split. That card is one of the three cell-only statements,
    // so it must NOT have acquired a job-aid quote.
    const ic = findByNote(
      adult(YOUNGER, {
        riskIds: ['asplenia'],
        pcvDoses: [{ date: '2015-01-10', product: 'PCV13' }],
        ppsv23Doses: [{ date: '2016-01-10' }],
      }),
      'give 1 dose of PCV20 or PCV21',
    );
    expect(ic).toBeDefined();
    expect(citeKeys(ic)).not.toContain('jobAidChronic1949ReviewAt50');
  });
});

describe('statements #8, #9, #12 — the PPSV23 substitution, previously uncited anywhere', () => {
  const rec = (am, riskIds = []) => findByNote(
    adult(am, { riskIds, pcvDoses: [{ date: '2024-01-10', product: 'PCV15' }] }),
    'the series is INCOMPLETE until then',
  );

  it('the detail half now cites the only source in the app that states it', () => {
    const { detail } = noteCiteSlices(rec(OLDER).note, rec(OLDER).noteCites);
    expect(detail.map((c) => c.key)).toEqual(['jobAidPpsv23Unavailable']);
    expect(detail[0].quote).toBe(QUOTES.jobAidPpsv23Unavailable);
  });

  it('it holds at both age bands, because the footnote is on all four pages', () => {
    for (const [am, riskIds] of [[OLDER, []], [YOUNGER, ['diabetes']], [YOUNGER, ['asplenia']]]) {
      expect(citeKeys(rec(am, riskIds)), `${am} ${riskIds}`).toContain('jobAidPpsv23Unavailable');
    }
  });

  it('the 8-week OPTION is cited only at 50+, where CDC prints it as a choice', () => {
    // CLAUDE.md forbids collapsing this: at 19-49 for the same risk class the
    // 8 weeks IS the recommendation, so the option sentence is absent there
    // and must not be cited.
    const older = rec(OLDER, ['asplenia']);
    expect(noteText(older)).toContain('A minimum interval of 8 weeks may be considered');
    expect(citeKeys(older)).toContain('jobAidEightWeekOptionAt50');

    const younger = rec(YOUNGER, ['asplenia']);
    expect(noteText(younger)).not.toContain('may be considered');
    expect(citeKeys(younger)).not.toContain('jobAidEightWeekOptionAt50');
  });
});

describe('statements #10, #11, #13, #14 — a PCV7-only history counts as none', () => {
  const noHistory = (am, riskIds = []) => findByNote(adult(am, { riskIds }), 'counts as no PCV history');

  it('the PCV7 sentence carries both documents that state it', () => {
    const { detail } = noteCiteSlices(noHistory(SEVENTY).note, noHistory(SEVENTY).noteCites);
    expect(detail.map((c) => c.key)).toEqual([
      'adultPcv7Only',
      'jobAidPcv7CountsAsNone',
      'adultPcv20or21Complete',
    ]);
  });

  it('at 19-49 too, where footnote * is printed just the same', () => {
    const rec = noHistory(YOUNGER, ['diabetes']);
    expect(rec).toBeDefined();
    expect(citeKeys(rec)).toContain('jobAidPcv7CountsAsNone');
  });

  it('a PCV7 dose on record reaches the same card and the same citation', () => {
    // validate.js drops PCV7, so this patient arrives with no counting PCV --
    // which is what the footnote is about.
    const rec = findByNote(
      adult(SEVENTY, { pcvDoses: [{ date: '2008-01-10', product: 'PCV7' }] }),
      'counts as no PCV history',
    );
    expect(rec).toBeDefined();
    expect(citeKeys(rec)).toContain('jobAidPcv7CountsAsNone');
  });
});

describe('the three statements that are NOT cited, and why', () => {
  // Each of these rests on a table CELL -- "≥5 years", "≥1 year",
  // "NO OPTION B" -- and the document states them in no prose anywhere. Under
  // the owner's cite-or-remove rule that is her decision, not this session's,
  // so they are left exactly as they were and pinned here. If one acquires a
  // job-aid quote, someone has invented a sentence the document does not
  // contain, which is the single failure this whole effort exists to prevent.
  const cases = [
    ['PCV13 + PPSV23 -> PCV20/21 at >=5 years', () => findByNote(
      adult(OLDER, {
        pcvDoses: [{ date: '2015-01-10', product: 'PCV13' }],
        ppsv23Doses: [{ date: '2016-01-10' }],
      }),
      'give 1 dose of PCV20 or PCV21',
    )],
    ['PPSV23 only -> a PCV at >=1 year', () => findByNote(
      adult(OLDER, { ppsv23Doses: [{ date: '2016-01-10' }] }),
      'after the PPSV23 dose',
    )],
    ['PCV13 only -> PCV20/21 at >=1 year, no PPSV23 needed', () => findByNote(
      adult(OLDER, { pcvDoses: [{ date: '2015-01-10', product: 'PCV13' }] }),
      'after the last PCV13 dose',
    )],
  ];

  for (const [name, get] of cases) {
    it(`${name} still lists the job aid and still quotes none of it`, () => {
      const rec = get();
      expect(rec, name).toBeDefined();
      expect(buttonUrls(rec), name).toContain(JOB_AID_URL);
      const quoted = (rec.noteCites ?? []).filter((c) => c.page === JOB_AID_URL);
      expect(quoted.map((c) => c.key), name).toEqual([]);
    });
  }
});

describe('swept over the whole grid — the counts that moved', () => {
  const sweep = () => {
    let gained = 0;
    let uncreditedPairs = 0;
    const uncreditedStatements = new Set();
    let imbalanced = 0;
    for (const c of buildCases()) {
      let result;
      // `buildCases()` yields { input, ... }, NOT the engine's argument.
      // Passing the wrapper makes recommend() answer about a different,
      // mostly-empty patient and still return cards, so the sweep looks like
      // it ran. Measured once by mistake: 17,016 cards, 0 of them listing the
      // job aid at all, which is the tell.
      try { result = recommend(c.input); } catch { continue; }
      if (result.excluded) continue;
      for (const rec of result.recs ?? []) {
        const cites = rec.noteCites ?? [];
        const lead = typeof rec.note === 'string' ? rec.note : rec.note?.lead;
        const detail = typeof rec.note === 'string' ? null : rec.note?.detail;
        if (markerCount(lead) + markerCount(detail) !== cites.length) imbalanced++;

        const listsJobAid = (rec.citations ?? []).some((x) => x.url === JOB_AID_URL);
        if (!listsJobAid) continue;
        const quotesJobAid = cites.some((x) => x.page === JOB_AID_URL);
        if (quotesJobAid) gained++;
        else {
          uncreditedPairs++;
          uncreditedStatements.add(noteText(rec).replace(/\d{4}-\d{2}-\d{2}/g, 'DATE'));
        }
      }
    }
    return { gained, uncreditedPairs, uncreditedStatements, imbalanced };
  };

  it('3,616 cards gained a job-aid citation; 3,189 are still uncredited, across 3 statements', () => {
    const { gained, uncreditedPairs, uncreditedStatements } = sweep();
    expect(gained).toBe(3616);
    expect(uncreditedPairs).toBe(3189);
    expect(uncreditedStatements.size).toBe(3);
  });

  it('every card balances its markers against its cites', () => {
    // An orphan marker is silently DROPPED by the renderer rather than shown,
    // and a surplus cite consumes a number that nothing displays -- so neither
    // is visible on screen. This is the only thing that would report it.
    expect(sweep().imbalanced).toBe(0);
  });
});
