import { prisma } from '../../utils/db'

/** Department list for the public registration form. */
export default defineEventHandler(() => prisma.department.findMany({ orderBy: { id: 'asc' }, select: { id: true, name: true } }))
