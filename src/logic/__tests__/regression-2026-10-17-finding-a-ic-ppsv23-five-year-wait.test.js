// FINDING A (2026-10-17) — an immunocompromised child who has ALREADY had one
// PPSV23 is told PCV20 is due TODAY. CDC says no pneumococcal vaccine is due
// until five years after that first PPSV23.
//
// Found by the owner asking why a document the app cites was not in the
// citation audit's scope. Not by a test, and not by either verdict corpus:
// both record a card's status and brands, and the status here ("risk-based")
// never changed. Only the DATE was wrong.
//
// WHAT THE APP DID, on four separate branches of recommend.js, all with the
// same shape — a PCV20 card gated at 8 weeks beside a 2nd-PPSV23 card gated at
// 5 years, offered as "choose ONE option":
//
//     Give 1 dose of PCV20 >=8 weeks after the most recent pneumococcal
//     vaccine — OR a 2nd PPSV23 >=5 years after the first PPSV23.
//     Choose ONE option.              [PCV20 card: due today]
//
// The card offers a choice between something available now and something
// available in 2029. A clinician reading it gives the PCV20.
//
// MEASURED over `test-grid.js` (16,008 patients, corpus date 2026-10-11),
// re-derived on 2026-10-17 rather than carried over from a note:
//
//     543  patients reach a "1 dose PCV20 (immunocompromising)" card
//     453  of those are told it is due TODAY
//     219  of those 453 had their first PPSV23 LESS than 5 years ago  <-- wrong
//     234  had it MORE than 5 years ago                              <-- correct
//
// The 234 are the control that makes this a real finding rather than a blanket
// misreading: the split falls exactly on the five-year line. Of the 219, 195
// come from one branch and 24 from another; the remaining two branches are
// unreachable with a sub-5-year PPSV23 on this grid but carry the same bug and
// are fixed and tested here too.
//
// ── THE SOURCES, read live on 2026-10-17 ───────────────────────────────────
//
// They were published two and a half years apart and they disagree.
//
// 1. CDC — "Summary of Risk-based Pneumococcal Vaccination Recommendations",
//    page dated MAY 8, 2026. Read live 2026-10-17 in the browser (cdc.gov
//    refuses curl).
//    https://www.cdc.gov/pneumococcal/hcp/vaccine-recommendations/risk-indications.html
//
//    "Children 6 through 18 years old" > "Received PCV13 or PCV15 before age 6
//    years, never received PCV20" > "Immunocompromising condition" >
//    "Received 1 dose of PPSV23":
//      "Then no pneumococcal vaccines are recommended at this time. Wait until
//       at least 5 years have passed since they received their first PPSV23
//       dose. Then give 1 dose of PCV20 or PPSV23."
//
//    "Children 2 through 5 years old" > "Complete PCV series that didn't
//    include PCV20" > "Immunocompromising condition" > "Received PPSV23"
//    repeats it word for word. So CDC states it TWICE, for both paediatric age
//    bands, and the two statements agree.
//
// 2. immunize.org P2016, "Recommendations for Pneumococcal Vaccines Use in
//    Children and Teens", Item #P2016, dated 2/16/2024. PDF downloaded live
//    2026-10-17.
//    https://www.immunize.org/wp-content/uploads/catg.d/p2016.pdf
//
//    Table 4, footnote || — the only place in that sheet that speaks to a
//    child who has already had PPSV23 (its table COLUMNS only ever count
//    conjugate doses):
//      "If PPSV23 previously given, options are (a) give one dose of PCV20 at
//       least 8 weeks after most recent pneumococcal vaccination, or (b) give a
//       second dose of PPSV23 five years after the first dose of PPSV23."
//
// ── WHY CDC GOVERNS. OWNER DECISION 2026-10-17 ─────────────────────────────
//
// P2016 contradicts ITSELF on this patient, which is the decisive point and is
// recorded here because it is not obvious from reading either source alone.
// Table 4's IC row offers an Option B:
//      "1 dose of PPSV23 at least 8 weeks after most recent PCV dose; at least
//       5 years later, give 1 dose of PCV20 or a second dose of PPSV23||"
// Follow that Option B and the child IS this patient — conjugates before age
// 6, one PPSV23, no PCV20 — and P2016's own Option B says the next dose is 5
// years away. Its footnote || says 8 weeks for the identical child. Same sheet,
// two answers, differing only in whether the PPSV23 was given inside P2016's
// own plan or before it.
//
// So this is not two credible sources disagreeing. It is a 2024 footnote
// disagreeing with the May 2026 CDC page AND with the rest of its own sheet.
//
// The owner decided on 2026-10-17: follow CDC. She also set the standing rule
// that settles the next case like this one — where a current CDC page and an
// older immunize.org handout disagree and AAP is silent, CDC governs. That
// rule is written into CLAUDE.md in this same commit; before today the
// authority rule ranked AAP against CDC and said nothing about immunize.org.
//
// ── WHAT IS NOT CHANGING, and why that matters ─────────────────────────────
//
// CDC's 6-18 section, for a child who has NEVER had any conjugate vaccine:
//      "Give 1 dose of PCV15 or PCV20 at least 8 weeks after the most recent
//       pneumococcal vaccine dose. Give it regardless of whether the child has
//       previously received PPSV23 or PCV7."
// That is an explicit instruction to IGNORE a prior PPSV23 and vaccinate at 8
// weeks. The last test in this file holds that card at 8 weeks, so the
// five-year rule cannot creep across onto it.
//
// ── THE 8-WEEK FLOOR IS KEPT, NOT DROPPED ──────────────────────────────────
//
// The new gate is the LATER of (5 years after the first PPSV23) and (8 weeks
// after the most recent pneumococcal dose). CDC states only the five-year
// condition, but a child can have a conjugate dose AFTER the PPSV23, and
// nothing in this change should let the app recommend a dose 2 weeks after the
// last one. Measured on the grid: of the 234 patients already past five years,
// ZERO are also within 8 weeks of a pneumococcal dose — so on the committed
// corpora the floor changes nothing, and the only behaviour this commit moves
// is the five-year gate. It is exercised directly by its own test below rather
// than left as logic no case reaches.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-10-17';

// Every fixture passes a real date of birth, and every dose date is checked
// against it and against PPSV23's minimum age of 2 years. A sibling test file
// learned this the hard way: a PPSV23 dated "five years ago" for a five-year-
// old lands before birth, the engine rejects the dose, and the fixture quietly
// tests a child with no PPSV23 at all.
const run = ({ dob, ageMonths, riskIds = ['asplenia'], pcv = [], ppsv = [] }) => recommend({
  dob,
  ageMonths,
  riskIds,
  today: TODAY,
  pcvDoses: pcv.map(([product, date]) => ({ product, date })),
  ppsv23Doses: ppsv.map((date) => ({ product: 'PPSV23', date })),
});

const pcv20Card = (r) => r.recs.find((x) => x.doseLabel === '1 dose PCV20 (immunocompromising)');
const ppsv2Card = (r) => r.recs.find((x) => x.doseLabel.startsWith('2nd PPSV23'));
const leadOf = (card) => (typeof card.note === 'string' ? card.note : card.note.lead);

/**
 * The whole point of the fix, asserted in one place so all four branches are
 * held to the identical standard: the PCV20 option and the 2nd-PPSV23 option
 * become available on the SAME DAY, because CDC offers them as alternatives at
 * the same five-year mark.
 */
const expectsBothOptionsAtFiveYears = (r, fiveYearDate) => {
  const pcv20 = pcv20Card(r);
  const ppsv2 = ppsv2Card(r);
  expect(pcv20, 'the PCV20 card should still be offered').toBeTruthy();
  expect(ppsv2, 'the 2nd-PPSV23 alternative should still be offered').toBeTruthy();

  expect(pcv20.dueToday).toBe(false);
  expect(pcv20.earliestNextDate).toBe(fiveYearDate);
  expect(ppsv2.dueToday).toBe(false);
  expect(ppsv2.earliestNextDate).toBe(fiveYearDate);

  // The card must not go on offering PCV20 "at 8 weeks" in its prose while its
  // own date says 2029. Prose and date are separate surfaces and the corpora
  // read neither.
  expect(leadOf(pcv20)).not.toMatch(/PCV20 ≥8 weeks|PCV20 at least 8 weeks/);
  expect(leadOf(pcv20)).toContain('5 years');
};

describe('Finding A — branch 1: at-risk child 24-71 months, PCV catch-up done, PPSV23 given', () => {
  // Age 5 exactly. Two PCV15 at 27 and 29 months (the at-risk catch-up at
  // >=24 months), PPSV23 at 31 months — above PPSV23's 2-year minimum age.
  //
  // This branch can NEVER have a five-year control: a child still under 72
  // months whose first PPSV23 was 5 years ago would have been under 1 year old
  // at the time, and PPSV23 is not given before age 2. Every patient this
  // branch sees is inside the five-year window, by arithmetic.
  const base = {
    dob: '2021-10-17',
    ageMonths: 60,
    pcv: [['PCV15', '2024-01-15'], ['PCV15', '2024-03-20']],
    ppsv: ['2024-06-01'],
  };

  it('waits until five years after the first PPSV23', () => {
    expectsBothOptionsAtFiveYears(run(base), '2029-06-01');
  });
});

describe('Finding A — branch 2: all conjugates before age 6, 1-2 doses, one PPSV23', () => {
  it('waits until five years after the first PPSV23', () => {
    const r = run({
      dob: '2019-10-17',
      ageMonths: 84,
      pcv: [['PCV15', '2023-10-17']],   // age 4
      ppsv: ['2024-10-17'],             // age 5
    });
    expectsBothOptionsAtFiveYears(r, '2029-10-17');
  });

  it('CONTROL — the same child, five years past the PPSV23, is due today', () => {
    const r = run({
      dob: '2015-10-17',
      ageMonths: 132,
      pcv: [['PCV15', '2020-10-17']],   // age 5, before 6
      ppsv: ['2021-01-17'],             // age 5y3m; five years passed 2026-01-17
    });
    expect(pcv20Card(r).dueToday).toBe(true);
    expect(ppsv2Card(r).dueToday).toBe(true);
  });
});

describe('Finding A — branch 3: three or more conjugate doses, one PPSV23', () => {
  it('waits until five years after the first PPSV23', () => {
    const r = run({
      dob: '2019-10-17',
      ageMonths: 84,
      pcv: [['PCV13', '2020-01-17'], ['PCV13', '2020-03-17'], ['PCV13', '2020-05-17']],
      ppsv: ['2024-10-17'],
    });
    expectsBothOptionsAtFiveYears(r, '2029-10-17');
  });

  it('CONTROL — the same child, five years past the PPSV23, is due today', () => {
    const r = run({
      dob: '2015-10-17',
      ageMonths: 132,
      pcv: [['PCV13', '2016-01-17'], ['PCV13', '2016-03-17'], ['PCV13', '2016-05-17']],
      ppsv: ['2021-01-17'],
    });
    expect(pcv20Card(r).dueToday).toBe(true);
    expect(ppsv2Card(r).dueToday).toBe(true);
  });
});

describe('Finding A — branch 4: PCV13 only, given at or after age 6, one PPSV23', () => {
  it('waits until five years after the first PPSV23', () => {
    const r = run({
      dob: '2016-10-17',
      ageMonths: 120,
      pcv: [['PCV13', '2023-10-17']],   // age 7
      ppsv: ['2024-10-17'],             // age 8
    });
    expectsBothOptionsAtFiveYears(r, '2029-10-17');
  });

  it('CONTROL — the same child, five years past the PPSV23, is due today', () => {
    const r = run({
      dob: '2012-10-17',
      ageMonths: 168,
      pcv: [['PCV13', '2019-10-17']],   // age 7
      ppsv: ['2020-10-17'],             // age 8; five years passed 2025-10-17
    });
    expect(pcv20Card(r).dueToday).toBe(true);
    expect(ppsv2Card(r).dueToday).toBe(true);
  });
});

describe('Finding A — the 8-week floor survives the change', () => {
  it('a child past five years but 12 days past a conjugate dose is not due today', () => {
    const r = run({
      dob: '2012-10-17',
      ageMonths: 168,
      pcv: [['PCV13', '2019-10-17'], ['PCV13', '2026-10-05']],  // most recent: 12 days ago
      ppsv: ['2020-01-17'],                                     // five years passed 2025-01-17
    });
    const pcv20 = pcv20Card(r);
    expect(pcv20.dueToday).toBe(false);
    expect(pcv20.earliestNextDate).toBe('2026-11-30');          // 2026-10-05 + 56 days
  });
});

describe('Finding A — the five-year rule does NOT spread to the never-vaccinated child', () => {
  // CDC, same page, same age band: "Give 1 dose of PCV15 or PCV20 at least 8
  // weeks after the most recent pneumococcal vaccine dose. Give it regardless
  // of whether the child has previously received PPSV23 or PCV7."
  it('an IC child with no conjugate dose ever is still due 8 weeks after the PPSV23', () => {
    const r = run({
      dob: '2012-10-17',
      ageMonths: 168,
      pcv: [],
      ppsv: ['2026-01-17'],             // 9 months ago: well past 8 weeks
    });
    const due = r.recs.filter((x) => x.vaccine === 'PCV' && x.dueToday);
    expect(due.length).toBeGreaterThan(0);
  });
});

// ── FINDING B (2026-10-17) ─────────────────────────────────────────────────
//
// Finding A shipped branch 4 with a comment calling its five years an
// INFERENCE, read across from p2016's Option B because "no source states this
// history with a PPSV23 already given". That was wrong. Re-reading CDC's child
// notes -- a page the app already cites, and therefore one the citation audit's
// own tool could never surface, since it lists only sources a card names but
// never quotes -- found the sentence stated outright in the IMMUNOCOMPROMISING
// list:
//
//   "Received 1 dose PCV13 and 1 dose PPSV23 at or after age 6 years:
//    administer 1 dose PCV20 or 1 dose PPSV23 at least 8 weeks after the most
//    recent PCV13 dose and at least 5 years after dose 1 PPSV23."
//
// It CONJOINS 8 weeks and 5 years, which is what icPostPpsv23DueState() does.
//
// Three lines earlier on the same page, the NON-IC list opens with the same
// nine words and ends the opposite way: "no further doses of any PCV or PPSV23
// indicated." Those two sentences are one accordion apart and differ only in
// which list they sit under. This test holds each to its own patient.
describe('Finding B — branch 4 cites the IC sentence, not its non-IC twin', () => {
  const history = {
    dob: '2016-10-17',
    ageMonths: 120,
    pcv: [['PCV13', '2023-10-17']],
    ppsv: ['2024-10-17'],
  };

  it('the IC child is cited to the IC sentence', () => {
    const quotes = run({ ...history, riskIds: ['asplenia'] })
      .recs.flatMap((x) => (x.noteCites ?? []).map((c) => c.quote ?? '')).join(' || ');
    expect(quotes).toContain('at least 5 years after dose 1 PPSV23');
    expect(quotes).not.toContain('no further doses of any PCV or PPSV23 indicated');
  });

  it('the non-IC twin of the same patient is cited to the non-IC sentence', () => {
    const r = run({ ...history, riskIds: ['cochlear_implant'] });
    const quotes = r.recs.flatMap((x) => (x.noteCites ?? []).map((c) => c.quote ?? '')).join(' || ');
    expect(r.recs.some((x) => x.status === 'complete')).toBe(true);
    expect(quotes).toContain('no further doses of any PCV or PPSV23 indicated');
    expect(quotes).not.toContain('at least 5 years after dose 1 PPSV23');
  });
});
