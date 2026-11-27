// ─────────────────────────────────────────────────────────────────────────
// DOSE IDENTITY — what makes a row of the history a recorded dose.
//
// P1-3 (2026-10-12). Ported from MeningoVax K1 (`6b37c4a`): the RULE, not the
// code. Two deliberate differences, both recorded so a later parity pass does
// not read them as drift:
//
//   • PneumoVax dose rows carry `product`; MeningoVax's carry `brand`.
//     `isBlankDoseRow` names neither — see below — so the difference does not
//     reach this file, but it is why the two are not byte-identical.
//
//   • MeningoVax's per-dose `id` and `doseAnswerKey` are NOT ported.
//     They exist there because MeningoVax asks a question ABOUT a specific
//     recorded dose ("was this patient high-risk when this dose was given?")
//     and has to store the answer against that dose rather than its position.
//     PneumoVax asks nothing per dose and stores nothing keyed to one, so an
//     id here would be a field with no reader. If PneumoVax ever gains a
//     per-dose question, port them then — the keying bug they fix is real.
//
// This is NOT one of the mirror-synced modules. `dateUtils.js` is byte-for-
// byte identical across the two repos and must stay so; this file is a
// sibling implementation of a shared rule, and the two may legitimately
// differ in the ways above.
// ─────────────────────────────────────────────────────────────────────────

/**
 * A new, empty recorded-dose row.
 *
 * Every place the app creates a dose row goes through this, so the shape of
 * an untouched row is written down once. It exists mainly so that shape and
 * `isBlankDoseRow` cannot drift apart.
 */
export function newDoseRow(fields = {}) {
  return { date: '', product: '', ...fields };
}

/**
 * A row the clinician added but never filled in.
 *
 * Clicking "+ Add PCV dose" and typing nothing used to put a dose of unknown
 * date into the record: a 2-year-old with no history at all moved from `due`
 * to `catchup`, and `meta.pcvCount` from 0 to 1, before a single character
 * had been typed.
 *
 * An empty row meant two different things and the app could not tell them
 * apart: "I have not typed yet", and "this patient definitely had a dose, but
 * I have no card". From P1-3 until 2026-11-27 the clinician said which by
 * ticking "a dose was given, but the date is unknown" (`detailsUnknown`).
 * OWNER DECISION 2026-11-27 removed that tick from both apps: a dose is kept
 * on the record by CHOOSING ITS PRODUCT, so a row with neither a date nor a
 * product is empty, and is not a dose.
 *
 * A row with only ONE of the two fields is deliberately NOT blank: a product
 * with no date is a real injection whose date the clinician does not have (a
 * PCV is then not counted; a PPSV23 still is, CDC's exception), and a date
 * with no product is a real injection of an unrecorded product.
 *
 * Until 2026-11-27 every PPSV23 row was BORN carrying `product: 'PPSV23'`,
 * and this rule had to ignore that stamp. PPSV23 rows now choose their
 * product like PCV rows (`PPSV23_HISTORY_PRODUCTS`), so nothing is stamped
 * and there is no exception left to make.
 */
export function isBlankDoseRow(d) {
  if (!d) return true;
  // "Carries nothing the clinician put there", rather than a list of the
  // fields we happen to know about today. The cost of the two mistakes is not
  // symmetrical: keeping an empty row is the bug being fixed here, but
  // discarding a row that holds real information would delete a dose the
  // clinician recorded. So anything present and meaningful keeps the row,
  // including a field added to dose rows later without this file being
  // touched.
  return Object.entries(d).every(
    ([, value]) => value === '' || value === null || value === undefined || value === false,
  );
}

/**
 * The same list with every untouched row removed — not just a trailing one.
 *
 * Called in two places, for two different reasons:
 *   • the ENGINE, so no surface can count a row nobody typed in, however the
 *     doses reached it;
 *   • the UI, when the clinician LEAVES a list of dose rows behind (a history
 *     step, or the Results "Recorded doses" panel) — never while they are
 *     still in it, or a half-typed row would vanish under the cursor.
 */
export function dropBlankDoseRows(doses) {
  return (doses ?? []).filter((d) => !isBlankDoseRow(d));
}
