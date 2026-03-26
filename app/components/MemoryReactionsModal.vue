<script setup lang="ts">
import type { ReactionType, ReactionSummary } from '~/types/kenangan'

const props = defineProps<{
  modelValue: boolean
  memoryId: string | null
  title?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { api } = useApi()
const config = useRuntimeConfig()
const apiOrigin = (config.public.apiBase as string).replace(/\/api\/?$/, '')

const loading = ref(false)
const fetchError = ref<string | null>(null)
const data = ref<ReactionSummary | null>(null)
const userMap = ref<Record<string, { name: string; avatar: string | null }>>({})

const reactionMeta: Record<ReactionType, { emoji: string; label: string }> = {
  love: { emoji: '❤️', label: 'Love' },
  haha: { emoji: '😂', label: 'Haha' },
  wow: { emoji: '😮', label: 'Wow' },
  sad: { emoji: '😢', label: 'Sad' },
  nostalgic: { emoji: '🥹', label: 'Nostalgic' },
}

const reactionOrder: ReactionType[] = ['love', 'haha', 'wow', 'sad', 'nostalgic']

const resolveAvatarUrl = (avatar: string | null | undefined, name: string): string => {
  const fallback = `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(name)}`
  if (!avatar) return fallback

  const raw = String(avatar).trim()
  if (!raw) return fallback

  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw
  }

  if (raw.startsWith('/storage/')) return `${apiOrigin}${raw}`
  if (raw.startsWith('storage/')) return `${apiOrigin}/${raw}`
  if (raw.startsWith('avatars/')) return `${apiOrigin}/storage/${raw}`

  if (raw.startsWith('/')) return `${apiOrigin}${raw}`
  return `${apiOrigin}/storage/${raw}`
}

const normalizeReactionType = (value: unknown): ReactionType | null => {
  const v = String(value ?? '').toLowerCase()
  return (['love', 'haha', 'wow', 'sad', 'nostalgic'] as const).includes(v as ReactionType)
    ? (v as ReactionType)
    : null
}

const rows = computed(() => {
  const summary = data.value?.summary ?? {}

  return reactionOrder
    .map((type) => ({
      type,
      emoji: reactionMeta[type].emoji,
      label: reactionMeta[type].label,
      count: Number(summary[type] ?? 0),
    }))
    .filter((item) => item.count > 0)
})

const reactionUsers = computed(() => {
  const payload = (data.value ?? {}) as any
  const candidates = [
    ...(Array.isArray(payload.reactions) ? payload.reactions : []),
    ...(Array.isArray(payload.reactors) ? payload.reactors : []),
    ...(Array.isArray(payload.data) ? payload.data : []),
  ]

  return candidates
    .map((item: any, index: number) => {
      const type = normalizeReactionType(item?.type ?? item?.reaction_type)
      if (!type) return null

      const rawUserId = item?.user_id ?? item?.userId ?? item?.user?.id ?? null
      const userId = rawUserId != null ? String(rawUserId) : null
      const userFromMap = userId ? userMap.value[userId] : null

      const name =
        item?.user?.name
        ?? item?.user_name
        ?? item?.name
        ?? userFromMap?.name
        ?? (userId ? `User #${userId}` : 'User')

      const avatar =
        item?.user?.avatar
        ?? item?.avatar
        ?? item?.avatar_url
        ?? userFromMap?.avatar
        ?? null

      return {
        key: item?.id ?? `${userId ?? 'unknown'}-${type}-${index}`,
        userId,
        name,
        avatar,
        type,
        emoji: reactionMeta[type]?.emoji ?? '🙂',
      }
    })
    .filter(Boolean) as Array<{
      key: string
      userId: string | null
      name: string
      avatar: string | null
      type: ReactionType
      emoji: string
    }>
})

const hydrateUsersFromIds = async () => {
  const ids = Array.from(
    new Set(
      reactionUsers.value
        .map(item => item.userId)
        .filter((id): id is string => id !== null && id !== '')
        .filter(id => !userMap.value[id])
    )
  )

  if (!ids.length) return

  await Promise.all(
    ids.map(async (id) => {
      try {
        const u = await api<any>(`/api/users/${id}`)
        userMap.value[id] = {
          name: u?.name ?? `User #${id}`,
          avatar: u?.avatar_url ?? u?.avatar ?? null,
        }
      } catch {
        userMap.value[id] = {
          name: `User #${id}`,
          avatar: null,
        }
      }
    })
  )
}

const total = computed(() => Number(data.value?.total ?? 0))

const close = () => emit('update:modelValue', false)

const load = async () => {
  if (!props.memoryId) return

  loading.value = true
  fetchError.value = null
  userMap.value = {}

  try {
    data.value = await api<ReactionSummary>(`/api/memories/${props.memoryId}/reactions`)
    await hydrateUsersFromIds()
  } catch (e: any) {
    fetchError.value = e?.data?.message ?? 'Gagal memuat daftar reaksi.'
  } finally {
    loading.value = false
  }
}

const onEsc = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.modelValue) close()
}

watch(
  () => [props.modelValue, props.memoryId] as const,
  async ([open, memoryId]) => {
    document.body.style.overflow = open ? 'hidden' : ''

    if (open && memoryId) {
      await load()
    }
  }
)

onMounted(() => window.addEventListener('keydown', onEsc))
onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onEsc)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close" />

        <Transition
          enter-active-class="transition-all duration-250 ease-out"
          enter-from-class="opacity-0 translate-y-4 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 translate-y-4 scale-95"
        >
          <div
            v-if="modelValue"
            class="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-neutral-800 shadow-xl p-5 font-[Manrope]"
          >
            <button
              class="absolute cursor-pointer top-4 right-4 w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition flex items-center justify-center"
              @click="close"
            >
              <Icon name="heroicons:x-mark" class="w-4 h-4" />
            </button>

            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Daftar Reaksi</h3>
            <p class="text-xs text-gray-400 mt-1 pr-8">
              {{ title ? `Kenangan: ${title}` : 'Ringkasan reaksi kenangan' }}
            </p>

            <div class="mt-4">
              <div
                v-if="loading"
                class="rounded-xl border border-gray-200 dark:border-neutral-800 p-4 text-sm text-gray-400"
              >
                Memuat reaksi...
              </div>

              <div
                v-else-if="fetchError"
                class="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-500"
              >
                {{ fetchError }}
              </div>

              <div
                v-else-if="!rows.length"
                class="rounded-xl border border-gray-200 dark:border-neutral-800 p-4 text-sm text-gray-400"
              >
                Belum ada reaksi.
              </div>

              <ul v-else class="space-y-2">
                <li
                  v-for="item in rows"
                  :key="item.type"
                  class="flex items-center justify-between rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#101010] px-3 py-2"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-lg">{{ item.emoji }}</span>
                    <span class="text-sm text-gray-700 dark:text-gray-200">{{ item.label }}</span>
                  </div>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.count }}</span>
                </li>
              </ul>

              <div v-if="!loading && !fetchError" class="mt-4">
                <h4 class="text-xs font-semibold text-gray-400 mb-2">Siapa yang bereaksi</h4>

                <div
                  v-if="!reactionUsers.length"
                  class="rounded-xl border border-gray-200 dark:border-neutral-800 p-3 text-xs text-gray-400"
                >
                  Daftar user reaksi belum tersedia dari API.
                </div>

                <ul v-else class="space-y-2 max-h-56 overflow-y-auto pr-1">
                  <li
                    v-for="item in reactionUsers"
                    :key="item.key"
                    class="flex items-center justify-between rounded-xl border border-gray-200 dark:border-neutral-800 px-3 py-2"
                  >
                    <NuxtLink
                      v-if="item.userId"
                      :to="`/users/${item.userId}`"
                      class="flex items-center gap-2 min-w-0 hover:opacity-80 transition"
                      @click="close"
                    >
                      <img
                        :src="resolveAvatarUrl(item.avatar, item.name)"
                        :alt="item.name"
                        class="w-7 h-7 rounded-full object-cover"
                      >
                      <span class="text-sm text-gray-700 dark:text-gray-200 truncate">{{ item.name }}</span>
                    </NuxtLink>

                    <div v-else class="flex items-center gap-2 min-w-0">
                      <img
                        :src="resolveAvatarUrl(item.avatar, item.name)"
                        :alt="item.name"
                        class="w-7 h-7 rounded-full object-cover"
                      >
                      <span class="text-sm text-gray-700 dark:text-gray-200 truncate">{{ item.name }}</span>
                    </div>

                    <span class="text-base" :title="item.type">{{ item.emoji }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
              <span class="text-sm text-gray-500">Total reaksi</span>
              <span class="text-sm font-bold text-gray-900 dark:text-white">{{ total }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
