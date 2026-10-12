import type { DeadlineState, PriorityValue, TaskStatusValue } from '../utils/tasks'

/** Task as returned by the list and dashboard API (dates are serialized to strings). */
export interface TaskRow {
  id: number
  number: number
  title: string
  status: TaskStatusValue
  effectiveStatus: TaskStatusValue
  priority: PriorityValue
  deadline: string
  daysLeft: number
  deadlineState: DeadlineState
  isEscalated: boolean
  escalatedAt: string | null
  createdAt: string
  assignee: { id: number; name: string; position: string }
  department: { id: number; name: string }
}
