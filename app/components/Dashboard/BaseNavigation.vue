<template>
  <header
    class="sticky top-0 z-40 w-full border-b transition-colors duration-300"
    :class="[
      isDark
        ? 'bg-stone-900/95 border-stone-700/60 backdrop-blur-md'
        : 'bg-white/95 border-stone-200/80 backdrop-blur-md',
    ]"
  >
    <div class="flex items-center justify-between h-16 px-4 lg:px-6">
      <!-- Left: Hamburger (mobile) + Logo -->
      <div class="flex items-center gap-3">
        <button
          @click="$emit('toggle-sidebar')"
          class="p-2 rounded-lg transition-colors duration-200 lg:hidden"
          :class="
            isDark
              ? 'hover:bg-stone-800 text-stone-300'
              : 'hover:bg-stone-100 text-stone-600'
          "
          aria-label="Toggle Sidebar"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <NuxtLink to="/" class="hidden sm:flex items-center">
          <NuxtImg
            src="/logo-ko.png"
            class="max-h-8 w-auto object-contain block"
            :style="{ maxWidth: '160px' }"
          />
        </NuxtLink>
      </div>

      <!-- Center: Search bar -->
      <div class="hidden md:flex flex-1 max-w-md mx-6">
        <button
          type="button"
          @click="openSearchModal"
          class="relative w-full text-left pl-9 pr-16 py-2 text-sm rounded-lg border transition-colors duration-200 font-Manrope outline-none focus:ring-2 focus:ring-brand/50"
          :class="[
            isDark
              ? 'bg-stone-800 border-stone-700 text-stone-200 hover:border-brand/40 placeholder-stone-500 focus:border-brand/60'
              : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-brand/40 placeholder-stone-400 focus:border-brand/60',
          ]"
          aria-label="Open search modal"
        >
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            :class="isDark ? 'text-stone-500' : 'text-stone-400'"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path stroke-linecap="round" d="m21 21-4.35-4.35" />
          </svg>

          <span :class="isDark ? 'text-stone-500' : 'text-stone-400'">
            Search anything...
          </span>

          <span
            class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] px-1.5 py-0.5 rounded border"
            :class="isDark ? 'border-stone-600 text-stone-400' : 'border-stone-300 text-stone-500'"
          >
            Ctrl+K
          </span>
        </button>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-1 sm:gap-2">
        <!-- Mobile search -->
        <button
        @click="openSearchModal"
          class="md:hidden p-2 rounded-lg transition-colors duration-200"
          :class="
            isDark
              ? 'hover:bg-stone-800 text-stone-400'
              : 'hover:bg-stone-100 text-stone-500'
          "
          aria-label="Search"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path stroke-linecap="round" d="m21 21-4.35-4.35" />
          </svg>
        </button>

        <!-- Notifications -->
        <button
          class="relative cursor-pointer p-2 rounded-lg transition-colors duration-200"
          :class="
            isDark
              ? 'hover:bg-stone-800 text-stone-400'
              : 'hover:bg-stone-100 text-stone-500'
          "
          aria-label="Notifications"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span
            class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand ring-2"
            :class="isDark ? 'ring-stone-800' : 'ring-amber-50'"
          />
        </button>

        <BaseThemeToggle />

        <!-- Divider -->
        <div class="w-px h-6 mx-1" :class="isDark ? 'bg-stone-700' : 'bg-stone-200'" />

        <!-- Profile dropdown -->
        <div class="relative" ref="profileRef">
          <button
            @click="profileOpen = !profileOpen"
            class="flex items-center cursor-pointer gap-2 p-1.5 rounded-lg transition-colors duration-200"
            :class="isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-100'"
          >
            <!-- Avatar: photo atau inisial -->
            <div class="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 shadow">
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

            <!-- First name only -->
            <span
              class="hidden sm:block text-sm font-medium font-Manrope max-w-[80px] truncate"
              :class="isDark ? 'text-stone-200' : 'text-stone-700'"
            >
              {{ userFirstName }}
            </span>

            <svg
              class="hidden sm:block w-3.5 h-3.5 transition-transform duration-200"
              :class="[
                isDark ? 'text-stone-500' : 'text-stone-400',
                profileOpen ? 'rotate-180' : '',
              ]"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-95 -translate-y-1"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 -translate-y-1"
          >
            <div
              v-if="profileOpen"
              class="absolute right-0 mt-2 w-52 rounded-xl border shadow-xl overflow-hidden"
              :class="
                isDark
                  ? 'bg-stone-900 border-stone-700 shadow-black/40'
                  : 'bg-white border-stone-200 shadow-stone-200/60'
              "
            >
              <!-- User info header -->
              <div
                class="px-4 py-3 border-b"
                :class="isDark ? 'border-stone-700' : 'border-stone-100'"
              >
                <p
                  class="text-sm font-semibold font-Manrope truncate"
                  :class="isDark ? 'text-stone-100' : 'text-stone-800'"
                >
                  {{ user?.name ?? "—" }}
                </p>
                <p
                  class="text-xs mt-0.5 truncate"
                  :class="isDark ? 'text-stone-500' : 'text-stone-400'"
                >
                  {{ user?.email ?? "—" }}
                </p>
              </div>

              <!-- Menu items -->
              <div class="py-1">
                <NuxtLink
                  v-for="item in profileMenu"
                  :key="item.label"
                  :to="item.to"
                  @click="profileOpen = false"
                  class="flex items-center gap-3 px-4 py-2.5 text-sm font-Manrope transition-colors duration-150"
                  :class="
                    isDark
                      ? 'text-stone-300 hover:bg-stone-800 hover:text-brand'
                      : 'text-stone-600 hover:bg-amber-50 hover:text-brand-dark'
                  "
                >
                  <span class="w-4 h-4 flex-shrink-0" v-html="item.icon" />
                  {{ item.label }}
                </NuxtLink>
              </div>

              <!-- Logout -->
              <div
                class="border-t py-1"
                :class="isDark ? 'border-stone-700' : 'border-stone-100'"
              >
                <button
                  class="w-full flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-Manrope transition-colors duration-150 text-red-400 hover:bg-red-500/10"
                  @click="handleLogout"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
    <!-- Search Modal -->
  <SearchModal v-model="showSearchModal" />

</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

defineEmits<{ "toggle-sidebar": [] }>();

const { isDark } = useTheme();
const { user, fetchUser, logout } = useAuth();

const showSearchModal = ref(false);

const openSearchModal = () => {
  showSearchModal.value = true;
};

const onGlobalKeydown = (e: KeyboardEvent) => {
  // Ctrl/Cmd + K
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    showSearchModal.value = true;
  }
};

// Fetch user saat komponen mount
onMounted(() => fetchUser());

// Computed helpers
const userFirstName = computed(() => user.value?.name?.split(" ")[0] ?? "—");
const userInitials = computed(() => {
  const name = user.value?.name ?? "";
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "?"
  );
});

const config = useRuntimeConfig();
const apiBase = (config.public.apiBase as string).replace(/\/api$/, "");

// Gabungkan base URL + path avatar dari backend
const avatarUrl = computed(() =>
  user.value?.avatar ? `${apiBase}/storage/${user.value.avatar}` : ""
);

const profileOpen = ref(false);
const profileRef = ref<HTMLElement | null>(null);

const { confirm } = useConfirm();
const toast = useToast();

const handleLogout = async () => {
  const ok = await confirm({
    title: "Keluar dari akun?",
    message:
      "Kamu akan keluar dari sesi ini. Pastikan kamu sudah menyimpan semua perubahan.",
    confirmText: "Ya, logout",
    cancelText: "Batal",
    type: "danger",
  });

  if (ok) {
    profileOpen.value = false;
    await logout();
    toast.success("Berhasil logout. Sampai jumpa!");
  }
};

const profileMenu = [
  {
    label: "My Profile",
    to: "/profile",
    icon: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
  },
  {
    label: "Settings",
    to: "/dashboard/settings",
    icon: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>`,
  },
];

const handleClickOutside = (e: MouseEvent) => {
  if (profileRef.value && !profileRef.value.contains(e.target as Node)) {
    profileOpen.value = false;
  }
};
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("keydown", onGlobalKeydown);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("keydown", onGlobalKeydown);
});
</script>
