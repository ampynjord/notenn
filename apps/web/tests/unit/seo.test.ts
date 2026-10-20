import { describe, expect, it } from 'vitest'

import { routing } from '@/i18n/routing'
import {
  absoluteUrl,
  homeJsonLd,
  INDEXABLE_PAGES,
  jsonLdString,
  languageUrls,
  ogImageUrl,
  pageMetadata,
  pagePath,
  tuneJsonLd,
} from '@/lib/seo'
import { SITE } from '@/lib/site'

const tune = { pathname: '/tunes/[slug]', params: { slug: 'amazing-grace' } } as const

describe('public addresses', () => {
  it('gives each language its own path', () => {
    expect(pagePath('fr', '/')).toBe('/fr')
    expect(pagePath('fr', '/tunes')).toBe('/fr/airs')
    expect(pagePath('en', '/tunes')).toBe('/en/tunes')
    expect(pagePath('fr', tune)).toBe('/fr/airs/amazing-grace')
    expect(pagePath('en', tune)).toBe('/en/tunes/amazing-grace')
  })

  it('resolves every indexable page in every language', () => {
    for (const locale of routing.locales)
      for (const href of INDEXABLE_PAGES) expect(pagePath(locale, href)).toMatch(new RegExp(`^/${locale}(/|$)`))
  })

  it('never lists the private pages', () => {
    const listed: readonly string[] = INDEXABLE_PAGES
    for (const page of ['/account', '/library', '/account/login']) expect(listed).not.toContain(page)
  })

  it('builds full addresses on the canonical host', () => {
    expect(absoluteUrl('/fr/airs')).toBe(`${SITE.url}/fr/airs`)
  })

  it('lists both languages and a default for the language alternates', () => {
    expect(languageUrls('/tunes')).toEqual({
      fr: `${SITE.url}/fr/airs`,
      en: `${SITE.url}/en/tunes`,
      'x-default': `${SITE.url}/fr/airs`,
    })
  })
})

describe('page metadata', () => {
  it('sets the canonical address, the alternates and the share previews', () => {
    const meta = pageMetadata({ locale: 'en', href: tune, title: 'Amazing Grace: tab', description: 'A slow waltz.' })
    expect(meta.title).toBe('Amazing Grace: tab')
    expect(meta.alternates?.canonical).toBe(`${SITE.url}/en/tunes/amazing-grace`)
    expect(meta.alternates?.languages).toMatchObject({ fr: `${SITE.url}/fr/airs/amazing-grace` })
    expect(meta.openGraph).toMatchObject({ locale: 'en_GB', alternateLocale: ['fr_FR'], url: `${SITE.url}/en/tunes/amazing-grace` })
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image', title: 'Amazing Grace: tab' })
  })

  it('points the share previews at a fixed absolute image in the page language', () => {
    const image = { url: `${SITE.url}/og/en.png`, width: 1200, height: 630 }
    const meta = pageMetadata({ locale: 'en', href: '/', title: 'Notenn' })
    expect(meta.openGraph?.images).toEqual([expect.objectContaining(image)])
    expect(meta.twitter?.images).toEqual([expect.objectContaining(image)])
    expect(ogImageUrl('fr')).toBe(`${SITE.url}/og/fr.png`)
  })

  it('can keep the title as is, without the layout suffix', () => {
    expect(pageMetadata({ locale: 'fr', href: '/', title: 'Notenn', absoluteTitle: true }).title).toEqual({
      absolute: 'Notenn',
    })
  })
})

describe('structured data', () => {
  it('describes the site and the application on the home page', () => {
    const [site, app] = homeJsonLd('fr', 'Des tablatures.') as Record<string, unknown>[]
    expect(site).toMatchObject({ '@type': 'WebSite', url: `${SITE.url}/fr`, inLanguage: 'fr' })
    expect(app).toMatchObject({ '@type': 'SoftwareApplication', applicationCategory: 'MusicApplication' })
  })

  it('describes a tune and its breadcrumb trail', () => {
    const [work, trail] = tuneJsonLd({
      locale: 'fr',
      slug: 'amazing-grace',
      title: 'Amazing Grace',
      description: 'Un air lent.',
      genre: 'Air',
      crumbs: { home: 'Notenn', tunes: 'Banque d’airs' },
    }) as Record<string, unknown>[]
    expect(work).toMatchObject({ '@type': 'MusicComposition', name: 'Amazing Grace', isAccessibleForFree: true })
    const items = (trail as { itemListElement: { position: number; item: string }[] }).itemListElement
    expect(items.map((i) => i.position)).toEqual([1, 2, 3])
    expect(items.map((i) => i.item)).toEqual([
      `${SITE.url}/fr`,
      `${SITE.url}/fr/airs`,
      `${SITE.url}/fr/airs/amazing-grace`,
    ])
  })

  it('cannot be closed early by a title containing a tag', () => {
    expect(jsonLdString({ name: '</script><b>' })).not.toContain('</script>')
    expect(JSON.parse(jsonLdString({ name: '</script>' }))).toEqual({ name: '</script>' })
  })
})
