<!-- pages/dashboard/memories/[id]/edit.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import type { Privacy } from '~/types/kenangan'

const route  = useRoute()
const router = useRouter()
const id     = route.params.id as string

const { memory, loading, error, fetchMemory, updateMemory, addMedia, deleteMedia } = useMemories()
const { tags: allTags, fetchTags }  = useTags()
const { groups, fetchGroups }       = useGroups()
const { myAlbums, fetchMyAlbums }   = useAlbums()
const toast       = useToast()
const { confirm } = useConfirm()
const { user }    = useAuth()

onMounted(async () => {
  await Promise.all([
    fetchMemory(id),
    fetchTags(),
    fetchGroups({ per_page: 50 }),
    fetchMyAlbums({ per_page: 100 }),
  ])

  if (memory.value) {
    form.title         = memory.value.title ?? ''
    form.caption       = memory.value.caption ?? ''
    form.memory_date   = memory.value.memory_date
    form.category      = memory.value.category
    form.privacy       = memory.value.privacy
    form.group_id      = memory.value.group?.id ?? null
    form.album_id      = memory.value.album?.id ?? null
    form.location_name = memory.value.location.name ?? ''
    form.tag_ids       = memory.value.tags?.map(t => t.id) ?? []
  }
})

watchEffect(() => {
  if (memory.value && user.value && memory.value.user?.id !== user.value.id) {
    toast.error('Kamu tidak bisa mengedit kenangan ini.')
    router.push(`/memories/${id}`)
  }
})

const form = reactive({
  title:         '',
  caption:       '',
  memory_date:   '',
  category:      'other' as any,
  privacy:       'public' as Privacy,
  group_id:      null as string | null,
  album_id:      null as string | null,
  location_name: '',
  tag_ids:       [] as string[],
})

const albumsForSelectedGroup = computed(() =>
  myAlbums.value.filter(a => a.group?.id === form.group_id)
)
const albumsWithoutGroup = computed(() =>
  myAlbums.value.filter(a => !a.group)
)

const onAlbumChange = () => {
  if (!form.album_id) return
  const chosen = myAlbums.value.find(a => a.id === form.album_id)
  if (chosen) {
    form.privacy  = chosen.privacy
    form.group_id = chosen.group?.id ?? null
  }
}

const onGroupChange = () => {
  form.album_id = null
}

const currentAlbum = computed(() => memory.value?.album ?? null)

const newFiles    = ref<File[]>([])
const newPreviews = ref<string[]>([])

const onNewMedia = (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  newFiles.value    = files.slice(0, 100)
  newPreviews.value = newFiles.value.map(f => URL.createObjectURL(f))
}

const removeNewMedia = (i: number) => {
  newFiles.value.splice(i, 1)
  newPreviews.value.splice(i, 1)
}

const handleDeleteMedia = async (mediaId: string) => {
  const ok = await confirm({
    title: 'Hapus media ini?',
    message: 'Media ini akan dihapus permanen.',
    confirmText: 'Hapus',
    cancelText: 'Batal',
    type: 'danger',
  })
  if (!ok) return
  const success = await deleteMedia(id, mediaId)
  if (success) toast.success('Media dihapus.')
}

const toggleTag = (tagId: string) => {
  const idx = form.tag_ids.indexOf(tagId)
  idx === -1 ? form.tag_ids.push(tagId) : form.tag_ids.splice(idx, 1)
}

const handleSubmit = async () => {
  const updated = await updateMemory(id, {
    ...form,
    latitude:  null,
    longitude: null,
  })

  if (updated && newFiles.value.length) {
    await addMedia(id, newFiles.value)
  }

  if (updated) {
    toast.success('Kenangan berhasil diperbarui.')
    if (form.album_id) router.push(`/albums/${form.album_id}`)
    else router.push(`/memories/${id}`)
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
        :to="`/memories/${id}`"
        class="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition"
      >
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">Edit Kenangan</h1>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading && !memory" class="space-y-4">
      <div v-for="i in 4" :key="i" class="h-40 animate-pulse bg-gray-100 dark:bg-[#181818] rounded-2xl" />
    </div>

    <form v-else-if="memory" @submit.prevent="handleSubmit" class="space-y-4 animate-[slideUp_0.4s_ease_forwards]">

      <!-- ── CARD: Media ── -->
      <div class="bg-white dark:bg-[#181818] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800 space-y-4">
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Icon name="heroicons:photo" class="w-4 h-4 text-amber-500" />
          Media
        </p>

        <!-- Existing media -->
        <div v-if="memory.media?.length">
          <label class="block text-sm text-gray-500 dark:text-gray-400 mb-2">Media yang ada</label>
          <div class="grid grid-cols-4 gap-2">
            <div
              v-for="m in memory.media"
              :key="m.id"
              class="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group"
            >
              <img :src="m.thumbnail_url ?? m.url" class="w-full h-full object-cover" />
              <button
                type="button"
                class="absolute top-1 cursor-pointer right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition"
                @click="handleDeleteMedia(m.id)"
              >
                <Icon name="heroicons:x-mark" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Add new media -->
        <div>
          <label class="block text-sm text-gray-500 dark:text-gray-400 mb-2">Tambah Foto/Video Baru</label>
          <div class="grid grid-cols-4 gap-2">
            <div
              v-for="(p, i) in newPreviews"
              :key="i"
              class="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800"
            >
              <img :src="p" class="w-full h-full object-cover" />
              <button
                type="button"
                class="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition"
                @click="removeNewMedia(i)"
              >
                <Icon name="heroicons:x-mark" class="w-3.5 h-3.5" />
              </button>
            </div>
            <div
              class="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-neutral-700 hover:border-brand flex items-center justify-center cursor-pointer transition-colors"
              @click="($refs.newMediaInput as HTMLInputElement)?.click()"
            >
              <Icon name="heroicons:plus" class="w-6 h-6 text-gray-400" />
            </div>
          </div>
          <input ref="newMediaInput" type="file" accept="image/*,video/*" multiple class="hidden" @change="onNewMedia" />
        </div>
      </div>

      <!-- ── CARD: Informasi Dasar ── -->
      <div class="bg-white dark:bg-[#181818] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800 space-y-4">
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Icon name="heroicons:document-text" class="w-4 h-4 text-amber-500" />
          Informasi Dasar
        </p>

        <div>
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">Judul</label>
          <input
            v-model="form.title"
            type="text"
            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-brand/50 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition"
            maxlength="200"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">Cerita / Caption</label>
          <textarea
            v-model="form.caption"
            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-brand/50 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition h-28 resize-none"
            maxlength="5000"
          />
        </div>

        <div>
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">Tanggal Kenangan</label>
          <input
            v-model="form.memory_date"
            type="date"
            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-brand/50 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition [color-scheme:dark]"
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
            <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">Kategori</label>
            <select
              v-model="form.category"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-brand/50 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition appearance-none cursor-pointer"
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
              class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-brand/50 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!!form.album_id"
            >
              <option value="public">Publik</option>
              <option value="group">Grup</option>
              <option value="private">Privat</option>
            </select>
            <p v-if="form.album_id" class="text-xs text-gray-400 mt-1 flex items-center gap-1">
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

        <div>
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">
            Grup <span class="text-gray-400 dark:text-neutral-500 text-xs">(opsional)</span>
          </label>
          <select
            v-model="form.group_id"
            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-brand/50 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition appearance-none cursor-pointer disabled:opacity-50"
            :disabled="!!(form.album_id && myAlbums.find(a => a.id === form.album_id)?.group)"
            @change="onGroupChange"
          >
            <option :value="null">— Tanpa grup —</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
          <p
            v-if="form.album_id && myAlbums.find(a => a.id === form.album_id)?.group"
            class="text-xs text-gray-400 mt-1 flex items-center gap-1"
          >
            <Icon name="heroicons:information-circle" class="w-3.5 h-3.5" />
            Mengikuti grup album yang dipilih
          </p>
        </div>

        <div>
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">
            Album <span class="text-gray-400 dark:text-neutral-500 text-xs">(opsional)</span>
          </label>
          <div
            v-if="currentAlbum && !form.album_id"
            class="mb-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2"
          >
            <Icon name="heroicons:book-open" class="w-4 h-4 shrink-0" />
            <span>Saat ini di album <strong>{{ currentAlbum.title }}</strong></span>
          </div>
          <select
            v-model="form.album_id"
            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-brand/50 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm focus:outline-none transition appearance-none cursor-pointer"
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
          <p v-if="form.album_id" class="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <Icon name="heroicons:information-circle" class="w-3.5 h-3.5" />
            Privasi mengikuti album yang dipilih.
          </p>
          <p v-if="!myAlbums.length" class="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <Icon name="heroicons:information-circle" class="w-3.5 h-3.5" />
            Belum ada album.
            <NuxtLink to="/dashboard/albums/create" class="text-amber-500 hover:underline ml-0.5">Buat album baru →</NuxtLink>
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
          <label class="block text-sm text-gray-500 dark:text-neutral-400 mb-1.5">Lokasi</label>
          <div class="relative">
            <Icon name="heroicons:map-pin" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-neutral-500 pointer-events-none" />
            <input
              v-model="form.location_name"
              type="text"
              class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-neutral-800 focus:border-brand/50 dark:focus:border-amber-500 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-neutral-600 focus:outline-none transition"
              placeholder="Contoh: Pantai Kuta, Bali"
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
              :class="form.tag_ids.includes(tag.id)
                ? 'bg-brand border-brand text-white shadow-sm'
                : 'bg-gray-100 dark:bg-[#101010] border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-brand/50 hover:text-amber-500 dark:hover:text-amber-500'"
              @click="toggleTag(tag.id)"
            >
              #{{ tag.name }}
            </button>
          </div>
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
          :to="`/memories/${id}`"
          class="flex-1 flex items-center justify-center px-5 py-3 rounded-xl bg-gray-100 dark:bg-[#101010] hover:bg-gray-200 dark:hover:bg-[#181818] text-gray-700 dark:text-gray-300 font-semibold text-sm transition border border-gray-200 dark:border-neutral-800"
        >
          Batal
        </NuxtLink>
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
    <BaseConfirm />
  </div>
</template>