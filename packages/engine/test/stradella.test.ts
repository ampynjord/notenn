import { describe, expect, it } from 'vitest'
import { arrange, bassEventNotes, estimateKey, getInstrument, parseProfile, stradellaGroups, STRADELLA_ROOTS, type Song } from '../src/index'

const chromatic = getInstrument('chromatic-c-3row')!
if (chromatic.family !== 'chromatic-accordion') throw new Error('chromatic accordion expected')

/** Notes as [pitch, duration in quarter notes], one after the other. */
function songOf(notes: [number, number][], meter = { num: 4, den: 4 }): Song {
  let t = 0
  return {
    title: 'test',
    meter,
    pickup: 0,
    tempo: 100,
    tracks: [{ name: 'M', notes: notes.map(([pitch, dur]) => ({ start: (t += dur) - dur, dur, pitch })) }],
  }
}

describe('Stradella left hand', () => {
  it('the chromatic profile has twelve columns in fifths, one for each root', () => {
    expect(chromatic.bassSystem).toBe('stradella')
    expect(chromatic.bassGroups.map((g) => g.push.bass)).toEqual(STRADELLA_ROOTS)
    expect(new Set(STRADELLA_ROOTS).size).toBe(12)
    // Neighbouring columns are a fifth apart.
    for (let i = 1; i < STRADELLA_ROOTS.length; i++) expect((STRADELLA_ROOTS[i]! - STRADELLA_ROOTS[i - 1]! + 12) % 12).toBe(7)
  })

  it('a button sounds the same on push and pull', () => {
    for (const g of stradellaGroups()) expect(g.push).toEqual(g.pull)
  })

  it('each row gives its own notes: counter-bass a third above the root, then major, minor, seventh and diminished chords', () => {
    const c = chromatic.bassGroups.find((g) => g.push.bass === 0)!
    const notesOf = (quality: Parameters<typeof bassEventNotes>[1]['quality']) =>
      bassEventNotes(chromatic, { time: 0, group: c.id, bellows: 'push', isBass: quality === 'bass' || quality === 'counter', quality })!
    expect(notesOf('bass').bass).toBe(0)
    expect(notesOf('counter').bass).toBe(4)
    expect(notesOf('major').chord).toEqual([0, 4, 7])
    expect(notesOf('minor').chord).toEqual([0, 3, 7])
    expect(notesOf('seventh').chord).toEqual([0, 4, 10])
    expect(notesOf('diminished').chord).toEqual([0, 3, 6, 9])
  })

  it('refuses a Stradella bass on a diatonic accordion', () => {
    const json = { format: 'notenn-instrument', version: 1, id: 'x', name: 'X', family: 'diatonic-accordion', bassSystem: 'stradella', rows: [{ id: 'r', name: 'R', buttons: [['C4', 'D4']] }] }
    expect(() => parseProfile(json)).toThrow(expect.objectContaining({ code: 'unsupported-bass-system' }))
  })
})

describe('Stradella harmony', () => {
  // C major melody, ending on C: C D E F G A G E C.
  const melody: [number, number][] = [[72, 1], [74, 1], [76, 1], [77, 1], [79, 1], [81, 1], [79, 1], [76, 1], [72, 4]]
  const arr = arrange(songOf(melody), chromatic)

  it('finds the key from the melody', () => {
    expect(estimateKey(songOf(melody).tracks[0]!.notes)).toBe(0)
    // G major: F# in the melody.
    expect(estimateKey(songOf([[67, 1], [69, 1], [71, 1], [74, 1], [78, 1], [79, 2]]).tracks[0]!.notes)).toBe(7)
  })

  it('plays a bass on the first beat of each bar and chords on the others, each holding the sounding note', () => {
    expect(arr.bass.length).toBeGreaterThan(0)
    const notes = songOf(melody).tracks[0]!.notes
    for (const ev of arr.bass) {
      const beat = Math.round(ev.time % 4)
      expect(ev.isBass).toBe(beat === 0)
      expect(ev.quality).toBe(ev.isBass ? 'bass' : ev.quality)
      const sounding = notes.find((n) => n.start <= ev.time + 1e-6 && ev.time < n.start + n.dur - 1e-6)!
      const pcs = bassEventNotes(chromatic, ev)!
      // The bass or the chord contains the melody note, or (bass) the note belongs to the chord of the column.
      const column = chromatic.bassGroups.find((g) => g.id === ev.group)!
      const chord = ev.isBass ? [column.push.bass, ...[3, 4, 7].map((iv) => (column.push.bass + iv) % 12)] : pcs.chord
      expect(chord).toContain(sounding.pitch % 12)
    }
  })

  it('keeps to the chords of the key: C, F and G major, A, D and E minor', () => {
    const allowed = new Set(['0 major', '5 major', '7 major', '9 minor', '2 minor', '4 minor', '7 seventh'])
    for (const ev of arr.bass) {
      if (ev.isBass) continue
      const root = chromatic.bassGroups.find((g) => g.id === ev.group)!.push.bass
      expect(allowed.has(`${root} ${ev.quality}`)).toBe(true)
    }
  })

  it('uses minor chords where the melody asks for them', () => {
    // A minor melody (A C E A) over A minor.
    const minor = arrange(songOf([[69, 2], [72, 2], [76, 2], [81, 2], [72, 2], [71, 2], [69, 4]]), chromatic)
    const rootOf = (ev: (typeof minor.bass)[number]) => chromatic.bassGroups.find((g) => g.id === ev.group)!.push.bass
    expect(minor.bass.some((ev) => !ev.isBass && ev.quality === 'minor' && rootOf(ev) === 9)).toBe(true)
    // The last bar rests on the tonic: A minor, not F or C major.
    const final = minor.bass.filter((ev) => ev.time >= 12)
    for (const ev of final) expect(rootOf(ev)).toBe(9)
  })
})
