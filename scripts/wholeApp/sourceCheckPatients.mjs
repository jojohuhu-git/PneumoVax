// sourceCheckPatients.mjs — the 2026-11-05 live-source comparison list.
//
// The seven checks only catch the app disagreeing with itself. These patients
// are read against CDC's pages by a person, one at a time. Each was picked
// because its card WORDING appears on no patient in either earlier comparison
// list (`pneumoRecsCases.mjs`, `pneumoRecsGreyCases.mjs`): 94 of the 160 wordings
// on the checked patients are on neither list. Histories are ordinary and worked
// out from the date of birth. No PHI: every name and date is invented.
//
//   node scripts/wholeApp/sourceCheckPatients.mjs        print every card
//   node scripts/wholeApp/sourceCheckPatients.mjs S03    one patient
import { recommend } from '../../src/logic/recommend.js';
import { addCalendarMonths } from '../../src/logic/dateUtils.js';
import { noteText } from './replay.mjs';

export const TODAY = '2026-11-05';
const Y = 12;
const baby = (p) => [[p, 2], [p, 4], [p, 6], [p, 12]];

const P = (id, name, ageM, riskIds, pcv = [], ppsv = []) => {
  const dob = addCalendarMonths(TODAY, -ageM);
  return {
    id, name, ageM, dob, riskIds, today: TODAY,
    pcvDoses: pcv.map(([product, at]) => ({ product, date: addCalendarMonths(dob, at) })),
    ppsv23Doses: ppsv.map((at) => ({ product: 'PPSV23', date: addCalendarMonths(dob, at) })),
  };
};

export const PATIENTS = [
  P('S01', 'Ada', 8 * Y, ['cochlear_implant'], [...baby('PCV13'), ['PCV15', 7 * Y]], [2 * Y]),
  P('S02', 'Ben', 18 * Y, ['cochlear_implant'], [['PCV15', 16 * Y]], [17 * Y]),
  P('S03', 'Cleo', 9 * Y, ['asplenia'], [...baby('PCV13'), ['PCV15', 8 * Y]], [2 * Y]),
  P('S04', 'Dan', 10 * Y, ['cochlear_implant'], [...baby('PCV13'), ['PCV20', 9 * Y]]),
  P('S05', 'Eve', 12 * Y, ['asplenia'], [['PCV15', 10 * Y], ['PCV20', 11 * Y]]),
  P('S06', 'Finn', 12 * Y, ['hiv'], [...baby('PCV15'), ['PCV15', 11 * Y]], [11 * Y + 1]),
  P('S07', 'Gia', 8 * Y, ['csf_leak'], [...baby(''), ['PCV15', 7 * Y]], [2 * Y]),
  P('S08', 'Hal', 9 * Y, ['diabetes'], [...baby('PCV13'), ['PCV15', 8 * Y]]),
  P('S09', 'Iris', 7 * Y, ['cochlear_implant'], baby('PCV13'), [5 * Y]),
  P('S10', 'Jude', 10 * Y, ['asplenia'], [...baby('PCV13'), ['PCV15', 9 * Y]]),
  P('S11', 'Kim', 22 * Y, ['asplenia'], [], [12 * Y, 17 * Y]),
  P('S12', 'Lou', 12 * Y, ['hiv'], [...baby('PCV13'), ['PCV15', 11 * Y]], [2 * Y, 7 * Y]),
  P('S13', 'Mae', 7 * Y, ['diabetes'], baby('PCV15'), [2 * Y]),
  P('S14', 'Ned', 8 * Y, ['cochlear_implant'], baby(''), [5 * Y]),
  P('S15', 'Oli', 30 * Y, ['chronic_heart'], [['PCV15', 28 * Y]]),
  P('S16', 'Pia', 17 * Y, ['chronic_heart'], [['PCV13', 10 * Y]], [12 * Y]),
  P('S17', 'Quin', 7 * Y, ['csf_leak'], [...baby(''), ['PCV15', 6 * Y + 6]]),
  P('S18', 'Rae', 75 * Y, [], [['PCV13', 64 * Y]], [66 * Y]),
  P('S19', 'Sid', 15, [], [['PCV20', 3]]),
  P('S20', 'Tia', 15, []),
  P('S21', 'Uma', 4 * Y, ['cochlear_implant'], [['PCV15', 2 * Y]]),
  P('S22', 'Vic', 3 * Y, ['chronic_heart']),
  P('S23', 'Wes', 25 * Y, ['asplenia'], [['PCV21', 24 * Y]]),
  P('S24', 'Xan', 8 * Y, ['hiv'], [...baby(''), ['PCV15', 7 * Y]]),
  P('S25', 'Yara', 18 * Y, ['cochlear_implant'], [['', 10 * Y]], [15 * Y]),
  P('S26', 'Zed', 4 * Y, ['asplenia'], baby('PCV13')),
  P('S27', 'Amy', 18 * Y, ['cochlear_implant'], [['PCV13', 8 * Y]]),
  P('S28', 'Bo', 6 * Y, ['cochlear_implant'], baby('')),
  P('S29', 'Cy', 50 * Y, ['asplenia']),
  P('S30', 'Di', 7 * Y, ['asplenia'], baby('')),
  P('S31', 'Flo', 7, [], [['PCV15', 3], ['PCV15', 4]]),
  P('S32', 'Gus', 5 * Y, ['asplenia'], [['PCV13', 2], ['PCV13', 4], ['PCV13', 6]]),
  P('S33', 'Hana', 4 * Y, [], [['PCV13', 2], ['PCV13', 4], ['PCV13', 6]]),
  P('S34', 'Ian', 2 * Y, [], [['PCV13', 7], ['PCV13', 9], ['PCV13', 12]]),
  P('S35', 'Joy', 5 * Y, ['cochlear_implant'], baby('PCV13')),
  P('S36', 'Kai', 4 * Y, ['chronic_heart'], baby('PCV13'), [3 * Y]),
  P('S37', 'Lea', 55 * Y, [], [['PCV13', 53 * Y]]),
  P('S38', 'Mo', 67 * Y, [], [], [65 * Y]),
  P('S39', 'Nia', 55 * Y, ['hiv'], [['PCV15', 55 * Y - 3]]),
  P('S40', 'Ola', 45 * Y, ['diabetes'], [['PCV13', 40 * Y]], [41 * Y]),
  P('S41', 'Pax', 40 * Y, ['hiv'], [['PCV13', 30 * Y]], [31 * Y, 36 * Y]),
  P('S42', 'Rob', 60 * Y, [], [['PCV13', 50 * Y]], [51 * Y]),
];

if (import.meta.url === `file://${process.argv[1]}`) {
  const ids = process.argv.slice(2);
  for (const p of PATIENTS.filter((x) => !ids.length || ids.includes(x.id))) {
    const r = recommend(p);
    const yrs = p.ageM >= 24 ? `${Math.floor(p.ageM / 12)}y` : `${p.ageM}m`;
    console.log(`\n${p.id} ${p.name}, ${yrs}, ${p.riskIds.join('+') || 'no risk'} | PCV ${p.pcvDoses.map((d) => `${d.product || '?'} ${d.date}`).join(', ') || 'none'} | PPSV23 ${p.ppsv23Doses.map((d) => d.date).join(', ') || 'none'}`);
    for (const c of r.recs ?? []) {
      console.log(`  [${c.status}] ${c.doseLabel} | ${c.dueToday ? 'due today' : c.earliestNextDate ?? 'no date'} | ${(c.brands ?? []).map((b) => String(b).split(' ')[0]).join('/')}`);
      console.log(`     ${noteText(c)}`);
    }
    for (const s of ['pcv', 'ppsv23']) for (const [i, d] of (r.perDose?.[s] ?? []).entries()) {
      if (d.status !== 'valid' || d.extraDose || d.earlyAdvisory) console.log(`  chip ${s} ${i + 1}: ${d.status}${d.extraDose ? ' extra' : ''}${d.earlyAdvisory ? ' early' : ''} — ${(d.reasons ?? []).join(' ').slice(0, 220)}`);
    }
  }
}
