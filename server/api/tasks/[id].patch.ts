import { z } from 'zod'
import { applyTaskAction, getTask, TASK_ACTIONS, updateTask } from '../../services/task.service'
import { getCurrentUser } from '../../utils/auth'
import { dateKeySchema, idSchema, parseOrThrow, prioritySchema } from '../../utils/validation'

// Either a workflow action (start, review, ...) or a change of editable fields
const patchSchema = z.union([
  z.object({
    action: z.enum(TASK_ACTIONS),
    comment: z.string().trim().max(500, 'Комментарий слишком длинный').optional(),
  }),
  z.object({ deadline: dateKeySchema.optional(), priority: prioritySchema.optional(), assigneeId: idSchema.optional() }).strict(),
])

export default defineEventHandler(async (event) => {
  const id = parseOrThrow(idSchema, getRouterParam(event, 'id'))
  const input = parseOrThrow(patchSchema, await readBody(event))
  const user = getCurrentUser(event)

  if ('action' in input) await applyTaskAction(id, input.action, user.id, input.comment || undefined)
  else await updateTask(id, input, user.id)

  return getTask(id)
})
