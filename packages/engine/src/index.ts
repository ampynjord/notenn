import { chooseBass } from './bass'
import { chooseFingering } from './fingering'
import { bestTranspose, nearestPlayable, playablePitches } from './keyboard'
import { extractMelody, meterInfo, pickMelodyTrack } from './melody'
import type { Arrangement, ArrangeOptions, InstrumentProfile, PlacedNote, Song } from './types'

export * from './types'
export { extractMelody, meterInfo, melodyScore, pickMelodyTrack, snap } from './melody'
export { bestTranspose, fingeringsFor, nearestPlayable, playablePitches } from './keyboard'
export { chooseFingering } from './fingering'
export { chooseBass } from './bass'
export { hohner2915GC } from './profiles/hohner-2915-gc'

/** Du morceau importé à la tablature : mélodie, transposition, doigté, basses. */
export function arrange(song: Song, profile: InstrumentProfile, options: ArrangeOptions = {}): Arrangement {
  const rows = options.rows ?? profile.rows.map((r) => r.id)
  const meter = meterInfo(song.meter)
  const trackIndex = options.trackIndex ?? pickMelodyTrack(song.tracks)
  const track = song.tracks[trackIndex]
  if (!track) throw new Error(`Piste ${trackIndex} introuvable`)

  let melody = extractMelody(track)
  const lastEnd = melody.reduce((m, n) => Math.max(m, n.start + n.dur), 0)
  const barCount = Math.max(1, Math.ceil((lastEnd - song.pickup - 1e-6) / meter.barLength))
  const fromBar = Math.min(Math.max(1, options.fromBar ?? 1), barCount)
  const toBar = Math.min(Math.max(fromBar, options.toBar ?? barCount), barCount)
  const t0 = fromBar === 1 ? 0 : song.pickup + (fromBar - 1) * meter.barLength
  const t1 = song.pickup + toBar * meter.barLength
  melody = melody
    .filter((n) => n.start >= t0 - 1e-6 && n.start < t1 - 1e-6)
    .map((n) => ({ ...n, dur: Math.min(n.dur, t1 - n.start) }))

  const playable = playablePitches(profile, rows)
  const transpose =
    options.transpose === undefined || options.transpose === 'auto'
      ? bestTranspose(melody.map((n) => n.pitch), playable)
      : options.transpose

  let approxCount = 0
  const shifted = melody.map((n) => {
    const original = n.pitch + transpose
    const pitch = nearestPlayable(original, playable)
    if (pitch !== original) approxCount++
    return { ...n, original, pitch: pitch ?? original, approx: pitch !== original }
  })
  const playableNotes = shifted.filter((n) => playable.has(n.pitch))

  const fingering = chooseFingering(playableNotes, profile, rows, meter, song.pickup)
  const notes: PlacedNote[] = playableNotes.map((n, i) => ({ ...n, fingering: fingering[i]! }))
  const bass = options.bass === false ? [] : chooseBass(playableNotes, fingering, profile, meter, song.pickup, fromBar, toBar)

  let bellowsChanges = 0
  for (let i = 1; i < notes.length; i++) if (notes[i]!.fingering.bellows !== notes[i - 1]!.fingering.bellows) bellowsChanges++

  return { notes, bass, meter, pickup: song.pickup, fromBar, toBar, transpose, approxCount, bellowsChanges }
}
