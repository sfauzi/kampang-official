<script lang="ts" setup>
import UserCircle from '~/components/Profile/UserCircle.vue'
import SongModal from '~/components/SongModal.vue'


interface ProfileSong {
  id: string
  song_id: string
  song_title: string
  song_artist: string
  song_image?: string | null
  preview_url?: string | null
}

interface UserItem {
  id: number
  name: string
  avatar?: string | null
  notes?: string | null
  profile_song?: ProfileSong | null
}

interface UserPosition {
  top: string
  left: string
}

const { isAuthenticated, loginWithGoogle, init } = useAuth()
const config = useRuntimeConfig()

const users = ref<UserItem[]>([])
const userPositions = ref<Map<number, UserPosition>>(new Map())
const selectedUserId = ref<number | null>(null)

// Drag state
const isDragging = ref(false)
const draggedUserId = ref<number | null>(null)
let startX = 0
let startY = 0

// ────────────────────────────────────────
// Fetch users
// ────────────────────────────────────────
const fetchUsers = async () => {
  try {
    const data = await $fetch<UserItem[]>(`${config.public.apiBase}/api/users/names`)
    users.value = data
    data.forEach((user) => {
      userPositions.value.set(user.id, randomPos())
    })
  } catch (err) {
    console.error('[index] fetchUsers error:', err)
  }
}

onMounted(async () => {
  init()
  await fetchUsers()
})

// ────────────────────────────────────────
// Position helpers
// ────────────────────────────────────────
const randomPos = (): UserPosition => ({
  top: Math.random() * 70 + 10 + '%',
  left: Math.random() * 70 + 10 + '%',
})

const getUserPosition = (userId: number) =>
  userPositions.value.get(userId) ?? { top: '50%', left: '50%' }

// ────────────────────────────────────────
// Drag handlers
// ────────────────────────────────────────
const startDrag = (event: MouseEvent | TouchEvent, userId: number) => {
  event.preventDefault()
  isDragging.value = true
  draggedUserId.value = userId

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  startX = clientX
  startY = clientY

  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', handleDrag, { passive: false })
  document.addEventListener('touchend', endDrag)
  document.body.style.cursor = 'grabbing'
}

const handleDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value || draggedUserId.value === null) return
  event.preventDefault()

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  const deltaX = clientX - startX
  const deltaY = clientY - startY

  const container = document.querySelector('.users-container') as HTMLElement
  if (!container) return
  const rect = container.getBoundingClientRect()

  const currentPos = getUserPosition(draggedUserId.value)
  const currentTopPx = (parseFloat(currentPos.top) / 100) * rect.height
  const currentLeftPx = (parseFloat(currentPos.left) / 100) * rect.width

  const newTop = Math.max(0, Math.min(90, ((currentTopPx + deltaY) / rect.height) * 100))
  const newLeft = Math.max(0, Math.min(90, ((currentLeftPx + deltaX) / rect.width) * 100))

  userPositions.value.set(draggedUserId.value, {
    top: newTop + '%',
    left: newLeft + '%',
  })

  startX = clientX
  startY = clientY
}

const endDrag = () => {
  isDragging.value = false
  draggedUserId.value = null
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', endDrag)
  document.body.style.cursor = ''
}

// ────────────────────────────────────────
// Song modal
// ────────────────────────────────────────
const openSongModal = (userId: number) => {
  if (isDragging.value) return
  selectedUserId.value = userId
}

const closeSongModal = () => {
  selectedUserId.value = null
}

const selectedUser = computed(() =>
  users.value.find((u) => u.id === selectedUserId.value) ?? null
)

// Countdown state
const remainingSeconds = ref(0)
const isLaunched = ref(false)
const isLoadingCountdown = ref(true)
let countdownInterval: ReturnType<typeof setInterval> | null = null

const fetchCountdown = async () => {
  try {
    const data = await $fetch<{
      server_time: string
      target_time: string
      remaining_seconds: number
      is_launched: boolean
    }>(`${config.public.apiBase}/api/countdown`)

    // Sinkronisasi dengan server time untuk akurasi
    const serverNow = new Date(data.server_time).getTime()
    const clientNow = Date.now()
    const drift = clientNow - serverNow // selisih client vs server

    remainingSeconds.value = data.remaining_seconds
    isLaunched.value = data.is_launched
    isLoadingCountdown.value = false

    // Koreksi drift setiap tick
    if (countdownInterval) clearInterval(countdownInterval)

    countdownInterval = setInterval(() => {
      if (remainingSeconds.value <= 0) {
        isLaunched.value = true
        remainingSeconds.value = 0
        if (countdownInterval) clearInterval(countdownInterval)
        return
      }
      remainingSeconds.value -= 1
    }, 1000)
  } catch (err) {
    console.error('[index] fetchCountdown error:', err)
    isLoadingCountdown.value = false
  }
}

// Format helpers
const countdownParts = computed(() => {
  const total = remainingSeconds.value
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return { days, hours, minutes, seconds }
})

const pad = (n: number) => String(n).padStart(2, '0')

onMounted(async () => {
  init()
  await fetchUsers()
  await fetchCountdown()
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})

useSeoMeta({
  title: 'Berbagi Cerita, Pengalaman, dan Pemikiran |',
  description: 'Kampang Official adalah platform dan blog modern yang memungkinkan pengguna untuk berbagi cerita, pengalaman, dan pemikiran. Dengan fitur-fitur inovatif dan antarmuka yang user-friendly, Kampang Official memberikan ruang bagi individu untuk mengekspresikan diri mereka tanpa batasan, sambil tetap menjaga privasi dan keamanan. Bergabunglah dengan komunitas kami dan temukan berbagai cerita menarik dari seluruh dunia!',
  keywords: 'Kampang Official, platform, blog modern, berbagi cerita, pengalaman, pemikiran, fitur inovatif, antarmuka user-friendly, ekspresikan diri, privasi, keamanan, komunitas, cerita menarik',

  ogTitle: 'Berbagi Cerita, Pengalaman, dan Pemikiran',
  ogDescription: 'Kampang Official adalah platform dan blog modern yang memungkinkan pengguna untuk berbagi cerita, pengalaman, dan pemikiran. Dengan fitur-fitur inovatif dan antarmuka yang user-friendly, Kampang Official memberikan ruang bagi individu untuk mengekspresikan diri mereka tanpa batasan, sambil tetap menjaga privasi dan keamanan. Bergabunglah dengan komunitas kami dan temukan berbagai cerita menarik dari seluruh dunia!',
  ogImage: 'https://kampang-official.vercel.app/logo-ko.png',
  ogUrl: 'https://kampang-official.vercel.app',

  twitterCard: 'summary_large_image',
  twitterTitle: 'Berbagi Cerita, Pengalaman, dan Pemikiran',
  twitterDescription: 'Kampang Official adalah platform dan blog modern yang memungkinkan pengguna untuk berbagi cerita, pengalaman, dan pemikiran. Dengan fitur-fitur inovatif dan antarmuka yang user-friendly, Kampang Official memberikan ruang bagi individu untuk mengekspresikan diri mereka tanpa batasan, sambil tetap menjaga privasi dan keamanan. Bergabunglah dengan komunitas kami dan temukan berbagai cerita menarik dari seluruh dunia!',
  twitterImage: 'https://kampang-official.vercel.app/logo-ko.png',
})

</script>

<template>
  <div class="relative min-h-[calc(100vh-64px)] overflow-hidden">

    <!-- Floating Users Background -->
    <div class="users-container absolute inset-0">
      <UserCircle v-for="(user, i) in users" :key="user.id" :user="user" :index="i"
        :is-dragging="draggedUserId === user.id" :position="getUserPosition(user.id)" @dragstart="startDrag"
        @opensong="openSongModal" />
    </div>

    <!-- Center Content -->
    <div
      class="relative z-10 flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-6 px-4 text-center pointer-events-none">
      <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight drop-shadow-sm">
        Selamat Datang di
        <span class="text-blue-600 font-mansalva">Kampang Official</span>
      </h1>

      <p class="text-gray-600 text-lg max-w-md drop-shadow-sm">
        Masuk dengan akun Google untuk mendapatkan notifikasi peluncuran.
      </p>

      <!-- Countdown Timer -->
      <div class="pointer-events-none w-full max-w-lg">

        <!-- Loading -->
        <div v-if="isLoadingCountdown" class="flex justify-center">
          <div class="w-6 h-6 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin" />
        </div>

        <!-- Launched -->
        <div v-else-if="isLaunched" class="flex flex-col items-center gap-2">
          <span
            class="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700 border border-green-200">
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
            Sudah Diluncurkan 🎉
          </span>
        </div>

        <!-- Counting down -->
        <div v-else class="flex flex-col items-center gap-3">
          
          <div class="flex items-end gap-2 sm:gap-4">
            <!-- Days -->
            <div v-if="countdownParts.days > 0" class="flex flex-col items-center">
              <div
                class="min-w-[60px] sm:min-w-[72px] rounded-xl bg-white/80 backdrop-blur border border-gray-200 shadow-sm px-3 py-3 text-center">
                <span class="text-3xl sm:text-4xl font-bold font-mansalva text-gray-900 tabular-nums">
                  {{ pad(countdownParts.days) }}
                </span>
              </div>
              <span class="mt-1 text-xs text-gray-400 uppercase tracking-wide">Hari</span>
            </div>

            <span v-if="countdownParts.days > 0" class="text-2xl font-bold text-gray-400 mb-6">:</span>

            <!-- Hours -->
            <div class="flex flex-col items-center">
              <div
                class="min-w-[60px] sm:min-w-[72px] rounded-xl bg-white/80 backdrop-blur border border-gray-200 shadow-sm px-3 py-3 text-center">
                <span class="text-3xl sm:text-4xl font-bold font-mansalva text-gray-900 tabular-nums">
                  {{ pad(countdownParts.hours) }}
                </span>
              </div>
              <span class="mt-1 text-xs text-gray-400 uppercase tracking-wide">Jam</span>
            </div>

            <span class="text-2xl font-bold text-gray-400 mb-6">:</span>

            <!-- Minutes -->
            <div class="flex flex-col items-center">
              <div
                class="min-w-[60px] sm:min-w-[72px] rounded-xl bg-white/80 backdrop-blur border border-gray-200 shadow-sm px-3 py-3 text-center">
                <span class="text-3xl sm:text-4xl font-bold font-mansalva text-gray-900 tabular-nums">
                  {{ pad(countdownParts.minutes) }}
                </span>
              </div>
              <span class="mt-1 text-xs text-gray-400 uppercase tracking-wide">Menit</span>
            </div>

            <span class="text-2xl font-bold text-gray-400 mb-6">:</span>

            <!-- Seconds -->
            <div class="flex flex-col items-center">
              <div
                class="min-w-[60px] sm:min-w-[72px] rounded-xl bg-white/80 backdrop-blur border border-gray-200 shadow-sm px-3 py-3 text-center transition-all duration-300">
                <span class="text-3xl sm:text-4xl font-bold font-mansalva text-blue-600 tabular-nums">
                  {{ pad(countdownParts.seconds) }}
                </span>
              </div>
              <span class="mt-1 text-xs text-gray-400 uppercase tracking-wide">Detik</span>
            </div>
          </div>
        </div>
      </div>

      <template v-if="!isAuthenticated">
        <button
          class="pointer-events-auto cursor-pointer flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-base font-medium shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200"
          @click="loginWithGoogle">
          <Icon name="logos:google-icon" class="w-5 h-5" />
          Login dengan Google
        </button>
      </template>

      <template v-else>
        <NuxtLink to="/profile"
          class="pointer-events-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-base font-medium hover:bg-blue-700 transition">
          Lihat Profil Saya →
        </NuxtLink>
      </template>
    </div>

    <!-- Song Modal -->
    <SongModal :user="selectedUser" @close="closeSongModal" />

  </div>
</template>