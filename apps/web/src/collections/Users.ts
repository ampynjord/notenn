import type { CollectionConfig } from 'payload'

import { adminOnly, isAdmin } from '@/lib/access'

/** Administrators: the only accounts that open /admin. Site members live in `members`. */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: { fr: 'Administrateur', en: 'Administrator' },
    plural: { fr: 'Administrateurs', en: 'Administrators' },
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  // The first administrator is created from the /admin screen, which does not go through these rules.
  access: {
    admin: ({ req }) => isAdmin(req),
    create: adminOnly,
    read: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [],
}
