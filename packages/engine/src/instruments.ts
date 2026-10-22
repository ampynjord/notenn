import { nearestPlayable } from './keyboard'
import { fitTranspose, melodyRange, type MelodyOptions } from './range'
import type { Song, StringArrangement, StringNote, StringPosition, StringProfile, WhistleArrangement, WhistleNote, WhistleProfile } from './types'

export interface InstrumentOptions extends MelodyOptions {
  /** Transposition in semitones, or 'auto'. */
  transpose?: number | 'auto'
  /** Strings: capo fret (0 = none). */
  capo?: number
}

/** Every pitch a fretted instrument can sound, with the capo. */
export function stringPitches(profile: StringProfile, capo = 0): Set<number> {
  const set = new Set<number>()
  for (const open of profile.tuning) for (let f = capo; f <= profile.frets; f++) set.add(open + f)
  return set
}

/** Every way to play a pitch: a string and a fret counted from the nut (the capo fret for an "open" string). */
export function stringPositions(pitch: number, profile: StringProfile, capo = 0): StringPosition[] {
  const out: StringPosition[] = []
  profile.tuning.forEach((open, string) => {
    const fret = pitch - open
    if (fret >= capo && fret <= profile.frets) out.push({ string, fret })
  })
  return out
}

/**
 * Tab for a fretted instrument: for each melody note, the string and fret, chosen by dynamic
 * programming to keep the hand in one place (small fret and string changes, low positions).
 * `fret` is the number written in the tab, counted from the nut (capo included).
 */
export function arrangeStrings(song: Song, profile: StringProfile, options: InstrumentOptions = {}): StringArrangement {
  const capo = options.capo ?? 0
  const { melody, meter, fromBar, toBar } = melodyRange(song, options)
  const playable = stringPitches(profile, capo)
  const transpose =
    options.transpose === undefined || options.transpose === 'auto'
      ? fitTranspose(melody.map((n) => n.pitch), playable)
      : options.transpose

  const placed = melody.map((n) => {
    const original = n.pitch + transpose
    const pitch = nearestPlayable(original, playable)
    return { ...n, original, pitch, approx: pitch !== original }
  })

  const choices = placed.map((n) => stringPositions(n.pitch, profile, capo))
  // Low positions are easier to play: the cost grows with the fret, faster above the seventh.
  const nodeCost = (p: StringPosition) => 0.08 * p.fret + (p.fret > 7 ? 0.12 * (p.fret - 7) : 0)
  const moveCost = (a: StringPosition, b: StringPosition) => {
    const dFret = Math.abs(a.fret - b.fret)
    const open = a.fret === 0 || b.fret === 0
    return dFret * (open ? 0.1 : 0.3) + Math.abs(a.string - b.string) * 0.15
  }
  // Viterbi over the melody.
  const cost: number[][] = []
  const back: number[][] = []
  choices.forEach((opts, i) => {
    cost[i] = []
    back[i] = []
    opts.forEach((p, j) => {
      if (i === 0) {
        cost[i]![j] = nodeCost(p)
        back[i]![j] = -1
        return
      }
      let best = Infinity
      let from = 0
      choices[i - 1]!.forEach((q, k) => {
        const c = cost[i - 1]![k]! + moveCost(q, p)
        if (c < best) [best, from] = [c, k]
      })
      cost[i]![j] = best + nodeCost(p)
      back[i]![j] = from
    })
  })
  const chosen: StringPosition[] = []
  const last = choices.length - 1
  if (last >= 0) {
    let j = cost[last]!.reduce((bi, c, k, all) => (c < all[bi]! ? k : bi), 0)
    for (let i = last; i >= 0; i--) {
      chosen[i] = choices[i]![j]!
      j = back[i]![j]!
    }
  }

  const notes: StringNote[] = placed.map((n, i) => ({ ...n, position: chosen[i]! }))
  return { notes, meter, pickup: song.pickup, fromBar, toBar, transpose, approxCount: notes.filter((n) => n.approx).length }
}

/** Tab for a whistle: the holes to cover for each melody note, replacing notes the whistle cannot play. */
export function arrangeWhistle(song: Song, profile: WhistleProfile, options: InstrumentOptions = {}): WhistleArrangement {
  const { melody, meter, fromBar, toBar } = melodyRange(song, options)
  const byPitch = new Map(profile.fingerings.map((f) => [f.pitch, f]))
  const playable = new Set(byPitch.keys())
  const transpose =
    options.transpose === undefined || options.transpose === 'auto'
      ? fitTranspose(melody.map((n) => n.pitch), playable)
      : options.transpose
  const notes: WhistleNote[] = melody.map((n) => {
    const original = n.pitch + transpose
    const pitch = nearestPlayable(original, playable)
    const f = byPitch.get(pitch)!
    return { ...n, original, pitch, approx: pitch !== original, holes: f.holes, octave: f.octave }
  })
  return { notes, meter, pickup: song.pickup, fromBar, toBar, transpose, approxCount: notes.filter((n) => n.approx).length }
}
