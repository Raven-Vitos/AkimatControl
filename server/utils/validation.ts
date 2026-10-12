import type { H3Event } from 'h3'
import { z } from 'zod'
import { PRIORITIES, TASK_STATUSES } from '../../shared/utils/tasks'

export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата должна быть в формате ГГГГ-ММ-ДД')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
  }, 'Некорректная дата')

export const prioritySchema = z.enum(PRIORITIES, { error: 'Недопустимый приоритет' })
export const statusSchema = z.enum(TASK_STATUSES, { error: 'Недопустимый статус' })
export const idSchema = z.coerce.number({ error: 'Некорректный идентификатор' }).int().positive('Некорректный идентификатор')

/** Turns a zod failure into a 400 with a readable message. */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join('; ')
    throw createError({ statusCode: 400, message: message })
  }
  return result.data
}

const taskQuerySchema = z.object({
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  departmentId: idSchema.optional(),
  assigneeId: idSchema.optional(),
  escalated: z.literal('1').optional(),
  search: z.string().max(200).optional(),
})

/** Task list filters from the query string; shared by the list and the CSV export. */
export function parseTaskFilters(event: H3Event) {
  const { escalated, ...filters } = parseOrThrow(taskQuerySchema, getQuery(event))
  return { ...filters, escalated: escalated === '1' }
}
