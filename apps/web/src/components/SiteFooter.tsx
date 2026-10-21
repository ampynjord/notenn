import { getTranslations } from 'next-intl/server'
import React from 'react'

import { Link } from '@/i18n/navigation'
import { SITE } from '@/lib/site'

export async function SiteFooter() {
  const t = await getTranslations('footer')
  return (
    <footer className="site-footer">
      <div className="wrap">
        <p>{t('about')}</p>
        <nav aria-label={t('links')}>
          <a href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent(t('feedbackSubject'))}`}>
            {t('feedback')}
          </a>
          <Link href="/support">{t('support')}</Link>
          <Link href="/privacy">{t('privacy')}</Link>
          <Link href="/legal">{t('legal')}</Link>
        </nav>
      </div>
    </footer>
  )
}
