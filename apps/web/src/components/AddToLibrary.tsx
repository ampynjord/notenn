'use client'

import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'

import { Link } from '@/i18n/navigation'
import { api, ApiError, useAccount } from '@/lib/account'

interface Props {
  tuneId: number
  title: string
}

/** On a bank tune's preview: add it to the library (account needed), then open it in the editor. */
export function AddToLibrary({ tuneId, title }: Props) {
  const t = useTranslations('preview')
  const ta = useTranslations('account')
  const { member } = useAccount()
  const [itemId, setItemId] = useState<number | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!member) return
    api<{ docs: { id: number }[] }>(
      `/library-items?where[tune][equals]=${tuneId}&limit=1&depth=0&select[title]=true`,
    )
      .then((r) => setItemId(r.docs[0]?.id ?? null))
      .catch(() => setItemId(null))
  }, [member, tuneId])

  // Rendered on the client only (the account is unknown on the server), so `window` is safe here.
  if (member === undefined) return null
  if (member === null) {
    const next = window.location.pathname
    return (
      <div className="library-cta">
        <p>{t('loginToAdd')}</p>
        <div className="row">
          <Link href={{ pathname: '/account/login', query: { next } }} className="button-link">
            {t('login')}
          </Link>
          <Link
            href={{ pathname: '/account/signup', query: { next } }}
            className="button-link secondary"
          >
            {t('signup')}
          </Link>
        </div>
      </div>
    )
  }

  const add = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await api<{ doc: { id: number } }>('/library-items', {
        method: 'POST',
        json: { kind: 'tune', tune: tuneId, title },
      })
      setItemId(res.doc.id)
    } catch (e) {
      setError(e instanceof ApiError ? e.key : 'generic')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="library-cta">
      {error && (
        <p className="notice error" role="alert">
          {ta(`errors.${error}`)}
        </p>
      )}
      <div className="row">
        {itemId ? (
          <>
            <span className="in-library">✓ {t('inLibrary')}</span>
            <Link
              href={{ pathname: '/workshop', query: { item: String(itemId) } }}
              className="button-link"
            >
              {t('openInEditor')}
            </Link>
          </>
        ) : (
          <button type="button" onClick={() => void add()} disabled={busy || itemId === undefined}>
            {busy ? t('adding') : t('addToLibrary')}
          </button>
        )}
      </div>
    </div>
  )
}
