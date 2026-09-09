import type { PassageRef } from '@/lib/passages'

/** Where a saying sits in the New Testament. */
export type Era =
  | 'matthew'
  | 'mark'
  | 'luke'
  | 'john'
  | 'acts'
  | 'epistles'
  | 'revelation'

/** Coarse grouping for the "By theme" reading path. */
export type Theme =
  | 'teaching'
  | 'parable'
  | 'dialogue'
  | 'promise'
  | 'commission'
  | 'prophecy'
  | 'prayer'
  | 'iam'

export interface Saying {
  id: string
  title: string
  bookId: string
  bookName: string
  era: Era
  theme: Theme
  passage: PassageRef
  /** Verbatim WEB words of Jesus in this range, joined in reading order. */
  quote: string
  quoteRef: string
  /** The narrator verse immediately before, when it is in the same chapter. */
  setting?: string
  familiarityRank?: number
  parallelGroupId?: string
  verseCount: number
  wordCount: number
  named?: boolean
}

export const THEME_LABELS: Record<Theme, string> = {
  teaching: 'Teaching',
  parable: 'Parables',
  dialogue: 'Short replies',
  promise: 'Promises',
  commission: 'Commissions',
  prophecy: 'Prophecy',
  prayer: 'Prayers',
  iam: 'I am',
}

export const ERA_LABELS: Record<Era, string> = {
  matthew: 'Matthew',
  mark: 'Mark',
  luke: 'Luke',
  john: 'John',
  acts: 'Acts',
  epistles: 'Quoted in the letters',
  revelation: 'Revelation',
}

export const ERA_ORDER: Era[] = [
  'matthew',
  'mark',
  'luke',
  'john',
  'acts',
  'epistles',
  'revelation',
]
