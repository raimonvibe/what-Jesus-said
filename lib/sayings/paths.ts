import { byFamiliarity, startHere, SAYINGS } from './catalog'
import {
  ERA_LABELS,
  ERA_ORDER,
  THEME_LABELS,
  type Era,
  type Saying,
  type Theme,
} from './types'

export type PathId = 'start-here' | 'theme' | 'era' | 'catalog'

export type SortMode = 'bible' | 'best-known'

export interface PathState {
  path: PathId
  sort: SortMode
  theme: Theme | null
  era: Era | null
  query: string
}

export const DEFAULT_PATH_STATE: PathState = {
  path: 'start-here',
  sort: 'bible',
  theme: null,
  era: null,
  query: '',
}

export const OPEN_SAYINGS_EVENT = 'open-what-jesus-said'

export type OpenSayingsDetail = {
  sayingId?: string
  path?: PathId
}

/** Opens the sayings panel from the home boxes. Pass a saying to jump to it. */
export function openSayingsPanel(detail: OpenSayingsDetail = {}): void {
  window.dispatchEvent(new CustomEvent<OpenSayingsDetail>(OPEN_SAYINGS_EVENT, { detail }))
}

export const PATH_LABELS: Record<PathId, string> = {
  'start-here': 'Start here',
  theme: 'By theme',
  era: 'By book',
  catalog: 'Full catalog',
}

export const PATH_BLURBS: Record<PathId, string> = {
  'start-here':
    'The best-known things Jesus said, in a short path you can actually finish.',
  theme: 'Parables, promises, I am sayings — read one kind at a time.',
  era: 'Walk one Gospel, then Acts, the letters, and Revelation.',
  catalog: 'Every recorded saying, sorted however you like.',
}

const PATH_KEY = 'jesus-said-path'
const SORT_KEY = 'jesus-said-sort'
const SEEN_OVERVIEW_KEY = 'jesus-said-seen-overview'
const LAST_SAYING_KEY = 'jesus-said-last-read'
const TOUR_STEP_KEY = 'jesus-said-tour-step'

const PATHS: PathId[] = ['start-here', 'theme', 'era', 'catalog']
const SORTS: SortMode[] = ['bible', 'best-known']

export function loadPathState(): PathState {
  const state = { ...DEFAULT_PATH_STATE }
  try {
    const path = localStorage.getItem(PATH_KEY) as PathId | null
    if (path && PATHS.includes(path)) state.path = path
    const sort = localStorage.getItem(SORT_KEY) as SortMode | null
    if (sort && SORTS.includes(sort)) state.sort = sort
  } catch {
    /* private mode */
  }
  return state
}

export function savePathState(state: PathState): void {
  try {
    localStorage.setItem(PATH_KEY, state.path)
    localStorage.setItem(SORT_KEY, state.sort)
  } catch {
    /* ignore */
  }
}

export function hasSeenOverview(): boolean {
  try {
    return localStorage.getItem(SEEN_OVERVIEW_KEY) === 'true'
  } catch {
    return false
  }
}

export function markOverviewSeen(): void {
  try {
    localStorage.setItem(SEEN_OVERVIEW_KEY, 'true')
  } catch {
    /* ignore */
  }
}

export function rememberLastSaying(id: string): void {
  try {
    localStorage.setItem(LAST_SAYING_KEY, id)
  } catch {
    /* ignore */
  }
}

export function lastSayingId(): string | null {
  try {
    return localStorage.getItem(LAST_SAYING_KEY)
  } catch {
    return null
  }
}

export function rememberTourStep(step: number): void {
  try {
    if (step > 0) localStorage.setItem(TOUR_STEP_KEY, String(step))
    else localStorage.removeItem(TOUR_STEP_KEY)
  } catch {
    /* ignore */
  }
}

export function savedTourStep(): number {
  try {
    const raw = Number(localStorage.getItem(TOUR_STEP_KEY))
    return Number.isInteger(raw) && raw > 0 ? raw : 0
  } catch {
    return 0
  }
}

export function clearTourStep(): void {
  try {
    localStorage.removeItem(TOUR_STEP_KEY)
  } catch {
    /* ignore */
  }
}

export function sayingsFor(state: PathState): Saying[] {
  let list: Saying[]

  switch (state.path) {
    case 'start-here':
      return startHere()
    case 'theme':
      list = state.theme ? SAYINGS.filter((s) => s.theme === state.theme) : []
      break
    case 'era':
      list = state.era ? SAYINGS.filter((s) => s.era === state.era) : []
      break
    case 'catalog':
      list = SAYINGS
      break
  }

  const q = state.query.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.passage.label.toLowerCase().includes(q) ||
        s.quote.toLowerCase().includes(q),
    )
  }

  return state.sort === 'best-known' ? byFamiliarity(list) : list
}

export function themeOptions(): Array<{ id: Theme; label: string; count: number }> {
  return (Object.keys(THEME_LABELS) as Theme[])
    .map((id) => ({
      id,
      label: THEME_LABELS[id],
      count: SAYINGS.filter((s) => s.theme === id).length,
    }))
    .filter((t) => t.count > 0)
}

export function eraOptions(): Array<{ id: Era; label: string; count: number }> {
  return ERA_ORDER.map((id) => ({
    id,
    label: ERA_LABELS[id],
    count: SAYINGS.filter((s) => s.era === id).length,
  })).filter((e) => e.count > 0)
}
