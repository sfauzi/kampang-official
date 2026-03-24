<!-- pages/dashboard/albums/index.vue -->
<!--
  Lokasi  : pages/dashboard/albums/index.vue
  Layout  : dashboard | Akses: login wajib
  Fix:
  - Tampilkan album kolaboratif (pending + accepted) milik user lain
  - Badge "Kontributor" atau "Menunggu" untuk album orang lain
  - Undangan pending tampil dengan tombol Terima/Tolak di bagian atas
  - Creator album mendapat badge "Milikku"
-->
<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const {
  myAlbums, myPagination, loading, error,
  fetchMyAlbums, deleteAlbum, respondInvitation,
} = useAlbums()
const { user }    = useAuth()
const toast       = useToast()
const { confirm } = useConfirm()

const category = ref('')
const collab   = ref('')
const page     = ref(1)

const load = () =>
  fetchMyAlbums({
    category:         category.value || undefined,
    is_collaborative: collab.value === 'true'  ? true
                    : collab.value === 'false' ? false
                    : undefined,
    page:     page.value,
    per_page: 12,
  })

watch([category, collab], () => { page.value = 1; load() })
watch(page, load)
onMounted(load)

// Pisahkan: undangan pending vs album biasa
const pendingInvitations = computed(() =>
  myAlbums.value.filter(a =>
    a.contributor_status === 'pending' && a.creator?.id !== user.value?.id
  )
)

const regularAlbums = computed(() =>
  myAlbums.value.filter(a =>
    !(a.contributor_status === 'pending' && a.creator?.id !== user.value?.id)
  )
)

const handleDelete = async (id: string, title: string) => {
  const ok = await confirm({
    title:       `Hapus album "${title}"?`,
    message:     'Album dan semua kenangan di dalamnya akan dihapus permanen.',
    confirmText: 'Hapus',
    cancelText:  'Batal',
    type:        'danger',
  })
  if (!ok) return
  const success = await deleteAlbum(id)
  if (success) toast.success('Album berhasil dihapus.')
  else toast.error(error.value ?? 'Gagal menghapus.')
}

const handleRespond = async (albumId: string, status: 'accepted' | 'declined', title: string) => {
  const ok = await respondInvitation(albumId, status)
  if (ok) {
    toast.success(status === 'accepted'
      ? `Kamu sekarang menjadi kontributor "${title}"!`
      : `Undangan "${title}" ditolak.`
    )
    load()
  } else {
    toast.error(error.value ?? 'Gagal merespons undangan.')
  }
}

// Tentukan label & style badge berdasar relasi user ke album
const getAlbumBadge = (a: any) => {
  if (a.creator?.id === user.value?.id) return { label: 'Milikku', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50' }
  if (a.contributor_status === 'accepted') return { label: 'Kontributor', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50' }
  if (a.contributor_status === 'pending')  return { label: 'Menunggu', cls: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/60 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50' }
  return null
}

const privacyLabel: Record<string, string> = { public: 'Publik', group: 'Grup', private: 'Privat' }
const privacyClass: Record<string, string> = {
  public: 'bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/50',
  group: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50',
  private: 'bg-yellow-50 dark:bg-yellow-950/60 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50'
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 font-[Manrope]">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 animate-[fadeIn_0.4s_ease_forwards]">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Albumku</h1>
        <p class="text-sm text-gray-400 mt-1 flex items-center gap-1">
          <Icon name="heroicons:book-open" class="w-3.5 h-3.5" />
          Album milikmu + album kolaboratif yang kamu ikuti
          <span v-if="myPagination">({{ myPagination.total }} album)</span>
        </p>
      </div>
      <NuxtLink
        to="/dashboard/albums/create"
        class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all duration-200"
      >
        <Icon name="heroicons:plus" class="w-4 h-4" />
        Buat Album
      </NuxtLink>
    </div>

    <!-- ── Undangan pending ── -->
    <div v-if="pendingInvitations.length" class="mb-6 animate-[slideUp_0.3s_ease_forwards]">
      <h2 class="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
        <Icon name="heroicons:bell" class="w-4 h-4" />
        Undangan Album ({{ pendingInvitations.length }})
      </h2>
      <div class="space-y-2">
        <div
          v-for="a in pendingInvitations"
          :key="a.id"
          class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 border-l-4 border-l-amber-400 rounded-2xl p-4 flex items-center gap-4 flex-wrap"
        >
          <div class="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#101010] shrink-0">
            <img v-if="a.cover_media?.url" :src="a.cover_media.url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Icon name="heroicons:book-open" class="w-6 h-6 text-gray-300 dark:text-neutral-700" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-900 dark:text-white text-sm truncate">{{ a.title }}</p>
            <p class="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Icon name="heroicons:user-circle" class="w-3 h-3" />
              Oleh {{ a.creator?.name }}
              <span class="text-gray-300 dark:text-neutral-700">·</span>
              <Icon name="heroicons:photo" class="w-3 h-3" />
              {{ a.memories_count ?? 0 }} kenangan
            </p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
              @click="handleRespond(a.id, 'accepted', a.title)"
            >
              <Icon name="heroicons:check" class="w-3.5 h-3.5" />
              Terima
            </button>
            <button
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#101010] hover:bg-gray-200 dark:hover:bg-black text-gray-600 dark:text-gray-400 text-xs font-semibold transition border border-gray-200 dark:border-neutral-800"
              @click="handleRespond(a.id, 'declined', a.title)"
            >
              <Icon name="heroicons:x-mark" class="w-3.5 h-3.5" />
              Tolak
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter -->
    <div class="flex flex-wrap gap-2 mb-6">
      <select
        v-model="category"
        class="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-700 dark:text-gray-300 text-sm focus:outline-none transition appearance-none cursor-pointer"
      >
        <option value="">Semua Kategori</option>
        <option value="school">Sekolah</option>
        <option value="hiking">Pendakian</option>
        <option value="traveling">Traveling</option>
        <option value="other">Lainnya</option>
      </select>
      <select
        v-model="collab"
        class="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-700 dark:text-gray-300 text-sm focus:outline-none transition appearance-none cursor-pointer"
      >
        <option value="">Semua Tipe</option>
        <option value="true">Kolaboratif</option>
        <option value="false">Personal</option>
      </select>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="i in 8"
        :key="i"
        class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden animate-pulse"
      >
        <div class="aspect-square bg-gray-100 dark:bg-neutral-800" />
        <div class="p-3 space-y-2">
          <div class="h-3.5 bg-gray-100 dark:bg-neutral-800 rounded-lg w-3/4" />
          <div class="h-3 bg-gray-100 dark:bg-neutral-800 rounded-lg w-1/2" />
          <div class="h-7 bg-gray-100 dark:bg-neutral-800 rounded-xl w-full mt-1" />
        </div>
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

    <!-- Empty state -->
    <div
      v-else-if="!regularAlbums.length && !pendingInvitations.length"
      class="flex flex-col items-center justify-center py-24 gap-3"
    >
      <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#181818] border border-gray-200 dark:border-neutral-800 flex items-center justify-center">
        <Icon name="heroicons:book-open" class="w-8 h-8 text-gray-300 dark:text-neutral-700" />
      </div>
      <p class="text-base font-semibold text-gray-500 dark:text-gray-400">Belum ada album</p>
      <NuxtLink
        to="/dashboard/albums/create"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition mt-1"
      >
        <Icon name="heroicons:plus" class="w-3.5 h-3.5" />
        Buat Album Pertama
      </NuxtLink>
    </div>

    <!-- Grid album -->
    <div v-else-if="regularAlbums.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <article
        v-for="a in regularAlbums"
        :key="a.id"
        class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
      >
        <!-- Thumbnail -->
        <NuxtLink :to="`/albums/${a.id}`">
          <div class="aspect-square bg-gray-100 dark:bg-[#101010] overflow-hidden relative">
            <img
              v-if="a.cover_media?.url"
              :src="a.cover_media.url"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Icon name="heroicons:book-open" class="w-12 h-12 text-gray-300 dark:text-neutral-700" />
            </div>

            <!-- Badges kiri atas -->
            <div class="absolute top-2 left-2 flex flex-col gap-1">
              <span
                v-if="getAlbumBadge(a)"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                :class="getAlbumBadge(a)?.cls"
              >
                {{ getAlbumBadge(a)?.label }}
              </span>
              <span
                v-if="a.is_collaborative"
                class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50"
              >
                <Icon name="heroicons:user-group" class="w-2.5 h-2.5" />
                Kolaboratif
              </span>
            </div>

            <!-- Badge privasi kanan atas -->
            <span
              class="absolute top-2 right-2 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium border"
              :class="privacyClass[a.privacy]"
            >
              <Icon
                :name="a.privacy === 'public' ? 'heroicons:globe-alt' : a.privacy === 'group' ? 'heroicons:user-group' : 'heroicons:lock-closed'"
                class="w-2.5 h-2.5"
              />
              {{ privacyLabel[a.privacy] }}
            </span>
          </div>
        </NuxtLink>

        <!-- Info -->
        <div class="p-3">
          <NuxtLink
            :to="`/albums/${a.id}`"
            class="font-semibold text-sm text-gray-900 dark:text-white hover:text-amber-500 dark:hover:text-amber-400 line-clamp-1 block mb-0.5 transition-colors"
          >
            {{ a.title }}
          </NuxtLink>

          <p v-if="a.creator?.id !== user?.id" class="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
            <Icon name="heroicons:user-circle" class="w-3 h-3" />
            oleh {{ a.creator?.name }}
          </p>

          <p class="text-xs text-gray-400 mb-3 flex items-center gap-1">
            <Icon name="heroicons:photo" class="w-3 h-3" />
            {{ a.memories_count ?? 0 }} kenangan
            <template v-if="a.event_date">
              <span class="text-gray-300 dark:text-neutral-700">·</span>
              {{ a.event_date }}
            </template>
          </p>

          <!-- Actions: creator -->
          <div v-if="a.creator?.id === user?.id" class="flex gap-1.5">
            <NuxtLink
              :to="`/albums/${a.id}`"
              class="flex-1 inline-flex items-center justify-center px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-[#101010] hover:bg-gray-200 dark:hover:bg-black text-gray-600 dark:text-gray-400 text-xs font-semibold transition border border-gray-200 dark:border-neutral-800"
            >
              Lihat
            </NuxtLink>
            <NuxtLink
              :to="`/dashboard/albums/${a.id}/edit`"
              class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#101010] hover:bg-gray-200 dark:hover:bg-black text-gray-500 dark:text-gray-400 transition border border-gray-200 dark:border-neutral-800"
            >
              <Icon name="heroicons:pencil-square" class="w-3.5 h-3.5" />
            </NuxtLink>
            <button
              class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-500 dark:text-red-400 transition border border-red-200 dark:border-red-800/50"
              @click="handleDelete(a.id, a.title)"
            >
              <Icon name="heroicons:trash" class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Actions: kontributor -->
          <NuxtLink
            v-else
            :to="`/albums/${a.id}`"
            class="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-[#101010] hover:bg-gray-200 dark:hover:bg-black text-gray-600 dark:text-gray-400 text-xs font-semibold transition border border-gray-200 dark:border-neutral-800"
          >
            <Icon name="heroicons:eye" class="w-3.5 h-3.5" />
            Lihat Album
          </NuxtLink>
        </div>
      </article>
    </div>

    <!-- Pagination -->
    <div
      v-if="myPagination && myPagination.last_page > 1"
      class="flex justify-center gap-2 mt-8"
    >
      <button
        v-for="p in myPagination.last_page"
        :key="p"
        class="w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-200"
        :class="p === myPagination.current_page
          ? 'bg-amber-500 text-white shadow-sm'
          : 'bg-white dark:bg-[#181818] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-neutral-800 hover:border-amber-500 hover:text-amber-500'"
        @click="page = p"
      >
        {{ p }}
      </button>
    </div>

    <BaseToast />
    <BaseConfirm />
  </div>
</template>