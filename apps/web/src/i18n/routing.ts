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
    '/library': { fr: '/bibliotheque', en: '/library' },
    '/account': { fr: '/compte', en: '/account' },
    '/account/login': { fr: '/compte/connexion', en: '/account/login' },
    '/account/signup': { fr: '/compte/inscription', en: '/account/signup' },
    '/account/verify': { fr: '/compte/verification', en: '/account/verify' },
    '/account/forgot-password': { fr: '/compte/mot-de-passe-oublie', en: '/account/forgot-password' },
    '/account/reset-password': { fr: '/compte/nouveau-mot-de-passe', en: '/account/reset-password' },
  },
})

export type Locale = (typeof routing.locales)[number]
