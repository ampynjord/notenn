import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { LoginForm } from '@/components/account/forms'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })
  return { title: t('loginTitle'), robots: { index: false } }
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('account')
  const { next } = await searchParams

  return (
    <div className="narrow">
      <header className="page-head">
        <h1>{t('loginTitle')}</h1>
        <p className="intro">{t('loginLead')}</p>
      </header>
      <LoginForm next={typeof next === 'string' ? next : undefined} />
    </div>
  )
}
