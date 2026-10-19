import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { LibraryView } from '@/components/LibraryView'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'library' })
  // Personal page: nothing for search engines.
  return { title: t('title'), robots: { index: false } }
}

export default async function LibraryPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('library')

  return (
    <>
      <header className="page-head">
        <h1>{t('title')}</h1>
        <p className="intro">{t('lead')}</p>
      </header>
      <LibraryView />
    </>
  )
}
