// utils/auth.ts

const TOKEN_KEY = 'auth_token'

export const tokenStorage = {
  get(): string | null {
    if (import.meta.client) {
      return localStorage.getItem(TOKEN_KEY)
    }
    return null
  },

  set(token: string): void {
    if (import.meta.client) {
      localStorage.setItem(TOKEN_KEY, token)
    }
  },

  remove(): void {
    if (import.meta.client) {
      localStorage.removeItem(TOKEN_KEY)
    }
  },
}

export const buildApiHeaders = (token: string): HeadersInit => ({
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/json',
  'Content-Type': 'application/json',
})