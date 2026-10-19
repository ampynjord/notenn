import { fingeringsFor, pitchClass } from './keyboard'
import type { FingerChoice, Fingering, InstrumentProfile, MeterInfo, Note } from './types'

/**
 * Notes played together by the right hand: the first pitch is the melody (top voice), the others
 * are lower voices sounding at the same time. A single-pitch group is a plain melody note.
 */
export interface NoteGroup {
  start: number
  dur: number
  pitches: number[]
}

/** Largest distance, in buttons, between two fingers of the same chord. */
const MAX_SPAN = 4
/** Upper bound on the fingering combinations examined per group (keeps chords cheap). */
const MAX_OPTIONS = 64

/**
 * All the ways to play a group: one fingering per pitch, all in the same bellows direction,
 * on distinct buttons, within a hand span. The first fingering of each option is the melody's.
 */
export function groupOptions(pitches: number[], profile: InstrumentProfile, rows: string[]): Fingering[][] {
  let combos: Fingering[][] = [[]]
  for (const p of pitches) {
    const next: Fingering[][] = []
    for (const combo of combos)
      for (const f of fingeringsFor(p, profile, rows)) {
        if (combo.length && f.bellows !== combo[0]!.bellows) continue
        if (combo.some((c) => c.row === f.row && c.button === f.button)) continue
        if (combo.some((c) => Math.abs(c.y - f.y) > MAX_SPAN)) continue
        next.push([...combo, f])
        if (next.length >= MAX_OPTIONS) break
      }
    combos = next
  }
  return combos
}

/**
 * Fingering by dynamic programming over note groups: for each group, the buttons that minimise
 * bellows changes (especially in legato), row changes and hand movement, while avoiding on-beat
 * notes that no bass chord can accompany. Groups with no option in a single bellows direction
 * fall back to their melody note alone, so a chord never makes a note disappear.
 */
export function chooseGroupFingering(
  groups: NoteGroup[],
  profile: InstrumentProfile,
  rows: string[],
  meter: MeterInfo,
  pickup: number,
  fixed: (FingerChoice | undefined)[] = [],
): Fingering[][] {
  const rowCost = new Map(profile.rows.map((r) => [r.id, r.cost]))
  const onBeat = (g: NoteGroup) => {
    const b = (g.start - pickup) / meter.beat
    return Math.abs(b - Math.round(b)) < 1e-6
  }
  const harmonizable = (f: Fingering, pitch: number) => profile.bassGroups.some((b) => b[f.bellows].chord.includes(pitchClass(pitch)))

  const nodeCost = (g: NoteGroup, opt: Fingering[]) =>
    opt.reduce((c, f) => c + (rowCost.get(f.row) ?? 0), 0) + (onBeat(g) && !harmonizable(opt[0]!, g.pitches[0]!) ? 0.6 : 0)

  const moveCost = (a: Fingering[], b: Fingering[], ga: NoteGroup, gb: NoteGroup) => {
    const fa = a[0]!
    const fb = b[0]!
    let c = 0
    if (fa.bellows !== fb.bellows) c += ga.start + ga.dur >= gb.start - 1e-6 ? 2.5 : 0.9
    if (fa.row !== fb.row) c += 0.4
    return c + Math.abs(fa.y - fb.y) * 0.12
  }

  const same = (f: Fingering, c: FingerChoice) => f.row === c.row && f.button === c.button && f.bellows === c.bellows
  const options = groups.map((g, i) => {
    let opts = groupOptions(g.pitches, profile, rows)
    if (!opts.length) opts = groupOptions(g.pitches.slice(0, 1), profile, rows)
    const choice = fixed[i]
    if (choice) {
      // A hand-picked melody fingering wins; the lower voices keep whatever fits with it.
      const kept = opts.filter((o) => same(o[0]!, choice))
      const alone = groupOptions(g.pitches.slice(0, 1), profile, rows).filter((o) => same(o[0]!, choice))
      if (kept.length) opts = kept
      else if (alone.length) opts = alone
    }
    return opts
  })
  const cost: number[][] = []
  const back: number[][] = []
  groups.forEach((g, i) => {
    cost[i] = []
    back[i] = []
    options[i]!.forEach((opt, j) => {
      let best = 0
      let from = -1
      if (i > 0) {
        best = Infinity
        options[i - 1]!.forEach((prev, k) => {
          const v = cost[i - 1]![k]! + moveCost(prev, opt, groups[i - 1]!, g)
          if (v < best) {
            best = v
            from = k
          }
        })
      }
      cost[i]![j] = best + nodeCost(g, opt)
      back[i]![j] = from
    })
  })

  const out: Fingering[][] = new Array(groups.length)
  if (!groups.length) return out
  const last = cost[groups.length - 1]!
  let j = last.indexOf(Math.min(...last))
  for (let i = groups.length - 1; i >= 0; i--) {
    out[i] = options[i]![j]!
    j = back[i]![j]!
  }
  return out
}

/** Melody-only fingering: one button per note. */
export function chooseFingering(
  notes: Note[],
  profile: InstrumentProfile,
  rows: string[],
  meter: MeterInfo,
  pickup: number,
): Fingering[] {
  const groups = notes.map((n) => ({ start: n.start, dur: n.dur, pitches: [n.pitch] }))
  return chooseGroupFingering(groups, profile, rows, meter, pickup).map((opt) => opt[0]!)
}
