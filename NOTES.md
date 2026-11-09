# Thrive Images: project notes

The README is the technical guide (files, pages, how to change designs, tools). These notes add the why, the decisions, ideas and history. This repo is public, so nothing private goes here.

## Why Mark built this
Best guess from the files: Thrive Studies translators used a long Google Doc ("Thrive Images") to find every Thrive image and its Canva template. Mark wanted something easier: one site where a translator can see every image sorted by level, series and study, open each Canva template, make their own copy, and put it in their language, plus download the original photos.

## Decisions
- 2026-10-31: Plain HTML, CSS and JS on GitHub Pages. No build step, no server, no sign-in.
- 2026-10-31: Address is thriveimages.crutastic.com (GoDaddy CNAME to markmichal.github.io).
- 2026-10-31: `data/designs.json` is the one file to edit. The Google Doc import was one time only; re-running it would undo edits.
- 2026-10-31: The copy of the Google Doc stays off GitHub because it has Canva editor links in it.
- 2026-10-31: Home cards use shaded squares and hide any picture that fails to load.

## Ideas for later
None written down yet.

## History
- 2026-10-31: Built the site from the Google Doc, moved it to thriveimages.crutastic.com, fixed the home cards.
- 2026-11-09: Project kit added (AGENTS.md, CLAUDE.md, these notes).
