import { pitchClass } from './keyboard'
import type { BassEvent, BassGroup, BassQuality, Fingering, InstrumentProfile, MeterInfo, Note } from './types'

/**
 * Stradella left hand of the chromatic accordion: columns of buttons in fifths, six rows
 * (counter-bass, fundamental bass, major, minor, seventh and diminished chords).
 * The columns drawn here are the twelve different roots; the 120-bass instruments repeat a few of them.
 */
export const STRADELLA_ROOTS = [3, 10, 5, 0, 7, 2, 9, 4, 11, 6, 1, 8] // Eb Bb F C G D A E B F# C# G#
/** Rows from the outside of the keyboard to the bellows. */
export const STRADELLA_ROWS: BassQuality[] = ['counter', 'bass', 'major', 'minor', 'seventh', 'diminished']

type ChordQuality = 'major' | 'minor' | 'seventh' | 'diminished'
/** Intervals above the root of each chord button (the seventh chord leaves out the fifth, as on the instrument). */
const CHORDS: Record<ChordQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  seventh: [0, 4, 10],
  diminished: [0, 3, 6, 9],
}
const COUNTER_INTERVAL = 4

/** The columns of the Stradella keyboard as bass groups (the same on push and pull; the chord is the major one). */
export function stradellaGroups(): BassGroup[] {
  return STRADELLA_ROOTS.map((root, i) => {
    const side = { bass: root, chord: CHORDS.major.map((iv) => (root + iv) % 12) }
    return { id: i + 1, push: side, pull: side }
  })
}

/** What an event of the left hand sounds: the bass note and the chord, as pitch classes. */
export function bassEventNotes(profile: Pick<InstrumentProfile, 'bassGroups'>, ev: Pick<BassEvent, 'group' | 'bellows' | 'quality'>): { bass: number; chord: number[] } | null {
  const g = profile.bassGroups.find((x) => x.id === ev.group)
  if (!g) return null
  const side = g[ev.bellows]
  // Diatonic groups: one bass and one chord per button pair.
  if (!ev.quality) return side
  const root = side.bass
  if (ev.quality === 'counter') return { bass: (root + COUNTER_INTERVAL) % 12, chord: [] }
  if (ev.quality === 'bass') return { bass: root, chord: [] }
  return { bass: root, chord: CHORDS[ev.quality].map((iv) => (root + iv) % 12) }
}

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]

/** Tonic of the most likely major key: the one whose scale holds the most of the melody (the last note breaks ties). */
export function estimateKey(notes: Note[]): number {
  let best = 0
  let bestScore = -1
  for (let tonic = 0; tonic < 12; tonic++) {
    let score = 0
    for (const n of notes) if (MAJOR_SCALE.includes((pitchClass(n.pitch) - tonic + 12) % 12)) score += n.dur
    const last = notes.at(-1)
    if (last) {
      const rel = (pitchClass(last.pitch) - tonic + 12) % 12
      if (rel === 0) score += 0.5
      else if (rel === 9) score += 0.25
    }
    if (score > bestScore + 1e-9) {
      best = tonic
      bestScore = score
    }
  }
  return best
}

/**
 * Chords of a key, by degree: the root's distance from the major tonic and the quality it takes, the primary
 * chords (tonic, subdominant, dominant) and the dominant, which may take a seventh.
 * A melody ending on the relative minor's tonic is harmonised in that minor key (E major as its dominant).
 */
const MAJOR_KEY = { chords: { 0: 'major', 2: 'minor', 4: 'minor', 5: 'major', 7: 'major', 9: 'minor' } as Record<number, ChordQuality>, primary: [0, 5, 7], tonic: 0, dominant: 7 }
const MINOR_KEY = { chords: { 0: 'major', 2: 'minor', 4: 'major', 5: 'major', 7: 'major', 9: 'minor' } as Record<number, ChordQuality>, primary: [9, 2, 4], tonic: 9, dominant: 4 }

/** One bass or chord of the harmony: the column of the Stradella keyboard, and for a chord its quality. */
export interface HarmonyBeat {
  time: number
  group: number
  isBass: boolean
  quality: BassQuality
}

/**
 * One bass or chord per beat: bass (fundamental) on the first beat of the bar, a chord on the others. The chord
 * holds the sounding note and keeps to the chords of the key (I, ii, iii, IV, V, vi, the seventh on V),
 * staying on the same button when it can. Shared by the Stradella keyboard and the left hand of the piano.
 */
export function harmonize(
  notes: Note[],
  groups: BassGroup[],
  meter: MeterInfo,
  pickup: number,
  fromBar: number,
  toBar: number,
): HarmonyBeat[] {
  const key = estimateKey(notes)
  const last = notes.at(-1)
  const mode = last && (pitchClass(last.pitch) - key + 12) % 12 === 9 ? MINOR_KEY : MAJOR_KEY
  const out: HarmonyBeat[] = []
  let prev: { group: number; quality: ChordQuality } | null = null
  for (let bar = fromBar; bar <= toBar; bar++) {
    for (let k = 0; k < meter.beatsPerBar; k++) {
      const t = pickup + (bar - 1) * meter.barLength + k * meter.beat
      const i = notes.findIndex((n) => n.start <= t + 1e-6 && t < n.start + n.dur - 1e-6)
      if (i < 0) {
        prev = null
        continue
      }
      const pc = pitchClass(notes[i]!.pitch)
      const inBeat = notes
        .filter((n) => n.start >= t - 1e-6 && n.start < t + meter.beat - 1e-6)
        .map((n) => pitchClass(n.pitch))
      let best: { group: number; quality: ChordQuality } | null = null
      let bestScore = -Infinity
      for (const g of groups) {
        const root = g.push.bass
        const degree = (root - key + 12) % 12
        for (const quality of Object.keys(CHORDS) as ChordQuality[]) {
          const chord = CHORDS[quality].map((iv) => (root + iv) % 12)
          if (!chord.includes(pc)) continue
          let score = 1 + inBeat.filter((x) => chord.includes(x)).length * 0.3
          if (mode.chords[degree] === quality) score += 0.6 + (mode.primary.includes(degree) ? 0.2 : 0) + (degree === mode.tonic ? 0.25 : 0)
          else if (quality === 'seventh' && degree === mode.dominant) score += 0.35
          else if (quality === 'diminished' && degree === 11) score += 0.3
          else score -= 0.5
          if (quality === 'diminished') score -= 0.1
          if (prev && prev.group === g.id && prev.quality === quality) score += 0.5
          if (score > bestScore + 1e-9) {
            bestScore = score
            best = { group: g.id, quality }
          }
        }
      }
      if (best) {
        out.push({ time: t, group: best.group, isBass: k === 0, quality: k === 0 ? 'bass' : best.quality })
        prev = best
      } else prev = null
    }
  }
  return out
}

/** The Stradella left hand: the harmony, in the bellows direction of the sounding right-hand note (no difference in sound). */
export function chooseStradellaBass(
  notes: Note[],
  fingering: Fingering[],
  profile: InstrumentProfile,
  meter: MeterInfo,
  pickup: number,
  fromBar: number,
  toBar: number,
): BassEvent[] {
  return harmonize(notes, profile.bassGroups, meter, pickup, fromBar, toBar).map((h) => {
    const i = notes.findIndex((n) => n.start <= h.time + 1e-6 && h.time < n.start + n.dur - 1e-6)
    return { time: h.time, group: h.group, bellows: fingering[i]!.bellows, isBass: h.isBass, quality: h.quality }
  })
}
