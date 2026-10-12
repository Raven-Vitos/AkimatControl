import { z } from 'zod'
import { prisma } from '../../utils/db'
import { startSession, toPublicUser } from '../../utils/auth'
import { verifyPassword } from '../../utils/password'
import { parseOrThrow } from '../../utils/validation'

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

export default defineEventHandler(async (event) => {
  const { email, password } = parseOrThrow(loginSchema, await readBody(event))
  const user = await prisma.user.findUnique({ where: { email }, include: { department: true } })
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw createError({ statusCode: 401, message: 'Неверный email или пароль' })
  }
  await startSession(event, user.id)
  return toPublicUser(user)
})
