import type { Meter, MeterInfo, Note, Track } from './types'

/** Snaps to the sixteenth-note grid, or to triplets when clearly closer (for files recorded live). */
export function snap(x: number): number {
  const a = Math.round(x * 4) / 4
  const b = Math.round(x * 3) / 3
  return Math.abs(b - x) < Math.abs(a - x) - 0.04 ? b : a
}

/** One note at a time (the highest), durations snapped, small gaps tied over. */
export function extractMelody(track: Track): Note[] {
  const byStart = new Map<number, Note>()
  for (const n of track.notes) {
    const start = Math.round(snap(n.start) * 12) / 12
    const dur = Math.max(0.25, snap(n.dur))
    const cur = byStart.get(start)
    if (!cur || n.pitch > cur.pitch) byStart.set(start, { start, dur, pitch: n.pitch })
  }
  const notes = [...byStart.values()].sort((a, b) => a.start - b.start)
  for (let i = 0; i < notes.length - 1; i++) {
    const cur = notes[i]!
    const next = notes[i + 1]!
    const gap = next.start - (cur.start + cur.dur)
    if (gap > 0 && gap <= 0.5) cur.dur += gap
    cur.dur = Math.min(cur.dur, next.start - cur.start)
  }
  return notes.filter((n) => n.dur > 0.05)
}

/**
 * Lower voices under a melody: for each melody note, the notes of the track that start with it
 * (on the same snapped onset) and sit below it, highest first. Returns one list per extra voice;
 * each note keeps the melody note's start and is cut to its duration.
 */
export function extractLowerVoices(track: Track, melody: Note[], extra: number): Note[][] {
  const voices: Note[][] = Array.from({ length: extra }, () => [])
  if (extra <= 0) return voices
  const byStart = new Map<number, number[]>()
  for (const n of track.notes) {
    const start = Math.round(snap(n.start) * 12) / 12
    const list = byStart.get(start) ?? []
    list.push(n.pitch)
    byStart.set(start, list)
  }
  for (const m of melody) {
    const below = [...new Set(byStart.get(m.start) ?? [])].filter((p) => p < m.pitch).sort((a, b) => b - a)
    below.slice(0, extra).forEach((pitch, v) => voices[v]!.push({ start: m.start, dur: m.dur, pitch }))
  }
  return voices
}

/** How likely a track is to be the melody: monophony, variety, register, name.
 * The name patterns match English and French track names on purpose. */
export function melodyScore(track: Track): number {
  const n = track.notes.length
  if (n < 12) return 0
  const onsets = new Map<number, number>()
  for (const x of track.notes) {
    const k = Math.round(x.start * 4)
    onsets.set(k, (onsets.get(k) ?? 0) + 1)
  }
  const mono = [...onsets.values()].filter((v) => v === 1).length / onsets.size
  const avg = track.notes.reduce((a, x) => a + x.pitch, 0) / n
  const distinct = new Set(track.notes.map((x) => x.pitch)).size
  const sorted = [...track.notes].sort((a, b) => a.start - b.start)
  let repeats = 0
  for (let i = 1; i < sorted.length; i++) if (sorted[i]!.pitch === sorted[i - 1]!.pitch) repeats++
  let score = Math.sqrt(onsets.size) * (0.35 + 0.65 * mono) * Math.min(1, distinct / 7)
  score *= avg >= 58 && avg <= 86 ? 1 : avg >= 52 && avg <= 92 ? 0.55 : 0.2
  score *= repeats / Math.max(1, n - 1) > 0.6 ? 0.45 : 1
  const name = track.name.toLowerCase()
  if (/melod|mélod|lead|right|droite|vocal|voice|voix|chant|solo|flute|flûte|whistle|violin|soprano|sopran|cantus|treble|dessus/.test(name)) score *= 1.6
  // Inner choir voices (not instruments: "alto sax", "tenor sax" stay neutral).
  if (/\balto\b|tenor|ténor/.test(name) && !/sax|clar|flute|flûte|recorder|horn|trombone|viol|banjo|uku|guit|bugle|cornet/.test(name)) score *= 0.7
  if (/bass|basse|left|gauche|drum|batt|perc|pad|chord|accord|accomp|string/.test(name)) score *= 0.45
  return score
}

/**
 * Most likely melody track; on equal scores (short tracks), the one with the most notes. Empty tracks are
 * ignored. Among voices singing together (chorale, choir) the melody is usually the highest one, so the
 * track with the highest average register gets a bonus.
 */
export function pickMelodyTrack(tracks: Track[]): number {
  let best = 0
  let bestScore = -1
  const avg = tracks.map((t) => (t.notes.length ? t.notes.reduce((a, x) => a + x.pitch, 0) / t.notes.length : -Infinity))
  const highest = avg.indexOf(Math.max(...avg))
  tracks.forEach((t, i) => {
    if (!t.notes.length) return
    const s = melodyScore(t) * (i === highest ? 1.25 : 1) + t.notes.length * 1e-6
    if (s > bestScore) {
      bestScore = s
      best = i
    }
  })
  return best
}

/** Compound meters (6/8, 9/8, 12/8, 6/4…): the beat spans three subdivisions. */
export function meterInfo(m: Meter): MeterInfo {
  const barLength = (m.num * 4) / m.den
  const beat = m.num % 3 === 0 && m.num > 3 ? (3 * 4) / m.den : 4 / m.den
  return { barLength, beat, beatsPerBar: Math.round(barLength / beat) }
}
