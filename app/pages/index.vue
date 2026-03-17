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
</script>

<template>
  <div class="relative min-h-[calc(100vh-64px)] overflow-hidden">

    <!-- Floating Users Background -->
    <div class="users-container absolute inset-0">
      <UserCircle
        v-for="(user, i) in users"
        :key="user.id"
        :user="user"
        :index="i"
        :is-dragging="draggedUserId === user.id"
        :position="getUserPosition(user.id)"
        @dragstart="startDrag"
        @opensong="openSongModal"
      />
    </div>

    <!-- Center Content -->
    <div class="relative z-10 flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-6 px-4 text-center pointer-events-none">
      <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight drop-shadow-sm">
        Selamat Datang di
        <span class="text-blue-600 font-mansalva">MyApp</span>
      </h1>

      <p class="text-gray-600 text-lg max-w-md drop-shadow-sm">
        Masuk dengan akun Google untuk mengakses fitur lengkap.
      </p>

      <template v-if="!isAuthenticated">
        <button
          class="pointer-events-auto flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-base font-medium shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200"
          @click="loginWithGoogle"
        >
          <Icon name="logos:google-icon" class="w-5 h-5" />
          Login dengan Google
        </button>
      </template>

      <template v-else>
        <NuxtLink
          to="/profile"
          class="pointer-events-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-base font-medium hover:bg-blue-700 transition"
        >
          Lihat Profil Saya →
        </NuxtLink>
      </template>
    </div>

    <!-- Song Modal -->
    <SongModal :user="selectedUser" @close="closeSongModal" />

  </div>
</template>