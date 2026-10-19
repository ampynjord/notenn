import { describe, expect, it } from 'vitest'

import en from '../../messages/en.json'
import fr from '../../messages/fr.json'
import { emailHtml, emailSubject, tokenLink } from '@/email/templates'
import { errorKey } from '@/lib/account'
import { DEFAULT_PREFERENCES, sanitizePreferences } from '@/lib/preferences'

describe('account e-mails', () => {
  it('links to the page in the member language', () => {
    expect(tokenLink('verify', 'fr', 'abc')).toBe(
      'https://notenn.ampynjord.bzh/fr/compte/verification?token=abc',
    )
    expect(tokenLink('reset', 'en', 'a b')).toBe(
      'https://notenn.ampynjord.bzh/en/account/reset-password?token=a%20b',
    )
  })

  it('writes the e-mail in the member language, French by default', () => {
    expect(emailSubject('verify', { locale: 'en' })).toBe(en.email.verifySubject)
    expect(emailSubject('reset', {})).toBe(fr.email.resetSubject)
    const html = emailHtml('reset', { locale: 'en' }, 'tok')
    expect(html).toContain('lang="en"')
    expect(html).toContain('/en/account/reset-password?token=tok')
    expect(html).toContain(en.email.resetButton)
  })

  it('escapes the token in the HTML', () => {
    expect(emailHtml('verify', {}, '"><script>')).not.toContain('<script>')
  })

  it('has the same e-mail and account texts in both languages', () => {
    const keys = (o: object): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        v && typeof v === 'object' ? keys(v).map((x) => `${k}.${x}`) : [k],
      )
    for (const ns of ['email', 'account', 'library', 'preview'] as const)
      expect(keys(en[ns]).sort()).toEqual(keys(fr[ns]).sort())
  })
})

describe('API refusals', () => {
  const body = (message: string) => ({ errors: [{ message }] })
  it('turns Payload messages into our own texts', () => {
    expect(errorKey(403, body('Please verify your email before logging in.'))).toBe('unverified')
    expect(errorKey(401, body('The email or password provided is incorrect.'))).toBe('credentials')
    expect(
      errorKey(401, body('This user is locked due to having too many failed login attempts.')),
    ).toBe('locked')
    expect(errorKey(400, body('The following field is invalid: email'))).toBe('emailTaken')
    expect(errorKey(400, body('The following field is invalid: password'))).toBe('passwordShort')
    expect(errorKey(403, body('Verification token is invalid.'))).toBe('token')
    expect(errorKey(400, body('library-full'))).toBe('libraryFull')
    expect(errorKey(500, {})).toBe('generic')
    for (const key of [
      'unverified',
      'credentials',
      'locked',
      'emailTaken',
      'passwordShort',
      'token',
      'libraryFull',
      'generic',
    ])
      expect(fr.account.errors).toHaveProperty(key)
  })
})

describe('saved settings', () => {
  it('keeps only known settings of the right type', () => {
    expect(sanitizePreferences({ speed: 80, loop: 'yes', rows: ['c'], unknown: 1 })).toEqual({
      speed: 80,
      rows: ['c'],
    })
    expect(sanitizePreferences({ rows: [1, 2] })).toEqual({})
    expect(sanitizePreferences(null)).toEqual({})
    expect({ ...DEFAULT_PREFERENCES, ...sanitizePreferences({ rows: null }) }.rows).toBeNull()
  })
})
