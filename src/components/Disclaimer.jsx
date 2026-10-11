import React from 'react';

export default function Disclaimer() {
  return (
    <div className="disclaimer" role="note" aria-label="Clinical disclaimer">
      <strong>Clinical decision support only.</strong> PneumoVax is not a substitute for clinical judgment.
      Verify all recommendations against current{' '}
      <a href="https://www.cdc.gov/vaccines/hcp/imz-schedules/index.html" target="_blank" rel="noopener noreferrer">
        ACIP/CDC immunization schedules
      </a>{' '}
      before administering vaccines. Each recommendation includes a citation link to its source
      (CDC schedule notes, ACIP MMWR, or immunize.org). Post-HSCT guidance is advisory and
      relative to transplant. Coordinate with the transplant/ID team, as your center may use
      its own protocol. Age eligibility and dose intervals reflect ACIP guidance, which may
      differ from FDA package insert labeling.
      {' '}
      {/* P6-7 (S13, 2026-10-10): the app asks for risk factors as they are TODAY
          and then grades doses recorded years ago against them. That assumption
          is reasonable and is not changing — but it was unstated. The PPSV23
          case is named because it is the one a clinician might expect to be
          asked about. Deliberately NOT a per-dose prompt, and deliberately no
          promise that the app will ask: unlike MeningoVax, PneumoVax has no
          "Needs input" machinery to ask with. */}
      This app tracks the patient's <em>current</em> risk status only — it does not record
      when a risk factor started or ended. One case worth knowing: PPSV23 between ages 2 and
      5 is only <em>indicated</em> for a child with a risk condition, but a PPSV23 already
      given to a then-healthy three-year-old is still counted as a valid dose if that child
      later becomes at-risk. That is correct — it was a real vaccine given at a valid age —
      but the app will not query it, so check the record if it matters.
    </div>
  );
}
