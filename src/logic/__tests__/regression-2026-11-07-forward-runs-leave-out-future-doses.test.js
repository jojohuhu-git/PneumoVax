// 2026-11-07, after Kai (owner: "Yes, fix it here").
//
// Some card lines look ahead: "Re-evaluate at age 19", "At 19, the adult
// schedule gives…", Option B's "If PPSV23 is chosen…", Kai's age-50 line, and
// the adult card that answers for a teen whose next dose falls past 19. Each
// is worked out by running the SAME patient forward to 19 or 50.
//
// A dose dated in the FUTURE is a record problem: "a dose the patient never
// had", not counted today. But at 19 or 50 its date is in the past, so the
// forward run counted it. JUDE — 16, smokes, PCV13 at 2, 4, 6 and 12 months,
// and a PCV20 typed as next year — was told "Re-evaluate at age 50" instead
// of "at 19": the run to 19 counted the PCV20 and read Complete. The prose
// diff on Kai's fix found the same trap at 50 (96 impossible entries); the
// suite saw neither.
//
// Fix: every forward run starts from `forwardInput`, the record without the
// doses the walk itself flags as record problems.
//
// NOT covered, and on purpose: today's card can still read a future-dated
// PPSV23 in its OWN wording ("≥8 weeks after the most recent pneumococcal
// vaccine", "if not previously given"). That is not a forward run; it is
// recorded in the handoff for the owner.
import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';
import { buildRecordProblemCases } from '../../test-grid.js';

const TODAY = '2026-11-07';
const noteText = (r) => (typeof r.note === 'string' ? r.note : `${r.note?.lead ?? ''} ${r.note?.detail ?? ''}`);
const LOOK_AHEAD = /Re-evaluate at age \d+[^.]*\.|At 19, [^.]*\.|If PPSV23 is chosen[^.]*\.|at 50 [^.]*\./g;
const lookAhead = (out) => out.recs.map((r) => (noteText(r).match(LOOK_AHEAD) ?? []).join(' ')).join(' | ');
const pcvOf = (product, dates) => dates.map((date) => ({ product, date }));

const JUDE = {
  dob: '2010-05-07', today: TODAY, riskIds: ['smoking'], ppsv23Doses: [],
  pcvDoses: pcvOf('PCV13', ['2010-07-07', '2010-09-07', '2010-11-07', '2011-05-07']),
};

describe('a dose dated in the future changes no look-ahead line', () => {
  it('Jude — 16, smokes: the PCV20 typed as next year does not turn "19" into "50"', () => {
    const typo = recommend({ ...JUDE, pcvDoses: [...JUDE.pcvDoses, ...pcvOf('PCV20', ['2027-11-07'])] });
    expect(typo.perDose.pcv[4].recordProblem).toBeTruthy(); // the premise
    expect(noteText(typo.recs[0])).toMatch(/Re-evaluate at age 19, when the adult schedule counts cigarette smoking/);
    expect(noteText(typo.recs[0])).not.toContain('Re-evaluate at age 50');
    expect(lookAhead(typo)).toBe(lookAhead(recommend(JUDE)));
  });

  it('Ivy — 12, cochlear implant, series complete: the PCV20 typed as next year does not erase "At 19"', () => {
    // The grid cannot build her (0 vaccinated children over 2), and without her
    // the run to 19 for at-risk children could go back to the raw record with
    // every other test green — that mutation passed until she was added.
    const IVY = { dob: '2014-11-07', today: TODAY, riskIds: ['cochlear_implant'],
      pcvDoses: pcvOf('PCV13', ['2015-01-07', '2015-03-07', '2015-05-07', '2015-11-07']),
      ppsv23Doses: [{ product: 'PPSV23', date: '2022-11-07' }] };
    const typo = recommend({ ...IVY, pcvDoses: [...IVY.pcvDoses, ...pcvOf('PCV20', ['2027-11-07'])] });
    expect(typo.recs[0].status).toBe('complete');
    expect(noteText(typo.recs[0])).toContain('At 19, the adult schedule gives 1 dose of PCV20 or PCV21');
    expect(lookAhead(typo)).toBe(lookAhead(recommend(IVY)));
  });

  it('a 6-year-old with heart disease: Option B keeps its "at 19 / at 50" line', () => {
    const base = { dob: '2020-11-07', today: TODAY, riskIds: ['chronic_heart'], ppsv23Doses: [],
      pcvDoses: pcvOf('PCV13', ['2025-11-07']) };
    const typo = { ...base, pcvDoses: [...base.pcvDoses, ...pcvOf('PCV20', ['2027-11-07'])] };
    const line = lookAhead(recommend(base));
    expect(line).toMatch(/If PPSV23 is chosen/);
    expect(lookAhead(recommend(typo))).toBe(line);
  });

  it('over every future-dated impossible entry: the same look-ahead as without that dose', () => {
    // 1,980 entries. Before the fix 101 differed (62 "50" for "19", 39 Option B
    // lines lost); after it, 0. Pinned by the count of entries seen.
    let seen = 0;
    for (const c of buildRecordProblemCases()) {
      const t = c.input.today;
      const future = (d) => d?.date && d.date > t;
      if (!(c.input.pcvDoses ?? []).some(future) && !(c.input.ppsv23Doses ?? []).some(future)) continue;
      seen += 1;
      const clean = { ...c.input,
        pcvDoses: (c.input.pcvDoses ?? []).filter((d) => !future(d)),
        ppsv23Doses: (c.input.ppsv23Doses ?? []).filter((d) => !future(d)) };
      expect(lookAhead(recommend(c.input)), c.key).toBe(lookAhead(recommend(clean)));
    }
    expect(seen).toBe(1980);
  });
});
