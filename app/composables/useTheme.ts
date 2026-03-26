// composables/useTheme.ts
export const useTheme = () => {
  const isDark = useState<boolean>('isDark', () => {
    if (import.meta.server) return true

    const saved = localStorage.getItem('theme')
    if (saved === 'light') return false
    if (saved === 'dark') return true

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

  /**
   * Teknik View Transitions API — circle EXPAND dari titik tombol:
   * 1. startViewTransition() membuat snapshot "sebelum" (tema lama)
   * 2. Di dalam callback → terapkan tema baru ke DOM
   * 3. Browser otomatis merender "sesudah" (tema baru)
   * 4. Custom animation: ::view-transition-new (tema baru) di-clip dari 0 → full
   *    sehingga tema baru "muncul" sebagai circle yang mengembang dari titik klik
   * 5. Luar circle = snapshot tema lama (terlihat apa adanya, bukan warna solid)
   */
  const triggerCircleReveal = (x: number, y: number, nextIsDark: boolean) => {
    // Hitung radius maksimum agar circle menutupi seluruh viewport
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    // Simpan posisi ke CSS custom property agar bisa diakses di keyframes
    document.documentElement.style.setProperty('--vt-origin-x', `${x}px`)
    document.documentElement.style.setProperty('--vt-origin-y', `${y}px`)
    document.documentElement.style.setProperty('--vt-radius', `${maxRadius}px`)

    // Gunakan View Transitions API jika tersedia
    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        // Terapkan tema baru di dalam callback → browser snapshot "sesudah"
        if (nextIsDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('theme', nextIsDark ? 'dark' : 'light')
      })

      // Tunggu pseudo-elements siap lalu jalankan custom clip-path animation
      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ]

        // Animasi pada ::view-transition-new (layer tema baru yang expand)
        document.documentElement.animate(
          { clipPath },
          {
            duration: 600,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            // Target pseudo-element tema baru
            pseudoElement: '::view-transition-new(root)',
          }
        )
      })
    } else {
      // Fallback jika browser tidak support View Transitions API
      applyTheme(nextIsDark)
    }
  }

  const toggleTheme = (originX?: number, originY?: number) => {
    const next = !isDark.value

    if (import.meta.client && originX !== undefined && originY !== undefined) {
      triggerCircleReveal(originX, originY, next)
      isDark.value = next
    } else {
      isDark.value = next
      applyTheme(next)
    }
  }

  if (import.meta.client) {
    applyTheme(isDark.value)
  }

  return { isDark, toggleTheme }
}