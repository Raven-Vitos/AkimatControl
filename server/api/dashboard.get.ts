import { getDashboard } from '../services/dashboard.service'
import { getCurrentUser } from '../utils/auth'

export default defineEventHandler((event) => getDashboard(getCurrentUser(event).id))
