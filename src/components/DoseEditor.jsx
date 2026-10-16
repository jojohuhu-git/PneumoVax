import React from 'react';
import { newDoseRow, isBlankDoseRow } from '../logic/doseIdentity.js';
import { todayISO } from '../logic/dateUtils.js';
import DoseDateProblem from './DoseDateProblem.jsx';

// ─────────────────────────────────────────────────────────────────────────
// THE recorded-dose editor. There is one, and this is it.
//
// S9 / P4-1 (2026-10-15). It used to be written out twice in full — once in
// `StepHistory.jsx` (the wizard's History step) and once inside `Results.jsx`
// (the "Recorded doses" panel). Same fields, same remove button, same
// details-unknown tick, two copies.
//
// The cost was never tidiness, it was single-surface fixes. Three separate
// items had to find and change the same line twice:
//
//   • `S6-2` — `const isAdult = (ageMonths ?? 0) >= 216` in both files, for
//     the Capvaxive dropdown gate. Miss one and an 18-year-old sees a
//     different product list depending on which screen they are looked at on.
//   • `P1-3` — the details-unknown tick, added to both.
//   • `S11` — label-to-box association, done twice, and needing a per-instance
//     `useId` prefix precisely BECAUSE both copies rendered the same field
//     names into one document.
//
// And the two had already drifted: the wizard rendered Date then Product, the
// Results panel rendered Product then Date. Nobody decided that — one copy
// was edited and the other was not, which is the whole argument in one line.
// MeningoVax extracted its own `DoseEditor.jsx` for exactly this reason
// (its Item 5, 2026-07-23), after its two copies drifted so that only one
// showed the MenB family lock.
//
// ── What is shared and what the caller still decides ─────────────────────
//
// Shared, because these must be the same everywhere: the field set, the field
// ORDER, label-to-box association, the remove button, the impossible-date
// warning, and when the details-unknown tick appears.
//
// Left to the caller, because these legitimately differ per surface: the
// heading above the list, the button wording, the empty-list message (the
// Results panel says "No PCV doses recorded."; the wizard's lists are
// expected to start empty, so a message there would be noise on first view),
// how dense the list is, and the last line of the tick's hint — "removed when
// you continue" in a wizard you continue out of, "removed when you close this
// panel" in a panel you close.
//
// NOT shared: which products the dropdown offers. That gate is clinical
// (Capvaxive's 18y licence floor) and lives in `brands.js`, so this component
// stays ignorant of pneumococcal rules and simply renders the list it is
// handed.
//
// ── `onChange` takes the whole next list ─────────────────────────────────
//
// It is called with the complete new array, not a patch — which is what lets
// the two callers store it in completely different ways (the wizard has one
// setter per stream; the Results panel sends a patch to the app's state)
// without this component knowing either. MeningoVax's `DoseEditor` has the
// same signature for the same reason.
// ─────────────────────────────────────────────────────────────────────────

/**
 * @param {object}   props
 * @param {Array}    props.doses        the rows to render
 * @param {Function} props.onChange     called with the COMPLETE next array
 * @param {object}   props.product
 *   How this stream's product is entered. Either
 *     `{ kind: 'select', options: [{key,label},…] }` — the clinician chooses;
 *   or
 *     `{ kind: 'fixed', key, label }`               — the stream has exactly
 *                                                     one product (PPSV23).
 *   This one field decides three things that have to agree, and used to be
 *   three separate hand-written facts per copy: whether a dropdown or a
 *   stated value is rendered, what a new row is stamped with, and what
 *   "this row is otherwise empty" means (see below).
 * @param {string}   props.addDoseLabel   wording of the add button
 * @param {Function} props.removeLabel    (i) => accessible name for row i's ×
 * @param {string}   [props.emptyMessage] shown instead of rows when there are none
 * @param {string}   [props.listClassName] extra class on the list, for density
 * @param {string}   props.unknownHint    last line of the details-unknown hint
 * @param {number}   props.ageMonths      passed through to the date warning
 * @param {string}   props.today          the clinician's LOCAL today
 * @param {string?}  props.dob            passed through to the date warning
 */
export default function DoseEditor({
  doses,
  onChange,
  product,
  addDoseLabel,
  removeLabel,
  emptyMessage,
  listClassName,
  unknownHint,
  ageMonths,
  today,
  dob,
}) {
  // S11 (2026-10-12): every dose-row label is attached to its own box.
  // `useId` gives this component INSTANCE a prefix nothing else in the
  // document can repeat — which matters because a surface renders two
  // instances (PCV and PPSV23) side by side, and because two rows sharing one
  // id would silently point every label at the FIRST row's box, a bug that
  // looks like it works.
  const uid = React.useId();

  // queue P1-1 / P3-7 (S10): the clinician's LOCAL today, read once in App
  // and passed down. `new Date().toISOString()` is the UTC date, which is
  // already tomorrow after ~17:00 Pacific, so the picker offered a date
  // validate.js then correctly refused as being in the future. The fallback
  // exists only for a component test that mounts this editor on its own.
  const maxDate = todayISO(today);

  const productIsFixed = product.kind === 'fixed';

  // P4-3 (2026-10-15). Ported from MeningoVax K6/Item-1 (`d608c14`): since S9
  // this editor already has one home on every surface, so the fix lands once
  // instead of twice. `S11` made the wizard a real `<form>`, so Enter in a
  // dose field used to submit the whole step instead of finishing the row.
  const listRef = React.useRef(null);
  const prevLengthRef = React.useRef(doses.length);

  React.useEffect(() => {
    if (doses.length > prevLengthRef.current) {
      const inputs = listRef.current?.querySelectorAll('input[type="date"]');
      inputs?.[inputs.length - 1]?.focus();
    }
    prevLengthRef.current = doses.length;
  }, [doses.length]);

  // "Enter finishes the row you are in." Scoped to the date box and the
  // product dropdown — not the "×" remove button (its own Enter already
  // removes the row, natively) and not the details-unknown checkbox.
  //   - Row has something in it, and it's the last row -> add a new row (the
  //     effect above focuses its date box, so that isn't duplicated here).
  //   - Row has something in it, and there's a row after -> move to that
  //     row's date box.
  //   - Row is empty, and it's the last row -> do nothing here; the
  //     browser's native Enter behaviour (submit the enclosing form) is what
  //     "you're done" means.
  function handleRowKeyDown(e, i) {
    if (e.key !== 'Enter') return;
    const isDateOrProduct = (e.target.tagName === 'INPUT' && e.target.type === 'date')
      || e.target.tagName === 'SELECT';
    if (!isDateOrProduct) return;

    const isLastRow = i === doses.length - 1;
    if (!isLastRow) {
      e.preventDefault();
      const inputs = listRef.current?.querySelectorAll('input[type="date"]');
      inputs?.[i + 1]?.focus();
      return;
    }
    if (!isBlankDoseRow(doses[i])) {
      e.preventDefault();
      addDose();
    }
  }

  function addDose() {
    // A fixed-product stream stamps its product on at creation, because the
    // recommendation card prints the product of every recorded dose and a row
    // without one reads "product unknown". `isBlankDoseRow` knows that stamp
    // is a label the app wrote rather than an answer anybody gave, so an
    // untouched row is still not a dose.
    onChange([...doses, productIsFixed ? newDoseRow({ product: product.key }) : newDoseRow()]);
  }
  function removeDose(i) {
    onChange(doses.filter((_, idx) => idx !== i));
  }
  function updateDose(i, field, value) {
    onChange(doses.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
  }

  // P1-3 (2026-10-12): an empty row means two things — "I have not typed yet"
  // and "a dose was given, but I have no card". The app cannot tell them
  // apart, and it used to guess the second, so a row nobody had touched was
  // graded as a dose of unknown date. The clinician now says which it is. The
  // tick appears only while the row is otherwise empty, because that is the
  // only case where the two readings differ.
  //
  // "Otherwise empty" DEPENDS ON THE STREAM, and this is the one place that
  // difference is written down. Where the product is chosen, an untouched row
  // has neither a date nor a product. Where the product is fixed, every row is
  // born carrying it, so judging the row by its product too would hide the
  // tick forever and leave half of P1-3 unfixed.
  const isOtherwiseEmpty = (dose) =>
    productIsFixed ? !dose.date : !dose.date && !dose.product;

  return (
    <>
      {doses.length === 0 && emptyMessage && (
        <div className="dose-edit-empty">{emptyMessage}</div>
      )}

      <div className={`dose-list${listClassName ? ` ${listClassName}` : ''}`} ref={listRef}>
        {doses.map((dose, i) => (
          <div key={i} className="dose-row" onKeyDown={(e) => handleRowKeyDown(e, i)}>
            {/* Date before product, on every surface. The wizard already did
                this; MeningoVax's shared editor does it too, and the design
                parity rule sends its layout decisions here. */}
            <div className="dose-field">
              <label htmlFor={`${uid}-date-${i}`}>Date (optional)</label>
              <input
                type="date"
                id={`${uid}-date-${i}`}
                value={dose.date || ''}
                max={maxDate}
                onChange={(e) => updateDose(i, 'date', e.target.value)}
              />
            </div>

            <div className="dose-field">
              <label htmlFor={`${uid}-product-${i}`}>Product</label>
              {productIsFixed ? (
                <input
                  type="text"
                  id={`${uid}-product-${i}`}
                  value={product.label}
                  disabled
                  className="dose-field-disabled"
                />
              ) : (
                <select
                  id={`${uid}-product-${i}`}
                  value={dose.product || ''}
                  onChange={(e) => updateDose(i, 'product', e.target.value)}
                >
                  {product.options.map((p) => (
                    <option key={p.key || 'unknown'} value={p.key}>{p.label}</option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="button"
              className="dose-remove"
              onClick={() => removeDose(i)}
              aria-label={removeLabel(i)}
            >
              ×
            </button>

            {/* The impossible-date warning is its own component because the
                RULE is the engine's: `dateEntryWarning` calls the very same
                predicates the engine grades with. */}
            <DoseDateProblem dose={dose} ageMonths={ageMonths} today={today} dob={dob} />

            {isOtherwiseEmpty(dose) && (
              <label className="dose-row-unknown">
                <input
                  type="checkbox"
                  className="risk-checkbox"
                  checked={!!dose.detailsUnknown}
                  onChange={(e) => updateDose(i, 'detailsUnknown', e.target.checked)}
                />
                <span>
                  A dose was given, but the date and product are unknown.
                  <span className="dose-row-unknown-hint">
                    Tick this to keep the dose on the record. {unknownHint}
                  </span>
                </span>
              </label>
            )}
          </div>
        ))}
      </div>

      <button type="button" className="add-dose-btn" onClick={addDose}>
        {addDoseLabel}
      </button>
    </>
  );
}
