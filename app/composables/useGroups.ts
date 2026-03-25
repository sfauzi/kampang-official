// composables/useGroups.ts
// Lokasi  : composables/useGroups.ts
// Fix & tambahan:
// - fetchGroup() → my_role/my_status tersedia di response (dari pivot)
// - inviteMembers() → undang user ke grup (private/closed)
// - approveMember() → approve/reject permintaan bergabung
// - fetchMembers() → include pending jika admin/owner

import type {
  Group,
  StoreGroupPayload,
  PaginatedResponse,
  Category,
} from '~/types/kenangan'
import { useApi } from '~/utils/api'

export const useGroups = () => {
  const { api } = useApi()

  const groups       = ref<Group[]>([])
  const myGroups     = ref<Group[]>([])
  const group        = ref<Group | null>(null)
  const members      = ref<any[]>([])
  const pagination   = ref<PaginatedResponse<Group>['meta'] | null>(null)
  const myPagination = ref<PaginatedResponse<Group>['meta'] | null>(null)
  const loading      = ref(false)
  const error        = ref<string | null>(null)

  // ─── List publik ─────────────────────────────────────────────────────────
  const fetchGroups = async (params: {
    category?: Category
    search?: string
    page?: number
    per_page?: number
  } = {}) => {
    loading.value = true
    error.value   = null
    try {
      const res = await api<PaginatedResponse<Group>>('/api/groups', { query: params })
      groups.value    = res.data
      pagination.value = res.meta
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memuat grup.'
    } finally {
      loading.value = false
    }
  }

  // ─── Grup milik/diikuti user login (dashboard) ────────────────────────────
  const fetchMyGroups = async (params: {
    category?: Category
    page?: number
    per_page?: number
  } = {}) => {
    loading.value = true
    error.value   = null
    try {
      const res = await api<PaginatedResponse<Group>>('/api/groups', {
        query: { ...params, joined: true },
      })
      myGroups.value    = res.data
      myPagination.value = res.meta
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memuat grupmu.'
    } finally {
      loading.value = false
    }
  }

  // ─── Detail ───────────────────────────────────────────────────────────────
  // my_role & my_status tersedia di response jika user login
  const fetchGroup = async (id: string) => {
    loading.value = true
    error.value   = null
    try {
      group.value = await api<Group>(`/api/groups/${id}`)
    } catch (e: any) {
      if (e?.status === 403)      error.value = 'Grup ini bersifat privat.'
      else if (e?.status === 404) error.value = 'Grup tidak ditemukan.'
      else                        error.value = e?.data?.message ?? 'Gagal memuat grup.'
    } finally {
      loading.value = false
    }
  }

  // ─── Create ───────────────────────────────────────────────────────────────
  const createGroup = async (
    payload: StoreGroupPayload & { add_member_ids?: string[] }
  ): Promise<Group | null> => {
    loading.value = true
    error.value   = null
    try {
      const formData = new FormData()
      formData.append('name',     payload.name)
      formData.append('category', payload.category)
      formData.append('privacy',  payload.privacy)
      if (payload.description)    formData.append('description',   payload.description)
      if (payload.cover_image)    formData.append('cover_image',   payload.cover_image)
      if (payload.location_name)  formData.append('location_name', payload.location_name)
      if (payload.latitude  != null) formData.append('latitude',  String(payload.latitude))
      if (payload.longitude != null) formData.append('longitude', String(payload.longitude))
      // Tambah anggota langsung saat create (untuk closed/private group)
      payload.add_member_ids?.forEach(uid => formData.append('add_member_ids[]', uid))

      const res = await api<{ message: string; group: Group }>('/api/groups', {
        method: 'POST',
        body: formData,
      })
      myGroups.value.unshift(res.group)
      return res.group
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal membuat grup.'
      return null
    } finally {
      loading.value = false
    }
  }

  // ─── Update ───────────────────────────────────────────────────────────────
  // Kirim JSON untuk data grup + add/remove_member_ids.
  // Cover image dikirim terpisah ke POST /api/groups/{id}/cover jika ada file baru.
  const updateGroup = async (
    id: string,
    payload: Partial<StoreGroupPayload> & {
      add_member_ids?: string[]
      remove_member_ids?: string[]
    }
  ): Promise<Group | null> => {
    loading.value = true
    error.value   = null
    try {
      // 1. Upload cover image dulu jika ada file baru
      if (payload.cover_image instanceof File) {
        const formData = new FormData()
        formData.append('cover_image', payload.cover_image)
        await api(`/api/groups/${id}/cover`, { method: 'POST', body: formData })
      }

      // 2. Update data + member management via JSON (PUT)
      const body: Record<string, any> = {}
      if (payload.name != null)          body.name          = payload.name
      if (payload.category)              body.category      = payload.category
      if (payload.privacy)               body.privacy       = payload.privacy
      if (payload.description != null)   body.description   = payload.description
      if (payload.location_name != null) body.location_name = payload.location_name
      if (payload.add_member_ids?.length)    body.add_member_ids    = payload.add_member_ids
      if (payload.remove_member_ids?.length) body.remove_member_ids = payload.remove_member_ids

      const res = await api<{ message: string; group: Group }>(`/api/groups/${id}`, {
        method: 'PUT',
        body,
      })

      if (group.value?.id === id) group.value = res.group
      const idx = myGroups.value.findIndex(g => g.id === id)
      if (idx !== -1) myGroups.value[idx] = res.group
      return res.group
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memperbarui grup.'
      return null
    } finally {
      loading.value = false
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  const deleteGroup = async (id: string): Promise<boolean> => {
    loading.value = true
    error.value   = null
    try {
      await api(`/api/groups/${id}`, { method: 'DELETE' })
      myGroups.value = myGroups.value.filter(g => g.id !== id)
      groups.value   = groups.value.filter(g => g.id !== id)
      return true
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal menghapus grup.'
      return false
    } finally {
      loading.value = false
    }
  }

  // ─── Join / Leave ─────────────────────────────────────────────────────────
  const joinGroup = async (id: string): Promise<string | null> => {
    try {
      const res = await api<{ message: string }>(`/api/groups/${id}/join`, { method: 'POST' })
      await fetchGroup(id)
      return res.message
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal bergabung.'
      return null
    }
  }

  const leaveGroup = async (id: string): Promise<boolean> => {
    try {
      await api(`/api/groups/${id}/leave`, { method: 'DELETE' })
      myGroups.value = myGroups.value.filter(g => g.id !== id)
      await fetchGroup(id)
      return true
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal keluar dari grup.'
      return false
    }
  }

  // ─── Invite (owner/admin → undang user ke private/closed group) ───────────
  const inviteMembers = async (groupId: string, userIds: string[]): Promise<boolean> => {
    try {
      await api(`/api/groups/${groupId}/invite`, {
        method: 'POST',
        body: { user_ids: userIds },
      })
      return true
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal mengundang anggota.'
      return false
    }
  }

  // ─── Approve/Reject member (owner/admin) ──────────────────────────────────
  const approveMember = async (
    groupId: string,
    userId: string,
    action: 'approve' | 'reject'
  ): Promise<boolean> => {
    try {
      await api(`/api/groups/${groupId}/members/${userId}/approve`, {
        method: 'PATCH',
        body: { action },
      })
      // Update lokal: hapus dari pending
      members.value = members.value.filter(m =>
        action === 'approve'
          ? true  // tetap ada tapi status berubah
          : m.id !== userId
      )
      if (action === 'approve') {
        const m = members.value.find(m => m.id === userId)
        if (m) m.pivot = { ...m.pivot, status: 'active' }
      }
      return true
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memproses permintaan.'
      return false
    }
  }

  // ─── Members ──────────────────────────────────────────────────────────────
  const fetchMembers = async (id: string, page = 1) => {
    try {
      const res = await api<PaginatedResponse<any>>(`/api/groups/${id}/members`, {
        query: { page, per_page: 50 },
      })
      members.value = res.data
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memuat anggota.'
    }
  }

  const updateMemberRole = async (
    groupId: string,
    userId: string,
    role: 'admin' | 'member',
    status?: 'active' | 'banned'
  ): Promise<boolean> => {
    try {
      await api(`/api/groups/${groupId}/members/${userId}/role`, {
        method: 'PATCH',
        body: { role, ...(status ? { status } : {}) },
      })
      const m = members.value.find(m => m.id === userId)
      if (m && m.pivot) m.pivot.role = role
      return true
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memperbarui role.'
      return false
    }
  }

  return {
    groups, myGroups, group, members,
    pagination, myPagination,
    loading, error,
    fetchGroups, fetchMyGroups, fetchGroup,
    createGroup, updateGroup, deleteGroup,
    joinGroup, leaveGroup,
    inviteMembers, approveMember,
    fetchMembers, updateMemberRole,
  }
}