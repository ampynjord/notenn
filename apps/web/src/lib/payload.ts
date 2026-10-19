import config from '@payload-config'
import { getPayload } from 'payload'

import type { Tune } from '@/payload-types'

export type { Tune }

export async function payloadClient() {
  return getPayload({ config })
}

export interface TuneFilters {
  q?: string
  region?: string
  kind?: string
  level?: string
}

/** Published library tunes, filtered, in the reader's language. */
export async function findTunes(locale: 'fr' | 'en', filters: TuneFilters = {}): Promise<Tune[]> {
  const payload = await payloadClient()
  const and: Record<string, unknown>[] = [{ published: { equals: true } }]
  if (filters.q) and.push({ or: [{ title: { like: filters.q } }, { origin: { like: filters.q } }] })
  for (const k of ['region', 'kind', 'level'] as const) if (filters[k]) and.push({ [k]: { equals: filters[k] } })
  const res = await payload.find({ collection: 'tunes', locale, where: { and } as never, limit: 500, sort: 'title', overrideAccess: false })
  return res.docs
}

export async function findTune(locale: 'fr' | 'en', slug: string): Promise<Tune | null> {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'tunes',
    locale,
    where: { and: [{ slug: { equals: slug } }, { published: { equals: true } }] },
    limit: 1,
    overrideAccess: false,
  })
  return res.docs[0] ?? null
}
