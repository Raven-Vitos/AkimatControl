import { listTasks } from '../../services/task.service'
import { parseTaskFilters } from '../../utils/validation'

export default defineEventHandler((event) => listTasks(parseTaskFilters(event)))
