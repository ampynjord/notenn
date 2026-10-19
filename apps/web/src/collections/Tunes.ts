import type { CollectionConfig } from 'payload'

/** Library tunes: public-domain or traditional melodies in ABC notation, curated in the admin. */
export const Tunes: CollectionConfig = {
  slug: 'tunes',
  labels: { singular: { en: 'Tune', fr: 'Air' }, plural: { en: 'Tunes', fr: 'Airs' } },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'region', 'kind', 'level', 'published'],
  },
  access: {
    // Visitors only see published tunes; editing is for signed-in administrators.
    read: ({ req }) => (req.user ? true : { published: { equals: true } }),
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
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
      admin: { description: { en: 'Lower case, dashes: auld-lang-syne', fr: 'Minuscules et tirets : auld-lang-syne' } },
      validate: (value: unknown) => (typeof value === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) || 'a-z, 0-9, -',
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
      admin: { description: { en: 'e.g. Traditional, or Ludwig van Beethoven, 1824', fr: 'Par exemple : Traditional, ou Ludwig van Beethoven, 1824' } },
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
    { name: 'notes', type: 'textarea', localized: true, label: { en: 'Short description', fr: 'Courte présentation' } },
    {
      name: 'abc',
      type: 'code',
      required: true,
      label: { en: 'Melody (ABC notation)', fr: 'Mélodie (notation ABC)' },
      admin: { language: 'plaintext' },
    },
    { name: 'published', type: 'checkbox', defaultValue: true, label: { en: 'Published', fr: 'Publié' }, admin: { position: 'sidebar' } },
  ],
}
