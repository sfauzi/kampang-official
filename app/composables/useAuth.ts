
import type { ProfileSong, SpotifyTrack, User } from '~/types/user'
import { tokenStorage, buildApiHeaders } from '~/utils/auth'

export const useAuth = () => {
  const config = useRuntimeConfig()
  const router = useRouter()

  // useState — shared & persist lintas navigasi, SSR-safe
  const user = useState<User | null>('auth:user', () => null)
  const token = useState<string | null>('auth:token', () => null)
  const isAuthenticated = useState<boolean>('auth:isAuthenticated', () => false)

  // Sync token dari localStorage → useState (panggil 1x saat app load via plugin)
  const init = () => {
    if (!import.meta.client) return
    const saved = tokenStorage.get()
    if (saved) {
      token.value = saved
      isAuthenticated.value = true
    }
  }

  const loginWithGoogle = () => {
    window.location.href = `${config.public.apiBase}/auth/google/redirect`
  }

  const fetchUser = async (): Promise<boolean> => {
    // Ambil token — prioritaskan useState, fallback ke localStorage
    const currentToken = token.value ?? tokenStorage.get()

    if (!currentToken) {
      console.warn('[useAuth] fetchUser: tidak ada token')
      return false
    }

    // Pastikan useState sinkron
    if (!token.value) {
      token.value = currentToken
      isAuthenticated.value = true
    }

    try {
      const data = await $fetch<User>(`${config.public.apiBase}/api/user`, {
        headers: buildApiHeaders(currentToken),
      })
      user.value = data
      isAuthenticated.value = true
      return true
    } catch (error) {
      console.error('[useAuth] fetchUser error:', error)
      return false
    }
  }

  const handleLoginSuccess = async (rawToken: string): Promise<boolean> => {
    tokenStorage.set(rawToken)
    token.value = rawToken
    isAuthenticated.value = true
    return await fetchUser()
  }

  const updateProfile = async (data: {
    name: string
    description?: string | null
    address?: string | null
    notes?: string | null
    avatar?: File | null | undefined  // undefined = skip, null = hapus, File = upload baru
  }): Promise<boolean> => {
    const currentToken = token.value ?? tokenStorage.get()
    if (!currentToken) return false

    try {
      const formData = new FormData()
      formData.append('name', data.name)

      if (data.description !== undefined) {
        formData.append('description', data.description || '')
      }
      if (data.address !== undefined) {
        formData.append('address', data.address || '')
      }
      if (data.notes !== undefined) {
        formData.append('notes', data.notes || '')
      }

      // ✅ Hanya proses avatar jika explicitly dikirim (bukan undefined)
      if (data.avatar !== undefined) {
        if (data.avatar instanceof File) {
          // Ada file baru → upload
          formData.append('avatar', data.avatar)
        } else if (data.avatar === null) {
          // null → hapus avatar
          formData.append('remove_avatar', '1')
        }
      }
      // undefined → tidak append apapun → backend tidak menyentuh avatar

      const response = await $fetch<User>(
        `${config.public.apiBase}/api/user/update`,
        {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      )

      user.value = response
      return true
    } catch (error) {
      console.error('[useAuth] updateProfile error:', error)
      return false
    }
  }

  const getProfileSong = async (): Promise<ProfileSong | null> => {
    const currentToken = token.value ?? tokenStorage.get()

    if (!currentToken) {
      return null
    }

    try {
     const response = await $fetch<ProfileSong>(
        `${config.public.apiBase}/api/user/profile-song`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      )

      return response || null
    } catch (error) {
      console.error('[useAuth] getProfileSong error:', error)
      return null
    }
  }

  const setProfileSong = async (track: SpotifyTrack): Promise<boolean> => {
    const currentToken = token.value ?? tokenStorage.get()

    if (!currentToken) {
      console.warn('[useAuth] setProfileSong: tidak ada token')
      return false
    }

    try {
      await $fetch(`${config.public.apiBase}/api/user/profile-song`, {
        method: 'POST',
        body: {
          song_id: track.id,
          song_title: track.title,
          song_artist: track.artist,
          song_image: track.image,
          song_preview_url: track.preview_url,
          spotify_url: track.spotify_url,
        },
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      })

      return true
    } catch (error) {
      console.error('[useAuth] setProfileSong error:', error)
      return false
    }
  }

  const deleteProfileSong = async (): Promise<boolean> => {
    const currentToken = token.value ?? tokenStorage.get()

    if (!currentToken) {
      console.warn('[useAuth] deleteProfileSong: tidak ada token')
      return false
    }

    try {
      await $fetch(`${config.public.apiBase}/api/user/profile-song`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      })

      return true
    } catch (error) {
      console.error('[useAuth] deleteProfileSong error:', error)
      return false
    }
  }

  const logout = () => {
    tokenStorage.remove()
    user.value = null
    token.value = null
    isAuthenticated.value = false
    router.push('/')
  }

  return {
    user,
    token,
    isAuthenticated,
    init,
    loginWithGoogle,
    handleLoginSuccess,
    fetchUser,
    logout,
    updateProfile,
    getProfileSong,
    setProfileSong,
    deleteProfileSong,
  }
}