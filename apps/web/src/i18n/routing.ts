import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  // Internal paths are English; each language gets its own public URL.
  pathnames: {
    '/': '/',
    '/workshop': { fr: '/atelier', en: '/workshop' },
    '/tunes': { fr: '/airs', en: '/tunes' },
    '/tunes/[slug]': { fr: '/airs/[slug]', en: '/tunes/[slug]' },
    '/notation': { fr: '/systeme-argoat', en: '/systeme-argoat' },
    '/support': { fr: '/soutenir', en: '/support' },
    '/privacy': { fr: '/confidentialite', en: '/privacy' },
    '/legal': { fr: '/mentions-legales', en: '/legal-notice' },
  },
})

export type Locale = (typeof routing.locales)[number]
