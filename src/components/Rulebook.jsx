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
import React, { useState, useMemo } from 'react';
import {
  BOUNDARIES, PATHWAYS, PRODUCTS, RISK_GROUPS, INTERVAL_RULES, SOURCES,
  OUTCOMES, AUTHORITIES, EVIDENCE, RULEBOOK_GROUPS,
  buildExamples, EXAMPLE_GROUPS, monthsInWords,
} from '../data/rulebook.js';

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

const SOURCE_SCOPE = { child: 'children', adult: 'adults', any: 'any age' };
const AUTHORITY_NAME = Object.fromEntries(AUTHORITIES.map((a) => [a.authority, a.name]));

export default function Rulebook({ onClose, today }) {
  // Run once per mount, not once per render: `recommend()` is pure, but these
  // are 14 real engine runs and a re-render must not repeat them.
  const examples = useMemo(() => buildExamples(today), [today]);
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
                <td>{p.youngestAge}</td>
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
        lead="CDC’s own PneumoRecs tool cannot answer this — it never asks for dose dates. This is all of what this app does with them."
      >
        <h3 className="rb-h3">The three things that can happen to a dose</h3>
        <table className="rb-table">
          <tbody>
            {OUTCOMES.map((o) => (
              <tr key={o.name}>
                <td className="rb-td-outcome"><strong>{o.name}</strong></td>
                <td>{o.means}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="rb-note">{EVIDENCE.grace}</p>
        <p className="rb-note">{EVIDENCE.asOf}</p>

        <h3 className="rb-h3">Where the evidence runs out</h3>
        <p className="rb-note">{EVIDENCE.lead}</p>
        <ul className="rb-plain-list">
          {EVIDENCE.points.map((pt) => (
            <li key={pt.name}>
              <strong>{pt.name}</strong>
              <span className="rb-sub">{pt.means}</span>
            </li>
          ))}
        </ul>
        <ul className="rb-rule-list">
          {EVIDENCE.pairs.map((row) => (
            <li key={row.pair} className="rb-rule">
              <div className="rb-rule-what">{row.pair}</div>
              <div className="rb-rule-gap"><strong>{`${row.childLabel}: `}</strong>{row.child}</div>
              <div className="rb-rule-gap"><strong>{`${row.adultLabel}: `}</strong>{row.adult}</div>
            </li>
          ))}
        </ul>

        <h3 className="rb-h3">Every rule the app applies</h3>
        <ul className="rb-plain-list">
          {AUTHORITIES.map((a) => (
            <li key={a.authority}>
              <strong>{a.name}</strong>
              <span className="rb-sub">{a.means}</span>
            </li>
          ))}
        </ul>
        {RULEBOOK_GROUPS.map((g) => {
          const rows = INTERVAL_RULES.filter((r) => r.rulebook === g.rulebook);
          if (!rows.length) return null;
          return (
            <div key={g.rulebook} className="rb-group rb-book">
              <h4 className="rb-h4">{g.name}</h4>
              <p className="rb-book-lead">{g.means}</p>
              <ul className="rb-rule-list">
                {rows.map((r) => (
                  <li key={r.id} className="rb-rule">
                    <div className="rb-rule-what">
                      {r.what}
                      <span className="rb-tag">{AUTHORITY_NAME[r.authority] ?? r.authority}</span>
                    </div>
                    {r.whyNotJudged ? (
                      <div className="rb-rule-gap">{`${r.outcome}: ${r.whyNotJudged}`}</div>
                    ) : (
                      <>
                        <div className="rb-rule-gap">
                          {`${r.intervalLabel}: `}
                          {r.interval ?? r.intervalVaries}
                        </div>
                        <div className="rb-rule-out">{`If the gap is shorter: ${r.outcome}`}</div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </Section>

      <Section
        title="5. Worked examples — a history in, a dose out"
        lead="Fourteen real patients put through the engine when this page loads. Nothing here is typed: change a rule and these rows change with it."
      >
        <p className="rb-note">
          Use these to check the app against a document. Each row is a history on the left and
          the engine&rsquo;s own answer on the right &mdash; the dose, the interval it carries, and
          the date it can be given. Where a patient is offered a choice, every option is shown.
        </p>
        {EXAMPLE_GROUPS.map((g) => {
          const rows = examples.filter((e) => e.book === g.book);
          if (!rows.length) return null;
          return (
            <div key={g.book} className="rb-group rb-book">
              <h4 className="rb-h4">{g.name}</h4>
              <p className="rb-book-lead">{g.means}</p>
              <ul className="rb-rule-list">
                {rows.map((e) => (
                  <li key={`${e.book}-${e.age}-${e.history}`} className="rb-rule">
                    <div className="rb-rule-what">{`${e.age} — ${e.risk}`}</div>
                    <div className="rb-rule-gap">{e.history}</div>
                    <ul className="rb-ex-due">
                      {e.due.map((d) => (
                        <li key={d.label}>
                          {d.label}
                          {d.when && <span className="rb-tag">{d.when}</span>}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </Section>

      <Section
        title="6. Where the rules come from"
        lead="Every document the app can put on a card, and the date each was last read."
      >
        <ul className="rb-plain-list">
          {SOURCES.map((s) => (
            <li key={s.name}>
              <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
              <span className="rb-sub">
                Written about {SOURCE_SCOPE[s.rulebook] ?? s.rulebook}
                {s.lastVerified ? ` · read on ${s.lastVerified}` : ''}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <p className="rb-foot">
        This page is a guide to the app&rsquo;s reasoning, not a clinical reference. Where it
        and a CDC or ACIP document disagree, the document is right and this is a bug — please
        report it.
      </p>
    </div>
  );
}
