// composables/useConfirm.ts
export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

interface ConfirmState {
  open: boolean
  options: ConfirmOptions
  resolve: ((value: boolean) => void) | null
}

const state = ref<ConfirmState>({
  open: false,
  options: { message: '' },
  resolve: null,
})

export const useConfirm = () => {
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      state.value = {
        open: true,
        options,
        resolve,
      }
    })
  }

  const handleConfirm = () => {
    state.value.resolve?.(true)
    state.value.open = false
  }

  const handleCancel = () => {
    state.value.resolve?.(false)
    state.value.open = false
  }

  return { state, confirm, handleConfirm, handleCancel }
}