<!-- pages/dashboard/memories/create.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import type { StoreMemoryPayload, Category, Privacy } from '~/types/kenangan'

const { createMemory, loading, error }          = useMemories()
const { tags: allTags, fetchTags }              = useTags()
const { groups, fetchGroups }                   = useGroups()
const { myAlbums, fetchMyAlbums }               = useAlbums()
const albumsComposable = useAlbums()

const toast  = useToast()
const router = useRouter()
const route  = useRoute()
const { setPageSeo } = useSeoMetaHelper()

const fromAlbumId = (route.query.album_id as string) || null
const fromGroupId = (route.query.group_id as string) || null

const lockedAlbum = ref<{
  id: string
  title: string
  privacy: Privacy
  group_id: string | null
} | null>(null)

const form = reactive<Omit<StoreMemoryPayload, 'media'>>({
  title:           '',
  caption:         '',
  memory_date:     new Date().toISOString().slice(0, 10),
  category:        'other',
  privacy:         'public',
  group_id:        fromGroupId,
  album_id:        fromAlbumId,
  location_name:   '',
  latitude:        null,
  longitude:       null,
  tag_ids:         [],
  tagged_user_ids: [],
})

// ── Media state: simpan file + preview URL + tipe ──────────────────────────
const mediaFiles    = ref<File[]>([])
const mediaPreviews = ref<string[]>([])
const mediaTypes    = ref<('photo' | 'video')[]>([])  // FIX: track tipe tiap file

// FIX: Konstanta ukuran file (exact match dengan backend: 10MB = 10240 KB)
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB dalam bytes

// FIX: Validasi file individual sebelum preview
const isValidMediaFile = (file: File): { valid: boolean; error?: string } => {
  // Check size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `${file.name} terlalu besar (${(file.size / 1024 / 1024).toFixed(2)}MB). Maksimal 10MB.`,
    }
  }

  // Check MIME type
  const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
  if (!validMimes.includes(file.type)) {
    return {
      valid: false,
      error: `${file.name} format tidak didukung. Gunakan JPG, PNG, GIF, MP4, WebM, atau MOV.`,
    }
  }

  return { valid: true }
}

onMounted(async () => {
  setPageSeo(
    'Buat Kenangan',
    'Buat kenangan dan abadikan',
    '/dashboard/memories/create'
  )

  await Promise.all([
    fetchTags(),
    fetchGroups({ per_page: 50 }),
    fetchMyAlbums({ per_page: 100 }),
  ])

  if (fromAlbumId) {
    await albumsComposable.fetchAlbum(fromAlbumId)
    const a = albumsComposable.album.value
    if (a) {
      lockedAlbum.value = {
        id:       a.id,
        title:    a.title,
        privacy:  a.privacy,
        group_id: a.group?.id ?? null,
      }
      form.privacy  = a.privacy
      form.group_id = a.group?.id ?? null
      form.album_id = a.id
    }
  }
})

const onAlbumChange = () => {
  if (!form.album_id) return
  const chosen = myAlbums.value.find(a => a.id === form.album_id)
  if (chosen) {
    form.privacy  = chosen.privacy
    form.group_id = chosen.group?.id ?? null
  }
}

const albumsForSelectedGroup = computed(() =>
  myAlbums.value.filter(a => a.group?.id === form.group_id)
)
const albumsWithoutGroup = computed(() =>
  myAlbums.value.filter(a => !a.group)
)

// ── FIX: Generate video thumbnail menggunakan canvas ────────────────────────
const generateVideoThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const url    = URL.createObjectURL(file)
    const video  = document.createElement('video')
    video.src    = url
    video.muted  = true
    video.preload = 'metadata'

    video.onloadeddata = () => {
      video.currentTime = 0
    }

    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = 160
      canvas.height = 160
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // crop center-square dari video
        const vw = video.videoWidth
        const vh = video.videoHeight
        const size = Math.min(vw, vh)
        const sx = (vw - size) / 2
        const sy = (vh - size) / 2
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 160, 160)
      }
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }

    video.onerror = () => {
      // Fallback: gunakan placeholder jika gagal generate thumbnail
      URL.revokeObjectURL(url)
      resolve('')
    }
  })
}

// ── FIX: onMediaSelect — handle video thumbnail + validasi size ─────────────
const onMediaSelect = async (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])

  // Reset input
  ;(e.target as HTMLInputElement).value = ''

  if (!files.length) return

  const errors: string[] = []
  const validFiles: File[] = []

  // Validasi setiap file individual
  for (const file of files) {
    const validation = isValidMediaFile(file)
    if (!validation.valid) {
      errors.push(validation.error!)
    } else {
      validFiles.push(file)
    }
  }

  // Tampilkan semua error sekaligus
  if (errors.length) {
    toast.error(errors.join('\n'))
  }

  if (!validFiles.length) return

  const combined = [...mediaFiles.value, ...validFiles].slice(0, 100)

  // Generate preview
  const newPreviews: string[] = []
  const newTypes: ('photo' | 'video')[] = []

  for (const f of combined) {
    const isVideo = f.type.startsWith('video/')
    newTypes.push(isVideo ? 'video' : 'photo')

    if (isVideo) {
      const thumb = await generateVideoThumbnail(f)
      newPreviews.push(thumb || URL.createObjectURL(f))
    } else {
      newPreviews.push(URL.createObjectURL(f))
    }
  }

  mediaFiles.value = combined
  mediaPreviews.value = newPreviews
  mediaTypes.value = newTypes
}

const removeMedia = (i: number) => {
  mediaFiles.value.splice(i, 1)
  mediaPreviews.value.splice(i, 1)
  mediaTypes.value.splice(i, 1)
}

const toggleTag = (tagId: string) => {
  const idx = form.tag_ids!.indexOf(tagId)
  idx === -1 ? form.tag_ids!.push(tagId) : form.tag_ids!.splice(idx, 1)
}

// ── FIX: handleSubmit — jangan redirect jika ada error ──────────────────────
const handleSubmit = async () => {
  if (!form.memory_date) {
    toast.error('Tanggal kenangan wajib diisi.')
    return
  }

  const memory = await createMemory({ ...form, media: mediaFiles.value })

  // FIX: hanya redirect jika memory berhasil dibuat (tidak null)
  if (memory) {
    toast.success('Kenangan berhasil ditambahkan!')
    if (fromAlbumId) router.push(`/albums/${fromAlbumId}`)
    else router.push(`/memories/${memory.id}`)
  }
  // Jika null, error sudah di-set oleh composable → tampil di template, TIDAK redirect
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
      <button
        class="p-2 rounded-xl cursor-pointer text-gray-400 hover:text-gray-200 hover:bg-white/5 transition"
        @click="$router.back()"
      >
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Tambah Kenangan</h1>
        <p v-if="lockedAlbum" class="text-xs text-gray-400 mt-0.5">
          ke album
          <NuxtLink :to="`/albums/${lockedAlbum.id}`" class="text-brand hover:underline font-semibold">
            {{ lockedAlbum.title }}
          </NuxtLink>
        </p>
      </div>
    </div>

    <!-- Banner album terkunci -->
    <div
      v-if="lockedAlbum"
      class="mb-5 flex items-center gap-3 bg-brand/10 border border-brand/30 rounded-2xl px-4 py-3 animate-[slideUp_0.3s_ease_forwards]"
    >
      <div class="w-9 h-9 rounded-xl bg-brand/20 flex items-center justify-center shrink-0">
        <Icon name="heroicons:book-open" class="w-5 h-5 text-brand" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{{ lockedAlbum.title }}</p>
        <p class="text-xs text-gray-400">Kenangan ini akan otomatis masuk ke album di atas</p>
      </div>
      <button
        type="button"
        class="text-gray-400 hover:text-red-400 shrink-0 ml-2 transition p-1 rounded-lg"
        @click="() => { lockedAlbum = null; form.album_id = null }"
      >
        <Icon name="heroicons:x-mark" class="w-4 h-4" />
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4 animate-[slideUp_0.4s_ease_forwards]">

      <!-- ── CARD: Media Upload ── -->
      <div class="bg-white dark:bg-[#181818] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800">
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
          <Icon name="heroicons:photo" class="w-4 h-4 text-amber-500" />
          Foto / Video
          <span class="text-gray-400 font-normal text-xs ml-1">(maks. 100 file, maks. 2MB/file)</span>
        </p>
        <div
          v-if="!mediaPreviews.length"
          class="border-2 border-dashed border-gray-200 dark:border-neutral-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl h-36 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 gap-2 group"
          @click="($refs.mediaInput as HTMLInputElement)?.click()"
        >
          <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#101010] group-hover:bg-brand/10 flex items-center justify-center transition-colors">
            <Icon name="heroicons:cloud-arrow-up" class="w-6 h-6 text-gray-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <span class="text-gray-400 text-sm">Klik atau seret foto/video ke sini</span>
        </div>

        <!-- FIX: Grid preview dengan indikator tipe video -->
        <div v-else class="grid grid-cols-4 gap-2">
          <div
            v-for="(preview, i) in mediaPreviews"
            :key="i"
            class="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group"
          >
            <!-- FIX: Selalu render <img> karena preview sudah berupa URL/dataURL -->
            <img
              :src="preview || '/placeholder-video.png'"
              class="w-full h-full object-cover"
              :class="{ 'opacity-80': mediaTypes[i] === 'video' }"
            />
            <!-- FIX: Badge overlay untuk video -->
            <div
              v-if="mediaTypes[i] === 'video'"
              class="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div class="bg-black/50 rounded-full p-2">
                <Icon name="heroicons:play" class="w-5 h-5 text-white" />
              </div>
            </div>
            <!-- Tombol hapus -->
            <button
              type="button"
              class="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition"
              @click="removeMedia(i)"
            >
              <Icon name="heroicons:x-mark" class="w-3 h-3" />
            </button>
          </div>
          <!-- Tombol tambah media -->
          <div
            v-if="mediaPreviews.length < 100"
            class="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-brand flex items-center justify-center cursor-pointer transition-colors"
            @click="($refs.mediaInput as HTMLInputElement)?.click()"
          >
            <Icon name="heroicons:plus" class="w-6 h-6 text-gray-400" />
          </div>
        </div>
        <input ref="mediaInput" type="file" accept="image/*,video/*" multiple class="hidden" @change="onMediaSelect" />
      </div>

      <!-- ── CARD: Informasi Dasar ── -->
      <div class="bg-white dark:bg-[#181818] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800 space-y-4">
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Icon name="heroicons:document-text" class="w-4 h-4 text-amber-500" />
          Informasi Dasar
        </p>

        <!-- Judul -->
        <div>
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">
            Judul <span class="text-gray-400 dark:text-neutral-500 text-xs">(opsional)</span>
          </label>
          <input
            v-model="form.title"
            type="text"
            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition"
            placeholder="Contoh: Pendakian Gunung Rinjani 2024"
            maxlength="200"
          />
        </div>

        <!-- Caption -->
        <div>
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">Cerita / Caption</label>
          <textarea
            v-model="form.caption"
            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition h-28 resize-none"
            placeholder="Ceritakan momen ini..."
            maxlength="5000"
          />
        </div>

        <!-- Tanggal -->
        <div>
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">
            Tanggal Kenangan <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.memory_date"
            type="date"
            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition [color-scheme:dark]"
            :max="new Date().toISOString().slice(0,10)"
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
              <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">
              Privasi <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.privacy"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!!lockedAlbum || !!form.album_id"
            >
              <option v-for="opt in privacyOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <p v-if="lockedAlbum || form.album_id" class="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Icon name="heroicons:lock-closed" class="w-3 h-3" />
              Mengikuti privasi album
            </p>
          </div>
        </div>
      </div>

      <!-- ── CARD: Grup & Album ── -->
      <div class="bg-white dark:bg-[#181818] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800 space-y-4">
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Icon name="heroicons:folder-open" class="w-4 h-4 text-amber-500" />
          Grup & Album
        </p>

        <div v-if="groups.length">
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">
            Grup <span class="text-gray-400 dark:text-neutral-500 text-xs">(opsional)</span>
          </label>
          <select
            v-model="form.group_id"
            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition appearance-none cursor-pointer disabled:opacity-50"
            :disabled="!!(lockedAlbum && lockedAlbum.group_id)"
            @change="() => { if (!lockedAlbum) form.album_id = null }"
          >
            <option :value="null">— Tanpa grup —</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">
            Album <span class="text-gray-400 dark:text-neutral-500 text-xs">(opsional)</span>
          </label>
          <div
            v-if="lockedAlbum"
            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-brand/30 flex items-center gap-2 cursor-not-allowed"
          >
            <Icon name="heroicons:book-open" class="w-4 h-4 text-brand shrink-0" />
            <span class="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{{ lockedAlbum.title }}</span>
            <span class="text-xs text-gray-400 flex items-center gap-1 shrink-0">
              <Icon name="heroicons:lock-closed" class="w-3 h-3" /> Terkunci
            </span>
          </div>
          <select
            v-else
            v-model="form.album_id"
            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition appearance-none cursor-pointer"
            @change="onAlbumChange"
          >
            <option :value="null">— Tanpa album —</option>
            <optgroup v-if="form.group_id && albumsForSelectedGroup.length" label="Album di grup ini">
              <option v-for="a in albumsForSelectedGroup" :key="a.id" :value="a.id">{{ a.title }}</option>
            </optgroup>
            <optgroup v-if="albumsWithoutGroup.length" label="Album personal">
              <option v-for="a in albumsWithoutGroup" :key="a.id" :value="a.id">{{ a.title }}</option>
            </optgroup>
            <optgroup v-if="!form.group_id && myAlbums.length" label="Semua albumku">
              <option v-for="a in myAlbums" :key="a.id" :value="a.id">
                {{ a.title }}<template v-if="a.group"> ({{ a.group.name }})</template>
              </option>
            </optgroup>
          </select>
          <p v-if="!lockedAlbum && form.album_id" class="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <Icon name="heroicons:information-circle" class="w-3.5 h-3.5" />
            Privasi mengikuti album yang dipilih.
          </p>
          <p v-if="!myAlbums.length && !lockedAlbum" class="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <Icon name="heroicons:information-circle" class="w-3.5 h-3.5" />
            Belum ada album.
            <NuxtLink to="/dashboard/albums/create" class="text-brand hover:underline ml-0.5">Buat album baru →</NuxtLink>
          </p>
        </div>
      </div>

      <!-- ── CARD: Lokasi & Tag ── -->
      <div class="bg-white dark:bg-[#181818] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800 space-y-4">
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Icon name="heroicons:map-pin" class="w-4 h-4 text-amber-500" />
          Lokasi & Tag
        </p>

        <div>
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">
            Lokasi <span class="text-gray-400 dark:text-neutral-500 text-xs">(opsional)</span>
          </label>
          <div class="relative">
            <Icon name="heroicons:map-pin" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
            <input
              v-model="form.location_name"
              type="text"
              class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-amber-500 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition"
              placeholder="Contoh: Gunung Rinjani, NTB"
            />
          </div>
        </div>

        <div v-if="allTags.length">
          <label class="block text-sm text-gray-500 dark:text-gray-400 mb-2">Tag</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tag in allTags"
              :key="tag.id"
              type="button"
              class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border"
              :class="form.tag_ids?.includes(tag.id)
                ? 'bg-brand border-brand text-white shadow-sm'
                : 'bg-gray-100 dark:bg-[#101010] border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-amber-500 hover:text-brand dark:hover:text-brand'"
              @click="toggleTag(tag.id)"
            >
              #{{ tag.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- Error — FIX: selalu tampil di sini, tidak redirect -->
      <div
        v-if="error"
        class="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm"
      >
        <Icon name="heroicons:exclamation-circle" class="w-4 h-4 shrink-0" />
        {{ error }}
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-1">
        <button
          type="button"
          class="flex-1 px-5 py-3 cursor-pointer rounded-xl bg-gray-100 dark:bg-[#101010] hover:bg-neutral-200 dark:hover:bg-[#181818] text-gray-700 dark:text-gray-300 font-semibold text-sm transition border border-gray-200 dark:border-neutral-800"
          @click="$router.back()"
        >
          Batal
        </button>
        <button
          type="submit"
          class="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          :disabled="loading"
        >
          <Icon v-if="loading" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
          <Icon v-else name="heroicons:check" class="w-4 h-4" />
          {{ loading ? 'Menyimpan...' : 'Simpan' }}
        </button>
      </div>
    </form>

    <BaseToast />
  </div>
</template>