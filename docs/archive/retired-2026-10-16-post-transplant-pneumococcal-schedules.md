# RETIRED 2026-10-16 — the post-transplant pneumococcal schedules

**This document is history, not guidance.** PneumoVax no longer states a
post-transplant pneumococcal schedule. Ticking the transplant box now **stops the
tool** and tells the clinician to follow an individualized, specialist-guided
protocol. Nothing below describes what the app does today.

It is kept for one reason: so that a future session wondering "what did this app
used to say, and what did it cite?" can read the answer instead of guessing, or
worse, reconstructing it from a half-remembered source and shipping it again.

- The decision, with all six owner decisions and the evidence behind them:
  [plan-2026-10-16-transplant-hard-stop-both-apps.md](plan-2026-10-16-transplant-hard-stop-both-apps.md)
- MeningoVax's matching archive:
  `MeningoVax-main/docs/archive/retired-2026-10-16-post-hct-meningococcal-advisory.md`

---

## Why it was retired — the part that matters most

**Not because the advice was low value.** Because it could not be kept true by one
maintainer, and wrong advice on a clinical screen is worse than no advice.

Post-transplant vaccination is genuinely contested between sources and it changes.
The evidence is the git history of the two apps, not anyone's opinion:

- **MeningoVax's equivalent advisory was corrected FOUR times in about five weeks**
  after being added once (`55167ff`): `ba255ef` (the rule was wrong), `a0106f4` (the
  interval was wrong and a booster sentence misworded), `03c8387` (wrong again — it
  needs an additional risk factor, not an age band), `f32692e` (it told a clinician to
  select a risk factor she had already selected). Every one of those had already
  shipped a wrong clinical statement to a clinician-facing screen.
- **PneumoVax** needed two repairs to one broken citation link (`3a59127`, `3145db2`)
  and then a whole-source replacement (`077f01d`, Fred Hutch → ASCO 2024).
- It was the only feature in either app with its own dedicated handoff documents —
  four of them.

### The specific failure this archive exists to record

**The adult row had been ASCO 2024 in the CODE since 2026-09-14 (`077f01d`), while
three documents still said Fred Hutch 32 days later.** On the day it was deleted:

| Where | What it said |
|---|---|
| `recommend.js` (what the clinician saw) | ASCO 2024 — 4 doses of PCV20 from 3–6 months |
| `CLINICAL_SPEC.md` §F | Fred Hutch — **PCV20 ×3** at ≥6/≥8/≥10 months, titer-guided |
| `CLAUDE.md` "HSCT Sources Are Fixed" | "Adult HSCT (≥19y): **Fred Hutch LTFU §IX ONLY**" |
| the checkbox's own citation chip | `fredHutchLTFU` |

Those are not the same schedule — one is four doses starting at three months, the
other is three doses starting at six, gated on antibody titres. A clinician reading
the card and a maintainer reading the rulebook would have given different advice.
Nothing in the test suite could see it, because no test compares a document's prose
to a card's prose. That is the shape of failure the hard stop removes: there is now
one sentence, it names no schedule, and it is frozen byte-for-byte against
MeningoVax's copy by
`src/logic/__tests__/regression-2026-10-16-transplant-stop-mirrors-meningovax.test.js`.

---

## What the app says now, in its place

Banner title:

```
Individualized revaccination schedule required
```

Message (307 characters; the non-breaking hyphens, U+2011, are load-bearing — they
stop "CAR‑T" and "B‑cell" breaking mid-term on a phone, and the mirror test compares
bytes):

```
Revaccination after hematopoietic cell transplant, CAR‑T therapy, or B‑cell–depleting
therapy follows a transplant‑ or therapy‑specific protocol, not age‑based scheduling,
and some live vaccines may be contraindicated. Follow your institutional protocol or
current national guidance (ASCO, NCCN, IDSA, CDC).
```

Plus, only when doses were typed: *"Recorded doses are kept but not evaluated here."*

**The four authorities are named in words and linked to nothing.** That is owner
decision 6, and it is the direct lesson of everything above: a sentence naming ASCO,
NCCN, IDSA and CDC is still true in 2030; a URL to the 2024 ASCO guideline is not.

---

## §E — HSCT, children <19 y (p2016 Table 5 — SOLE source)

Verbatim from `CLINICAL_SPEC.md` as it stood at commit `452ce89`, the last commit
before the change:

> Prior pneumococcal history is nullified → full re-vaccination.
> - **4 doses PCV20**, beginning 3–6 mo after HSCT: 3 doses 4 weeks apart, then a 4th ≥6 mo
>   after dose 3 **and** ≥12 mo after HSCT.
> - If PCV20 unavailable: 3 doses PCV15 (4 wk apart) beginning 3–6 mo post-HSCT, then PPSV23
>   ≥12 mo after HSCT. With **chronic GVHD**: give a 4th PCV15 ≥12 mo after HSCT instead of PPSV23.
>
> **Design rule:** the app does NOT capture an HSCT date → present **relative to transplant**
> (advisory), no calendar due-dates, status `risk-based`, `dueToday: false`, no
> `earliestNextDate`. Show "coordinate with transplant/ID team" flag.

Citation: `p3086Table5` — immunize.org, *Standing Orders for Administering Pneumococcal
Vaccines to Children and Teens*, p3086.pdf, page 4 of 5, Table 5. Deleted from
`src/data/refs.js` on 2026-10-16.
`https://www.immunize.org/wp-content/uploads/catg.d/p3086.pdf`

Note the spec section's own heading said "p2016 Table 5", which was **wrong** and known
to be wrong: p2016.pdf is a two-page document with only Tables 1–4. The real Table 5
lives in p3086.pdf. That was the 2026-09-13 citation-link repair (`3a59127`,
`3145db2`), and the stale heading survived it in this document.

Note also that **chronic GVHD was never modelled** — no checkbox, no conditional text —
per an owner decision of 2026-09-14 (P1-C), in all three apps. So the PCV15 fallback's
GVHD branch above was written in the spec and never implemented.

## §F — HSCT, adults ≥19 y (Fred Hutch LTFU Tables IX.A1/A2 — SOLE source)

Verbatim from `CLINICAL_SPEC.md` at `452ce89`. **This is the stale copy described
above** — the code had not done this since 2026-09-14:

> Prior pneumococcal history nullified → full re-vaccination.
> - **PCV20 ×3** at **≥6, ≥8, ≥10 months** after HSCT (per Tables IX.A1 "before 12 months"
>   and IX.A2 "standard": Prevnar 20 at >6m, >8m, >10m). **No PPSV23** in the adult row.
> - **Titer-guided:** check baseline *S. pneumoniae* IgG (23 serotypes) **before** PCV20;
>   recheck IgG 1–2 mo **after each** PCV20. A positive response — seroprotective IgG to
>   **≥15 of 20 PCV20 serotypes** — means **no further PCV20**. (Footnotes 8 & 9.)
> - ⚠️ Institution-specific (Fred Hutch), **not ACIP**, titer-gated.
>
> **Design rule:** same as §E — advisory block relative to HSCT, titer steps as notes,
> "coordinate with transplant/ID team; your center's protocol may differ" flag.

Citation: `fredHutchLTFU` — Fred Hutch *Long-Term Follow-Up Guidelines for Referring
Physicians*, §IX Vaccinations, Tables IX.A1/A2. Institution-specific, titer-guided, not
ACIP. Deleted from `src/data/refs.js` on 2026-10-16.
`https://www.fredhutch.org/content/dam/www/research/patient-treatment-and-support/ltfu/LTFU_HSCT_guidelines_physicians.pdf`

---

## What the code actually produced, verbatim

`hsctAdvisory()` from `src/logic/recommend.js` at `452ce89`, lines 1071–1110, deleted
in full. This is the text a clinician read on screen:

### Adult (≥18 y) — ASCO 2024

- **Title:** `Post-HSCT pneumococcal series (adult) — advisory`
- **Coordinate flag:** `Coordinate with the transplant/ID team — your center may use its own post-HSCT protocol. Timing below is relative to transplant (no calendar due-dates).`
- **Dose label:** `4 doses of PCV20, beginning 3–6 months after HSCT: give 3 doses 4 weeks apart, then a 4th dose at least 6 months after dose 3 and at least 12 months after HSCT`
- **Brands:** `PCV20 (Prevnar 20)`
- **Note:** `Adult post-HSCT (prior pneumococcal history is nullified — full re-vaccination): 4 doses of PCV20 beginning 3–6 months after HSCT. Give 3 doses 4 weeks apart, then a 4th dose ≥6 months after dose 3 AND ≥12 months after HSCT. This matches ASCO's preferred earlier-start approach; ASCO also describes an alternative starting later, at 4-6 months, with the 2nd and 3rd doses 1 month apart.`
- **Citation:** `ascoAdultCancer2024`
- `status: 'risk-based'`, `advisory: true`, `dueToday: false`, `earliestNextDate: null`

### Child (<18 y) — immunize.org Table 5

- **Title:** `Post-HSCT pneumococcal series (child <19y) — advisory`
- **Coordinate flag:** identical to the adult row's.
- **Dose label:** identical to the adult row's (P0-A, 2026-09-14, deliberately aligned the two).
- **Brands:** `PCV20 (Prevnar 20)`
- **Note:** `Child post-HSCT (prior pneumococcal history is nullified — full re-vaccination): 4 doses of PCV20 beginning 3–6 months after HSCT. Give 3 doses 4 weeks apart, then a 4th dose ≥6 months after dose 3 AND ≥12 months after HSCT. If PCV20 is unavailable: 3 doses of PCV15 (4 weeks apart) starting 3–6 months post-HSCT, then PPSV23 ≥12 months after HSCT.`
- **Citation:** `p3086Table5`
- Same flags as the adult row.

The age branch used `M.y18` (18 years), **not** `ADULT_SCHED_MIN_M` (19 years) — so the
row's own title said "child <19y" for a patient of 18 years 6 months while the branch
that chose it tested 18. Two of the tests deleted with it (`regression-boundary-and-
fixes.test.js` scenarios 2a/2b) existed to pin that boundary. Their successors now
assert the opposite property: that the stop is identical on both sides of 19.

### The third deleted citation

`ascoAdultCancer2024` — ASCO, *Vaccination of Adults With Cancer* (J Clin Oncol 2024),
`https://ascopubs.org/doi/10.1200/JCO.24.00032`. Quoted in `refs.js` as:

> the current US recommendation is to revaccinate all HSCT recipients with the first
> dose of PCV-20 at 4-6 months after transplant... The subsequent two doses are given at
> 1-month intervals, followed by the fourth dose administered 6 months later... Earlier
> revaccination of HSCT recipients starting after 3 months is the preferred approach in
> combination with a fourth conjugate vaccine dose administered at 1 year.

ASCO is still named in the stop message — as a word, not a link.

---

## Everything else deleted with it

| What | Where it was |
|---|---|
| `hsctAdvisory()` (~40 lines) | `src/logic/recommend.js` |
| the `hsct` field on every return shape | `src/logic/recommend.js` |
| `hasHSCT()` | `src/data/riskFactors.js` |
| the `hsct` risk row (merged into `hct_cart_bcell_exclude`) | `src/data/riskFactors.js` |
| the advisory banner + the collapsed "standard age/history schedule" `<details>` | `src/components/Results.jsx` |
| `.advisory-banner-hsct` | `src/App.css` |
| `scripts/hsctCases.mjs` (4 comparison cases) | `scripts/` |
| the `HSCT=` corpus column | `src/test-grid.js` |
| the one exemption in the interval-prose guard | `regression-s6-5-interval-prose-one-home.test.js` |
| 11 assertions about the dose recipe | `recommend.test.js` §E/§F, `regression-boundary-and-fixes.test.js` |

The `advisory` flag on `rec()` and its "Advisory" pill in `RecCard.jsx` survive as dead
code: this was their only caller. They were left in place deliberately rather than
removed in the same commit as a clinical change, because `test-grid.js` prints the flag
into both corpora and deleting it would have moved every row, burying the 1,334 patients
that commit was measuring. Removing the flag, the pill and the corpus column together is
worth doing as its own change.
