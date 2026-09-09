#!/usr/bin/env node
/**
 * Gate for the sayings catalog: every quote must appear in the shipped WEB
 * chapter, every id unique, every ranked familiarity unique among 1–25.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const nt = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/new-testament-data.json'), 'utf8'))
const sayings = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sayings.json'), 'utf8'))
const spans = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/words-of-jesus-spans.json'), 'utf8'))

const books = new Map(nt.books.map((b) => [b.id, b]))
const errors = []

const ids = new Set()
const ranks = new Map()

function chapterContent(bookId, chapterNumber) {
  const book = books.get(bookId)
  if (!book) return null
  const chapter = book.chapters.find((c) => c.number === String(chapterNumber))
  return chapter?.content ?? null
}

function versesOf(content) {
  const out = new Map()
  const pattern = /\[(\d+)\]([\s\S]*?)(?=\[\d+\]|$)/g
  let m
  while ((m = pattern.exec(content))) {
    out.set(Number(m[1]), m[2].replace(/\s+/g, ' ').trim())
  }
  return out
}

for (const s of sayings) {
  if (ids.has(s.id)) errors.push(`duplicate id ${s.id}`)
  ids.add(s.id)

  if (s.familiarityRank != null) {
    const prev = ranks.get(s.familiarityRank)
    if (prev && s.familiarityRank <= 25) {
      errors.push(`familiarityRank ${s.familiarityRank} used by ${prev} and ${s.id}`)
    }
    ranks.set(s.familiarityRank, s.id)
  }

  const content = chapterContent(s.bookId, s.passage.chapterNumber)
  if (!content) {
    errors.push(`${s.id}: missing chapter ${s.bookId} ${s.passage.chapterNumber}`)
    continue
  }

  const verses = versesOf(content)
  const [from, to] = s.passage.verses
  const chapterSpans = spans[`${s.bookId}.${s.passage.chapterNumber}`] || {}
  for (let v = from; v <= to; v++) {
    const marks = chapterSpans[String(v)]
    if (!marks) {
      errors.push(`${s.id}: ${s.bookId} ${s.passage.chapterNumber}:${v} has no words-of-Jesus span`)
      continue
    }
    const verseText = verses.get(v) || ''
    const segs = marks === 'full' ? [verseText] : marks
    for (const seg of segs) {
      const needle = seg.replace(/\s+/g, ' ').trim()
      if (needle && !verseText.includes(needle) && !content.includes(needle)) {
        errors.push(`${s.id}: span not in verse ${v}: ${needle.slice(0, 60)}`)
      }
    }
  }
}

if (errors.length) {
  console.error(`${errors.length} problem(s):`)
  for (const e of errors.slice(0, 40)) console.error(' -', e)
  if (errors.length > 40) console.error(` …and ${errors.length - 40} more`)
  process.exit(1)
}

console.log(`ok: ${sayings.length} sayings, ${Object.keys(spans).length} chapters with words of Jesus`)
