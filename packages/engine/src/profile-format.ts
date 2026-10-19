import type { BassGroup, ButtonRow, InstrumentProfile } from './types'

/**
 * JSON format of instrument profiles (version 1), readable and editable by hand:
 * pitches use English names with an octave ("C4" = middle C = MIDI 60),
 * left-hand chords use their name ("C", "Am", "D7") or the list of their notes.
 * Full description (in French): docs/format-profil-instrument.md
 */
export interface ProfileJson {
  format: 'notenn-instrument'
  version: 1
  id: string
  name: string
  family: 'diatonic-accordion'
  source?: string
  rows: {
    id: string
    name: string
    suffix?: string
    offset?: number
    cost?: number
    /** One button = [push, pull], button 1 on the chin side. */
    buttons: [string, string][]
  }[]
  bass?: {
    id: number
    push: { bass: string; chord: string | string[] }
    pull: { bass: string; chord: string | string[] }
  }[]
}

export type ProfileErrorCode =
  | 'invalid-json'
  | 'object-expected'
  | 'bad-format'
  | 'unknown-version'
  | 'text-required'
  | 'text-expected'
  | 'number-expected'
  | 'list-expected'
  | 'unsupported-family'
  | 'no-rows'
  | 'no-buttons'
  | 'duplicate-id'
  | 'pair-expected'
  | 'bad-push-note'
  | 'bad-pull-note'
  | 'bad-group-id'
  | 'bad-bass-note'
  | 'bad-chord'

/**
 * Invalid profile. `path` points at the faulty field (e.g. "rows[1].buttons[3]"), `code` and `params`
 * let the interface show a translated message; `message` is an English fallback.
 */
export class ProfileError extends Error {
  constructor(
    readonly path: string,
    readonly code: ProfileErrorCode,
    readonly params: Record<string, string | number> = {},
    detail: string = code,
  ) {
    super(`${path}: ${detail}`)
    this.name = 'ProfileError'
  }
}

const LETTER: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** Pitch class of a note name without octave: "F#" → 6, "Bb" → 10. */
export function pitchClassOf(name: string): number | null {
  const m = /^([A-G])([#b]?)$/.exec(name.trim())
  if (!m) return null
  return (LETTER[m[1]!]! + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12
}

/** MIDI pitch of a note name with octave: "C4" → 60, "F#5" → 78. */
export function midiOf(name: string): number | null {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(name.trim())
  if (!m) return null
  const pc = pitchClassOf(m[1]!)
  if (pc === null) return null
  // A sharp or flat can cross the octave boundary (B#3 = C4, Cb4 = B3), so start from the letter.
  const letter = LETTER[m[1]![0]!]!
  const alter = m[1]!.length > 1 ? (m[1]![1] === '#' ? 1 : -1) : 0
  return (Number(m[2]) + 1) * 12 + letter + alter
}

const CHORD_SHAPES: Record<string, number[]> = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10] }

/** Chord from its name ("C", "Am", "D7", "Em7") or its notes (["C","E","G"]). */
export function chordOf(chord: string | string[]): number[] | null {
  if (Array.isArray(chord)) {
    const pcs = chord.map((n: unknown) => (typeof n === 'string' ? pitchClassOf(n) : null))
    return pcs.length && pcs.every((p) => p !== null) ? (pcs as number[]) : null
  }
  const m = /^([A-G][#b]?)(m7|m|7|)$/.exec(chord.trim())
  if (!m) return null
  const root = pitchClassOf(m[1]!)
  return root === null ? null : CHORD_SHAPES[m[2]!]!.map((i) => (root + i) % 12)
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

/** Reads and validates a JSON profile; throws a ProfileError saying exactly where the problem is. */
export function parseProfile(input: unknown): InstrumentProfile {
  let d: unknown = input
  if (typeof input === 'string') {
    try {
      d = JSON.parse(input)
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e)
      throw new ProfileError('profile', 'invalid-json', { reason }, `invalid JSON (${reason})`)
    }
  }
  if (!isObject(d)) throw new ProfileError('profile', 'object-expected', {}, 'a JSON object is expected')
  if (d.format !== 'notenn-instrument') throw new ProfileError('format', 'bad-format', {}, 'must be "notenn-instrument"')
  if (d.version !== 1)
    throw new ProfileError('version', 'unknown-version', { version: String(d.version) }, `unknown version ${String(d.version)} (only version 1 exists)`)
  for (const k of ['id', 'name'] as const)
    if (typeof d[k] !== 'string' || !d[k]) throw new ProfileError(k, 'text-required', {}, 'text required')
  if (d.family !== 'diatonic-accordion')
    throw new ProfileError('family', 'unsupported-family', { family: String(d.family) }, `family "${String(d.family)}" is not supported yet (only "diatonic-accordion")`)
  if (!Array.isArray(d.rows) || !d.rows.length) throw new ProfileError('rows', 'no-rows', {}, 'at least one row is expected')

  const rowIds = new Set<string>()
  const rows: ButtonRow[] = d.rows.map((r: unknown, ri: number) => {
    const at = `rows[${ri}]`
    if (!isObject(r)) throw new ProfileError(at, 'object-expected', {}, 'an object is expected')
    if (typeof r.id !== 'string' || !r.id) throw new ProfileError(`${at}.id`, 'text-required', {}, 'text required')
    if (rowIds.has(r.id)) throw new ProfileError(`${at}.id`, 'duplicate-id', { id: r.id }, `id "${r.id}" is already used`)
    rowIds.add(r.id)
    if (typeof r.name !== 'string') throw new ProfileError(`${at}.name`, 'text-required', {}, 'text required')
    for (const k of ['offset', 'cost'] as const)
      if (r[k] !== undefined && (typeof r[k] !== 'number' || !Number.isFinite(r[k])))
        throw new ProfileError(`${at}.${k}`, 'number-expected', {}, 'a number is expected')
    if (r.suffix !== undefined && typeof r.suffix !== 'string') throw new ProfileError(`${at}.suffix`, 'text-expected', {}, 'text expected')
    if (!Array.isArray(r.buttons) || !r.buttons.length) throw new ProfileError(`${at}.buttons`, 'no-buttons', {}, 'at least one button is expected')
    const buttons = r.buttons.map((b: unknown, bi: number) => {
      const bat = `${at}.buttons[${bi}]`
      const button = bi + 1
      if (!Array.isArray(b) || b.length !== 2) throw new ProfileError(bat, 'pair-expected', { button }, `button ${button}: a [push, pull] pair is expected`)
      const [push, pull] = b.map((n) => (typeof n === 'string' ? midiOf(n) : null))
      if (push == null)
        throw new ProfileError(bat, 'bad-push-note', { button, value: JSON.stringify(b[0]) }, `button ${button}: unreadable push note ${JSON.stringify(b[0])} (valid examples: "C4", "F#5")`)
      if (pull == null)
        throw new ProfileError(bat, 'bad-pull-note', { button, value: JSON.stringify(b[1]) }, `button ${button}: unreadable pull note ${JSON.stringify(b[1])} (valid examples: "C4", "F#5")`)
      return { push, pull }
    })
    return {
      id: r.id,
      name: r.name,
      suffix: (r.suffix as string | undefined) ?? '',
      offset: (r.offset as number | undefined) ?? 0,
      cost: (r.cost as number | undefined) ?? 0,
      buttons,
    }
  })

  const bassIn = d.bass ?? []
  if (!Array.isArray(bassIn)) throw new ProfileError('bass', 'list-expected', {}, 'a list is expected')
  const bassIds = new Set<number>()
  const bassGroups: BassGroup[] = bassIn.map((g: unknown, gi: number) => {
    const at = `bass[${gi}]`
    if (!isObject(g)) throw new ProfileError(at, 'object-expected', {}, 'an object is expected')
    if (typeof g.id !== 'number' || !Number.isInteger(g.id) || g.id < 1)
      throw new ProfileError(`${at}.id`, 'bad-group-id', {}, 'a positive integer is expected (the number shown in the tab)')
    if (bassIds.has(g.id)) throw new ProfileError(`${at}.id`, 'duplicate-id', { id: g.id }, `number ${g.id} is already used`)
    bassIds.add(g.id)
    const side = (k: 'push' | 'pull') => {
      const s = g[k]
      if (!isObject(s)) throw new ProfileError(`${at}.${k}`, 'object-expected', {}, 'a { bass, chord } object is expected')
      const bass = typeof s.bass === 'string' ? pitchClassOf(s.bass) : null
      if (bass === null)
        throw new ProfileError(`${at}.${k}.bass`, 'bad-bass-note', { value: JSON.stringify(s.bass) }, `unreadable note ${JSON.stringify(s.bass)} (valid examples: "C", "F#")`)
      const chord = typeof s.chord === 'string' || Array.isArray(s.chord) ? chordOf(s.chord as string | string[]) : null
      if (chord === null)
        throw new ProfileError(`${at}.${k}.chord`, 'bad-chord', { value: JSON.stringify(s.chord) }, `unreadable chord ${JSON.stringify(s.chord)} (valid examples: "C", "Am", "D7", ["C","E","G"])`)
      return { bass, chord }
    }
    return { id: g.id, push: side('push'), pull: side('pull') }
  })

  return { id: d.id as string, name: d.name as string, family: 'diatonic-accordion', rows, bassGroups }
}
