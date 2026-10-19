import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import React from 'react'

import { AddToLibrary } from '@/components/AddToLibrary'
import { Workshop } from '@/components/Workshop'
import { Link } from '@/i18n/navigation'
import { findTune } from '@/lib/payload'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const tune = await findTune(locale as 'fr' | 'en', slug)
  return tune ? { title: tune.title, description: tune.notes ?? undefined } : {}
}

export default async function TunePage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const tune = await findTune(locale as 'fr' | 'en', slug)
  if (!tune) notFound()
  const t = await getTranslations('tunes')
  const tp = await getTranslations('preview')

  return (
    <>
      <p className="crumbs">
        <Link href="/tunes">{t('back')}</Link>
      </p>
      <header className="tune-head">
        <h1>{tune.title}</h1>
        <p className="meta">
          {t(`regions.${tune.region}`)}, {t(`kinds.${tune.kind}`).toLowerCase()}.{' '}
          {t('origin', { origin: tune.origin })} {t(`licences.${tune.licence}`)}.{' '}
          {t(`levels.${tune.level}`)}.
        </p>
        {tune.notes && <p className="intro">{tune.notes}</p>}
        <AddToLibrary tuneId={tune.id} title={tune.title} />
        <p className="hint preview-hint">{tp('hint')}</p>
      </header>
      <Workshop mode="preview" abc={tune.abc} showTitle={false} />
    </>
  )
}
