<!-- pages/dashboard/groups/index.vue -->
<!--
  Lokasi  : pages/dashboard/groups/index.vue
  Layout  : dashboard
  Akses   : Login wajib (middleware: auth)
  Fungsi  : Daftar grup yang diikuti / dimiliki user yang sedang login.
            Termasuk grup private yang tidak muncul di halaman publik /groups.
-->
<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const {
  myGroups, myPagination, loading, error,
  fetchMyGroups, leaveGroup, deleteGroup,
} = useGroups()
const toast = useToast()
const { confirm } = useConfirm()

const category = ref('')
const page     = ref(1)

const load = () =>
  fetchMyGroups({ category: (category.value as any) || undefined, page: page.value, per_page: 12 })

watch([category], () => { page.value = 1; load() })
watch(page, load)
onMounted(load)

const handleLeave = async (id: string, name: string, role: string) => {
  if (role === 'owner') {
    toast.error('Owner tidak bisa keluar. Hapus grup atau transfer ownership terlebih dahulu.')
    return
  }
  const ok = await confirm({
    title: `Keluar dari "${name}"?`,
    message: 'Kamu tidak akan bisa melihat konten grup ini lagi.',
    confirmText: 'Keluar',
    cancelText: 'Batal',
    type: 'danger',
  })
  if (!ok) return
  const success = await leaveGroup(id)
  if (success) toast.success('Berhasil keluar dari grup.')
  else toast.error(error.value ?? 'Gagal keluar.')
}

const handleDelete = async (id: string, name: string) => {
  const ok = await confirm({
    title: `Hapus grup "${name}"?`,
    message: 'Semua data grup termasuk kenangan dan album akan dihapus permanen.',
    confirmText: 'Hapus Grup',
    cancelText: 'Batal',
    type: 'danger',
  })
  if (!ok) return
  const success = await deleteGroup(id)
  if (success) toast.success('Grup berhasil dihapus.')
  else toast.error(error.value ?? 'Gagal menghapus.')
}

const roleBadge: Record<string, string> = {
  owner: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50',
  admin: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
  member: 'bg-gray-50 dark:bg-gray-950/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800/50',
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
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Grupku</h1>
        <p class="text-sm text-gray-400 mt-1 flex items-center gap-1">
          <Icon name="heroicons:user-group" class="w-3.5 h-3.5" />
          Grup yang kamu ikuti atau buat
          <span v-if="myPagination">({{ myPagination.total }} grup)</span>
        </p>
      </div>
      <NuxtLink
        to="/dashboard/groups/create"
        class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all duration-200"
      >
        <Icon name="heroicons:plus" class="w-4 h-4" />
          <span class="hidden sm:inline">Buat Grup</span>
      </NuxtLink>
    </div>

    <!-- Filter -->
    <div class="flex gap-2 mb-6">
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
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="i in 6"
        :key="i"
        class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden animate-pulse"
      >
        <div class="h-28 bg-gray-100 dark:bg-neutral-800" />
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
      v-else-if="!myGroups.length"
      class="flex flex-col items-center justify-center py-24 gap-3"
    >
      <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#181818] border border-gray-200 dark:border-neutral-800 flex items-center justify-center">
        <Icon name="heroicons:user-group" class="w-8 h-8 text-gray-300 dark:text-neutral-700" />
      </div>
      <p class="text-base font-semibold text-gray-500 dark:text-gray-400">Belum bergabung grup apapun</p>
      <div class="flex gap-2 mt-1">
        <NuxtLink
          to="/groups"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#181818] hover:bg-gray-200 dark:hover:bg-black text-gray-600 dark:text-gray-400 text-xs font-semibold transition border border-gray-200 dark:border-neutral-800"
        >
          <Icon name="heroicons:magnifying-glass" class="w-3.5 h-3.5" />
          Cari Grup
        </NuxtLink>
        <NuxtLink
          to="/dashboard/groups/create"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
        >
          <Icon name="heroicons:plus" class="w-3.5 h-3.5" />
          Buat Grup Baru
        </NuxtLink>
      </div>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <article
        v-for="g in myGroups"
        :key="g.id"
        class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      >
        <!-- Cover -->
        <NuxtLink :to="`/groups/${g.id}`">
          <div class="h-28 bg-gray-100 dark:bg-[#101010] overflow-hidden relative">
            <img
              v-if="g.cover_image"
              :src="g.cover_image"
              class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Icon name="heroicons:user-group" class="w-10 h-10 text-gray-300 dark:text-neutral-700" />
            </div>

            <!-- Role badge kiri atas -->
            <span
              class="absolute top-2 left-2 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm capitalize"
              :class="roleBadge[g.my_role ?? 'member']"
            >
              <Icon
                :name="g.my_role === 'owner' ? 'heroicons:user-circle' : g.my_role === 'admin' ? 'heroicons:user-plus' : 'heroicons:user'"
                class="w-2.5 h-2.5"
              />
              {{ g.my_role ?? 'member' }}
            </span>

            <!-- Privacy badge kanan atas -->
            <span
              class="absolute top-2 right-2 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm"
              :class="g.privacy === 'public'
                ? 'bg-green-50/80 dark:bg-green-950/60 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/50'
                : g.privacy === 'closed'
                  ? 'bg-amber-50/80 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                  : 'bg-purple-50/80 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50'"
            >
              <Icon
                :name="g.privacy === 'public' ? 'heroicons:globe-alt' : g.privacy === 'closed' ? 'heroicons:shield-check' : 'heroicons:lock-closed'"
                class="w-2.5 h-2.5"
              />
              {{ g.privacy === 'public' ? 'Publik' : g.privacy === 'closed' ? 'Tertutup' : 'Privat' }}
            </span>
          </div>
        </NuxtLink>

        <div class="p-4">
          <NuxtLink
            :to="`/groups/${g.id}`"
            class="font-semibold text-sm text-gray-900 dark:text-white hover:text-amber-500 dark:hover:text-amber-400 line-clamp-1 block mb-1 transition-colors"
          >
            {{ g.name }}
          </NuxtLink>

          <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
            {{ g.description ?? 'Belum ada deskripsi.' }}
          </p>

          <div class="flex text-xs text-gray-400 mb-3 gap-3">
            <span class="flex items-center gap-1">
              <Icon name="heroicons:users" class="w-3.5 h-3.5" />
              {{ g.members_count ?? 0 }} anggota
            </span>
            <span class="flex items-center gap-1">
              <Icon name="heroicons:photo" class="w-3.5 h-3.5" />
              {{ g.memories_count ?? 0 }} kenangan
            </span>
          </div>

          <!-- Actions -->
          <div class="flex gap-1.5">
            <NuxtLink
              :to="`/groups/${g.id}`"
              class="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-[#101010] hover:bg-gray-200 dark:hover:bg-black text-gray-600 dark:text-gray-400 text-xs font-semibold transition border border-gray-200 dark:border-neutral-800"
            >
              <Icon name="heroicons:eye" class="w-3.5 h-3.5" />
              Lihat
            </NuxtLink>

            <NuxtLink
              v-if="['owner', 'admin'].includes(g.my_role ?? '')"
              :to="`/dashboard/groups/${g.id}/edit`"
              class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#101010] hover:bg-gray-200 dark:hover:bg-black text-gray-500 dark:text-gray-400 transition border border-gray-200 dark:border-neutral-800"
            >
              <Icon name="heroicons:pencil-square" class="w-3.5 h-3.5" />
            </NuxtLink>

            <button
              v-if="g.my_role === 'owner'"
              class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-500 dark:text-red-400 transition border border-red-200 dark:border-red-800/50"
              @click="handleDelete(g.id, g.name)"
            >
              <Icon name="heroicons:trash" class="w-3.5 h-3.5" />
            </button>

            <button
              v-else
              class="inline-flex cursor-pointer items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-transparent hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 text-xs font-semibold transition border border-red-200 dark:border-red-800/50 hover:border-red-500"
              @click="handleLeave(g.id, g.name, g.my_role ?? 'member')"
            >
              <Icon name="heroicons:arrow-right-on-rectangle" class="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
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