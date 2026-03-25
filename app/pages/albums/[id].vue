<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const id    = route.params.id as string

const { album, loading, error, fetchAlbum, deleteAlbum, inviteContributors, removeContributor } = useAlbums()
const { isAuthenticated, user } = useAuth()
const toast = useToast()
const { confirm } = useConfirm()
const router = useRouter()
const { setAlbumSeo } = useSeoMetaHelper()

onMounted(() => {
  fetchAlbum(id)
  setAlbumSeo(album.value)  // ← Set SEO
})

watch(album, (newAlbum) => {
  setAlbumSeo(newAlbum)
})

const isCreator = computed(() => album.value?.creator?.id === user.value?.id)
const canContribute = computed(() => {
  if (isCreator.value) return true
  return album.value?.contributors?.some(c => c.id === user.value?.id)
})

const handleDelete = async () => {
  const ok = await confirm({
    title: 'Hapus album?',
    message: `Album "${album.value?.title}" dan semua kenangan di dalamnya akan dihapus.`,
    confirmText: 'Hapus',
    cancelText: 'Batal',
    type: 'danger',
  })
  if (!ok) return
  const success = await deleteAlbum(id)
  if (success) { toast.success('Album dihapus.'); router.push('/albums') }
  else toast.error(error.value ?? 'Gagal menghapus.')
}

const inviteEmail = ref('')
const handleInvite = async () => {
  // Simplified: invite by user ID in real app would be a user search
  toast.info('Fitur undang via ID — gunakan user search component.')
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 font-[Manrope]">

    <!-- Skeleton loading -->
    <div v-if="loading && !album" class="space-y-4 animate-pulse">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="w-full sm:w-48 h-48 bg-gray-100 dark:bg-neutral-800 rounded-2xl shrink-0" />
        <div class="flex-1 space-y-3 py-1">
          <div class="h-7 bg-gray-100 dark:bg-neutral-800 rounded-xl w-2/3" />
          <div class="h-4 bg-gray-100 dark:bg-neutral-800 rounded-xl w-1/2" />
          <div class="h-4 bg-gray-100 dark:bg-neutral-800 rounded-xl w-full" />
          <div class="h-4 bg-gray-100 dark:bg-neutral-800 rounded-xl w-4/5" />
        </div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div v-for="i in 8" :key="i" class="aspect-square bg-gray-100 dark:bg-neutral-800 rounded-2xl" />
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm"
    >
      <Icon name="heroicons:exclamation-circle" class="w-4 h-4 shrink-0" />
      {{ error }}
    </div>

    <div v-else-if="album" class="animate-[fadeIn_0.4s_ease_forwards]">

      <!-- ── Header Card ── -->
      <div class="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 p-5 mb-4">
        <div class="flex flex-col sm:flex-row gap-5">

          <!-- Cover -->
          <div class="w-full sm:w-48 h-48 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#101010] shrink-0">
            <img
              v-if="album.cover_media?.url"
              :src="album.cover_media.url"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Icon name="heroicons:book-open" class="w-16 h-16 text-gray-300 dark:text-neutral-700" />
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1 leading-tight">{{ album.title }}</h1>

            <p class="text-sm text-gray-400 mb-3 flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span class="flex items-center gap-1">
                <Icon name="heroicons:user-circle" class="w-3.5 h-3.5" />
                {{ album.creator?.name }}
              </span>
              <template v-if="album.group">
                <span class="text-gray-300 dark:text-neutral-700">·</span>
                <span class="flex items-center gap-1">
                  <Icon name="heroicons:user-group" class="w-3.5 h-3.5" />
                  {{ album.group.name }}
                </span>
              </template>
              <template v-if="album.event_date">
                <span class="text-gray-300 dark:text-neutral-700">·</span>
                <span class="flex items-center gap-1">
                  <Icon name="heroicons:calendar-days" class="w-3.5 h-3.5" />
                  {{ album.event_date }}
                </span>
              </template>
            </p>

            <p v-if="album.description" class="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              {{ album.description }}
            </p>

            <!-- Badges -->
            <div class="flex flex-wrap gap-2 mb-4">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#101010] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-neutral-800">
                <Icon name="heroicons:tag" class="w-3 h-3" />
                {{ album.category }}
              </span>
              <span
                v-if="album.is_collaborative"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50"
              >
                <Icon name="heroicons:user-group" class="w-3 h-3" />
                Kolaboratif
              </span>
              <span
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
                :class="album.privacy === 'public'
                  ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/50'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'"
              >
                <Icon
                  :name="album.privacy === 'public' ? 'heroicons:globe-alt' : album.privacy === 'group' ? 'heroicons:user-group' : 'heroicons:lock-closed'"
                  class="w-3 h-3"
                />
                {{ album.privacy === 'public' ? 'Publik' : album.privacy === 'group' ? 'Grup' : 'Privat' }}
              </span>
            </div>

            <!-- Stats -->
            <p class="text-xs text-gray-400 flex items-center gap-3 mb-4">
              <span class="flex items-center gap-1">
                <Icon name="heroicons:photo" class="w-3.5 h-3.5" />
                {{ album.memories_count ?? 0 }} kenangan
              </span>
              <span class="flex items-center gap-1">
                <Icon name="heroicons:users" class="w-3.5 h-3.5" />
                {{ album.contributors_count ?? 0 }} kontributor
              </span>
            </p>

            <!-- Actions -->
            <div class="flex flex-wrap gap-2">
              <template v-if="isCreator">
                <NuxtLink
                  :to="`/dashboard/albums/${id}/edit`"
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#101010] hover:bg-gray-200 dark:hover:bg-[#0a0a0a] text-gray-700 dark:text-gray-300 text-xs font-semibold transition border border-gray-200 dark:border-neutral-800"
                >
                  <Icon name="heroicons:pencil-square" class="w-3.5 h-3.5" />
                  Edit
                </NuxtLink>
                <button
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-500 dark:text-red-400 text-xs font-semibold transition border border-red-200 dark:border-red-800/50"
                  @click="handleDelete"
                >
                  <Icon name="heroicons:trash" class="w-3.5 h-3.5" />
                  Hapus
                </button>
              </template>
              <NuxtLink
                v-if="canContribute"
                :to="`/dashboard/memories/create?album_id=${id}`"
                class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
              >
                <Icon name="heroicons:plus" class="w-3.5 h-3.5" />
                Tambah Kenangan ke Album
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Contributors Card ── -->
      <div
        v-if="album.contributors?.length"
        class="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 p-5 mb-4"
      >
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-3">
          <Icon name="heroicons:users" class="w-4 h-4 text-amber-500" />
          Kontributor
        </p>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="c in album.contributors"
            :key="c.id"
            class="flex items-center gap-2 bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 rounded-full pl-1 pr-3 py-1"
          >
            <img :src="c.avatar ?? `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(c.name)}`" class="w-6 h-6 rounded-full object-cover" />
            <span class="text-xs font-medium text-gray-700 dark:text-gray-200">{{ c.name }}</span>
            <button
              v-if="isCreator"
              class="text-gray-300 dark:text-neutral-600 hover:text-red-500 transition leading-none ml-0.5"
              @click="removeContributor(id, c.id)"
            >
              <Icon name="heroicons:x-mark" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- ── Memory Grid ── -->
      <div
        v-if="!album.memories?.length"
        class="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 py-20 flex flex-col items-center justify-center gap-3"
      >
        <div class="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#101010] flex items-center justify-center">
          <Icon name="heroicons:photo" class="w-7 h-7 text-gray-300 dark:text-neutral-700" />
        </div>
        <p class="text-sm text-gray-400">Belum ada kenangan di album ini.</p>
        <NuxtLink
          v-if="canContribute"
          :to="`/dashboard/memories/create?album_id=${id}`"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition mt-1"
        >
          <Icon name="heroicons:plus" class="w-3.5 h-3.5" />
          Tambah Kenangan Pertama
        </NuxtLink>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <NuxtLink
          v-for="m in album.memories"
          :key="m.id"
          :to="`/memories/${m.id}`"
          class="aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#101010] hover:scale-[1.02] hover:shadow-lg transition-all duration-200 relative group"
        >
          <img
            v-if="m.media?.[0]?.url"
            :src="m.media[0].thumbnail_url ?? m.media[0].url"
            class="w-full h-full object-cover group-hover:brightness-90 transition"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <Icon name="heroicons:photo" class="w-10 h-10 text-gray-300 dark:text-neutral-700" />
          </div>
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
            <p class="text-white text-xs font-semibold line-clamp-1">{{ m.title ?? m.memory_date }}</p>
            <p class="text-white/60 text-xs mt-0.5 flex items-center gap-1">
              <Icon name="heroicons:user-circle" class="w-3 h-3" />
              {{ m.user?.name }}
            </p>
          </div>
        </NuxtLink>
      </div>

    </div>

    <BaseToast />
    <BaseConfirm />
  </div>
</template>