'use client'

import {
  BookOpen,
  MapPin,
  MessageSquareQuote,
  Quote,
  Sparkles,
} from 'lucide-react'
import { TOUR_ACCENTS } from '@/lib/sayingsTour'
import type { PassageRef } from '@/lib/passages'
import { parallelsOf } from '@/lib/sayings/catalog'
import { ERA_LABELS, THEME_LABELS, type Saying } from '@/lib/sayings/types'

type IconType = React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>

const ICONS: Record<string, IconType> = {
  'beatitudes-mat': Sparkles,
  'lords-prayer-mat': MessageSquareQuote,
  'come-to-me': Quote,
  'god-so-loved': Quote,
  'i-am-way': Quote,
  'great-commission': Quote,
}

export function iconFor(id: string): IconType {
  return ICONS[id] ?? Quote
}

interface Props {
  saying: Saying
  onOpenPassage: (passage: PassageRef) => void
  headingRef?: React.Ref<HTMLHeadingElement>
}

export default function SayingCardBody({
  saying,
  onOpenPassage,
  headingRef,
}: Props) {
  const accent =
    saying.era === 'matthew' ||
    saying.era === 'mark' ||
    saying.era === 'luke' ||
    saying.era === 'john'
      ? TOUR_ACCENTS.gospels
      : TOUR_ACCENTS.witness
  const parallels = parallelsOf(saying)
  const Icon = iconFor(saying.id)

  return (
    <div className="space-y-3.5">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-2 ${accent.badge}`}
          aria-hidden
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-xl font-bold text-pine-50 outline-none dark:text-ocean-50"
          >
            {saying.title}
          </h2>
          {saying.setting && (
            <p className="mt-1 flex items-start gap-1 font-sans text-xs leading-snug text-pine-300 dark:text-ocean-400">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              {saying.setting}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onOpenPassage(saying.passage)}
          title={`Open ${saying.passage.label}`}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans text-[11px] font-medium transition-opacity hover:opacity-80 ${accent.chip}`}
        >
          <BookOpen className="h-3 w-3" aria-hidden />
          {saying.passage.label}
        </button>
        <span className="inline-flex items-center rounded-full bg-pine-800/70 px-2.5 py-1 font-sans text-[11px] text-pine-200 dark:bg-ocean-900/60 dark:text-ocean-300">
          {THEME_LABELS[saying.theme]}
        </span>
        <span className="inline-flex items-center rounded-full bg-pine-800/70 px-2.5 py-1 font-sans text-[11px] text-pine-200 dark:bg-ocean-900/60 dark:text-ocean-300">
          {ERA_LABELS[saying.era]}
        </span>
      </div>

      {parallels.length > 0 && (
        <p className="font-sans text-[11px] text-pine-300 dark:text-ocean-400">
          Also in{' '}
          {parallels.map((p, i) => (
            <span key={p.id}>
              {i > 0 && ' · '}
              <button
                type="button"
                onClick={() => onOpenPassage(p.passage)}
                className="underline decoration-pine-500/70 underline-offset-2 hover:text-pine-50 dark:decoration-ocean-500/70 dark:hover:text-ocean-50"
              >
                {p.passage.bookName}
              </button>
            </span>
          ))}
        </p>
      )}

      <blockquote className="rounded-xl border-l-4 border-amber-400/80 bg-pine-900/40 px-3 py-2.5 dark:bg-ocean-950/40">
        <p className="words-of-jesus font-serif text-base leading-relaxed md:text-sm">
          {saying.quote}
        </p>
        <footer className="mt-2 font-sans text-[11px] text-pine-300 dark:text-ocean-400">
          {saying.quoteRef} · World English Bible
        </footer>
      </blockquote>
    </div>
  )
}
