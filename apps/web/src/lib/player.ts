import type { Arrangement, InstrumentProfile } from '@notenn/engine'

export interface Playback {
  /** Position courante, en noires depuis le début du morceau. */
  position(): number
  stop(): void
  readonly endsAt: number
}

/** Lecture avec un son d'accordéon simplifié : deux voix légèrement désaccordées (effet « musette »). */
export function play(arr: Arrangement, profile: InstrumentProfile, bpm: number): Playback {
  const ctx = new AudioContext()
  const spb = 60 / bpm
  const t0 = ctx.currentTime + 0.1
  const base = arr.notes[0]?.start ?? 0
  const master = ctx.createGain()
  master.gain.value = 0.16
  master.connect(ctx.destination)
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 2600
  lp.connect(master)

  const voice = (midi: number, start: number, dur: number, vol: number) => {
    const g = ctx.createGain()
    g.connect(lp)
    g.gain.setValueAtTime(0, start)
    g.gain.linearRampToValueAtTime(vol, start + 0.03)
    g.gain.setValueAtTime(vol, Math.max(start + 0.03, start + dur - 0.06))
    g.gain.linearRampToValueAtTime(0, start + dur)
    for (const detune of [-6, 6]) {
      const o = ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = 440 * 2 ** ((midi - 69) / 12)
      o.detune.value = detune
      o.connect(g)
      o.start(start)
      o.stop(start + dur + 0.02)
    }
  }

  for (const n of arr.notes) voice(n.pitch, t0 + (n.start - base) * spb, Math.max(0.08, n.dur * spb - 0.02), 0.6)
  for (const ev of arr.bass) {
    const st = t0 + (ev.time - base) * spb
    if (st < t0 - 0.01) continue
    const g = profile.bassGroups.find((x) => x.id === ev.group)
    if (!g) continue
    const side = ev.bellows === 'P' ? g.push : g.pull
    const d = arr.meter.beat * spb * 0.55
    if (ev.isBass) voice(36 + side.bass, st, d, 0.5)
    else side.chord.forEach((pc) => voice(48 + pc, st, d, 0.18))
  }

  const endsAt = arr.notes.reduce((m, n) => Math.max(m, n.start + n.dur), base)
  return {
    endsAt,
    position: () => base + (ctx.currentTime - t0) / spb,
    stop: () => void ctx.close(),
  }
}
