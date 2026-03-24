<!-- pages/dashboard/albums/[id]/edit.vue -->
<!--
  Lokasi  : pages/dashboard/albums/[id]/edit.vue
  Layout  : dashboard | Akses: login + harus creator album
  Fix:
  1. Undang & hapus kontributor dikirim via updateAlbum (add/remove_contributor_ids)
     → tidak butuh endpoint terpisah, satu request = satu response yang akurat
  2. Creator tidak muncul di list kontributor yang bisa dihapus
  3. Creator tidak bisa diundang ulang (exclude dari search)
  4. Toggle is_collaborative tersedia dan bisa diubah
  5. Setelah submit → album.value diperbarui dari response backend
-->
<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route  = useRoute()
const router = useRouter()
const id     = route.params.id as string

const {
  album, loading, error,
  fetchAlbum, updateAlbum,
} = useAlbums()
const { tags: allTags, fetchTags } = useTags()
const { groups, fetchGroups }      = useGroups()
const config      = useRuntimeConfig()
const toast       = useToast()
const { confirm } = useConfirm()
const { user }    = useAuth()

onMounted(async () => {
  await Promise.all([fetchAlbum(id), fetchTags(), fetchGroups({ per_page: 50 })])

  if (album.value) {
    form.title            = album.value.title
    form.description      = album.value.description ?? ''
    form.event_date       = album.value.event_date ?? ''
    form.event_end_date   = album.value.event_end_date ?? ''
    form.category         = album.value.category
    form.privacy          = album.value.privacy
    form.is_collaborative = album.value.is_collaborative
    form.group_id         = album.value.group?.id ?? null
    form.location_name    = album.value.location.name ?? ''
    form.tag_ids          = album.value.tags?.map(t => t.id) ?? []
  }

  // Load users jika sudah kolaboratif
  if (album.value?.is_collaborative) fetchAllUsers()
})

// Guard: bukan creator → redirect
watchEffect(() => {
  if (album.value && user.value && album.value.creator?.id !== user.value.id) {
    toast.error('Kamu tidak bisa mengedit album ini.')
    router.push(`/albums/${id}`)
  }
})

// ── Form ─────────────────────────────────────────────────────────────────────

const form = reactive({
  title:            '',
  description:      '',
  event_date:       '',
  event_end_date:   '',
  category:         'other' as any,
  privacy:          'public' as any,
  is_collaborative: false,
  group_id:         null as string | null,
  location_name:    '',
  tag_ids:          [] as string[],
})

const toggleTag = (tagId: string) => {
  const idx = form.tag_ids.indexOf(tagId)
  idx === -1 ? form.tag_ids.push(tagId) : form.tag_ids.splice(idx, 1)
}

// ── Kontributor state ─────────────────────────────────────────────────────────

const allUsers        = ref<{ id: string; name: string; avatar: string | null; notes: string | null }[]>([])
const loadingUsers    = ref(false)
const userSearch      = ref('')
const pendingInvites  = ref<{ id: string; name: string; avatar: string | null }[]>([])
const pendingRemovals = ref<string[]>([])  // ID kontributor yang akan dihapus

const fetchAllUsers = async () => {
  if (allUsers.value.length) return
  loadingUsers.value = true
  try {
    allUsers.value = await $fetch<any[]>(`${config.public.apiBase}/api/users/names`)
  } catch {}
  loadingUsers.value = false
}

watch(() => form.is_collaborative, (val) => {
  if (val) fetchAllUsers()
  else {
    pendingInvites.value  = []
    pendingRemovals.value = []
  }
})

// Kontributor existing (dari album) — exclude creator dari list hapus
const existingContributors = computed(() =>
  (album.value?.contributors ?? []).filter(c => c.id !== album.value?.creator?.id)
)

// User yang bisa diundang: exclude creator + sudah jadi kontributor + sudah di pending
const excludedIds = computed(() => new Set([
  album.value?.creator?.id ?? '',
  ...(album.value?.contributors?.map(c => c.id) ?? []),
  ...pendingInvites.value.map(u => u.id),
]))

const filteredUsers = computed(() => {
  const base = allUsers.value.filter(u => !excludedIds.value.has(u.id))
  if (!userSearch.value.trim()) return base.slice(0, 8)
  const q = userSearch.value.toLowerCase()
  return base.filter(u => u.name.toLowerCase().includes(q)).slice(0, 8)
})

const isInPending = (uid: string) => pendingInvites.value.some(c => c.id === uid)

const togglePending = (u: { id: string; name: string; avatar: string | null }) => {
  const idx = pendingInvites.value.findIndex(c => c.id === u.id)
  idx === -1 ? pendingInvites.value.push(u) : pendingInvites.value.splice(idx, 1)
}

const isMarkedForRemoval = (uid: string) => pendingRemovals.value.includes(uid)

const toggleRemoval = (uid: string) => {
  const idx = pendingRemovals.value.indexOf(uid)
  idx === -1 ? pendingRemovals.value.push(uid) : pendingRemovals.value.splice(idx, 1)
}

// ── Submit ────────────────────────────────────────────────────────────────────

const submitting = ref(false)

const handleSubmit = async () => {
  submitting.value = true

  const payload: Parameters<typeof updateAlbum>[1] = {
    ...form,
    // Undang yang baru dipilih
    add_contributor_ids:    pendingInvites.value.map(u => u.id),
    // Hapus yang ditandai
    remove_contributor_ids: pendingRemovals.value,
  }

  const updated = await updateAlbum(id, payload)

  submitting.value = false

  if (updated) {
    toast.success('Album berhasil diperbarui.')
    router.push(`/albums/${id}`)
  } else {
    toast.error(error.value ?? 'Gagal memperbarui.')
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 font-[Manrope]">

    <!-- Header -->
    <div class="flex items-center gap-3 mb-6 animate-[fadeIn_0.4s_ease_forwards]">
      <NuxtLink
        :to="`/albums/${id}`"
        class="p-2 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/5 transition"
      >
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Edit Album</h1>
      </div>
    </div>

    <!-- Skeleton loading -->
    <div v-if="loading && !album" class="space-y-4 animate-pulse">
      <div class="h-40 bg-gray-100 dark:bg-neutral-800 rounded-2xl" />
      <div class="h-32 bg-gray-100 dark:bg-neutral-800 rounded-2xl" />
      <div class="h-24 bg-gray-100 dark:bg-neutral-800 rounded-2xl" />
    </div>

    <form v-else-if="album" @submit.prevent="handleSubmit" class="space-y-4 animate-[slideUp_0.4s_ease_forwards]">

      <!-- ── CARD: Informasi Album ── -->
      <div class="bg-white dark:bg-[#181818] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800 space-y-4">
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Icon name="heroicons:document-text" class="w-4 h-4 text-amber-500" />
          Informasi Album
        </p>

        <!-- Judul -->
        <div>
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">
            Judul Album <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.title"
            type="text"
            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition"
            maxlength="200"
          />
        </div>

        <!-- Deskripsi -->
        <div>
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">Deskripsi</label>
          <textarea
            v-model="form.description"
            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition h-24 resize-none"
            maxlength="3000"
          />
        </div>
      </div>

      <!-- ── CARD: Tanggal Event ── -->
      <div class="bg-white dark:bg-[#181818] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800 space-y-4">
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Icon name="heroicons:calendar-days" class="w-4 h-4 text-amber-500" />
          Tanggal Event
        </p>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">Tanggal Mulai</label>
            <input
              v-model="form.event_date"
              type="date"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition [color-scheme:dark]"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">Tanggal Selesai</label>
            <input
              v-model="form.event_end_date"
              type="date"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition [color-scheme:dark]"
              :min="form.event_date ?? ''"
            />
          </div>
        </div>
      </div>

      <!-- ── CARD: Kategori & Privasi ── -->
      <div class="bg-white dark:bg-[#181818] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800 space-y-4">
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Icon name="heroicons:adjustments-horizontal" class="w-4 h-4 text-amber-500" />
          Kategori & Privasi
        </p>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">Kategori</label>
            <select
              v-model="form.category"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition appearance-none cursor-pointer"
            >
              <option value="school">Sekolah</option>
              <option value="hiking">Pendakian</option>
              <option value="traveling">Traveling</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">Privasi</label>
            <select
              v-model="form.privacy"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition appearance-none cursor-pointer"
            >
              <option value="public">Publik</option>
              <option value="group">Grup</option>
              <option value="private">Privat</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ── CARD: Grup & Lokasi ── -->
      <div class="bg-white dark:bg-[#181818] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800 space-y-4">
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Icon name="heroicons:map-pin" class="w-4 h-4 text-amber-500" />
          Grup & Lokasi
        </p>

        <!-- Grup -->
        <div v-if="groups.length">
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">
            Tautkan ke Grup <span class="text-gray-400 dark:text-neutral-500 text-xs">(opsional)</span>
          </label>
          <select
            v-model="form.group_id"
            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition appearance-none cursor-pointer"
          >
            <option :value="null">— Tanpa grup —</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </div>

        <!-- Lokasi -->
        <div>
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">Lokasi Event</label>
          <div class="relative">
            <Icon name="heroicons:map-pin" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
            <input
              v-model="form.location_name"
              type="text"
              class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      <!-- ── CARD: Album Kolaboratif ── -->
      <div class="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden">

        <!-- Toggle header -->
        <div class="flex items-center gap-3 p-5">
          <div class="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Icon name="heroicons:user-group" class="w-5 h-5 text-amber-500" />
          </div>
          <div class="flex-1">
            <p class="font-semibold text-sm text-gray-900 dark:text-white">Album Kolaboratif</p>
            <p class="text-xs text-gray-400 mt-0.5">Izinkan orang lain menambahkan kenangan ke album ini</p>
          </div>
          <button
            type="button"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
            :class="form.is_collaborative ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'"
            @click="form.is_collaborative = !form.is_collaborative"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200"
              :class="form.is_collaborative ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>

        <!-- Panel kontributor -->
        <div v-if="form.is_collaborative" class="border-t border-gray-100 dark:border-neutral-800 p-5 space-y-4">

          <!-- Kontributor existing -->
          <div v-if="existingContributors.length">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Kontributor saat ini
              <span class="font-normal">(klik untuk hapus)</span>
            </p>
            <div class="space-y-2">
              <div
                v-for="c in existingContributors"
                :key="c.id"
                class="flex items-center gap-3 p-3 rounded-xl transition cursor-pointer"
                :class="isMarkedForRemoval(c.id)
                  ? 'bg-red-50 dark:bg-red-950/30 ring-1 ring-red-200 dark:ring-red-800/50'
                  : 'bg-gray-50 dark:bg-[#101010] hover:bg-gray-100 dark:hover:bg-[#0a0a0a]'"
                @click="toggleRemoval(c.id)"
              >
                <img
                  :src="c.avatar ?? '/default-avatar.png'"
                  class="w-8 h-8 rounded-full object-cover shrink-0 transition"
                  :class="isMarkedForRemoval(c.id) ? 'opacity-50' : ''"
                />
                <div class="flex-1 min-w-0">
                  <p
                    class="text-sm font-medium truncate transition"
                    :class="isMarkedForRemoval(c.id) ? 'text-red-500 line-through' : 'text-gray-900 dark:text-white'"
                  >
                    {{ c.name }}
                  </p>
                  <p v-if="c.pivot?.status === 'pending'" class="text-xs text-amber-500">Menunggu respons</p>
                  <p v-else class="text-xs text-gray-400">Kontributor aktif</p>
                </div>
                <span v-if="isMarkedForRemoval(c.id)" class="text-xs text-red-500 font-semibold shrink-0 flex items-center gap-1">
                  <Icon name="heroicons:trash" class="w-3.5 h-3.5" /> Hapus
                </span>
                <span v-else class="text-xs text-gray-300 dark:text-gray-600 shrink-0">Klik hapus</span>
              </div>
            </div>
            <p v-if="pendingRemovals.length" class="text-xs text-red-500 mt-2 flex items-center gap-1">
              <Icon name="heroicons:exclamation-circle" class="w-3.5 h-3.5" />
              {{ pendingRemovals.length }} kontributor akan dihapus saat kamu simpan.
            </p>
          </div>

          <!-- Creator info -->
          <div class="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <img :src="album.creator?.avatar ?? '/default-avatar.png'" class="w-8 h-8 rounded-full object-cover shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ album.creator?.name }}
                <span class="text-xs text-amber-500 font-normal ml-1">(kamu — creator)</span>
              </p>
              <p class="text-xs text-gray-400">Tidak bisa dihapus</p>
            </div>
          </div>

          <div class="border-t border-gray-100 dark:border-neutral-800" />

          <!-- Undang kontributor baru -->
          <div>
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Undang Pengguna Baru</p>

            <div class="relative mb-2">
              <Icon name="heroicons:magnifying-glass" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
              <input
                v-model="userSearch"
                type="text"
                class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition"
                placeholder="Cari nama pengguna..."
              />
            </div>

            <!-- Hasil pencarian -->
            <div v-if="filteredUsers.length" class="space-y-1 max-h-44 overflow-y-auto mb-2">
              <button
                v-for="u in filteredUsers"
                :key="u.id"
                type="button"
                class="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#101010] transition text-left"
                :class="isInPending(u.id) ? 'bg-amber-500/5 ring-1 ring-amber-500/30' : ''"
                @click="togglePending({ id: u.id, name: u.name, avatar: u.avatar })"
              >
                <img :src="u.avatar ?? '/default-avatar.png'" class="w-8 h-8 rounded-full object-cover shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ u.name }}</p>
                  <p v-if="u.notes" class="text-xs text-gray-400 truncate">{{ u.notes }}</p>
                </div>
                <Icon v-if="isInPending(u.id)" name="heroicons:check" class="w-4 h-4 text-amber-500 shrink-0" />
              </button>
            </div>
            <p v-else-if="userSearch && !loadingUsers" class="text-xs text-gray-400 text-center py-2">
              Pengguna tidak ditemukan.
            </p>

            <!-- Chips yang akan diundang -->
            <div v-if="pendingInvites.length" class="flex flex-wrap gap-2 mt-2">
              <div
                v-for="c in pendingInvites"
                :key="c.id"
                class="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full pl-1.5 pr-2 py-0.5"
              >
                <img :src="c.avatar ?? '/default-avatar.png'" class="w-5 h-5 rounded-full object-cover" />
                <span class="text-xs font-medium">{{ c.name }}</span>
                <button
                  type="button"
                  class="text-amber-500/70 hover:text-red-500 leading-none transition"
                  @click="togglePending(c)"
                >
                  <Icon name="heroicons:x-mark" class="w-3 h-3" />
                </button>
              </div>
            </div>
            <p v-if="!pendingInvites.length" class="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
              <Icon name="heroicons:information-circle" class="w-3.5 h-3.5" />
              Pilih pengguna di atas untuk mengundang. Perubahan disimpan saat klik "Simpan Perubahan".
            </p>
          </div>
        </div>
      </div>

      <!-- ── CARD: Tags ── -->
      <div v-if="allTags.length" class="bg-white dark:bg-[#181818] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800 space-y-3">
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Icon name="heroicons:tag" class="w-4 h-4 text-amber-500" />
          Tag
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tag in allTags"
            :key="tag.id"
            type="button"
            class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border"
            :class="form.tag_ids.includes(tag.id)
              ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-[#101010] border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400'"
            @click="toggleTag(tag.id)"
          >
            #{{ tag.name }}
          </button>
        </div>
      </div>

      <!-- Summary perubahan kontributor -->
      <div
        v-if="pendingInvites.length || pendingRemovals.length"
        class="flex flex-col gap-0.5 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 text-xs"
      >
        <p v-if="pendingInvites.length" class="flex items-center gap-1.5">
          <Icon name="heroicons:user-plus" class="w-3.5 h-3.5 shrink-0" />
          Mengundang {{ pendingInvites.length }} pengguna baru
        </p>
        <p v-if="pendingRemovals.length" class="flex items-center gap-1.5">
          <Icon name="heroicons:user-minus" class="w-3.5 h-3.5 shrink-0" />
          Menghapus {{ pendingRemovals.length }} kontributor
        </p>
        <p class="text-amber-500 mt-0.5 flex items-center gap-1.5">
          <Icon name="heroicons:information-circle" class="w-3.5 h-3.5 shrink-0" />
          Perubahan ini akan disimpan saat kamu klik tombol simpan.
        </p>
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm"
      >
        <Icon name="heroicons:exclamation-circle" class="w-4 h-4 shrink-0" />
        {{ error }}
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-1">
        <NuxtLink
          :to="`/albums/${id}`"
          class="flex-1 px-5 py-3 rounded-xl bg-gray-100 dark:bg-[#101010] hover:bg-neutral-200 dark:hover:bg-[#181818] text-gray-700 dark:text-gray-300 font-semibold text-sm transition border border-gray-200 dark:border-neutral-800 text-center"
        >
          Batal
        </NuxtLink>
        <button
          type="submit"
          class="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading || submitting"
        >
          <Icon v-if="loading || submitting" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
          <Icon v-else name="heroicons:check" class="w-4 h-4" />
          {{ (loading || submitting) ? 'Menyimpan...' : 'Simpan Perubahan' }}
        </button>
      </div>
    </form>

    <BaseToast />
    <BaseConfirm />
  </div>
</template>