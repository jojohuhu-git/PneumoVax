> **⚠️ SUPERSEDED (2026-10-24)** — by
> `handoff-2026-10-24-invalid-dose-scheduling-ruling.md`. Do NOT resume from this file.
> Its headline recommendation — that the 402-patient `ADULT-PPSV23-AFTER-PCV13` row is "the
> exact twin of family 3" and "one commit of exactly family 3's shape" — was MEASURED AND IS
> WRONG: PCV13 + PPSV23 is not a complete series, so counting the early dose does not complete
> the patient, it moves her final conjugate out by 4 years. The owner then ruled on invalid-dose
> scheduling in a way that appears to REVERSE families 2 and 3 of this handoff's own PR #84.
> Read the new file first.

# PneumoVax — Handoff after the three adult families shipped (2026-10-24)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json` —
**read the real port from `preview_logs`** (it was 5173 this session).

Branch: **`fix/2026-10-24-adult-early-dose-families`**, off `main` at `97277a7`, pushed.
[PR #84](https://github.com/jojohuhu-git/PneumoVax/pull/84) **open, NOT merged** — the owner
squash-merges. Suite **1,482 passing in 135 files, 0 failures, 0 skips**.

Consumed and superseded: `handoff-2026-10-24-c11-grace-and-the-adult-families.md`
(marked superseded in place).

⚠️ **The handoff this session actually resumed from is NOT on `main`.**
`handoff-2026-10-24-rulings-e-and-f-nothing-built.md` was added in `03fd8d8` on
`feature/2026-10-23-ruling-d-repeat-dose-anchor`; PR #83 squash-merged an earlier point of
that branch, so the commit never reached `main` and the file does not exist here. It was
read from the working tree before the branch switch. Nothing is lost — its two open
questions were both answered by the owner this session and are recorded above — but it is
the "a handoff on an unmerged branch goes missing" failure happening again. **Put the
handoff on the branch that is actually being merged, and check it landed on `main`
afterwards.**

## What shipped — five commits

| Commit | What | Verdicts moved |
|---|---|---|
| `868d01f` | **Ruling F** — PCV20/21 under 5 years after PPSV23 counts | 363 |
| `1bd5a9c` | **Family 2** — conjugate under 1 year after PPSV23 counts, card offers the alternative | 132 |
| `4b65df1` | **Family 3** — PPSV23 under 1 year after PCV15 (non-IC) counts, same alternative | 78 |
| `fd12ea5` | Docs: the six adult floors that remain, measured | — |
| `dd55ea0` | Cards: bold the qualifying sentence; remove "(owner ruling, 2026-10-24)" | — |

**573 of 17,016 verdicts moved; 0 of 18,264 record-problem rows.** All field-level diffs.

Three rules went from `enforcement: 'floor'` to `'recommendation'` and from
`authority: 'OWNER'` to `'CDC'` — the label change is the point: as floors they asserted
something no source states, as recommendations they assert only CDC's own advised interval.

## The owner decisions this session, verbatim

1. **Family 2 reaches case H.** Asked directly whether a 2-month gap counts like her
   8-month one, she answered that it takes the same shape — complete, note, alternative.
   No document names any minimum, so a cut-off would be invented.
2. **Family 3: complete + alternative**, chosen from her "either 1 or series is complete
   could be considered".
3. **`ADULT-PCV20-21-1Y-AFTER-PCV`: leave it, raise it in the PR body.**
4. **Packaging: one PR, one commit per family.**
5. **Scope: "Families 2 and 3 now; flag the rest."**
6. **"Make these nuanced comments in red or bolded"** → bold (see below).
7. **"Remove owners ruling comment from cards"** → done, all three rules.

## Two things to put to her first

### 1. Bold vs red — she offered either, I chose bold
`App.css` reserves `--r` (#b71c1c) for *"errors/invalid only"* in the token's own comment,
and these cards say **Complete**. Colouring a correct answer with the error colour says the
opposite of what the card says, so the emphasis is bold in `--gy` (the darker body colour)
against the note's `--gy2`. **One word from her switches it to `--r` or amber `--a`** —
the class is `.note-emphasis` in `src/App.css`, one rule.

### 2. The scope she flagged rather than built — THE NEXT DECISION
`docs/archive/decision-2026-10-24-the-adult-floors-that-remain.md` has it in full, measured
row by row at `4b65df1`. The headline:

| Row | Patients | Her words |
|---|---|---|
| `ADULT-PPSV23-AFTER-PCV13` | **402** | none yet — **the exact twin of family 3** |
| `ADULT-PPSV23-AFTER-PCV13-SHORTER-MINIMUM` | 210 | none yet (8-week IC row) |
| `ADULT-PPSV23-AFTER-PCV15-SHORTER-MINIMUM` | 45 | none yet (8-week IC row) |
| `ADULT-PPSV23-AFTER-PPSV23` | 0 real | *"PPSV23 to PPSV23 spacing should be 5 years"* — **keep** |
| `ADULT-PCV20-21-1Y-AFTER-PCV` | 0 | *"exists in no document"* — raised, not decided |
| `ADULT-PCV20-21-AFTER-PCV13` | 0 | none yet |

**Ask about the 402 first.** It is the same risk class, the same 1 year and the same
rr7203a1 sentence as family 3 — so two patients with an identical early PPSV23 currently
get opposite answers based only on whether their conjugate was PCV13 or PCV15. If she says
yes it is one commit of exactly family 3's shape, on machinery that now exists.

**Do not sweep the two 8-week IC rows in with it.** Different patients, different evidence
(ACIP's 8 weeks is permission to vaccinate *sooner*), and the patients with most to lose.

⚠️ **"0 patients" means 0 the grid can build**, not 0 in a clinic — the grid uses fixed
day-offsets. Treat zeros as "the sweep cannot check this".

## Implementation notes — do not re-derive these

- **The alternative line** is `earlyNote` / `earlyNoteCites` / `refsCompleteCard` in
  `src/logic/recommend.js`, built once just after `const ppsvGiven`, fed by
  `earlyAfterPpsvAdvice()` above `pcvAdult`. It is **keyed on the RULE id**
  (`EARLY_AFTER_PPSV_RULES`), never on "a dose was early" — widening it to any
  `earlyAdvisory` puts an offer of another conjugate on Ruling F's card and contradicts her
  in the same sentence. Guarded.
- **The date comes from `dueStateMonths(lastPpsv23Date, MO12, today)`** — the same call the
  "PCV ≥1 year after PPSV23" due card makes. Never re-read that interval; that is the P0
  bug's shape.
- **⚠️ ROW ORDER IS LOAD-BEARING, TWICE.** `evaluateDoseInterval` returns on the first
  unmet row of EITHER kind, so a recommendation ahead of a floor lets a dose escape it.
  `ADULT-PCV20-21-1Y-AFTER-PCV` now sits before the 5-year row, and
  `ADULT-PPSV23-AFTER-PPSV23` before `ADULT-PPSV23-AFTER-PCV15`. Both guarded; swapping
  either back fails tests.
- **A recommendation row's `message` must return a STRING**, not `{reasons, detail}` —
  `advise()` pushes it into `reasons`.
- **`citations: resolveRefs(o.refs)`** — the grey buttons come from `refs`, NOT from
  `noteCites`. A new numbered citation needs its document in `refs` too, or the number
  renders with the button auto-seeded and the engine's own list disagrees.
- **Emphasis**: notes mark a span with `**...**`; `renderNoteWithCites` in
  `citations.jsx` turns it into `<strong class="note-emphasis">`, tracking the span
  **across** `[c]` splits. Not a third note part, because 28 files read a note as
  `lead` + `detail` and would all have missed it.

## The guards narrowed this session, and why

Two guards asserted blunt versions of claims that are really about a SENTENCE, and a card
can now carry two sentences (CLAUDE.md's "two different sentences, two claims"):

- mm7401a1 is back on **209** complete cards — for the alternative, not the completion
  claim. The 2026-10-17 removals still hold at 0.
- The job aid is on **5** under-50 complete cards — for its substitution footnote, which is
  not age-scoped. The 2026-10-17 "job aid at 50+ only" claim still holds at exactly 0,
  counted separately as `jobAidUnder50Alternative`.

Both pins are exact. **Asserting the blunt versions now fails on correct cards** — the
C10-1 trap, repeated twice in one session.

## A correction recorded, so it is not re-made

Mid-session I explained a +253 job-aid rise as an age split (`isOlderAdult` gating). It was
not. All 363 of Ruling F's patients are 50+; the rise is 253 because 110 of them already
carried a job-aid button elsewhere in the case. The real decomposition is by **which
mm7401a1 row their old card used** — 253 flat "≥5 years", 110 shared-decision at ≥65. The
comment in `regression-c8-doc1-mmwr-only-where-it-speaks.test.js` carries the corrected
version. **Measure the decomposition; do not infer it from a gate.**

## The rest of the queue — unchanged

| Priority | Item |
|---|---|
| **P1** | The 402-patient twin of family 3 — ask her (see above) |
| **P2** | Patient E's "of 3" — put the two readings to her first |
| **P2** | Overdue children read oddly ("due at age 4 months" on a 12-month-old) — pre-existing on `main`, wording only |
| **P2** | Chips print ISO dates while cards print `Dec 7, 2026`; cosmetic |
| **P2** | Card classes the grid can no longer reach; dead `advisory` flag; `intervalWords().adj` now has no consumer in the rules table (the 5-year row was its last) |
| — | **C4, C5** — MeningoVax-only, untouched |

**Closed, do not reopen:** Ruling D, C11, Ruling F, families 2 and 3, case H, PR #83's
questions. The Job Aid's last uncredited statement (1,584 cards) remains the decision she
asked **not** to be re-raised.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax` — **branch fresh off `main` if PR #84 has
   merged**; a branch stacked on an unmerged PR produced the 2026-10-23 conflict.
2. `npx vitest run` — confirm **1,482 passing in 135 files**. For a file count use
   `--reporter=json` and `len(testResults)`; pipe to `tail`, never `head`.
3. Ask about the **402** and about **bold vs red** before building anything.
4. Per item: reproduce → failing test (quote the pre-fix failure count) → fix → full suite →
   **break the fix in more than one way and quote the counts** → `node scripts/proseDiff.mjs
   dump` on both sides (plain `node`, NOT `vite-node`), compared field by field → **drive the
   running app** → commit per item.
5. Push/merge: **branch → PR → the owner squash-merges.** A session agent cannot merge.
6. If `~$INICAL_SPEC.md` appears (a Word lock file), **never commit it** — the root-hygiene
   hook correctly blocks it.
