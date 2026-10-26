> ## ⚠️ SUPERSEDED — 2026-10-25, later the same day
>
> Read **`handoff-2026-10-25-adult-table-shipped-children-next.md`** instead.
>
> Its P0 queue — the three red test files — is **DONE** (commit `2d82595`). The suite is
> **green at 1,632 passing in 147 files**, and the adult half is open as
> **PR #90**, whose `test` check passes. The remaining queue (the children's rows, "also
> state the minimum", the rules map, the eleven new references) is restated in the new file,
> with P1 scoped in detail and one hard constraint this file did not know: **P1 must not
> start until #90 merges**, because both edit `doseIntervalRules.js` and `CLINICAL_SPEC.md`.

# PneumoVax — Handoff after reorganising the ADULT interval rules (2026-10-25, desktop session)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Client-side React SPA for pneumococcal
vaccine decision support across the lifespan.

Branch: **`feature/2026-10-25-interval-rules-reorganised`**, off `main` at `a66219a`
(the cloud session's PPSV23-anchor + rules-lookup work, already merged).
**Pushed** to origin; working tree clean at `bc4a186`. PneumoVax's `main` is protected,
so work lands branch → PR → owner squash-merges. **No PR opened — the suite is red.**

Baseline at session start: **1,630 passing in 146 files, 0 failures**.
Now: **1,621 passing in 147 files, 7 FAILING in 3 files.**

> ⚠️ **THE SUITE IS RED. Do not open a PR until the three files below are green.** The
> failures are all one class — assertions that an adult dose is rejected — and each needs
> the same treatment the other 20 files already got in `bc4a186`: flip the disposition,
> keep what the test was really for, and write the reversal into the comment.

---

## The owner's instruction this session

She supplied six tables (four, then two updated ones) plus
`https://pmc.ncbi.nlm.nih.gov/articles/PMC10495181/` (rr7203a1) for the repeat-PPSV23
hyporesponsiveness evidence, and answered four questions:

| # | Question | Her answer |
|---|---|---|
| 1 | Child's PCV <52 days after a PPSV23 — count (this morning's ruling) or repeat? | **Repeat — her table wins** |
| 2 | Adult second PPSV23 inside 5 years | **Count, note the shortfall** |
| 3 | Does this change advised dates too? | **Grading, PLUS state the minimum beside the advice** |
| 4 | Order of work | **Adults, then children, then the rules map** |

Her adult bottom line, verbatim: *"8 weeks is a true adult minimum only for PPSV23 after a
conjugate… For conjugate after conjugate, ACIP's own HSCT schedule supports counting any
dose given 4 weeks or more after the prior PCV… Under 4 weeks… An optional repeat (PCV20
or PCV21, at least 8 weeks later) is reasonable, mainly for immunocompromised patients."*

---

## What's DONE — commit `bc4a186`

1. **A1–A3 — six adult floors became recommendations.** `ADULT-PCV-AFTER-PPSV23`,
   `ADULT-PPSV23-AFTER-PCV15` (+ its `-SHORTER-MINIMUM` sibling),
   `ADULT-PPSV23-AFTER-PCV13` (+ sibling), `ADULT-PPSV23-AFTER-PPSV23`. Authority moved
   `OWNER` → `CDC` on all six (Ruling F's relabelling: as advice a row asserts only CDC's
   own interval). **No adult dose is ever set aside for timing again.**
2. **A4 — new row `ADULT-PCV-AFTER-PCV-UNDER-4-WEEKS`**, `advisoryOnly`, authority OWNER,
   offering an optional PCV20/PCV21 8 weeks after the dose given. New constant
   `ADULT_CONJUGATE_SUPPORTED_MIN_DAYS = 28` in `intervals.js` with both her bases written
   down (post-transplant schedule — **ASCO 2024 in this app's record, not ACIP** — and
   infant priming). New field `optionalRepeatInterval` so a row can advise one gap and
   offer the repeat at another.
3. **`CLINICAL_SPEC.md` §K** — six enforcement cells → "Counts, with a note", authority →
   CDC/ACIP, plus the new row. `rule-docs-match-code.test.js` green on all 67.
4. **Dead code removed / guarded.** `conjugateAlternativeAfterInvalid` deleted from its
   only user. `adultInvalidDoseCard` in `recommend.js` is now **unreachable** — left in
   place deliberately (it implements a ruling she may restore) with its unreachability
   asserted in `regression-2026-10-25-an-early-adult-dose-owes-nothing.test.js`.
5. **20 test files reworked** as records of the reversal, not deleted — including a rename
   (`…invalid-adult-dose-owes-a-conjugate` → `…an-early-adult-dose-owes-nothing`) and two
   evaluator contracts retargeted to **child** floors, which are the only ones left.
6. **Citation counts re-measured**, each with its movement beside it: mm7401a1 −132
   buttons, job aid +213, chronic review-at-50 +20, IC two-PPSV23 flat wording +159.
   `scripts/uncreditedSources.mjs` reports **no new (source, statement) pair** — the only
   one it finds is the pre-existing healthy 5–18 child card. So **no document lost a card
   it speaks for** (FINDING F's hazard).

### Measured
**1,395 of 17,016 verdicts moved; 132 of 18,264 record-problem rows.** The committed
corpus held **1,065 rejected adult doses** (330 `ADULT-PCV-AFTER-PPSV23`, 402
`ADULT-PPSV23-AFTER-PCV13`, 210 its 8-week sibling, 78 `ADULT-PPSV23-AFTER-PCV15`, 45 its
sibling); it now holds none. **Zero lines gained a rejection.**

---

## What's NOT DONE

### P0 — finish the three red files (same pattern as the 20 already done)
| File | Failures | What it needs |
|---|---|---|
| `regression-2026-10-24-advice-never-inside-the-four-day-grace.test.js` | 3 | Its adult patient has no rejected dose. The contract (advice never inside the grace; `earliestValidDate` KEEPS the grace) is **still live for children** — retarget to the 5-year-old with asplenia (PCV20 1 Jun, PPSV23 22 Jun → repeat 2026-08-17, not 08-13). The third test documents an adult chip/card gap that no longer exists; it should become the record of that. |
| `regression-2026-10-25-no-date-for-a-dose-nobody-asks-for.test.js` | 2 | One reads `.reasons` off an adult dose that is no longer rejected. The sweep pin `{withdrawn: 2930, kept: 2335}` re-measures to `{withdrawn: 2652, kept: 1770}` — **verify that shape is right before pinning it**, it is a bigger move than the others. |
| `regression-2026-10-24-note-emphasis.test.jsx` | 2 | A floor's disclosure text and the bolded conjugate alternative. Both belonged to `ADULT-PPSV23-AFTER-PPSV23` as a floor; the alternative now lives in `whys`. |

### P1 — the children's rows (her answers 1 and 3, not started)
| Item | Her row | App today |
|---|---|---|
| **P1** | Any PCV <52 days after a PPSV23 → **Repeat** | ⚠️ **Counts** — `CHILD-PCV-AFTER-PPSV23`, shipped this morning in `a66219a`. Her updated table reverses it: make it a floor again, basis "ACIP rule" + the 2014 *Vaccine* paper on blunted conjugate response. **231 doses.** |
| **P2** | 2nd PPSV23 <5y, immunocompromised child → **Count**, never a third | App rejects it. **0 grid patients** — needs a hand-built patient. |
| **P3** | Five rows say the remedy is **PCV20, not another dose of the same vaccine** | App only knows "repeat this dose". **The one genuinely new capability**, shared by adults and children. |
| **P4** | Supplemental PCV20 24–51 days after last PCV | Default (repeat) is right; needs the "count it and document" alternative, **withheld for immunocompromised/asplenic children**. |
| **P5** | Infant doses 1–3 before 38/66/94 days | **Already correct, and no work needed** — 38 + 28 + 28 = 94 exactly, so the 4-week interval already enforces the per-dose minimum ages. Zero slack, so it deserves a guard. |
| — | PCV21 under 18 | Rejected correctly; wording says "repeat this dose" where it should name PCV20. |

### P1 — her answer 3, not started
**"Also state the minimum."** Every card that advises a date should state the true minimum
beside it — the shape she approved on 2026-10-23 for infants (*"it can be given today if
needed, as the minimum interval of 4 weeks has already passed"*). Nothing built.

### P1 — the rules map (her third request, not started)
The cloud session already rebuilt both rulebooks as a nine-column lookup in `a66219a`
(`src/data/rulebook.js` + `src/components/Rulebook.jsx`). **She has not seen it yet — have
her look before spending on it.** What it still lacks: the **recommendation** side (which
dose is due next, not just the intervals), and a third authority tier. Today the "Who says
so" column has only "CDC / ACIP" and "This app"; her tables add **expert opinion /
literature**, which is a different kind of claim.

### P2 — eleven new reference entries, not started
Her tables cite documents the app has never cited: AAP **Red Book 2024–2027**, *Pediatrics*
2025 (invalid doses), the paediatric **HIV OI guidelines**, *Pediatrics in Review*, and
seven immunogenicity/hyporesponsiveness papers. **Ask her** whether to cite them as given
or verify each live — she was asked and the question went unanswered when she redirected.

---

## Three traps this session paid for — read these

1. **A read-only diagnostic must not `import` a top-level script.** I imported
   `scripts/updateVerdictCorpus.mjs` to inspect its exports; importing it **executes** it,
   so both corpora were silently regenerated. Every comparison afterwards read the
   rewritten files, and **I reported "0 verdicts moved" when the true figure was 1,395.**
   Get before/after from `git show HEAD:<path>`, never from the working tree.
2. **Two of my own guards were blind and PASSED.** The new grid sweep read `d.ruleId`
   (the field is `intervalRuleId`) and spread `{key, input}` instead of `input`, so it
   called the engine with no patient at all and swept 0 adults while reporting success.
   **A sweep that cannot fail reads as proof.** Both faults are written into the test.
3. **The existing guards caught two real bugs in my work**, which is the argument for
   running the whole suite rather than the new file: the 4-week row silenced
   `ADULT-PCV-AFTER-PCV-CATCH-ALL` whenever it was satisfied (fixed with `advisoryOnly`),
   and its message printed "Given 0 days after…" for a same-visit pair.

Also: the card text ended "Owner ruling 2026-10-25" — a raw ISO date reaching the reader.
Provenance now lives only in each rule's `source`.

---

## Why this is a reasonable stopping point

The adult half is a complete clinical unit: her three-row table is implemented, measured,
and spec'd, and the only thing between it and a PR is 7 assertion flips in 3 files that
need no new decisions. The children's rows and the rules map are independent of it and of
each other. Nothing is half-applied in the engine — `doseIntervalRules.js`,
`intervals.js`, `recommend.js` and `CLINICAL_SPEC.md` agree, and `rule-docs-match-code`
proves it.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout feature/2026-10-25-interval-rules-reorganised`
2. `npx vitest run --reporter=json` — confirm **1,621 passing, 7 failing in 3 files**
   before touching anything. Use `len(testResults)` for the file count.
3. Finish the three P0 files, then **open the PR for the adult half on its own** rather
   than stacking the children's work on it — the adult change moves 1,395 verdicts and
   deserves to be reviewed alone.
4. **Open decisions — ask, do not default:**
   - The eleven new references: cite as given, or verify each live? (P2 above.)
   - Has she looked at the new rules-map lookup? Extending it before she has is wasted.
   - The three open questions inherited from `a66219a` are still open: the healthy child
     with a PPSV23 (11 + 14 patients), the 3-doses-before-12-months row (22), and whether
     `ADULT-PCV20-21-5Y-AFTER-PPSV23` should offer the optional repeat. All pinned by
     number in `regression-2026-10-25-at-risk-catchup-waits-eight-weeks-after-ppsv23.test.js`.
5. Per item: reproduce → failing test (confirm it fails) → fix → `CLINICAL_SPEC.md` in the
   same commit → full suite → break the fix more than one way and quote the counts →
   **drive the running app** (`preview_start` with "PneumoVax dev server"; nothing in this
   session was live-verified) → commit per item.
6. **Branch → PR → the owner squash-merges.** A session agent cannot merge.
7. **MeningoVax parity is NOT affected** by the adult pneumococcal rules, but consult the
   `vaccine-parity` skill before the children's rows.
