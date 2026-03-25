// composables/useLoginModal.ts
export const useLoginModal = () => {
  const isOpen = useState<boolean>('loginModal:isOpen', () => false)
  const redirectTo = useState<string>('loginModal:redirectTo', () => '/')
  const isPersistent = useState<boolean>('loginModal:isPersistent', () => false)

  const open = (redirect?: string, options?: { persistent?: boolean }) => {
    // Jika tidak ada redirect yang dioper, pakai halaman saat ini
    if (redirect) {
      redirectTo.value = redirect
    } else {
      // Ambil route saat ini via useRoute()
      const route = useRoute()
      redirectTo.value = route.fullPath
    }

    isPersistent.value = !!options?.persistent
    isOpen.value = true
  }

  const close = (force = false) => {
    if (isPersistent.value && !force) return
    isOpen.value = false
    isPersistent.value = false
  }

  return { isOpen, redirectTo, isPersistent, open, close }
}