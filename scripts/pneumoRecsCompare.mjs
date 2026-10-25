// ─────────────────────────────────────────────────────────────────────────
// pneumoRecsCompare.mjs — PneumoVax's answer next to CDC PneumoRecs
// VaxAdvisor's answer, for the same patient, on the same day.
//
// NOT part of the app build and NOT part of `npm test`.
//   Run:  node scripts/pneumoRecsCompare.mjs
//
// How the `cdc:` strings got here: each one was READ OFF the live CDC tool
// (https://www2a.cdc.gov/vaccines/m/pneumo/) on 2026-10-17 by answering its
// questions for that patient and copying the recommendation it printed. They
// are quotes, lightly trimmed of the boilerplate footnote lists. Nothing here
// is remembered or inferred. The tool's own disclaimer says "app last updated
// December 2024", so these are December-2024 answers — see
// docs/archive/comparison-2026-10-17-pneumorecs-vs-pneumovax.md for what that
// means for the two cases where the apps disagree.
//
// IMPORTANT if you re-capture: for an adult, you must enter through the tool's
// "select the age group" front door (agegroup.html). Its birth-date entry
// (calendar.asp) redirects every patient aged 19+ to years19-64.asp or
// over65yr.asp, and BOTH of those pages are 404 — they are the pre-2024 age
// bands, never updated when the tool moved to 19-49 / 50+. Children work.
// Also: do not hand an age string to a page meant for another band. Jumping
// straight to child-groupA.asp with "8 years" renders the 2-5 year rulebook
// and looks like a real answer; 6-18 year olds live on teen-riskfactors.asp.
// ─────────────────────────────────────────────────────────────────────────
import { recommend } from '../src/logic/recommend.js';
// Fixed to the capture date, so re-running this reproduces the same comparison.
const TODAY = '2026-10-17';
const P = (product, date) => ({ product, date });
const S = (date) => ({ product: 'PPSV23', date });

export const CASES = [
  // ───────────── CHILDREN ─────────────
  { id:'P1', label:'2y, healthy, no prior PCV', dob:'2024-10-17', riskIds:[], pcvDoses:[], ppsv23Doses:[],
    cdc:'Give 1 dose of PCV (PCV15 or PCV20). Schedule is then complete.' },
  { id:'P2', label:'7mo, healthy, 1 PCV at 2mo', dob:'2026-03-17', riskIds:[], pcvDoses:[P('PCV15','2026-05-17')], ppsv23Doses:[],
    cdc:'Give 2 more doses of PCV: next dose preferably 8 weeks after most recent (minimum 4 week interval), then last dose between 12 through 15 months (at least 8 weeks after the most recent dose). Schedule is then complete.' },
  { id:'P3', label:'15mo, healthy, 3 PCV in infancy', dob:'2025-07-17', riskIds:[], pcvDoses:[P('PCV15','2025-09-17'),P('PCV15','2025-11-17'),P('PCV15','2026-01-17')], ppsv23Doses:[],
    cdc:'Give 1 more dose of PCV at least 8 weeks after most recent dose. Schedule is then complete.' },
  { id:'P4', label:'15mo, healthy, no prior PCV', dob:'2025-07-17', riskIds:[], pcvDoses:[], ppsv23Doses:[],
    cdc:'Give 2 doses of PCV, 8 weeks apart. Schedule is then complete.' },
  { id:'P5', label:'2mo, healthy, no prior PCV', dob:'2026-08-17', riskIds:[], pcvDoses:[], ppsv23Doses:[],
    cdc:'Give 4 doses of PCV: three doses, preferably 8 weeks apart (minimum 4 week intervals), then last dose between 12 through 15 months (at least 8 weeks after third dose). Schedule is then complete.' },
  { id:'P6', label:'10y, healthy, no prior PCV', dob:'2016-10-17', riskIds:[], pcvDoses:[], ppsv23Doses:[],
    cdc:'No vaccine recommended at this time. Check this app when your patient turns 50 years old.' },
  { id:'P7', label:'2y, asplenia (IC), nothing given', dob:'2024-10-17', riskIds:['asplenia'], pcvDoses:[], ppsv23Doses:[],
    cdc:'Give 2 doses of PCV at least 8 weeks apart. If at least 1 dose of PCV20 was given at any age, schedule is complete. If not, give 1 dose of either PCV20 or PPSV23 at least 8 weeks after last dose of PCV. If PPSV23 was given, administer either 1 dose of PCV20 or a second dose of PPSV23 5 years after the first dose of PPSV23.' },
  { id:'P8', label:'4y, asplenia (IC), 2 PCV13 in infancy', dob:'2022-10-17', riskIds:['asplenia'], pcvDoses:[P('PCV13','2022-12-17'),P('PCV13','2023-02-17')], ppsv23Doses:[],
    cdc:'Give 2 more doses of PCV: next dose given today, then last dose at least 8 weeks later. Then 1 dose of either PCV20 or PPSV23 at least 8 weeks after last PCV; if PPSV23 was given, a second PPSV23 or PCV20 5 years after the first PPSV23.' },
  { id:'P9', label:'8y, chronic heart disease, nothing given', dob:'2018-10-17', riskIds:['chronic_heart'], pcvDoses:[], ppsv23Doses:[],
    cdc:'Give 1 dose of PCV. If PCV20 was given, schedule is then complete. If PCV15 was given, administer 1 dose of PPSV23 at least 8 weeks later. (Footnote: PCV15 or PCV20 should be administered regardless of prior PCV7 receipt.)' },
  { id:'P10', label:'8y, asplenia (IC), PCV13 series in infancy + PPSV23 one year ago', dob:'2018-10-17', riskIds:['asplenia'], pcvDoses:[P('PCV13','2018-12-17'),P('PCV13','2019-02-17'),P('PCV13','2019-04-17')], ppsv23Doses:[S('2025-10-17')],
    cdc:'If at least 1 dose of PCV20 was given at any age, schedule is complete. If not, give either 1 dose of PCV20 or a second dose of PPSV23 5 years after the first dose of PPSV23.' },
  { id:'P11', label:'8y, chronic heart disease, PCV13 series + PPSV23 (CONTROL for P10)', dob:'2018-10-17', riskIds:['chronic_heart'], pcvDoses:[P('PCV13','2018-12-17'),P('PCV13','2019-02-17'),P('PCV13','2019-04-17')], ppsv23Doses:[S('2025-10-17')],
    cdc:'Schedule complete.' },

  // ───────────── ADULTS ─────────────
  { id:'A1', label:'30y, no risk factors, nothing given', dob:'1996-10-17', riskIds:[], pcvDoses:[], ppsv23Doses:[],
    cdc:'No vaccine recommended at this time. Check this app when your patient turns 50 years old.' },
  { id:'A2', label:'30y, HIV (IC), nothing given', dob:'1996-10-17', riskIds:['hiv'], pcvDoses:[], ppsv23Doses:[],
    cdc:'Give one dose of PCV15, PCV20, or PCV21. If PCV15 is used, follow with PPSV23. The recommended interval between PCV15 and PPSV23 is at least 1 year. The minimum interval is 8 weeks and can be considered in adults with immunocompromising conditions, cochlear implants, or CSF leaks. Check this app when your patient turns 50.' },
  { id:'A3', label:'30y, diabetes (chronic only), nothing given — SAME CDC PATH AS A2', dob:'1996-10-17', riskIds:['diabetes'], pcvDoses:[], ppsv23Doses:[],
    cdc:'[identical to A2 — PneumoRecs asks one yes/no question covering every risk condition at 19-49 and cannot tell these two patients apart]' },
  { id:'A4', label:'40y, HIV (IC), PCV15 two months ago', dob:'1986-10-17', riskIds:['hiv'], pcvDoses:[P('PCV15','2026-08-17')], ppsv23Doses:[],
    cdc:'Give one dose of PPSV23 to complete their pneumococcal vaccinations. The recommended interval between PCV15 and PPSV23 is at least 1 year. The minimum interval is 8 weeks and can be considered in adults with immunocompromising conditions, cochlear implants, or CSF leaks.' },
  { id:'A5', label:'55y, no risk, PCV15 two months ago (CONTROL for A4)', dob:'1971-10-17', riskIds:[], pcvDoses:[P('PCV15','2026-08-17')], ppsv23Doses:[],
    cdc:'Give one dose of PPSV23 to complete their pneumococcal vaccinations. The recommended interval between PCV15 and PPSV23 is at least 1 year. The minimum interval is 8 weeks and can be considered in adults with immunocompromising conditions, cochlear implants, or CSF leaks.' },
  { id:'A6', label:'30y, HIV (IC), PPSV23 one year ago, no PCV', dob:'1996-10-17', riskIds:['hiv'], pcvDoses:[], ppsv23Doses:[S('2025-10-17')],
    cdc:'Give one dose of PCV15, PCV20, or PCV21 at least 1 year after their last dose of PPSV23. Regardless of which vaccine is used, their pneumococcal vaccinations are complete. Check this app when your patient turns 50.' },
  { id:'A7', label:'55y, no risk, nothing given', dob:'1971-10-17', riskIds:[], pcvDoses:[], ppsv23Doses:[],
    cdc:'Give one dose of PCV15, PCV20, or PCV21. If PCV20 or PCV21 is used, complete. If PCV15 is used, follow with PPSV23. Recommended interval at least 1 year; minimum interval 8 weeks can be considered in adults with immunocompromising conditions, cochlear implants, or CSF leaks.' },
  { id:'A8', label:'60y, no risk, PCV20 last year', dob:'1966-10-17', riskIds:[], pcvDoses:[P('PCV20','2025-10-17')], ppsv23Doses:[],
    cdc:'Their pneumococcal vaccinations are complete.' },
  { id:'A9', label:'60y, no risk, PCV13 six years ago, no PPSV23', dob:'1966-10-17', riskIds:[], pcvDoses:[P('PCV13','2020-10-17')], ppsv23Doses:[],
    cdc:'Give one dose of PCV20 or PCV21 at least 1 year after PCV13. Regardless of which vaccine is used, their pneumococcal vaccinations are complete.' },
  { id:'A10', label:'60y, no risk, PPSV23 two years ago, no PCV', dob:'1966-10-17', riskIds:[], pcvDoses:[], ppsv23Doses:[S('2024-10-17')],
    cdc:'Give one dose of PCV15, PCV20, or PCV21 at least 1 year after the last dose of PPSV23. Regardless of which vaccine is used, their pneumococcal vaccinations are complete.' },
  { id:'A11', label:'70y, PCV13 at 58 + PPSV23 at 60 (both before 65)', dob:'1956-10-17', riskIds:[], pcvDoses:[P('PCV13','2014-10-17')], ppsv23Doses:[S('2016-10-17')],
    cdc:'Give one dose of PCV20 or PCV21 at least 5 years after the last pneumococcal vaccine dose. Regardless of which is used, their pneumococcal vaccinations are complete.' },
  { id:'A12', label:'70y, PCV13 at 58 + PPSV23 at 66 (at/after 65)', dob:'1956-10-17', riskIds:[], pcvDoses:[P('PCV13','2014-10-17')], ppsv23Doses:[S('2022-10-17')],
    cdc:'Based on shared clinical decision-making, decide whether to administer one dose of PCV20 or PCV21 at least 5 years after the last pneumococcal vaccine dose. Regardless of whether it is administered, their pneumococcal vaccinations are complete.' },
];

function render(r) {
  if (r.excluded) return ['EXCLUDED: ' + (r.exclusionMessage ?? '').slice(0, 120)];
  const out = (r.recs ?? []).map((rec) => {
    const note = typeof rec.note === 'string' ? rec.note
      : rec.note ? `${rec.note.lead ?? ''} ${rec.note.detail ?? ''}` : '';
    const mi = rec.minIntervalDays ? ` [min ${rec.minIntervalDays}d]`
      : rec.minIntervalMonths ? ` [min ${rec.minIntervalMonths}mo]` : '';
    return `${rec.vaccine} · ${rec.status}${mi} — ${rec.doseLabel ?? ''}${note ? ' // ' + note.replace(/\s+/g, ' ').trim() : ''}`;
  });
  const flags = [];
  for (const d of (r.perDose?.pcv ?? [])) if (d.status !== 'counted') flags.push(`PCV dose ${d.status}: ${(d.reasons ?? []).join('; ')}`);
  for (const d of (r.perDose?.ppsv23 ?? [])) if (d.status !== 'counted') flags.push(`PPSV23 dose ${d.status}: ${(d.reasons ?? []).join('; ')}`);
  return out.concat(flags.length ? ['  (recorded-dose flags) ' + flags.join(' | ')] : []);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const c of CASES) {
    const r = recommend({ dob: c.dob, riskIds: c.riskIds, pcvDoses: c.pcvDoses, ppsv23Doses: c.ppsv23Doses, today: TODAY });
    console.log('\n' + '━'.repeat(100));
    console.log(`${c.id}  ${c.label}   (DOB ${c.dob})`);
    console.log('  PneumoRecs: ' + c.cdc);
    console.log('  PneumoVax :');
    for (const line of render(r)) console.log('      ' + line);
  }
}
