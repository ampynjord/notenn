import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { HeroTabs } from '@/components/HeroTabs'
import { JsonLd } from '@/components/JsonLd'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { exampleLinesFor } from '@/lib/examples'
import { homeJsonLd, pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return pageMetadata({
    locale: locale as Locale,
    href: '/',
    title: t('homeTitle'),
    description: t('description'),
    absoluteTitle: true,
  })
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('home')
  const tm = await getTranslations('meta')
  const tl = await getTranslations('lines')
  const labels = { push: tl('push'), pull: tl('pull'), bass: tl('bass') }
  const variant = (id: string, label: string, caption: string) => ({
    id,
    label,
    caption,
    lines: exampleLinesFor(id, labels, { width: 380, barsPerLine: 2 }),
  })
  const variants = [
    variant('hohner-2915-gc', t('heroDiatonic'), t('heroCaption')),
    variant('chromatic-c-3row', t('heroChromatic'), t('heroCaptionChromatic')),
    variant('guitar-standard', t('heroGuitar'), t('heroCaptionString')),
    variant('whistle-d', t('heroWhistle'), t('heroCaptionWhistle')),
  ]

  return (
    <div className="home">
      <JsonLd data={homeJsonLd(locale as Locale, tm('description'))} />
      <section className="hero">
        <div className="hero-text">
          <h1>{t('title')}</h1>
          <p className="lead">{t('lead')}</p>
          <p className="actions">
            <Link href="/workshop" className="button primary">
              {t('openWorkshop')}
            </Link>
            <Link href="/tunes" className="button">
              {t('browseTunes')}
            </Link>
          </p>
        </div>
        <HeroTabs variants={variants} width={380} />
      </section>

      <section className="steps" aria-labelledby="how">
        <h2 id="how">{t('howTitle')}</h2>
        <ol>
          <li>
            <h3>{t('step1Title')}</h3>
            <p>{t('step1')}</p>
          </li>
          <li>
            <h3>{t('step2Title')}</h3>
            <p>{t('step2')}</p>
          </li>
          <li>
            <h3>{t('step3Title')}</h3>
            <p>{t('step3')}</p>
          </li>
        </ol>
      </section>

      <section className="split">
        <div>
          <h2>{t('libraryTitle')}</h2>
          <p>{t('libraryText')}</p>
          <p>
            <Link href="/library">{t('libraryLink')}</Link>
          </p>
        </div>
        <div>
          <h2>{t('freeTitle')}</h2>
          <p>{t('freeText')}</p>
          <p>
            <Link href="/support">{t('supportLink')}</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
