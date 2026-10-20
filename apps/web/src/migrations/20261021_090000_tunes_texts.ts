import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { SEED_TUNES } from '../seed/tunes'

/**
 * Replaces the one-line descriptions of the starter tunes with fuller texts (history, key, tempo),
 * in both languages. A fresh install gets its English texts here too: the seed migration cannot
 * write them (see the note there).
 * Any edit made to these descriptions in the admin is overwritten.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  for (const tune of SEED_TUNES) {
    const existing = await payload.find({ collection: 'tunes', where: { slug: { equals: tune.slug } }, limit: 1, req })
    const doc = existing.docs[0]
    if (!doc) continue
    // The regular update is safe here: every table of the current configuration exists by now.
    for (const locale of ['fr', 'en'] as const) {
      await payload.update({ collection: 'tunes', id: doc.id, locale, data: { notes: tune.notes[locale] }, req })
    }
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // The previous one-line descriptions are not kept: nothing to restore.
}
