<template>
  <!-- ─── Mobile Overlay ──────────────────────────────────────── -->
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
      @click="mobileOpen = false"
    />
  </Transition>

  <!-- ─── Sidebar Panel ──────────────────────────────────────── -->
  <aside
    class="
      flex-shrink-0 flex flex-col border-r
      transition-all duration-300 ease-in-out
      w-64
      fixed top-0 left-0 z-40 h-full
      lg:sticky lg:top-16 lg:z-20
      lg:h-[calc(100vh-4rem)]
    "
    :class="[
      isDark ? 'bg-stone-900 border-stone-700/60' : 'bg-white border-stone-200/80',
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      desktopCollapsed ? 'lg:w-16' : 'lg:w-64',
    ]"
  >
    <!-- ── Mobile header ──────────────────────────────────────── -->
    <div
      class="flex items-center justify-between px-5 py-4 border-b lg:hidden"
      :class="isDark ? 'border-stone-700' : 'border-stone-200'"
    >
      <NuxtLink to="/" class="flex items-center">
        <img src="/logo-ko.png" class="max-h-6 w-auto object-contain block" :style="{ maxWidth: '160px' }" />
      </NuxtLink>
      <button
        @click="mobileOpen = false"
        class="p-1.5 rounded-lg transition-colors"
        :class="isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- ── Desktop collapse toggle ───────────────────────────── -->
    <div
      class="hidden lg:flex items-center border-b h-12 px-3 flex-shrink-0"
      :class="[
        isDark ? 'border-stone-700/60' : 'border-stone-200/80',
        desktopCollapsed ? 'justify-center' : 'justify-end',
      ]"
    >
      <button
        @click="desktopCollapsed = !desktopCollapsed"
        class="p-1.5 cursor-pointer rounded-lg transition-all duration-200 flex-shrink-0"
        :class="isDark ? 'hover:bg-stone-800 text-stone-500 hover:text-stone-300' : 'hover:bg-stone-100 text-stone-400 hover:text-stone-600'"
        :aria-label="desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <svg
          class="w-4 h-4 transition-transform duration-300"
          :class="desktopCollapsed ? 'rotate-180' : ''"
          fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7"/>
        </svg>
      </button>
    </div>

    <!-- ── Navigation ─────────────────────────────────────────── -->
    <nav
      class="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5"
        :class="desktopCollapsed ? 'px-2' : 'px-3'"
    >
      <template v-for="section in navSections" :key="section.title">

        <!-- Section label (hidden when collapsed) -->
        <p
          class="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest font-Manrope first:pt-1 whitespace-nowrap"
          :class="[
            isDark ? 'text-stone-600' : 'text-stone-400',
            desktopCollapsed ? 'lg:hidden' : '',
          ]"
        >
          {{ section.title }}
        </p>

        <!-- Spacer antar section saat collapsed -->
        <div v-if="desktopCollapsed" class="hidden lg:block h-2" />

        <!-- Nav item -->
        <NuxtLink
          v-for="item in section.items"
          :key="item.label"
          :to="item.to"
          @click="mobileOpen = false"
          class="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-Manrope transition-all duration-150 relative"
          :class="[
            getNavClass(item.to),
            desktopCollapsed ? 'lg:justify-center lg:px-0 lg:gap-0' : '',
          ]"
        >
          <!-- Active bar -->
          <span
            v-if="isActive(item.to)"
            class="absolute -left-3 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full bg-amber-500"
          />

          <!-- Icon -->
          <span class="w-5 h-5 flex-shrink-0" v-html="item.icon" />

          <!-- Label (hidden on collapsed desktop) -->
          <span
            class="flex-1 leading-none whitespace-nowrap"
            :class="desktopCollapsed ? 'lg:hidden' : ''"
          >
            {{ item.label }}
          </span>

          <!-- Badge (expanded) -->
          <span
            v-if="item.badge && !desktopCollapsed"
            class="text-[10px] font-bold px-1.5 py-0.5 rounded-full font-Manrope flex-shrink-0"
            :class="item.badgeColor ?? 'bg-amber/20 text-amber-600'"
          >
            {{ item.badge }}
          </span>

          <!-- Badge dot (collapsed) -->
          <span
            v-if="item.badge && desktopCollapsed"
            class="hidden lg:block absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            :class="item.badgeDot ?? 'bg-amber'"
          />

          <!--
            ── Tooltip saat collapsed (desktop only) ──────────────
            PENTING: harus pakai `v-show` bukan `v-if`, dan
            visibility dikontrol dengan opacity + pointer-events
            via group-hover. Jangan beri `overflow-hidden` pada
            parent agar tooltip tidak terpotong.
          -->
          <span
            v-show="desktopCollapsed"
            class="
              hidden lg:flex items-center gap-1.5
              pointer-events-none
              absolute left-full ml-3 z-[99]
              px-2.5 py-1.5 rounded-lg
              text-xs font-medium font-Manrope whitespace-nowrap
              shadow-lg
              opacity-0 group-hover:opacity-100
              -translate-x-1 group-hover:translate-x-0
              transition-all duration-150
            "
            :class="isDark ? 'bg-stone-700 text-stone-100' : 'bg-stone-800 text-stone-100'"
          >
            {{ item.label }}
            <span
              v-if="item.badge"
              class="text-[10px] px-1.5 py-0.5 rounded-full"
              :class="item.badgeColor ?? 'bg-amber/30 text-amber-400'"
            >{{ item.badge }}</span>
          </span>
        </NuxtLink>
      </template>
    </nav>

    <!-- ── Bottom ─────────────────────────────────────────────── -->
    <div
      class="flex-shrink-0 border-t transition-colors duration-300"
      :class="isDark ? 'border-stone-700/60' : 'border-stone-200/80'"
    >
      <!-- Upgrade card (expanded) -->

      <!-- <div v-if="!desktopCollapsed" class="px-3 pt-3">
        <div
          class="rounded-xl p-3.5 relative overflow-hidden"
          :class="isDark ? 'bg-stone-800/80' : 'bg-amber-50'"
        >
          <div class="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-amber/10 blur-xl" />
          <div class="flex items-start gap-2.5 relative">
            <div class="w-8 h-8 rounded-lg bg-amber/20 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-amber" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div>
              <p class="text-xs font-bold font-Manrope" :class="isDark ? 'text-stone-100' : 'text-stone-800'">Upgrade to Pro</p>
              <p class="text-[11px] mt-0.5" :class="isDark ? 'text-stone-400' : 'text-stone-500'">Unlock all features</p>
            </div>
          </div>
          <button class="mt-3 cursor-pointer w-full text-xs font-bold text-stone-800 dark:text-stone-100 font-Manrope py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-900 transition-colors duration-200 shadow-sm shadow-amber-400/30">
            Upgrade Now
          </button>
        </div>
      </div>

      <div v-else class="hidden lg:flex justify-center px-2 pt-3">
        <button
          class="group relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200"
          :class="isDark ? 'bg-stone-800/80 hover:bg-brand/20 text-brand' : 'bg-amber-50 hover:bg-amber-100 text-amber-600'"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Tooltip upgrade — bekerja karena tidak ada overflow:hidden di parent
          <span
            class="
              pointer-events-none absolute left-full ml-3 z-[99]
              px-2.5 py-1.5 rounded-lg
              text-xs font-medium font-Manrope whitespace-nowrap
              opacity-0 group-hover:opacity-100
              -translate-x-1 group-hover:translate-x-0
              transition-all duration-150 shadow-lg
            "
            :class="isDark ? 'bg-stone-700 text-stone-100' : 'bg-stone-800 text-stone-100'"
          >
            Upgrade to Pro
          </span>
        </button>
      </div> -->

      <!-- Profile mini -->
      <NuxtLink
        to="/profile"
        class="flex items-center cursor-pointer mx-2 my-2 px-2 py-2 rounded-lg transition-colors duration-150"
        :class="[
          isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50',
          desktopCollapsed ? 'lg:justify-center' : '',
        ]"
      >
        <!-- Avatar -->
        <div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow">
          <img
            v-if="user?.avatar"
            :src="avatarUrl"
            :alt="user?.name ?? 'Avatar'"
            class="w-full h-full object-cover"
          />
          <div
            v-else
            class="w-full h-full bg-gradient-to-br from-brand to-amber-600 flex items-center justify-center text-xs font-bold text-stone-900 font-Manrope"
          >
            {{ userInitials }}
          </div>
        </div>

        <!-- Name + role (hidden when collapsed) -->
        <div
          class="flex-1 min-w-0 ml-2.5 overflow-hidden"
          :class="desktopCollapsed ? 'lg:hidden' : ''"
        >
          <p class="text-sm font-semibold font-Manrope truncate" :class="isDark ? 'text-stone-200' : 'text-stone-800'">
            {{ user?.name ?? '—' }}
          </p>
          <p class="text-[11px] truncate" :class="isDark ? 'text-stone-500' : 'text-stone-400'">
            Member
          </p>
        </div>

        <!-- Settings link (hidden when collapsed) -->
        <NuxtLink
          v-if="!desktopCollapsed"
          to="/profile"
          class="p-1 rounded transition-colors flex-shrink-0 ml-1"
          :class="isDark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </NuxtLink>
      </NuxtLink>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// ── Props & Emits ─────────────────────────────────────────────────
const props = defineProps<{ isOpen: boolean }>()
defineEmits<{ close: [] }>()

// ── Auth & Theme ──────────────────────────────────────────────────
const route = useRoute()
const { isDark } = useTheme()
const { user, fetchUser } = useAuth()

const config = useRuntimeConfig()
const apiBase = (config.public.apiBase as string).replace(/\/api$/, '')

const avatarUrl = computed(() =>
  user.value?.avatar ? `${apiBase}/storage/${user.value.avatar}` : ''
)

onMounted(() => fetchUser())

// ── Computed user helpers ─────────────────────────────────────────
const userInitials = computed(() => {
  const name = user.value?.name ?? ''
  return name
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || '?'
})

// ── Sidebar state ─────────────────────────────────────────────────
const mobileOpen = ref(false)
const desktopCollapsed = ref(false)

defineExpose({ openMobile: () => { mobileOpen.value = true } })

watch(() => props.isOpen, (val) => {
  if (val) mobileOpen.value = true
})

// ── Breakpoint ────────────────────────────────────────────────────
const isMobile = ref(false)
const checkMobile = () => { isMobile.value = window.innerWidth < 1024 }
onMounted(() => { checkMobile(); window.addEventListener('resize', checkMobile) })
onUnmounted(() => window.removeEventListener('resize', checkMobile))

// ── Helpers ───────────────────────────────────────────────────────
const isActive = (to: string) => {
  // Dashboard harus exact match — karena semua route mulai dengan /dashboard
  if (to === '/dashboard') {
    return route.path === '/dashboard'
  }
  // Route lain: exact atau prefix match
  return route.path === to || route.path.startsWith(to + '/')
}

const getNavClass = (to: string) => {
  const active = isActive(to)
  if (isDark.value) {
    return active
      ? 'bg-brand/15 text-brand border border-stone-700'
      : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-transparent'
  } else {
    return active
      ? 'bg-amber-50 text-brand-dark border border-amber-200/60'
      : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700 border border-transparent'
  }
}

// ── Nav data ──────────────────────────────────────────────────────
const navSections = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard', to: '/dashboard',
        icon: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"/></svg>`
      },
      
    ]
  },
  {
    title: 'Manage',
    items: [
      {
        label: 'Memories', to: '/dashboard/memories',
        icon: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
        badgeColor: 'bg-amber/20 text-amber-600', badgeDot: 'bg-amber'
      },
      {
        label: 'Albums', to: '/dashboard/albums',
        icon: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>`
      },
      {
        label: 'Groups', to: '/dashboard/groups',
        icon: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`
      },
    ]
  },
  // {
  //   title: 'System',
  //   items: [
  //     {
  //       label: 'Settings', to: '/dashboard/settings',
  //       icon: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>`
  //     },
  //     {
  //       label: 'Help & Docs', to: '/dashboard/help',
  //       icon: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
  //     },
  //   ]
  // },
]
</script>