# The adult floors that remain — the decision after families 1–3 (2026-10-24)

**Status: RAISED, NOT DECIDED.** Nothing in this document has been built. It exists because
the owner, told that her 2026-10-24 rulings imply more than the three families she was
shown, chose: *"Families 2 and 3 now; flag the rest."*

## The principle she applied

Three times on 2026-10-24 she reversed an owner floor, each time for the same reason. Her
words on family 1:

> "ACIP describes that as recommended timing and does not say an earlier dose is invalid or
> must be repeated."

and on family 2:

> "PPSV23 → conjugate is ≥1 year for every group... Could the card suggest [complete] but
> also offer an alternative if treated as invalid, give PCV20/21 at least 1 year after last
> PPSV23?"

The reason is not specific to those rules. **Every** adult interval in this app is an owner
determination of 2026-10-11, not a minimum any source states — `CLINICAL_SPEC.md` §K says so
in capitals, and CDSI v4.64 sets `absMinInt = 0 days` for all of them. So the question is
not whether the principle is right but how far it reaches.

## What is left, measured

Six adult floors remain. Each row below is the number of patients whose verdict would move
if that row became a recommendation, measured one row at a time with
`scripts/proseDiff.mjs` over both grids on 2026-10-24, at commit `4b65df1`.

| Row | What it judges | Patients moved | Her own words on it |
|---|---|---|---|
| `ADULT-PPSV23-AFTER-PCV13` | PPSV23 under 1 year after PCV13, adult **outside** the 8-week class | **402** | — none yet |
| `ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM` | PPSV23 under 8 weeks after PCV13, **IC / cochlear / CSF** | **210** | — none yet |
| `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM` | PPSV23 under 8 weeks after PCV15, **IC / cochlear / CSF** | **45** | — none yet |
| `ADULT-PPSV23-AFTER-PPSV23` | a second PPSV23 under 5 years | **0** real, 66 impossible-record rows | *"PPSV23 to PPSV23 spacing should be 5 years"* — **settled, keep** |
| `ADULT-PCV20-21-1Y-AFTER-PCV` | conjugate under 1 year after a conjugate | **0** | *a conjugate-to-conjugate interval "exists in no document"* |
| `ADULT-PCV20-21-AFTER-PCV13` | PCV20/21 under 1 year after PCV13, no PPSV23 | **0** | — none yet |

**657 real patients in total**, all of them in the top three rows.

⚠️ **"0 patients" means 0 patients the test grid can build**, not 0 patients in a clinic.
The grid uses fixed day-offsets and cannot express every history; a row reaching nobody in
it may still reach someone in practice. Treat the zeros as "this cannot be checked by the
sweep", not as "this never happens".

## The one that is hardest to defend leaving alone

**`ADULT-PPSV23-AFTER-PCV13` — 402 patients — is the exact twin of family 3.**

Family 3 was a PPSV23 given sooner than a year after a **PCV15**, in an adult outside the
8-week class. This row is a PPSV23 given sooner than a year after a **PCV13**, in an adult
outside the 8-week class. Same risk class, same interval, same source sentence — rr7203a1
states both halves in one sentence, and `CLINICAL_SPEC.md` §K already notes that the two
rows have "the same two-tier shape... for the same reason".

As the app now stands, two patients whose PPSV23 came three months after their conjugate get
**opposite answers**, and the only thing separating them is whether that conjugate was a
PCV13 or a PCV15. Nothing in any document distinguishes them.

## The tension she spotted, and what measuring it showed

Reasoning about family 2 she said an adult conjugate-to-conjugate interval *"exists in no
document"*, which sits badly with `ADULT-PCV20-21-1Y-AFTER-PCV` existing at all. Asked, she
chose to leave it. Measuring it adds one fact: **it moves nobody the grid can build**, and
neither does `ADULT-PCV20-21-AFTER-PCV13`.

So the tension is real but costs nothing today. Both rows are recorded in their own `source`
text as raised-not-decided. The cheapest honest resolutions are either to downgrade them for
consistency (zero measurable blast radius) or to write down why a conjugate-to-conjugate
floor is kept — the one thing to avoid is leaving a rule nobody can justify *and* nobody can
observe.

## The 8-week rows are a different question

The two `SHORTER-MINIMUM` rows (255 patients) are **not** the same case, and should not be
swept in with the rest:

- They apply only to an adult with an immunocompromising condition, a cochlear implant or a
  CSF leak.
- Their 8 weeks is what ACIP says *"can be considered... to minimize the time of risk"* —
  permission to vaccinate **sooner**, as `CLINICAL_SPEC.md` §K records after reading
  rr7203a1 live.
- The patients are the ones with most to lose from an ineffective dose.

Downgrading them would mean a PPSV23 given at the same visit as a PCV15 counts for an
immunocompromised adult. That is a clinical call, and it is hers.

## What a decision looks like

1. **`ADULT-PPSV23-AFTER-PCV13` (402)** — does family 3's ruling reach it? If the answer is
   yes, it is one commit of the same shape as family 3, using machinery that now exists.
2. **The two 8-week IC rows (255)** — separate question, separate evidence, probably worth
   reading rr7203a1 again before asking.
3. **The two conjugate rows (0 measurable)** — downgrade for consistency, or record why not.

## Sources

Owner rulings of 2026-10-24, recorded verbatim in `CLINICAL_SPEC.md` §K and in each row's
`source` field in `src/logic/doseIntervalRules.js`. Counts measured at `4b65df1`; re-measure
before acting, never quote them from here.
