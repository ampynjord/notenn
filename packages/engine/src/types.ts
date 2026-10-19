/** Times are in quarter notes (1 = one quarter note); pitches are MIDI numbers. */
export interface Note {
  start: number
  dur: number
  pitch: number
}

export interface Track {
  /** Name found in the file, '' when there is none (the interface then shows a translated fallback). */
  name: string
  /** General MIDI instrument name, when the file gives one. */
  instrument?: string
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
  /** Pickup (anacrusis) length in quarter notes, 0 if none. */
  pickup: number
  tempo: number
}

export type Bellows = 'push' | 'pull'

/** A right-hand button: its pitch on the push and on the pull. */
export interface ButtonPitches {
  push: number
  pull: number
}

export interface ButtonRow {
  id: string
  name: string
  /** Mark appended to the button number in the tab (e.g. "'" for the inner row). */
  suffix: string
  /** Vertical shift of the row relative to the first one, in buttons (used to measure hand movement). */
  offset: number
  /** Per-note cost, to discourage a less convenient row. */
  cost: number
  /** Button 1 = chin side. */
  buttons: ButtonPitches[]
}

/** A left-hand group: a bass button and its neighbouring chord, on push and pull (pitch classes 0-11). */
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
  /** Pitch before replacement, when the note did not exist on the keyboard. */
  original: number
  approx: boolean
  fingering: Fingering
}

export interface BassEvent {
  time: number
  group: number
  bellows: Bellows
  /** true = bass button (first beat), false = chord. */
  isBass: boolean
}

export interface MeterInfo {
  barLength: number
  beat: number
  beatsPerBar: number
}

export interface ArrangeOptions {
  trackIndex?: number
  /** Allowed rows; all the profile's rows by default. */
  rows?: string[]
  fromBar?: number
  toBar?: number
  /** Transposition in semitones, or 'auto'. */
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
