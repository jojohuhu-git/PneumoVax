> **⚠️ SUPERSEDED (2026-10-29, evening) — do not resume from this file.**
> Its queue has moved on. **PR #95 was CLOSED UNMERGED, not merged**: the owner reversed
> "always PCV20" the same day, because the patient the question was built on (Mia) turned
> out not to be affected at all, and because CDC gives PCV15 and PCV20 the same 6-week
> minimum age with no preference stated. Her "question 1" below (PCV15 beside PCV20 on the
> card) is therefore ANSWERED — either is fine — and the three pinned questions are
> answered too. Resume from
> `docs/archive/handoff-2026-10-29-age-wording-and-the-eight-week-wait.md`, which is on
> PR #96.

# PneumoVax — Handoff after the PCV20 remedy shipped and two questions closed (2026-10-29, afternoon)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Client-side React SPA for pneumococcal
vaccine decision support across the lifespan. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

Branch: `fix/2026-10-29-rejected-conjugate-names-pcv20`, off `main` at `0b6494a`, **pushed**,
**PR [#95](https://github.com/jojohuhu-git/PneumoVax/pull/95) open and awaiting her
squash-merge** (`main` is protected; a session agent cannot merge). Working tree clean at
`b95a55d`. Baseline was 1,669 passing in 151 files; now **1,676 passing in 152 files, 0
failing, 0 skipped** — full suite run on this branch, not remembered. CI on #95 was still
`pending` when this was written; **check it before merging**.

A second PR is also open and independent: **[#94](https://github.com/jojohuhu-git/PneumoVax/pull/94)**
(branch `docs/2026-10-29-handoff-after-three-childrens-items`), which carries the morning
handoff plus one commit recording the citation decision below. No file overlap with #95.

---

## What's done

### 1. P3 — "Always PCV20" for a thrown-out conjugate (PR #95, commit `b95a55d`)

**Her decision, 2026-10-29.** Her children's table has five rows saying the remedy for a
rejected dose is **PCV20, not another dose of the same vaccine**. Those five rows are
**nowhere in this repo** — three handoffs running say only *"five rows"* — so she was asked
with a patient instead (Mia, 2, cochlear implant, PCV15 then a second PCV15 19 days later).
Offered "Always PCV20" / "PCV20 or PCV15" / "I'll resend the table", she chose
**"Always PCV20"**.

**What it reached was small, and the arithmetic is the point.** Only **four** verdicts in the
whole app still said *"repeat this dose only"* — a conjugate below its minimum age (dated and
dateless) and a PPSV23 below 2 years (dated and dateless). W1 (2026-10-11) had already taken
that sentence off every TIMING rejection, which instead reads *"the next dose … can be given
from <date>"* and names no product. The two conjugate verdicts changed; the PPSV23 pair did
not (her ruling names a conjugate, and a child whose PPSV23 came at 18 months needs a PPSV23
at 2). A too-young **PCV20** keeps the old wording, because repeating a PCV20 *is* giving
PCV20.

Measured over the whole grid: chips saying *"give a dose of PCV20 instead"* **264 → 924**,
chips saying *"repeat this dose only"* **748 → 88**. **660 chips moved, 0 verdicts** — both
corpora byte-identical. Guard: `regression-2026-10-29-rejected-conjugate-names-pcv20.test.js`,
confirmed failing first (3 of 6), then broken three ways: remedy never attached **5** fail,
attached to a PCV20 too **4** fail, spread onto PPSV23 **3** fail.
Spec: `CLINICAL_SPEC.md` **§I-REMEDY20**. Live-verified on both patients at
`http://localhost:5173/PneumoVax/`.

Two existing tests asserted the old behaviour and were **widened, not loosened**: the
2026-10-26 sweep said PCV20 advice *"only ever follows a PCV21"* (now false on correct cards)
and now names both families with each count pinned exactly; W1's non-timing example changed
product from PCV13 to PCV20, with a PCV15 case added beside it.

### 2. The 2023 adult MMWR citation — CLOSED by her (PR #94, commit `11e75f6`)

Asked which of its two claims it should carry, she answered: *"ignore for now and do not add
citation given the amount of work needed."* So `mmwr7203a1` stays on **no card**, as it has
since her 2026-10-16 decision. Nothing on any card changed; the only edit is the reason entry
in `src/data/__tests__/citation-orphans.test.js`, which now says **settled, do not re-raise**
instead of "ask her which claim". **Do not raise this again.**

### 3. PR #89 — closed

She said close it. It was in fact **already closed** before this session reached it (`gh pr
close` reported "already closed"), so the only action taken was a comment on it explaining
why, in plain English, for the record. Nothing was cherry-picked; its headline change is on
`main` via #90, its rules-map part via #87, and #91 reversed its child-side premise.

---

## What's NOT done — the remaining queue

### Needs her word first (ask, do not default)

1. **The recommendation card still offers PCV15 beside PCV20.** Ayla, 5 weeks, PCV15 given a
   week early: her chip now says *"give a dose of PCV20 instead"* while her card above it
   still reads *"Product options (choose one): PCV20 (Prevnar 20), PCV15 (Vaxneuvance)"* —
   the routine infant options. A clinician sees one surface naming PCV20 and the other
   offering a choice. Narrowing the card would change what the app **recommends**, not just
   its wording, so it escalates under her 2026-10-18 rule. **This is the first question to
   put to her.**
2. **Has she looked at the rules map?** (`src/data/rulebook.js` + `Rulebook.jsx`, from #87.)
   Unchanged from the morning handoff. It lacks the recommendation side and a third authority
   tier — "Who says so" has only "CDC / ACIP" and "This app", while her tables add *expert
   opinion / literature*.
3. **Three questions still pinned by number** in
   `regression-2026-10-25-at-risk-catchup-waits-eight-weeks-after-ppsv23.test.js`: the healthy
   child with a PPSV23 (11 + 14 patients); the 3-doses-before-12-months row (22); whether
   `ADULT-PCV20-21-5Y-AFTER-PPSV23` should offer the optional repeat.

### Her children's table — the rows still outstanding

| Item | Her row | App on this branch |
|---|---|---|
| **P2** | 2nd PPSV23 <5y, immunocompromised child → **Count**, never a third | ⚠️ **App rejects it.** `CHILD-PPSV23-AFTER-PPSV23` is still `enforcement: 'floor'`. **0 grid patients** — needs a hand-built child. |
| **P4** | Supplemental PCV20 24–51 days after last PCV | Default (repeat) is right; needs the "count it and document" alternative, **withheld for immunocompromised/asplenic children**. |

**P2 is the natural next one** — one rule row plus its message, the same shape as #91 run
backwards, and the machinery all exists.

### Not started

- **"Also state the minimum."** Every card that advises a date should state the true minimum
  beside it — the shape she approved 2026-10-23 for infants. The largest remaining item.
- **One question never put to her** (raised 2026-10-26, deliberately not fixed): a PPSV23
  given 54 days ago but **rejected** for falling inside five years does **not** hold off a
  conjugate — ANCHOR-1, *"an unnecessary dose cannot reset a clock"*. Designed behaviour,
  pinned as a control.
- **The eleven new references stay CLOSED** (owner 2026-10-26). Do not re-raise.

---

## Why this is a good stopping point

P3 is a complete clinical unit — decided, built, measured, live-verified and in a PR — and
the two loose ends the morning handoff listed as "ask her" are both answered and recorded
where a later session will find them (the orphan test, and a comment on #89). Nothing is
half-applied, the tree is clean, and the remaining queue is two independent table rows plus
one wording-vs-recommendation question that only she can settle.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull` (after she
   merges #94 and #95), then `npx vitest run` — confirm **1,676 passing** before touching
   anything.
2. **Check CI on #95** — it was pending when this was written.
3. Ask question 1 above (PCV15 beside PCV20 on the card) before building anything else; it
   touches the same surface P3 just changed.
4. Per item: reproduce → failing test (**confirm it fails**) → fix → `CLINICAL_SPEC.md` in the
   same commit → full suite → **break the fix more than one way and quote the counts** →
   **drive the running app** → commit per item → branch → PR → **she squash-merges**.
5. ⚠️ **The grid cannot build a vaccinated child aged 2–18**, and no grid patient has two
   counting PPSV23 doses — P2 needs hand-built children, as the Hana / Maya / Noor fixtures do.
6. ⚠️ **Never `import` a top-level script to inspect it** — importing
   `scripts/updateVerdictCorpus.mjs` *executes* it and silently regenerates both corpora.
7. ⚠️ **Restore a mutation from a copy, not from git** — `git checkout --` during mutation
   testing deletes the uncommitted fix.
8. `preview_start` "PneumoVax dev server" — it took **port 5173** today; read the real port
   from `preview_logs`, it has also taken 5174, 5176 and 5177.
