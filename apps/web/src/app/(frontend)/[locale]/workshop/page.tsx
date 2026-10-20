import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { Workshop } from '@/components/Workshop'
import type { Locale } from '@/i18n/routing'
import { pageMetadata } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ item?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'workshop' })
  return pageMetadata({ locale: locale as Locale, href: '/workshop', title: t('title'), description: t('intro') })
}

export default async function WorkshopPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('workshop')
  const { item } = await searchParams

  return (
    <>
      <header className="page-head">
        <h1>{t('title')}</h1>
        <p className="intro">{t('intro')}</p>
      </header>
      <Workshop itemId={typeof item === 'string' && /^\d+$/.test(item) ? item : undefined} />
    </>
  )
}
