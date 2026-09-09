import jesusSpans from '@/data/words-of-jesus-spans.json'

export interface Chapter {
  id: string
  number: string
  reference: string
  content: string
}

export interface Book {
  id: string
  name: string
  abbreviation: string
  chapters: Chapter[]
}

export interface BibleData {
  bibleName: string
  bibleId: string
  books: Book[]
}

export type Testament = 'new'
export type MatchMode = 'phrase' | 'all' | 'any'

export interface SearchOptions {
  query: string
  testament: 'all' | Testament
  bookId: string | null
  matchMode: MatchMode
  caseSensitive: boolean
  wordsOfJesusOnly?: boolean
}

export interface SearchResult {
  bookId: string
  bookName: string
  testament: Testament
  chapterId: string
  chapterNumber: string
  reference: string
  verseNumber: number
  text: string
}

type JesusMarks = 'full' | string[]
const SPANS = jesusSpans as Record<string, Record<string, JesusMarks>>

export const MAX_SEARCH_RESULTS = 150

export function getTestament(_bookId: string): Testament {
  return 'new'
}

function jesusTextForVerse(
  chapterId: string,
  verseNumber: number,
  verseText: string,
): string | null {
  const marks = SPANS[chapterId]?.[String(verseNumber)]
  if (!marks) return null
  if (marks === 'full') return verseText
  return marks.join(' ')
}

function normalizeForCompare(text: string, caseSensitive: boolean): string {
  const trimmed = text.trim().replace(/\s+/g, ' ')
  return caseSensitive ? trimmed : trimmed.toLowerCase()
}

function matchesQuery(text: string, query: string, options: SearchOptions): boolean {
  const haystack = normalizeForCompare(text, options.caseSensitive)
  const needle = normalizeForCompare(query, options.caseSensitive)

  if (!needle) return false

  if (options.matchMode === 'phrase') {
    return haystack.includes(needle)
  }

  const words = needle.split(/\s+/).filter(Boolean)
  if (words.length === 0) return false

  if (options.matchMode === 'all') {
    return words.every((word) => haystack.includes(word))
  }

  return words.some((word) => haystack.includes(word))
}

function parseVerses(content: string): Array<{ verseNumber: number; text: string }> {
  const verses: Array<{ verseNumber: number; text: string }> = []
  const pattern = /\[(\d+)\]([\s\S]*?)(?=\[\d+\]|$)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(content)) !== null) {
    const text = match[2].trim()
    if (!text) continue

    verses.push({
      verseNumber: Number.parseInt(match[1], 10),
      text,
    })
  }

  if (verses.length === 0 && content.trim()) {
    verses.push({ verseNumber: 1, text: content.trim() })
  }

  return verses
}

export function searchBible(bibleData: BibleData, options: SearchOptions): SearchResult[] {
  const query = options.query.trim()
  if (!query) return []

  const results: SearchResult[] = []

  for (const book of bibleData.books) {
    const testament = getTestament(book.id)

    if (options.testament !== 'all' && options.testament !== testament) continue
    if (options.bookId && options.bookId !== book.id) continue

    for (const chapter of book.chapters) {
      const verses = parseVerses(chapter.content)

      for (const verse of verses) {
        const haystack = options.wordsOfJesusOnly
          ? jesusTextForVerse(chapter.id, verse.verseNumber, verse.text)
          : verse.text
        if (!haystack) continue
        if (!matchesQuery(haystack, query, options)) continue

        results.push({
          bookId: book.id,
          bookName: book.name,
          testament,
          chapterId: chapter.id,
          chapterNumber: chapter.number,
          reference: `${book.name} ${chapter.number}:${verse.verseNumber}`,
          verseNumber: verse.verseNumber,
          text: verse.text,
        })

        if (results.length >= MAX_SEARCH_RESULTS) {
          return results
        }
      }
    }
  }

  return results
}

export function highlightMatch(text: string, query: string, caseSensitive: boolean): string {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return text

  const flags = caseSensitive ? 'g' : 'gi'
  const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped.split(/\s+/).join('|')})`, flags)

  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}
