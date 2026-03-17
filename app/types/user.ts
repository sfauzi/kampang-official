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

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}