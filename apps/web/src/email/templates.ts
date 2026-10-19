import { createTranslator } from 'next-intl'

import en from '../../messages/en.json'
import fr from '../../messages/fr.json'
import { routing, type Locale } from '@/i18n/routing'
import { publicUrl } from '@/lib/site'

const MESSAGES = { fr, en } as const

type Kind = 'verify' | 'reset'
const PATHS: Record<Kind, '/account/verify' | '/account/reset-password'> = {
  verify: '/account/verify',
  reset: '/account/reset-password',
}

const localeOf = (user: unknown): Locale => {
  const l = (user as { locale?: string } | undefined)?.locale
  return l === 'en' ? 'en' : 'fr'
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/** Address of the page that consumes the token, in the member's language. */
export function tokenLink(kind: Kind, locale: Locale, token: string): string {
  const path = routing.pathnames[PATHS[kind]][locale]
  return `${publicUrl()}/${locale}${path}?token=${encodeURIComponent(token)}`
}

export function emailSubject(kind: Kind, user: unknown): string {
  const t = createTranslator({
    locale: localeOf(user),
    messages: MESSAGES[localeOf(user)],
    namespace: 'email',
  })
  return t(`${kind}Subject`)
}

/** Plain, accessible HTML that every mail client shows the same way. */
export function emailHtml(kind: Kind, user: unknown, token: string): string {
  const locale = localeOf(user)
  const t = createTranslator({ locale, messages: MESSAGES[locale], namespace: 'email' })
  const link = tokenLink(kind, locale, token)
  return `<!doctype html>
<html lang="${locale}"><body style="margin:0;padding:24px;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#16202b">
<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:8px;padding:28px">
<p style="font-size:20px;font-weight:bold;margin:0 0 16px">Notenn</p>
<p style="font-size:16px;line-height:1.5">${escape(t(`${kind}Intro`))}</p>
<p style="margin:24px 0"><a href="${escape(link)}" style="display:inline-block;background:#22408f;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:6px">${escape(t(`${kind}Button`))}</a></p>
<p style="font-size:13px;line-height:1.5;color:#59636e">${escape(t('linkFallback'))}<br><a href="${escape(link)}" style="color:#22408f;word-break:break-all">${escape(link)}</a></p>
<p style="font-size:13px;line-height:1.5;color:#59636e">${escape(t(`${kind}Ignore`))}</p>
</div></body></html>`
}
