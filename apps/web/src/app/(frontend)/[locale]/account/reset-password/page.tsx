import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { ResetPasswordForm } from '@/components/account/forms'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: t('resetTitle'), robots: { index: false } }
}

export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('account')
  const { token } = await searchParams

  return (
    <div className="narrow">
      <header className="page-head">
        <h1>{t('resetTitle')}</h1>
      </header>
      <ResetPasswordForm token={typeof token === 'string' ? token : undefined} />
    </div>
  )
}
