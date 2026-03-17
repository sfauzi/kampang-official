// plugins/auth.client.ts
// Suffix .client → hanya jalan di browser (client-side only)
// Ini tempat yang TEPAT untuk init token dari localStorage saat app pertama load

export default defineNuxtPlugin(async () => {
  const { init, fetchUser, isAuthenticated, user } = useAuth()

  // 1. Sync token dari localStorage ke useState
  init()

  // 2. Kalau ada token tapi user belum ada → fetch sekarang
  //    Ini handle kasus: hard refresh di /profile, atau buka tab baru
  if (isAuthenticated.value && !user.value) {
    await fetchUser()
  }
})