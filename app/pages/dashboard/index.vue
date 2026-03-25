<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { user }                                         = useAuth()
const { myMemories, fetchMyMemories, togglePin }       = useMemories()
const { myGroups,   fetchMyGroups }                    = useGroups()
const { myAlbums,   fetchMyAlbums }                    = useAlbums()
const toast = useToast()
const { setPageSeo } = useSeoMetaHelper()


const isVideoMedia = (media: any): boolean => {
  const type = String(media?.type ?? media?.media_type ?? '').toLowerCase()
  const mime = String(media?.mime_type ?? '').toLowerCase()
  return type === 'video' || type.includes('video') || mime.startsWith('video/')
}

const getMediaCardPreview = (media: any): string | null => {
  if (!media || isVideoMedia(media)) return null
  return media?.thumbnail_url
    ?? media?.thumb_url
    ?? media?.poster_url
    ?? media?.url
    ?? media?.media_url
    ?? media?.file_url
    ?? media?.original_url
    ?? null
}

onMounted(async () => {
  setPageSeo(
    'Dashboard',
    'Kelola kenangan, album, dan grup Anda di dashboard Kampang Official. Lihat statistik dan aktivitas terbaru Anda.',
    '/dashboard'
  )
  
  await Promise.all([
    // Fetch data milik user sendiri — bukan data publik
    fetchMyMemories({ per_page: 6, sort: 'created_at' }),
    fetchMyGroups({ per_page: 6 }),
    fetchMyAlbums({ per_page: 6 }),
  ])
})

const pinnedMemories = computed(() =>
  myMemories.value.filter(m => m.is_pinned)
)
const recentMemories = computed(() =>
  myMemories.value.filter(m => !m.is_pinned).slice(0, 4)
)

const handlePin = async (id: string) => {
  await togglePin(id)
  toast.success('Pin diperbarui.')
}

const stats = computed(() => [
  {
    label: 'Kenangan',
    value: user.value?.memories_count ?? myMemories.value.length,
    icon:  'heroicons:photo',
    to:    '/dashboard/memories',
  },
  {
    label: 'Grup',
    value: user.value?.groups_count ?? myGroups.value.length,
    icon:  'heroicons:user-group',
    to:    '/dashboard/groups',
  },
  {
    label: 'Album',
    value: user.value?.albums_count ?? myAlbums.value.length,
    icon:  'heroicons:book-open',
    to:    '/dashboard/albums',
  },
])
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 font-[Manrope]">

    <!-- Welcome -->
    <div class="flex items-center gap-4 mb-8 animate-[fadeIn_0.4s_ease_forwards]">
      <img
        :src="user?.avatar_url ?? `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(user?.name)}`"
        class="w-14 h-14 rounded-full object-cover ring-2 ring-amber-500/30 shrink-0"
      />
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          Halo, {{ user?.name }}
          <Icon name="heroicons:hand-raised" class="w-5 h-5 text-amber-500" />
        </h1>
        <p class="text-sm text-gray-400 mt-0.5">Selamat datang di dashboard kenangamu</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-3 mb-8">
      <NuxtLink
        v-for="stat in stats"
        :key="stat.label"
        :to="stat.to"
        class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-center group"
      >
        <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-amber-500/20 transition-colors">
          <Icon :name="stat.icon" class="w-5 h-5 text-amber-500" />
        </div>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</p>
        <p class="text-xs text-gray-400 mt-0.5">{{ stat.label }}</p>
      </NuxtLink>
    </div>

    <!-- Quick actions -->
    <div class="flex flex-wrap gap-2 mb-8">
      <NuxtLink
        to="/dashboard/memories/create"
        class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-[#181818] text-white text-sm font-bold transition-all duration-200 border border-gray-200 dark:border-neutral-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white"
      >
        <Icon name="heroicons:plus" class="w-4 h-4" />
        Kenangan Baru
      </NuxtLink>
      <NuxtLink
        to="/dashboard/albums/create"
        class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-[#181818] hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white text-gray-700 dark:text-gray-300 text-sm font-semibold transition border border-gray-200 dark:border-neutral-800"
      >
        <Icon name="heroicons:book-open" class="w-4 h-4" />
        Buat Album
      </NuxtLink>
      <NuxtLink
        to="/dashboard/groups/create"
        class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-[#181818] hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white text-gray-700 dark:text-gray-300 text-sm font-semibold transition border border-gray-200 dark:border-neutral-800"
      >
        <Icon name="heroicons:user-group" class="w-4 h-4" />
        Buat Grup
      </NuxtLink>
      <!-- <NuxtLink
        to="/map"
        class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-[#181818] hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white text-gray-700 dark:text-gray-300 text-sm font-semibold transition border border-gray-200 dark:border-neutral-800"
      >
        <Icon name="heroicons:map" class="w-4 h-4" />
        Peta Memori
      </NuxtLink> -->
    </div>

    <!-- Pinned memories -->
    <div v-if="pinnedMemories.length" class="mb-8">
      <h2 class="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Icon name="heroicons:map-pin" class="w-3.5 h-3.5 text-amber-500" />
        Kenangan Dipin
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <NuxtLink
          v-for="m in pinnedMemories"
          :key="m.id"
          :to="`/memories/${m.id}`"
          class="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#101010] hover:scale-[1.02] hover:shadow-lg transition-all duration-200 group"
        >
          <img
            v-if="getMediaCardPreview(m.media?.[0])"
            :src="getMediaCardPreview(m.media?.[0])!"
            class="w-full h-full object-cover group-hover:brightness-90 transition"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <Icon
              :name="isVideoMedia(m.media?.[0]) ? 'heroicons:film' : 'heroicons:photo'"
              class="w-10 h-10 text-gray-300 dark:text-neutral-700"
            />
          </div>
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
            <p class="text-white text-xs font-semibold line-clamp-1">{{ m.title ?? m.memory_date }}</p>
          </div>
          <button
            class="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-lg bg-black/50 hover:bg-amber-500 text-white transition"
            @click.prevent="handlePin(m.id)"
          >
            <Icon name="heroicons:map-pin" class="w-3.5 h-3.5" />
          </button>
        </NuxtLink>
      </div>
    </div>

    <!-- Recent memories -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
          <Icon name="heroicons:clock" class="w-3.5 h-3.5 text-amber-500" />
          Kenangan Terbaru
        </h2>
        <NuxtLink
          to="/memories"
          class="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-1 transition"
        >
          Lihat Semua
          <Icon name="heroicons:arrow-right" class="w-3 h-3" />
        </NuxtLink>
      </div>

      <!-- Empty -->
      <div
        v-if="!recentMemories.length"
        class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
      >
        <div class="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#101010] flex items-center justify-center">
          <Icon name="heroicons:photo" class="w-7 h-7 text-gray-300 dark:text-neutral-700" />
        </div>
        <p class="text-sm text-gray-400">Belum ada kenangan. Yuk mulai tambahkan!</p>
        <NuxtLink
          to="/dashboard/memories/create"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition mt-1"
        >
          <Icon name="heroicons:plus" class="w-3.5 h-3.5" />
          Tambah Kenangan
        </NuxtLink>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NuxtLink
          v-for="m in recentMemories"
          :key="m.id"
          :to="`/memories/${m.id}`"
          class="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#101010] hover:scale-[1.02] hover:shadow-lg transition-all duration-200 group"
        >
          <img
            v-if="getMediaCardPreview(m.media?.[0])"
            :src="getMediaCardPreview(m.media?.[0])!"
            class="w-full h-full object-cover group-hover:brightness-90 transition"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <Icon
              :name="isVideoMedia(m.media?.[0]) ? 'heroicons:film' : 'heroicons:photo'"
              class="w-10 h-10 text-gray-300 dark:text-neutral-700"
            />
          </div>
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2">
            <p class="text-white text-xs font-semibold line-clamp-1">{{ m.title ?? m.memory_date }}</p>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- My groups -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
          <Icon name="heroicons:user-group" class="w-3.5 h-3.5 text-amber-500" />
          Grupku
        </h2>
        <NuxtLink
          to="/groups"
          class="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-1 transition"
        >
          Lihat Semua
          <Icon name="heroicons:arrow-right" class="w-3 h-3" />
        </NuxtLink>
      </div>

      <!-- Empty -->
      <div
        v-if="!myGroups.length"
        class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl p-6 flex items-center gap-3"
      >
        <Icon name="heroicons:user-group" class="w-5 h-5 text-gray-300 dark:text-neutral-700 shrink-0" />
        <p class="text-sm text-gray-400">
          Belum bergabung grup apapun.
          <NuxtLink to="/groups" class="text-amber-500 hover:underline font-semibold ml-1">Cari grup</NuxtLink>
        </p>
      </div>

      <div v-else class="flex gap-3 overflow-x-auto pb-2">
        <NuxtLink
          v-for="g in myGroups"
          :key="g.id"
          :to="`/groups/${g.id}`"
          class="shrink-0 w-40 bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div class="h-20 bg-gray-100 dark:bg-[#101010] overflow-hidden">
            <img
              v-if="g.cover_image"
              :src="g.cover_image"
              class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Icon name="heroicons:user-group" class="w-8 h-8 text-gray-300 dark:text-neutral-700" />
            </div>
          </div>
          <div class="p-2.5">
            <p class="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1">{{ g.name }}</p>
            <p class="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Icon name="heroicons:users" class="w-3 h-3" />
              {{ g.members_count ?? 0 }} anggota
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- My albums -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
          <Icon name="heroicons:book-open" class="w-3.5 h-3.5 text-amber-500" />
          Albumku
        </h2>
        <NuxtLink
          to="/albums"
          class="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-1 transition"
        >
          Lihat Semua
          <Icon name="heroicons:arrow-right" class="w-3 h-3" />
        </NuxtLink>
      </div>

      <!-- Empty -->
      <div
        v-if="!myAlbums.length"
        class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl p-6 flex items-center gap-3"
      >
        <Icon name="heroicons:book-open" class="w-5 h-5 text-gray-300 dark:text-neutral-700 shrink-0" />
        <p class="text-sm text-gray-400">
          Belum ada album.
          <NuxtLink to="/dashboard/albums/create" class="text-amber-500 hover:underline font-semibold ml-1">Buat album</NuxtLink>
        </p>
      </div>

      <div v-else class="flex gap-3 overflow-x-auto pb-2">
        <NuxtLink
          v-for="a in myAlbums"
          :key="a.id"
          :to="`/albums/${a.id}`"
          class="shrink-0 w-36 bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div class="aspect-square bg-gray-100 dark:bg-[#101010] overflow-hidden">
            <img
              v-if="a.cover_media?.url"
              :src="a.cover_media.url"
              class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Icon name="heroicons:book-open" class="w-8 h-8 text-gray-300 dark:text-neutral-700" />
            </div>
          </div>
          <div class="p-2.5">
            <p class="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1">{{ a.title }}</p>
            <p class="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Icon name="heroicons:photo" class="w-3 h-3" />
              {{ a.memories_count ?? 0 }} kenangan
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>

    <BaseToast />
  </div>
</template>