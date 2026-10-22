import { layout, type LineLabels, type SystemLine } from '@notenn/argoat'
import { layoutStrings, layoutWhistle } from '@notenn/argoat'
import { arrange, arrangeStrings, arrangeWhistle, getInstrument, hohner2915GC, type Song } from '@notenn/engine'

/** Builds a song from "pitch:duration" tokens (durations in quarter notes). */
function song(title: string, num: number, den: number, pickup: number, spec: string): Song {
  let t = 0
  const notes = spec.split(/\s+/).map((tok) => {
    const [p, d] = tok.split(':').map(Number)
    const n = { start: t, dur: d!, pitch: p! }
    t += d!
    return n
  })
  return { title, meter: { num, den }, pickup, tempo: 90, tracks: [{ name: '', notes }] }
}

/** Opening of "Au clair de la lune" (traditional), for the home page. */
export const heroSong = song(
  'Au clair de la lune',
  4,
  4,
  0,
  '72:1 72:1 72:1 74:1 76:2 74:2 72:1 76:1 74:1 74:1 72:4',
)

export function exampleLines(
  s: Song,
  labels: LineLabels,
  opts: { staff: boolean; width: number; barsPerLine?: number },
): SystemLine[] {
  const arr = arrange(s, hohner2915GC, { transpose: 0 })
  return layout(arr, hohner2915GC, s.meter, {
    width: opts.width,
    staff: opts.staff,
    labels,
    ...(opts.barsPerLine ? { barsPerLine: opts.barsPerLine } : {}),
  })
}

/** The same tune written for another instrument, by instrument id (the home page shows them side by side). */
export function exampleLinesFor(id: string, labels: LineLabels, opts: { width: number; barsPerLine: number }): SystemLine[] {
  const instrument = getInstrument(id)
  const common = { width: opts.width, staff: false, barsPerLine: opts.barsPerLine }
  if (!instrument || instrument.family === 'diatonic-accordion') return exampleLines(heroSong, labels, { staff: false, ...opts })
  if (instrument.family === 'chromatic-accordion')
    return layout(arrange(heroSong, instrument, { transpose: 0, bass: false }), instrument, heroSong.meter, { ...common, labels })
  if (instrument.family === 'string') return layoutStrings(arrangeStrings(heroSong, instrument), instrument, heroSong.meter, common)
  if (instrument.family === 'whistle') return layoutWhistle(arrangeWhistle(heroSong, instrument), instrument, heroSong.meter, common)
  return exampleLines(heroSong, labels, { staff: false, ...opts })
}
