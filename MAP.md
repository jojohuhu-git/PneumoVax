# Map of This Project (plain English)

PneumoVax — the pneumococcal vaccine advisor, covering all ages (infants to adults).
Repo: https://github.com/jojohuhu-git/PneumoVax

This file explains what every folder and file is for, in plain language.
If you only remember one rule: **new notes never go in the top level of this
folder — they go where the table at the bottom says.**

## The app itself (the working parts)

| Folder / file | What it is |
|---|---|
| `src/` | The app's working parts. This is where the actual program lives. |
| `src/components/` | The screens, cards, and buttons you see on screen. Two of them answer "why is it saying that?": `Rulebook.jsx` is the **How PneumoVax decides** page (the whole rulebook; the header link opens it in its own browser tab, so the patient being entered stays put), and `HowThisWasWorkedOut.jsx` is the short list on the results screen showing the route *this* patient took. |
| `src/data/rulebook.js` | What the **How PneumoVax decides** page says. Every age and interval in it comes from the numbers the engine itself uses, and every sentence comes with an example patient that a test runs through the app, so the page cannot quietly stop matching what the app does. |
| `src/logic/` | The "brain" — `recommend.js` decides what's due; `validate.js` checks recorded doses; `doseIntervalRules.js` is the single list of "how long must there be between two doses" rules; `doseIdentity.js` decides whether a row of the history counts as a dose at all (an empty row you never typed in does not). |
| `src/data/` | The facts the brain uses: brands, risk factors, schedules. |
| `src/test-grid.js` | A list of about 16,000 made-up patients (every age, risk tick and vaccination history worth testing). Used only by the tests, never shipped to anyone using the app. |
| `public/` | Images and files shipped with the app exactly as-is. |
| `index.html` | The single web page the app loads into. |
| `scripts/` | Verification tools: compare this app's answers against CDC's PneumoRecs tool, and rebuild the saved answers file below. Not part of the app. |
| `scripts/pneumorecs/` | CDC's PneumoRecs VaxAdvisor, read out of its own code on 2026-10-25: all 175 recommendations it can print, which of them nobody can reach, the seven answers checked by hand against the live site, and how its answers compared with ours. `pneumorecs-rulebook.txt` is the readable version. |
| `src/logic/__tests__/__corpus__/` | The app's saved answers for all ~16,000 made-up patients. The tests re-run the app over them and complain if any answer changed, so a change that quietly moves thousands of patients' advice can't slip through. If a change was meant to move them, run `npm run sweep:update` and say in the pull request how many moved. |

## Instructions and manuals

| Folder / file | What it is |
|---|---|
| `CLAUDE.md` | The instruction sheet the AI assistant reads at the start of every session. Short on purpose. |
| `MAP.md` | This file — the building directory. |
| `README.md` | The public description of the app for anyone visiting the code online. |
| `CLINICAL_SPEC.md` | **The active rulebook** — every clinical rule with its source citation. The code and tests refer to it by name, which is why it stays at the top level. Its section K now holds a table that must match the code exactly; a test checks it on every run, so the document can't quietly fall behind. |
| `docs/agent/` | The technical manuals (architecture, clinical rules, testing rules). |
| `docs/archive/` | Old session notes, handoffs, past reviews. Nothing here is current; kept for history. Safe to ignore. |

## Machine-managed — never edit by hand

| Folder / file | What it is |
|---|---|
| `dist/` | The packaged copy of the app that gets published. Rebuilt by machine; edits here are overwritten. |
| `node_modules/` | Third-party building blocks, downloaded automatically by `npm install`. |
| `package.json` / `package-lock.json` | The app's parts list and the exact versions in use. |
| `.claude/` | Settings and saved prompts for the AI assistant. |
| `vite.config.js` | Build machinery settings. |

## Where do new things go?

| If a session produces… | It goes in… |
|---|---|
| A change to how the app looks or behaves | `src/` (plus a test, plus a `CLINICAL_SPEC.md` update if a rule changed) |
| A new rule for how agents must work | `CLAUDE.md` (only if it applies to every future session) |
| Technical detail worth keeping (architecture, clinical sourcing) | the matching file in `docs/agent/` |
| "What we did today" notes, handoffs, reviews, finished plans | `docs/archive/` |
| A comparison/verification script | `scripts/` |
| **Nothing** ever goes loose in the top-level folder (except `CLINICAL_SPEC.md`, which lives there on purpose). | |
