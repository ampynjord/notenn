import { arrange, hohner2915GC, meterInfo } from '@notenn/engine'
import { fromAbc } from '@notenn/import'
import { describe, expect, it } from 'vitest'

import { BRETON_TUNES } from '@/seed/breton'
import { SEED_TUNES } from '@/seed/tunes'

// The Breton tunes are drafts at first, but they must read and play like the published ones.
const ALL_TUNES = [...SEED_TUNES, ...BRETON_TUNES]

describe('starter library', () => {
  it('holds about twenty tunes with unique slugs', () => {
    expect(SEED_TUNES.length).toBeGreaterThanOrEqual(19)
    expect(new Set(ALL_TUNES.map((t) => t.slug)).size).toBe(ALL_TUNES.length)
  })

  it.each(ALL_TUNES.map((t) => [t.slug, t] as const))(
    '%s reads, fills its bars and plays on the G/C keyboard',
    async (_slug, tune) => {
      const song = await fromAbc(tune.abc)
      expect(song.title).toBe(tune.title)
      expect(song.tracks).toHaveLength(1)
      const notes = song.tracks[0]!.notes
      expect(notes.length).toBeGreaterThan(10)
      // Every bar is full: the tune ends on a bar line, or its last bar completes the pickup.
      const end = Math.max(...notes.map((n) => n.start + n.dur))
      const { barLength } = meterInfo(song.meter)
      const whole = (x: number) => Math.abs(x - Math.round(x)) < 1e-6
      expect(whole((end - song.pickup) / barLength) || whole(end / barLength)).toBe(true)
      const arr = arrange(song, hohner2915GC)
      expect(arr.approxCount).toBe(0)
    },
  )
})
