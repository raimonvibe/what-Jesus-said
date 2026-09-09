/**
 * How every tour builds a reference to a place in scripture. Kept separate from
 * any one tour's content so the data modules and the reader agree on the shape.
 */

/** A scripture location a tour can send the reader to. */
export interface PassageRef {
  bookId: string
  bookName: string
  chapterNumber: string
  /** Inclusive verse range to highlight in the reader. */
  verses: [number, number]
  /** Human label, e.g. "Exodus 14:21–31". */
  label: string
}

export function ref(
  bookId: string,
  bookName: string,
  chapterNumber: string,
  from: number,
  to: number,
): PassageRef {
  return {
    bookId,
    bookName,
    chapterNumber,
    verses: [from, to],
    label: `${bookName} ${chapterNumber}:${from === to ? from : `${from}–${to}`}`,
  }
}

/** Chapter id used by the Bible data, e.g. "EXO.14". */
export function chapterIdOf(passage: PassageRef): string {
  return `${passage.bookId}.${passage.chapterNumber}`
}
