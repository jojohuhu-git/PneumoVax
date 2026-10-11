// P6-3b (S13, 2026-10-10) — the guard that keeps inline citations honest.
//
// The contract: `noteCites` carries exactly one citation per literal "[c]" in
// the note text, in order. RecCard pairs them positionally. If an engine note
// ever carries more markers than citations, or more citations than markers,
// the pairing silently shifts and a claim ends up labelled with a source that
// does not support it — a wrong citation on a clinical screen, which is worse
// than no citation at all.
//
// RecCard's own defence (drop the orphan marker rather than reuse the previous
// source) stops the WRONG source being shown, but it cannot tell anyone the
// note is broken. This is the test that does: it sweeps the engine across the
// whole age range and every risk factor, and checks the parity of every note
// and every dose verdict it can produce.
//
// Written BEFORE the notes were wired, deliberately, so it guards the wiring
// rather than being written to fit it.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { RISK_FACTORS } from '../../data/riskFactors.js';

const TODAY = '2026-06-07';

// Ages chosen to land on each side of every routing boundary the engine has:
// the PCV floor, the infant/catch-up bands, 24mo, 5y, 6y, the 19y schedule
// line, the PCV21 18y product line, 50y and 65y.
const AGES = [
  0, 1, 2, 3, 4, 6, 7, 11, 12, 13, 15, 23, 24, 25, 47, 59, 60, 71, 72,
  100, 180, 215, 216, 217, 227, 228, 229, 300, 480, 599, 600, 601, 779, 780, 781, 1020,
];

function dobForAgeMonths(am) {
  const d = new Date(TODAY);
  d.setMonth(d.getMonth() - am);
  return d.toISOString().slice(0, 10);
}

// A few representative histories, including the ones that produce verdicts
// (PCV7 noncounting, an under-age dose, a dose dated before birth).
function historiesFor(dob) {
  return [
    { pcvDoses: [], ppsv23Doses: [] },
    { pcvDoses: [{ product: 'PCV13', date: '2020-01-15' }], ppsv23Doses: [] },
    { pcvDoses: [{ product: 'PCV7', date: '2010-03-02' }], ppsv23Doses: [] },
    { pcvDoses: [{ product: 'PCV15', date: '2024-05-01' }], ppsv23Doses: [{ product: 'PPSV23', date: '2025-07-01' }] },
    { pcvDoses: [{ product: 'PCV20', date: '2025-02-02' }], ppsv23Doses: [] },
    { pcvDoses: [{ product: 'PCV21', date: '2025-02-02' }], ppsv23Doses: [] },
    // Impossible / invalid shapes, which is where dose verdicts come from.
    { pcvDoses: [{ product: 'PCV13', date: '1900-01-01' }], ppsv23Doses: [] },
    { pcvDoses: [{ product: 'PCV13', date: dob }], ppsv23Doses: [] },
    { pcvDoses: [{ product: 'PCV13', date: '' }], ppsv23Doses: [] },
  ];
}

// Every single risk, plus a few combinations that exercise IC-over-nonIC
// precedence and the adult-only path.
const RISK_SETS = [
  [],
  ...RISK_FACTORS.map((rf) => [rf.id]),
  ['asplenia', 'diabetes'],
  ['cochlear_implant', 'csf_leak'],
  ['smoking', 'alcoholism'],
  ['smoking', 'diabetes'],
  ['hsct', 'diabetes'],
  ['chronic_heart', 'chronic_lung', 'chronic_liver'],
];

function countMarkers(text) {
  return String(text ?? '').split('[c]').length - 1;
}

// P6-4: a note is `{ lead, detail }` (or still a plain string where it was
// never split). `noteCites` is ONE ordered list across BOTH halves, so the
// parity that matters is the TOTAL marker count — the lead's markers consume
// the first citations and the detail's take the rest.
function noteMarkers(note) {
  if (note == null) return 0;
  if (typeof note === 'string') return countMarkers(note);
  return countMarkers(note.lead) + countMarkers(note.detail);
}

// Walk every rec and every dose verdict the engine can emit across the sweep.
// ⚠ `recommend()` returns `perDose: { pcv: [...], ppsv23: [...] }` — the
// ARRAYS directly, not objects wrapping a `perDose` field. An earlier version
// of this sweep read `out.perDose[which].perDose`, which is always undefined,
// so it walked ZERO dose verdicts and the two verdict assertions below passed
// without testing anything. The combined "sweep is not empty" check did not
// catch it, because the notes alone cleared the threshold. Hence the separate
// per-kind counts returned here, and the separate floor asserted on each.
function sweep(visit) {
  const seen = { notes: 0, verdicts: 0 };
  for (const ageMonths of AGES) {
    const dob = dobForAgeMonths(ageMonths);
    for (const riskIds of RISK_SETS) {
      for (const history of historiesFor(dob)) {
        const out = recommend({ ageMonths, dob, riskIds, today: TODAY, ...history });
        for (const rec of out.recs ?? []) { visit({ kind: 'note', ageMonths, riskIds, rec }); seen.notes++; }
        for (const which of ['pcv', 'ppsv23']) {
          for (const v of out.perDose?.[which] ?? []) {
            visit({ kind: 'verdict', ageMonths, riskIds, verdict: v });
            seen.verdicts++;
          }
        }
      }
    }
  }
  return seen;
}

describe('P6-3b — every [c] marker is paired with exactly one citation', () => {
  it('sweeps a non-trivial number of BOTH notes and dose verdicts', () => {
    // Guard-on-the-guard, counted per kind. A combined total hid a sweep that
    // walked thousands of notes and not one verdict — see the note on sweep().
    const seen = sweep(() => {});
    expect(seen.notes, 'the sweep walked no recommendation notes').toBeGreaterThan(1000);
    expect(seen.verdicts, 'the sweep walked no dose verdicts').toBeGreaterThan(500);
  });

  it('no note has more markers than citations, or more citations than markers', () => {
    const mismatches = [];
    sweep((item) => {
      if (item.kind !== 'note') return;
      const markers = noteMarkers(item.rec.note);
      const cites = (item.rec.noteCites ?? []).length;
      if (markers !== cites) {
        mismatches.push(
          `${item.rec.vaccine}/${item.rec.status} at ${item.ageMonths}mo `
          + `risks=[${item.riskIds.join(',')}]: ${markers} marker(s) vs ${cites} citation(s)`,
        );
      }
    });
    expect(
      [...new Set(mismatches)],
      'A note\'s "[c]" markers and its noteCites must correspond one-for-one, in order. '
      + 'A mismatch shifts the pairing and labels a claim with the wrong source.',
    ).toEqual([]);
  });

  it('no dose verdict has more markers than citations, or the reverse', () => {
    const mismatches = [];
    sweep((item) => {
      if (item.kind !== 'verdict') return;
      const markers = (item.verdict.reasons ?? []).reduce((n, r) => n + countMarkers(r), 0);
      const cites = (item.verdict.reasonCites ?? []).length;
      if (markers !== cites) {
        mismatches.push(
          `${item.verdict.status} at ${item.ageMonths}mo: ${markers} marker(s) vs ${cites} citation(s)`,
        );
      }
    });
    expect([...new Set(mismatches)]).toEqual([]);
  });

  it('every citation resolves to a real reference with a working link', () => {
    // A cite() for a key that does not exist in REFS yields url: undefined,
    // which renders as a dead superscript. Catch the typo here, not on screen.
    const broken = [];
    sweep((item) => {
      const cites = item.kind === 'note'
        ? (item.rec.noteCites ?? [])
        : (item.verdict.reasonCites ?? []);
      for (const c of cites) {
        if (!c || !c.url || !c.page) broken.push(`${c?.key ?? '(missing)'}`);
      }
    });
    expect([...new Set(broken)]).toEqual([]);
  });

  it('a note that carries no marker carries no citations either', () => {
    // Not a style rule: noteCites without a marker means a source was attached
    // to the card that no sentence actually claims, which reads as support the
    // text never asked for.
    const stray = [];
    sweep((item) => {
      if (item.kind !== 'note') return;
      if (noteMarkers(item.rec.note) === 0 && (item.rec.noteCites ?? []).length > 0) {
        stray.push(`${item.rec.vaccine}/${item.rec.status} at ${item.ageMonths}mo`);
      }
    });
    expect([...new Set(stray)]).toEqual([]);
  });
});
