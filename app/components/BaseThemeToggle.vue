<script setup lang="ts">
const { isDark, toggleTheme } = useTheme()

/**
 * Tangkap posisi tengah tombol dari event klik,
 * lalu teruskan ke toggleTheme untuk circle reveal.
 */
const handleClick = (e: MouseEvent) => {
  const btn = e.currentTarget as HTMLElement
  const rect = btn.getBoundingClientRect()
  const originX = rect.left + rect.width / 2
  const originY = rect.top + rect.height / 2
  toggleTheme(originX, originY)
}
</script>

<template>
  <button
    @click="handleClick"
    aria-label="Toggle tema"
    class="cursor-pointer focus-ring relative inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-150"
    :class="isDark
      ? 'bg-stone-800 hover:bg-stone-700 text-amber-400'
      : 'bg-stone-200 hover:bg-stone-300 text-amber-600'
    "
  >
    <!-- Ikon Matahari (light mode) -->
    <svg
      v-if="!isDark"
      xmlns="http://www.w3.org/2000/svg"
      class="w-5 h-5"
      fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07-.71.71M6.34 17.66l-.71.71M17.66 17.66l.71.71M6.34 6.34l.71.71M12 8a4 4 0 100 8 4 4 0 000-8z"
      />
    </svg>

    <!-- Ikon Bulan (dark mode) -->
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      class="w-5 h-5"
      fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
      />
    </svg>
  </button>
</template>