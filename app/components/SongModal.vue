<script lang="ts" setup>
interface ProfileSong {
  song_id: string
  song_title: string
  song_artist: string
  song_image?: string | null
}

interface UserItem {
  id: number
  name: string
  avatar?: string | null
  profile_song?: ProfileSong | null
}

interface Props {
  user: UserItem | null
}

defineProps<Props>()
const emit = defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="user"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-2 backdrop-blur-sm"
      @click="emit('close')"
    >
      <div
        class="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-xl"
        @click.stop
      >
        <!-- Close -->
        <button
          @click="emit('close')"
          class="absolute top-4 right-4 z-10 rounded-full bg-white/90 p-2 text-gray-600 shadow-md hover:bg-white hover:text-gray-900 transition-all"
        >
          <Icon name="heroicons:x-mark" class="w-5 h-5" />
        </button>

        <!-- User header -->
        <div class="mb-4 flex items-center gap-3">
          <div class="h-12 w-12 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-700 flex items-center justify-center">
            <img
              v-if="user.avatar"
              :src="user.avatar"
              :alt="user.name"
              class="h-full w-full object-cover"
            />
            <span v-else class="text-white font-bold text-lg">
              {{ user.name?.charAt(0).toUpperCase() }}
            </span>
          </div>
          <div>
            <h3 class="text-lg font-bold text-gray-900">{{ user.name }}</h3>
            <p class="text-sm text-gray-500">Profile Song</p>
          </div>
        </div>

        <!-- Song info -->
        <div v-if="user.profile_song" class="mb-4 rounded-lg bg-gray-50 p-3">
          <div class="flex items-center gap-3">
            <img
              v-if="user.profile_song.song_image"
              :src="user.profile_song.song_image"
              :alt="user.profile_song.song_title"
              class="h-10 w-10 rounded object-cover"
            />
            <div v-else class="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
              <Icon name="heroicons:music-note" class="w-5 h-5 text-gray-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate">{{ user.profile_song.song_title }}</p>
              <p class="text-sm text-gray-500 truncate">{{ user.profile_song.song_artist }}</p>
            </div>
          </div>
        </div>

        <!-- Spotify embed -->
        <iframe
          v-if="user.profile_song?.song_id"
          :src="`https://open.spotify.com/embed/track/${user.profile_song.song_id}?utm_source=generator&theme=0`"
          width="100%"
          height="352"
          frameborder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          class="rounded-xl"
        />
        <div v-else class="flex h-[352px] items-center justify-center text-center text-gray-400">
          <div>
            <Icon name="heroicons:music-note" class="w-12 h-12 mx-auto mb-2" />
            <p class="text-sm">Unable to load Spotify embed</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>