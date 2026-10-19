import { describe, expect, it } from 'vitest'
import { chordOf, hohner2915GC, midiOf, parseProfile, pitchClassOf } from '../src/index'
import json from '../src/profiles/hohner-2915-gc.json'

describe('JSON profile format', () => {
  it('reads note names', () => {
    expect(midiOf('C4')).toBe(60)
    expect(midiOf('F#5')).toBe(78)
    expect(midiOf('Bb3')).toBe(58)
    expect(midiOf('B#3')).toBe(60)
    expect(midiOf('H4')).toBeNull()
    expect(pitchClassOf('Eb')).toBe(3)
  })

  it('reads chords by name or by notes', () => {
    expect(chordOf('C')).toEqual([0, 4, 7])
    expect(chordOf('Am')).toEqual([9, 0, 4])
    expect(chordOf('D7')).toEqual([2, 6, 9, 0])
    expect(chordOf(['E', 'G#', 'B'])).toEqual([4, 8, 11])
    expect(chordOf('Cmaj9')).toBeNull()
  })

  it('describes the Hohner 2915 like its keyboard chart', () => {
    const [doRow, solRow] = hohner2915GC.rows
    expect(doRow!.buttons.map((b) => [b.push, b.pull])).toEqual([
      [52, 55], [55, 59], [60, 62], [64, 65], [67, 69], [72, 71], [76, 74], [79, 77], [84, 81], [88, 83],
    ])
    expect(solRow!.buttons.map((b) => [b.push, b.pull])).toEqual([
      [47, 50], [50, 54], [55, 57], [59, 60], [62, 64], [67, 66], [71, 69], [74, 72], [79, 76], [83, 78], [86, 81],
    ])
    expect(doRow!.suffix).toBe("'")
    expect(hohner2915GC.bassGroups).toEqual([
      { id: 1, push: { bass: 0, chord: [0, 4, 7] }, pull: { bass: 7, chord: [7, 11, 2] } },
      { id: 2, push: { bass: 7, chord: [7, 11, 2] }, pull: { bass: 2, chord: [2, 6, 9] } },
      { id: 3, push: { bass: 5, chord: [5, 9, 0] }, pull: { bass: 5, chord: [5, 9, 0] } },
      { id: 4, push: { bass: 4, chord: [4, 8, 11] }, pull: { bass: 9, chord: [9, 0, 4] } },
    ])
  })

  it('accepts a minimal profile (no basses, default values)', () => {
    const p = parseProfile({ format: 'notenn-instrument', version: 1, id: 'x', name: 'X', family: 'diatonic-accordion', rows: [{ id: 'r', name: 'R', buttons: [['C4', 'D4']] }] })
    expect(p.rows[0]).toEqual({ id: 'r', name: 'R', suffix: '', offset: 0, cost: 0, buttons: [{ push: 60, pull: 62 }] })
    expect(p.bassGroups).toEqual([])
  })

  it('says exactly where the error is', () => {
    const bad = structuredClone(json) as typeof json
    bad.rows[1]!.buttons[3]![1] = 'Do5'
    expect(() => parseProfile(bad)).toThrow(expect.objectContaining({ path: 'rows[1].buttons[3]', code: 'bad-pull-note', params: { button: 4, value: '"Do5"' } }))
    const bad2 = structuredClone(json) as typeof json
    bad2.bass[3]!.pull.chord = 'Am9'
    expect(() => parseProfile(bad2)).toThrow(/bass\[3\]\.pull\.chord/)
    const bad3 = structuredClone(json) as unknown as { bass: { push: { chord: unknown } }[] }
    bad3.bass[0]!.push.chord = ['C', 4, 'G']
    expect(() => parseProfile(bad3)).toThrow(expect.objectContaining({ path: 'bass[0].push.chord', code: 'bad-chord' }))
    bad3.bass[0]!.push.chord = ['C', null, 'G']
    expect(() => parseProfile(bad3)).toThrow(/bass\[0\]\.push\.chord/)
    expect(() => parseProfile('{"format":"notenn-instrument",}')).toThrow(expect.objectContaining({ code: 'invalid-json' }))
    expect(() => parseProfile({ ...json, family: 'piano' })).toThrow(expect.objectContaining({ code: 'unsupported-family', params: { family: 'piano' } }))
    expect(() => parseProfile({ ...json, version: 2 })).toThrow(expect.objectContaining({ code: 'unknown-version' }))
    expect(() => parseProfile('{"format":"notenn-instrument","version":1,"id":"x","name":"X","family":"diatonic-accordion","rows":[{"id":"a","name":"A","buttons":[["C4","D4"]]},{"id":"a","name":"B","buttons":[["C4","D4"]]}]}')).toThrow(expect.objectContaining({ path: 'rows[1].id', code: 'duplicate-id' }))
  })
})
