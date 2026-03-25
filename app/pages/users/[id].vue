<script setup lang="ts">
definePageMeta({ layout: 'default' })

import type { UserBrief } from '~/types/kenangan'

const route = useRoute()
const id = route.params.id as string

const { api } = useApi()
const { memories, fetchMemories } = useMemories()
const { isAuthenticated, user: currentUser } = useAuth()

const profile = ref<UserBrief | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const { setUserSeo } = useSeoMetaHelper()
  

onMounted(async () => {
    try {
        profile.value = await api<UserBrief>(`/api/users/${id}`)
        setUserSeo(profile.value)  // ← Set SEO
        await fetchMemories({ user_id: id, per_page: 12 })
    } catch (e: any) {
        error.value = e?.data?.message ?? 'Pengguna tidak ditemukan.'
    } finally {
        loading.value = false
    }
})

watch(profile, (newProfile) => {
  setUserSeo(newProfile)
})
const isOwnProfile = computed(() => currentUser.value?.id === id)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8 font-[Manrope]">

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-4 animate-pulse">
      <div class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl p-6">
        <div class="flex items-start gap-5">
          <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-neutral-800 shrink-0" />
          <div class="flex-1 space-y-2.5 pt-1">
            <div class="h-5 bg-gray-100 dark:bg-neutral-800 rounded-xl w-1/3" />
            <div class="h-3.5 bg-gray-100 dark:bg-neutral-800 rounded-xl w-1/2" />
            <div class="h-3.5 bg-gray-100 dark:bg-neutral-800 rounded-xl w-2/3" />
          </div>
        </div>
      </div>
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
        <div v-for="i in 8" :key="i" class="aspect-square bg-gray-100 dark:bg-neutral-800 rounded-2xl" />
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center py-24 gap-3"
    >
      <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#181818] border border-gray-200 dark:border-neutral-800 flex items-center justify-center">
        <Icon name="heroicons:face-frown" class="w-8 h-8 text-gray-300 dark:text-neutral-700" />
      </div>
      <p class="text-sm text-gray-400">{{ error }}</p>
    </div>

    <div v-else-if="profile" class="animate-[fadeIn_0.4s_ease_forwards]">

      <!-- ── Profile Card ── -->
      <div class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl p-6 mb-5 shadow-sm">
        <div class="flex items-start gap-5">
          <NuxtImg
            :src="profile.avatar_url ?? `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(profile.name)}`"
            class="w-20 h-20 rounded-full object-cover ring-2 ring-amber-500/20 shrink-0"
            width="80"
            height="80"
            fit="cover"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 flex-wrap mb-1">
              <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ profile.name }}</h1>
              <NuxtLink
                v-if="isOwnProfile"
                to="/dashboard"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#101010] hover:bg-gray-200 dark:hover:bg-black text-gray-600 dark:text-gray-400 text-xs font-semibold transition border border-gray-200 dark:border-neutral-800"
              >
                <Icon name="heroicons:pencil-square" class="w-3.5 h-3.5" />
                Edit Profil
              </NuxtLink>
            </div>

            <p v-if="profile.notes" class="text-sm text-gray-400 italic mb-1">
              "{{ profile.notes }}"
            </p>
            <p v-if="profile.description" class="text-sm text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
              {{ profile.description }}
            </p>
            <p v-if="profile.address" class="text-xs text-gray-400 flex items-center gap-1 mb-3">
              <Icon name="heroicons:map-pin" class="w-3.5 h-3.5 text-amber-500" />
              {{ profile.address }}
            </p>

            <!-- Stats -->
            <div class="flex gap-5 text-sm">
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-gray-900 dark:text-white">{{ profile.memories_count ?? 0 }}</span>
                <span class="text-gray-400">kenangan</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-gray-900 dark:text-white">{{ profile.groups_count ?? 0 }}</span>
                <span class="text-gray-400">grup</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Memories Grid ── -->
      <div>
        <h2 class="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Icon name="heroicons:photo" class="w-3.5 h-3.5 text-amber-500" />
          Kenangan Publik
        </h2>

        <!-- Empty -->
        <div
          v-if="!memories.length"
          class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl py-16 flex flex-col items-center gap-3"
        >
          <div class="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#101010] flex items-center justify-center">
            <Icon name="heroicons:photo" class="w-7 h-7 text-gray-300 dark:text-neutral-700" />
          </div>
          <p class="text-sm text-gray-400">Belum ada kenangan publik.</p>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-3 sm:grid-cols-4 gap-2">
          <NuxtLink
            v-for="m in memories"
            :key="m.id"
            :to="`/memories/${m.id}`"
            class="aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#101010] hover:scale-[1.02] hover:shadow-lg transition-all duration-200 relative group"
          >
            <NuxtImg
              v-if="m.media?.[0]?.thumbnail_url || m.media?.[0]?.url"
              :src="m.media[0].thumbnail_url ?? m.media[0].url"
              class="w-full h-full object-cover group-hover:brightness-90 transition"
              width="320"
              height="320"
              fit="cover"
              loading="lazy"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Icon name="heroicons:photo" class="w-8 h-8 text-gray-300 dark:text-neutral-700" />
            </div>

            <!-- Hover overlay -->
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-4 text-white text-xs font-semibold">
              <span class="flex items-center gap-1">
                <Icon name="heroicons:heart" class="w-4 h-4 text-red-400" />
                {{ m.reactions_count ?? 0 }}
              </span>
              <span class="flex items-center gap-1">
                <Icon name="heroicons:chat-bubble-left" class="w-4 h-4 text-blue-300" />
                {{ m.comments_count ?? 0 }}
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>

    </div>
  </div>
</template>