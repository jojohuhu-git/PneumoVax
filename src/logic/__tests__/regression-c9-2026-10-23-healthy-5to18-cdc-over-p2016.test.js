// C9 (2026-10-23) — the healthy 5–18 "no PCV indicated" card, and the OWNER
// RULE that settled it: cite CDC; reach for immunize.org p2016 only when CDC
// cannot carry the claim.
//
//   OWNER DECISION 2026-10-23: "Ok to cite p2016 if you cannot just cite the
//   CDC references."
//
// WHY THE CARD WAS OPENED. It carried three grey buttons — CDC's Child &
// Adolescent Notes, immunize.org p2016, and the CDC PCV Catch-up Job Aid — and
// only CDC's had a number pointing at it. The queued job was to find p2016's
// row and credit it on all 1,584 cards.
//
// WHAT READING p2016 FOUND (read live 2026-10-23, `scripts/pdfLayout.py`).
// Table 2 is headed "healthy children age 24 months through 18 years" and holds
// exactly THREE rows. Its 5–18 band has exactly ONE:
//
//   Child's age now  | Number of previous PCV13,   | Number of PCV15 or PCV20
//                    |   PCV15, or PCV20 doses     |   doses needed*
//   -----------------+-----------------------------+--------------------------
//   24 through 59 mo | Completed any PCV schedule, | No additional doses
//                    |   including an all-PCV13    |
//                    |   schedule by 24 mos        |
//   24 through 59 mo | No previous doses, or any   | 1 additional dose, at
//                    |   incomplete PCV schedule   |   least 8 wks after most
//                    |   by age 24 months          |   recent PCV dose
//   5 through 18 yrs | No previous doses or any    | No additional doses
//                    |   incomplete PCV schedule   |
//                    |   by 24 months              |
//
// Read the middle column of the 5–18 row: it is written about a child who never
// finished. A healthy 10-year-old who COMPLETED her infant series at 2/4/6/12
// months fails that column, and the row that does describe her ("Completed any
// PCV schedule … by 24 mos") is printed in the 24-through-59-month band she has
// aged out of. OWNER RULE 2026-10-18 requires every column to fit, so p2016 has
// no row for her — and none anywhere else in the document either: Table 4 is
// risk conditions only and Table 5 is HSCT (both pages, all five tables read).
//
// WHY THAT DID NOT BECOME AN ESCALATION. Put to the owner as "no document has a
// row for this history", she answered with the rule above instead: CDC first.
// And CDC does carry the card, for every child who reaches it — read live
// 2026-10-23 from the Child & Adolescent Notes, pneumococcal section:
//
//   "Catch-up vaccination with PCV
//    Healthy children ages 2–4 years with any incomplete* PCV series: 1 dose PCV"
//
// The card's sentence is a claim about SCOPE — "healthy children 5–18 years are
// not routinely caught up", because "CDC's catch-up row covers healthy children
// only through age 4" — so the row that stops at 4 is what establishes it, and
// it establishes it identically for a child with no doses, an incomplete
// series, or a complete one. Nothing on this card needed p2016. It comes off.
//
// ⚠ THE JOB AID BUTTON STAYS. The third chip is a DIFFERENT (document,
// statement) pair on the same card, and it is the one the owner has asked not
// to be re-raised. This change does not touch it, and the test below pins it
// so a later tidy-up cannot take it with p2016.
//
// ⚠ THE GRID CANNOT BUILD THE PATIENT THIS TURNS ON. Measured over all 17,016
// grid cases: 1,584 land on this card, and p2016's 5–18 row fits every one of
// them (90 with no doses at all, 1,494 whose earliest dose is at 36 months, so
// empty and hence incomplete at 24 months). ZERO grid patients completed by 24
// months — the grid's fixed day-offsets cannot place an infant dose under a
// 5–18-year-old. So both verdict corpora register this change as nothing at
// all, and the child it is about has to be ASSERTED. That is why CHILD B below
// is written out by hand rather than filtered out of `buildCases()`.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildCases } from '../../test-grid.js';

const TODAY = '2026-10-23';
const DOB_10Y = '2016-10-23';

const chipShorts = (rec) => (rec.citations ?? []).map((c) => c.short || c.label);
const notIndicated = (out) => (out.recs ?? []).find(
  (r) => r.doseLabel === 'Not indicated (healthy 5–18y)',
);

const run = (pcvDoses) => recommend({
  ageMonths: 120, dob: DOB_10Y, today: TODAY, riskIds: [], pcvDoses, ppsv23Doses: [],
});

// The three healthy 10-year-olds the owner was shown, with their real dates.
const CHILD_A = [];                                       // never vaccinated
const CHILD_B = [                                         // complete 4-dose series
  { product: 'PCV13', date: '2016-12-23' },   // 2 months
  { product: 'PCV13', date: '2017-02-23' },   // 4 months  (8 weeks later)
  { product: 'PCV13', date: '2017-04-23' },   // 6 months  (8 weeks later)
  { product: 'PCV13', date: '2017-10-23' },   // 12 months (the booster)
];
const CHILD_C = [{ product: 'PCV13', date: '2016-12-23' }]; // one dose, then nothing

describe('C9: the healthy 5–18 card cites CDC, not p2016', () => {
  it.each([
    ['CHILD A — healthy 10y, never vaccinated', CHILD_A],
    ['CHILD B — healthy 10y, complete series at 2/4/6/12 months', CHILD_B],
    ['CHILD C — healthy 10y, one PCV13 at 2 months then nothing', CHILD_C],
  ])('%s: no p2016 button, CDC kept, Job Aid untouched', (_label, doses) => {
    const card = notIndicated(run(doses));
    expect(card).toBeTruthy();
    const chips = chipShorts(card);
    expect(chips).not.toContain('immunize.org p2016');
    expect(chips).toContain('CDC Child/Adolescent Notes');
    // The owner's do-not-re-raise chip. Pinned so a tidy-up cannot remove it.
    expect(chips).toContain('CDC PCV Catch-up Job Aid');
  });

  it('CHILD B is the patient p2016 had no row for, and she still needs nothing', () => {
    const card = notIndicated(run(CHILD_B));
    expect(card.status).toBe('not-indicated');
    // The clinical answer is untouched by the citation change.
    expect(card.vaccine).toBe('PCV');
  });

  it('no card in the grid shows this card with a p2016 button (1,584 cards)', () => {
    let seen = 0;
    const offenders = [];
    for (const c of buildCases()) {
      let out;
      try { out = recommend(c.input); } catch { continue; }
      if (out.excluded) continue;
      const card = notIndicated(out);
      if (!card) continue;
      seen += 1;
      if (chipShorts(card).includes('immunize.org p2016')) offenders.push(c.input);
    }
    expect(seen).toBe(1584);
    expect(offenders).toEqual([]);
  });

  // THE MIRROR GUARD (the FINDING F discipline, 2026-10-18): a removal is only
  // safe if the document is still credited where it DOES speak. p2016's two
  // 24-through-59-month rows are this card's neighbours and both still fit, so
  // the button must survive there. Without this, "delete p2016 from the child
  // pathway" would pass every assertion above.
  it('p2016 is still listed on the healthy 24–59 month cards it has rows for', () => {
    // 36-month-old, complete series  -> Table 2 "Completed any PCV schedule…"
    const complete = recommend({
      ageMonths: 36, dob: '2023-10-23', today: TODAY, riskIds: [], ppsv23Doses: [],
      pcvDoses: [
        { product: 'PCV13', date: '2023-12-23' },
        { product: 'PCV13', date: '2024-02-23' },
        { product: 'PCV13', date: '2024-04-23' },
        { product: 'PCV13', date: '2024-10-23' },
      ],
    });
    const completeCard = (complete.recs ?? []).find((r) => r.vaccine === 'PCV');
    expect(completeCard.status).toBe('complete');
    expect(chipShorts(completeCard)).toContain('immunize.org p2016');

    // 36-month-old, never vaccinated -> Table 2 "No previous doses, or any
    // incomplete PCV schedule by age 24 months -> 1 additional dose"
    const catchup = recommend({
      ageMonths: 36, dob: '2023-10-23', today: TODAY, riskIds: [], pcvDoses: [], ppsv23Doses: [],
    });
    const catchupCard = (catchup.recs ?? []).find((r) => r.vaccine === 'PCV');
    expect(chipShorts(catchupCard)).toContain('immunize.org p2016');
  });
});
