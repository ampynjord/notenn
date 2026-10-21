import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Withdraws "The Butterfly": it is credited to Tommy Potts (died 1988), so it is not in the public domain.
 * Copies saved in members' libraries go with it.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const found = await payload.find({
    collection: 'tunes',
    where: { slug: { equals: 'the-butterfly' } },
    limit: 1,
    req,
  })
  const tune = found.docs[0]
  if (!tune) return
  await payload.delete({ collection: 'library-items', where: { tune: { equals: tune.id } }, req })
  await payload.delete({ collection: 'tunes', id: tune.id, req })
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // A withdrawn work is not put back.
}
