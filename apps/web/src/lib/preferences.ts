'use client'

import { useEffect, useState } from 'react'

/** Player preferences, kept in this browser only. */
export interface Preferences {
  profileId: string
  /** Rows to use; null = all the keyboard's rows. */
  rows: string[] | null
  staff: boolean
  bass: boolean
  /** Playback speed in percent of the tune's tempo. */
  speed: number
  metronome: boolean
  countIn: boolean
  loop: boolean
  pdfStaff: boolean
  pdfColor: boolean
  /** Bars per line in the PDF; 0 = automatic. */
  pdfBarsPerLine: number
}

export const DEFAULT_PREFERENCES: Preferences = {
  profileId: 'hohner-2915-gc',
  rows: null,
  staff: true,
  bass: true,
  speed: 100,
  metronome: false,
  countIn: true,
  loop: false,
  pdfStaff: true,
  pdfColor: true,
  pdfBarsPerLine: 0,
}

const KEY = 'notenn.preferences.v1'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<T>) } : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private browsing or storage disabled: preferences simply last for this visit.
  }
}

export function usePreferences(): [Preferences, (patch: Partial<Preferences>) => void] {
  const [prefs, setPrefs] = useState(DEFAULT_PREFERENCES)
  useEffect(() => setPrefs(read(KEY, DEFAULT_PREFERENCES)), [])
  const update = (patch: Partial<Preferences>) =>
    setPrefs((p) => {
      const next = { ...p, ...patch }
      write(KEY, next)
      return next
    })
  return [prefs, update]
}

/** Fingerings edited by hand, per tune and keyboard. */
export function loadEdits(tuneKey: string): Record<string, { row: string; button: number; bellows: 'push' | 'pull' }> {
  return read(`notenn.edits.${tuneKey}`, {})
}

export function saveEdits(tuneKey: string, edits: Record<string, unknown>) {
  if (Object.keys(edits).length) write(`notenn.edits.${tuneKey}`, edits)
  else
    try {
      window.localStorage.removeItem(`notenn.edits.${tuneKey}`)
    } catch {
      // Nothing to clean up.
    }
}

/** Short stable key for a tune, from its title and notes. */
export function tuneKey(title: string, pitches: number[]): string {
  let h = 2166136261
  for (const c of title + ':' + pitches.join(',')) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return (h >>> 0).toString(36)
}
