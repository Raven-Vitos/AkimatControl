import { z } from 'zod'
import { createTask } from '../../services/task.service'
import { getCurrentUser } from '../../utils/auth'
import { dateKeySchema, idSchema, parseOrThrow, prioritySchema } from '../../utils/validation'

const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Название не может быть пустым').max(200),
  description: z.string().trim().max(5000).default(''),
  departmentId: idSchema,
  assigneeId: idSchema,
  deadline: dateKeySchema,
  priority: prioritySchema,
})

export default defineEventHandler(async (event) => {
  const input = parseOrThrow(createTaskSchema, await readBody(event))
  const user = getCurrentUser(event)
  const task = await createTask(input, user.id)
  setResponseStatus(event, 201)
  return { id: task.id, number: task.number }
})
