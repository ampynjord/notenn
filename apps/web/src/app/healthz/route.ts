import { payloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/**
 * Health check for Docker and the deployment: the server answers, the database is reachable
 * and its migrations have run (the tunes table exists).
 */
export async function GET() {
  try {
    const payload = await payloadClient()
    await payload.count({ collection: 'tunes' })
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
