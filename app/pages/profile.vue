<!-- pages/profile.vue -->

<script lang="ts" setup>
import ProfileEditModal from '~/components/Profile/ProfileEditModal.vue'
import ProfileSongModal from '~/components/Profile/ProfileSongModal.vue'
import type { ProfileSong, SpotifyTrack } from '~/types/user'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const { user, fetchUser, logout, updateProfile, getProfileSong, setProfileSong, deleteProfileSong } = useAuth()
const { isDark } = useTheme()

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
    ogImage: user.value?.avatar || 'https://kampangofficial.vercel.app/logo-ko.png',
    ogUrl: 'https://kampangofficial.vercel.app/profile',

    twitterCard: 'summary_large_image',
    twitterTitle: seoTitle.value,
    twitterDescription: seoDescription.value,
    twitterImage: user.value?.avatar || 'https://kampangofficial.vercel.app/logo-ko.png',
  })
})

onMounted(async () => {
  // Selalu force-fetch saat masuk page
  await fetchUser(true)

  // Load song + catat lastSongId awal
  isLoadingProfileSong.value = true
  profileSong.value = await getProfileSong()
  lastSongId.value  = profileSong.value?.song_id ?? null
  isLoadingProfileSong.value = false

  startPolling()
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('focus', onWindowFocus)
  document.addEventListener('click', closeDropdownOnOutsideClick)
})

const loadProfileSong = async () => {
  isLoadingProfileSong.value = true
  profileSong.value  = await getProfileSong()
  lastSongId.value   = profileSong.value?.song_id ?? null
  isLoadingProfileSong.value = false
}

const handleProfileSaved = async () => {
  await fetchUser()
}

const handleSongSelected = async (track: SpotifyTrack) => {
  isLoadingProfileSong.value = true
  const success = await setProfileSong(track)
  if (success) {
    await loadProfileSong()   // ✅ lastSongId ikut terupdate
    errorMessage.value = ''
  } else {
    errorMessage.value = 'Gagal menyimpan lagu profile'
  }
  isLoadingProfileSong.value = false
}

const handleDeleteProfileSong = async () => {
  if (!confirm('Apakah Anda yakin ingin menghapus lagu profile?')) return

  isLoadingProfileSong.value = true
  const success = await deleteProfileSong()
  if (success) {
    await loadProfileSong()   // ✅ lastSongId ikut terupdate
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
  })
  if (success) {
    await fetchUser()
    isEditingNotes.value = false
  }
}

const { confirm } = useConfirm()
const toast = useToast()

const handleLogout = async () => {
  const ok = await confirm({
    title: 'Keluar dari akun?',
    message: 'Kamu akan keluar dari sesi ini. Pastikan kamu sudah menyimpan semua perubahan.',
    confirmText: 'Ya, logout',
    cancelText: 'Batal',
    type: 'danger',
  })

  if (ok) {
    await logout()
    toast.success('Berhasil logout. Sampai jumpa!')
  }
}

// --- Avatar ---
const avatarInput = ref<HTMLInputElement | null>(null)
const showAvatarDropdown = ref(false)


const toggleAvatarDropdown = () => {
  showAvatarDropdown.value = !showAvatarDropdown.value
}

// Tutup dropdown saat klik di luar
const closeDropdownOnOutsideClick = (e: MouseEvent) => {
  showAvatarDropdown.value = false
}

onUnmounted(() => {
  stopPolling()
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('focus', onWindowFocus)
  document.removeEventListener('click', closeDropdownOnOutsideClick)
})

const triggerAvatarInput = () => {
  showAvatarDropdown.value = false
  avatarInput.value?.click()
}

const onAvatarSelected = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    toast.error('Ukuran file tidak boleh lebih dari 2MB')
    return
  }

  const success = await updateProfile({
    name: user.value?.name ?? '',
    description: user.value?.description,
    address: user.value?.address,
    notes: user.value?.notes,
    avatar: file,
  })

  if (success) {
    await fetchUser()
    toast.success('Foto profil berhasil diubah.')
  } else {
    toast.error('Gagal mengupload foto profil.')
  }

  if (avatarInput.value) avatarInput.value.value = ''
}
  
const handleDeleteAvatar = async () => {
  showAvatarDropdown.value = false

  const confirmed = await confirm({
    title: 'Hapus foto profil?',
    message: 'Foto profil kamu akan dihapus permanen.',
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger',
  })

  if (!confirmed) return

  const success = await updateProfile({
    name: user.value?.name ?? '',
    description: user.value?.description,
    address: user.value?.address,
    notes: user.value?.notes,
    avatar: null,
  })

  if (success) {
    await fetchUser()
    toast.success('Foto profil berhasil dihapus.')
  } else {
    toast.error('Gagal menghapus foto profil.')
  }
}

// ─── Real-time sync lintas device ───────────────────────────────────────────
const POLL_USER_MS       = 30_000   // user data: tiap 30 detik
const POLL_SONG_MS       = 60_000   // profile song: tiap 60 detik (jarang berubah)

let pollUserTimer: ReturnType<typeof setInterval> | null = null
let pollSongTimer: ReturnType<typeof setInterval> | null = null

// ── User polling ──
const startUserPolling = () => {
  if (pollUserTimer) return
  pollUserTimer = setInterval(async () => {
    await fetchUser(true)
  }, POLL_USER_MS)
}

const stopUserPolling = () => {
  if (pollUserTimer) { clearInterval(pollUserTimer); pollUserTimer = null }
}

// ── Song polling — hanya fetch jika song_id berubah ──
const lastSongId = ref<string | null>(null)

const checkProfileSong = async () => {
  const fresh = await getProfileSong()

  // ✅ Hanya update state jika data benar-benar berubah
  const freshId = fresh?.song_id ?? null
  if (freshId !== lastSongId.value) {
    profileSong.value = fresh
    lastSongId.value  = freshId
  }
}

const startSongPolling = () => {
  if (pollSongTimer) return
  pollSongTimer = setInterval(checkProfileSong, POLL_SONG_MS)
}

const stopSongPolling = () => {
  if (pollSongTimer) { clearInterval(pollSongTimer); pollSongTimer = null }
}

// ── Start / stop semua polling ──
const startPolling = () => {
  startUserPolling()
  startSongPolling()
}

const stopPolling = () => {
  stopUserPolling()
  stopSongPolling()
}

// ── Visibility & focus handlers ──
const onVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    // Langsung fetch begitu tab aktif kembali
    await fetchUser(true)
    await checkProfileSong()
    startPolling()
  } else {
    stopPolling()     // tab background → hemat resource
  }
}

const onWindowFocus = async () => {
  await fetchUser(true)
  await checkProfileSong()
}

const texts = [
  "Apa yang kamu pikirkan?...",
  "Tulis sesuatu di sini...",
  "Bagikan cerita kamu hari ini...",
  "Lagi mikirin apa?",
  "Ceritakan sesuatu ke dunia...",
]

const randomText = computed(() => {
  return texts[Math.floor(Math.random() * texts.length)]
})

const { formatDateFull } = useFormatDate()

</script>

<template>
  <div class="min-h-screen bg-stone-50 dark:bg-stone-950 py-3 px-0.5 transition-colors duration-300">
    <div class="max-w-2xl mx-auto">

      <!-- Loading state -->
      <div v-if="!user" class="flex flex-col justify-center items-center h-64 gap-3">
        <div
          class="w-10 h-10 rounded-full border-4 border-amber-200 dark:border-amber-300 border-t-amber-600 dark:border-t-amber-400 animate-spin" />
        <p class="text-sm text-stone-400 dark:text-stone-500">Memuat data profil...</p>
      </div>

      <!-- Profile card -->
      <div v-else
        class="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden transition-colors duration-300">

        <div class="relative h-28 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700">
            <NuxtLink to="/"
                
                class="absolute cursor-pointer top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                      bg-white/20 hover:bg-white/30 active:bg-white/40
                      text-white text-sm font-medium
                      backdrop-blur-sm transition-all duration-200"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Kembali
            </NuxtLink >
        </div>
        <!-- <div class="h-28 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700" /> -->

        <div class="px-8 pb-8 -mt-12">
          <div class="flex items-end justify-between">
            <div class="relative">
              <!-- Avatar clickable -->
              <div class="relative group cursor-pointer" @click.stop="toggleAvatarDropdown">
                <NuxtImg v-if="user.avatar_url" :src="user.avatar_url" :alt="user.name"
                  class="w-24 h-24 rounded-2xl border-4 border-white dark:border-stone-800 shadow-md object-cover" />
                <div v-else
                  class="w-24 h-24 rounded-2xl border-4 border-stone-50 dark:border-stone-900 shadow-md bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 flex items-center justify-center">
                  <span class="text-white text-2xl font-bold">{{ initials }}</span>
                </div>

                <!-- Hover overlay -->
                <div
                  class="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>

                <!-- Badge edit kecil -->
                <div
                  class="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full border-2 border-white dark:border-stone-900 flex items-center justify-center shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                      d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-3 1 1-3a4 4 0 01.828-1.414z" />
                  </svg>
                </div>
              </div>

              <!-- Dropdown menu -->
              <Transition enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 scale-95 -translate-y-1"
                enter-to-class="opacity-100 scale-100 translate-y-0"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100 scale-100 translate-y-0"
                leave-to-class="opacity-0 scale-95 -translate-y-1">
                <div v-if="showAvatarDropdown"
                  class="absolute left-0 top-full mt-2 w-44 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg z-50 overflow-hidden">
                  <!-- Ganti foto -->
                  <button type="button" @click="triggerAvatarInput"
                    class="w-full cursor-pointer flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-amber-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {{ user.avatar_url ? 'Ganti Foto' : 'Upload Foto' }}
                  </button>

                  <!-- Divider + Hapus (hanya jika ada avatar) -->
                  <template v-if="user.avatar_url">
                    <div class="border-t border-stone-100 dark:border-stone-800" />
                    <button type="button" @click="handleDeleteAvatar"
                      class="w-full cursor-pointer flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Hapus Foto
                    </button>
                  </template>
                </div>
              </Transition>

              <!-- Hidden file input -->
              <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarSelected" />

              <!-- Bubble Chat Notes -->
              <div
                class="absolute -top-12 -right-0 max-w-[140px] rounded-xl bg-white dark:bg-stone-800 px-2 py-2 text-center text-xs font-bold break-words whitespace-normal text-stone-800 dark:text-stone-100 shadow-lg transition-colors duration-300">

                <!-- Mode View -->
                <template v-if="!isEditingNotes">
                  <span v-if="user.notes" class="block">{{ user.notes }}</span>
                  <span v-else class="block text-stone-400 dark:text-stone-500 italic"> {{ randomText }}</span>
                  <button @click="startEditNotes"
                    class="cursor-pointer mt-1 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition">
                    <Icon name="heroicons:pencil" class="w-3 h-3" />
                  </button>
                </template>

                <!-- Mode Edit -->
                <template v-else>
                  <textarea v-model="notesForm" rows="2"
                    class="w-full resize-none rounded border border-stone-300 dark:border-stone-600 p-1 text-xs bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
                    placeholder="Tulis catatan..." autofocus />
                  <div class="mt-1 flex justify-end gap-1">
                    <button @click="saveNotes"
                      class="rounded cursor-pointer bg-emerald-500 dark:bg-emerald-600 px-2 py-0.5 text-xs text-white hover:bg-emerald-600 dark:hover:bg-emerald-700 transition">
                      Save
                    </button>
                    <button @click="cancelEditNotes"
                      class="rounded cursor-pointer bg-stone-300 dark:bg-stone-600 text-stone-900 dark:text-stone-100 px-2 py-0.5 text-xs hover:bg-stone-400 dark:hover:bg-stone-500 transition">
                      Cancel
                    </button>
                  </div>
                </template>

                <!-- Ekor bubble -->
                <span
                  class="absolute -bottom-1 left-4 h-0 w-0 border-t-4 border-r-4 border-l-4 border-t-white dark:border-t-stone-800 border-r-transparent border-l-transparent transition-colors duration-300" />
              </div>
            </div>
            <button @click="showEditModal = true"
              class="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950 transition">
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
            <h1 class="text-2xl font-bold text-stone-900 dark:text-stone-50">{{ user.name }}</h1>
            <p class="text-stone-600 dark:text-stone-400 text-sm mt-0.5">{{ user.email }}</p>
          </div>

          <hr class="my-6 border-stone-200 dark:border-stone-800" />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoItem label="Deskripsi" :value="user.description" icon="heroicons:document-text" />
            <InfoItem label="Alamat" :value="user.address" icon="heroicons:map-pin" />
            <InfoItem label="Catatan" :value="user.notes" icon="heroicons:pencil-square" />
            <InfoItem label="Bergabung sejak" :value="formatDateFull(user.created_at)" icon="heroicons:calendar-days" />
          </div>
          <hr class="my-6 border-stone-200 dark:border-stone-800" />

          <!-- Profile Song Section -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
                <Icon name="heroicons:music-note" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Lagu Favorit
              </h2>
              <div @click="toast.info('Fitur ini tidak tersedia karena keterbatasan Spotify Premium 🎵')"
                class="cursor-not-allowed inline-flex" title="Masih dalam pengembangan">
                <button disabled class="pointer-events-none flex items-center gap-2 px-4 py-2 text-sm font-medium
           text-stone-400 dark:text-stone-600 border border-stone-200 dark:border-stone-700
           rounded-lg opacity-50 transition select-none">
                  <Icon name="heroicons:plus" class="w-4 h-4" />
                  Pilih Lagu
                </button>
                <!-- @click="showSongModal = true" -->
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage"
              class="mb-4 p-3 bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 transition-colors duration-300">
              {{ errorMessage }}
            </div>

            <!-- Profile Song Display -->
            <div v-if="isLoadingProfileSong"
              class="flex items-center justify-center p-6 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900 transition-colors duration-300">
              <Icon name="mdi:loading" class="w-5 h-5 animate-spin text-amber-600 dark:text-amber-400" />
              <span class="ml-2 text-sm text-stone-600 dark:text-stone-400">Memuat lagu profile...</span>
            </div>

            <div v-else-if="profileSong"
              class="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-stone-800 dark:to-stone-800 rounded-lg border border-emerald-200 dark:border-stone-700 transition-colors duration-300">
              <div class="flex gap-4">
                <!-- Album Cover -->
                <div
                  class="w-20 h-20 rounded-lg bg-stone-200 dark:bg-stone-700 flex-shrink-0 transition-colors duration-300">
                  <img v-if="profileSong.song_image" :src="profileSong.song_image" :alt="profileSong.song_title"
                    class="w-full h-full object-cover rounded-lg" />
                  <Icon v-else name="heroicons:music-note" class="w-10 h-10 text-stone-400 dark:text-stone-500 m-2.5" />
                </div>

                <!-- Song Info -->
                <div class="flex-1">
                  <h3 class="font-semibold text-stone-900 dark:text-stone-50">{{ profileSong.song_title }}</h3>
                  <p class="text-sm text-stone-600 dark:text-stone-400 mt-0.5">{{ profileSong.song_artist }}</p>

                  <div class="flex gap-2 mt-3">
                    <a v-if="profileSong.spotify_url" :href="profileSong.spotify_url" target="_blank"
                      class="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 dark:bg-emerald-700 text-white text-xs rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition">
                      <Icon name="mdi:spotify" class="w-3.5 h-3.5" />
                      Spotify
                    </a>
                    <button @click="handleDeleteProfileSong"
                      class="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 text-xs rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition">
                      <Icon name="heroicons:trash" class="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </div>
                </div>

                <!-- Preview -->
                <div class="flex-shrink-0">
                  <button v-if="profileSong.song_preview_url || profileSong.song_id" @click="showSpotifyModal = true"
                    class="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-emerald-600 dark:bg-emerald-700 text-white text-xs rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition">
                    <Icon name="mdi:spotify" class="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <span v-else class="text-xs text-stone-500 dark:text-stone-400">No preview</span>
                </div>
              </div>
            </div>

            <div v-else
              class="p-6 text-center border border-stone-300 dark:border-stone-700 border-dashed rounded-lg bg-stone-50 dark:bg-stone-800 transition-colors duration-300">
              <Icon name="heroicons:music-note" class="w-8 h-8 text-stone-400 dark:text-stone-500 mx-auto mb-2" />
              <p class="text-stone-600 dark:text-stone-400 text-sm">Belum ada lagu favorit yang dipilih</p>
              <p class="text-stone-500 dark:text-stone-500 text-xs mt-1">Pilih lagu dari Spotify untuk menampilkannya di
                profil
                Anda</p>
            </div>
          </div>

          <hr class="my-6 border-stone-200 dark:border-stone-800" />

          <!-- Logout Button -->
          <button @click="handleLogout"
            class="w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition">
            <Icon name="heroicons:arrow-right-on-rectangle" class="w-4 h-4" />
            Logout
            <!-- @click="logout"  -->
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
      <div
        class="relative w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 p-4 shadow-xl transition-colors duration-300">
        <!-- Close Button -->
        <button @click="showSpotifyModal = false"
          class="absolute cursor-pointer top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100">
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