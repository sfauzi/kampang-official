// composables/useAuth.ts

import type { User } from '~/types/user'
import { tokenStorage, buildApiHeaders } from '~/utils/auth'

export const useAuth = () => {
  const config = useRuntimeConfig()
  const router = useRouter()

  // useState — shared & persist lintas navigasi, SSR-safe
  const user = useState<User | null>('auth:user', () => null)
  const token = useState<string | null>('auth:token', () => null)
  const isAuthenticated = useState<boolean>('auth:isAuthenticated', () => false)

  // Sync token dari localStorage → useState (panggil 1x saat app load via plugin)
  const init = () => {
    if (!import.meta.client) return
    const saved = tokenStorage.get()
    if (saved) {
      token.value = saved
      isAuthenticated.value = true
    }
  }

  const loginWithGoogle = () => {
    window.location.href = `${config.public.apiBase}/auth/google/redirect`
  }

  const fetchUser = async (): Promise<boolean> => {
    // Ambil token — prioritaskan useState, fallback ke localStorage
    const currentToken = token.value ?? tokenStorage.get()

    if (!currentToken) {
      console.warn('[useAuth] fetchUser: tidak ada token')
      return false
    }

    // Pastikan useState sinkron
    if (!token.value) {
      token.value = currentToken
      isAuthenticated.value = true
    }

    try {
      const data = await $fetch<User>(`${config.public.apiBase}/api/user`, {
        headers: buildApiHeaders(currentToken),
      })
      user.value = data
      isAuthenticated.value = true
      return true
    } catch (error) {
      console.error('[useAuth] fetchUser error:', error)
      return false
    }
  }

  const handleLoginSuccess = async (rawToken: string): Promise<boolean> => {
    tokenStorage.set(rawToken)
    token.value = rawToken
    isAuthenticated.value = true
    return await fetchUser()
  }

  const logout = () => {
    tokenStorage.remove()
    user.value = null
    token.value = null
    isAuthenticated.value = false
    router.push('/')
  }

  return {
    user,
    token,
    isAuthenticated,
    init,
    loginWithGoogle,
    handleLoginSuccess,
    fetchUser,
    logout,
  }
}