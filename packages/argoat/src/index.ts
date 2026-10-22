/**
 * Tablature layout for the diatonic accordion (Système Argoat, CADB, Corgeron), independent of the output medium: it produces a list of drawing
 * operations (text, line, ellipse, circle, polyline) in abstract units. The app draws them
 * as SVG, the PDF export with jsPDF.
 */
import type { Arrangement, InstrumentProfile, Meter } from '@notenn/engine'

/** Logical colours; each medium maps them (CSS variables, RGB for the PDF). */
export type Ink = 'push' | 'pull' | 'bass' | 'warn' | 'muted' | 'line' | 'ink'

/**
 * The diatonic accordion tablatures:
 * - argoat: P and T lines, time-proportional spacing, beat marks, hold lines, bass circles;
 * - cadb: P, T and bass lines, numbers only (prime = inner row, double prime = third row);
 * - corgeron: one line per row (the row is the line), pull notes underlined, bass line.
 */
export const NOTATIONS = ['argoat', 'cadb', 'corgeron'] as const
export type Notation = (typeof NOTATIONS)[number]

export type DrawOp =
  | { kind: 'text'; x: number; y: number; text: string; ink: Ink; size: number; bold?: boolean; mono?: boolean; anchor?: 'start' | 'middle'; note?: number; bass?: number; underline?: boolean }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; ink: Ink; width: number }
  | { kind: 'ellipse'; x: number; y: number; rx: number; ry: number; ink: Ink; filled: boolean; note?: number }
  | { kind: 'circle'; x: number; y: number; r: number; filled: boolean; label: string; bass: number }
  | { kind: 'polyline'; points: [number, number][]; ink: Ink; width: number }

export interface SystemLine {
  firstBar: number
  lastBar: number
  /** Temps (en noires) au bord gauche et droit de la ligne. */
  start: number
  end: number
  /** Drawing units per quarter note, and x position of time `start`. */
  scale: number
  x0: number
  height: number
  ops: DrawOp[]
}

export interface LayoutOptions {
  /** Drawing width in units (560 for an A4 page). */
  width?: number
  staff?: boolean
  /** Bars per line, or 'auto' to keep the numbers from overlapping. */
  barsPerLine?: number | 'auto'
  maxBarsPerLine?: number
  /** Translated line labels; Système Argoat letters in French by default. */
  labels?: Partial<LineLabels>
  /** Tablature system; Système Argoat by default. */
  notation?: Notation
  /** Corgeron: label of each row's line, by row id (the id in capitals by default). */
  rowLabels?: Record<string, string>
}

export interface LineLabels {
  push: string
  pull: string
  bass: string
}

const DEFAULT_LABELS: LineLabels = { push: 'P', pull: 'T', bass: 'Basses' }

const X0 = 44
const RIGHT = 8

/** Height of one line of music: the staff (optional), then the tab lines and the bass line. */
export function lineHeight(staff: boolean, rowCount = 2, notation: Notation = 'argoat') {
  const extra = notation === 'corgeron' ? Math.max(0, rowCount - 2) * 21 : 0
  return (staff ? 140 : 80) + extra
}

const PC_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

/** Name of a bass or of a chord for the bass line of CADB and Corgeron: bass "C", chord "c", "am", "g7"… */
export function bassName(pc: number[] | number, isBass: boolean): string {
  if (isBass) return PC_NAMES[(((pc as number) % 12) + 12) % 12]!
  const pcs = [...new Set((pc as number[]).map((x) => ((x % 12) + 12) % 12))]
  const shapes: [string, number[]][] = [['', [0, 4, 7]], ['m', [0, 3, 7]], ['7', [0, 4, 7, 10]], ['m7', [0, 3, 7, 10]]]
  for (const root of pcs) {
    const rel = pcs.map((x) => (x - root + 12) % 12).sort((a, b) => a - b)
    const hit = shapes.find(([, iv]) => iv.length === rel.length && iv.every((v, i) => v === rel[i]))
    if (hit) return PC_NAMES[root]!.toLowerCase() + hit[0]
  }
  return PC_NAMES[pcs[0] ?? 0]!.toLowerCase()
}

/** Button label: number + row mark (apostrophe for the inner row). */
export function buttonLabel(profile: InstrumentProfile, row: string, button: number) {
  const r = profile.rows.find((x) => x.id === row)
  return `${button}${r?.suffix ?? ''}`
}

/** Text of a button in the tab: Corgeron shows the row by the line, so its numbers carry no row mark. */
function tabLabel(profile: InstrumentProfile, row: string, button: number, notation: Notation) {
  return notation === 'corgeron' ? String(button) : buttonLabel(profile, row, button)
}

function autoBarsPerLine(arr: Arrangement, profile: InstrumentProfile, width: number, staff: boolean, max: number, notation: Notation) {
  const usable = width - X0 - RIGHT
  for (let b = max; b > 1; b--) {
    const sc = usable / (b * arr.meter.barLength + arr.pickup)
    let ok = true
    for (let i = 1; i < arr.notes.length; i++) {
      const prev = arr.notes[i - 1]!
      const gap = (arr.notes[i]!.start - prev.start) * sc
      const sameLine =
        notation === 'corgeron'
          ? arr.notes[i]!.fingering.row === prev.fingering.row
          : arr.notes[i]!.fingering.bellows === prev.fingering.bellows
      // Room needed after a button number on the same line: its width in the 11.5 px monospace.
      const label = tabLabel(profile, prev.fingering.row, prev.fingering.button, notation)
      if ((sameLine && gap < label.length * 6.9 + 2) || (staff && gap < 10)) {
        ok = false
        break
      }
    }
    if (ok) return b
  }
  return 1
}

/* ---------- Staff ---------- */
const LETTERS: [string, boolean][] = [
  ['C', false], ['C', true], ['D', false], ['D', true], ['E', false], ['F', false],
  ['F', true], ['G', false], ['G', true], ['A', false], ['A', true], ['B', false],
]
function pitchStep(p: number) {
  const pc = ((p % 12) + 12) % 12
  const [letter, sharp] = LETTERS[pc]!
  return { step: (Math.floor(p / 12) - 1) * 7 + 'CDEFGAB'.indexOf(letter), sharp }
}
const CLEF: [number, number][] = [
  [0.9, 2.2], [0.5, 2.6], [0.1, 2.3], [0.3, 1.9], [0.8, 2.1], [1.0, 1.0], [0.9, -2.5], [1.0, -4.0], [1.5, -4.6],
  [1.6, -3.6], [0.6, -2.2], [-0.2, -1.0], [-0.4, 0.2], [0.2, 0.9], [1.2, 0.9], [1.6, 0.2], [1.2, -0.5], [0.6, -0.4], [0.4, 0.1],
]
const VALUES = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25]

export interface DurationPiece {
  t: number
  /** Written value in quarter notes (for a triplet: the written figure, eighth = 0.5). */
  shape: number
  triplet: boolean
}

/**
 * Splits a duration into tied written figures: cut at barlines, then plain or dotted values;
 * thirds of a quarter note become triplets.
 */
export function splitDuration(from: number, to: number, pickup: number, barLength: number): DurationPiece[] {
  const out: DurationPiece[] = []
  let t = from
  while (to - t > 1e-6) {
    const nextBar = pickup + (Math.floor((t - pickup) / barLength + 1e-6) + 1) * barLength
    const segEnd = Math.min(to, t < pickup - 1e-6 ? Math.min(pickup, to) : nextBar)
    let n12 = Math.round((segEnd - t) * 12)
    if (n12 <= 0) break
    // n12 = 4a (triplets, in thirds of a quarter) + 3b (sixteenths), with a as small as possible.
    let a = 0
    while (a * 4 <= n12 && (n12 - a * 4) % 3 !== 0) a++
    if (a * 4 > n12) {
      // Irregular duration: rounded to the nearest sixteenth, at least one sixteenth.
      a = 0
      n12 = Math.max(3, Math.round(n12 / 3) * 3)
    }
    for (let k = a; k > 0; ) {
      const q = k >= 2 ? 2 : 1
      out.push({ t, shape: q === 2 ? 1 : 0.5, triplet: true })
      t += q / 3
      k -= q
    }
    let rest = (n12 - a * 4) / 12
    while (rest > 1e-6) {
      const v = VALUES.find((val) => val <= rest + 1e-6) ?? 0.25
      out.push({ t, shape: v, triplet: false })
      t += v
      rest -= v
    }
    t = Math.max(t, segEnd)
  }
  return out
}

function tieArc(x1: number, x2: number, y: number, dir: 1 | -1): [number, number][] {
  const h = Math.min(4, Math.max(2, (x2 - x1) / 8)) * dir
  return [0, 0.15, 0.35, 0.5, 0.65, 0.85, 1].map((f) => [x1 + (x2 - x1) * f, y + h * Math.sin(Math.PI * f)])
}

/** Most readable display octave on the staff (median note close to middle B). */
function displayOctave(arr: Arrangement) {
  const steps = arr.notes.map((n) => pitchStep(n.pitch).step).sort((a, b) => a - b)
  return steps.length ? Math.round((34 - steps[Math.floor(steps.length / 2)]!) / 7) : 0
}

export function layout(arr: Arrangement, profile: InstrumentProfile, meter: Meter, options: LayoutOptions = {}): SystemLine[] {
  const width = options.width ?? 560
  const staff = options.staff ?? true
  const labels = { ...DEFAULT_LABELS, ...options.labels }
  const notation = options.notation ?? 'argoat'
  const rowIds = profile.rows.map((r) => r.id)
  const bpl =
    options.barsPerLine === undefined || options.barsPerLine === 'auto'
      ? autoBarsPerLine(arr, profile, width, staff, options.maxBarsPerLine ?? (arr.meter.beatsPerBar > 4 ? 2 : 4), notation)
      : options.barsPerLine
  const octave = displayOctave(arr)
  const H = lineHeight(staff, rowIds.length, notation)
  const lines: SystemLine[] = []

  for (let b = arr.fromBar; b <= arr.toBar; b += bpl) {
    const e = Math.min(arr.toBar, b + bpl - 1)
    const withPickup = b === 1 && arr.pickup > 0
    const start = withPickup ? 0 : arr.pickup + (b - 1) * arr.meter.barLength
    const end = arr.pickup + e * arr.meter.barLength
    const span = bpl * arr.meter.barLength + (withPickup ? arr.pickup : 0)
    const scale = (width - X0 - RIGHT) / span
    const X = (t: number) => X0 + (t - start) * scale
    const inLine = (t: number) => t >= start - 1e-6 && t < end - 1e-6
    const ops: DrawOp[] = []
    const off = staff ? 60 : 0
    // Tab lines: P and T, or one line per row (Corgeron); the bass line comes last.
    const tabY = notation === 'corgeron' ? rowIds.map((_, i) => 27 + off + i * 21) : [27 + off, 48 + off]
    const yP = tabY[0]!, yT = tabY[1] ?? tabY[0]!
    const yB = notation === 'corgeron' ? 27 + off + rowIds.length * 21 - 2 : 67 + off
    const noteY = (n: Arrangement['notes'][number]) =>
      notation === 'corgeron' ? (tabY[Math.max(0, rowIds.indexOf(n.fingering.row))] ?? yP) : n.fingering.bellows === 'push' ? yP : yT
    // Where the numbers sit on each tab line, so the line can be drawn around them (CADB, Corgeron).
    const taken = new Map<number, [number, number][]>()

    if (staff) {
      const d = 5, top = 22, bot = top + 4 * d
      const yS = (st: number) => bot - ((st - 30) * d) / 2
      for (let i = 0; i < 5; i++) ops.push({ kind: 'line', x1: 4, y1: top + i * d, x2: width - 6, y2: top + i * d, ink: 'ink', width: 0.55 })
      ops.push({ kind: 'polyline', points: CLEF.map(([a, c]) => [10 + a * d * 1.2, bot - d + c * d * 1.2]), ink: 'ink', width: 1.5 })
      if (b === arr.fromBar) {
        ops.push({ kind: 'text', x: 24, y: top + 9.2, text: String(meter.num), ink: 'ink', size: 10.5, bold: true })
        ops.push({ kind: 'text', x: 24, y: bot - 0.8, text: String(meter.den), ink: 'ink', size: 10.5, bold: true })
      }
      for (let bar = b; bar <= e; bar++) {
        const xb = X(arr.pickup + (bar - 1) * arr.meter.barLength) - 4
        if (xb > X0 - 3) ops.push({ kind: 'line', x1: xb, y1: top, x2: xb, y2: bot, ink: 'ink', width: 0.8 })
      }
      ops.push({ kind: 'line', x1: width - 6, y1: top, x2: width - 6, y2: bot, ink: 'ink', width: 0.8 })
      // Accidentals: a sharp lasts until the barline, so a natural is needed if the same line comes back unaltered.
      const sharpened = new Map<number, Set<number>>()
      const triplets: { from: number; to: number; x: number; ey: number }[] = []
      arr.notes.forEach((n, ni) => {
        const nEnd = n.start + n.dur
        const own = inLine(n.start)
        // A note started on a previous line continues here as tied figures.
        if (!own && !(n.start < start - 1e-6 && nEnd > start + 1e-6)) return
        const ps = pitchStep(n.pitch)
        let natural = false
        if (own) {
          const barIdx = Math.floor((n.start - arr.pickup) / arr.meter.barLength + 1e-6)
          const inBar = sharpened.get(barIdx) ?? new Set<number>()
          sharpened.set(barIdx, inBar)
          natural = !ps.sharp && inBar.has(ps.step)
          if (ps.sharp) inBar.add(ps.step)
          else inBar.delete(ps.step)
        }
        const st = ps.step + octave * 7
        const y = yS(st)
        const ink: Ink = n.approx ? 'warn' : 'ink'
        const up = st < 34
        const pieces = splitDuration(Math.max(n.start, start), Math.min(nEnd, end), arr.pickup, arr.meter.barLength)
        let prevX: number | null = own ? null : X0 - 6
        pieces.forEach((pc, k) => {
          const x = X(pc.t) + 4
          for (let l = 28; l >= st; l -= 2) ops.push({ kind: 'line', x1: x - 5.5, y1: yS(l), x2: x + 5.5, y2: yS(l), ink: 'muted', width: 0.8 })
          for (let l = 40; l <= st; l += 2) ops.push({ kind: 'line', x1: x - 5.5, y1: yS(l), x2: x + 5.5, y2: yS(l), ink: 'muted', width: 0.8 })
          const v = pc.shape
          ops.push({ kind: 'ellipse', x, y, rx: 3.2, ry: 2.3, ink, filled: v < 2, ...(own && k === 0 ? { note: ni } : {}) })
          if (own && k === 0 && ps.sharp) ops.push({ kind: 'text', x: x - 11, y: y + 3.2, text: '#', ink, size: 9, bold: true })
          if (own && k === 0 && natural) ops.push({ kind: 'text', x: x - 11, y: y + 3.6, text: '♮', ink, size: 10, bold: true })
          if (v === 3 || v === 1.5 || v === 0.75) ops.push({ kind: 'ellipse', x: x + 6.2, y: st % 2 === 0 ? y - 2 : y, rx: 0.9, ry: 0.9, ink, filled: true })
          if (v < 4) {
            const sx = up ? x + 2.9 : x - 2.9
            const ey = up ? y - 17 : y + 17
            ops.push({ kind: 'line', x1: sx, y1: y, x2: sx, y2: ey, ink, width: 0.8 })
            const flags = v <= 0.25 + 1e-6 ? 2 : v < 1 ? 1 : 0
            for (let f = 0; f < flags; f++) {
              const fy = ey + (up ? f * 3.5 : -f * 3.5)
              ops.push({ kind: 'line', x1: sx, y1: fy, x2: sx + 4.5, y2: fy + (up ? 6 : -6), ink, width: 1.1 })
            }
            if (pc.triplet) {
              // Group span: a quarter note for eighth-note triplets, a half note for quarter-note triplets,
              // counted from the start of the bar.
              const span = pc.shape === 1 ? 2 : 1
              const barStart = arr.pickup + Math.floor((pc.t - arr.pickup) / arr.meter.barLength + 1e-6) * arr.meter.barLength
              const from = barStart + Math.floor((pc.t - barStart) / span + 1e-6) * span
              triplets.push({ from, to: from + span, x, ey })
            }
          }
          // Tie to the previous figure of the same note (on the side opposite the stem).
          if (prevX !== null) ops.push({ kind: 'polyline', points: tieArc(prevX + 4, x - 4, up ? y + 4 : y - 4, up ? 1 : -1), ink, width: 0.9 })
          prevX = x
        })
        // The note continues on the next line: tie up to the right edge.
        if (nEnd > end + 1e-6 && prevX !== null) ops.push({ kind: 'polyline', points: tieArc(prevX + 4, width - 4, up ? y + 4 : y - 4, up ? 1 : -1), ink, width: 0.9 })
      })
      // One "3" per triplet group; overlapping groups (mixed figures) count as one.
      triplets.sort((a, c) => a.from - c.from)
      const groups: (typeof triplets)[] = []
      for (const tr of triplets) {
        const last = groups.at(-1)
        if (last && tr.from < Math.max(...last.map((g) => g.to)) - 1e-6) last.push(tr)
        else groups.push([tr])
      }
      for (const g of groups) {
        const xs = g.map((tr) => tr.x)
        ops.push({ kind: 'text', x: (Math.min(...xs) + Math.max(...xs)) / 2 + 2, y: Math.min(...g.map((tr) => tr.ey), top) - 3, text: '3', ink: 'ink', size: 8, bold: true, anchor: 'middle' })
      }
    }

    if (notation === 'corgeron') {
      rowIds.forEach((id, i) =>
        ops.push({ kind: 'text', x: 6, y: tabY[i]!, text: options.rowLabels?.[id] ?? id.toUpperCase(), ink: 'ink', size: 12, bold: true }),
      )
    } else {
      ops.push({ kind: 'text', x: 6, y: yP, text: labels.push, ink: 'push', size: 12, bold: true })
      ops.push({ kind: 'text', x: 6, y: yT, text: labels.pull, ink: 'pull', size: 12, bold: true })
    }
    if (arr.bass.length) ops.push({ kind: 'text', x: 6, y: yB + 3, text: labels.bass, ink: 'bass', size: 7.5 })
    for (let bar = b; bar <= e; bar++) {
      ops.push({ kind: 'text', x: X(arr.pickup + (bar - 1) * arr.meter.barLength), y: staff ? 12 : 9, text: String(bar), ink: 'muted', size: 7 })
    }

    // Beat marks: a dot on each beat, a short tick at the start of each bar.
    const yR = (yT + yB) / 2 - 3
    const firstBeat = withPickup ? arr.pickup - Math.floor(arr.pickup / arr.meter.beat + 1e-6) * arr.meter.beat : start
    for (let t = firstBeat; notation === 'argoat' && t < end - 1e-6; t += arr.meter.beat) {
      const rel = (t - arr.pickup) / arr.meter.barLength
      const barStart = t >= arr.pickup - 1e-6 && Math.abs(rel - Math.round(rel)) < 1e-6
      if (barStart) ops.push({ kind: 'line', x1: X(t) + 4, y1: yR - 3, x2: X(t) + 4, y2: yR + 3, ink: 'muted', width: 1 })
      else ops.push({ kind: 'ellipse', x: X(t) + 4, y: yR, rx: 1.3, ry: 1.3, ink: 'muted', filled: true })
    }

    arr.notes.forEach((n, i) => {
      const y = noteY(n)
      // Note started on the previous line and still held: only the hold line continues (Système Argoat).
      if (n.start < start - 1e-6 && n.start + n.dur > start + 1e-6) {
        if (notation !== 'argoat') return
        const z = X(Math.min(n.start + n.dur, end)) - 5
        if (z > X0 + 2) ops.push({ kind: 'line', x1: X0 - 4, y1: y - 4, x2: z, y2: y - 4, ink: 'line', width: 2 })
        return
      }
      if (!inLine(n.start)) return
      const label = tabLabel(profile, n.fingering.row, n.fingering.button, notation)
      const ink: Ink = n.approx ? 'warn' : n.fingering.bellows
      const pullMark = notation === 'corgeron' && n.fingering.bellows === 'pull'
      ops.push({ kind: 'text', x: X(n.start), y, text: label, ink, size: 11.5, bold: true, mono: true, note: i, ...(pullMark ? { underline: true } : {}) })
      if (notation !== 'argoat') taken.set(y, [...(taken.get(y) ?? []), [X(n.start) - 2, X(n.start) + label.length * 7 + 1]])
      // A fingering chosen by hand is marked, so it is easy to spot and undo: underlined, or overlined
      // where the underline already means "pull" (Corgeron).
      if (n.edited) {
        const my = notation === 'corgeron' ? y - 11 : y + 3
        ops.push({ kind: 'line', x1: X(n.start), y1: my, x2: X(n.start) + label.length * 7, y2: my, ink, width: 1.2 })
      }
      if (notation === 'argoat' && n.dur > arr.meter.beat + 1e-6) {
        const a = X(n.start) + label.length * 7.6 + 3
        const z = X(Math.min(n.start + n.dur, end)) - 5
        if (z > a + 2) ops.push({ kind: 'line', x1: a, y1: y - 4, x2: z, y2: y - 4, ink: 'line', width: 2 })
      }
    })

    arr.bass.forEach((ev, bi) => {
      if (!inLine(ev.time)) return
      const side = profile.bassGroups.find((g) => g.id === ev.group)?.[ev.bellows]
      if (notation === 'argoat' || !side) {
        ops.push({ kind: 'circle', x: X(ev.time) + 6, y: yB, r: 6.2, filled: ev.isBass, label: String(ev.group), bass: bi })
        return
      }
      // CADB and Corgeron write the bass by its name: "C" for a bass, "c" or "am" for a chord.
      const text = bassName(ev.isBass ? side.bass : side.chord, ev.isBass)
      ops.push({ kind: 'text', x: X(ev.time), y: yB, text, ink: 'bass', size: 11, bold: ev.isBass, mono: true, bass: bi })
      taken.set(yB, [...(taken.get(yB) ?? []), [X(ev.time) - 2, X(ev.time) + text.length * 6.6 + 1]])
    })

    // CADB and Corgeron are drawn on tab lines, interrupted around the numbers, with barlines.
    if (notation !== 'argoat') {
      const lineYs = [...new Set([...tabY, ...(arr.bass.length ? [yB] : [])])]
      for (const ly of lineYs) {
        const cy = ly - 4
        let x = 4
        for (const [a, c] of (taken.get(ly) ?? []).sort((m, k) => m[0] - k[0])) {
          if (a > x) ops.push({ kind: 'line', x1: x, y1: cy, x2: a, y2: cy, ink: 'muted', width: 0.5 })
          x = Math.max(x, c)
        }
        if (x < width - 6) ops.push({ kind: 'line', x1: x, y1: cy, x2: width - 6, y2: cy, ink: 'muted', width: 0.5 })
      }
      const top = lineYs[0]! - 9
      const bottom = lineYs[lineYs.length - 1]! + 1
      for (let bar = b; bar <= e; bar++) {
        const xb = X(arr.pickup + (bar - 1) * arr.meter.barLength) - 4
        if (xb > X0 - 3) ops.push({ kind: 'line', x1: xb, y1: top, x2: xb, y2: bottom, ink: 'muted', width: 0.8 })
      }
      ops.push({ kind: 'line', x1: width - 6, y1: top, x2: width - 6, y2: bottom, ink: 'muted', width: 0.8 })
    }

    lines.push({ firstBar: b, lastBar: e, start, end, scale, x0: X0, height: H, ops })
  }
  return lines
}
