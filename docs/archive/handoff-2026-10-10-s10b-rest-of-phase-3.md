> # ⛔ SUPERSEDED — do not resume from this file.
> **Superseded 2026-10-11 by [`handoff-2026-10-11-s13-phase-6b-done.md`](handoff-2026-10-11-s13-phase-6b-done.md).**
>
> Everything below about **PR #20 being held is now HISTORY**. The owner released the hold on
> 2026-10-11 once `P3-9`'s `RiskAgeNote` landed in it, and **PR #20 is MERGED** (`6e9dbe5`).
> Phase 3 is closed, and S13/Phase 6b is done too (PR #21). Read the newer handoff instead.

# PneumoVax — Handoff after S10b, the rest of Phase 3 (2026-10-10)

Repo: `~/Downloads/PneumoVax`. Live: https://jojohuhu-git.github.io/PneumoVax/
Branch: **`fix/s10b-rest-of-phase-3`**, off `main` @ `1eac734`. **Pushed → PR #20, CI green
(`test: pass`), `mergeStateStatus: CLEAN` — and DELIBERATELY NOT MERGED.**

> **🔴 OWNER DECISION 2026-10-10: HOLD PR #20 until `P3-9`'s `RiskAgeNote` can ship with it.**
> The owner was shown that merging now puts the three fixes live but leaves a child's
> adult-only risk tick ignored with no sentence saying why, and chose to wait for the note
> rather than ship a silent ignore. **Do not merge #20.** The note is blocked on `P6-3`
> (S13's citation machinery), so this hold is expected to last several sessions.
>
> **The owner accepted the stated trade-off:** while #20 is held, the live site keeps giving
> a 15-year-old with "Cigarette smoking" ticked an at-risk catch-up regimen (peds `P0-3`).
> This is recorded so no later session "helpfully" merges to fix that — it is a decision,
> not an oversight.
>
> **⚠ ONE QUESTION THIS RAISES — ASK THE OWNER, DO NOT DEFAULT.** The hold means `main` does
> **not** contain S10b. So when the next code session starts (S3 or S4), does it branch off
> `main` (and forgo S10b's `pedsRiskIds`, `ageEntry.js` and exact-weeks work) or off
> `fix/s10b-rest-of-phase-3` (stacking a second PR on a held one)? **S3 in particular is
> affected**: it must reuse `intervals.js`'s `GRACE_DAYS`, which IS on `main` (it shipped in
> PR #19), so S3 can branch off `main` cleanly — but any session touching `riskFactors.js`,
> `format.js`, `StepAge`, `Results` or `RecCard` will conflict with the held branch.

Working tree **clean** at `4ef3650`.

Baseline was 244 passing (21 files); now **298 passing (26 files), all green**. Production
build clean. The three PneumoRecs comparison harnesses (`adult`, `peds`, `hsct`) were run on
`main` and on this branch and are **byte-identical** — no clinical verdict moved in any of
the 44 comparison cases.

This app's core promise is honesty: a silent wrong answer is worse than a crash. Two of
S10b's three items were silent wrong answers.

**S10 part 1 (PR #19) is MERGED** — `1eac734` on `main`. The previous handoff's one open
decision ("merge PR #19") is therefore closed.

## What's done — by ID, one commit each

1. **`P3-9b` / peds audit `P0-3`** `1286430` — ⚠ clinical. A 15-year-old whose only ticked
   risk was "Cigarette smoking" got the same at-risk catch-up regimen as one with diabetes,
   instead of "Not indicated (healthy 5–18y)". Reachable by accident: the age gate only
   *hides* the checkbox below 19y and never clears a tick, so entering 25y → ticking smoking
   → Back → correcting the age to 15 carried it through. Fixed with one named filter,
   `pedsRiskIds()` in `data/riskFactors.js`, called inside `pedsRiskRowClass()` and at the
   engine dispatch.
   **`hasAnyRisk` / `hasNonIC` were deliberately NOT narrowed** — they are reached only from
   `pcvAdult`, where these risks are genuine, and `hasAnyRisk` gates whether a 19–49 adult
   gets a recommendation at all. Narrowing them would have withdrawn the recommendation from
   every adult smoker. A test pins them staying broad.
   **Sources fetched live** (child notes, adult notes, p2016 Table 3) and quoted in the test
   header, `CLINICAL_SPEC.md` §C and the commit. Measured absence: 0 matches for
   `/smok|alcohol|cigarette/i` across the fully-expanded child-notes page (60,435 chars)
   while "cochlear" and "diabetes" both match. **This also closed the gap S1's own audit
   flagged — S1 never fetched `cdcAdultPneumo`; S10b did.**
   **AAP tiebreak recorded honestly:** no AAP page enumerating paediatric pneumococcal risk
   conditions was reachable, so AAP is **silent** → CDC stands.
2. **`P3-8`** `8ceb79c` — a birth year typed `0026` instead of `2026` was accepted silently
   ("2000 years · Older adult (≥50y)") and produced a complete routine **adult**
   recommendation for an infant. The Years box took 999 despite `max="120"`. New
   `logic/ageEntry.js` (`ageEntryProblem`, `MAX_PLAUSIBLE_AGE_YEARS = 120`), ported from
   MeningoVax's imp `P0-1` (`b8a9335`). **Both entry modes ask that one module.** A
   plausibility bound, **not** a clinical rule — labelled as such in `CLINICAL_SPEC.md` §K so
   nobody hunts for a citation that never existed.
3. **`P3-5`** `5483427` — weeks were derived from months via `× 4.348`, double-averaging.
   Measured: a dose at exactly 42 days (= `PCV_MIN_AGE_DAYS`, the "6 weeks" the rule is
   written in) printed **"5 weeks" for 181 of 400 birth dates**. Worst form, verified live:
   `D1 · Oct 10, 2026 · age 5 weeks · PCV13` beside **"On time"** — a card contradicting
   itself. `fmtAgeMonths` now takes `exactDays`. A **second** averaged constant beside it is
   fixed too: the "Birth" cut was `am < 0.25` months (≈7.6 days), so a real one-week-old
   printed "Birth". All **three** surfaces pass it (`StepAge`, `Results`, `RecCard`).
4. **Docs** `07762f3` — `CLINICAL_SPEC.md` §C (the P3-9b rule, with verbatim live quotes) and
   §K (the two non-clinical rules). Queue ledger updated (git-ignored, so not in the commit).

**Every item was reproduced first, given a failing test that was confirmed to fail, then
live-verified on the running app with a clean console.** The P3-5 UI test was additionally
checked to fail with the three components reverted (4 of 5 cases), so it cannot pass
vacuously.

## One finding worth the owner's attention

**An existing test asserted the P3-9b bug as correct and froze it on purpose.** `Scenario 4`
in `regression-boundary-and-fixes.test.js` said "documented here … so a future change doesn't
unknowingly alter the routing", justified by the claim that smoking *"appears in p2016
Table 3 as a peds nonIC condition"*. **That claim is false** — p2016 Table 3 has 0 matches for
smoking across the whole PDF. The block is corrected, its false citation replaced with the
measured finding, and its real subject (18y6m is on the paediatric rulebook) kept.

## Cross-repo parity (vaccine-parity skill)

**vaxapp / PediVax is UNAFFECTED, not fixed** — it has no `smoking` and no `alcoholism` risk
factor anywhere in its source and no `adultOnly` concept at all (zero hits); its risk list is
paediatric throughout. The only matches in that repo are inside vendored CDSI reference JSON,
not its own risk model. MeningoVax is out of scope (meningococcal). No sibling PR is needed.

## What's NOT done — the remaining queue

- **`P3-9`'s UI half** — `RiskAgeNote`: show adult-only risks at every age with a quiet doubt
  note. **Still blocked on `P6-3`** (S13's citation machinery). **It now also gates PR #20**,
  by owner decision 2026-10-10 (see the banner): a child's adult-only tick is ignored by the
  engine and still listed in the Results summary, but no sentence explains why it did not
  act, and the owner chose to hold the whole PR rather than ship that silent ignore. So
  `P3-9` is on the critical path twice over — **raising the priority of `P6-3`/S13, which is
  what unblocks both.** Worth asking the owner whether S13 should be pulled forward ahead of
  S3–S9 for that reason.
- **`S10-N1` (P2)** — PCV21's 18-year gate is checked against the patient's CURRENT age, not
  the age at the dose (`validate.js`). A 20-year-old with PCV21 recorded at 17 has that dose
  counted. Still deliberately left for a sourced item.
- **`S10-N2` (P3)** — the generic "repeat this dose only" line is appended to every invalid
  dose, including one dated before birth. Fold into S12.
- **S3–S9, S11–S13** unchanged. See the ledger in
  `.claude/prompts/fix-2026-10-10-meningovax-interface-parity.md` (git-ignored, updated).
  **S3's gate is satisfied** and S3 must reuse `intervals.js`'s `GRACE_DAYS` /
  `intervalMeetsMinimum` rather than hand-typing the grace a third time. **S4 is now P1-2,
  P1-3, P1-4 only.**

## Why this is a good stopping point

Phase 3 is closed except the one item that is genuinely blocked elsewhere. The three items
shipped are independent of each other and of everything still queued. The suite is green, the
tree is clean, the build is clean, and the comparison harnesses prove nothing else moved.

## Resuming

1. `cd ~/Downloads/PneumoVax`. **PR #20 is held on purpose (see the banner at the top) —
   it is NOT a blocker to be cleared, and it must NOT be merged.** Do not treat an unmerged
   #20 as unfinished business.
2. **Ask the owner which base the next session branches from** (`main`, or the held
   `fix/s10b-rest-of-phase-3`) — see the ⚠ question in the banner. Then:
   - off `main`: `git checkout main && git pull`; the suite there is **244 passing /
     21 files**.
   - off the held branch: `git checkout fix/s10b-rest-of-phase-3`; the suite is
     **298 passing / 26 files**.
   Confirm the matching count before any new work.
3. **Say the session number and its recommended model + effort in one line, and WAIT**
   (queue rule 1). Likely next is **S3 — Opus 5 at high effort** (its gate is satisfied) or
   **S4 — Sonnet 5 at medium effort**. **Owner picks the order — ask, don't default.**
4. **No clinical decisions are outstanding.** Do not re-litigate the adult PPSV23 interval
   (`CLAUDE.md` + `CLINICAL_SPEC.md` §K) or the paediatric risk lists (§C) — both are settled
   with live quotes.
5. Per-item workflow: reproduce → failing test first (confirm it fails) → fix → full suite
   green → live-verify in the running app → one commit per finding ID.
6. Push/merge policy: **`main` is protected — branch, PR, squash merge. Never push to
   `main`.** **Exception in force: PR #20 is held by owner decision — do not merge it.**
7. **Dev-server gotcha found this session:** `preview_start` reported port 62597 while Vite
   had actually bound to **5174** (5173 was taken by another chat), and navigating to the
   reported port failed. Read the real port from `preview_logs` before driving the app. The
   Browser pane also reported `Viewport: 0x0` while hidden, which makes `read_page` return an
   empty page — `get_page_text` and `javascript_tool` still work, so use those.
