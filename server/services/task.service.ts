import type { HistoryAction, Prisma, TaskStatus } from '../generated/prisma/client'
import { prisma } from '../utils/db'
import {
  dateKeyToDeadline,
  daysUntil,
  formatDeadline,
  getDeadlineState,
  getEffectiveStatus,
  PRIORITY_LABELS,
  toDateKey,
  type PriorityValue,
  type TaskStatusValue,
} from '../../shared/utils/tasks'

const taskInclude = {
  assignee: { select: { id: true, name: true, position: true } },
  department: { select: { id: true, name: true } },
} satisfies Prisma.TaskInclude

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>

function toTaskView(task: TaskWithRelations, today = new Date()) {
  return {
    ...task,
    deadline: task.deadline.toISOString().slice(0, 10),
    daysLeft: daysUntil(task.deadline, today),
    deadlineState: getDeadlineState(task.status, task.deadline, today),
    effectiveStatus: getEffectiveStatus(task.status, task.deadline, today),
    isEscalated: task.escalatedAt !== null,
  }
}

export type TaskView = ReturnType<typeof toTaskView>

/**
 * There is no background scheduler: overdue tasks are detected whenever tasks are read,
 * and the "overdue" event is written to history once.
 */
export async function recordOverdueTasks() {
  const today = dateKeyToDeadline(toDateKey(new Date()))
  const newlyOverdue = await prisma.task.findMany({
    where: {
      status: { not: 'COMPLETED' },
      deadline: { lt: today },
      history: { none: { action: 'OVERDUE' } },
    },
    select: { id: true, deadline: true, updatedAt: true },
  })
  if (newlyOverdue.length === 0) return

  await prisma.taskHistory.createMany({
    data: newlyOverdue.map((task) => ({
      taskId: task.id,
      action: 'OVERDUE' as const,
      description: 'Поручение просрочено',
      // Not earlier than the last change, so a deadline moved into the past is logged after that change
      createdAt: new Date(Math.max(task.deadline.getTime() + 24 * 60 * 60 * 1000, task.updatedAt.getTime())),
    })),
  })
}

export interface TaskFilters {
  status?: TaskStatusValue
  priority?: PriorityValue
  departmentId?: number
  assigneeId?: number
  escalated?: boolean
  search?: string
}

export async function listTasks(filters: TaskFilters = {}) {
  await recordOverdueTasks()
  const tasks = await prisma.task.findMany({
    where: {
      priority: filters.priority,
      departmentId: filters.departmentId,
      assigneeId: filters.assigneeId,
      escalatedAt: filters.escalated ? { not: null } : undefined,
    },
    include: taskInclude,
    orderBy: { number: 'desc' },
  })

  // Status and search are filtered here: status is derived from the deadline,
  // and SQLite LIKE is case-sensitive for Cyrillic
  const search = filters.search?.trim().toLowerCase()
  return tasks
    .map((task) => toTaskView(task))
    .filter((task) => !filters.status || task.effectiveStatus === filters.status)
    .filter((task) => !search || task.title.toLowerCase().includes(search) || String(task.number).includes(search))
}

export async function getTask(id: number) {
  await recordOverdueTasks()
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      ...taskInclude,
      createdBy: { select: { id: true, name: true } },
      history: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      },
    },
  })
  if (!task) throw createError({ statusCode: 404, message: 'Поручение не найдено' })
  return { ...toTaskView(task), createdBy: task.createdBy, history: task.history }
}

async function assertAssigneeInDepartment(assigneeId: number, departmentId: number) {
  const department = await prisma.department.findUnique({ where: { id: departmentId } })
  if (!department) throw createError({ statusCode: 400, message: 'Подразделение не найдено' })

  const assignee = await prisma.user.findUnique({ where: { id: assigneeId } })
  if (!assignee) throw createError({ statusCode: 400, message: 'Ответственный не найден' })
  if (assignee.departmentId !== departmentId) {
    throw createError({ statusCode: 400, message: 'Ответственный не относится к выбранному подразделению' })
  }
  return assignee
}

export interface CreateTaskInput {
  title: string
  description: string
  departmentId: number
  assigneeId: number
  deadline: string
  priority: PriorityValue
}

export async function createTask(input: CreateTaskInput, userId: number) {
  const assignee = await assertAssigneeInDepartment(input.assigneeId, input.departmentId)
  const last = await prisma.task.findFirst({ orderBy: { number: 'desc' }, select: { number: true } })

  const task = await prisma.task.create({
    data: {
      number: (last?.number ?? 100) + 1,
      title: input.title,
      description: input.description,
      priority: input.priority,
      deadline: dateKeyToDeadline(input.deadline),
      departmentId: input.departmentId,
      assigneeId: input.assigneeId,
      createdById: userId,
      history: {
        create: [
          { action: 'CREATED', description: 'Поручение создано', userId },
          { action: 'ASSIGNED', description: `Назначен исполнитель: ${assignee.name}`, userId },
        ],
      },
    },
  })
  return task
}

export const TASK_ACTIONS = ['start', 'review', 'return', 'complete', 'escalate'] as const
export type TaskAction = (typeof TASK_ACTIONS)[number]

const STATUS_TRANSITIONS: Record<Exclude<TaskAction, 'escalate'>, { from: TaskStatus; to: TaskStatus; history: HistoryAction; description: string }> = {
  start: { from: 'NEW', to: 'IN_PROGRESS', history: 'STARTED', description: 'Работа начата' },
  review: { from: 'IN_PROGRESS', to: 'REVIEW', history: 'SENT_TO_REVIEW', description: 'Поручение отправлено на проверку' },
  return: { from: 'REVIEW', to: 'IN_PROGRESS', history: 'RETURNED', description: 'Поручение возвращено на доработку' },
  complete: { from: 'REVIEW', to: 'COMPLETED', history: 'COMPLETED', description: 'Поручение выполнено' },
}

function withComment(description: string, comment?: string) {
  return comment ? `${description}. Комментарий: ${comment}` : description
}

export async function applyTaskAction(id: number, action: TaskAction, userId: number, comment?: string) {
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) throw createError({ statusCode: 404, message: 'Поручение не найдено' })

  if (action === 'escalate') {
    if (getDeadlineState(task.status, task.deadline) !== 'overdue') {
      throw createError({ statusCode: 400, message: 'Эскалировать можно только просроченное поручение' })
    }
    if (task.escalatedAt) throw createError({ statusCode: 400, message: 'Поручение уже эскалировано' })
    await prisma.task.update({
      where: { id },
      data: {
        escalatedAt: new Date(),
        history: { create: { action: 'ESCALATED', description: withComment('Поручение эскалировано руководителю', comment), userId } },
      },
    })
    return
  }

  const transition = STATUS_TRANSITIONS[action]
  if (task.status !== transition.from) {
    throw createError({ statusCode: 400, message: 'Действие недоступно для текущего статуса поручения' })
  }
  if (action === 'return' && !comment) {
    throw createError({ statusCode: 400, message: 'Укажите причину возврата на доработку' })
  }
  await prisma.task.update({
    where: { id },
    data: {
      status: transition.to,
      completedAt: transition.to === 'COMPLETED' ? new Date() : undefined,
      history: { create: { action: transition.history, description: withComment(transition.description, comment), userId } },
    },
  })
}

export interface UpdateTaskInput {
  deadline?: string
  priority?: PriorityValue
  assigneeId?: number
}

export async function updateTask(id: number, input: UpdateTaskInput, userId: number) {
  const task = await prisma.task.findUnique({ where: { id }, include: { assignee: true, department: true } })
  if (!task) throw createError({ statusCode: 404, message: 'Поручение не найдено' })
  if (task.status === 'COMPLETED') throw createError({ statusCode: 400, message: 'Выполненное поручение нельзя изменить' })

  const changes: { action: HistoryAction; description: string; userId: number }[] = []
  const data: Prisma.TaskUpdateInput = {}

  if (input.deadline && input.deadline !== task.deadline.toISOString().slice(0, 10)) {
    data.deadline = dateKeyToDeadline(input.deadline)
    changes.push({
      action: 'UPDATED',
      description: `Срок изменён: ${formatDeadline(task.deadline)} → ${formatDeadline(data.deadline)}`,
      userId,
    })
  }
  if (input.priority && input.priority !== task.priority) {
    data.priority = input.priority
    changes.push({
      action: 'UPDATED',
      description: `Приоритет изменён: ${PRIORITY_LABELS[task.priority]} → ${PRIORITY_LABELS[input.priority]}`,
      userId,
    })
  }
  if (input.assigneeId && input.assigneeId !== task.assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: input.assigneeId }, include: { department: true } })
    if (!assignee) throw createError({ statusCode: 400, message: 'Ответственный не найден' })
    // The task follows its assignee, so reassigning to another department hands the task over to it
    data.assignee = { connect: { id: assignee.id } }
    data.department = { connect: { id: assignee.departmentId } }
    const handover = assignee.departmentId !== task.departmentId ? ` (передано: ${task.department.name} → ${assignee.department.name})` : ''
    changes.push({
      action: 'ASSIGNED',
      description: `Исполнитель изменён: ${task.assignee.name} → ${assignee.name}${handover}`,
      userId,
    })
  }
  if (changes.length === 0) return

  await prisma.task.update({ where: { id }, data: { ...data, history: { create: changes } } })
}
