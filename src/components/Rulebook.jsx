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
import { BOUNDARIES, PATHWAYS, PRODUCTS, RISK_GROUPS, INTERVAL_RULES, OWNER_INTERVAL_CALLS, WRITTEN_JUDGEMENT_CALLS, SOURCES, monthsInWords } from '../data/rulebook.js';

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
        lead="This is the part CDC's own PneumoRecs tool cannot do, because it never asks for dose dates. Every rule the app uses is here."
      >
        <p className="rb-note">
          Each rule says what happens when the gap is too short. <strong>Does not count</strong>{' '}
          means the dose stays on the record with an explanation but the series still owes a
          dose. <strong>Counted, with a note</strong> means the dose is kept and the shortfall
          is written on it.
        </p>
        {['child', 'adult', 'any'].map((book) => {
          const rows = INTERVAL_RULES.filter((r) => r.rulebook === book);
          if (!rows.length) return null;
          return (
            <div key={book} className="rb-group">
              <h3 className="rb-h3">{book === 'child' ? 'Children' : book === 'adult' ? 'Adults' : 'Any age'}</h3>
              <table className="rb-table">
                <thead>
                  <tr><th>The gap being judged</th><th>If it is too short</th><th>Who says so</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.what}<span className="rb-sub">{r.id}</span></td>
                      <td>
                        {r.enforcement === 'floor' && <strong>Does not count.</strong>}
                        {r.enforcement === 'recommendation' && <strong>Counted, with a note.</strong>}
                        {r.enforcement === 'none' && <strong>Never flagged.</strong>}
                        <span className="rb-sub">{r.enforcementMeans}</span>
                      </td>
                      <td>
                        {r.authority === 'OWNER'
                          ? (
                            <>
                              <strong className="rb-call">This app&rsquo;s judgement</strong>
                              <span className="rb-sub">{r.authorityMeans}</span>
                            </>
                          )
                          : <>CDC / ACIP<span className="rb-sub">{r.authorityMeans}</span></>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </Section>

      <Section
        title="5. Where the app is making a judgement call"
        lead="The places where CDC and ACIP do not answer the question, and the app answers it anyway."
      >
        <p className="rb-note">
          Everywhere else on this page, the app is following a document. These are the
          exceptions, gathered in one place. In each one the <strong>interval is CDC&rsquo;s or
          ACIP&rsquo;s</strong> and the <strong>decision about what to do with it is the
          app&rsquo;s</strong> — so a clinician who disagrees is disagreeing with this app, not
          with a guideline, and may reasonably decide otherwise.
        </p>

        <h3 className="rb-h3">Dose-spacing rules the app decides for itself</h3>
        <p className="rb-note">
          These come in two kinds, and the last column says which. In most of them CDC or
          ACIP publishes the interval as <em>recommended timing</em> and never says a dose
          given inside it has to be repeated — CDC&rsquo;s own data file sets no minimum for
          any adult pneumococcal interval — so the <em>cut-off</em> is this app&rsquo;s. In the
          rest, no document states the interval at all, so the <em>number</em> is this
          app&rsquo;s. Either way the app says so on the dose itself as well as here.
        </p>
        <table className="rb-table">
          <thead>
            <tr><th>The gap being judged</th><th>Which patients</th><th>What is the app&rsquo;s own</th></tr>
          </thead>
          <tbody>
            {OWNER_INTERVAL_CALLS.map((r) => (
              <tr key={r.id}>
                <td>{r.what}<span className="rb-sub">{r.id}</span></td>
                <td>
                  {r.rulebook === 'child' ? 'Children' : r.rulebook === 'adult' ? 'Adults' : 'Any age'}
                  <span className="rb-sub">{r.enforcementMeans}</span>
                </td>
                <td>{r.authorityMeans}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="rb-h3">Judgement calls that are not about a gap</h3>
        <ul className="rb-plain-list">
          {WRITTEN_JUDGEMENT_CALLS.map((c) => (
            <li key={c.id}>
              <strong>{c.name}</strong>
              <span className="rb-sub">{c.means}</span>
              <span className="rb-sub">What the app does: {c.says}</span>
            </li>
          ))}
        </ul>
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
