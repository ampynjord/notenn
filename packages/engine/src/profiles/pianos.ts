import type { PianoProfile } from '../types'

/** Pianos and keyboards, by the range of their keys (MIDI: A0 = 21, C2 = 36, C7 = 96, C8 = 108). */
export const pianoProfiles: PianoProfile[] = [
  { id: 'piano-88', name: 'Piano, 88 keys', family: 'piano', low: 21, high: 108 },
  { id: 'keyboard-61', name: 'Keyboard, 61 keys', family: 'piano', low: 36, high: 96 },
]
