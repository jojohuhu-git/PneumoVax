# PneumoVax — Handoff after Ava: the toddler's age-50 line, and the "Sources" button (2026-11-07)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React page for pneumococcal vaccine advice.
Its promise: never guess, and every clinical line rests on a document that says it. Read `CLAUDE.md` first.

Branch: `fix/2026-11-07-toddler-age-50-matches-baby`, off `main` at `54a2c36` (#134, Owen, merged). Pushed,
with a PR (number in `gh pr list`). `main` is protected: branch, PR, squash merge, and she merges.
`main` was 2,312 passing; now **2,322 passing, 0 failed, 211 files**, measured with vitest's JSON reporter
on `617e412`. This handoff's commit changes documents only.

## What's done

| Item | What changed | Commit |
|---|---|---|
| **Ava**: toddler age-50 line (carried "needs her ruling" item) | Owner: **"Match the baby card"**. The healthy 24–59-month "series complete" card drops "Re-evaluate at age 50" when the series includes PCV20 (Ava: nothing at 19, Complete at 50) or an adult-only box is ticked (dose at 19). She was offered "say 19" for the smoker and declined. Then **"Yes, under Why this"**: where the line stays, it is in `detail`, as on the baby card. `pcvHealthyChild` now takes `adultOnlyTicked`. §B-50BABY | `30d1ac6` |
| Measured | 0 verdicts. Prose diff 27 of 35,280 lines: 18 lose the line + quote, 9 move it behind Why this, 0 other. Whole-app checks equal main on all 7; 62 grid toddlers move D1 → new **D6** (ruled) in `scripts/wholeApp/causes.mjs`; R7 still 208, babies only. Mutations: each clause 3 fail, both 6 | — |
| **"Sources"** button | She said *"there is nothing under why this"* on Ava's card. 5,676 of 17,017 cards open "Why this" to sources alone (WORD-1 design). Owner: **"Call it Sources"**. `RecNote` in `RecCard.jsx` labels the toggle "Sources" when there is no `detail`, and drops the row's duplicate heading. Layout only. §WORD-1 | `617e412` |
| Live check | Ava shows "Sources"; the PCV15 toddler shows "Why this", the age-50 line [3], then Sources | — |

## What's NOT done

**Found this session, never put to her. Ask, don't default:**
- **Healthy 5–18 card, PCV20 series.** A healthy 10-year-old with a PCV20 baby series reads "Re-evaluate at
  age 50", but at 50 the app says Complete. The same mismatch Ava had, on the older card. Not in her ruling.
- **Job Aid button with no number on 4-dose toddlers.** Ava's card lists "CDC PCV Catch-up Job Aid" with
  nothing citing it: the job aid's table stops at 3 doses (`jobAidEndsItHere`), but the card's default
  `refs` still includes it. Present on `main` too, not caused here. The grid cannot build a 4-dose toddler,
  so `uncreditedSources.mjs` reports 0. Check this before telling her it is a gap.
- **Healthy toddler with PCV15 + an unneeded PPSV23** reads Complete at 50 yet keeps the line (baby card
  too). Unusual; noted in §B-50BABY only.

**Carried, needs her ruling:**
- **R7's leftover**: a *baby* with smoking/alcohol ticked, "series complete" names no later age (208 grid).
  Her toddler answer today (no line, over "say 19") may well be her baby answer too. Still ask.
- **CDC deep links** open at the top of the page. Memory `cdc-schedule-pages-ignore-sentence-links`.
- **MeningoVax Ruling D**, in `/Users/joannehuang/Downloads/MeningoVax-main`. Not checked.
- **"eligible" beside an earlier "can be given from" date**, on Remy's card.

**Not started, needs her go-ahead:** the three audits proposed 2026-11-01.

**Parked:** R4, Leah's card with two invalid PPSV23, the unvaccinated-to-6 PCV15 row, the mixed
history, P4, the "next dose from" sentence on the asplenia 5-year-old.

## Why this is a good stopping point

The toddler card's ruling is complete in both halves (when the line shows, and where), with the button
she asked about relabelled. Two commits, one PR, no verdict moved. Everything left needs her.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`, once this PR is merged.
2. Run `npx vitest run`. Expect **2,322 passing**.
3. Ask her the ruling items one at a time, each with a named patient run through the engine (memory
   `explain-in-plain-language-with-patients`). She picks the order. The 5–18 PCV20 card is the closest
   follow-on to today's work.
4. Per item: reproduce, failing test, fix, full suite, break the fix (restore from a copy, not git),
   `scripts/proseDiff.mjs` (plain `node`, a `main` worktree in the scratchpad for "before"),
   `node scripts/wholeApp/run.mjs` against `main`'s numbers, running app, commit by ID.
5. Branch, PR, she merges. Never push to `main`. Don't stack on an open PR; force-push is blocked.
