import type { BassGroup, ButtonRow, InstrumentProfile } from './types'

/**
 * Format JSON des profils d'instruments (version 1), lisible et modifiable à la main :
 * les hauteurs s'écrivent en notation anglaise avec octave (« C4 » = Do central = MIDI 60),
 * les accords de main gauche par leur nom (« C », « Am », « D7 ») ou par la liste de leurs notes.
 * Description complète : docs/format-profil-instrument.md
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
    /** Un bouton = [poussé, tiré], bouton 1 côté menton. */
    buttons: [string, string][]
  }[]
  bass?: {
    id: number
    push: { bass: string; chord: string | string[] }
    pull: { bass: string; chord: string | string[] }
  }[]
}

export class ProfileError extends Error {
  constructor(where: string, message: string) {
    super(`${where} : ${message}`)
    this.name = 'ProfileError'
  }
}

const LETTER: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** Classe de hauteur d'un nom de note sans octave : « F# » → 6, « Bb » → 10. */
export function pitchClassOf(name: string): number | null {
  const m = /^([A-G])([#b]?)$/.exec(name.trim())
  if (!m) return null
  return (LETTER[m[1]!]! + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12
}

/** Hauteur MIDI d'un nom de note avec octave : « C4 » → 60, « F#5 » → 78. */
export function midiOf(name: string): number | null {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(name.trim())
  if (!m) return null
  const pc = pitchClassOf(m[1]!)
  if (pc === null) return null
  // Le dièse/bémol peut faire changer d'octave (B#3 = C4, Cb4 = B3) : on part de la lettre.
  const letter = LETTER[m[1]![0]!]!
  const alter = m[1]!.length > 1 ? (m[1]![1] === '#' ? 1 : -1) : 0
  return (Number(m[2]) + 1) * 12 + letter + alter
}

const CHORD_SHAPES: Record<string, number[]> = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10] }

/** Accord par son nom (« C », « Am », « D7 », « Em7 ») ou par ses notes (« ["C","E","G"] »). */
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

/** Lit et vérifie un profil JSON ; lève une ProfileError en français qui dit où est le problème. */
export function parseProfile(input: unknown): InstrumentProfile {
  let d: unknown = input
  if (typeof input === 'string') {
    try {
      d = JSON.parse(input)
    } catch (e) {
      throw new ProfileError('profil', `JSON mal formé (${e instanceof Error ? e.message : String(e)})`)
    }
  }
  if (!isObject(d)) throw new ProfileError('profil', 'un objet JSON est attendu')
  if (d.format !== 'notenn-instrument') throw new ProfileError('format', 'doit valoir "notenn-instrument"')
  if (d.version !== 1) throw new ProfileError('version', `version ${String(d.version)} inconnue (seule la version 1 existe)`)
  for (const k of ['id', 'name'] as const)
    if (typeof d[k] !== 'string' || !d[k]) throw new ProfileError(k, 'texte obligatoire')
  if (d.family !== 'diatonic-accordion') throw new ProfileError('family', `famille "${String(d.family)}" pas encore prise en charge (seulement "diatonic-accordion")`)
  if (!Array.isArray(d.rows) || !d.rows.length) throw new ProfileError('rows', 'au moins un rang est attendu')

  const rowIds = new Set<string>()
  const rows: ButtonRow[] = d.rows.map((r: unknown, ri: number) => {
    const at = `rows[${ri}]`
    if (!isObject(r)) throw new ProfileError(at, 'un objet est attendu')
    if (typeof r.id !== 'string' || !r.id) throw new ProfileError(`${at}.id`, 'texte obligatoire')
    if (rowIds.has(r.id)) throw new ProfileError(`${at}.id`, `l'identifiant "${r.id}" est déjà utilisé`)
    rowIds.add(r.id)
    if (typeof r.name !== 'string') throw new ProfileError(`${at}.name`, 'texte obligatoire')
    for (const k of ['offset', 'cost'] as const)
      if (r[k] !== undefined && (typeof r[k] !== 'number' || !Number.isFinite(r[k]))) throw new ProfileError(`${at}.${k}`, 'nombre attendu')
    if (r.suffix !== undefined && typeof r.suffix !== 'string') throw new ProfileError(`${at}.suffix`, 'texte attendu')
    if (!Array.isArray(r.buttons) || !r.buttons.length) throw new ProfileError(`${at}.buttons`, 'au moins un bouton est attendu')
    const buttons = r.buttons.map((b: unknown, bi: number) => {
      const bat = `${at}.buttons[${bi}] (bouton ${bi + 1})`
      if (!Array.isArray(b) || b.length !== 2) throw new ProfileError(bat, 'une paire [poussé, tiré] est attendue')
      const [push, pull] = b.map((n) => (typeof n === 'string' ? midiOf(n) : null))
      if (push == null) throw new ProfileError(bat, `note poussée illisible : ${JSON.stringify(b[0])} (exemple valide : "C4", "F#5")`)
      if (pull == null) throw new ProfileError(bat, `note tirée illisible : ${JSON.stringify(b[1])} (exemple valide : "C4", "F#5")`)
      return { push, pull }
    })
    return { id: r.id, name: r.name, suffix: (r.suffix as string | undefined) ?? '', offset: (r.offset as number | undefined) ?? 0, cost: (r.cost as number | undefined) ?? 0, buttons }
  })

  const bassIn = d.bass ?? []
  if (!Array.isArray(bassIn)) throw new ProfileError('bass', 'une liste est attendue')
  const bassIds = new Set<number>()
  const bassGroups: BassGroup[] = bassIn.map((g: unknown, gi: number) => {
    const at = `bass[${gi}]`
    if (!isObject(g)) throw new ProfileError(at, 'un objet est attendu')
    if (typeof g.id !== 'number' || !Number.isInteger(g.id) || g.id < 1) throw new ProfileError(`${at}.id`, 'entier positif attendu (numéro affiché dans la tablature)')
    if (bassIds.has(g.id)) throw new ProfileError(`${at}.id`, `le numéro ${g.id} est déjà utilisé`)
    bassIds.add(g.id)
    const side = (k: 'push' | 'pull') => {
      const s = g[k]
      if (!isObject(s)) throw new ProfileError(`${at}.${k}`, 'un objet { bass, chord } est attendu')
      const bass = typeof s.bass === 'string' ? pitchClassOf(s.bass) : null
      if (bass === null) throw new ProfileError(`${at}.${k}.bass`, `note illisible : ${JSON.stringify(s.bass)} (exemple valide : "C", "F#")`)
      const chord = typeof s.chord === 'string' || Array.isArray(s.chord) ? chordOf(s.chord as string | string[]) : null
      if (chord === null) throw new ProfileError(`${at}.${k}.chord`, `accord illisible : ${JSON.stringify(s.chord)} (exemples valides : "C", "Am", "D7", ["C","E","G"])`)
      return { bass, chord }
    }
    return { id: g.id, push: side('push'), pull: side('pull') }
  })

  return { id: d.id as string, name: d.name as string, family: 'diatonic-accordion', rows, bassGroups }
}
