// middleware/auth.ts

export default defineNuxtRouteMiddleware(() => {
  // Hanya jalan di client — localStorage tidak ada di server
  if (import.meta.server) return

  // ✅ Cek token langsung dari localStorage — paling reliable
  // Tidak bergantung pada reactive state yang mungkin belum ter-init
  const token = localStorage.getItem('auth_token')

  if (!token) {
    return navigateTo('/')
  }

  // Sync ke reactive state supaya composable langsung bisa pakai
  const { init } = useAuth()
  init()
})