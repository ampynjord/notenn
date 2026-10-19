import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { ForgotPasswordForm } from '@/components/account/forms'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: t('forgotTitle'), robots: { index: false } }
}

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('account')

  return (
    <div className="narrow">
      <header className="page-head">
        <h1>{t('forgotTitle')}</h1>
        <p className="intro">{t('forgotLead')}</p>
      </header>
      <ForgotPasswordForm />
    </div>
  )
}
