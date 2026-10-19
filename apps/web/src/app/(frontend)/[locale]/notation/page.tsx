import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { ArgoatSheet } from '@/components/ArgoatSheet'
import { Link } from '@/i18n/navigation'
import { exampleLines, notationSong } from '@/lib/examples'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'notation' })
  return { title: t('title'), description: t('lead') }
}

export default async function NotationPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('notation')
  const tl = await getTranslations('lines')
  const labels = { push: tl('push'), pull: tl('pull'), bass: tl('bass') }
  const example = exampleLines(notationSong, labels, { staff: true, width: 760, barsPerLine: 4 })

  return (
    <article className="prose notation">
      <h1>{t('title')}</h1>
      <p className="lead">{t('lead')}</p>
      <figure className="example">
        <ArgoatSheet lines={example} width={760} cursor={null} />
        <figcaption>{t('caption')}</figcaption>
      </figure>
      <dl className="rules">
        {(['bellows', 'rows', 'rhythm', 'hold', 'bass', 'staff'] as const).map((k) => (
          <div key={k}>
            <dt>{t(`${k}Title`)}</dt>
            <dd>{t(k, { push: tl('push'), pull: tl('pull') })}</dd>
          </div>
        ))}
      </dl>
      <h2>{t('whyTitle')}</h2>
      <p>{t('why')}</p>
      <p>
        <Link href="/workshop" className="button primary">
          {t('try')}
        </Link>
      </p>
    </article>
  )
}
