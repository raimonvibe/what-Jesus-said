# What Jesus Said

A reading of the New Testament, with everything Jesus said collected beside it.

The 27 books of the New Testament are here to read — the World English Bible,
public domain. Alongside it sits a catalog of **every saying** the WEB marks as
the words of Jesus: the Gospels, a few quotations in Acts and the letters, and
Revelation. Each card quotes Him verbatim and opens the chapter with those
words marked.

Built from [raimonvibe/bible-wonders](https://github.com/raimonvibe/bible-wonders),
without the wonders catalog. Scripture and red-letter markup come from
[eBible.org’s World English Bible (engwebp)](https://ebible.org/Scriptures/details.php?id=engwebp).

## What it does

- **Two boxes on the home page.** New Testament (27 books) and What Jesus Said
  (the sayings catalog).
- **His words, not a paraphrase.** Every catalog quote is copied from official
  WEB `\wj` markup. Opening a saying highlights the verses and marks His words
  in the reader.
- **Four ways in.** Start Here (25 best-known), by theme, by book, or the full
  catalog — with a Bible-order ↔ best-known sort and search.
- **A guided tour.** Fourteen sayings walked in order, with optional narration.
- **Read aloud.** Browser speech, with a Tour / Passage / Both switcher.
- **Light and dark themes.** Pastel rainbow waves on a cream or forest-dark
  ground; the toggle switches the whole app between them.

Red-letter boundaries are an editorial convention (the WEB’s official markup),
not part of the Greek text. John 3:16 is included because the WEB marks it that
way.

## Getting started

Requires **Node 20.9+** (Next 16 will not run on Node 18).

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Working on the catalog

```bash
# print the shipped WEB text for a reference
node scripts/show-passage.js "Matthew 5:3-12"

# rebuild NT text, spans, and sayings from eBible USFM
npm run extract:jesus -- /path/to/engwebp/usfm

# the gate: every span must appear in the shipped chapter
npm run validate:sayings
```

## How the layout works

- **≥ 960px** is a true 50/50 split: Bible left, panel docked full height on
  the right, each side scrolling on its own.
- **Below that** the panel becomes a bottom sheet over a full-width Bible.

A note on the theme: `darkMode` is set to the selector `html.theme-dark`, so
**`dark:` means the dark reading theme**. Light is the default. Both sit on
the same pastel-rainbow wave background.

## Technology

Next.js 16 (App Router), TypeScript, Tailwind CSS 3.4, Lucide icons.

## Text and licence

Scripture is the **World English Bible**, which is in the public domain.
Words-of-Jesus spans follow eBible’s WEB USFM `\wj` markers.
The application code is MIT licensed.
