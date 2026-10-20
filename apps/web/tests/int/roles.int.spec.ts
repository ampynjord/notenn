import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload
const stamp = Date.now()
type AsUser = Parameters<Payload['find']>[0]['user']
type Role = 'admin' | 'publisher' | 'editor'

async function makeStaff(name: string, roles: Role[]) {
  const doc = await payload.create({
    collection: 'users',
    data: { email: `${name}-${stamp}@example.test`, password: 'correct horse', roles },
  })
  return { ...doc, collection: 'users' } as unknown as AsUser
}

const tuneData = (slug: string, published?: boolean) => ({
  title: slug,
  slug: `${slug}-${stamp}`,
  region: 'brittany' as const,
  kind: 'song' as const,
  level: 'beginner' as const,
  origin: 'Traditional',
  licence: 'public-domain' as const,
  abc: 'X:1\nT:t\nM:4/4\nL:1/4\nK:C\nCDEF|',
  ...(published === undefined ? {} : { published }),
})

describe('drafts and roles', () => {
  it('makes the very first account an administrator, whatever role it asks for', async () => {
    payload = await getPayload({ config: await config })
    const { totalDocs } = await payload.count({ collection: 'users' })
    // Only meaningful on an empty database (CI); elsewhere the rule cannot be observed.
    if (totalDocs > 0) return
    const first = await payload.create({
      collection: 'users',
      data: { email: `first-${stamp}@example.test`, password: 'correct horse', roles: ['editor'] },
    })
    expect(first.roles).toEqual(['admin'])
  })

  let editor: AsUser
  let publisher: AsUser
  let admin: AsUser
  let draftId: number

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    // The very first account of an empty database is made an administrator whatever it asks for
    // (see Users.ts), so the administrator has to come first or the editor below would become one.
    admin = await makeStaff('admin', ['admin'])
    editor = await makeStaff('editor', ['editor'])
    publisher = await makeStaff('publisher', ['publisher'])
  })

  afterAll(async () => {
    await payload.delete({ collection: 'tunes', where: { slug: { like: `-${stamp}` } } })
    await payload.delete({ collection: 'users', where: { email: { like: `-${stamp}@` } } })
  })

  it('starts a tune written by an editor as a draft, whatever the form says', async () => {
    const tune = await payload.create({
      collection: 'tunes',
      data: tuneData('proposed', true),
      user: editor,
      overrideAccess: false,
    })
    draftId = tune.id
    expect(tune.published).toBe(false)
  })

  it('leaves trusted code with no signed-in account free to publish (the seed migrations)', async () => {
    const tune = await payload.create({ collection: 'tunes', data: tuneData('seeded', true) })
    expect(tune.published).toBe(true)
  })

  it('does not let an editor publish a draft', async () => {
    const tune = await payload.update({
      collection: 'tunes',
      id: draftId,
      data: { published: true, title: 'still a draft' },
      user: editor,
      overrideAccess: false,
    })
    expect(tune.title).toBe('still a draft')
    expect(tune.published).toBe(false)
  })

  it('keeps drafts out of sight of visitors, but not of the back office', async () => {
    const visitors = await payload.find({
      collection: 'tunes',
      where: { slug: { equals: `proposed-${stamp}` } },
      overrideAccess: false,
    })
    expect(visitors.docs).toHaveLength(0)
    const staff = await payload.find({
      collection: 'tunes',
      where: { slug: { equals: `proposed-${stamp}` } },
      user: editor,
      overrideAccess: false,
    })
    expect(staff.docs).toHaveLength(1)
  })

  it('lets a publisher accept the draft', async () => {
    const tune = await payload.update({
      collection: 'tunes',
      id: draftId,
      data: { published: true },
      user: publisher,
      overrideAccess: false,
    })
    expect(tune.published).toBe(true)
    const visitors = await payload.find({
      collection: 'tunes',
      where: { slug: { equals: `proposed-${stamp}` } },
      overrideAccess: false,
    })
    expect(visitors.docs).toHaveLength(1)
  })

  it('does not let an editor change a tune once it is published', async () => {
    await expect(
      payload.update({
        collection: 'tunes',
        id: draftId,
        data: { title: 'sneaky edit' },
        user: editor,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('lets only an administrator delete a tune', async () => {
    await expect(
      payload.delete({ collection: 'tunes', id: draftId, user: publisher, overrideAccess: false }),
    ).rejects.toThrow()
    await payload.delete({ collection: 'tunes', id: draftId, user: admin, overrideAccess: false })
  })

  it('lets only an administrator create accounts', async () => {
    await expect(
      payload.create({
        collection: 'users',
        data: { email: `intruder-${stamp}@example.test`, password: 'correct horse', roles: ['admin'] },
        user: editor,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('shows an editor only their own account', async () => {
    const seen = await payload.find({ collection: 'users', user: editor, overrideAccess: false })
    expect(seen.docs.map((u) => u.email)).toEqual([`editor-${stamp}@example.test`])
    const all = await payload.find({ collection: 'users', user: admin, overrideAccess: false })
    expect(all.docs.length).toBeGreaterThanOrEqual(3)
  })

  it('does not let anyone give themselves a role', async () => {
    const me = await payload.update({
      collection: 'users',
      id: (editor as { id: number }).id,
      data: { roles: ['admin'] },
      user: editor,
      overrideAccess: false,
    })
    expect(me.roles).toEqual(['editor'])
  })
})
