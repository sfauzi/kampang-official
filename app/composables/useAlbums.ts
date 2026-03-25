// composables/useAlbums.ts
// Lokasi  : composables/useAlbums.ts
// Fix:
// - fetchMyAlbums: tampilkan pending + accepted (sebagai kontributor)
// - updateAlbum: kirim add_contributor_ids dan remove_contributor_ids sekaligus
// - inviteContributors/removeContributor: tetap ada untuk call langsung

import type {
  Album,
  StoreAlbumPayload,
  PaginatedResponse,
} from '~/types/kenangan'
import { useApi } from '~/utils/api'

export const useAlbums = () => {
  const { api } = useApi()

  const albums       = ref<Album[]>([])
  const myAlbums     = ref<Album[]>([])
  const album        = ref<Album | null>(null)
  const pagination   = ref<PaginatedResponse<Album>['meta'] | null>(null)
  const myPagination = ref<PaginatedResponse<Album>['meta'] | null>(null)
  const loading      = ref(false)
  const error        = ref<string | null>(null)

  // ─── List publik (/albums) ────────────────────────────────────────────────
  const fetchAlbums = async (params: {
    category?: string
    group_id?: string
    is_collaborative?: boolean
    page?: number
    per_page?: number
  } = {}) => {
    loading.value = true
    error.value   = null
    try {
      const res = await api<PaginatedResponse<Album>>('/api/albums', { query: params })
      albums.value    = res.data
      pagination.value = res.meta
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memuat album.'
    } finally {
      loading.value = false
    }
  }

  // ─── Album milik + kolaboratif (dashboard) ────────────────────────────────
  // own=true → backend tampilkan created_by=user ATAU contributor pending/accepted
  const fetchMyAlbums = async (params: {
    category?: string
    is_collaborative?: boolean
    page?: number
    per_page?: number
  } = {}) => {
    loading.value = true
    error.value   = null
    try {
      const res = await api<PaginatedResponse<Album>>('/api/albums', {
        query: { ...params, own: true },
      })
      myAlbums.value    = res.data
      myPagination.value = res.meta
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memuat albummu.'
    } finally {
      loading.value = false
    }
  }

  // ─── Detail ───────────────────────────────────────────────────────────────
  const fetchAlbum = async (id: string) => {
    loading.value = true
    error.value   = null
    try {
      album.value = await api<Album>(`/api/albums/${id}`)
    } catch (e: any) {
      if (e?.status === 403)      error.value = 'Album ini bersifat privat.'
      else if (e?.status === 404) error.value = 'Album tidak ditemukan.'
      else                        error.value = e?.data?.message ?? 'Gagal memuat album.'
    } finally {
      loading.value = false
    }
  }

  // ─── Create ───────────────────────────────────────────────────────────────
  const createAlbum = async (payload: StoreAlbumPayload): Promise<Album | null> => {
    loading.value = true
    error.value   = null
    try {
      const res = await api<{ message: string; album: Album }>('/api/albums', {
        method: 'POST',
        body: payload,
      })
      myAlbums.value.unshift(res.album)
      return res.album
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal membuat album.'
      return null
    } finally {
      loading.value = false
    }
  }

  // ─── Update ───────────────────────────────────────────────────────────────
  // Kirim sekaligus: field album + add_contributor_ids + remove_contributor_ids
  const updateAlbum = async (
    id: string,
    payload: Partial<StoreAlbumPayload> & {
      cover_media_id?: string | null
      is_collaborative?: boolean
      add_contributor_ids?: string[]      // undang batch
      remove_contributor_ids?: string[]   // hapus batch
    }
  ): Promise<Album | null> => {
    loading.value = true
    error.value   = null
    try {
      const res = await api<{ message: string; album: Album }>(`/api/albums/${id}`, {
        method: 'PUT',
        body: payload,
      })
      if (album.value?.id === id) album.value = res.album
      const idx = myAlbums.value.findIndex(a => a.id === id)
      if (idx !== -1) myAlbums.value[idx] = res.album
      return res.album
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memperbarui album.'
      return null
    } finally {
      loading.value = false
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  const deleteAlbum = async (id: string): Promise<boolean> => {
    loading.value = true
    error.value   = null
    try {
      await api(`/api/albums/${id}`, { method: 'DELETE' })
      myAlbums.value = myAlbums.value.filter(a => a.id !== id)
      albums.value   = albums.value.filter(a => a.id !== id)
      return true
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal menghapus album.'
      return false
    } finally {
      loading.value = false
    }
  }

  // ─── Contributors (endpoint terpisah — untuk halaman detail album) ─────────
  // Untuk form edit, gunakan updateAlbum dengan add/remove_contributor_ids

  const inviteContributors = async (albumId: string, userIds: string[]): Promise<boolean> => {
    try {
      await api(`/api/albums/${albumId}/contributors`, {
        method: 'POST',
        body: { user_ids: userIds },
      })
      return true
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal mengundang kontributor.'
      return false
    }
  }

  const respondInvitation = async (
    albumId: string,
    status: 'accepted' | 'declined'
  ): Promise<boolean> => {
    try {
      await api(`/api/albums/${albumId}/contributors/respond`, {
        method: 'PATCH',
        body: { status },
      })
      return true
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal merespons undangan.'
      return false
    }
  }

  // Set cover album dari media yang sudah ada di dalam album
  const setCover = async (albumId: string, coverMediaId: string): Promise<boolean> => {
    try {
      const res = await api<{ message: string; cover_media: any }>(
        `/api/albums/${albumId}/cover`,
        { method: 'POST', body: { cover_media_id: coverMediaId } }
      )
      // Update local state
      if (album.value?.id === albumId) {
        album.value.cover_media = res.cover_media
      }
      const idx = myAlbums.value.findIndex(a => a.id === albumId)
      if (idx !== -1) myAlbums.value[idx].cover_media = res.cover_media
      return true
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal mengatur cover.'
      return false
    }
  }

  const removeContributor = async (albumId: string, userId: string): Promise<boolean> => {
    try {
      await api(`/api/albums/${albumId}/contributors/${userId}`, { method: 'DELETE' })
      if (album.value) {
        album.value.contributors = album.value.contributors?.filter(c => c.id !== userId)
      }
      return true
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal menghapus kontributor.'
      return false
    }
  }

  return {
    albums, myAlbums, album,
    pagination, myPagination,
    loading, error,
    fetchAlbums, fetchMyAlbums, fetchAlbum,
    createAlbum, updateAlbum, deleteAlbum,
    setCover, inviteContributors, respondInvitation, removeContributor,
  }
}