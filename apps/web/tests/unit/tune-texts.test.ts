import { describe, expect, it } from 'vitest'

import { summarize } from '@/lib/seo'
import { BRETON_TUNES } from '@/seed/breton'
import { SEED_TUNES } from '@/seed/tunes'

const ALL_TUNES = [...SEED_TUNES, ...BRETON_TUNES]

describe('starter tune descriptions', () => {
  it.each(ALL_TUNES.map((t) => [t.slug, t] as const))(
    '%s has a full text in both languages, with the tempo of its melody',
    (_slug, tune) => {
      for (const text of [tune.notes.fr, tune.notes.en]) {
        expect(text.length).toBeGreaterThan(120)
        expect(text.length).toBeLessThan(500)
        // The site is typeset with typographic apostrophes; a straight one means a copy-paste slip.
        expect(text).not.toContain("'")
      }
      expect(tune.notes.fr).not.toBe(tune.notes.en)
      // The tempo quoted in the text must be the one written in the melody (Q: line of the ABC).
      const tempo = /^Q:\s*\d+\/\d+=(\d+)/m.exec(tune.abc)?.[1]
      expect(tempo).toBeDefined()
      expect(tune.notes.fr).toContain(`${tempo} à la noire`)
      expect(tune.notes.en).toContain(`${tempo} to the`)
    },
  )
})

describe('summarize', () => {
  it('keeps a short text as is', () => {
    expect(summarize('Un air court.')).toBe('Un air court.')
  })

  it('stops at the end of a sentence that fits', () => {
    const text = `${'Première phrase assez longue pour dépasser soixante caractères sans problème.'} Deuxième phrase qui dépasse largement la limite fixée pour une description de résultat de recherche.`
    expect(summarize(text, 120)).toBe('Première phrase assez longue pour dépasser soixante caractères sans problème.')
  })

  it('does not cut after an abbreviation followed by a number', () => {
    const text = 'Wiegenlied op. 49 n° 4, que Johannes Brahms publie en 1868 et qui reste la berceuse la plus connue du répertoire classique de tous les temps.'
    const result = summarize(text, 100)
    expect(result.endsWith('…')).toBe(true)
    expect(result).not.toBe('Wiegenlied op.')
  })

  it('prefers the last comma to the middle of a phrase when no sentence fits', () => {
    const text = 'Le chant écossais du réveillon : les paroles sont du poète Robert Burns (1788), sur une mélodie traditionnelle, et on le chante dans le monde entier à minuit.'
    expect(summarize(text, 150)).toBe(
      'Le chant écossais du réveillon : les paroles sont du poète Robert Burns (1788), sur une mélodie traditionnelle…',
    )
  })

  it('cuts at a word with an ellipsis when no sentence or pause fits', () => {
    const result = summarize('mot '.repeat(60), 50)
    expect(result.length).toBeLessThanOrEqual(51)
    expect(result.endsWith('mot…')).toBe(true)
  })

  it('never exceeds the limit on the real descriptions', () => {
    for (const tune of SEED_TUNES)
      for (const text of [tune.notes.fr, tune.notes.en]) expect(summarize(text).length).toBeLessThanOrEqual(156)
  })
})
