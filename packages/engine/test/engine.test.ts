import { describe, expect, it } from 'vitest'
import { arrange, hohner2915GC, meterInfo, snap, type Note, type Song } from '../src/index'

/** Construit des notes à partir de « hauteur:durée » (durées en noires). */
function seq(spec: string, start = 0): Note[] {
  const notes: Note[] = []
  let t = start
  for (const tok of spec.trim().split(/\s+/)) {
    const [p, d] = tok.split(':')
    const dur = Number(d)
    if (p !== 'R') notes.push({ start: t, dur, pitch: Number(p) })
    t += dur
  }
  return notes
}

// Auld Lang Syne, couplet (domaine public), Do majeur, levée d'une noire.
const auld: Song = {
  title: 'Auld Lang Syne',
  meter: { num: 4, den: 4 },
  pickup: 1,
  tempo: 80,
  tracks: [
    {
      name: 'Mélodie',
      notes: seq(
        '67:1 72:1.5 72:0.5 72:1 76:1 74:1.5 72:0.5 74:1 76:0.5 74:0.5 72:1.5 72:0.5 76:1 79:1 81:3 81:1 ' +
          '79:1.5 76:0.5 76:1 72:1 74:1.5 72:0.5 74:1 76:1 72:1.5 69:0.5 69:1 67:1 72:4',
      ),
    },
  ],
}

// Hector the Hero, début de la partie A (Skinner, 1903, domaine public), 3/4.
const hector: Song = {
  title: 'Hector the Hero',
  meter: { num: 3, den: 4 },
  pickup: 1,
  tempo: 60,
  tracks: [{ name: 'Mélodie', notes: seq('72:1 76:1.5 74:0.5 72:1 81:1 79:1 76:1 79:5 72:1 76:1.5 74:0.5 72:1 81:1 79:1 76:1 74:5') }],
}

describe('mesure', () => {
  it('reconnaît les mesures composées', () => {
    expect(meterInfo({ num: 6, den: 8 })).toEqual({ barLength: 3, beat: 1.5, beatsPerBar: 2 })
    expect(meterInfo({ num: 3, den: 4 })).toEqual({ barLength: 3, beat: 1, beatsPerBar: 3 })
  })
  it('recale le jeu « live » sur la grille', () => {
    expect(snap(1.02)).toBe(1)
    expect(snap(0.34)).toBeCloseTo(1 / 3)
  })
})

describe('arrangement sur Hohner 2915', () => {
  it('garde la tonalité quand tout est jouable', () => {
    const r = arrange(auld, hohner2915GC)
    expect(r.transpose).toBe(0)
    expect(r.approxCount).toBe(0)
    expect(r.notes).toHaveLength(auld.tracks[0]!.notes.length)
  })

  it('donne à chaque note un bouton qui produit bien cette note', () => {
    const r = arrange(auld, hohner2915GC)
    for (const n of r.notes) {
      const row = hohner2915GC.rows.find((x) => x.id === n.fingering.row)!
      const b = row.buttons[n.fingering.button - 1]!
      expect(n.fingering.bellows === 'P' ? b.push : b.pull).toBe(n.pitch)
    }
  })

  it('choisit des basses qui contiennent la note jouée, dans le même sens de soufflet', () => {
    const r = arrange(auld, hohner2915GC)
    expect(r.bass.length).toBeGreaterThan(0)
    for (const ev of r.bass) {
      const note = r.notes.find((n) => n.start <= ev.time + 1e-6 && ev.time < n.start + n.dur - 1e-6)!
      expect(note.fingering.bellows).toBe(ev.bellows)
      const g = hohner2915GC.bassGroups.find((x) => x.id === ev.group)!
      expect((ev.bellows === 'P' ? g.push : g.pull).chord).toContain(((note.pitch % 12) + 12) % 12)
    }
  })

  it('utilise le rang de Sol pour éviter les changements de soufflet (Hector)', () => {
    const both = arrange(hector, hohner2915GC)
    const doOnly = arrange(hector, hohner2915GC, { rows: ['do'] })
    expect(both.bellowsChanges).toBeLessThan(doOnly.bellowsChanges)
    expect(both.notes.some((n) => n.fingering.row === 'sol')).toBe(true)
    expect(doOnly.notes.every((n) => n.fingering.row === 'do')).toBe(true)
  })

  it('limite la tablature aux mesures demandées', () => {
    const r = arrange(auld, hohner2915GC, { fromBar: 2, toBar: 3 })
    expect(r.notes.every((n) => n.start >= 1 + 4 && n.start < 1 + 12)).toBe(true)
  })
})
