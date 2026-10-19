import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { en } from '@payloadcms/translations/languages/en'
import { fr } from '@payloadcms/translations/languages/fr'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Tunes } from './collections/Tunes'
import { Members } from './collections/Members'
import { LibraryItems } from './collections/LibraryItems'
import { publicUrl } from './lib/site'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Tunes, Media, Members, LibraryItems, Users],
  serverURL: publicUrl(),
  // The session cookie is only accepted from the site itself.
  csrf: [publicUrl()],
  // Without a Resend key (development), e-mails are written to the server log instead of being sent.
  ...(process.env.RESEND_API_KEY
    ? {
        email: resendAdapter({
          apiKey: process.env.RESEND_API_KEY,
          defaultFromAddress: process.env.EMAIL_FROM || 'notenn@ampynjord.bzh',
          defaultFromName: 'Notenn',
        }),
      }
    : {}),
  // Content in both interface languages; the administration itself in French or English.
  localization: { locales: ['fr', 'en'], defaultLocale: 'fr', fallback: true },
  i18n: { supportedLanguages: { fr, en }, fallbackLanguage: 'fr' },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // In development the schema follows the code (push); in production migrations run at startup.
    prodMigrations: migrations,
  }),
  sharp,
  plugins: [],
})
