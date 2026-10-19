import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  // Internal paths are English; each language gets its own public URL.
  pathnames: {
    '/': '/',
    '/workshop': { fr: '/atelier', en: '/workshop' },
  },
})

export type Locale = (typeof routing.locales)[number]
