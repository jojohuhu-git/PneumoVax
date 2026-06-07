import React from 'react';

export default function Disclaimer() {
  return (
    <div className="disclaimer" role="note" aria-label="Clinical disclaimer">
      <strong>Clinical decision support only.</strong> PneumoVax is not a substitute for clinical judgment.
      Verify all recommendations against current{' '}
      <a href="https://www.cdc.gov/vaccines/hcp/imz-schedules/index.html" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
        ACIP/CDC immunization schedules
      </a>{' '}
      before administering vaccines. Each recommendation includes a citation link to its source
      (CDC schedule notes, ACIP MMWR, or immunize.org). Post-HSCT guidance is advisory and
      relative to transplant — coordinate with the transplant/ID team, as your center may use
      its own protocol. Age eligibility and dose intervals reflect ACIP guidance, which may
      differ from FDA package insert labeling.
    </div>
  );
}
