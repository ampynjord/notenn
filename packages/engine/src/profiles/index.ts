import type { InstrumentProfile } from '../types'
import { parseProfile } from '../profile-format'
import ad21 from './diatonic-ad-21.json'
import bbeb21 from './diatonic-bbeb-21.json'
import cf21 from './diatonic-cf-21.json'
import dg21 from './diatonic-dg-21.json'
import gc21 from './diatonic-gc-21.json'
import gcf31 from './diatonic-gcf-31.json'
import { hohner2915GC } from './hohner-2915-gc'

/** Every built-in keyboard, the reference Hohner 2915 first. */
export const profiles: InstrumentProfile[] = [hohner2915GC, ...[gc21, dg21, ad21, cf21, bbeb21, gcf31].map((json) => parseProfile(json))]

export function getProfile(id: string): InstrumentProfile | undefined {
  return profiles.find((p) => p.id === id)
}
