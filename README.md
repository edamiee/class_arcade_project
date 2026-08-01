# Penelope's Learning Arcade

A single-file, offline-friendly retro arcade quiz game for the classroom. Load `index.html` in any modern browser — no install, no server, no internet connection required — and turn any topic into a game show students can play as a class.

## What it is

The app has two sides:

- **Play** — pick a course and a week/topic, choose how many questions and (optionally) a countdown timer per question, and play a retro arcade-style quiz. Right/wrong answers affect lives and score, just like a classic arcade game.
- **Admin** — build the question bank: create courses, weeks/topics, and individual questions (multiple choice, with an optional explanation shown after answering). Supports bulk import, search/filter, duplicating a course or week, renaming, and a printable answer key.

## Retro themes

Three switchable visual/audio themes, picked from a dropdown at any time:

- **PAC** — neon arcade colors, ghost-chase decorations, classic bonus-flash celebration.
- **BLOCKS** — a Tetris-inspired palette and falling-block decorations, with matching sound effects and a hard-edged "line clear" celebration.
- **PLUMBER** — a Mario-inspired palette with mushroom/pipe/goomba decorations, matching music, and a gold "course clear" celebration.

Switching themes recolors the whole UI and swaps sound effects and decorations — the questions and scoring are unaffected.

## AI-assisted content

Two optional features call the Anthropic API directly from the browser (an API key you provide is stored only in your browser's local storage — it's never sent anywhere except directly to Anthropic when you use these features):

- **Generate questions** — describe a topic and get a batch of draft multiple-choice questions to review and add to a week.
- **Improvement tip sheets** — pick a past game from a class's history and generate a downloadable Markdown report summarizing what was missed and how to study it.

Both features are entirely optional — the app works fully offline without an API key; you just won't be able to auto-generate content.

## Game history & scores

- Every game played is logged automatically per week, including which specific questions were right/wrong — reviewable later, and individual entries (or the whole history) can be deleted.
- Optionally save a named score per week (e.g. "Semester 1 — Fall 2026") for a class or period.
- An optional **BEST SCORE** toggle on the Play screen can show the top saved score for the selected week — off by default, so it's up to you whether students see the record before playing.

## Other features

- Adjustable UI text/scale, master mute toggle, and keyboard shortcuts during gameplay.
- A custom class mascot photo shown throughout the app.

## Data & backup

All courses, questions, scores, and history live in your browser's local storage — nothing is uploaded anywhere. Use the **Export** buttons in Admin to save the entire bank (or just one course) as a `.json` file for backup, and **Import** to restore or merge it back in — handy for moving between computers or keeping a copy on a USB drive.

## Running it

Just open `index.html` in a browser. No build step, no dependencies, no server. Works from a USB drive or any locked-down school computer with a modern browser installed.
