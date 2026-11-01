# PneumoVax — Handoff after the CDC re-check, the owner's Rulebook review, and the MeningoVax comparison (2026-11-01)

Repo: `/Users/joannehuang/Downloads/PneumoVax`, a client-side pneumococcal decision-support app.
Branch: `fix/2026-11-01-rules-page-cdc-recheck`, off `main` (`6af3c1a`, which is PR #114 merged).
**Pushed.** [PR #115](https://github.com/jojohuhu-git/PneumoVax/pull/115) is open, with CI pending
when this was written. `main` is protected: branch → PR → the owner squash-merges. Auto mode
cannot merge.
Baseline on `main` was 2,019 passing. This branch: **2,024 passing, 0 failing (182 files)**.
The working tree is clean at `8348fce` plus this handoff's commit.
This supersedes `handoff-2026-11-01-rules-page-live-and-thrown-out-ppsv23-timing.md`.

## What's done

1. **The CDC re-check of the rules page** (`6d6a67f`). All 60 quotes behind its Source buttons
   were re-read live from their 10 documents. None of the documents had changed. Fixed:
   - the "at 19" sentence, which only held for a cochlear implant or CSF leak (diabetes: none,
     review at 50; immunocompromised with 2 PPSV23s: review at 50 or the dose);
   - `pedsRiskSinglePpsv23AfterPcv` dropped "(Table 3)", so its deep link matched nothing.
     This is proven in the browser;
   - p2016's ‡ mark;
   - two Source panels.

   Measured: 0 verdicts moved; 3,012 prose lines changed, all explained by the two quotes.
2. **The owner's Rulebook review** (`8348fce`). Her four answers were the recommended options:
   - a "Patient | Rulebook" header switch in the same tab, replacing the separate tab;
   - the patient form no longer shows under the Rulebook (the CSS beat `hidden`);
   - the section 1 bullets are folded into the children's table;
   - a section 2 "At 19 years" row;
   - section 3 "At risk" lines;
   - section 4: "Counts", the exceptions with decision chips, a visual invalid-dose timeline,
     the adult header "still counts", and a PCV15 → PCV20/21 decision chip;
   - Source panels show linked quotes only.

   The details are in the PR body. Guard: `regression-2026-11-01-rulebook-switch-keeps-the-patient`.
   The C14 typed-number scan now also covers `const` strings.

## What's NOT done

- **PR #115 awaits her review and merge.**
- **OWNER DECISION — CDC deep links (ask, don't default).** She confirmed 2026-11-01 that a CDC
  schedule-page `#:~:text=` link opens at the TOP of the page in her browser. About 40 quotes
  link to CDC's child notes, adult notes, catch-up and risk pages, which never scroll. MMWR
  pages do scroll. Options: plain page links with the quote shown (as the Rulebook now does), or
  `textStart,textEnd` fragments, which still can't open CDC's closed sections. Three quotes also
  join two page blocks and can never match on any page: `pedsRoutine4Dose`, `adultPpsvOnly1949`,
  `pedsIcPpsvWaitFiveYears`. See memory `cdc-schedule-pages-ignore-sentence-links`.
- **OWNER DECISION — MeningoVax Ruling D (ask, don't default).** MeningoVax times a repeat from
  the last COUNTING dose, not the invalid one. This is measured on MeningoVax `main` `c1118c1`:
  - a 20-year-old with asplenia, Menveo 8/1 then 8/22 (invalid): the app advises 9/26; CDC's
    General Best Practices rule gives 10/17;
  - the same patient on Bexsero 8/1 then 8/15 (invalid): the app says "due today" on 9/1; the
    rule gives 9/12.

  She was asked in the wrap-up box; check her answer.
- **MeningoVax parity plan** (summarised to her in chat, not filed). Recommended order, one PR
  per item, porting the rule and not the code:
  - **B** — safety nets: verdict corpus, prose diff, one interval-rule table;
  - **A** — Ruling D;
  - **C** — the citations plan items C2–C8 / G1–G6 in
    `plan-2026-10-16-citations-which-chip-did-this-come-from.md` (MeningoVax has done only C1);
  - **D** — card UX: the citation pop-up and showing the stated minimum. This runs PneumoVax →
    MeningoVax, so it needs the design-review sign-off;
  - **E** — a MeningoVax Rulebook, last.

  Nothing pneumococcal-specific carries over (p2016, PCV7, the IC split).
- **Older parked items**, unchanged and rare (she asked not to have rare histories raised):
  - Leah's at/after-6 card with two invalid PPSV23s;
  - P4;
  - the unvaccinated-to-6 PCV15 row;
  - the mixed history;
  - the pointless "next dose … from" sentence on the asplenia 5-year-old.

## Why this is a good stopping point

Both pieces of the Rulebook work are built, measured, guarded (each new guard broken on purpose
and caught), checked in the running app at desktop and phone width, and in one green-locally
PR. The two open decisions block nothing in PR #115.

## Resuming

1. `cd /Users/joannehuang/Downloads/PneumoVax && git checkout main && git pull`, if #115 is
   merged. Otherwise, check its CI and ask her to review.
2. Run `./node_modules/.bin/vitest run --reporter=json --outputFile=<scratch>/r.json`. Expect
   **2,024 passing**.
3. Ask her the two open decisions above if they are still unanswered.
4. For MeningoVax work, read `CLAUDE.md` in `~/Downloads/MeningoVax-main` first. That repo's
   `main` is unprotected, but use a branch and PR anyway. Use the `fix-queue` loop:
   1. reproduce;
   2. write a failing test;
   3. fix;
   4. run the full suite;
   5. break each clause;
   6. check in the running app (the "MeningoVax dev server" in `.claude/launch.json`).
5. **Dev server:** `preview_start {name: "PneumoVax dev server"}` worked this session (port 5173).
   The old `localhost:5178` URL from the previous handoff was dead.
6. `scripts/proseDiff.mjs` must be run with plain `node`, not `vite-node`.
