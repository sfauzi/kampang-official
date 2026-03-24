// composables/useLoginModal.ts
export const useLoginModal = () => {
  const isOpen = useState<boolean>('loginModal:isOpen', () => false)
  const redirectTo = useState<string>('loginModal:redirectTo', () => '/')

  const open = (redirect?: string) => {
    // Jika tidak ada redirect yang dioper, pakai halaman saat ini
    if (redirect) {
      redirectTo.value = redirect
    } else {
      // Ambil route saat ini via useRoute()
      const route = useRoute()
      redirectTo.value = route.fullPath
    }
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
  }

  return { isOpen, redirectTo, open, close }
}