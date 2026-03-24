<script setup lang="ts">
const route = useRoute()
const { user, isAuthenticated } = useAuth()
const { open: openLoginModal } = useLoginModal()

const navItems = [
  { to: '/', label: 'Home', icon: 'heroicons:home', iconActive: 'heroicons:home-solid' },
  { to: '/memories', label: 'Kenangan', icon: 'heroicons:photo', iconActive: 'heroicons:photo' },
  { to: '/groups', label: 'Grup', icon: 'heroicons:user-group', iconActive: 'heroicons:user-group' },
  { to: '/albums', label: 'Album', icon: 'heroicons:book-open', iconActive: 'heroicons:book-open' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

// Dipanggil saat klik profile — tidak perlu kirim redirect, 
// useLoginModal.open() otomatis capture route.fullPath saat itu
function handleProfileClick() {
  if (!isAuthenticated.value) {
    openLoginModal() // tanpa argumen → pakai halaman saat ini
  }
}
</script>

<template>
  <div class="font-[Manrope]">

    <!-- ── DESKTOP sidebar ── -->
    <aside class="hidden lg:flex fixed left-0 top-0 h-full w-16 flex-col items-center py-5 gap-1 bg-white dark:bg-[#111111] border-r border-gray-100 dark:border-neutral-900 z-50">

      <NuxtLink to="/" class="mb-6 w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 hover:bg-amber-600 transition">
        <Icon name="heroicons:camera" class="w-5 h-5 text-white" />
      </NuxtLink>

      <nav class="flex flex-col items-center gap-1 flex-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group"
          :class="isActive(item.to)
            ? 'bg-amber-500 text-white shadow-sm'
            : 'text-gray-400 dark:text-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-700 dark:hover:text-gray-200'"
        >
          <Icon :name="isActive(item.to) ? item.iconActive : item.icon" class="w-5 h-5" />
          <span class="absolute left-14 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-neutral-700 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 translate-x-1 group-hover:translate-x-0 shadow-lg">
            {{ item.label }}
          </span>
        </NuxtLink>
      </nav>

      <!-- Profile desktop: NuxtLink jika login, button jika belum -->
      <div class="mt-auto relative group">
        <NuxtLink
          v-if="isAuthenticated"
          to="/profile"
          class="block"
        >
          <img
            v-if="user?.avatar_url"
            :src="user.avatar_url"
            class="w-9 h-9 rounded-full object-cover ring-2 transition-all duration-200"
            :class="isActive('/profile') ? 'ring-amber-500' : 'ring-gray-200 dark:ring-neutral-700 group-hover:ring-amber-500/50'"
          />
          <div
            v-else
            class="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-neutral-800 ring-2 ring-gray-200 dark:ring-neutral-700 group-hover:ring-amber-500/50 transition-all duration-200"
          >
            <Icon name="heroicons:user" class="w-4 h-4 text-gray-400 dark:text-neutral-500" />
          </div>
        </NuxtLink>

        <button
          v-else
          class="w-9 h-9 cursor-pointer rounded-full flex items-center justify-center bg-gray-100 dark:bg-neutral-800 ring-2 ring-gray-200 dark:ring-neutral-700 hover:ring-amber-500/50 transition-all duration-200"
          @click="handleProfileClick"
        >
          <Icon name="heroicons:user" class="w-4 h-4 text-gray-400 dark:text-neutral-500" />
        </button>

        <span class="absolute left-14 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-neutral-700 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 translate-x-1 group-hover:translate-x-0 shadow-lg">
          {{ isAuthenticated ? 'Profil' : 'Login' }}
        </span>
      </div>
    </aside>

    <!-- ── MOBILE bottom nav ── -->
    <nav class="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-white/90 dark:bg-[#111111]/90 backdrop-blur-md border-t border-gray-100 dark:border-neutral-900 px-2 py-2 flex justify-around items-center safe-area-pb">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200"
        :class="isActive(item.to) ? 'text-amber-500' : 'text-gray-400 dark:text-neutral-600'"
      >
        <div
          class="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200"
          :class="isActive(item.to) ? 'bg-amber-500/10' : ''"
        >
          <Icon
            :name="isActive(item.to) ? item.iconActive : item.icon"
            class="w-5 h-5 transition-transform duration-200"
            :class="isActive(item.to) ? 'scale-110' : ''"
          />
        </div>
        <span class="text-[10px] font-semibold leading-none">{{ item.label }}</span>
      </NuxtLink>

      <!-- Profile mobile: NuxtLink jika login, button jika belum -->
      <NuxtLink
        v-if="isAuthenticated"
        to="/dashboard"
        class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200"
        :class="isActive('/dashboard') ? 'text-amber-500' : 'text-gray-400 dark:text-neutral-600'"
      >
        <div
          class="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200"
          :class="isActive('/dashboard') ? 'bg-amber-500/10' : ''"
        >
          <img
            v-if="user?.avatar_url"
            :src="user.avatar_url"
            class="w-6 h-6 rounded-full object-cover"
            :class="isActive('/dashboard') ? 'ring-2 ring-amber-500' : ''"
          />
          <Icon v-else name="heroicons:user-circle" class="w-5 h-5" :class="isActive('/dashboard') ? 'scale-110' : ''" />
        </div>
        <span class="text-[10px] font-semibold leading-none">Profil</span>
      </NuxtLink>

      <button
        v-else
        class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 text-gray-400 dark:text-neutral-600"
        @click="handleProfileClick"
      >
        <div class="w-8 h-8 flex items-center justify-center rounded-xl">
          <Icon name="heroicons:user-circle" class="w-5 h-5" />
        </div>
        <span class="text-[10px] font-semibold leading-none">Profil</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.safe-area-pb {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
}
</style>