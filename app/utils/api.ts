// utils/api.ts
// Lokasi  : utils/api.ts
// ─────────────────────────────────────────────────────────────────────────────
// Wrapper $fetch yang:
//  - Jika ada token → sertakan Authorization Bearer (dari tokenStorage)
//  - Jika tidak ada token → kirim tanpa Authorization (guest request)
//    Backend dengan sanctum.optional middleware akan tetap memproses request
//
// PENTING: Gunakan tokenStorage dari utils/auth.ts (sudah ada) sebagai
//          satu-satunya sumber kebenaran token. Tidak ada duplikasi.
//
// Kenapa tidak pakai useState langsung?
//  - utils/api.ts bisa dipanggil di luar composable (misal di plugin)
//  - tokenStorage.get() selalu aman karena punya guard import.meta.client
// ─────────────────────────────────────────────────────────────────────────────

import { tokenStorage, buildApiHeaders } from '~/utils/auth'

type FetchOptions = Parameters<typeof $fetch>[1]

export const useApi = () => {
  const config = useRuntimeConfig()
  const base   = config.public.apiBase as string

  /**
   * Bangun headers untuk request API.
   *
   * @param isFormData - true jika body adalah FormData
   *                     (Content-Type dibuang agar browser auto-set boundary)
   */
  const getHeaders = (isFormData = false): Record<string, string> => {
    const token = tokenStorage.get()

    if (token) {
      // Ada token → pakai buildApiHeaders dari utils/auth.ts (konsisten)
      const headers = buildApiHeaders(token) as Record<string, string>

      if (isFormData) {
        // Hapus Content-Type — browser yang set boundary untuk multipart
        const { 'Content-Type': _ct, ...rest } = headers
        return rest
      }
      return headers
    }

    // Tidak ada token → request tanpa Authorization (guest / public endpoint)
    // Backend dengan sanctum.optional akan proses sebagai guest
    return { Accept: 'application/json' }
  }

  /**
   * Fungsi utama untuk call API.
   *
   * @example
   *   // Publik (tanpa login)
   *   api<Memory[]>('/api/memories')
   *
   *   // Butuh login (token otomatis disertakan jika ada di localStorage)
   *   api<Group>('/api/groups', { method: 'POST', body: formData })
   */
  const api = <T = unknown>(
    path: string,
    opts: FetchOptions = {}
  ): ReturnType<typeof $fetch<T>> => {
    const isFormData = opts?.body instanceof FormData

    return $fetch<T>(`${base}${path}`, {
      ...opts,
      headers: {
        ...getHeaders(isFormData),
        // Opts.headers bisa override header tertentu jika diperlukan
        ...(opts?.headers as Record<string, string> ?? {}),
      },
    })
  }

  return { api, base }
}