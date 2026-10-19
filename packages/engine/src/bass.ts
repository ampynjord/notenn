import { pitchClass } from './keyboard'
import type { BassEvent, Fingering, InstrumentProfile, MeterInfo, Note } from './types'

const PRIOR = { P: [0.3, 0.2, 0.1, 0], T: [0.3, 0.2, 0.15, 0.1] }

/**
 * Une basse ou un accord par temps, toujours dans le sens du soufflet de la note jouée
 * et contenant cette note. Basse au 1er temps de la mesure, accord ensuite.
 */
export function chooseBass(
  notes: Note[],
  fingering: Fingering[],
  profile: InstrumentProfile,
  meter: MeterInfo,
  pickup: number,
  fromBar: number,
  toBar: number,
): BassEvent[] {
  const out: BassEvent[] = []
  let prev: { group: number; bellows: string } | null = null
  for (let bar = fromBar; bar <= toBar; bar++) {
    for (let k = 0; k < meter.beatsPerBar; k++) {
      const t = pickup + (bar - 1) * meter.barLength + k * meter.beat
      const i = notes.findIndex((n) => n.start <= t + 1e-6 && t < n.start + n.dur - 1e-6)
      if (i < 0) {
        prev = null
        continue
      }
      const bellows = fingering[i]!.bellows
      const pc = pitchClass(notes[i]!.pitch)
      const inBeat = notes
        .filter((n) => n.start >= t - 1e-6 && n.start < t + meter.beat - 1e-6)
        .map((n) => pitchClass(n.pitch))
      let best: number | null = null
      let bestScore = -1
      profile.bassGroups.forEach((g, gi) => {
        const chord = (bellows === 'P' ? g.push : g.pull).chord
        if (!chord.includes(pc)) return
        const s =
          1 +
          inBeat.filter((x) => chord.includes(x)).length * 0.3 +
          (PRIOR[bellows][gi] ?? 0) +
          (prev && prev.group === g.id && prev.bellows === bellows ? 0.5 : 0)
        if (s > bestScore) {
          bestScore = s
          best = g.id
        }
      })
      if (best !== null) {
        out.push({ time: t, group: best, bellows, isBass: k === 0 })
        prev = { group: best, bellows }
      } else prev = null
    }
  }
  return out
}
