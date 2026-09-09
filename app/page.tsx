import newTestamentData from '@/data/new-testament-data.json'
import BibleApp, { type BibleIndex } from '@/components/BibleApp'

/**
 * Server component. It hands the client app a text-free index of every book and
 * chapter so the book grid is server-rendered and crawlable, while the verse
 * text still streams in from /api/bible-data afterwards.
 */
const bookIndex: BibleIndex = {
  bibleName: newTestamentData.bibleName,
  books: newTestamentData.books.map((book) => ({
    id: book.id,
    name: book.name,
    abbreviation: book.abbreviation,
    chapters: book.chapters.map((chapter) => ({
      id: chapter.id,
      number: chapter.number,
      reference: chapter.reference,
    })),
  })),
}

export default function Home() {
  return <BibleApp bookIndex={bookIndex} />
}
