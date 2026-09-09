'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { pickDefaultVoice, usableVoices } from '@/lib/readAloud'

const VOICE_KEY = 'tour-voice-uri'
const RATE_KEY = 'tour-speech-rate'
const ENABLED_KEY = 'tour-speech-on'
const MODE_KEY = 'tour-speech-mode'

/**
 * What narration reads. `tour` is the default: the guide's own words only, so
 * turning speech on never surprises you with a chapter of scripture.
 */
export type SpeechMode = 'tour' | 'passage' | 'both'

const MODES: SpeechMode[] = ['tour', 'passage', 'both']

/** Marks the stop event the tour fires at the page reader, so it can ignore it. */
export const TOUR_SPEECH_SOURCE = 'guided-tour'

type Session = { generation: number; stopped: boolean }

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : raw === 'true'
  } catch {
    return fallback
  }
}

/**
 * Speaks a queue of short strings with the browser's speech synthesis.
 *
 * Separate from useReadAloud, which walks the DOM of the page: here the guided
 * tour supplies the exact sentences it wants read. Every installed language is
 * offered, with novelty voices excluded — see usableVoices.
 */
export function useTourNarration() {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabledState] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURIState] = useState('')
  const [rate, setRateState] = useState(1)
  const [mode, setModeState] = useState<SpeechMode>('tour')
  const [segment, setSegment] = useState({ index: 0, total: 0 })

  const queueRef = useRef<string[]>([])
  const sessionRef = useRef<Session>({ generation: 0, stopped: true })
  const settingsRef = useRef({ rate, voiceURI })

  useEffect(() => {
    settingsRef.current = { rate, voiceURI }
  }, [rate, voiceURI])

  const loadVoices = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    // Every language the system offers, minus the joke and character voices.
    const list = usableVoices(window.speechSynthesis.getVoices())
    setVoices(list)
    setVoiceURIState((current) => {
      if (current && list.some((v) => v.voiceURI === current)) return current
      let saved: string | undefined
      try {
        saved = localStorage.getItem(VOICE_KEY) ?? undefined
      } catch {
        saved = undefined
      }
      return pickDefaultVoice(list, saved)?.voiceURI ?? list[0]?.voiceURI ?? ''
    })
  }, [])

  const stop = useCallback(() => {
    sessionRef.current.generation += 1
    sessionRef.current.stopped = true
    queueRef.current = []
    window.speechSynthesis?.cancel()
    setSpeaking(false)
    setSegment({ index: 0, total: 0 })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.speechSynthesis) {
      setSupported(false)
      return
    }

    setSupported(true)
    setEnabledState(readFlag(ENABLED_KEY, false))
    try {
      const saved = localStorage.getItem(MODE_KEY) as SpeechMode | null
      if (saved && MODES.includes(saved)) setModeState(saved)
    } catch {
      /* keep the default */
    }
    try {
      const savedRate = Number(localStorage.getItem(RATE_KEY))
      if (savedRate >= 0.5 && savedRate <= 2) setRateState(savedRate)
    } catch {
      /* keep the default */
    }

    loadVoices()
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices)

    // Yield if the page-level Listen toolbar takes over.
    const onOtherReaderStarted = () => {
      setEnabledState(false)
      stop()
    }
    window.addEventListener('read-aloud-started', onOtherReaderStarted)

    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices)
      window.removeEventListener('read-aloud-started', onOtherReaderStarted)
      window.speechSynthesis.cancel()
    }
  }, [loadVoices, stop])

  const speakFrom = useCallback(
    (index: number) => {
      const session = sessionRef.current
      if (session.stopped) return

      const queue = queueRef.current
      if (index >= queue.length) {
        setSpeaking(false)
        setSegment({ index: queue.length, total: queue.length })
        return
      }

      const generation = session.generation
      setSegment({ index, total: queue.length })

      const utterance = new SpeechSynthesisUtterance(queue[index])
      utterance.rate = settingsRef.current.rate

      const voice = window.speechSynthesis
        .getVoices()
        .find((v) => v.voiceURI === settingsRef.current.voiceURI)
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang
      }

      utterance.onend = () => {
        const now = sessionRef.current
        if (now.generation !== generation || now.stopped) return
        speakFrom(index + 1)
      }

      utterance.onerror = (event) => {
        const now = sessionRef.current
        if (now.generation !== generation || now.stopped) return
        if (event.error === 'interrupted' || event.error === 'canceled') return
        speakFrom(index + 1)
      }

      window.speechSynthesis.speak(utterance)
      setSpeaking(true)
    },
    [],
  )

  /** Replace whatever is being said with this queue. */
  const speak = useCallback(
    (segments: string[]) => {
      if (!window.speechSynthesis) return
      const queue = segments.map((s) => s.trim()).filter(Boolean)
      if (!queue.length) return

      // Silence the page reader, tagged so it doesn't bounce back at us.
      window.dispatchEvent(
        new CustomEvent('read-aloud-stop', {
          detail: { source: TOUR_SPEECH_SOURCE },
        }),
      )

      sessionRef.current.generation += 1
      sessionRef.current.stopped = false
      window.speechSynthesis.cancel()
      queueRef.current = queue

      // Chrome drops an utterance queued in the same tick as cancel().
      window.setTimeout(() => speakFrom(0), 60)
    },
    [speakFrom],
  )

  const setEnabled = useCallback(
    (next: boolean) => {
      setEnabledState(next)
      try {
        localStorage.setItem(ENABLED_KEY, String(next))
      } catch {
        /* private mode: the setting just won't persist */
      }
      if (!next) stop()
    },
    [stop],
  )

  const setVoiceURI = useCallback((uri: string) => {
    setVoiceURIState(uri)
    try {
      localStorage.setItem(VOICE_KEY, uri)
    } catch {
      /* ignore */
    }
  }, [])

  const setRate = useCallback((value: number) => {
    setRateState(value)
    try {
      localStorage.setItem(RATE_KEY, String(value))
    } catch {
      /* ignore */
    }
  }, [])

  const setMode = useCallback((value: SpeechMode) => {
    setModeState(value)
    try {
      localStorage.setItem(MODE_KEY, value)
    } catch {
      /* ignore */
    }
  }, [])

  return {
    supported,
    enabled,
    setEnabled,
    speaking,
    segment,
    speak,
    stop,
    voices,
    voiceURI,
    setVoiceURI,
    rate,
    setRate,
    mode,
    setMode,
  }
}
