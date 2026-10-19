import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { ArgoatSheet } from '@/components/ArgoatSheet'
import { Link } from '@/i18n/navigation'
import { exampleLines, heroSong } from '@/lib/examples'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('home')
  const tl = await getTranslations('lines')
  const labels = { push: tl('push'), pull: tl('pull'), bass: tl('bass') }
  const hero = exampleLines(heroSong, labels, { staff: false, width: 380, barsPerLine: 2 })

  return (
    <div className="home">
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
        <figure className="hero-tab">
          <ArgoatSheet lines={hero} width={380} cursor={null} />
          <figcaption>{t('heroCaption')}</figcaption>
        </figure>
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
          <h2>{t('notationTitle')}</h2>
          <p>{t('notationText')}</p>
          <p>
            <Link href="/notation">{t('notationLink')}</Link>
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
