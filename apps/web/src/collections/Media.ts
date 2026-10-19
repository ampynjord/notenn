import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    // Dossier persistant en production (volume Docker), dossier local en développement.
    staticDir: process.env.MEDIA_DIR || 'media',
  },
}
