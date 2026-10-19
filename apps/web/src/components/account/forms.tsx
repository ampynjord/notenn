'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter as useRawRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { Link, useRouter } from '@/i18n/navigation'
import { api, ApiError, useAccount } from '@/lib/account'

/** Only a path on this site: never an address that would send the member elsewhere. */
const safeNext = (next?: string) => (next && /^\/(?!\/)/.test(next) ? next : undefined)

function useSubmit() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = async (f: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await f()
    } catch (e) {
      setError(e instanceof ApiError ? e.key : 'generic')
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, run }
}

function ErrorLine({ error }: { error: string | null }) {
  const t = useTranslations('account.errors')
  return error ? (
    <p className="notice error" role="alert">
      {t(error)}
    </p>
  ) : null
}

const EmailField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const t = useTranslations('account')
  return (
    <label>
      <span>{t('email')}</span>
      <input
        type="email"
        required
        autoComplete="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

const PasswordField = ({
  value,
  onChange,
  isNew,
  label,
}: {
  value: string
  onChange: (v: string) => void
  isNew?: boolean
  label?: string
}) => {
  const t = useTranslations('account')
  return (
    <label>
      <span>{label ?? t('password')}</span>
      <input
        type="password"
        required
        minLength={isNew ? 8 : undefined}
        autoComplete={isNew ? 'new-password' : 'current-password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={isNew ? 'password-hint' : undefined}
      />
      {isNew && (
        <small id="password-hint" className="hint">
          {t('passwordHint')}
        </small>
      )}
    </label>
  )
}

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations('account')
  const { refresh } = useAccount()
  const router = useRouter()
  const rawRouter = useRawRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { busy, error, run } = useSubmit()

  return (
    <form
      className="form-card"
      onSubmit={(e) => {
        e.preventDefault()
        void run(async () => {
          await api('/members/login', { method: 'POST', json: { email, password } })
          await refresh()
          const target = safeNext(next)
          if (target) rawRouter.push(target)
          else router.push('/library')
        })
      }}
    >
      <ErrorLine error={error} />
      <EmailField value={email} onChange={setEmail} />
      <PasswordField value={password} onChange={setPassword} />
      <button type="submit" disabled={busy}>
        {busy ? t('busy') : t('login')}
      </button>
      <p className="form-links">
        <Link href="/account/forgot-password">{t('forgot')}</Link>
        <span>
          {t('noAccount')}{' '}
          <Link href={next ? { pathname: '/account/signup', query: { next } } : '/account/signup'}>
            {t('signup')}
          </Link>
        </span>
      </p>
    </form>
  )
}

export function SignupForm({ next }: { next?: string }) {
  const t = useTranslations('account')
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const { busy, error, run } = useSubmit()

  if (done)
    return (
      <p className="notice ok" role="status">
        {t('signupDone', { email })}
      </p>
    )

  return (
    <form
      className="form-card"
      onSubmit={(e) => {
        e.preventDefault()
        if (password.length < 8)
          return void run(async () => Promise.reject(new ApiError(400, 'passwordShort')))
        void run(async () => {
          await api('/members', { method: 'POST', json: { email, password, locale } })
          setDone(true)
        })
      }}
    >
      <ErrorLine error={error} />
      <EmailField value={email} onChange={setEmail} />
      <PasswordField value={password} onChange={setPassword} isNew />
      <p className="hint">
        <Link href="/privacy">{t('privacyNote')}</Link>
      </p>
      <button type="submit" disabled={busy}>
        {busy ? t('busy') : t('signup')}
      </button>
      <p className="form-links">
        <span>
          {t('haveAccount')}{' '}
          <Link href={next ? { pathname: '/account/login', query: { next } } : '/account/login'}>
            {t('login')}
          </Link>
        </span>
      </p>
    </form>
  )
}

export function VerifyEmail({ token }: { token?: string }) {
  const t = useTranslations('account')
  const [state, setState] = useState<'busy' | 'ok' | 'error'>(token ? 'busy' : 'error')
  const sent = useRef(false)
  useEffect(() => {
    if (!token || sent.current) return
    sent.current = true
    api(`/members/verify/${encodeURIComponent(token)}`, { method: 'POST' })
      .then(() => setState('ok'))
      .catch(() => setState('error'))
  }, [token])

  if (state === 'busy') return <p role="status">{t('verifying')}</p>
  if (state === 'error') return <ErrorLine error="token" />
  return (
    <p className="notice ok" role="status">
      {t('verified')} <Link href="/account/login">{t('login')}</Link>
    </p>
  )
}

export function ForgotPasswordForm() {
  const t = useTranslations('account')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const { busy, error, run } = useSubmit()

  if (sent)
    return (
      <p className="notice ok" role="status">
        {t('forgotSent')}
      </p>
    )
  return (
    <form
      className="form-card"
      onSubmit={(e) => {
        e.preventDefault()
        void run(async () => {
          // The answer is the same whether the address exists or not.
          await api('/members/forgot-password', { method: 'POST', json: { email } }).catch(
            (err) => {
              if (!(err instanceof ApiError) || err.status >= 500) throw err
            },
          )
          setSent(true)
        })
      }}
    >
      <ErrorLine error={error} />
      <EmailField value={email} onChange={setEmail} />
      <button type="submit" disabled={busy}>
        {busy ? t('busy') : t('forgotSend')}
      </button>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token?: string }) {
  const t = useTranslations('account')
  const { refresh } = useAccount()
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const { busy, error, run } = useSubmit()

  if (!token) return <ErrorLine error="token" />
  if (done)
    return (
      <p className="notice ok" role="status">
        {t('resetDone')} <Link href="/library">{t('goLibrary')}</Link>
      </p>
    )
  return (
    <form
      className="form-card"
      onSubmit={(e) => {
        e.preventDefault()
        if (password.length < 8)
          return void run(async () => Promise.reject(new ApiError(400, 'passwordShort')))
        void run(async () => {
          await api('/members/reset-password', { method: 'POST', json: { token, password } })
          await refresh()
          setDone(true)
        })
      }}
    >
      <ErrorLine error={error} />
      <PasswordField value={password} onChange={setPassword} isNew label={t('newPassword')} />
      <button type="submit" disabled={busy}>
        {busy ? t('busy') : t('resetSave')}
      </button>
    </form>
  )
}

/** Signed-in member: address, e-mail language, password, closing the account. */
export function AccountPanel() {
  const t = useTranslations('account')
  const { member, refresh, logout } = useAccount()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const { busy, error, run } = useSubmit()

  if (member === undefined) return <p role="status">{t('busy')}</p>
  if (member === null)
    return (
      <p className="notice">
        {t('required')} <Link href="/account/login">{t('login')}</Link>
      </p>
    )

  return (
    <div className="account-panel">
      <ErrorLine error={error} />
      <section className="form-card">
        <p>{t('signedInAs', { email: member.email })}</p>
        <label>
          <span>{t('emailLanguage')}</span>
          <select
            value={member.locale ?? 'fr'}
            onChange={(e) =>
              void run(async () => {
                await api(`/members/${member.id}`, {
                  method: 'PATCH',
                  json: { locale: e.target.value },
                })
                await refresh()
              })
            }
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>
        <div className="row">
          <Link href="/library" className="button-link">
            {t('goLibrary')}
          </Link>
          <button
            type="button"
            className="secondary"
            onClick={() => void logout().then(() => router.push('/'))}
          >
            {t('logout')}
          </button>
        </div>
      </section>

      <section className="form-card">
        <h2>{t('changePassword')}</h2>
        {resetSent ? (
          <p className="notice ok" role="status">
            {t('forgotSent')}
          </p>
        ) : (
          <>
            <p className="hint">{t('changePasswordHint')}</p>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await api('/members/forgot-password', {
                    method: 'POST',
                    json: { email: member.email },
                  })
                  setResetSent(true)
                })
              }
            >
              {t('changePassword')}
            </button>
          </>
        )}
      </section>

      <section className="form-card danger">
        <h2>{t('deleteTitle')}</h2>
        <p>{t('deleteText')}</p>
        {confirming ? (
          <div className="row">
            <button
              type="button"
              className="danger"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await api(`/members/${member.id}`, { method: 'DELETE' })
                  // The session ended with the account.
                  await refresh()
                  router.push('/')
                })
              }
            >
              {t('confirmDelete')}
            </button>
            <button type="button" className="secondary" onClick={() => setConfirming(false)}>
              {t('cancel')}
            </button>
          </div>
        ) : (
          <button type="button" className="secondary" onClick={() => setConfirming(true)}>
            {t('delete')}
          </button>
        )}
      </section>
    </div>
  )
}
