import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import React from 'react'

import { AddToLibrary } from '@/components/AddToLibrary'
import { JsonLd } from '@/components/JsonLd'
import { Workshop } from '@/components/Workshop'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { findTune } from '@/lib/payload'
import { pageMetadata, summarize, tuneJsonLd } from '@/lib/seo'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const tune = await findTune(locale as Locale, slug)
  if (!tune) return {}
  const t = await getTranslations({ locale, namespace: 'tunes' })
  return pageMetadata({
    locale: locale as Locale,
    href: { pathname: '/tunes/[slug]', params: { slug: tune.slug } },
    title: t('pageTitle', { title: tune.title }),
    // The full text is shown on the page; the search result only has room for the first sentences.
    description: tune.notes
      ? summarize(tune.notes)
      : t('pageDescription', { title: tune.title, origin: tune.origin }),
  })
}

export default async function TunePage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const tune = await findTune(locale as Locale, slug)
  if (!tune) notFound()
  const t = await getTranslations('tunes')
  const tm = await getTranslations('meta')
  const tp = await getTranslations('preview')

  return (
    <>
      <JsonLd
        data={tuneJsonLd({
          locale: locale as Locale,
          slug: tune.slug,
          title: tune.title,
          description: tune.notes ?? t('pageDescription', { title: tune.title, origin: tune.origin }),
          genre: t(`kinds.${tune.kind}`),
          crumbs: { home: tm('title'), tunes: t('title') },
        })}
      />
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
