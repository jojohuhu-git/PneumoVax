> **SUPERSEDED 2026-11-07** by `docs/archive/handoff-2026-11-07-four-rulings-sam-cora-baby-g34.md`. G34, P2-4 (R6), P2-5 (R4) and P2-6 (R7) were ruled and built in PR #129. Do not resume from this file.

# PneumoVax — Handoff after P1-3's four family rulings (2026-11-06)

Repo: `/Users/joannehuang/Downloads/PneumoVax`. A client-side React page for pneumococcal vaccine advice.
Its promise: never guess, and every clinical line rests on a document that says it. Read `CLAUDE.md` first.

Branch: `fix/p1-3-unasked-conjugates-by-family`, off `main` at `e8c916d` (#127). Pushed, with a PR. `main` is
protected: branch, PR, squash merge, and she merges. Baseline was 2,242 passing; now **2,273 passing (204
files)**, 0 failed, measured on the code commit. This handoff's commit changes documents only.

## What's done

| Item | What changed |
|---|---|
| P1-3, open half | Theo, Mateo, Lena, Ben ruled, built, guarded. `CLINICAL_SPEC.md` §C-P1-3. `conjugateNobodyAskedFor` in `validate.js` asks `cardsOnTheDayOf` in `recommend.js` |
| P2-3's deferred citations | Closed by the same change |
| Rulebook page | Entry and exception widened, five new worked examples |

Measured over all 77,496 patients against `main`: 546 cards moved, every one Theo's family going to complete;
no other dose or date moved. 14,100 labels and 17,988 dose notes changed. Saved answers moved 338 of 17,016
and 27 of 18,264, all dose notes. Flagged: finished 18,430, healthy 10,088, no PPSV23 yet 4,116, Noor's
3,442 = 36,076. Checked in the running app: Theo, Mateo, Lena, Ben, Priya, and the Rulebook page.

Shown Theo at 19 she accepted it: the adult rows count the extra dose, so he reads complete at 19 and his child
card has no "at 19" line. She then asked whether one of two PPSV23 doses says extra. Answered from the engine:
Mateo's second does, as a child. Theo's does not. At 19 both of Mateo's count.

## What's NOT done

**Needs her ruling. Ask, don't default:**
- **P2-4 R6, Cora, report Decision 3.** Should Option B say a dose may follow at 19?
- **P2-5 R4 and P2-6 R7.** Recommended parked and no change. Not yet put to her.
- **G34, a healthy 5-year-old with one PCV dose.** She was asked to confirm "Not indicated" on 2026-11-01.
  No record of an answer was found.
- **CDC deep links** open at the top of the page. Memory `cdc-schedule-pages-ignore-sentence-links`.
- **MeningoVax Ruling D.** A repeat dose is measured from the last dose that counted. Not checked. The folder
  is `/Users/joannehuang/Downloads/MeningoVax-main`.
- **"eligible" beside an earlier "can be given from" date**, on Remy's card. Left as it was.
- **New, left alone by P1-3 and listed with counts in §C-P1-3:** an unrecorded product in the series with a
  card asking for a dose (1,134), a card asking for PCV20 alone (342), an at-risk child under 6 (none on the
  grid). Her rule on unlikely histories may retire them. Do not raise them unprompted.

**Not started, no ruling needed:**
- Make "advice is accepted" a required check if it is not one. No file named as a gate holds it.
- Check 7 "Stable over time" stays out of `npm test`. Count what remains before promoting it.
- The three proposed audits of 2026-11-01. The whole-app checks may have covered part. Not confirmed.
- Remove the three old folders in `.claude/worktrees/`. They cause false failures if vitest is run bare.

**Parked, older:** Leah's card with two invalid PPSV23 doses, the unvaccinated-to-6 PCV15 row, the mixed
history, P4, the "next dose from" sentence on the asplenia 5-year-old.

## Worth knowing

- The old-versus-new comparison over all 77,496 caught what 53 tests could not: removing the child's-cards line
  moved 6 teenagers. Run the same comparison after any engine change here.
- A clause surviving a mutation is not proof it is unused. Compare the answers before deleting it.
- `npm run sweep:update` was run after the moved rows were sorted by family. The corpora hold no labels, which
  is why Theo's 546 do not appear in them; they are in the typical list.
- `run.mjs`'s unsorted count is 0. R4, R6 and R7 remain as known real items.

## Why this is a good stopping point

P1-3 is one change with its guard, and nothing else depends on it. What is left is owner rulings or optional checks.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`, once the PR is merged.
2. Run `npx vitest run --exclude '**/.claude/**' --exclude '**/node_modules/**'`. Expect **2,273 passing**.
3. Ask her which ruling to take first. Give one patient, the whole scenario, in the question box.
4. Per item: reproduce, failing test, fix, full suite, break the fix, `scripts/proseDiff.mjs`, running app,
   commit by ID. Run the prose tool with plain `node`.
5. Branch, PR, she merges. Never push to `main`.
