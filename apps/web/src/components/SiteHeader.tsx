'use client'

import { useLocale, useTranslations } from 'next-intl'
import React from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

/** Site name, main links and the language switch (same page in the other language). */
export function SiteHeader() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const other = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale

  return (
    <header className="site-header">
      <Link href="/" className="brand">
        Notenn
      </Link>
      <nav aria-label={t('home')}>
        <Link href="/workshop">{t('workshop')}</Link>
        <Link href={pathname} locale={other} hrefLang={other} aria-label={t('language')}>
          {t('switchTo')}
        </Link>
      </nav>
    </header>
  )
}
