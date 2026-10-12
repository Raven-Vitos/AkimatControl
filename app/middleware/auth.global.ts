const PUBLIC_PAGES = ['/login', '/register', '/registration']

export default defineNuxtRouteMiddleware(async (to) => {
  const { user, loadUser } = useAuth()
  if (user.value === undefined) await loadUser()

  const isPublic = PUBLIC_PAGES.includes(to.path)
  if (!user.value && !isPublic) return navigateTo('/login')
  if (user.value && isPublic) return navigateTo('/')
})
