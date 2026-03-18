<!-- components/Base/Navigation.vue -->

<script lang="ts" setup>
// Tidak perlu onMounted + init() lagi — sudah dihandle plugin auth.client.ts
const { user, isAuthenticated, loginWithGoogle, logout } = useAuth()
</script>

<template>
  <header class="sticky top-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur border-b border-stone-200 dark:border-stone-800 transition-colors duration-300">
    <nav class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

      <NuxtLink to="/" class="font-bold text-xl text-stone-900 dark:text-stone-50 tracking-tight transition-colors duration-300">
        MyApp
      </NuxtLink>

      <div class="flex items-center gap-3">
        <!-- ✅ Cukup cek isAuthenticated — tidak perlu && user -->
        <!-- user bisa null sebentar saat fetch, tapi isAuthenticated sudah true -->
        <template v-if="isAuthenticated">
          <NuxtLink to="/profile" class="flex items-center gap-2 group">
            <!-- Tampilkan avatar kalau user sudah ter-load -->
            <template v-if="user">
              <NuxtImg
                v-if="user.avatar_url"
                :src="user.avatar_url"
                :alt="user.name"
                class="w-8 h-8 rounded-full border-2 border-transparent group-hover:border-amber-500 dark:group-hover:border-amber-400 transition object-cover"
              />
              <div
                v-else
                class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 flex items-center justify-center text-white text-xs font-bold transition-colors duration-300"
              >
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              <span class="text-sm font-medium text-stone-700 dark:text-stone-300 hidden sm:block transition-colors duration-300">{{ user.name }}</span>
            </template>
            <!-- Skeleton saat user masih loading -->
            <template v-else>
              <div class="w-8 h-8 rounded-full bg-stone-300 dark:bg-stone-600 animate-pulse transition-colors duration-300" />
              <div class="w-20 h-4 rounded bg-stone-300 dark:bg-stone-600 animate-pulse hidden sm:block transition-colors duration-300" />
            </template>
          </NuxtLink>

          <button
            class="text-sm text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition"
            @click="logout"
          >
            Logout
          </button>
        </template>

        <template v-else>
          <button
            class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium hover:shadow-sm hover:border-stone-300 dark:hover:border-stone-600 transition"
            @click="loginWithGoogle"
          >
            <Icon name="logos:google-icon" class="w-4 h-4" />
            Login dengan Google
          </button>
        </template>
      </div>

    </nav>
  </header>
</template>