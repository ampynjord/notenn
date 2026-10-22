import type { WhistleFingering, WhistleProfile } from '../types'

/**
 * Fingerings of a whistle in D, with the sounding pitch of each note (D5 = MIDI 74). Holes are written
 * from the one nearest the mouth: 1 = covered, 0 = open. The second octave is blown harder; its D is
 * fingered with the top hole open ("vented"), which keeps it from dropping an octave.
 * The scale is D major plus C natural (cross-fingered, which varies a little between whistles);
 * other notes are replaced by the nearest one the whistle plays (half-holing is not written).
 */
const D_WHISTLE: WhistleFingering[] = [
  { pitch: 74, holes: '111111', octave: 1 },
  { pitch: 76, holes: '111110', octave: 1 },
  { pitch: 78, holes: '111100', octave: 1 },
  { pitch: 79, holes: '111000', octave: 1 },
  { pitch: 81, holes: '110000', octave: 1 },
  { pitch: 83, holes: '100000', octave: 1 },
  { pitch: 84, holes: '011000', octave: 1 },
  { pitch: 85, holes: '000000', octave: 1 },
  { pitch: 86, holes: '011111', octave: 2 },
  { pitch: 88, holes: '111110', octave: 2 },
  { pitch: 90, holes: '111100', octave: 2 },
  { pitch: 91, holes: '111000', octave: 2 },
  { pitch: 93, holes: '110000', octave: 2 },
  { pitch: 95, holes: '100000', octave: 2 },
  { pitch: 96, holes: '010000', octave: 2 },
  { pitch: 97, holes: '000000', octave: 2 },
]

/** The same fingerings for a whistle in another key (a whistle in C sounds a tone lower than one in D). */
const inKey = (offset: number): WhistleFingering[] => D_WHISTLE.map((f) => ({ ...f, pitch: f.pitch + offset }))

export const whistleProfiles: WhistleProfile[] = [
  { id: 'whistle-d', name: 'Tin whistle in D', family: 'whistle', fingerings: inKey(0) },
  { id: 'whistle-c', name: 'Tin whistle in C', family: 'whistle', fingerings: inKey(-2) },
  { id: 'whistle-bb', name: 'Tin whistle in B♭', family: 'whistle', fingerings: inKey(-4) },
]
