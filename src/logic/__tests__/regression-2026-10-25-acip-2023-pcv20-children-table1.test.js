// ─────────────────────────────────────────────────────────────────────────
// §K-PCV20CHILD2023 — OWNER DECISION 2026-10-25. ACIP's 2023
// PCV20-in-children report, Table 1, goes on the at-risk child cards.
//
// She had given the document herself — *"You can reference this document for
// pediatric recommendations too"* — and then, shown the actual cards and what
// each already cited, chose per half:
//
//   half A  "Completed series includes ≥1 dose of PCV20: No additional doses
//            of any pneumococcal vaccine are indicated."
//           → REPLACES immunize.org p2016 on the "PCV complete (includes
//             PCV20)" card. 56 cards.
//   half B  "Either a single dose of PCV20 or PPSV23 using previously
//            recommended dosing and schedules is recommended to complete the
//            recommended vaccine series."
//           → ADDED beside CDC's child notes on the Option A / Option B
//             cards. 432 cards.
//
// ── THE TWO MUTATIONS THAT PASSED, WHICH IS WHY THIS FILE EXISTS ─────────
//
// Breaking the change five ways, two broke nothing:
//
//   • Moving half B's marker ONTO the interval sentence — "...≥8 weeks after
//     the most recent PCV [c] [c]" — so one sentence carries two numbers for
//     two different claims. Table 1 states NO interval; the 8 weeks is CDC's
//     child notes' and p2016's. Caught by nothing, because the "same sentence,
//     two numbers" invariant is swept on the infant catch-up card only.
//   • Widening the quote to a joined parent+child string ("Completed series
//     includes ≥1 dose of PCV20: No additional doses..."), which is FINDING
//     K's fault and exists nowhere in the PDF as contiguous text.
//
// The first is guarded below, per card. The second cannot be guarded by a
// test — nothing here can re-read a PDF — so it is guarded by the shape of
// the stored quote instead: each quote must be ONE bullet, which means it
// must not contain the heading's colon-terminated condition. That is weaker
// than reading the document and is stated as such rather than oversold.
// ─────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { REFS } from '../../data/refs.js';
import { addCalendarMonths } from '../dateUtils.js';

const TODAY = '2026-10-25';
const DOB = '2020-10-25';          // 6 years old on TODAY

const patient = ({ risk, pcv, ppsv = [] }) => recommend({
  ageMonths: 72,
  dob: DOB,
  today: TODAY,
  riskIds: [risk],
  pcvDoses: pcv.map(([product, mo]) => ({ product, date: addCalendarMonths(DOB, mo) })),
  ppsv23Doses: ppsv.map((mo) => ({ product: 'PPSV23', date: addCalendarMonths(DOB, mo) })),
});

const noteOf = (r) => (typeof r.note === 'string'
  ? r.note
  : [r.note?.lead, r.note?.detail].filter(Boolean).join(' '));
const chips = (r) => (r.citations ?? []).map((c) => c.short);
const citeKeys = (r) => (r.noteCites ?? []).map((c) => c?.key).filter(Boolean);

// Her half-A patient: 6, cochlear implant, PCV20 at 5, no PPSV23.
const HALF_A = { risk: 'cochlear_implant', pcv: [['PCV20', 60]] };
// The control that scopes the swap: the same child WITH a PPSV23.
const HALF_A_WITH_PPSV = { ...HALF_A, ppsv: [62] };
// Her half-B patient: 6, cochlear implant, PCV15 at 4, no PCV20, no PPSV23.
const HALF_B = { risk: 'cochlear_implant', pcv: [['PCV15', 48]] };
const HALF_B_IC = { risk: 'asplenia', pcv: [['PCV15', 48]] };

const completeCard = (p) => (patient(p).recs ?? [])
  .find((r) => noteOf(r).includes('At-risk child whose PCV series includes PCV20'));
const cardNamed = (p, startsWith) => (patient(p).recs ?? [])
  .find((r) => String(r.doseLabel).startsWith(startsWith));

describe('half A — the 2023 report replaces p2016', () => {
  it('cites the sentence, by number', () => {
    const card = completeCard(HALF_A);
    expect(card).toBeDefined();
    expect(card.status).toBe('complete');
    expect(citeKeys(card)).toContain('cdcPcv20Children2023CompleteWithPcv20');
  });

  it('shows two CDC sources and no immunize.org handout', () => {
    expect(chips(completeCard(HALF_A))).toEqual(
      expect.arrayContaining(['CDC Child/Adolescent Notes', 'ACIP 2023 PCV20 Children']),
    );
    expect(chips(completeCard(HALF_A))).not.toContain('immunize.org p2016');
  });

  it('says in its own words which document states it', () => {
    expect(noteOf(completeCard(HALF_A))).toContain("ACIP's 2023 PCV20-in-children report");
    expect(noteOf(completeCard(HALF_A))).not.toContain('p2016 states the same');
  });

  // ⚠️ THE SCOPE CONTROL. Mutating the swap to cover this child too breaks 7
  // tests across 5 files, including the FINDING K guard that pins her group
  // at 40 — but only because those guards exist. Pinned here as well, beside
  // the patient she is a control for, so the pair reads as one decision.
  it('does NOT reach the sibling who has had a PPSV23 — she keeps p2016', () => {
    const card = completeCard(HALF_A_WITH_PPSV);
    expect(card).toBeDefined();
    expect(chips(card)).toContain('immunize.org p2016');
    expect(chips(card)).not.toContain('ACIP 2023 PCV20 Children');
    expect(citeKeys(card)).toContain('p2016CompletedBefore6WithPcv20');
  });
});

describe('half B — the 2023 report is added beside CDC\'s notes', () => {
  it.each([
    ['non-immunocompromising', HALF_B],
    ['immunocompromising', HALF_B_IC],
  ])('%s: Option A and Option B both cite it', (_name, who) => {
    for (const label of ['Option A', 'Option B']) {
      const card = cardNamed(who, label);
      expect(card, `${label} card missing`).toBeDefined();
      expect(citeKeys(card)).toContain('cdcPcv20Children2023CompleteWithoutPcv20');
      expect(chips(card)).toContain('ACIP 2023 PCV20 Children');
      expect(chips(card)).toContain('CDC Child/Adolescent Notes');
    }
  });

  // ⚠️ THE MUTATION THAT PASSED. Table 1 states the CHOICE and no interval.
  // Its marker must sit on its own sentence, never on the clause carrying the
  // 8 weeks — one sentence with two numbers for two different claims is the
  // fault the infant catch-up card's invariant forbids, and nothing swept
  // this card.
  it.each([
    ['non-immunocompromising', HALF_B],
    ['immunocompromising', HALF_B_IC],
  ])('%s: its marker is on its OWN sentence, not on the interval', (_name, who) => {
    for (const label of ['Option A', 'Option B']) {
      const text = noteOf(cardNamed(who, label));
      // Split into sentences and find the one the 2023 report is credited for.
      const sentences = text.split(/(?<=\.)\s+/).filter(Boolean);
      const choice = sentences.find((x) => x.includes('completes the recommended series'));
      expect(choice, `no choice sentence on ${label}`).toBeDefined();
      // Exactly one marker on it — its own.
      expect((choice.match(/\[c\]/g) || [])).toHaveLength(1);
      // And it must not be the sentence that states the interval.
      expect(choice).not.toMatch(/8 weeks|≥5 years/);

      const interval = sentences.find((x) => /8 weeks/.test(x));
      expect(interval, `no interval sentence on ${label}`).toBeDefined();
      expect(interval).not.toContain('completes the recommended series');
    }
  });

  it('the IC card keeps the 5-year clause separate too — Table 1 is silent on it', () => {
    const card = cardNamed(HALF_B_IC, 'Option B');
    const text = noteOf(card);
    const fiveYear = text.split(/(?<=\.)\s+/).find((x) => /5 years/.test(x));
    expect(fiveYear).toBeDefined();
    expect(fiveYear).not.toContain('completes the recommended series');
    // Its own source, unchanged.
    expect(citeKeys(card)).toContain('pedsSecondPpsv5y');
  });
});

describe('the reference entries themselves', () => {
  const A = 'cdcPcv20Children2023CompleteWithPcv20';
  const B = 'cdcPcv20Children2023CompleteWithoutPcv20';
  const WHOLE = 'cdcPcv20Children2023';

  it('all three point at the Supplementary Report PDF, never the MMWR notice', () => {
    // ⚠️ `cdc.gov/mmwr/volumes/72/wr/mm7239a5.htm` is a ONE-PARAGRAPH NOTICE
    // (read live 2026-10-25) that records the ACIP vote and states no
    // recommendation at all. Citing it for a Table 1 row would deep-link to a
    // document that does not say it.
    for (const k of [A, B, WHOLE]) {
      expect(REFS[k].url, k).toBe('https://stacks.cdc.gov/view/cdc/133252/cdc_133252_DS1.pdf');
      expect(REFS[k].url, k).not.toContain('mm7239a5');
    }
    // And the notice's own entry still exists, still pointing at the notice.
    expect(REFS.mmwr7239a5.url).toContain('mm7239a5.htm');
  });

  it('the two quoted entries name the page the table is on', () => {
    for (const k of [A, B]) expect(REFS[k].pdfPage, k).toBe(10);
    // The whole-document chip carries no page and no quote.
    expect(REFS[WHOLE].quote).toBeUndefined();
    expect(REFS[WHOLE].population).toBeUndefined();
  });

  // ⚠️ THE SECOND MUTATION THAT PASSED, guarded as far as a test can reach.
  // A quote must be ONE contiguous bullet. A test cannot re-read the PDF, so
  // what is checked is the shape FINDING K's fault always has: the heading's
  // condition, which ends in a colon, pulled into the quote. This is weaker
  // than reading the document and is not a substitute for doing so.
  it('each quote is one bullet, not a bullet joined to its heading', () => {
    for (const k of [A, B]) {
      expect(REFS[k].quote, k).not.toMatch(/:/);
      expect(REFS[k].quote, k).not.toMatch(/Completed series/);
      // The heading's conditions belong in the label, where they are visible.
      expect(REFS[k].label, k).toMatch(/completed a PCV series before age 6/);
    }
    expect(REFS[A].quote).toBe('No additional doses of any pneumococcal vaccine are indicated.');
    expect(REFS[B].quote).toBe('Either a single dose of PCV20 or PPSV23 using previously recommended dosing and schedules is recommended to complete the recommended vaccine series.');
  });

  it('half B\'s quote states no interval, which is why its marker stands alone', () => {
    expect(REFS[B].quote).not.toMatch(/8 weeks|week|year/);
  });
});
