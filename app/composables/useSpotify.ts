import type { SpotifyTrack } from "~/types/user"

export const useSpotify = () => {
  const config = useRuntimeConfig()
  const { token } = useAuth()

  const searchTracks = async (query: string): Promise<SpotifyTrack[]> => {
    if (!query || query.length < 2) {
      return []
    }

    try {
      const response = await $fetch<{ data: SpotifyTrack[] }>(
        `${config.public.apiBase}/api/spotify/search`,
        {
          method: 'GET',
          query: { q: query },
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        }
      )

      return response.data || []
    } catch (error) {
      console.error('[useSpotify] searchTracks error:', error)
      return []
    }
  }

  const getTrack = async (trackId: string): Promise<SpotifyTrack | null> => {
    try {
      const response = await $fetch<{ data: SpotifyTrack }>(
        `${config.public.apiBase}/api/spotify/track/${trackId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        }
      )

      return response.data || null
    } catch (error) {
      console.error('[useSpotify] getTrack error:', error)
      return null
    }
  }

  return {
    searchTracks,
    getTrack,
  }
}