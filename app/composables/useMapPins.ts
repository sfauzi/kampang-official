// composables/useMapPins.ts
import type { MapPin, IconType } from '~/types/kenangan'
import { useApi } from '~/utils/api'

export const useMapPins = () => {
  const { api } = useApi()

  const pins    = ref<MapPin[]>([])
  const pin     = ref<MapPin | null>(null)
  const loading = ref(false)
  const error   = ref<string | null>(null)

  const fetchPins = async (params: {
    lat_min: number
    lat_max: number
    lng_min: number
    lng_max: number
    group_id?: string
  }) => {
    loading.value = true
    error.value = null
    try {
      pins.value = await api<MapPin[]>('/api/map/pins', { query: params })
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memuat pin peta.'
    } finally {
      loading.value = false
    }
  }

  const fetchPin = async (id: string) => {
    try {
      pin.value = await api<MapPin>(`/api/map/pins/${id}`)
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal memuat detail pin.'
    }
  }

  const createPinFromMemory = async (
    memoryId: string,
    opts: { label?: string; icon_type?: IconType; color?: string } = {}
  ): Promise<MapPin | null> => {
    try {
      const res = await api<{ message: string; pin: MapPin }>(
        `/api/memories/${memoryId}/map-pin`,
        { method: 'POST', body: opts }
      )
      pins.value.push(res.pin)
      return res.pin
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal membuat pin.'
      return null
    }
  }

  const deletePin = async (id: string): Promise<boolean> => {
    try {
      await api(`/api/map/pins/${id}`, { method: 'DELETE' })
      pins.value = pins.value.filter(p => p.id !== id)
      return true
    } catch (e: any) {
      error.value = e?.data?.message ?? 'Gagal menghapus pin.'
      return false
    }
  }

  return { pins, pin, loading, error, fetchPins, fetchPin, createPinFromMemory, deletePin }
}