import type { Metadata } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import React from 'react'

import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'

import Script from 'next/script'

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
    icons: { icon: '/icons/favicon-32.png', apple: '/icons/apple-touch-icon.png' },
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
            <Script src="/stats.js" strategy="afterInteractive" />
          </AccountProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
