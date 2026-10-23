// ─────────────────────────────────────────────────────────────────────────
// rule-docs-match-code.test.js — P2-7 + P7-1 (S8, 2026-10-11).
//
// THE DOCUMENT-VERSUS-CODE TRIPWIRE.
//
// `CLINICAL_SPEC.md` is this app's RULEBOOK (owner decision, S8, 2026-10-11):
// the one document that states every clinical rule the engine implements, with
// its source. `docs/agent/clinical-rules.md` is the agent-facing companion. Both
// have, until now, carried an honour-system promise that whoever changes a rule
// updates them in the same pull request.
//
// That promise failed four times in one week, all on the same rule. The adult
// PCV15→PPSV23 interval was amended by the owner (A-P1-1) and the superseded
// version — risk-class-keyed, naming a function that no longer existed — was
// still being described in `docs/agent/testing.md` (found in S13),
// `docs/agent/clinical-rules.md` in BOTH its prose and its summary table, and
// `docs/agent/architecture.md` twice (all three found in S3). Four copies of a
// rule the code had stopped implementing, each one readable as current.
//
// So the numbers stop being a promise and become an assertion.
//
// ── How this works, and why it is a TABLE and not prose ──────────────────
//
// Since S14-7 every gap-between-recorded-doses rule lives in one machine-
// readable table, `DOSE_INTERVAL_RULES`. This test parses the matching table
// out of the rulebook and compares the two **field by field, row by row**.
// A prose tripwire asks "does the document mention 8 weeks somewhere near this
// rule's name?", which is loose in both directions: it passes on a document
// that happens to contain the right number for the wrong reason, and it fails
// on a harmless rewording — and a documentation rule that fails on rewording is
// a rule people learn to delete. Comparing two tables has neither problem.
//
// Every expected value below is READ OUT OF THE CODE. Nothing in this file
// hardcodes an interval. Change a rule and the expected cell changes with it,
// so the test fails until the rulebook is corrected, and the failure message
// names the row, the field, and both values.
//
// ── What this does NOT do ────────────────────────────────────────────────
//
// It does not judge whether a rule is clinically RIGHT. That is the owner's
// review, `CLINICAL_SPEC.md`'s citations, and the `verify-clinical-source`
// procedure. This only guarantees that the rulebook and the code tell the same
// story — and, through the sweep harness, that a change to the code cannot move
// thousands of patients' verdicts without someone seeing it.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { DOSE_INTERVAL_RULES } from '../doseIntervalRules.js';
import {
  GRACE_DAYS,
  PCV_MIN_INTERVAL_DAYS_UNDER_12M,
  PCV_MIN_INTERVAL_DAYS_FROM_12M,
} from '../intervals.js';

const SPEC_PATH = 'CLINICAL_SPEC.md';
const CLINICAL_PATH = 'docs/agent/clinical-rules.md';

const read = (rel) => readFileSync(new URL(`../../../${rel}`, import.meta.url), 'utf8');

const spec = read(SPEC_PATH);
const clinical = read(CLINICAL_PATH);

// Normalise so a line wrap, a non-breaking space or an en-dash never decides
// whether a rule is documented.
const norm = (s) => s
  .replace(/[‐-―]/g, '-')
  .replace(/ /g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// A failure should tell a clinician what to do, not just what did not match.
const why = (what) =>
  `${SPEC_PATH} no longer matches the code: ${what}\n\n`
  + 'CLINICAL_SPEC.md is this app\'s rulebook, and the code is the behaviour patients '
  + 'actually see — so normally the document is what needs fixing. If instead the CODE '
  + 'change was the mistake, fix that. Either way the two must agree before this merges.\n'
  + 'If you added or removed a rule row, update the "The rule table, row by row" table '
  + 'in CLINICAL_SPEC.md section K to match, and re-run.';

// ── Expected cell values, every one DERIVED FROM THE CODE ────────────────

const weeks = (d) => (d % 7 === 0 ? `>=${d / 7} weeks` : `>=${d} days`);
const months = (m) => (m % 12 === 0
  ? `>=${m / 12} year${m / 12 === 1 ? '' : 's'}`
  : `>=${m} months`);

/**
 * The minimum gap this row enforces, spelled the one way the rulebook spells it.
 *
 * Derived, never hardcoded: if someone changes a row from 12 months to 24, the
 * string this returns becomes ">=2 years" and the rulebook's ">=1 year" stops
 * matching. That is the whole mechanism.
 */
function canonicalGap(rule) {
  const iv = rule.interval;
  if (iv == null) return 'none stated';
  if (typeof iv.daysFrom === 'function') {
    // The paediatric PCV series. Until 2026-10-23 this row's minimum depended
    // only on the age at the dose the gap is measured FROM, and two halves were
    // enough to state it. It is now CDC's Catch-up Table 2 — which keys the
    // cell on the DOSE NUMBER as well as two ages — so the cell is derived by
    // probing every branch the function has, one representative patient each.
    //
    // Still derived, never hardcoded, which is the whole mechanism: change any
    // branch and this string changes, and §K stops matching until it is
    // corrected. A single summary phrase would have been shorter and would
    // have gone on matching while a branch quietly moved.
    const probe = (label, ctx) => `${label}: ${weeks(iv.daysFrom(ctx.anchor, ctx.ctx))}`;
    return [
      probe('dose 2 after a dose under 12 months',
        { anchor: { ageAtDose: 6 }, ctx: { doseNumber: 2, ageAtDose: 7, anyPriorDoseBefore12: true } }),
      probe('dose 2 after a dose from 12 months',
        { anchor: { ageAtDose: 18 }, ctx: { doseNumber: 2, ageAtDose: 19, anyPriorDoseBefore12: false } }),
      probe('dose 3 under 12 months after a dose under 7 months',
        { anchor: { ageAtDose: 6 }, ctx: { doseNumber: 3, ageAtDose: 7, anyPriorDoseBefore12: true } }),
      probe('dose 3 after a dose at 7-11 months',
        { anchor: { ageAtDose: 9 }, ctx: { doseNumber: 3, ageAtDose: 10, anyPriorDoseBefore12: true } }),
      probe('dose 4+ given under 12 months',
        { anchor: { ageAtDose: 4 }, ctx: { doseNumber: 4, ageAtDose: 5, anyPriorDoseBefore12: true } }),
      probe('dose 4+ given from 12 months',
        { anchor: { ageAtDose: 10 }, ctx: { doseNumber: 4, ageAtDose: 13, anyPriorDoseBefore12: true } }),
    ].join('; ');
  }
  if (iv.days != null) return weeks(iv.days);
  return months(iv.months);
}

/** Every field of a code row, as the rulebook's seven columns. */
function expectedRow(rule) {
  return {
    id: rule.id,
    rulebook: rule.rulebook,
    vaccine: rule.vaccine,
    from: rule.from,
    gap: canonicalGap(rule),
    enforcement: rule.enforcement,
    authority: rule.authority,
  };
}

// ── Parsing the rulebook's table ─────────────────────────────────────────

const CELL_JUNK = /[`*_]/g;

/**
 * Pull the rule table out of CLINICAL_SPEC.md.
 *
 * Keyed on the heading, not on line numbers, so the section can move. Only rows
 * whose first cell is a known rule id are taken, so the header and separator
 * rows are ignored without having to count them.
 */
function parseSpecTable(doc) {
  const anchor = doc.indexOf('The rule table, row by row');
  if (anchor === -1) return null;
  const after = doc.slice(anchor);
  const rows = [];
  for (const line of after.split('\n')) {
    const t = line.trim();
    if (!t.startsWith('|')) {
      // Stop at the first non-table line AFTER the table has begun, so a later
      // table elsewhere in the document cannot be read as part of this one.
      if (rows.length) break;
      continue;
    }
    const cells = t.replace(/^\|/, '').replace(/\|$/, '').split('|')
      .map((c) => norm(c.replace(CELL_JUNK, '')));
    if (cells.length < 7) continue;
    // A rule id is SHOUTING-KEBAB and must START with a letter — which is how the
    // `|---|---|` separator row gets skipped. Matching `[A-Z0-9-]+` alone let the
    // separator through as a rule called "---".
    if (!/^[A-Z][A-Z0-9-]*[A-Z0-9]$/.test(cells[0])) continue; // header / separator row
    rows.push({
      id: cells[0],
      rulebook: cells[1],
      vaccine: cells[2],
      from: cells[3],
      gap: cells[4],
      enforcement: cells[5],
      authority: cells[6],
    });
  }
  return rows;
}

const specRows = parseSpecTable(spec);

describe('P2-7: the rulebook has a rule table at all', () => {
  it('CLINICAL_SPEC.md contains the row-by-row rule table this test reads', () => {
    expect(specRows, why(
      'it has no section headed "The rule table, row by row". That table IS the rulebook\'s '
      + 'statement of every gap-between-recorded-doses rule, and without it nothing holds '
      + 'the prose to the code.'
    )).not.toBeNull();
    expect(specRows.length, why('its rule table is empty.')).toBeGreaterThan(0);
  });
});

describe('P2-7: the rulebook lists exactly the rules the code implements', () => {
  it('no rule is implemented but undocumented, and none documented but unimplemented', () => {
    const inCode = DOSE_INTERVAL_RULES.map((r) => r.id).sort();
    const inDoc = specRows.map((r) => r.id).sort();

    const undocumented = inCode.filter((id) => !inDoc.includes(id));
    const unimplemented = inDoc.filter((id) => !inCode.includes(id));

    expect(undocumented, why(
      `these rules are in DOSE_INTERVAL_RULES but in no row of the rulebook's table: `
      + `${undocumented.join(', ')}. A rule the rulebook does not mention is a rule nobody `
      + 'can review — and an `enforcement: \'none\'` row that goes unmentioned reads as an '
      + 'oversight rather than the decision it is.'
    )).toEqual([]);
    expect(unimplemented, why(
      `the rulebook's table has rows for rules the code does not implement: `
      + `${unimplemented.join(', ')}. Either the row is stale, or a rule was deleted from `
      + 'the code and the rulebook was not told.'
    )).toEqual([]);
  });

  it('the table has no duplicate rows', () => {
    const ids = specRows.map((r) => r.id);
    expect(ids.length, why('its rule table lists the same rule id more than once.'))
      .toBe(new Set(ids).size);
  });
});

describe('P2-7: every field of every rule matches the rulebook, cell by cell', () => {
  // One `it` per rule, so a failure names the rule in the test title rather than
  // burying it in one giant assertion. The expectation is built from the code.
  for (const rule of DOSE_INTERVAL_RULES) {
    it(`${rule.id} is documented exactly as implemented`, () => {
      const want = expectedRow(rule);
      const got = specRows.find((r) => r.id === rule.id);
      expect(got, why(`${rule.id} has no row in the rule table.`)).toBeDefined();

      for (const field of ['rulebook', 'vaccine', 'from', 'gap', 'enforcement', 'authority']) {
        expect(got[field], why(
          `${rule.id}'s "${field}" reads "${got[field]}" in the rulebook but the code says `
          + `"${want[field]}".`
          + (field === 'gap'
            ? ' This is the number a clinician reads off the document to check the app — a '
              + 'document that states the wrong minimum is worse than one that states none.'
            : '')
          + (field === 'authority'
            ? ' Remember that EVERY adult floor is an owner clinical determination dated '
              + '2026-10-11 and may never be attributed to ACIP or CDC.'
            : '')
        )).toBe(want[field]);
      }
    });
  }
});

describe('P2-7: the invariants the rulebook states in words hold in the code', () => {
  // These are the claims CLINICAL_SPEC.md section K and CLAUDE.md make in prose.
  // Asserting them against the code means the prose cannot quietly become false.
  it('every adult floor is an OWNER determination, never CDC\'s', () => {
    const misattributed = DOSE_INTERVAL_RULES
      .filter((r) => r.rulebook === 'adult' && r.enforcement === 'floor' && r.authority !== 'OWNER')
      .map((r) => r.id);
    expect(misattributed, why(
      `these adult rows void a dose but claim an authority other than OWNER: `
      + `${misattributed.join(', ')}. CLAUDE.md and CLINICAL_SPEC.md section K both state that `
      + 'no adult floor is ACIP\'s or CDC\'s: rr7203a1 says 8 weeks "can be considered", and '
      + 'CDSI v4.64 sets absMinInt = 0 days for every adult pneumococcal interval. Treating '
      + 'an adult interval as a floor is the owner\'s determination of 2026-10-11, and the '
      + 'app\'s own per-dose text says so. Citing CDC for it would make the app misstate its '
      + 'own source to a clinician.'
    )).toEqual([]);
  });

  it('every floor that DOES cite CDC is a paediatric one', () => {
    const notChild = DOSE_INTERVAL_RULES
      .filter((r) => r.enforcement === 'floor' && r.authority === 'CDC' && r.rulebook !== 'child')
      .map((r) => r.id);
    expect(notChild, why(
      `these rows cite CDC for a floor but are not on the child schedule: ${notChild.join(', ')}. `
      + 'The three paediatric rows are the only ones whose source states the gap as a minimum '
      + 'in so many words.'
    )).toEqual([]);
  });

  it('a rule that is never flagged states no interval, so the field cannot mislead', () => {
    // Found by the S8 mutation sweep: an `enforcement: 'none'` row's interval is
    // never read, so a number put there is inert — it looks like a rule and is
    // not one. A later reader could "fix" the enforcement and silently switch on
    // whatever number had been sitting in the field.
    const inert = DOSE_INTERVAL_RULES
      .filter((r) => r.enforcement === 'none' && r.interval != null)
      .map((r) => r.id);
    expect(inert, why(
      `these rows are never flagged yet carry an interval: ${inert.join(', ')}. The interval `
      + 'on such a row is dead code that reads as a live rule. Leave it null and put the '
      + 'reason in `source`.'
    )).toEqual([]);
  });

  it('every row that voids a dose gets CDC\'s grace, and no row that only advises does', () => {
    const wrong = DOSE_INTERVAL_RULES
      .filter((r) => (r.enforcement === 'floor') !== (r.grace === true))
      .map((r) => `${r.id} (enforcement: ${r.enforcement}, grace: ${r.grace})`);
    expect(wrong, why(
      `the grace and the enforcement disagree on these rows: ${wrong.join('; ')}. CDC's `
      + `${GRACE_DAYS}-day grace governs whether a dose that missed a MINIMUM still counts. A `
      + 'floor voids a dose, so the grace applies to it; a recommendation voids nothing, so '
      + 'there is nothing for the grace to rescue and a day short of the year is a day short.'
    )).toEqual([]);
  });

  it('the paediatric series minimum really is CDC Table 2, both numbers reachable', () => {
    // Guards the derivation in canonicalGap() above: if these two constants ever
    // collapse into one, the generated cell would still be generated and would
    // still match, while the rule it describes had quietly become a single flat
    // interval. Anti-vacuity for the cell, in other words.
    expect(PCV_MIN_INTERVAL_DAYS_UNDER_12M).not.toBe(PCV_MIN_INTERVAL_DAYS_FROM_12M);
    const childSeries = DOSE_INTERVAL_RULES.find((r) => r.id === 'CHILD-PCV-AFTER-PCV');
    const at = (anchorAge, ctx) => childSeries.interval.daysFrom({ ageAtDose: anchorAge }, ctx);
    // Dose 2 keys on the age at the EARLIER dose, which is the half of the old
    // two-step rule that survives unchanged.
    expect(at(6, { doseNumber: 2, ageAtDose: 7 })).toBe(PCV_MIN_INTERVAL_DAYS_UNDER_12M);
    expect(at(18, { doseNumber: 2, ageAtDose: 19 })).toBe(PCV_MIN_INTERVAL_DAYS_FROM_12M);
    // Dose 3 is where the old rule was WRONG — 4 weeks whenever the earlier
    // dose was under 12 months, where CDC asks 8 once that dose fell at 7-11
    // months. This pair is the owner's 2026-10-23 decision, in one assertion.
    expect(at(6, { doseNumber: 3, ageAtDose: 7, anyPriorDoseBefore12: true }))
      .toBe(PCV_MIN_INTERVAL_DAYS_UNDER_12M);
    expect(at(9, { doseNumber: 3, ageAtDose: 10, anyPriorDoseBefore12: true }))
      .toBe(PCV_MIN_INTERVAL_DAYS_FROM_12M);
    // Dose 4+ keys on the age at which THIS dose is given, because CDC's "8
    // weeks (as final dose)" is the >=12-month booster — the owner's ruling on
    // the extra infant dose, also 2026-10-23.
    expect(at(4, { doseNumber: 4, ageAtDose: 5, anyPriorDoseBefore12: true }))
      .toBe(PCV_MIN_INTERVAL_DAYS_UNDER_12M);
    expect(at(10, { doseNumber: 4, ageAtDose: 13, anyPriorDoseBefore12: true }))
      .toBe(PCV_MIN_INTERVAL_DAYS_FROM_12M);
  });
});

describe('P2-7: the agent-facing document does not contradict the rulebook', () => {
  // docs/agent/clinical-rules.md deliberately does NOT repeat all sixteen rows —
  // a second full copy is the drift mechanism this whole item exists to remove.
  // It may mention any rule it likes; what it may not do is state a different
  // minimum from the one the code enforces.
  const normalisedClinical = norm(clinical);

  for (const rule of DOSE_INTERVAL_RULES) {
    if (!normalisedClinical.includes(rule.id)) continue;
    it(`${rule.id}, which clinical-rules.md mentions, is not given a different minimum there`, () => {
      const gap = canonicalGap(rule);
      if (gap === 'none stated') return; // nothing numeric to contradict
      // Accept any spelling of the SAME number; reject a different number.
      const n = gap.match(/\d+/)[0];
      const unit = gap.includes('week') ? 'week' : gap.includes('year') ? 'year' : 'month';
      const line = normalisedClinical;
      const idAt = line.indexOf(rule.id);
      const window = line.slice(Math.max(0, idAt - 400), idAt + rule.id.length + 400);
      const numbers = [...window.matchAll(/(\d+)[- ]?(week|month|year)/g)]
        .map((m) => `${m[1]} ${m[2]}`);
      // If it states any interval near this rule at all, the code's own must be among them.
      if (numbers.length === 0) return;
      expect(
        numbers.some((x) => x === `${n} ${unit}`),
        `${CLINICAL_PATH} states an interval near ${rule.id} that the code does not use.\n\n`
        + `The code enforces ${gap.replace('>=', 'at least ')}. Nearby that rule's name the `
        + `document mentions: ${numbers.join(', ')}. One of them should be the code's number.\n`
        + 'This is the exact failure S3 found four copies of: a superseded interval left '
        + 'behind in an agent-facing document, still readable as current.'
      ).toBe(true);
    });
  }
});

describe('P2-7: no document names a function or constant the code no longer has', () => {
  // The four stale copies of the pre-A-P1-1 adult interval all shared one tell:
  // each named `adultPpsvIntervalClass()`, a function that had been deleted
  // weeks earlier. The rule they described was gone from the code, and the name
  // they used to describe it was gone too — so a document that mentions an
  // identifier `src/` does not contain is, on this repo's own evidence, the
  // single best signal that it is describing superseded behaviour.
  //
  // This check is deliberately wider than the interval rules: it covers every
  // agent-facing document and every identifier they name.
  const DOCS = [
    SPEC_PATH,
    CLINICAL_PATH,
    'docs/agent/architecture.md',
    'docs/agent/testing.md',
    'CLAUDE.md',
  ];

  /**
   * Names that are GONE from the code and may still be written down, because
   * the sentence mentioning them is explaining that they are gone.
   *
   * Adding a name here is a deliberate act. It does not license describing the
   * old behaviour as current: every mention must still sit next to words that
   * frame it as history, which is asserted below.
   */
  const RETIRED_IDENTIFIERS = new Set([
    // Deleted when the owner amended the adult PCV15->PPSV23 interval (A-P1-1,
    // 2026-10-10). Its risk-class-keyed rule outlived it in four documents.
    'adultPpsvIntervalClass',
    // N2 (2026-10-16): the first real catch from fixing this guard's own two
    // holes. `pcvHistoryProductsFor` was removed by `PCV21-OFFLABEL`
    // (2026-10-15); its only mentions left in `src/` are comments explaining
    // that it is gone, which hole (b) — comments counting toward "still
    // exists" — had been treating as proof it was still there. testing.md's
    // S6-2 row describes it entirely in the past tense already.
    'pcvHistoryProductsFor',
    // 2026-10-16, hole (c)'s first catches. Both appear in `src/` only inside
    // comments, which `codeOnly()` strips, so both read as deleted -- and for
    // `offWindow` that is exactly right.
    //
    // `offWindow` was never shipped: S14-3 (owner decision 2026-10-11) chose
    // `earlyAdvisory` instead, and three documents plus two source comments
    // record the rejection so nobody renames it back. A name discussed as the
    // road not taken is history in the sense that matters here.
    'offWindow',
    // The three post-transplant citation keys, deleted from refs.js on
    // 2026-10-16 when the transplant tick became a hard stop and the app
    // stopped stating a schedule to cite. They are named in
    // `docs/agent/testing.md` and in this file's own hole-(c) comment as the
    // precise miss that widening the regex was meant to catch, and in
    // `docs/archive/retired-2026-10-16-post-transplant-pneumococcal-schedules.md`
    // with the schedules themselves. Every mention frames them as gone, which
    // the HISTORY_FRAMING check below enforces.
    'fredHutchLTFU',
    'p3086Table5',
    'ascoAdultCancer2024',
  ]);

  /**
   * Names that are not this repo's to own: browser and platform APIs. They
   * will never appear in `src/` as code, so without this they read as
   * "deleted" forever -- the one false-positive class hole (c)'s backticked
   * camelCase shape introduced. Keep it to genuine platform APIs; anything
   * this repo wrote belongs in RETIRED_IDENTIFIERS with its history, or in the
   * code.
   */
  const PLATFORM_IDENTIFIERS = new Set([
    // refs.js's verification procedure turns on the difference between these
    // two: CDC pages must be read with `textContent`, because `innerText`
    // silently omits collapsed accordion content and makes a live-read
    // citation check pass or fail on invisible text.
    'innerText',
    'textContent',
  ]);

  const HISTORY_FRAMING = /no longer|used to|deleted|removed|superseded|replaced|before (the|it|this)|which no longer exists|stale|the rule from BEFORE/i;

  // N2 (2026-10-16): comments stripped before a source file joins `srcText`,
  // the same shape as the `codeOnly()` helper several component tests already
  // use. Without this, a tombstone comment left behind when a function is
  // deleted — "// adultPpsvIntervalClass() used to..." — kept that name
  // "existing" in `src/` by this guard's own loose `.includes()` check, which
  // is hole (b): this session's own S7 work left exactly that shape behind
  // (a mutation's "// MUTATED for S7 guard proof" comment, restored before
  // commit, but the pattern is the same one that let the pre-A-P1-1 adult
  // interval's tombstone comment count as "still in the code").
  const codeOnly = (src) => {
    const blank = (m) => m.replace(/[^\n]/g, '');
    return src
      .replace(/\/\*[\s\S]*?\*\//g, blank)
      .replace(/^\s*\/\/.*$/gm, blank)
      .replace(/\s+\/\/.*$/gm, '');
  };

  const srcText = (() => {
    // Read every source file once; an identifier "exists" if it appears
    // anywhere in src/ or scripts/, which is deliberately loose — this test
    // is hunting names that are entirely gone, not auditing export lists.
    //
    // P2-13 (2026-10-15): `scripts/` was added after `HSCT_CASES` — exported
    // the same session, and genuinely current — read as deleted, because the
    // walk only ever covered `src/`. `docs/agent/testing.md` documents the
    // comparison harnesses in `scripts/` by name now, so the identifiers this
    // guard checks against have to include that folder too.
    const walk = (dirUrl) => {
      const out = [];
      for (const entry of readdirSync(dirUrl, { withFileTypes: true })) {
        if (entry.name === '__corpus__') continue;
        const child = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dirUrl);
        if (entry.isDirectory()) out.push(...walk(child));
        else if (/\.(js|jsx|mjs)$/.test(entry.name)) out.push(codeOnly(readFileSync(child, 'utf8')));
      }
      return out;
    };
    return [
      ...walk(new URL('../../', import.meta.url)),
      ...walk(new URL('../../../scripts/', import.meta.url)),
    ].join('\n');
  })();

  for (const path of DOCS) {
    it(`${path} names no identifier that has been deleted from src/`, () => {
      const doc = read(path);
      // N2 (2026-10-16), hole (a): these used to require backticks —
      // `` `name()` `` / `` `NAME` `` — so a bare mention named nothing to
      // this guard. Backticks are no longer required for the function-call
      // shape (a word immediately followed by `()` is essentially always a
      // real identifier, quoted or not). The ALL-CAPS shape instead now
      // requires an underscore when bare: PneumoVax's own constants
      // (`ADULT_SCHED_MIN_M`, `PCV21_MIN_AGE_M`, `ROUTINE_ADULT_MIN_M`, …)
      // all have one, while the plain clinical acronyms these documents are
      // full of (PCV21, HSCT, ACIP, CDC, CSF) never do — so this still
      // cannot fire on ordinary prose. A bare ALL-CAPS name with NO
      // underscore stays backtick-only, same as before.
      //
      // 2026-10-16, hole (c): a BACKTICKED camelCase name with no `()` named
      // nothing either — not a function call, not ALL-CAPS. That is the shape
      // of every `refs.js` key, and it is exactly how this guard missed the
      // transplant deletion: `CLINICAL_SPEC.md` went on naming
      // `` `fredHutchLTFU` `` and `` `p3086Table5` `` after both were deleted
      // from refs.js, with the whole suite green. Backticks are required for
      // this shape (unlike the `()` one) because unbackticked camelCase in
      // prose is ordinary English — "riskIds", yes, but also any camelCase a
      // sentence happens to contain — and the backticks are what mark it as a
      // code identifier. Three characters minimum, and at least one inner
      // capital, so a backticked ordinary word (`` `note` ``, `` `adult` ``)
      // is not treated as an identifier.
      const named = new Set([
        ...[...doc.matchAll(/\b([a-z][a-zA-Z0-9_]{3,})\(\)/g)].map((m) => m[1]),
        ...[...doc.matchAll(/`([A-Z][A-Z0-9_]{4,})`/g)].map((m) => m[1]),
        ...[...doc.matchAll(/\b([A-Z][A-Z0-9]*_[A-Z0-9_]*)\b/g)].map((m) => m[1]),
        ...[...doc.matchAll(/`([a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*)`/g)].map((m) => m[1]),
      ]);

      const gone = [...named].filter((n) => !srcText.includes(n));
      const unexplained = gone
        .filter((n) => !RETIRED_IDENTIFIERS.has(n))
        .filter((n) => !PLATFORM_IDENTIFIERS.has(n));

      expect(
        unexplained,
        `${path} names ${unexplained.join(', ')}, which no longer appears anywhere in src/.\n\n`
        + 'On this repo\'s own history that almost always means the surrounding text is '
        + 'describing behaviour the code has stopped implementing — the pre-A-P1-1 adult '
        + 'interval survived in FOUR documents exactly this way, each one naming a function '
        + 'that had already been deleted.\n\n'
        + 'Fix the text. If the name is genuinely being discussed AS history, add it to '
        + 'RETIRED_IDENTIFIERS in this file and make sure the sentence says it is gone.'
      ).toEqual([]);

      // A retired name may only appear in a sentence that frames it as retired.
      // Platform APIs are exempt: `innerText` is not retired, it is simply not
      // ours, and demanding that a sentence call it "deleted" would be a lie.
      for (const name of gone.filter((n) => !PLATFORM_IDENTIFIERS.has(n))) {
        const n = norm(doc);
        for (let i = n.indexOf(name); i !== -1; i = n.indexOf(name, i + 1)) {
          const around = n.slice(Math.max(0, i - 400), i + name.length + 400);
          expect(
            HISTORY_FRAMING.test(around),
            `${path} mentions the retired identifier \`${name}\` without saying it is `
            + 'retired. A reader meeting the name cold will take the rule around it as '
            + 'current, which is exactly how the superseded adult interval stayed readable '
            + 'as live in four documents.\n\n'
            + `Context: ...${around.slice(300, 560)}...`
          ).toBe(true);
        }
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// S6-6 (2026-10-15) — the superseded adult interval, by its WORDS this time.
//
// The guard above catches a stale rule by the stale IDENTIFIER beside it, and
// that is how S8 found four copies of the pre-A-P1-1 adult interval: each one
// named `adultPpsvIntervalClass()`. A fifth copy had no identifier in it at
// all, so nothing objected, and it sat in the header of `riskFactors.js` —
// the file that owns ADULT_PPSV23_INTERVAL_MONTHS — stating two hundred lines
// above those constants that the adult interval is keyed on the risk class:
//
//   "• IC adult interval = >=8 weeks; non-IC chronic adult interval = >=1 year."
//
// The rulebook itself carried it in three more places, contradicting its own
// A-P1-1 bullet ten paragraphs later, and `recommend.js` kept a comment with
// no code under it saying the same thing.
//
// So this checks for the RULE, not the name: any sentence that keys the adult
// PCV15->PPSV23 interval on the risk class ALONE must sit next to words
// framing it as history. The validity floor (S14-7) says "floor" or "minimum".
//
// ── UPDATED BY S15 (2026-10-16) ─────────────────────────────────────────
// The rule has now drifted THREE times, in both directions, so the guard
// tracks the hazard rather than one wrong answer. The hazard is a statement
// that names only ONE of the two terms:
//
//   • risk class with no age band  — the shape the SUPERSEDED patterns catch.
//     Still wrong, because the 8 weeks applies at 19-49 only.
//   • age-free flattening (">=1 year for every adult") — A-P1-1's shape,
//     correct from 2026-10-10 to 2026-10-16 and wrong since. Caught by the
//     FLATTENED patterns added below.
//
// A correct statement names BOTH: ">=8 weeks at 19-49 for IC / cochlear
// implant / CSF leak, >=1 year otherwise".
describe('S6-6: no file states the amended risk-class-keyed adult interval as current', () => {
  // Each pattern is a shape the superseded rule actually took, in a real file.
  const SUPERSEDED = [
    /IC\s+adult\s+interval\s*=/i,
    /non-?IC\s+chronic\s+(adult\s+)?interval\s*(is|=)/i,
    /interval\s+differs\s+by\s+risk\s+class/i,
    /shorter\s+PCV(15)?\s*(→|->)\s*PPSV23\s*=/i,
    /(use|uses|needs)\s+the\s+IC\s*\(≥8wk\)\s+interval/i,
    /the\s+≥8wk\s*\(IC\)\s+interval/i,
    /Chronic\s+conditions\s*\(≥1y\s+interval\)/i,
    /IC\/cochlear\/CSF\s*=\s*≥8/i,
  ];

  const FRAMED_AS_HISTORY = /no longer|used to|previously read|previously|deleted|removed|superseded|amended|corrected|stale|before the owner|the rule BEFORE|pre-A-P1-1|outlived/i;

  // Documents and the three source files that carried it.
  const SCANNED = [
    SPEC_PATH,
    CLINICAL_PATH,
    'CLAUDE.md',
    'docs/agent/architecture.md',
    'docs/agent/testing.md',
    'docs/agent/clinical-rules.md',
    'src/data/riskFactors.js',
    'src/logic/recommend.js',
    'src/logic/doseIntervalRules.js',
  ];

  for (const path of SCANNED) {
    it(`${path} does not present the risk-class-keyed interval as the rule`, () => {
      const text = readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');
      const lines = text.split('\n');
      const unframed = [];
      lines.forEach((line, i) => {
        for (const pat of SUPERSEDED) {
          if (!pat.test(line)) continue;
          // A match is allowed only where the surrounding lines say it is past.
          const around = lines.slice(Math.max(0, i - 8), i + 9).join('\n');
          if (!FRAMED_AS_HISTORY.test(around)) {
            unframed.push(`${i + 1}: ${line.trim().slice(0, 130)}`);
          }
        }
      });
      expect(
        unframed,
        `${path} states the adult PCV15->PPSV23 interval as keyed on the risk class, with `
        + 'nothing nearby saying that rule was amended. The owner amended it on 2026-10-10 '
        + '(A-P1-1): >=1 year is the recommendation for EVERY adult, and the 8 weeks is '
        + 'named as an option, never substituted. If you mean the S14-7 VALIDITY FLOOR, say '
        + '"floor" or "minimum" — that one really is keyed on the class.\n\n'
        + unframed.join('\n'),
      ).toEqual([]);
    });
  }

  // The control: the guard must actually fire on the sentence that escaped.
  it('fires on the exact sentence that survived in riskFactors.js', () => {
    const escaped = '//   • IC adult interval = ≥8 weeks; non-IC chronic adult interval = ≥1 year.';
    expect(SUPERSEDED.some((p) => p.test(escaped))).toBe(true);
    // ...and on the rulebook's two headings.
    expect(SUPERSEDED.some((p) => p.test('**Immunocompromising (shorter PCV→PPSV23 = ≥8wk):** chronic renal failure'))).toBe(true);
    expect(SUPERSEDED.some((p) => p.test('**Chronic conditions (≥1y interval):** chronic heart disease'))).toBe(true);
    expect(SUPERSEDED.some((p) => p.test('PCV15→PPSV23 interval differs by risk class:'))).toBe(true);
  });

  // ...and must NOT fire on the correct statement, or on the validity floor.
  // S15: the first entry used to read ">=1 year for every adult, whatever the
  // risk class" — i.e. this control asserted as correct the very rule that is
  // now superseded. Replaced rather than deleted, so the list keeps doing its
  // job of pinning what a RIGHT sentence looks like.
  it('passes the rule as it now stands, and the S14-7 floor', () => {
    for (const ok of [
      'The PCV15→PPSV23 recommendation is ≥8 weeks at 19–49 for an immunocompromising condition, cochlear implant or CSF leak, and ≥1 year otherwise',
      'the 8-week minimum is named as an option for an immunocompromising condition',
      'Validity floor for a dose already given: 8 weeks for IC / cochlear implant / CSF leak',
      '8 weeks for IC / cochlear implant / CSF leak, the year for every other adult',
    ]) {
      expect(SUPERSEDED.some((p) => p.test(ok)), `false positive on: ${ok}`).toBe(false);
    }
  });
});

// S15 (2026-10-16): the mirror-image guard. A-P1-1's flattened rule — ">=1
// year for EVERY adult, whatever the risk class" — was correct for six days
// and is now the stale one. It escaped into four documents last time it
// changed, so it gets a tripwire of its own rather than a promise to be
// careful. Same shape as the guard above: fire on the sentence, allow it when
// it is framed as history.
describe('S15: no file states the flattened age-free adult interval as current', () => {
  const FLATTENED = [
    // `[^.]{0,40}?` so the two halves may be separated by a few words
    // (\"≥1 year later, for every adult 19+\" — mutation M9b slipped a bare
    // [,;\s]* version) without ever crossing a sentence boundary.
    /(≥|>=)\s*1\s*year\b[^.]{0,40}?\b(for|at|to)\s+(every|all|any)\s+adult/i,
    /one\s+interval\s+at\s+every\s+adult\s+age/i,
    /per-page\s+simplification/i,
    // NOT /(no|without) age (distinction|split|term)/ — tried, and dropped.
    // It fired on four CORRECT sentences: the S14-7 validity floor genuinely
    // has no age term, and saying so is the right thing to write. A guard that
    // flags the true statement teaches the next reader to delete it.
  ];
  // Deliberately NARROW, and checked on the SAME line plus one either side.
  // A first pass allowed "A-P1-1", "S15" and the date, with a +/-8 line window
  // — and mutation M9 (reinstating the flattened sentence in CLINICAL_SPEC.md)
  // was caught by nothing, because those tokens appear on almost every page of
  // these documents. A framing word has to sit against the sentence itself.
  const FRAMED = /no longer|used to|previously|deleted|removed|supersed|amended|corrected|stale|flattened|retired|outlived|which it is not|it is not|it is mm7401a1|replaced|was the rule|until 2026/i;

  // The same nine files the S6-6 guard scans.
  const SCANNED_S15 = [
    SPEC_PATH,
    CLINICAL_PATH,
    'CLAUDE.md',
    'docs/agent/architecture.md',
    'docs/agent/testing.md',
    'docs/agent/clinical-rules.md',
    'src/data/riskFactors.js',
    'src/logic/recommend.js',
    'src/logic/doseIntervalRules.js',
  ];

  for (const path of SCANNED_S15) {
    it(`${path} does not state the flattened interval as current`, () => {
      const text = readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');
      const lines = text.split('\n');
      const unframed = [];
      lines.forEach((line, i) => {
        if (!FLATTENED.some((pat) => pat.test(line))) return;
        const around = lines.slice(Math.max(0, i - 1), i + 2).join('\n');
        if (!FRAMED.test(around)) unframed.push(`${i + 1}: ${line.trim().slice(0, 130)}`);
      });
      expect(
        unframed,
        `${path} states the adult PCV15->PPSV23 interval as >=1 year for every adult, with `
        + 'nothing nearby saying that rule was superseded. The owner superseded it on '
        + '2026-10-16 (S15): >=8 weeks at 19-49 for an immunocompromising condition, '
        + 'cochlear implant or CSF leak; >=1 year for every other adult. See mm7401a1 and '
        + "CDC's March 2025 Adult Timing Job Aid.\n\n"
        + unframed.join('\n'),
      ).toEqual([]);
    });
  }

  it('fires on the sentences A-P1-1 left behind', () => {
    for (const stale of [
      'The PCV15→PPSV23 recommendation is ≥1 year for every adult, whatever the risk class',
      'Adult PCV15→PPSV23 interval = ≥1 year, at EVERY adult age',
      'that is a per-page simplification of the sentence above, which governs',
    ]) {
      expect(FLATTENED.some((p) => p.test(stale)), `missed: ${stale}`).toBe(true);
    }
  });

  it('does not fire on the rule as it now stands, nor on the >=50 half of it', () => {
    for (const ok of [
      '≥8 weeks at 19–49 for IC / cochlear implant / CSF leak, ≥1 year otherwise',
      'Adults 50+ keep ≥1 year, with 8 weeks named as an option',
      'PPSV23 only: PCV15/20/21 ≥1 year after PPSV23, every class',
      'PCV13 only: PCV20 or PCV21 at ≥1 year',
      // The floor really does have no age term. Saying so must stay sayable.
      'Validity floor for a dose already given, keyed on risk class with no age term',
      'the validity floors key on the class with NO age term, 8 weeks for IC',
    ]) {
      expect(FLATTENED.some((p) => p.test(ok)), `false positive on: ${ok}`).toBe(false);
    }
  });
});

describe('P2-7: both documents say when they were last checked against the code', () => {
  for (const [path, doc] of [[SPEC_PATH, spec], [CLINICAL_PATH, clinical]]) {
    it(`${path} carries a dated "verified against code" stamp`, () => {
      expect(norm(doc), `${path} needs a dated "verified against code: YYYY-MM-DD" stamp, `
        + 'so a reader can tell how much to trust it — and so that a reviewer can see at a '
        + 'glance whether anyone has looked since the last rule change.')
        .toMatch(/verified against code:?\s*\d{4}-\d{2}-\d{2}/i);
    });
  }
});

describe('P2-7: the tripwire cannot pass vacuously', () => {
  // The lesson of MeningoVax's no-vacuous-negative-assertions guard: a checking
  // helper that silently stops working makes every check above pass. These are
  // the controls that fail if the parser or the normaliser breaks.
  it('the table parser really read every rule row, not zero rows', () => {
    expect(specRows.length).toBe(DOSE_INTERVAL_RULES.length);
    expect(specRows.length).toBeGreaterThanOrEqual(16);
  });

  it('the parser rejects a row whose id is not a rule id', () => {
    const planted = parseSpecTable(
      'The rule table, row by row\n'
      + '| Rule | Rulebook | Vaccine | From | Gap | Enforcement | Authority |\n'
      + '| --- | --- | --- | --- | --- | --- | --- |\n'
      + '| `CHILD-PCV-AFTER-PCV` | child | PCV | prevSameStream | >=4 weeks | floor | CDC |\n'
    );
    expect(planted).toHaveLength(1);
    expect(planted[0].id).toBe('CHILD-PCV-AFTER-PCV');
    expect(planted[0].authority).toBe('CDC');
  });

  it('a changed interval really does change the expected cell', () => {
    // If canonicalGap stopped deriving from the code, every gap check above
    // would compare a constant against itself and pass forever.
    const twelveMonths = { interval: { months: 12 } };
    const twentyFour = { interval: { months: 24 } };
    expect(canonicalGap(twelveMonths)).toBe('>=1 year');
    expect(canonicalGap(twentyFour)).toBe('>=2 years');
    expect(canonicalGap({ interval: { days: 56 } })).toBe('>=8 weeks');
    expect(canonicalGap({ interval: null })).toBe('none stated');
  });
});
