'use client'

import { useEffect, useState } from 'react'
import {
  Headphones,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  X,
} from 'lucide-react'
import FixedViewportLayer from '@/components/FixedViewportLayer'
import VoicePicker from '@/components/VoicePicker'
import { useReadAloud } from '@/hooks/useReadAloud'

export default function ReadAloudToolbar() {
  const [open, setOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [hint, setHint] = useState('')

  const {
    supported,
    status,
    chunks,
    currentIndex,
    progress,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
    voices,
    voiceURI,
    setVoiceURI,
    refreshVoices,
    mode,
    start,
    stop,
    togglePlayPause,
    skip,
  } = useReadAloud()

  const isActive = status === 'playing' || status === 'paused'

  useEffect(() => {
    if (!isActive) {
      setStatusMessage('')
      return
    }
    if (chunks.length === 0) return
    setStatusMessage(
      `Reading section ${currentIndex + 1} of ${chunks.length}${mode === 'selection' ? ' (selection)' : ''}`,
    )
  }, [isActive, chunks.length, currentIndex, mode])

  useEffect(() => {
    if (open) refreshVoices()
  }, [open, refreshVoices])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'r') {
        e.preventDefault()
        setOpen(true)
        if (status === 'idle') start('page')
        else togglePlayPause()
      }
      if (e.altKey && e.key === 's') {
        e.preventDefault()
        stop()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [start, stop, togglePlayPause, status])

  const handleStart = (readMode: 'page' | 'selection') => {
    const wasActive = isActive
    if (wasActive) stop()
    window.setTimeout(() => {
      const ok = start(readMode)
      if (!ok) {
        setHint(
          readMode === 'selection'
            ? 'Highlight some text on the page first, then try again.'
            : 'No readable content found on this page yet.',
        )
      } else {
        setHint('')
      }
    }, wasActive ? 100 : 0)
  }

  const handlePlayPause = () => {
    if (status === 'idle') {
      const ok = start('page')
      if (!ok) {
        setHint('No readable content found on this page yet.')
      } else {
        setHint('')
      }
    } else {
      setHint('')
      togglePlayPause()
    }
  }

  if (!supported) return null

  return (
    <FixedViewportLayer className="flex flex-col items-start gap-3 sm:bottom-6 sm:left-6 [&>*]:pointer-events-auto">
      <div data-read-aloud-ignore className="contents">
        <div role="status" aria-live="polite" className="sr-only">
          {statusMessage}
        </div>

        {open && (
          <div
            className="listen-panel fixed-viewport-panel overflow-hidden rounded-2xl border border-pine-600/80 bg-pine-800/95 shadow-xl backdrop-blur-xl dark:border-ocean-600/50 dark:bg-ocean-900/95 animate-listen-panel-in"
            role="region"
            aria-label="Listen to this page"
          >
            <div className="listen-panel-header px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-pine-100 dark:text-ocean-100" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold font-sans text-pine-50 dark:text-ocean-50">
                      Listen
                    </p>
                    <p className="text-xs font-sans text-pine-300/80 dark:text-ocean-300/80">
                      Powered by your browser
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex min-h-10 min-w-10 items-center justify-center rounded-full text-pine-200/80 transition-colors hover:bg-white/10 dark:text-ocean-200/80"
                  aria-label="Close listen panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {isActive && (
                <div
                  className="mt-3 flex h-6 items-end justify-center gap-1"
                  aria-hidden
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`listen-wave w-1 rounded-full bg-pine-200 dark:bg-ocean-300 ${
                        status === 'playing' ? 'listen-wave-active' : ''
                      }`}
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 p-4">
              {hint && (
                <p
                  role="status"
                  className="rounded-xl border border-amber-300/80 bg-amber-50 px-3 py-2 text-xs font-sans text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100"
                >
                  {hint}
                </p>
              )}

              {isActive && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-sans text-pine-300 dark:text-ocean-400">
                    <span>Progress</span>
                    <span>
                      {chunks.length > 0
                        ? `${currentIndex + 1} / ${chunks.length}`
                        : '—'}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-pine-600 dark:bg-ocean-700">
                    <div
                      className="h-full listen-progress-bar transition-all duration-300"
                      style={{ width: `${progress}%` }}
                      role="progressbar"
                      aria-valuenow={Math.round(progress)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => skip(-1)}
                  disabled={!isActive || currentIndex === 0}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-pine-600 text-pine-100 transition-colors hover:border-pine-400 disabled:opacity-40 dark:border-ocean-600 dark:text-ocean-100 dark:hover:border-ocean-400"
                  aria-label="Previous section"
                >
                  <SkipBack className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handlePlayPause}
                  className="flex min-h-14 min-w-14 items-center justify-center rounded-full listen-play-btn text-white shadow-lg transition-opacity hover:opacity-90"
                  aria-label={
                    status === 'playing'
                      ? 'Pause reading'
                      : status === 'paused'
                        ? 'Resume reading'
                        : 'Start reading page'
                  }
                >
                  {status === 'playing' ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 translate-x-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => skip(1)}
                  disabled={!isActive || currentIndex >= chunks.length - 1}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-pine-600 text-pine-100 transition-colors hover:border-pine-400 disabled:opacity-40 dark:border-ocean-600 dark:text-ocean-100 dark:hover:border-ocean-400"
                  aria-label="Next section"
                >
                  <SkipForward className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={stop}
                  disabled={!isActive}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-pine-600 text-pine-100 transition-colors hover:border-pine-400 disabled:opacity-40 dark:border-ocean-600 dark:text-ocean-100 dark:hover:border-ocean-400"
                  aria-label="Stop reading"
                >
                  <Square className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleStart('page')}
                  className={`min-h-11 rounded-xl px-3 text-xs font-medium font-sans transition-colors ${
                    mode === 'page' && isActive
                      ? 'listen-play-btn text-white'
                      : 'border border-pine-600 bg-pine-900 text-pine-100 hover:border-pine-400 dark:border-ocean-600 dark:bg-ocean-800/60 dark:text-ocean-100 dark:hover:border-ocean-400'
                  }`}
                >
                  Read full page
                </button>
                <button
                  type="button"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => handleStart('selection')}
                  className={`min-h-11 rounded-xl px-3 text-xs font-medium font-sans transition-colors ${
                    mode === 'selection' && isActive
                      ? 'listen-play-btn text-white'
                      : 'border border-pine-600 bg-pine-900 text-pine-100 hover:border-pine-400 dark:border-ocean-600 dark:bg-ocean-800/60 dark:text-ocean-100 dark:hover:border-ocean-400'
                  }`}
                >
                  Read selection
                </button>
              </div>

              <div className="space-y-3 border-t border-pine-700 pt-3 dark:border-ocean-700">
                <VoicePicker
                  voices={voices}
                  voiceURI={voiceURI}
                  onVoiceURI={setVoiceURI}
                  rate={rate}
                  onRate={setRate}
                  onRefreshVoices={refreshVoices}
                />

                <label className="block">
                  <span className="mb-1 flex justify-between text-xs font-medium font-sans text-pine-200 dark:text-ocean-300">
                    <span>Pitch</span>
                    <span>{pitch.toFixed(1)}</span>
                  </span>
                  <input
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    value={pitch}
                    onChange={(e) => setPitch(Number(e.target.value))}
                    className="listen-range w-full"
                    aria-label="Voice pitch"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 flex justify-between text-xs font-medium font-sans text-pine-200 dark:text-ocean-300">
                    <span>Volume</span>
                    <span>{Math.round(volume * 100)}%</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="listen-range w-full"
                    aria-label="Volume"
                  />
                </label>
              </div>

              <p className="text-center text-[10px] leading-relaxed font-sans text-pine-300 dark:text-ocean-300">
                Highlight text first for &ldquo;Read selection&rdquo;. Shortcuts: Alt+R
                play/pause · Alt+S stop
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`listen-fab group relative flex min-h-14 min-w-14 items-center justify-center rounded-full shadow-lg transition-all sm:min-h-16 sm:min-w-16 ${
            isActive ? 'listen-play-btn' : 'listen-fab-idle'
          }`}
          aria-expanded={open}
          aria-label={open ? 'Close listen controls' : 'Open listen controls'}
        >
          {isActive && status === 'playing' && (
            <span
              className="absolute inset-0 animate-ping rounded-full bg-pine-500/30 dark:bg-ocean-400/30"
              aria-hidden
            />
          )}
          {status === 'playing' ? (
            <Pause className="relative h-6 w-6 text-white" />
          ) : status === 'paused' ? (
            <Play className="relative h-6 w-6 translate-x-0.5 text-white" />
          ) : (
            <Headphones className="relative h-6 w-6 text-pine-50 transition-transform group-hover:scale-105 dark:text-ocean-100" />
          )}
          <span className="absolute -right-1 -top-1 flex h-5 items-center rounded-full bg-pine-100 px-1.5 text-[9px] font-bold uppercase tracking-wide text-pine-900 shadow-sm dark:bg-ocean-100 dark:text-ocean-900">
            Listen
          </span>
        </button>
      </div>
    </FixedViewportLayer>
  )
}
