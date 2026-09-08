# IELTS Mock Test Platform

A complete, client-side IELTS practice platform: four timed skill modules, camera
and focus based exam proctoring, local scoring with CEFR mapping, performance
analytics, achievements, and a downloadable PDF assessment report.

Everything runs in the browser. There is no backend, no account, and no network
call other than the one-time download of the face-detection model. All progress
lives in LocalStorage and IndexedDB on the machine that took the test.

## Getting started

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`). For the production
bundle use `npm run build` followed by `npm run preview`.

## GitHub Pages

This repo deploys automatically from the `main` branch. After the first
successful Actions run the live site is:

`https://<your-github-username>.github.io/ielts-mock-test-platform/`

Share that URL. Testers use the app in their own browsers; scores stay on their
devices. GitHub Pages is HTTPS, which is required for camera, microphone, and
fullscreen exam mode.

After a test, **Get Certificate** asks for a name and email, then downloads a
practice certificate PDF. GitHub Pages cannot send email, so nothing is mailed.
The email is stored only on that person's device.

To publish from a fresh clone:

```bash
npm install
git add -A
git commit -m "Publish IELTS Mock Test Platform"
gh repo create ielts-mock-test-platform --public --source=. --remote=origin --push
```

Then in the GitHub repo: **Settings → Pages → Build and deployment → GitHub Actions**.
The workflow in `.github/workflows/deploy-pages.yml` builds the site with the
correct `/ielts-mock-test-platform/` base path.

Chrome, Edge or Safari 16+ is recommended. Camera proctoring, microphone
recording and fullscreen mode all require a secure context, which `localhost`
satisfies; if you serve the build from another host, use HTTPS.

## Taking a test

The dashboard offers a **Full Mock Test**, which runs Listening → Reading →
Writing → Speaking and then produces a single report, or any of the four modules
on its own. Every module is capped at 20 minutes; when the timer expires the
section is submitted automatically and further edits are locked.

Each screen keeps a fixed exam bar showing the section name, elapsed and
remaining time, live progress percentage, and an Exit Test button that confirms
before leaving. Exiting saves the session, and reopening the app offers to
resume exactly where you stopped, including answers, flags, timer state and
audio play counts.

| Module | What it covers |
| --- | --- |
| Listening | Two-play audio limit per clip, play counter, navigator sidebar |
| Reading | Split passage and question panel, five question types, flagging |
| Writing | Prompt panel with a rich text editor and a live 100–180 word gauge |
| Speaking | Repeat-sentence recording plus a cue card with 30s prep and a 20–40s window |

Audio ships as speech synthesis so the platform works with no binary assets. Add
real MP3s any time by following `public/audio/README.md`.

## Proctoring

Reading, Listening and Writing ask for camera access and monitor face presence,
multiple people in frame, head turning and time away from the camera through
MediaPipe. The camera captures video frames only; the microphone is never opened
outside the Speaking module, which requests it separately.

Alongside the camera, the app watches for tab switches, window blur and
fullscreen exits. Every observation becomes a timestamped integrity event shown
in the live panel and rolled into an Integrity Score. Nothing here can fail a
test on its own; violations only annotate the report. Declining camera access
leaves the rest of the exam fully usable.

## Results and history

Reading and Listening are marked against answer keys. Writing is scored on word
count compliance, structure, sentence variety and vocabulary diversity. Speaking
is scored on recording completion and timing compliance. Section scores map to a
CEFR level (C2 at 90+ down to A1 below 45) and feed per-skill analytics, study
recommendations and an adaptive difficulty level that raises or lowers question
difficulty on the next attempt.

Completed tests are kept in local history with their answers, writing
submissions, recordings and integrity reports, and each one can be exported as a
PDF report covering scores, CEFR level, integrity, strengths, weaknesses and a
recommended learning path.

Clearing browser storage for this site erases all of it permanently.

## Project structure

```
src/
  components/   UI kit, charts, exam shell, layout
  pages/        Dashboard, four modules, results, history, achievements
  hooks/        Timer, fullscreen, focus monitor, audio, recorder, face monitor
  context/      Theme, candidate profile, active test session
  data/         Passages, listening sections, prompts, tasks, achievements
  utils/        Storage, scoring, CEFR, analytics, text, PDF
  types/        Shared type definitions
public/
  audio/        Optional MP3 overrides (see README there)
  models/       Optional offline face-detection model
```

## Tech stack

React 19, TypeScript, Tailwind CSS v4 and Vite. Charts are hand-built SVG
components, PDF export uses jsPDF, and proctoring uses `@mediapipe/tasks-vision`.
`npm run typecheck` and `npm run lint` both pass; lint reports a handful of
advisory warnings where hooks deliberately synchronise React with browser APIs
such as the media recorder and camera stream.
