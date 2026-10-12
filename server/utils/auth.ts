import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { prisma } from './db'

const SESSION_COOKIE = 'akimat_session'
const SESSION_DAYS = 7

export async function startSession(event: H3Event, userId: number) {
  const id = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await prisma.session.create({ data: { id, userId, expiresAt } })
  setCookie(event, SESSION_COOKIE, id, { httpOnly: true, sameSite: 'lax', path: '/', expires: expiresAt })
}

export async function endSession(event: H3Event) {
  const id = getCookie(event, SESSION_COOKIE)
  if (id) await prisma.session.deleteMany({ where: { id } })
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

/** User of the current request, or null if the session is missing or expired. */
export async function getSessionUser(event: H3Event) {
  const id = getCookie(event, SESSION_COOKIE)
  if (!id) return null
  const session = await prisma.session.findUnique({ where: { id }, include: { user: { include: { department: true } } } })
  if (!session || session.expiresAt < new Date()) return null
  return session.user
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>

/** Set by server/middleware/auth.ts for every protected /api route. */
export function getCurrentUser(event: H3Event): SessionUser {
  const user = event.context.user as SessionUser | undefined
  if (!user) throw createError({ statusCode: 401, message: 'Требуется вход в систему' })
  return user
}

export function toPublicUser(user: SessionUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    position: user.position,
    department: { id: user.department.id, name: user.department.name },
  }
}
