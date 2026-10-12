import { getTask } from '../../services/task.service'
import { idSchema, parseOrThrow } from '../../utils/validation'

export default defineEventHandler((event) => {
  const id = parseOrThrow(idSchema, getRouterParam(event, 'id'))
  return getTask(id)
})
