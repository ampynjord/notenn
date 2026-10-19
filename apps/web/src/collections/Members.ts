import { type CollectionConfig, ValidationError } from 'payload'

import { emailHtml, emailSubject } from '@/email/templates'
import { isAdmin, selfOrAdmin } from '@/lib/access'

const MIN_PASSWORD = 8
/** Workshop settings are a small object; anything bigger is not ours. */
const MAX_SETTINGS_BYTES = 4000

/** People who sign up on the site to keep a library. They never reach the administration. */
export const Members: CollectionConfig = {
  slug: 'members',
  labels: {
    singular: { fr: 'Membre', en: 'Member' },
    plural: { fr: 'Membres', en: 'Members' },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', '_verified', 'locale', 'createdAt'],
  },
  auth: {
    verify: {
      generateEmailSubject: ({ user }) => emailSubject('verify', user),
      generateEmailHTML: ({ token, user }) => emailHtml('verify', user, token),
    },
    forgotPassword: {
      generateEmailSubject: (args) => emailSubject('reset', args?.user),
      generateEmailHTML: (args) => emailHtml('reset', args?.user, args?.token ?? ''),
    },
    maxLoginAttempts: 8,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 30 * 24 * 60 * 60,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  access: {
    // Anyone may sign up; the account is unusable until the e-mail address is confirmed.
    create: () => true,
    read: selfOrAdmin,
    update: selfOrAdmin,
    delete: selfOrAdmin,
    unlock: ({ req }) => isAdmin(req),
  },
  fields: [
    {
      name: 'locale',
      type: 'select',
      label: { fr: 'Langue des e-mails', en: 'E-mail language' },
      options: [
        { label: 'Français', value: 'fr' },
        { label: 'English', value: 'en' },
      ],
      defaultValue: 'fr',
      required: true,
    },
    {
      name: 'settings',
      type: 'json',
      label: { fr: 'Réglages de l’atelier', en: 'Workshop settings' },
      validate: (value: unknown) => {
        if (value == null) return true
        if (typeof value !== 'object' || Array.isArray(value)) return 'Invalid settings'
        return JSON.stringify(value).length <= MAX_SETTINGS_BYTES || 'Settings too large'
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (typeof data?.password === 'string' && data.password.length < MIN_PASSWORD)
          throw new ValidationError({
            errors: [{ path: 'password', message: 'password-too-short' }],
          })
        return data
      },
    ],
    beforeChange: [
      ({ data, operation, originalDoc, req }) => {
        if (isAdmin(req)) return data
        // Only the link sent by e-mail confirms an address; a member cannot change it by hand for now.
        if (operation === 'create') data._verified = false
        else {
          data._verified = originalDoc?._verified
          data.email = originalDoc?.email
        }
        return data
      },
    ],
    beforeDelete: [
      // Closing an account removes everything it kept (before the account, which the items point to).
      async ({ id, req }) => {
        await req.payload.delete({
          collection: 'library-items',
          where: { owner: { equals: id } },
          overrideAccess: true,
          req,
        })
      },
    ],
  },
}
