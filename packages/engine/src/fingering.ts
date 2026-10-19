import { fingeringsFor, pitchClass } from './keyboard'
import type { Fingering, InstrumentProfile, MeterInfo, Note } from './types'

/**
 * Doigté par programmation dynamique : pour chaque note, le bouton qui minimise
 * changements de soufflet (surtout en legato), changements de rang et déplacements,
 * en évitant les notes sur un temps qu'aucun accord de basse ne peut accompagner.
 */
export function chooseFingering(
  notes: Note[],
  profile: InstrumentProfile,
  rows: string[],
  meter: MeterInfo,
  pickup: number,
): Fingering[] {
  const rowCost = new Map(profile.rows.map((r) => [r.id, r.cost]))
  const onBeat = (n: Note) => {
    const b = (n.start - pickup) / meter.beat
    return Math.abs(b - Math.round(b)) < 1e-6
  }
  const harmonizable = (f: Fingering, pitch: number) =>
    profile.bassGroups.some((g) => (f.bellows === 'P' ? g.push : g.pull).chord.includes(pitchClass(pitch)))

  const nodeCost = (n: Note, f: Fingering) =>
    (rowCost.get(f.row) ?? 0) + (onBeat(n) && !harmonizable(f, n.pitch) ? 0.6 : 0)

  const moveCost = (a: Fingering, b: Fingering, na: Note, nb: Note) => {
    let c = 0
    if (a.bellows !== b.bellows) c += na.start + na.dur >= nb.start - 1e-6 ? 2.5 : 0.9
    if (a.row !== b.row) c += 0.4
    return c + Math.abs(a.y - b.y) * 0.12
  }

  const options = notes.map((n) => fingeringsFor(n.pitch, profile, rows))
  const cost: number[][] = []
  const back: number[][] = []
  notes.forEach((n, i) => {
    const opts = options[i]!
    cost[i] = []
    back[i] = []
    opts.forEach((f, j) => {
      let best = 0
      let from = -1
      if (i > 0) {
        best = Infinity
        options[i - 1]!.forEach((pf, k) => {
          const v = cost[i - 1]![k]! + moveCost(pf, f, notes[i - 1]!, n)
          if (v < best) {
            best = v
            from = k
          }
        })
      }
      cost[i]![j] = best + nodeCost(n, f)
      back[i]![j] = from
    })
  })

  const out: Fingering[] = new Array(notes.length)
  if (!notes.length) return out
  const last = cost[notes.length - 1]!
  let j = last.indexOf(Math.min(...last))
  for (let i = notes.length - 1; i >= 0; i--) {
    out[i] = options[i]![j]!
    j = back[i]![j]!
  }
  return out
}
