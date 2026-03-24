<!-- components/LoginModal.vue -->
<script setup lang="ts">
const { isOpen, redirectTo, close } = useLoginModal()
const { loginWithGoogle } = useAuth()

const handleLogin = () => {
  // Kirim redirectTo saat ini ke loginWithGoogle
  loginWithGoogle(redirectTo.value)
  close()
}

onMounted(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close()
  }
  window.addEventListener('keydown', onKey)
  onUnmounted(() => window.removeEventListener('keydown', onKey))
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close" />

        <!-- Modal -->
        <Transition
          enter-active-class="transition-all duration-250 ease-out"
          enter-from-class="opacity-0 translate-y-4 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 translate-y-4 scale-95"
        >
          <div
            v-if="isOpen"
            class="relative w-full max-w-sm bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl shadow-xl p-6 font-[Manrope] z-10"
          >
            <!-- Close -->
            <button
              class="absolute cursor-pointer top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
              @click="close"
            >
              <Icon name="heroicons:x-mark" class="w-4 h-4" />
            </button>

            <!-- Brand -->
            <div class="flex flex-col items-center text-center mb-6">
              <div class="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center mb-4 shadow-sm">
                <Icon name="heroicons:camera" class="w-7 h-7 text-white" />
              </div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">Masuk ke Kenangan</h2>
              <p class="text-sm text-gray-400 mt-1.5 leading-relaxed">
                Simpan dan bagikan momen berharga<br />bersama orang-orang terdekatmu.
              </p>
            </div>

            <!-- Google login -->
            <button
              class="w-full flex cursor-pointer items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white dark:bg-[#101010] border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 text-sm font-semibold shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-neutral-600 transition-all duration-200"
              @click="handleLogin"
            >
              <Icon name="logos:google-icon" class="w-5 h-5 shrink-0" />
              Login dengan Google
            </button>

            <p class="text-center text-xs text-gray-400 mt-4 leading-relaxed">
              Dengan masuk, kamu menyetujui
              <NuxtLink to="/terms" class="text-amber-500 hover:underline" @click="close">Syarat & Ketentuan</NuxtLink>
              kami.
            </p>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>