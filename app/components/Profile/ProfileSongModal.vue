<script lang="ts" setup>
import type { SpotifyTrack } from '~/types/user'

interface Props {
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'selected', track: SpotifyTrack): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { searchTracks } = useSpotify()

const searchQuery = ref('')
const searchResults = ref<SpotifyTrack[]>([])
const isSearching = ref(false)
const selectedTrack = ref<SpotifyTrack | null>(null)
const previewUrl = ref<string | null>(null)

const performSearch = async () => {
  if (!searchQuery.value.trim() || searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  searchResults.value = await searchTracks(searchQuery.value)
  isSearching.value = false
}

const selectTrack = (track: SpotifyTrack) => {
  selectedTrack.value = track
  previewUrl.value = track.preview_url
}

const handleConfirm = () => {
  if (selectedTrack.value) {
    emit('selected', selectedTrack.value)
    emit('update:open', false)
    searchQuery.value = ''
    searchResults.value = []
    selectedTrack.value = null
    previewUrl.value = null
  }
}

const closeModal = () => {
  emit('update:open', false)
  searchQuery.value = ''
  searchResults.value = []
  selectedTrack.value = null
  previewUrl.value = null
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Pilih Lagu Profile</h2>
        <button
          class="text-gray-400 hover:text-gray-600 transition"
          @click="closeModal"
        >
          <Icon name="heroicons:x-mark-20-solid" class="w-6 h-6" />
        </button>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Cari Lagu di Spotify</label>
        <div class="flex gap-2">
          <input
            v-model="searchQuery"
            type="text"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Cari judul lagu atau artis..."
            @keyup.enter="performSearch"
          />
          <button
            @click="performSearch"
            :disabled="isSearching || !searchQuery.trim()"
            class="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:bg-gray-400"
          >
            <span v-if="!isSearching">Cari</span>
            <span v-else class="flex items-center gap-2">
              <Icon name="mdi:loading" class="w-4 h-4 animate-spin" />
            </span>
          </button>
        </div>
      </div>

      <!-- Search Results -->
      <div class="space-y-3">
        <div v-if="searchResults.length === 0 && searchQuery && !isSearching" class="text-center py-6">
          <p class="text-gray-500">Tidak ada lagu yang ditemukan</p>
        </div>

        <div
          v-for="track in searchResults"
          :key="track.id"
          @click="selectTrack(track)"
          :class="{
            'ring-2 ring-green-500': selectedTrack?.id === track.id,
          }"
          class="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition"
        >
          <div class="flex gap-4">
            <!-- Album Cover -->
            <div class="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0">
              <img
                v-if="track.image"
                :src="track.image"
                :alt="track.title"
                class="w-full h-full object-cover rounded-lg"
              />
              <Icon
                v-else
                name="heroicons:music-note"
                class="w-8 h-8 text-gray-400 m-4"
              />
            </div>

            <!-- Track Info -->
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900">{{ track.title }}</h3>
              <p class="text-sm text-gray-600">{{ track.artist }}</p>
            </div>

            <!-- Preview Button -->
            <div class="flex items-center gap-2">
              <a
                v-if="track.spotify_url"
                :href="track.spotify_url"
                target="_blank"
                class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
              >
                <Icon name="mdi:spotify" class="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Player -->
      <div v-if="selectedTrack && previewUrl" class="mt-6 p-4 bg-gray-50 rounded-lg">
        <p class="text-sm font-medium text-gray-700 mb-3">Preview</p>
        <audio
          :src="previewUrl"
          controls
          class="w-full"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 mt-8">
        <button
          type="button"
          @click="closeModal"
          class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          Batal
        </button>
        <button
          type="button"
          @click="handleConfirm"
          :disabled="!selectedTrack"
          class="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:bg-gray-400"
        >
          Pilih Lagu
        </button>
      </div>
    </div>
  </div>
</template>