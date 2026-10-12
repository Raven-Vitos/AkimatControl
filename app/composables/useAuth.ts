export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
  position: string
  department: { id: number; name: string }
}

/** Current user shared between SSR and the client; loaded once by the auth middleware. */
export function useAuth() {
  const user = useState<AuthUser | null | undefined>('auth-user', () => undefined)

  async function loadUser() {
    // useRequestFetch forwards the session cookie during SSR
    user.value = (await useRequestFetch()<AuthUser | null>('/api/auth/me')) || null
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    clearNuxtData()
    await navigateTo('/login')
  }

  return { user, loadUser, logout }
}
