// composables/useTags.ts
import type { Tag } from '~/types/kenangan'
import { useApi } from '~/utils/api'

export const useTags = () => {
  const { api } = useApi()

  const tags    = ref<Tag[]>([])
  const loading = ref(false)
  const error   = ref<string | null>(null)

  const fetchTags = async (params: { type?: 'category' | 'custom'; search?: string } = {}) => {
    loading.value = true
    try {
      tags.value = await api<Tag[]>('/api/tags', { query: params })
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memuat tags.'
    } finally {
      loading.value = false
    }
  }

  const createTag = async (name: string, color?: string): Promise<Tag | null> => {
    try {
      const res = await api<{ message: string; tag: Tag }>('/api/tags', {
        method: 'POST',
        body: { name, color },
      })
      tags.value.push(res.tag)
      return res.tag
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal membuat tag.'
      return null
    }
  }

  return { tags, loading, error, fetchTags, createTag }
}