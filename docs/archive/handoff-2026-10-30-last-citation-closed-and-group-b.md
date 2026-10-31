# PneumoVax — Handoff: the citation work is FINISHED, and one open question (2026-10-30)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Client-side React SPA for pneumococcal
vaccine decision support across the lifespan. No backend. Live at
https://jojohuhu-git.github.io/PneumoVax/ (GitHub Pages, deploys from `main`).

Branch: `fix/2026-10-29-last-citation-and-the-age-50-note`, **pushed**, PR
[#97](https://github.com/jojohuhu-git/PneumoVax/pull/97) **open, CI green on the first
commit, awaiting her squash-merge**. Working tree clean at `a0fd7cb`. Suite:
**1,703 passing in 153 files, 0 failing** — run on this tree, not remembered. `main` is at
`0bc8a7d` (PR #96, merged today, Pages deploy succeeded).

⚠ The full suite takes **~25–40 minutes** on this machine. Run it in the background and do
mutation testing against single files, which takes seconds.

---

## THE HEADLINE: every source chip in the app is now explained

`npx vite-node scripts/uncreditedSources.mjs` reports **0** (document, statement) pairs over
**17,407 cards**, down from **68 across six documents** when C7 began on 2026-10-17. All six
documents carry zero uncredited pairs. **Re-run the script rather than trusting this
sentence** — if a pair reappears, a document was put on a card before its row was read.

---

## What's done — PR #97, two commits

### 1. `e9b777b` — the last uncredited chip comes off, and a new line goes on

**OWNER DECISION 2026-10-29**, on *Nora, 10 years 5 months, healthy, no doses*: the CDC PCV
Catch-up Job Aid chip had nothing citing it on 1,584 cards. Her words: *"Take chip off - can
you add a comment to re-evaluate pneumococcal vaccines once the patient turns 50 years old
and cite the necessary adult reference?"*

**This was C7's "document 4, statement 1" — the one she asked TWICE (2026-10-17) not to have
pushed at her.** She lifted that herself by asking for the last citation to be worked. It was
raised once, with the live card and both readings, and she decided.

The job aid was read in full first (FINDING F discipline): local PDF 95,267 bytes,
byte-for-byte what cdc.gov serves, sha256 `65aec99a…`, all 3 pages. Oldest row *"24 through
59 months"*, table ends there; title *"Catch-Up Guidance for Healthy Children 4 Months
through 4 Years of Age"*; footnote 1 sends at-risk children to CDC's notes. **No row for a
10-year-old.** It keeps its place on the **144** healthy 24–59-month cards (mirror guard).

`adultRoutine50` re-read live 2026-10-29 with the accordions open: occurs **exactly once**,
in `accordion-panel-pneumo-routine`, under the parent bullet **"Age 50 years or older who
have:"**. That parent is why it, and not a 19–49 "review at 50" sentence, carries the claim.

### 2. `a0fd7cb` — the same line on the healthy toddler's card

**OWNER DECISION 2026-10-30.** Shown all nine children's card families that end in "nothing
needed", each with its own patient taken forward to 19 and to 50 in the running app:

| Group | Families / cards | At 19 and at 50 | Decision |
|---|---|---|---|
| **A — healthy** | *Not indicated (healthy 5–18y)* 1,584; *PCV series complete* 12 | nothing at 19, **dose due at 50** | **line on both** |
| **B — at-risk** | 4 families, **640** | **dose due at 19** | **PARKED — see below** |
| **C — complete for life** | 3 families, 1,379 | complete at both | no line |

The sentence lives in **one** constant (`REVIEW_AT_50_SENTENCE` + `reviewAt50Cite()` in
`recommend.js`); both cards print from it. Both counts **pinned exactly**.

**A pre-existing guard needed updating, not loosening**:
`regression-c8-2026-10-22-catchup-job-aid-cites-the-row-that-fits.test.js` pins the exact
citation list on the toddler's card, which gained a 4th key. The first full run after the
change came back **4 failed** because of it.

Mutations that bite — item 1: **7 / 5 / 2 / 2**; item 2: **6** (line off Ivy) and **2** (line
onto Maya, both naming her). ⚠ A third mutation was **discarded, not believed**: a `perl`
replacement interpolated `${REVIEW_AT_50_SENTENCE}` as a Perl variable, silently no-opped,
and the tests "passed". **Verify a mutation actually applied before reading its result** —
use Python with an exact literal replace and an `assert count == 1`.

---

## ⚠ THE ONE OPEN OWNER QUESTION — GROUP B (640 cards)

**She chose "think about it" on 2026-10-30. It is NOT decided. Do not close it by copying
the age-50 sentence — for these children the number is 19, not 50.**

**Maya** — 18 years old, cochlear implant, PCV13 at 7y11m (2016-10-13), PPSV23 at 12y11m
(2021-10-11). Driven in the app on 2026-10-30:

> **Complete (PCV13 + PPSV23 at/after age 6)**
> Non-immunocompromising at-risk child with PCV13 at/after age 6 who has received PPSV23 —
> **no further doses of any PCV or PPSV23 are indicated** <sup>[1]</sup>.

Move her age to 19 with the app's own control, changing nothing else:

> **Due today: PCV.**  PCV20 or PCV21 ≥5 years after last pneumococcal dose — completes the
> series. <sup>[1] CDC Adult Notes [2] ACIP 2025 Adult MMWR</sup>

Both are correct — the paediatric schedule does finish her, the adult schedule does give her
a dose. The card simply names no age, **one year** before the dose falls due.

The four families, with their counts:

| Card | Cards |
|---|---|
| Complete (PCV13 + PPSV23 at/after age 6) | 450 |
| Complete (a PCV of unrecorded product + PPSV23 at/after age 6) | 70 |
| PCV complete (at-risk catch-up done) | 15 |
| Complete (PCV series + PPSV23) | 5 |

**If she says yes**, it needs its own wording and its own citation — CDC's adult notes,
"Special situations" (`adultIc1949BothPcv13Ppsv` is the row the app already uses at 19) —
and it is a **new clinical claim on a child's card**, so put the real patient in front of
her first. It is NOT a copy of the age-50 line.

Guarded now by `regression-c12-2026-10-29-last-citation-and-the-age-50-note.test.js`: Maya's
card must not carry the line, **and** the app must still give her a dose at 19. If the second
assertion ever fails, the question itself has changed.

---

## What's NOT done — the remaining queue

### P2 — the second PPSV23 for an immunocompromised child (she chose this as next, 2026-10-29)

Her row: a 2nd PPSV23 given **inside 5 years** to an **immunocompromised** child should
**Count**, and she should never be offered a **third**. The app still throws it out:
`CHILD-PPSV23-AFTER-PPSV23` is `enforcement: 'floor'`, `authority: 'CDC'`. It is the adult
Ruling F relabelling run again — as a *floor* the row asserts "an early dose stops counting",
which CDC does not state; as a *recommendation* it asserts only CDC's interval, which it
does. "Never a third" should fall out of `ppsv.count` counting **effective** doses —
**verify that rather than assuming it.**

⚠ **ONE OPEN OWNER QUESTION, measured:** her row names an **immunocompromised** child, and
**no grid patient ever hits this rule** (880 children have two PPSV23 rows, none inside five
years). **Ask whether a non-IC child's early second PPSV23 should also be counted.** Do not
default. Ask with a patient, in plain words.

### P4 — the supplemental PCV20 at 24–51 days
Offer a "count it and document" alternative, **withheld for immunocompromised and asplenic
children**. The default (repeat) is already right.

### Not started
- **"Also state the minimum."** Every card that advises a date should state the true earliest
  beside it — the shape she approved 2026-10-23 for infants. **The largest remaining item.**
- **The rules map** (`src/data/rulebook.js` + `Rulebook.jsx`). She looked at it on 2026-10-30
  and is thinking about design and formatting; **no instruction yet**. Two gaps named to her:
  it covers only the "is this recorded dose valid" side and says nothing about how the app
  decides what to *recommend*; and "Who says so" has two tiers (CDC/ACIP, "this app's own
  judgement") where her own tables use a third — expert opinion / literature.
- **One question never put to her:** a PPSV23 given 54 days ago but **rejected** for falling
  inside five years does **not** hold off a conjugate (ANCHOR-1). Designed, pinned.
- **The eleven new references stay CLOSED** (owner 2026-10-26). **`mmwr7203a1` stays on no
  card** (owner 2026-10-29). Do not re-raise either.

---

## Resuming

1. `git checkout main && git pull` after she merges #97, then run the suite — confirm
   **1,703 passing** before new work.
2. **Ask P2's open question first** (non-IC child's early second PPSV23), with a patient.
3. Per item: reproduce → failing test (**confirm it fails**) → fix → `CLINICAL_SPEC.md` in
   the same commit → full suite → **break the fix more than one way and quote the counts** →
   **drive the running app** → commit per item → PR → **she squash-merges**.
4. ⚠ **Assert whole sentences, not substrings or dates alone.**
5. ⚠ **Verify a mutation applied** (see above) — a no-op mutation reads as a passing guard.
6. ⚠ **The grid cannot build a vaccinated child aged 2–18**, no grid patient has two counting
   PPSV23 doses, and **0** hit `CHILD-PPSV23-AFTER-PPSV23`. Hand-build.
7. ⚠ **Restore a mutation from a scratchpad copy, not `git checkout --`**, which deletes the
   uncommitted fix. Check the restore landed — one `cp` in this session silently failed.
8. ⚠ **Never `import` a top-level script to inspect it** — importing
   `scripts/updateVerdictCorpus.mjs` *executes* it and regenerates both corpora.
9. ⚠ **The "PASS (n) FAIL (n)" line is the terminal wrapper, not vitest.** Grep vitest's own
   `Tests  N passed`. Vitest's `--reporter=json` output could not be parsed in this session
   (unescaped control characters); use the default reporter and grep.
10. `preview_start` "PneumoVax dev server" — it took **5173** today; it has also taken 5174,
    5176 and 5177. Read the real port from the start result.
11. Driving the history step: dose fields use React `useId` ids like `:r1:-date-0`, which are
    **invalid CSS selectors** — use `getElementById`, and set values with the native setter
    plus `input`/`change` events.
12. `vaccine-parity`: pneumococcal logic is PneumoVax-only; only `dateUtils.js` is mirrored.
