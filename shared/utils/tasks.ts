export const TASK_STATUSES = ['NEW', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'OVERDUE'] as const
export type TaskStatusValue = (typeof TASK_STATUSES)[number]

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type PriorityValue = (typeof PRIORITIES)[number]

export const STATUS_LABELS: Record<TaskStatusValue, string> = {
  NEW: 'Новое',
  IN_PROGRESS: 'В работе',
  REVIEW: 'На проверке',
  COMPLETED: 'Выполнено',
  OVERDUE: 'Просрочено',
}

export const PRIORITY_LABELS: Record<PriorityValue, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  CRITICAL: 'Критический',
}

export const SOON_DAYS = 3
const DAY_MS = 24 * 60 * 60 * 1000

export type DeadlineState = 'done' | 'ok' | 'soon' | 'overdue'

/** Local calendar date as YYYY-MM-DD. */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Deadlines are stored as UTC midnight of the calendar date. */
export function dateKeyToDeadline(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`)
}

export function deadlineToDateKey(deadline: Date | string): string {
  return new Date(deadline).toISOString().slice(0, 10)
}

export function daysUntil(deadline: Date | string, today: Date = new Date()): number {
  const deadlineDay = dateKeyToDeadline(deadlineToDateKey(deadline)).getTime()
  const todayDay = dateKeyToDeadline(toDateKey(today)).getTime()
  return Math.round((deadlineDay - todayDay) / DAY_MS)
}

export function getDeadlineState(status: string, deadline: Date | string, today: Date = new Date()): DeadlineState {
  if (status === 'COMPLETED') return 'done'
  const daysLeft = daysUntil(deadline, today)
  if (daysLeft < 0) return 'overdue'
  if (daysLeft <= SOON_DAYS) return 'soon'
  return 'ok'
}

export function pluralDays(count: number): string {
  const n = Math.abs(count) % 100
  const last = n % 10
  if (n > 10 && n < 20) return `${count} дней`
  if (last === 1) return `${count} день`
  if (last >= 2 && last <= 4) return `${count} дня`
  return `${count} дней`
}

/** Status shown to the user: an unfinished task past its deadline is overdue regardless of its stage. */
export function getEffectiveStatus(status: string, deadline: Date | string, today: Date = new Date()): TaskStatusValue {
  if (getDeadlineState(status, deadline, today) === 'overdue') return 'OVERDUE'
  return status as TaskStatusValue
}

export function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(value: Date | string): string {
  return new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatDeadline(deadline: Date | string): string {
  const [year, month, day] = deadlineToDateKey(deadline).split('-')
  return `${day}.${month}.${year}`
}
