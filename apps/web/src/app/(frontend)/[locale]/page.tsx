import { hohner2915GC } from '@notenn/engine'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { Link } from '@/i18n/navigation'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('home')
  const ti = await getTranslations('instruments')
  const profile = hohner2915GC

  return (
    <div className="home">
      <h1>Notenn</h1>
      <p>{t('tagline')}</p>
      <p>
        {t('keyboard', {
          name: ti.has(profile.id) ? ti(profile.id) : profile.name,
          rows: profile.rows.length,
          basses: profile.bassGroups.length * 2,
        })}
      </p>
      <div className="links">
        <Link href="/workshop">{t('openWorkshop')}</Link>
      </div>
    </div>
  )
}
