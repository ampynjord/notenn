import { adminOnly, canPublish, hasRole, isStaff, publishersOnly } from '@/lib/access'
import type { Access, CollectionConfig } from 'payload'

/** Editors may only change drafts; publishers and administrators may change anything. */
const updateTunes: Access = ({ req }) => {
  if (hasRole(req, 'admin', 'publisher')) return true
  if (hasRole(req, 'editor')) return { published: { equals: false } }
  return false
}

/**
 * Library tunes: public-domain or traditional melodies in ABC notation, curated in the admin.
 * A tune is a draft until a publisher or an administrator ticks "Published".
 */
export const Tunes: CollectionConfig = {
  slug: 'tunes',
  labels: { singular: { en: 'Tune', fr: 'Air' }, plural: { en: 'Tunes', fr: 'Airs' } },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'region', 'kind', 'level', 'published'],
  },
  access: {
    // Visitors and members only see published tunes; the back office also sees the drafts.
    read: ({ req }) => (isStaff(req) ? true : { published: { equals: true } }),
    create: ({ req }) => hasRole(req, 'admin', 'publisher', 'editor'),
    update: updateTunes,
    delete: adminOnly,
  },
  hooks: {
    // Whatever an editor sends, a new tune starts as a draft. Trusted code with no signed-in account
    // (the seed migrations) is left alone: it decides by itself whether a tune is published.
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && isStaff(req) && !canPublish(req)) return { ...data, published: false }
        return data
      },
    ],
  },
  defaultSort: 'title',
  fields: [
    { name: 'title', type: 'text', required: true, label: { en: 'Title', fr: 'Titre' } },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: { en: 'Address', fr: 'Adresse' },
      admin: {
        description: {
          en: 'Lower case, dashes: auld-lang-syne',
          fr: 'Minuscules et tirets : auld-lang-syne',
        },
      },
      validate: (value: unknown) =>
        (typeof value === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) || 'a-z, 0-9, -',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'region',
          type: 'select',
          required: true,
          label: { en: 'Origin', fr: 'Origine' },
          options: [
            { value: 'brittany', label: { en: 'Brittany', fr: 'Bretagne' } },
            { value: 'france', label: { en: 'France', fr: 'France' } },
            { value: 'ireland', label: { en: 'Ireland', fr: 'Irlande' } },
            { value: 'scotland', label: { en: 'Scotland', fr: 'Écosse' } },
            { value: 'england', label: { en: 'England', fr: 'Angleterre' } },
            { value: 'germany', label: { en: 'Germany', fr: 'Allemagne' } },
            { value: 'usa', label: { en: 'United States', fr: 'États-Unis' } },
            { value: 'international', label: { en: 'International', fr: 'International' } },
          ],
        },
        {
          name: 'kind',
          type: 'select',
          required: true,
          label: { en: 'Kind', fr: 'Genre' },
          options: [
            { value: 'air', label: { en: 'Air', fr: 'Air' } },
            { value: 'song', label: { en: 'Song', fr: 'Chanson' } },
            { value: 'childrens-song', label: { en: "Children's song", fr: 'Comptine' } },
            { value: 'dance', label: { en: 'Dance', fr: 'Danse' } },
            { value: 'jig', label: { en: 'Jig', fr: 'Gigue' } },
            { value: 'slip-jig', label: { en: 'Slip jig', fr: 'Slip jig' } },
            { value: 'reel', label: { en: 'Reel', fr: 'Reel' } },
            { value: 'march', label: { en: 'March', fr: 'Marche' } },
            { value: 'waltz', label: { en: 'Waltz', fr: 'Valse' } },
            { value: 'shanty', label: { en: 'Sea shanty', fr: 'Chant de marins' } },
            { value: 'lullaby', label: { en: 'Lullaby', fr: 'Berceuse' } },
            { value: 'spiritual', label: { en: 'Spiritual', fr: 'Spiritual' } },
            { value: 'classical', label: { en: 'Classical', fr: 'Classique' } },
          ],
        },
        {
          name: 'level',
          type: 'select',
          required: true,
          label: { en: 'Level', fr: 'Niveau' },
          options: [
            { value: 'beginner', label: { en: 'Beginner', fr: 'Débutant' } },
            { value: 'intermediate', label: { en: 'Intermediate', fr: 'Intermédiaire' } },
            { value: 'advanced', label: { en: 'Advanced', fr: 'Avancé' } },
          ],
        },
      ],
    },
    {
      name: 'origin',
      type: 'text',
      required: true,
      label: { en: 'Composer or tradition', fr: 'Compositeur ou tradition' },
      admin: {
        description: {
          en: 'e.g. Traditional, or Ludwig van Beethoven, 1824',
          fr: 'Par exemple : Traditional, ou Ludwig van Beethoven, 1824',
        },
      },
    },
    {
      name: 'licence',
      type: 'select',
      required: true,
      defaultValue: 'public-domain',
      label: { en: 'Rights', fr: 'Droits' },
      options: [
        { value: 'public-domain', label: { en: 'Public domain', fr: 'Domaine public' } },
        { value: 'free-licence', label: { en: 'Free licence', fr: 'Licence libre' } },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      localized: true,
      label: { en: 'Short description', fr: 'Courte présentation' },
    },
    {
      name: 'abc',
      type: 'code',
      required: true,
      label: { en: 'Melody (ABC notation)', fr: 'Mélodie (notation ABC)' },
      admin: { language: 'plaintext' },
    },
    {
      name: 'published',
      type: 'checkbox',
      // A new tune is a draft: only a publisher or an administrator can accept it.
      defaultValue: false,
      label: { en: 'Published', fr: 'Publié' },
      access: { create: publishersOnly, update: publishersOnly },
      admin: {
        position: 'sidebar',
        description: {
          en: 'A draft until this is ticked. Only publishers and administrators can tick it.',
          fr: 'Un brouillon tant que la case n’est pas cochée. Seuls les validateurs et les administrateurs peuvent la cocher.',
        },
      },
    },
  ],
}
