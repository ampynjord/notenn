import { describe, expect, it, vi } from 'vitest'

import {
  SITE_HEADER,
  toMemberSetCookie,
  toPayloadCookies,
  withMemberSession,
} from '@/lib/member-session'

describe('member session cookie', () => {
  it('gives Payload the member cookie and hides the back-office one', () => {
    expect(toPayloadCookies('a=1; payload-token=ADMIN; notenn-member=MEMBER; b=2')).toBe(
      'a=1; payload-token=MEMBER; b=2',
    )
    expect(toPayloadCookies('payload-token=ADMIN')).toBe('')
    expect(toPayloadCookies(null)).toBe('')
  })

  it('renames the cookie Payload sets, and only that one', () => {
    expect(toMemberSetCookie('payload-token=abc; Path=/; HttpOnly')).toBe(
      'notenn-member=abc; Path=/; HttpOnly',
    )
    expect(toMemberSetCookie('other=1; Path=/')).toBe('other=1; Path=/')
  })

  const ctx = { params: Promise.resolve({ slug: ['members', 'me'] }) }

  it('leaves a back-office call untouched', async () => {
    const seen = vi.fn(async (req: Request) => {
      expect(req.headers.get('cookie')).toBe('payload-token=ADMIN')
      return new Response('ok')
    })
    await withMemberSession(seen)(new Request('http://x/api/users/me', { headers: { cookie: 'payload-token=ADMIN' } }), ctx)
    expect(seen).toHaveBeenCalled()
  })

  it('swaps the cookies for a call of the site, in and out', async () => {
    const handler = async (req: Request) => {
      expect(req.headers.get('cookie')).toBe('payload-token=MEMBER')
      expect(req.headers.has(SITE_HEADER)).toBe(false)
      const headers = new Headers()
      headers.append('set-cookie', 'payload-token=NEW; Path=/')
      return new Response('{}', { headers })
    }
    const res = await withMemberSession(handler)(
      new Request('http://x/api/members/me', {
        headers: { cookie: 'payload-token=ADMIN; notenn-member=MEMBER', [SITE_HEADER]: '1' },
      }),
      ctx,
    )
    expect(res.headers.getSetCookie()).toEqual(['notenn-member=NEW; Path=/'])
  })
})
