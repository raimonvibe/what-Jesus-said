#!/usr/bin/env node
/**
 * Print the shipped WEB text for a reference, so quotes can be copied exactly.
 *
 *   node scripts/show-passage.js "Matthew 5:3-12"
 *   node scripts/show-passage.js "John 14:6"
 */

const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const data = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', 'new-testament-data.json'), 'utf8'),
)

const books = new Map()
for (const book of data.books) {
  const chapters = new Map()
  for (const chapter of book.chapters) {
    const verses = new Map()
    const parts = chapter.content.split(/\[(\d+)\]/)
    for (let i = 1; i < parts.length; i += 2) {
      verses.set(Number(parts[i]), (parts[i + 1] || '').replace(/\s+/g, ' ').trim())
    }
    chapters.set(String(chapter.number), verses)
  }
  books.set(book.name, chapters)
}

const refs = process.argv.slice(2)
if (!refs.length) {
  console.error('usage: node scripts/show-passage.js "Matthew 5:3-12" [...]')
  process.exit(1)
}

for (const ref of refs) {
  const m = /^(.+?)\s+(\d+):(\d+)(?:[–—-](\d+))?$/.exec(ref.trim())
  if (!m) {
    console.error(`?? cannot parse "${ref}"`)
    continue
  }
  const [, bookName, chapter, from, to] = m
  const chapters = books.get(bookName)
  if (!chapters) {
    console.error(`?? no book named "${bookName}"`)
    continue
  }
  const verses = chapters.get(chapter)
  if (!verses) {
    console.error(`?? ${bookName} has no chapter ${chapter}`)
    continue
  }
  console.log(`\n### ${ref}`)
  for (let v = Number(from); v <= Number(to ?? from); v++) {
    if (verses.has(v)) console.log(`[${v}] ${verses.get(v)}`)
  }
}
