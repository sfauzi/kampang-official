<script setup lang="ts">
const route = useRoute()
const { user, isAuthenticated } = useAuth()
const { open: openLoginModal } = useLoginModal()
const mobileProfileOpen = ref(false)
const mobileProfileRef = ref<HTMLElement | null>(null)

const showSearchModal = ref(false)

const openSearchModal = () => {
  showSearchModal.value = true
}

const onGlobalKeydown = (e: KeyboardEvent) => {
  // Ctrl/Cmd + K
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    showSearchModal.value = true
  }
}

const navItems = [
  { to: '/', label: 'Home', icon: 'heroicons:home', iconActive: 'heroicons:home-solid' },
  { to: '/memories', label: 'Kenangan', icon: 'heroicons:photo', iconActive: 'heroicons:photo' },
  { to: '/albums', label: 'Album', icon: 'heroicons:book-open', iconActive: 'heroicons:book-open' },
  { to: '/groups', label: 'Grup', icon: 'heroicons:user-group', iconActive: 'heroicons:user-group' },
]

// split nav item desktop agar search bisa di tengah
const navMid = computed(() => Math.ceil(navItems.length / 2))
const navItemsTop = computed(() => navItems.slice(0, navMid.value))
const navItemsBottom = computed(() => navItems.slice(navMid.value))

const mobileDashboardMenus = [
  { to: '/dashboard', label: 'Dashboard', icon: 'heroicons:squares-2x2' },
  // { to: '/dashboard/memories', label: 'Memories', icon: 'heroicons:photo' },
  // { to: '/dashboard/groups', label: 'Groups', icon: 'heroicons:user-group' },
  // { to: '/dashboard/albums', label: 'Albums', icon: 'heroicons:book-open' },
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
    return
  }

  mobileProfileOpen.value = !mobileProfileOpen.value
}

const closeMobileProfileDropdown = (event: MouseEvent) => {
  const target = event.target as Node
  if (!mobileProfileRef.value?.contains(target)) {
    mobileProfileOpen.value = false
  }
}

watch(() => route.fullPath, () => {
  mobileProfileOpen.value = false
})

onMounted(() => {
  document.addEventListener('click', closeMobileProfileDropdown)
  window.addEventListener('keydown', onGlobalKeydown)

})

onUnmounted(() => {
  document.removeEventListener('click', closeMobileProfileDropdown)
  window.removeEventListener('keydown', onGlobalKeydown)

})
</script>

<template>
  <div class="font-[Manrope]">

    <!-- ── DESKTOP sidebar ── -->
    <aside
      class="hidden lg:flex fixed left-0 top-0 h-full w-16 flex-col items-center py-5 gap-1 bg-white dark:bg-[#111111] border-r border-gray-100 dark:border-neutral-900 z-50">

      <NuxtLink to="/"
        class="mb-6 w-9 h-9 p-1 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 hover:bg-amber-600 transition overflow-hidden">
        <img src="/logo-inisial.png" alt="Kampang" class="w-full h-full object-contain" />
      </NuxtLink>

      <!-- nav center tengah + search di tengah navitems -->
      <nav class="flex flex-col items-center gap-1 flex-1 justify-center">
        <NuxtLink v-for="item in navItemsTop" :key="item.to" :to="item.to"
          class="relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group"
          :class="isActive(item.to)
            ? 'bg-amber-500 text-white shadow-sm'
            : 'text-gray-400 dark:text-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-700 dark:hover:text-gray-200'">
          <Icon :name="isActive(item.to) ? item.iconActive : item.icon" size="20px" class="w-5 h-5" />
          <span
            class="absolute left-14 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-neutral-700 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 translate-x-1 group-hover:translate-x-0 shadow-lg">
            {{ item.label }}
          </span>
        </NuxtLink>

        <!-- DESKTOP: search di tengah navitems -->
        <button
          class="relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group text-gray-400 dark:text-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-700 dark:hover:text-gray-200"
          @click="openSearchModal">
          <Icon name="heroicons:magnifying-glass" size="20px" class="w-5 h-5" />
          <span
            class="absolute left-14 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-neutral-700 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 translate-x-1 group-hover:translate-x-0 shadow-lg">
            Cari (Ctrl+K)
          </span>
        </button>

        <NuxtLink v-for="item in navItemsBottom" :key="item.to" :to="item.to"
          class="relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group"
          :class="isActive(item.to)
            ? 'bg-amber-500 text-white shadow-sm'
            : 'text-gray-400 dark:text-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-700 dark:hover:text-gray-200'">
          <Icon :name="isActive(item.to) ? item.iconActive : item.icon" size="20px" class="w-5 h-5" />
          <span
            class="absolute left-14 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-neutral-700 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 translate-x-1 group-hover:translate-x-0 shadow-lg">
            {{ item.label }}
          </span>
        </NuxtLink>
      </nav>

      <BaseThemeToggle class="mb-4" />

      <!-- Profile desktop: tetap -->
      <div class="mt-auto relative group">

        <NuxtLink v-if="isAuthenticated" to="/dashboard" class="block">
          <img v-if="user?.avatar_url" :src="user.avatar_url"
            class="w-9 h-9 rounded-full object-cover ring-2 transition-all duration-200"
            :class="isActive('/dashboard') ? 'ring-amber-500' : 'ring-gray-200 dark:ring-neutral-700 group-hover:ring-amber-500/50'" />
          <div v-else
            class="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-neutral-800 ring-2 ring-gray-200 dark:ring-neutral-700 group-hover:ring-amber-500/50 transition-all duration-200">
            <Icon name="heroicons:user" class="w-4 h-4 text-gray-400 dark:text-neutral-500" />
          </div>
        </NuxtLink>

        <button v-else
          class="w-9 h-9 cursor-pointer rounded-full flex items-center justify-center bg-gray-100 dark:bg-neutral-800 ring-2 ring-gray-200 dark:ring-neutral-700 hover:ring-amber-500/50 transition-all duration-200"
          @click="handleProfileClick">
          <Icon name="heroicons:user" class="w-4 h-4 text-gray-400 dark:text-neutral-500" />
        </button>

        <span
          class="absolute left-14 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-neutral-700 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 translate-x-1 group-hover:translate-x-0 shadow-lg">
          {{ isAuthenticated ? 'Profil' : 'Login' }}
        </span>
      </div>
    </aside>


    <!-- ── MOBILE bottom nav ── -->
    <nav
      class="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-white/90 dark:bg-[#111111]/90 backdrop-blur-md border-t border-gray-100 dark:border-neutral-900 px-2 py-2 flex justify-around items-center safe-area-pb">

      <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
        class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200"
        :class="isActive(item.to) ? 'text-amber-500' : 'text-gray-400 dark:text-neutral-600'">
        <div class="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200"
          :class="isActive(item.to) ? 'bg-amber-500/10' : ''">
          <Icon :name="isActive(item.to) ? item.iconActive : item.icon"
            class="w-5 h-5 transition-transform duration-200" :class="isActive(item.to) ? 'scale-110' : ''" />
        </div>
        <span class="text-[10px] font-semibold leading-none">{{ item.label }}</span>
      </NuxtLink>

      <!-- Profile mobile + dropdown -->
      <div class="relative" ref="mobileProfileRef">
        <button class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200"
          :class="isActive('/dashboard') || mobileProfileOpen ? 'text-amber-500' : 'text-gray-400 dark:text-neutral-600'"
          @click.stop="handleProfileClick">
          <div class="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200"
            :class="isActive('/dashboard') || mobileProfileOpen ? 'bg-amber-500/10' : ''">
            <img v-if="isAuthenticated && user?.avatar_url" :src="user.avatar_url"
              class="w-6 h-6 rounded-full object-cover"
              :class="isActive('/dashboard') || mobileProfileOpen ? 'ring-2 ring-amber-500' : ''" />
            <Icon v-else name="heroicons:user-circle" class="w-5 h-5"
              :class="isActive('/dashboard') || mobileProfileOpen ? 'scale-110' : ''" />
          </div>
          <span class="text-[10px] font-semibold leading-none">Profil</span>
        </button>

        <Transition enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-1" enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-1">
          <div v-if="isAuthenticated && mobileProfileOpen"
            class="absolute bottom-full right-0 mb-2 w-52 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#111111] shadow-xl overflow-hidden">
            <div class="px-3 py-2 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-neutral-400">Theme</span>
              <BaseThemeToggle />
            </div>

            <div class="py-1">
              <!-- Search mobile digabung ke dropdown profile -->
              <button
                class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
                @click="mobileProfileOpen = false; openSearchModal()">
                <Icon name="heroicons:magnifying-glass" class="w-4 h-4 text-amber-500" />
                Cari
              </button>

              <NuxtLink v-for="item in mobileDashboardMenus" :key="item.to" :to="item.to"
                class="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
                @click="mobileProfileOpen = false">
                <Icon :name="item.icon" class="w-4 h-4 text-amber-500" />
                {{ item.label }}
              </NuxtLink>
            </div>
          </div>
        </Transition>
      </div>
    </nav>

    <SearchModal v-model="showSearchModal" />
  </div>
</template>

<style scoped>
.safe-area-pb {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
}
</style>