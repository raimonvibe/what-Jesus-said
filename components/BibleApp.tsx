'use client'

import { useState, useEffect, useCallback } from 'react'
import BookSelector from '@/components/BookSelector'
import ChapterSelector from '@/components/ChapterSelector'
import BibleReader from '@/components/BibleReader'
import ThemeToggle from '@/components/ThemeToggle'
import { BookMarked, RotateCcw, Search, TriangleAlert } from 'lucide-react'
import AdvancedSearch from '@/components/AdvancedSearch'
import type { SearchResult } from '@/lib/bibleSearch'
import SiteFooter from '@/components/SiteFooter'
import GuidedTour, { type TourTarget } from '@/components/GuidedTour'

interface Chapter {
  id: string
  number: string
  reference: string
  content: string
}

interface Book {
  id: string
  name: string
  abbreviation: string
  chapters: Chapter[]
}

interface BibleData {
  bibleName: string
  bibleId: string
  books: Book[]
}

/**
 * Book and chapter listing without verse text. Rendered on the server so the
 * book grid — and every book and chapter name in it — is in the initial HTML
 * rather than appearing only after the 4.5 MB text payload arrives.
 */
export interface BibleIndex {
  bibleName: string
  books: Array<{
    id: string
    name: string
    abbreviation: string
    chapters: Array<{ id: string; number: string; reference: string }>
  }>
}

export default function BibleApp({ bookIndex }: { bookIndex: BibleIndex }) {
  const [bibleData, setBibleData] = useState<BibleData | null>(null)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [view, setView] = useState<'books' | 'chapters' | 'reader'>('books')
  const [searchOpen, setSearchOpen] = useState(false)
  const [tourVerses, setTourVerses] = useState<[number, number] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  /** Bumped by "Try again" to re-run the load effect. */
  const [loadAttempt, setLoadAttempt] = useState(0)

  // The guided tour drives the reader: it opens a chapter and spotlights verses.
  const handleTourNavigate = useCallback((target: TourTarget | null) => {
    if (!target) {
      setTourVerses(null)
      return
    }
    setSelectedBookId(target.bookId)
    setSelectedChapterId(target.chapterId)
    setTourVerses(target.verses)
    setView('reader')
    setSearchOpen(false)
  }, [])

  useEffect(() => {
    // Load the full text; the index above already covers navigation. A failure
    // here has to be visible: without the text, opening any chapter stalls, and
    // a silent console error just leaves a spinner turning forever.
    let cancelled = false
    setLoadError(null)

    fetch('/api/bible-data')
      .then((res) => {
        if (!res.ok) throw new Error(`the server returned ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setBibleData(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        console.error('Failed to load Bible data:', err)
        setLoadError(
          err instanceof Error ? err.message : 'the connection was interrupted',
        )
      })

    return () => {
      cancelled = true
    }
  }, [loadAttempt])

  const readAloudStopKey = `${view}-${selectedBookId ?? ''}-${selectedChapterId ?? ''}`

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('read-aloud-stop'))
  }, [readAloudStopKey])

  // Navigation runs off the index so it works before the text has loaded;
  // reading needs the full book.
  const navBooks = bibleData?.books ?? bookIndex.books

  const selectedNavBook = selectedBookId
    ? navBooks.find((b) => b.id === selectedBookId)
    : null

  const selectedBook =
    bibleData && selectedBookId
      ? bibleData.books.find((b) => b.id === selectedBookId)
      : null

  const selectedChapter =
    selectedBook && selectedChapterId
      ? selectedBook.chapters.find((c) => c.id === selectedChapterId)
      : null

  const handleSelectBook = (bookId: string) => {
    setSelectedBookId(bookId)
    setSelectedChapterId(null)
    setTourVerses(null)
    setView('chapters')
  }

  const handleSelectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId)
    setTourVerses(null)
    setView('reader')
  }

  const handleBackToBooks = () => {
    setSelectedBookId(null)
    setSelectedChapterId(null)
    setTourVerses(null)
    setView('books')
  }

  const handleBackToChapters = () => {
    setSelectedChapterId(null)
    setTourVerses(null)
    setView('chapters')
  }

  const handleSelectSearchResult = (result: SearchResult) => {
    setSelectedBookId(result.bookId)
    setSelectedChapterId(result.chapterId)
    setTourVerses(null)
    setView('reader')
    setSearchOpen(false)
  }

  const handlePrevChapter = () => {
    if (!selectedBook || !selectedChapterId || !bibleData) return
    setTourVerses(null)
    const currentChapterIndex = selectedBook.chapters.findIndex((c) => c.id === selectedChapterId)

    if (currentChapterIndex > 0) {
      // Go to previous chapter in same book
      setSelectedChapterId(selectedBook.chapters[currentChapterIndex - 1].id)
    } else {
      // Go to last chapter of previous book
      const currentBookIndex = bibleData.books.findIndex((b) => b.id === selectedBook.id)
      if (currentBookIndex > 0) {
        const prevBook = bibleData.books[currentBookIndex - 1]
        setSelectedBookId(prevBook.id)
        setSelectedChapterId(prevBook.chapters[prevBook.chapters.length - 1].id)
      }
    }
  }

  const handleNextChapter = () => {
    if (!selectedBook || !selectedChapterId || !bibleData) return
    setTourVerses(null)
    const currentChapterIndex = selectedBook.chapters.findIndex((c) => c.id === selectedChapterId)

    if (currentChapterIndex < selectedBook.chapters.length - 1) {
      // Go to next chapter in same book
      setSelectedChapterId(selectedBook.chapters[currentChapterIndex + 1].id)
    } else {
      // Go to first chapter of next book
      const currentBookIndex = bibleData.books.findIndex((b) => b.id === selectedBook.id)
      if (currentBookIndex < bibleData.books.length - 1) {
        const nextBook = bibleData.books[currentBookIndex + 1]
        setSelectedBookId(nextBook.id)
        setSelectedChapterId(nextBook.chapters[0].id)
      }
    }
  }

  const getCurrentChapterIndex = () => {
    if (!selectedBook || !selectedChapterId) return -1
    return selectedBook.chapters.findIndex((c) => c.id === selectedChapterId)
  }

  const hasPrev = (() => {
    if (!selectedBook || !bibleData) return false
    const currentChapterIndex = getCurrentChapterIndex()
    const currentBookIndex = bibleData.books.findIndex((b) => b.id === selectedBook.id)
    return currentChapterIndex > 0 || currentBookIndex > 0
  })()

  const hasNext = (() => {
    if (!selectedBook || !bibleData) return false
    const currentChapterIndex = getCurrentChapterIndex()
    const currentBookIndex = bibleData.books.findIndex((b) => b.id === selectedBook.id)
    return currentChapterIndex < selectedBook.chapters.length - 1 || currentBookIndex < bibleData.books.length - 1
  })()

  return (
    <div className="min-h-screen py-6 md:py-10 px-4 md:px-6 lg:px-8 max-[959px]:px-[max(1rem,env(safe-area-inset-left,0px))] max-[959px]:pr-[max(1rem,env(safe-area-inset-right,0px))]">
      {/* Floats over the reading column, so it carries its own backdrop rather
          than letting verse text run between the two controls. */}
      <div
        className="tour-safe-right fixed top-4 z-40 flex items-center gap-2 rounded-2xl bg-pine-900/75 p-1.5 backdrop-blur-sm dark:bg-ocean-950/75"
        data-read-aloud-ignore
      >
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          disabled={!bibleData}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg font-sans text-sm ${
            bibleData ? 'btn-surface hover:shadow-md' : 'btn-surface-muted'
          }`}
          aria-label={
            bibleData
              ? 'Open advanced search'
              : loadError
                ? 'Search unavailable — the Bible text did not load'
                : 'Search is still loading'
          }
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search</span>
        </button>
        <ThemeToggle />
      </div>

      {bibleData && (
        <AdvancedSearch
          bibleData={bibleData}
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelectResult={handleSelectSearchResult}
        />
      )}

      <div className="reader-container max-w-7xl mx-auto">
        {/* Header */}
        <header data-read-aloud-ignore className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <BookMarked className="w-10 h-10 md:w-12 md:h-12 text-pine-200 dark:text-ocean-300" />
          </div>
          {/* In the reader the chapter title is the page's h1, so the site
              title steps down to avoid two top-level headings. */}
          {view === 'reader' ? (
            <p className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-pine-100 dark:text-ocean-50 mb-3">
              What Jesus Said
            </p>
          ) : (
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-pine-100 dark:text-ocean-50 mb-3">
              What Jesus Said
            </h1>
          )}
          <p className="text-pine-300 dark:text-ocean-300 font-sans text-base md:text-lg max-w-2xl mx-auto">
            Read the New Testament from the {bookIndex.bibleName}, and everything
            Jesus said, with the passage open beside you.
          </p>
        </header>

        {/* Main Content */}
        <div className="mb-8">
          {view === 'books' && (
            <BookSelector
              books={navBooks}
              selectedBookId={selectedBookId}
              onSelectBook={handleSelectBook}
            />
          )}

          {view === 'chapters' && selectedNavBook && (
            <ChapterSelector
              bookName={selectedNavBook.name}
              chapters={selectedNavBook.chapters}
              selectedChapterId={selectedChapterId}
              onSelectChapter={handleSelectChapter}
              onBack={handleBackToBooks}
            />
          )}

          {view === 'reader' &&
            (selectedBook && selectedChapter ? (
              <BibleReader
                bookName={selectedBook.name}
                chapter={selectedChapter}
                onBack={handleBackToChapters}
                onBackToBooks={handleBackToBooks}
                onPrevChapter={handlePrevChapter}
                onNextChapter={handleNextChapter}
                hasPrev={hasPrev}
                hasNext={hasNext}
                highlightVerses={tourVerses}
              />
            ) : loadError ? (
              <div className="card-surface p-10 text-center" role="alert">
                <TriangleAlert className="w-12 h-12 text-accent mx-auto mb-4" />
                <p className="text-pine-50 dark:text-ocean-50 font-sans font-medium mb-1">
                  The Bible text didn&rsquo;t load
                </p>
                <p className="text-pine-200 dark:text-ocean-200 font-sans text-sm mb-4">
                  Browsing still works, but {selectedNavBook?.name ?? 'this passage'}{' '}
                  needs the full text — {loadError}.
                </p>
                <button
                  type="button"
                  onClick={() => setLoadAttempt((n) => n + 1)}
                  className="btn-surface inline-flex min-h-10 items-center gap-1.5 rounded-xl px-4 font-sans text-sm font-medium hover:shadow-md"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden />
                  Try again
                </button>
              </div>
            ) : (
              <div className="card-surface p-10 text-center" aria-live="polite">
                <BookMarked className="w-12 h-12 text-pine-300 dark:text-ocean-400 mx-auto mb-4 animate-pulse" />
                <p className="text-pine-200 dark:text-ocean-200 font-sans">
                  Loading {selectedNavBook?.name ?? 'the passage'}…
                </p>
              </div>
            ))}
        </div>

        {/* Footer */}
        <SiteFooter
          bookCount={navBooks.length}
          chapterCount={navBooks.reduce(
            (sum, book) => sum + book.chapters.length,
            0
          )}
        />

      </div>

      <GuidedTour onNavigate={handleTourNavigate} />
    </div>
  )
}
