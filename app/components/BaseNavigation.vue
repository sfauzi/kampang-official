<!-- components/Base/Navigation.vue -->

<script lang="ts" setup>
// Tidak perlu onMounted + init() lagi — sudah dihandle plugin auth.client.ts
const { user, isAuthenticated, loginWithGoogle, logout } = useAuth()
</script>

<template>
  <header class="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
    <nav class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

      <NuxtLink to="/" class="font-bold text-xl text-gray-900 tracking-tight">
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
                class="w-8 h-8 rounded-full border-2 border-transparent group-hover:border-blue-500 transition object-cover"
              />
              <div
                v-else
                class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold"
              >
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              <span class="text-sm font-medium text-gray-700 hidden sm:block">{{ user.name }}</span>
            </template>
            <!-- Skeleton saat user masih loading -->
            <template v-else>
              <div class="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
              <div class="w-20 h-4 rounded bg-gray-200 animate-pulse hidden sm:block" />
            </template>
          </NuxtLink>

          <button
            class="text-sm text-gray-500 hover:text-red-600 transition"
            @click="logout"
          >
            Logout
          </button>
        </template>

        <template v-else>
          <button
            class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:shadow-sm hover:border-gray-300 transition"
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