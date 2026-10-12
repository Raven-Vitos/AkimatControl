import { prisma } from '../server/utils/db'
import { hashPassword } from '../server/utils/password'
import { dateKeyToDeadline, toDateKey } from '../shared/utils/tasks'
import type { HistoryAction, Priority, Role, TaskStatus } from '../server/generated/prisma/client'

// All dates are relative to the seed run so the demo never goes stale
function daysFromToday(offset: number, hour = 10): Date {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  date.setHours(hour, 0, 0, 0)
  return date
}

function deadlineIn(offset: number): Date {
  return dateKeyToDeadline(toDateKey(daysFromToday(offset)))
}

const departments = [
  'Аппарат акима',
  'Отдел ЖКХ',
  'Отдел благоустройства',
  'Отдел образования',
  'Отдел транспорта',
]

// Every demo user can log in with this password
const DEMO_PASSWORD = 'demo1234'

const users: { name: string; email: string; role: Role; position: string; department: string }[] = [
  { name: 'Серикбаев Нурлан', email: 'n.serikbayev@akimat.demo', role: 'ADMIN', position: 'Руководитель аппарата', department: 'Аппарат акима' },
  { name: 'Ахметова Динара', email: 'd.akhmetova@akimat.demo', role: 'MANAGER', position: 'Главный специалист по контролю', department: 'Аппарат акима' },
  { name: 'Жумабеков Ерлан', email: 'e.zhumabekov@akimat.demo', role: 'MANAGER', position: 'Руководитель отдела ЖКХ', department: 'Отдел ЖКХ' },
  { name: 'Ким Алексей', email: 'a.kim@akimat.demo', role: 'EMPLOYEE', position: 'Инженер ЖКХ', department: 'Отдел ЖКХ' },
  { name: 'Оспанова Айгерим', email: 'a.ospanova@akimat.demo', role: 'MANAGER', position: 'Руководитель отдела благоустройства', department: 'Отдел благоустройства' },
  { name: 'Петренко Ольга', email: 'o.petrenko@akimat.demo', role: 'EMPLOYEE', position: 'Специалист по озеленению', department: 'Отдел благоустройства' },
  { name: 'Нургалиева Сауле', email: 's.nurgaliyeva@akimat.demo', role: 'MANAGER', position: 'Руководитель отдела образования', department: 'Отдел образования' },
  { name: 'Бекова Жанар', email: 'zh.bekova@akimat.demo', role: 'EMPLOYEE', position: 'Методист', department: 'Отдел образования' },
  { name: 'Тулегенов Марат', email: 'm.tulegenov@akimat.demo', role: 'MANAGER', position: 'Руководитель отдела транспорта', department: 'Отдел транспорта' },
  { name: 'Смагулов Арман', email: 'a.smagulov@akimat.demo', role: 'EMPLOYEE', position: 'Специалист по дорожному хозяйству', department: 'Отдел транспорта' },
]

interface SeedTask {
  title: string
  description: string
  assignee: string
  priority: Priority
  status: Exclude<TaskStatus, 'OVERDUE'>
  createdDaysAgo: number
  deadlineOffset: number
  escalated?: boolean
  /** Completed tasks only: finished this many days after the deadline */
  completedLateBy?: number
}

const tasks: SeedTask[] = [
  // Overdue
  { title: 'Устранить повреждение дорожного покрытия на ул. Абая', description: 'По обращению жителей устранить выбоины на участке ул. Абая от ул. Сейфуллина до ул. Жибек Жолы. Предоставить фотоотчёт.', assignee: 'Смагулов Арман', priority: 'HIGH', status: 'IN_PROGRESS', createdDaysAgo: 14, deadlineOffset: -3 },
  { title: 'Организовать вывоз мусора в микрорайоне Самал', description: 'Обеспечить вывоз несанкционированной свалки у домов 12–18 мкр. Самал и установить дополнительные контейнеры.', assignee: 'Ким Алексей', priority: 'CRITICAL', status: 'IN_PROGRESS', createdDaysAgo: 10, deadlineOffset: -5, escalated: true },
  { title: 'Восстановить освещение в сквере у ДК «Достык»', description: 'Заменить вышедшие из строя светильники (7 шт.) в сквере у дворца культуры «Достык».', assignee: 'Жумабеков Ерлан', priority: 'MEDIUM', status: 'NEW', createdDaysAgo: 9, deadlineOffset: -1 },
  { title: 'Подготовить отчёт о готовности школ к отопительному сезону', description: 'Собрать акты готовности котельных и систем отопления по всем школам района, свести в единый отчёт для акима.', assignee: 'Бекова Жанар', priority: 'HIGH', status: 'REVIEW', createdDaysAgo: 20, deadlineOffset: -2 },
  { title: 'Проверить состояние остановочного комплекса «Центральный рынок»', description: 'Провести осмотр остановочного павильона, составить акт о повреждениях и план ремонта.', assignee: 'Тулегенов Марат', priority: 'LOW', status: 'IN_PROGRESS', createdDaysAgo: 18, deadlineOffset: -7 },

  // Due soon (0–3 days)
  { title: 'Организовать ремонт участка дороги на пр. Республики', description: 'Провести ямочный ремонт на участке пр. Республики, 45–60. Согласовать временную схему движения с полицией.', assignee: 'Смагулов Арман', priority: 'HIGH', status: 'IN_PROGRESS', createdDaysAgo: 8, deadlineOffset: 2 },
  { title: 'Устранить порыв водопровода на ул. Толе би', description: 'Совместно с городским водоканалом устранить порыв и восстановить благоустройство после раскопки.', assignee: 'Ким Алексей', priority: 'CRITICAL', status: 'IN_PROGRESS', createdDaysAgo: 3, deadlineOffset: 1 },
  { title: 'Подготовить информацию о посещаемости кружков в школах', description: 'Собрать данные по дополнительному образованию в школах района за сентябрь.', assignee: 'Нургалиева Сауле', priority: 'MEDIUM', status: 'NEW', createdDaysAgo: 4, deadlineOffset: 3 },
  { title: 'Провести осенний покос газонов в парке Победы', description: 'Выполнить покос и уборку скошенной травы на территории парка Победы.', assignee: 'Петренко Ольга', priority: 'LOW', status: 'REVIEW', createdDaysAgo: 7, deadlineOffset: 0 },

  // In progress, normal
  { title: 'Подготовить отчёт по благоустройству за III квартал', description: 'Сводный отчёт о выполненных работах по благоустройству дворов и общественных пространств за июль–сентябрь.', assignee: 'Оспанова Айгерим', priority: 'MEDIUM', status: 'IN_PROGRESS', createdDaysAgo: 5, deadlineOffset: 9 },
  { title: 'Оборудовать пешеходный переход у школы №24', description: 'Нанести разметку, установить знаки и искусственную неровность у школы №24 по ул. Кенесары.', assignee: 'Тулегенов Марат', priority: 'HIGH', status: 'IN_PROGRESS', createdDaysAgo: 6, deadlineOffset: 12 },
  { title: 'Провести промывку ливневой канализации на ул. Сарыарка', description: 'Подготовить ливневую канализацию к осенне-зимнему периоду.', assignee: 'Жумабеков Ерлан', priority: 'MEDIUM', status: 'IN_PROGRESS', createdDaysAgo: 4, deadlineOffset: 15 },
  { title: 'Высадить саженцы на аллее по ул. Кабанбай батыра', description: 'Высадить 120 саженцев карагача в рамках программы озеленения.', assignee: 'Петренко Ольга', priority: 'MEDIUM', status: 'REVIEW', createdDaysAgo: 12, deadlineOffset: 6 },

  // New
  { title: 'Подготовить план зимнего содержания дорог', description: 'Разработать план снегоуборки с распределением техники по участкам.', assignee: 'Тулегенов Марат', priority: 'HIGH', status: 'NEW', createdDaysAgo: 1, deadlineOffset: 20 },
  { title: 'Проверить детские площадки на соответствие требованиям безопасности', description: 'Провести обследование 15 детских площадок, составить перечень неисправного оборудования.', assignee: 'Оспанова Айгерим', priority: 'HIGH', status: 'NEW', createdDaysAgo: 2, deadlineOffset: 10 },
  { title: 'Организовать подвоз учащихся из пос. Береке', description: 'Согласовать маршрут школьного автобуса для учащихся посёлка Береке.', assignee: 'Нургалиева Сауле', priority: 'MEDIUM', status: 'NEW', createdDaysAgo: 1, deadlineOffset: 14 },
  { title: 'Ответить на коллективное обращение жителей дома по ул. Ауэзова, 31', description: 'Подготовить ответ по вопросу протечки кровли и сроков капитального ремонта.', assignee: 'Ким Алексей', priority: 'MEDIUM', status: 'NEW', createdDaysAgo: 0, deadlineOffset: 7 },
  { title: 'Обновить график работы общественного транспорта', description: 'Согласовать с перевозчиками зимний график маршрутов №5, №12, №41.', assignee: 'Смагулов Арман', priority: 'LOW', status: 'NEW', createdDaysAgo: 2, deadlineOffset: 18 },

  // Completed
  { title: 'Отремонтировать кровлю школы №8', description: 'Текущий ремонт кровли спортзала школы №8.', assignee: 'Бекова Жанар', priority: 'HIGH', status: 'COMPLETED', createdDaysAgo: 30, deadlineOffset: -8, completedLateBy: 4 },
  { title: 'Убрать аварийные деревья на ул. Пушкина', description: 'Снос 4 аварийных тополей по заключению комиссии.', assignee: 'Петренко Ольга', priority: 'CRITICAL', status: 'COMPLETED', createdDaysAgo: 15, deadlineOffset: -6 },
  { title: 'Подготовить справку о состоянии лифтового хозяйства', description: 'Справка для акима по многоквартирным домам с лифтами старше 25 лет.', assignee: 'Жумабеков Ерлан', priority: 'MEDIUM', status: 'COMPLETED', createdDaysAgo: 12, deadlineOffset: -1, completedLateBy: 1 },
  { title: 'Восстановить дорожные знаки на объездной дороге', description: 'Заменить 11 повреждённых дорожных знаков.', assignee: 'Тулегенов Марат', priority: 'MEDIUM', status: 'COMPLETED', createdDaysAgo: 9, deadlineOffset: 2 },
  { title: 'Провести субботник на набережной', description: 'Организовать городской субботник с участием предприятий района.', assignee: 'Оспанова Айгерим', priority: 'LOW', status: 'COMPLETED', createdDaysAgo: 25, deadlineOffset: -12 },
  { title: 'Подготовить совещание по итогам учебного года', description: 'Подготовить повестку и материалы совещания с директорами школ.', assignee: 'Нургалиева Сауле', priority: 'MEDIUM', status: 'COMPLETED', createdDaysAgo: 22, deadlineOffset: -10 },
  { title: 'Проверить исполнение графика вывоза ТБО', description: 'Выборочная проверка соблюдения графика вывоза отходов подрядчиком.', assignee: 'Ахметова Динара', priority: 'MEDIUM', status: 'COMPLETED', createdDaysAgo: 11, deadlineOffset: 4 },

  // Assigned to the demo login, so "Мои поручения" is not empty
  { title: 'Подготовить сводку об исполнении поручений акима за сентябрь', description: 'Свести данные по всем отделам: выполнено в срок, просрочено, причины просрочек. Представить руководителю аппарата.', assignee: 'Ахметова Динара', priority: 'HIGH', status: 'IN_PROGRESS', createdDaysAgo: 3, deadlineOffset: 2 },
  { title: 'Проверить исполнение поручений по обращениям жителей', description: 'Выборочно проверить качество ответов отделов на обращения жителей за последний месяц.', assignee: 'Ахметова Динара', priority: 'MEDIUM', status: 'NEW', createdDaysAgo: 1, deadlineOffset: 8 },
]

const STATUS_STEPS: Record<SeedTask['status'], HistoryAction[]> = {
  NEW: [],
  IN_PROGRESS: ['STARTED'],
  REVIEW: ['STARTED', 'SENT_TO_REVIEW'],
  COMPLETED: ['STARTED', 'SENT_TO_REVIEW', 'COMPLETED'],
}

const STEP_DESCRIPTIONS: Partial<Record<HistoryAction, string>> = {
  STARTED: 'Работа начата',
  SENT_TO_REVIEW: 'Поручение отправлено на проверку',
  COMPLETED: 'Поручение выполнено',
}

async function main() {
  await prisma.session.deleteMany()
  await prisma.taskHistory.deleteMany()
  await prisma.task.deleteMany()
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()

  const departmentIds = new Map<string, number>()
  for (const name of departments) {
    const department = await prisma.department.create({ data: { name } })
    departmentIds.set(name, department.id)
  }

  const userByName = new Map<string, { id: number; departmentId: number }>()
  const passwordHash = await hashPassword(DEMO_PASSWORD)
  for (const { department, ...user } of users) {
    const created = await prisma.user.create({ data: { ...user, passwordHash, departmentId: departmentIds.get(department)! } })
    userByName.set(created.name, created)
  }

  const controller = userByName.get('Ахметова Динара')!
  const head = userByName.get('Серикбаев Нурлан')!

  for (const [index, seedTask] of tasks.entries()) {
    const assignee = userByName.get(seedTask.assignee)!
    const createdAt = daysFromToday(-seedTask.createdDaysAgo, 9)
    const deadline = deadlineIn(seedTask.deadlineOffset)
    const steps = STATUS_STEPS[seedTask.status]

    // Spread the status steps between creation and min(today, deadline)
    const lastStepDay = Math.min(0, seedTask.deadlineOffset)
    const span = Math.max(1, lastStepDay + seedTask.createdDaysAgo)
    const stepDate = (stepIndex: number) =>
      daysFromToday(-seedTask.createdDaysAgo + Math.round((span * (stepIndex + 1)) / (steps.length + 1)), 11 + stepIndex)

    const history: { action: HistoryAction; description: string; createdAt: Date; userId: number }[] = [
      { action: 'CREATED', description: 'Поручение создано', createdAt, userId: controller.id },
      { action: 'ASSIGNED', description: `Назначен исполнитель: ${seedTask.assignee}`, createdAt, userId: controller.id },
      ...steps.map((action, stepIndex) => ({
        action,
        description: STEP_DESCRIPTIONS[action]!,
        createdAt: action === 'COMPLETED' && seedTask.completedLateBy
          ? daysFromToday(seedTask.deadlineOffset + seedTask.completedLateBy, 16)
          : stepDate(stepIndex),
        userId: action === 'COMPLETED' ? controller.id : assignee.id,
      })),
    ]

    const isOverdue = seedTask.status !== 'COMPLETED' && seedTask.deadlineOffset < 0
    if (isOverdue) {
      history.push({ action: 'OVERDUE', description: 'Поручение просрочено', createdAt: daysFromToday(seedTask.deadlineOffset + 1, 0), userId: controller.id })
    }
    if (seedTask.escalated) {
      history.push({ action: 'ESCALATED', description: 'Поручение эскалировано руководителю', createdAt: daysFromToday(-1, 15), userId: controller.id })
    }

    const completedAt = seedTask.status === 'COMPLETED' ? history.at(-1)!.createdAt : null

    await prisma.task.create({
      data: {
        number: 101 + index,
        title: seedTask.title,
        description: seedTask.description,
        status: seedTask.status,
        priority: seedTask.priority,
        deadline,
        createdAt,
        completedAt,
        escalatedAt: seedTask.escalated ? daysFromToday(-1, 15) : null,
        departmentId: assignee.departmentId,
        assigneeId: assignee.id,
        createdById: seedTask.assignee === 'Ахметова Динара' ? head.id : controller.id,
        history: { create: history },
      },
    })
  }

  console.log(`Seeded ${departments.length} departments, ${users.length} users, ${tasks.length} tasks`)
  console.log(`Demo login: d.akhmetova@akimat.demo / ${DEMO_PASSWORD}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
