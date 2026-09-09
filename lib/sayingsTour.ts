/**
 * Guided tour of fourteen well-known things Jesus said.
 *
 * The catalog is the source of truth for the words themselves. This file
 * only owns the order and the framing cards. Every pull quote on a saying
 * card is verbatim World English Bible, taken from official \wj markup.
 */

import { chapterIdOf, ref, type PassageRef } from './passages'
import { narrationForSaying, sayingById } from './sayings/catalog'
import type { Saying } from './sayings/types'

export type SectionId = 'gospels' | 'witness'

function tourSaying(id: string): Saying {
  const saying = sayingById(id)
  if (!saying) {
    throw new Error(`Tour step "${id}" has no entry in the sayings catalog.`)
  }
  return saying
}

export interface TourSection {
  id: SectionId
  title: string
  subtitle: string
  intro: string
  sayings: Saying[]
  synthesis: {
    heading: string
    patterns: string[]
    reflection: string
    passage: PassageRef
    quote: string
  }
}

export const TOUR_SECTIONS: TourSection[] = [
  {
    id: 'gospels',
    title: 'In the Gospels',
    subtitle: 'Seven sayings from Matthew, Luke and John',
    intro:
      'The four Gospels keep the words Jesus spoke while He walked Galilee and Judea. These seven are among the best known: blessings, a prayer, a command to love enemies, an invitation to rest, two parables, and the sentence that most people can quote from memory.',
    sayings: [
      tourSaying('beatitudes-mat'),
      tourSaying('lords-prayer-mat'),
      tourSaying('love-your-enemies-mat'),
      tourSaying('come-to-me'),
      tourSaying('good-samaritan'),
      tourSaying('prodigal-son'),
      tourSaying('god-so-loved'),
    ],
    synthesis: {
      heading: 'What these seven have in common',
      patterns: [
        'He speaks to ordinary people — the poor in spirit, a lawyer, a crowd on a hill — not to a court or a school.',
        'The words are short enough to remember, and large enough to live inside for years.',
        'Each saying opens the passage beside you, so you can read the sentence in the chapter it belongs to.',
      ],
      reflection:
        'Nothing here is a paraphrase. The card quotes the World English Bible; the reader shows the same words, marked as the words of Jesus.',
      passage: ref('MAT', 'Matthew', '24', 35, 35),
      quote: 'Heaven and earth will pass away, but my words will not pass away.',
    },
  },
  {
    id: 'witness',
    title: 'I am, and after',
    subtitle: 'Seven sayings from John, the cross, the commission, and Revelation',
    intro:
      'John records Jesus naming Himself. Luke records words from the cross. Matthew ends with a commission. Revelation still has Him speaking to the churches. These seven keep that later voice in view.',
    sayings: [
      tourSaying('i-am-bread'),
      tourSaying('i-am-resurrection'),
      tourSaying('i-am-way'),
      tourSaying('new-commandment'),
      tourSaying('father-forgive-them'),
      tourSaying('great-commission'),
      tourSaying('behold-i-stand'),
    ],
    synthesis: {
      heading: 'The same voice',
      patterns: [
        'The “I am” sayings in John are claims, not slogans — bread, resurrection, way, truth, life.',
        'The cross does not silence Him. Luke keeps “Father, forgive them.”',
        'The last word in this tour is an invitation, not a closing of the door.',
      ],
      reflection:
        'From a hillside in Matthew to a door in Revelation, the catalog is still the same person speaking. The reader will show you the verse, not a summary of it.',
      passage: ref('JHN', 'John', '6', 68, 68),
      quote:
        'Simon Peter answered him, “Lord, to whom would we go? You have the words of eternal life.”',
    },
  },
]

export const SAYING_INTRO = {
  title: 'What Jesus said',
  subtitle: 'Fourteen sayings, with the passage open beside you',
  body: [
    'This tour walks fourteen of the best-known things Jesus said in the New Testament. At each stop, the reader behind this panel opens the chapter and marks His words.',
    'The full catalog has every saying the World English Bible marks as the words of Jesus — the Gospels, a few quotations in Acts and the letters, and Revelation. Nothing in the catalog is written from memory.',
    'Red-letter boundaries follow the official WEB markup. That markup is an editorial convention, not part of the original Greek. John 3:16 is included because the WEB marks it that way.',
  ],
  duration: 'About 12–15 minutes · leave whenever you like',
}

export const SAYING_OUTRO = {
  title: 'The words are still there',
  body: [
    'Fourteen sayings is only a door into the catalog. The New Testament box on the home page has all 27 books; What Jesus Said has every marked speech.',
    'If a sentence here stayed with you, open its chapter and read the verses around it. The words were spoken in a place, to someone, in a story.',
  ],
  passage: ref('MAT', 'Matthew', '7', 24, 24),
  quote:
    'Everyone therefore who hears these words of mine and does them, I will liken him to a wise man who built his house on a rock.',
  furtherReading: [
    ref('JHN', 'John', '1', 14, 14),
    ref('JHN', 'John', '14', 6, 6),
    ref('REV', 'Revelation', '3', 20, 20),
  ],
}

export type SayingTourStep =
  | { kind: 'welcome' }
  | { kind: 'section-intro'; sectionIndex: number }
  | { kind: 'saying'; sectionIndex: number; sayingIndex: number }
  | { kind: 'section-synthesis'; sectionIndex: number }
  | { kind: 'outro' }

export const SAYING_STEPS: SayingTourStep[] = [
  { kind: 'welcome' },
  ...TOUR_SECTIONS.flatMap((section, sectionIndex) => [
    { kind: 'section-intro' as const, sectionIndex },
    ...section.sayings.map((_, sayingIndex) => ({
      kind: 'saying' as const,
      sectionIndex,
      sayingIndex,
    })),
    { kind: 'section-synthesis' as const, sectionIndex },
  ]),
  { kind: 'outro' },
]

export function firstStepOfSection(sectionIndex: number): number {
  return SAYING_STEPS.findIndex(
    (s) => s.kind === 'section-intro' && s.sectionIndex === sectionIndex,
  )
}

export function sectionIndexOfStep(step: SayingTourStep): number | null {
  return step.kind === 'welcome' || step.kind === 'outro' ? null : step.sectionIndex
}

export function passageOfSayingStep(step: SayingTourStep): PassageRef | null {
  switch (step.kind) {
    case 'saying':
      return TOUR_SECTIONS[step.sectionIndex].sayings[step.sayingIndex].passage
    case 'section-synthesis':
      return TOUR_SECTIONS[step.sectionIndex].synthesis.passage
    case 'outro':
      return SAYING_OUTRO.passage
    default:
      return null
  }
}

export { chapterIdOf }

export function narrationForSayingStep(step: SayingTourStep): string[] {
  switch (step.kind) {
    case 'welcome':
      return [SAYING_INTRO.title, SAYING_INTRO.subtitle, ...SAYING_INTRO.body]

    case 'section-intro': {
      const section = TOUR_SECTIONS[step.sectionIndex]
      return [
        `Section ${step.sectionIndex + 1} of ${TOUR_SECTIONS.length}. ${section.title}, ${section.subtitle}.`,
        section.intro,
      ]
    }

    case 'saying': {
      const saying =
        TOUR_SECTIONS[step.sectionIndex].sayings[step.sayingIndex]
      return narrationForSaying(saying)
    }

    case 'section-synthesis': {
      const { synthesis } = TOUR_SECTIONS[step.sectionIndex]
      return [
        synthesis.heading,
        ...synthesis.patterns,
        synthesis.reflection,
        `${synthesis.quote} ${synthesis.passage.label}.`,
      ]
    }

    case 'outro':
      return [
        SAYING_OUTRO.title,
        ...SAYING_OUTRO.body,
        `${SAYING_OUTRO.quote} ${SAYING_OUTRO.passage.label}.`,
      ]
  }
}

export interface SectionAccent {
  badge: string
  rule: string
  chip: string
  dot: string
}

export const TOUR_ACCENTS: Record<SectionId, SectionAccent> = {
  gospels: {
    badge:
      'bg-amber-100 text-amber-900 ring-amber-400/50 dark:bg-amber-950/60 dark:text-amber-100 dark:ring-amber-400/40',
    rule: 'border-amber-400/60',
    chip: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100',
    dot: 'bg-amber-400',
  },
  witness: {
    badge:
      'bg-sky-100 text-sky-900 ring-sky-400/50 dark:bg-sky-950/60 dark:text-sky-100 dark:ring-sky-400/40',
    rule: 'border-sky-400/60',
    chip: 'bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100',
    dot: 'bg-sky-400',
  },
}
