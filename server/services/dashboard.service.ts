import { TASK_STATUSES, toDateKey, type TaskStatusValue } from '../../shared/utils/tasks'
import { listTasks, type TaskView } from './task.service'

export async function getDashboard(currentUserId: number) {
  const tasks = await listTasks()

  const byStatus = Object.fromEntries(TASK_STATUSES.map((status) => [status, 0])) as Record<TaskStatusValue, number>
  for (const task of tasks) byStatus[task.effectiveStatus]++

  const overdue = tasks
    .filter((task) => task.deadlineState === 'overdue')
    .sort((a, b) => a.daysLeft - b.daysLeft)
  const dueSoon = tasks
    .filter((task) => task.deadlineState === 'soon')
    .sort((a, b) => a.daysLeft - b.daysLeft)
  const recent = [...tasks]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6)

  const mine = tasks.filter((task) => task.assignee.id === currentUserId && task.status !== 'COMPLETED')

  return {
    mine: { active: mine.length, overdue: mine.filter((task) => task.deadlineState === 'overdue').length },
    byDepartment: summarizeByDepartment(tasks),
    stats: {
      total: tasks.length,
      inProgress: byStatus.IN_PROGRESS,
      completed: byStatus.COMPLETED,
      overdue: byStatus.OVERDUE,
    },
    byStatus,
    overdue,
    dueSoon,
    recent,
  }
}

/** Per-department load and discipline: what the head of the akimat asks first. */
function summarizeByDepartment(tasks: TaskView[]) {
  const summary = new Map<number, { id: number; name: string; active: number; overdue: number; completed: number; completedOnTime: number }>()
  for (const task of tasks) {
    const row = summary.get(task.department.id)
      ?? { id: task.department.id, name: task.department.name, active: 0, overdue: 0, completed: 0, completedOnTime: 0 }
    if (task.status === 'COMPLETED') {
      row.completed++
      if (task.completedAt && toDateKey(task.completedAt) <= task.deadline) row.completedOnTime++
    } else {
      row.active++
      if (task.deadlineState === 'overdue') row.overdue++
    }
    summary.set(task.department.id, row)
  }
  return [...summary.values()].sort((a, b) => b.overdue - a.overdue || b.active - a.active)
}
