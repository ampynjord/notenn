/**
 * Banc de tests : de vrais fichiers (domaine public, voir fixtures/SOURCES.md) passés par toute la chaîne
 * import → arrangement → mise en page. On vérifie des invariants, puis on fige les chiffres clés dans un
 * instantané pour repérer toute régression (piste choisie, transposition, notes remplacées, soufflet).
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

describe('banc de tests sur de vrais fichiers', () => {
  it('contient une vingtaine de fichiers des trois formats', () => {
    expect(files.length).toBeGreaterThanOrEqual(20)
    for (const ext of ['.abc', '.mid', 'xml']) expect(files.some((f) => f.endsWith(ext))).toBe(true)
  })

  it('reconnaît une levée même sans implicit="yes" (BWV 269 : 3/4, levée d’une noire)', async () => {
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
      // Le bouton indiqué joue bien la note écrite.
      const f = fingeringsFor(n.pitch, hohner2915GC, hohner2915GC.rows.map((r) => r.id))
      expect(f.some((x) => x.row === n.fingering.row && x.button === n.fingering.button && x.bellows === n.fingering.bellows)).toBe(true)
    }
    for (let i = 1; i < arr.notes.length; i++) expect(arr.notes[i]!.start).toBeGreaterThanOrEqual(arr.notes[i - 1]!.start)
    for (const b of arr.bass) {
      const g = hohner2915GC.bassGroups.find((x) => x.id === b.group)
      expect(g).toBeDefined()
      // La basse est jouée dans le même sens de soufflet que la note qui sonne à ce moment-là.
      const sounding = arr.notes.find((n) => n.start <= b.time + 1e-6 && b.time < n.start + n.dur - 1e-6)
      if (sounding) expect(b.bellows).toBe(sounding.fingering.bellows)
    }

    const lines = layout(arr, hohner2915GC, song.meter, { staff: true })
    expect(lines[0]!.firstBar).toBe(arr.fromBar)
    expect(lines.at(-1)!.lastBar).toBe(arr.toBar)
    for (let i = 1; i < lines.length; i++) expect(lines[i]!.firstBar).toBe(lines[i - 1]!.lastBar + 1)
    for (const op of lines.flatMap((l) => l.ops))
      for (const v of Object.values(op)) if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true)

    expect({
      pistes: song.tracks.length,
      melodie: song.tracks[pickMelodyTrack(song.tracks)]!.name,
      mesure: `${song.meter.num}/${song.meter.den}`,
      anacrouse: song.pickup,
      mesures: arr.toBar - arr.fromBar + 1,
      notes: arr.notes.length,
      transposition: arr.transpose,
      remplacees: arr.approxCount,
      changementsSoufflet: arr.bellowsChanges,
    }).toMatchSnapshot()
  })
})

