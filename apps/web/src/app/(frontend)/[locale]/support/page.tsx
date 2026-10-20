import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import type { Locale } from '@/i18n/routing'
import { pageMetadata } from '@/lib/seo'
import { SITE } from '@/lib/site'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'support' })
  return pageMetadata({ locale: locale as Locale, href: '/support', title: t('title') })
}

export default async function SupportPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('support')
  return (
    <article className="prose">
      <h1>{t('title')}</h1>
      <p className="lead">{t('lead')}</p>
      <p>{t('costs')}</p>
      <p>
        <a className="button primary" href={SITE.donateUrl} rel="noopener">
          {t('donate')}
        </a>
      </p>
      <p className="hint">{t('liberapay')}</p>
      <h2>{t('otherTitle')}</h2>
      <p>{t('other')}</p>
    </article>
  )
}
