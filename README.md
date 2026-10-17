# PneumoVax

Standalone, client-side React SPA giving **ACIP/CDC-cited clinical decision support
for pneumococcal vaccination** (PCV15 / PCV20 / PCV21 conjugate + PPSV23
polysaccharide) across the full lifespan — infants through adults.

The pneumococcal sibling of MeningoVax. No backend, no auth, no database — everything
runs in the browser.

## Quick start
```bash
npm install
npm run dev        # http://localhost:5173/PneumoVax/
npm test           # Vitest (78 tests)
npm run build      # production build → dist/
```

## What it does
A 4-step wizard — **Age → Risks → History → Results** — produces the patient's
current pneumococcal recommendation:
- Routine infant PCV series + catch-up (p2016 Table 1).
- Healthy and at-risk children 24mo–18y (p2016 Tables 2 & 4).
- Adults 19–49 (risk-based) and ≥50 (routine), with the full prior-vaccine matrix.
- **PCV15 → PPSV23 follow-up** vs **PCV20/PCV21 = complete** logic.
- **PCV7 is never counted**; **PCV21 is adults-only**; unknown history = unvaccinated.

**It deliberately refuses one group.** For a patient after hematopoietic cell transplant,
CAR-T therapy, B-cell malignancy or B-cell-depleting therapy, the app stops and says the
schedule has to be individualized by a specialist — it gives no recommendation at all, not
even the ordinary age-based one. It used to print a post-transplant dose recipe; that
advice was wrong or out of date five times in five weeks, and wrong advice on a clinical
screen is worse than none.

Every recommendation carries a citation link to its source (CDC schedule notes, ACIP MMWR,
or immunize.org p2016).

## Documentation
- **`CLINICAL_SPEC.md`** — every clinical rule with its source citation.
- **`CLAUDE.md`** — architecture and engine-design rules.
- **`HANDOFF.md`** — author-review checklist, modeling notes, and ambiguities.

## Disclaimer
Clinical decision support only — not a substitute for clinical judgment. Verify
against current ACIP/CDC immunization schedules before administering.
