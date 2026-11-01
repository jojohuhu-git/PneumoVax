// ── P2-1, grey-zone audit of 2026-11-01 (owner: "agree with fixing") ────
//
// G31: 49 years 11 months, HIV, PCV15 on 2026-10-11. Her 19-49 card advised
// PPSV23 from 2026-12-06 (8 weeks). She turns 50 on 2026-11-29, and on 12-06
// the 50+ card says "≥1 year … from 2027-10-11", with 8 weeks an option that
// may be considered. Neither card is wrong by ACIP's wording, but the date she
// was given appeared to move. The fix agreed was ONE SENTENCE, not a new date:
// the 19-49 card says she turns 50 first, and what the wording is from then.
// No date moves — extending 8 weeks as ADVICE to 50+ is what the owner
// declined on 2026-10-16.

import { describe, it, expect } from 'vitest';
import { recommend } from '../recommend.js';

const TODAY = '2026-11-01';
const card = (p) => recommend({ today: TODAY, ...p }).recs[0];
const LINE = 'This patient turns 50 on Nov 29, 2026, before that date. From age 50, ACIP advises ≥1 year after the PCV15, with 8 weeks an option that may be considered [c] — so the date above stays an option, and from that birthday the card shows the 1-year date.';

const G31 = { dob: '1976-11-29', riskIds: ['hiv'], pcvDoses: [{ product: 'PCV15', date: '2026-10-11' }], ppsv23Doses: [] };

describe('P2-1: the 8-week date that falls after the 50th birthday says so', () => {
  it('G31', () => {
    const r = card(G31);
    expect(r.earliestNextDate).toBe('2026-12-06');           // unchanged
    expect(r.note.detail).toContain(LINE);
    expect(r.noteCites.at(-1).key).toBe('adultPcv15ThenPpsv');
    expect((`${r.note.lead} ${r.note.detail}`.match(/\[c\]/g) || []).length).toBe(r.noteCites.length);
  });

  it('CONTROL: a 45-year-old with the same history — nothing added', () => {
    expect(card({ ...G31, dob: '1981-11-29' }).note.detail).not.toContain('turns 50');
  });

  it('CONTROL: chronic only (the 1-year rule already) — nothing added', () => {
    expect(card({ ...G31, riskIds: ['diabetes'] }).note.detail).not.toContain('turns 50');
  });

  it('CONTROL: the 8-week date falls before the birthday — nothing added', () => {
    expect(card({ ...G31, pcvDoses: [{ product: 'PCV15', date: '2026-09-01' }] }).note.detail).not.toContain('turns 50');
  });
});
