import React from 'react';
import { riskAgeNote } from '../logic/riskAgeNote.js';
import { makeCiteNumberer, renderNoteWithCites } from './citations.jsx';

/**
 * P3-9, UI half — a quiet, cited note saying that an adult-only risk tick was
 * seen and why it does not change a child's schedule. See
 * `logic/riskAgeNote.js` for the rule, the owner decision, and the sources.
 *
 * Deliberately NOT a banner or a warning: nothing has gone wrong, and nothing
 * is being withheld. The tick stays visible and stays in the record; this
 * raises the doubt and lets the clinician decide.
 *
 * Renders on two surfaces — the risk step (where the box is ticked) and the
 * results header (where the chip sits beside a recommendation that disregarded
 * it). The second is the one the owner's hold on PR #20 was actually about.
 *
 * Returns null when there is nothing to explain, so callers can render it
 * unconditionally.
 */
export default function RiskAgeNote({ riskIds, ageMonths }) {
  const note = riskAgeNote(riskIds, ageMonths);
  if (!note) return null;

  // Its own numbering sequence: this note is not inside a recommendation card,
  // so it does not share a card's [N] run.
  const numberFor = makeCiteNumberer();
  let used = 0;

  return (
    <div className="risk-age-note" data-testid="risk-age-note">
      {note.lines.map((line, i) => {
        const markers = line.split('[c]').length - 1;
        const slice = note.cites.slice(used, used + markers);
        used += markers;
        return (
          <div key={i} className="risk-age-note-line">
            {renderNoteWithCites(line, slice, numberFor)}
          </div>
        );
      })}
      <div className="risk-age-note-footer">{note.footer}</div>
    </div>
  );
}
