import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { SEED_TUNES } from '../seed/tunes'

/** Fills the library with the starter tunes (skipping any slug that already exists). */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  for (const tune of SEED_TUNES) {
    const existing = await payload.find({ collection: 'tunes', where: { slug: { equals: tune.slug } }, limit: 1, req })
    if (existing.docs.length) continue
    const { notes, ...data } = tune
    const doc = await payload.create({ collection: 'tunes', locale: 'fr', data: { ...data, notes: notes.fr, licence: 'public-domain', published: true }, req })
    await payload.update({ collection: 'tunes', id: doc.id, locale: 'en', data: { notes: notes.en }, req })
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.delete({ collection: 'tunes', where: { slug: { in: SEED_TUNES.map((t) => t.slug) } }, req })
}
