# Thrive Images

A site for Thrive Studies translators. It replaces the "Thrive Images" Google Doc: every Thrive image, with its Canva template link, sorted by level, series, and study. A translator opens each template, makes their own copy, and puts it in their language.

A plain HTML, CSS, and JS page. No build step, no server, no sign-in.

| File | What it does |
|---|---|
| `index.html` | The page shell: top bar, footer, the translate pop-up. |
| `styles.css` | The look (Thrive orange, Sora and Inter, light and dark). |
| `app.js` | Reads the two data files and draws every page. |
| `data/designs.json` | **Every design.** Levels → series → studies → images. This is the file to edit. |
| `data/photos.json` | The original photos in the THRIVE IMAGES Drive folder. Made by `tools/build_photos.py`. |
| `photos/` | Small previews of those photos (the real files download from Drive). |
| `tools/` | Helper scripts, below. Not needed by the site itself. |

## Pages

- **Home**: what this is, 3 steps, and a card for each level.
- **Start, Walk, Run, Guide**: one row per study. Type buttons, "Only images with words", "Show old designs", and S/M/L picture size.
- **Work through this page**: shows a progress bar and **Open next** (one tab per click, never blocked) and **Open next 5** (needs pop-ups allowed once). Checkmarks are saved in that browser only and only show while working.
- **App & Web**: logos, app headers, icons, carousels, website images.
- **Original Photos**: every photo in THRIVE IMAGES with a Download button. Each study row also has an "Original photo ↓" link.
- **Training**: the 9 Canva videos.
- **Translate** (hover any picture marked **Aa**): paste the words, pick a language, and Google Translate opens.

## Changing designs (`data/designs.json`)

Each image looks like this:

```json
{ "name": "Vertical Image", "type": "Vertical", "url": "https://www.canva.com/design/…/view", "words": true, "w": 1080, "h": 1920 }
```

- `type` is one of: Square, Square Shaded, Review Card, Vertical, Circle, Study Extra, Series Image, Series App Image, Header, or an App & Web group name.
- `words: true` shows the **Aa** badge and the Translate button.
- `status`: leave it out for normal. `"old"` grays it out and hides it unless "Show old designs" is on. `"hidden"` removes it from the site.
- To change a whole type at once, add `"status"` to that type in the `types` list at the top, for example `"Vertical": { "status": "old", … }`.
- `note`: a note for us, not shown on the site (used for the 2 editor links from the doc).
- Previews come from Canva automatically. `w` and `h` are the design's size, filled in by `tools/canva_meta.py`.

## Tools

- `python3 tools/canva_meta.py data/designs.json` asks Canva for each design's title and size (saved in `tools/canva_meta.json`). Canva limits how fast you can ask, so a full run takes a few minutes. Then `python3 tools/apply_meta.py` copies the sizes into `designs.json` and writes `tools/link-report.md` (broken links, and links whose Canva title doesn't match the study).
- `python3 tools/build_photos.py` rereads the THRIVE IMAGES folder (through Google Drive for desktop on Mark's Mac) and rebuilds `data/photos.json` and `photos/`. Run it after adding or renaming photos in Drive. A second photo for a study is named like `EVERYONE 2.jpg`.
- `tools/import_doc.py` was the one-time import from the Google Doc (copy saved as `tools/thrive-images-doc-2026-10-31.md`). Don't re-run it unless you want to start over; it would undo edits to `designs.json`.

## Previewing

Any static server works, for example `python3 -m http.server` in this folder, then open http://localhost:8000.
