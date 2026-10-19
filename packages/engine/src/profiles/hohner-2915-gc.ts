import type { InstrumentProfile } from '../types'

/**
 * Hohner 2915 Sol/Do, 2 rangs, 21 boutons, 8 basses.
 * Source : plan de clavier standard Accordéon Auvergne Services (docs/plan-clavier-hohner-2915.pdf).
 * Les octaves sont relatives (Do du bouton 6' poussé = 72) ; seul l'écart entre les notes compte.
 */
const C = 0, D = 2, E = 4, F = 5, G = 7, A = 9, B = 11

export const hohner2915GC: InstrumentProfile = {
  id: 'hohner-2915-gc',
  name: 'Hohner 2915 Sol/Do',
  family: 'diatonic-accordion',
  rows: [
    {
      id: 'do',
      name: 'Rang de Do (intérieur)',
      suffix: "'",
      offset: 0.5,
      cost: 0,
      buttons: [
        { push: 52, pull: 55 }, { push: 55, pull: 59 }, { push: 60, pull: 62 }, { push: 64, pull: 65 },
        { push: 67, pull: 69 }, { push: 72, pull: 71 }, { push: 76, pull: 74 }, { push: 79, pull: 77 },
        { push: 84, pull: 81 }, { push: 88, pull: 83 },
      ],
    },
    {
      id: 'sol',
      name: 'Rang de Sol (extérieur)',
      suffix: '',
      offset: 0,
      cost: 0.8,
      buttons: [
        { push: 47, pull: 50 }, { push: 50, pull: 54 }, { push: 55, pull: 57 }, { push: 59, pull: 60 },
        { push: 62, pull: 64 }, { push: 67, pull: 66 }, { push: 71, pull: 69 }, { push: 74, pull: 72 },
        { push: 79, pull: 76 }, { push: 83, pull: 78 }, { push: 86, pull: 81 },
      ],
    },
  ],
  bassGroups: [
    { id: 1, push: { bass: C, chord: [C, E, G] }, pull: { bass: G, chord: [G, B, D] } },
    { id: 2, push: { bass: G, chord: [G, B, D] }, pull: { bass: D, chord: [D, 6, A] } },
    { id: 3, push: { bass: F, chord: [F, A, C] }, pull: { bass: F, chord: [F, A, C] } },
    { id: 4, push: { bass: E, chord: [E, 8, B] }, pull: { bass: A, chord: [A, C, E] } },
  ],
}
