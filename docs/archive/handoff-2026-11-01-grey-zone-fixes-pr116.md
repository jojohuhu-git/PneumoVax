# PneumoVax — Handoff after the grey-zone audit and its 8 fixes (2026-11-01)

**Repo:** `/Users/joannehuang/Downloads/PneumoVax`, a client-side pneumococcal decision-support app. Live at https://jojohuhu-git.github.io/PneumoVax/, which deploys from `main`.

**Branch:** `fix/2026-11-01-grey-zone-wording`, off `main` at `4d9af86` (PR #115, merged).
- **Pushed.** [PR #116](https://github.com/jojohuhu-git/PneumoVax/pull/116) is open; CI had not reported when this was written.
- `main` is protected: work goes branch → PR → the owner squash-merges. Auto mode cannot merge.

**Tests:** baseline on `main` was **2,024 passing (182 files)**. This branch is **2,066 passing, 0 failing (190 files)**.

**Not changed:** 0 verdicts moved, and both corpora are untouched. Every fix is wording or citation.

This file supersedes `handoff-2026-11-01-rulebook-review-and-meningovax-parity.md`. That file's two open owner decisions are carried forward below.

## What's done

The audit and the fixes are recorded in these places:
- **The audit report:** `docs/archive/comparison-2026-11-01-grey-zone-pneumorecs-vs-pneumovax.md`. It covers 63 grey-zone patients, PneumoVax next to CDC's PneumoRecs.
- **The scripts that re-run it:**
  - `scripts/pneumoRecsGreyCases.mjs` — the 63 patients;
  - `scripts/pneumoRecsGreyCompare.mjs` — both tools side by side;
  - `scripts/pneumoVaxFollowAdvice.mjs` — gives each advised dose on its advised date, re-runs the app, and flags any dose the app later rejects. **0 flags** before and after the fixes.
- **The rulebook:** each fix has its own section in `CLINICAL_SPEC.md`, listed per item below.
- **The fix queue:** `.claude/prompts/fix-2026-11-01-grey-zone-audit.md`. It is **consumed**. It is git-ignored, so it exists on this machine only.

The fixes:

1. **P1-1** (`e8695a9`) — the 2–5-year at-risk catch-up card no longer says "add PPSV23 ≥8 weeks" when a PPSV23 has already counted.
   - Immunocompromised child: the card points to PCV20 or a second PPSV23 ≥5 years after that PPSV23.
   - Not immunocompromised: no further PPSV23.
   - Immunocompromised, no PPSV23 yet: the card adds the 5-year dose.
   - Owner ruling, from ACIP mm7137a3 (read live).
   - Rulebook section: §C-CATCHUP-AFTER-PPSV23. **606** grid patients' wording changed.
2. **P1-2** (`b9eadd0`) — the Option B cards for an immunocompromised 6–18-year-old with no prior PCV now name the 5-year dose. Owner said "yes". Rulebook section: §C-OPTIONB-IC. **222** patients.
3. **P1-3** (`a503950`) — an adult with PPSV23 first and PCV15 later is told so, and the card cites CDC's "Previously received only PPSV23 … no additional PPSV23" row.
   - The `adultPpsvOnly` (50+) quote was extended by that sentence, read live.
   - `atNineteen()` now skips a complete card that cites `adultPpsvOnly1949`. Without that, 185 children would have been given a false "dose at 19" line.
   - Rulebook section: §K-PPSVFIRST. **642** patients, plus 792 cards that show the longer quote.
4. **P2-3** (`9a43bfc`) — immunocompromised before-6 cards no longer say "a PPSV23 completes the recommended series".
   - This applies the **owner rule of 2026-11-01: "Complete should only be used if no additional doses/boosters are needed."**
   - Rulebook section: §C-COMPLETE. 198 cards (99 patients).
5. **P2-2** (`d2dd61e`) — a PCV21 counted at 18 is named PCV21 on the child card, not PCV20. Rulebook section: §I-NAMED. Hand-built patients only.
6. **P2-4** (`f6534fd`) — a PPSV23 given after the PCV20 is no longer described as "earlier". 64 patients.
7. **P2-5** (`47ec223`) — a teen whose only tick is smoking or alcohol use disorder reads "re-evaluate at 19", not "at 50".
   - Given only when the app's own adult card at 19 gives a dose.
   - Cites `cdcAdultRiskFactorList`, which is now the third adult source allowed on a child card. Both `CLAUDE.md` and the pinned test list were updated.
   - Rulebook section: §B-ADULTRISK19. 404 teens.
8. **P2-1** (`c97f4a5`) — a 49-year-old whose 8-week PPSV23 date falls after her 50th birthday is told so in one added sentence. No date moves. Rulebook section: §G-TURNS50. Hand-built patients only.

Checks:
- Every fix was broken on purpose after it went in, and a test caught each break.
- P1-1, P1-3 and P2-5 were checked in the running app, with no console errors.

## What's NOT done

- **PR #116** is waiting for her review and squash-merge.
- **G34 — OWNER QUESTION, answered in chat; ask her to confirm, don't change code.**
  - The patient: a healthy 5-year-old (5y 0m) with one PCV dose at 2 months. She asked whether CDC's catch-up table gives this child one more dose, 4 weeks later.
  - What I read live on 2026-11-01:
    - CDC's notes: *"Healthy children ages 2–4 years with any incomplete PCV series: 1 dose PCV."*
    - CDC catch-up Table 2: the extra dose is *"only necessary for children age 12 through 59 months regardless of risk, or age 60 through 71 months with any risk."*
    - ACIP mm7137a3: *"ACIP recommends use of PCV … for all children aged 2–59 months … risk-based PCV use … for children aged 60–71 months with risk conditions."*
    - The table's "4 weeks" cell is the minimum interval for a child who is still eligible. It does not extend eligibility.
  - So the app's "Not indicated" stands unless she rules otherwise. AAP was not checked.
- **Three proposed follow-on audits** were left as cards in the session, not started. Each brief is in its card.
  1. Children's doses just outside an age line.
  2. Adults' doses just outside an age or interval line.
  3. A sweep of card wording against the Rulebook and the "complete" rule. This is the full application of her new rule; P2-3 applied it to only one family.
- **Carried forward from the superseded handoff (ask, don't default):**
  - **CDC deep links:** her sentence links to CDC schedule pages open at the top of the page. The options and the three quotes that can never match are in memory `cdc-schedule-pages-ignore-sentence-links`.
  - **MeningoVax Ruling D:** MeningoVax measures a repeat dose from the last dose that counted, not from the invalid dose. There is also a MeningoVax parity plan, B → A → C → D → E. Details are in the superseded handoff's "What's NOT done".

## Why this is a good stopping point

Every item in the 2026-11-01 grey-zone queue is done, tested, checked and in one PR. None of them moved a verdict. The open items, G34 and the audits, block nothing in #116.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git fetch && git checkout main && git pull`, if #116 is merged. If it isn't, check its CI and ask her to review.
2. Run `./node_modules/.bin/vitest run --reporter=json --outputFile=<scratch>/r.json`. Expect **2,066 passing** on #116's branch.
3. Ask her the G34 confirmation, and the two carried-forward decisions, if they are still open.
4. For any new item, follow the `fix-queue` loop:
   1. reproduce;
   2. write a failing test;
   3. make the smallest fix;
   4. run the full suite;
   5. break each clause on purpose and confirm a test fails;
   6. run the prose diff (`node scripts/proseDiff.mjs dump/diff`, with plain `node`);
   7. check it in the running app (`preview_start` "PneumoVax dev server", port 5173);
   8. commit, named by the item's ID.
5. **Watch for this coupling:** `atNineteen()` chooses a child's "at 19" line from the adult card's citation key. Any change to an adult card's citations can change children's cards. The C13 tests catch it.
