// middleware/auth.ts
// Lokasi : middleware/auth.ts
// Fungsi : Route guard untuk halaman yang butuh login (layout dashboard).
//          Dipasang via definePageMeta({ middleware: 'auth' }).
//          Mengecek token dari useState (SSR-safe) ATAU tokenStorage (client).

import { tokenStorage } from '~/utils/auth'

export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated, token } = useAuth()

  // useState sudah terisi (navigasi dalam app)
  if (isAuthenticated.value) return

  // Fallback: cek localStorage (hard refresh / direct URL)
  if (import.meta.client && tokenStorage.get()) {
    token.value = tokenStorage.get()
    isAuthenticated.value = true
    return
  }

  // Tidak ada token → redirect ke halaman utama
  return navigateTo('/', { redirectCode: 302 })
})