'use client'

import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Compass,
  LayoutList,
  Library,
  Search,
  Sparkles,
  Tags,
  X,
} from 'lucide-react'
import SayingCardBody, { iconFor } from '@/components/SayingCardBody'
import type { PassageRef } from '@/lib/passages'
import { SAYING_COUNT } from '@/lib/sayings/catalog'
import {
  PATH_BLURBS,
  PATH_LABELS,
  eraOptions,
  themeOptions,
  sayingsFor,
  type PathId,
  type PathState,
} from '@/lib/sayings/paths'
import type { Saying } from '@/lib/sayings/types'

type IconType = React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>

const PATH_ICONS: Record<PathId, IconType> = {
  'start-here': Sparkles,
  theme: Tags,
  era: Library,
  catalog: LayoutList,
}

interface Props {
  state: PathState
  onChange: (next: PathState) => void
  /** The saying whose card is open, if any. */
  selected: Saying | null
  onSelect: (saying: Saying | null) => void
  onOpenPassage: (passage: PassageRef) => void
  /** Hand off from the end of Start Here into the full catalog. */
  onStartTour: () => void
}

export default function CatalogBrowser({
  state,
  onChange,
  selected,
  onSelect,
  onOpenPassage,
  onStartTour,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false)
  const list = useMemo(() => sayingsFor(state), [state])
  const themes = useMemo(() => themeOptions(), [])
  const eras = useMemo(() => eraOptions(), [])

  /* --- an open card ----------------------------------------------------- */

  if (selected) {
    // Name the list you came from, not the path that produced it: "Back to
    // Healings" beats "Back to by theme".
    const cameFrom =
      (state.path === 'theme' && state.theme
        ? themes.find((t) => t.id === state.theme)?.label
        : state.path === 'era' && state.era
          ? eras.find((e) => e.id === state.era)?.label
          : null) ?? PATH_LABELS[state.path]

    return (
      <div className="space-y-3.5">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="flex min-h-9 items-center gap-1 rounded-lg px-2 font-sans text-xs font-medium btn-surface hover:shadow-md"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to {cameFrom}
        </button>
        <SayingCardBody saying={selected} onOpenPassage={onOpenPassage} />
      </div>
    )
  }

  /* --- a list ----------------------------------------------------------- */

  const needsThemePick = state.path === 'theme' && !state.theme
  const needsEraPick = state.path === 'era' && !state.era

  return (
    <div className="space-y-3">
      {/* path switcher */}
      <div
        role="tablist"
        aria-label="How to read what Jesus said"
        className="flex flex-wrap gap-1"
      >
        {(Object.keys(PATH_LABELS) as PathId[]).map((id) => {
          const Icon = PATH_ICONS[id]
          const active = state.path === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() =>
                onChange({ ...state, path: id, theme: null, era: null, query: '' })
              }
              className={`flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 font-sans text-[11px] font-medium transition-colors ${
                active
                  ? 'bg-pine-100 text-pine-900 dark:bg-ocean-200 dark:text-ocean-950'
                  : 'bg-pine-800/70 text-pine-100 hover:bg-pine-700 dark:bg-ocean-900/60 dark:text-ocean-100 dark:hover:bg-ocean-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {PATH_LABELS[id]}
            </button>
          )
        })}
      </div>

      <p className="font-sans text-[11px] text-pine-300 dark:text-ocean-400">
        {PATH_BLURBS[state.path]}
      </p>

      {/* theme / era picker */}
      {needsThemePick && (
        <div className="flex flex-wrap gap-1.5">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ ...state, theme: t.id })}
              className="inline-flex items-center gap-1.5 rounded-full border border-pine-600 bg-pine-900/60 px-3 py-1.5 font-sans text-[11px] text-pine-100 transition-colors hover:border-pine-400 hover:bg-pine-800 dark:border-ocean-700 dark:bg-ocean-900/50 dark:text-ocean-200 dark:hover:border-ocean-500"
            >
              {t.label}
              <span className="text-pine-300 dark:text-ocean-400">{t.count}</span>
            </button>
          ))}
        </div>
      )}

      {needsEraPick && (
        <div className="flex flex-wrap gap-1.5">
          {eras.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onChange({ ...state, era: e.id })}
              className="inline-flex items-center gap-1.5 rounded-full border border-pine-600 bg-pine-900/60 px-3 py-1.5 font-sans text-[11px] text-pine-100 transition-colors hover:border-pine-400 hover:bg-pine-800 dark:border-ocean-700 dark:bg-ocean-900/50 dark:text-ocean-200 dark:hover:border-ocean-500"
            >
              {e.label}
              <span className="text-pine-300 dark:text-ocean-400">{e.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* sort + search, once there is a list to act on */}
      {!needsThemePick && !needsEraPick && (
        <div className="flex flex-wrap items-center gap-1.5">
          {(state.theme || state.era) && (
            <button
              type="button"
              onClick={() => onChange({ ...state, theme: null, era: null })}
              className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-pine-800/70 px-2 font-sans text-[11px] text-pine-100 hover:bg-pine-700 dark:bg-ocean-900/60 dark:text-ocean-100 dark:hover:bg-ocean-800"
            >
              <ArrowLeft className="h-3 w-3" aria-hidden />
              All {state.path === 'theme' ? 'themes' : 'eras'}
            </button>
          )}

          {/* Start Here is a curated order, so a sort toggle would undo it. */}
          {state.path !== 'start-here' && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...state,
                  sort: state.sort === 'bible' ? 'best-known' : 'bible',
                })
              }
              aria-label={`Sorted by ${state.sort === 'bible' ? 'Bible order' : 'best known'}. Switch.`}
              className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-pine-800/70 px-2 font-sans text-[11px] text-pine-100 hover:bg-pine-700 dark:bg-ocean-900/60 dark:text-ocean-100 dark:hover:bg-ocean-800"
            >
              {state.sort === 'bible' ? 'Bible order' : 'Best known'}
            </button>
          )}

          {searchOpen || state.query ? (
            <span className="inline-flex min-h-8 flex-1 items-center gap-1 rounded-lg bg-pine-800/70 px-2 dark:bg-ocean-900/60">
              <Search
                className="h-3 w-3 shrink-0 text-pine-300 dark:text-ocean-400"
                aria-hidden
              />
              <input
                type="search"
                value={state.query}
                autoFocus
                onChange={(e) => onChange({ ...state, query: e.target.value })}
                placeholder="Search sayings"
                aria-label="Search sayings by title, reference, or words"
                className="min-w-0 flex-1 bg-transparent font-sans text-[11px] text-pine-50 outline-none placeholder:text-pine-300 dark:text-ocean-50 dark:placeholder:text-ocean-400"
              />
              <button
                type="button"
                onClick={() => {
                  onChange({ ...state, query: '' })
                  setSearchOpen(false)
                }}
                aria-label="Clear search"
                className="shrink-0 text-pine-300 hover:text-pine-50 dark:text-ocean-400 dark:hover:text-ocean-100"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search sayings"
              className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-pine-800/70 px-2 font-sans text-[11px] text-pine-100 hover:bg-pine-700 dark:bg-ocean-900/60 dark:text-ocean-100 dark:hover:bg-ocean-800"
            >
              <Search className="h-3 w-3" aria-hidden />
              Search
            </button>
          )}
        </div>
      )}

      {/* the list */}
      {!needsThemePick && !needsEraPick && (
        <>
          <p
            className="font-sans text-[11px] text-pine-300 dark:text-ocean-400"
            aria-live="polite"
          >
            {list.length} of {SAYING_COUNT} sayings
          </p>

          {list.length === 0 ? (
            <p className="rounded-xl border border-dashed border-pine-600 p-3 font-serif text-[13px] text-pine-100 dark:border-ocean-700 dark:text-ocean-200">
              Nothing matches “{state.query}”. Try a book name like “John”, or a
              phrase like “I am the way”.
            </p>
          ) : (
            <ul className="space-y-1.5 list-none p-0 m-0">
              {list.map((w) => {
                const Icon = iconFor(w.id)
                return (
                  <li key={w.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(w)
                        onOpenPassage(w.passage)
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl border border-pine-600/60 bg-pine-900/50 px-3 py-2 text-left transition-colors hover:border-pine-400 hover:bg-pine-800/70 dark:border-ocean-700/60 dark:bg-ocean-900/40 dark:hover:border-ocean-500"
                    >
                      <Icon
                        className="h-4 w-4 shrink-0 text-pine-300 dark:text-ocean-400"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-sans text-[13px] font-medium text-pine-50 dark:text-ocean-50">
                          {w.title}
                        </span>
                        <span className="block font-sans text-[11px] text-pine-300 dark:text-ocean-400">
                          {w.passage.label}
                        </span>
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-pine-300 dark:text-ocean-400"
                        aria-hidden
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      {/* Start Here is a finishable path, so it hands off rather than ending. */}
      {state.path === 'start-here' && (
        <div className="space-y-2 rounded-xl border border-pine-600/70 bg-pine-800/50 p-3 dark:border-ocean-700/70 dark:bg-ocean-900/40">
          <p className="font-serif text-[13px] leading-relaxed text-pine-100 dark:text-ocean-200">
            When you have read these, the full catalog has all {SAYING_COUNT}.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() =>
                onChange({ ...state, path: 'catalog', theme: null, era: null })
              }
              className="tour-next-btn inline-flex min-h-9 items-center gap-1 rounded-xl px-3 font-sans text-xs font-semibold shadow-md"
            >
              Continue in full catalog
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={onStartTour}
              className="inline-flex min-h-9 items-center gap-1 rounded-xl px-3 font-sans text-xs font-medium btn-surface hover:shadow-md"
            >
              <Compass className="h-3.5 w-3.5" aria-hidden />
              Take the guided tour
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
