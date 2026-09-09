'use client'

import { Gauge } from 'lucide-react'
import { formatVoiceLabel, groupVoicesByLanguage } from '@/lib/readAloud'

const SPEEDS = [0.75, 1, 1.25, 1.5] as const

const SELECT_CLASS =
  'w-full min-h-11 rounded-xl border border-pine-600 bg-pine-800 px-3 font-sans text-xs text-pine-50 focus:border-pine-300 focus:outline-none focus:ring-2 focus:ring-pine-500/30 dark:border-ocean-600 dark:bg-ocean-800 dark:text-ocean-50 dark:focus:border-ocean-400 dark:focus:ring-ocean-400/30'

interface VoicePickerProps {
  voices: SpeechSynthesisVoice[]
  voiceURI: string
  onVoiceURI: (uri: string) => void
  rate: number
  onRate: (rate: number) => void
  onRefreshVoices?: () => void
  hint?: string
}

export default function VoicePicker({
  voices,
  voiceURI,
  onVoiceURI,
  rate,
  onRate,
  onRefreshVoices,
  hint,
}: VoicePickerProps) {
  return (
    <div className="space-y-2 min-[960px]:space-y-3">
      <label className="block">
        <span className="mb-1 block font-sans text-xs font-medium text-pine-200 dark:text-ocean-300">
          Voice
        </span>
        <select
          value={voiceURI}
          onPointerDown={() => onRefreshVoices?.()}
          onFocus={() => onRefreshVoices?.()}
          onChange={(event) => onVoiceURI(event.target.value)}
          className={SELECT_CLASS}
          aria-label="Reading voice"
        >
          {voices.length === 0 ? (
            <option value="">Loading voices…</option>
          ) : (
            groupVoicesByLanguage(voices).map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.voices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {formatVoiceLabel(voice)}
                  </option>
                ))}
              </optgroup>
            ))
          )}
        </select>
      </label>
      <div>
        <span className="mb-1 flex items-center gap-1 font-sans text-xs font-medium text-pine-200 dark:text-ocean-300">
          <Gauge className="h-3.5 w-3.5" aria-hidden />
          Speed
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => onRate(speed)}
              aria-pressed={rate === speed}
              className={`min-h-8 min-w-[2.75rem] rounded-lg px-2 font-sans text-xs font-medium min-[960px]:min-h-9 min-[960px]:min-w-[3rem] transition-colors ${
                rate === speed
                  ? 'bg-pine-100 text-pine-900 dark:bg-ocean-200 dark:text-ocean-950'
                  : 'bg-pine-800 text-pine-100 hover:bg-pine-700 dark:bg-ocean-800 dark:text-ocean-100 dark:hover:bg-ocean-700'
              }`}
            >
              {speed}×
            </button>
          ))}
        </div>
      </div>
      {hint && (
        <p className="hidden font-sans text-[10px] leading-relaxed text-pine-300 min-[960px]:block dark:text-ocean-300">
          {hint}
        </p>
      )}
    </div>
  )
}
