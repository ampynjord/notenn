import { chooseBass } from './bass'
import { chooseGroupFingering, type NoteGroup } from './fingering'
import { bestTranspose, nearestPlayable, playablePitches } from './keyboard'
import { extractLowerVoices, meterInfo, pickMelodyTrack } from './melody'
import { melodyRange } from './range'
import type { Arrangement, ArrangeOptions, InstrumentProfile, PlacedNote, Song } from './types'

/** Stable key of a melody note, used to remember a fingering chosen by hand. */
export const noteKey = (start: number) => start.toFixed(4)

export * from './types'
export { extractLowerVoices, extractMelody, meterInfo, melodyScore, pickMelodyTrack, snap } from './melody'
export { bestTranspose, fingeringsFor, nearestPlayable, playablePitches } from './keyboard'
export { chooseFingering, chooseGroupFingering, groupOptions, type NoteGroup } from './fingering'
export { chooseBass } from './bass'
export { hohner2915GC } from './profiles/hohner-2915-gc'
export { chromaticProfiles, getInstrument, getProfile, instruments, profiles } from './profiles'
export { arrangeStrings, arrangeWhistle, stringPitches, stringPositions, type InstrumentOptions } from './instruments'
export { fitTranspose, melodyRange } from './range'
export { chordOf, midiOf, parseProfile, pitchClassOf, ProfileError, type ProfileErrorCode, type ProfileJson } from './profile-format'

/** From an imported song to a tab: melody, transposition, fingering, basses. */
export function arrange(song: Song, profile: InstrumentProfile, options: ArrangeOptions = {}): Arrangement {
  const rows = options.rows ?? profile.rows.map((r) => r.id)
  const trackIndex = options.trackIndex ?? pickMelodyTrack(song.tracks)
  const track = song.tracks[trackIndex]!
  // Notes overlapping the bar range are kept and trimmed at both ends.
  const { melody, meter, fromBar, toBar } = melodyRange(song, { ...options, trackIndex })

  const playable = playablePitches(profile, rows)
  const transpose =
    options.transpose === undefined || options.transpose === 'auto'
      ? bestTranspose(melody.map((n) => n.pitch), playable)
      : options.transpose

  let approxCount = 0
  const place = (n: { start: number; dur: number; pitch: number }) => {
    const original = n.pitch + transpose
    const pitch = nearestPlayable(original, playable)
    return { ...n, original, pitch, approx: pitch !== original }
  }
  const melodyNotes = melody.map(place)
  approxCount += melodyNotes.filter((n) => n.approx).length

  // Lower voices share the melody's onsets: each melody note becomes a group of pitches.
  const extra = Math.max(0, Math.floor(options.voices ?? 1) - 1)
  const lower = extractLowerVoices(track, melody, extra).map((voice) => voice.map(place))
  const groups: NoteGroup[] = melodyNotes.map((m) => ({
    start: m.start,
    dur: m.dur,
    pitches: [m.pitch, ...lower.flatMap((v) => v.filter((n) => n.start === m.start && n.pitch < m.pitch).map((n) => n.pitch))],
  }))

  const fixed = groups.map((g) => options.fingerings?.[noteKey(g.start)])
  const fingered = chooseGroupFingering(groups, profile, rows, meter, song.pickup, fixed)
  const notes: PlacedNote[] = melodyNotes.map((n, i) => {
    const f = fingered[i]![0]!
    const c = fixed[i]
    const edited = !!c && f.row === c.row && f.button === c.button && f.bellows === c.bellows
    return { ...n, fingering: f, voice: 0, ...(edited ? { edited } : {}) }
  })
  const voices: PlacedNote[][] = [notes, ...lower.map(() => [] as PlacedNote[])]
  let droppedCount = 0
  groups.forEach((g, i) => {
    const opt = fingered[i]!
    // Lower pitches of this group, in group order (voice 1 first); kept only if the option fingered them.
    let k = 1
    lower.forEach((voice, v) => {
      const n = voice.find((x) => x.start === g.start && x.pitch < g.pitches[0]!)
      if (!n) return
      const f = opt[k]
      if (f && g.pitches[k] === n.pitch) {
        voices[v + 1]!.push({ ...n, fingering: f, voice: v + 1 })
        if (n.approx) approxCount++
        k++
      } else droppedCount++
    })
  })
  const bass =
    options.bass === false
      ? []
      : chooseBass(melodyNotes, notes.map((n) => n.fingering), profile, meter, song.pickup, fromBar, toBar)

  let bellowsChanges = 0
  for (let i = 1; i < notes.length; i++) if (notes[i]!.fingering.bellows !== notes[i - 1]!.fingering.bellows) bellowsChanges++

  return { notes, voices, droppedCount, bass, meter, pickup: song.pickup, fromBar, toBar, transpose, approxCount, bellowsChanges }
}
