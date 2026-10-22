import type { Instrument, InstrumentProfile } from '../types'
import { parseProfile } from '../profile-format'
import ad21 from './diatonic-ad-21.json'
import bbeb21 from './diatonic-bbeb-21.json'
import cf21 from './diatonic-cf-21.json'
import dg21 from './diatonic-dg-21.json'
import gc21 from './diatonic-gc-21.json'
import gcf31 from './diatonic-gcf-31.json'
import chromatic3 from './chromatic-c-3row.json'
import { hohner2915GC } from './hohner-2915-gc'
import { stringProfiles } from './strings'
import { whistleProfiles } from './whistles'

/** Every built-in keyboard, the reference Hohner 2915 first. */
export const profiles: InstrumentProfile[] = [hohner2915GC, ...[gc21, dg21, ad21, cf21, bbeb21, gcf31].map((json) => parseProfile(json))]

/** The diatonic keyboards. */
export function getProfile(id: string): InstrumentProfile | undefined {
  return profiles.find((p) => p.id === id)
}

/** Every instrument, by family: diatonic accordions first, then the chromatic accordion, strings and whistles. */
export const chromaticProfiles: InstrumentProfile[] = [parseProfile(chromatic3)]
export const instruments: Instrument[] = [...profiles, ...chromaticProfiles, ...stringProfiles, ...whistleProfiles]

export function getInstrument(id: string): Instrument | undefined {
  return instruments.find((i) => i.id === id)
}
