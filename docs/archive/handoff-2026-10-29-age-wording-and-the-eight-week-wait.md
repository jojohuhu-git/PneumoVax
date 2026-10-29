# PneumoVax — Handoff after the age-rejection wording and the eight-week wait (2026-10-29, evening)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Client-side React SPA for pneumococcal
vaccine decision support across the lifespan. No backend. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`). The app's
promise is that it never states a number or a product no document on the card supports —
and when the owner's own determination overrides a document, the card says so in words.

Branch: `fix/2026-10-29-age-rejection-names-no-product`, off `main` at `0b6494a`,
**pushed**, **PR [#96](https://github.com/jojohuhu-git/PneumoVax/pull/96) open and awaiting
her squash-merge** (`main` is protected; a session agent cannot merge). Working tree
**clean** at `ee6c1b7`. Baseline on `main` was 1,669 passing in 151 files; now
**1,688 passing in 152 files, 0 failing** — full suite run on this branch, not remembered.
CI on #96 had not started when this was written; **check it before merging**.

⚠️ **The full suite took ~40 minutes per run on this machine today** (one run logged
`Duration 2441s`, mostly setup). Budget for that: run it in the background and do mutation
testing against single files, which takes seconds.

---

## What's done — PR #96, two commits

### 1. `f27f4e7` — a conjugate thrown out on AGE names no vaccine

**OWNER DECISION 2026-10-29, and it REVERSES one taken hours earlier the same day.** Her
question was *"only recommend vaccines that are approved for their age - would PCV20 be
indicated for her age or not"*. Fetched live that day: CDC's notes give PCV15 and PCV20 the
**same** 6-week minimum — *"(minimum age: 6 weeks [PCV15], [PCV 20]; 2 years [PPSV23])"* —
and CDC's pneumococcal page names both — *"Administer a 4-dose PCV series (PCV15 or
PCV20)"* — with **no preference on either page**. Her answer: **either is fine here**.

**Why the morning's answer was wrong.** "Always PCV20" was asked with **Mia** (2, cochlear
implant, PCV15 then a second PCV15 19 days later), described as a patient the app tells to
*"repeat this dose"*. **She is not** — her dose fails on TIMING and takes W1's product-free
sentence. **Re-run the patient a question is built on.** PR #95 was **closed unmerged**.

Untouched, each for its own reason: a child's **PCV21** still says *"give a dose of PCV20
instead"* (barred at her age whatever the date — the one case her rule selects); a too-young
**PPSV23** still says *"repeat this dose only"*; **record problems** keep their own wording.

Measured: **748** conjugate chips moved, PCV20-naming chips stay at **264** (all PCV21),
PPSV23 chips stay at **1,848**, **0 verdicts** — both corpora byte-identical.
Spec: `CLINICAL_SPEC.md` **§I-AGEREMEDY**.
Guard: `regression-2026-10-29-age-rejection-names-no-product.test.js`.

### 2. `ee6c1b7` — both pinned exceptions close: the healthy child and the 3-doses row wait

**OWNER DECISION 2026-10-29.** Shown three children each with a PPSV23 about a month ago —
a healthy 4-year-old told "due today", the same child with asplenia held to 26 Nov, and a
4-year-old with asplenia + 3 × PCV13 told "due today" — she ruled **both** should wait.

⚠️ **ON THESE TWO CARDS THE PPSV23 CLOCK IS HERS, NOT CDC'S.** Every document on them
measures the 8 weeks from a **PCV**. The documents keep their sentence untouched; her
determination is stated separately, in the app's own words, **only where the PPSV23 is
actually holding the dose** ("Held to 8 weeks after this child's PPSV23 of …", plus a "Why
this" paragraph naming it as the app's own). **Never widen a document's quote to cover it.**

Measured field by field (not trusted to `sweep:update`, which reports every row):
**33 of 17,016** real patients and **24 of 18,264** impossible entries moved; **every one
LATER**, 0 earlier; only `dueToday` and `earliestNextDate` changed; key sets identical.

**⚠️ A CORRECTION THAT MATTERS.** The 2026-10-25 spec and guard split the 33 as "22 on the
3-doses row, 11 healthy". **Wrong** — the guard tagged a child at-risk with
`riskIds.length > 0`, and **smoking and alcoholism are adult-only**. All 33 are the
**healthy** catch-up card. **0** are the 3-doses row, which **0 grid patients reach at
all** (now asserted). That row is covered only by a hand-built child.
Spec: **§C-PPSV23ANCHOR29**; §C-PPSV23ANCHOR's "two cases left alone" table marked closed.
Guard: `regression-2026-10-25-at-risk-catchup-waits-eight-weeks-after-ppsv23.test.js`.

### Two of this session's own guards passed for the wrong reason

Both found by mutating, neither by review, and **both were date-or-substring assertions
hiding a prose defect** — the standing lesson that the verdict corpora do not record prose.
(a) `/6 weeks minimum age/` matched Ayla's pre-existing shortfall line, so forcing the new
clause off broke **nothing** in 1,684 tests. (b) The no-PPSV23 control checked the healthy
card's *date* and only the at-risk card's *sentence*, so printing "Held to" unconditionally
broke **nothing** — a child with no PPSV23 would have read "…PPSV23 of" plus a blank.
**Assert the whole sentence, on every card the change touches.**

Mutations that do bite: 8 / 1 / 3 (item 1) and 4 / 1 / 2 / 1 (item 2).

---

## Also settled today, before this branch

- **PR #95 closed unmerged** (reversed, above), with a comment on it explaining why.
- **PR [#94](https://github.com/jojohuhu-git/PneumoVax/pull/94) is still OPEN** and carries
  the morning handoff plus the `citation-orphans.test.js` reason change recording that
  **`mmwr7203a1` stays on no card — her words, *"ignore for now and do not add citation
  given the amount of work needed."* Do not re-raise.** That handoff describes #95 as
  awaiting merge, which is now false; **this file supersedes it** and its banner says so.
  #94 is still worth landing for the citation record.
- **The adult 5-year row keeps "no repeat indicated"** — owner, 2026-10-29. Her optional
  repeat is for a conjugate following a conjugate under 4 weeks, "mainly for
  immunocompromised patients"; a conjugate after a PPSV23 is a different pair. **No code
  change; do not re-raise.**

---

## What's NOT done — the remaining queue

### P2 — the second PPSV23 for an immunocompromised child (she chose this as next)

Her row: a 2nd PPSV23 given **inside 5 years** to an **immunocompromised** child should
**Count**, and she should never be offered a **third**. The app still throws it out:
`CHILD-PPSV23-AFTER-PPSV23` is `enforcement: 'floor'`, `authority: 'CDC'`.

**The change looks small and is the adult Ruling F relabelling run again**: as a *floor*
the row asserts "an early dose stops counting", which CDC does not state; as a
*recommendation* it asserts only CDC's interval, which it does state. And "never a third"
should fall out of the existing completeness logic for free, because `ppsv.count` counts
**effective** doses — once the second dose counts, CDC's option (b) is satisfied and the
child reads complete. **Verify that rather than assuming it.**

⚠️ **ONE OPEN OWNER QUESTION, measured and unanswerable from the code:** her row names an
**immunocompromised** child. **No grid patient ever hits this rule** — 880 children have
two PPSV23 rows and **none** is inside five years — so hand-built children are the only
coverage, and the grid cannot tell you what a non-IC child should get. **Ask whether a
child with no immunocompromising condition whose second PPSV23 came early should also have
it counted.** Do not default.

### P4 — the supplemental PCV20 at 24–51 days

Her row: offer a "count it and document" alternative, **withheld for immunocompromised and
asplenic children**. The default (repeat) is already right.

### Not started

- **"Also state the minimum."** Every card that advises a date should state the true
  earliest beside it — the shape she approved 2026-10-23 for infants. **The largest
  remaining item.**
- **The rules map** (`src/data/rulebook.js` + `Rulebook.jsx`, from #87). **She has still not
  said whether she has looked at it** — it was offered on 2026-10-29 and she picked P2
  instead. It lacks the recommendation side and a third authority tier: "Who says so" has
  only "CDC / ACIP" and "This app", while her tables add *expert opinion / literature*.
- **One question never put to her:** a PPSV23 given 54 days ago but **rejected** for falling
  inside five years does **not** hold off a conjugate — ANCHOR-1, *"an unnecessary dose
  cannot reset a clock"*. Designed behaviour, pinned as a control.
- **The eleven new references stay CLOSED** (owner 2026-10-26). Do not re-raise.

---

## Why this is a good stopping point

Two complete clinical units are decided, built, measured, live-verified in the running app
and in one PR, with a reversal handled by closing the wrong PR rather than landing and
undoing it. Nothing is half-applied, the tree is clean, and the remaining queue is two
independent table rows plus two not-started items, none blocking the others.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull` (after she
   merges #96 and #94), then run the suite — confirm **1,688 passing** before new work.
2. **Check CI on #96** — it had not started when this was written.
3. **Ask P2's open question first** (non-IC child's early second PPSV23) — with a patient,
   in plain words, not a rule id and a count. **Ask, do not default.**
4. Per item: reproduce → failing test (**confirm it fails**) → fix → `CLINICAL_SPEC.md` in
   the same commit → full suite → **break the fix more than one way and quote the counts**
   → **drive the running app** → commit per item → branch → PR → **she squash-merges**.
5. ⚠️ **Assert whole sentences, not substrings or dates alone** — two guards passed for the
   wrong reason today for exactly that.
6. ⚠️ **The grid cannot build a vaccinated child aged 2–18**, no grid patient has two
   counting PPSV23 doses, **0** reach the 3-doses-before-12-months card, and **0** hit
   `CHILD-PPSV23-AFTER-PPSV23`. Hand-build; a sweep is not a guard for these children.
7. ⚠️ **Restore a mutation from a scratchpad copy, not `git checkout --`**, which deletes
   the uncommitted fix.
8. ⚠️ **Never `import` a top-level script to inspect it** — importing
   `scripts/updateVerdictCorpus.mjs` *executes* it and regenerates both corpora.
9. ⚠️ **The "PASS (n) FAIL (n)" line is printed by the terminal wrapper, not vitest.** It is
   absent from background runs — grep vitest's own `Tests  N passed` instead.
10. `preview_start` "PneumoVax dev server" — it took **port 5174** today; read the real port
    from `preview_logs`, it has also taken 5173, 5176 and 5177.
11. `vaccine-parity`: pneumococcal logic is PneumoVax-only; only `dateUtils.js` is mirrored.
