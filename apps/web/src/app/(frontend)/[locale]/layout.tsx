import type { Metadata } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import React from 'react'

import '@fontsource-variable/inter'
import '@fontsource-variable/manrope'

import { ServiceWorker } from '@/components/ServiceWorker'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { routing } from '@/i18n/routing'
import { AccountProvider } from '@/lib/account'
import { SITE } from '@/lib/site'
import '../styles.css'

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    title: { default: t('title'), template: `%s · ${t('title')}` },
    description: t('description'),
    metadataBase: new URL(SITE.url),
    manifest: '/manifest.webmanifest',
    icons: { icon: [{ url: '/logo.svg', type: 'image/svg+xml' }, { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' }], apple: '/icons/apple-touch-icon.png' },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <AccountProvider>
            <a className="skip" href="#content">
              {(await getTranslations({ locale, namespace: 'nav' }))('skip')}
            </a>
            <SiteHeader />
            <main id="content">{children}</main>
            <SiteFooter />
            <ServiceWorker />
          </AccountProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
