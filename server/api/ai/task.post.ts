import { z } from 'zod'
import { draftTaskFromText } from '../../services/ai.service'
import { parseOrThrow } from '../../utils/validation'

const bodySchema = z.object({
  text: z.string().trim().min(10, 'Опишите поручение подробнее').max(4000, 'Текст слишком длинный'),
})

/** Returns a draft for the user to review. Never writes to the database. */
export default defineEventHandler(async (event) => {
  const { text } = parseOrThrow(bodySchema, await readBody(event))
  return draftTaskFromText(text)
})
