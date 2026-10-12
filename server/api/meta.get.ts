import { prisma } from '../utils/db'

/** Reference data for forms and filters. */
export default defineEventHandler(async () => {
  const [departments, users] = await Promise.all([
    prisma.department.findMany({ orderBy: { id: 'asc' } }),
    prisma.user.findMany({
      select: { id: true, name: true, position: true, role: true, departmentId: true },
      orderBy: { name: 'asc' },
    }),
  ])
  return { departments, users }
})
