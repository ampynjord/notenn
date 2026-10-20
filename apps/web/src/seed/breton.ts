import type { SeedTune } from './tunes'

/**
 * Breton tunes, added as drafts: they stay hidden until a publisher accepts them in the admin.
 * Only melodies that are free of rights go here, and each entry says where its notes come from.
 */
const abc = (lines: TemplateStringsArray) => lines[0]!.trim()

export const BRETON_TUNES: SeedTune[] = [
  {
    slug: 'bro-gozh-ma-zadou',
    title: 'Bro gozh ma zadoù',
    region: 'brittany',
    kind: 'song',
    level: 'intermediate',
    origin: 'James James (Hen Wlad fy Nhadau), 1856',
    notes: {
      fr: 'L’hymne de la Bretagne, sur la mélodie composée en 1856 par le Gallois James James pour « Hen Wlad fy Nhadau ». Les paroles bretonnes de Taldir Jaffrennou (1897) ne sont pas reproduites ici : seule la mélodie est publiée. À trois temps, tempo indicatif 80 à la noire, avec une anacrouse d’une noire et un refrain en notes longues.',
      en: 'The anthem of Brittany, set to the melody composed in 1856 by the Welshman James James for “Hen Wlad fy Nhadau”. The Breton words by Taldir Jaffrennou (1897) are not reproduced here: only the melody is published. In three, suggested tempo 80 to the quarter note, with a one-beat pickup and a chorus in long notes.',
    },
    // Notes from the public-domain LilyPond source on Mutopia (J. James, 1833–1902), moved from E flat to G major.
    abc: abc`X:1
T:Bro gozh ma zadoù
C:James James
M:3/4
L:1/8
Q:1/4=80
K:G
G2|B2A2G2|d2c2B2|g2g2ef|g4e2|d2B2G2|G2F2G2|B2A2A2|A4Bc|
d2d2Bc|d2d2ef|g2g2ef|g4e2|d2B2G2|AB3A2|G6|
d6|g6|d2B2G2|G2F2G2|A4Bc|d4Bc|d4ef|g4ef|g4e2|d2B2G2|AB3A2|G6|]`,
  },
]
