/**
 * Starter library: public-domain and traditional melodies, transcribed for Notenn in ABC.
 * Only the melody is written; the tab, fingering and basses are computed by the engine.
 */
export type Region = 'scotland' | 'ireland' | 'england' | 'france' | 'germany' | 'usa' | 'international'
export type Kind = 'air' | 'song' | 'childrens-song' | 'jig' | 'slip-jig' | 'reel' | 'shanty' | 'waltz' | 'lullaby' | 'spiritual' | 'classical'
export type Level = 'beginner' | 'intermediate' | 'advanced'

export interface SeedTune {
  slug: string
  title: string
  region: Region
  kind: Kind
  level: Level
  /** Composer and date, or "Traditional". */
  origin: string
  notes: { fr: string; en: string }
  abc: string
}

const abc = (lines: TemplateStringsArray) => lines[0]!.trim()

export const SEED_TUNES: SeedTune[] = [
  {
    slug: 'auld-lang-syne',
    title: 'Auld Lang Syne',
    region: 'scotland',
    kind: 'song',
    level: 'beginner',
    origin: 'Traditional',
    notes: { fr: 'Le chant écossais du réveillon, idéal pour un premier morceau.', en: 'The Scottish New Year song, a good first tune.' },
    abc: abc`X:1
T:Auld Lang Syne
M:4/4
L:1/8
Q:1/4=80
K:C
G2|c3c c2e2|d3c d2ed|c3c e2g2|a6a2|g3e e2c2|d3c d2e2|c3A A2G2|c6a2|
g3e e2c2|d3c d2a2|g3e e2g2|a6c'2|g3e e2c2|d3c d2e2|c3A A2G2|c6|]`,
  },
  {
    slug: 'amazing-grace',
    title: 'Amazing Grace',
    region: 'usa',
    kind: 'spiritual',
    level: 'beginner',
    origin: 'Traditional (New Britain, 1829)',
    notes: { fr: 'Air lent à trois temps, tout en tirés et poussés longs.', en: 'A slow tune in three, with long pushes and pulls.' },
    abc: abc`X:1
T:Amazing Grace
M:3/4
L:1/8
Q:1/4=80
K:G
D2|G4 BG|B4 A2|G4 E2|D4 D2|G4 BG|B4 A2|d6-|d4 Bd|
d4 BG|B4 AG|E4 D2|D4 D2|G4 BG|B4 A2|G6-|G4|]`,
  },
  {
    slug: 'greensleeves',
    title: 'Greensleeves',
    region: 'england',
    kind: 'air',
    level: 'intermediate',
    origin: 'Traditional (16th century)',
    notes: { fr: 'Air anglais en La mineur, dans sa version modale ancienne (sans sol dièse), jouable sur deux rangs.', en: 'English tune in A minor, in its older modal form (no G sharp), playable on two rows.' },
    abc: abc`X:1
T:Greensleeves
M:6/8
L:1/8
Q:3/8=50
K:Am
A|c2d e>fe|d2B G>AB|c2A A>GA|B2G E2A|c2d e>fe|d2B G>AB|c>BA G>FG|A3 A2:|
|:g|g2g g>fe|d2B G>AB|c2A A>GA|B2G E2E|g2g g>fe|d2B G>AB|c>BA G>FG|A3 A2:|`,
  },
  {
    slug: 'scarborough-fair',
    title: 'Scarborough Fair',
    region: 'england',
    kind: 'song',
    level: 'intermediate',
    origin: 'Traditional',
    notes: { fr: 'Ballade anglaise en mode dorien, à jouer lentement.', en: 'English ballad in the Dorian mode, to play slowly.' },
    abc: abc`X:1
T:Scarborough Fair
M:3/4
L:1/8
Q:1/4=90
K:Ddor
D4 D2|A4 A2|E3 F E2|D6|A4 c2|d4 c2|A2 B2 G2|A6|
d4 d2|d4 c2|A4 A2|G2 F2 E2|D2 C4|D4 A2|G2 F2 E2|D6|]`,
  },
  {
    slug: 'drunken-sailor',
    title: 'What Shall We Do with the Drunken Sailor',
    region: 'international',
    kind: 'shanty',
    level: 'beginner',
    origin: 'Traditional sea shanty',
    notes: { fr: 'Chant de marins entraînant, en mode dorien.', en: 'A lively sea shanty in the Dorian mode.' },
    abc: abc`X:1
T:What Shall We Do with the Drunken Sailor
M:4/4
L:1/8
Q:1/4=110
K:Ddor
A2AA A2AA|A2D2 F2A2|G2GG G2GG|G2C2 E2G2|A2AA A2AA|A2B2 c2d2|c2A2 G2E2|D4 D4|
A4 A4|A2D2 F2A2|G4 G4|G2C2 E2G2|A4 A4|A2B2 c2d2|c2A2 G2E2|D4 D4|]`,
  },
  {
    slug: 'morrisons-jig',
    title: "Morrison's Jig",
    region: 'ireland',
    kind: 'jig',
    level: 'advanced',
    origin: 'Traditional',
    notes: { fr: 'Gigue irlandaise très jouée en session.', en: 'An Irish jig played at every session.' },
    abc: abc`X:1
T:Morrison's Jig
M:6/8
L:1/8
Q:3/8=100
K:Edor
|:E3 B3|EBE AFD|EDE B3|dcB AFD|E3 B3|EBE AFD|G3 FGA|dAG FED:|
|:Bee fee|aee fee|Bee fee|a2g fed|Bee fee|aee fee|gfe d2A|BAG FED:|`,
  },
  {
    slug: 'drowsy-maggie',
    title: 'Drowsy Maggie',
    region: 'ireland',
    kind: 'reel',
    level: 'advanced',
    origin: 'Traditional',
    notes: { fr: 'Reel irlandais rapide : commence au ralenti.', en: 'A fast Irish reel: start slowed down.' },
    abc: abc`X:1
T:Drowsy Maggie
M:4/4
L:1/8
Q:1/4=110
K:Edor
|:E2BE dEBE|E2BE AFDF|E2BE dEBE|BABc dAFD:|
|:d2fd c2ec|defg afge|d2fd c2ec|BABc dAFA|d2fd c2ec|defg afge|afge fdec|BABc dAFD:|`,
  },
  {
    slug: 'the-kesh',
    title: 'The Kesh',
    region: 'ireland',
    kind: 'jig',
    level: 'intermediate',
    origin: 'Traditional',
    notes: { fr: 'Gigue en Sol, une des premières qu’on apprend en musique irlandaise.', en: 'A jig in G, one of the first tunes learnt in Irish music.' },
    abc: abc`X:1
T:The Kesh
M:6/8
L:1/8
Q:3/8=100
K:G
|:G3 GAB|A3 ABd|edd gdd|edB dBA|G3 GAB|A3 ABd|edd gdB|AGF G3:|
|:BAB d2d|ege dBA|BAB dBG|ABA AGA|BAB d2d|ege dBd|gfg aga|bgf g3:|`,
  },
  {
    slug: 'swallowtail-jig',
    title: 'Swallowtail Jig',
    region: 'ireland',
    kind: 'jig',
    level: 'intermediate',
    origin: 'Traditional',
    notes: { fr: 'Gigue en Mi mineur aux phrases répétées, bonne pour travailler le soufflet.', en: 'A jig in E minor with repeated phrases, good bellows practice.' },
    abc: abc`X:1
T:Swallowtail Jig
M:6/8
L:1/8
Q:3/8=100
K:Em
|:GEE BEE|GEE BAG|FDD ADD|dcd AGF|GEE BEE|GEE B2c|dcd AGF|GEE E3:|
|:Bcd e2f|e2f edB|Bcd e2f|edB d3|Bcd e2f|e2f edB|dcd AGF|GEE E3:|`,
  },
  {
    slug: 'the-butterfly',
    title: 'The Butterfly',
    region: 'ireland',
    kind: 'slip-jig',
    level: 'advanced',
    origin: 'Traditional',
    notes: { fr: 'Slip jig à neuf croches par mesure.', en: 'A slip jig, nine eighth notes to the bar.' },
    abc: abc`X:1
T:The Butterfly
M:9/8
L:1/8
Q:3/8=90
K:Em
|:B2E G2E F3|B2E G2E FED|B2E G2E F3|B2d d2B AFD:|
|:B2d e2f g3|B2d g2e dBA|B2d e2f g2a|b2a g2e dBA:|`,
  },
  {
    slug: 'au-clair-de-la-lune',
    title: 'Au clair de la lune',
    region: 'france',
    kind: 'childrens-song',
    level: 'beginner',
    origin: 'Traditional',
    notes: { fr: 'Comptine française, en notes égales : parfait pour débuter.', en: 'French nursery song in even notes: perfect to begin.' },
    abc: abc`X:1
T:Au clair de la lune
M:4/4
L:1/4
Q:1/4=100
K:C
CCCD|E2D2|CEDD|C4|CCCD|E2D2|CEDD|C4|
DDDD|A,2A,2|DCB,A,|G,4|CCCD|E2D2|CEDD|C4|]`,
  },
  {
    slug: 'frere-jacques',
    title: 'Frère Jacques',
    region: 'france',
    kind: 'childrens-song',
    level: 'beginner',
    origin: 'Traditional',
    notes: { fr: 'Le canon que tout le monde connaît.', en: 'The round everybody knows.' },
    abc: abc`X:1
T:Frère Jacques
M:4/4
L:1/8
Q:1/4=100
K:C
C2D2 E2C2|C2D2 E2C2|E2F2 G4|E2F2 G4|GAGF E2C2|GAGF E2C2|C2G,2 C4|C2G,2 C4|]`,
  },
  {
    slug: 'ah-vous-dirai-je-maman',
    title: 'Ah ! vous dirai-je, maman',
    region: 'france',
    kind: 'childrens-song',
    level: 'beginner',
    origin: 'Traditional (18th century)',
    notes: { fr: 'L’air de « Twinkle Twinkle Little Star », popularisé par les variations de Mozart.', en: 'The tune of "Twinkle Twinkle Little Star", made famous by Mozart’s variations.' },
    abc: abc`X:1
T:Ah ! vous dirai-je, maman
M:4/4
L:1/4
Q:1/4=100
K:C
CCGG|AAG2|FFEE|DDC2|GGFF|EED2|GGFF|EED2|CCGG|AAG2|FFEE|DDC2|]`,
  },
  {
    slug: 'ode-to-joy',
    title: 'Ode à la joie',
    region: 'germany',
    kind: 'classical',
    level: 'beginner',
    origin: 'Ludwig van Beethoven, 1824',
    notes: { fr: 'Le thème de la 9e symphonie, presque tout en notes conjointes.', en: 'The theme of the Ninth Symphony, almost all stepwise.' },
    abc: abc`X:1
T:Ode à la joie
M:4/4
L:1/4
Q:1/4=100
K:C
EEFG|GFED|CCDE|E3/2D/D2|EEFG|GFED|CCDE|D3/2C/C2|
DDEC|DE/F/EC|DE/F/ED|CDG,2|EEFG|GFED|CCDE|D3/2C/C2|]`,
  },
  {
    slug: 'jingle-bells',
    title: 'Jingle Bells',
    region: 'usa',
    kind: 'song',
    level: 'beginner',
    origin: 'James Lord Pierpont, 1857',
    notes: { fr: 'Le refrain, pour les fêtes.', en: 'The chorus, for the holidays.' },
    abc: abc`X:1
T:Jingle Bells
M:4/4
L:1/4
Q:1/4=120
K:C
EEE2|EEE2|EGCD|E4|FFFF|FEEE/E/|EDDE|D2G2|
EEE2|EEE2|EGCD|E4|FFFF|FEEE/E/|GGFD|C4|]`,
  },
  {
    slug: 'oh-susanna',
    title: 'Oh! Susanna',
    region: 'usa',
    kind: 'song',
    level: 'intermediate',
    origin: 'Stephen Foster, 1848',
    notes: { fr: 'Chanson américaine joyeuse, couplet et refrain.', en: 'A cheerful American song, verse and chorus.' },
    abc: abc`X:1
T:Oh! Susanna
M:4/4
L:1/8
Q:1/4=110
K:C
CD|E2G2 G2A2|G2E2 C3D|E2E2 D2C2|D6 CD|E2G2 G3A|G2E2 C3D|E2E2 D2D2|C6 z2|
F4 F4|A2A4 A2|G2G2 E2C2|D6 CD|E2G2 G3A|G2E2 C3D|E2E2 D2D2|C6|]`,
  },
  {
    slug: 'when-the-saints',
    title: 'When the Saints Go Marching In',
    region: 'usa',
    kind: 'spiritual',
    level: 'beginner',
    origin: 'Traditional',
    notes: { fr: 'Spiritual devenu standard de fanfare.', en: 'A spiritual turned brass-band standard.' },
    abc: abc`X:1
T:When the Saints Go Marching In
M:4/4
L:1/4
Q:1/4=120
K:C
zCEF|G4|zCEF|G4|zCEF|G2E2|C2E2|D4|
zEED|C3C|E2G2|GF3|zEFG|E2C2|D2D2|C4|]`,
  },
  {
    slug: 'brahms-lullaby',
    title: 'Berceuse de Brahms',
    region: 'germany',
    kind: 'lullaby',
    level: 'intermediate',
    origin: 'Johannes Brahms, 1868',
    notes: { fr: 'La berceuse « Guten Abend, gut’ Nacht », tout en douceur.', en: 'The lullaby "Guten Abend, gut’ Nacht", soft and slow.' },
    abc: abc`X:1
T:Berceuse de Brahms
M:3/4
L:1/8
Q:1/4=80
K:C
EE|G4 EE|G4 EG|c2 B3 A|A2 G2 DE|F2 D2 DE|F4 DF|BA G2 B2|c4 CC|
c4 AF|G4 EC|F2 G2 A2|G4 CC|c4 AF|G4 EC|FE D2 E2|C4|]`,
  },
  {
    slug: 'happy-birthday',
    title: 'Joyeux anniversaire',
    region: 'usa',
    kind: 'song',
    level: 'beginner',
    origin: 'Mildred and Patty Hill, 1893',
    notes: { fr: '« Happy Birthday », pour les anniversaires.', en: '"Happy Birthday", for birthdays.' },
    abc: abc`X:1
T:Joyeux anniversaire
M:3/4
L:1/8
Q:1/4=100
K:C
G>G|A2 G2 c2|B4 G>G|A2 G2 d2|c4 G>G|g2 e2 c2|B2 A2 f>f|e2 c2 d2|c4|]`,
  },
  {
    slug: 'michael-row-the-boat',
    title: 'Michael, Row the Boat Ashore',
    region: 'usa',
    kind: 'spiritual',
    level: 'beginner',
    origin: 'Traditional',
    notes: { fr: 'Chant spirituel tout simple, à chanter en jouant.', en: 'A very simple spiritual, to sing while you play.' },
    abc: abc`X:1
T:Michael, Row the Boat Ashore
M:4/4
L:1/8
Q:1/4=100
K:C
C2E2 G3E|G2A2 G4|E2G2 A4|G8|E2G2 G3E|F2E2 D4|C2D2 E3D|C8|]`,
  },
]
