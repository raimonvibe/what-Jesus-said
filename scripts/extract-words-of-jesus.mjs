#!/usr/bin/env node
/**
 * Build the New Testament text, red-letter spans, and sayings catalog from
 * eBible's public-domain World English Bible USFM (engwebp).
 *
 * Words of Jesus come only from official \wj ... \wj* markers — never from
 * memory. Named titles are editorial navigation; the spoken text is verbatim.
 *
 * Usage:
 *   node scripts/extract-words-of-jesus.mjs /path/to/usfm-dir
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const NT_BOOKS = [
  ['MAT', 'Matthew', '70-MATengwebp.usfm'],
  ['MRK', 'Mark', '71-MRKengwebp.usfm'],
  ['LUK', 'Luke', '72-LUKengwebp.usfm'],
  ['JHN', 'John', '73-JHNengwebp.usfm'],
  ['ACT', 'Acts', '74-ACTengwebp.usfm'],
  ['ROM', 'Romans', '75-ROMengwebp.usfm'],
  ['1CO', '1 Corinthians', '76-1COengwebp.usfm'],
  ['2CO', '2 Corinthians', '77-2COengwebp.usfm'],
  ['GAL', 'Galatians', '78-GALengwebp.usfm'],
  ['EPH', 'Ephesians', '79-EPHengwebp.usfm'],
  ['PHP', 'Philippians', '80-PHPengwebp.usfm'],
  ['COL', 'Colossians', '81-COLengwebp.usfm'],
  ['1TH', '1 Thessalonians', '82-1THengwebp.usfm'],
  ['2TH', '2 Thessalonians', '83-2THengwebp.usfm'],
  ['1TI', '1 Timothy', '84-1TIengwebp.usfm'],
  ['2TI', '2 Timothy', '85-2TIengwebp.usfm'],
  ['TIT', 'Titus', '86-TITengwebp.usfm'],
  ['PHM', 'Philemon', '87-PHMengwebp.usfm'],
  ['HEB', 'Hebrews', '88-HEBengwebp.usfm'],
  ['JAS', 'James', '89-JASengwebp.usfm'],
  ['1PE', '1 Peter', '90-1PEengwebp.usfm'],
  ['2PE', '2 Peter', '91-2PEengwebp.usfm'],
  ['1JN', '1 John', '92-1JNengwebp.usfm'],
  ['2JN', '2 John', '93-2JNengwebp.usfm'],
  ['3JN', '3 John', '94-3JNengwebp.usfm'],
  ['JUD', 'Jude', '95-JUDengwebp.usfm'],
  ['REV', 'Revelation', '96-REVengwebp.usfm'],
]

const BOOK_NAME = Object.fromEntries(NT_BOOKS.map(([id, name]) => [id, name]))

const ERA_OF = {
  MAT: 'matthew',
  MRK: 'mark',
  LUK: 'luke',
  JHN: 'john',
  ACT: 'acts',
  REV: 'revelation',
}

/**
 * Named units used only to title and split long speeches. Ranges are inclusive.
 * Source: traditional Gospel pericopes; the spoken words still come from \wj.
 */
const NAMED = [
  { id: 'baptism-mat', title: 'Let it be so now', book: 'MAT', c1: 3, v1: 15, c2: 3, v2: 15, theme: 'dialogue', rank: 40 },
  { id: 'temptation-bread-mat', title: 'Man shall not live by bread alone', book: 'MAT', c1: 4, v1: 4, c2: 4, v2: 4, theme: 'teaching', rank: 18 },
  { id: 'temptation-test-mat', title: 'You shall not test the Lord your God', book: 'MAT', c1: 4, v1: 7, c2: 4, v2: 7, theme: 'teaching', rank: 41 },
  { id: 'temptation-worship-mat', title: 'You shall worship the Lord your God', book: 'MAT', c1: 4, v1: 10, c2: 4, v2: 10, theme: 'teaching', rank: 42 },
  { id: 'repent-kingdom-mat', title: 'Repent, for the Kingdom of Heaven is at hand', book: 'MAT', c1: 4, v1: 17, c2: 4, v2: 17, theme: 'teaching', rank: 16 },
  { id: 'fishers-mat', title: 'Fishers of men', book: 'MAT', c1: 4, v1: 19, c2: 4, v2: 19, theme: 'commission', rank: 19 },
  { id: 'beatitudes-mat', title: 'The Beatitudes', book: 'MAT', c1: 5, v1: 3, c2: 5, v2: 12, theme: 'teaching', rank: 1, parallelGroupId: 'beatitudes' },
  { id: 'salt-and-light', title: 'Salt and light', book: 'MAT', c1: 5, v1: 13, c2: 5, v2: 16, theme: 'teaching', rank: 20 },
  { id: 'law-fulfilled', title: 'I came to fulfill the law', book: 'MAT', c1: 5, v1: 17, c2: 5, v2: 20, theme: 'teaching', rank: 43 },
  { id: 'anger-and-reconciliation', title: 'Anger, insult, and reconciliation', book: 'MAT', c1: 5, v1: 21, c2: 5, v2: 26, theme: 'teaching' },
  { id: 'adultery-of-the-heart', title: 'Adultery of the heart', book: 'MAT', c1: 5, v1: 27, c2: 5, v2: 30, theme: 'teaching' },
  { id: 'divorce-mat', title: 'On divorce', book: 'MAT', c1: 5, v1: 31, c2: 5, v2: 32, theme: 'teaching' },
  { id: 'oaths-mat', title: 'Let your yes be yes', book: 'MAT', c1: 5, v1: 33, c2: 5, v2: 37, theme: 'teaching' },
  { id: 'turn-the-other-cheek', title: 'Turn the other cheek', book: 'MAT', c1: 5, v1: 38, c2: 5, v2: 42, theme: 'teaching', rank: 21 },
  { id: 'love-your-enemies-mat', title: 'Love your enemies', book: 'MAT', c1: 5, v1: 43, c2: 5, v2: 48, theme: 'teaching', rank: 5, parallelGroupId: 'love-enemies' },
  { id: 'give-in-secret', title: 'Give in secret', book: 'MAT', c1: 6, v1: 1, c2: 6, v2: 4, theme: 'teaching' },
  { id: 'how-to-pray', title: 'How to pray', book: 'MAT', c1: 6, v1: 5, c2: 6, v2: 8, theme: 'prayer' },
  { id: 'lords-prayer-mat', title: 'The Lord’s Prayer', book: 'MAT', c1: 6, v1: 9, c2: 6, v2: 13, theme: 'prayer', rank: 2, parallelGroupId: 'lords-prayer' },
  { id: 'forgive-to-be-forgiven', title: 'Forgive, and you will be forgiven', book: 'MAT', c1: 6, v1: 14, c2: 6, v2: 15, theme: 'teaching', rank: 22 },
  { id: 'fast-in-secret', title: 'Fast in secret', book: 'MAT', c1: 6, v1: 16, c2: 6, v2: 18, theme: 'teaching' },
  { id: 'treasure-in-heaven', title: 'Treasure in heaven', book: 'MAT', c1: 6, v1: 19, c2: 6, v2: 21, theme: 'teaching', rank: 23 },
  { id: 'eye-is-the-lamp', title: 'The lamp of the body', book: 'MAT', c1: 6, v1: 22, c2: 6, v2: 23, theme: 'teaching' },
  { id: 'two-masters', title: 'You cannot serve God and Mammon', book: 'MAT', c1: 6, v1: 24, c2: 6, v2: 24, theme: 'teaching' },
  { id: 'do-not-be-anxious', title: 'Do not be anxious', book: 'MAT', c1: 6, v1: 25, c2: 6, v2: 34, theme: 'promise', rank: 6 },
  { id: 'judge-not', title: 'Don’t judge, so that you won’t be judged', book: 'MAT', c1: 7, v1: 1, c2: 7, v2: 5, theme: 'teaching', rank: 17 },
  { id: 'pearls-before-pigs', title: 'Pearls before pigs', book: 'MAT', c1: 7, v1: 6, c2: 7, v2: 6, theme: 'teaching' },
  { id: 'ask-seek-knock-mat', title: 'Ask, seek, knock', book: 'MAT', c1: 7, v1: 7, c2: 7, v2: 11, theme: 'promise', rank: 24, parallelGroupId: 'ask-seek-knock' },
  { id: 'golden-rule-mat', title: 'The Golden Rule', book: 'MAT', c1: 7, v1: 12, c2: 7, v2: 12, theme: 'teaching', rank: 3 },
  { id: 'narrow-gate', title: 'The narrow gate', book: 'MAT', c1: 7, v1: 13, c2: 7, v2: 14, theme: 'teaching', rank: 25 },
  { id: 'false-prophets-fruit', title: 'By their fruits you will know them', book: 'MAT', c1: 7, v1: 15, c2: 7, v2: 20, theme: 'teaching' },
  { id: 'lord-lord', title: 'Not everyone who says to me, Lord, Lord', book: 'MAT', c1: 7, v1: 21, c2: 7, v2: 23, theme: 'teaching' },
  { id: 'wise-and-foolish-builders', title: 'The wise and foolish builders', book: 'MAT', c1: 7, v1: 24, c2: 7, v2: 27, theme: 'parable', rank: 26 },
  { id: 'come-to-me', title: 'Come to me, all you who labor', book: 'MAT', c1: 11, v1: 28, c2: 11, v2: 30, theme: 'promise', rank: 4 },
  { id: 'greatest-commandment-mat', title: 'The greatest commandment', book: 'MAT', c1: 22, v1: 37, c2: 22, v2: 40, theme: 'teaching', rank: 7, parallelGroupId: 'greatest-commandment' },
  { id: 'olivet-mat-24', title: 'The Olivet Discourse — signs of the end', book: 'MAT', c1: 24, v1: 4, c2: 24, v2: 51, theme: 'prophecy', rank: 27 },
  { id: 'wise-and-foolish-virgins', title: 'The wise and foolish virgins', book: 'MAT', c1: 25, v1: 1, c2: 25, v2: 13, theme: 'parable' },
  { id: 'parable-of-the-talents', title: 'The parable of the talents', book: 'MAT', c1: 25, v1: 14, c2: 25, v2: 30, theme: 'parable' },
  { id: 'sheep-and-goats', title: 'The sheep and the goats', book: 'MAT', c1: 25, v1: 31, c2: 25, v2: 46, theme: 'prophecy', rank: 26 },
  { id: 'great-commission', title: 'The Great Commission', book: 'MAT', c1: 28, v1: 18, c2: 28, v2: 20, theme: 'commission', rank: 8 },
  { id: 'sabbath-for-man', title: 'The Sabbath was made for man', book: 'MRK', c1: 2, v1: 27, c2: 2, v2: 28, theme: 'teaching', rank: 28 },
  { id: 'talitha-koum', title: 'Little girl, I tell you, get up', book: 'MRK', c1: 5, v1: 41, c2: 5, v2: 41, theme: 'dialogue', rank: 29 },
  { id: 'let-the-children-come-mrk', title: 'Let the little children come to me', book: 'MRK', c1: 10, v1: 14, c2: 10, v2: 15, theme: 'teaching', rank: 15, parallelGroupId: 'let-children' },
  { id: 'greatest-commandment-mrk', title: 'The greatest commandment', book: 'MRK', c1: 12, v1: 29, c2: 12, v2: 31, theme: 'teaching', parallelGroupId: 'greatest-commandment' },
  { id: 'good-samaritan', title: 'The good Samaritan', book: 'LUK', c1: 10, v1: 30, c2: 10, v2: 37, theme: 'parable', rank: 9 },
  { id: 'lords-prayer-luk', title: 'The Lord’s Prayer', book: 'LUK', c1: 11, v1: 2, c2: 11, v2: 4, theme: 'prayer', parallelGroupId: 'lords-prayer' },
  { id: 'ask-seek-knock-luk', title: 'Ask, seek, knock', book: 'LUK', c1: 11, v1: 9, c2: 11, v2: 13, theme: 'promise', parallelGroupId: 'ask-seek-knock' },
  { id: 'rich-fool', title: 'The rich fool', book: 'LUK', c1: 12, v1: 16, c2: 12, v2: 21, theme: 'parable' },
  { id: 'lost-sheep-luk', title: 'The lost sheep', book: 'LUK', c1: 15, v1: 4, c2: 15, v2: 7, theme: 'parable', rank: 30, parallelGroupId: 'lost-sheep' },
  { id: 'lost-coin', title: 'The lost coin', book: 'LUK', c1: 15, v1: 8, c2: 15, v2: 10, theme: 'parable' },
  { id: 'prodigal-son', title: 'The prodigal son', book: 'LUK', c1: 15, v1: 11, c2: 15, v2: 32, theme: 'parable', rank: 10 },
  { id: 'rich-man-and-lazarus', title: 'The rich man and Lazarus', book: 'LUK', c1: 16, v1: 19, c2: 16, v2: 31, theme: 'parable' },
  { id: 'seek-and-save', title: 'The Son of Man came to seek and to save', book: 'LUK', c1: 19, v1: 10, c2: 19, v2: 10, theme: 'promise', rank: 31 },
  { id: 'father-forgive-them', title: 'Father, forgive them', book: 'LUK', c1: 23, v1: 34, c2: 23, v2: 34, theme: 'prayer', rank: 13 },
  { id: 'today-in-paradise', title: 'Today you will be with me in Paradise', book: 'LUK', c1: 23, v1: 43, c2: 23, v2: 43, theme: 'promise', rank: 32 },
  { id: 'into-your-hands', title: 'Father, into your hands I commit my spirit', book: 'LUK', c1: 23, v1: 46, c2: 23, v2: 46, theme: 'prayer', rank: 33 },
  { id: 'born-anew', title: 'You must be born anew', book: 'JHN', c1: 3, v1: 3, c2: 3, v2: 8, theme: 'teaching', rank: 34 },
  { id: 'god-so-loved', title: 'For God so loved the world', book: 'JHN', c1: 3, v1: 16, c2: 3, v2: 21, theme: 'promise', rank: 11 },
  { id: 'living-water', title: 'Living water', book: 'JHN', c1: 4, v1: 10, c2: 4, v2: 14, theme: 'promise', rank: 35 },
  { id: 'worship-in-spirit', title: 'Worship in spirit and truth', book: 'JHN', c1: 4, v1: 21, c2: 4, v2: 24, theme: 'teaching' },
  { id: 'i-am-bread', title: 'I am the bread of life', book: 'JHN', c1: 6, v1: 35, c2: 6, v2: 40, theme: 'iam', rank: 14 },
  { id: 'i-am-light', title: 'I am the light of the world', book: 'JHN', c1: 8, v1: 12, c2: 8, v2: 12, theme: 'iam', rank: 36 },
  { id: 'before-abraham', title: 'Before Abraham was born, I AM', book: 'JHN', c1: 8, v1: 58, c2: 8, v2: 58, theme: 'iam', rank: 37 },
  { id: 'i-am-door', title: 'I am the door of the sheep', book: 'JHN', c1: 10, v1: 7, c2: 10, v2: 10, theme: 'iam' },
  { id: 'i-am-shepherd', title: 'I am the good shepherd', book: 'JHN', c1: 10, v1: 11, c2: 10, v2: 18, theme: 'iam', rank: 38 },
  { id: 'i-am-resurrection', title: 'I am the resurrection and the life', book: 'JHN', c1: 11, v1: 25, c2: 11, v2: 26, theme: 'iam', rank: 39 },
  { id: 'i-am-way', title: 'I am the way, the truth, and the life', book: 'JHN', c1: 14, v1: 6, c2: 14, v2: 7, theme: 'iam', rank: 12 },
  { id: 'new-commandment', title: 'A new commandment', book: 'JHN', c1: 13, v1: 34, c2: 13, v2: 35, theme: 'teaching', rank: 40 },
  { id: 'peace-i-leave', title: 'Peace I leave with you', book: 'JHN', c1: 14, v1: 27, c2: 14, v2: 27, theme: 'promise', rank: 41 },
  { id: 'i-am-vine', title: 'I am the vine', book: 'JHN', c1: 15, v1: 1, c2: 15, v2: 8, theme: 'iam' },
  { id: 'high-priestly-prayer', title: 'The high priestly prayer', book: 'JHN', c1: 17, v1: 1, c2: 17, v2: 26, theme: 'prayer', rank: 42 },
  { id: 'it-is-finished', title: 'It is finished', book: 'JHN', c1: 19, v1: 30, c2: 19, v2: 30, theme: 'dialogue', rank: 43 },
  { id: 'feed-my-sheep', title: 'Feed my sheep', book: 'JHN', c1: 21, v1: 15, c2: 21, v2: 17, theme: 'commission' },
  { id: 'you-will-be-witnesses', title: 'You will be my witnesses', book: 'ACT', c1: 1, v1: 7, c2: 1, v2: 8, theme: 'commission', rank: 44 },
  { id: 'damascus-road', title: 'Saul, why do you persecute me?', book: 'ACT', c1: 9, v1: 4, c2: 9, v2: 6, theme: 'dialogue', rank: 45 },
  { id: 'behold-i-stand', title: 'Behold, I stand at the door and knock', book: 'REV', c1: 3, v1: 20, c2: 3, v2: 22, theme: 'promise', rank: 46 },
  { id: 'alpha-and-omega', title: 'I am the Alpha and the Omega', book: 'REV', c1: 1, v1: 17, c2: 1, v2: 18, theme: 'iam', rank: 47 },
  { id: 'behold-i-make-all-things-new', title: 'Behold, I am making all things new', book: 'REV', c1: 21, v1: 5, c2: 21, v2: 6, theme: 'promise', rank: 48 },
]

const PARABLE_HINT =
  /\b(parable|sower|mustard seed|leaven|hidden treasure|pearl of great|net|lost sheep|lost coin|prodigal|good samaritan|rich fool|unjust steward|rich man and lazarus|workers in the vineyard|wedding feast|ten virgins|talents|minas|wicked tenants|fig tree|two sons|unforgiving|good shepherd)\b/i

function stripUsfm(raw) {
  let s = raw
  s = s.replace(/\\f\s[\s\S]*?\\f\*/g, '')
  s = s.replace(/\\x\s[\s\S]*?\\x\*/g, '')
  s = s.replace(/\\fig\s[\s\S]*?\\fig\*/g, '')
  // Strong's / word-level markup, including nested \+w inside \wj
  let prev
  do {
    prev = s
    s = s.replace(/\\(?:\+)?w\s+([^|\\]+)\|[^\\]*\\(?:\+)?w\*/g, '$1')
    s = s.replace(/\\(?:\+)?w\s+([^\\]+?)\\(?:\+)?w\*/g, '$1')
  } while (s !== prev)
  // Closers first: `\wj*` would otherwise match the opener pattern `\wj`.
  s = s.replace(/\\(?:\+)?wj\*/g, '‹/WJ›')
  s = s.replace(/\\(?:\+)?wj\s*/g, '‹WJ›')
  s = s.replace(/\\(?:\+)?(?:add|nd|qt|bk|dc|k|tl|it|bd|em|sc|ord|pn|pro|wg|wh|wa|bdit)\s*/g, '')
  s = s.replace(/\\(?:\+)?(?:add|nd|qt|bk|dc|k|tl|it|bd|em|sc|ord|pn|pro|wg|wh|wa|bdit)\*/g, '')
  s = s.replace(/\\(?:p|m|mi|pc|pr|cls|pmo|pm|pmc|pmr|pi\d*|li\d*|ph\d*|q\d*|qr|qc|qa|qm\d*|b|nb|sp|d|cls|lit|k|ms\d*|mr|s\d*|sr|r|d|sp|sd\d*|z[\w-]+)\b/g, ' ')
  s = s.replace(/\\v\s+\d+[a-z]?(?:-\d+[a-z]?)?/g, ' ')
  s = s.replace(/\\c\s+\d+/g, ' ')
  s = s.replace(/\\id\b[^\n]*/g, ' ')
  s = s.replace(/\\[a-zA-Z]+\d*\*?\s*/g, ' ')
  s = s.replace(/[ \t]+\n/g, '\n')
  s = s.replace(/[ \t]{2,}/g, ' ')
  return s.trim()
}

function extractWjSegments(cleaned) {
  const segments = []
  const re = /‹WJ›([\s\S]*?)‹\/WJ›/g
  let m
  while ((m = re.exec(cleaned))) {
    const text = m[1].replace(/\s+/g, ' ').trim()
    if (text) segments.push(text)
  }
  return segments
}

function plainText(cleaned) {
  return cleaned
    .replace(/‹\/?WJ›/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseUsfmBook(usfm) {
  const chapters = new Map()
  const lines = usfm.split(/\n/)
  let chapter = 0
  let verse = 0
  let buf = ''

  const flush = () => {
    if (!chapter || !verse) return
    const cleaned = stripUsfm(buf)
    const text = plainText(cleaned)
    const wj = extractWjSegments(cleaned)
    if (!chapters.has(chapter)) chapters.set(chapter, new Map())
    chapters.get(chapter).set(verse, { text, wj })
    buf = ''
  }

  for (const line of lines) {
    const c = line.match(/^\\c\s+(\d+)/)
    if (c) {
      flush()
      chapter = Number(c[1])
      verse = 0
      buf = ''
      continue
    }
    const v = line.match(/^\\v\s+(\d+)/)
    if (v) {
      flush()
      verse = Number(v[1])
      buf = line.slice(v[0].length) + '\n'
      continue
    }
    if (verse) buf += line + '\n'
  }
  flush()
  return chapters
}

function verseKey(book, chapter, verse) {
  return `${book}.${chapter}.${verse}`
}

function inRange(book, ch, vs, named) {
  if (book !== named.book) return false
  const n1 = named.c1 * 1000 + named.v1
  const n2 = named.c2 * 1000 + named.v2
  const n = ch * 1000 + vs
  return n >= n1 && n <= n2
}

function inferTheme(title, quote, book, named) {
  if (named?.theme) return named.theme
  if (book === 'REV') return 'prophecy'
  if (/^I am\b/i.test(quote) || /^I AM\b/.test(quote)) return 'iam'
  if (PARABLE_HINT.test(title) || PARABLE_HINT.test(quote.slice(0, 80))) return 'parable'
  if (/\b(Father,|pray|prayer)\b/i.test(title)) return 'prayer'
  if (quote.split(/\s+/).length < 18) return 'dialogue'
  return 'teaching'
}

function titleFromQuote(quote) {
  const cleaned = quote.replace(/^[“"']+/, '').replace(/[”"']+$/, '').trim()
  const words = cleaned.split(/\s+/)
  if (words.length <= 10) return cleaned.replace(/[.,;:]+$/, '')
  return `${words.slice(0, 10).join(' ').replace(/[.,;:]+$/, '')}…`
}

function labelOf(bookName, c1, v1, c2, v2) {
  if (c1 === c2) {
    return v1 === v2 ? `${bookName} ${c1}:${v1}` : `${bookName} ${c1}:${v1}–${v2}`
  }
  return `${bookName} ${c1}:${v1}–${c2}:${v2}`
}

function main() {
  const usfmDir = process.argv[2] || '/tmp/web-usfm/webp'
  const booksOut = []
  const spans = {}
  const verseIndex = [] // {book, chapter, verse, text, wj[]}

  for (const [id, name, file] of NT_BOOKS) {
    const full = path.join(usfmDir, file)
    if (!fs.existsSync(full)) throw new Error(`Missing ${full}`)
    const parsed = parseUsfmBook(fs.readFileSync(full, 'utf8'))
    const chapterList = []
    const nums = [...parsed.keys()].sort((a, b) => a - b)
    for (const c of nums) {
      const verses = parsed.get(c)
      const vnums = [...verses.keys()].sort((a, b) => a - b)
      const parts = []
      const chapterSpans = {}
      for (const v of vnums) {
        const { text, wj } = verses.get(v)
        if (!text) continue
        parts.push(`     [${v}] ${text}`)
        verseIndex.push({ book: id, chapter: c, verse: v, text, wj })
        if (wj.length) {
          const fullVerse =
            wj.length === 1 &&
            plainClose(wj[0]) === plainClose(text)
          chapterSpans[String(v)] = fullVerse ? 'full' : wj
        }
      }
      if (Object.keys(chapterSpans).length) spans[`${id}.${c}`] = chapterSpans
      chapterList.push({
        id: `${id}.${c}`,
        number: String(c),
        reference: `${name} ${c}`,
        content: parts.join('\n') + '\n',
      })
    }
    booksOut.push({
      id,
      name,
      abbreviation: name,
      chapters: chapterList,
    })
  }

  const nt = {
    bibleName: 'World English Bible',
    bibleId: 'engwebp',
    books: booksOut,
    source:
      'eBible.org World English Bible (engwebp), public domain, with official \\wj words-of-Jesus markup.',
  }

  const sayings = groupSayings(verseIndex)

  const dataDir = path.join(ROOT, 'data')
  fs.writeFileSync(path.join(dataDir, 'new-testament-data.json'), JSON.stringify(nt, null, 2) + '\n')
  fs.writeFileSync(path.join(dataDir, 'words-of-jesus-spans.json'), JSON.stringify(spans, null, 2) + '\n')
  fs.writeFileSync(path.join(dataDir, 'sayings.json'), JSON.stringify(sayings, null, 2) + '\n')

  const wjVerses = verseIndex.filter((v) => v.wj.length).length
  const wjBooks = new Set(verseIndex.filter((v) => v.wj.length).map((v) => v.book))
  console.log(`Books: ${booksOut.length}`)
  console.log(`Chapters: ${booksOut.reduce((n, b) => n + b.chapters.length, 0)}`)
  console.log(`Verses with words of Jesus: ${wjVerses}`)
  console.log(`Books with words of Jesus: ${[...wjBooks].join(', ')}`)
  console.log(`Sayings: ${sayings.length}`)
  console.log(`Named titles applied: ${sayings.filter((s) => s.named).length}`)
}

function plainClose(s) {
  return s
    .replace(/[“”"‘’']/g, '')
    .replace(/[.,;:!?()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function groupSayings(verseIndex) {
  const byBook = new Map()
  for (const row of verseIndex) {
    if (!byBook.has(row.book)) byBook.set(row.book, [])
    byBook.get(row.book).push(row)
  }

  const raw = []
  for (const [book, rows] of byBook) {
    let current = null
    for (const row of rows) {
      if (row.wj.length) {
        if (
          current &&
          current.book === book &&
          current.c2 === row.chapter &&
          row.verse === current.v2 + 1
        ) {
          current.v2 = row.verse
          current.rows.push(row)
        } else {
          if (current) raw.push(current)
          current = {
            book,
            c1: row.chapter,
            v1: row.verse,
            c2: row.chapter,
            v2: row.verse,
            rows: [row],
          }
        }
      } else if (current) {
        raw.push(current)
        current = null
      }
    }
    if (current) raw.push(current)
  }

  // Split long consecutive speeches at named pericope starts (same chapter).
  const split = []
  for (const block of raw) {
    const namedInBlock = NAMED.filter(
      (n) =>
        n.book === block.book &&
        n.c1 === block.c1 &&
        n.c1 === n.c2 &&
        n.c1 === block.c2 &&
        n.v1 >= block.v1 &&
        n.v2 <= block.v2,
    ).sort((a, b) => a.v1 - b.v1)

    if (namedInBlock.length === 0) {
      split.push(block)
      continue
    }

    let cursor = block.v1
    const ends = new Set()
    for (const n of namedInBlock) {
      if (n.v1 > cursor) {
        split.push(sliceBlock(block, cursor, n.v1 - 1))
      }
      split.push(sliceBlock(block, n.v1, n.v2))
      ends.add(n.v2)
      cursor = n.v2 + 1
    }
    if (cursor <= block.v2) split.push(sliceBlock(block, cursor, block.v2))
  }

  const sayings = []
  const usedNamed = new Set()
  for (const block of split.filter(Boolean)) {
    if (!block.rows.length) continue
    const quote = block.rows
      .map((r) => r.wj.join(' '))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (!quote) continue

    const named = NAMED.find(
      (n) =>
        n.book === block.book &&
        n.c1 === block.c1 &&
        n.v1 === block.v1 &&
        n.c2 === block.c2 &&
        n.v2 === block.v2,
    )
    if (named) usedNamed.add(named.id)

    const bookName = BOOK_NAME[block.book]
    const era = ERA_OF[block.book] ?? 'epistles'

    const id = named?.id ?? `${block.book.toLowerCase()}-${block.c1}-${block.v1}${
      block.v1 === block.v2 && block.c1 === block.c2 ? '' : `-${block.c2}-${block.v2}`
    }`

    const settingRow = verseIndex.find(
      (r) =>
        r.book === block.book &&
        r.chapter === block.c1 &&
        r.verse === block.v1 - 1 &&
        r.wj.length === 0,
    )

    sayings.push({
      id,
      title: named?.title ?? titleFromQuote(quote),
      named: Boolean(named),
      bookId: block.book,
      bookName,
      era,
      theme: inferTheme(named?.title ?? '', quote, block.book, named),
      passage: {
        bookId: block.book,
        bookName,
        chapterNumber: String(block.c1),
        verses: block.c1 === block.c2 ? [block.v1, block.v2] : [block.v1, block.v1],
        label: labelOf(bookName, block.c1, block.v1, block.c2, block.v2),
        endChapter: block.c2 !== block.c1 ? String(block.c2) : undefined,
        endVerse: block.c2 !== block.c1 ? block.v2 : undefined,
      },
      quote,
      quoteRef: labelOf(bookName, block.c1, block.v1, block.c2, block.v2),
      setting: settingRow ? settingRow.text : undefined,
      familiarityRank: named?.rank,
      parallelGroupId: named?.parallelGroupId,
      verseCount: block.rows.length,
      wordCount: quote.split(/\s+/).filter(Boolean).length,
    })
  }

  // Multi-chapter named units (Sermon already split). High priestly prayer is one chapter.
  const missing = NAMED.filter((n) => !usedNamed.has(n.id) && n.c1 !== n.c2)
  if (missing.length) {
    console.warn('Multi-chapter named units not auto-applied:', missing.map((n) => n.id).join(', '))
  }

  return sayings
}

function sliceBlock(block, v1, v2) {
  if (v1 > v2) return null
  const rows = block.rows.filter((r) => r.verse >= v1 && r.verse <= v2)
  if (!rows.length) return null
  return {
    book: block.book,
    c1: block.c1,
    v1,
    c2: block.c2,
    v2,
    rows,
  }
}

main()
