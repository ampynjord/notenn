import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { SignupForm } from '@/components/account/forms'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: t('signupTitle'), robots: { index: false } }
}

export default async function SignupPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('account')
  const { next } = await searchParams

  return (
    <div className="narrow">
      <header className="page-head">
        <h1>{t('signupTitle')}</h1>
        <p className="intro">{t('signupLead')}</p>
      </header>
      <SignupForm next={typeof next === 'string' ? next : undefined} />
    </div>
  )
}
