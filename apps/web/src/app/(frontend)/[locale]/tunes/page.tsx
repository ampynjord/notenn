import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { Link } from '@/i18n/navigation'
import { findTunes } from '@/lib/payload'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; region?: string; kind?: string; level?: string }>
}

const REGIONS = [
  'brittany',
  'france',
  'ireland',
  'scotland',
  'england',
  'germany',
  'usa',
  'international',
] as const
const KINDS = [
  'air',
  'song',
  'childrens-song',
  'dance',
  'jig',
  'slip-jig',
  'reel',
  'march',
  'waltz',
  'shanty',
  'lullaby',
  'spiritual',
  'classical',
] as const
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tunes' })
  return { title: t('title'), description: t('lead') }
}

export default async function TunesPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const filters = await searchParams
  const t = await getTranslations('tunes')
  const tunes = await findTunes(locale as 'fr' | 'en', filters)
  const filtered = !!(filters.q || filters.region || filters.kind || filters.level)

  return (
    <div className="tunes">
      <h1>{t('title')}</h1>
      <p className="lead">{t('lead')}</p>
      <form className="filters" role="search" method="get">
        <label>
          <span>{t('search')}</span>
          <input
            type="search"
            name="q"
            defaultValue={filters.q ?? ''}
            placeholder={t('searchPlaceholder')}
          />
        </label>
        <label>
          <span>{t('region')}</span>
          <select name="region" defaultValue={filters.region ?? ''}>
            <option value="">{t('all')}</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {t(`regions.${r}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('kind')}</span>
          <select name="kind" defaultValue={filters.kind ?? ''}>
            <option value="">{t('all')}</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`kinds.${k}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('level')}</span>
          <select name="level" defaultValue={filters.level ?? ''}>
            <option value="">{t('all')}</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {t(`levels.${l}`)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">{t('filter')}</button>
        {filtered && <Link href="/tunes">{t('clear')}</Link>}
      </form>

      <p className="count" aria-live="polite">
        {t('count', { count: tunes.length })}
      </p>
      {tunes.length === 0 ? (
        <p className="empty">{t('empty')}</p>
      ) : (
        <ul className="tune-list">
          {tunes.map((tune) => (
            <li key={tune.id}>
              <Link href={{ pathname: '/tunes/[slug]', params: { slug: tune.slug } }}>
                <span className="name">{tune.title}</span>
                <span className="meta">
                  {t(`regions.${tune.region}`)}, {t(`kinds.${tune.kind}`).toLowerCase()}
                </span>
                <span className={`level ${tune.level}`}>{t(`levels.${tune.level}`)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="hint">{t('rights')}</p>
    </div>
  )
}
