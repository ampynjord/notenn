import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Everything except the Payload admin and API, Next.js internals and static files.
  matcher: ['/((?!api|admin|_next|_vercel|.*\\..*).*)'],
}
