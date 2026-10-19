import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload
const stamp = Date.now()
type AsUser = Parameters<Payload['find']>[0]['user']

async function makeMember(name: string) {
  const doc = await payload.create({
    collection: 'members',
    data: { email: `${name}-${stamp}@example.test`, password: 'correct horse', locale: 'fr' },
    disableVerificationEmail: true,
  })
  return { ...doc, collection: 'members' } as unknown as AsUser
}

describe('accounts and libraries', () => {
  let alice: AsUser
  let bob: AsUser
  let tuneId: number

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    alice = await makeMember('alice')
    bob = await makeMember('bob')
    const tunes = await payload.find({ collection: 'tunes', limit: 1 })
    tuneId = tunes.docs[0]!.id
  })

  afterAll(async () => {
    await payload.delete({ collection: 'members', where: { email: { like: `-${stamp}@` } } })
  })

  it('starts a new account unverified, whatever the sign-up says', async () => {
    const res = await payload.create({
      collection: 'members',
      data: {
        email: `eve-${stamp}@example.test`,
        password: 'correct horse',
        locale: 'fr',
        _verified: true,
      },
      overrideAccess: false,
      disableVerificationEmail: true,
    })
    const stored = await payload.findByID({
      collection: 'members',
      id: res.id,
      showHiddenFields: true,
    })
    expect(stored._verified).toBe(false)
  })

  it('refuses short passwords', async () => {
    await expect(
      payload.create({
        collection: 'members',
        data: { email: `short-${stamp}@example.test`, password: 'abc', locale: 'fr' },
        disableVerificationEmail: true,
      }),
    ).rejects.toThrow()
  })

  it('keeps each library private to its owner', async () => {
    const item = await payload.create({
      collection: 'library-items',
      data: { kind: 'tune', tune: tuneId, title: 'x', owner: (bob as { id: number }).id },
      user: alice,
      overrideAccess: false,
    })
    // The owner is the signed-in member, not the one named in the request.
    expect(typeof item.owner === 'object' ? item.owner.id : item.owner).toBe(
      (alice as { id: number }).id,
    )

    const seenByBob = await payload.find({
      collection: 'library-items',
      user: bob,
      overrideAccess: false,
    })
    expect(seenByBob.docs).toHaveLength(0)
    await expect(
      payload.delete({
        collection: 'library-items',
        id: item.id,
        user: bob,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    const seenByAlice = await payload.find({
      collection: 'library-items',
      user: alice,
      overrideAccess: false,
    })
    expect(seenByAlice.docs.map((d) => d.id)).toContain(item.id)
  })

  it('adds a bank tune only once', async () => {
    await expect(
      payload.create({
        collection: 'library-items',
        data: { kind: 'tune', tune: tuneId, title: 'x' } as never,
        user: alice,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('keeps visitors and members away from the tune bank, the media and other accounts', async () => {
    await expect(
      payload.create({
        collection: 'library-items',
        data: { kind: 'tune', tune: tuneId, title: 'x' } as never,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    await expect(
      payload.update({
        collection: 'tunes',
        id: tuneId,
        data: { title: 'hacked' },
        user: alice,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    const others = await payload.find({ collection: 'members', user: alice, overrideAccess: false })
    expect(others.docs.map((d) => d.id)).toEqual([(alice as { id: number }).id])
    await expect(
      payload.find({ collection: 'users', user: alice, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('erases the library with the account', async () => {
    const carol = await makeMember('carol')
    await payload.create({
      collection: 'library-items',
      data: {
        kind: 'file',
        title: 'Mine',
        fileName: 'mine.abc',
        source: 'X:1\nK:C\nC',
        encoding: 'text',
      } as never,
      user: carol,
      overrideAccess: false,
    })
    await payload.delete({
      collection: 'members',
      id: (carol as { id: number }).id,
      user: carol,
      overrideAccess: false,
    })
    const left = await payload.count({
      collection: 'library-items',
      where: { owner: { equals: (carol as { id: number }).id } },
    })
    expect(left.totalDocs).toBe(0)
  })
})
