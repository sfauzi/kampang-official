<!-- pages/dashboard/groups/create.vue -->
<!--
  Lokasi  : pages/dashboard/groups/create.vue
  Layout  : dashboard | Akses: login wajib
  Fix:
  - Jika privasi = tertutup atau privat → tampilkan panel tambah anggota
  - Jika privasi = publik → panel anggota disembunyikan (siapa saja bisa join)
  - Anggota yang ditambah saat create langsung active (via add_member_ids)
  - Creator tidak muncul di hasil pencarian (sudah auto-jadi owner)
-->
<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import type { StoreGroupPayload } from '~/types/kenangan'

const { createGroup, loading, error } = useGroups()
const { user: authUser }              = useAuth()
const config = useRuntimeConfig()
const toast  = useToast()
const router = useRouter()

const form = reactive<StoreGroupPayload>({
  name:          '',
  description:   '',
  cover_image:   null,
  category:      'other',
  privacy:       'public',
  location_name: '',
  latitude:      null,
  longitude:     null,
})

const coverPreview = ref<string | null>(null)

const onCoverChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  form.cover_image  = file
  coverPreview.value = URL.createObjectURL(file)
}

// ── Tambah anggota (untuk closed/private) ───────────────────────────────────

// Panel hanya tampil jika privacy bukan public
const showMemberPanel = computed(() => form.privacy !== 'public')

const allUsers       = ref<{ id: string; name: string; avatar: string | null; notes: string | null }[]>([])
const loadingUsers   = ref(false)
const userSearch     = ref('')
const selectedMembers = ref<{ id: string; name: string; avatar: string | null }[]>([])

const fetchAllUsers = async () => {
  if (allUsers.value.length) return
  loadingUsers.value = true
  try {
    allUsers.value = await $fetch<any[]>(`${config.public.apiBase}/api/users/names`)
  } catch {}
  loadingUsers.value = false
}

// Load users ketika panel pertama kali tampil
watch(showMemberPanel, (val) => { if (val) fetchAllUsers() })

// Exclude: diri sendiri (auto-owner) + yang sudah dipilih
const filteredUsers = computed(() => {
  const excluded = new Set([
    authUser.value?.id ?? '',
    ...selectedMembers.value.map(u => u.id),
  ])
  const base = allUsers.value.filter(u => !excluded.has(u.id))
  if (!userSearch.value.trim()) return base.slice(0, 8)
  const q = userSearch.value.toLowerCase()
  return base.filter(u => u.name.toLowerCase().includes(q)).slice(0, 8)
})

const isSelected = (uid: string) => selectedMembers.value.some(u => u.id === uid)

const toggleMember = (u: { id: string; name: string; avatar: string | null }) => {
  const idx = selectedMembers.value.findIndex(c => c.id === u.id)
  idx === -1 ? selectedMembers.value.push(u) : selectedMembers.value.splice(idx, 1)
}

const removeMember = (uid: string) => {
  selectedMembers.value = selectedMembers.value.filter(u => u.id !== uid)
}

// Reset selected members jika kembali ke public
watch(() => form.privacy, (val) => {
  if (val === 'public') selectedMembers.value = []
})

// ── Submit ───────────────────────────────────────────────────────────────────

const handleSubmit = async () => {
  if (!form.name.trim()) {
    toast.error('Nama grup wajib diisi.')
    return
  }

  // Kirim add_member_ids jika ada anggota yang dipilih
  const group = await createGroup({
    ...form,
    add_member_ids: selectedMembers.value.map(u => u.id),
  } as any)

  if (group) {
    toast.success('Grup berhasil dibuat!')
    router.push(`/groups/${group.id}`)
  } else {
    toast.error(error.value ?? 'Gagal membuat grup.')
  }
}

const categoryOptions = [
  { label: 'Sekolah',   value: 'school' },
  { label: 'Pendakian', value: 'hiking' },
  { label: 'Traveling', value: 'traveling' },
  { label: 'Lainnya',   value: 'other' },
]

const privacyOptions = [
  { label: 'Publik — siapa saja bisa bergabung',  value: 'public' },
  { label: 'Tertutup — perlu persetujuan',         value: 'closed' },
  { label: 'Privat — hanya undangan',              value: 'private' },
]
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 font-[Manrope]">

    <!-- Header -->
    <div class="flex items-center gap-3 mb-6 animate-[fadeIn_0.4s_ease_forwards]">
      <NuxtLink
        to="/groups"
        class="p-2 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/5 transition"
      >
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Buat Grup Baru</h1>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4 animate-[slideUp_0.4s_ease_forwards]">

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
          <img v-if="coverPreview" :src="coverPreview" class="w-full h-full object-cover" />
          <div v-else class="flex flex-col items-center justify-center h-full gap-2">
            <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#181818] group-hover:bg-amber-500/10 flex items-center justify-center transition-colors">
              <Icon name="heroicons:cloud-arrow-up" class="w-6 h-6 text-gray-400 group-hover:text-amber-500 transition-colors" />
            </div>
            <span class="text-sm text-gray-400">Klik untuk upload gambar cover</span>
          </div>
          <div
            v-if="coverPreview"
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
            placeholder="Contoh: Angkatan 2015 SMAN 1"
            maxlength="100"
          />
        </div>

        <!-- Deskripsi -->
        <div>
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">Deskripsi</label>
          <textarea
            v-model="form.description"
            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition h-24 resize-none"
            placeholder="Ceritakan sedikit tentang grup ini..."
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
            <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">
              Kategori <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.category"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition appearance-none cursor-pointer"
            >
              <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
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
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Info privasi -->
        <Transition name="fade">
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
              <strong>Tertutup:</strong> User bisa menemukan grup dan mengirim permintaan bergabung.
              Kamu perlu menyetujui sebelum mereka bisa masuk.
              Kamu juga bisa langsung tambah anggota di bawah.
            </p>
            <p v-else>
              <strong>Privat:</strong> Grup tidak muncul di pencarian publik.
              Satu-satunya cara masuk adalah via undangan dari owner/admin (kamu).
              Tambah anggota di bawah untuk langsung mengundang mereka.
            </p>
          </div>
        </Transition>
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
            placeholder="Contoh: Bandung, Jawa Barat"
          />
        </div>
      </div>

      <!-- ── CARD: Tambah Anggota (closed/private) ── -->
      <Transition name="fade">
        <div
          v-if="showMemberPanel"
          class="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden"
        >
          <div class="flex items-start gap-3 p-5 border-b border-gray-100 dark:border-neutral-800">
            <div class="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Icon name="heroicons:user-plus" class="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p class="font-semibold text-sm text-gray-900 dark:text-white">
                Tambah Anggota
                <span class="font-normal text-gray-400 ml-1 text-xs">(opsional, bisa ditambah nanti)</span>
              </p>
              <p class="text-xs text-gray-400 mt-0.5">
                Anggota yang kamu tambah di sini akan langsung aktif tanpa perlu persetujuan.
              </p>
            </div>
          </div>

          <div class="p-5 space-y-3">
            <!-- Search -->
            <div class="relative">
              <Icon name="heroicons:magnifying-glass" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
              <input
                v-model="userSearch"
                type="text"
                class="w-full pl-10 pr-8 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition"
                placeholder="Cari nama pengguna..."
                @focus="fetchAllUsers"
              />
              <span v-if="loadingUsers" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                memuat...
              </span>
            </div>

            <!-- Hasil pencarian -->
            <div v-if="filteredUsers.length" class="space-y-1 max-h-48 overflow-y-auto">
              <button
                v-for="u in filteredUsers"
                :key="u.id"
                type="button"
                class="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#101010] transition text-left"
                :class="isSelected(u.id) ? 'bg-amber-500/5 ring-1 ring-amber-500/30' : ''"
                @click="toggleMember({ id: u.id, name: u.name, avatar: u.avatar })"
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
            <p v-else-if="!userSearch && !loadingUsers && !filteredUsers.length" class="text-xs text-gray-400 text-center py-2 flex items-center justify-center gap-1">
              <Icon name="heroicons:magnifying-glass" class="w-3.5 h-3.5" />
              Ketik nama untuk mencari pengguna.
            </p>

            <!-- Chips anggota terpilih -->
            <div v-if="selectedMembers.length" class="flex flex-wrap gap-2 pt-1">
              <div
                v-for="u in selectedMembers"
                :key="u.id"
                class="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full pl-1.5 pr-2 py-0.5"
              >
                <img :src="u.avatar ?? '/default-avatar.png'" class="w-5 h-5 rounded-full object-cover" />
                <span class="text-xs font-medium">{{ u.name }}</span>
                <button
                  type="button"
                  class="text-amber-500/70 hover:text-red-500 leading-none transition"
                  @click="removeMember(u.id)"
                >
                  <Icon name="heroicons:x-mark" class="w-3 h-3" />
                </button>
              </div>
            </div>
            <p v-if="!selectedMembers.length" class="text-xs text-gray-400 flex items-center gap-1">
              <Icon name="heroicons:information-circle" class="w-3.5 h-3.5" />
              Belum ada anggota dipilih. Grup tetap bisa dibuat tanpa anggota awal.
            </p>
          </div>
        </div>
      </Transition>

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
          to="/groups"
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
          <Icon v-else name="heroicons:user-group" class="w-4 h-4" />
          {{ loading ? 'Menyimpan...' : 'Buat Grup' }}
        </button>
      </div>
    </form>

    <BaseToast />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>