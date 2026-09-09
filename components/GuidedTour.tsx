'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Heart,
  Layers,
  LifeBuoy,
  Maximize2,
  MessageSquareQuote,
  Minimize2,
  Quote,
  RotateCcw,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import {
  SAYING_INTRO,
  SAYING_OUTRO,
  SAYING_STEPS,
  TOUR_ACCENTS,
  TOUR_SECTIONS,
  firstStepOfSection,
  narrationForSayingStep,
  passageOfSayingStep,
  sectionIndexOfStep,
  type SayingTourStep,
  type SectionId,
} from '@/lib/sayingsTour'
import { chapterIdOf, type PassageRef } from '@/lib/passages'
import SayingCardBody from '@/components/SayingCardBody'
import CatalogBrowser from '@/components/CatalogBrowser'
import {
  SAYING_COUNT,
  narrationForSaying,
  sayingById,
} from '@/lib/sayings/catalog'
import {
  DEFAULT_PATH_STATE,
  OPEN_SAYINGS_EVENT,
  PATH_BLURBS,
  PATH_LABELS,
  clearTourStep,
  hasSeenOverview,
  lastSayingId,
  loadPathState,
  markOverviewSeen,
  rememberLastSaying,
  rememberTourStep,
  savePathState,
  savedTourStep,
  type OpenSayingsDetail,
  type PathId,
  type PathState,
} from '@/lib/sayings/paths'
import type { Saying } from '@/lib/sayings/types'
import VoicePicker from '@/components/VoicePicker'
import { useTourNarration, type SpeechMode } from '@/hooks/useTourNarration'
import { extractSpokenBlocks, spokenPassageCue, waitForSpokenText } from '@/lib/readAloud'
import { snapViewportX } from '@/hooks/useFixedViewportInsets'

/** Where the tour wants the reader to be. */
export interface TourTarget {
  bookId: string
  chapterId: string
  verses: [number, number]
}

interface GuidedTourProps {
  /** Open a passage in the reader, or clear the spotlight when null. */
  onNavigate: (target: TourTarget | null) => void
}

type IconType = React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>

const SECTION_ICONS: Record<SectionId, IconType> = {
  gospels: Quote,
  witness: Heart,
}

/** Icons-only would look like iOS bubbles; labels stay the same on every OS. */
const SPEECH_MODES: Array<{
  id: SpeechMode
  label: string
  short: string
  Icon: IconType
}> = [
  { id: 'tour', label: 'Narrate the card only', short: 'Card', Icon: MessageSquareQuote },
  { id: 'passage', label: 'Narrate the passage only', short: 'Passage', Icon: BookOpen },
  { id: 'both', label: 'Narrate the card, then the passage', short: 'Both', Icon: Layers },
]

const SEEN_KEY = 'jesus-said-tour-seen'

const LAST_STEP = SAYING_STEPS.length - 1

/**
 * At or above this the layout is a 50/50 split and the panel docks full-height
 * to the right; below it the two surfaces take turns — His words full-screen,
 * or the passage with a bar to switch back. Mirrored by the `960px` media
 * queries in app/globals.css — move both together.
 */
const SPLIT_MIN_WIDTH = 960

/** Give the reader time to open the chapter before reading the passage from it. */
const NARRATION_DELAY = 450

function targetOf(passage: PassageRef): TourTarget {
  return {
    bookId: passage.bookId,
    chapterId: chapterIdOf(passage),
    verses: passage.verses,
  }
}

interface GroupPill {
  key: string
  label: string
  Icon: IconType
  firstStep: number
  reached: boolean
  active: boolean
  done: boolean
}

interface ItemDot {
  key: string
  label: string
  target: number
  accentDot: string
}

export default function GuidedTour({ onNavigate }: GuidedTourProps) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [furthestStep, setFurthestStep] = useState(0)
  const [seen, setSeen] = useState(true)
  /** Which face of the panel is showing: the paths, a list, or the tour. */
  const [view, setView] = useState<'overview' | 'browse' | 'tour'>('browse')
  const [pathState, setPathState] = useState<PathState>(DEFAULT_PATH_STATE)
  const [selectedSaying, setSelectedSaying] = useState<Saying | null>(null)
  const [splitLayout, setSplitLayout] = useState(false)

  const narration = useTourNarration()
  const {
    enabled: speechOn,
    mode: speechMode,
    rate: speechRate,
    voiceURI,
    refreshVoices,
    stop: stopNarration,
  } = narration
  // Held in a ref so the narration effect keys off the settings, not identity.
  const speakRef = useRef(narration.speak)
  speakRef.current = narration.speak

  const headingRef = useRef<HTMLHeadingElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  // Held in a ref so the navigation effect only reacts to step changes.
  const navigateRef = useRef(onNavigate)
  navigateRef.current = onNavigate

  useEffect(() => {
    setMounted(true)
    try {
      setSeen(localStorage.getItem(SEEN_KEY) === 'true')
    } catch {
      setSeen(true)
    }
  }, [])

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${SPLIT_MIN_WIDTH}px)`)
    const sync = () => setSplitLayout(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  const isTour = view === 'tour'
  /* What the reader could pick up again. Read on each render rather than held
     in state: the panel is short-lived and localStorage is the source. */
  const resumeSaying = mounted && !isTour ? sayingById(lastSayingId() ?? '') : undefined
  const resumeStep = mounted && !isTour ? savedTourStep() : 0
  const lastStep = LAST_STEP
  const sayingStep: SayingTourStep = SAYING_STEPS[stepIndex]

  const sectionIndex = sectionIndexOfStep(sayingStep)
  const section = sectionIndex !== null ? TOUR_SECTIONS[sectionIndex] : null
  const saying =
    sayingStep?.kind === 'saying'
      ? TOUR_SECTIONS[sayingStep.sectionIndex].sayings[
          sayingStep.sayingIndex
        ]
      : null

  /* --- navigation ------------------------------------------------------- */

  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(LAST_STEP, next))
    setStepIndex(clamped)
    rememberTourStep(clamped)
    setFurthestStep((f) => Math.max(f, clamped))
    setMinimized(false)
  }, [])

  const restart = useCallback(() => {
    setStepIndex(0)
    setFurthestStep(0)
    clearTourStep()
  }, [])

  const start = useCallback((options?: OpenSayingsDetail) => {
    setStepIndex(0)
    setFurthestStep(0)
    setOpen(true)
    setMinimized(false)
    setSeen(true)
    try {
      localStorage.setItem(SEEN_KEY, 'true')
    } catch {
      /* private mode — the tour still works, it just re-announces itself */
    }

    const saying = options?.sayingId ? sayingById(options.sayingId) : undefined
    if (saying) {
      markOverviewSeen()
      const next = { ...DEFAULT_PATH_STATE, path: 'start-here' as const }
      setPathState(next)
      savePathState(next)
      setSelectedSaying(saying)
      rememberLastSaying(saying.id)
      setView('browse')
      navigateRef.current(targetOf(saying.passage))
      return
    }

    if (options?.path && options.path in PATH_LABELS) {
      markOverviewSeen()
      const next = { ...DEFAULT_PATH_STATE, path: options.path }
      setPathState(next)
      savePathState(next)
      setSelectedSaying(null)
      setView('browse')
      return
    }

    setSelectedSaying(null)
    setPathState(loadPathState())
    setView(hasSeenOverview() ? 'browse' : 'overview')
  }, [])

  useEffect(() => {
    const openFromHome = (event: Event) => {
      const detail = (event as CustomEvent<OpenSayingsDetail>).detail ?? {}
      start(detail)
    }
    window.addEventListener(OPEN_SAYINGS_EVENT, openFromHome)
    return () => window.removeEventListener(OPEN_SAYINGS_EVENT, openFromHome)
  }, [start])

  useEffect(() => {
    if (!open || minimized) return
    refreshVoices()
  }, [open, minimized, refreshVoices])

  const exit = useCallback(() => {
    setOpen(false)
    setMinimized(false)
    setSelectedSaying(null)
    setStepIndex(0)
    setFurthestStep(0)
    stopNarration()
    navigateRef.current(null)
  }, [stopNarration])

  const changePath = useCallback((next: PathState) => {
    setPathState(next)
    savePathState(next)
  }, [])

  const choosePath = useCallback(
    (id: PathId) => {
      markOverviewSeen()
      changePath({ ...DEFAULT_PATH_STATE, path: id })
      setView('browse')
    },
    [changePath],
  )

  const skipGroup = useCallback(() => {
    if (sectionIndex === null) return
    const next = firstStepOfSection(sectionIndex + 1)
    goTo(next === -1 ? LAST_STEP : next)
  }, [sectionIndex, goTo])

  // Drive the reader behind the panel.
  useEffect(() => {
    if (!open || view !== 'tour') return
    const passage = passageOfSayingStep(sayingStep)
    navigateRef.current(passage ? targetOf(passage) : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stepIndex, view])

  /**
   * Publish the space the panel occupies so the page can keep the passage out
   * from under it:
   *
   *  - split → the page pads its right edge by the panel's width, leaving the
   *    Bible the left half.
   *  - phone → His words is full-screen, so the Bible waits underneath with
   *    no inset; switching to the passage reserves the switcher bar.
   */
  useEffect(() => {
    const root = document.documentElement
    const clear = () => {
      root.style.setProperty('--reader-safe-bottom', '0px')
      root.style.setProperty('--reader-safe-right', '0px')
      root.classList.remove('tour-passage-phone')
    }

    if (!open) {
      clear()
      snapViewportX()
      return clear
    }

    const update = () => {
      const split = window.matchMedia(`(min-width: ${SPLIT_MIN_WIDTH}px)`).matches
      root.classList.toggle('tour-passage-phone', !split && minimized)

      if (split) {
        if (minimized) {
          root.style.setProperty('--reader-safe-bottom', '0px')
          root.style.setProperty('--reader-safe-right', '0px')
          return
        }
        root.style.setProperty('--reader-safe-bottom', '0px')
        root.style.setProperty('--reader-safe-right', '50%')
        return
      }

      root.style.setProperty('--reader-safe-right', '0px')
      // Page padding stays still: --vv-offset-bottom belongs on the fixed bar,
      // not here. Animating the page with the iOS toolbar is what made the
      // card wobble after His words ↔ the passage.
      root.style.setProperty(
        '--reader-safe-bottom',
        minimized
          ? 'calc(4.25rem + env(safe-area-inset-bottom, 0px))'
          : '0px',
      )
    }

    update()
    snapViewportX()
    const splitQuery = window.matchMedia(`(min-width: ${SPLIT_MIN_WIDTH}px)`)
    splitQuery.addEventListener('change', update)
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      splitQuery.removeEventListener('change', update)
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      clear()
    }
  }, [open, minimized])

  /**
   * What the current step sounds like under the chosen mode. Shared by the
   * arrive-at-a-step narration and the Replay button so the two cannot drift.
   * The passage is read out of the reader's DOM, so callers must let it open
   * the chapter first (see NARRATION_DELAY).
   */
  const segmentsForStep = useCallback(() => {
    // Prefer the words on screen so Google Translate's language is spoken,
    // not the English strings in the catalog JSON.
    const fromScreen = bodyRef.current
      ? extractSpokenBlocks(bodyRef.current)
      : []
    const fallback = isTour
      ? narrationForSayingStep(sayingStep)
      : selectedSaying
        ? narrationForSaying(selectedSaying)
        : []
    const tour = fromScreen.length > 0 ? fromScreen : fallback
    if (speechMode === 'tour') return tour

    const verses = Array.from(
      document.querySelectorAll<HTMLElement>('.verse-spotlight'),
    )
      .map((el) =>
        el.innerText.replace(/\[\d+\]/g, ' ').replace(/\s+/g, ' ').trim(),
      )
      .filter(Boolean)

    if (!verses.length) return tour

    return speechMode === 'passage'
      ? verses
      : [...tour, spokenPassageCue(panelRef.current), ...verses]
  }, [sayingStep, speechMode, isTour, selectedSaying])

  // Held in a ref so the narration effect keys off the settings, not identity.
  const segmentsRef = useRef(segmentsForStep)
  segmentsRef.current = segmentsForStep

  /**
   * Speech mode: when it is on, each step is read as you arrive at it, and
   * changing a voice, speed or mode re-reads the current step so the choice can
   * be heard straight away. After Google Translate, wait for the card rewrite
   * so the voice is not still speaking English.
   */
  useEffect(() => {
    if (!open || !speechOn) return
    let cancelled = false

    const timer = window.setTimeout(() => {
      const run = async () => {
        if (bodyRef.current) await waitForSpokenText(bodyRef.current)
        if (cancelled) return
        speakRef.current(segmentsRef.current())
      }
      void run()
    }, NARRATION_DELAY)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, speechOn, speechMode, speechRate, voiceURI, stepIndex, view, selectedSaying])

  // Late Google Translate rewrites: if the on-screen language changes after
  // we already started, read the new text instead of finishing in English.
  useEffect(() => {
    if (!open || !speechOn) return
    if (view !== 'tour' && !selectedSaying) return
    const root = bodyRef.current
    if (!root) return

    let spoken = extractSpokenBlocks(root).join('\n')
    let settle = 0
    const observer = new MutationObserver(() => {
      window.clearTimeout(settle)
      settle = window.setTimeout(() => {
        const next = extractSpokenBlocks(root).join('\n')
        if (next && next !== spoken) {
          spoken = next
          speakRef.current(segmentsRef.current())
        }
      }, 500)
    })
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
    })
    return () => {
      observer.disconnect()
      window.clearTimeout(settle)
    }
  }, [open, speechOn, stepIndex, view, selectedSaying])

  // Move focus to the new step's heading so screen readers follow along.
  useEffect(() => {
    if (!open || minimized) return
    headingRef.current?.focus()
    bodyRef.current?.scrollTo({ top: 0 })
  }, [open, minimized, stepIndex])

  // Keyboard: arrows to move, Escape to leave.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const tag = el?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'Escape') {
        e.preventDefault()
        exit()
      } else if (isTour && e.key === 'ArrowRight' && stepIndex < lastStep) {
        e.preventDefault()
        goTo(stepIndex + 1)
      } else if (isTour && e.key === 'ArrowLeft' && stepIndex > 0) {
        e.preventDefault()
        goTo(stepIndex - 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, stepIndex, lastStep, goTo, exit, isTour])

  const progress = lastStep > 0 ? (stepIndex / lastStep) * 100 : 0

  const stepLabel = useMemo(() => {
    switch (sayingStep.kind) {
      case 'welcome':
        return 'Welcome'
      case 'section-intro':
        return TOUR_SECTIONS[sayingStep.sectionIndex].title
      case 'saying':
        return TOUR_SECTIONS[sayingStep.sectionIndex].sayings[
          sayingStep.sayingIndex
        ].title
      case 'section-synthesis':
        return `${TOUR_SECTIONS[sayingStep.sectionIndex].title} · together`
      case 'outro':
        return 'Closing'
    }
  }, [sayingStep])

  const groupPills: GroupPill[] = TOUR_SECTIONS.map((s, i) => {
    const first = firstStepOfSection(i)
    return {
      key: s.id,
      label: s.title,
      Icon: SECTION_ICONS[s.id],
      firstStep: first,
      reached: furthestStep >= first,
      active: sectionIndex === i,
      done:
        furthestStep > first + s.sayings.length + 1 ||
        (sectionIndex !== null && sectionIndex > i) ||
        sayingStep.kind === 'outro',
    }
  })

  const itemDots: ItemDot[] =
    section && sectionIndex !== null
      ? section.sayings.map((m, i) => ({
          key: m.id,
          label: `Go to ${m.title}`,
          target: firstStepOfSection(sectionIndex) + 1 + i,
          accentDot: TOUR_ACCENTS[section.id].dot,
        }))
      : []

  if (!mounted) return null

  /* --- launcher --------------------------------------------------------- */

  if (!open) {
    return createPortal(
      <div className="tour-anchor" style={{ zIndex: 55 }}>
        <button
          type="button"
          onClick={() => start()}
          data-read-aloud-ignore
          className="tour-fab group pointer-events-auto flex min-h-14 items-center gap-2.5 rounded-full px-4 py-3 shadow-lg transition-all hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:px-5"
          aria-label="Open What Jesus Said, a catalog of His words in the New Testament"
        >
          {!seen && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-3 w-3"
              aria-hidden="true"
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
            </span>
          )}
          <Compass
            className="h-5 w-5 shrink-0 text-pine-50 transition-transform group-hover:rotate-12 dark:text-ocean-50"
            aria-hidden
          />
          <span className="font-sans text-sm font-semibold text-pine-50 dark:text-ocean-50">
            Open What Jesus Said
          </span>
        </button>
      </div>,
      document.body,
    )
  }

  /* --- minimized bar ---------------------------------------------------- */

  if (minimized) {
    return createPortal(
      <div className="tour-anchor tour-mobile-switch" style={{ zIndex: 55 }}>
        <div
          data-read-aloud-ignore
          className="tour-panel-shell pointer-events-auto flex w-full items-center gap-2 py-2 pl-2 pr-2 shadow-lg min-[960px]:w-auto min-[960px]:rounded-full min-[960px]:py-2 min-[960px]:pl-4"
        >
          <div
            role="tablist"
            aria-label="Show His words or the passage"
            className="tour-pane-switch min-[960px]:hidden"
          >
            <button
              type="button"
              role="tab"
              aria-selected={false}
              onClick={() => setMinimized(false)}
            >
              His words
            </button>
            <button type="button" role="tab" aria-selected={true}>
              The passage
            </button>
          </div>
          {speechOn && (
            <Volume2
              className={`hidden h-3.5 w-3.5 shrink-0 text-pine-300 min-[960px]:block dark:text-ocean-400 ${
                narration.speaking ? 'tour-speaking' : ''
              }`}
              aria-label="Narration is on"
            />
          )}
          <span className="hidden font-sans text-xs font-medium text-pine-100 min-[960px]:inline dark:text-ocean-100">
            {stepLabel}
          </span>
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="tour-icon-btn hidden min-[960px]:flex"
            aria-label="Expand the guided tour"
          >
            <Maximize2 className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={exit}
            className="tour-icon-btn"
            aria-label="Exit the guided tour"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>,
      document.body,
    )
  }

  /* --- panel ------------------------------------------------------------ */

  return createPortal(
    <div className="tour-anchor tour-dock" style={{ zIndex: 55 }}>
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-label={`Guided tour: ${SAYING_INTRO.title}`}
        data-read-aloud-ignore
        className="tour-panel-shell tour-panel pointer-events-auto flex flex-col overflow-hidden rounded-2xl shadow-2xl"
      >
        {/* header */}
        <div className="shrink-0 border-b border-pine-600/70 px-4 pt-3 pb-2 dark:border-ocean-700/70">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-pine-300 dark:text-ocean-400">
                {SAYING_INTRO.title}
              </p>
              <p className="truncate font-sans text-xs text-pine-300 dark:text-ocean-300">
                {isTour
                  ? `Step ${stepIndex + 1} of ${lastStep + 1} · ${stepLabel}`
                  : view === 'overview'
                    ? 'Choose how to read'
                    : `${PATH_LABELS[pathState.path]} · ${SAYING_COUNT} sayings`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {narration.supported && (
                <button
                  type="button"
                  onClick={() => narration.setEnabled(!speechOn)}
                  className={`tour-icon-btn ${speechOn ? 'tour-icon-btn-on' : ''}`}
                  aria-pressed={speechOn}
                  aria-label={
                    speechOn ? 'Turn narration off' : 'Read this card aloud'
                  }
                >
                  {speechOn ? (
                    <Volume2
                      className={`h-4 w-4 ${narration.speaking ? 'tour-speaking' : ''}`}
                      aria-hidden
                    />
                  ) : (
                    <VolumeX className="h-4 w-4" aria-hidden />
                  )}
                </button>
              )}

              {isTour && (
                <button
                  type="button"
                  onClick={() => {
                    stopNarration()
                    setView('browse')
                  }}
                  className="tour-icon-btn"
                  aria-label="Back to the reading paths"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </button>
              )}
              <button
                  type="button"
                  onClick={() => setMinimized(true)}
                  className="tour-icon-btn hidden min-[960px]:flex"
                  aria-label="Minimize the tour and read the passage"
                >
                  <Minimize2 className="h-4 w-4" aria-hidden />
                </button>
              <button
                type="button"
                onClick={exit}
                className="tour-icon-btn"
                aria-label="Exit the guided tour"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Show His words or the passage"
            className="tour-pane-switch mt-2.5 min-[960px]:hidden"
          >
            <button type="button" role="tab" aria-selected={true}>
              His words
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={false}
              onClick={() => setMinimized(true)}
            >
              The passage
            </button>
          </div>

          {/* What to narrate. Sits on its own row rather than in the voice
              sheet, so switching stays one click and never gets buried. */}
          {(isTour || selectedSaying) && narration.supported && speechOn && (
            <div
              role="radiogroup"
              aria-label="What to narrate"
              className="mt-2.5"
            >
              <div className="tour-mode-group">
                {SPEECH_MODES.map((m) => {
                  const active = speechMode === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      title={m.label}
                      onClick={() => narration.setMode(m.id)}
                      className={`tour-mode-btn ${active ? 'tour-mode-btn-on' : ''}`}
                    >
                      <m.Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span>{m.short}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* group pills */}
          {isTour && groupPills.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5">
              {groupPills.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  disabled={!g.reached}
                  onClick={() => goTo(g.firstStep)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 font-sans text-[11px] font-medium transition-colors ${
                    g.active
                      ? 'bg-pine-100 text-pine-900 dark:bg-ocean-200 dark:text-ocean-950'
                      : g.reached
                        ? 'bg-pine-700/70 text-pine-100 hover:bg-pine-600/70 dark:bg-ocean-800/70 dark:text-ocean-100 dark:hover:bg-ocean-700/70'
                        : 'bg-pine-800/50 text-pine-500 dark:bg-ocean-900/40 dark:text-ocean-600'
                  }`}
                  aria-current={g.active ? 'step' : undefined}
                  aria-label={
                    g.reached ? `Go to ${g.label}` : `${g.label} — not reached yet`
                  }
                >
                  {g.done && !g.active ? (
                    <Check className="h-3 w-3 shrink-0" aria-hidden />
                  ) : (
                    <g.Icon className="h-3 w-3 shrink-0" aria-hidden />
                  )}
                  <span className="truncate">{g.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* progress */}
          {isTour && (
          <div
              className="mt-2 h-1 overflow-hidden rounded-full bg-pine-700 dark:bg-ocean-800"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Tour progress"
            >
              <div
                className="tour-progress-bar h-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
          </div>
          )}
        </div>

        {narration.supported && speechOn && (
          <details
            className="tour-speech-settings shrink-0 border-b border-pine-600/70 dark:border-ocean-700/70"
            {...(splitLayout ? { open: true } : {})}
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 font-sans text-xs font-semibold text-pine-100 dark:text-ocean-100 min-[960px]:hidden">
              Voice &amp; speed
            </summary>
            <div className="tour-speech-settings-body space-y-2 px-3 py-2 min-[960px]:space-y-3 min-[960px]:px-4 min-[960px]:py-3">
              <VoicePicker
                voices={narration.voices}
                voiceURI={voiceURI}
                onVoiceURI={narration.setVoiceURI}
                rate={speechRate}
                onRate={narration.setRate}
                onRefreshVoices={refreshVoices}
                hint="Voices are grouped by language. After Google Translate, pick a voice in that language — it reads the words on the card, not the English original."
              />
              {(isTour || selectedSaying) && (
                <button
                  type="button"
                  onClick={() => speakRef.current(segmentsForStep())}
                  className="flex min-h-10 items-center gap-1.5 rounded-xl px-3 font-sans text-xs btn-surface hover:shadow-md"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  Replay step
                </button>
              )}
            </div>
          </details>
        )}

        {/* body — a flex column so the scroll area keeps a definite height */}
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            ref={bodyRef}
            className="tour-panel-body min-h-0 flex-1 overflow-y-auto px-4 py-4"
          >
            {/* ===================================================================
                First visit — the beginner overview (path F)
                =================================================================== */}
            {view === 'overview' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-pine-200 dark:text-ocean-300">
                  <Compass className="h-5 w-5" aria-hidden />
                  <span className="font-sans text-xs font-medium uppercase tracking-wide">
                    What Jesus Said
                  </span>
                </div>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-display text-2xl font-bold text-pine-50 outline-none dark:text-ocean-50"
                >
                  {SAYING_COUNT} things Jesus said, in His own words
                </h2>
                <p className="font-serif text-sm leading-relaxed text-pine-100 dark:text-ocean-200">
                  Every one of them opens the passage in the reader beside you,
                  so you can read the actual words. Pick a way in — you can
                  change it at any time, and nothing is hidden behind a choice.
                </p>

                <div className="space-y-1.5">
                  {(Object.keys(PATH_LABELS) as PathId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => choosePath(id)}
                      className="flex w-full items-center gap-2.5 rounded-xl border border-pine-600/60 bg-pine-900/50 px-3 py-2.5 text-left transition-colors hover:border-pine-400 hover:bg-pine-800/70 dark:border-ocean-700/60 dark:bg-ocean-900/40 dark:hover:border-ocean-500"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-sans text-[13px] font-semibold text-pine-50 dark:text-ocean-50">
                          {PATH_LABELS[id]}
                        </span>
                        <span className="block font-sans text-[11px] leading-snug text-pine-300 dark:text-ocean-400">
                          {PATH_BLURBS[id]}
                        </span>
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-pine-300 dark:text-ocean-400"
                        aria-hidden
                      />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      markOverviewSeen()
                      setView('tour')
                      restart()
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-pine-600/60 bg-pine-900/50 px-3 py-2.5 text-left transition-colors hover:border-pine-400 hover:bg-pine-800/70 dark:border-ocean-700/60 dark:bg-ocean-900/40 dark:hover:border-ocean-500"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-sans text-[13px] font-semibold text-pine-50 dark:text-ocean-50">
                        Guided tour
                      </span>
                      <span className="block font-sans text-[11px] leading-snug text-pine-300 dark:text-ocean-400">
                        Fourteen sayings, walked in order, read aloud if you like.
                      </span>
                    </span>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-pine-300 dark:text-ocean-400"
                      aria-hidden
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Offered, never forced: reopening the panel should not drag you
                back somewhere without asking. */}
            {!isTour && !selectedSaying && (resumeSaying || resumeStep > 0) && (
              <div className="mb-3 space-y-1.5 rounded-xl border border-pine-600/70 bg-pine-800/50 p-3 dark:border-ocean-700/70 dark:bg-ocean-900/40">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-pine-300 dark:text-ocean-400">
                  Pick up where you left off
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {resumeSaying && (
                    <button
                      type="button"
                      onClick={() => {
                        setView('browse')
                        setSelectedSaying(resumeSaying)
                        navigateRef.current(targetOf(resumeSaying.passage))
                      }}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 font-sans text-xs font-medium btn-surface hover:shadow-md"
                    >
                      <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {resumeSaying.title}
                    </button>
                  )}
                  {resumeStep > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setView('tour')
                        goTo(resumeStep)
                      }}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 font-sans text-xs font-medium btn-surface hover:shadow-md"
                    >
                      <Compass className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Guided tour, step {resumeStep + 1}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ===================================================================
                Browsing the catalog (paths A–E)
                =================================================================== */}
            {view === 'browse' && (
              <CatalogBrowser
                state={pathState}
                onChange={changePath}
                selected={selectedSaying}
                onSelect={(w) => {
                  setSelectedSaying(w)
                  if (w) rememberLastSaying(w.id)
                }}
                onOpenPassage={(p) => navigateRef.current(targetOf(p))}
                onStartTour={() => {
                  setView('tour')
                  restart()
                }}
              />
            )}

            {isTour && sayingStep.kind === 'welcome' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-pine-200 dark:text-ocean-300">
                  <Sparkles className="h-5 w-5" aria-hidden />
                  <span className="font-sans text-xs font-medium uppercase tracking-wide">
                    {SAYING_INTRO.duration}
                  </span>
                </div>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-display text-2xl font-bold text-pine-50 outline-none dark:text-ocean-50"
                >
                  {SAYING_INTRO.title}
                </h2>
                <p className="font-sans text-sm text-pine-300 dark:text-ocean-400">
                  {SAYING_INTRO.subtitle}
                </p>
                {SAYING_INTRO.body.map((p, i) => (
                  <p
                    key={i}
                    className="font-serif text-sm leading-relaxed text-pine-100 dark:text-ocean-200"
                  >
                    {p}
                  </p>
                ))}
                <div className="rounded-xl border border-pine-600/70 bg-pine-800/60 p-3 dark:border-ocean-700/70 dark:bg-ocean-900/40">
                  <p className="mb-2 flex items-center gap-1.5 font-sans text-xs font-semibold text-pine-200 dark:text-ocean-300">
                    <LifeBuoy className="h-3.5 w-3.5" aria-hidden />
                    Two movements, fourteen sayings
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TOUR_SECTIONS.map((s) => (
                      <span
                        key={s.id}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-xs font-medium ${TOUR_ACCENTS[s.id].chip}`}
                      >
                        {s.title} ({s.sayings.length})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isTour && sayingStep.kind === 'section-intro' && section && (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pine-700/80 text-pine-100 dark:bg-ocean-800/80 dark:text-ocean-100">
                    {(() => {
                      const Icon = SECTION_ICONS[section.id]
                      return <Icon className="h-5 w-5" aria-hidden />
                    })()}
                  </span>
                  <div>
                    <h2
                      ref={headingRef}
                      tabIndex={-1}
                      className="font-display text-xl font-bold text-pine-50 outline-none dark:text-ocean-50"
                    >
                      {section.title}
                    </h2>
                    <p className="font-sans text-xs text-pine-300 dark:text-ocean-400">
                      {section.subtitle}
                    </p>
                  </div>
                </div>

                <p className="font-serif text-sm leading-relaxed text-pine-100 dark:text-ocean-200">
                  {section.intro}
                </p>

                <ol className="space-y-1.5">
                  {section.sayings.map((m, i) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() =>
                          goTo(firstStepOfSection(sayingStep.sectionIndex) + 1 + i)
                        }
                        className="flex w-full items-center gap-2.5 rounded-lg border border-pine-600/60 bg-pine-900/60 px-2.5 py-2 text-left transition-colors hover:border-pine-500 hover:bg-pine-800 dark:border-ocean-700/60 dark:bg-ocean-900/40 dark:hover:border-ocean-500 dark:hover:bg-ocean-800/60"
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-sans text-xs font-bold ring-1 ${TOUR_ACCENTS[section.id].badge}`}
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-sans text-xs font-semibold text-pine-50 dark:text-ocean-50">
                            {m.title}
                          </span>
                          <span className="block truncate font-sans text-[11px] text-pine-300 dark:text-ocean-400">
                            {m.passage.label}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {isTour && sayingStep.kind === 'saying' && saying && (
              <SayingCardBody
                saying={saying}
                headingRef={headingRef}
                onOpenPassage={(p) => navigateRef.current(targetOf(p))}
              />
            )}


            {isTour && sayingStep.kind === 'section-synthesis' && section && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className="h-5 w-5 text-pine-200 dark:text-ocean-300"
                      aria-hidden
                    />
                    <h2
                      ref={headingRef}
                      tabIndex={-1}
                      className="font-display text-lg font-bold leading-tight text-pine-50 outline-none dark:text-ocean-50"
                    >
                      {section.synthesis.heading}
                    </h2>
                  </div>

                  <div className="rounded-xl border border-emerald-600/25 bg-emerald-50/60 p-3 dark:border-emerald-400/20 dark:bg-emerald-950/25">
                    <p className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                      The pattern
                    </p>
                    <ul className="space-y-1">
                      {section.synthesis.patterns.map((s, i) => (
                        <li
                          key={i}
                          className="flex gap-2 font-serif text-[13px] leading-relaxed text-pine-100 dark:text-ocean-100"
                        >
                          <Check
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400"
                            aria-hidden
                          />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="mb-1 font-sans text-[11px] font-semibold uppercase tracking-wide text-pine-300 dark:text-ocean-400">
                      And why that matters
                    </p>
                    <p className="font-serif text-[13px] leading-relaxed text-pine-100 dark:text-ocean-200">
                      {section.synthesis.reflection}
                    </p>
                  </div>

                  <blockquote className="rounded-xl bg-pine-800/70 p-3 dark:bg-ocean-900/50">
                    <p className="font-serif text-[14px] italic leading-relaxed text-pine-50 dark:text-ocean-100">
                      {section.synthesis.quote}
                    </p>
                    <cite className="mt-1.5 block font-sans text-[11px] not-italic text-pine-300 dark:text-ocean-400">
                      {section.synthesis.passage.label} — highlighted in the
                      reader
                    </cite>
                  </blockquote>
                </div>
              )}

            {isTour && sayingStep.kind === 'outro' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="h-5 w-5 text-pine-200 dark:text-ocean-300"
                    aria-hidden
                  />
                  <h2
                    ref={headingRef}
                    tabIndex={-1}
                    className="font-display text-xl font-bold text-pine-50 outline-none dark:text-ocean-50"
                  >
                    {SAYING_OUTRO.title}
                  </h2>
                </div>

                {SAYING_OUTRO.body.map((p, i) => (
                  <p
                    key={i}
                    className="font-serif text-sm leading-relaxed text-pine-100 dark:text-ocean-200"
                  >
                    {p}
                  </p>
                ))}

                <blockquote className="rounded-xl bg-pine-800/70 p-3 dark:bg-ocean-900/50">
                  <p className="font-serif text-[15px] italic leading-relaxed text-pine-50 dark:text-ocean-100">
                    {SAYING_OUTRO.quote}
                  </p>
                  <cite className="mt-1.5 block font-sans text-[11px] not-italic text-pine-300 dark:text-ocean-400">
                    {SAYING_OUTRO.passage.label}
                  </cite>
                </blockquote>

                <div>
                  <p className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-pine-300 dark:text-ocean-400">
                    Carry on reading
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SAYING_OUTRO.furtherReading.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => navigateRef.current(targetOf(p))}
                        className="inline-flex items-center gap-1 rounded-full border border-pine-600 bg-pine-900/70 px-2.5 py-1 font-sans text-[11px] text-pine-100 transition-colors hover:border-pine-400 hover:bg-pine-800 dark:border-ocean-700 dark:bg-ocean-900/50 dark:text-ocean-200 dark:hover:border-ocean-500"
                      >
                        <BookOpen className="h-3 w-3" aria-hidden />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <button
                    type="button"
                    onClick={restart}
                    className="font-sans text-xs text-pine-300 underline underline-offset-2 transition-colors hover:text-pine-50 dark:text-ocean-400 dark:hover:text-ocean-100"
                  >
                    Walk through it again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* footer */}
        {isTour && (
        <div className="shrink-0 border-t border-pine-600/70 px-4 py-3 dark:border-ocean-700/70">
            {/* item stepper */}
            {itemDots.length > 0 && (
              <div className="mb-2.5 flex items-center justify-center gap-1.5">
                {itemDots.map((d) => {
                  const active = stepIndex === d.target
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => goTo(d.target)}
                      className={`h-2 rounded-full transition-all ${
                        active
                          ? `w-6 ${d.accentDot}`
                          : 'w-2 bg-pine-600 hover:bg-pine-500 dark:bg-ocean-700 dark:hover:bg-ocean-600'
                      }`}
                      aria-label={d.label}
                      aria-current={active ? 'step' : undefined}
                    />
                  )
                })}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goTo(stepIndex - 1)}
                disabled={stepIndex === 0}
                className={`flex min-h-10 items-center gap-1 rounded-xl px-3 font-sans text-xs font-medium transition-all ${
                  stepIndex === 0
                    ? 'btn-surface-muted'
                    : 'btn-surface hover:shadow-md'
                }`}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Back
              </button>

              <div className="flex-1" />

              {sectionIndex !== null && (
                <button
                  type="button"
                  onClick={skipGroup}
                  className="flex min-h-10 items-center gap-1 rounded-xl px-2.5 font-sans text-xs text-pine-300 transition-colors hover:text-pine-50 dark:text-ocean-400 dark:hover:text-ocean-100"
                  aria-label={`Skip the rest of ${section?.title ?? ''}`}
                >
                  <SkipForward className="h-3.5 w-3.5" aria-hidden />
                  Skip
                </button>
              )}

              {stepIndex < lastStep ? (
                <button
                  type="button"
                  onClick={() => goTo(stepIndex + 1)}
                  className="tour-next-btn flex min-h-10 items-center gap-1 rounded-xl px-4 font-sans text-xs font-semibold shadow-md transition-all hover:shadow-lg"
                >
                  {sayingStep.kind === 'welcome' ? 'Begin' : 'Next'}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    // Finishing is different from closing: there is nothing
                    // left to resume, so don't offer to.
                    clearTourStep()
                    exit()
                  }}
                  className="tour-next-btn flex min-h-10 items-center gap-1 rounded-xl px-4 font-sans text-xs font-semibold shadow-md transition-all hover:shadow-lg"
                >
                  Finish
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>

          <p className="tour-hint mt-2 text-center font-sans text-[10px] text-pine-300 dark:text-ocean-300">
              ← → to move · Esc to leave · you can exit at any time
            </p>
        </div>
        )}
      </section>
    </div>,
    document.body,
  )
}
