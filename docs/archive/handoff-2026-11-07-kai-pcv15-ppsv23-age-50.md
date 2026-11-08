# PneumoVax — Handoff after Kai: no "age 50" line when 50 would read Complete (2026-11-07)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React page that gives pneumococcal vaccine advice.
Its promise: never guess, and every clinical line rests on a document that says it. Read `CLAUDE.md` first.

Branch `fix/2026-11-07-kai-pcv15-ppsv23-age-50`, off `main` at `1713823` (#138, Theo). Pushed;
**PR #139**, open, waiting for her to merge. Baseline was 2,340 passing; now **2,352 passing, 0 failed,
214 files** (vitest JSON reporter, `.claude/**` excluded). `main` is protected: branch, PR, squash
merge, and **she merges** (the safety check blocks `gh pr merge`).

## What's done

| Item | What changed | Commit |
|---|---|---|
| **Kai** (#139) | 5, healthy, PCV15 at 2, 4, 6 and 12 months, and an unneeded PPSV23 at 4. His card said "Re-evaluate at age 50", but at 50 it reads "Complete (PCV15 + PPSV23)". Owner: **"Drop it, like Nina"**. The healthy 5–18 card now runs the patient forward to 50 (record-problem doses left out) and keeps the line only if the adult card there asks for something. This replaces Leo's and Nina's PCV20 rules without changing their answers. 237 grid cards lose the line, 0 gain it; 4,692 of 21,840 hand-built children lose it, all Complete at 50; wording diff 237 real / 0 impossible; whole-app identical; no verdict moved; checked live | `bca044b` |
| **Forward runs** (#139) | Owner: **"Yes, fix it here"**. The "at 19" runs had Kai's trap too, already on `main`: a dose typed with a future date counted at 19. Jude (16, smokes) read "age 50" for "age 19"; Ivy (12, cochlear implant, complete) lost "At 19". All four forward runs now use `forwardInput` (record problems left out). 0 real patients; 101 of 1,980 future-dated impossible entries, and 737 of 7,056 hand-built, had a look-ahead line the future dose changed, now 0. Each call site reverted alone fails a test (Ivy was needed for one). **The form refuses dates after today, so no clinician can reach this**; it is engine hygiene. Checked live with the cap lifted in-tab | `0c9d914` |

This also closes two items from the last handoff: the **66 cards with an INVALID PCV20** (they are Kai's
family) and **PCV15 + an unneeded PPSV23** on the 5–18 card. `CLINICAL_SPEC.md` §B-5TO18.

## What's NOT done

**Found this session, never put to her. Ask, don't default:**
- **Today's card reads a future-dated PPSV23 in its own wording.** A 6-year-old with asplenia, no PCV,
  and a PPSV23 dated tomorrow gets "≥8 weeks after the most recent pneumococcal vaccine" and "only if PPSV23
  was not previously given". Not a forward run, so left alone; 192 of 1,980 future-dated grid entries.
  Unreachable through the form (the date box refuses future dates), so low value — ask whether to bother.
- **Healthy toddler/baby with PCV15 + an unneeded PPSV23**: Kai's ruling covered the 5–18 card only. The
  toddler and baby cards still use their own PCV20 rule (`recommend.js` ~line 1851 and ~773). The grid
  builds 0 such toddlers; not measured by hand.
- **Toddler/baby with an EXTRA PCV20**: Nina's ruling was for the 5–18 card. Not measured.

**Carried, needs her ruling:** R7's leftover (a baby with smoking/alcohol ticked, "series complete" names
no later age, 208 grid cards); CDC deep links open at the top of the page; MeningoVax Ruling D
(`/Users/joannehuang/Downloads/MeningoVax-main`, not checked); "eligible" beside an earlier "can be given
from" date on Remy's card.

**Not started, needs her go-ahead:** the three audits proposed 2026-11-01.

**Parked:** R4, Leah's card with two invalid PPSV23, the unvaccinated-to-6 PCV15 row, the mixed history,
P4, the "next dose from" sentence on the asplenia 5-year-old.

## Why this is a good stopping point

Kai's ruling is applied, guarded, and checked live, and every test fails when the fix is reverted or
widened. The one new finding (future dates in the at-19 runs) is older than this change and needs her
say before it moves any wording.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`, once #139 is merged
   (`gh pr view 139 --json state`).
2. Run the suite. Expect **2,352 passing**.
3. Ask her the open items one at a time, each with a named patient run through the engine (memory
   `explain-in-plain-language-with-patients`). She picks the order.
4. Per item: reproduce, failing test, fix, full suite, break the fix (restore from a copy, not git),
   `node scripts/proseDiff.mjs` against a `main` worktree in the scratchpad (**this is what caught the
   future-date trap; the suite did not**), `node scripts/wholeApp/run.mjs --out <file>` against main's,
   a hand-built sweep where the grid is blind, running app, commit by ID.
5. Dev server: other chats may hold all 5 slots for this folder. Those vite servers serve this same
   folder, so `preview_start {url: "http://localhost:5173/PneumoVax/"}` works instead.
6. Branch, PR, she merges. Never push to `main`. Check `gh pr view N --json state` before adding to a PR branch.
