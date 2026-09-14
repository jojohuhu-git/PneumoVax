# PneumoVax — adult post-HSCT row moves to ASCO (pointer, 2026-09-13)

The full handoff lives in the vaxapp repo, because this change is part of a three-app
pass over post-HSCT guidance:

**`~/Downloads/vaxapp-main/docs/archive/handoff-2026-09-13-post-hsct-meningococcal-crossrepo.md`**

## The short version

Owner decision, 2026-09-13: **ASCO replaces Fred Hutch for the adult post-HSCT row.**

`hsctAdvisory()` in `src/logic/recommend.js` currently gives adults 3 doses of PCV20 at
≥6, ≥8 and ≥10 months, titer-guided, no PPSV23, citing Fred Hutch's Long-Term Follow-Up
guidelines — which the code itself labels institution-specific and explicitly not ACIP.

ASCO's "Vaccination of Adults With Cancer" guideline (JCO 2024,
<https://ascopubs.org/doi/10.1200/JCO.24.00032>, fetched live 2026-09-13 — the site 403s
to automated fetch, use the browser tool) says:

> "the current US recommendation is to revaccinate all HSCT recipients with the first
> dose of PCV-20 at 4-6 months after transplant… The subsequent two doses are given at
> 1-month intervals, followed by the fourth dose administered 6 months later."

and in its clinical interpretation prefers "starting after 3 months… with a fourth
conjugate vaccine dose administered at 1 year."

That makes the adult row match the pediatric one (4 doses of PCV20 starting 3–6 months).
Retire or demote the `fredHutchLTFU` citation and add ASCO.

**The pediatric row needs no rule change** — immunize.org p3086 Table 5 already agrees
with ASCO. Adding ASCO as a supporting citation is optional.

Also move `coordinateFlag` to the top of the advisory block, so the
"check your institution's protocol" line precedes any timing.

**NCCN is deliberately not cited** — owner's call: login-walled, and revises faster than
she can maintain.

Baseline when this was written: **142 passing, 9 files**, clean `main` at `3145db2`.
