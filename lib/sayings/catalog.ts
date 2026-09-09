import type { PassageRef } from '@/lib/passages'
import rawSayings from '@/data/sayings.json'
import { ERA_ORDER, type Era, type Saying, type Theme } from './types'

type RawSaying = Omit<Saying, 'passage'> & {
  passage: PassageRef & { endChapter?: string; endVerse?: number }
}

const LOADED: Saying[] = (rawSayings as RawSaying[]).map((row) => ({
  ...row,
  passage: {
    bookId: row.passage.bookId,
    bookName: row.passage.bookName,
    chapterNumber: row.passage.chapterNumber,
    verses: row.passage.verses,
    label: row.passage.label,
  },
}))

/** Bible order — this is the default reading order. */
export const SAYINGS: Saying[] = LOADED

export const SAYING_COUNT = SAYINGS.length

const BY_ID = new Map(SAYINGS.map((s) => [s.id, s]))

export function sayingById(id: string): Saying | undefined {
  return BY_ID.get(id)
}

export function parallelsOf(saying: Saying): Saying[] {
  if (!saying.parallelGroupId) return []
  return SAYINGS.filter(
    (s) => s.parallelGroupId === saying.parallelGroupId && s.id !== saying.id,
  )
}

export function byFamiliarity(sayings: Saying[] = SAYINGS): Saying[] {
  const ranked = sayings
    .filter((s) => s.familiarityRank != null)
    .sort((a, b) => a.familiarityRank! - b.familiarityRank!)
  const rest = sayings.filter((s) => s.familiarityRank == null)
  return [...ranked, ...rest]
}

export function startHere(limit = 25): Saying[] {
  return SAYINGS.filter((s) => s.familiarityRank != null)
    .sort((a, b) => a.familiarityRank! - b.familiarityRank!)
    .slice(0, limit)
}

export function byTheme(theme: Theme): Saying[] {
  return SAYINGS.filter((s) => s.theme === theme)
}

export function byEra(era: Era): Saying[] {
  return SAYINGS.filter((s) => s.era === era)
}

export function populatedEras(): Era[] {
  return ERA_ORDER.filter((era) => SAYINGS.some((s) => s.era === era))
}

export function narrationForSaying(s: Saying): string[] {
  return [
    `${s.title}.`,
    s.setting ? `Just before this: ${s.setting}` : '',
    `Reading ${s.passage.label}.`,
    s.quote,
  ].filter(Boolean)
}

export function searchSayings(query: string): Saying[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return SAYINGS.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.passage.label.toLowerCase().includes(q) ||
      s.quote.toLowerCase().includes(q) ||
      (s.setting ?? '').toLowerCase().includes(q),
  )
}
