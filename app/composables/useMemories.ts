// composables/useMemories.ts
// Lokasi : composables/useMemories.ts
// Fungsi : Semua operasi CRUD kenangan, komentar, dan reaksi.
//
// Penting:
//  - fetchMemories()       → timeline publik (guest OK, token opsional)
//  - fetchMyMemories()     → kenangan milik user login (butuh token)
//  - fetchMemory(id)       → detail (guest OK untuk public, token untuk private)
//  - Privacy enforcement   → backend yang authoritative; frontend ikut menyesuaikan UI

import type {
  Memory,
  StoreMemoryPayload,
  Comment,
  ReactionSummary,
  ReactionType,
  PaginatedResponse,
} from '~/types/kenangan'
import { useApi } from '~/utils/api'
import { useMemoryChannel } from '~/composables/useMemoryChannel'

export const useMemories = () => {
  const { api } = useApi()
  const { broadcast } = useMemoryChannel()

  const memories   = ref<Memory[]>([])
  const myMemories = ref<Memory[]>([])   // khusus dashboard
  const memory     = ref<Memory | null>(null)
  const comments   = ref<Comment[]>([])
  const reactions  = ref<ReactionSummary | null>(null)
  const pagination = ref<PaginatedResponse<Memory>['meta'] | null>(null)
  const myPagination = ref<PaginatedResponse<Memory>['meta'] | null>(null)
  const loading    = ref(false)
  const error      = ref<string | null>(null)

  // ─── Timeline publik (/memories) ──────────────────────────────────────────
  // Endpoint ini mengembalikan kenangan public + kenangan grup user login.
  // Tanpa token → hanya yang privacy=public.
  // Dengan token → public + grup yang diikuti.
  const fetchMemories = async (params: {
    category?: string
    group_id?: string
    user_id?: string
    album_id?: string
    from?: string
    to?: string
    sort?: 'memory_date' | 'created_at'
    page?: number
    per_page?: number
  } = {}) => {
    loading.value = true
    error.value   = null
    try {
      const res = await api<PaginatedResponse<Memory>>('/api/memories', { query: params })
      memories.value   = res.data
      pagination.value = res.meta
      hydrateReactionList(memories.value as any[])
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memuat kenangan.'
    } finally {
      loading.value = false
    }
  }

  // ─── Kenangan milik user login (/dashboard/memories) ──────────────────────
  // Gunakan filter user_id=me dari endpoint yang sama.
  // Menampilkan SEMUA privacy milik sendiri (public, group, private).
  const fetchMyMemories = async (params: {
    category?: string
    sort?: 'memory_date' | 'created_at'
    page?: number
    per_page?: number
  } = {}) => {
    loading.value = true
    error.value   = null
    try {
      // Backend sudah meng-handle: jika user_id = auth user → tampilkan semua privasi
      const res = await api<PaginatedResponse<Memory>>('/api/memories', {
        query: { ...params, own: true }, // flag khusus → backend filter user_id = auth
      })
      myMemories.value   = res.data
      myPagination.value = res.meta
      hydrateReactionList(myMemories.value as any[])
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memuat kenangan.'
    } finally {
      loading.value = false
    }
  }

  // ─── Detail satu kenangan ─────────────────────────────────────────────────
  // Guest bisa akses public; backend akan 403 jika private/group tanpa token.
  const fetchMemory = async (id: string) => {
    loading.value = true
    error.value   = null
    try {
      memory.value = await api<Memory>(`/api/memories/${id}`)
      if (memory.value) hydrateReaction(memory.value as any)
    } catch (e: any) {
      // 403 → private / bukan anggota grup
      if (e?.status === 403) {
        error.value = 'Kenangan ini bersifat privat.'
      } else if (e?.status === 404) {
        error.value = 'Kenangan tidak ditemukan.'
      } else {
        error.value = e?.data?.message ?? 'Gagal memuat kenangan.'
      }
    } finally {
      loading.value = false
    }
  }

  // ─── Create ───────────────────────────────────────────────────────────────
  const createMemory = async (payload: StoreMemoryPayload): Promise<Memory | null> => {
    loading.value = true
    error.value   = null
    try {
      const formData = new FormData()
      formData.append('memory_date', payload.memory_date)
      formData.append('category',    payload.category)
      formData.append('privacy',     payload.privacy)
      if (payload.title)             formData.append('title',         payload.title)
      if (payload.caption)           formData.append('caption',       payload.caption)
      if (payload.group_id)          formData.append('group_id',      payload.group_id)
      if (payload.album_id)          formData.append('album_id',      payload.album_id)
      if (payload.location_name)     formData.append('location_name', payload.location_name)
      if (payload.latitude  != null) formData.append('latitude',  String(payload.latitude))
      if (payload.longitude != null) formData.append('longitude', String(payload.longitude))
      payload.tag_ids?.forEach(id => formData.append('tag_ids[]', id))
      payload.tagged_user_ids?.forEach(id => formData.append('tagged_user_ids[]', id))
      payload.media?.forEach(f => formData.append('media[]', f))

      const res = await api<{ message: string; memory: Memory }>('/api/memories', {
        method: 'POST',
        body: formData,
      })
      // Tambahkan ke list milik sendiri juga
      myMemories.value.unshift(res.memory)
      broadcast({ type: 'created', memory: res.memory })
      return res.memory
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal membuat kenangan.'
      return null
    } finally {
      loading.value = false
    }
  }

  // ─── Update ───────────────────────────────────────────────────────────────
  const updateMemory = async (
    id: string,
    payload: Partial<Omit<StoreMemoryPayload, 'media'>> & { is_pinned?: boolean }
  ): Promise<Memory | null> => {
    loading.value = true
    error.value   = null
    try {
      const res = await api<{ message: string; memory: Memory }>(`/api/memories/${id}`, {
        method: 'PUT',
        body: payload,
      })
      if (memory.value?.id === id) memory.value = res.memory
      const idx = myMemories.value.findIndex(m => m.id === id)
      if (idx !== -1) myMemories.value[idx] = res.memory
      broadcast({ type: 'updated', memory: res.memory })
      return res.memory
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memperbarui kenangan.'
      return null
    } finally {
      loading.value = false
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  const deleteMemory = async (id: string): Promise<boolean> => {
    loading.value = true
    error.value   = null
    try {
      await api(`/api/memories/${id}`, { method: 'DELETE' })
      myMemories.value = myMemories.value.filter(m => m.id !== id)
      memories.value   = memories.value.filter(m => m.id !== id)
      broadcast({ type: 'deleted', id })
      return true
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal menghapus kenangan.'
      return false
    } finally {
      loading.value = false
    }
  }

  // ─── Pin toggle ───────────────────────────────────────────────────────────
  const togglePin = async (id: string): Promise<boolean> => {
    try {
      await api<{ message: string }>(`/api/memories/${id}/pin`, { method: 'POST' })

      let nextPinned: boolean | null = null
      const flip = (list: Memory[]) => {
        const m = list.find(m => m.id === id)
        if (m) {
          m.is_pinned = !m.is_pinned
          nextPinned = m.is_pinned
        }
      }

      flip(memories.value)
      flip(myMemories.value)
      if (memory.value?.id === id) {
        memory.value.is_pinned = !memory.value.is_pinned
        nextPinned = memory.value.is_pinned
      }

      broadcast({ type: 'pin_toggled', id, is_pinned: Boolean(nextPinned) })
      return true
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal toggle pin.'
      return false
    }
  }

  // ─── Media ────────────────────────────────────────────────────────────────
  const addMedia = async (memoryId: string, files: File[]): Promise<boolean> => {
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('media[]', f))
      await api(`/api/memories/${memoryId}/media`, { method: 'POST', body: formData })
      await fetchMemory(memoryId)
      broadcast({ type: 'media_added', memoryId })
      return true
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal menambah media.'
      return false
    }
  }

  const deleteMedia = async (memoryId: string, mediaId: string): Promise<boolean> => {
    try {
      await api(`/api/memories/${memoryId}/media/${mediaId}`, { method: 'DELETE' })
      if (memory.value?.media) {
        memory.value.media = memory.value.media.filter(m => m.id !== mediaId)
      }
      broadcast({ type: 'media_deleted', memoryId, mediaId })
      return true
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal menghapus media.'
      return false
    }
  }

  // ─── Comments ─────────────────────────────────────────────────────────────
  const fetchComments = async (memoryId: string, page = 1) => {
    try {
      const res = await api<PaginatedResponse<Comment>>(
        `/api/memories/${memoryId}/comments`,
        { query: { page } }
      )
      comments.value = res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memuat komentar.'
    }
  }

  const postComment = async (
    memoryId: string,
    body: string,
    parentId?: string
  ): Promise<Comment | null> => {
    try {
      const res = await api<{ message: string; comment: Comment }>(
        `/api/memories/${memoryId}/comments`,
        { method: 'POST', body: { body, ...(parentId ? { parent_id: parentId } : {}) } }
      )

      if (!parentId) {
        comments.value.unshift(res.comment)
      } else {
        const parent = comments.value.find(c => c.id === parentId)
        if (parent) {
          parent.replies = parent.replies ?? []
          parent.replies.push(res.comment)
        }
      }

      const incCount = (list: Memory[]) => {
        const m = list.find(x => x.id === memoryId)
        if (m) m.comments_count = (m.comments_count ?? 0) + 1
      }
      incCount(memories.value)
      incCount(myMemories.value)
      if (memory.value?.id === memoryId) {
        memory.value.comments_count = (memory.value.comments_count ?? 0) + 1
      }

      broadcast({ type: 'comment_added', memoryId, comment: res.comment, parentId })
      return res.comment
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal mengirim komentar.'
      return null
    }
  }

  const deleteComment = async (memoryId: string, commentId: string): Promise<boolean> => {
    try {
      await api(`/api/memories/${memoryId}/comments/${commentId}`, { method: 'DELETE' })

      // tetap update list komentar lokal (UI cepat)
      let removedTotal = 1
      const rootIdx = comments.value.findIndex(c => c.id === commentId)
      if (rootIdx !== -1) {
        const root = comments.value[rootIdx]
        removedTotal = 1 + (root?.replies?.length ?? 0)
        comments.value.splice(rootIdx, 1)
      } else {
        for (const c of comments.value) {
          if (!c.replies?.length) continue
          const replyIdx = c.replies.findIndex(r => r.id === commentId)
          if (replyIdx !== -1) {
            c.replies.splice(replyIdx, 1)
            removedTotal = 1
            break
          }
        }
      }

      // sumber kebenaran: backend
      let totalFromServer: number | null = null
      try {
        const fresh = await api<{ data: Memory }>(`/api/memories/${memoryId}`)
        totalFromServer = fresh?.data?.comments_count ?? null
      } catch {
        totalFromServer = null
      }

      if (typeof totalFromServer === 'number') {
        const setCount = (list: Memory[]) => {
          const m = list.find(x => x.id === memoryId)
          if (m) m.comments_count = totalFromServer!
        }
        setCount(memories.value)
        setCount(myMemories.value)
        if (memory.value?.id === memoryId) memory.value.comments_count = totalFromServer
      } else {
        // fallback lama jika fetch fresh gagal
        const decCount = (list: Memory[]) => {
          const m = list.find(x => x.id === memoryId)
          if (m) m.comments_count = Math.max(0, (m.comments_count ?? 0) - removedTotal)
        }
        decCount(memories.value)
        decCount(myMemories.value)
        if (memory.value?.id === memoryId) {
          memory.value.comments_count = Math.max(0, (memory.value.comments_count ?? 0) - removedTotal)
        }
      }

      broadcast({
        type: 'comment_deleted',
        memoryId,
        commentId,
        removedTotal,
        total: totalFromServer ?? undefined,
      })

      return true
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal menghapus komentar.'
      return false
    }
  }

  // ─── Reactions ────────────────────────────────────────────────────────────
  const fetchReactions = async (memoryId: string) => {
    try {
      reactions.value = await api<ReactionSummary>(`/api/memories/${memoryId}/reactions`)
    } catch {}
  }

  const toggleReaction = async (memoryId: string, type: ReactionType) => {
    try {
      const res = await api<{
        message: string
        reacted: boolean
        type: ReactionType | null
        total: number
      }>(`/api/memories/${memoryId}/reactions`, {
        method: 'POST',
        body: { type },
      })
      const nextType = res.reacted ? (res.type ?? null) : null
      setCachedReaction(memoryId, nextType)
      const update = (list: Memory[]) => {
        const m = list.find(m => m.id === memoryId)
        if (m) {
          m.my_reaction     = res.reacted ? res.type : null
          m.reactions_count = res.total
        }
      }
      update(memories.value)
      update(myMemories.value)
      if (memory.value?.id === memoryId) {
        memory.value.my_reaction     = res.reacted ? res.type : null
        memory.value.reactions_count = res.total
      }

      broadcast({
        type: 'reaction_toggled',
        memoryId,
        reacted: res.reacted,
        reactionType: res.type,
        total: res.total,
      })

      return res
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal toggle reaksi.'
      return null
    }
  }

  const REACTION_CACHE_KEY = 'kenangan:reaction-cache:v1'
  type ReactionCache = Record<string, ReactionType | null>
  const reactionCache = ref<ReactionCache>({})

  const loadReactionCache = () => {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(REACTION_CACHE_KEY)
      reactionCache.value = raw ? JSON.parse(raw) : {}
    } catch {
      reactionCache.value = {}
    }
  }

  const saveReactionCache = () => {
    if (!import.meta.client) return
    localStorage.setItem(REACTION_CACHE_KEY, JSON.stringify(reactionCache.value))
  }

  const normalizeReactionType = (value: any): ReactionType | null => {
    const v = typeof value === 'string'
      ? value.toLowerCase()
      : typeof value === 'object' && value
        ? String(value.type ?? value.reaction_type ?? value.name ?? '').toLowerCase()
        : ''
    return (['love', 'haha', 'wow', 'sad', 'nostalgic'] as const).includes(v as ReactionType)
      ? (v as ReactionType)
      : null
  }

  const setCachedReaction = (memoryId: string, reaction: ReactionType | null) => {
    reactionCache.value[memoryId] = reaction
    saveReactionCache()
  }

  const getCachedReaction = (memoryId: string): ReactionType | null => {
    return reactionCache.value[memoryId] ?? null
  }

  const hydrateReaction = (m: any) => {
    if (!m?.id) return
    const fromApi =
      normalizeReactionType(m.my_reaction) ??
      normalizeReactionType(m.reaction_type) ??
      normalizeReactionType(m.my_reaction_type) ??
      normalizeReactionType(m.user_reaction)

    m.my_reaction = fromApi ?? getCachedReaction(m.id) ?? null
  }

  const hydrateReactionList = (list: any[]) => list.forEach(hydrateReaction)

  if (import.meta.client) loadReactionCache()

  return {
    memories, myMemories, memory,
    comments, reactions,
    pagination, myPagination,
    loading, error,
    fetchMemories, fetchMyMemories, fetchMemory,
    createMemory, updateMemory, deleteMemory,
    togglePin, addMedia, deleteMedia,
    fetchComments, postComment, deleteComment,
    fetchReactions, toggleReaction,
  }
}