import { describe, expect, it } from 'vitest'
import { arrange, hohner2915GC, type Song } from '@notenn/engine'
import { layout, splitDuration } from '../src/index'

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

describe('cas particuliers de la mise en page', () => {
  const make = (notes: [number, number][]): Song => ({
    title: 'test',
    meter: { num: 4, den: 4 },
    pickup: 0,
    tempo: 90,
    tracks: [{ name: 'm', notes: notes.reduce<{ t: number; n: { start: number; dur: number; pitch: number }[] }>((a, [p, d]) => ({ t: a.t + d, n: [...a.n, { start: a.t, dur: d, pitch: p }] }), { t: 0, n: [] }).n }],
  })

  it('met un bécarre quand une note diésée revient naturelle dans la même mesure', () => {
    const s = make([[66, 1], [65, 1], [67, 2]])
    const ops = layout(arrange(s, hohner2915GC, { transpose: 0 }), hohner2915GC, s.meter).flatMap((l) => l.ops)
    expect(ops.some((o) => o.kind === 'text' && o.text === '♮')).toBe(true)
  })

  it('prolonge le trait d’une note tenue sur la ligne suivante, sans répéter le bouton', () => {
    const s = make([[67, 3], [72, 3], [76, 2]])
    const arr = arrange(s, hohner2915GC, { transpose: 0 })
    const lines = layout(arr, hohner2915GC, s.meter, { barsPerLine: 1, staff: false })
    expect(lines[1]!.ops.some((o) => o.kind === 'line' && o.ink === 'line' && o.x1 < 44)).toBe(true)
    const labels = lines.flatMap((l) => l.ops).filter((o) => o.kind === 'text' && o.note !== undefined)
    expect(labels).toHaveLength(arr.notes.length)
  })
})

describe('découpage des durées pour la portée', () => {
  const shapes = (from: number, to: number, pickup = 0, bar = 4) => splitDuration(from, to, pickup, bar).map((p) => [p.t, p.shape, p.triplet])

  it('écrit 2,5 noires en blanche liée à une croche', () => {
    expect(shapes(0, 2.5)).toEqual([[0, 2, false], [2, 0.5, false]])
  })
  it('coupe à la barre de mesure', () => {
    expect(shapes(3, 5)).toEqual([[3, 1, false], [4, 1, false]])
  })
  it('respecte l’anacrouse', () => {
    expect(shapes(0, 2, 1)).toEqual([[0, 1, false], [1, 1, false]])
  })
  it('écrit les tiers de noire en triolets', () => {
    expect(shapes(0, 1 / 3)).toEqual([[0, 0.5, true]])
    expect(shapes(0, 2 / 3)).toEqual([[0, 1, true]])
    const mixed = splitDuration(0, 4 / 3, 0, 4)
    expect(mixed.map((p) => p.triplet)).toEqual([true, false])
    expect(mixed.reduce((s, p) => s + (p.triplet ? (p.shape === 1 ? 2 / 3 : 1 / 3) : p.shape), 0)).toBeCloseTo(4 / 3)
  })
  it('lie les figures d’une note longue et marque les triolets sur la portée', () => {
    const s: Song = { title: 't', meter: { num: 4, den: 4 }, pickup: 0, tempo: 90, tracks: [{ name: 'm', notes: [
      { start: 0, dur: 2.5, pitch: 72 }, { start: 2.5, dur: 0.5, pitch: 74 }, { start: 3, dur: 1 / 3, pitch: 76 }, { start: 3 + 1 / 3, dur: 1 / 3, pitch: 74 }, { start: 3 + 2 / 3, dur: 1 / 3, pitch: 72 }, { start: 4, dur: 4, pitch: 72 },
    ] }] }
    const arr = arrange(s, hohner2915GC, { transpose: 0 })
    const ops = layout(arr, hohner2915GC, s.meter, { staff: true, barsPerLine: 2 }).flatMap((l) => l.ops)
    expect(ops.filter((o) => o.kind === 'polyline' && o.points.length === 7)).toHaveLength(1)
    expect(ops.filter((o) => o.kind === 'text' && o.text === '3')).toHaveLength(1)
  })

  const song4 = (notes: { start: number; dur: number; pitch: number }[]): Song => ({ title: 't', meter: { num: 4, den: 4 }, pickup: 0, tempo: 90, tracks: [{ name: 'm', notes }] })
  const threes = (s: Song) => layout(arrange(s, hohner2915GC, { transpose: 0 }), hohner2915GC, s.meter, { staff: true, barsPerLine: 1 }).flatMap((l) => l.ops).filter((o) => o.kind === 'text' && o.text === '3')

  it('ne met qu’un « 3 » pour trois noires de triolet sur deux temps', () => {
    expect(threes(song4([0, 2 / 3, 4 / 3].map((start, i) => ({ start, dur: 2 / 3, pitch: [72, 74, 76][i]! })).concat([{ start: 2, dur: 2, pitch: 72 }])))).toHaveLength(1)
  })

  it('met deux « 3 » pour deux groupes de croches de triolet sur deux temps', () => {
    const notes = [0, 1, 2, 3, 4, 5].map((k) => ({ start: k / 3, dur: 1 / 3, pitch: 72 + (k % 2) * 2 }))
    expect(threes(song4([...notes, { start: 2, dur: 2, pitch: 72 }]))).toHaveLength(2)
  })

  it('dessine la liaison sortante quand une note passe à la ligne suivante', () => {
    const s = song4([{ start: 0, dur: 3, pitch: 72 }, { start: 3, dur: 3, pitch: 74 }, { start: 6, dur: 2, pitch: 72 }])
    const lines = layout(arrange(s, hohner2915GC, { transpose: 0 }), hohner2915GC, s.meter, { staff: true, barsPerLine: 1, width: 900 })
    const ties = (i: number) => lines[i]!.ops.filter((o) => o.kind === 'polyline' && o.points.length === 7)
    // Ligne 1 : blanche pointée, puis noire liée vers la ligne 2 ; ligne 2 : liaison entrante.
    expect(ties(0).some((o) => o.kind === 'polyline' && o.points.at(-1)![0] > 880)).toBe(true)
    expect(ties(1).some((o) => o.kind === 'polyline' && o.points[0]![0] < 44)).toBe(true)
  })
})
