<!-- pages/profile.vue -->

<script lang="ts" setup>
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { user, fetchUser, logout } = useAuth()

onMounted(async () => {
  // Plugin auth.client.ts sudah panggil init() + fetchUser() saat app load.
  // onMounted di sini hanya sebagai safety net: kalau user masih null
  // (misal navigasi sangat cepat sebelum plugin selesai), retry fetch.
  if (!user.value) {
    await fetchUser()
  }
})

const initials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name
    .split(' ')
    .filter((n) => n.length > 0)
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('')
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4">
    <div class="max-w-2xl mx-auto">

      <!-- Loading state -->
      <div v-if="!user" class="flex flex-col justify-center items-center h-64 gap-3">
        <div class="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        <p class="text-sm text-gray-400">Memuat data profil...</p>
      </div>

      <!-- Profile card -->
      <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        <div class="h-28 bg-gradient-to-r from-blue-500 to-indigo-600" />

        <div class="px-8 pb-8 -mt-12">
          <div class="flex items-end justify-between">
            <div class="relative">
              <NuxtImg
                v-if="user.avatar_url"
                :src="user.avatar_url"
                :alt="user.name"
                class="w-24 h-24 rounded-2xl border-4 border-white shadow-md object-cover"
              />
              <div
                v-else
                class="w-24 h-24 rounded-2xl border-4 border-white shadow-md bg-blue-600 flex items-center justify-center"
              >
                <span class="text-white text-2xl font-bold">{{ initials }}</span>
              </div>
            </div>

            <button
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
              @click="logout"
            >
              <Icon name="heroicons:arrow-right-on-rectangle" class="w-4 h-4" />
              Logout
            </button>
          </div>

          <div class="mt-4">
            <h1 class="text-2xl font-bold text-gray-900">{{ user.name }}</h1>
            <p class="text-gray-500 text-sm mt-0.5">{{ user.email }}</p>
          </div>

          <hr class="my-6 border-gray-100" />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoItem label="Deskripsi" :value="user.description" icon="heroicons:document-text" />
            <InfoItem label="Alamat" :value="user.address" icon="heroicons:map-pin" />
            <InfoItem label="Catatan" :value="user.notes" icon="heroicons:pencil-square" />
            <InfoItem label="Bergabung sejak" :value="user.created_at_formatted" icon="heroicons:calendar-days" />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>