/** Temps exprimés en noires (1 = une noire) ; hauteurs en numéros MIDI. */
export interface Note {
  start: number
  dur: number
  pitch: number
}

export interface Track {
  name: string
  notes: Note[]
}

export interface Meter {
  num: number
  den: number
}

export interface Song {
  title: string
  tracks: Track[]
  meter: Meter
  /** Durée de l'anacrouse, en noires (0 s'il n'y en a pas). */
  pickup: number
  tempo: number
}

export type Bellows = 'P' | 'T'

/** Un bouton de main droite : la note en poussé et la note en tiré. */
export interface ButtonPitches {
  push: number
  pull: number
}

export interface ButtonRow {
  id: string
  name: string
  /** Signe ajouté au numéro dans la tablature (ex. "'" pour le rang intérieur). */
  suffix: string
  /** Décalage vertical du rang par rapport au premier, en boutons (sert à mesurer les déplacements). */
  offset: number
  /** Coût par note pour décourager un rang moins pratique. */
  cost: number
  /** Bouton 1 = côté menton. */
  buttons: ButtonPitches[]
}

/** Un groupe de main gauche : un bouton de basse et l'accord voisin, en poussé et en tiré (classes de hauteur 0-11). */
export interface BassGroup {
  id: number
  push: { bass: number; chord: number[] }
  pull: { bass: number; chord: number[] }
}

export interface InstrumentProfile {
  id: string
  name: string
  family: 'diatonic-accordion'
  rows: ButtonRow[]
  bassGroups: BassGroup[]
}

export interface Fingering {
  row: string
  button: number
  bellows: Bellows
  y: number
}

export interface PlacedNote extends Note {
  /** Hauteur avant remplacement, si la note n'existait pas sur le clavier. */
  original: number
  approx: boolean
  fingering: Fingering
}

export interface BassEvent {
  time: number
  group: number
  bellows: Bellows
  /** true = bouton de basse (1er temps), false = accord. */
  isBass: boolean
}

export interface MeterInfo {
  barLength: number
  beat: number
  beatsPerBar: number
}

export interface ArrangeOptions {
  trackIndex?: number
  /** Lignes autorisées ; par défaut toutes celles du profil. */
  rows?: string[]
  fromBar?: number
  toBar?: number
  /** Transposition en demi-tons, ou 'auto'. */
  transpose?: number | 'auto'
  bass?: boolean
}

export interface Arrangement {
  notes: PlacedNote[]
  bass: BassEvent[]
  meter: MeterInfo
  pickup: number
  fromBar: number
  toBar: number
  transpose: number
  approxCount: number
  bellowsChanges: number
}
