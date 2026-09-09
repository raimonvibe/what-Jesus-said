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
 * filtering by language does not remove them. On iPhone the Web Speech API
 * also localizes the display name (Bulles, Burbujas, Bubbels…), so matching
 * the voiceURI identifier is what actually keeps scripture from being sung
 * by a cartoon.
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
  // Eloquence-era character set
  'eddy',
  'flo',
  'grandma',
  'grandpa',
  'reed',
  'rocko',
  'sandy',
  'shelley',
  // Localized Apple novelty names (iOS 17+)
  'bulles',
  'burbujas',
  'bollicine',
  'bubbels',
  'belletjes',
  'mauvaises nouvelles',
  'malas noticias',
  'brutte notizie',
  'slecht nieuws',
  'cloches',
  'campanas',
  'campane',
  'klokken',
  'violoncelles',
  'violonchelos',
  'violoncelli',
  'bonnes nouvelles',
  'buenas noticias',
  'buone notizie',
  'goed nieuws',
  'bouffon',
  'bufón',
  'giullare',
  'orgue',
  'órgano',
  'orgel',
  'murmure',
  'susurro',
  'sussurro',
  'fluister',
  'gefluister',
  'trinoides',
  'trinoïdes',
])

/** Tokens that appear in Apple voiceURI values such as
 *  com.apple.speech.synthesis.voice.Bubbles or
 *  com.apple.voice.compact.en-US.Bubbles */
const NOVELTY_URI_TOKENS = [
  'albert',
  'badnews',
  'bahh',
  'bells',
  'boing',
  'bubbles',
  'cellos',
  'deranged',
  'fred',
  'goodnews',
  'hysterical',
  'jester',
  'organ',
  'pipeorgan',
  'princess',
  'superstar',
  'trinoids',
  'whisper',
  'wobble',
  'zarvox',
  'eddy',
  'flo',
  'grandma',
  'grandpa',
  'reed',
  'rocko',
  'sandy',
  'shelley',
]

/** "Grandma (Deutsch (Deutschland))" → "grandma"; "Microsoft David - English" → "microsoft david" */
function baseVoiceName(name: string): string {
  return name.split('(')[0].split(' - ')[0].trim().toLowerCase()
}

function noveltyUriToken(uri: string): boolean {
  const normalised = uri.toLowerCase().replace(/[^a-z0-9]+/g, '.')
  return NOVELTY_URI_TOKENS.some(
    (token) =>
      normalised.includes(`.${token}.`) ||
      normalised.endsWith(`.${token}`) ||
      normalised.includes(`voice.${token}`),
  )
}

export function isNoveltyVoice(voice: SpeechSynthesisVoice): boolean {
  if (/eloquence/i.test(voice.name) || /eloquence/i.test(voice.voiceURI)) {
    return true
  }
  if (noveltyUriToken(voice.voiceURI) || noveltyUriToken(voice.name)) {
    return true
  }
  return NOVELTY_VOICE_NAMES.has(baseVoiceName(voice.name))
}

/**
 * Every genuine reading voice on the device, best first, across all languages.
 * Novelty voices (Bubbles and the rest of Apple's joke set) stay out even if
 * that leaves the list short — an empty picker is better than a cartoon voice.
 */
export function usableVoices(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice[] {
  return sortVoices(voices.filter((v) => !isNoveltyVoice(v)))
}

/**
 * Language the page is being read in. Google Translate leaves <html lang>
 * as "en" and instead sets a cookie, hash, combo box, or translated-* class.
 */
export function detectPageSpeechLang(): string {
  if (typeof document === 'undefined') return 'en'

  const hash = window.location.hash.match(
    /googtrans\([a-zA-Z-]+[|/]([a-zA-Z-]+)\)/,
  )
  if (hash?.[1]) return hash[1].toLowerCase()

  const cookie = document.cookie.match(/googtrans=\/[a-zA-Z-]+\/([a-zA-Z-]+)/)
  if (cookie?.[1]) return cookie[1].toLowerCase()

  const combo = document.querySelector(
    'select.goog-te-combo',
  ) as HTMLSelectElement | null
  if (combo?.value) return combo.value.toLowerCase()

  const html = document.documentElement
  if (
    html.classList.contains('translated-ltr') ||
    html.classList.contains('translated-rtl')
  ) {
    return (navigator.language || 'en').toLowerCase()
  }

  return (html.getAttribute('lang') || 'en').toLowerCase()
}

export function pageIsTranslated(): boolean {
  if (typeof document === 'undefined') return false
  if (/googtrans/.test(window.location.hash)) return true
  if (/googtrans=/.test(document.cookie)) return true
  const combo = document.querySelector(
    'select.goog-te-combo',
  ) as HTMLSelectElement | null
  if (combo?.value && languagePrefix(combo.value) !== 'en') return true
  const html = document.documentElement
  return (
    html.classList.contains('translated-ltr') ||
    html.classList.contains('translated-rtl')
  )
}

export function pageSpeechLangChanged(onChange: () => void): () => void {
  const html = document.documentElement
  const observer = new MutationObserver(onChange)
  observer.observe(html, { attributes: true, attributeFilter: ['class', 'lang'] })
  window.addEventListener('hashchange', onChange)

  const onCombo = (event: Event) => {
    const target = event.target
    if (
      target instanceof HTMLSelectElement &&
      target.classList.contains('goog-te-combo')
    ) {
      onChange()
    }
  }
  document.addEventListener('change', onCombo, true)

  // iOS Safari Translate often sets the googtrans cookie without a hashchange.
  let last = detectPageSpeechLang()
  const poll = window.setInterval(() => {
    const next = detectPageSpeechLang()
    if (next === last) return
    last = next
    onChange()
  }, 1500)

  return () => {
    observer.disconnect()
    window.removeEventListener('hashchange', onChange)
    document.removeEventListener('change', onCombo, true)
    window.clearInterval(poll)
  }
}

export function languagePrefix(tag: string): string {
  return tag.replace('_', '-').split('-')[0]?.toLowerCase() || 'en'
}

export function applyUtteranceVoice(
  utterance: SpeechSynthesisUtterance,
  voice: SpeechSynthesisVoice | undefined,
) {
  const pageLang = detectPageSpeechLang()
  if (voice) {
    utterance.voice = voice
    utterance.lang = voice.lang.replace('_', '-')
    return
  }
  utterance.lang = pageLang
}

function voicesForLang(
  voices: SpeechSynthesisVoice[],
  lang: string,
): SpeechSynthesisVoice[] {
  const prefix = languagePrefix(lang)
  return voices.filter((v) => languagePrefix(v.lang) === prefix)
}

export function pickDefaultVoice(
  voices: SpeechSynthesisVoice[],
  preferredURI?: string,
  pageLang?: string,
): SpeechSynthesisVoice | undefined {
  const target = pageLang || 'en'
  if (preferredURI) {
    const saved = voices.find((v) => v.voiceURI === preferredURI)
    if (
      saved &&
      (!pageIsTranslated() ||
        languagePrefix(saved.lang) === languagePrefix(target))
    ) {
      return saved
    }
  }

  const matching = voicesForLang(voices, target)
  const english = voicesForLang(voices, 'en')
  const pool =
    matching.length > 0 ? matching : english.length > 0 ? english : voices
  return pool.find((v) => !v.localService) ?? pool[0]
}

const SPOKEN_SKIP =
  'button, svg, select, input, [data-read-aloud-ignore], [aria-hidden="true"]'

/**
 * Visible text in a panel, so Google Translate's on-screen language is spoken.
 * Reads the live DOM (not a clone): Translate hides the English original with
 * CSS, and a clone would still contain it, so speech would mix both languages.
 */
export function extractSpokenBlocks(root: HTMLElement): string[] {
  const nodes = Array.from(
    root.querySelectorAll<HTMLElement>('h2, h3, p, blockquote, li'),
  ).filter((el) => !el.closest(SPOKEN_SKIP))

  const unique = nodes.filter((el) =>
    nodes.every((other) => other === el || !other.contains(el)),
  )

  return unique
    .map((el) => el.innerText.replace(/\s+/g, ' ').trim())
    .filter((text) => text.length > 1)
}

/**
 * Google Translate rewrites the card after it paints. Wait until those
 * mutations settle (or the timeout) so speech does not start in English
 * and then talk over a Dutch rewrite.
 */
export function waitForSpokenText(
  root: HTMLElement,
  timeoutMs = 1600,
): Promise<void> {
  if (!pageIsTranslated()) return Promise.resolve()

  return new Promise((resolve) => {
    let settle: ReturnType<typeof setTimeout> | undefined
    let finished = false

    const finish = () => {
      if (finished) return
      finished = true
      observer.disconnect()
      if (settle) window.clearTimeout(settle)
      resolve()
    }

    const bump = () => {
      if (settle) window.clearTimeout(settle)
      settle = window.setTimeout(finish, 280)
    }

    const observer = new MutationObserver(bump)
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
    })
    window.setTimeout(finish, timeoutMs)
    bump()
  })
}

const PASSAGE_CUE: Record<string, string> = {
  en: 'The passage.',
  nl: 'Het Bijbelgedeelte.',
  de: 'Die Bibelstelle.',
  fr: 'Le passage.',
  es: 'El pasaje.',
  it: 'Il passo.',
  pt: 'A passagem.',
  pl: 'Fragment.',
  sv: 'Stycket.',
  da: 'Afsnittet.',
  no: 'Avsnittet.',
  fi: 'Kohta.',
  ru: 'Отрывок.',
  uk: 'Уривок.',
  el: 'Το χωρίο.',
  ro: 'Pasajul.',
  cs: 'Oddíl.',
  hu: 'A szakasz.',
  tr: 'Pasaj.',
  id: 'Nas itu.',
  vi: 'Đoạn văn.',
  ja: '聖書箇所。',
  ko: '본문.',
  zh: '经文。',
  ar: 'المقطع.',
  he: 'הקטע.',
  hi: 'अंश।',
}

/** Label spoken between the card and the verses in "Both" mode. */
export function spokenPassageCue(panel?: HTMLElement | null): string {
  const tab = panel?.querySelector<HTMLElement>(
    '.tour-pane-switch button:last-of-type',
  )
  const fromTab = tab?.innerText.replace(/\s+/g, ' ').trim()
  if (fromTab) return fromTab.endsWith('.') ? fromTab : `${fromTab}.`
  const lang = languagePrefix(detectPageSpeechLang())
  return PASSAGE_CUE[lang] ?? PASSAGE_CUE.en
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
      const prefer = languagePrefix(detectPageSpeechLang())
      const aMatch = languagePrefix(a.tag) === prefer
      const bMatch = languagePrefix(b.tag) === prefer
      if (aMatch !== bMatch) return aMatch ? -1 : 1
      const aEnglish = a.tag.startsWith('en')
      const bEnglish = b.tag.startsWith('en')
      if (aEnglish !== bEnglish) return aEnglish ? -1 : 1
      return a.label.localeCompare(b.label)
    })
    .map(({ label, voices: list }) => ({ label, voices: list }))
}

