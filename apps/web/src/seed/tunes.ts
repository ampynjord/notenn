/**
 * Starter library: public-domain and traditional melodies, transcribed for Notenn in ABC.
 * Only the melody is written; the tab, fingering and basses are computed by the engine.
 */
export type Region = 'brittany' | 'scotland' | 'ireland' | 'england' | 'france' | 'germany' | 'usa' | 'international'
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
    notes: {
      fr: 'Le chant écossais du réveillon : les paroles sont du poète Robert Burns (1788), sur une mélodie traditionnelle, et on le chante dans le monde entier à minuit le 31 décembre. En Do majeur et à quatre temps, tempo indicatif 80 à la noire : un bon premier morceau.',
      en: 'The Scottish New Year song: the words are by the poet Robert Burns (1788), set to a traditional melody, and it is sung around the world at midnight on 31 December. In C major and in four, suggested tempo 80 to the quarter note: a good first tune.',
    },
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
    notes: {
      fr: 'Un des chants les plus connus du monde anglophone : les paroles sont du pasteur anglais John Newton (1779), et la mélodie « New Britain » circule aux États-Unis dès 1829. Air lent à trois temps en Sol majeur, tout en tirés et poussés longs : joue-le vers 80 à la noire et laisse respirer le soufflet.',
      en: 'One of the best-known hymns in the English-speaking world: the words are by the English clergyman John Newton (1779), and the melody “New Britain” was circulating in the United States by 1829. A slow tune in three in G major, built on long pushes and pulls: play it at about 80 to the quarter note and let the bellows breathe.',
    },
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
    notes: {
      fr: 'Air anglais du XVIe siècle : une ballade intitulée « Lady Greensleeves » est enregistrée à Londres dès 1580, et la mélodie a servi plus tard à des chants de Noël comme « What Child Is This ». Version modale ancienne en La mineur (sans sol dièse), à 6/8, tempo indicatif 50 à la noire pointée, jouable sur deux rangs.',
      en: 'An English tune of the 16th century: a ballad called “Lady Greene Sleeves” was entered at the Stationers’ Company in London in 1580, and the melody was later used for carols such as “What Child Is This”. The older modal version in A minor (no G sharp), in 6/8, suggested tempo 50 to the dotted quarter note, playable on two rows.',
    },
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
    notes: {
      fr: 'Ballade anglaise connue pour son refrain (« persil, sauge, romarin et thym ») ; Scarborough est une ville balnéaire du Yorkshire. En Ré dorien, à trois temps, à jouer lentement (90 à la noire environ) : le mode dorien est une gamme mineure à sixte majeure, d’où sa couleur particulière.',
      en: 'An English ballad known for its refrain (“parsley, sage, rosemary and thyme”); Scarborough is a seaside town in Yorkshire. In D Dorian, in three, to be played slowly (about 90 to the quarter note): the Dorian mode is a minor scale with a major sixth, which gives it its particular colour.',
    },
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
    notes: {
      fr: 'Chant de marins du XIXe siècle qui rythmait les manœuvres à bord. Mélodie en Ré dorien à quatre temps, répétitive et facile à retenir : joue-la de façon entraînante, autour de 110 à la noire.',
      en: 'A 19th-century sea shanty that kept time during work on board. A melody in D Dorian in four, repetitive and easy to remember: play it with drive, at around 110 to the quarter note.',
    },
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
    notes: {
      fr: 'Gigue irlandaise très jouée en session, nommée d’après le violoneux James Morrison. En Mi dorien et à 6/8 (deux temps de trois croches), tempo indicatif 100 à la noire pointée : le doigté est exigeant, commence au ralenti.',
      en: 'An Irish jig played at sessions everywhere, named after the fiddler James Morrison. In E Dorian and in 6/8 (two beats of three eighth notes), suggested tempo 100 to the dotted quarter note: the fingering is demanding, so start slowly.',
    },
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
    notes: {
      fr: 'Reel irlandais célèbre, joué dans toutes les sessions. En Mi dorien et à quatre temps, tempo indicatif 110 à la noire : il est rapide, alors commence au ralenti et accélère quand les changements de sens du soufflet sont sûrs.',
      en: 'A famous Irish reel, played at sessions everywhere. In E Dorian and in four, suggested tempo 110 to the quarter note: it is fast, so start slowly and speed up once the bellows changes are secure.',
    },
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
    notes: {
      fr: 'Gigue irlandaise en Sol majeur, une des premières qu’on apprend en musique irlandaise. À 6/8 (deux temps de trois croches), tempo indicatif 100 à la noire pointée : idéale pour prendre le rythme de la gigue avant d’attaquer les airs plus rapides.',
      en: 'An Irish jig in G major, one of the first tunes learnt in Irish music. In 6/8 (two beats of three eighth notes), suggested tempo 100 to the dotted quarter note: ideal for getting the lilt of a jig before moving on to faster tunes.',
    },
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
    notes: {
      fr: 'Gigue en Mi mineur très jouée en session. À 6/8, tempo indicatif 100 à la noire pointée : joue-la d’abord lentement pour fixer les changements de sens du soufflet, puis monte vers le tempo.',
      en: 'A jig in E minor played at sessions everywhere. In 6/8, suggested tempo 100 to the dotted quarter note: play it slowly first to fix the bellows changes, then work up to speed.',
    },
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
    notes: {
      fr: 'Slip jig irlandaise : une gigue à neuf croches par mesure (9/8), en trois groupes de trois, au balancement aérien. En Mi mineur, tempo indicatif 90 à la noire pointée ; réservée aux joueurs confirmés, commence très lentement.',
      en: 'An Irish slip jig: a jig with nine eighth notes to the bar (9/8), in three groups of three, with an airy sway. In E minor, suggested tempo 90 to the dotted quarter note; for experienced players, so start very slowly.',
    },
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
    notes: {
      fr: 'Chanson enfantine française, anonyme et connue depuis le XVIIIe siècle (on l’a longtemps attribuée à tort à Lully). En Do majeur et à quatre temps, tempo indicatif 100 à la noire, avec des notes répétées et conjointes : le premier air que beaucoup d’enfants jouent.',
      en: 'A French nursery song, anonymous and known since the 18th century (it was long attributed, wrongly, to Lully). In C major and in four, suggested tempo 100 to the quarter note, built on repeated and stepwise notes: the first tune many children play.',
    },
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
    notes: {
      fr: 'Chanson enfantine française connue depuis le XVIIIe siècle, que l’on chante souvent en canon à plusieurs voix. En Do majeur et à quatre temps, tempo indicatif 100 à la noire : chaque phrase est jouée deux fois, ce qui la rend facile à mémoriser.',
      en: 'A French nursery song known since the 18th century, often sung as a round in several voices. In C major and in four, suggested tempo 100 to the quarter note: each phrase is played twice, which makes it easy to remember.',
    },
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
    notes: {
      fr: 'Mélodie française publiée en 1761 sous le titre « La Confidence naïve », que Mozart a reprise dans ses douze variations (vers 1781) ; c’est aussi l’air de « Twinkle, Twinkle, Little Star » et de la chanson de l’alphabet en anglais. En Do majeur, tempo indicatif 100 à la noire.',
      en: 'A French melody published in 1761 as “La Confidence naïve”, which Mozart took up in his twelve variations (around 1781); it is also the tune of “Twinkle, Twinkle, Little Star” and of the English alphabet song. In C major, suggested tempo 100 to the quarter note.',
    },
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
    notes: {
      fr: 'Thème du finale de la 9e symphonie de Beethoven (1824), sur un poème de Schiller, devenu l’hymne de l’Europe. Mélodie en Do majeur, presque entièrement conjointe, à quatre temps (100 à la noire) : une bonne façon de travailler la régularité du soufflet.',
      en: 'The theme of the finale of Beethoven’s 9th Symphony (1824), on a poem by Schiller, later adopted as the anthem of Europe. A melody in C major that moves almost entirely by step, in four (100 to the quarter note): a good way to practise an even bellows.',
    },
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
    notes: {
      fr: 'Composée par James Lord Pierpont et publiée à Boston en 1857 sous le titre « One Horse Open Sleigh », elle est devenue un chant de Noël connu dans le monde entier. En Do majeur et à quatre temps, tempo indicatif 120 à la noire, avec un refrain en notes répétées que tout le monde connaît.',
      en: 'Composed by James Lord Pierpont and published in Boston in 1857 as “One Horse Open Sleigh”, it became a Christmas song known around the world. In C major and in four, suggested tempo 120 to the quarter note, with a chorus built on repeated notes that everyone knows.',
    },
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
    notes: {
      fr: 'Chanson de Stephen Foster (1848), l’un des premiers grands succès de la chanson américaine, reprise par les chercheurs d’or de la ruée vers l’Ouest. En Do majeur, tempo indicatif 110 à la noire, sur un rythme sautillant qu’il faut garder léger.',
      en: 'A song by Stephen Foster (1848), one of the first great American hits, taken up by the gold-seekers of the westward rush. In C major, suggested tempo 110 to the quarter note, with a bouncy rhythm that should stay light.',
    },
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
    notes: {
      fr: 'Spiritual afro-américain devenu un standard du jazz de La Nouvelle-Orléans, popularisé par Louis Armstrong (enregistrement de 1938). En Do majeur et à quatre temps, tempo indicatif 120 à la noire : une mélodie simple et rythmée, facile à faire swinguer.',
      en: 'An African-American spiritual that became a New Orleans jazz standard, popularised by Louis Armstrong (1938 recording). In C major and in four, suggested tempo 120 to the quarter note: a simple, rhythmic melody that is easy to swing.',
    },
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
    notes: {
      fr: 'Wiegenlied op. 49 n° 4, que Johannes Brahms publie en 1868 : la berceuse la plus connue du répertoire classique. Ici en Do majeur et à trois temps, tempo indicatif 80 à la noire : joue-la très doucement, en liant les notes.',
      en: 'Wiegenlied, Op. 49 No. 4, published by Johannes Brahms in 1868: the best-known lullaby of the classical repertoire. Here in C major and in three, suggested tempo 80 to the quarter note: play it very softly, joining the notes.',
    },
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
    notes: {
      fr: 'Sa mélodie vient de « Good Morning to All » (1893), écrite par les sœurs américaines Mildred et Patty Hill pour des classes de maternelle ; les paroles d’anniversaire sont venues plus tard. En Do majeur et à trois temps, tempo indicatif 100 à la noire.',
      en: 'Its melody comes from “Good Morning to All” (1893), written by the American sisters Mildred and Patty Hill for kindergarten classes; the birthday words came later. In C major and in three, suggested tempo 100 to the quarter note.',
    },
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
    notes: {
      fr: 'Spiritual afro-américain recueilli en 1867 dans « Slave Songs of the United States », auprès d’anciens esclaves des îles de la côte sud-est des États-Unis, puis repris par le renouveau folk des années 1960. En Do majeur et à quatre temps, tempo indicatif 100 à la noire : un air lent et régulier, idéal pour travailler le soufflet.',
      en: 'An African-American spiritual collected in 1867 in “Slave Songs of the United States” from formerly enslaved people on the islands off the south-eastern coast of the United States, and taken up again by the folk revival of the 1960s. In C major and in four, suggested tempo 100 to the quarter note: a slow, steady tune, ideal for working on the bellows.',
    },
    abc: abc`X:1
T:Michael, Row the Boat Ashore
M:4/4
L:1/8
Q:1/4=100
K:C
C2E2 G3E|G2A2 G4|E2G2 A4|G8|E2G2 G3E|F2E2 D4|C2D2 E3D|C8|]`,
  },
]
