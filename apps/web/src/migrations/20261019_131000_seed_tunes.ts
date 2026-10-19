import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { SEED_TUNES } from '../seed/tunes'

/**
 * Fills the library with the starter tunes (skipping any slug that already exists).
 * Runs with today's configuration: a field added to `tunes` later needs its column created before
 * this migration on a fresh install, or the insert below fails.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  for (const tune of SEED_TUNES) {
    const existing = await payload.find({ collection: 'tunes', where: { slug: { equals: tune.slug } }, limit: 1, req })
    if (existing.docs.length) continue
    const { notes, ...data } = tune
    const doc = await payload.create({ collection: 'tunes', locale: 'fr', data: { ...data, notes: notes.fr, licence: 'public-domain', published: true }, req })
    // Straight to the database: the full update also checks locks on every collection of the
    // current configuration, whose tables later migrations have not created yet on a fresh install.
    await payload.db.updateOne({ collection: 'tunes', id: doc.id, locale: 'en', data: { notes: notes.en }, req })
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.delete({ collection: 'tunes', where: { slug: { in: SEED_TUNES.map((t) => t.slug) } }, req })
}
