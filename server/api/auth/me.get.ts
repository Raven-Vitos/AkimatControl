import { getSessionUser, toPublicUser } from '../../utils/auth'

/** Current user or null; public so the client can check the session without a 401. */
export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event)
  return user ? toPublicUser(user) : null
})
