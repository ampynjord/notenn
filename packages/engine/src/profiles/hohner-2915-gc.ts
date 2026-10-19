import { parseProfile } from '../profile-format'
import json from './hohner-2915-gc.json'

/**
 * Hohner 2915 Sol/Do, 2 rangs, 21 boutons, 8 basses.
 * Décrit dans hohner-2915-gc.json (format notenn-instrument v1).
 */
export const hohner2915GC = parseProfile(json)
