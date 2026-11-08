# PneumoVax — Handoff after Zoe and Remy (2026-11-07)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React page that gives pneumococcal vaccine advice.
Its promise: never guess, and every clinical line rests on a document that says it. Read `CLAUDE.md` first.

**Two PRs are open, both waiting for her to merge, independent of each other (different files):**

| PR | Branch (off `main` at `1713823`) | Suite on that branch |
|---|---|---|
| **#139** Kai and Zoe: the healthy child cards drop "age 50" when 50 would read Complete | `fix/2026-11-07-kai-pcv15-ppsv23-age-50` | **2,360 passing, 0 failed, 215 files** |
| **#140** Remy: the card's top line says "Next dose due", not "eligible" | `fix/2026-11-07-remy-next-dose-due` | **2,343 passing, 0 failed, 213 files** |

Counts from the vitest JSON reporter with `.claude/**` excluded. Once both merge, expect **2,363**.
`main` is protected: branch, PR, squash merge, and **she merges** (the safety check blocks `gh pr merge`).

## What's done

| Item | What changed | Where |
|---|---|---|
| Kai, forward runs | See `handoff-2026-11-07-kai-pcv15-ppsv23-age-50.md` | #139 |
| **Zoe** | Owner: **"Drop it, like Kai"**. The 24–59-month complete card uses the 5–18 card's forward run to 50 instead of its PCV20 test. 120 of 2,178 hand-built toddlers lose the line (all PCV15 + PPSV23); babies 0 of 567; grid 0; checked live. §B-50BABY | #139, `85b152e` |
| Extra PCV20, baby/toddler | Closed by measurement: 0 wrong over the same sweep. Pinned in Zoe's test | #139 |
| **Remy** | Owner: **"Next dose due Jan 29, 2027"**. `RecCard.jsx` top line "Not yet due — eligible X" → "Next dose due X". It sat over notes naming an earlier date or "today" on 2,595 of 9,546 hand-built baby cards; grid 0. Wording only; checked live. §L-2 (2026-11-07) | #140, `0aa58b7` |

## What's NOT done

**New this session, needs her:**
- **MeningoVax has the same "eligible" wording** (`MeningoVax-main/src/components/RecCard.jsx:472`,
  "Next dose not yet due - eligible …"). Not changed and not measured: first check whether any
  MeningoVax card names an earlier date beside it, then ask. Memory: her fold answer was "PneumoVax only".

**Found earlier, never put to her. Ask, don't default:**
- **Today's card reads a future-dated PPSV23 in its own wording** (192 of 1,980 future-dated grid
  entries). Unreachable through the form; low value — ask whether to bother.

**Carried, needs her ruling:** R7's leftover (a baby with smoking/alcohol ticked, "series complete"
names no later age, 208 grid cards); CDC deep links open at the top of the page; MeningoVax Ruling D
(not checked).

**Not started, needs her go-ahead:** the three audits proposed 2026-11-01.

**Parked:** R4, Leah's card with two invalid PPSV23, the unvaccinated-to-6 PCV15 row, the mixed
history, P4, the "next dose from" sentence on the asplenia 5-year-old.

## Why this is a good stopping point

Both rulings are applied, guarded by tests that fail on the old behaviour, and checked in the running
app. Each PR stands alone. Nothing is half-done.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull` once #139 and #140 are
   merged (`gh pr view 139 --json state`, same for 140). If only one merged, the other is still fine to
   merge: they touch different files.
2. Run the suite. Expect **2,363 passing** with both merged.
3. Ask her the open items one at a time, each with a named patient run through the engine (memory
   `explain-in-plain-language-with-patients`). She picks the order.
4. Per item: reproduce, failing test, fix, full suite, break the fix (restore from a copy, not git),
   `node scripts/proseDiff.mjs` against a `git worktree` of the base in the scratchpad (symlink
   `node_modules`), `node scripts/wholeApp/run.mjs --out <file>` on both sides (exit 1 on both is the
   known R4/R7 lines — compare, don't read the exit code), **a hand-built sweep where the grid is blind
   (both items this session were invisible to the grid)**, running app, commit by ID.
5. Dev server: other chats may hold all 5 slots. Their vite servers serve this same folder, so
   `preview_start {url: "http://localhost:5173/PneumoVax/"}` works; submit the form with
   `document.querySelector('form').requestSubmit()`. It serves whatever branch is checked out.
6. Branch, PR, she merges. Never push to `main`. Check `gh pr view N --json state` before adding to a PR branch.
