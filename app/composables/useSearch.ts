// composables/useSearch.ts
import type { SearchResults } from '~/types/kenangan'
import { useApi } from '~/utils/api'

export const useSearch = () => {
  const { api } = useApi()

  const results = ref<SearchResults | null>(null)
  const loading = ref(false)
  const error   = ref<string | null>(null)

  const search = async (q: string, type?: 'memory' | 'album' | 'group' | 'user') => {
    if (q.trim().length < 2) return
    loading.value = true
    error.value = null
    try {
      results.value = await api<SearchResults>('/api/search', {
        query: { q, ...(type ? { type } : {}) },
      })
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal melakukan pencarian.'
    } finally {
      loading.value = false
    }
  }

  const clear = () => { results.value = null }

  return { results, loading, error, search, clear }
}