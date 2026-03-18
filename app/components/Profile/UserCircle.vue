<script lang="ts" setup>
import Marquee from '../ui/marquee/Marquee.vue'

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

interface Props {
    user: UserItem
    index: number
    isDragging: boolean
    position: { top: string; left: string }
}

const props = defineProps<Props>()
const emit = defineEmits<{
    (e: 'dragstart', event: MouseEvent | TouchEvent, userId: number): void
    (e: 'opensong', userId: number): void
}>()

const getInitial = (name: string) => name?.charAt(0).toUpperCase() ?? '?'
</script>

<template>
    <div class="absolute flex flex-col items-center" :class="{
        'animate-float': !isDragging,
        'cursor-grab': !isDragging,
        'z-50 cursor-grabbing': isDragging,
        'hover:scale-105 transition-transform': !isDragging,
    }" :style="{
        top: position.top,
        left: position.left,
        animationDelay: isDragging ? '0s' : index * 0.5 + 's',
        transition: isDragging ? 'none' : 'all 0.2s ease-out',
    }" @mousedown="emit('dragstart', $event, user.id)" @touchstart="emit('dragstart', $event, user.id)">
        <div class="relative">
            <!-- Avatar -->
            <div class="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-full border-2 border-stone-300 dark:border-stone-700 bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-xl font-bold shadow-lg transition-colors duration-300"
                :class="isDragging ? 'ring-4 ring-amber-400 dark:ring-amber-300 ring-opacity-50 shadow-2xl' : 'hover:shadow-xl'">
                <img :src="user.avatar ?? `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(user.name)}`"
                    :alt="user.name" class="h-full w-full object-cover pointer-events-none select-none"
                    draggable="false" />
            </div>

            <!-- Bubble Notes + Song -->
            <div v-if="user.notes || user.profile_song"
                class="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full z-10 mb-2 min-w-[80px] max-w-[140px] rounded-xl border border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-stone-800/80 px-3 text-xs font-medium shadow-lg backdrop-blur-lg text-stone-800 dark:text-stone-100 transition-colors duration-300"
                :class="isDragging ? 'opacity-75' : 'opacity-100'">
                <!-- Notes -->
                <p v-if="user.notes" class="py-2 text-center leading-tight break-words">
                    {{ user.notes }}
                </p>

                <!-- Profile Song marquee -->
                <div v-if="user.profile_song"
                    class="pointer-events-auto cursor-pointer overflow-hidden py-1.5 hover:opacity-80 transition-opacity"
                    @click.stop="emit('opensong', user.id)"
                    @touchstart.stop
                    @touchend.stop="emit('opensong', user.id)">
                    <Marquee :speed="30" :pauseOnHover="true" >
                        <span class="inline-block font-bold"> 🎵 {{ user.profile_song.song_title }} - {{
                            user.profile_song.song_artist }} </span>
                    </Marquee>
                </div>

                <!-- Bubble tail -->
                <span
                    class="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0 w-0 border-t-4 border-r-4 border-l-4 border-t-white/80 dark:border-t-stone-800/80 border-r-transparent border-l-transparent transition-colors duration-300" />
            </div>
        </div>

        <!-- Name label -->
        <span
            class="pointer-events-none mt-2 rounded-full bg-black/30 dark:bg-stone-950/50 px-2 py-1 text-center text-xs sm:text-sm font-medium text-white backdrop-blur-sm select-none transition-colors duration-300">
            {{ user.name }}
        </span>
    </div>
</template>

<style scoped>
@keyframes float {

    0%,
    100% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-10px);
    }
}
.animate-float {
    animation: float 6s ease-in-out infinite;
}
</style>