import { APIError, type CollectionConfig } from 'payload'

import { isMember, ownerOnly } from '@/lib/access'

/** A library is meant for a repertoire, not for storage. */
export const MAX_ITEMS = 500
/** Imported files are kept as text (ABC, MusicXML) or base64 (MIDI, compressed MusicXML). */
export const MAX_SOURCE_CHARS = 3_000_000
const MAX_FINGERINGS_CHARS = 200_000

/**
 * A member's library: tunes added from the tune bank and their own imported files, with the
 * fingerings they changed. Private: only the owner can read it, administrators included.
 */
export const LibraryItems: CollectionConfig = {
  slug: 'library-items',
  labels: {
    singular: { fr: 'Air de bibliothèque', en: 'Library item' },
    plural: { fr: 'Bibliothèques', en: 'Libraries' },
  },
  admin: { hidden: true },
  access: {
    create: ({ req }) => isMember(req),
    read: ownerOnly,
    update: ownerOnly,
    delete: ownerOnly,
  },
  indexes: [{ fields: ['owner', 'tune'], unique: true }],
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'members',
      required: true,
      index: true,
      access: { update: () => false },
      hooks: {
        // Always the signed-in member, whatever the request says.
        beforeChange: [
          ({ req, operation, value }) =>
            operation === 'create' && isMember(req) ? req.user!.id : value,
        ],
      },
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: { fr: 'Air de la banque', en: 'Tune bank' }, value: 'tune' },
        { label: { fr: 'Fichier importé', en: 'Imported file' }, value: 'file' },
      ],
      access: { update: () => false },
    },
    { name: 'tune', type: 'relationship', relationTo: 'tunes', access: { update: () => false } },
    { name: 'title', type: 'text', required: true, maxLength: 200 },
    { name: 'fileName', type: 'text', maxLength: 255 },
    { name: 'source', type: 'textarea', maxLength: MAX_SOURCE_CHARS },
    {
      name: 'encoding',
      type: 'select',
      options: [
        { label: 'Text', value: 'text' },
        { label: 'Base64', value: 'base64' },
      ],
    },
    {
      /** Hand-made fingerings, by `<track>.<keyboard id>` then by note start. */
      name: 'fingerings',
      type: 'json',
      validate: (value: unknown) => {
        if (value == null) return true
        if (typeof value !== 'object' || Array.isArray(value)) return 'Invalid fingerings'
        return JSON.stringify(value).length <= MAX_FINGERINGS_CHARS || 'Fingerings too large'
      },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (operation !== 'create' || !data) return data
        if (data.kind === 'tune') {
          if (!data.tune) throw new APIError('library-tune-missing', 400)
          data.source = null
          data.fileName = null
          data.encoding = null
        } else {
          if (!data.source || !data.fileName) throw new APIError('library-file-missing', 400)
          data.tune = null
        }
        const { totalDocs } = await req.payload.count({
          collection: 'library-items',
          where: { owner: { equals: req.user?.id } },
          overrideAccess: true,
          req,
        })
        if (totalDocs >= MAX_ITEMS) throw new APIError('library-full', 400)
        return data
      },
    ],
  },
}
