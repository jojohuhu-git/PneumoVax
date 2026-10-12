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
 * I have no card, so I do not know when or which". The second is a real
 * clinical entry this app supports — an undated dose counts, and the engine
 * has rules for grading one — so the row now carries `detailsUnknown` when
 * the clinician ticks "A dose was given, but the date and product are
 * unknown". A row with that tick is a dose; a row without it, and with
 * nothing typed in, is not.
 *
 * A row with only ONE of the two fields is deliberately NOT blank either: a
 * product with no date is a real injection whose date the clinician does not
 * have, and a date with no product is a real injection of an unrecorded
 * product. The engine already grades both correctly.
 */
/**
 * Values the APP writes onto a row at creation, which therefore say nothing
 * about what the clinician entered.
 *
 * There is exactly one of these: the PPSV23 stream has a single product, so
 * every PPSV23 row is born carrying `product: 'PPSV23'`. It has to be stored
 * rather than inferred, because the recommendation card prints the product of
 * each recorded dose and a row without one reads "product unknown". But it is
 * a label the app stamped on, not something anybody told us, so it must not
 * turn an untouched row into a dose — without this, "+ Add PPSV23 dose" and
 * typing nothing would still have put a dose of unknown date on the record,
 * i.e. half of P1-3 would have been fixed and half left standing.
 *
 * Keep this list to values that are genuinely written by the app at creation
 * and can never be a clinician's answer. It is NOT the place to list fields
 * that happen to be optional.
 */
const STAMPED_AT_CREATION = { product: 'PPSV23' };

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
    ([key, value]) =>
      value === '' || value === null || value === undefined || value === false ||
      value === STAMPED_AT_CREATION[key]
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
