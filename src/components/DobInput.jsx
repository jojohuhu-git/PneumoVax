import React from 'react';

// A date-of-birth field. Lives in its own file so Results.jsx keeps no
// `type="date"` input of its own (see regression-s9-one-dose-editor: dose
// rows belong to DoseEditor only).
export default function DobInput({ id, value, max, onChange }) {
  return (
    <input id={id} type="date" max={max} value={value}
      onChange={e => onChange(e.target.value)} />
  );
}
