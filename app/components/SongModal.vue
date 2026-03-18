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
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-2 backdrop-blur-sm transition-colors duration-300"
      @click="emit('close')"
    >
      <div
        class="relative w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 p-4 shadow-xl transition-colors duration-300"
        @click.stop
      >
        <!-- Close -->
        <button
          @click="emit('close')"
          class="absolute cursor-pointer top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/90 dark:bg-stone-800/90 text-stone-600 dark:text-stone-300 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100"
        >
          <Icon name="heroicons:x-mark" class="w-5 h-5" />
        </button>

        <!-- User header -->
        <div class="mb-4 flex items-center gap-3">
          <div class="h-12 w-12 overflow-hidden rounded-full border-2 border-stone-300 dark:border-stone-700 bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 flex items-center justify-center transition-colors duration-300">
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
            <h3 class="text-lg font-bold text-stone-900 dark:text-stone-50">{{ user.name }}</h3>
            <p class="text-sm text-stone-500 dark:text-stone-400">Profile Song</p>
          </div>
        </div>

        <!-- Song info -->
        <div v-if="user.profile_song" class="mb-4 rounded-lg bg-stone-50 dark:bg-stone-800 p-3 transition-colors duration-300">
          <div class="flex items-center gap-3">
            <img
              v-if="user.profile_song.song_image"
              :src="user.profile_song.song_image"
              :alt="user.profile_song.song_title"
              class="h-10 w-10 rounded object-cover"
            />
            <div v-else class="h-10 w-10 rounded bg-stone-200 dark:bg-stone-700 flex items-center justify-center transition-colors duration-300">
              <Icon name="heroicons:music-note" class="w-5 h-5 text-stone-400 dark:text-stone-500" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-stone-900 dark:text-stone-50 truncate">{{ user.profile_song.song_title }}</p>
              <p class="text-sm text-stone-500 dark:text-stone-400 truncate">{{ user.profile_song.song_artist }}</p>
            </div>
          </div>
        </div>

        <!-- Spotify embed -->
        <iframe
          v-if="user.profile_song?.song_id"
          :src="`https://open.spotify.com/embed/track/${user.profile_song.song_id}?utm_source=generator&theme=1`"
          width="100%"
          height="352"
          frameborder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          class="rounded-xl"
        />
        <div v-else class="flex h-[352px] items-center justify-center text-center text-stone-400 dark:text-stone-500 transition-colors duration-300">
          <div>
            <Icon name="heroicons:music-note" class="w-12 h-12 mx-auto mb-2" />
            <p class="text-sm">Unable to load Spotify embed</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>