import type { MetadataRoute } from 'next'

import { routing } from '@/i18n/routing'
import { findTunes } from '@/lib/payload'
import { absoluteUrl, INDEXABLE_PAGES, languageUrls, pagePath, type PublicPath } from '@/lib/seo'

// The tunes come from the database, which is not reachable while the image is built.
export const dynamic = 'force-dynamic'

/** One entry per language for a page, each listing all the language versions. */
function entries(href: PublicPath, lastModified?: string): MetadataRoute.Sitemap {
  const languages = languageUrls(href)
  return routing.locales.map((locale) => ({
    url: absoluteUrl(pagePath(locale, href)),
    lastModified,
    alternates: { languages },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = INDEXABLE_PAGES.flatMap((href) => entries(href))

  // Slugs are the same in both languages, so one query is enough. If the database is down,
  // the static pages are still listed rather than failing the whole file.
  try {
    const tunes = await findTunes('fr')
    return [
      ...pages,
      ...tunes.flatMap((tune) =>
        entries({ pathname: '/tunes/[slug]', params: { slug: tune.slug } }, tune.updatedAt),
      ),
    ]
  } catch {
    return pages
  }
}
