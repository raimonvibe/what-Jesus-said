export type ReadChunk = {
  index: number
  text: string
  element: HTMLElement
}

const BLOCK_SELECTOR =
  '[data-read-aloud-block], article, section.card-surface'

const READABLE_SELECTOR =
  'h1, h2, h3, h4, p, li, blockquote'

const IGNORE_ANCESTOR =
  '[data-read-aloud-ignore], nav, footer, header, button'

function isIgnored(el: HTMLElement): boolean {
  if (el.closest(IGNORE_ANCESTOR)) return true
  const anchor = el.closest('a')
  if (anchor && !anchor.matches(BLOCK_SELECTOR) && !anchor.hasAttribute('data-read-aloud-block')) {
    return true
  }
  return false
}

function extractText(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement
  clone
    .querySelectorAll(
      "[data-read-aloud-ignore], button, svg, [aria-hidden='true'], .verse-num",
    )
    .forEach((node) => node.remove())
  return clone.innerText.replace(/\s+/g, ' ').trim()
}

function compareDocumentOrder(a: HTMLElement, b: HTMLElement): number {
  const position = a.compareDocumentPosition(b)
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

/** Split scripture articles into verse chunks when present */
function expandBlockToChunks(block: HTMLElement): Omit<ReadChunk, 'index'>[] {
  const verses = Array.from(block.querySelectorAll<HTMLElement>('.verse')).filter(
    (el) => !isIgnored(el),
  )

  if (verses.length > 1) {
    return verses
      .map((element) => ({ text: extractText(element), element }))
      .filter((chunk) => chunk.text.length > 0)
  }

  const text = extractText(block)
  return text ? [{ text, element: block }] : []
}

/** One utterance per card/section; scripture articles read verse-by-verse */
export function getReadableChunks(root: HTMLElement): ReadChunk[] {
  const blocks = Array.from(root.querySelectorAll<HTMLElement>(BLOCK_SELECTOR))
    .filter((el) => !isIgnored(el))
    .filter((el, _, arr) =>
      arr.every((other) => other === el || !other.contains(el)),
    )
    .sort(compareDocumentOrder)

  const claimed = new Set<HTMLElement>()
  const chunks: ReadChunk[] = []

  for (const block of blocks) {
    const blockChunks = expandBlockToChunks(block)
    if (!blockChunks.length) continue

    for (const chunk of blockChunks) {
      chunks.push({ index: chunks.length, ...chunk })
    }

    claimed.add(block)
    block.querySelectorAll<HTMLElement>(READABLE_SELECTOR).forEach((el) => {
      claimed.add(el)
    })
    block.querySelectorAll<HTMLElement>('.verse').forEach((el) => {
      claimed.add(el)
    })
  }

  const standalone = Array.from(
    root.querySelectorAll<HTMLElement>(READABLE_SELECTOR),
  )
    .filter((el) => {
      if (isIgnored(el)) return false
      if (claimed.has(el)) return false
      if (el.closest(BLOCK_SELECTOR)) return false
      return extractText(el).length > 0
    })
    .sort(compareDocumentOrder)

  for (const el of standalone) {
    const text = extractText(el)
    if (!text) continue
    chunks.push({ index: chunks.length, text, element: el })
  }

  return chunks
}

type CachedSelection = {
  text: string
  element: HTMLElement
}

/** Last non-empty selection inside #main-content (survives toolbar clicks). */
let selectionCache: CachedSelection | null = null

function elementFromNode(node: Node | null | undefined): HTMLElement {
  if (!node) return document.body
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement
    return (
      el.closest<HTMLElement>(`${BLOCK_SELECTOR}, ${READABLE_SELECTOR}, .verse`) ??
      el
    )
  }
  const parent = node.parentElement
  return (
    parent?.closest<HTMLElement>(`${BLOCK_SELECTOR}, ${READABLE_SELECTOR}, .verse`) ??
    parent ??
    document.body
  )
}

function selectionInMain(selection: Selection, root: HTMLElement): boolean {
  if (!selection.rangeCount) return false
  return root.contains(selection.getRangeAt(0).commonAncestorContainer)
}

function chunkFromSelection(selection: Selection): ReadChunk | null {
  const text = selection.toString().replace(/\s+/g, ' ').trim()
  if (!text) return null
  const element = elementFromNode(selection.focusNode ?? selection.anchorNode)
  return { index: 0, text, element }
}

/** Call on selectionchange so toolbar clicks can still read the last highlight. */
export function updateSelectionCache(): void {
  const root = document.getElementById('main-content')
  const selection = window.getSelection()
  if (!root || !selection || selection.isCollapsed || !selection.rangeCount) return
  if (!selectionInMain(selection, root)) return

  const chunk = chunkFromSelection(selection)
  if (!chunk) return

  selectionCache = { text: chunk.text, element: chunk.element }
}

export function getSelectionChunk(): ReadChunk | null {
  const root = document.getElementById('main-content')
  const selection = window.getSelection()

  if (root && selection && !selection.isCollapsed && selection.rangeCount) {
    if (selectionInMain(selection, root)) {
      const live = chunkFromSelection(selection)
      if (live) {
        selectionCache = { text: live.text, element: live.element }
        return live
      }
    }
  }

  if (selectionCache) {
    return { index: 0, text: selectionCache.text, element: selectionCache.element }
  }

  return null
}

export function clearChunkHighlights(root: HTMLElement) {
  root.querySelectorAll('[data-read-chunk-active]').forEach((el) => {
    el.removeAttribute('data-read-chunk-active')
    el.classList.remove('read-aloud-active')
  })
}

export function highlightChunk(element: HTMLElement) {
  const main =
    element.closest('main') ?? document.getElementById('main-content')
  if (main) clearChunkHighlights(main)
  element.setAttribute('data-read-chunk-active', 'true')
  element.classList.add('read-aloud-active')
  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function voiceQualityScore(voice: SpeechSynthesisVoice): number {
  let score = 0
  if (!voice.localService) score += 10
  if (/natural|premium|enhanced|neural|online|cloud/i.test(voice.name)) score += 5
  if (/google|microsoft|amazon|apple/i.test(voice.name)) score += 2
  if (voice.lang.startsWith('en')) score += 3
  if (voice.default) score += 1
  return score
}

export function sortVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return [...voices].sort((a, b) => {
    const diff = voiceQualityScore(b) - voiceQualityScore(a)
    if (diff !== 0) return diff
    return a.name.localeCompare(b.name)
  })
}

/**
 * Joke and character voices the operating system ships alongside real ones.
 * Apple's "Novelty" set (Bubbles, Zarvox, Bad News…) all report as en-US, so
 * filtering by language does not remove them — they have to be named. The
 * second block is the Eloquence-era character set added in recent macOS/iOS,
 * which exists in many languages and is equally wrong for scripture.
 */
const NOVELTY_VOICE_NAMES = new Set([
  'albert',
  'bad news',
  'bahh',
  'bells',
  'boing',
  'bubbles',
  'cellos',
  'deranged',
  'fred',
  'good news',
  'hysterical',
  'jester',
  'organ',
  'pipe organ',
  'superstar',
  'trinoids',
  'whisper',
  'wobble',
  'zarvox',
  // character voices
  'eddy',
  'flo',
  'grandma',
  'grandpa',
  'reed',
  'rocko',
  'sandy',
  'shelley',
])

/** "Grandma (Deutsch (Deutschland))" → "grandma"; "Microsoft David - English" → "microsoft david" */
function baseVoiceName(name: string): string {
  return name.split('(')[0].split(' - ')[0].trim().toLowerCase()
}

export function isNoveltyVoice(voice: SpeechSynthesisVoice): boolean {
  if (/eloquence/i.test(voice.name)) return true
  return NOVELTY_VOICE_NAMES.has(baseVoiceName(voice.name))
}

/**
 * Every genuine voice on the device, best first, across all languages.
 * Falls back to the raw list if a device somehow offers nothing else, so the
 * reader never ends up with an empty picker.
 */
export function usableVoices(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice[] {
  const genuine = voices.filter((v) => !isNoveltyVoice(v))
  return sortVoices(genuine.length > 0 ? genuine : voices)
}

export function pickDefaultVoice(
  voices: SpeechSynthesisVoice[],
  preferredURI?: string,
): SpeechSynthesisVoice | undefined {
  if (preferredURI) {
    const saved = voices.find((v) => v.voiceURI === preferredURI)
    if (saved) return saved
  }

  // The text is English, so start on an English voice even though every
  // language is on offer — sortVoices has already put the best one first.
  const english = voices.filter((v) => v.lang.startsWith('en'))
  const pool = english.length > 0 ? english : voices
  return pool.find((v) => !v.localService) ?? pool[0]
}

export function formatVoiceLabel(voice: SpeechSynthesisVoice): string {
  const lang = voice.lang.replace('_', '-')
  const tag = voice.localService ? 'Local' : 'Network'
  return `${voice.name} (${lang}, ${tag})`
}

/** "nl-NL" → "Dutch (Netherlands)", falling back to the raw tag. */
export function describeLanguage(tag: string): string {
  const normalised = tag.replace('_', '-')
  try {
    const [language, region] = normalised.split('-')
    const languageNames = new Intl.DisplayNames(['en'], { type: 'language' })
    const name = languageNames.of(language) ?? language
    if (!region) return name
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
    return `${name} (${regionNames.of(region.toUpperCase()) ?? region})`
  } catch {
    return normalised
  }
}

/**
 * Voices grouped by spoken language, for the pickers in the reader and the
 * guided tour. Pair with usableVoices so novelty voices never reach the list.
 */
export function groupVoicesByLanguage(
  voices: SpeechSynthesisVoice[],
): { label: string; voices: SpeechSynthesisVoice[] }[] {
  const byLanguage = new Map<string, SpeechSynthesisVoice[]>()

  for (const voice of voices) {
    const tag = voice.lang.replace('_', '-')
    const list = byLanguage.get(tag) ?? []
    list.push(voice)
    byLanguage.set(tag, list)
  }

  return [...byLanguage.entries()]
    .map(([tag, list]) => ({
      tag,
      label: describeLanguage(tag),
      voices: sortVoices(list),
    }))
    .sort((a, b) => {
      // The text is English, so English voices lead; the rest are alphabetical.
      const aEnglish = a.tag.startsWith('en')
      const bEnglish = b.tag.startsWith('en')
      if (aEnglish !== bEnglish) return aEnglish ? -1 : 1
      return a.label.localeCompare(b.label)
    })
    .map(({ label, voices: list }) => ({ label, voices: list }))
}

