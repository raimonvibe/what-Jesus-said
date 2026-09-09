'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Book,
  BookOpen,
  Filter,
  Search,
  X,
} from 'lucide-react'
import {
  type BibleData,
  type SearchResult,
  getTestament,
  highlightMatch,
  MAX_SEARCH_RESULTS,
  searchBible,
} from '@/lib/bibleSearch'

interface AdvancedSearchProps {
  bibleData: BibleData
  isOpen: boolean
  onClose: () => void
  onSelectResult: (result: SearchResult) => void
}

type TestamentFilter = 'all' | 'new'
type MatchMode = 'phrase' | 'all' | 'any'

export default function AdvancedSearch({
  bibleData,
  isOpen,
  onClose,
  onSelectResult,
}: AdvancedSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [testament, setTestament] = useState<TestamentFilter>('all')
  const [bookId, setBookId] = useState<string>('')
  const [matchMode, setMatchMode] = useState<MatchMode>('phrase')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [jesusOnly, setJesusOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 250)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const filteredBooks = useMemo(() => {
    if (testament === 'all') return bibleData.books
    return bibleData.books.filter((book) => getTestament(book.id) === testament)
  }, [bibleData.books, testament])

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return []

    return searchBible(bibleData, {
      query: debouncedQuery,
      testament,
      bookId: bookId || null,
      matchMode,
      caseSensitive,
      wordsOfJesusOnly: jesusOnly,
    })
  }, [bibleData, debouncedQuery, testament, bookId, matchMode, caseSensitive, jesusOnly])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="advanced-search-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close search"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden card-surface flex flex-col shadow-2xl">
        <div className="p-4 md:p-6 border-b border-pine-600 dark:border-ocean-700">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2
                id="advanced-search-title"
                className="text-2xl md:text-3xl font-display font-bold text-pine-100 dark:text-ocean-50"
              >
                Advanced Search
              </h2>
              <p className="text-sm text-pine-300 dark:text-ocean-400 font-sans mt-1">
                Search across all {bibleData.books.length} books and{' '}
                {bibleData.books.reduce((sum, book) => sum + book.chapters.length, 0)} chapters
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg btn-surface hover:shadow-md"
              aria-label="Close search panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pine-300 dark:text-ocean-300" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search scripture… e.g. love your enemies"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-pine-600 dark:border-ocean-600 bg-pine-900/60 dark:bg-ocean-900/60 text-pine-50 dark:text-ocean-100 font-sans text-base focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              autoComplete="off"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-sans transition-all ${
                showFilters ? 'bg-selection-gradient text-white' : 'btn-surface hover:shadow-md'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            {debouncedQuery && (
              <span className="text-sm font-sans text-pine-300 dark:text-ocean-400">
                {results.length} result{results.length !== 1 ? 's' : ''}
                {results.length >= MAX_SEARCH_RESULTS ? ` (showing first ${MAX_SEARCH_RESULTS})` : ''}
              </span>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-pine-800/60 dark:bg-ocean-900/40 border border-pine-600/70 dark:border-ocean-700/70">
              <label className="block">
                <span className="text-sm font-sans font-medium text-pine-200 dark:text-ocean-300 mb-1 block">
                  Testament
                </span>
                <select
                  value={testament}
                  onChange={(event) => {
                    setTestament(event.target.value as TestamentFilter)
                    setBookId('')
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-pine-600 dark:border-ocean-600 bg-pine-900/60 dark:bg-ocean-900/60 text-pine-50 dark:text-ocean-100 font-sans text-sm"
                >
                  <option value="all">All New Testament</option>
                  <option value="new">New Testament</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-sans font-medium text-pine-200 dark:text-ocean-300 mb-1 block">
                  Book
                </span>
                <select
                  value={bookId}
                  onChange={(event) => setBookId(event.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-pine-600 dark:border-ocean-600 bg-pine-900/60 dark:bg-ocean-900/60 text-pine-50 dark:text-ocean-100 font-sans text-sm"
                >
                  <option value="">All books</option>
                  {filteredBooks.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-sans font-medium text-pine-200 dark:text-ocean-300 mb-1 block">
                  Match mode
                </span>
                <select
                  value={matchMode}
                  onChange={(event) => setMatchMode(event.target.value as MatchMode)}
                  className="w-full px-3 py-2 rounded-lg border border-pine-600 dark:border-ocean-600 bg-pine-900/60 dark:bg-ocean-900/60 text-pine-50 dark:text-ocean-100 font-sans text-sm"
                >
                  <option value="phrase">Exact phrase</option>
                  <option value="all">All words</option>
                  <option value="any">Any word</option>
                </select>
              </label>

              <label className="flex items-center gap-3 self-end pb-2">
                <input
                  type="checkbox"
                  checked={jesusOnly}
                  onChange={(event) => setJesusOnly(event.target.checked)}
                  className="w-4 h-4 rounded border-pine-500 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm font-sans text-pine-200 dark:text-ocean-300">
                  Words of Jesus only
                </span>
              </label>

              <label className="flex items-center gap-3 self-end pb-2">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(event) => setCaseSensitive(event.target.checked)}
                  className="w-4 h-4 rounded border-pine-500 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm font-sans text-pine-200 dark:text-ocean-300">
                  Case sensitive
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-2 md:p-4">
          {!debouncedQuery.trim() && (
            <div className="text-center py-12 px-4">
              <BookOpen className="w-12 h-12 text-pine-300 dark:text-ocean-300 mx-auto mb-4" />
              <p className="text-pine-300 dark:text-ocean-400 font-sans">
                Type a word or phrase to search the New Testament.
              </p>
            </div>
          )}

          {debouncedQuery.trim() && results.length === 0 && (
            <div className="text-center py-12 px-4">
              <p className="text-pine-200 dark:text-ocean-300 font-sans">
                No verses found for &ldquo;{debouncedQuery}&rdquo;.
              </p>
              <p className="text-sm text-pine-300 dark:text-ocean-300 font-sans mt-2">
                Try a different phrase, switch to &ldquo;Any word&rdquo;, or broaden your filters.
              </p>
            </div>
          )}

          <ul className="space-y-2">
            {results.map((result) => (
              <li key={`${result.chapterId}-${result.verseNumber}`}>
                <button
                  type="button"
                  onClick={() => onSelectResult(result)}
                  className="w-full text-left p-4 rounded-xl btn-surface hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Book className="w-4 h-4 text-amber-700 dark:text-amber-500 shrink-0" />
                    <span className="font-display font-semibold text-pine-100 dark:text-ocean-100 group-hover:text-amber-800 dark:group-hover:text-amber-400">
                      {result.reference}
                    </span>
                    <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-pine-700/70 dark:bg-ocean-800/70 text-pine-300 dark:text-ocean-400">
                      NT
                    </span>
                  </div>
                  <p
                    className="text-sm md:text-base leading-relaxed text-pine-200 dark:text-ocean-300 font-serif line-clamp-3"
                    dangerouslySetInnerHTML={{
                      __html: highlightMatch(result.text, debouncedQuery, caseSensitive),
                    }}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
