import { describe, expect, it } from 'vitest'
import { arrange, arrangeStrings, arrangeWhistle, getInstrument, hohner2915GC, type Song } from '@notenn/engine'
import { layout, layoutStrings, layoutWhistle, splitDuration } from '../src/index'

// Amazing Grace, opening (traditional tune, public domain), 3/4 with a pickup.
const song: Song = {
  title: 'Amazing Grace',
  meter: { num: 3, den: 4 },
  pickup: 1,
  tempo: 80,
  tracks: [
    {
      name: 'Melody',
      notes: [
        [67, 1], [72, 2], [76, 0.5], [72, 0.5], [76, 2], [74, 1], [72, 2], [69, 1], [67, 2], [67, 1], [72, 2], [76, 0.5], [72, 0.5], [76, 2], [74, 1], [79, 3],
      ].reduce<{ t: number; notes: { start: number; dur: number; pitch: number }[] }>(
        (acc, [p, d]) => ({ t: acc.t + d!, notes: [...acc.notes, { start: acc.t, dur: d!, pitch: p! }] }),
        { t: 0, notes: [] },
      ).notes,
    },
  ],
}

describe('Système Argoat layout', () => {
  const arr = arrange(song, hohner2915GC)

  it('places each note once in the tab, on the line of its bellows direction', () => {
    const lines = layout(arr, hohner2915GC, song.meter, { staff: false })
    const texts = lines.flatMap((l) => l.ops).filter((o) => o.kind === 'text' && o.note !== undefined)
    expect(texts).toHaveLength(arr.notes.length)
    for (const t of texts) {
      if (t.kind !== 'text') continue
      const n = arr.notes[t.note!]!
      expect(t.ink === 'push' || t.ink === 'pull' || t.ink === 'warn').toBe(true)
      if (!n.approx) expect(t.ink).toBe(n.fingering.bellows)
    }
  })

  it('uses the apostrophe for the inner row', () => {
    const lines = layout(arr, hohner2915GC, song.meter)
    const labels = lines.flatMap((l) => l.ops).filter((o) => o.kind === 'text' && o.note !== undefined).map((o) => (o.kind === 'text' ? o.text : ''))
    expect(labels.some((t) => t.endsWith("'"))).toBe(true)
  })

  it('draws one note head per note when the staff is shown', () => {
    const lines = layout(arr, hohner2915GC, song.meter, { staff: true })
    const heads = lines.flatMap((l) => l.ops).filter((o) => o.kind === 'ellipse' && o.note !== undefined)
    expect(heads).toHaveLength(arr.notes.length)
  })

  it('covers every bar, with no gap or duplicate', () => {
    const lines = layout(arr, hohner2915GC, song.meter, { barsPerLine: 2 })
    expect(lines[0]!.firstBar).toBe(arr.fromBar)
    expect(lines.at(-1)!.lastBar).toBe(arr.toBar)
    for (let i = 1; i < lines.length; i++) expect(lines[i]!.firstBar).toBe(lines[i - 1]!.lastBar + 1)
  })
})

describe('layout edge cases', () => {
  const make = (notes: [number, number][]): Song => ({
    title: 'test',
    meter: { num: 4, den: 4 },
    pickup: 0,
    tempo: 90,
    tracks: [{ name: 'm', notes: notes.reduce<{ t: number; n: { start: number; dur: number; pitch: number }[] }>((a, [p, d]) => ({ t: a.t + d, n: [...a.n, { start: a.t, dur: d, pitch: p }] }), { t: 0, n: [] }).n }],
  })

  it('adds a natural when a sharpened note comes back unaltered in the same bar', () => {
    const s = make([[66, 1], [65, 1], [67, 2]])
    const ops = layout(arrange(s, hohner2915GC, { transpose: 0 }), hohner2915GC, s.meter).flatMap((l) => l.ops)
    expect(ops.some((o) => o.kind === 'text' && o.text === '♮')).toBe(true)
  })

  it('continues the hold line of a held note on the next line without repeating the button', () => {
    const s = make([[67, 3], [72, 3], [76, 2]])
    const arr = arrange(s, hohner2915GC, { transpose: 0 })
    const lines = layout(arr, hohner2915GC, s.meter, { barsPerLine: 1, staff: false })
    expect(lines[1]!.ops.some((o) => o.kind === 'line' && o.ink === 'line' && o.x1 < 44)).toBe(true)
    const labels = lines.flatMap((l) => l.ops).filter((o) => o.kind === 'text' && o.note !== undefined)
    expect(labels).toHaveLength(arr.notes.length)
  })
})

describe('splitting durations for the staff', () => {
  const shapes = (from: number, to: number, pickup = 0, bar = 4) => splitDuration(from, to, pickup, bar).map((p) => [p.t, p.shape, p.triplet])

  it('writes 2.5 quarter notes as a half note tied to an eighth', () => {
    expect(shapes(0, 2.5)).toEqual([[0, 2, false], [2, 0.5, false]])
  })
  it('cuts at the barline', () => {
    expect(shapes(3, 5)).toEqual([[3, 1, false], [4, 1, false]])
  })
  it('respects the pickup', () => {
    expect(shapes(0, 2, 1)).toEqual([[0, 1, false], [1, 1, false]])
  })
  it('writes thirds of a quarter note as triplets', () => {
    expect(shapes(0, 1 / 3)).toEqual([[0, 0.5, true]])
    expect(shapes(0, 2 / 3)).toEqual([[0, 1, true]])
    const mixed = splitDuration(0, 4 / 3, 0, 4)
    expect(mixed.map((p) => p.triplet)).toEqual([true, false])
    expect(mixed.reduce((s, p) => s + (p.triplet ? (p.shape === 1 ? 2 / 3 : 1 / 3) : p.shape), 0)).toBeCloseTo(4 / 3)
  })
  it('ties the figures of a long note and marks triplets on the staff', () => {
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

  it('puts a single "3" over three quarter-note triplets spanning two beats', () => {
    expect(threes(song4([0, 2 / 3, 4 / 3].map((start, i) => ({ start, dur: 2 / 3, pitch: [72, 74, 76][i]! })).concat([{ start: 2, dur: 2, pitch: 72 }])))).toHaveLength(1)
  })

  it('puts two "3"s over two groups of eighth-note triplets', () => {
    const notes = [0, 1, 2, 3, 4, 5].map((k) => ({ start: k / 3, dur: 1 / 3, pitch: 72 + (k % 2) * 2 }))
    expect(threes(song4([...notes, { start: 2, dur: 2, pitch: 72 }]))).toHaveLength(2)
  })

  it('draws the outgoing tie when a note runs onto the next line', () => {
    const s = song4([{ start: 0, dur: 3, pitch: 72 }, { start: 3, dur: 3, pitch: 74 }, { start: 6, dur: 2, pitch: 72 }])
    const lines = layout(arrange(s, hohner2915GC, { transpose: 0 }), hohner2915GC, s.meter, { staff: true, barsPerLine: 1, width: 900 })
    const ties = (i: number) => lines[i]!.ops.filter((o) => o.kind === 'polyline' && o.points.length === 7)
    // Line 1: dotted half note, then a quarter tied to line 2; line 2: incoming tie.
    expect(ties(0).some((o) => o.kind === 'polyline' && o.points.at(-1)![0] > 880)).toBe(true)
    expect(ties(1).some((o) => o.kind === 'polyline' && o.points[0]![0] < 44)).toBe(true)
  })
})

describe('line labels', () => {
  it('uses the translated labels it is given, French Système Argoat letters by default', () => {
    const arr = arrange(song, hohner2915GC)
    const texts = (labels?: { push: string; pull: string; bass: string }) =>
      layout(arr, hohner2915GC, song.meter, { staff: false, labels }).flatMap((l) => l.ops).flatMap((o) => (o.kind === 'text' ? [o.text] : []))
    expect(texts()).toEqual(expect.arrayContaining(['P', 'T', 'Basses']))
    const en = texts({ push: 'P', pull: 'D', bass: 'Basses' })
    expect(en).toContain('D')
    expect(en).not.toContain('T')
  })
})

describe('CADB and Corgeron tablatures', () => {
  const arr = arrange(song, hohner2915GC)
  const textsOf = (notation: 'argoat' | 'cadb' | 'corgeron') =>
    layout(arr, hohner2915GC, song.meter, { staff: false, notation }).flatMap((l) => l.ops)

  it('CADB: numbers on the P and T lines, with the row marks of Argoat, no beat marks or hold lines', () => {
    const ops = textsOf('cadb')
    const numbers = ops.filter((o) => o.kind === 'text' && o.note !== undefined)
    expect(numbers).toHaveLength(arr.notes.length)
    expect(numbers.some((o) => o.kind === 'text' && o.text.endsWith("'"))).toBe(true)
    // Tab lines and barlines are drawn; the small filled beat dots of Système Argoat are not.
    expect(ops.some((o) => o.kind === 'line' && o.ink === 'muted' && o.width < 0.6)).toBe(true)
    expect(ops.filter((o) => o.kind === 'ellipse')).toHaveLength(0)
  })

  it('CADB: the bass line shows names (bass in capitals, chord in lower case), not circles', () => {
    const ops = textsOf('cadb')
    expect(ops.filter((o) => o.kind === 'circle')).toHaveLength(0)
    const names = ops.filter((o) => o.kind === 'text' && o.bass !== undefined).map((o) => (o.kind === 'text' ? o.text : ''))
    expect(names).toHaveLength(arr.bass.length)
    expect(names.some((n) => /^[A-G]/.test(n))).toBe(true)
    expect(names.some((n) => /^[a-g]/.test(n))).toBe(true)
  })

  it('Corgeron: one line per row, pull notes underlined, row given by the line not by a mark', () => {
    const ops = textsOf('corgeron')
    const numbers = ops.filter((o) => o.kind === 'text' && o.note !== undefined)
    expect(numbers).toHaveLength(arr.notes.length)
    for (const o of numbers) {
      if (o.kind !== 'text') continue
      const n = arr.notes[o.note!]!
      expect(Boolean(o.underline)).toBe(n.fingering.bellows === 'pull')
    }
    // The row is the line, so the numbers carry no apostrophe.
    expect(numbers.some((o) => o.kind === 'text' && o.text.includes("'"))).toBe(false)
    // Two rows on the Hohner: the numbers sit on exactly two different lines.
    const ys = new Set(numbers.map((o) => (o.kind === 'text' ? o.y : 0)))
    expect(ys.size).toBe(2)
    for (const o of numbers) {
      const n = arr.notes[(o as { note: number }).note]!
      const row = hohner2915GC.rows.findIndex((r) => r.id === n.fingering.row)
      expect(((o as { y: number }).y)).toBe(27 + row * 21)
    }
  })
})

describe('keyboard tablature', () => {
  const arr = arrange(song, hohner2915GC, { bass: true })
  const ops = layout(arr, hohner2915GC, song.meter, { staff: false, notation: 'keyboard' }).flatMap((l) => l.ops)

  it('draws one mini keyboard per note: the button to press is the only filled coloured dot, on the row of its fingering', () => {
    const pressed = ops.filter((o) => o.kind === 'ellipse' && o.note !== undefined)
    expect(pressed).toHaveLength(arr.notes.length)
    for (const o of pressed) {
      if (o.kind !== 'ellipse') continue
      const n = arr.notes[o.note!]!
      expect(o.ink).toBe(n.fingering.bellows)
      expect(o.y).toBeCloseTo(25 + hohner2915GC.rows.findIndex((r) => r.id === n.fingering.row) * 6)
    }
    // Every other button of the keyboard is drawn too, in the light ink of the empty buttons.
    const perNote = hohner2915GC.rows.reduce((sum, r) => sum + r.buttons.length, 0)
    const lastRowY = 25 + (hohner2915GC.rows.length - 1) * 6
    const empty = ops.filter((o) => o.kind === 'ellipse' && o.ink === 'line' && o.y <= lastRowY + 0.01)
    expect(empty).toHaveLength(arr.notes.length * (perNote - 1))
  })

  it('writes the bellows under each keyboard (so a black and white print stays readable) and has no number or tab line', () => {
    const letters = ops.filter((o) => o.kind === 'text' && (o.text === 'P' || o.text === 'T'))
    expect(letters).toHaveLength(arr.notes.length)
    expect(ops.some((o) => o.kind === 'text' && o.note !== undefined)).toBe(false)
    expect(ops.some((o) => o.kind === 'line' && o.ink === 'muted' && o.width < 0.6)).toBe(false)
  })

  it('gives each note a clickable area covering its keyboard, for the fingering editor', () => {
    const hits = ops.filter((o) => o.kind === 'hit')
    expect(hits.map((o) => (o.kind === 'hit' ? o.note : -1))).toEqual(arr.notes.map((_, i) => i))
  })

  it('left hand: a small bass/chord keyboard with the pressed button filled, and the name of the bass or chord', () => {
    expect(arr.bass.length).toBeGreaterThan(0)
    expect(ops.filter((o) => o.kind === 'circle')).toHaveLength(0)
    const pressed = ops.filter((o) => o.kind === 'ellipse' && o.bass !== undefined)
    expect(pressed).toHaveLength(arr.bass.length)
    for (const o of pressed) expect(o.kind === 'ellipse' && o.ink).toBe('bass')
    const names = ops.filter((o) => o.kind === 'text' && o.bass !== undefined).map((o) => (o.kind === 'text' ? o.text : ''))
    expect(names).toHaveLength(arr.bass.length)
    expect(names.some((n) => /^[A-G]/.test(n))).toBe(true)
    expect(names.some((n) => /^[a-g]/.test(n))).toBe(true)
  })

  it('spaces the lines so two mini keyboards never overlap, and works with the three-row keyboard', () => {
    const three = getInstrument('diatonic-gcf-31')!
    if (three.family !== 'diatonic-accordion') throw new Error('diatonic accordion expected')
    const arr3 = arrange(song, three)
    const lines = layout(arr3, three, song.meter, { staff: true, notation: 'keyboard' })
    const hits = lines.flatMap((l) => l.ops).filter((o) => o.kind === 'hit')
    expect(hits).toHaveLength(arr3.notes.length)
    for (const l of lines) {
      const xs = l.ops.filter((o) => o.kind === 'hit').map((o) => (o.kind === 'hit' ? [o.x, o.x + o.w] : [0, 0]))
      for (let i = 1; i < xs.length; i++) expect(xs[i]![0]!).toBeGreaterThanOrEqual(xs[i - 1]![1]! - 1)
    }
  })
})

describe('keyboard tablature, chromatic accordion', () => {
  const chromatic = getInstrument('chromatic-c-3row')!
  if (chromatic.family !== 'chromatic-accordion') throw new Error('chromatic accordion expected')
  const arr = arrange(song, chromatic)

  it('keeps one line per row (Corgeron layout) unless the keyboard is asked for', () => {
    const ops = layout(arr, chromatic, song.meter, { staff: false, notation: 'argoat' }).flatMap((l) => l.ops)
    expect(ops.some((o) => o.kind === 'hit')).toBe(false)
    expect(ops.some((o) => o.kind === 'text' && o.note !== undefined)).toBe(true)
  })

  it('draws the keyboard of the three rows with the pressed button filled, in plain ink, and its number under it', () => {
    const lines = layout(arr, chromatic, song.meter, { staff: false, notation: 'keyboard' })
    const ops = lines.flatMap((l) => l.ops)
    const pressed = ops.filter((o) => o.kind === 'ellipse' && o.note !== undefined)
    expect(pressed).toHaveLength(arr.notes.length)
    for (const o of pressed) expect(o.kind === 'ellipse' && o.ink).toBe('ink')
    const numbers = ops.filter((o) => o.kind === 'text' && /^\d+$/.test(o.text) && o.y > 25 && o.size === 7.5)
    expect(numbers.map((o) => (o.kind === 'text' ? o.text : ''))).toEqual(arr.notes.map((n) => String(n.fingering.button)))
    expect(ops.filter((o) => o.kind === 'hit')).toHaveLength(arr.notes.length)
  })

  it('left hand: the Stradella keyboard, six rows by twelve columns, with the pressed button filled and its name', () => {
    expect(arr.bass.length).toBeGreaterThan(0)
    const lines = layout(arr, chromatic, song.meter, { staff: false, notation: 'keyboard' })
    const ops = lines.flatMap((l) => l.ops)
    const pressed = ops.filter((o) => o.kind === 'ellipse' && o.bass !== undefined)
    expect(pressed).toHaveLength(arr.bass.length)
    // Rows of the pressed buttons: the first one of the bar is a fundamental bass, the second row from the top.
    const rowYs = [...new Set(ops.filter((o) => o.kind === 'ellipse' && o.ink === 'line' && o.y > 40).map((o) => (o.kind === 'ellipse' ? o.y : 0)))]
    expect(rowYs).toHaveLength(6)
    const first = pressed[0]!
    expect(first.kind === 'ellipse' && first.y).toBeCloseTo(Math.min(...rowYs) + 4.4)
    const empty = ops.filter((o) => o.kind === 'ellipse' && o.ink === 'line' && o.y > 40)
    expect(empty).toHaveLength(arr.bass.length * (6 * 12 - 1))
    const names = ops.filter((o) => o.kind === 'text' && o.bass !== undefined).map((o) => (o.kind === 'text' ? o.text : ''))
    expect(names).toHaveLength(arr.bass.length)
    expect(names.some((n) => /^[A-G]#?b?$/.test(n))).toBe(true)
    expect(names.some((n) => /^[a-g]/.test(n))).toBe(true)
    // The six-row keyboard needs more room than the two-row one.
    expect(lines[0]!.height).toBeGreaterThan(80)
  })

  it('the other notation of the chromatic accordion writes the bass line by name: c, cm, c7…', () => {
    const ops = layout(arr, chromatic, song.meter, { staff: false }).flatMap((l) => l.ops)
    const names = ops.filter((o) => o.kind === 'text' && o.bass !== undefined).map((o) => (o.kind === 'text' ? o.text : ''))
    expect(names).toHaveLength(arr.bass.length)
    expect(names.some((n) => /^[a-g]#?b?(m|7|dim)?$/.test(n))).toBe(true)
  })
})

describe('guitar and whistle tablatures', () => {
  it('guitar: one fret number per note, each on the line of its string, with string names and barlines', () => {
    const guitar = getInstrument('guitar-standard')!
    if (guitar.family !== 'string') throw new Error('guitar expected')
    const arr = arrangeStrings(song, guitar)
    const ops = layoutStrings(arr, guitar, song.meter, { staff: false }).flatMap((l) => l.ops)
    const frets = ops.filter((o) => o.kind === 'text' && o.note !== undefined)
    expect(frets).toHaveLength(arr.notes.length)
    for (const o of frets) {
      if (o.kind !== 'text') continue
      expect(o.text).toBe(String(arr.notes[o.note!]!.position.fret))
    }
    // Higher strings are drawn higher (smaller y).
    const yOf = (string: number) => frets.find((o) => o.kind === 'text' && arr.notes[o.note!]!.position.string === string)
    const ys = [0, 1, 2, 3, 4, 5].map((st) => yOf(st)).filter(Boolean).map((o) => (o as { y: number }).y)
    expect([...ys].sort((a, b) => b - a)).toEqual(ys)
    const names = ops.filter((o) => o.kind === 'text' && o.note === undefined && ['E', 'A', 'D', 'G', 'B', 'e'].includes(o.text))
    expect(names.length).toBeGreaterThanOrEqual(6)
  })

  it('whistle: six circles per note, filled where the hole is covered, a plus for the second octave', () => {
    const whistle = getInstrument('whistle-d')!
    if (whistle.family !== 'whistle') throw new Error('whistle expected')
    const arr = arrangeWhistle(song, whistle)
    const ops = layoutWhistle(arr, whistle, song.meter, { staff: false }).flatMap((l) => l.ops)
    arr.notes.forEach((note, i) => {
      const circles = ops.filter((o) => o.kind === 'ellipse' && o.note === i)
      expect(circles).toHaveLength(6)
      expect(circles.map((c) => (c.kind === 'ellipse' && c.filled ? '1' : '0')).join('')).toBe(note.holes)
      const plus = ops.some((o) => o.kind === 'text' && o.note === i && o.text === '+')
      expect(plus).toBe(note.octave === 2)
    })
  })

  it('both draw the staff when asked and give each line a height that holds the tab', () => {
    const guitar = getInstrument('guitar-standard')!
    if (guitar.family !== 'string') throw new Error('guitar expected')
    const arr = arrangeStrings(song, guitar)
    const withStaff = layoutStrings(arr, guitar, song.meter, { staff: true })
    const without = layoutStrings(arr, guitar, song.meter, { staff: false })
    expect(withStaff[0]!.height).toBeGreaterThan(without[0]!.height)
    expect(without[0]!.height).toBeGreaterThanOrEqual(24 + 6 * 11)
  })
})
