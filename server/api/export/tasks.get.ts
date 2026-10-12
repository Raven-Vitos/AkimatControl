import { formatDate, PRIORITY_LABELS, STATUS_LABELS, toDateKey } from '../../../shared/utils/tasks'
import { listTasks } from '../../services/task.service'
import { parseTaskFilters } from '../../utils/validation'

function csvCell(value: string | number) {
  const text = String(value)
  return /[";\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

/** The current filtered list as CSV; semicolon-separated so Excel with a Russian locale opens it directly. */
export default defineEventHandler(async (event) => {
  const tasks = await listTasks(parseTaskFilters(event))

  const header = ['№', 'Название', 'Ответственный', 'Подразделение', 'Приоритет', 'Срок', 'Статус', 'Эскалировано']
  const rows = tasks.map((task) => [
    task.number,
    task.title,
    task.assignee.name,
    task.department.name,
    PRIORITY_LABELS[task.priority],
    formatDate(task.deadline),
    STATUS_LABELS[task.effectiveStatus],
    task.isEscalated ? 'да' : '',
  ])
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n')

  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="tasks-${toDateKey(new Date())}.csv"`)
  // BOM lets Excel detect UTF-8 and show Cyrillic correctly
  return `﻿${csv}`
})
