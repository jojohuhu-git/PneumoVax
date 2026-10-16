> ⚠️ **SUPERSEDED 2026-10-16 by `handoff-2026-10-16-s15-adult-interval.md`.** Its queue
> item **0** is done (PR #52) — but **not as described below or in the plan it points to**.
> Two of that plan's findings rested on ACIP rr7203a1 (2023), which the owner identified as
> out of date; the current sources contradict them and the app was already correct on both.
> **Do not resume from this file.** Items 5–8 and N1–N4 are carried forward in the new one.

# PneumoVax — Handoff after S6's second half merged (2026-10-15)

> **Supersedes `handoff-2026-10-15-pcv21-offlabel-merged.md`.** That file's queue items
> **2, 3 and 4 are now all done and merged** — `P4-3` as PR #47 (`7b1a1e5`), `S5`/`P2-1`+`P2-13`
> as PR #48 (`999393b`), and `S6`'s second half as PR #49 (`9b4d321`). Items 3 and 4 merged
> WITHOUT a handoff being written, so that file was two PRs stale when this session resumed
> from it. Items 5–8 and N1–N2 are carried forward below with their numbering preserved.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`main`**, clean, in sync with origin at **`9b4d321`**. **No open PRs.**
Suite **918 passing / 83 files**, all green (run on merged `main`, not remembered).
`npm run build` exits 0. Pages deploy succeeded and the change is **confirmed on the live
site**, not assumed.
**`main` is protected: branch → PR → squash merge. Never push to `main`.**

Sibling repo **MeningoVax** (`~/Downloads/MeningoVax-main`): on `main`, clean, at `f0ec86d`.
**Not modified this session.** Its PR **#70 is still open** and was not touched.

This app's core promise is honesty: a silent wrong answer is worse than a crash. The owner
is a clinician, not a coder — explain every what and why in plain English, in chat and UI copy.

## Owner decisions this session

1. **Merge #49** (done — merged, deployed, live site checked).
2. #49 itself needed no clinical decision: a refactor with **zero** output change, proved
   rather than assumed, plus a documentation correction applying rules already settled
   (A-P1-1, 2026-10-10 and S14-7, 2026-10-11).
3. ⚠️ **NEW AND IMPORTANT — the adult PCV→PPSV23 recommended interval goes back to being
   keyed on risk class.** Taken after the owner questioned #49's explanation and ACIP
   rr7203a1 was fetched live: its Tables 2, 3 and 4 print **≥8 weeks** as the schedule for an
   immunocompromising condition / CSF leak / cochlear implant, at **both** age bands, and
   **≥1 year** otherwise. This **reverses the interval half of A-P1-1**. The owner also
   instructed that the whole adult interval surface be audited, not just the PCV15 row.
   **NOT STARTED — deliberately not worked on in that session.** Planned in full in
   `plan-2026-10-15-adult-interval-risk-class-audit.md`; it is now queue item **0**.

## What's done

### Queue item 2 — `S6` second half, PR [#49](https://github.com/jojohuhu-git/PneumoVax/pull/49), `9b4d321`

Every interval was written **twice**: once as a constant that computes the date, once as
words typed by hand into the sentence beside it. Nothing kept them in step.

Proved on `main` at `999393b` by setting `ADULT_PPSV23_INTERVAL_MONTHS` to 6 and asking the
engine for a 60-year-old with diabetes and a PCV15 on record:

```
doseLabel        : PPSV23 (≥1 year after PCV15) — completes the series
minIntervalMonths: 6
earliestNextDate : 2027-04-10
```

The card said "at least 1 year" above its own eligible-on date of six months later. Same
mutation after the fix reads "≥6 months" over that date — still wrong (the constant was
deliberately broken) but no longer self-contradictory.

`intervals.js` now owns the only place an interval becomes words: `intervalPhrase`
("8 weeks"), `intervalPhraseAdj` ("8-week"), `intervalArticle` ("a"/"an"). **51** hand-typed
intervals now read from their governing constant — 31 in `recommend.js`, 20 in
`doseIntervalRules.js`, where each rule row hands **its own** interval to **its own** message.

Also removed: `ppsvIntervalDays`, a permanently-`null` branch left from the risk-class-keyed
interval A-P1-1 amended away. And `ADULT_PPSV23_SHORTER_MINIMUM_WEEKS` — exported and read by
**nothing** — is now what the 8-week option's wording derives from.

**No patient sees any difference, and that was measured, not assumed.** The rendered prose of
every card and verdict was dumped before and after and diffed: **0 differing of 16,250** real
patients and **0 of 18,460** impossible entries. `sweep:update` was NOT run; no verdict moved.

⚠️ **The lesson worth carrying forward.** The sweep corpora could not have proved this —
they record verdicts and **deliberately not prose** ("Nor does it record note text or dose
labels"). A first pass fed the noun form into clauses needing an adjective and printed
**"the 8 weeks minimum interval"** and **"this 5 years gap"** to **843 of 16,250** patients
with all 907 tests green, because no test asserted those clauses. Only a prose diff caught
it. **Four tests now cover them. For any prose change, diff the rendered text — a green
corpus is not evidence about wording.** The dump script pattern is in the PR body.

Mutation counts (each run, counted, restored from the scratchpad — never `git checkout`):
`M1` one interval hand-typed back **1/907** · `M2` wrong unit **15/907** ·
`M3` noun form in an adjectival slot **3/907** · `M4` article hardcoded **1/907** ·
`M5` every row handed the same interval **4/907** · `M6` adult interval 12→6 **26/907**
(was 19/878) · `M7` the escaped `riskFactors.js` sentence restored **1/917** ·
`M8` both rulebook headings restored **1/917**. **M3, M7 and M8 were caught by nothing before.**

### `S6-6` — a fifth stale copy of the amended adult interval (same PR)

S8 fixed four documents still stating the pre-A-P1-1 risk-class-keyed rule. Four more found:

1. **`src/data/riskFactors.js`** — the worst. Its header read `"• IC adult interval = ≥8
   weeks; non-IC chronic adult interval = ≥1 year."` two hundred lines **above**
   `ADULT_PPSV23_INTERVAL_MONTHS`, in the file that owns both constants. The S8 guard missed
   it because that guard keys on a stale **identifier** beside the stale rule (all four
   earlier copies named `adultPpsvIntervalClass()`) and this sentence named nothing.
2. **`CLINICAL_SPEC.md`** in three places — §C, §J's two class headings, §K's precedence
   bullet — contradicting its own A-P1-1 bullet ten paragraphs later.
3. **`src/logic/recommend.js`** — a comment with **no code under it** saying "Whether the
   patient needs the ≥8wk (IC) interval". A tombstone from `adultPpsvIntervalClass()`'s
   deletion. Removed.

**Why it is not simply a wrong number:** S14-7 gave those numbers a second job, and the
**validity floor** *is* keyed on the risk class. So "IC → 8 weeks" is right as a floor and
wrong as the recommendation, and every site said it without saying which — the exact trap
`CLAUDE.md` names. §J now carries a table of the **three** things the class decides (which
option is *named*, which *floor* applies, which 19–49 *row*) and says the recommended
interval is not one of them. `CLINICAL_SPEC.md`'s stamp moved to 2026-10-15.

New guard in `rule-docs-match-code.test.js`: checks for the **rule by its words**, not by an
identifier, across six documents and three source files, with its own controls (the patterns
must fire on the four real escaped sentences and must **not** fire on the current rule or the
S14-7 floor wording).

## What's NOT done — the remaining queue, in recommended priority order

Numbering continues from the previous handoff; items 1–4 are done. **Item 0 is new and
outranks everything else.**

**0. ⚠️ ADULT DOSING-INTERVAL RECOMMENDATIONS ARE WRONG FOR IMMUNOCOMPROMISED ADULTS.**
**Owner decision taken 2026-10-15. Full plan, verified ACIP source table and measured current
behaviour: `plan-2026-10-15-adult-interval-risk-class-audit.md`. PLANNED, NOT STARTED.**

In one line: **ACIP says 8 weeks and the app says 1 year.** For an adult with an
immunocompromising condition, CSF leak or cochlear implant, ACIP rr7203a1 Tables 2/3/4 give
PCV15 → PPSV23 at **≥8 weeks**; the app recommends **≥1 year** to every adult regardless of
risk, and puts a date twelve months out in the due field. ACIP's stated reason for the
shorter interval is "to minimize the time of risk for IPD caused by serotypes unique to
PPSV23 in these groups at increased risk".

Measured on `main` @ `2983d41`: the recommended interval is **flat across risk class** in
every history row, at both age bands — not one of ACIP's 8-week cells is reflected.

**The app already contains the split, on the other side of the question.** The validator
(`doseIntervalRules.js`) keys on risk class in four rows (`shorterMinimum: true/false`, 8
weeks vs 1 year, for PCV15→PPSV23 **and** PCV13→PPSV23); the recommender (`recommend.js`)
keys on nothing. `adultPpsvShorterMinimumApplies()` is already imported and called there —
today only to append the "8 weeks may be considered" sentence, never to pick the number.

**Five further findings, which is why this is an audit and not a one-line fix:**
PCV13→PPSV23 is 8-week keyed too and the recommender never says so; **cochlear implant / CSF
leak are NOT IC-equivalent for the second PPSV23** (rr7203a1 says so explicitly) and the app
treats them as one class; the adult pathway only ever offers ACIP's Schedule option A, which
makes option B's 8-week cells unreachable; "PPSV23 only → ≥1 year" is the **control that must
not move**; and rr7203a1's "review at 65" is **stale** against mm7401a1's routine-at-50 and
must not be imported while fixing its intervals. Each is written up with its source quote.

**Parity checked: MeningoVax does NOT have this asymmetry** — it keys MenB intervals on risk
status in both `recommend.js` and `validate.js`, from the same shared constants. PneumoVax-only
bug class, and MeningoVax is the reference for the SHAPE of the fix (risk-keyed constant in the
shared interval module, imported by both sides). No parity PR owed.

**Three owner sub-questions are listed in the plan's §8 — ask, do not default.**
**This WILL move verdicts** (unlike #49). Both corpus counts go in the PR. Opus 5, high effort.

**5. `P4-4` — the history step never asks the yes/no question.** An untouched step is
ambiguous: no doses, or not asked? **Owner decision already recorded (2026-10-10): Option B**
— ONE question, "Has the patient received any pneumococcal vaccine?" with **No previous
doses** / **Yes, record doses**; unanswered shows "Select yes or no above" and Next is
refused. Do not re-litigate. **MeningoVax already implements exactly this** —
`MeningoVax/src/components/StepHistory.jsx` has the question (line 22), both buttons (33) and
the refusal text (57), wording and all. **Copy it; do not design it.** Sonnet 5, medium.

**6. `PPSV23` tick wording.** The details-unknown tick says "the date and product are
unknown" on a PPSV23 row, where the product is known and shown in a disabled box beside it.
`productIsFixed` in `DoseEditor.jsx` is already the right condition. **Several tests find
this checkbox by that exact text** — split the queries per stream, do not loosen them.
**Checked: MeningoVax does NOT have this bug** — its tick reads "A dose was given, but the
date and brand are unknown", which is correct there because neither of its streams has a
fixed brand. This is PneumoVax-only and needs a per-stream split, not a copy.
Also **PneumoVax-only**: `PPSV23_HISTORY_PRODUCTS` in `brands.js` is exported and imported
nowhere (still true after #49) — use it or delete it. MeningoVax's two equivalents
(`MENACWY_HISTORY_BRANDS`, `MENB_HISTORY_BRANDS`) are both used 4× each.

**7. `S12` — verify and strike off, do not start.** Previously checked: the Color key legend
is gone and status labels read plainly. **MeningoVax has no Color key legend either**, so
there is no parity question. Confirm, then close. ~10 minutes.

**8. `S7` — needs re-scoping**, largely overtaken by `src/test-grid.js` and the two corpora.

### Open items logged earlier, still open

**N1. PCV21's counting floor: 18y or 19y? — OWNER DECISION, deliberately deferred.**
The app counts a PCV21 dose from **18y** (the FDA licence, `PCV21_MIN_AGE_M`). **CDSI v4.64**
(`supporting-data-4.64-508.zip` in `~/Downloads`; PCV21 is **CVX 327**) lists
`preferableVaccine beginAge` **"19 years"** and `allowableVaccine beginAge` **"19 years − 4
days"**, and ACIP's recommendation begins at 19 — so CDC's logic would refuse a dose this app
counts. **She asked for worked examples of an 18- and a 19-year-old from real engine runs,
plus the corpus movement count, before ruling.** Open question written into
`CLINICAL_SPEC.md` §I. Part of the question is whether an `allowableVaccine beginAge` is a
CDSI "absolute" field or a "preferable" one. Blocks nothing.

**N2. `rule-docs-match-code.test.js`'s stale-identifier guard has two holes.**
(a) Its regex only matches names in **backticks**; `architecture.md` wrote one bare.
(b) `srcText` includes **comments**, so a deleted function mentioned in its own tombstone
still counts as "exists in `src/`". Suggested fix: strip comments with `codeOnly()` before
building `srcText`, and widen the doc regex. **This session is fresh evidence for N2** — the
`recommend.js` tombstone comment deleted in #49 is exactly hole (b), and the new S6-6
word-based guard is a complement to the identifier guard, not a replacement for it. Its own
PR, with a mutation count.

### New this session

**N3. Three pairs of constants hold the same number and are deliberately NOT merged.**
`MO12` / `ADULT_PPSV23_INTERVAL_MONTHS` (both 12), `MO60` / `PPSV23_REVACC_MIN_MONTHS` (both
60), and `WK8` / `PCV_PPSV23_MIN_INTERVAL_DAYS` (both 56). Each pair serves **different CDC
rows** that share a number today; merging them is the mistake `CLAUDE.md` forbids for the
three schedule constants. #49 gave each its own derived phrase rather than collapsing them.
**Not a bug** — logged so the next reader does not "tidy" it. If it is ever revisited, the
question is whether the engine's `WK8` and the validator's `PCV_PPSV23_MIN_INTERVAL_DAYS`
should be one home, since they are the same CDC sentence read by two files.

**N4. MeningoVax's `weeksLabel` cannot say "1 week"** — background task
`task_c962dda7` is logged with the full write-up. `src/logic/intervals.js` (~line 275) returns
`` `${days / 7} weeks` `` with no singular case, while its siblings `monthsLabel` and
`yearsLabel` both handle it. **LATENT, NOT LIVE — verified: no constant passed to it is
currently 7 days**, so nothing prints "1 weeks" today. Plus five intervals still hand-typed in
its `recommend.js` (lines 1479, 1480, 1579, 1580, 1655); 1579/1655 look like
`MENB_HEALTHY_D2_MONTHS` written out in words. A MeningoVax session, its own PR.

### Carried forward, not acted on
- **A dose card states one dose's age in two units at once.** DOB 2026-09-01 + PCV13 on
  2026-09-20: the chip says "age 2 weeks", the reason beside it "~0 months". Cause:
  `format.js`'s `fmtAgeMonths` uses weeks below ~2 months, `validate.js`'s `fmtAgeM` uses
  months below 24. **`fmtAgeM`'s flooring is deliberate (P3-4) and must not be reverted** —
  extend it to speak weeks.
- **MeningoVax may still use the averaged month where it should not** — `DAYS.months` ×17,
  never audited. A MeningoVax session should.
- MeningoVax still has the orphaned dose labels in `DoseEditor.jsx`, unacted.

## Parity: what MeningoVax already has

Checked this session, because the sibling is usually the answer. **On this item MeningoVax
was ahead and PneumoVax was the one behind:**

| | MeningoVax | PneumoVax before #49 | After #49 |
|---|---|---|---|
| Interval→words helpers | ✅ `weeksLabel` / `monthsLabel` / `yearsLabel`, in `src/logic/intervals.js` | ❌ none | ✅ `intervalPhrase` et al., **same file** |
| Guard that the card SENTENCE states the module's number | ✅ `regression-p2-1-intervals-in-one-place.test.js` | ❌ none | ✅ `regression-s6-5-…` |
| Source guard against hand-typing a literal | ✅ (same file) | ❌ none | ✅ |
| Docs-vs-code tripwire | ✅ `rule-docs-match-code.test.js` | ✅ | ✅ + the new word-based guard |
| Singular case on the week formatter | ❌ **N4** | — | ✅ |
| Adjectival + article forms | ❌ — but **verified it needs neither**: it has no adjectival interval clause in any clinician-visible string | ❌ | ✅ |

So PneumoVax has caught up, and in two places gone slightly further (one formatter that picks
its own unit rather than three per-unit functions; the adjectival and article forms). The one
thing owed back to MeningoVax is N4, which is latent.

## Why this is a good stopping point

Both repos are on `main`, clean and green, with no code half-built and nothing of this
session's in progress. #49 is merged, the deploy succeeded, and the change was confirmed on
the live site rather than assumed. The handoff chain is repaired — it was two PRs stale.

**But do not read "green" as "correct".** Queue item **0** is a live clinical defect: the app
recommends a 1-year interval where ACIP gives 8 weeks for immunocompromised adults. It is
planned in full and deliberately not started, at the owner's instruction. **Start there.**

## Resuming

1. `cd ~/Downloads/PneumoVax && git checkout main && git pull`. Branch fresh from there.
2. Confirm the suite: **918 passing / 83 files, 0 failing.** Stop and diagnose any mismatch.
3. **Start with queue item 0** and read
   `plan-2026-10-15-adult-interval-risk-class-audit.md` before touching anything. Its §8 has
   three owner sub-questions — **ask, do not default**, and bring worked engine output, not a
   rule quote. Items 5–8 can start cold if she wants something smaller first. N1 is still
   waiting and still blocks nothing.
4. Per item: reproduce → failing test first (**confirm it fails, and for the right reason**)
   → fix → full suite green → **live-verify in the running app** → one commit per item ID.
5. **A new guard is not done until you have broken the code on purpose and quoted the count.**
   Put the counts in the PR and in `docs/agent/testing.md`'s row for that file.
6. **For any change to clinician-visible WORDS, diff the rendered prose** over both corpora
   before and after. The verdict corpora do not record prose and will stay green through a
   wording regression — this session's 843-patient grammar break is the proof.
7. **Before changing any clinical rule, fetch the source live and quote it** — the
   `verify-clinical-source` skill. A handoff or a code comment is not a source.
8. **Check MeningoVax before designing an answer.** On item 5 it is a copy-paste reference; on
   item 6 it is explicitly NOT a model (its wording is right for its own case, wrong for ours).
9. **Never `git checkout <file>` to undo a mutation on uncommitted work** — copy to the
   scratchpad and restore from there. Used eight times this session.
10. **A UI regression test needs `// @vitest-environment happy-dom` as its first line**, and
    `fireEvent` rather than `.click()`. **`Results` is a CONTROLLED component.** When
    rendering the same component at several inputs in ONE test, call `cleanup()` between
    renders.
11. **A source guard must strip comments first** (reuse `codeOnly()`), **scope it to the real
    hazard**, and **carry an anti-vacuity control**. #49's guard needed three passes to stop
    flagging AGES as intervals ("fewer than 3 PCV doses by 24 months") — an age takes a
    preposition, a gap takes a comparator or an after/later/apart marker.
12. **Dev server:** `preview_start` with `.claude/launch.json`. **It reported port 60236 this
    session and the real port was 5177** — always read the real port from `preview_logs`.
13. **Do not re-litigate:** the decisions at the top of this file; plus everything earlier
    handoffs list (PneumoVax-matches-MeningoVax, warn-do-not-trap, K4 focus-on-phones, P0's
    date order, P1-3, S14-4C, PCV7-never-counts, P6-3c, S14-4B, the S8 rulebook decision, the
    sweep hard-gate, ANCHOR-1, the 2026-10-11 adult-floor determination, `A-P1-1`, the three
    `P0-2` decisions, `CLINICAL_SPEC.md` §C, the seven S14-RC decisions, W1's scope, the
    two-corpora split, duplicate = same product only, P4-4's Option B, PCV21-OFFLABEL's
    record-flag-don't-count).
