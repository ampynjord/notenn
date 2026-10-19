'use client'

import { useEffect, useRef, useState } from 'react'

import { useAccount } from './account'

/** Workshop settings: kept on the account when signed in, for this visit only otherwise. */
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

/** Keeps only known keys with the right type, so an old or tampered value cannot break the workshop. */
export function sanitizePreferences(raw: unknown): Partial<Preferences> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const def = DEFAULT_PREFERENCES[k as keyof Preferences]
    if (def === undefined) continue
    if (k === 'rows') {
      if (v === null || (Array.isArray(v) && v.every((x) => typeof x === 'string'))) out[k] = v
    } else if (typeof v === typeof def) out[k] = v
  }
  return out as Partial<Preferences>
}

export function usePreferences(): [Preferences, (patch: Partial<Preferences>) => void] {
  const { member, saveSettings } = useAccount()
  const [prefs, setPrefs] = useState(DEFAULT_PREFERENCES)
  const loadedFor = useRef<number | null>(null)

  // The account's settings are applied once, when the member is known.
  useEffect(() => {
    if (!member || loadedFor.current === member.id) return
    loadedFor.current = member.id
    setPrefs({ ...DEFAULT_PREFERENCES, ...sanitizePreferences(member.settings) })
  }, [member])

  const current = useRef(prefs)
  current.current = prefs
  const update = (patch: Partial<Preferences>) => {
    const next = { ...current.current, ...patch }
    current.current = next
    setPrefs(next)
    if (member) saveSettings(next as unknown as Record<string, unknown>)
  }
  return [prefs, update]
}
