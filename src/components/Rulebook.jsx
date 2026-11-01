// ─────────────────────────────────────────────────────────────────────────
// Rulebook.jsx — "How PneumoVax decides".
//
// 2026-11-01 redesign, built from the owner's five-board design canvas: the
// standard schedules first, then what each risk group changes, how the
// vaccines combine, the minimum intervals with the app's own dose-chip words,
// and the sources. It opens in its own browser tab (App.jsx, `?rules`), so a
// half-entered patient in the first tab is never covered or lost.
//
// This file renders and decides nothing. Every sentence, age and interval
// comes from src/data/rulebook.js, which draws its numbers from the engine's
// constants and pairs each claim with a worked patient; the C14 guard runs
// every one of those patients through recommend().
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  EXCEPTION_NOTE, ROUTINE_INFANT, CHILD_LANES, CHILD_NOTES, ADULT_BANDS, ADULT_OPTIONS,
  ADULT_HISTORY, TRANSPLANT_STOP, RISK_COLUMNS, RISK_MATRIX, RISK_RANKING, VACCINE_ROWS,
  SERIES_PATTERNS, CHIP_LEGEND, GRACE, PCV_AFTER_PCV, PCV_AND_PPSV23, PPSV_THEN_PCV_DECISION,
  INVALID_ACTIONS, ADULT_INTERVALS, SOURCE_GROUPS, HEADINGS, sourcesFor,
} from '../data/rulebook.js';

const SECTIONS = [
  ['rb-sched', 'Standard schedules'],
  ['rb-risks', 'Risk groups'],
  ['rb-vaccines', 'The vaccines and how they combine'],
  ['rb-spacing', HEADINGS.spacing],
  ['rb-sources', 'Sources'],
];

/** The small grey "PneumoVax decision" mark. Defined under every table that uses it. */
const Decision = () => <span className="rb-decision">PneumoVax decision</span>;

/**
 * "Source": the sentences the app's own cards cite for this row's worked
 * patients, and who those patients are. Run on open, never stored.
 */
function Source({ ex }) {
  const [open, setOpen] = useState(false);
  if (!ex || !ex.length) return null;
  const quotes = open ? sourcesFor(ex) : [];
  return (
    <span className="rb-src">
      <button type="button" className="rb-src-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide source' : 'Source'}
      </button>
      {open && (
        <span className="rb-src-panel">
          {quotes.map((q) => (
            <span key={q.quote} className="rb-src-quote">
              &ldquo;{q.quote}&rdquo;
              <a href={q.url} target="_blank" rel="noopener noreferrer" className="rb-src-doc">{q.doc}</a>
            </span>
          ))}
          {!quotes.length && <span className="rb-src-quote">PneumoVax decision; no CDC or ACIP sentence states this.</span>}
          <span className="rb-src-who">Checked on: {ex.map((e) => e.who).join('; ')}.</span>
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

// ── 1. The standard schedules ────────────────────────────────────────────
function Schedules() {
  return (
    <>
      <Card id="rb-kids" title={HEADINGS.kids}>
        <div>
          <p className="rb-label">Routine PCV series, all children ({ROUTINE_INFANT.products}) <Source ex={[ROUTINE_INFANT.ex]} /></p>
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
                  <Source ex={lane.ex} />
                </span>
              </div>
            ))}
          </div>
          <ul className="rb-bullets">
            {CHILD_NOTES.map((n) => <li key={n.text}>{n.text} <Source ex={n.ex} /></li>)}
          </ul>
        </div>
      </Card>

      <Card id="rb-adults" title={HEADINGS.adults}>
        <div className="rb-agebar">
          {ADULT_BANDS.map((b, i) => (
            <div key={b.label} className={`rb-agebar-seg rb-agebar-${i}`}>
              <strong>{b.label}</strong>
              <span>{b.sub} <Source ex={b.ex} /></span>
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
          <p className="rb-small rb-indent">{ADULT_OPTIONS.note} <Source ex={ADULT_OPTIONS.ex} /></p>
        </div>

        <div>
          <p className="rb-label">Prior pneumococcal vaccines</p>
          <div className="rb-scroll">
            <table className="rb-table">
              <thead><tr><th className="rb-w30">Vaccine history</th><th>Next step</th></tr></thead>
              <tbody>
                {ADULT_HISTORY.map((r) => (
                  <tr key={r.history}>
                    <td>{r.history}</td>
                    <td>
                      {r.complete ? <strong className="rb-complete">{r.next}</strong> : r.next}
                      {r.decision && <> <Decision /></>}
                      {' '}<Source ex={r.ex} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="rb-def"><Decision /> CDC and ACIP do not address an invalid PPSV23. PneumoVax still times the next PCV from it, because the spacing is about the immune response, not whether the dose counted.</p>
        </div>
      </Card>

      <Card id="rb-stop" title={TRANSPLANT_STOP.title} tone="stop">
        <p className="rb-body">{TRANSPLANT_STOP.text} <Source ex={TRANSPLANT_STOP.ex} /></p>
      </Card>
    </>
  );
}

// ── 2. Risk groups ───────────────────────────────────────────────────────
function Risks() {
  return (
    <>
      <p className="rb-lead">Risk conditions fall into four groups. The group decides the recommendation. A box spanning several columns means the same answer applies.</p>
      <div className="rb-card rb-scroll">
        <table className="rb-matrix">
          <colgroup><col className="rb-w24" /><col /><col /><col /><col /></colgroup>
          <thead>
            <tr><td />{RISK_COLUMNS.map((c) => <th key={c.key} scope="col">{c.name}</th>)}</tr>
          </thead>
          <tbody>
            <tr className="rb-matrix-sec"><td colSpan={5}>Conditions</td></tr>
            <tr>
              <th scope="row" className="rb-matrix-row">Included</th>
              {RISK_COLUMNS.map((c) => (
                <td key={c.key} className="rb-matrix-list">
                  <ul>{c.conditions.map((x) => <li key={x}>{x}</li>)}</ul>
                  {c.note && <span className="rb-cell-note">{c.note}</span>}
                </td>
              ))}
            </tr>
            {RISK_MATRIX.map((sec) => (
              <React.Fragment key={sec.section}>
                <tr className="rb-matrix-sec"><td colSpan={5}>{sec.section}</td></tr>
                {sec.rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="rb-matrix-row">{row.label}</th>
                    {row.cells.map((c) => (
                      <td key={c.text} colSpan={c.span} rowSpan={c.rows ?? 1} className={`rb-tone-${c.tone}`}>
                        {c.text} <Source ex={c.ex} />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Card id="rb-multi" title="When a patient has more than one condition">
        <p className="rb-small">{RISK_RANKING.lead}</p>
        <ol className="rb-rank">
          {RISK_RANKING.steps.map((s) => (
            <li key={s.name}><strong>{s.name}</strong><span className="rb-small">{s.text} <Source ex={s.ex} /></span></li>
          ))}
        </ol>
      </Card>
    </>
  );
}

// ── 3. The vaccines and how they combine ─────────────────────────────────
function Vaccines() {
  return (
    <>
      <p className="rb-lead">Two vaccine types. Conjugate vaccines (PCV, green) form every series. The polysaccharide vaccine (PPSV23, blue) is added only for at-risk patients, after a PCV.</p>
      <div className="rb-card rb-scroll">
        <table className="rb-table rb-fixed">
          <colgroup><col className="rb-w18" /><col className="rb-w12" /><col className="rb-w8" /><col /><col /></colgroup>
          <thead><tr><th>Vaccine</th><th>Minimum age</th><th>Valid?</th><th>Use in children</th><th>Use in adults</th></tr></thead>
          <tbody>
            {VACCINE_ROWS.map((g) => (
              <React.Fragment key={g.kind}>
                <tr className="rb-grp"><td colSpan={5}>{g.name}</td></tr>
                {g.rows.map((p) => (
                  <tr key={p.key}>
                    <td><DoseBox ppsv={p.ppsv} old={p.old}>{p.name}</DoseBox><span className="rb-cell-note">{p.brand}</span></td>
                    <td>{p.minAge}</td>
                    <td>{p.valid ? 'Yes' : <strong className="rb-invalid-text">No</strong>}</td>
                    {p.both ? <td colSpan={2}>{p.both}</td> : <><td>{p.child}</td><td>{p.adult}</td></>}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Card id="rb-patterns" title="Common series patterns">
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
            {(pt.note || pt.decision) && (
              <p className="rb-pattern-note">
                {pt.note}
                {pt.decision && <> <Decision /> {pt.decision}</>}
                {' '}<Source ex={pt.ex} />
              </p>
            )}
            {!pt.note && !pt.decision && <p className="rb-pattern-note"><Source ex={pt.ex} /></p>}
          </div>
        ))}
      </Card>
    </>
  );
}

// ── 4. Minimum intervals and the 4-day grace ─────────────────────────────
const CHIP_CLASS = { valid: 'dose-val-valid', invalid: 'dose-val-invalid', extra: 'dose-val-offwindow' };
const Chip = ({ tone, children }) => <span className={`dose-val-chip ${CHIP_CLASS[tone]}`}>{children}</span>;

function Spacing() {
  return (
    <>
      <p className="rb-lead">Each dose on the record is checked against the dose before it, and the label on the dose shows the result. The intervals below are minimums; the result card still recommends the routine date.</p>

      <Card id="rb-labels" title="What the label on a dose means">
        <div className="rb-legend">
          {CHIP_LEGEND.map((c) => (
            <div key={c.chip + c.text} className="rb-legend-item">
              <span><Chip tone={c.tone}>{c.chip}</Chip></span>
              <span className="rb-small">{c.text} <Source ex={c.ex} /></span>
            </div>
          ))}
        </div>
      </Card>

      <Card id="rb-kid-gaps" title="Children: a dose given before the minimum interval is invalid">
        <p className="rb-band rb-band-green"><strong>{GRACE.title}</strong> {GRACE.text} <Chip tone="invalid">Invalid</Chip></p>

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
                    <strong>{r.gap}</strong>{r.decision && <> <Decision /></>}
                    {r.text && <span className="rb-cell-text">{r.text}</span>}
                    {r.sub && <span className="rb-cell-note">{r.sub} <Chip tone="extra">{r.subChip}</Chip></span>}
                    {' '}<Source ex={r.ex} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="rb-def"><Decision /> {PPSV_THEN_PCV_DECISION}</p>

        <div className="rb-invalid-box">
          <h4 className="rb-h4">Repeating an <Chip tone="invalid">Invalid</Chip> dose</h4>
          <div className="rb-scroll">
            <table className="rb-table">
              <thead><tr><th className="rb-w40">Invalid dose</th><th>What to do</th></tr></thead>
              <tbody>
                {INVALID_ACTIONS.rows.map((r) => (
                  <tr key={r.dose}>
                    <td>{r.dose}</td>
                    <td>
                      {r.strong ? <>{r.action.split(r.strong)[0]}<strong>{r.strong}</strong>{r.action.split(r.strong)[1]}</> : r.action}
                      {r.decision && <> <Decision /></>}
                      {' '}<Source ex={r.ex} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="rb-def"><Decision /> {INVALID_ACTIONS.decision}</p>
          {INVALID_ACTIONS.facts.map((f) => (
            <div key={f.name} className="rb-fact">
              <strong>{f.name}</strong>
              <span>{f.text ?? f.example} {f.ex && <Source ex={f.ex} />}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card id="rb-adult-gaps" title="Adults: a dose given before the recommended interval is still valid">
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
                    {r.decision && <> <Decision /></>}
                    {' '}<Source ex={r.ex} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="rb-def"><Decision /> {ADULT_INTERVALS.decision}</p>
      </Card>
    </>
  );
}

// ── 5. Sources ───────────────────────────────────────────────────────────
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

const BODY = { 'rb-sched': Schedules, 'rb-risks': Risks, 'rb-vaccines': Vaccines, 'rb-spacing': Spacing, 'rb-sources': Sources };

export default function Rulebook() {
  return (
    <div className="rb">
      <div className="rb-top">
        <h1 className="rb-title">How PneumoVax decides</h1>
        <p className="rb-intro">Recommendations are based on age, risk conditions and dated vaccine history. When CDC lists more than one option, each is shown (Option A, Option B).</p>
        <p className="rb-band"><strong>Exception</strong> <Decision /> {EXCEPTION_NOTE}</p>
        <p className="rb-small">This page opened in its own tab; the patient you were entering is still in the other tab.</p>
      </div>

      <nav aria-label="On this page" className="rb-nav">
        {SECTIONS.map(([id, name], i) => <a key={id} href={`#${id}`}>{i + 1}. {name}</a>)}
      </nav>

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
