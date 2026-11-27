// ─────────────────────────────────────────────────────────────────────────
// Rulebook.jsx — the "Rulebook" view.
//
// 2026-11-27 reorganization, from the owner's mock-up
// (docs/archive/mockup-2026-11-27-pneumovax-rulebook-v1.html), into
// MeningoVax's layout: "How PneumoVax decides" is one fold of five steps;
// each step is its own fold and holds its section. Below them, under
// "Reference", PneumoVax decisions and Sources. Every fold is closed when the
// screen opens; "Show all" beside the "How PneumoVax decides" bar opens every
// one and then reads "Hide all". Her words: "use the same show and show all
// buttons as meningovax" — so FoldButton, Fold, Step, the Show all wiring and
// the group table are MeningoVax's own (its src/components/Rulebook.jsx), and
// so is their CSS.
//
// It is a view of the same tab, switched from the header ("Patient |
// Rulebook"); App.jsx keeps the patient form mounted but hidden, so a
// half-entered patient is still there on the way back.
//
// This file renders and decides nothing. Every sentence, age and interval
// comes from src/data/rulebook.js, which draws its numbers from the engine's
// constants and pairs each claim with a worked patient; the C14 guard runs
// every one of those patients through recommend().
// ─────────────────────────────────────────────────────────────────────────
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  HEADINGS, INTRO, PATH_STEPS, TRANSPLANT_STOP, VACCINES, VACCINE_ROWS, CHIP_LEGEND, NOT_COUNTED,
  INVALID_EXAMPLE, CHILD_GROUPS, ROUTINE_INFANT, DOSES_BY_AGE, FROM_NINETEEN, CHILD_RANKING,
  ADULT_GROUPS, ADULT_OPTIONS, ADULT_HISTORY, ADULT_RANKING, GRACE, PCV_AFTER_PCV, PCV_AND_PPSV23,
  ADULT_INTERVALS, DECISIONS, DECISION, DECISION_USES, SOURCE_TYPES, decisionsOf, sourcesFor,
} from '../data/rulebook.js';
import { FOOTER_TEXT, FOOTER_EMAIL, lastUpdatedWords } from '../data/rulebookFooter.js';

/** Every fold on the page, in order: the path, its five steps, the Reference folds. */
const ALL_FOLDS = ['path', ...PATH_STEPS.map((s) => s.key), 'decisions', 'sources'];

/**
 * "Show all" / "Hide all" reaches the folds the page does not hold itself
 * (the decisions list's own folds): each press bumps n, and says open or not.
 */
const ShowAll = createContext({ n: 0, open: false });

/** A decision's three labelled lines, shared by the chip and the decisions part. */
function DecisionText({ d }) {
  return (
    <>
      <span className="rb-dec-line"><strong>Problem:</strong> {d.problem}</span>
      <span className="rb-dec-line"><strong>CDC and ACIP say:</strong> {d.cdc}</span>
      <span className="rb-dec-line"><strong>PneumoVax decision:</strong> {d.does}</span>
    </>
  );
}

/** A part that starts closed on a phone (owner, 2026-11-01), and that Show all opens. */
function useFold() {
  const all = useContext(ShowAll);
  const [open, setOpen] = useState(all.n > 0 && all.open);
  useEffect(() => { if (all.n > 0) setOpen(all.open); }, [all]);
  return [open ? ' rb-fold rb-open' : ' rb-fold', open, () => setOpen((v) => !v)];
}
function FoldBar({ name, open, toggle }) {
  return (
    <button type="button" className="rb-fold-btn" aria-expanded={open} onClick={toggle}>
      <span className="rb-fold-text"><strong className="rb-fold-name">{name}</strong></span>
      <span className="rb-fold-mark">{open ? 'Hide' : 'Show'}</span>
    </button>
  );
}

/**
 * "PneumoVax decision: <its name>" — a button that opens that decision's
 * reason in place (owner, 2026-11-01: no "click to expand" sentence; a name,
 * not a number).
 */
function DecisionChip({ k }) {
  const [open, setOpen] = useState(false);
  const d = DECISION[k];
  return (
    <span className="rb-dec">
      <button type="button" className="rb-decision" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        PneumoVax decision: {d.short}
      </button>
      {open && (
        <span className="rb-src-panel rb-dec-panel">
          <DecisionText d={d} />
        </span>
      )}
    </span>
  );
}
function Decisions({ row }) {
  return decisionsOf(row).map((k) => <React.Fragment key={k}> <DecisionChip k={k} /></React.Fragment>);
}

/**
 * "Source": the sentences the row rests on (`cite`), as the app's own cards
 * cite them for this row's worked patients — one per claim. A row with no
 * `cite` (a PneumoVax decision, or the app's own dose labels) has no button.
 */
function Source({ row }) {
  const [open, setOpen] = useState(false);
  if (!row?.cite?.length || !row.ex?.length) return null;
  const quotes = open ? sourcesFor(row.ex, row.cite) : [];
  return (
    <span className="rb-src">
      {' '}
      <button type="button" className="rb-src-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide source' : 'Source'}
      </button>
      {open && (
        <span className="rb-src-panel">
          {quotes.map((q) => (
            <span key={q.key} className="rb-src-quote">
              &ldquo;{q.quote}&rdquo;
              <a href={q.url} target="_blank" rel="noopener noreferrer" className="rb-src-doc">{q.doc}</a>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

function DoseBox({ children, ppsv, done }) {
  const cls = ['rb-dose', ppsv && 'rb-dose-ppsv', done && 'rb-dose-done'].filter(Boolean).join(' ');
  return <span className={cls}>{children}</span>;
}

function Card({ id, title, children, tone }) {
  return (
    <section className={`rb-card${tone ? ` rb-card-${tone}` : ''}`} aria-labelledby={id}>
      <h4 id={id} className="rb-h3">{title}</h4>
      {children}
    </section>
  );
}

const CHIP_CLASS = { valid: 'dose-val-valid', invalid: 'dose-val-invalid', extra: 'dose-val-offwindow', unknown: 'dose-val-unknown' };
const Chip = ({ tone, children }) => <span className={`dose-val-chip ${CHIP_CLASS[tone]}`}>{children}</span>;

// ── Group table, MeningoVax's: Details under the group name opens its
// conditions and its Source; one row open at a time.
function GroupTable({ rows, cols, label, cells }) {
  const [openKey, setOpenKey] = useState(null);
  return (
    <table className="rb-table rb-fixed rb-groups-table" aria-label={label}>
      <colgroup>{cols.map((c, i) => <col key={i} className={c} />)}</colgroup>
      <thead><tr><th>Group</th>{cells.map(([h]) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((r) => {
          const open = openKey === r.key;
          return (
            <React.Fragment key={r.key}>
              <tr className={open ? 'rb-g-on' : undefined}>
                <th scope="row" className="rb-g-name">
                  {r.group}
                  <button type="button" className="rb-g-details" aria-expanded={open} onClick={() => setOpenKey(open ? null : r.key)}>
                    {open ? 'Close' : 'Details'}
                  </button>
                </th>
                {cells.map(([h, cell]) => <td key={h}>{cell(r)}</td>)}
              </tr>
              {open && (
                <tr className="rb-g-det">
                  <td colSpan={cells.length + 1}>
                    <div className="rb-g-detin">
                      {r.conditions.length > 0 && <ul className="rb-bullets">{r.conditions.map((d) => <li key={d}>{d}</li>)}</ul>}
                      <p className="rb-cell-note"><Decisions row={r} /><Source row={r} /></p>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

/** "More than one condition" (L4: once in each schedule). */
function Ranking({ id, r }) {
  return (
    <Card id={id} title="More than one condition">
      <p className="rb-small">{r.lead}</p>
      <ol className="rb-rank">{r.steps.map((s) => <li key={s.name}><strong>{s.name}</strong></li>)}</ol>
      {r.note && <p className="rb-small rb-muted">{r.note.text}<Source row={r.note} /></p>}
    </Card>
  );
}

// ═════ Step 1: Stop check ════════════════════════════════════════════════
function Stop() {
  return (
    <Card id="rb-stop-card" title={TRANSPLANT_STOP.title} tone="stop">
      <p className="rb-body">{TRANSPLANT_STOP.text}<Decisions row={TRANSPLANT_STOP} /></p>
    </Card>
  );
}

// ═════ Step 2: Read the record ═══════════════════════════════════════════
function Use({ p }) {
  if (p.both) return p.both;
  return (
    <>
      {p.child && <span className="rb-use"><strong>Children:</strong> {p.child}</span>}
      {p.adult && <span className="rb-use"><strong>Adults:</strong> {p.adult}</span>}
    </>
  );
}

function Record() {
  return (
    <>
      <Card id="rb-vaccines-card" title="The vaccines">
        <p className="rb-small">{VACCINES.lead}</p>
        <table className="rb-table rb-fixed" aria-label="The vaccines">
          <colgroup><col className="rb-w24" /><col className="rb-w18" /><col /></colgroup>
          <thead><tr><th>Vaccine</th><th>Minimum age</th><th>Use</th></tr></thead>
          <tbody>
            {VACCINE_ROWS.map((g) => (
              <React.Fragment key={g.kind}>
                {g.name && <tr className="rb-grp"><td colSpan={3}><span className="rb-grp-label">{g.name}</span></td></tr>}
                {g.rows.map((p) => (
                  <tr key={p.key}>
                    <td><DoseBox ppsv={p.ppsv}>{p.name}</DoseBox><span className="rb-cell-note">{p.brand}</span></td>
                    <td>{p.minAge}</td>
                    <td><Use p={p} /></td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </Card>

      <Card id="rb-labels" title="What the label on a dose means">
        <div className="rb-legend">
          {CHIP_LEGEND.map((c) => (
            <div key={(c.chips ?? [c.chip]).join() + c.text} className="rb-legend-item">
              <span className="rb-chips">{(c.chips ?? [c.chip]).map((x) => <Chip key={x} tone={c.tone}>{x}</Chip>)}</span>
              <span className="rb-small">{c.text}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card id="rb-not-counted" title="A dose that does not count">
        <h5 className="rb-h4">General rules</h5>
        <ul className="rb-bullets">
          {NOT_COUNTED.general.map((r) => <li key={r.text}>{r.text}<Decisions row={r} /><Source row={r} /></li>)}
        </ul>
        <p className="rb-label">{INVALID_EXAMPLE.lead}</p>
        <ol className="rb-timeline-list">
          {INVALID_EXAMPLE.steps.map((st) => (
            <li key={st.chip + st.example} className="rb-tl-item">
              <span className="rb-tl-when">{st.example}</span>
              <Chip tone={st.tone}>{st.chip}</Chip>
              {st.text && <span className="rb-small">{st.text}</span>}
            </li>
          ))}
        </ol>
        <h5 className="rb-h4">Special cases</h5>
        <table className="rb-table rb-fixed" aria-label="Special cases">
          <colgroup><col className="rb-w40" /><col /></colgroup>
          <thead><tr><th>Dose that did not count</th><th>What to give</th></tr></thead>
          <tbody>
            {NOT_COUNTED.special.map((r) => (
              <tr key={r.dose}><td>{r.dose}</td><td>{r.action}<Decisions row={r} /><Source row={r} /></td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

// ═════ Step 3: Children's schedule ═══════════════════════════════════════
function Children() {
  return (
    <>
      <div className="rb-card">
        <GroupTable
          rows={CHILD_GROUPS}
          label="Children's groups"
          cols={['rb-w30', 'rb-w32', '']}
          cells={[
            ['PCV doses', (r) => r.doses],
            ['After the PCV series', (r) => <>{r.after}{r.afterNote && <span className="rb-cell-note">{r.afterNote}</span>}</>],
          ]}
        />
      </div>

      <Card id="rb-routine" title={ROUTINE_INFANT.title}>
        <table className="rb-table rb-fixed rb-sched" aria-label={ROUTINE_INFANT.title}>
          <colgroup><col className="rb-w20" /><col className="rb-w26" /><col /></colgroup>
          <thead><tr><th>Dose</th><th>Routine</th><th className="rb-min">Minimum interval</th></tr></thead>
          <tbody>
            {ROUTINE_INFANT.rows.map((r) => (
              <tr key={r.dose}><th scope="row" className="rb-strong-wrap">{r.dose}</th><td>{r.routine}</td><td className="rb-min">{r.min}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="rb-cell-note"><Source row={ROUTINE_INFANT} /></p>

        <h5 className="rb-h4">{DOSES_BY_AGE.title}</h5>
        <table className="rb-table rb-fixed" aria-label={DOSES_BY_AGE.title}>
          <colgroup><col className="rb-w50" /><col /></colgroup>
          <thead><tr><th>Age at dose 1</th><th>PCV doses in all</th></tr></thead>
          <tbody>
            {DOSES_BY_AGE.rows.map((r) => <tr key={r.age}><td>{r.age}</td><td>{r.total}</td></tr>)}
          </tbody>
        </table>
        <p className="rb-small">{DOSES_BY_AGE.note}<Source row={DOSES_BY_AGE} /></p>
      </Card>

      <Card id="rb-from-19" title={FROM_NINETEEN.title}>
        <p className="rb-small">{FROM_NINETEEN.text}<Decisions row={FROM_NINETEEN} /></p>
      </Card>

      <Ranking id="rb-multi-kids" r={CHILD_RANKING} />
    </>
  );
}

// ═════ Step 4: Adults' schedule ══════════════════════════════════════════
function Adults() {
  return (
    <>
      <div className="rb-card">
        <GroupTable
          rows={ADULT_GROUPS}
          label="Adults' groups"
          cols={['rb-w44', '']}
          cells={[['Recommended', (r) => r.recommended]]}
        />
      </div>

      <Card id="rb-adult-options" title={ADULT_OPTIONS.title}>
        <div className="rb-path">
          <span className="rb-path-name">Option A</span>
          <DoseBox>{ADULT_OPTIONS.a.doses[0]}</DoseBox>
          <span className="rb-arrow" aria-hidden="true">&rarr;</span>
          <DoseBox done>Complete</DoseBox>
        </div>
        <div className="rb-path">
          <span className="rb-path-name">Option B</span>
          <DoseBox>{ADULT_OPTIONS.b.doses[0]}</DoseBox>
          <span className="rb-arrow"><span aria-hidden="true">&rarr; </span>{ADULT_OPTIONS.b.gap}<span aria-hidden="true"> &rarr;</span></span>
          <DoseBox ppsv>{ADULT_OPTIONS.b.doses[1]}</DoseBox>
          <span className="rb-arrow" aria-hidden="true">&rarr;</span>
          <DoseBox done>Complete</DoseBox>
        </div>
        <p className="rb-cell-note"><Source row={ADULT_OPTIONS} /></p>
      </Card>

      <Card id="rb-adult-history" title="Prior pneumococcal vaccines">
        <table className="rb-table rb-fixed rb-history" aria-label="Prior pneumococcal vaccines">
          <colgroup><col className="rb-w44" /><col /></colgroup>
          <thead><tr><th>Vaccine history</th><th>Next dose</th></tr></thead>
          <tbody>
            {ADULT_HISTORY.map((h) => (
              <tr key={h.history}>
                <td>{h.history}</td>
                <td>
                  {h.complete ? <strong className="rb-complete">{h.next}</strong> : h.next}
                  <Decisions row={h} />
                  <Source row={h} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Ranking id="rb-multi-adults" r={ADULT_RANKING} />
    </>
  );
}

// ═════ Step 5: Time between doses ════════════════════════════════════════
function SoonerTable({ t, label, gapHead }) {
  return (
    <table className="rb-table rb-fixed" aria-label={label}>
      <colgroup><col className="rb-w36" /><col className="rb-w30" /><col /></colgroup>
      <thead><tr><th>Doses</th><th className="rb-min">{gapHead}</th><th>If given sooner</th></tr></thead>
      <tbody>
        {t.rows.map((r) => (
          <tr key={r.doses}>
            <td>{r.doses}</td>
            <td className="rb-min">{r.gap}</td>
            <td>{r.sooner}<Decisions row={r} /><Source row={r} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Spacing() {
  return (
    <>
      <Card id="rb-kid-gaps" title={GRACE.title}>
        <p className="rb-band rb-band-green">{GRACE.text}<Source row={GRACE} /></p>

        <h5 className="rb-h4">{PCV_AFTER_PCV.title}</h5>
        <table className="rb-table rb-fixed" aria-label={PCV_AFTER_PCV.title}>
          <colgroup><col className="rb-w22" /><col /><col className="rb-w30" /></colgroup>
          <thead><tr><th>Doses</th><th>When</th><th className="rb-min">Minimum interval</th></tr></thead>
          <tbody>
            {PCV_AFTER_PCV.rows.map((r, i) => (
              <tr key={r.when}>
                {(i === 0 || PCV_AFTER_PCV.rows[i - 1].doses !== r.doses) && (
                  <td className="rb-strong" rowSpan={PCV_AFTER_PCV.rows.filter((x) => x.doses === r.doses).length}>{r.doses}</td>
                )}
                <td>{r.when}</td>
                <td className="rb-min">{r.gap}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="rb-cell-note"><Source row={PCV_AFTER_PCV} /></p>

        <h5 className="rb-h4">{PCV_AND_PPSV23.title}</h5>
        <SoonerTable t={PCV_AND_PPSV23} label={PCV_AND_PPSV23.title} gapHead="Minimum interval" />
        <p className="rb-small">{PCV_AND_PPSV23.note.text}</p>
      </Card>

      <Card id="rb-adult-gaps" title={ADULT_INTERVALS.title}>
        <p className="rb-small"><Decisions row={ADULT_INTERVALS} /></p>
        <SoonerTable t={ADULT_INTERVALS} label={ADULT_INTERVALS.title} gapHead="Recommended interval" />
        <p className="rb-small">{ADULT_INTERVALS.note.text}</p>
      </Card>
    </>
  );
}

// ═════ Reference: PneumoVax decisions, Sources ═══════════════════════════
function DecisionItem({ d }) {
  const [cls, open, toggle] = useFold();
  return (
    <li id={`rb-decision-${d.key}`} className={`rb-declist-item${cls}`}>
      <FoldBar name={d.short} open={open} toggle={toggle} />
      <h4 className="rb-h4 rb-fold-title">{d.short}</h4>
      <span className="rb-dec-body"><DecisionText d={d} /></span>
      <span className="rb-cell-note">Applies in: {DECISION_USES[d.key].join(' · ')}</span>
    </li>
  );
}
function DecisionList() {
  return (
    <>
      <p className="rb-lead">Where CDC and ACIP give no answer, PneumoVax chose one. Each is listed once and marked wherever it applies.</p>
      <div className="rb-card">
        <ol className="rb-declist">{DECISIONS.map((d) => <DecisionItem key={d.key} d={d} />)}</ol>
      </div>
    </>
  );
}

// E16: grouped by type, with no count of quoted sentences and no read date.
function Sources() {
  return (
    <div className="rb-card">
      {SOURCE_TYPES.filter((g) => g.docs.length).map((g) => (
        <div key={g.name} className="rb-src-group">
          <h4 className="rb-h4">{g.name}</h4>
          {g.docs.map((d) => (
            <div key={d.url} className="rb-doc">
              <a href={d.url} target="_blank" rel="noopener noreferrer">{d.name}</a>
              {d.describes && <span className="rb-cell-note">{d.describes}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Each step's section (L1: each section sits under its step). */
const STEP_BODY = { stop: Stop, record: Record, kids: Children, adults: Adults, spacing: Spacing };

/** The words on a fold's bar: its name, and a summary line for a step. */
function FoldButton({ id, name, sum, open, toggle, className }) {
  return (
    <button type="button" className={className} aria-expanded={open} aria-controls={`${id}-body`} onClick={toggle}>
      <span className="rb-fold-words">
        <span className="rb-fold-label">{name}</span>
        {sum && <span className="rb-step-sum">{sum}</span>}
      </span>
      <span className="rb-fold-mark">{open ? 'Hide' : 'Show'}</span>
    </button>
  );
}

/** A Reference fold: a heading that is a button, and the body once it is open. */
function Fold({ id, name, open, toggle, children }) {
  return (
    <section id={id} className="rb-section rb-part" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="rb-h2">
        <FoldButton id={id} name={name} open={open} toggle={toggle} className="rb-full-btn" />
      </h2>
      {open && <div id={`${id}-body`} className="rb-part-body">{children}</div>}
    </section>
  );
}

/** One step: its number, a bar that opens it, and its section. */
function Step({ step, open, toggle }) {
  const id = `rb-${step.key}`;
  const Body = STEP_BODY[step.key];
  return (
    <li className="rb-step">
      <span className="rb-step-num" aria-hidden="true">{step.n}</span>
      <section id={id} className="rb-step-body" aria-labelledby={`${id}-h`}>
        <h3 id={`${id}-h`} className="rb-h3 rb-step-h">
          <FoldButton id={id} name={step.title} sum={step.sum} open={open} toggle={toggle} className="rb-full-btn rb-step-btn" />
        </h3>
        {open && <div id={`${id}-body`} className="rb-part-body"><Body /></div>}
      </section>
    </li>
  );
}

const KEY_CLASS = { source: 'rb-key-src', decision: 'rb-key-dec' };

export default function Rulebook() {
  // Every fold closed when the screen opens (L1).
  const [open, setOpen] = useState(() => new Set());
  const [all, setAll] = useState({ n: 0, open: false });
  const toggle = (key) => setOpen((s) => {
    const next = new Set(s);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  // E18: Show all opens every fold, Decisions and Sources included; once all
  // are open it says "Hide all".
  const allOpen = ALL_FOLDS.every((k) => open.has(k));
  const showAll = () => {
    const next = !allOpen;
    setOpen(next ? new Set(ALL_FOLDS) : new Set());
    setAll((a) => ({ n: a.n + 1, open: next }));
  };

  return (
    <ShowAll.Provider value={all}>
      <div className="rb">
        <div className="rb-top">
          <h1 className="rb-title">Rulebook</h1>
          <p className="rb-intro">{INTRO.text}</p>
          <ul className="rb-key" aria-label="Key">
            {INTRO.key.map((k) => (
              <li key={k.kind}><span className={KEY_CLASS[k.kind]}>{k.tag}</span> {k.text}</li>
            ))}
          </ul>
        </div>

        <section id="rb-how" className="rb-section rb-part" aria-labelledby="rb-how-h">
          <div className="rb-how-head">
            <h2 id="rb-how-h" className="rb-h2">
              <FoldButton id="rb-how" name={HEADINGS.how} open={open.has('path')} toggle={() => toggle('path')} className="rb-full-btn" />
            </h2>
            <button type="button" className="rb-tap rb-show-all" onClick={showAll}>{allOpen ? 'Hide all' : 'Show all'}</button>
          </div>
          {open.has('path') && (
            <div id="rb-how-body" className="rb-part-body">
              <p className="rb-small">Five steps, always in this order.</p>
              <ol className="rb-steps">
                {PATH_STEPS.map((s) => (
                  <Step key={s.key} step={s} open={open.has(s.key)} toggle={() => toggle(s.key)} />
                ))}
              </ol>
            </div>
          )}
        </section>

        <p className="rb-ref-label">Reference</p>
        <Fold id="rb-decisions" name={HEADINGS.decisions} open={open.has('decisions')} toggle={() => toggle('decisions')}>
          <DecisionList />
        </Fold>
        <Fold id="rb-sources" name={HEADINGS.sources} open={open.has('sources')} toggle={() => toggle('sources')}>
          <Sources />
        </Fold>

        {/* The same footer as MeningoVax's (owner, 2026-11-27). */}
        <p className="rb-foot">
          {FOOTER_TEXT} <a href={`mailto:${FOOTER_EMAIL}`}>{FOOTER_EMAIL}</a>.
          {lastUpdatedWords() && <span className="rb-updated">{lastUpdatedWords()}</span>}
        </p>
      </div>
    </ShowAll.Provider>
  );
}
