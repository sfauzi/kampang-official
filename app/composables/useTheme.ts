// composables/useTheme.ts
export const useTheme = () => {
  const isDark = useState<boolean>('isDark', () => {
    // Server-side: default dark
    if (import.meta.server) return true

    // Client-side: baca dari localStorage, fallback ke dark
    const saved = localStorage.getItem('theme')
    if (saved === 'light') return false
    if (saved === 'dark') return true

    // Jika belum pernah set, ikuti system preference, fallback dark
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const applyTheme = (dark: boolean) => {
    if (import.meta.server) return
    const html = document.documentElement
    if (dark) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }

  const toggleTheme = () => {
    isDark.value = !isDark.value
    applyTheme(isDark.value)
  }

  // Terapkan saat composable dipanggil di client
  if (import.meta.client) {
    applyTheme(isDark.value)
  }

  return { isDark, toggleTheme }
}