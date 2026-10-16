# PneumoVax — Handoff after S15, the adult interval (2026-10-16)

> **Supersedes `handoff-2026-10-15-s6-interval-prose-merged.md`.** Its queue item **0** is
> now **done** as PR #52 — but **not in the form that handoff and the plan described**. Two
> of the plan's six findings turned out to be built on a superseded source and were
> withdrawn, not implemented. Read "What the plan got wrong" below before touching anything
> adult. Items 5–8 and N1–N4 are carried forward with their numbering preserved.

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`s15-adult-interval-19-49`**, off `main` @ `c7920c1`, pushed, one commit `6a09528`.
**PR [#52](https://github.com/jojohuhu-git/PneumoVax/pull/52) is OPEN and awaiting the `test` check.**
Baseline was 918 passing / 83 files; now **1001 passing / 84 files**, all green, tree clean.
`npm run build` exits 0.
**`main` is protected: branch → PR → squash merge. Never push to `main`.**

Sibling **MeningoVax** (`~/Downloads/MeningoVax-main`): `main`, clean, `f0ec86d`. **Not
touched.** No parity work is owed for S15 — MeningoVax already keys its MenB intervals on
risk in both the recommender and the validator; this was a PneumoVax-only asymmetry.

This app's core promise is honesty: a silent wrong answer is worse than a crash. The owner
is a clinician, not a coder — explain every what and why in plain English, in chat and UI copy.

## Owner decisions this session

1. **The adult PCV15→PPSV23 recommendation is keyed on age band AND risk class**
   (2026-10-16): **≥8 weeks** at 19–49 for an immunocompromising condition / cochlear
   implant / CSF leak; **≥1 year** for every other adult; at 50+ the 8 weeks stays an
   *option*. She was shown both readings — follow ACIP's wording, or flatten to 8 weeks at
   every adult age — with the patient count for each, and chose the wording.
   **Do not extend the 8 weeks to 50+, and do not re-flatten it.**
2. **`rr7203a1` (2023) is out of date and does not govern an adult interval.** She supplied
   **mm7401a1** (ACIP, Jan 2025) and the **CDC Adult Timing Job Aid** (March 2025) instead.
3. The **validity floors** (her determination 2026-10-11) are unchanged, and
   **re-anchoring after an invalid dose** is unchanged — both were measured as already
   correct and she confirmed them.
4. She **pushed back on a false conflict** I raised between the job aid and the CDC
   schedule notes: they name the same three conditions and the same 8 weeks. She was right.

## What the plan got wrong — do not re-implement these

`plan-2026-10-15-adult-interval-risk-class-audit.md` is now **partly withdrawn**. Its
findings **5.1** and **5.2** came from rr7203a1 and the current sources contradict them;
**the app was already correct on both**, measured, and changing either would introduce a bug:

- **5.1 "PCV13→PPSV23 is 8-week keyed too"** — no. PCV13 only → PCV20 or PCV21 at **≥1
  year**, and the job aid prints **"NO OPTION B"** on all four pages. There is no
  PPSV23-after-PCV13 route at any adult age. **5.3 (offer Schedule option B) is therefore
  moot and the owner declined it.**
- **5.2 "cochlear implant / CSF leak are not IC-equivalent for the second PPSV23"** — no.
  Current guidance groups all three and gives **PCV20/PCV21 at ≥5 years**, not a second
  PPSV23. The app already does this, including the 19–49 split where chronic-only gets
  "review at 50".

5.4 (the PPSV23-only control), 5.5 (review at 50, not 65) and 5.6 (the 50 boundary) stand
and are asserted as controls in the new test.

## What's done — queue item 0, PR #52, commit `6a09528`

- `riskFactors.js` gains `adultPpsvRecommendedInterval()` and
  `adultPpsvShorterMinimumOffered()` — **the only home** for the interval decision, with the
  age boundary imported from `ROUTINE_ADULT_MIN_M` rather than a second copy of 600.
- `recommend.js` reads them; the words, the number and the date all follow (S6's machinery).
- **Three problems the suite was silent about**, found by driving the running app and by
  mutating the code: the **citation contradicted the card** (card said 8 weeks, quote said
  "at least 1 year"); the **recorded-dose note contradicted it too** (a 30-year-old with HIV
  at 10 weeks was told they were short of a year they had never been recommended); and the
  **50+ no-history card never named the 8-week option**, so it appeared only after the PCV15
  was recorded. The last of these was caught by **nothing** — deleting it left 987 green.
- `doseIntervalRules.js` gains a declared `shorterIsTheAdvice` selector and a new
  `ADULT-PPSV23-AFTER-PCV15-MEETS-SHORTER-ADVICE` row (a **row**, not an age test inside an
  existing row, per `CLAUDE.md`). The 8-week floor's message **no longer states what is
  recommended at all** — that number lives on the card, and duplicating it is what let this
  rule contradict itself three times.
- Docs updated in the same commit: `CLAUDE.md`, `CLINICAL_SPEC.md` §G/§H/§J/§K (new rule row
  cell by cell), `docs/agent/clinical-rules.md`, `docs/agent/testing.md`.
- `rule-docs-match-code.test.js` gains a **mirror-image guard** against the now-stale
  flattened wording. Building it found **three more stale copies** in the agent docs and
  **two** in `doseIntervalRules.js`. Its first version was too loose and caught nothing.

**Numbers, all measured:** verdict corpora **30 of 16,250** real patients moved, **0 of
18,460** impossible. Rendered prose **300 of 34,710** lines changed (140 real, 160
impossible), every line classified, none unexplained. Mutations: flatten back **14/987** ·
drop the age test **16** · wrong unit **18** · boundary off by one **2** · option offered at
19–49 **3** · citation reverted **2** · rr7203a1 relinked **1** · 50+ option sentence deleted
**0/987, now 1/989**.

⚠️ **The lesson worth carrying.** My first prose dump read `d.verdict`/`d.reason`, fields
that **do not exist** on `perDose` (they are `status`/`reasons`/`detail`), so it was blind to
the validator text this change touched and under-reported 250 instead of 300. **Print one
record and check the field names before trusting a dump.**

## What's NOT done — the remaining queue

**5. `P4-4` — the history step never asks the yes/no question.** Owner decision already
recorded (2026-10-10): Option B, ONE question. **MeningoVax already implements exactly this**
in `StepHistory.jsx` — copy it, do not design it. Sonnet 5, medium.

**6. `PPSV23` tick wording** — says "the date and product are unknown" where the product is
shown. `productIsFixed` in `DoseEditor.jsx` is the right condition; several tests find the
checkbox by that exact text, so split the queries per stream. **PneumoVax-only.** Also
`PPSV23_HISTORY_PRODUCTS` in `brands.js` is exported and imported nowhere — use or delete.

**7. `S12` — verify and strike off**, do not start. ~10 minutes.

**8. `S7` — needs re-scoping**, largely overtaken by `src/test-grid.js` and the two corpora.

**N1. PCV21's counting floor: 18y or 19y? — OWNER DECISION, still open.** She wants worked
examples of an 18- and a 19-year-old from real engine runs plus the corpus movement count
before ruling. Blocks nothing.

**N2. The stale-identifier guard's two holes** (backticks-only regex; `srcText` includes
comments). Still open, and S15 is more evidence for it. Its own PR, with a mutation count.

**N3.** Three pairs of constants deliberately NOT merged — logged so nobody "tidies" them.

**N4.** MeningoVax's `weeksLabel` cannot say "1 week" (latent). A MeningoVax session.

**NEW — N5. Should the adult risk conditions still cite `rr7203a1`?** S15 removed it from
the adult recommendation cards, but four `RISK_FACTORS` entries (`asplenia`,
`immunosuppression` and two others) still list it as the source for the adult risk-factor
**list** — a different claim from the interval, and mm7401a1 says the 19–49 risk
recommendations are unchanged. **Deliberately left alone: it exceeds what she ruled on.**
The S15 test asserts only that every adult card links mm7401a1, with the reason written in.

### Carried forward, not acted on
- A dose card states one dose's age in two units at once (`fmtAgeMonths` vs `fmtAgeM`).
  `fmtAgeM`'s flooring is deliberate (P3-4) — extend it to speak weeks, do not revert.
- MeningoVax may still use the averaged month where it should not (`DAYS.months` ×17).
- MeningoVax still has the orphaned dose labels in `DoseEditor.jsx`.

## Why this is a good stopping point

Queue item 0 — the live clinical defect — is fixed, documented, guarded, and verified in the
running app. One commit, one PR, nothing half-built. The remaining queue is all independent
and none of it is clinical.

## Resuming

1. `cd ~/Downloads/PneumoVax`. **First check whether PR #52 merged** (`gh pr view 52`). If
   it did: `git checkout main && git pull`. If not, find out why before starting anything.
2. Confirm the suite: **1001 passing / 84 files, 0 failing.** Diagnose any mismatch.
3. Items 5–8 can start cold. **N1 and N5 are owner decisions — ask, do not default**, and
   bring worked engine output, not a rule quote.
4. Per item: reproduce → failing test first (**confirm it fails for the right reason**) →
   fix → full suite green → **live-verify in the running app** → one commit per item ID.
5. **A new guard is not done until you have broken the code on purpose and quoted the
   count.** Counts go in the PR and in `docs/agent/testing.md`.
6. **For any clinician-visible wording change, diff the rendered prose** over both corpora.
   The verdict corpora do not record prose. **Check your dump's field names against a real
   record first** — mine were wrong this session.
7. **Before changing any clinical rule, fetch the source live and quote it.** This session
   is the case for it: a merged plan, written one day earlier, rested on a 2023 document two
   newer CDC sources had overtaken, and would have shipped two wrong changes.
8. **The CDC job aid is a PDF** — `curl` gets 403 and WebFetch will not transcribe it.
   What worked: WebFetch saves the PDF to disk anyway, then `pypdf` for text, then
   `qlmanage -t -s 2400 -o . page.pdf` per split page to read the tables as images. Text
   extraction scrambles the columns; **read the table visually before trusting it.**
9. **Check MeningoVax before designing an answer** — on item 5 it is a copy-paste reference;
   on item 6 it is explicitly NOT a model.
10. **Never `git checkout <file>` to undo a mutation** — copy to the scratchpad and restore.
11. **Dev server:** `preview_start` with `.claude/launch.json`. **It reported port 59708 this
    session and the real port was 5178** — always read the real port from `preview_logs`.
12. **Do not re-litigate:** the four decisions at the top of this file, the two withdrawn
    plan findings, plus everything earlier handoffs list (PneumoVax-matches-MeningoVax,
    warn-do-not-trap, K4 focus-on-phones, P0's date order, P1-3, S14-4C, PCV7-never-counts,
    P6-3c, S14-4B, the S8 rulebook decision, the sweep hard-gate, ANCHOR-1, the 2026-10-11
    adult-floor determination, the three `P0-2` decisions, `CLINICAL_SPEC.md` §C, the seven
    S14-RC decisions, W1's scope, the two-corpora split, duplicate = same product only,
    P4-4's Option B, PCV21-OFFLABEL's record-flag-don't-count).
