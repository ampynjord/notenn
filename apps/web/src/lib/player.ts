import type { Arrangement, InstrumentProfile } from '@notenn/engine'

export interface PlayOptions {
  /** Quarter notes per minute, speed already applied. */
  bpm: number
  /** Played span, in quarter notes; the whole arrangement by default. */
  from?: number
  to?: number
  /** Click on every beat, accented on the first beat of each bar. */
  metronome?: boolean
  /** One bar of clicks before the music starts. */
  countIn?: boolean
}

export interface Playback {
  /** Current position in quarter notes; below `from` during the count-in. */
  position(): number
  stop(): void
  readonly from: number
  readonly to: number
}

/**
 * Playback with a simplified accordion sound: two slightly detuned voices ("musette" effect).
 * The sound is synthesised, so slowing down never changes the pitch.
 */
export function play(arr: Arrangement, profile: InstrumentProfile, opts: PlayOptions): Playback {
  const ctx = new AudioContext()
  const spb = 60 / opts.bpm
  const end = arr.notes.reduce((m, n) => Math.max(m, n.start + n.dur), arr.notes[0]?.start ?? 0)
  const from = opts.from ?? arr.notes[0]?.start ?? 0
  const to = Math.min(opts.to ?? end, end)
  const lead = opts.countIn ? arr.meter.barLength : 0
  // Audio time of musical position `from`.
  const t0 = ctx.currentTime + 0.12 + lead * spb
  const at = (q: number) => t0 + (q - from) * spb

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

  const click = (time: number, accent: boolean) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.value = accent ? 1760 : 1175
    g.gain.setValueAtTime(accent ? 0.5 : 0.3, time)
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    o.connect(g)
    g.connect(ctx.destination)
    o.start(time)
    o.stop(time + 0.06)
  }

  for (const voiceNotes of arr.voices)
    for (const n of voiceNotes) {
      if (n.start < from - 1e-6 || n.start >= to - 1e-6) continue
      const dur = Math.min(n.start + n.dur, to) - n.start
      voice(n.pitch, at(n.start), Math.max(0.08, dur * spb - 0.02), n.voice === 0 ? 0.6 : 0.4)
    }
  for (const ev of arr.bass) {
    if (ev.time < from - 1e-6 || ev.time >= to - 1e-6) continue
    const g = profile.bassGroups.find((x) => x.id === ev.group)
    if (!g) continue
    const side = g[ev.bellows]
    const d = arr.meter.beat * spb * 0.55
    if (ev.isBass) voice(36 + side.bass, at(ev.time), d, 0.5)
    else side.chord.forEach((pc) => voice(48 + pc, at(ev.time), d, 0.18))
  }

  // Beats are counted from the first full bar (after the pickup).
  const isBarStart = (q: number) => {
    const r = (q - arr.pickup) / arr.meter.barLength
    return Math.abs(r - Math.round(r)) < 1e-6
  }
  const firstBeat =
    arr.pickup + Math.ceil((from - arr.pickup) / arr.meter.beat - 1e-6) * arr.meter.beat
  if (opts.countIn)
    for (let k = 0; k < arr.meter.beatsPerBar; k++)
      click(at(from - lead + k * arr.meter.beat), k === 0)
  if (opts.metronome)
    for (let q = firstBeat; q < to - 1e-6; q += arr.meter.beat) click(at(q), isBarStart(q))

  return {
    from,
    to,
    position: () => from + (ctx.currentTime - t0) / spb,
    stop: () => void ctx.close(),
  }
}
