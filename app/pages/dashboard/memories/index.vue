<!-- pages/dashboard/memories/index.vue -->
<!--
  Lokasi  : pages/dashboard/memories/index.vue
  Layout  : dashboard
  Akses   : Login wajib (middleware: auth)
  Fungsi  : Daftar SEMUA kenangan milik user yang sedang login,
            termasuk yang private dan group.
            Bisa filter, sort, pin, dan hapus langsung dari sini.
-->
<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const {
  myMemories, myPagination, loading, error,
  fetchMyMemories, deleteMemory, togglePin,
} = useMemories()
const toast = useToast()
const { confirm } = useConfirm()
const { listen } = useMemoryChannel()

const category = ref('')
const sort     = ref<'memory_date' | 'created_at'>('created_at')
const page     = ref(1)

const load = () =>
  fetchMyMemories({ category: category.value || undefined, sort: sort.value, page: page.value, per_page: 15 })

watch([category, sort], () => { page.value = 1; load() })
watch(page, load)
onMounted(load)

const handleDelete = async (id: string, title: string) => {
  const ok = await confirm({
    title: `Hapus "${title || 'kenangan ini'}"?`,
    message: 'Kenangan dan semua medianya akan dihapus permanen.',
    confirmText: 'Hapus',
    cancelText: 'Batal',
    type: 'danger',
  })
  if (!ok) return
  const success = await deleteMemory(id)
  if (success) toast.success('Kenangan berhasil dihapus.')
  else toast.error(error.value ?? 'Gagal menghapus.')
}

const handlePin = async (id: string) => {
  await togglePin(id)
  const m = myMemories.value.find(m => m.id === id)
  toast.success(m?.is_pinned ? 'Kenangan dipin.' : 'Pin dilepas.')
}

const privacyLabel: Record<string, string> = {
  public: 'Publik', group: 'Grup', private: 'Privat',
}
const privacyClass: Record<string, string> = {
  public:  'bg-emerald-500/80 text-white',
  group:   'bg-blue-500/80 text-white',
  private: 'bg-amber-500/80 text-white',
}

onMounted(async () => {
  await fetchMyMemories({ /* params yang sudah ada */ })
})

// Pasang listener BroadcastChannel
onMounted(() => {
  const unlisten = listen((event) => {
    if (event.type === 'created') {
      if (!myMemories.value.find(m => m.id === event.memory.id)) myMemories.value.unshift(event.memory)
    } else if (event.type === 'updated') {
      const idx = myMemories.value.findIndex(m => m.id === event.memory.id)
      if (idx !== -1) myMemories.value[idx] = event.memory
    } else if (event.type === 'deleted') {
      myMemories.value = myMemories.value.filter(m => m.id !== event.id)
    } else if (event.type === 'pin_toggled') {
      const m = myMemories.value.find(x => x.id === event.id)
      if (m) m.is_pinned = event.is_pinned
    } else if (event.type === 'reaction_toggled') {
      const m = myMemories.value.find(x => x.id === event.memoryId)
      if (m) {
        m.reactions_count = event.total
        m.my_reaction = event.reacted ? event.reactionType : null
      }
    } else if (event.type === 'comment_added') {
      const m = myMemories.value.find(x => x.id === event.memoryId)
      if (m) m.comments_count = (m.comments_count ?? 0) + 1
    } else if (event.type === 'comment_deleted') {
      const m = myMemories.value.find(x => x.id === event.memoryId)
      if (m) m.comments_count = Math.max(0, (m.comments_count ?? 0) - 1)
    }
  })

  onUnmounted(unlisten) // cleanup saat halaman di-destroy
})

const getThumbnail = (m: any): string | null => {
  const mediaList = Array.isArray(m?.media) ? m.media : []
  if (!mediaList.length) return null

  // Prioritaskan media gambar kalau ada
  const imageMedia =
    mediaList.find((x: any) =>
      String(x?.type ?? x?.media_type ?? x?.mime_type ?? '').includes('image')
    ) ?? mediaList[0]

  return (
    imageMedia?.thumbnail_url ??
    imageMedia?.thumb_url ??
    imageMedia?.url ??
    imageMedia?.media_url ??
    imageMedia?.file_url ??
    imageMedia?.original_url ??
    null
  )
}

</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 font-[Manrope]">

    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white ">
          Kenanganku
        </h1>
        <p class="text-sm text-gray-400 mt-1">
          Semua kenangan yang pernah kamu tambahkan
          <span v-if="myPagination" class="text-brand font-semibold">
            ({{ myPagination.total }} total)
          </span>
        </p>
      </div>
      <NuxtLink
        to="/dashboard/memories/create"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm "
      >
        <Icon name="heroicons:plus-16-solid" class="w-4 h-4" />
        Tambah Kenangan
      </NuxtLink>
    </div>

    <!-- Filter bar -->
    <div class="flex flex-wrap gap-3 mb-6">
      <select
        v-model="category"
        class="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#181818] text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition appearance-none cursor-pointer"
      >
        <option value="">Semua Kategori</option>
        <option value="school">Sekolah</option>
        <option value="hiking">Pendakian</option>
        <option value="traveling">Traveling</option>
        <option value="other">Lainnya</option>
      </select>
      <select
        v-model="sort"
        class="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#181818] text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition appearance-none cursor-pointer"
      >
        <option value="created_at">Terbaru Diupload</option>
        <option value="memory_date">Urut Tanggal Kenangan</option>
      </select>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="i in 8"
        :key="i"
        class="aspect-square animate-pulse bg-gray-100 dark:bg-[#181818] rounded-2xl"
      />
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"
    >
      <Icon name="heroicons:exclamation-circle" class="w-5 h-5 shrink-0" />
      {{ error }}
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!myMemories.length"
      class="text-center py-24"
    >
      <div class="w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-5">
        <Icon name="heroicons:photo" class="w-10 h-10 text-amber-500" />
      </div>
      <p class="text-lg font-bold text-gray-800 dark:text-white mb-2 ">
        Belum ada kenangan
      </p>
      <p class="text-sm text-gray-400 mb-6">Mulai abadikan momen berhargamu sekarang</p>
      <NuxtLink
        to="/dashboard/memories/create"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm "
      >
        <Icon name="heroicons:plus-16-solid" class="w-4 h-4" />
        Tambah Kenangan Pertama
      </NuxtLink>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="m in myMemories"
        :key="m.id"
        class="group relative aspect-square rounded-2xl overflow-hidden bg-white dark:bg-[#181818] border border-gray-200 dark:border-neutral-800 transition-all duration-300"
      >
        <!-- Thumbnail -->
        <NuxtLink :to="`/memories/${m.id}`" class="block w-full h-full">
          <img
            v-if="getThumbnail(m)"
            :src="getThumbnail(m)!"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div
            v-else
            class="w-full h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500"
          >
            <Icon name="heroicons:camera" class="w-10 h-10 mb-1" />
            <span class="text-xs">Tanpa media</span>
          </div>
        </NuxtLink>

        <!-- Hover overlay -->
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 pointer-events-none group-hover:pointer-events-auto"
        >
          <!-- Top: badge privasi + pin -->
          <div class="flex items-center justify-between">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
              :class="privacyClass[m.privacy]"
            >
              {{ privacyLabel[m.privacy] }}
            </span>
            <Icon
              v-if="m.is_pinned"
              name="heroicons:map-pin-solid"
              class="w-4 h-4 text-brand drop-shadow"
            />
          </div>

          <!-- Bottom: info + actions -->
          <div>
            <p class="text-white text-xs font-semibold line-clamp-1 mb-0.5 drop-shadow">
              {{ m.title ?? m.memory_date }}
            </p>
            <p class="text-white/60 text-[10px] mb-2 flex items-center gap-1.5">
              <span class="capitalize">{{ m.category }}</span>
              <span>·</span>
              <Icon name="heroicons:heart-solid" class="w-3 h-3 text-red-400" />
              <span>{{ m.reactions_count ?? 0 }}</span>
              <Icon name="heroicons:chat-bubble-left-ellipsis-solid" class="w-3 h-3 text-blue-300" />
              <span>{{ m.comments_count ?? 0 }}</span>
            </p>
            <div class="flex gap-1.5">
              <!-- Edit -->
              <NuxtLink
                :to="`/dashboard/memories/${m.id}/edit`"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/20 hover:bg-white/35 text-white text-[10px] font-medium transition backdrop-blur-sm"
              >
                <Icon name="heroicons:pencil-square" class="w-3 h-3" />
                Edit
              </NuxtLink>

              <!-- Pin / Unpin -->
              <button
                class="inline-flex cursor-pointer items-center gap-1 px-2 py-1 rounded-lg bg-white/20 hover:bg-white/35 text-white text-[10px] font-medium transition backdrop-blur-sm"
                @click="handlePin(m.id)"
              >
                <Icon name="heroicons:map-pin" class="w-3 h-3" />
                {{ m.is_pinned ? 'Unpin' : 'Pin' }}
              </button>

              <!-- Hapus -->
              <button
                class="inline-flex cursor-pointer items-center gap-1 px-2 py-1 rounded-lg bg-red-500/80 hover:bg-red-600 text-white text-[10px] font-medium transition backdrop-blur-sm ml-auto"
                @click="handleDelete(m.id, m.title ?? '')"
              >
                <Icon name="heroicons:trash" class="w-3 h-3" />
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="myPagination && myPagination.last_page > 1"
      class="flex justify-center gap-2 mt-10"
    >
      <button
        v-for="p in myPagination.last_page"
        :key="p"
        class="w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-200"
        :class="p === myPagination.current_page
          ? 'bg-brand text-white shadow-md'
          : 'bg-gray-100 dark:bg-[#181818] text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-brand'"
        @click="page = p"
      >
        {{ p }}
      </button>
    </div>

    <BaseToast />
    <BaseConfirm />
  </div>
</template>