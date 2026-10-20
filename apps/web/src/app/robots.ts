import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib/seo'

/**
 * Everything public may be crawled. The admin, the API and the health check are not for readers.
 * The account pages are deliberately not listed: they carry a `noindex` tag, and a crawler blocked
 * here could never read it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/healthz'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
