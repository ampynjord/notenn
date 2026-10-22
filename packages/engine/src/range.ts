import { extractMelody, meterInfo, pickMelodyTrack } from './melody'
import type { MeterInfo, Note, Song } from './types'

export interface MelodyOptions {
  trackIndex?: number
  fromBar?: number
  toBar?: number
}

export interface MelodyRange {
  melody: Note[]
  meter: MeterInfo
  fromBar: number
  toBar: number
}

/** The melody of a song, cut to the requested bars (notes crossing the range are trimmed at both ends). */
export function melodyRange(song: Song, options: MelodyOptions = {}): MelodyRange {
  const meter = meterInfo(song.meter)
  const trackIndex = options.trackIndex ?? pickMelodyTrack(song.tracks)
  const track = song.tracks[trackIndex]
  if (!track) throw new Error(`Track ${trackIndex} not found`)

  let melody = extractMelody(track)
  const lastEnd = melody.reduce((m, n) => Math.max(m, n.start + n.dur), 0)
  const barCount = Math.max(1, Math.ceil((lastEnd - song.pickup - 1e-6) / meter.barLength))
  const fromBar = Math.min(Math.max(1, options.fromBar ?? 1), barCount)
  const toBar = Math.min(Math.max(fromBar, options.toBar ?? barCount), barCount)
  const t0 = fromBar === 1 ? 0 : song.pickup + (fromBar - 1) * meter.barLength
  const t1 = song.pickup + toBar * meter.barLength
  melody = melody
    .filter((n) => n.start < t1 - 1e-6 && n.start + n.dur > t0 + 1e-6)
    .map((n) => {
      const start = Math.max(n.start, t0)
      return { ...n, start, dur: Math.min(n.start + n.dur, t1) - start }
    })
  return { melody, meter, fromBar, toBar }
}

/**
 * Transposition, in semitones, that makes the most notes playable while staying close to the original
 * key: an octave is preferred to any other shift. Used by the instruments without a keyboard comfort zone.
 */
export function fitTranspose(pitches: number[], playable: Set<number>): number {
  let best = 0
  let bestCost = Infinity
  for (let t = -24; t <= 24; t++) {
    let cost = Math.abs(t) * 0.1 + (t % 12 === 0 ? 0 : 0.3)
    for (const p of pitches) if (!playable.has(p + t)) cost += 10
    if (cost < bestCost) {
      bestCost = cost
      best = t
    }
  }
  return best
}
