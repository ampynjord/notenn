import { describe, expect, it } from 'vitest'
import { arrange, hohner2915GC, type Song } from '@notenn/engine'
import { layout } from '../src/index'

// Amazing Grace, début (air traditionnel, domaine public), 3/4 avec levée.
const song: Song = {
  title: 'Amazing Grace',
  meter: { num: 3, den: 4 },
  pickup: 1,
  tempo: 80,
  tracks: [
    {
      name: 'Mélodie',
      notes: [
        [67, 1], [72, 2], [76, 0.5], [72, 0.5], [76, 2], [74, 1], [72, 2], [69, 1], [67, 2], [67, 1], [72, 2], [76, 0.5], [72, 0.5], [76, 2], [74, 1], [79, 3],
      ].reduce<{ t: number; notes: { start: number; dur: number; pitch: number }[] }>(
        (acc, [p, d]) => ({ t: acc.t + d!, notes: [...acc.notes, { start: acc.t, dur: d!, pitch: p! }] }),
        { t: 0, notes: [] },
      ).notes,
    },
  ],
}

describe('mise en page Système Argoat', () => {
  const arr = arrange(song, hohner2915GC)

  it('place chaque note une fois dans la tablature, sur la ligne de son sens de soufflet', () => {
    const lines = layout(arr, hohner2915GC, song.meter, { staff: false })
    const texts = lines.flatMap((l) => l.ops).filter((o) => o.kind === 'text' && o.note !== undefined)
    expect(texts).toHaveLength(arr.notes.length)
    for (const t of texts) {
      if (t.kind !== 'text') continue
      const n = arr.notes[t.note!]!
      expect(t.ink === 'push' || t.ink === 'pull' || t.ink === 'warn').toBe(true)
      if (!n.approx) expect(t.ink).toBe(n.fingering.bellows === 'P' ? 'push' : 'pull')
    }
  })

  it("utilise l'apostrophe pour le rang intérieur", () => {
    const lines = layout(arr, hohner2915GC, song.meter)
    const labels = lines.flatMap((l) => l.ops).filter((o) => o.kind === 'text' && o.note !== undefined).map((o) => (o.kind === 'text' ? o.text : ''))
    expect(labels.some((t) => t.endsWith("'"))).toBe(true)
  })

  it('dessine une tête de note par note quand la portée est affichée', () => {
    const lines = layout(arr, hohner2915GC, song.meter, { staff: true })
    const heads = lines.flatMap((l) => l.ops).filter((o) => o.kind === 'ellipse' && o.note !== undefined)
    expect(heads).toHaveLength(arr.notes.length)
  })

  it('couvre toutes les mesures, sans trou ni doublon', () => {
    const lines = layout(arr, hohner2915GC, song.meter, { barsPerLine: 2 })
    expect(lines[0]!.firstBar).toBe(arr.fromBar)
    expect(lines.at(-1)!.lastBar).toBe(arr.toBar)
    for (let i = 1; i < lines.length; i++) expect(lines[i]!.firstBar).toBe(lines[i - 1]!.lastBar + 1)
  })
})
