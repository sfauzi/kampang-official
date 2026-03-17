// types/user.ts

export interface User {
  id: string
  name: string
  email: string
  description: string | null
  address: string | null
  notes: string | null
  avatar: string | null
  created_at: string
  created_at_formatted: string
  avatar_url: string | null
}

export interface ProfileSong {
  id: string
  user_id: string
  song_id: string
  song_title: string
  song_artist: string
  song_image: string | null
  song_preview_url: string | null
  spotify_url: string | null
  created_at: string
  updated_at: string
}

export interface SpotifyTrack {
  id: string
  title: string
  artist: string
  image: string | null
  preview_url: string | null
  spotify_url: string | null
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}