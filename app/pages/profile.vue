<!-- pages/profile.vue -->

<script lang="ts" setup>
import ProfileEditModal from '~/components/Profile/ProfileEditModal.vue'
import ProfileSongModal from '~/components/Profile/ProfileSongModal.vue'
import type { ProfileSong, SpotifyTrack } from '~/types/user'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { user, fetchUser, logout, updateProfile, getProfileSong, setProfileSong, deleteProfileSong } = useAuth()

const profileSong = ref<ProfileSong | null>(null)
const showEditModal = ref(false)
const showSongModal = ref(false)
const isLoadingProfileSong = ref(false)
const errorMessage = ref('')

import { computed, watchEffect } from 'vue'

const seoTitle = computed(() => {
  if (!user.value) return 'Profile'
  return `${user.value.name}  |`
})

const seoDescription = computed(() => {
  if (!user.value) return 'Halaman profile user'
  return `Profile ${user.value.name} di Kampang Official`
})

watchEffect(() => {
  useSeoMeta({
    title: seoTitle.value,
    description: seoDescription.value,

    ogTitle: seoTitle.value,
    ogDescription: seoDescription.value,
    ogImage: user.value?.avatar || 'https://kampang-official.vercel.app/logo-ko.png',
    ogUrl: 'https://kampang-official.vercel.app/profile',

    twitterCard: 'summary_large_image',
    twitterTitle: seoTitle.value,
    twitterDescription: seoDescription.value,
    twitterImage: user.value?.avatar || 'https://kampang-official.vercel.app/logo-ko.png',
  })
})

onMounted(async () => {
  // Plugin auth.client.ts sudah panggil init() + fetchUser() saat app load.
  // onMounted di sini hanya sebagai safety net: kalau user masih null
  // (misal navigasi sangat cepat sebelum plugin selesai), retry fetch.
  if (!user.value) {
    await fetchUser()
  }
  await loadProfileSong()
})

const loadProfileSong = async () => {
  isLoadingProfileSong.value = true
  profileSong.value = await getProfileSong()
  isLoadingProfileSong.value = false
}

const handleProfileSaved = async () => {
  await fetchUser()
}

const handleSongSelected = async (track: SpotifyTrack) => {
  isLoadingProfileSong.value = true
  const success = await setProfileSong(track)
  if (success) {
    await loadProfileSong()
    errorMessage.value = ''
  } else {
    errorMessage.value = 'Gagal menyimpan lagu profile'
  }
  isLoadingProfileSong.value = false
}

const handleDeleteProfileSong = async () => {
  if (!confirm('Apakah Anda yakin ingin menghapus lagu profile?')) {
    return
  }

  isLoadingProfileSong.value = true
  const success = await deleteProfileSong()
  if (success) {
    await loadProfileSong()
    errorMessage.value = ''
  } else {
    errorMessage.value = 'Gagal menghapus lagu profile'
  }
  isLoadingProfileSong.value = false
}

const initials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name
    .split(' ')
    .filter((n) => n.length > 0)
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('')
})

const showSpotifyModal = ref(false)

const isEditingNotes = ref(false)
const notesForm = ref('')

const startEditNotes = () => {
  notesForm.value = user.value?.notes || ''
  isEditingNotes.value = true
}

const cancelEditNotes = () => {
  isEditingNotes.value = false
  notesForm.value = ''
}

const saveNotes = async () => {
  const success = await updateProfile({
    name: user.value!.name,
    description: user.value?.description || null,
    address: user.value?.address || null,
    notes: notesForm.value || null,
    avatar: null,
  })
  if (success) {
    await fetchUser()
    isEditingNotes.value = false
  }
}

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
              <NuxtImg v-if="user.avatar_url" :src="user.avatar_url" :alt="user.name"
                class="w-24 h-24 rounded-2xl border-4 border-white shadow-md object-cover" />
              <div v-else
                class="w-24 h-24 rounded-2xl border-4 border-white shadow-md bg-blue-600 flex items-center justify-center">
                <span class="text-white text-2xl font-bold">{{ initials }}</span>
              </div>

              <!-- Bubble Chat Notes -->
              <div
                class="absolute -top-12 -right-0 max-w-[140px] rounded-xl bg-white px-2 py-2 text-center text-xs font-bold break-words whitespace-normal text-neutral-800 shadow-lg">

                <!-- Mode View -->
                <template v-if="!isEditingNotes">
                  <span v-if="user.notes" class="block">{{ user.notes }}</span>
                  <span v-else class="block text-gray-400 italic">Add a note...</span>
                  <button @click="startEditNotes" class="cursor-pointer mt-1 text-gray-400 hover:text-gray-600 transition">
                    <Icon name="heroicons:pencil" class="w-3 h-3" />
                  </button>
                </template>

                <!-- Mode Edit -->
                <template v-else>
                  <textarea v-model="notesForm" rows="2"
                    class="w-full resize-none rounded border p-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                    placeholder="Tulis catatan..." autofocus />
                  <div class="mt-1 flex justify-end gap-1">
                    <button @click="saveNotes"
                      class="rounded bg-green-500 px-2 py-0.5 text-xs text-white hover:bg-green-600 transition">
                      Save
                    </button>
                    <button @click="cancelEditNotes"
                      class="rounded bg-gray-300 px-2 py-0.5 text-xs hover:bg-gray-400 transition">
                      Cancel
                    </button>
                  </div>
                </template>

                <!-- Ekor bubble -->
                <span
                  class="absolute -bottom-1 left-4 h-0 w-0 border-t-4 border-r-4 border-l-4 border-t-white border-r-transparent border-l-transparent" />
              </div>
            </div>
            <button @click="showEditModal = true"
              class="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition">
              <Icon name="heroicons:pencil" class="w-4 h-4" />
              Edit Profil
            </button>

            <!-- <button
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
              @click="logout"
            >
              <Icon name="heroicons:arrow-right-on-rectangle" class="w-4 h-4" />
              Logout
            </button> -->
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
          <hr class="my-6 border-gray-100" />

          <!-- Profile Song Section -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Icon name="heroicons:music-note" class="w-5 h-5 text-green-600" />
                Lagu Favorit
              </h2>
              <button @click="showSongModal = true"
                class="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition">
                <Icon name="heroicons:plus" class="w-4 h-4" />
                Pilih Lagu
              </button>
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
              {{ errorMessage }}
            </div>

            <!-- Profile Song Display -->
            <div v-if="isLoadingProfileSong"
              class="flex items-center justify-center p-6 border border-gray-200 rounded-lg">
              <Icon name="mdi:loading" class="w-5 h-5 animate-spin text-blue-600" />
              <span class="ml-2 text-sm text-gray-600">Memuat lagu profile...</span>
            </div>

            <div v-else-if="profileSong"
              class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div class="flex gap-4">
                <!-- Album Cover -->
                <div class="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0">
                  <img v-if="profileSong.song_image" :src="profileSong.song_image" :alt="profileSong.song_title"
                    class="w-full h-full object-cover rounded-lg" />
                  <Icon v-else name="heroicons:music-note" class="w-10 h-10 text-gray-400 m-2.5" />
                </div>

                <!-- Song Info -->
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900">{{ profileSong.song_title }}</h3>
                  <p class="text-sm text-gray-600 mt-0.5">{{ profileSong.song_artist }}</p>

                  <div class="flex gap-2 mt-3">
                    <a v-if="profileSong.spotify_url" :href="profileSong.spotify_url" target="_blank"
                      class="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition">
                      <Icon name="mdi:spotify" class="w-3.5 h-3.5" />
                      Spotify
                    </a>
                    <button @click="handleDeleteProfileSong"
                      class="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 text-xs rounded-lg hover:bg-red-200 transition">
                      <Icon name="heroicons:trash" class="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </div>
                </div>

                <!-- Preview -->
                <div class="flex-shrink-0">
                  <button v-if="profileSong.song_preview_url || profileSong.song_id" @click="showSpotifyModal = true"
                    class="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition">
                    <Icon name="mdi:spotify" class="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <span v-else class="text-xs text-gray-500">No preview</span>
                </div>
              </div>
            </div>

            <div v-else class="p-6 text-center border border-gray-200 border-dashed rounded-lg">
              <Icon name="heroicons:music-note" class="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p class="text-gray-500 text-sm">Belum ada lagu favorit yang dipilih</p>
              <p class="text-gray-400 text-xs mt-1">Pilih lagu dari Spotify untuk menampilkannya di profil Anda</p>
            </div>
          </div>

          <hr class="my-6 border-gray-100" />

          <!-- Logout Button -->
          <button @click="logout"
            class="w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition">
            <Icon name="heroicons:arrow-right-on-rectangle" class="w-4 h-4" />
            Logout
          </button>

        </div>
      </div>

    </div>
    <!-- Modals -->
    <ProfileEditModal :open="showEditModal" :user="user" @update:open="showEditModal = $event"
      @saved="handleProfileSaved" />

    <ProfileSongModal :open="showSongModal" @update:open="showSongModal = $event" @selected="handleSongSelected" />

    <!-- Modal Spotify Embed -->
    <div v-if="showSpotifyModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-2 backdrop-blur-sm"
      @click.self="showSpotifyModal = false">
      <div class="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
        <!-- Close Button -->
        <button @click="showSpotifyModal = false"
          class="absolute cursor-pointer top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/90 text-gray-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-gray-900">
          <Icon name="heroicons:x-mark" class="w-5 h-5" />
        </button>

        <!-- Spotify Embed -->
        <iframe v-if="profileSong?.song_id"
          :src="`https://open.spotify.com/embed/track/${profileSong.song_id}?utm_source=generator`" width="100%"
          height="352" frameborder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"
          class="rounded-xl" />
      </div>
    </div>
  </div>
</template>