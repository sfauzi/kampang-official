<!-- pages/memories/[id].vue -->
<script setup lang="ts">
definePageMeta({ layout: 'default' })

import type { ReactionType } from '~/types/kenangan'

const route = useRoute()
const id    = route.params.id as string

const {
  memory, comments, loading, error,
  fetchMemory, fetchComments, deleteMemory,
  togglePin, deleteMedia, addMedia,
  postComment, deleteComment,
  toggleReaction,
} = useMemories()
const { createPinFromMemory } = useMapPins()
const { isAuthenticated, user } = useAuth()
const toast = useToast()
const { confirm } = useConfirm()
const router = useRouter()
const { listen } = useMemoryChannel()


onMounted(async () => {
  await fetchMemory(id)
  if (memory.value) await fetchComments(id)

  const unlisten = listen(async (event) => {
    if (event.type === 'updated' && event.memory.id === id) {
      memory.value = event.memory
    } else if (event.type === 'deleted' && event.id === id) {
      toast.info('Kenangan ini telah dihapus.')
      router.push('/memories')
    } else if (event.type === 'pin_toggled' && event.id === id && memory.value) {
      memory.value.is_pinned = event.is_pinned
    } else if (event.type === 'reaction_toggled' && event.memoryId === id && memory.value) {
      memory.value.reactions_count = event.total
      memory.value.my_reaction = event.reacted ? event.reactionType : null
    } else if (event.type === 'media_added' && event.memoryId === id) {
      await fetchMemory(id)
    } else if (event.type === 'media_deleted' && event.memoryId === id) {
      if (memory.value?.media) {
        memory.value.media = memory.value.media.filter(m => m.id !== event.mediaId)
      }
    } else if (event.type === 'comment_added' && event.memoryId === id) {
      if (!event.parentId) {
        comments.value.unshift(event.comment)
      } else {
        const p = comments.value.find(c => c.id === event.parentId)
        if (p) {
          p.replies = p.replies ?? []
          p.replies.push(event.comment)
        }
      }
      if (memory.value) memory.value.comments_count = (memory.value.comments_count ?? 0) + 1
    } else if (event.type === 'comment_deleted' && event.memoryId === id) {
      const rootIdx = comments.value.findIndex(c => c.id === event.commentId)
      if (rootIdx !== -1) {
        comments.value.splice(rootIdx, 1)
      } else {
        comments.value.forEach(c => {
          if (c.replies) c.replies = c.replies.filter(r => r.id !== event.commentId)
        })
      }

      if (memory.value) {
        if (typeof event.total === 'number') {
          memory.value.comments_count = event.total
        } else {
          memory.value.comments_count = Math.max(0, (memory.value.comments_count ?? 0) - (event.removedTotal ?? 1))
        }
      }
    }
  })

  onUnmounted(unlisten)
})

const isOwner     = computed(() => memory.value?.user?.id === user.value?.id)
const activeMedia = ref(0)

const commentText       = ref('')
const replyTo           = ref<{ id: string; name: string } | null>(null)
const submittingComment = ref(false)

const reactionEmoji: Record<ReactionType, string> = {
  love: '❤️', haha: '😂', wow: '😮', sad: '😢', nostalgic: '🥹',
}

const handleDeleteMemory = async () => {
  const ok = await confirm({
    title: 'Hapus kenangan?',
    message: 'Kenangan ini akan dihapus permanen termasuk semua foto/videonya.',
    confirmText: 'Hapus',
    cancelText: 'Batal',
    type: 'danger',
  })
  if (!ok) return
  const success = await deleteMemory(id)
  if (success) {
    toast.success('Kenangan berhasil dihapus.')
    router.push('/memories')
  } else {
    toast.error(error.value ?? 'Gagal menghapus.')
  }
}

const handleTogglePin = async () => {
  await togglePin(id)
  toast.success(memory.value?.is_pinned ? 'Kenangan dipin.' : 'Pin dilepas.')
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
  const ok2 = await deleteMedia(id, mediaId)
  if (ok2) {
    toast.success('Media dihapus.')
    if (activeMedia.value >= (memory.value?.media?.length ?? 1)) activeMedia.value = 0
  } else {
    toast.error(error.value ?? 'Gagal menghapus media.')
  }
}

const handleReaction = async (type: ReactionType) => {
  if (!isAuthenticated.value) {
    toast.info('Login untuk bereaksi.')
    return
  }
  await toggleReaction(id, type)
}

const handleAddToMap = async () => {
  const pin = await createPinFromMemory(id)
  if (pin) toast.success('Kenangan berhasil ditambahkan ke peta!')
  else toast.error('Gagal menambahkan ke peta. Pastikan kenangan memiliki lokasi.')
}

const handleComment = async () => {
  if (!commentText.value.trim()) return
  submittingComment.value = true
  const c = await postComment(id, commentText.value, replyTo.value?.id)
  if (c) {
    commentText.value = ''
    replyTo.value = null
  } else {
    toast.error(error.value ?? 'Gagal mengirim komentar.')
  }
  submittingComment.value = false
}

const handleDeleteComment = async (commentId: string) => {
  const ok = await confirm({
    title: 'Hapus komentar?',
    message: 'Komentar ini akan dihapus.',
    confirmText: 'Hapus',
    cancelText: 'Batal',
    type: 'danger',
  })
  if (!ok) return
  await deleteComment(id, commentId)
}

// Safe accessor untuk location
const locationName = computed(() => memory.value?.location?.name ?? null)

const { open: openLoginModal } = useLoginModal()

// useLoginModal.open() otomatis capture route.fullPath saat itu
function handleProfileClick() {
  if (!isAuthenticated.value) {
    openLoginModal() // tanpa argumen → pakai halaman saat ini
  }
}
const { formatDateLong } = useFormatDate()
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8 font-[Manrope]">

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-96 animate-pulse bg-gray-200 dark:bg-[#101010] rounded-2xl" />
      <div class="h-32 animate-pulse bg-gray-200 dark:bg-[#101010] rounded-2xl" />
    </div>

    <!-- Error / 403 -->
    <div v-else-if="error" class="text-center py-24">
      <div class="text-6xl mb-4">
        {{ error.includes('privat') ? '🔒' : error.includes('tidak ditemukan') ? '🔍' : '😕' }}
      </div>
      <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-2">{{ error }}</h2>
      <p v-if="error.includes('privat') && !isAuthenticated" class="text-sm text-gray-400 mb-6">
        Mungkin kamu perlu login untuk melihat kenangan ini.
      </p>
      <div class="flex justify-center gap-3">
        <NuxtLink
          v-if="!isAuthenticated"
          to="/login"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold text-sm transition-all shadow-md"
        >
          <Icon name="heroicons:arrow-right-end-on-rectangle" class="w-4 h-4" />
          Login
        </NuxtLink>
        <NuxtLink
          to="/memories"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <Icon name="heroicons:arrow-left" class="w-4 h-4" />
          Kembali ke Timeline
        </NuxtLink>
      </div>
    </div>

    <!-- Konten kenangan -->
    <div v-else-if="memory">

      <!-- ── Media viewer ── -->
      <div v-if="memory.media && memory.media.length" class="mb-6">
        <div class="relative rounded-2xl overflow-hidden bg-black shadow-xl" style="aspect-ratio:16/9">
          <img
            v-if="memory.media[activeMedia] && memory.media[activeMedia].type === 'photo'"
            :src="memory.media[activeMedia].url"
            :alt="memory.title ?? 'Kenangan'"
            class="w-full h-full object-contain"
          />
          <video
            v-else-if="memory.media[activeMedia]"
            :src="memory.media[activeMedia].url"
            controls
            class="w-full h-full"
          />
          <button
            v-if="isOwner && memory.media[activeMedia]"
            class="absolute cursor-pointer top-3 right-3 inline-flex items-center gap-1.5 bg-black/60 hover:bg-red-600 text-white rounded-xl px-3 py-1.5 text-xs font-medium transition"
            @click="handleDeleteMedia(memory.media[activeMedia].id)"
          >
            <Icon name="heroicons:trash" class="w-3.5 h-3.5" />
            Hapus
          </button>
        </div>
        <div v-if="memory.media.length > 1" class="flex gap-2 mt-3 overflow-x-auto pb-1">
          <button
            v-for="(m, i) in memory.media"
            :key="m.id"
            class="shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200"
            :class="i === activeMedia
              ? 'border-brand shadow-md scale-105'
              : 'border-transparent opacity-50 hover:opacity-80'"
            @click="activeMedia = i"
          >
            <img :src="m.thumbnail_url ?? m.url" class="w-full h-full object-cover" />
          </button>
        </div>
      </div>

      <!-- ── Meta card ── -->
      <div class="bg-white dark:bg-[#181818] rounded-2xl p-5 mb-5 border border-neutral-200 dark:border-neutral-800">

        <!-- Header user + owner controls -->
        <div class="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div class="flex items-center gap-3">
            <img
              :src="memory.user?.avatar ?? `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(memory.user?.name)}`"
              class="w-11 h-11 rounded-full object-cover ring-2 ring-brand/20"
            />
            <div>
              <NuxtLink
                :to="`/users/${memory.user?.id}`"
                class="font-semibold text-gray-900 dark:text-white hover:text-brand transition-colors"
              >
                {{ memory.user?.name }}
              </NuxtLink>
              <p class="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <Icon name="heroicons:calendar-days" class="w-3 h-3" />
                {{ formatDateLong(memory.memory_date) }}
                <span class="mx-0.5">·</span>
                <span class="capitalize">{{ memory.category }}</span>
                <span
                  v-if="memory.privacy !== 'public'"
                  class="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                >
                  <Icon name="heroicons:lock-closed" class="w-2.5 h-2.5" />
                  {{ memory.privacy === 'group' ? 'Grup' : 'Privat' }}
                </span>
              </p>
            </div>
          </div>

          <!-- Owner actions -->
          <div v-if="isOwner" class="flex flex-wrap gap-2">
            <button
              class="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-[#101010] transition"
              @click="handleTogglePin"
            >
              <Icon name="heroicons:map-pin" class="w-3.5 h-3.5" />
              {{ memory.is_pinned ? 'Unpin' : 'Pin' }}
            </button>
            <button
              class="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-[#101010] transition"
              @click="handleAddToMap"
            >
              <Icon name="heroicons:map" class="w-3.5 h-3.5" />
              Peta
            </button>
            <NuxtLink
              :to="`/dashboard/memories/${id}/edit`"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-[#101010] transition"
            >
              <Icon name="heroicons:pencil-square" class="w-3.5 h-3.5" />
              Edit
            </NuxtLink>
            <button
              class="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-800 text-red-500 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              @click="handleDeleteMemory"
            >
              <Icon name="heroicons:trash" class="w-3.5 h-3.5" />
              Hapus
            </button>
          </div>
        </div>

        <h1 v-if="memory.title" class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {{ memory.title }}
        </h1>
        <p v-if="memory.caption" class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          {{ memory.caption }}
        </p>

        <!-- Location -->
        <p v-if="locationName" class="inline-flex items-center gap-1.5 text-xs text-gray-400 mb-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5">
          <Icon name="heroicons:map-pin" class="w-3.5 h-3.5 text-brand" />
          {{ locationName }}
        </p>

        <!-- Tags -->
        <div v-if="memory.tags && memory.tags.length" class="flex flex-wrap gap-1.5 mb-3">
          <span
            v-for="tag in memory.tags"
            :key="tag.id"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
          >
            #{{ tag.name }}
          </span>
        </div>

        <!-- Tagged users -->
        <div v-if="memory.tagged_users && memory.tagged_users.length" class="flex flex-wrap items-center gap-1.5 mb-4">
          <span class="text-gray-400 text-xs flex items-center gap-1">
            <Icon name="heroicons:user-group" class="w-3.5 h-3.5" />
            Bersama:
          </span>
          <NuxtLink
            v-for="u in memory.tagged_users"
            :key="u.id"
            :to="`/users/${u.id}`"
            class="text-xs text-brand hover:underline font-medium"
          >
            @{{ u.name }}
          </NuxtLink>
        </div>

        <!-- Grup / Album badges -->
        <div class="flex flex-wrap gap-2 mb-4">
          <NuxtLink
            v-if="memory.group"
            :to="`/groups/${memory.group.id}`"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:opacity-80 transition"
          >
            <Icon name="heroicons:user-group" class="w-3.5 h-3.5" />
            {{ memory.group.name }}
          </NuxtLink>
          <NuxtLink
            v-if="memory.album"
            :to="`/albums/${memory.album.id}`"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:opacity-80 transition"
          >
            <Icon name="heroicons:book-open" class="w-3.5 h-3.5" />
            {{ memory.album.title }}
          </NuxtLink>
        </div>

        <!-- Reactions -->
        <div class="flex items-center gap-1 pt-4 border-t border-gray-100 dark:border-neutral-800 flex-wrap">
          <button
            v-for="(emoji, type) in reactionEmoji"
            :key="type"
            class="text-xl transition-all cursor-pointer duration-200 px-2 py-1 rounded-xl hover:scale-125 hover:bg-amber-100 dark:hover:bg-amber-900/20"
            :class="memory.my_reaction === type
              ? 'ring-2 ring-brand bg-brand/10 scale-110'
              : 'opacity-50 hover:opacity-90'"
            :title="isAuthenticated ? String(type) : 'Login untuk bereaksi'"
            @click="handleReaction(type as ReactionType)"
          >
            {{ emoji }}
          </button>
          <span class="text-sm text-neutral-500 ml-2">{{ memory.reactions_count ?? 0 }} reaksi</span>
        </div>
      </div>

      <!-- ── Komentar ── -->
      <div class="bg-white dark:bg-[#181818] rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
        <h2 class="font-bold text-gray-900 dark:text-white mb-5 text-lg flex items-center gap-2">
          <Icon name="heroicons:chat-bubble-left-right" class="w-5 h-5 text-brand" />
          Komentar
          <span class="text-sm font-normal text-gray-400">({{ memory.comments_count ?? 0 }})</span>
        </h2>

        <!-- Form komentar -->
        <div v-if="isAuthenticated" class="mb-6">
          <div
            v-if="replyTo"
            class="flex items-center gap-2 text-xs text-gray-400 mb-2 bg-gray-50 dark:bg-[#101010] rounded-xl px-3 py-2"
          >
            <Icon name="heroicons:arrow-uturn-right" class="w-3.5 h-3.5 shrink-0" />
            Membalas <span class="text-brand font-semibold ml-1">@{{ replyTo.name }}</span>
            <button class="ml-auto text-red-400 hover:text-red-600 transition" @click="replyTo = null">
              <Icon name="heroicons:x-mark" class="w-4 h-4" />
            </button>
          </div>
          <div class="flex gap-3">
            <img
              :src="user?.avatar_url ?? `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(user?.name)}`"
              class="w-9 h-9 rounded-full shrink-0 mt-1 ring-2 ring-brand/20"
            />
            <div class="flex-1 flex gap-2">
              <textarea
                v-model="commentText"
                class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#101010] text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-brand transition resize-none"
                :placeholder="replyTo ? 'Tulis balasan...' : 'Tulis komentar...'"
                rows="2"
                @keydown.ctrl.enter.prevent="handleComment"
              />
              <button
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-all shadow-sm hover:shadow-md self-end disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="submittingComment || !commentText.trim()"
                @click="handleComment"
              >
                <Icon v-if="submittingComment" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
                <Icon v-else name="heroicons:paper-airplane" class="w-4 h-4" />
                Kirim
              </button>
            </div>
          </div>
          <p class="text-xs text-neutral-500 mt-1 pl-12">Ctrl+Enter untuk kirim</p>
        </div>

        <!-- CTA login -->
        <div v-else class="bg-gray-50 dark:bg-[#101010] rounded-2xl p-5 mb-5 text-center">
          <Icon name="heroicons:chat-bubble-left-ellipsis" class="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p class="text-sm text-neutral-500 mb-3">Login untuk berkomentar</p>
          <button
            @click="handleProfileClick"
            class="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition shadow-sm"
          >
            <Icon name="heroicons:arrow-right-end-on-rectangle" class="w-4 h-4" />
            Login
          </button>
        </div>

        <!-- Empty comments -->
        <div v-if="!comments || !comments.length" class="text-center py-10 text-sm">
          <Icon name="heroicons:chat-bubble-left-ellipsis" class="w-10 h-10 mx-auto mb-2 opacity-30 text-gray-100" />
          Belum ada komentar. Jadilah yang pertama! 💬
        </div>

        <!-- Comment list -->
        <ul v-else class="space-y-5">
          <li v-for="c in comments" :key="c.id">
            <div class="flex gap-3">
              <img
                :src="c.user?.avatar ?? `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(c.user?.name)}`"
                class="w-9 h-9 rounded-full shrink-0 mt-0.5"
              />
              <div class="flex-1 min-w-0">
                <div class="bg-gray-50 dark:bg-[#101010] rounded-2xl rounded-tl-md px-4 py-3">
                  <p class="text-xs font-semibold text-gray-900 dark:text-white mb-1">{{ c.user?.name }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-300 break-words">{{ c.body }}</p>
                </div>
                <div class="flex gap-4 mt-1.5 text-xs text-neutral-500 pl-1">
                  <span class="flex items-center gap-1">
                    <Icon name="heroicons:clock" class="w-3 h-3" />
                    {{ c.created_at }}
                  </span>
                  <button
                    v-if="isAuthenticated"
                    class="hover:text-brand cursor-pointer hover:text-neutral-600 font-medium transition-colors flex items-center gap-1 text-neutral-500"
                    @click="replyTo = { id: c.id, name: c.user?.name ?? '' }"
                  >
                    <Icon name="heroicons:arrow-uturn-right" class="w-3 h-3" />
                    Balas
                  </button>
                  <button
                    v-if="c.is_mine || isOwner"
                    class="hover:text-red-500 cursor-pointer transition-colors flex items-center gap-1"
                    @click="handleDeleteComment(c.id)"
                  >
                    <Icon name="heroicons:trash" class="w-3 h-3" />
                    Hapus
                  </button>
                </div>

                <!-- Replies -->
                <ul v-if="c.replies && c.replies.length" class="mt-3 space-y-3 ml-4 pl-4 border-l-2 border-gray-100 dark:border-gray-700">
                  <li v-for="r in c.replies" :key="r.id" class="flex gap-2">
                    <img
                      :src="r.user?.avatar ?? `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(r.user?.name)}`"
                      class="w-8 h-8 rounded-full shrink-0 mt-0.5"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="bg-gray-50 dark:bg-[#101010] rounded-2xl rounded-tl-md px-3.5 py-2.5">
                        <p class="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">{{ r.user?.name }}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-300 break-words">{{ r.body }}</p>
                      </div>
                      <div class="flex gap-4 mt-1 text-xs text-neutral-500 pl-1">
                        <span class="flex items-center gap-1">
                          <Icon name="heroicons:clock" class="w-3 h-3" />
                          {{ r.created_at }}
                        </span>
                        <button
                          v-if="r.is_mine || isOwner"
                          class="hover:text-red-500 cursor-pointer transition-colors flex items-center gap-1"
                          @click="handleDeleteComment(r.id)"
                        >
                          <Icon name="heroicons:trash" class="w-3 h-3" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <BaseToast />
    <BaseConfirm />
  </div>
</template>