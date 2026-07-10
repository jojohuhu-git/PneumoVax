# PneumoVax Agent Guide

## What This App Is

Standalone client-side React SPA for **pneumococcal** vaccine clinical decision support (PCV15/PCV20/PCV21/Capvaxive + PPSV23) across the full lifespan (infants → adults). No backend, no auth, no DB. Sibling of PediVax (vaxapp) and MeningoVax; independent codebase that mirrors MeningoVax's architecture.

## Start Here

```bash
npm install
npm run dev        # dev server on /PneumoVax/
npm test           # Vitest run
npm run build      # production build to dist/
```

Dev server config: `.claude/launch.json` ("PneumoVax dev server").

All public asset paths MUST use `import.meta.env.BASE_URL` (Vite sets `base: '/PneumoVax/'`).

Also read before changing any rule: `CLINICAL_SPEC.md` (every rule with source citations).

## Source of Truth Files

| What | Where |
|---|---|
| Plain-English folder guide (owner is a non-coder) | [MAP.md](MAP.md) |
| Architecture, file map, engine API, schedule constants | [docs/agent/architecture.md](docs/agent/architecture.md) |
| Pneumococcal clinical rules, product semantics, HSCT | [docs/agent/clinical-rules.md](docs/agent/clinical-rules.md) |
| Test files and coverage requirements | [docs/agent/testing.md](docs/agent/testing.md) |
| PneumoRecs comparison harnesses (dev-only) | `scripts/{adult,peds,hsct}Cases.mjs` |
| Session history (2026-06-07 through 2026-06-12) | [docs/archive/agent-session-log.md](docs/archive/agent-session-log.md) |

## Non-Negotiable Rules

### Root Directory Hygiene
Only `CLAUDE.md`, `MAP.md`, `README.md`, and `CLINICAL_SPEC.md` live at the repo root (`CLINICAL_SPEC.md` stays — code/test comments cite it by that path). Never create new root-level `.md` files. Session notes/handoffs/reviews go to `docs/archive/`; comparison scripts go to `scripts/`. Keep `MAP.md` current when folders change.

### Clinical Authority
ACIP/CDC/immunize.org over FDA package inserts. Sources per topic are in `CLINICAL_SPEC.md`. Always update `CLINICAL_SPEC.md` when changing a rule.

### Two Boundary Constants — Never Collapse
`src/logic/scheduleConstants.js` exports two distinct constants:
- **`ADULT_SCHED_MIN_M = 228` (19y)** — schedule routing boundary (peds vs adult rulebook)
- **`PCV21_MIN_AGE_M = 216` (18y)** — PCV21 (Capvaxive) product min-age only

These are separate clinical concepts. Never merge them back into one constant.

### All Clinical Logic in the Engine
Product validity, the PCV15→PPSV23 requirement, the prior-vaccine matrix, and the PCV7-not-counted rule are computed in `recommend.js`. UI consumes pre-built recs. Do NOT re-derive clinical logic in components.

### PCV7 Never Counts
Recorded as `noncounting`, dropped from effective series. High-risk patients treated as PCV-naïve. Source: immunize.org Ask the Experts.

### HSCT Sources Are Fixed
- Peds HSCT (<19y): **immunize.org p2016 Table 5 ONLY** — not CDC child notes.
- Adult HSCT (≥19y): **Fred Hutch LTFU §IX ONLY** — label as institution-specific in UI copy.

### PCV15 Always Requires PPSV23
`requiresPPSV23: true` in `brands.js`. Never emit a PCV15 rec without the PPSV23 follow-up path.

### Adult PPSV23 Interval Is Risk-Class-Keyed
Single source: `adultPpsvIntervalClass()` in `riskFactors.js`. IC/cochlear/CSF = ≥8 weeks; non-IC chronic = ≥1 year. Never hardcode the interval.

### dateUtils.js Is Mirror-Synced
`dateUtils.js` is byte-for-byte identical across PneumoVax, MeningoVax, and vaxapp. If you change it here, apply the same change to the sibling apps.

## Testing Expectations

- When changing a rule: update `CLINICAL_SPEC.md`, the engine, and the test.
- At least one test per `CLINICAL_SPEC.md` § sub-section.
- When changing `scheduleConstants.js`: verify both constants remain distinct and all consumers import the right one.
→ See [docs/agent/testing.md](docs/agent/testing.md)

## Documentation Maintenance

| Content type | Destination |
|---|---|
| Current commands, required workflow, short non-negotiable rules | Root `CLAUDE.md` (this file) |
| Architecture, engine API, file map, schedule constants | `docs/agent/architecture.md` |
| Pneumococcal clinical rules with source citations | `docs/agent/clinical-rules.md` + `CLINICAL_SPEC.md` |
| Test files, coverage requirements, key invariants | `docs/agent/testing.md` |
| Dated "session changes" / "changes shipped" history | `docs/archive/agent-session-log.md` |
| Handoffs, reviews, finished plans | `docs/archive/` |
| Comparison/verification harnesses | `scripts/` |
| Plain-English folder explanations for the owner | `MAP.md` |

Do not add dated session logs, implementation narratives, or stale local paths to this file.
