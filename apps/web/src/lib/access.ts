import type { Access, PayloadRequest } from 'payload'

/** Administrators sign in to /admin through the `users` collection. */
export const isAdmin = (req: PayloadRequest) => req.user?.collection === 'users'

/** Members sign up on the site through the `members` collection. */
export const isMember = (req: PayloadRequest) => req.user?.collection === 'members'

export const adminOnly: Access = ({ req }) => isAdmin(req)

/** A member only sees and changes their own account; administrators see all of them. */
export const selfOrAdmin: Access = ({ req }) => {
  if (isAdmin(req)) return true
  if (isMember(req)) return { id: { equals: req.user!.id } }
  return false
}

/** Private data: only its owner, never administrators. */
export const ownerOnly: Access = ({ req }) =>
  isMember(req) ? { owner: { equals: req.user!.id } } : false
