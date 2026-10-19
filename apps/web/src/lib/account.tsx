'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import type { LibraryItem, Member } from '@/payload-types'

export type { LibraryItem, Member }

/** An API refusal, reduced to a translation key under `account.errors`. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly key: string,
  ) {
    super(key)
  }
}

interface PayloadErrorBody {
  errors?: {
    message?: string
    name?: string
    data?: { errors?: { path?: string; message?: string }[] }
  }[]
}

/**
 * Payload's messages, always asked for in English (see `api`) so they can be recognised here;
 * the member then reads our own translated text.
 */
export function errorKey(status: number, body: PayloadErrorBody): string {
  const first = body.errors?.[0]
  const message = first?.message ?? ''
  const fields = first?.data?.errors ?? []
  if (fields.some((f) => f.message === 'password-too-short') || /invalid: password/i.test(message))
    return 'passwordShort'
  // The form already checks the address format: an address refused by the server is taken.
  if (fields.some((f) => f.path === 'email') || /invalid: email/i.test(message)) return 'emailTaken'
  if (/verify your email/i.test(message)) return 'unverified'
  if (/locked/i.test(message)) return 'locked'
  if (message === 'library-full') return 'libraryFull'
  if (/token/i.test(message)) return 'token'
  if (status === 401) return 'credentials'
  return 'generic'
}

/** JSON call to the Payload REST API with the session cookie. */
export async function api<T = unknown>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, ...rest } = init
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      'Accept-Language': 'en',
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...rest.headers,
    },
    ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
  })
  const body = (await res.json().catch(() => ({}))) as T & PayloadErrorBody
  if (!res.ok) throw new ApiError(res.status, errorKey(res.status, body))
  return body
}

interface AccountState {
  /** undefined while loading, null when signed out. */
  member: Member | null | undefined
  refresh(): Promise<void>
  logout(): Promise<void>
  /** Merges workshop settings into the account (saved a moment later). */
  saveSettings(settings: Record<string, unknown>): void
}

const AccountContext = createContext<AccountState>({
  member: undefined,
  refresh: async () => {},
  logout: async () => {},
  saveSettings: () => {},
})

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<Member | null | undefined>(undefined)

  const refresh = useCallback(
    () =>
      api<{ user: Member | null }>('/members/me')
        .then((res) => setMember(res.user ?? null))
        .catch(() => setMember(null)),
    [],
  )
  // Who is signed in, once per page load.
  useEffect(() => {
    let alive = true
    api<{ user: Member | null }>('/members/me')
      .then((res) => alive && setMember(res.user ?? null))
      .catch(() => alive && setMember(null))
    return () => {
      alive = false
    }
  }, [])

  const logout = useCallback(async () => {
    await api('/members/logout', { method: 'POST' }).catch(() => {})
    setMember(null)
  }, [])

  // Settings change in bursts (a slider): only the last value of a burst is sent.
  const [pending, setPending] = useState<Record<string, unknown> | null>(null)
  useEffect(() => {
    if (!pending || !member) return
    const timer = setTimeout(() => {
      void api(`/members/${member.id}`, { method: 'PATCH', json: { settings: pending } }).catch(
        () => {},
      )
    }, 800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, member?.id])
  const saveSettings = useCallback((settings: Record<string, unknown>) => {
    setMember((m) => (m ? { ...m, settings } : m))
    setPending(settings)
  }, [])

  return (
    <AccountContext.Provider value={{ member, refresh, logout, saveSettings }}>
      {children}
    </AccountContext.Provider>
  )
}

export const useAccount = () => useContext(AccountContext)

/** Library item as the editor needs it, with the bank tune (and its ABC) populated. */
export type FullLibraryItem = Omit<LibraryItem, 'tune'> & {
  tune?: { id: number; title: string; slug: string; abc: string } | number | null
}

export const listLibrary = () =>
  api<{ docs: FullLibraryItem[] }>(
    '/library-items?limit=500&depth=1&sort=title&select[source]=false',
  ).then((r) => r.docs)

export const getLibraryItem = (id: number | string) =>
  api<FullLibraryItem>(`/library-items/${id}?depth=1`)

export const updateLibraryItem = (id: number, data: Partial<LibraryItem>) =>
  api<{ doc: LibraryItem }>(`/library-items/${id}`, { method: 'PATCH', json: data })

/** Largest file a library keeps (before base64). */
export const MAX_FILE_BYTES = 2 * 1024 * 1024

const BINARY = /\.(mid|midi|mxl)$/i

/** Stores an imported file in the member's library. */
export async function saveFileToLibrary(file: File, title: string): Promise<LibraryItem> {
  if (file.size > MAX_FILE_BYTES) throw new ApiError(400, 'fileTooBig')
  let source: string
  let encoding: 'text' | 'base64'
  if (BINARY.test(file.name)) {
    const bytes = new Uint8Array(await file.arrayBuffer())
    let bin = ''
    for (let i = 0; i < bytes.length; i += 0x8000)
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    source = btoa(bin)
    encoding = 'base64'
  } else {
    source = await file.text()
    encoding = 'text'
  }
  const res = await api<{ doc: LibraryItem }>('/library-items', {
    method: 'POST',
    json: {
      kind: 'file',
      title: title.slice(0, 200) || file.name,
      fileName: file.name,
      source,
      encoding,
    },
  })
  return res.doc
}

/** The file a library item keeps, rebuilt so the importer reads it like a fresh upload. */
export function itemFile(item: FullLibraryItem): File | null {
  if (item.kind !== 'file' || !item.source || !item.fileName) return null
  if (item.encoding === 'base64') {
    const bin = atob(item.source)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return new File([bytes], item.fileName)
  }
  return new File([item.source], item.fileName)
}
