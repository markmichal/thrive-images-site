# Thrive Images: notes for any AI helper

This file is for whatever AI is helping Mark (Claude today, maybe something else later). Read README.md next (how the site works), then NOTES.md (why it exists, decisions, history). Past conversations, if any were saved, are in `chats/` (kept on this Mac only).

A public site (thriveimages.crutastic.com) that lists every Thrive Studies image with its Canva template link, for translators. Mark is not a coder: plain words, no em dashes, clickable links.

## Rules
- This repo is PUBLIC on GitHub and the site is live from `main`. Anything committed can be seen by anyone. Keep private details out of every file, keep `chats/` and the Google Doc copy (`tools/thrive-images-doc-*.md`, it has Canva editor links) out of git.
- Never push without Mark's OK (a push changes the live site within about a minute).
- Edit designs in `data/designs.json`. Don't re-run `tools/import_doc.py`.
- Write Mark's new decisions into NOTES.md with the date, the same day.

## At the end of every work session
1. Write new decisions into NOTES.md (with the date).
2. Save a copy of the chat: `python3 ~/Projects/project-kit/save-chat.py ~/Projects/thrive-images-site`
3. Make a save point: `git add -A && git commit -m "<what changed and why>"`. Don't push unless Mark says so.
4. Back up: `~/Projects/project-kit/backup-projects.sh ~/Projects/thrive-images-site` (copies only what the save point tracks, plus chats).
