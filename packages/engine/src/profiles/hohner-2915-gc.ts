import { parseProfile } from '../profile-format'
import json from './hohner-2915-gc.json'

/**
 * Hohner 2915 G/C, 2 rows, 21 buttons, 8 basses.
 * Described in hohner-2915-gc.json (notenn-instrument v1 format).
 */
export const hohner2915GC = parseProfile(json)
