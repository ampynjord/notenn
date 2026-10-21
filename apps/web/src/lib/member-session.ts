/**
 * Payload keeps one session cookie per site (`payload-token`), shared by every auth collection: signing in
 * on the site would sign the administrator out of the back office and the other way round. Calls made by
 * the site itself carry a marker header; for those only, the session cookie is renamed on the way in and
 * out, so members get their own cookie and the back office keeps the standard one.
 */
export const SITE_HEADER = 'x-notenn-site'
export const MEMBER_COOKIE = 'notenn-member'
const PAYLOAD_COOKIE = 'payload-token'

/** Request cookies as Payload must see them: the member cookie stands in for the session, the back-office one is hidden. */
export function toPayloadCookies(cookie: string | null): string {
  const kept: string[] = []
  for (const part of (cookie ?? '').split(';')) {
    const pair = part.trim()
    if (!pair) continue
    const name = pair.slice(0, pair.indexOf('='))
    if (name === PAYLOAD_COOKIE) continue
    kept.push(name === MEMBER_COOKIE ? `${PAYLOAD_COOKIE}${pair.slice(name.length)}` : pair)
  }
  return kept.join('; ')
}

/** Cookies Payload sets (or expires), given the member name. */
export function toMemberSetCookie(setCookie: string): string {
  return setCookie.startsWith(`${PAYLOAD_COOKIE}=`)
    ? `${MEMBER_COOKIE}${setCookie.slice(PAYLOAD_COOKIE.length)}`
    : setCookie
}

type Context = { params: Promise<{ slug?: string[] }> }
type Handler = (request: Request, context: Context) => Promise<Response>

export function withMemberSession(handler: Handler): Handler {
  return async (request, context) => {
    if (!request.headers.has(SITE_HEADER)) return handler(request, context)

    const headers = new Headers(request.headers)
    headers.delete(SITE_HEADER)
    headers.delete('authorization')
    const cookie = toPayloadCookies(request.headers.get('cookie'))
    if (cookie) headers.set('cookie', cookie)
    else headers.delete('cookie')

    const response = await handler(new Request(request, { headers }), context)

    const out = new Headers(response.headers)
    const cookies = response.headers.getSetCookie()
    if (cookies.length) {
      out.delete('set-cookie')
      for (const c of cookies) out.append('set-cookie', toMemberSetCookie(c))
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: out })
  }
}
