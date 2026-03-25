<!-- pages/groups/index.vue -->
<!--
  Lokasi  : pages/groups/index.vue
  Layout  : default | Akses: publik
  Fix:
  1. Tombol aksi menyesuaikan status user per grup:
     - my_status === 'active'  → tombol "Keluar"
     - my_status === 'pending' → tombol disabled "Menunggu..."
     - privacy === 'private'   → teks info, tidak ada tombol join
     - belum join + public     → tombol "Bergabung"
     - belum join + closed     → tombol "Minta Bergabung"
     - tidak login             → tombol "Bergabung" redirect ke login
-->
<script setup lang="ts">
import type { Category } from '~/types/kenangan'

definePageMeta({ layout: 'default' })

const { groups, pagination, loading, error, fetchGroups, joinGroup, leaveGroup } = useGroups()
const { isAuthenticated } = useAuth()
const toast     = useToast()
const { confirm } = useConfirm()
const alreadyJoinedMessage = 'Kamu sudah bergabung di grup ini.'

const search   = ref('')
const category = ref<Category | ''>('')
const page     = ref(1)
const { setPageSeo } = useSeoMetaHelper()

const load = () => fetchGroups({
  search:   search.value || undefined,
  category: (category.value as Category) || undefined,
  page:     page.value,
})

// Debounce search manual (watch debounce tidak ada di Nuxt bawaan)
let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; load() }, 400)
})
watch(category, () => { page.value = 1; load() })
watch(page, load)
onMounted(() => {
  setPageSeo(
    'Komunitas Grup',
    'Temukan dan bergabung dengan grup komunitas di Kampang Official. Bagikan pengalaman dengan orang-orang yang memiliki minat yang sama.',
    '/groups'
  )
  
  fetchGroups({/* ...params */})
})
const handleJoin = async (groupId: string, privacy: string) => {
  if (!isAuthenticated.value) {
    toast.info('Kamu harus login untuk bergabung.')
    return navigateTo('/login')
  }
  if (privacy === 'private') {
    toast.info('Grup ini hanya bisa dimasuki via undangan dari owner/admin.')
    return
  }
  const msg = await joinGroup(groupId)
  if (msg) {
    if (msg === alreadyJoinedMessage) {
      toast.info(msg)
    } else {
      toast.success(msg)
    }
    error.value = null
    load()
  } else {
    const message = error.value ?? 'Gagal bergabung.'
    if (message === alreadyJoinedMessage) {
      toast.info(message)
      error.value = null
      load()
      return
    }
    toast.error(message)
    error.value = null
  }
}

const handleLeave = async (groupId: string, groupName: string) => {
  const ok = await confirm({
    title:       'Keluar dari grup?',
    message:     `Kamu akan keluar dari grup "${groupName}".`,
    confirmText: 'Ya, keluar',
    cancelText:  'Batal',
    type:        'danger',
  })
  if (!ok) return
  const success = await leaveGroup(groupId)
  if (success) {
    toast.success('Berhasil keluar dari grup.')
    load()
  } else {
    toast.error(error.value ?? 'Gagal keluar.')
  }
}

const categoryOptions = [
  { label: 'Semua',     value: '' },
  { label: 'Sekolah',   value: 'school' },
  { label: 'Pendakian', value: 'hiking' },
  { label: 'Traveling', value: 'traveling' },
  { label: 'Lainnya',   value: 'other' },
]

const privacyLabel: Record<string, string> = {
  public:  'Publik',
  closed:  'Tertutup',
  private: 'Privat',
}
const privacyClass: Record<string, string> = {
  public:  'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/50',
  closed:  'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50',
  private: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50',
}
const categoryEmoji: Record<string, string> = {
  school: '🏫', hiking: '⛰️', traveling: '✈️', other: '📸',
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 font-[Manrope]">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 animate-[fadeIn_0.4s_ease_forwards]">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Komunitas</h1>
        <p class="text-sm text-gray-400 mt-1 flex items-center gap-1">
          <Icon name="heroicons:user-group" class="w-3.5 h-3.5" />
          Temukan grup kenangan bersama
        </p>
      </div>
      <NuxtLink
        v-if="isAuthenticated"
        to="/dashboard/groups/create"
        class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all duration-200"
      >
        <Icon name="heroicons:plus" class="w-4 h-4" />
          <span class="hidden sm:inline">Buat Group</span>
      </NuxtLink>
    </div>

    <!-- Filter bar -->
    <div class="flex flex-col sm:flex-row gap-2 mb-6">
      <div class="relative flex-1">
        <Icon name="heroicons:magnifying-glass" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
        <input
          v-model="search"
          type="text"
          placeholder="Cari grup..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition"
        />
      </div>
      <select
        v-model="category"
        class="w-full sm:w-48 px-4 py-2.5 rounded-xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-700 dark:text-gray-300 text-sm focus:outline-none transition appearance-none cursor-pointer"
      >
        <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="i in 6"
        :key="i"
        class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden animate-pulse"
      >
        <div class="h-32 bg-gray-100 dark:bg-neutral-800" />
        <div class="p-4 space-y-2.5">
          <div class="h-4 bg-gray-100 dark:bg-neutral-800 rounded-lg w-3/4" />
          <div class="h-3 bg-gray-100 dark:bg-neutral-800 rounded-lg w-full" />
          <div class="h-3 bg-gray-100 dark:bg-neutral-800 rounded-lg w-2/3" />
          <div class="h-8 bg-gray-100 dark:bg-neutral-800 rounded-xl w-full mt-1" />
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
      v-else-if="!groups.length"
      class="flex flex-col items-center justify-center py-24 gap-3"
    >
      <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#181818] border border-gray-200 dark:border-neutral-800 flex items-center justify-center">
        <Icon name="heroicons:user-group" class="w-8 h-8 text-gray-300 dark:text-neutral-700" />
      </div>
      <p class="text-base font-semibold text-gray-500 dark:text-gray-400">Belum ada grup yang ditemukan.</p>
      <NuxtLink
        v-if="isAuthenticated"
        to="/dashboard/groups/create"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition mt-1"
      >
        <Icon name="heroicons:plus" class="w-3.5 h-3.5" />
        Buat Grup Pertama
      </NuxtLink>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <article
        v-for="group in groups"
        :key="group.id"
        class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      >
        <!-- Cover -->
        <NuxtLink :to="`/groups/${group.id}`">
          <div class="h-32 bg-gray-100 dark:bg-[#101010] overflow-hidden relative">
            <img
              v-if="group.cover_image"
              :src="group.cover_image"
              :alt="group.name"
              class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Icon name="heroicons:user-group" class="w-12 h-12 text-gray-300 dark:text-neutral-700" />
            </div>

            <!-- Badge privasi overlay -->
            <span
              class="absolute top-2 right-2 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm"
              :class="privacyClass[group.privacy]"
            >
              <Icon
                :name="group.privacy === 'public' ? 'heroicons:globe-alt' : group.privacy === 'closed' ? 'heroicons:shield-check' : 'heroicons:lock-closed'"
                class="w-2.5 h-2.5"
              />
              {{ privacyLabel[group.privacy] }}
            </span>
          </div>
        </NuxtLink>

        <div class="p-4">
          <!-- Nama -->
          <NuxtLink
            :to="`/groups/${group.id}`"
            class="font-semibold text-sm text-gray-900 dark:text-white hover:text-amber-500 dark:hover:text-amber-400 line-clamp-1 block mb-1 transition-colors"
          >
            {{ group.name }}
          </NuxtLink>

          <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
            {{ group.description ?? 'Belum ada deskripsi.' }}
          </p>

          <div class="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span class="flex items-center gap-1">
              <Icon name="heroicons:users" class="w-3.5 h-3.5" />
              {{ group.members_count ?? 0 }} anggota
            </span>
            <span class="flex items-center gap-1">
              <Icon name="heroicons:photo" class="w-3.5 h-3.5" />
              {{ group.memories_count ?? 0 }} kenangan
            </span>
          </div>

          <!-- ── Tombol Aksi ── -->
          <template v-if="isAuthenticated">

            <!-- Sudah aktif member (bukan owner) -->
            <button
              v-if="group.my_status === 'active' && group.my_role !== 'owner'"
              class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#101010] hover:bg-gray-200 dark:hover:bg-black text-gray-600 dark:text-gray-400 text-xs font-semibold transition border border-gray-200 dark:border-neutral-800"
              @click="handleLeave(group.id, group.name)"
            >
              <Icon name="heroicons:arrow-right-on-rectangle" class="w-3.5 h-3.5" />
              Keluar dari Grup
            </button>

            <!-- Owner -->
            <NuxtLink
              v-else-if="group.my_role === 'owner'"
              :to="`/dashboard/groups/${group.id}/edit`"
              class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#101010] hover:bg-gray-200 dark:hover:bg-black text-gray-600 dark:text-gray-400 text-xs font-semibold transition border border-gray-200 dark:border-neutral-800"
            >
              <Icon name="heroicons:pencil-square" class="w-3.5 h-3.5" />
              Kelola Grup
            </NuxtLink>

            <!-- Menunggu approval -->
            <div v-else-if="group.my_status === 'pending'">
              <span class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-200 dark:border-amber-800/50 opacity-70 cursor-not-allowed">
                <Icon name="heroicons:clock" class="w-3.5 h-3.5" />
                Menunggu persetujuan
              </span>
            </div>

            <!-- Grup privat & belum member -->
            <div v-else-if="group.privacy === 'private'" class="flex items-center justify-center gap-1 py-2">
              <Icon name="heroicons:lock-closed" class="w-3.5 h-3.5 text-gray-300 dark:text-neutral-600" />
              <p class="text-xs text-gray-400 dark:text-neutral-600">Hanya via undangan owner/admin</p>
            </div>

            <!-- Belum bergabung: public atau closed (commented out sesuai aslinya) -->
            <!-- <button
              v-else
              class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
              @click="handleJoin(group.id, group.privacy)"
            >
              <Icon name="heroicons:user-plus" class="w-3.5 h-3.5" />
              {{ group.privacy === 'closed' ? 'Minta Bergabung' : 'Bergabung' }}
            </button> -->

          </template>

          <!-- Belum login -->
          <NuxtLink
            v-else
            :to="`/groups/${group.id}`"
            class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#101010] hover:bg-gray-200 dark:hover:bg-black text-gray-600 dark:text-gray-400 text-xs font-semibold transition border border-gray-200 dark:border-neutral-800"
          >
            <Icon name="heroicons:eye" class="w-3.5 h-3.5" />
            Lihat Grup
          </NuxtLink>
        </div>
      </article>
    </div>

    <!-- Pagination -->
    <div
      v-if="pagination && pagination.last_page > 1"
      class="flex justify-center gap-2 mt-8"
    >
      <button
        v-for="p in pagination.last_page"
        :key="p"
        class="w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-200"
        :class="p === pagination.current_page
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