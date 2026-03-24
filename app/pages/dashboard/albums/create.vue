<!-- pages/dashboard/albums/create.vue -->
<!--
  Lokasi  : pages/dashboard/albums/create.vue
  Layout  : dashboard | Akses: login wajib
  Fix:
  - Toggle kolaboratif: jika aktif, muncul panel undang kontributor langsung
  - Undang kontributor via pencarian nama user (dari /api/users/names)
  - Kontributor yang sudah ditambah tampil sebagai chips sebelum submit
-->
<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import type { StoreAlbumPayload, Category, Privacy } from '~/types/kenangan'

const { createAlbum, loading, error } = useAlbums()
const { tags: allTags, fetchTags }    = useTags()
const { groups, fetchGroups }         = useGroups()
const config = useRuntimeConfig()
const toast  = useToast()
const router = useRouter()
const route  = useRoute()

onMounted(() => Promise.all([fetchTags(), fetchGroups({ per_page: 50 })]))

const form = reactive<StoreAlbumPayload>({
  title:            '',
  description:      '',
  group_id:         (route.query.group_id as string) ?? null,
  event_date:       '',
  event_end_date:   '',
  category:         'other',
  privacy:          'public',
  is_collaborative: false,
  location_name:    '',
  latitude:         null,
  longitude:        null,
  tag_ids:          [],
  contributor_ids:  [],
})

// ── Kontributor ──────────────────────────────────────────────────────────────

// Daftar semua user dari /api/users/names (untuk search)
const allUsers     = ref<{ id: string; name: string; avatar: string | null; notes: string | null }[]>([])
const userSearch   = ref('')
const loadingUsers = ref(false)

// User yang sudah dipilih sebagai kontributor
const selectedContributors = ref<{ id: string; name: string; avatar: string | null }[]>([])

const fetchUsers = async () => {
  if (allUsers.value.length) return // cache
  loadingUsers.value = true
  try {
    const data = await $fetch<any[]>(`${config.public.apiBase}/api/users/names`)
    allUsers.value = data
  } catch {}
  loadingUsers.value = false
}

// Panggil fetchUsers ketika toggle kolaboratif diaktifkan
watch(() => form.is_collaborative, (val) => {
  if (val) fetchUsers()
})

const { user: authUser } = useAuth()

const filteredUsers = computed(() => {
  // Exclude: diri sendiri (auto-assigned creator) + yang sudah dipilih
  const excludedIds = new Set([
    authUser.value?.id ?? '',
    ...selectedContributors.value.map(c => c.id),
  ])
  const base = allUsers.value.filter(u => !excludedIds.has(u.id))
  if (!userSearch.value.trim()) return base.slice(0, 8)
  const q = userSearch.value.toLowerCase()
  return base.filter(u => u.name.toLowerCase().includes(q)).slice(0, 8)
})

const isSelected = (userId: string) =>
  selectedContributors.value.some(c => c.id === userId)

const toggleContributor = (u: { id: string; name: string; avatar: string | null }) => {
  const idx = selectedContributors.value.findIndex(c => c.id === u.id)
  if (idx === -1) {
    selectedContributors.value.push(u)
    form.contributor_ids = selectedContributors.value.map(c => c.id)
  } else {
    selectedContributors.value.splice(idx, 1)
    form.contributor_ids = selectedContributors.value.map(c => c.id)
  }
}

const removeContributor = (userId: string) => {
  selectedContributors.value = selectedContributors.value.filter(c => c.id !== userId)
  form.contributor_ids = selectedContributors.value.map(c => c.id)
}

// Reset kontributor jika toggle dimatikan
watch(() => form.is_collaborative, (val) => {
  if (!val) {
    selectedContributors.value = []
    form.contributor_ids = []
  }
})

// ── Tags ─────────────────────────────────────────────────────────────────────

const toggleTag = (id: string) => {
  const idx = form.tag_ids!.indexOf(id)
  idx === -1 ? form.tag_ids!.push(id) : form.tag_ids!.splice(idx, 1)
}

// ── Submit ───────────────────────────────────────────────────────────────────

const handleSubmit = async () => {
  if (!form.title.trim()) { toast.error('Judul album wajib diisi.'); return }

  const album = await createAlbum(form)
  if (album) {
    toast.success('Album berhasil dibuat!')
    router.push(`/albums/${album.id}`)
  } else {
    toast.error(error.value ?? 'Gagal membuat album.')
  }
}

const categoryOptions: { label: string; value: Category }[] = [
  { label: 'Sekolah',   value: 'school' },
  { label: 'Pendakian', value: 'hiking' },
  { label: 'Traveling', value: 'traveling' },
  { label: 'Lainnya',   value: 'other' },
]

const privacyOptions: { label: string; value: Privacy; desc: string }[] = [
  { label: 'Publik',  value: 'public',  desc: 'Semua orang bisa melihat' },
  { label: 'Grup',    value: 'group',   desc: 'Hanya anggota grup' },
  { label: 'Privat',  value: 'private', desc: 'Hanya kamu' },
]
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 font-[Manrope]">

    <!-- Header -->
    <div class="flex items-center gap-3 mb-6 animate-[fadeIn_0.4s_ease_forwards]">
      <NuxtLink
        to="/albums"
        class="p-2 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/5 transition"
      >
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Buat Album Baru</h1>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4 animate-[slideUp_0.4s_ease_forwards]">

      <!-- ── CARD: Judul & Deskripsi ── -->
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
            placeholder="Contoh: Lebaran 2024 Keluarga Besar"
            maxlength="200"
          />
        </div>

        <!-- Deskripsi -->
        <div>
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">Deskripsi</label>
          <textarea
            v-model="form.description"
            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition h-24 resize-none"
            placeholder="Ceritakan tentang album ini..."
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
            <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">
              Kategori <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.category"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition appearance-none cursor-pointer"
            >
              <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">
              Privasi <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.privacy"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition appearance-none cursor-pointer"
            >
              <option v-for="opt in privacyOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }} — {{ opt.desc }}
              </option>
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
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">
            Lokasi Event <span class="text-gray-400 dark:text-neutral-500 text-xs">(opsional)</span>
          </label>
          <div class="relative">
            <Icon name="heroicons:map-pin" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
            <input
              v-model="form.location_name"
              type="text"
              class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition"
              placeholder="Contoh: Pantai Kuta, Bali"
            />
          </div>
        </div>
      </div>

      <!-- ── CARD: Album Kolaboratif ── -->
      <div class="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden">
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

        <!-- Panel undang kontributor -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-[400px]"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 max-h-[400px]"
          leave-to-class="opacity-0 max-h-0"
        >
          <div v-if="form.is_collaborative" class="border-t border-gray-100 dark:border-neutral-800 p-5 space-y-3">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Undang Kontributor
              <span class="font-normal">(opsional, bisa diundang nanti)</span>
            </p>

            <!-- Search user -->
            <div class="relative">
              <Icon name="heroicons:magnifying-glass" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
              <input
                v-model="userSearch"
                type="text"
                class="w-full pl-10 pr-8 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition"
                placeholder="Cari nama pengguna..."
              />
              <span v-if="loadingUsers" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">...</span>
            </div>

            <!-- Daftar hasil pencarian -->
            <div v-if="filteredUsers.length" class="space-y-1 max-h-48 overflow-y-auto">
              <button
                v-for="u in filteredUsers"
                :key="u.id"
                type="button"
                class="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#101010] transition text-left"
                :class="isSelected(u.id) ? 'bg-amber-500/5 ring-1 ring-amber-500/30' : ''"
                @click="toggleContributor({ id: u.id, name: u.name, avatar: u.avatar })"
              >
                <img :src="u.avatar ?? '/default-avatar.png'" class="w-8 h-8 rounded-full object-cover shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ u.name }}</p>
                  <p v-if="u.notes" class="text-xs text-gray-400 truncate">{{ u.notes }}</p>
                </div>
                <Icon v-if="isSelected(u.id)" name="heroicons:check" class="w-4 h-4 text-amber-500 shrink-0" />
              </button>
            </div>
            <p v-else-if="userSearch && !loadingUsers" class="text-xs text-gray-400 text-center py-2">
              Pengguna tidak ditemukan.
            </p>

            <!-- Chips kontributor terpilih -->
            <div v-if="selectedContributors.length" class="flex flex-wrap gap-2 pt-1">
              <div
                v-for="c in selectedContributors"
                :key="c.id"
                class="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full pl-1.5 pr-2 py-0.5"
              >
                <img :src="c.avatar ?? '/default-avatar.png'" class="w-5 h-5 rounded-full object-cover" />
                <span class="text-xs font-medium">{{ c.name }}</span>
                <button
                  type="button"
                  class="text-amber-500/70 hover:text-red-500 leading-none transition"
                  @click="removeContributor(c.id)"
                >
                  <Icon name="heroicons:x-mark" class="w-3 h-3" />
                </button>
              </div>
            </div>
            <p v-if="!selectedContributors.length" class="text-xs text-gray-400 flex items-center gap-1">
              <Icon name="heroicons:information-circle" class="w-3.5 h-3.5" />
              Belum ada kontributor dipilih. Kamu bisa mengundang nanti dari halaman album.
            </p>
          </div>
        </Transition>
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
            :class="form.tag_ids?.includes(tag.id)
              ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-[#101010] border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400'"
            @click="toggleTag(tag.id)"
          >
            #{{ tag.name }}
          </button>
        </div>
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
          to="/albums"
          class="flex-1 px-5 py-3 rounded-xl bg-gray-100 dark:bg-[#101010] hover:bg-neutral-200 dark:hover:bg-[#181818] text-gray-700 dark:text-gray-300 font-semibold text-sm transition border border-gray-200 dark:border-neutral-800 text-center"
        >
          Batal
        </NuxtLink>
        <button
          type="submit"
          class="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
        >
          <Icon v-if="loading" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
          <Icon v-else name="heroicons:check" class="w-4 h-4" />
          {{ loading ? 'Menyimpan...' : 'Buat Album' }}
        </button>
      </div>
    </form>

    <BaseToast />
  </div>
</template>