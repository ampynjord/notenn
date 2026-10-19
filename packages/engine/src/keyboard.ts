import type { Fingering, InstrumentProfile } from './types'

export function fingeringsFor(pitch: number, profile: InstrumentProfile, rows: string[]): Fingering[] {
  const out: Fingering[] = []
  for (const row of profile.rows) {
    if (!rows.includes(row.id)) continue
    row.buttons.forEach((b, i) => {
      const y = i + row.offset
      if (b.push === pitch) out.push({ row: row.id, button: i + 1, bellows: 'push', y })
      if (b.pull === pitch) out.push({ row: row.id, button: i + 1, bellows: 'pull', y })
    })
  }
  return out
}

export function playablePitches(profile: InstrumentProfile, rows: string[]): Set<number> {
  const set = new Set<number>()
  for (const row of profile.rows) {
    if (!rows.includes(row.id)) continue
    for (const b of row.buttons) {
      set.add(b.push)
      set.add(b.pull)
    }
  }
  return set
}

/**
 * Closest playable pitch: the same pitch, then neighbours one to three semitones away,
 * then the same pitch in another octave, then simply the closest playable pitch.
 * Never returns an unplayable pitch: no note is lost, it is flagged as replaced instead.
 */
export function nearestPlayable(pitch: number, playable: Set<number>): number {
  if (!playable.size) throw new Error('Keyboard has no notes')
  for (const d of [0, -1, 1, -2, 2, -3, 3]) if (playable.has(pitch + d)) return pitch + d
  for (const o of [12, 24, 36, 48]) {
    for (const d of [0, -1, 1, -2, 2]) {
      if (playable.has(pitch + o + d)) return pitch + o + d
      if (playable.has(pitch - o + d)) return pitch - o + d
    }
  }
  let best = pitch
  let dist = Infinity
  for (const p of playable) if (Math.abs(p - pitch) < dist) [best, dist] = [p, Math.abs(p - pitch)]
  return best
}

/**
 * Transposition that makes the most notes playable while staying close to the original key and in the
 * comfortable middle of the keyboard. The comfort zone is measured from the keyboard itself (its median
 * pitch), so it follows the instrument's key: tuned on a G/C keyboard, whose median is MIDI 69.
 */
export function bestTranspose(pitches: number[], playable: Set<number>): number {
  const sorted = [...playable].sort((a, b) => a - b)
  const shift = sorted.length ? sorted[Math.floor(sorted.length / 2)]! - 69 : 0
  const lo = 55 + shift
  const hi = 84 + shift
  const centre = 71 + shift
  let best = 0
  let bestCost = Infinity
  for (let t = -24; t <= 24; t++) {
    let cost = Math.abs(t) * 0.08 + (t % 12 === 0 ? 0 : 0.3)
    let sum = 0
    for (const p0 of pitches) {
      const p = p0 + t
      sum += p
      if (!playable.has(p)) cost += 10
      if (p < lo || p > hi) cost += 1.5
    }
    if (pitches.length) cost += Math.max(0, Math.abs(sum / pitches.length - centre) - 6) * 0.2
    if (cost < bestCost) {
      bestCost = cost
      best = t
    }
  }
  return best
}

export const pitchClass = (p: number) => ((p % 12) + 12) % 12
