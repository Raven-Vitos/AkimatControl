import { getSessionUser } from '../utils/auth'

// Login, registration and the department list for the registration form are public
const PUBLIC_API = ['/api/auth/']

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0] ?? ''
  if (!path.startsWith('/api/') || PUBLIC_API.some((prefix) => path.startsWith(prefix))) return

  const user = await getSessionUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Требуется вход в систему' })
  event.context.user = user
})
