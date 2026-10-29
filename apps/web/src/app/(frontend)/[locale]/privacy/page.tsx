import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import type { Locale } from '@/i18n/routing'
import { pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'privacy' })
  return pageMetadata({ locale: locale as Locale, href: '/privacy', title: t('title') })
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('privacy')
  return (
    <article className="prose">
      <h1>{t('title')}</h1>
      <p className="lead">{t('lead')}</p>
      {(['files', 'storage', 'hosting', 'rights'] as const).map((k) => (
        <section key={k}>
          <h2>{t(`${k}Title`)}</h2>
          <p>{t(k)}</p>
        </section>
      ))}
    </article>
  )
}
