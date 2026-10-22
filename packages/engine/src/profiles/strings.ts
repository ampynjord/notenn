import type { StringProfile } from '../types'

/** Fretted instruments, in standard tunings; frets are counted up to the end of the board. */
export const stringProfiles: StringProfile[] = [
  {
    id: 'guitar-standard',
    name: 'Guitar, standard tuning (EADGBE)',
    family: 'string',
    tuning: [40, 45, 50, 55, 59, 64],
    stringNames: ['E', 'A', 'D', 'G', 'B', 'e'],
    frets: 22,
  },
  {
    id: 'guitar-dadgad',
    name: 'Guitar, DADGAD (Celtic tuning)',
    family: 'string',
    tuning: [38, 45, 50, 55, 57, 62],
    stringNames: ['D', 'A', 'D', 'G', 'A', 'd'],
    frets: 22,
  },
  {
    id: 'ukulele-gcea',
    name: 'Ukulele, GCEA (soprano)',
    family: 'string',
    // Re-entrant tuning: the 4th string (G) is higher than the 3rd (C).
    tuning: [67, 60, 64, 69],
    stringNames: ['G', 'C', 'E', 'A'],
    frets: 15,
  },
]
