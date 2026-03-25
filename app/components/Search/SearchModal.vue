<!-- filepath: /media/lenovo/BACKUP/VS Code/Project/kampang-official/app/components/Search/SearchModal.vue -->
<script setup lang="ts">
import type { SearchResults } from '~/types/kenangan'

const inputRef = ref<HTMLInputElement | null>(null)

const focusInput = async () => {
  await nextTick()
  // tunggu render + transition teleport
  requestAnimationFrame(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}


const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const { results, loading, error, search, clear } = useSearch()

const q = ref('')
const type = ref<'' | 'memory' | 'album' | 'group' | 'user'>('')
let timer: ReturnType<typeof setTimeout> | null = null

const close = () => emit('update:modelValue', false)

const memories = computed(() => (results.value as SearchResults | null)?.results?.memories ?? [])
const albums = computed(() => (results.value as SearchResults | null)?.results?.albums ?? [])
const groups = computed(() => (results.value as SearchResults | null)?.results?.groups ?? [])
const users = computed(() => (results.value as SearchResults | null)?.results?.users ?? [])

const hasAnyResult = computed(() =>
  memories.value.length > 0 ||
  albums.value.length > 0 ||
  groups.value.length > 0 ||
  users.value.length > 0
)

const runSearch = () => {
  if (timer) clearTimeout(timer)

  if (q.value.trim().length < 2) {
    clear()
    return
  }

  timer = setTimeout(async () => {
    await search(q.value.trim(), type.value || undefined)
  }, 300)
}

watch([q, type], runSearch)

watch(
  () => props.modelValue,
  async (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      await focusInput()
      return
    }

    q.value = ''
    type.value = ''
    clear()
  }
)

const onEsc = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) close()
}

onMounted(() => window.addEventListener('keydown', onEsc))
onUnmounted(() => {
  window.removeEventListener('keydown', onEsc)
  document.body.style.overflow = ''
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="modelValue"
        class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm p-4 flex items-start justify-center"
        @click.self="close">
        <div
          class="w-full max-w-2xl mt-10 bg-white dark:bg-[#181818] border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
          <!-- Header -->
          <div class="p-4 border-b border-gray-100 dark:border-neutral-800">
            <div class="flex items-center gap-2">
              <Icon name="heroicons:magnifying-glass" class="w-5 h-5 text-gray-400" />
              <input ref="inputRef" v-model="q" type="text" autofocus
                placeholder="Cari kenangan, album, grup, pengguna..."
                class="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400" />
              <button class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="close">
                Esc
              </button>
            </div>

            <div class="flex flex-wrap gap-2 mt-3">
              <button class="px-2.5 py-1 rounded-lg text-xs border transition"
                :class="type === '' ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 dark:border-neutral-700 text-gray-500'"
                @click="type = ''">Semua</button>
              <button class="px-2.5 py-1 rounded-lg text-xs border transition"
                :class="type === 'memory' ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 dark:border-neutral-700 text-gray-500'"
                @click="type = 'memory'">Kenangan</button>
              <button class="px-2.5 py-1 rounded-lg text-xs border transition"
                :class="type === 'album' ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 dark:border-neutral-700 text-gray-500'"
                @click="type = 'album'">Album</button>
              <button class="px-2.5 py-1 rounded-lg text-xs border transition"
                :class="type === 'group' ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 dark:border-neutral-700 text-gray-500'"
                @click="type = 'group'">Grup</button>
              <button class="px-2.5 py-1 rounded-lg text-xs border transition"
                :class="type === 'user' ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 dark:border-neutral-700 text-gray-500'"
                @click="type = 'user'">Pengguna</button>
            </div>
          </div>

          <!-- Body -->
          <div class="max-h-[70vh] overflow-y-auto p-4 space-y-5">
            <div v-if="q.trim().length < 2" class="text-sm text-gray-400">
              Ketik minimal 2 karakter untuk mencari.
            </div>

            <div v-else-if="loading" class="text-sm text-gray-400">
              Mencari...
            </div>

            <div v-else-if="error" class="text-sm text-red-500">
              {{ error }}
            </div>

            <div v-else-if="!hasAnyResult" class="text-sm text-gray-400">
              Tidak ada hasil.
            </div>

            <!-- Memories -->
            <section v-if="(!type || type === 'memory') && memories.length">
              <h3 class="text-xs font-semibold text-gray-400 mb-2">Kenangan</h3>
              <div class="space-y-2">
                <NuxtLink v-for="m in memories" :key="m.id" :to="`/memories/${m.id}`"
                  class="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#101010] transition"
                  @click="close">
                  <img :src="m.media?.[0]?.thumbnail_url ?? m.media?.[0]?.url ?? '/placeholder-video.png'"
                    class="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-[#101010]" />
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ m.title ?? 'Tanpa judul'
                      }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ m.caption ?? m.location?.name ?? '-' }}</p>
                  </div>
                </NuxtLink>
              </div>
            </section>

            <!-- Albums -->
            <section v-if="(!type || type === 'album') && albums.length">
              <h3 class="text-xs font-semibold text-gray-400 mb-2">Album</h3>
              <div class="space-y-2">
                <NuxtLink v-for="a in albums" :key="a.id" :to="`/albums/${a.id}`"
                  class="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#101010] transition"
                  @click="close">
                  <img :src="a.cover_media?.thumbnail_url ?? a.cover_media?.url ?? '/placeholder-video.png'"
                    class="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-[#101010]" />
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ a.title }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ a.description ?? '-' }}</p>
                  </div>
                </NuxtLink>
              </div>
            </section>

            <!-- Groups -->
            <section v-if="(!type || type === 'group') && groups.length">
              <h3 class="text-xs font-semibold text-gray-400 mb-2">Grup</h3>
              <div class="space-y-2">
                <NuxtLink v-for="g in groups" :key="g.id" :to="`/groups/${g.id}`"
                  class="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#101010] transition"
                  @click="close">
                  <img :src="g.cover_image ?? '/placeholder-video.png'"
                    class="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-[#101010]" />
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ g.name }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ g.description ?? '-' }}</p>
                  </div>
                </NuxtLink>
              </div>
            </section>

            <!-- Users -->
            <section v-if="(!type || type === 'user') && users.length">
              <h3 class="text-xs font-semibold text-gray-400 mb-2">Pengguna</h3>
              <div class="space-y-2">
                <NuxtLink v-for="u in users" :key="u.id" :to="`/users/${u.id}`"
                  class="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#101010] transition"
                  @click="close">
                  <img :src="u.avatar ?? `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(u.name)}`"
                    class="w-12 h-12 rounded-full object-cover bg-gray-100 dark:bg-[#101010]" />
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ u.name }}</p>
                    <p class="text-xs text-gray-400 truncate">Member</p>
                  </div>
                </NuxtLink>
              </div>
            </section>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity .15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>