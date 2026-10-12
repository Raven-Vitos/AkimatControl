import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { PRIORITIES, toDateKey } from '../../shared/utils/tasks'
import { prisma } from '../utils/db'
import { dateKeySchema } from '../utils/validation'
import { draftTaskWithRules } from './task-draft-rules'

const MODEL = 'claude-haiku-5-5'

export interface AiTaskDraft {
  title: string
  description: string
  deadline: string | null
  priority: (typeof PRIORITIES)[number]
  department: string | null
  departmentId: number | null
  /** 'rules' means the LLM was unavailable and the draft came from keyword matching */
  source: 'ai' | 'rules'
  notice: string | null
}

function buildSchema(departmentNames: [string, ...string[]]) {
  return z.object({
    title: z.string().describe('Короткое название поручения в повелительном наклонении, до 100 символов'),
    description: z.string().describe('Полное описание поручения на основе текста пользователя'),
    deadline: z.string().nullable().describe('Срок в формате YYYY-MM-DD или null, если срок не указан'),
    priority: z.enum(PRIORITIES),
    department: z.enum(departmentNames).nullable().describe('Ответственное подразделение или null, если неясно'),
  })
}

function buildSystemPrompt(today: string, departmentNames: string[]) {
  return [
    'Ты помогаешь сотруднику акимата оформить поручение из свободного текста.',
    `Сегодня ${today}. Если в тексте указан день и месяц без года, выбери ближайшую такую дату не раньше сегодняшней.`,
    'Относительные сроки ("через неделю", "до конца месяца") переводи в конкретную дату.',
    `Подразделения: ${departmentNames.join(', ')}. Выбери одно по смыслу задачи (уличное освещение в любом месте города, водопровод, теплоснабжение, мусор, ремонт домов — ЖКХ; озеленение, парки, детские площадки — благоустройство; школы — образование; дороги, остановки, транспорт — транспорт).`,
    'Приоритет: CRITICAL — угроза жизни, здоровью или аварии; HIGH — объекты для детей, безопасность, жалобы жителей, короткий срок; MEDIUM — обычные задачи; LOW — плановые и отчётные задачи без срочности.',
    'Не выдумывай данные: если срок или подразделение нельзя определить из текста, верни null.',
    'Пиши на русском языке.',
  ].join('\n')
}

function rulesDraft(text: string, departments: { id: number; name: string }[], reason: string): AiTaskDraft {
  return { ...draftTaskWithRules(text, departments), source: 'rules', notice: `${reason} Черновик составлен по ключевым словам — проверьте его особенно внимательно.` }
}

function describeAiError(error: unknown) {
  if (error instanceof Anthropic.AuthenticationError) return 'AI недоступен: неверный ANTHROPIC_API_KEY.'
  if (error instanceof Anthropic.RateLimitError) return 'AI временно перегружен.'
  if (error instanceof Anthropic.APIError) return `AI-сервис не ответил (${error.status ?? 'нет соединения'}).`
  return 'Не удалось разобрать ответ AI.'
}

export async function draftTaskFromText(text: string): Promise<AiTaskDraft> {
  const departments = await prisma.department.findMany({ orderBy: { id: 'asc' } })
  const departmentNames = departments.map((department) => department.name)
  if (departmentNames.length === 0) throw createError({ statusCode: 500, message: 'Справочник подразделений пуст' })

  // The demo must not break without a key or network, so fall back to keyword matching
  if (!process.env.ANTHROPIC_API_KEY) return validateDraft(rulesDraft(text, departments, 'AI не подключён (не задан ANTHROPIC_API_KEY).'), departments)

  const client = new Anthropic()
  let parsed: z.infer<ReturnType<typeof buildSchema>> | null
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(toDateKey(new Date()), departmentNames),
      messages: [{ role: 'user', content: text }],
      output_config: { format: zodOutputFormat(buildSchema(departmentNames as [string, ...string[]])) },
    })
    parsed = response.parsed_output
  } catch (error) {
    return validateDraft(rulesDraft(text, departments, describeAiError(error)), departments)
  }
  if (!parsed) return validateDraft(rulesDraft(text, departments, 'AI не вернул результат.'), departments)

  return validateDraft({ ...parsed, departmentId: null, source: 'ai', notice: null }, departments)
}

/** Both the model output and the fallback are untrusted: drop anything that does not match our reference data. */
function validateDraft(draft: AiTaskDraft, departments: { id: number; name: string }[]): AiTaskDraft {
  const deadline = draft.deadline && dateKeySchema.safeParse(draft.deadline).success ? draft.deadline : null
  const department = departments.find((item) => item.name === draft.department) ?? null
  return {
    ...draft,
    title: draft.title.trim().slice(0, 200),
    description: draft.description.trim().slice(0, 5000),
    deadline,
    priority: PRIORITIES.includes(draft.priority) ? draft.priority : 'MEDIUM',
    department: department?.name ?? null,
    departmentId: department?.id ?? null,
  }
}
