import { toDateKey, type PriorityValue } from '../../shared/utils/tasks'

/**
 * Keyword-based draft used when the LLM is unavailable (no API key, no network),
 * so the AI scenario still works on a demo machine. Deliberately simple: the user reviews the result anyway.
 */

const MONTHS = ['январ', 'феврал', 'март', 'апрел', 'ма', 'июн', 'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр']
const MONTH_PATTERN = `(${MONTHS.join('|')})[а-я]*`

// Department is matched by a fragment of its name, so it keeps working if names are slightly edited
const DEPARTMENT_KEYWORDS: { nameFragment: string; keywords: RegExp }[] = [
  { nameFragment: 'ЖКХ', keywords: /освещ|фонар|водопровод|канализ|тепл|отоплен|мусор|отход|крыш|подъезд|жил(ой|ого|ых)|коммунал/i },
  { nameFragment: 'благоустр', keywords: /озелен|газон|дерев|парк|сквер|детск(ая|ой|ие|их) площад|клумб|покос|благоустр/i },
  { nameFragment: 'образован', keywords: /школ|детск(ий|ого|их) сад|гимнази|учени|образован|кружк/i },
  { nameFragment: 'транспорт', keywords: /дорог|остановк|автобус|транспорт|светофор|ям|покрыти|разметк|маршрут/i },
]

const PRIORITY_RULES: { priority: PriorityValue; keywords: RegExp }[] = [
  { priority: 'CRITICAL', keywords: /авари|угроз|опасн|обрушен|пожар|затоплен|прорыв|немедленно/i },
  { priority: 'HIGH', keywords: /срочно|школ|детск|жалоб|безопасн|освещ/i },
  { priority: 'LOW', keywords: /отч[её]т|план(ов|ир)|анализ|информаци|справк/i },
]

function nearestFutureDate(day: number, monthIndex: number, today: Date) {
  const date = new Date(today.getFullYear(), monthIndex, day)
  if (toDateKey(date) < toDateKey(today)) date.setFullYear(date.getFullYear() + 1)
  return date.getDate() === day ? toDateKey(date) : null
}

export function findDeadline(text: string, today = new Date()): string | null {
  const lower = text.toLowerCase()

  const iso = lower.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`

  const numeric = lower.match(/\b(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?\b/)
  if (numeric) {
    const [, day, month, year] = numeric
    if (year) return toDateKey(new Date(Number(year), Number(month) - 1, Number(day)))
    return nearestFutureDate(Number(day), Number(month) - 1, today)
  }

  const verbal = lower.match(new RegExp(`\\b(\\d{1,2})\\s+${MONTH_PATTERN}`))
  if (verbal) {
    const monthIndex = MONTHS.findIndex((stem) => verbal[2] === stem)
    if (monthIndex >= 0) return nearestFutureDate(Number(verbal[1]), monthIndex, today)
  }

  const date = new Date(today)
  if (/послезавтра/.test(lower)) date.setDate(date.getDate() + 2)
  else if (/завтра/.test(lower)) date.setDate(date.getDate() + 1)
  else if (/конц[аеу] недели/.test(lower)) date.setDate(date.getDate() + ((7 - date.getDay()) % 7))
  else if (/конц[аеу] месяца/.test(lower)) date.setMonth(date.getMonth() + 1, 0)
  else {
    const relative = lower.match(/через\s+(\d+)?\s*(дн|день|недел|месяц)/)
    if (!relative) return null
    const count = Number(relative[1] ?? 1)
    if (relative[2]!.startsWith('недел')) date.setDate(date.getDate() + count * 7)
    else if (relative[2] === 'месяц') date.setMonth(date.getMonth() + count)
    else date.setDate(date.getDate() + count)
  }
  return toDateKey(date)
}

/** First sentence without the request preamble and the deadline phrase. */
function makeTitle(text: string) {
  const firstSentence = text.trim().split(/(?<=[.!?])\s+/)[0] ?? text
  const title = firstSentence
    .replace(/[.!?]+$/, '')
    .replace(/^(необходимо|нужно|надо|прошу|поручаю|требуется)\s+/i, '')
    .replace(new RegExp(`\\s*(до|к)\\s+(\\d{1,2}\\s+${MONTH_PATTERN}|\\d{1,2}\\.\\d{1,2}(\\.\\d{4})?|конца (недели|месяца))`, 'i'), '')
    .replace(/\s*через\s+(\d+\s+)?(дн|день|недел|месяц)[а-я]*/i, '')
    .replace(/\s+(на улице|по улице|по адресу|на ул\.)\s+.*$/i, '')
    .trim()
  const capitalized = title.charAt(0).toUpperCase() + title.slice(1)
  return capitalized.length > 100 ? `${capitalized.slice(0, 97)}…` : capitalized
}

export function draftTaskWithRules(text: string, departments: { id: number; name: string }[]) {
  const matchedRule = DEPARTMENT_KEYWORDS.find((rule) => rule.keywords.test(text))
  const department = matchedRule
    ? departments.find((item) => item.name.toLowerCase().includes(matchedRule.nameFragment.toLowerCase())) ?? null
    : null

  return {
    title: makeTitle(text),
    description: text.trim(),
    deadline: findDeadline(text),
    priority: PRIORITY_RULES.find((rule) => rule.keywords.test(text))?.priority ?? 'MEDIUM',
    department: department?.name ?? null,
    departmentId: department?.id ?? null,
  }
}
