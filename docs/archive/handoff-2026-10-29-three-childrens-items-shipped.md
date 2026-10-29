# PneumoVax — Handoff after the three children's items shipped (2026-10-29)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Client-side React SPA for pneumococcal
vaccine decision support across the lifespan. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

**Branch: `main`, clean, up to date with `origin/main` at `0b6494a`.** Nothing is in
flight. **1,669 passing in 151 files, 0 failing, 0 skipped** — re-run on `main` on
2026-10-29, not remembered. The Pages deploy for `0b6494a` succeeded.

`main` is protected: work lands branch → PR → **the owner squash-merges** (a session agent
cannot merge).

---

## What's done — PR [#93](https://github.com/jojohuhu-git/PneumoVax/pull/93), merged 2026-10-26

Three items, one commit each, all live-verified in the running app before shipping.

### 1. The 8-week wait runs from her LAST PPSV23, not her first

`anchorPneumo` in `recommend.js` asked for "the most recent pneumococcal vaccine" — its own
comment said so — but used `.find()`, which returns the **first** match. A child with two
counting PPSV23 doses had her eight weeks measured from a dose up to seven years old.

Hana, 12, asplenia, no conjugate ever, PPSV23 1 Jan 2019 + 1 Sep 2026: told **due today** on
25 Oct, 54 days after her real last dose, on a card labelled "≥8 weeks". A child with
**only** the 2026 dose was correctly held to 27 Oct — more history, earlier date.

Owner, 2026-10-26, shown both schedule sentences: *"both statements are correct."* So **no
interval changed**; only which dose feeds the 8-week rule. The five call sites that want the
**first** dose (the 5-year revaccination clock) still reach for it directly.

Measured over 21,327 card rows: **408 moved, 228 patients, every one LATER**, date the only
field that changed, **0 grid rows** (both corpora byte-identical). Guard:
`regression-2026-10-26-eight-weeks-runs-from-the-last-ppsv23.test.js`.
Spec: `CLINICAL_SPEC.md` **§C-PPSV23LAST**.

### 2. P5 — the infant floors pinned, and the arithmetic behind "already correct" corrected

Her row: doses 1–3 invalid before **38 / 66 / 94** days. The previous handoff said *"already
correct — 38+28+28 = 94 exactly"*. **The conclusion is right; the arithmetic is not.** The
app adds 28 − 4, because CDC's grace applies to the gap as well as the age:

| | dose 1 | dose 2 | dose 3 |
|---|---|---|---|
| Her row: invalid before | 38 | 66 | 94 |
| App, earlier doses at the **routine** ages | **38** ✓ | **66** ✓ | **94** ✓ |
| App, each earlier dose at **its own earliest** | **38** | **62** | **86** |

**Not a defect.** CDC General Best Practices, fetched live 2026-10-26: doses *"≤4 days before
the minimum interval **or** age are considered valid"* — each minimum gets the grace
separately, and CDC measures the next gap from the dose the patient **got**. Her numbers
describe a routinely-vaccinated baby; the app matches them exactly there.

**No engine code changed** — guard + spec only. Proved load-bearing: grace 4→0 fails **52**
tests, min age 42→41 fails **9**, gap 28→27 fails **28**.
Guard: `regression-2026-10-26-infant-dose-floors-38-66-94.test.js`.
Spec: **§K-INFANTFLOORS**.

### 3. A child's rejected PCV21 names PCV20

The chip contradicted itself: *"licensed for adults ≥18 years only… does not count"* followed
by *"repeat this dose only"* — i.e. give her another PCV21, rejected again forever. Now reads
*"give a dose of PCV20 instead"*. CDC's own phrase is *"repeated **as age appropriate**"*.

**No verdict moves** — rejected before, rejected now; only the sentence changed. Keyed on a
`remedyProduct` **field**, not text matching. A near miss is recorded in the spec: the first
draft reused `DOES_NOT_COUNT_LEAD`, which carries *"given too soon after the dose it is
measured from"*, putting a timing fault on a dose with none — caught by driving the app, not
by the suite.
Guard: `regression-2026-10-26-pcv21-for-a-child-names-pcv20.test.js`.
Spec: **§I-REMEDY** (which also corrects §I's old claim that "repeat as age appropriate" was
right here).

---

## ⚠️ READ FIRST — PR #89 is stale and looks superseded

[#89](https://github.com/jojohuhu-git/PneumoVax/pull/89) *"An early conjugate after a PPSV23
counts for an adult too, and the rules map says where the app is judging"*, branch
`claude/beautiful-volta-gaw7c6`, opened 2026-10-25, **is still open, CONFLICTING/DIRTY, and
5 commits behind `main`** (25 files differ). Verified on 2026-10-29:

- **Its headline change is already on `main`.** `ADULT-PCV-AFTER-PPSV23` is
  `enforcement: 'recommendation'` (the adult dose counts), and the row's own `source` says
  *"OWNER RULING 2026-10-25 relaxed this row from a floor to a recommendation"*, with
  `regression-2026-10-25-an-early-adult-dose-owes-nothing.test.js` covering it. That landed
  via **#90**.
- **Its premise has half-collapsed.** The title says the adult dose counts *"as it does for a
  child"* — but **#91 reversed the child side**: `CHILD-PCV-AFTER-PPSV23` is now
  `enforcement: 'floor'`, `authority: 'OWNER'`. The analogy the PR is named for no longer
  holds.
- **The rules map already carries judgement-call markers** on `main`
  (`Rulebook.jsx`, `rulebook.js`), landed via #87.
- It also strands a handoff on an unmerged branch:
  `docs/archive/handoff-2026-10-25-count-like-the-child-and-the-judgement-call-map.md` is
  **not on `main`**.

**Recommendation: close it** — but that is the owner's call, and nobody has confirmed that
*nothing* in its rulebook commits is still wanted. **Do not rebase it blind**; a 5-commit
rebase across a squash-merge is the trap recorded in memory. If anything is wanted, cherry-
pick the specific rulebook change onto a fresh branch off `main`.

---

## What's NOT done — the remaining queue

All verified against `main` on 2026-10-29.

### Her children's table — the rows still outstanding

| Item | Her row | App on `main` today |
|---|---|---|
| **P2** | 2nd PPSV23 <5y, immunocompromised child → **Count**, never a third | ⚠️ **App rejects it.** `CHILD-PPSV23-AFTER-PPSV23` is still `enforcement: 'floor'`. **0 grid patients** — needs a hand-built child. |
| **P3** | Five rows: the remedy is **PCV20**, not another dose of the same vaccine | **Mechanism now exists** — `remedyProduct` / `remedyIsAnotherProduct()` in `validate.js` — but is wired to **PCV21-under-18 only** (two call sites). The other five rows are untouched. Shared by adults and children. |
| **P4** | Supplemental PCV20 24–51 days after last PCV | Default (repeat) is right; needs the "count it and document" alternative, **withheld for immunocompromised/asplenic children**. |

**P3 is the natural next one** — it is the only genuinely new capability left, and item 3
above already built and shipped its machinery, so the remaining work is choosing the right
product per row rather than inventing a mechanism.

### Citations

- **The 2023 adult MMWR (`mmwr7203a1`) — ASK WHICH CLAIM FIRST.** Owner 2026-10-26: *"I do
  want to add the MMWR pneumococcal 19 and older 2023 document to cite."* It is on **no card**
  today **by her own decision of 2026-10-16**, recorded in
  `src/data/__tests__/citation-orphans.test.js` (verified still there). Two claims used to
  rest on it: the adult PCV15→PPSV23 interval (now carried by mm7401a1 + the 2025 job aid —
  CLAUDE.md says *"rr7203a1 is superseded, never cite it for an adult interval again"*), and
  the adult risk-factor list, which sat on only **4 of 17** risk conditions so the sources at
  the foot of a card changed with which box was ticked. **Put it to her with patients, not
  statement names.** An interval answer reverses the October decision and CLAUDE.md must
  change in the same commit.
- **The eleven new references are CLOSED — skipped, owner 2026-10-26.** Do not re-raise. The
  2014 *Vaccine* paper stays named in `CHILD-PCV-AFTER-PPSV23`'s `source` prose with no chip.

### Not started

- **"Also state the minimum."** Every card that advises a date should state the true minimum
  beside it — the shape she approved 2026-10-23 for infants.
- **The rules map.** `src/data/rulebook.js` + `Rulebook.jsx` (from #87). **She has not said
  whether she has looked at it.** It lacks the recommendation side and a third authority tier
  — "Who says so" has only "CDC / ACIP" and "This app", while her tables add *expert opinion
  / literature*. See the #89 warning above before touching it.
- **Three questions still pinned by number** in
  `regression-2026-10-25-at-risk-catchup-waits-eight-weeks-after-ppsv23.test.js`: the healthy
  child with a PPSV23 (11 + 14 patients); the 3-doses-before-12-months row (22); whether
  `ADULT-PCV20-21-5Y-AFTER-PPSV23` should offer the optional repeat.
- **One question never put to her** (raised by item 1, deliberately not fixed): a PPSV23 given
  54 days ago but **rejected** for falling inside five years does **not** hold off a
  conjugate — ANCHOR-1, *"an unnecessary dose cannot reset a clock"*. Designed behaviour,
  pinned as a control in that item's guard.

---

## Why this is a good stopping point

Three complete clinical units are merged, deployed and live-verified, with every moved number
measured rather than estimated. Nothing is half-applied, the tree is clean, and the only loose
end — PR #89 — is diagnosed rather than left to be discovered. The remaining queue is three
independent table rows plus one citation question, none blocking the others.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`
2. `npx vitest run` — confirm **1,669 passing, 0 failing** before touching anything.
3. **Decide PR #89 first** (close, or cherry-pick a named piece) — it is the only thing that
   can waste a day if ignored.
4. **Open decisions — ask, do not default:** (a) which claim the 2023 adult MMWR should carry;
   (b) has she looked at the rules map; (c) the three pinned questions above.
5. Per item: reproduce → failing test (**confirm it fails**) → fix → `CLINICAL_SPEC.md` in the
   same commit → full suite → **break the fix more than one way and quote the counts** →
   **drive the running app** → commit per item.
6. ⚠️ **The grid cannot build a vaccinated child aged 2–18**, and no grid patient has two
   counting PPSV23 doses. A sweep over `buildCases()` is **not** a guard for these children —
   hand-build them, as the Hana / Maya / Noor fixtures do.
7. ⚠️ **Never `import` a top-level script to inspect it** — importing
   `scripts/updateVerdictCorpus.mjs` *executes* it and silently regenerates both corpora.
8. ⚠️ **A guard that passes the moment you write it proves nothing.** Mutate the code and
   quote the failure count, as items 2 and 3 above did.
9. `preview_start` "PneumoVax dev server" — **read the real port from `preview_logs`**; it has
   taken 5174, 5176 and 5177 on different days.
10. `vaccine-parity`: pneumococcal logic is PneumoVax-only; only `dateUtils.js` is mirrored.
