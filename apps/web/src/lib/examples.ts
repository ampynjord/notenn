import { layout, type LineLabels, type SystemLine } from '@notenn/argoat'
import { arrange, hohner2915GC, type Song } from '@notenn/engine'

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

/** Opening of "Auld Lang Syne" (traditional), for the notation page. */
export const notationSong = song(
  'Auld Lang Syne',
  4,
  4,
  1,
  '67:1 72:1.5 72:0.5 72:1 76:1 74:1.5 72:0.5 74:1 76:0.5 74:0.5 72:1.5 72:0.5 76:1 79:1 81:3',
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
