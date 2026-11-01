# PneumoVax — Handoff after the rules page went live and §K-THROWNOUTTIMING (2026-11-01)

Repo: `/Users/joannehuang/Downloads/PneumoVax`, a client-side pneumococcal decision-support app.
Branch: `design/2026-11-01-rules-page-redesign`, off `main` (`2738347`). **Pushed.**
[PR #114](https://github.com/jojohuhu-git/PneumoVax/pull/114) is open and mergeable, with CI pending
when this was written. `main` is protected: branch → PR → the owner squash-merges, and auto mode
cannot merge.
Baseline on `main` was 1,997 passing. This branch: **2,019 passing, 0 failing (181 files)**.
The working tree was clean at `4aa5684` before this handoff's commit.
This supersedes `handoff-2026-11-01-rules-page-check-and-five-year-ppsv23.md`, carried here as `f0d6124`.

## What's done

1. **§K-THROWNOUTTIMING** (`00f3e66`), from the owner's rulings of 2026-11-01. A PPSV23 that did not
   count still sets the **advised** date of the next conjugate.
   - Children on the at-risk path (2–18) wait 8 weeks after it. The card states the earlier date
     the PCV can be given, because she chose "Still counts (advise only)" for Eli.
   - Adults wait 1 year after it.
   - An adult with PCV15 then an invalid PPSV23 gets PCV20 or PCV21 a year later, with no PPSV23.
   - Code: `holdConjugateAfterThrownOut()` and `ppsv.thrownOutDate` in `recommend.js`, plus the adult
     PCV15 branch of `pcvAdult`.
   - Moved: 10/17,016 verdicts, 0/18,264 record-problem rows, and 1,680 hand-built children
     (advised date only; 0 dose verdicts).
   - Guard: `regression-2026-11-01-conjugate-waits-after-thrown-out-ppsv23.test.js`.
     Full write-up in `CLINICAL_SPEC.md` §K-THROWNOUTTIMING.
   - **This closes the advise-or-require question** the superseded handoff left open.
2. **The rules page, built from the design canvas** (`4aa5684`). The canvas is
   https://claude.ai/artifact/FTAgbULXSHK8GNKQ5WUDe6.
   - `Rulebook.jsx` and `src/data/rulebook.js` were rewritten as "How PneumoVax decides", in five
     sections.
   - Every number is interpolated from engine constants. `recommend.js` now exports
     `ENGINE_AGE_LINES`, its own `M`, read-only.
   - Every claim carries a worked patient: 46 in `WORKED_PATIENTS`, run by the C14 guard.
   - Each row's Source button shows the quotes the app's own card cites for its patient
     (`sourcesFor`).
   - The page opens in its own tab (`?rules`, in `App.jsx`).
   - The citation superscript on result cards is now an instant pop-up (`CiteMark` in
     `citations.jsx`). Its text moved from `title` to `data-title`, and five tests were updated to
     read it.
   - `mmwr7336a3` (the PCV21 report) changed from `rulebook: 'any'` to `'adult'`, per her canvas note.
   - Nine mutations, nine caught. Verified at desktop and phone width.

## What's NOT done

- **PR #114 awaits her review and merge.** The page has not been reviewed by her in the app, only
  as the canvas.
- **The guard checks each row's patient, not the row's exact words.** A sentence reworded into a
  falsehood whose patient still passes would get through. It is said in the PR body. Do not claim
  more.
- **No new live CDC read was done for the page's sentences.** They are tied to the engine's
  existing citations, which were read live between 2026-10-10 and 2026-10-31. The canvas title
  asked for a CDC re-check before shipping; the Source panels are the substitute offered. Ask her
  whether that is enough.
- **Scope left out of §K-THROWNOUTTIMING on purpose:** the infant path (under 2), the healthy-child
  path, and a baby PPSV23 given before a later PCV15. Extend only with a new ruling.
- **MeningoVax parity (design-review skill):** the citation pop-up is a new card behaviour that
  MeningoVax does not have. Record it as a possible follow-up; do not copy it without her say.
- **Older parked items**, unchanged:
  - the pointless "next dose … from" sentence on the asplenia 5-year-old's same-day PPSV23;
  - Leah's at/after-6 card with two invalid PPSV23s;
  - P4;
  - the unvaccinated-to-6 PCV15 row;
  - the mixed history.

## Why this is a good stopping point

Both pieces are built, measured, guarded, verified in the running app, and together in one green
PR. Nothing else depends on them, and no owner question is open from this session.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`, if #114 is merged.
   Otherwise ask her to review it.
2. Run `./node_modules/.bin/vitest run --reporter=json --outputFile=<scratch>/r.json`. Expect
   **2,019 passing**.
3. If she edits page wording: change `src/data/rulebook.js` only. Interpolate every number. Give any
   new claim a worked patient in `P`, then run the C14 guard.
4. Clinical changes follow the per-item loop:
   1. reproduce;
   2. write a failing test;
   3. fix, and update `CLINICAL_SPEC.md` in the same commit;
   4. run the full suite;
   5. break each clause;
   6. measure against a `main` worktree with `scripts/proseDiff.mjs`;
   7. run `npm run sweep:update` only once every moved row is explained;
   8. drive the app.
5. **Dev server:** `preview_start {name}` refuses (5 servers from other chats). Use
   `preview_start {url: "http://localhost:5178/PneumoVax/"}`, which serves this folder.
6. Branch → PR → her squash-merge. Never push to `main`.
