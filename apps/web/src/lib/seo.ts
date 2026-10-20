import type { Metadata } from 'next'

import { getPathname } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { SITE } from '@/lib/site'

/** Pages that search engines may index (the account area and the library are private). */
export const INDEXABLE_PAGES = ['/', '/workshop', '/tunes', '/support', '/privacy', '/legal'] as const

export type PublicPath =
  | (typeof INDEXABLE_PAGES)[number]
  | { pathname: '/tunes/[slug]'; params: { slug: string } }

const OG_LOCALE: Record<Locale, string> = { fr: 'fr_FR', en: 'en_GB' }

/** Size of the share preview image, the one most networks display. */
export const OG_SIZE = { width: 1200, height: 630 }

/** Fixed, absolute address of the share preview (see app/og): crawlers cannot read relative ones. */
export const ogImageUrl = (locale: Locale) => absoluteUrl(`/og/${locale}.png`)

/** Public path of a page in a language, e.g. ('fr', '/tunes') gives '/fr/airs'. */
export function pagePath(locale: Locale, href: PublicPath): string {
  return getPathname({ locale, href })
}

/** Full address of a path. The canonical host is fixed (SITE.url), whatever address served the request. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString()
}

/** One entry per language, plus `x-default` pointing at the default language. */
export function languageUrls(href: PublicPath): Record<string, string> {
  const urls: Record<string, string> = {}
  for (const locale of routing.locales) urls[locale] = absoluteUrl(pagePath(locale, href))
  urls['x-default'] = urls[routing.defaultLocale]!
  return urls
}

export interface PageSeo {
  locale: Locale
  href: PublicPath
  title: string
  description?: string
  /** Use the title as is, without the " · Notenn" suffix of the layout template. */
  absoluteTitle?: boolean
}

/**
 * Title, description, canonical address, language alternates and share previews of an indexable page.
 * The canonical address ignores the query string, so filtered lists do not compete with the list itself.
 */
export function pageMetadata({ locale, href, title, description, absoluteTitle }: PageSeo): Metadata {
  const url = absoluteUrl(pagePath(locale, href))
  const image = { url: ogImageUrl(locale), ...OG_SIZE, alt: 'Notenn' }
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url, languages: languageUrls(href) },
    openGraph: {
      type: 'website',
      siteName: 'Notenn',
      url,
      title,
      description,
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

/** Structured data for the home page: the site and the web application. */
export function homeJsonLd(locale: Locale, description: string) {
  const url = absoluteUrl(pagePath(locale, '/'))
  return [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Notenn', url, inLanguage: locale },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Notenn',
      url,
      description,
      inLanguage: locale,
      applicationCategory: 'MusicApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    },
  ]
}

export interface TuneJsonLdInput {
  locale: Locale
  slug: string
  title: string
  description: string
  /** Genre in the reader's language, e.g. "Valse". */
  genre: string
  /** Names of the home page and of the tunes list, in the reader's language. */
  crumbs: { home: string; tunes: string }
}

/** Structured data for a tune page: the composition and its breadcrumb trail. */
export function tuneJsonLd({ locale, slug, title, description, genre, crumbs }: TuneJsonLdInput) {
  const url = absoluteUrl(pagePath(locale, { pathname: '/tunes/[slug]', params: { slug } }))
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'MusicComposition',
      name: title,
      url,
      description,
      genre,
      inLanguage: locale,
      isAccessibleForFree: true,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: crumbs.home, item: absoluteUrl(pagePath(locale, '/')) },
        { '@type': 'ListItem', position: 2, name: crumbs.tunes, item: absoluteUrl(pagePath(locale, '/tunes')) },
        { '@type': 'ListItem', position: 3, name: title, item: url },
      ],
    },
  ]
}

/**
 * A description short enough for a search result (about 155 characters): whole sentences when
 * possible, otherwise cut at the last comma or semicolon, otherwise at a word, with an ellipsis.
 * A full stop only ends a sentence when a capital letter or an opening quote follows, so "op. 49"
 * is not cut in two.
 */
export function summarize(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const head = clean.slice(0, max)
  const sentence = [...head.matchAll(/[.!?](?=\s+[A-ZÀ-ÖØ-Þ«“"])/g)].at(-1)
  if (sentence?.index !== undefined && sentence.index >= 60) return head.slice(0, sentence.index + 1)
  const pause = [...head.matchAll(/[,;]/g)].at(-1)
  if (pause?.index !== undefined && pause.index >= 80) return `${head.slice(0, pause.index)}…`
  return `${head.slice(0, head.lastIndexOf(' ')).replace(/[\s,;:]+$/, '')}…`
}

/** JSON for a <script type="application/ld+json"> tag; `<` is escaped so a title cannot close the tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
