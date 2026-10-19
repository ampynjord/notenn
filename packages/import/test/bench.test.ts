/**
 * Test bench: real files (public domain, see fixtures/SOURCES.md) run through the whole chain
 * import → arrangement → layout. Invariants are checked, then the key figures are frozen in a
 * snapshot to catch any regression (chosen track, transposition, replaced notes, bellows).
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { layout } from '@notenn/argoat'
import { arrange, fingeringsFor, hohner2915GC, pickMelodyTrack, type Song } from '@notenn/engine'
import { describe, expect, it } from 'vitest'
import { fromAbc, fromMidi, fromMusicXML, fromMxl } from '../src/index'

const dir = join(import.meta.dirname, 'fixtures')
const files = readdirSync(dir).filter((f) => /\.(abc|mid|mxl|musicxml|xml)$/.test(f)).sort()

async function load(name: string): Promise<Song> {
  const buf = readFileSync(join(dir, name))
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  const title = name.replace(/\.[^.]+$/, '')
  if (name.endsWith('.mid')) return fromMidi(ab, title)
  if (name.endsWith('.mxl')) return fromMxl(ab, title)
  if (name.endsWith('.abc')) return fromAbc(buf.toString('utf8'))
  return fromMusicXML(buf.toString('utf8'), title)
}

describe('test bench on real files', () => {
  it('holds about twenty files in the three formats', () => {
    expect(files.length).toBeGreaterThanOrEqual(20)
    for (const ext of ['.abc', '.mid', 'xml']) expect(files.some((f) => f.endsWith(ext))).toBe(true)
  })

  it('detects a pickup even without implicit="yes" (BWV 269: 3/4, one-beat pickup)', async () => {
    expect((await load('bach-bwv269.musicxml')).pickup).toBe(1)
  })

  it.each(files)('%s', async (name) => {
    const song = await load(name)
    expect(song.tracks.length).toBeGreaterThan(0)
    for (const t of song.tracks)
      for (const n of t.notes) {
        expect(Number.isFinite(n.start) && n.start >= 0).toBe(true)
        expect(n.dur).toBeGreaterThan(0)
        expect(Number.isInteger(n.pitch)).toBe(true)
      }
    expect(song.meter.num).toBeGreaterThan(0)
    expect(song.meter.den).toBeGreaterThan(0)

    const arr = arrange(song, hohner2915GC)
    expect(arr.notes.length).toBeGreaterThan(0)
    for (const n of arr.notes) {
      // The button shown actually plays the written note.
      const f = fingeringsFor(n.pitch, hohner2915GC, hohner2915GC.rows.map((r) => r.id))
      expect(f.some((x) => x.row === n.fingering.row && x.button === n.fingering.button && x.bellows === n.fingering.bellows)).toBe(true)
    }
    for (let i = 1; i < arr.notes.length; i++) expect(arr.notes[i]!.start).toBeGreaterThanOrEqual(arr.notes[i - 1]!.start)
    for (const b of arr.bass) {
      const g = hohner2915GC.bassGroups.find((x) => x.id === b.group)
      expect(g).toBeDefined()
      // The bass is played in the same bellows direction as the note sounding at that moment.
      const sounding = arr.notes.find((n) => n.start <= b.time + 1e-6 && b.time < n.start + n.dur - 1e-6)
      if (sounding) expect(b.bellows).toBe(sounding.fingering.bellows)
    }

    // Two right-hand voices: the melody does not change, every second-voice note is playable with it.
    const two = arrange(song, hohner2915GC, { voices: 2 })
    expect(two.notes.map((n) => n.pitch)).toEqual(arr.notes.map((n) => n.pitch))
    for (const n of two.voices[1] ?? []) {
      const m = two.notes.find((x) => x.start === n.start)!
      expect(n.pitch).toBeLessThan(m.pitch)
      expect(n.fingering.bellows).toBe(m.fingering.bellows)
    }

    const lines = layout(arr, hohner2915GC, song.meter, { staff: true })
    expect(lines[0]!.firstBar).toBe(arr.fromBar)
    expect(lines.at(-1)!.lastBar).toBe(arr.toBar)
    for (let i = 1; i < lines.length; i++) expect(lines[i]!.firstBar).toBe(lines[i - 1]!.lastBar + 1)
    for (const op of lines.flatMap((l) => l.ops))
      for (const v of Object.values(op)) if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true)

    const melody = pickMelodyTrack(song.tracks)
    expect({
      tracks: song.tracks.length,
      melodyTrack: melody,
      melodyName: song.tracks[melody]!.name,
      meter: `${song.meter.num}/${song.meter.den}`,
      pickup: song.pickup,
      bars: arr.toBar - arr.fromBar + 1,
      notes: arr.notes.length,
      transpose: arr.transpose,
      replaced: arr.approxCount,
      bellowsChanges: arr.bellowsChanges,
    }).toMatchSnapshot()
  })
})

