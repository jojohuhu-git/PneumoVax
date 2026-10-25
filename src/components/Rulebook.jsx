// ─────────────────────────────────────────────────────────────────────────
// Rulebook.jsx — "How recommendations are made".
//
// A map of the rules a clinician can follow to see how the app reaches its
// answer. It makes NO clinical claim of its own: every age, product, risk
// condition and dose-spacing rule on this page is read live from the same
// file the engine reads (src/data/rulebook.js says which), and the connecting
// sentences are checked against the engine by
// regression-2026-10-25-rulebook-matches-the-engine.test.js.
// ─────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { BOUNDARIES, PATHWAYS, PRODUCTS, RISK_GROUPS, INTERVAL_GROUPS, SOURCE_GROUPS, monthsInWords } from '../data/rulebook.js';

function Section({ title, lead, children, open: initial = false }) {
  const [open, setOpen] = useState(initial);
  return (
    <section className="rb-section">
      <button type="button" className="rb-section-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="rb-section-title">{title}</span>
        <span className="rb-section-mark" aria-hidden="true">{open ? '–' : '+'}</span>
      </button>
      <p className="rb-section-lead">{lead}</p>
      {open && <div className="rb-section-body">{children}</div>}
    </section>
  );
}

/**
 * One row of the lookup, plus the two things that do not fit in a cell: the
 * paediatric conjugate GRID (a number that depends on the dose number and two
 * ages is not a number) and the SOURCE SENTENCE, which is the owner's stated
 * reason for the whole reorganisation - checking a rule should not mean
 * opening a CDC page.
 *
 * The rule's internal id is deliberately NOT shown. It used to print under
 * every row; a clinician has no use for `CHILD-PCV-AFTER-PCV` and it was the
 * most list-like thing on a page that is meant to be a table.
 */
function RuleRow({ r }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr>
        {/* `data-label` is what keeps this readable on a phone. The shared
            mobile rule turns every cell into a block and hides the header
            row, which is fine for a 3-column table and unreadable for a
            6-column one - six unlabelled values stacked. The label is
            printed from the attribute below 560px and ignored above it. */}
        <td data-label="Risk group">{r.risk}</td>
        <td data-label="Already on the record">{r.record}</td>
        <td data-label="Dose being given">{r.giving}</td>
        <td data-label="Measured from">{r.from}</td>
        <td data-label="Shortest acceptable gap"><strong>{r.gap}</strong></td>
        {/* NO BOILERPLATE IN THE CELL. What "counts, with a note" means, and
            what it means for a rule to be this app's own judgement rather
            than CDC's, are the SAME two sentences on every row - printed per
            row they tripled the height of the table and buried the one phrase
            that differs. They are stated once in the legend above instead,
            which is also the owner's standing style rule: abbreviated, with
            an expander, worded clinically and succinctly. */}
        <td data-label="If it is shorter">
          <strong>{r.ifShorter}.</strong>
          {r.authority === 'OWNER' && <span className="rb-flag">this app&rsquo;s own judgement</span>}
          {r.source && (
            <button type="button" className="rb-why" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              {open ? 'Hide source' : 'Source'}
            </button>
          )}
        </td>
      </tr>
      {r.grid && (
        <tr className="rb-subrow">
          <td colSpan={6}>
            <table className="rb-table rb-inner">
              <thead><tr><th>Which dose</th><th>Shortest acceptable gap</th></tr></thead>
              <tbody>
                {r.grid.map((c) => (
                  <tr key={c.when}><td>{c.when}</td><td><strong>{c.gap}</strong></td></tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
      {open && r.source && (
        <tr className="rb-subrow"><td colSpan={6}><p className="rb-source">{r.source}</p></td></tr>
      )}
    </>
  );
}


export default function Rulebook({ onClose }) {
  return (
    <div className="rb">
      <div className="rb-top">
        <h1 className="rb-title">How recommendations are made</h1>
        <button type="button" className="btn btn-back rb-close" onClick={onClose}>Back to the patient</button>
      </div>

      <p className="rb-intro">
        The app asks three things — the patient&rsquo;s age, their risk conditions, and the
        pneumococcal doses already given with their dates — and then follows the rules below
        in order. This page is that order, written out. Everything on it comes from the same
        files the recommendation itself is built from, and a test fails if the two stop
        matching.
      </p>

      <Section
        open
        title="1. Which set of rules the patient gets"
        lead="Age decides this first, except for one condition that overrides everything."
      >
        <ol className="rb-path-list">
          {PATHWAYS.map((p) => (
            <li key={p.id} className="rb-path">
              <div className="rb-path-name">{p.name}</div>
              <div className="rb-path-when">{p.whenWritten}</div>
              <p className="rb-path-sum">{p.writtenSummary}</p>
            </li>
          ))}
        </ol>
        <h3 className="rb-h3">The three ages that decide it</h3>
        <p className="rb-note">
          These are three different ideas and the app keeps them apart on purpose. Two of them
          are about the schedule; the third is only about one product.
        </p>
        <table className="rb-table">
          <thead>
            <tr><th>Age</th><th>What it decides</th></tr>
          </thead>
          <tbody>
            {BOUNDARIES.map((b) => (
              <tr key={b.constant}>
                <td className="rb-td-age"><strong>{monthsInWords(b.months)}</strong><span className="rb-sub">{b.name}</span></td>
                <td>{b.means}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section
        title="2. Which risk group the patient is in"
        lead="The risk conditions are not one list. They fall into groups, and the group changes the answer."
      >
        {RISK_GROUPS.map((g) => (
          <div key={g.group} className="rb-group">
            <h3 className="rb-h3">{g.name}</h3>
            <p className="rb-note">{g.means}</p>
            <ul className="rb-plain-list">
              {g.conditions.map((c) => (
                <li key={c.id}>
                  {c.label}
                  {c.adultOnly && <span className="rb-tag">adults only</span>}
                  {c.sublabel && <span className="rb-sub">{c.sublabel}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="rb-note">
          If more than one is ticked, the app carries all of them. It does not pick one and
          discard the rest.
        </p>
      </Section>

      <Section
        title="3. Which doses count, and what each product does"
        lead="A dose on the record is not automatically a dose in the series."
      >
        <table className="rb-table">
          <thead>
            <tr><th>Product</th><th>Counts?</th><th>Youngest age</th><th>What it does to the series</th></tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => (
              <tr key={p.key}>
                <td><strong>{p.label}</strong>{!p.active && <span className="rb-tag">no longer given</span>}</td>
                <td>{p.counts ? 'Yes' : 'No'}</td>
                <td>{p.minAgeDays < 60 ? `${p.minAgeDays} days` : monthsInWords(Math.round(p.minAgeM))}</td>
                <td>
                  {!p.counts && 'Never counted towards the series. A patient whose only doses are these is treated as not yet vaccinated.'}
                  {p.counts && p.completesSeries && 'A series that includes this one is finished — nothing further is needed.'}
                  {p.counts && p.requiresPPSV23 && 'Always needs a PPSV23 afterwards to finish the series.'}
                  {p.counts && !p.completesSeries && !p.requiresPPSV23 && 'Counts as a dose in the series; what follows depends on age and risk.'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section
        title="4. Whether a dose already given was far enough after the last one"
        lead="Look your patient up: their age, their risk group, and what is already on their record. This is the part CDC's own PneumoRecs tool cannot do, because it never asks for dose dates."
      >
        <dl className="rb-legend">
          <dt>Does not count</dt>
          <dd>The dose stays on the record with an explanation, and the series still owes a dose.</dd>
          <dt>Counts, with a note</dt>
          <dd>The dose is kept and the shortfall is written on it.</dd>
          <dt>Never flagged</dt>
          <dd>Deliberately not checked; the reason is recorded in the rule.</dd>
          <dt>this app&rsquo;s own judgement</dt>
          <dd>
            Marked on the few rows where CDC and ACIP state the interval but do <em>not</em>{' '}
            say a shorter gap invalidates the dose. Treating it as a cut-off is this
            app&rsquo;s decision, and the app says so on the dose itself. Every unmarked row
            is CDC&rsquo;s or ACIP&rsquo;s own.
          </dd>
          <dt>Source</dt>
          <dd>Opens the sentence that row rests on, so checking a rule need not mean opening a CDC page.</dd>
        </dl>
        {INTERVAL_GROUPS.map((g) => (
          <div key={g.book} className="rb-group">
            <h3 className="rb-h3">{g.name}</h3>
            <table className="rb-table rb-lookup">
              <thead>
                <tr>
                  <th>Risk group</th>
                  <th>Already on the record</th>
                  <th>Dose being given</th>
                  <th>Measured from</th>
                  <th>Shortest acceptable gap</th>
                  <th>If it is shorter</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <RuleRow key={r.id} r={r} />
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </Section>

      <Section
        title="5. Where the rules come from"
        lead="Grouped by who the document is about, then by publisher — CDC and ACIP first, because they outrank the rest."
      >
        <p className="rb-note">
          &ldquo;Sentences quoted&rdquo; is how many distinct passages of that document the app
          puts on cards. A document it quotes seventeen times and one it quotes once are
          different things to go and check.
        </p>
        {SOURCE_GROUPS.map((g) => (
          <div key={g.book} className="rb-group">
            <h3 className="rb-h3">{g.name}</h3>
            <ul className="rb-plain-list">
              {g.docs.map((d) => (
                <li key={d.name}>
                  <a href={d.url} target="_blank" rel="noreferrer">{d.label}</a>
                  {d.describes && <span className="rb-sub">{d.describes}</span>}
                  <span className="rb-sub">
                    {d.publisher}
                    {d.quotes ? ` \u00b7 ${d.quotes} sentence${d.quotes === 1 ? '' : 's'} quoted` : ' \u00b7 listed, not quoted'}
                    {d.lastVerified ? ` \u00b7 read on ${d.lastVerified}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      <p className="rb-foot">
        This page is a guide to the app&rsquo;s reasoning, not a clinical reference. Where it
        and a CDC or ACIP document disagree, the document is right and this is a bug — please
        report it.
      </p>
    </div>
  );
}
