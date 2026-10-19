'use client'

import { fromFile, ImportError } from '@notenn/import'
import { useFormatter, useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'

import { Link } from '@/i18n/navigation'
import {
  api,
  ApiError,
  listLibrary,
  saveFileToLibrary,
  useAccount,
  type FullLibraryItem,
} from '@/lib/account'

const tuneOf = (it: FullLibraryItem) => (it.tune && typeof it.tune === 'object' ? it.tune : null)
const hasEdits = (it: FullLibraryItem) =>
  !!it.fingerings &&
  Object.values(it.fingerings as Record<string, object>).some((m) => Object.keys(m).length > 0)

/** The member's tunes: open in the editor, preview bank tunes, remove, import a file. */
export function LibraryView() {
  const t = useTranslations('library')
  const ta = useTranslations('account')
  const te = useTranslations('errors')
  const format = useFormatter()
  const { member } = useAccount()
  const [items, setItems] = useState<FullLibraryItem[] | null>(null)
  const [confirm, setConfirm] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!member) return
    listLibrary()
      .then(setItems)
      .catch(() => setError(ta('errors.generic')))
  }, [member?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (member === undefined) return <p role="status">{ta('busy')}</p>
  if (member === null)
    return (
      <div className="guest-card">
        <p>{t('guest')}</p>
        <div className="row">
          <Link href="/account/signup" className="button-link">
            {ta('signup')}
          </Link>
          <Link href="/account/login" className="button-link secondary">
            {ta('login')}
          </Link>
        </div>
      </div>
    )

  const importFile = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      // Read it first: a file the editor cannot open has no place in the library.
      const song = await fromFile(file)
      await saveFileToLibrary(file, song.title || file.name.replace(/\.[^.]+$/, ''))
      setItems(await listLibrary())
    } catch (e) {
      setError(
        e instanceof ImportError
          ? te(`import.${e.code}`)
          : e instanceof ApiError
            ? ta(`errors.${e.key}`)
            : ta('errors.generic'),
      )
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: number) => {
    setConfirm(null)
    try {
      await api(`/library-items/${id}`, { method: 'DELETE' })
      setItems((list) => list?.filter((x) => x.id !== id) ?? null)
    } catch {
      setError(ta('errors.generic'))
    }
  }

  return (
    <div className="library">
      <div className="library-bar">
        <p className="count">{items ? t('count', { count: items.length }) : ta('busy')}</p>
        <label className="button-link file-button">
          {busy ? t('importing') : t('import')}
          <input
            type="file"
            accept=".mid,.midi,.musicxml,.xml,.mxl,.abc"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importFile(f)
              e.target.value = ''
            }}
          />
        </label>
        <Link href="/tunes" className="button-link secondary">
          {t('browse')}
        </Link>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {items && items.length === 0 && <p className="empty">{t('empty')}</p>}
      {items && items.length > 0 && (
        <ul className="library-list">
          {items.map((it) => {
            const tune = tuneOf(it)
            const open = { pathname: '/workshop' as const, query: { item: String(it.id) } }
            return (
              <li key={it.id}>
                <div className="library-main">
                  <Link href={open} className="library-title">
                    {tune?.title ?? it.title}
                  </Link>
                  <p className="meta">
                    <span className={`tag ${it.kind}`}>
                      {it.kind === 'tune' ? t('fromBank') : t('ownFile')}
                    </span>{' '}
                    {t('added', {
                      date: format.dateTime(new Date(it.createdAt), { dateStyle: 'medium' }),
                    })}
                    {hasEdits(it) && <> · {t('edited')}</>}
                  </p>
                </div>
                <div className="row actions">
                  <Link href={open} className="button-link">
                    {t('open')}
                  </Link>
                  {tune && (
                    <Link
                      href={{ pathname: '/tunes/[slug]', params: { slug: tune.slug } }}
                      className="button-link secondary"
                    >
                      {t('view')}
                    </Link>
                  )}
                  {confirm === it.id ? (
                    <button type="button" className="danger" onClick={() => void remove(it.id)}>
                      {t('confirmRemove')}
                    </button>
                  ) : (
                    <button type="button" className="secondary" onClick={() => setConfirm(it.id)}>
                      {t('remove')}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
