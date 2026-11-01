// ─────────────────────────────────────────────────────────────────────────
// Rulebook.jsx — the "Rulebook" view.
//
// 2026-11-01 redesign, built from the owner's five-board design canvas, then
// re-ordered the same day (her second review) to follow the app's own logic:
// the transplant stop, the vaccines, who the patient is, what children and
// adults are given, how a recorded dose is checked, then the PneumoVax
// decisions and the sources. It is a view of the same tab, switched from the
// header ("Patient | Rulebook", as in PediVax's schedule builder); App.jsx
// keeps the patient form mounted but hidden, so a half-entered patient is
// still there on the way back.
//
// This file renders and decides nothing. Every sentence, age and interval
// comes from src/data/rulebook.js, which draws its numbers from the engine's
// constants and pairs each claim with a worked patient; the C14 guard runs
// every one of those patients through recommend().
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  ROUTINE_INFANT, CHILD_LANES, AT_NINETEEN, ADULT_BANDS, ADULT_OPTIONS, CHILD_EXCEPTIONS, INVALID_EXAMPLE,
  ADULT_HISTORY, TRANSPLANT_STOP, AGE_LINES, RISK_COLUMNS, RISK_RANKING, VACCINE_ROWS,
  SERIES_PATTERNS, CHIP_LEGEND, GRACE, PCV_AFTER_PCV, PCV_AND_PPSV23,
  INVALID_ACTIONS, ADULT_INTERVALS, SOURCE_GROUPS, HEADINGS, DECISIONS, DECISION, DECISION_USES,
  decisionsOf, sourcesFor,
} from '../data/rulebook.js';

const SECTIONS = [
  ['rb-vaccines', HEADINGS.vaccines],
  ['rb-who', HEADINGS.who],
  ['rb-kids', HEADINGS.kids],
  ['rb-adults', HEADINGS.adults],
  ['rb-spacing', HEADINGS.spacing],
  ['rb-decisions', HEADINGS.decisions],
  ['rb-sources', HEADINGS.sources],
];

/** What a decision says, as short labelled lines. Shared by the chip and part 6. */
function DecisionText({ d }) {
  return (
    <>
      {d.when && <span className="rb-dec-line"><strong>When:</strong> {d.when}</span>}
      {d.does && <span className="rb-dec-line"><strong>PneumoVax:</strong> {d.does}</span>}
      {d.cdc && <span className="rb-dec-line"><strong>CDC and ACIP:</strong> {d.cdc}</span>}
      <span className="rb-dec-line"><strong>Why:</strong> {d.why}</span>
    </>
  );
}

/**
 * "PneumoVax decision N" — a button that opens that decision's reason in
 * place (owner, 2026-11-01: "it should be clear to the user they can click to
 * expand. I don't want an unelegant sentence below the chip"). It is styled as
 * a link-coloured, underlined button like "Source", which is how it reads as
 * clickable without an instruction or an icon.
 */
function DecisionChip({ k }) {
  const [open, setOpen] = useState(false);
  const d = DECISION[k];
  return (
    <span className="rb-dec">
      <button type="button" className="rb-decision" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        PneumoVax decision {d.n}
      </button>
      {open && (
        <span className="rb-src-panel rb-dec-panel">
          <span className="rb-dec-title">{d.title}</span>
          <DecisionText d={d} />
        </span>
      )}
    </span>
  );
}

/** A row's decision chips, if it has any. */
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

function DoseBox({ children, ppsv, done, old, struck }) {
  const cls = ['rb-dose', ppsv && 'rb-dose-ppsv', done && 'rb-dose-done', old && 'rb-dose-old', struck && 'rb-dose-struck']
    .filter(Boolean).join(' ');
  return <span className={cls}>{children}</span>;
}

/** "PCV20 or PPSV23" with the PPSV23 half in the polysaccharide colour. */
function OrDose({ text }) {
  const parts = text.split(' or ');
  return parts.map((p, i) => (
    <React.Fragment key={p}>
      {i > 0 && <span className="rb-or"> or </span>}
      <span className={/PPSV23/.test(p) ? 'rb-ppsv-text' : undefined}>{p}</span>
    </React.Fragment>
  ));
}

function Card({ id, title, children, tone }) {
  return (
    <section className={`rb-card${tone ? ` rb-card-${tone}` : ''}`} aria-labelledby={id}>
      <h3 id={id} className="rb-h3">{title}</h3>
      {children}
    </section>
  );
}

// ── The stop: the first thing the app checks ─────────────────────────────
function Stop() {
  return (
    <Card id="rb-stop" title={TRANSPLANT_STOP.title} tone="stop">
      <p className="rb-body">{TRANSPLANT_STOP.text}<Decisions row={TRANSPLANT_STOP} /></p>
    </Card>
  );
}

// ── 1. The vaccines ──────────────────────────────────────────────────────
function Vaccines() {
  return (
    <>
      <p className="rb-lead">Two vaccine types. Conjugate vaccines (PCV, green) form every series. The polysaccharide vaccine (PPSV23, blue) is added only for at-risk patients, after a PCV.</p>
      <div className="rb-card rb-scroll">
        <table className="rb-table rb-fixed">
          <colgroup><col className="rb-w18" /><col className="rb-w12" /><col className="rb-w8" /><col /><col /></colgroup>
          <thead><tr><th>Vaccine</th><th>Minimum age</th><th>Counts?</th><th>Use in children</th><th>Use in adults</th></tr></thead>
          <tbody>
            {VACCINE_ROWS.map((g) => (
              <React.Fragment key={g.kind}>
                <tr className="rb-grp"><td colSpan={5}>{g.name}</td></tr>
                {g.rows.map((p) => {
                  // An at-risk child gets a line of its own under the vaccine.
                  const span = p.atRisk ? 2 : 1;
                  return (
                    <React.Fragment key={p.key}>
                      <tr>
                        <td rowSpan={span}><DoseBox ppsv={p.ppsv} old={p.old}>{p.name}</DoseBox><span className="rb-cell-note">{p.brand}</span></td>
                        <td rowSpan={span}>{p.minAge}</td>
                        <td rowSpan={span}>{p.valid ? 'Yes' : <strong className="rb-invalid-text">No</strong>}</td>
                        {p.both
                          ? <td colSpan={2}>{p.both}</td>
                          : <><td>{p.atRisk && <span className="rb-who">Healthy</span>}{p.child}</td><td rowSpan={span}>{p.adult}</td></>}
                      </tr>
                      {p.atRisk && <tr className="rb-subrow"><td><span className="rb-who">At risk</span>{p.atRisk}</td></tr>}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Card id="rb-patterns" title="Common series patterns">
        <p className="rb-small">A quick reference. Intervals are with each rule in the children&rsquo;s, adults&rsquo; and doses-on-the-record parts.</p>
        {SERIES_PATTERNS.map((pt) => (
          <div key={pt.name} className="rb-pattern">
            <strong className="rb-pattern-name">{pt.name}</strong>
            <div className="rb-pattern-doses">
              {pt.doses.map((d, i) => (
                <React.Fragment key={d.text}>
                  {i > 0 && <span className="rb-arrow" aria-hidden="true">&rarr;</span>}
                  <DoseBox ppsv={d.ppsv} old={d.old} struck={d.struck}>{d.text}</DoseBox>
                </React.Fragment>
              ))}
              <span className="rb-arrow" aria-hidden="true">&rarr;</span>
              {pt.end ? <span className="rb-small">{pt.end}</span> : <DoseBox done>Complete</DoseBox>}
            </div>
            {pt.note && <p className="rb-pattern-note">{pt.note}<Decisions row={pt} /></p>}
          </div>
        ))}
      </Card>
    </>
  );
}

// ── 2. Age and risk group ────────────────────────────────────────────────
function Who() {
  return (
    <>
      <Card id="rb-ages" title="Age lines">
        <div className="rb-agelines">
          {AGE_LINES.map((a) => (
            <div key={a.age} className="rb-ageline">
              <strong>{a.age}</strong>
              <span className="rb-small">{a.text}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card id="rb-groups" title="Risk groups">
        <p className="rb-small">What each group is given is in the children&rsquo;s and adults&rsquo; parts that follow.</p>
        <div className="rb-groups">
          {RISK_COLUMNS.map((c) => (
            <div key={c.key} className="rb-group">
              <strong className="rb-group-name">{c.name}</strong>
              <ul>{c.conditions.map((x) => <li key={x}>{x}</li>)}</ul>
              {c.note && <span className="rb-cell-note">{c.note}<Source row={c} /></span>}
            </div>
          ))}
        </div>
      </Card>

      <Card id="rb-multi" title="When a patient has more than one condition">
        <p className="rb-small">{RISK_RANKING.lead}</p>
        <ol className="rb-rank">
          {RISK_RANKING.steps.map((s) => <li key={s.name}><strong>{s.name}</strong></li>)}
        </ol>
      </Card>
    </>
  );
}

// ── 3. Children ──────────────────────────────────────────────────────────
function Children() {
  return (
    <div className="rb-card">
      <div>
        <p className="rb-label">Routine PCV series, all children ({ROUTINE_INFANT.products})<Source row={ROUTINE_INFANT} /></p>
        <div className="rb-timeline">
          {ROUTINE_INFANT.ages.map((age, i) => (
            <div key={age} className="rb-tick-col">
              <DoseBox>PCV dose {i + 1}{i === ROUTINE_INFANT.ages.length - 1 ? ' (booster)' : ''}</DoseBox>
              <span className="rb-tick" aria-hidden="true" />
              <span className="rb-tick-age">{age}</span>
            </div>
          ))}
        </div>
        <div className="rb-rail" aria-hidden="true" />
        <p className="rb-small">
          {ROUTINE_INFANT.total} doses if started on time. Children who start late need fewer doses,
          based on age at dose 1.
        </p>
      </div>

      <div>
        <p className="rb-label">{HEADINGS.lanes}</p>
        <div className="rb-lanes" role="table" aria-label={HEADINGS.lanes}>
          <div className="rb-lanes-row rb-lanes-head" role="row">
            {['Risk group', 'Step 1', 'Step 2', 'Step 3', 'Result'].map((h) => <span key={h} role="columnheader">{h}</span>)}
          </div>
          {CHILD_LANES.map((lane) => (
            <div key={lane.group} className="rb-lanes-row" role="row">
              <span className="rb-lane-name" role="rowheader">{lane.group}</span>
              {lane.steps.map((s, i) => (
                <span key={i} className="rb-lane-cell" role="cell" data-label={`Step ${i + 1}`}>
                  {s.kind === 'none'
                    ? <span className="rb-empty">None</span>
                    : <DoseBox><OrDose text={s.text} /></DoseBox>}
                  {s.note && <span className="rb-cell-note">{s.note}</span>}
                </span>
              ))}
              <span className="rb-lane-cell" role="cell" data-label="Result">
                <DoseBox done>{lane.result.text}</DoseBox>
                {lane.result.note && <span className="rb-cell-note">{lane.result.note}</span>}
                <span className="rb-cell-note"><Source row={lane} /></span>
              </span>
            </div>
          ))}
        </div>
        <p className="rb-small rb-handover">{AT_NINETEEN}</p>
      </div>
    </div>
  );
}

// ── 4. Adults ────────────────────────────────────────────────────────────
function Adults() {
  return (
    <div className="rb-card">
      <div className="rb-agebar">
        {ADULT_BANDS.map((b, i) => (
          <div key={b.label} className={`rb-agebar-seg rb-agebar-${i}`}>
            <strong>{b.label}</strong>
            <span>{b.sub}<Source row={b} /></span>
          </div>
        ))}
      </div>

      <div>
        <p className="rb-label">{ADULT_OPTIONS.lead}</p>
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
        <p className="rb-small rb-indent">{ADULT_OPTIONS.note}<Source row={ADULT_OPTIONS} /></p>
      </div>

      <div>
        <p className="rb-label">Prior pneumococcal vaccines</p>
        <div className="rb-scroll">
          <table className="rb-table rb-history">
            <thead><tr><th className="rb-w24">Vaccine history</th><th className="rb-w30">Risk group</th><th>Next step</th></tr></thead>
            <tbody>
              {ADULT_HISTORY.map((h) => h.splits.map((s, i) => (
                <tr key={h.history + i} className={i === 0 ? 'rb-hist-first' : undefined}>
                  {i === 0 && <td rowSpan={h.splits.length} className="rb-strong-wrap">{h.history}</td>}
                  <td className={s.risk ? undefined : 'rb-any'}>{s.risk ?? 'Any'}</td>
                  <td>
                    {s.complete ? <strong className="rb-complete">{s.next}</strong> : s.next}
                    <Decisions row={s} />
                    <Source row={s} />
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── 5. Doses on the record ───────────────────────────────────────────────
const CHIP_CLASS = { valid: 'dose-val-valid', invalid: 'dose-val-invalid', extra: 'dose-val-offwindow' };
const Chip = ({ tone, children }) => <span className={`dose-val-chip ${CHIP_CLASS[tone]}`}>{children}</span>;

function Spacing() {
  return (
    <>
      <p className="rb-lead">Each dose on the record is checked against the dose before it, and the label on the dose shows the result. The intervals below are minimums; the result card still recommends the routine date.</p>

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

      <Card id="rb-kid-gaps" title="Children: a dose given before the minimum interval does not count, with three exceptions">
        <p className="rb-band rb-band-green"><strong>{GRACE.title}</strong> {GRACE.text} <Chip tone="invalid">Invalid</Chip></p>
        <div>
          <h4 className="rb-h4">The dose still counts when</h4>
          <ul className="rb-bullets">
            {CHILD_EXCEPTIONS.map((x) => <li key={x.text}>{x.text}<Decisions row={x} /></li>)}
          </ul>
        </div>

        <h4 className="rb-h4">PCV after PCV (CDC catch-up schedule)</h4>
        <div className="rb-scroll">
          <table className="rb-table">
            <thead><tr><th className="rb-w18">Doses</th><th>When</th><th className="rb-w18">Minimum interval</th></tr></thead>
            <tbody>
              {PCV_AFTER_PCV.rows.map((r, i) => (
                <tr key={r.when}>
                  {(i === 0 || PCV_AFTER_PCV.rows[i - 1].doses !== r.doses) && (
                    <td className="rb-strong" rowSpan={PCV_AFTER_PCV.rows.filter((x) => x.doses === r.doses).length}>{r.doses}</td>
                  )}
                  <td>{r.when}</td>
                  <td className="rb-strong">{r.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="rb-h4">PCV and PPSV23</h4>
        <div className="rb-scroll">
          <table className="rb-table">
            <thead><tr><th className="rb-w30">Doses</th><th>Minimum interval</th></tr></thead>
            <tbody>
              {PCV_AND_PPSV23.map((r) => (
                <tr key={r.doses}>
                  <td>{r.doses}</td>
                  <td>
                    <strong>{r.gap}</strong><Decisions row={r} />
                    {r.text && <span className="rb-cell-text">{r.text}</span>}
                    {r.sub && <span className="rb-cell-note">{r.sub} <Chip tone="extra">{r.subChip}</Chip></span>}
                    <Source row={r} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rb-invalid-box">
          <h4 className="rb-h4">Repeating an <Chip tone="invalid">Invalid</Chip> dose</h4>
          <p className="rb-label">{INVALID_EXAMPLE.lead}</p>
          <ol className="rb-steps">
            {INVALID_EXAMPLE.steps.map((st) => (
              <li key={st.chip + st.example} className="rb-step">
                <span className="rb-step-when">{st.example}</span>
                <Chip tone={st.tone}>{st.chip}</Chip>
                <span className="rb-small">{st.text}</span>
              </li>
            ))}
          </ol>
          <div className="rb-scroll">
            <table className="rb-table">
              <thead><tr><th className="rb-w40">Invalid dose</th><th>What to do</th></tr></thead>
              <tbody>
                {INVALID_ACTIONS.rows.map((r) => (
                  <tr key={r.dose}>
                    <td>{r.dose}</td>
                    <td>
                      {r.strong ? <>{r.action.split(r.strong)[0]}<strong>{r.strong}</strong>{r.action.split(r.strong)[1]}</> : r.action}
                      <Decisions row={r} />
                      <Source row={r} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="rb-small">{INVALID_ACTIONS.timing}</p>
        </div>
      </Card>

      <Card id="rb-adult-gaps" title="Adults: a dose given before the recommended interval still counts">
        <p className="rb-band rb-band-blue">{ADULT_INTERVALS.lead}</p>
        <div className="rb-scroll">
          <table className="rb-table">
            <thead><tr><th className="rb-w40">Doses</th><th>Recommended interval</th></tr></thead>
            <tbody>
              {ADULT_INTERVALS.rows.map((r) => (
                <tr key={r.doses}>
                  <td>{r.doses}</td>
                  <td>
                    {r.gap && <strong>{r.gap}</strong>}
                    {r.gap && r.text ? ' ' : ''}
                    {r.text}
                    <Decisions row={r} />
                    <Source row={r} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ── 6. PneumoVax decisions ───────────────────────────────────────────────
function DecisionList() {
  return (
    <>
      <p className="rb-lead">Where CDC and ACIP give no answer, PneumoVax chose one. Each is numbered; the same number marks it wherever it applies on this page.</p>
      <div className="rb-card">
        <ol className="rb-declist">
          {DECISIONS.map((d) => (
            <li key={d.key} id={`rb-decision-${d.key}`} className="rb-declist-item">
              <span className="rb-decision rb-decision-static">PneumoVax decision {d.n}</span>
              <strong className="rb-dec-title">{d.title}</strong>
              <span className="rb-dec-body"><DecisionText d={d} /></span>
              <span className="rb-cell-note">Applies in: {DECISION_USES[d.key].join('; ')}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

// ── 7. Sources ───────────────────────────────────────────────────────────
const SOURCE_HEADINGS = { child: 'Children', adult: 'Adults', any: 'Children and adults' };
function Sources() {
  return (
    <>
      <p className="rb-lead">Grouped by patient population. CDC and ACIP documents are listed first. A document&rsquo;s count is how many distinct passages of it the app quotes on result cards.</p>
      <div className="rb-card rb-src-grid">
        {SOURCE_GROUPS.map((g) => (
          <div key={g.book} className="rb-src-col">
            <h3 className="rb-h3">{SOURCE_HEADINGS[g.book]}</h3>
            {g.docs.map((d) => (
              <div key={d.name} className="rb-doc">
                <a href={d.url} target="_blank" rel="noopener noreferrer">{d.label}</a>
                {d.describes && <span className="rb-cell-note">{d.describes}</span>}
                <span className="rb-cell-note">
                  {d.publisher}
                  {d.quotes ? ` · ${d.quotes} sentence${d.quotes === 1 ? '' : 's'} quoted` : ' · listed, not quoted'}
                  {d.lastVerified ? ` · read ${d.lastVerified}` : ''}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

const BODY = {
  'rb-vaccines': Vaccines, 'rb-who': Who, 'rb-kids': Children, 'rb-adults': Adults,
  'rb-spacing': Spacing, 'rb-decisions': DecisionList, 'rb-sources': Sources,
};

export default function Rulebook() {
  return (
    <div className="rb">
      <div className="rb-top">
        <h1 className="rb-title">Rulebook</h1>
        <p className="rb-intro">
          Recommendations are based on age, risk conditions and dated vaccine history. The parts
          below follow the order the app decides in. Source shows the CDC or ACIP sentence a rule
          rests on; a PneumoVax decision marks a rule they do not state, and opens to say why.
        </p>
      </div>

      <nav aria-label="On this page" className="rb-nav">
        {SECTIONS.map(([id, name], i) => <a key={id} href={`#${id}`}>{i + 1}. {name}</a>)}
      </nav>

      <Stop />

      {SECTIONS.map(([id, name], i) => {
        const Body = BODY[id];
        return (
          <section key={id} className="rb-section" aria-labelledby={id}>
            <h2 id={id} className="rb-h2">{i + 1}. {name}</h2>
            <Body />
          </section>
        );
      })}

      <p className="rb-foot">
        This page is a guide to the app&rsquo;s reasoning, not a clinical reference. Where it and a
        CDC or ACIP document disagree, the document is right and this is a bug. Please report it.
      </p>
    </div>
  );
}
