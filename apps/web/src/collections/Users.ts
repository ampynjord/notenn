import type { CollectionConfig } from 'payload'

import { adminOnly, adminOnlyField, isStaff, ROLES, staffSelfOrAdmin } from '@/lib/access'

/** Back-office accounts: the only accounts that open /admin. Site members live in `members`. */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: { fr: 'Compte du back-office', en: 'Back-office account' },
    plural: { fr: 'Comptes du back-office', en: 'Back-office accounts' },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles'],
  },
  auth: {
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  access: {
    admin: ({ req }) => isStaff(req),
    // Only administrators manage accounts; everyone else sees and edits only their own.
    create: adminOnly,
    read: staffSelfOrAdmin,
    update: staffSelfOrAdmin,
    delete: adminOnly,
  },
  hooks: {
    // The first account, created from the /admin screen, has to be an administrator: nobody
    // could grant roles otherwise. This runs before the field rules below.
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users', req })
        return totalDocs === 0 ? { ...data, roles: ['admin'] } : data
      },
    ],
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      options: ROLES.map((value) => ({
        value,
        label: {
          admin: { fr: 'Administrateur', en: 'Administrator' },
          publisher: { fr: 'Validateur (accepte les brouillons)', en: 'Publisher (accepts drafts)' },
          editor: { fr: 'Rédacteur (écrit des brouillons)', en: 'Editor (writes drafts)' },
        }[value],
      })),
      label: { fr: 'Rôles', en: 'Roles' },
      admin: {
        description: {
          fr: 'Rédacteur : propose des airs en brouillon. Validateur : peut aussi les publier. Administrateur : tout, comptes compris.',
          en: 'Editor: proposes tunes as drafts. Publisher: can also publish them. Administrator: everything, accounts included.',
        },
      },
      // Nobody grants themselves a role: only administrators write this field.
      access: { create: adminOnlyField, update: adminOnlyField },
    },
  ],
}
