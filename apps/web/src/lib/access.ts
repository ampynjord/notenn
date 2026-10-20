import type { Access, FieldAccess, PayloadRequest } from 'payload'

/**
 * Roles of the back-office accounts (`users`):
 * - admin: everything, including the accounts themselves;
 * - publisher: edits tunes and validates (publishes) drafts;
 * - editor: writes drafts of tunes, but cannot publish them.
 */
export type Role = 'admin' | 'publisher' | 'editor'

export const ROLES: readonly Role[] = ['admin', 'publisher', 'editor']

/** Back-office accounts sign in to /admin through the `users` collection. */
export const isStaff = (req: PayloadRequest) => req.user?.collection === 'users'

/** Members sign up on the site through the `members` collection. */
export const isMember = (req: PayloadRequest) => req.user?.collection === 'members'

/** True if the signed-in back-office account has one of these roles. */
export function hasRole(req: PayloadRequest, ...wanted: Role[]): boolean {
  if (!isStaff(req)) return false
  const own = (req.user as { roles?: Role[] | null } | null)?.roles ?? []
  return own.some((role) => wanted.includes(role))
}

export const isAdmin = (req: PayloadRequest) => hasRole(req, 'admin')

/** Who may accept a draft: publishing is the only step a plain editor cannot do. */
export const canPublish = (req: PayloadRequest) => hasRole(req, 'admin', 'publisher')

export const adminOnly: Access = ({ req }) => isAdmin(req)

export const publishersOnly: FieldAccess = ({ req }) => canPublish(req)

export const adminOnlyField: FieldAccess = ({ req }) => isAdmin(req)

/** A member only sees and changes their own account; administrators see all of them. */
export const selfOrAdmin: Access = ({ req }) => {
  if (isAdmin(req)) return true
  if (isMember(req)) return { id: { equals: req.user!.id } }
  return false
}

/** A back-office account sees and changes only itself, unless it is an administrator. */
export const staffSelfOrAdmin: Access = ({ req }) => {
  if (isAdmin(req)) return true
  if (isStaff(req)) return { id: { equals: req.user!.id } }
  return false
}

/** Private data: only its owner, never administrators. */
export const ownerOnly: Access = ({ req }) =>
  isMember(req) ? { owner: { equals: req.user!.id } } : false
