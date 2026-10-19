import { describe, expect, it } from 'vitest'
import { arrange, hohner2915GC, meterInfo, melodyScore, pickMelodyTrack, snap, type Note, type Song } from '../src/index'

/** Builds notes from "pitch:duration" tokens (durations in quarter notes). */
function seq(spec: string, start = 0): Note[] {
  const notes: Note[] = []
  let t = start
  for (const tok of spec.trim().split(/\s+/)) {
    const [p, d] = tok.split(':')
    const dur = Number(d)
    if (p !== 'R') notes.push({ start: t, dur, pitch: Number(p) })
    t += dur
  }
  return notes
}

// Auld Lang Syne, verse (public domain), C major, one-beat pickup.
const auld: Song = {
  title: 'Auld Lang Syne',
  meter: { num: 4, den: 4 },
  pickup: 1,
  tempo: 80,
  tracks: [
    {
      name: 'Melody',
      notes: seq(
        '67:1 72:1.5 72:0.5 72:1 76:1 74:1.5 72:0.5 74:1 76:0.5 74:0.5 72:1.5 72:0.5 76:1 79:1 81:3 81:1 ' +
          '79:1.5 76:0.5 76:1 72:1 74:1.5 72:0.5 74:1 76:1 72:1.5 69:0.5 69:1 67:1 72:4',
      ),
    },
  ],
}

// Hector the Hero, start of part A (Skinner, 1903, public domain), 3/4.
const hector: Song = {
  title: 'Hector the Hero',
  meter: { num: 3, den: 4 },
  pickup: 1,
  tempo: 60,
  tracks: [{ name: 'Melody', notes: seq('72:1 76:1.5 74:0.5 72:1 81:1 79:1 76:1 79:5 72:1 76:1.5 74:0.5 72:1 81:1 79:1 76:1 74:5') }],
}

describe('meter', () => {
  it('recognises compound meters', () => {
    expect(meterInfo({ num: 6, den: 8 })).toEqual({ barLength: 3, beat: 1.5, beatsPerBar: 2 })
    expect(meterInfo({ num: 3, den: 4 })).toEqual({ barLength: 3, beat: 1, beatsPerBar: 3 })
  })
  it('snaps live playing to the grid', () => {
    expect(snap(1.02)).toBe(1)
    expect(snap(0.34)).toBeCloseTo(1 / 3)
  })
})

describe('arrangement on the Hohner 2915', () => {
  it('keeps the key when everything is playable', () => {
    const r = arrange(auld, hohner2915GC)
    expect(r.transpose).toBe(0)
    expect(r.approxCount).toBe(0)
    expect(r.notes).toHaveLength(auld.tracks[0]!.notes.length)
  })

  it('gives every note a button that actually plays it', () => {
    const r = arrange(auld, hohner2915GC)
    for (const n of r.notes) {
      const row = hohner2915GC.rows.find((x) => x.id === n.fingering.row)!
      const b = row.buttons[n.fingering.button - 1]!
      expect(b[n.fingering.bellows]).toBe(n.pitch)
    }
  })

  it('picks basses that contain the sounding note, in the same bellows direction', () => {
    const r = arrange(auld, hohner2915GC)
    expect(r.bass.length).toBeGreaterThan(0)
    for (const ev of r.bass) {
      const note = r.notes.find((n) => n.start <= ev.time + 1e-6 && ev.time < n.start + n.dur - 1e-6)!
      expect(note.fingering.bellows).toBe(ev.bellows)
      const g = hohner2915GC.bassGroups.find((x) => x.id === ev.group)!
      expect(g[ev.bellows].chord).toContain(((note.pitch % 12) + 12) % 12)
    }
  })

  it('uses the G row to avoid bellows changes (Hector)', () => {
    const both = arrange(hector, hohner2915GC)
    const doOnly = arrange(hector, hohner2915GC, { rows: ['c'] })
    expect(both.bellowsChanges).toBeLessThan(doOnly.bellowsChanges)
    expect(both.notes.some((n) => n.fingering.row === 'g')).toBe(true)
    expect(doOnly.notes.every((n) => n.fingering.row === 'c')).toBe(true)
  })

  it('limits the tab to the requested bars', () => {
    const r = arrange(auld, hohner2915GC, { fromBar: 2, toBar: 3 })
    expect(r.notes.every((n) => n.start >= 1 + 4 && n.start < 1 + 12)).toBe(true)
  })
})

describe('edge cases found in review', () => {
  const song = (notes: Note[], extraTracks: Note[][] = []): Song => ({
    title: 't',
    meter: { num: 4, den: 4 },
    pickup: 0,
    tempo: 90,
    tracks: [...extraTracks.map((n, i) => ({ name: `empty ${i}`, notes: n })), { name: 'Melody', notes }],
  })

  it('keeps a held note that starts before the chosen range', () => {
    const r = arrange(song(seq('72:3 76:2 74:3')), hohner2915GC, { fromBar: 2, transpose: 0 })
    expect(r.notes[0]).toMatchObject({ start: 4, dur: 1, pitch: 76 })
  })

  it('never drops a note outside the keyboard, it is replaced and flagged', () => {
    const r = arrange(song(seq('36:1 72:1')), hohner2915GC, { transpose: 0 })
    expect(r.notes).toHaveLength(2)
    expect(r.notes[0]!.approx).toBe(true)
    expect(r.approxCount).toBe(1)
  })

  it('ignores an empty track placed before a short melody', () => {
    const r = arrange(song(seq('72:1 74:1 76:1'), [[]]), hohner2915GC)
    expect(r.notes).toHaveLength(3)
  })
})

describe('melody track selection', () => {
  it('prefers the highest voice in a chorale, even when an inner voice has more notes', () => {
    const voice = (name: string, base: number, step: number) => ({
      name,
      notes: Array.from({ length: 32 / step }, (_, i) => ({ start: i * step, dur: step, pitch: base + [0, 2, 4, 5, 7, 5, 4, 2][i % 8]! })),
    })
    // Alto with passing eighth notes: 25% more notes than the soprano, as in a real chorale.
    const alto = voice('Voix 2', 65, 1)
    alto.notes = alto.notes.flatMap((n, i) => (i % 4 === 3 ? [{ ...n, dur: 0.5 }, { start: n.start + 0.5, dur: 0.5, pitch: n.pitch + 2 }] : [n]))
    const tracks = [voice('Voix 1', 72, 1), alto, voice('Voix 3', 57, 1), voice('Voix 4', 45, 1)]
    expect(pickMelodyTrack(tracks)).toBe(0)
  })

  it('does not penalise an alto or tenor sax like a choir voice', () => {
    const t = (name: string, base: number) => ({ name, notes: Array.from({ length: 32 }, (_, i) => ({ start: i, dur: 1, pitch: base + [0, 2, 4, 5, 7, 5, 4, 2][i % 8]! })) })
    expect(melodyScore(t('Tenor Sax', 67))).toBeCloseTo(melodyScore(t('Track 1', 67)))
    expect(melodyScore(t('Alto', 67))).toBeLessThan(melodyScore(t('Track 1', 67)))
  })
})
