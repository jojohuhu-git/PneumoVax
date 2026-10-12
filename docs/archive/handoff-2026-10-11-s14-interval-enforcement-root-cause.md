# PneumoVax — Handoff after the S3-N1 root-cause review (2026-10-11)

> **FULLY SUPERSEDED 2026-10-11** by `handoff-2026-10-11-s14-7-one-rule-table.md`.
> **`S14-1`…`S14-7` are all DONE.** This file's rule tables are now implemented in
> `src/logic/doseIntervalRules.js`, and its clinical content — including the owner
> determination in "The one rule that contradicts the sources" — is restated, with the
> owner's further 2026-10-11 answers folded in, in `CLINICAL_SPEC.md` §K. **Read §K, not
> this file, for the current rules.** Two things changed after this file was written and
> are only correct in §K: the adult floors were extended beyond PCV13→PCV20/21 to every
> enumerated adult gap, and `S10-N1` did not reproduce. Kept for the source-checking
> record; do not resume any item from it.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`fix/s3-recorded-dose-intervals`**, off `main` @ `9a27e5a`. Pushed → **PR #22
still `OPEN / MERGEABLE`, CI green — not merged.**

Working tree **clean** at `5ff182d`. Suite re-verified this session: **393 passing
(38 files), all green.** **No code changed this session** — it was a review that produced
owner decisions and one root-cause finding. Everything below is queue, not completed work.

This app's core promise is honesty: a silent wrong answer is worse than a crash.

> **Supersedes `handoff-2026-10-11-s3-recorded-dose-intervals.md`.** That handoff's §Resuming
> item 4 says the adult interval-check exclusion is settled and must not be re-litigated.
> **The owner reopened and reversed it on 2026-10-11.** Read this file instead.

## The root cause (`S14-RC`) — why S3-N1 came out wrong

`src/logic/validate.js` decides **whether a timing rule may invalidate a dose from the
patient's age, not from what the rule says.** Five lines, one axis:

| line | function | gate |
|---|---|---|
| :173 | `checkPcvInterval` | `if (ageAtDose >= ADULT_SCHED_MIN_M) return null` |
| :209 | `checkPpsvAfterPcv` | same — exempts adults |
| :237 | `checkPpsvRevaccInterval` | same — exempts adults |
| :273 | `adultPcvGapAdvice` | `if (ageAtDose < ADULT_SCHED_MIN_M) return null` — exempts children |
| :285 | `adultPpsvGapAdvice` | same — exempts children |

Below 19 every pneumococcal gap is a floor that can invalidate. At 19+ none can. **Age was
used as a proxy for "is this rule a minimum", and the proxy is false** — ACIP states
minimums for adults in so many words (rr7203a1: *"the **minimum recommended interval**
between PCV13 and PPSV23 administration is ≥8 weeks ... and ≥1 year for adults without
these conditions"*). S3-N1 did not introduce this; it completed it by building the soft half.

Three symptoms, all verified live in the engine this session:

| scenario | child 5y | adult 70y |
|---|---|---|
| PCV15 + PPSV23 **same day** (CDC: "should not be administered during the same visit") | `invalid` | valid + soft note |
| PCV15 → PPSV23 at **2 weeks** | `invalid` (8-week min) | valid + soft note |
| PPSV23 → PPSV23 at **2 years** | `invalid` (5-year min) | **valid, `offWindow=false`, empty reasons — silent** |

The third is the worst: it falls in the gap *between* the two systems, so nothing checks it.
The product-blindness is the same bug on another axis — one blanket advisory had to pick a
single interval, so `PCV20 → PCV21` is told to mind a 1-year gap when **no further dose is
recommended at all**.

## Owner decisions made this session — apply, do not re-litigate

1. **vaxapp/PediVax is RETIRED.** **MeningoVax is the sole vocabulary authority.** Docs and
   code comments citing "vaxapp's settled pair" are now stale (`CLINICAL_SPEC.md` §K,
   `RecCard.jsx`, `CLAUDE.md`'s sibling line, the `design-review` skill).
2. **Drop the "On time" / "Valid" split.** Chips read **`Dose N of M`** as MeningoVax's
   `doseChipLabel.js` does. Timing goes in the explanation text, not a chip word.
3. **Free up the name `offWindow`.** In MeningoVax it means *does not count, repeat owed*;
   S3-N1 used it for a dose that **does** count — inverted across repos.
4. **No new vocabulary.** Every case maps onto a label MeningoVax already has.
5. **An adult PCV20/PCV21 given <1 year after PCV13 is INVALID and must be REPEATED**, with
   the 4-day grace around the 12-month interval. ⚠️ **This is an owner clinical
   determination, not ACIP.** Record it as such — see "The one rule that contradicts the
   sources" below. Do **not** cite ACIP or CDC for it.
6. **Enumerate the 5-year situations explicitly; never generalise a 5-year rule.** Owner's
   stated reason: generalising is what produced the product-blind 1-year advisory.
7. **Fix the root cause, not the case.** The owner explicitly does not want `S14-5` handled
   as an exception.

## The queue

**`S14-1`…`S14-6` — MeningoVax vocabulary parity + drift guard.** Mechanical; MeningoVax is
the exact template. No clinical content.

1. `S14-1` — create `src/components/doseChipLabel.js` mirroring MeningoVax's, **plus its
   `regression-chip-label-one-copy.test.js`**. This is the drift guard the owner asked for:
   S3-N1 hand-copied its wording into `RecCard.jsx` *and* `Results.jsx`, which is the exact
   two-copy drift MeningoVax already paid to fix (its header records 20,167 disagreeing rows).
2. `S14-2` — chips read `Dose N of M`; delete the "On time"/"Valid" words.
3. `S14-3` — rename `offWindow`; reserve "off-window" for *repeat owed*.
4. `S14-4` — add MeningoVax's `Extra dose — more than this series needs`. **Fixes
   `PCV20 → PCV21`**, which today gets an interval message.
5. `S14-5` — remove the colour key in `Results.jsx`; labels self-describe (MeningoVax
   removed its legend in decision C1).
6. `S14-6` — PCV7 → MeningoVax's `Off-window - repeat` (high-risk patients are treated as
   PCV-naïve, so doses are genuinely owed). Owner accepted the label as-is; "window" is a
   slightly loose fit for an obsolete product.

**`S14-7` — replace the five age gates with one rule table.** The whole clinical half, as a
single change. Each row carries: which products, who (age band + risk row), the interval,
**what it is measured from**, **floor or recommendation** (floor ⇒ can invalidate, grace
applies), and its source. One evaluator walks it; **no age gate anywhere**. This absorbs
what the review first listed as three separate items — patching around the gates cannot fix
the silent PPSV23 case.

Initial rows, cross-checked against CDC's live adult notes **and** CDSI (they agree):

*1-year rows* — only PCV13 before → PCV20/21 ≥1y from last PCV13; only PPSV23 before →
PCV15/20/21 ≥1y from last PPSV23; PCV15 used → PPSV23 ≥1y (8 weeks **may be considered**
for IC / cochlear implant / CSF leak — `CLAUDE.md` A-P1-1 still governs, do not flatten it).
**Do NOT flag** PCV15→PCV20/21 on the "PPSV23 not available" path (CDC states no interval),
and **do NOT flag** PCV20→PCV21 (that is `S14-4`'s extra dose).

*5-year rows* — (a) PCV20/21 for someone with **both** PCV13 and PPSV23: adults ≥50, and
19–49 **only** with cochlear implant / CSF leak / an immunocompromising condition; ≥5y from
the most recent PPSV23 **and** ≥1y from the most recent PCV (both must hold). Not the 19–49
smoking/diabetes/alcohol/chronic-organ row — they get no dose now, review at 50. If their
PPSV23 was at ≥65 it is shared decision-making. (b) A second PPSV23 ≥5y after the first —
adults 19–64 immunocompromised, **not** cochlear implant or CSF leak alone (rr7203a1
excludes them). (c) PPSV23 at ≥65 when an earlier PPSV23 was before 65 — ≥5y from that
earlier PPSV23.

**(b) and (c) already have working code** — `checkPpsvRevaccInterval` enforces 5 years with
the grace via `calendarIntervalMeetsMinimum`. It just returns early above 19. Deleting that
line is most of the work.

## The one rule that contradicts the sources

Decision 5 must be recorded honestly in `CLINICAL_SPEC.md` §K as an **owner clinical
determination dated 2026-10-11**, with the published position quoted beside it, following
the Fred Hutch HSCT precedent (`CLAUDE.md`: "label as institution-specific in UI copy").
What was checked live on 2026-10-11, all disagreeing:

- **CDSI v4.64** (local copy, `~/Downloads/Version 4.64 - 508/`), series *"Pneumococcal 50+
  2-dose PCV13"*: `minInt = 1 year`, `earliestRecInt = 1 year`, **`absMinInt = 0 days`.**
  Where CDC intends a floor it writes `minInt − 4 days` (infant PCV dose 2:
  `absMinInt = 4 weeks - 4 days`) — i.e. **CDC encodes the 4-day grace itself**, and wrote
  zero here. Same for every adult 5-year interval.
- **rr7203a1 / mm7336a3 / mm7401a1** (the three current adult MMWRs): "grace" 0 hits;
  "should be repeated" / "does not count" 0 hits; "minimum interval" only ever for the
  8-week PCV15→PPSV23 option. PCV13→PCV20/21 is always *"≥1 year after the PCV13 dose"*.
- **CDC General Best Practices**: the grace attaches to *minimum* intervals, and Table 3-2
  gives adult PCV none (footnote x defers to ACIP prose).

The owner was shown all of this and reaffirmed. Proceed — but never cite ACIP for it.

## How this relates to the rest of the queue

- **`S3-N1` (`244e2d3`, in PR #22) is partly REVERSED by `S14-2`/`S14-3`/`S14-7`.** Its
  chip words, its `offWindow` flag name, and its "this dose still counts — no repeat is
  needed" copy all go. `CLINICAL_SPEC.md` §K's "it is a flag, not a status, and that is
  load-bearing" must be rewritten, not preserved.
- **`S10-N1` is the same bug family** — PCV21's 18-year gate is checked against *current*
  age, not age at the dose. It is an age-keying error in the same file. **Fold it into
  `S14-7`** rather than fixing it separately.
- **`S3-N2` + peds audit `P0-2` own the interval *keying* question**, which is exactly what
  the rule table is. Doing `S14-7` without them risks building the table twice — read both
  before starting, and consider doing all three together.
- **`S8` (`P7-1` rulebook + `P2-7` `rule-docs-match-code` tripwire)** gains a lot here: the
  rule table is the machine-readable half of P7-1's plain-English rulebook, and the tripwire
  can compare docs against the table instead of against prose. **Strong argument for doing
  `S14-7` immediately before `S8`.**
- **Unchanged and still open:** `S10-N2` (P3), peds audit `P1-2` ("PCV dose 5 of 4"),
  `S4`–`S9`, `S11`, `S12`, MeningoVax's 9 inline styles (different repo, owner's call).
  Ledger: `.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md` (git-ignored).
- **Did NOT reproduce — do not "fix" blind:** peds audit P1-5's side-note about offering a
  3rd PPSV23. Re-reproduce first.

## Why this is a good stopping point

The review is complete and nothing is half-built: no code changed, the suite is green, the
tree is clean. The root cause is named with file:line evidence and three reproduced
symptoms, every owner decision the work needs is recorded, and both clinical rule lists are
enumerated and cross-checked against two independent sources — so the next session can
start coding without re-deriving a single rule or re-reading a CDC page.

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout fix/s3-recorded-dose-intervals`.
2. Confirm the suite: **393 passing / 38 files.** Stop and diagnose any mismatch first.
3. **Say the session number and its recommended model + effort in one line, and WAIT**
   (queue rule 1). **Recommended: `S14-1`…`S14-6` — Sonnet 5, medium effort** (mechanical,
   copy settled, MeningoVax is the template). **`S14-7` — Opus 5, high effort** (it changes
   clinical verdicts, keys ~9 rule rows to age/risk/product, deletes five load-bearing
   gates, and must document decision 5 without drifting into citing ACIP).
   **Owner picks the order — ask, don't default.**
4. **Open owner decisions — ask, don't default:**
   **(a) PR #22.** It ships S3-N1's *"no repeat is needed"* copy, which the owner now
   considers clinically wrong. Options: **merge now** and let `S14-7` correct it (the peds
   `P1-0` fix is valuable and independent, and the pre-S3-N1 state said "On time", which was
   also wrong) — or **hold #22 until `S14-7` lands** so the live app never asserts it.
   Worth noting the two are not equally bad: "On time" was a wrong label; "no repeat is
   needed" is an affirmative clinical claim. **Recommend holding** given this app's honesty
   promise, but it is the owner's call.
   **(b)** Whether to open a small PR against MeningoVax for its inline styles.
   **No other clinical decisions are outstanding.** Do not re-litigate: the paediatric risk
   lists (`CLINICAL_SPEC.md` §C), A-P1-1's PCV15→PPSV23 ≥1-year-with-8-weeks-named rule
   (`CLAUDE.md`), or the seven decisions above.
5. Per-item workflow: reproduce → failing test first (**confirm it fails**) → fix → full
   suite green → live-verify in the running app → one commit per item ID. **For any guard
   whose assertion is "nothing is wrong", introduce the fault on purpose and watch it go
   red** — S3-N1's unit tests were green while `recommend.js` never forwarded `riskIds`,
   and only driving the running app caught it.
6. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to `main`.**
7. **Dev server:** `preview_start` has reported the wrong port before — read the real port
   from `preview_logs` if the page will not load.
8. **CDC pages:** read them with a known-present word as a positive control (sections are
   collapsed, so `innerText` misses them — use `textContent`). **CDSI is faster than prose
   for "is this gap a floor?"** — the local v4.64 copy is already unzipped, see the
   `cdsi-supporting-data-local-copy` memory.
