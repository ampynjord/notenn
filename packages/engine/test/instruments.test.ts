import { describe, expect, it } from 'vitest'
import { arrange, arrangeStrings, arrangeWhistle, chromaticProfiles, getInstrument, instruments, parseProfile, stringPositions, type Song } from '../src/index'

// Amazing Grace, opening (traditional tune, public domain), 3/4 with a pickup.
const durations: [number, number][] = [[67, 1], [72, 2], [76, 0.5], [72, 0.5], [76, 2], [74, 1], [72, 2], [69, 1], [67, 2], [67, 1], [72, 2], [76, 0.5], [72, 0.5], [76, 2], [74, 1], [79, 3]]
let t = 0
const song: Song = {
  title: 'Amazing Grace',
  meter: { num: 3, den: 4 },
  pickup: 1,
  tempo: 80,
  tracks: [
    {
      name: 'Melody',
      notes: durations.map(([pitch, dur]) => {
        const note = { start: t, dur, pitch }
        t += dur
        return note
      }),
    },
  ],
}

describe('instrument registry', () => {
  it('lists every family with unique ids', () => {
    expect(new Set(instruments.map((i) => i.id)).size).toBe(instruments.length)
    for (const family of ['diatonic-accordion', 'chromatic-accordion', 'string', 'whistle'])
      expect(instruments.some((i) => i.family === family)).toBe(true)
    expect(getInstrument('guitar-standard')?.family).toBe('string')
    expect(getInstrument('nope')).toBeUndefined()
  })
})

describe('fretted instruments', () => {
  const guitar = getInstrument('guitar-standard')!
  if (guitar.family !== 'string') throw new Error('guitar expected')

  it('finds every string and fret that plays a pitch', () => {
    // E4 (64): open first string, fifth fret of the B string, ninth fret of the G string, and so on.
    const positions = stringPositions(64, guitar)
    expect(positions).toContainEqual({ string: 5, fret: 0 })
    expect(positions).toContainEqual({ string: 4, fret: 5 })
    expect(positions).toContainEqual({ string: 3, fret: 9 })
    for (const p of positions) expect(guitar.tuning[p.string]! + p.fret).toBe(64)
  })

  it('writes each melody note at a position that sounds its pitch', () => {
    const arr = arrangeStrings(song, guitar)
    expect(arr.notes).toHaveLength(song.tracks[0]!.notes.length)
    expect(arr.approxCount).toBe(0)
    for (const n of arr.notes) {
      expect(guitar.tuning[n.position.string]! + n.position.fret).toBe(n.pitch)
      expect(n.position.fret).toBeLessThanOrEqual(guitar.frets)
    }
  })

  it('keeps the hand in one place: small fret changes from note to note', () => {
    const arr = arrangeStrings(song, guitar)
    const jumps = arr.notes.slice(1).map((n, i) => Math.abs(n.position.fret - arr.notes[i]!.position.fret))
    expect(Math.max(...jumps)).toBeLessThanOrEqual(5)
    expect(jumps.reduce((a, b) => a + b, 0) / jumps.length).toBeLessThanOrEqual(2.5)
  })

  it('respects the capo: no note below it', () => {
    const arr = arrangeStrings(song, guitar, { capo: 2, transpose: 0 })
    for (const n of arr.notes) expect(n.position.fret).toBeGreaterThanOrEqual(2)
  })

  it('shifts a tune that is too low for the ukulele into its range', () => {
    const uke = getInstrument('ukulele-gcea')!
    if (uke.family !== 'string') throw new Error('ukulele expected')
    const low: Song = { ...song, tracks: [{ name: 'Low', notes: song.tracks[0]!.notes.map((n) => ({ ...n, pitch: n.pitch - 24 })) }] }
    const arr = arrangeStrings(low, uke)
    expect(arr.transpose).toBeGreaterThan(0)
    expect(arr.approxCount).toBe(0)
  })
})

describe('whistle', () => {
  const whistle = getInstrument('whistle-d')!
  if (whistle.family !== 'whistle') throw new Error('whistle expected')

  it('moves a tune in G to the whistle key (D) with no replaced note', () => {
    const arr = arrangeWhistle(song, whistle)
    expect(arr.approxCount).toBe(0)
    expect(arr.transpose).toBe(7)
    for (const n of arr.notes) expect(whistle.fingerings.find((f) => f.pitch === n.pitch)?.holes).toBe(n.holes)
  })

  it('writes the low D with every hole covered and the vented high D with the top hole open', () => {
    expect(whistle.fingerings.find((f) => f.pitch === 74)).toMatchObject({ holes: '111111', octave: 1 })
    expect(whistle.fingerings.find((f) => f.pitch === 86)).toMatchObject({ holes: '011111', octave: 2 })
  })

  it('a whistle in C sounds a tone lower', () => {
    const c = getInstrument('whistle-c')!
    if (c.family !== 'whistle') throw new Error('whistle expected')
    expect(c.fingerings[0]).toMatchObject({ pitch: 72, holes: '111111' })
  })

  it('replaces a note the whistle cannot play, and says so', () => {
    const odd: Song = { ...song, tracks: [{ name: 'x', notes: [{ start: 0, dur: 1, pitch: 77 }, { start: 1, dur: 1, pitch: 79 }, { start: 2, dur: 1, pitch: 81 }] }] }
    const arr = arrangeWhistle(odd, whistle, { transpose: 0 })
    expect(arr.approxCount).toBe(1)
    expect(arr.notes[0]!.approx).toBe(true)
  })
})

describe('chromatic accordion', () => {
  const profile = chromaticProfiles[0]!

  it('is a preview profile whose buttons sound the same on push and pull', () => {
    expect(profile.family).toBe('chromatic-accordion')
    expect(profile.preview).toBe(true)
    for (const r of profile.rows) for (const b of r.buttons) expect(b.push).toBe(b.pull)
  })

  it('covers every semitone of its range (rows a semitone apart, minor thirds along a row)', () => {
    const pitches = new Set(profile.rows.flatMap((r) => r.buttons.map((b) => b.push)))
    const lo = Math.min(...pitches)
    for (let p = lo; p < lo + 40; p++) expect(pitches.has(p)).toBe(true)
  })

  it('arranges a tune with the keyboard engine, without a left hand', () => {
    const arr = arrange(song, profile, { bass: false, transpose: 0 })
    expect(arr.approxCount).toBe(0)
    expect(arr.bass).toHaveLength(0)
    for (const n of arr.notes) {
      const row = profile.rows.find((r) => r.id === n.fingering.row)!
      expect(row.buttons[n.fingering.button - 1]!.push).toBe(n.pitch)
    }
  })

  it('reads a single note per button in the JSON format', () => {
    const p = parseProfile({
      format: 'notenn-instrument',
      version: 1,
      id: 'mini',
      name: 'Mini',
      family: 'chromatic-accordion',
      rows: [{ id: 'a', name: 'A', buttons: ['C4', 'D4'] }],
    })
    expect(p.rows[0]!.buttons).toEqual([{ push: 60, pull: 60 }, { push: 62, pull: 62 }])
  })
})
