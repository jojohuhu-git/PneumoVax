# PneumoVax — Handoff after C10-2, the routine-date/minimum split (2026-10-23)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. Sibling: `/Users/joannehuang/Downloads/MeningoVax-main`.
Live site: https://jojohuhu-git.github.io/PneumoVax/. Dev server: `.claude/launch.json` — **always
read the real port from `preview_logs`**; it was **5174** this session while `preview_start`
reported 59206. What the app is: a client-side React SPA giving pneumococcal vaccine advice
across the lifespan. No backend; **every clinical claim on a card must be traceable to a
document that speaks for *that patient***.

Branch: **`feature/2026-10-23-c10-2-routine-date-vs-minimum`** at `10b8f6a`, pushed,
**[PR #82](https://github.com/jojohuhu-git/PneumoVax/pull/82) open**. Working tree clean.
Suite **1,414 in 128 files → 1,423 in 129, 0 failures, 0 skips**.

Consumed and superseded: `handoff-2026-10-23-c10-1-p2016-table1-citations.md`.

## ⚠ FIRST: two merges, IN THIS ORDER — only the owner can do them

1. **[PR #81](https://github.com/jojohuhu-git/PneumoVax/pull/81) — squash-merge FIRST.** This is
   C10-1. It was blocked on "out-of-date with the base branch" (PR #80 had merged ahead of it);
   `origin/main` was merged into the branch this session, CI `test` passed and
   `mergeStateStatus` went to **CLEAN**. Nothing else is wrong with it.
2. **[PR #82](https://github.com/jojohuhu-git/PneumoVax/pull/82) — squash-merge SECOND.** C10-2.
   It is **stacked on #81** (it uses the Table 1 row C10-1 records), so #81's commits show in it
   until #81 merges. That is expected, not a mistake.

**PR #82 carries one question only the owner can answer** — see "the confirmation she owes"
below. Everything else in it is decided.

## What's done — C10-2 (commit `10b8f6a`, PR #82)

**The fault, in her own worked patient F** (healthy, 4 months, PCV20 at 2.0 and 3.0 months):
the card said "PCV dose 3 of 4 — due today … due 4 weeks after the most recent one". A minimum
interval is the earliest a dose may be given and still COUNT; the engine had only that number
and used it for the date, the `dueToday` flag and the sentence. CDC's series — quoted on that
very card — puts dose 3 at 6 months. She now reads "Not yet due — eligible Dec 23, 2026" and
"due at age 6 months … it can be given today if needed, as the minimum interval of 4 weeks has
already passed [2]".

Implements **OWNER RULINGS A and C of 2026-10-23**, by band:

| Child | Advised date | Cited to |
|---|---|---|
| 2–6 months (routine, no Table 1 row) | the routine **age** — 2, 4, 6 months | CDC's notes |
| 7–23 months (a p2016 Table 1 catch-up row governs) | **8 weeks** after the most recent dose | that Table 1 row |
| routine date already passed | the **minimum** | the CDC catch-up cell |

The advised date is the **latest** of the three — one `max`, which is also the answer to the
open design question about a child genuinely behind.

**CDC's Catch-up Immunization Schedule is on cards for the first time**, per her ruling ("cite
it for the INTERVAL cells only … never for a total"): five cell entries plus one whole-page
entry in `refs.js`, read live 2026-10-23 and **verbatim identical** to the transcription
`intervals.js` has carried since 2026-10-11. **The cell comes back from the same call as the
number** (`pcvNextDoseMinIntervalCell`); re-testing the ages to pick a citation would be a
THIRD reading of Table 2, which is the P0 bug's own shape.

All five of her worked patients land where she asked: **D** 4→8 weeks, **F** due-today→6 months,
and **E / F+ / G** unchanged.

Measured, never quoted: dose verdicts moved **0** of 5,510 recorded doses; validity floors
moved **0**; advised date moved later **145** of 3,305 cards and **earlier 0**; rendered prose
**550** real-patient lines over 6 shapes, all intended; p2016 footprint **3,294 → 3,459**;
uncredited pairs **1**, unchanged. Guard
`regression-c10-2-2026-10-23-routine-date-recommended-minimum-commented.test.js`, proved
load-bearing four ways (4 / 3 / 3 / 2 failing tests per broken clause).

## The confirmation she owes (do not implement past it)

**C10-2 reverses her own decision 3 of 2026-10-11** (`CLINICAL_SPEC.md` §L), which declined "a
separate 'recommended' interval layered over Table 2's number". What she declined then was a
**blanket** 8 weeks at every infant interval; what is built is narrower (8 weeks only where a
Table 1 catch-up row states it; routine AGES in the 2–6-month band). The reversal is sanctioned
by rulings A and C of 2026-10-23, but it is flagged in the PR body as hers to confirm. **If she
declines, the fix is to narrow further, not to revert** — patient F's "due today" was wrong on
any reading.

## 🔴 RULING D — the blocking source check is DONE. This is the next item.

**Her ruling (2026-10-23):** *"the repeat dose should be spaced from the invalid dose by the
minimum interval. This should be followed."*

**The ⚠ the last handoff raised is now ANSWERED. There is no pneumococcal override.** CDC's
"Timing and Spacing of Immunobiologics" read live 2026-10-23 (91,348 chars via the browser
pane). The general rule is verbatim: *"The repeat dose should be spaced after the invalid dose
by the recommended minimum interval (Table 3-2)."* The page names its exceptions per vaccine
and there are three:

* **Hib — follows the general rule:** *"The repeat dose should be administered ≥4 weeks after
  the invalid dose (in this case, the second)."*
* **Hepatitis A — follows it:** *"repeated 6 months after the invalid second dose."*
* **Hepatitis B — THE EXCEPTION:** *"The repeat dose can be administered as early as 8 weeks
  after the 2nd valid dose…"* — anchored to the VALID dose. Explicitly scoped to hepatitis B.
* (Live vaccines get their own 28-days-from-the-invalid-dose rule.)

**Pneumococcal appears four times on that page and not once about repeat or invalid doses** —
all four are simultaneous-administration findings (PPSV + influenza; PCV13 + MenACWY-D in
asplenia/HIV; PCV13-before-PPSV23 sequencing). So the general rule governs and ruling D can be
implemented.

**Half of it is ALREADY DONE, on the validator side.** `regression-p1-0-recorded-dose-intervals`
has `'an invalid dose still anchors the next one — CDC spaces the repeat from it'`, which
asserts exactly that and passes. Do not rebuild it.

**What is left is the RECOMMENDATION side**, which is the item `CLAUDE.md` records as "Still
open and NOT to be changed without her":

* `recommend()` calls `summarizePcv(effectivePcv, …)` — the EFFECTIVE list, invalid doses
  already dropped — so `pcv.lastDate` is the last **VALID** dose and every card anchors its
  advice there. Ruling D says the anchor date should be the most recent dose **on record**.
* `anchor = pcv.lastDate` is read in **two** blocks (`recommend.js` ~line 395 and ~line 929),
  so this is not a one-line change and both surfaces must move or be proven unaffected.
* ⚠ **The anchor DATE and the interval KEY are different questions** and the first draft will
  want to move both. `pcv.lastAgeAtDose` keys WHICH cell of Table 2 applies (dose number,
  age at previous dose) — that is the series position, arguably still the last valid dose —
  while ACIP's sentence is about the DATE the repeat is measured from. Decide the split
  deliberately and say so in the PR; conflating them is how this goes wrong.
* This **moves verdicts** → case (c), so the owner decides at merge, with counts in the PR.
  Measure it the way C10-2 was measured (see "the corpora cannot see infant changes" below).

## The remaining queue

| Priority | Item | Scope |
|---|---|---|
| **P1** | **Ruling D — anchor the advised repeat to the INVALID dose** | Above. Source check done, no pneumococcal override, validator half already built. Case (c). |
| **P2** | Patient E's "of 3" — **probably not a defect** | She flagged that the card says "of 3" while "the p2016 row she named gives a total of 2". Traced this session: E (doses at 11 and 12.5 months) has **one** dose before 12 months, so the ladder takes Table 1's "1 before age 12 months — 2 additional doses" row → total 3, and her 12.5-month dose is the first of those two. That is the row the card cites and the totals agree. The alternative reading ("1 dose at age 12 months or older → 1 additional dose", total 2) ignores her infant dose. **Put the two readings to her; do not change the ladder first.** |
| **P2** | Unchanged | Card classes the grid can no longer reach; dead `advisory` flag; interval-prose guard blind spot; job aid footnote § unread. |
| — | **C4, C5** | MeningoVax-only, untouched, independent. |

**Closed, do not reopen:** everything the previous handoff listed, plus the whole p2016
citation question (zero uncredited pairs), plus **the C10-2 interval question and the catch-up
chip** — both shipped in #82. The Job Aid's last statement (1,584 cards) is still the decision
she asked **not** to be re-raised.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`
2. **Check #81 and #82 merged, in that order.** Branch fresh off `main`; never leave a branch
   without a PR.
3. `npx vitest run` — confirm **1,423 passing in 129 files**, no skips, before any new work.
   Pipe to `tail`, never `head`; for a reliable file count use `--reporter=json` and read
   `len(testResults)` (`numTotalTestSuites` is not files).
4. `npx vite-node scripts/uncreditedSources.mjs` — confirm **1** pair. Re-measure, never quote.
5. Per item: reproduce → failing test (say the pre-fix failure count) → fix → full suite green →
   **break the fix in more than one way and quote the counts** → `node scripts/proseDiff.mjs
   dump` on both sides (plain `node`, NOT `vite-node`), compared **field by field** — strip the
   `[c]` markers *with their leading space* → **drive the running app** → commit per item ID.
6. Ask, don't default, on: (a) a history no document has a row for, (b) two documents giving
   different doses, (c) anything that would move a verdict. Everything dose-unchanged is yours
   (OWNER DECISION 2026-10-18), grouped in the PR body.
7. Push/merge policy: **branch → PR → the owner squash-merges.** A session agent cannot merge.

## Lessons this session paid for

- **A green corpus can mean the grid cannot see the change.** Both corpora record `dueToday`
  and `earliestNextDate` and both stayed byte-identical — while 145 real cards moved. Of the
  **1,342** infant cards the grid builds, **0** have a future advised date: its fixed
  day-offsets leave every infant case overdue, where advice and floor coincide. The blast
  radius had to be measured against the pre-change engine on 1,983 purpose-built patients.
  **Before reporting "0 verdicts moved", ask whether the grid can build the patient at all.**
- **A citation ADDED is as dangerous as one removed.** p2016 went back onto 165 routine-4-dose
  cards — the first RISE in that footprint — and tripped two pinned guards. Both were right to
  fire; one had to be narrowed from "p2016 is absent here" to its real claim, "p2016 never
  carries the TOTAL". FINDING F is usually told about removals; this is the mirror.
- **A guard can settle a question you were about to decide by taste.** Whether one Table 1 row
  may be numbered twice on a card (once for the total, once for the interval) was a genuine
  toss-up until `regression-c8`'s "no card anywhere gives the SAME sentence two numbers"
  failed. **Run the suite before deliberating; the repo may already have ruled.**
- **A failing old test is sometimes the correct answer.** The first draft applied p2016's 8
  weeks to every band; `regression-p1-0` expected 2026-05-18 and got 2026-06-15. The test was
  right — p2016 states no spacing for the 2–6-month band — so the CHANGE was narrowed rather
  than the test. The second-order lesson: that same test had already been rewritten once this
  session to accommodate the wrong draft, and had to be put back.
- **`preview_start` reported port 59206; the server was on 5174.** Read `preview_logs` every
  time.
