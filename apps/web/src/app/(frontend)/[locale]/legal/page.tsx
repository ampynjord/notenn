import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { SITE } from '@/lib/site'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal' })
  return { title: t('title') }
}

export default async function LegalPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('legal')
  return (
    <article className="prose">
      <h1>{t('title')}</h1>
      <h2>{t('publisherTitle')}</h2>
      <p>{t('publisher', { email: SITE.contactEmail })}</p>
      <h2>{t('hostTitle')}</h2>
      <p>{t('host')}</p>
      <h2>{t('contentTitle')}</h2>
      <p>{t('content')}</p>
      <h2>{t('codeTitle')}</h2>
      <p>{t('code')}</p>
    </article>
  )
}
