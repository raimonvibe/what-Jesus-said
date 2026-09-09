'use client'

import { useState } from 'react'
import { Book, MessageSquareQuote } from 'lucide-react'
import { SAYING_COUNT, startHere } from '@/lib/sayings/catalog'
import { openSayingsPanel } from '@/lib/sayings/paths'
import { iconFor } from '@/components/SayingCardBody'

type HomePane = 'bible' | 'sayings'

interface BookSelectorProps {
  books: Array<{ id: string; name: string; abbreviation: string; chapters: any[] }>
  selectedBookId: string | null
  onSelectBook: (bookId: string) => void
}

export default function BookSelector({ books, selectedBookId, onSelectBook }: BookSelectorProps) {
  const [homePane, setHomePane] = useState<HomePane>('bible')
  const featured = startHere(8)
  const chapterCount = books.reduce((sum, book) => sum + book.chapters.length, 0)

  const renderBookGrid = (booksList: typeof books) => (
    <div className="grid-books">
      {booksList.map((book) => (
        <button
          key={book.id}
          onClick={() => onSelectBook(book.id)}
          aria-label={`${book.name}, ${book.chapters.length} chapter${book.chapters.length !== 1 ? 's' : ''}`}
          aria-pressed={selectedBookId === book.id}
          className={`
            p-3 md:p-4 rounded-xl transition-all duration-200
            text-left hover:scale-105 hover:shadow-lg
            ${
              selectedBookId === book.id
                ? 'bg-selection-gradient text-white shadow-lg scale-105'
                : 'btn-surface hover:shadow-md'
            }
          `}
        >
          <div className="font-display font-semibold text-sm md:text-base mb-1">
            {book.name}
          </div>
          <div
            className={`text-xs ${
              selectedBookId === book.id
                ? 'text-pine-50 dark:text-ocean-100'
                : 'text-pine-300 dark:text-ocean-400'
            }`}
            aria-hidden="true"
          >
            {book.chapters.length} chapter{book.chapters.length !== 1 ? 's' : ''}
          </div>
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-8">
      <div
        role="tablist"
        aria-label="Choose New Testament or What Jesus Said"
        className="home-pane-switch min-[960px]:hidden"
      >
        <button
          type="button"
          role="tab"
          aria-selected={homePane === 'bible'}
          onClick={() => setHomePane('bible')}
        >
          <Book className="h-4 w-4" aria-hidden />
          New Testament
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={homePane === 'sayings'}
          onClick={() => setHomePane('sayings')}
        >
          <MessageSquareQuote className="h-4 w-4" aria-hidden />
          What Jesus Said
        </button>
      </div>

      <section
        data-read-aloud-block
        className={`card-surface w-full p-4 md:p-6 lg:p-8 ${
          homePane === 'bible' ? '' : 'max-[959px]:hidden'
        }`}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-pine-600 dark:border-ocean-700">
          <div className="flex items-center gap-3">
            <Book className="w-7 h-7 md:w-8 md:h-8 text-blue-700 dark:text-blue-400" aria-hidden="true" />
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-pine-100 dark:text-ocean-50">
                New Testament
              </h2>
              <p className="text-sm text-pine-300 dark:text-ocean-400 font-sans mt-1">
                {books.length} books · {chapterCount} chapters
              </p>
            </div>
          </div>
        </div>

        <nav data-read-aloud-ignore aria-label="New Testament book selection">
          {renderBookGrid(books)}
        </nav>
      </section>

      <section
        data-read-aloud-block
        className={`card-surface w-full p-4 md:p-6 lg:p-8 ${
          homePane === 'sayings' ? '' : 'max-[959px]:hidden'
        }`}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-pine-600 dark:border-ocean-700 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <MessageSquareQuote className="w-7 h-7 md:w-8 md:h-8 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-pine-100 dark:text-ocean-50">
                What Jesus Said
              </h2>
              <p className="text-sm text-pine-300 dark:text-ocean-400 font-sans mt-1">
                {SAYING_COUNT} sayings · His words, marked in the reader
              </p>
            </div>
          </div>
        </div>

        <p className="font-serif text-sm leading-relaxed text-pine-100 dark:text-ocean-200 mb-4 max-w-3xl">
          Every speech the World English Bible marks as the words of Jesus,
          from the Gospels through Acts, a few quotations in the letters, and
          Revelation. Open a saying and the chapter opens beside it on a wide
          screen, or from the Passage tab on a phone.
        </p>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 list-none p-0 m-0 mb-4">
          {featured.map((saying) => {
            const Icon = iconFor(saying.id)
            return (
              <li key={saying.id}>
                <button
                  type="button"
                  onClick={() => openSayingsPanel({ sayingId: saying.id })}
                  aria-label={`Open ${saying.title}, ${saying.passage.label}`}
                  className="flex w-full min-h-14 items-center justify-between gap-2 rounded-xl border border-pine-600/60 bg-pine-900/40 px-3.5 py-3 text-left transition-colors hover:border-pine-400 hover:bg-pine-800/70 dark:border-ocean-700/60 dark:bg-ocean-900/40 dark:hover:border-ocean-500"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Icon
                      className="h-4 w-4 shrink-0 text-pine-300 dark:text-ocean-400"
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-sans text-sm font-medium text-pine-50 dark:text-ocean-50">
                        {saying.title}
                      </span>
                      <span className="block font-sans text-[11px] text-pine-300 dark:text-ocean-400">
                        {saying.passage.label}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <button
          type="button"
          onClick={() => openSayingsPanel({ path: 'catalog' })}
          className="tour-next-btn inline-flex min-h-11 items-center justify-center rounded-xl px-4 font-sans text-sm font-semibold shadow-md"
        >
          Open the full catalog
        </button>
      </section>
    </div>
  )
}
