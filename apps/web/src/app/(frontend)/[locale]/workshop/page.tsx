import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { Workshop } from '@/components/Workshop'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return { title: t('workshopTitle') }
}

export default async function WorkshopPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('workshop')

  return (
    <>
      <h1>{t('title')}</h1>
      <p className="intro">{t('intro')}</p>
      <Workshop />
    </>
  )
}
