'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import React, { useState } from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { useAccount } from '@/lib/account'

/** Site name, main sections and the language switch (same page in the other language). */
export function SiteHeader() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const params = useParams()
  const other = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale
  const [open, setOpen] = useState(false)
  const { member } = useAccount()
  const current = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) ? 'page' : undefined
  // Dynamic routes (a tune page) need their params to be rebuilt in the other language.
  const here = (
    params.slug ? { pathname, params: { slug: String(params.slug) } } : pathname
  ) as never

  return (
    <header className="site-header">
      <div className="bar">
        <Link href="/" className="brand" aria-label={t('home')}>
          <span className="mark" aria-hidden="true">
            <span className="p">P</span>
            <span className="t">{locale === 'fr' ? 'T' : 'D'}</span>
          </span>
          Notenn
        </Link>
        <button
          type="button"
          className="menu"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen(!open)}
        >
          {t('menu')}
        </button>
        <nav
          id="site-nav"
          className={open ? 'open' : undefined}
          aria-label={t('main')}
          onClick={() => setOpen(false)}
        >
          <Link href="/workshop" aria-current={current('/workshop')}>
            {t('workshop')}
          </Link>
          <Link href="/tunes" aria-current={current('/tunes')}>
            {t('tunes')}
          </Link>
          <Link href="/library" aria-current={current('/library')}>
            {t('library')}
          </Link>
          <Link href="/notation" aria-current={current('/notation')}>
            {t('notation')}
          </Link>
          {/* Until the account is known, a neutral placeholder keeps the menu from jumping. */}
          <Link
            href={member ? '/account' : '/account/login'}
            aria-current={current('/account')}
            className="account"
          >
            {member ? t('account') : member === null ? t('login') : ' '}
          </Link>
          <Link href="/support" aria-current={current('/support')} className="support">
            {t('support')}
          </Link>
          <Link href={here} locale={other} hrefLang={other} lang={other} className="lang">
            {t('switchTo')}
          </Link>
        </nav>
      </div>
    </header>
  )
}
