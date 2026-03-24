<!-- pages/dashboard/groups/[id]/edit.vue -->
<!--
  Lokasi  : pages/dashboard/groups/[id]/edit.vue
  Layout  : dashboard | Akses: login + owner/admin
  Fix:
  1. Update grup pakai JSON (bukan FormData untuk PUT) → data tersimpan
  2. Tambah/hapus anggota via add_member_ids/remove_member_ids dalam satu request
  3. Guard redirect tidak jalan sebelum group di-fetch (fix bug false redirect)
  4. Cover image pakai method spoofing (POST + _method=PUT) jika ada file baru
-->
<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route  = useRoute()
const router = useRouter()
const id     = route.params.id as string

const {
  group, members, loading, error,
  fetchGroup, fetchMembers, updateGroup, deleteGroup, approveMember,
} = useGroups()
const { user } = useAuth()
const config   = useRuntimeConfig()
const toast    = useToast()
const { confirm } = useConfirm()

onMounted(async () => {
  await fetchGroup(id)
  if (group.value) {
    form.name          = group.value.name
    form.description   = group.value.description ?? ''
    form.category      = group.value.category
    form.privacy       = group.value.privacy as any
    form.location_name = group.value.location.name ?? ''
  }
  await fetchMembers(id)
})

// Guard: hanya jalan setelah group loaded (bukan null) — FIX false redirect
watch(group, (val) => {
  if (!val) return  // masih loading, skip

  const myRole = val.my_role
  const isCreator = val.creator?.id === user.value?.id

  if (!isCreator && myRole && !['owner', 'admin'].includes(myRole)) {
    toast.error('Kamu tidak punya izin mengedit grup ini.')
    router.push(`/groups/${id}`)
  }
}, { immediate: false })

// ── Form data grup ────────────────────────────────────────────────────────────

const form = reactive({
  name:          '',
  description:   '',
  category:      'other' as any,
  privacy:       'public' as any,
  cover_image:   null as File | null,
  location_name: '',
})

const coverPreview = ref<string | null>(null)

const onCoverChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  form.cover_image   = file
  coverPreview.value = URL.createObjectURL(file)
}

// ── Member management state ───────────────────────────────────────────────────

const allUsers       = ref<{ id: string; name: string; avatar: string | null; notes: string | null }[]>([])
const loadingUsers   = ref(false)
const userSearch     = ref('')
const showInvitePanel = ref(false)

// Anggota yang akan ditambah saat submit
const pendingAdd    = ref<{ id: string; name: string; avatar: string | null }[]>([])
// ID anggota yang akan dihapus saat submit
const pendingRemove = ref<string[]>([])

const fetchAllUsers = async () => {
  if (allUsers.value.length) return
  loadingUsers.value = true
  try {
    allUsers.value = await $fetch<any[]>(`${config.public.apiBase}/api/users/names`)
  } catch {}
  loadingUsers.value = false
}

watch(showInvitePanel, (val) => { if (val) fetchAllUsers() })

// Anggota aktif (exclude yang akan dihapus) dan pending request (untuk closed)
const activeMembers  = computed(() =>
  members.value.filter((m: any) => m.pivot?.status === 'active')
)
const pendingMembers = computed(() =>
  members.value.filter((m: any) => m.pivot?.status === 'pending')
)

// Exclude: sudah jadi anggota + akan ditambah + diri sendiri
const excludedFromSearch = computed(() => new Set([
  ...members.value.map((m: any) => m.id),
  ...pendingAdd.value.map(u => u.id),
]))

const filteredUsers = computed(() => {
  const base = allUsers.value.filter(u => !excludedFromSearch.value.has(u.id))
  if (!userSearch.value.trim()) return base.slice(0, 8)
  const q = userSearch.value.toLowerCase()
  return base.filter(u => u.name.toLowerCase().includes(q)).slice(0, 8)
})

const isInPendingAdd    = (uid: string) => pendingAdd.value.some(u => u.id === uid)
const isInPendingRemove = (uid: string) => pendingRemove.value.includes(uid)

const toggleAdd = (u: { id: string; name: string; avatar: string | null }) => {
  const idx = pendingAdd.value.findIndex(c => c.id === u.id)
  idx === -1 ? pendingAdd.value.push(u) : pendingAdd.value.splice(idx, 1)
}

const toggleRemove = (uid: string) => {
  const idx = pendingRemove.value.indexOf(uid)
  idx === -1 ? pendingRemove.value.push(uid) : pendingRemove.value.splice(idx, 1)
}

// ── Approve/Reject pending request (closed group) ────────────────────────────

const handleApprove = async (memberId: string, action: 'approve' | 'reject') => {
  const ok = await approveMember(id, memberId, action)
  if (ok) {
    toast.success(action === 'approve' ? 'Permintaan disetujui.' : 'Permintaan ditolak.')
    await fetchMembers(id)
  } else {
    toast.error(error.value ?? 'Gagal memproses.')
  }
}

// ── Submit: satu request untuk semua perubahan ───────────────────────────────

const submitting = ref(false)

const handleSubmit = async () => {
  submitting.value = true

  const updated = await updateGroup(id, {
    ...form,
    add_member_ids:    pendingAdd.value.map(u => u.id),
    remove_member_ids: pendingRemove.value,
  })

  submitting.value = false

  if (updated) {
    toast.success('Grup berhasil diperbarui.')
    router.push(`/groups/${id}`)
  } else {
    toast.error(error.value ?? 'Gagal memperbarui grup.')
  }
}

// ── Hapus grup ────────────────────────────────────────────────────────────────

const handleDelete = async () => {
  const ok = await confirm({
    title:       'Hapus grup ini?',
    message:     `Grup "${group.value?.name}" dan semua datanya akan dihapus permanen.`,
    confirmText: 'Hapus Grup',
    cancelText:  'Batal',
    type:        'danger',
  })
  if (!ok) return
  const success = await deleteGroup(id)
  if (success) {
    toast.success('Grup berhasil dihapus.')
    router.push('/groups')
  } else {
    toast.error(error.value ?? 'Gagal menghapus grup.')
  }
}

const isOwner = computed(() =>
  group.value?.my_role === 'owner' || group.value?.creator?.id === user.value?.id
)
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 font-[Manrope]">

    <!-- Header -->
    <div class="flex items-center gap-3 mb-6 animate-[fadeIn_0.4s_ease_forwards]">
      <NuxtLink
        :to="`/groups/${id}`"
        class="p-2 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/5 transition"
      >
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Edit Grup</h1>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading && !group" class="space-y-4 animate-pulse">
      <div class="h-40 bg-gray-100 dark:bg-neutral-800 rounded-2xl" />
      <div class="h-32 bg-gray-100 dark:bg-neutral-800 rounded-2xl" />
      <div class="h-24 bg-gray-100 dark:bg-neutral-800 rounded-2xl" />
    </div>

    <!-- Error awal -->
    <div
      v-else-if="error && !group"
      class="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm"
    >
      <Icon name="heroicons:exclamation-circle" class="w-4 h-4 shrink-0" />
      {{ error }}
    </div>

    <div v-else-if="group" class="space-y-4 animate-[slideUp_0.4s_ease_forwards]">

      <form @submit.prevent="handleSubmit" class="space-y-4">

        <!-- ── CARD: Cover Grup ── -->
        <div class="bg-white dark:bg-[#181818] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800 space-y-3">
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Icon name="heroicons:photo" class="w-4 h-4 text-amber-500" />
            Cover Grup
          </p>
          <div
            class="relative h-40 rounded-xl overflow-hidden bg-gray-50 dark:bg-[#101010] border-2 border-dashed border-gray-200 dark:border-neutral-800 hover:border-amber-500 dark:hover:border-amber-500 cursor-pointer transition-colors duration-200 group"
            @click="($refs.coverInput as HTMLInputElement)?.click()"
          >
            <img
              v-if="coverPreview || group.cover_image"
              :src="coverPreview ?? group.cover_image ?? ''"
              class="w-full h-full object-cover"
            />
            <div v-else class="flex flex-col items-center justify-center h-full gap-2">
              <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#181818] group-hover:bg-amber-500/10 flex items-center justify-center transition-colors">
                <Icon name="heroicons:cloud-arrow-up" class="w-6 h-6 text-gray-400 group-hover:text-amber-500 transition-colors" />
              </div>
              <span class="text-sm text-gray-400">Klik untuk ganti cover</span>
            </div>
            <div
              v-if="coverPreview || group.cover_image"
              class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center"
            >
              <span class="inline-flex items-center gap-1.5 text-white text-sm font-semibold">
                <Icon name="heroicons:arrow-path" class="w-4 h-4" />
                Ganti Gambar
              </span>
            </div>
          </div>
          <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="onCoverChange" />
        </div>

        <!-- ── CARD: Informasi Grup ── -->
        <div class="bg-white dark:bg-[#181818] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800 space-y-4">
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Icon name="heroicons:document-text" class="w-4 h-4 text-amber-500" />
            Informasi Grup
          </p>

          <!-- Nama -->
          <div>
            <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">
              Nama Grup <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition"
              maxlength="100"
            />
          </div>

          <!-- Deskripsi -->
          <div>
            <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">Deskripsi</label>
            <textarea
              v-model="form.description"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition h-24 resize-none"
              maxlength="2000"
            />
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
                <option value="public">Publik — siapa saja bisa bergabung</option>
                <option value="closed">Tertutup — perlu persetujuan</option>
                <option value="private">Privat — hanya undangan</option>
              </select>
            </div>
          </div>

          <!-- Info privasi -->
          <div
            v-if="form.privacy !== 'public'"
            class="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs border"
            :class="form.privacy === 'private'
              ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50'
              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'"
          >
            <Icon
              :name="form.privacy === 'private' ? 'heroicons:lock-closed' : 'heroicons:shield-check'"
              class="w-4 h-4 shrink-0 mt-0.5"
            />
            <p v-if="form.privacy === 'closed'">
              <strong>Tertutup:</strong> User bisa menemukan dan mengirim permintaan bergabung.
              Owner/admin perlu menyetujui sebelum mereka bisa melihat konten.
            </p>
            <p v-else>
              <strong>Privat:</strong> Grup tidak muncul di pencarian publik.
              Hanya bisa bergabung via undangan dari owner/admin di bawah.
            </p>
          </div>
        </div>

        <!-- ── CARD: Lokasi ── -->
        <div class="bg-white dark:bg-[#181818] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800 space-y-4">
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Icon name="heroicons:map-pin" class="w-4 h-4 text-amber-500" />
            Lokasi
            <span class="text-gray-400 dark:text-neutral-500 font-normal text-xs">(opsional)</span>
          </p>
          <div class="relative">
            <Icon name="heroicons:map-pin" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
            <input
              v-model="form.location_name"
              type="text"
              class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition"
            />
          </div>
        </div>

        <!-- ── CARD: Kelola Anggota ── -->
        <div class="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden">

          <!-- Header -->
          <div class="flex items-center gap-3 p-5">
            <div class="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Icon name="heroicons:users" class="w-5 h-5 text-amber-500" />
            </div>
            <div class="flex-1">
              <p class="font-semibold text-sm text-gray-900 dark:text-white">Kelola Anggota</p>
              <p class="text-xs text-gray-400 mt-0.5">
                Tambah atau hapus anggota. Perubahan disimpan saat klik "Simpan".
              </p>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition border"
              :class="showInvitePanel
                ? 'bg-gray-100 dark:bg-[#101010] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-neutral-800 hover:bg-gray-200 dark:hover:bg-black'
                : 'bg-amber-500 hover:bg-amber-600 text-white border-transparent'"
              @click="showInvitePanel = !showInvitePanel"
            >
              <Icon :name="showInvitePanel ? 'heroicons:x-mark' : 'heroicons:user-plus'" class="w-3.5 h-3.5" />
              {{ showInvitePanel ? 'Tutup' : 'Tambah Anggota' }}
            </button>
          </div>

          <!-- Panel cari & tambah anggota -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-[400px]"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 max-h-[400px]"
            leave-to-class="opacity-0 max-h-0"
          >
            <div v-if="showInvitePanel" class="border-t border-gray-100 dark:border-neutral-800 p-5 space-y-3">
              <div class="relative">
                <Icon name="heroicons:magnifying-glass" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
                <input
                  v-model="userSearch"
                  type="text"
                  class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition"
                  placeholder="Cari nama pengguna..."
                  autofocus
                />
              </div>

              <div v-if="filteredUsers.length" class="space-y-1 max-h-44 overflow-y-auto">
                <button
                  v-for="u in filteredUsers"
                  :key="u.id"
                  type="button"
                  class="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#101010] transition text-left"
                  :class="isInPendingAdd(u.id) ? 'bg-amber-500/5 ring-1 ring-amber-500/30' : ''"
                  @click="toggleAdd({ id: u.id, name: u.name, avatar: u.avatar })"
                >
                  <img :src="u.avatar ?? `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(u.name)}`" class="w-8 h-8 rounded-full object-cover shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ u.name }}</p>
                    <p v-if="u.notes" class="text-xs text-gray-400 truncate">{{ u.notes }}</p>
                  </div>
                  <Icon v-if="isInPendingAdd(u.id)" name="heroicons:check" class="w-4 h-4 text-amber-500 shrink-0" />
                </button>
              </div>
              <p v-else-if="userSearch && !loadingUsers" class="text-xs text-gray-400 text-center py-2">
                Pengguna tidak ditemukan.
              </p>

              <!-- Chips yang akan ditambah -->
              <div v-if="pendingAdd.length" class="flex flex-wrap gap-2">
                <div
                  v-for="u in pendingAdd"
                  :key="u.id"
                  class="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full pl-1.5 pr-2 py-0.5"
                >
                  <img :src="u.avatar ?? `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(u.name)}`" class="w-5 h-5 rounded-full object-cover" />
                  <span class="text-xs font-medium">{{ u.name }}</span>
                  <button
                    type="button"
                    class="text-amber-500/70 hover:text-red-500 leading-none transition"
                    @click="toggleAdd(u)"
                  >
                    <Icon name="heroicons:x-mark" class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </Transition>

          <!-- List anggota aktif -->
          <div v-if="activeMembers.length" class="border-t border-gray-100 dark:border-neutral-800 p-5">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
              Anggota aktif ({{ activeMembers.length }})
              <span class="font-normal" v-if="activeMembers.length > 1"> · klik untuk hapus</span>
            </p>
            <div class="space-y-1.5">
              <div
                v-for="m in activeMembers"
                :key="m.id"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition"
                :class="[
                  m.pivot?.role === 'owner' || m.id === user?.id
                    ? 'bg-gray-50 dark:bg-[#101010] opacity-70'
                    : isInPendingRemove(m.id)
                      ? 'bg-red-50 dark:bg-red-950/30 ring-1 ring-red-200 dark:ring-red-800/50 cursor-pointer'
                      : 'bg-gray-50 dark:bg-[#101010] hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer',
                ]"
                @click="m.pivot?.role !== 'owner' && m.id !== user?.id && toggleRemove(m.id)"
              >
                <img
                  :src="m.avatar ?? `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(m.name)}`"
                  class="w-8 h-8 rounded-full object-cover shrink-0 transition"
                  :class="isInPendingRemove(m.id) ? 'opacity-50' : ''"
                />
                <div class="flex-1 min-w-0">
                  <p
                    class="text-sm font-medium truncate"
                    :class="isInPendingRemove(m.id) ? 'line-through text-red-400' : 'text-gray-900 dark:text-white'"
                  >
                    {{ m.name }}
                    <span v-if="m.id === user?.id" class="text-xs text-amber-500 font-normal ml-1">(kamu)</span>
                  </p>
                  <p class="text-xs text-gray-400 capitalize flex items-center gap-1">
                    <Icon
                      :name="m.pivot?.role === 'owner' ? 'heroicons:crown' : m.pivot?.role === 'admin' ? 'heroicons:bolt' : 'heroicons:user'"
                      class="w-3 h-3"
                    />
                    {{ m.pivot?.role === 'owner' ? 'Owner' : m.pivot?.role === 'admin' ? 'Admin' : 'Member' }}
                  </p>
                </div>
                <span v-if="isInPendingRemove(m.id)" class="text-xs text-red-500 font-semibold shrink-0 flex items-center gap-1">
                  <Icon name="heroicons:trash" class="w-3.5 h-3.5" />
                  Hapus
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── CARD: Permintaan Bergabung (closed) ── -->
        <div
          v-if="group.privacy === 'closed' && pendingMembers.length"
          class="bg-white dark:bg-[#181818] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800 space-y-3"
        >
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Icon name="heroicons:bell" class="w-4 h-4 text-amber-500" />
            Permintaan Bergabung
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
              {{ pendingMembers.length }}
            </span>
          </p>
          <div class="space-y-2">
            <div
              v-for="m in pendingMembers"
              :key="m.id"
              class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#101010]"
            >
              <img :src="m.avatar ?? `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(m.name)}`" class="w-8 h-8 rounded-full object-cover shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ m.name }}</p>
                <p class="text-xs text-gray-400 flex items-center gap-1">
                  <Icon name="heroicons:clock" class="w-3 h-3" />
                  Menunggu persetujuan
                </p>
              </div>
              <div class="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition"
                  @click="handleApprove(m.id, 'approve')"
                >
                  <Icon name="heroicons:check" class="w-3 h-3" />
                  Setujui
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#181818] hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 text-xs font-semibold transition border border-gray-200 dark:border-neutral-800 hover:border-red-200 dark:hover:border-red-800/50"
                  @click="handleApprove(m.id, 'reject')"
                >
                  <Icon name="heroicons:x-mark" class="w-3 h-3" />
                  Tolak
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary perubahan -->
        <div
          v-if="pendingAdd.length || pendingRemove.length"
          class="flex flex-col gap-0.5 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 text-xs"
        >
          <p v-if="pendingAdd.length" class="flex items-center gap-1.5">
            <Icon name="heroicons:user-plus" class="w-3.5 h-3.5 shrink-0" />
            Menambahkan {{ pendingAdd.length }} anggota baru
          </p>
          <p v-if="pendingRemove.length" class="flex items-center gap-1.5">
            <Icon name="heroicons:user-minus" class="w-3.5 h-3.5 shrink-0" />
            Menghapus {{ pendingRemove.length }} anggota
          </p>
          <p class="text-amber-500 mt-0.5 flex items-center gap-1.5">
            <Icon name="heroicons:information-circle" class="w-3.5 h-3.5 shrink-0" />
            Perubahan ini akan disimpan saat kamu klik "Simpan Perubahan".
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
        <div class="flex items-center justify-between pt-1">
          <button
            v-if="isOwner"
            type="button"
            class="inline-flex cursor-pointer items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-500 dark:text-red-400 text-sm font-semibold transition border border-red-200 dark:border-red-800/50"
            @click="handleDelete"
          >
            <Icon name="heroicons:trash" class="w-4 h-4" />
            Hapus Grup
          </button>
          <div class="flex gap-3 ml-auto">
            <NuxtLink
              :to="`/groups/${id}`"
              class="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#101010] hover:bg-neutral-200 dark:hover:bg-[#181818] text-gray-700 dark:text-gray-300 font-semibold text-sm transition border border-gray-200 dark:border-neutral-800"
            >
              Batal
            </NuxtLink>
            <button
              type="submit"
              class="inline-flex cursor-pointer items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="loading || submitting"
            >
              <Icon v-if="loading || submitting" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
              <Icon v-else name="heroicons:check" class="w-4 h-4" />
              {{ (loading || submitting) ? 'Menyimpan...' : 'Simpan Perubahan' }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <BaseToast />
    <BaseConfirm />
  </div>
</template>