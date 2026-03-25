<template>
  <footer
    class="border-t transition-colors duration-300 mt-auto"
    :class="isDark ? 'bg-stone-900 border-stone-700/60' : 'bg-white border-stone-200/80'"
  >
    <div class="px-6 py-4">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">

        <!-- Left: Brand + Copyright -->
        <div class="flex items-center gap-2.5">
          <div class="w-5 h-5 rounded bg-brand flex items-center justify-center flex-shrink-0">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span class="text-xs font-Manrope" :class="isDark ? 'text-stone-500' : 'text-stone-400'">
            © {{ new Date().getFullYear() }}
            <span class="font-Mansalva text-sm" :class="isDark ? 'text-stone-300' : 'text-stone-600'">Kampang Official</span>
            · All rights reserved
          </span>
        </div>

        <!-- Center: Links -->
        <!-- <div class="flex items-center gap-4">
          <NuxtLink
            v-for="link in footerLinks"
            :key="link.label"
            :to="link.to"
            class="text-xs font-Manrope transition-colors duration-150"
            :class="isDark ? 'text-stone-500 hover:text-brand' : 'text-stone-400 hover:text-brand-dark'"
          >
            {{ link.label }}
          </NuxtLink>
        </div> -->

        <!-- Right: Version badge -->
        <span
          class="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-Manrope font-medium border"
          :class="isDark ? 'bg-stone-800 border-stone-700 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-400'"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          v1.0.0 · Stable
        </span>

      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
// ✅ Gunakan useTheme custom — sumber kebenaran tunggal untuk isDark
const { isDark } = useTheme()

const footerLinks = [
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Support', to: '/dashboard/help' },
]
</script>