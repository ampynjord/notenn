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

export type InstrumentFamily = 'diatonic-accordion' | 'chromatic-accordion' | 'string' | 'whistle'

/**
 * A button keyboard: the diatonic accordion (push and pull give different notes) or the chromatic
 * accordion (the same note both ways: push = pull on every button, no bass groups for now).
 */
export interface InstrumentProfile {
  id: string
  name: string
  family: 'diatonic-accordion' | 'chromatic-accordion'
  rows: ButtonRow[]
  bassGroups: BassGroup[]
  /** True while the layout has not been checked against a real instrument. */
  preview?: boolean
}

/** A fretted string instrument (guitar, ukulele…). */
export interface StringProfile {
  id: string
  name: string
  family: 'string'
  /** Open strings as MIDI pitches, lowest (thickest) string first. */
  tuning: number[]
  /** Name of each string, in the same order as `tuning`. */
  stringNames: string[]
  frets: number
  preview?: boolean
}

/** One pitch of a whistle: the holes covered (1) or open (0), hole 1 nearest the mouth, and the octave. */
export interface WhistleFingering {
  pitch: number
  holes: string
  /** 1 = low octave, 2 = second octave (blown harder). */
  octave: 1 | 2
}

/** A six-hole whistle. */
export interface WhistleProfile {
  id: string
  name: string
  family: 'whistle'
  fingerings: WhistleFingering[]
  preview?: boolean
}

export type Instrument = InstrumentProfile | StringProfile | WhistleProfile

/** What the music staff and the playback need from any instrument's arrangement. */
export interface PlayedNote extends Note {
  /** Pitch before replacement, when the instrument cannot play it. */
  original: number
  approx: boolean
}

export interface StringPosition {
  /** 0 = lowest string. */
  string: number
  fret: number
}

export interface StringNote extends PlayedNote {
  position: StringPosition
}

export interface WhistleNote extends PlayedNote {
  holes: string
  octave: 1 | 2
}

/** The part of an arrangement shared by every instrument. */
export interface ArrangementBase<N extends PlayedNote> {
  notes: N[]
  meter: MeterInfo
  pickup: number
  fromBar: number
  toBar: number
  transpose: number
  approxCount: number
}

export type StringArrangement = ArrangementBase<StringNote>
export type WhistleArrangement = ArrangementBase<WhistleNote>

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
  /** 0 = melody (top voice), 1 = second voice below it, and so on. */
  voice: number
  /** True when the player chose this fingering by hand. */
  edited?: boolean
}

/** A fingering chosen by hand, without the computed vertical position. */
export type FingerChoice = Pick<Fingering, 'row' | 'button' | 'bellows'>

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
  /**
   * Right-hand voices to keep: 1 = melody only (default), 2 = melody plus the highest note played
   * with it, etc. Lower voices are only kept where they can be played in the melody's bellows direction.
   */
  voices?: number
  /**
   * Fingerings chosen by hand for melody notes, keyed by `noteKey(start)`. The rest of the tab adapts
   * around them; a choice that no longer plays the note (other key or keyboard) is ignored.
   */
  fingerings?: Record<string, FingerChoice>
}

export interface Arrangement {
  /** The melody (voice 0). */
  notes: PlacedNote[]
  /** Every voice, voice 0 first; `voices[0]` is `notes`. */
  voices: PlacedNote[][]
  /** Lower-voice notes left out because no fingering fits them with the melody. */
  droppedCount: number
  bass: BassEvent[]
  meter: MeterInfo
  pickup: number
  fromBar: number
  toBar: number
  transpose: number
  approxCount: number
  bellowsChanges: number
}
