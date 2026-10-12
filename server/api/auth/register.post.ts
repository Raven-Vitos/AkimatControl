import { z } from 'zod'
import { prisma } from '../../utils/db'
import { startSession, toPublicUser } from '../../utils/auth'
import { hashPassword } from '../../utils/password'
import { idSchema, parseOrThrow } from '../../utils/validation'

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Укажите имя').max(100),
    email: z.string().trim().toLowerCase().email('Некорректный email'),
    password: z.string().min(6, 'Пароль должен содержать не менее 6 символов').max(200),
    passwordConfirm: z.string(),
    departmentId: idSchema,
  })
  .refine((input) => input.password === input.passwordConfirm, { message: 'Пароли не совпадают' })

export default defineEventHandler(async (event) => {
  const input = parseOrThrow(registerSchema, await readBody(event))

  const department = await prisma.department.findUnique({ where: { id: input.departmentId } })
  if (!department) throw createError({ statusCode: 400, message: 'Подразделение не найдено' })
  if (await prisma.user.findUnique({ where: { email: input.email } })) {
    throw createError({ statusCode: 409, message: 'Пользователь с таким email уже зарегистрирован' })
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: 'EMPLOYEE',
      position: 'Специалист',
      departmentId: department.id,
      passwordHash: await hashPassword(input.password),
    },
    include: { department: true },
  })
  await startSession(event, user.id)
  setResponseStatus(event, 201)
  return toPublicUser(user)
})
