/** Site-wide settings that are not translations. */
export const SITE = {
  url: 'https://notenn.ampynjord.bzh',
  /** Liberapay page receiving donations. */
  donateUrl: 'https://liberapay.com/ampynjord/donate',
  contactEmail: 'contact@ampynjord.bzh',
} as const

/** Public address of the site: links in e-mails and the only origin allowed to use the session cookie. */
export const publicUrl = () => (process.env.PUBLIC_URL || SITE.url).replace(/\/$/, '')
